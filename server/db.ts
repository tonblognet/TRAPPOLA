import { Pool, type PoolClient } from 'pg'
import type { AppConfig, Database } from './types.js'

export const createDatabase = (config: AppConfig): Database => new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: config.databaseSsl ? { rejectUnauthorized: true } : undefined,
})

export const withTransaction = async <T>(db: Database, task: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await task(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

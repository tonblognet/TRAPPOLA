import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Database } from './types.js'

export const runMigrations = async (db: Database, directory = path.resolve('server/migrations')) => {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort()
  const applied = await db.query<{ name: string }>('SELECT name FROM schema_migrations')
  const known = new Set(applied.rows.map((row) => row.name))

  for (const file of files) {
    if (known.has(file)) continue
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query(await readFile(path.join(directory, file), 'utf8'))
      await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [file])
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

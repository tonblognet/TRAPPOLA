import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'

export type DatabaseClient = Pick<PoolClient, 'query'>

export type Database = Pick<Pool, 'query' | 'connect' | 'end'>

export const query = <T extends QueryResultRow>(db: DatabaseClient | Database, text: string, values: unknown[] = []) =>
  db.query<T>(text, values) as Promise<QueryResult<T>>

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production'
  port: number
  databaseUrl: string
  databaseSsl: boolean
  appOrigins: string[]
  secureCookies: boolean
  uploadDir: string
  frontendDist: string
  sessionHours: number
  maxUploadBytes: number
}

export type AdminIdentity = {
  id: string
  email: string
  displayName: string
  csrfToken: string
}

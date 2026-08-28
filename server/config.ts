import path from 'node:path'
import { z } from 'zod'
import type { AppConfig } from './types.js'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1).default('postgres://trappola:trappola@127.0.0.1:5432/trappola'),
  DATABASE_SSL: z.enum(['true', 'false']).default('false'),
  APP_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  SECURE_COOKIES: z.enum(['true', 'false']).optional(),
  UPLOAD_DIR: z.string().default('uploads'),
  FRONTEND_DIST: z.string().default('dist'),
  SESSION_HOURS: z.coerce.number().int().min(1).max(168).default(12),
  MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(25).default(8),
})

export const loadConfig = (source: NodeJS.ProcessEnv = process.env): AppConfig => {
  const env = envSchema.parse(source)
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    databaseSsl: env.DATABASE_SSL === 'true',
    appOrigins: env.APP_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
    secureCookies: env.SECURE_COOKIES ? env.SECURE_COOKIES === 'true' : env.NODE_ENV === 'production',
    uploadDir: path.resolve(env.UPLOAD_DIR),
    frontendDist: path.resolve(env.FRONTEND_DIST),
    sessionHours: env.SESSION_HOURS,
    maxUploadBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
  }
}

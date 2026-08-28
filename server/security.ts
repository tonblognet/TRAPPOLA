import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import type { AppConfig, Database } from './types.js'
import type { AdminIdentity } from './types.js'

export const SESSION_COOKIE = 'trappola_admin'
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
export const createOpaqueToken = (bytes = 32) => randomBytes(bytes).toString('base64url')

const parseCookies = (header = '') => Object.fromEntries(header.split(';').flatMap((part) => {
  const separator = part.indexOf('=')
  if (separator < 1) return []
  return [[part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())]]
}))

export const readSessionToken = (req: Request) => parseCookies(req.headers.cookie)[SESSION_COOKIE]
export const readAdminIdentity = (req: Request) => (req as Request & { admin?: AdminIdentity }).admin

export const createSession = async (db: Database, adminId: string, config: AppConfig) => {
  const token = createOpaqueToken()
  const csrfToken = createOpaqueToken(24)
  const expiresAt = new Date(Date.now() + config.sessionHours * 60 * 60 * 1000)
  await db.query(
    'INSERT INTO admin_sessions(id, admin_id, token_hash, csrf_token, expires_at) VALUES ($1, $2, $3, $4, $5)',
    [randomUUID(), adminId, hashToken(token), csrfToken, expiresAt],
  )
  return { token, csrfToken, expiresAt }
}

export const sessionCookieOptions = (config: AppConfig) => ({
  httpOnly: true,
  secure: config.secureCookies,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: config.sessionHours * 60 * 60 * 1000,
})

export const clearSessionCookieOptions = (config: AppConfig) => ({
  httpOnly: true,
  secure: config.secureCookies,
  sameSite: 'strict' as const,
  path: '/',
})

export const authenticate = (db: Database) => async (req: Request, res: Response, next: NextFunction) => {
  const token = readSessionToken(req)
  if (!token) return res.status(401).json({ error: 'Требуется вход в админку' })
  const result = await db.query<{
    id: string; email: string; display_name: string; csrf_token: string
  }>(`SELECT a.id, a.email, a.display_name, s.csrf_token
      FROM admin_sessions s JOIN admins a ON a.id = s.admin_id
      WHERE s.token_hash = $1 AND s.expires_at > NOW() AND a.active = TRUE`, [hashToken(token)])
  const row = result.rows[0]
  if (!row) return res.status(401).json({ error: 'Сессия истекла, войдите снова' })
  ;(req as Request & { admin?: AdminIdentity }).admin = { id: row.id, email: row.email, displayName: row.display_name, csrfToken: row.csrf_token }
  void db.query('UPDATE admin_sessions SET last_seen_at = NOW() WHERE token_hash = $1', [hashToken(token)])
  next()
}

export const requireCsrf = (req: Request, res: Response, next: NextFunction) => {
  const supplied = req.header('x-csrf-token') ?? ''
  const expected = readAdminIdentity(req)?.csrfToken ?? ''
  if (!supplied || supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return res.status(403).json({ error: 'Проверка безопасности не пройдена. Обновите страницу.' })
  }
  next()
}

export const requireAllowedOrigin = (config: AppConfig) => (req: Request, res: Response, next: NextFunction) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.header('origin')
  if (!origin || !config.appOrigins.includes(origin)) return res.status(403).json({ error: 'Недопустимый источник запроса' })
  next()
}

import { existsSync } from 'node:fs'
import path from 'node:path'
import express, { type ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import multer from 'multer'
import { createAdminRouter } from './routes/admin.js'
import { createPublicRouter } from './routes/public.js'
import { requireAllowedOrigin } from './security.js'
import type { AppConfig, Database } from './types.js'

export const createApp = (db: Database, config: AppConfig) => {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(helmet({
    contentSecurityPolicy: config.nodeEnv === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://mc.yandex.ru'],
        frameAncestors: ["'none'"],
      },
    } : false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  }))
  app.use(express.json({ limit: '256kb' }))
  app.use(requireAllowedOrigin(config))
  app.get('/api/health', async (_req, res) => {
    await db.query('SELECT 1')
    res.json({ status: 'ok', service: 'trappola-api' })
  })
  app.use('/api', createPublicRouter(db))
  app.use('/api/admin', createAdminRouter(db, config))
  app.use('/uploads', express.static(config.uploadDir, { fallthrough: false, immutable: true, maxAge: '7d' }))

  app.use('/api', (_req, res) => res.status(404).json({ error: 'API-метод не найден' }))
  if (existsSync(config.frontendDist)) {
    app.use(express.static(config.frontendDist, { index: false }))
    app.use((req, res, next) => {
      if (req.method !== 'GET' || path.extname(req.path)) return next()
      res.sendFile(path.join(config.frontendDist, 'index.html'))
    })
  }

  app.use((_req, res) => res.status(404).json({ error: 'Страница не найдена' }))
  const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    void next
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE' ? 'Изображение превышает допустимый размер' : 'Не удалось загрузить файл'
      return res.status(400).json({ error: message })
    }
    const known = error as { status?: number; code?: string; message?: string }
    if (known.code === '23505') return res.status(409).json({ error: 'Slug, артикул или вариант уже используется' })
    const status = known.status && known.status >= 400 && known.status < 500 ? known.status : 500
    if (status === 500) console.error(error)
    res.status(status).json({ error: status === 500 ? 'Внутренняя ошибка сервера' : known.message })
  }
  app.use(errorHandler)
  return app
}

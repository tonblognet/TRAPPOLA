import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { readFile, rename, unlink } from 'node:fs/promises'
import path from 'node:path'
import { Router } from 'express'
import { compare } from 'bcryptjs'
import { rateLimit } from 'express-rate-limit'
import multer from 'multer'
import { createProduct, listProducts, updateProduct } from '../catalog.js'
import { listOrders } from '../orders.js'
import { imageMetaSchema, loginSchema, orderStatusSchema, productSchema, settingsSchema } from '../schemas.js'
import { authenticate, clearSessionCookieOptions, createSession, hashToken, readAdminIdentity, readSessionToken, requireCsrf, SESSION_COOKIE, sessionCookieOptions } from '../security.js'
import type { AppConfig, Database } from '../types.js'

const sniffImage = async (filePath: string) => {
  const buffer = await readFile(filePath)
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png'
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'webp'
  return null
}

export const createAdminRouter = (db: Database, config: AppConfig) => {
  const router = Router()
  const requireAdmin = authenticate(db)
  const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Слишком много попыток входа. Повторите позже.' },
  })
  const tempDir = path.join(config.uploadDir, '.incoming')
  mkdirSync(tempDir, { recursive: true })
  const upload = multer({
    dest: tempDir,
    limits: { fileSize: config.maxUploadBytes, files: 1 },
  })

  router.post('/session', loginLimit, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Проверьте email и пароль' })
    const result = await db.query<{ id: string; email: string; password_hash: string; display_name: string }>(
      'SELECT id, email, password_hash, display_name FROM admins WHERE LOWER(email)=LOWER($1) AND active=TRUE',
      [parsed.data.email],
    )
    const admin = result.rows[0]
    if (!admin || !(await compare(parsed.data.password, admin.password_hash))) {
      return res.status(401).json({ error: 'Неверный email или пароль' })
    }
    const session = await createSession(db, admin.id, config)
    res.cookie(SESSION_COOKIE, session.token, sessionCookieOptions(config))
    res.json({ admin: { id: admin.id, email: admin.email, displayName: admin.display_name }, csrfToken: session.csrfToken })
  })

  router.get('/session', requireAdmin, (req, res) => {
    const admin = readAdminIdentity(req)
    res.json({
      admin: { id: admin?.id, email: admin?.email, displayName: admin?.displayName },
      csrfToken: admin?.csrfToken,
    })
  })

  router.delete('/session', requireAdmin, requireCsrf, async (req, res) => {
    const token = readSessionToken(req)
    if (token) await db.query('DELETE FROM admin_sessions WHERE token_hash=$1', [hashToken(token)])
    res.clearCookie(SESSION_COOKIE, clearSessionCookieOptions(config))
    res.status(204).end()
  })

  router.use(requireAdmin)
  router.get('/products', async (_req, res) => res.json({ products: await listProducts(db, true) }))
  router.post('/products', requireCsrf, async (req, res) => {
    const parsed = productSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Проверьте поля товара', details: parsed.error.flatten() })
    const id = await createProduct(db, parsed.data)
    res.status(201).json({ id, products: await listProducts(db, true) })
  })
  router.put('/products/:id', requireCsrf, async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Некорректный идентификатор' })
    const parsed = productSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Проверьте поля товара', details: parsed.error.flatten() })
    if (!(await updateProduct(db, id, parsed.data))) return res.status(404).json({ error: 'Товар не найден' })
    res.json({ products: await listProducts(db, true) })
  })
  router.delete('/products/:id', requireCsrf, async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Некорректный идентификатор' })
    const images = await db.query<{ url: string }>('SELECT url FROM product_images WHERE product_id=$1', [id])
    const result = await db.query('DELETE FROM products WHERE id=$1', [id])
    if (result.rowCount === 0) return res.status(404).json({ error: 'Товар не найден' })
    await Promise.all(images.rows.map((image) => unlink(path.join(config.uploadDir, path.basename(image.url))).catch(() => undefined)))
    res.status(204).end()
  })

  router.post('/products/:id/images', requireCsrf, upload.single('image'), async (req, res) => {
    const productId = Number(req.params.id)
    if (!Number.isSafeInteger(productId) || productId < 1 || !req.file) return res.status(400).json({ error: 'Выберите изображение' })
    const metadata = imageMetaSchema.safeParse(req.body)
    if (!metadata.success) {
      await unlink(req.file.path).catch(() => undefined)
      return res.status(400).json({ error: 'Проверьте описание изображения' })
    }
    const product = await db.query('SELECT id FROM products WHERE id=$1', [productId])
    if (product.rowCount === 0) {
      await unlink(req.file.path).catch(() => undefined)
      return res.status(404).json({ error: 'Товар не найден' })
    }
    const extension = await sniffImage(req.file.path)
    if (!extension) {
      await unlink(req.file.path).catch(() => undefined)
      return res.status(415).json({ error: 'Разрешены только PNG, JPEG и WebP' })
    }
    const filename = `${randomUUID()}.${extension}`
    const finalPath = path.join(config.uploadDir, filename)
    await rename(req.file.path, finalPath)
    if (metadata.data.kind === 'primary' || metadata.data.kind === 'hover') {
      await db.query('UPDATE product_images SET kind=\'gallery\' WHERE product_id=$1 AND kind=$2', [productId, metadata.data.kind])
    }
    let result
    try {
      result = await db.query<{ id: string | number }>(`INSERT INTO product_images(product_id,url,alt_text,kind,sort_order)
        VALUES ($1,$2,$3,$4,$5) RETURNING id`, [productId, `/uploads/${filename}`, metadata.data.altText, metadata.data.kind, metadata.data.sortOrder])
    } catch (error) {
      await unlink(finalPath).catch(() => undefined)
      throw error
    }
    res.status(201).json({ id: Number(result.rows[0].id), products: await listProducts(db, true) })
  })

  router.delete('/images/:id', requireCsrf, async (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Некорректный идентификатор' })
    const result = await db.query<{ url: string }>('DELETE FROM product_images WHERE id=$1 RETURNING url', [id])
    const image = result.rows[0]
    if (!image) return res.status(404).json({ error: 'Изображение не найдено' })
    const filename = path.basename(image.url)
    await unlink(path.join(config.uploadDir, filename)).catch(() => undefined)
    res.status(204).end()
  })

  router.get('/orders', async (_req, res) => res.json({ orders: await listOrders(db) }))
  router.patch('/orders/:id', requireCsrf, async (req, res) => {
    const parsed = orderStatusSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Некорректный статус' })
    const result = await db.query('UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2', [parsed.data.status, req.params.id])
    if (result.rowCount === 0) return res.status(404).json({ error: 'Заказ не найден' })
    res.json({ orders: await listOrders(db) })
  })

  router.get('/settings', async (_req, res) => {
    const result = await db.query<{ key: string; value: unknown }>('SELECT key,value FROM site_settings ORDER BY key')
    res.json({ settings: Object.fromEntries(result.rows.map((row) => [row.key, row.value])) })
  })
  router.put('/settings', requireCsrf, async (req, res) => {
    const parsed = settingsSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Некорректные настройки' })
    for (const [key, value] of Object.entries(parsed.data)) {
      await db.query(`INSERT INTO site_settings(key,value,updated_at) VALUES ($1,$2,NOW())
        ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`, [key, JSON.stringify(value)])
    }
    res.status(204).end()
  })

  return router
}

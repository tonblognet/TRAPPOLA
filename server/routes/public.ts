import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { listProducts } from '../catalog.js'
import { createOrder } from '../orders.js'
import { orderSchema } from '../schemas.js'
import type { Database } from '../types.js'

export const createPublicRouter = (db: Database) => {
  const router = Router()
  const orderLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Слишком много попыток. Попробуйте через несколько минут.' },
  })

  router.get('/products', async (_req, res) => res.json({ products: await listProducts(db, false) }))
  router.get('/products/:slug', async (req, res) => {
    const products = await listProducts(db, false)
    const product = products.find((item) => item.slug === req.params.slug)
    if (!product) return res.status(404).json({ error: 'Товар не найден' })
    res.json({ product })
  })
  router.post('/orders', orderLimit, async (req, res) => {
    const parsed = orderSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Проверьте данные заказа', details: parsed.error.flatten() })
    const order = await createOrder(db, parsed.data)
    res.status(201).json({ order })
  })
  return router
}

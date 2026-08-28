import { randomBytes, randomUUID } from 'node:crypto'
import type { z } from 'zod'
import type { orderSchema } from './schemas.js'
import type { Database } from './types.js'
import { withTransaction } from './db.js'

type OrderInput = z.infer<typeof orderSchema>

const makeOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  return `TRP-${date}-${randomBytes(3).toString('hex').toUpperCase()}`
}

export const createOrder = (db: Database, input: OrderInput) => withTransaction(db, async (client) => {
  const grouped = new Map<string, OrderInput['items'][number]>()
  for (const item of input.items) {
    const key = `${item.productId}\u0000${item.size}\u0000${item.color}`
    const current = grouped.get(key)
    grouped.set(key, current ? { ...current, quantity: current.quantity + item.quantity } : item)
  }
  const items = [...grouped.values()]
  if (items.some((item) => item.quantity > 10)) throw Object.assign(new Error('Слишком большое количество одной позиции'), { status: 400 })
  const values = items.flatMap((item) => [item.productId, item.size, item.color])
  const conditions = items.map((_, index) => {
    const start = index * 3
    return `(v.product_id=$${start + 1} AND v.size=$${start + 2} AND v.color=$${start + 3})`
  }).join(' OR ')
  const result = await client.query<{
    variant_id: string | number; product_id: string | number; variant_sku: string; size: string; color: string;
    stock: number; product_name: string; price: number; status: string
  }>(`SELECT v.id AS variant_id, v.product_id, v.sku AS variant_sku, v.size, v.color, v.stock,
      p.name AS product_name, p.price, p.status
      FROM product_variants v JOIN products p ON p.id=v.product_id
      WHERE (${conditions}) AND v.active=TRUE FOR UPDATE`, values)

  const byKey = new Map(result.rows.map((row) => [`${Number(row.product_id)}\u0000${row.size}\u0000${row.color}`, row]))
  const resolved = items.map((item) => ({ input: item, row: byKey.get(`${item.productId}\u0000${item.size}\u0000${item.color}`) }))
  if (resolved.some(({ row }) => !row || row.status !== 'active')) {
    throw Object.assign(new Error('Одна из позиций больше недоступна'), { status: 409 })
  }
  if (resolved.some(({ input: item, row }) => row && row.stock < item.quantity)) {
    throw Object.assign(new Error('Недостаточно товара в наличии'), { status: 409 })
  }

  const total = resolved.reduce((sum, { input: item, row }) => sum + (row?.price ?? 0) * item.quantity, 0)
  const id = randomUUID()
  const number = makeOrderNumber()
  const acceptedAt = new Date()
  await client.query(`INSERT INTO orders
    (id, number, customer_name, customer_phone, customer_email, city, address, comment, total, consent_version, accepted_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [id, number, input.customer.name, input.customer.phone,
    input.customer.email, input.customer.city, input.customer.address, input.customer.comment, total, input.consentVersion, acceptedAt])

  for (const { input: item, row } of resolved) {
    if (!row) continue
    await client.query('UPDATE product_variants SET stock=stock-CAST($1 AS INTEGER), updated_at=NOW() WHERE id=$2', [item.quantity, row.variant_id])
    await client.query(`INSERT INTO order_items
      (order_id, product_id, variant_id, sku, product_name, size, color, quantity, unit_price, line_total)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [id, row.product_id, row.variant_id, row.variant_sku,
      row.product_name, row.size, row.color, item.quantity, row.price, row.price * item.quantity])
  }
  return { id, number, status: 'new' as const, paymentStatus: 'not_started' as const, total, createdAt: new Date().toISOString() }
})

export const listOrders = async (db: Database) => {
  const [orders, items] = await Promise.all([
    db.query(`SELECT id, number, status, payment_status, customer_name, customer_phone, customer_email,
      city, address, comment, total, created_at, updated_at FROM orders ORDER BY created_at DESC LIMIT 500`),
    db.query(`SELECT id, order_id, product_id, variant_id, sku, product_name, size, color, quantity,
      unit_price, line_total FROM order_items ORDER BY id`),
  ])
  const itemsByOrder = new Map<string, unknown[]>()
  for (const item of items.rows) {
    const orderId = String(item.order_id)
    itemsByOrder.set(orderId, [...(itemsByOrder.get(orderId) ?? []), item])
  }
  return orders.rows.map((order) => ({
    id: String(order.id),
    number: String(order.number),
    status: order.status,
    paymentStatus: order.payment_status,
    customer: {
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
      city: order.city,
      address: order.address,
      comment: order.comment,
    },
    total: Number(order.total),
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: (itemsByOrder.get(String(order.id)) ?? []).map((item) => {
      const row = item as Record<string, unknown>
      return {
        id: Number(row.id), sku: row.sku, productName: row.product_name, size: row.size, color: row.color,
        quantity: Number(row.quantity), unitPrice: Number(row.unit_price), lineTotal: Number(row.line_total),
      }
    }),
  }))
}

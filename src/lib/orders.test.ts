import { describe, expect, it } from 'vitest'
import { createOrder } from './orders'

describe('orders', () => {
  it('creates a deterministic local order record', () => {
    const order = createOrder(
      { name: 'Анна', phone: '+7', email: 'a@example.com', city: 'Москва', address: 'Пункт выдачи', comment: '' },
      [{ productId: 1, size: 'M–L', color: 'Чёрный', quantity: 1 }],
      6900,
      new Date('2026-08-21T10:20:30.123Z'),
    )
    expect(order.id).toBe('TR-20260821-102030123')
    expect(order.status).toBe('new')
    expect(order.total).toBe(6900)
  })
})

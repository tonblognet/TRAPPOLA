import type { CartLine, OrderCustomer, OrderRecord } from '../types'
import { readVersioned, writeVersioned, type StorageLike } from './storage'

export const ORDERS_STORAGE_KEY = 'trappola:orders'
export const ORDERS_STORAGE_VERSION = 1

export const isOrderList = (value: unknown): value is OrderRecord[] => Array.isArray(value)

export const loadOrders = (storage: StorageLike | undefined) => readVersioned(
  storage,
  ORDERS_STORAGE_KEY,
  ORDERS_STORAGE_VERSION,
  [],
  isOrderList,
)

export const createOrder = (customer: OrderCustomer, items: CartLine[], total: number, now = new Date()): OrderRecord => ({
  id: (() => {
    const stamp = now.toISOString().replace(/\D/g, '').slice(0, 17)
    return `TR-${stamp.slice(0, 8)}-${stamp.slice(8)}`
  })(),
  createdAt: now.toISOString(),
  status: 'new',
  customer,
  items,
  total,
})

export const saveOrder = (storage: StorageLike | undefined, order: OrderRecord) => {
  const orders = loadOrders(storage)
  writeVersioned(storage, ORDERS_STORAGE_KEY, ORDERS_STORAGE_VERSION, [order, ...orders])
  return [order, ...orders]
}

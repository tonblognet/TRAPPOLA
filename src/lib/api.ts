import type { CartLine, OrderCustomer, OrderRecord, Product } from '../types'
import { apiBaseUrl } from './runtime'

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly details?: unknown) {
    super(message)
  }
}

export const apiRequest = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData)) headers.set('content-type', 'application/json')
  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers, credentials: 'include' })
  const body = response.status === 204 ? undefined : await response.json().catch(() => undefined)
  if (!response.ok) {
    const data = body as { error?: string; details?: unknown } | undefined
    throw new ApiError(data?.error ?? 'Сервер временно недоступен', response.status, data?.details)
  }
  return body as T
}

export const fetchPublicProducts = async () => {
  const response = await apiRequest<{ products: Product[] }>('/api/products')
  return response.products
}

export const submitPublicOrder = async (customer: OrderCustomer, items: CartLine[]): Promise<OrderRecord> => {
  const response = await apiRequest<{ order: Pick<OrderRecord, 'id' | 'number' | 'status' | 'paymentStatus' | 'total' | 'createdAt'> }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ customer, items, consentVersion: '2026-08-26' }),
  })
  return { ...response.order, customer, items }
}

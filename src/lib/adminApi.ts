import type { AdminOrder, OrderStatus, Product } from '../types'
import { apiRequest } from './api'

export type AdminSession = {
  admin: { id: string; email: string; displayName: string }
  csrfToken: string
}

let csrfToken = ''
const secure = (init: RequestInit = {}): RequestInit => ({
  ...init,
  headers: { ...Object.fromEntries(new Headers(init.headers)), 'x-csrf-token': csrfToken },
})

export const restoreAdminSession = async () => {
  const session = await apiRequest<AdminSession>('/api/admin/session')
  csrfToken = session.csrfToken
  return session
}

export const loginAdmin = async (email: string, password: string) => {
  const session = await apiRequest<AdminSession>('/api/admin/session', { method: 'POST', body: JSON.stringify({ email, password }) })
  csrfToken = session.csrfToken
  return session
}

export const logoutAdmin = async () => {
  await apiRequest('/api/admin/session', secure({ method: 'DELETE' }))
  csrfToken = ''
}

export const fetchAdminProducts = async () => (await apiRequest<{ products: Product[] }>('/api/admin/products')).products
export const createAdminProduct = async (product: Product) =>
  (await apiRequest<{ products: Product[] }>('/api/admin/products', secure({ method: 'POST', body: JSON.stringify(product) }))).products
export const updateAdminProduct = async (product: Product) =>
  (await apiRequest<{ products: Product[] }>(`/api/admin/products/${product.id}`, secure({ method: 'PUT', body: JSON.stringify(product) }))).products
export const deleteAdminProduct = (id: number) => apiRequest(`/api/admin/products/${id}`, secure({ method: 'DELETE' }))

export const uploadAdminImage = async (productId: number, file: File, kind: 'primary' | 'hover' | 'gallery', altText: string) => {
  const body = new FormData()
  body.set('image', file)
  body.set('kind', kind)
  body.set('altText', altText)
  return (await apiRequest<{ products: Product[] }>(`/api/admin/products/${productId}/images`, secure({ method: 'POST', body }))).products
}
export const deleteAdminImage = (id: number) => apiRequest(`/api/admin/images/${id}`, secure({ method: 'DELETE' }))

export const fetchAdminOrders = async () => (await apiRequest<{ orders: AdminOrder[] }>('/api/admin/orders')).orders
export const updateAdminOrderStatus = async (id: string, status: OrderStatus) =>
  (await apiRequest<{ orders: AdminOrder[] }>(`/api/admin/orders/${id}`, secure({ method: 'PATCH', body: JSON.stringify({ status }) }))).orders

export const fetchAdminSettings = async () => (await apiRequest<{ settings: Record<string, unknown> }>('/api/admin/settings')).settings
export const saveAdminSettings = (settings: Record<string, unknown>) => apiRequest('/api/admin/settings', secure({ method: 'PUT', body: JSON.stringify(settings) }))

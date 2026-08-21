import type { CartLine, Product, ResolvedCartLine } from '../types'

export const CART_STORAGE_KEY = 'trappola:cart'
export const CART_STORAGE_VERSION = 1

export const isCart = (value: unknown): value is CartLine[] => Array.isArray(value) && value.every((line) => {
  if (!line || typeof line !== 'object') return false
  const item = line as Partial<CartLine>
  return typeof item.productId === 'number'
    && typeof item.size === 'string'
    && typeof item.color === 'string'
    && typeof item.quantity === 'number'
    && Number.isInteger(item.quantity)
    && item.quantity > 0
})

export const addCartItem = (cart: CartLine[], next: Omit<CartLine, 'quantity'>): CartLine[] => {
  const index = cart.findIndex((line) => line.productId === next.productId && line.size === next.size && line.color === next.color)
  if (index < 0) return [...cart, { ...next, quantity: 1 }]
  return cart.map((line, itemIndex) => itemIndex === index ? { ...line, quantity: line.quantity + 1 } : line)
}

export const changeCartQuantity = (cart: CartLine[], index: number, delta: number) => cart
  .map((line, itemIndex) => itemIndex === index ? { ...line, quantity: line.quantity + delta } : line)
  .filter((line) => line.quantity > 0)

export const resolveCart = (cart: CartLine[], products: Product[]): ResolvedCartLine[] => {
  const productMap = new Map(products.map((product) => [product.id, product]))
  return cart.flatMap((line) => {
    const product = productMap.get(line.productId)
    return product ? [{ ...line, product }] : []
  })
}

export const cartTotal = (cart: ResolvedCartLine[]) => cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
export const cartCount = (cart: CartLine[]) => cart.reduce((sum, line) => sum + line.quantity, 0)

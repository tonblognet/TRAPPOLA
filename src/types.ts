export type ProductStatus = 'active' | 'hidden' | 'coming-soon'

export type ProductVariant = {
  id?: number
  sku: string
  size: string
  color: string
  stock: number
  active: boolean
}

export type ProductImage = {
  id: number
  url: string
  altText: string
  kind: 'primary' | 'hover' | 'gallery'
  sortOrder: number
}

export type Product = {
  id: number
  slug: string
  sku: string
  name: string
  collection: string
  description: string
  price: number
  colors: string[]
  sizes: string[]
  stock: number
  status: ProductStatus
  featured: boolean
  composition: string
  fit: string
  sprite: 'tl' | 'tr' | 'bl' | 'br'
  sortOrder?: number
  variants?: ProductVariant[]
  media?: ProductImage[]
  images?: {
    primary: string
    hover?: string
    alt: string
  }
}

export type CartLine = {
  productId: number
  size: string
  color: string
  quantity: number
}

export type ResolvedCartLine = CartLine & {
  product: Product
}

export type OrderCustomer = {
  name: string
  phone: string
  email: string
  city: string
  address: string
  comment: string
}

export type OrderRecord = {
  id: string
  number?: string
  createdAt: string
  status: OrderStatus
  paymentStatus?: 'not_started' | 'pending' | 'paid' | 'failed' | 'refunded'
  customer: OrderCustomer
  items: CartLine[]
  total: number
}

export type OrderStatus = 'new' | 'confirmed' | 'paid' | 'assembling' | 'shipped' | 'completed' | 'cancelled'

export type AdminOrderItem = {
  id: number
  sku: string
  productName: string
  size: string
  color: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type AdminOrder = {
  id: string
  number: string
  status: OrderStatus
  paymentStatus: NonNullable<OrderRecord['paymentStatus']>
  customer: OrderCustomer
  total: number
  createdAt: string
  updatedAt: string
  items: AdminOrderItem[]
}

export type Route =
  | { name: 'home' }
  | { name: 'catalog' }
  | { name: 'about' }
  | { name: 'delivery' }
  | { name: 'returns' }
  | { name: 'contacts' }
  | { name: 'privacy' }
  | { name: 'offer' }
  | { name: 'checkout' }
  | { name: 'studio' }
  | { name: 'admin' }
  | { name: 'product'; slug: string }
  | { name: 'not-found' }

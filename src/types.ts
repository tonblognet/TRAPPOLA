export type ProductStatus = 'active' | 'hidden' | 'coming-soon'

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
  createdAt: string
  status: 'new'
  customer: OrderCustomer
  items: CartLine[]
  total: number
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
  | { name: 'product'; slug: string }
  | { name: 'not-found' }

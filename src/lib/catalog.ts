import { seedProducts } from '../content/catalog'
import type { Product } from '../types'
import { readVersioned, writeVersioned, type StorageLike } from './storage'

export const CATALOG_STORAGE_KEY = 'trappola:catalog'
export const CATALOG_STORAGE_VERSION = 1

const productStatuses = new Set(['active', 'hidden', 'coming-soon'])
const spritePositions = new Set(['tl', 'tr', 'bl', 'br'])

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string')

export const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== 'object') return false
  const product = value as Partial<Product>
  return typeof product.id === 'number'
    && typeof product.slug === 'string'
    && typeof product.sku === 'string'
    && typeof product.name === 'string'
    && typeof product.collection === 'string'
    && typeof product.description === 'string'
    && typeof product.price === 'number'
    && isStringArray(product.colors)
    && isStringArray(product.sizes)
    && typeof product.stock === 'number'
    && typeof product.status === 'string'
    && productStatuses.has(product.status)
    && typeof product.featured === 'boolean'
    && typeof product.composition === 'string'
    && typeof product.fit === 'string'
    && typeof product.sprite === 'string'
    && spritePositions.has(product.sprite)
}

export const isProductCatalog = (value: unknown): value is Product[] => Array.isArray(value) && value.every(isProduct)

export const loadCatalog = (storage: StorageLike | undefined) => readVersioned(
  storage,
  CATALOG_STORAGE_KEY,
  CATALOG_STORAGE_VERSION,
  seedProducts,
  isProductCatalog,
)

export const saveCatalog = (storage: StorageLike | undefined, products: Product[]) => {
  if (!isProductCatalog(products)) throw new Error('Некорректная структура каталога')
  writeVersioned(storage, CATALOG_STORAGE_KEY, CATALOG_STORAGE_VERSION, products)
}

export const resetCatalog = (storage: StorageLike | undefined) => {
  storage?.removeItem(CATALOG_STORAGE_KEY)
  return seedProducts
}

export const publicProducts = (products: Product[]) => products.filter((product) => product.status === 'active')

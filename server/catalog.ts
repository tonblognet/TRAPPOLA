import type { Database, DatabaseClient } from './types.js'
import { withTransaction } from './db.js'
import type { z } from 'zod'
import type { productSchema } from './schemas.js'

type ProductInput = z.infer<typeof productSchema>

type ProductRow = {
  id: string | number
  slug: string
  sku: string
  name: string
  collection: string
  description: string
  price: number
  status: 'active' | 'hidden' | 'coming-soon'
  featured: boolean
  composition: string
  fit: string
  sprite: 'tl' | 'tr' | 'bl' | 'br'
  sort_order: number
}

type VariantRow = {
  id: string | number
  product_id: string | number
  sku: string
  size: string
  color: string
  stock: number
  active: boolean
}

type ImageRow = {
  id: string | number
  product_id: string | number
  url: string
  alt_text: string
  kind: 'primary' | 'hover' | 'gallery'
  sort_order: number
}

export const listProducts = async (db: Database, includeHidden = false) => {
  const [productsResult, variantsResult, imagesResult] = await Promise.all([
    db.query<ProductRow>(`SELECT id, slug, sku, name, collection, description, price, status, featured,
      composition, fit, sprite, sort_order FROM products
      ${includeHidden ? '' : "WHERE status IN ('active', 'coming-soon')"}
      ORDER BY sort_order, id`),
    db.query<VariantRow>('SELECT id, product_id, sku, size, color, stock, active FROM product_variants ORDER BY id'),
    db.query<ImageRow>('SELECT id, product_id, url, alt_text, kind, sort_order FROM product_images ORDER BY sort_order, id'),
  ])
  const variantsByProduct = new Map<number, VariantRow[]>()
  const imagesByProduct = new Map<number, ImageRow[]>()
  for (const row of variantsResult.rows) {
    const productId = Number(row.product_id)
    variantsByProduct.set(productId, [...(variantsByProduct.get(productId) ?? []), row])
  }
  for (const row of imagesResult.rows) {
    const productId = Number(row.product_id)
    imagesByProduct.set(productId, [...(imagesByProduct.get(productId) ?? []), row])
  }

  return productsResult.rows.map((row) => {
    const id = Number(row.id)
    const variants = (variantsByProduct.get(id) ?? []).map((variant) => ({ ...variant, id: Number(variant.id), product_id: undefined }))
    const media = (imagesByProduct.get(id) ?? []).map((image) => ({
      id: Number(image.id), url: image.url, altText: image.alt_text, kind: image.kind, sortOrder: image.sort_order,
    }))
    const activeVariants = variants.filter((variant) => variant.active)
    const primary = media.find((image) => image.kind === 'primary')
    const hover = media.find((image) => image.kind === 'hover')
    return {
      id,
      slug: row.slug,
      sku: row.sku,
      name: row.name,
      collection: row.collection,
      description: row.description,
      price: row.price,
      status: row.status,
      featured: row.featured,
      composition: row.composition,
      fit: row.fit,
      sprite: row.sprite,
      sortOrder: row.sort_order,
      stock: activeVariants.reduce((sum, variant) => sum + variant.stock, 0),
      sizes: [...new Set(activeVariants.map((variant) => variant.size))],
      colors: [...new Set(activeVariants.map((variant) => variant.color))],
      variants,
      media,
      images: primary ? { primary: primary.url, hover: hover?.url, alt: primary.altText } : undefined,
    }
  })
}

const insertVariants = async (client: DatabaseClient, productId: number, variants: ProductInput['variants']) => {
  if (variants.length === 0) return
  const values = variants.flatMap((variant) => [productId, variant.sku, variant.size, variant.color, variant.stock, variant.active])
  const placeholders = variants.map((_, index) => {
    const start = index * 6
    return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6})`
  }).join(', ')
  await client.query(`INSERT INTO product_variants(product_id, sku, size, color, stock, active) VALUES ${placeholders}`, values)
}

export const createProduct = (db: Database, product: ProductInput) => withTransaction(db, async (client) => {
  const result = await client.query<{ id: string | number }>(`INSERT INTO products
    (slug, sku, name, collection, description, price, status, featured, composition, fit, sprite, sort_order)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`, [
    product.slug, product.sku, product.name, product.collection, product.description, product.price,
    product.status, product.featured, product.composition, product.fit, product.sprite, product.sortOrder,
  ])
  const id = Number(result.rows[0].id)
  await insertVariants(client, id, product.variants)
  return id
})

export const updateProduct = (db: Database, id: number, product: ProductInput) => withTransaction(db, async (client) => {
  const result = await client.query(`UPDATE products SET slug=$1, sku=$2, name=$3, collection=$4, description=$5,
    price=$6, status=$7, featured=$8, composition=$9, fit=$10, sprite=$11, sort_order=$12, updated_at=NOW()
    WHERE id=$13`, [product.slug, product.sku, product.name, product.collection, product.description, product.price,
    product.status, product.featured, product.composition, product.fit, product.sprite, product.sortOrder, id])
  if (result.rowCount === 0) return false
  await client.query('DELETE FROM product_variants WHERE product_id=$1', [id])
  await insertVariants(client, id, product.variants)
  return true
})

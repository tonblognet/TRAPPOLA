import { z } from 'zod'

const cleanText = (max: number) => z.string().trim().min(1).max(max)
const optionalText = (max: number) => z.string().trim().max(max).default('')

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),
  password: z.string().min(10).max(128),
})

export const variantSchema = z.object({
  id: z.number().int().positive().optional(),
  sku: cleanText(80),
  size: cleanText(80),
  color: cleanText(80),
  stock: z.number().int().min(0).max(1_000_000),
  active: z.boolean().default(true),
})

export const productSchema = z.object({
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug: латиница, цифры и дефисы'),
  sku: cleanText(80),
  name: cleanText(160),
  collection: cleanText(120),
  description: optionalText(5_000),
  price: z.number().int().min(0).max(100_000_000),
  status: z.enum(['active', 'hidden', 'coming-soon']),
  featured: z.boolean(),
  composition: optionalText(2_000),
  fit: optionalText(2_000),
  sprite: z.enum(['tl', 'tr', 'bl', 'br']),
  sortOrder: z.number().int().min(-100_000).max(100_000).default(0),
  variants: z.array(variantSchema).max(200),
}).superRefine((product, context) => {
  const keys = new Set<string>()
  for (const [index, variant] of product.variants.entries()) {
    const key = `${variant.size.toLocaleLowerCase('ru')}\u0000${variant.color.toLocaleLowerCase('ru')}`
    if (keys.has(key)) context.addIssue({ code: 'custom', path: ['variants', index], message: 'Размер и цвет не должны повторяться' })
    keys.add(key)
  }
  if (product.status === 'active' && !product.variants.some((variant) => variant.active)) {
    context.addIssue({ code: 'custom', path: ['variants'], message: 'Для публикации нужен хотя бы один активный вариант' })
  }
})

export const orderSchema = z.object({
  customer: z.object({
    name: cleanText(160),
    phone: z.string().trim().min(7).max(40),
    email: z.email().trim().toLowerCase().max(254),
    city: cleanText(160),
    address: cleanText(500),
    comment: optionalText(2_000),
  }),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    size: cleanText(80),
    color: cleanText(80),
    quantity: z.number().int().min(1).max(10),
  })).min(1).max(20),
  consentVersion: z.literal('2026-08-26'),
})

export const orderStatusSchema = z.object({
  status: z.enum(['new', 'confirmed', 'paid', 'assembling', 'shipped', 'completed', 'cancelled']),
})

export const imageMetaSchema = z.object({
  kind: z.enum(['primary', 'hover', 'gallery']).default('gallery'),
  altText: cleanText(300),
  sortOrder: z.coerce.number().int().min(-100_000).max(100_000).default(0),
})

export const settingsSchema = z.record(z.string().min(1).max(80), z.unknown())

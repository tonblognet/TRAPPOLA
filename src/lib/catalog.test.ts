import { describe, expect, it } from 'vitest'
import { seedProducts } from '../content/catalog'
import { isProductCatalog, publicProducts } from './catalog'

describe('catalog', () => {
  it('validates the seed content schema', () => {
    expect(isProductCatalog(seedProducts)).toBe(true)
  })

  it('keeps hidden drafts out of the public catalog', () => {
    const hidden = { ...seedProducts[0], status: 'hidden' as const }
    expect(publicProducts([hidden, seedProducts[1]])).toEqual([seedProducts[1]])
  })
})

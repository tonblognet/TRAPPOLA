import { describe, expect, it } from 'vitest'
import { seedProducts } from '../content/catalog'
import { addCartItem, cartTotal, changeCartQuantity, resolveCart } from './cart'

describe('cart', () => {
  it('adds and combines identical variants', () => {
    const once = addCartItem([], { productId: 1, size: 'M–L', color: 'Чёрный' })
    const twice = addCartItem(once, { productId: 1, size: 'M–L', color: 'Чёрный' })
    expect(twice).toEqual([{ productId: 1, size: 'M–L', color: 'Чёрный', quantity: 2 }])
  })

  it('removes a line when quantity reaches zero', () => {
    expect(changeCartQuantity([{ productId: 1, size: 'M–L', color: 'Чёрный', quantity: 1 }], 0, -1)).toEqual([])
  })

  it('resolves current prices before calculating totals', () => {
    const resolved = resolveCart([{ productId: 1, size: 'M–L', color: 'Чёрный', quantity: 2 }], seedProducts)
    expect(cartTotal(resolved)).toBe(seedProducts[0].price * 2)
  })
})

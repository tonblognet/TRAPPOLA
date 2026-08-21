import { describe, expect, it } from 'vitest'
import { pathForRoute, routeFromPath } from './router'

describe('router', () => {
  it('parses routes under the GitHub Pages base', () => {
    expect(routeFromPath('/TRAPPOLA/catalog', '/TRAPPOLA/')).toEqual({ name: 'catalog' })
    expect(routeFromPath('/TRAPPOLA/product/futbolka-tr', '/TRAPPOLA/')).toEqual({ name: 'product', slug: 'futbolka-tr' })
  })

  it('creates stable public paths', () => {
    expect(pathForRoute({ name: 'home' }, '/TRAPPOLA/')).toBe('/TRAPPOLA/')
    expect(pathForRoute({ name: 'product', slug: 'футболка' }, '/TRAPPOLA/')).toBe('/TRAPPOLA/product/%D1%84%D1%83%D1%82%D0%B1%D0%BE%D0%BB%D0%BA%D0%B0')
  })

  it('returns not found for an unknown path', () => {
    expect(routeFromPath('/TRAPPOLA/unknown', '/TRAPPOLA/')).toEqual({ name: 'not-found' })
  })
})

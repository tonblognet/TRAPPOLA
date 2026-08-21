import type { Route } from '../types'

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '')

export const routeFromPath = (pathname: string, base = '/'): Route => {
  const normalizedBase = `/${trimSlashes(base)}`.replace(/\/$/, '')
  const path = trimSlashes(pathname.startsWith(normalizedBase) ? pathname.slice(normalizedBase.length) : pathname)
  if (!path) return { name: 'home' }
  if (path === 'catalog') return { name: 'catalog' }
  if (path === 'about') return { name: 'about' }
  if (path === 'delivery') return { name: 'delivery' }
  if (path === 'returns') return { name: 'returns' }
  if (path === 'contacts') return { name: 'contacts' }
  if (path === 'privacy') return { name: 'privacy' }
  if (path === 'offer') return { name: 'offer' }
  if (path === 'checkout') return { name: 'checkout' }
  if (path === 'studio') return { name: 'studio' }
  if (path.startsWith('product/')) return { name: 'product', slug: decodeURIComponent(path.slice('product/'.length)) }
  return { name: 'not-found' }
}

export const pathForRoute = (route: Route, base = '/'): string => {
  const normalizedBase = `/${trimSlashes(base)}/`.replace(/^\/\//, '/')
  const suffix = route.name === 'home' ? ''
    : route.name === 'product' ? `product/${encodeURIComponent(route.slug)}`
      : route.name === 'not-found' ? '404'
        : route.name
  return `${normalizedBase}${suffix}`
}

import { copyFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const dist = resolve(process.cwd(), 'dist')
const basePath = process.env.VITE_BASE_PATH || '/TRAPPOLA/'
const normalizedBase = `/${basePath.replace(/^\/+|\/+$/g, '')}/`.replace('//', '/')
const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://tonblognet.github.io/TRAPPOLA').replace(/\/$/, '')
const routes = ['', 'catalog', 'about', 'delivery', 'returns', 'contacts']

await copyFile(resolve(dist, 'index.html'), resolve(dist, '404.html'))
await writeFile(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((route) => `  <url><loc>${siteUrl}/${route}</loc></url>`).join('\n')}
</urlset>\n`)
await writeFile(resolve(dist, 'robots.txt'), `User-agent: *
Allow: /
Disallow: ${normalizedBase}admin
Disallow: ${normalizedBase}studio
Disallow: ${normalizedBase}checkout

Sitemap: ${siteUrl}/sitemap.xml
`)
await writeFile(resolve(dist, 'site.webmanifest'), JSON.stringify({
  name: 'TRAPPOLA',
  short_name: 'TRAPPOLA',
  start_url: normalizedBase,
  display: 'standalone',
  background_color: '#050505',
  theme_color: '#050505',
  icons: [],
}, null, 2))

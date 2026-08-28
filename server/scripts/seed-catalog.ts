import { seedProducts } from '../../src/content/catalog.js'
import { createProduct } from '../catalog.js'
import { loadConfig } from '../config.js'
import { createDatabase } from '../db.js'
import { runMigrations } from '../migrate.js'

const db = createDatabase(loadConfig())
await runMigrations(db)

for (const [sortOrder, product] of seedProducts.entries()) {
  const existing = await db.query('SELECT id FROM products WHERE slug=$1', [product.slug])
  if (existing.rowCount) continue
  const combinations = product.sizes.flatMap((size) => product.colors.map((color) => ({ size, color })))
  await createProduct(db, {
    ...product,
    status: 'hidden',
    sortOrder,
    variants: combinations.map(({ size, color }, index) => ({
      sku: `${product.sku}-${String(index + 1).padStart(2, '0')}`,
      size,
      color,
      stock: 0,
      active: true,
    })),
  })
}
await db.end()
console.log('Текущий каталог импортирован скрытым и с нулевыми остатками. Проверьте его в /admin перед публикацией.')

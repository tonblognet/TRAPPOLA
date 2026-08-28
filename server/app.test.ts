import { readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { hash } from 'bcryptjs'
import { newDb } from 'pg-mem'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from './app.js'
import type { AppConfig, Database } from './types.js'

const origin = 'http://localhost:5173'
describe('TRAPPOLA API', () => {
  let db: Database
  let app: ReturnType<typeof createApp>
  let config: AppConfig

  beforeEach(async () => {
    const memory = newDb({ autoCreateForeignKeyIndices: true })
    memory.public.none(await readFile(path.resolve('server/migrations/001_initial.sql'), 'utf8'))
    const adapter = memory.adapters.createPg()
    db = new adapter.Pool() as unknown as Database
    config = {
      nodeEnv: 'test', port: 3000, databaseUrl: 'memory', databaseSsl: false, appOrigins: [origin],
      secureCookies: false, uploadDir: path.join(os.tmpdir(), 'trappola-api-tests', randomUUID()),
      frontendDist: path.join(os.tmpdir(), 'trappola-no-dist'), sessionHours: 12, maxUploadBytes: 8 * 1024 * 1024,
    }
    await db.query('INSERT INTO admins(id,email,password_hash,display_name) VALUES ($1,$2,$3,$4)', [
      randomUUID(), 'admin@trappola.ru', await hash('Strong-test-password-27', 4), 'Елена',
    ])
    const product = await db.query<{ id: string | number }>(`INSERT INTO products
      (slug,sku,name,collection,description,price,status,featured,composition,fit,sprite,sort_order)
      VALUES ('test-shirt','TR-T01','Футболка','TR','Тест',6900,'active',TRUE,'Хлопок','Свободная','tl',1) RETURNING id`)
    await db.query(`INSERT INTO product_variants(product_id,sku,size,color,stock,active)
      VALUES ($1,'TR-T01-M-BLK','M','Чёрный',3,TRUE)`, [product.rows[0].id])
    app = createApp(db, config)
  })

  afterEach(async () => {
    await db.end()
    await rm(config.uploadDir, { recursive: true, force: true })
  })

  it('publishes catalog and creates an order using server prices and stock', async () => {
    const catalog = await request(app).get('/api/products').expect(200)
    expect(catalog.body.products).toHaveLength(1)
    expect(catalog.body.products[0]).toMatchObject({ slug: 'test-shirt', price: 6900, stock: 3 })

    const order = await request(app).post('/api/orders').set('Origin', origin).send({
      customer: { name: 'Кирилл', phone: '+79990000000', email: 'buyer@example.com', city: 'Москва', address: 'ПВЗ', comment: '' },
      items: [{ productId: catalog.body.products[0].id, size: 'M', color: 'Чёрный', quantity: 2 }],
      consentVersion: '2026-08-26',
    }).expect(201)
    expect(order.body.order.total).toBe(13_800)
    expect(order.body.order.number).toMatch(/^TRP-/)
    const stock = await db.query<{ stock: number }>('SELECT stock FROM product_variants')
    expect(stock.rows[0].stock).toBe(1)
  })

  it('protects admin data with session and CSRF checks', async () => {
    await request(app).get('/api/admin/products').expect(401)
    const agent = request.agent(app)
    const login = await agent.post('/api/admin/session').set('Origin', origin).send({
      email: 'admin@trappola.ru', password: 'Strong-test-password-27',
    }).expect(200)
    expect(login.body.admin.displayName).toBe('Елена')

    await agent.post('/api/admin/products').set('Origin', origin).send({}).expect(403)
    const csrf = login.body.csrfToken as string
    const products = await agent.get('/api/admin/products').expect(200)
    expect(products.body.products).toHaveLength(1)

    const created = await agent.post('/api/admin/products').set('Origin', origin).set('x-csrf-token', csrf).send({
      slug: 'new-item', sku: 'TR-NEW', name: 'Новая вещь', collection: 'TR', description: '', price: 5000,
      status: 'hidden', featured: false, composition: '', fit: '', sprite: 'br', sortOrder: 2,
      variants: [{ sku: 'TR-NEW-OS', size: 'ONE SIZE', color: 'Чёрный', stock: 1, active: true }],
    }).expect(201)
    expect(created.body.products).toHaveLength(2)

    const uploaded = await agent.post('/api/admin/products/1/images').set('Origin', origin).set('x-csrf-token', csrf)
      .field('kind', 'primary').field('altText', 'Тестовое изображение')
      .attach('image', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]), { filename: 'test.png', contentType: 'image/png' })
      .expect(201)
    expect(uploaded.body.products[0].media[0]).toMatchObject({ kind: 'primary', altText: 'Тестовое изображение' })

    const invalid = await agent.post('/api/admin/products').set('Origin', origin).set('x-csrf-token', csrf).send({
      slug: 'empty-active', sku: 'TR-EMPTY', name: 'Без вариантов', collection: 'TR', description: '', price: 5000,
      status: 'active', featured: false, composition: '', fit: '', sprite: 'tl', sortOrder: 3, variants: [],
    }).expect(400)
    expect(invalid.body.details.fieldErrors.variants[0]).toContain('активный вариант')
  })

  it('rejects orders when stock is insufficient', async () => {
    const response = await request(app).post('/api/orders').set('Origin', origin).send({
      customer: { name: 'Кирилл', phone: '+79990000000', email: 'buyer@example.com', city: 'Москва', address: 'ПВЗ', comment: '' },
      items: [{ productId: 1, size: 'M', color: 'Чёрный', quantity: 4 }],
      consentVersion: '2026-08-26',
    }).expect(409)
    expect(response.body.error).toContain('Недостаточно')
  })
})

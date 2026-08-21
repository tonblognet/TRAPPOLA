import { useMemo, useState, type ChangeEvent } from 'react'
import { ArrowDown, ArrowUp, Download, Plus, RotateCcw, Save, Upload } from 'lucide-react'
import type { OrderRecord, Product, ProductStatus } from '../types'
import { isProductCatalog } from '../lib/catalog'
import { useDocumentMeta } from '../hooks/useDocumentMeta'

type Props = {
  products: Product[]
  orders: OrderRecord[]
  onSave: (products: Product[]) => void
  onReset: () => Product[]
}

const csv = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean)
const rubles = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`

export function StudioPage({ products, orders, onSave, onReset }: Props) {
  const [draft, setDraft] = useState(products)
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? 0)
  const [message, setMessage] = useState('')
  useDocumentMeta({ title: 'Контент-студия — TRAPPOLA', description: 'Локальный редактор каталога TRAPPOLA.', noIndex: true })

  const selected = useMemo(() => draft.find((product) => product.id === selectedId) ?? draft[0], [draft, selectedId])

  const update = <K extends keyof Product>(field: K, value: Product[K]) => {
    if (!selected) return
    setDraft((current) => current.map((product) => product.id === selected.id ? { ...product, [field]: value } : product))
  }

  const addProduct = () => {
    const id = Math.max(0, ...draft.map((product) => product.id)) + 1
    const product: Product = {
      id,
      slug: `new-product-${id}`,
      sku: `TR-${String(id).padStart(2, '0')}`,
      name: 'Новый товар',
      collection: 'TR',
      description: 'Описание товара',
      price: 0,
      colors: ['Чёрный'],
      sizes: ['M–L'],
      stock: 0,
      status: 'hidden',
      featured: false,
      composition: 'Состав уточняется.',
      fit: 'Посадка уточняется.',
      sprite: 'tl',
    }
    setDraft((current) => [...current, product])
    setSelectedId(id)
  }

  const move = (direction: -1 | 1) => {
    if (!selected) return
    setDraft((current) => {
      const index = current.findIndex((product) => product.id === selected.id)
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const save = () => {
    onSave(draft)
    setMessage('Изменения сохранены в этом браузере')
  }

  const reset = () => {
    const restored = onReset()
    setDraft(restored)
    setSelectedId(restored[0]?.id ?? 0)
    setMessage('Локальные изменения удалены')
  }

  const exportCatalog = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `trappola-catalog-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importCatalog = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!isProductCatalog(parsed)) throw new Error('Файл не соответствует структуре каталога')
      setDraft(parsed)
      setSelectedId(parsed[0]?.id ?? 0)
      setMessage(`Импортировано товаров: ${parsed.length}. Нажмите «Сохранить».`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось импортировать файл')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <main className="studio-page">
      <header className="studio-head">
        <div><span>Локальный режим</span><h1>Контент-студия</h1><p>Изменения видны только в этом браузере. Экспортируйте JSON для переноса на сервер после подключения CMS.</p></div>
        <div className="studio-actions">
          <button onClick={addProduct}><Plus /> Новый товар</button>
          <label><Upload /> Импорт JSON<input type="file" accept="application/json,.json" onChange={importCatalog} /></label>
          <button onClick={exportCatalog}><Download /> Экспорт JSON</button>
          <button onClick={reset}><RotateCcw /> Сбросить</button>
          <button className="primary" onClick={save}><Save /> Сохранить</button>
        </div>
      </header>
      {message ? <p className="studio-message" role="status">{message}</p> : null}
      <div className="studio-layout">
        <aside className="studio-list">
          {draft.map((product) => (
            <button key={product.id} className={selected?.id === product.id ? 'active' : ''} onClick={() => setSelectedId(product.id)}>
              <span>{product.sku}</span><strong>{product.name}</strong><small>{product.status === 'active' ? rubles(product.price) : product.status}</small>
            </button>
          ))}
        </aside>
        {selected ? (
          <section className="studio-editor">
            <div className="studio-editor__head"><div><span>{selected.sku}</span><h2>{selected.name}</h2></div><div><button onClick={() => move(-1)} aria-label="Поднять товар"><ArrowUp /></button><button onClick={() => move(1)} aria-label="Опустить товар"><ArrowDown /></button></div></div>
            <div className="studio-form-grid">
              <label>Название<input value={selected.name} onChange={(event) => update('name', event.target.value)} /></label>
              <label>Slug<input value={selected.slug} onChange={(event) => update('slug', event.target.value)} /></label>
              <label>Артикул<input value={selected.sku} onChange={(event) => update('sku', event.target.value)} /></label>
              <label>Коллекция<input value={selected.collection} onChange={(event) => update('collection', event.target.value)} /></label>
              <label>Цена<input type="number" min="0" value={selected.price} onChange={(event) => update('price', Number(event.target.value))} /></label>
              <label>Остаток<input type="number" min="0" value={selected.stock} onChange={(event) => update('stock', Number(event.target.value))} /></label>
              <label>Статус<select value={selected.status} onChange={(event) => update('status', event.target.value as ProductStatus)}><option value="active">Опубликован</option><option value="hidden">Скрыт</option><option value="coming-soon">Скоро</option></select></label>
              <label>Спрайт<select value={selected.sprite} onChange={(event) => update('sprite', event.target.value as Product['sprite'])}><option value="tl">Верхний левый</option><option value="tr">Верхний правый</option><option value="bl">Нижний левый</option><option value="br">Нижний правый</option></select></label>
              <label>Размеры через запятую<input value={selected.sizes.join(', ')} onChange={(event) => update('sizes', csv(event.target.value))} /></label>
              <label>Цвета через запятую<input value={selected.colors.join(', ')} onChange={(event) => update('colors', csv(event.target.value))} /></label>
              <label className="wide">Описание<textarea value={selected.description} onChange={(event) => update('description', event.target.value)} /></label>
              <label className="wide">Состав<textarea value={selected.composition} onChange={(event) => update('composition', event.target.value)} /></label>
              <label className="wide">Посадка<textarea value={selected.fit} onChange={(event) => update('fit', event.target.value)} /></label>
              <label className="studio-checkbox"><input type="checkbox" checked={selected.featured} onChange={(event) => update('featured', event.target.checked)} /> Показывать в первом дропе</label>
            </div>
          </section>
        ) : null}
      </div>
      <section className="studio-orders">
        <div><span>Тестовые данные</span><h2>Заказы в браузере</h2></div>
        {orders.length === 0 ? <p>Тестовых заказов пока нет.</p> : orders.map((order) => <article key={order.id}><strong>{order.id}</strong><span>{new Date(order.createdAt).toLocaleString('ru-RU')}</span><span>{order.customer.name}</span><span>{rubles(order.total)}</span><small>{order.status}</small></article>)}
      </section>
    </main>
  )
}

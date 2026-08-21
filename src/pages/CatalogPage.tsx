import { useMemo, useState } from 'react'
import type { Product, Route } from '../types'
import { track } from '../lib/analytics'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { ProductVisual } from '../components/ProductVisual'

const rubles = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`

export function CatalogPage({ products, onNavigate }: { products: Product[]; onNavigate: (route: Route) => void }) {
  const [collection, setCollection] = useState('ВСЕ')
  const collections = useMemo(() => ['ВСЕ', ...new Set(products.map((product) => product.collection))], [products])
  const list = collection === 'ВСЕ' ? products : products.filter((product) => product.collection === collection)
  useDocumentMeta({ title: 'Каталог — TRAPPOLA', description: 'Первый дроп TRAPPOLA: футболки и лонгсливы свободного силуэта.' })

  const selectCollection = (next: string) => {
    setCollection(next)
    track('collection_filter', { collection: next })
  }

  return (
    <main className="inner-page catalog-page">
      <div className="page-intro"><span>01 / Каталог</span><h1>Все вещи<br />первого дропа</h1><p>Ограниченный тираж. Два размера. Ни одного случайного элемента.</p></div>
      <div className="filters" aria-label="Фильтр по коллекциям">
        {collections.map((item) => <button key={item} className={collection === item ? 'active' : ''} onClick={() => selectCollection(item)}>{item}</button>)}
      </div>
      <div className="catalog-grid">
        {list.map((product) => (
          <button className="catalog-item" key={product.id} onClick={() => onNavigate({ name: 'product', slug: product.slug })}>
            <ProductVisual product={product} />
            <span><strong>{product.name}</strong><small>{rubles(product.price)}</small></span>
            <em>{product.stock > 0 ? product.colors.join(' / ') : 'Нет в наличии'}</em>
          </button>
        ))}
      </div>
      <div className="atelier-note"><span>02 / Следующая линия</span><h2>TRAPPOLA<br />ATELIER</h2><p>Более классическая линия с принтами и острыми деталями. Сейчас в разработке.</p></div>
    </main>
  )
}

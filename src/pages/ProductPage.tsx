import { useEffect, useState } from 'react'
import { Check, ShoppingBag } from 'lucide-react'
import type { Product } from '../types'
import { track } from '../lib/analytics'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { ProductVisual } from '../components/ProductVisual'

const rubles = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`

type Props = {
  product: Product
  onAdd: (product: Product, size: string, color: string) => void
}

export function ProductPage({ product, onAdd }: Props) {
  const [size, setSize] = useState(product.sizes[0])
  const [color, setColor] = useState(product.colors[0])
  const [added, setAdded] = useState(false)
  useDocumentMeta({ title: `${product.name} — TRAPPOLA`, description: product.description })

  useEffect(() => {
    track('product_view', { product_id: product.id, product: product.name })
  }, [product])

  const add = () => {
    onAdd(product, size, color)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
  }

  const available = product.stock > 0 && product.status === 'active'

  return (
    <main className="inner-page product-page">
      <div className="product-page__visual"><ProductVisual product={product} /><span>TRAPPOLA / {product.collection}</span></div>
      <div className="product-page__info">
        <span>Артикул {product.sku}</span><h1>{product.name}</h1><p className="price">{rubles(product.price)}</p><p className="description">{product.description}</p>
        <fieldset><legend>Размер</legend><div>{product.sizes.map((item) => <button type="button" className={size === item ? 'selected' : ''} onClick={() => setSize(item)} key={item}>{item}</button>)}</div></fieldset>
        <fieldset><legend>Цвет</legend><div>{product.colors.map((item) => <button type="button" className={color === item ? 'selected' : ''} onClick={() => setColor(item)} key={item}>{item}</button>)}</div></fieldset>
        <button className="add-button" onClick={add} disabled={!available}>{available ? (added ? <><Check /> Добавлено</> : <>Добавить в корзину <ShoppingBag /></>) : <>Нет в наличии</>}</button>
        <dl>
          <div><dt>Состав</dt><dd>{product.composition}</dd></div>
          <div><dt>Посадка</dt><dd>{product.fit}</dd></div>
          <div><dt>Доставка</dt><dd>По России. Расчёт после указания адреса.</dd></div>
        </dl>
      </div>
    </main>
  )
}

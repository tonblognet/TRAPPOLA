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
  const activeVariants = product.variants?.filter((variant) => variant.active) ?? []
  const sizes = activeVariants.length ? [...new Set(activeVariants.map((variant) => variant.size))] : product.sizes
  const [size, setSize] = useState(sizes[0] ?? '')
  const colors = activeVariants.length ? [...new Set(activeVariants.filter((variant) => variant.size === size).map((variant) => variant.color))] : product.colors
  const [color, setColor] = useState(colors[0] ?? '')
  const selectedColor = colors.includes(color) ? color : (colors[0] ?? '')
  const [added, setAdded] = useState(false)
  useDocumentMeta({ title: `${product.name} — TRAPPOLA`, description: product.description })

  useEffect(() => {
    track('product_view', { product_id: product.id, product: product.name })
  }, [product])

  const add = () => {
    onAdd(product, size, selectedColor)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
  }

  const selectedVariant = activeVariants.find((variant) => variant.size === size && variant.color === selectedColor)
  const available = product.status === 'active' && (selectedVariant ? selectedVariant.stock > 0 : product.stock > 0)

  return (
    <main className="inner-page product-page">
      <div className="product-page__visual"><ProductVisual product={product} /><span>TRAPPOLA / {product.collection}</span></div>
      <div className="product-page__info">
        <span>Артикул {product.sku}</span><h1>{product.name}</h1><p className="price">{rubles(product.price)}</p><p className="description">{product.description}</p>
        <fieldset><legend>Размер</legend><div>{sizes.map((item) => <button type="button" className={size === item ? 'selected' : ''} onClick={() => setSize(item)} disabled={activeVariants.length > 0 && !activeVariants.some((variant) => variant.size === item && variant.stock > 0)} key={item}>{item}</button>)}</div></fieldset>
        <fieldset><legend>Цвет</legend><div>{colors.map((item) => <button type="button" className={selectedColor === item ? 'selected' : ''} onClick={() => setColor(item)} disabled={activeVariants.length > 0 && !activeVariants.some((variant) => variant.size === size && variant.color === item && variant.stock > 0)} key={item}>{item}</button>)}</div></fieldset>
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

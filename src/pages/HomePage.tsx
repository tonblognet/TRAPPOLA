import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import type { Product, Route } from '../types'
import { assetUrl } from '../lib/assets'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { ProductVisual } from '../components/ProductVisual'

const rubles = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`

function Hero({ onExplore }: { onExplore: () => void }) {
  const heroRef = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      if (!heroRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      setProgress(Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight))))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  const style = {
    '--jaw-progress': progress,
    '--jaw-image': `url(${assetUrl('hero-jaw-complete.png')})`,
  } as CSSProperties

  return (
    <section ref={heroRef} className="hero" aria-label="TRAPPOLA — бренд, который не отпускает">
      <div className="hero-sticky" style={style}>
        <div className="jaw jaw--top" />
        <div className="jaw jaw--bottom" />
        <div className="hero-copy"><h1>TRAPPOLA</h1><p>Бренд, который не отпускает</p></div>
        <button className="scroll-cue" onClick={onExplore}><span>Листайте</span><ArrowDown /></button>
        <div className="hero-index">MOSCOW / 2026</div>
      </div>
    </section>
  )
}

function Collections({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <section className="collections" id="collections">
      <h2>Две стороны<br />одного бренда</h2>
      <div className="collection-split">
        <div className="collection-panel collection-panel--street">
          <div className="collection-image-stack">
            <img className="collection-image collection-image--mono" src={assetUrl('collection-street.png')} alt="Модель в одежде TRAPPOLA среди московской архитектуры" />
            <img className="collection-image collection-image--color" src={assetUrl('collection-street-color.png')} alt="" aria-hidden="true" />
          </div>
          <button type="button" className="collection-meta" onClick={() => onNavigate({ name: 'catalog' })}><strong>TRAPPOLA</strong><small>Casual / Street</small><ArrowRight /></button>
        </div>
        <div className="collection-panel collection-panel--atelier">
          <img src={assetUrl('collection-atelier.png')} alt="Коллекция TRAPPOLA ATELIER в тёмной студии" />
          <span className="collection-meta"><strong>TRAPPOLA ATELIER</strong><small>Классика / Провокация</small><i>Скоро</i></span>
        </div>
      </div>
    </section>
  )
}

function ProductRail({ products, onNavigate }: { products: Product[]; onNavigate: (route: Route) => void }) {
  return (
    <section className="drop-section">
      <div className="section-heading"><h2>Первый дроп</h2><button onClick={() => onNavigate({ name: 'catalog' })}>Смотреть всё <ArrowRight /></button></div>
      <div className="product-grid">
        {products.filter((product) => product.featured).slice(0, 4).map((product) => (
          <button className="product-tile" key={product.id} onClick={() => onNavigate({ name: 'product', slug: product.slug })}>
            <ProductVisual product={product} />
            <span className="product-tile__row"><strong>{product.name}</strong><small>{rubles(product.price)}</small></span>
            <span className="product-tile__row"><em>{product.sizes.join(' / ')}</em><ArrowRight /></span>
          </button>
        ))}
      </div>
    </section>
  )
}

function Manifesto({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <section className="manifesto">
      <div><h2>TRAPPOLA —<br />ловушка между мирами</h2><p>Между улицей и ателье.<br />Между тем, что видно, и тем,<br />что остаётся внутри.</p><button onClick={() => onNavigate({ name: 'about' })}>О бренде <ArrowRight /></button></div>
      <img className="trap-art" src={assetUrl('manifesto-trap.png')} alt="" aria-hidden="true" />
    </section>
  )
}

export function HomePage({ products, onNavigate }: { products: Product[]; onNavigate: (route: Route) => void }) {
  useDocumentMeta({
    title: 'TRAPPOLA — бренд, который не отпускает',
    description: 'TRAPPOLA — одежда на границе улицы и ателье. Первый дроп бренда из Москвы.',
  })

  return (
    <main>
      <Hero onExplore={() => document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })} />
      <Collections onNavigate={onNavigate} />
      <ProductRail products={products} onNavigate={onNavigate} />
      <Manifesto onNavigate={onNavigate} />
    </main>
  )
}

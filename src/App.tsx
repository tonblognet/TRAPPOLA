import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, Check, Menu, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { products, type Product } from './data'

type CartLine = { product: Product; size: string; color: string; quantity: number }
type Page = 'home' | 'catalog' | 'about' | 'delivery' | 'product'

const rubles = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`
const assetUrl = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`

function Header({ cartCount, onNavigate, onCart }: { cartCount: number; onNavigate: (page: Page) => void; onCart: () => void }) {
  const [open, setOpen] = useState(false)
  const navigate = (page: Page) => { onNavigate(page); setOpen(false) }
  return (
    <header className={open ? 'site-header site-header--menu-open' : 'site-header'}>
      <button className="wordmark" onClick={() => navigate('home')} aria-label="На главную">TRAPPOLA</button>
      <nav className={open ? 'nav nav--open' : 'nav'} aria-label="Основная навигация">
        <button onClick={() => navigate('catalog')}>Коллекции</button>
        <button onClick={() => navigate('about')}>О бренде</button>
        <button onClick={() => navigate('delivery')}>Доставка</button>
      </nav>
      <div className="header-actions">
        <button className="cart-trigger" onClick={onCart} aria-label={`Корзина, товаров: ${cartCount}`}>Корзина <span>{cartCount}</span></button>
        <button className="menu-trigger" onClick={() => setOpen(!open)} aria-label={open ? 'Закрыть меню' : 'Открыть меню'}>{open ? <X /> : <Menu />}</button>
      </div>
    </header>
  )
}

function Hero({ onExplore }: { onExplore: () => void }) {
  const heroRef = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const update = () => {
      if (!heroRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      setProgress(Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight))))
    }
    update(); window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return (
    <section ref={heroRef} className="hero" aria-label="TRAPPOLA — одежда, которая не отпускает">
      <div className="hero-sticky" style={{ '--jaw-progress': progress } as React.CSSProperties}>
        <div className="jaw jaw--top" />
        <div className="jaw jaw--bottom" />
        <div className="hero-copy">
          <h1>TRAPPOLA</h1>
          <p>Одежда, которая не отпускает</p>
        </div>
        <button className="scroll-cue" onClick={onExplore}><span>Листайте</span><ArrowDown /></button>
        <div className="hero-index">MOSCOW / 2026</div>
      </div>
    </section>
  )
}

function Collections({ onCatalog }: { onCatalog: () => void }) {
  return (
    <section className="collections" id="collections">
      <h2>Две стороны<br />одной ловушки</h2>
      <div className="collection-split">
        <button className="collection-panel" onClick={onCatalog}>
          <img src={assetUrl('collection-street.png')} alt="Модель в одежде TRAPPOLA среди московской архитектуры" />
          <span className="collection-meta"><strong>TRAPPOLA</strong><small>Casual / Street</small><ArrowRight /></span>
        </button>
        <button className="collection-panel collection-panel--atelier">
          <img src={assetUrl('collection-atelier.png')} alt="Коллекция TRAPPOLA ATELIER в тёмной студии" />
          <span className="collection-meta"><strong>TRAPPOLA ATELIER</strong><small>Классика / Провокация</small><i>Скоро</i></span>
        </button>
      </div>
    </section>
  )
}

function ProductVisual({ product }: { product: Product }) {
  return <div className={`product-visual sprite-${product.sprite}`} role="img" aria-label={product.name} />
}

function ProductRail({ onProduct, onCatalog }: { onProduct: (p: Product) => void; onCatalog: () => void }) {
  return (
    <section className="drop-section">
      <div className="section-heading"><h2>Первый дроп</h2><button onClick={onCatalog}>Смотреть всё <ArrowRight /></button></div>
      <div className="product-grid">
        {products.slice(0, 4).map((p) => (
          <button className="product-tile" key={p.id} onClick={() => onProduct(p)}>
            <ProductVisual product={p} />
            <span className="product-tile__row"><strong>{p.name}</strong><small>{rubles(p.price)}</small></span>
            <span className="product-tile__row"><em>{p.sizes.join(' / ')}</em><ArrowRight /></span>
          </button>
        ))}
      </div>
    </section>
  )
}

function Manifesto({ onAbout }: { onAbout: () => void }) {
  return (
    <section className="manifesto">
      <div><h2>TRAPPOLA —<br />это ловушка</h2><p>Между улицей и ателье.<br />Между тем, что видно, и тем,<br />что остаётся внутри.</p><button onClick={onAbout}>О бренде <ArrowRight /></button></div>
      <img className="trap-art" src={assetUrl('manifesto-trap.png')} alt="" aria-hidden="true" />
    </section>
  )
}

function Footer({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <footer className="footer">
      <div className="footer-top"><strong>TRAPPOLA</strong><div><button onClick={() => onNavigate('catalog')}>Каталог</button><button onClick={() => onNavigate('about')}>О бренде</button><button onClick={() => onNavigate('delivery')}>Доставка и оплата</button><button>Возврат</button><button>Контакты</button></div><address>Moscow / Russia<br /><a href="mailto:info@trappola.ru">info@trappola.ru</a></address></div>
      <div className="footer-bottom"><span>© TRAPPOLA 2026</span><span>Политика конфиденциальности</span></div>
    </footer>
  )
}

function Catalog({ onProduct }: { onProduct: (p: Product) => void }) {
  const [collection, setCollection] = useState('ВСЕ')
  const list = collection === 'ВСЕ' ? products : products.filter((p) => p.collection === collection)
  return (
    <main className="inner-page catalog-page">
      <div className="page-intro"><span>01 / Каталог</span><h1>Все вещи<br />первого дропа</h1><p>24 экземпляра. Два размера. Ни одного случайного элемента.</p></div>
      <div className="filters" aria-label="Фильтр по коллекциям">{['ВСЕ', 'TR', 'УГОЛ', 'КАПКАН'].map((x) => <button key={x} className={collection === x ? 'active' : ''} onClick={() => setCollection(x)}>{x}</button>)}</div>
      <div className="catalog-grid">{list.map((p) => <button className="catalog-item" key={p.id} onClick={() => onProduct(p)}><ProductVisual product={p} /><span><strong>{p.name}</strong><small>{rubles(p.price)}</small></span><em>{p.colors.join(' / ')}</em></button>)}</div>
      <div className="atelier-note"><span>02 / Следующая линия</span><h2>TRAPPOLA<br />ATELIER</h2><p>Более классическая линия с принтами и острыми деталями. Сейчас в разработке.</p></div>
    </main>
  )
}

function ProductPage({ product, onAdd }: { product: Product; onAdd: (product: Product, size: string, color: string) => void }) {
  const [size, setSize] = useState(product.sizes[0])
  const [color, setColor] = useState(product.colors[0])
  const [added, setAdded] = useState(false)
  const add = () => { onAdd(product, size, color); setAdded(true); window.setTimeout(() => setAdded(false), 1600) }
  return (
    <main className="inner-page product-page">
      <div className="product-page__visual"><ProductVisual product={product} /><span>TRAPPOLA / {product.collection}</span></div>
      <div className="product-page__info">
        <span>Артикул TR-{String(product.id).padStart(2, '0')}</span><h1>{product.name}</h1><p className="price">{rubles(product.price)}</p><p className="description">{product.description}</p>
        <fieldset><legend>Размер</legend><div>{product.sizes.map((x) => <button className={size === x ? 'selected' : ''} onClick={() => setSize(x)} key={x}>{x}</button>)}</div></fieldset>
        <fieldset><legend>Цвет</legend><div>{product.colors.map((x) => <button className={color === x ? 'selected' : ''} onClick={() => setColor(x)} key={x}>{x}</button>)}</div></fieldset>
        <button className="add-button" onClick={add}>{added ? <><Check /> Добавлено</> : <>Добавить в корзину <ShoppingBag /></>}</button>
        <dl><div><dt>Состав</dt><dd>Плотный хлопок. Финальный состав уточняется перед запуском.</dd></div><div><dt>Посадка</dt><dd>Свободная, унисекс. Размерная сетка M–L и XL–XXL.</dd></div><div><dt>Доставка</dt><dd>По России. Расчёт после указания адреса.</dd></div></dl>
      </div>
    </main>
  )
}

function About() { return <main className="inner-page text-page"><span>TRAPPOLA / Москва</span><h1>Ловушка<br />как форма<br />свободы</h1><div className="text-columns"><p>TRAPPOLA начинается на границе двух состояний: повседневной улицы и вещи, собранной почти как сценический костюм.</p><p>Первая линия — футболки и лонгсливы свободного силуэта. Затем появятся худи, брюки, костюмы, сумки, текстиль и парфюм для дома.</p></div><img src={assetUrl('collection-atelier.png')} alt="TRAPPOLA ATELIER" /></main> }

function Delivery() { return <main className="inner-page service-page"><div className="page-intro"><span>Информация</span><h1>Доставка<br />и оплата</h1></div><div className="service-list"><section><span>01</span><h2>Оплата</h2><p>Банковской картой, через СБП, SberPay и другие способы после подключения ЮKassa. Чек придёт на электронную почту.</p></section><section><span>02</span><h2>Доставка</h2><p>По России через СДЭК. Стоимость и срок рассчитываются при оформлении заказа.</p></section><section><span>03</span><h2>Возврат</h2><p>Условия возврата будут опубликованы до начала продаж вместе с реквизитами продавца и публичной офертой.</p></section></div></main> }

function CartDrawer({ cart, open, onClose, onQuantity, onCheckout }: { cart: CartLine[]; open: boolean; onClose: () => void; onQuantity: (i: number, d: number) => void; onCheckout: () => void }) {
  const total = cart.reduce((sum, x) => sum + x.product.price * x.quantity, 0)
  return <><div className={open ? 'scrim visible' : 'scrim'} onClick={onClose} /><aside className={open ? 'cart-drawer open' : 'cart-drawer'} aria-hidden={!open}><div className="cart-head"><h2>Корзина</h2><button onClick={onClose}><X /></button></div>{cart.length === 0 ? <div className="empty-cart"><ShoppingBag /><p>Пока пусто.<br />Ловушка ещё открыта.</p></div> : <><div className="cart-lines">{cart.map((line, i) => <div className="cart-line" key={`${line.product.id}-${line.size}-${line.color}`}><ProductVisual product={line.product} /><div><strong>{line.product.name}</strong><small>{line.color} / {line.size}</small><span>{rubles(line.product.price)}</span><div className="qty"><button onClick={() => onQuantity(i, -1)}><Minus /></button><b>{line.quantity}</b><button onClick={() => onQuantity(i, 1)}><Plus /></button></div></div></div>)}</div><div className="cart-total"><span>Итого</span><strong>{rubles(total)}</strong><button onClick={onCheckout}>Оформить заказ <ArrowRight /></button></div></>}</aside></>
}

function Checkout({ cart, onDone }: { cart: CartLine[]; onDone: () => void }) {
  const [done, setDone] = useState(false)
  const total = cart.reduce((sum, x) => sum + x.product.price * x.quantity, 0)
  if (done) return <main className="checkout-success"><Check /><h1>Заказ принят</h1><p>Это демонстрационный режим — деньги не списаны. В боевой версии здесь будет подтверждение ЮKassa и кассовый чек.</p><button onClick={onDone}>Вернуться на главную</button></main>
  return <main className="inner-page checkout-page"><div><span>Последний шаг</span><h1>Оформление<br />заказа</h1><form onSubmit={(e) => { e.preventDefault(); setDone(true) }}><label>Имя<input required name="name" autoComplete="name" /></label><label>Телефон<input required name="tel" autoComplete="tel" /></label><label>Email для чека<input required type="email" name="email" autoComplete="email" /></label><label>Город и адрес<input required name="address" autoComplete="street-address" /></label><label>Комментарий<textarea name="comment" /></label><button type="submit">Перейти к оплате <ArrowRight /></button></form></div><aside><h2>Ваш заказ</h2>{cart.map((x) => <p key={`${x.product.id}-${x.size}`}>{x.product.name} × {x.quantity}<span>{rubles(x.product.price * x.quantity)}</span></p>)}<strong>Итого <span>{rubles(total)}</span></strong><small>Доставка рассчитается после подключения СДЭК.</small></aside></main>
}

export default function App() {
  const [page, setPage] = useState<Page | 'checkout'>('home')
  const [selected, setSelected] = useState<Product>(products[0])
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const count = useMemo(() => cart.reduce((sum, x) => sum + x.quantity, 0), [cart])
  const navigate = (next: Page | 'checkout') => { setPage(next); setCartOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const openProduct = (p: Product) => { setSelected(p); navigate('product') }
  const add = (product: Product, size: string, color: string) => {
    setCart((current) => { const i = current.findIndex((x) => x.product.id === product.id && x.size === size && x.color === color); if (i < 0) return [...current, { product, size, color, quantity: 1 }]; return current.map((x, j) => j === i ? { ...x, quantity: x.quantity + 1 } : x) })
    setCartOpen(true)
  }
  const quantity = (i: number, delta: number) => setCart((current) => current.map((x, j) => j === i ? { ...x, quantity: x.quantity + delta } : x).filter((x) => x.quantity > 0))
  return <div className="app"><Header cartCount={count} onNavigate={navigate} onCart={() => setCartOpen(true)} />
    {page === 'home' && <main><Hero onExplore={() => document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })} /><Collections onCatalog={() => navigate('catalog')} /><ProductRail onProduct={openProduct} onCatalog={() => navigate('catalog')} /><Manifesto onAbout={() => navigate('about')} /></main>}
    {page === 'catalog' && <Catalog onProduct={openProduct} />}{page === 'product' && <ProductPage product={selected} onAdd={add} />}{page === 'about' && <About />}{page === 'delivery' && <Delivery />}{page === 'checkout' && <Checkout cart={cart} onDone={() => { setCart([]); navigate('home') }} />}
    {page !== 'checkout' && <Footer onNavigate={navigate} />}
    <CartDrawer cart={cart} open={cartOpen} onClose={() => setCartOpen(false)} onQuantity={quantity} onCheckout={() => navigate('checkout')} />
  </div>
}

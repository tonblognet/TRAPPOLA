import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Boxes, ImagePlus, LogOut, PackageCheck, Plus, Save, Settings, Trash2, X } from 'lucide-react'
import type { AdminOrder, OrderStatus, Product, ProductImage, ProductVariant } from '../types'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import {
  createAdminProduct,
  deleteAdminImage,
  deleteAdminProduct,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminSettings,
  loginAdmin,
  logoutAdmin,
  restoreAdminSession,
  saveAdminSettings,
  updateAdminOrderStatus,
  updateAdminProduct,
  uploadAdminImage,
  type AdminSession,
} from '../lib/adminApi'

type Tab = 'products' | 'orders' | 'settings'

const rubles = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`
const statusLabels: Record<OrderStatus, string> = {
  new: 'Новый', confirmed: 'Подтверждён', paid: 'Оплачен', assembling: 'Собирается',
  shipped: 'Отправлен', completed: 'Завершён', cancelled: 'Отменён',
}

const emptyProduct = (): Product => ({
  id: 0,
  slug: '',
  sku: '',
  name: 'Новый товар',
  collection: 'TR',
  description: '',
  price: 0,
  colors: [],
  sizes: [],
  stock: 0,
  status: 'hidden',
  featured: false,
  composition: '',
  fit: '',
  sprite: 'tl',
  sortOrder: 0,
  variants: [],
  media: [],
})

function LoginForm({ onLogin }: { onLogin: (session: AdminSession) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      onLogin(await loginAdmin(email, password))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Не удалось войти')
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="admin-login">
      <form onSubmit={submit}>
        <strong>TRAPPOLA</strong>
        <h1>Управление<br />магазином</h1>
        <p>Вход доступен только назначенным администраторам.</p>
        <label>Email<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Пароль<input required type="password" minLength={10} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error ? <p className="admin-error" role="alert">{error}</p> : null}
        <button type="submit" disabled={busy}>{busy ? 'Проверяем…' : 'Войти'}</button>
      </form>
    </main>
  )
}

type ProductEditorProps = {
  product: Product
  onChange: (product: Product) => void
  onSave: () => Promise<void>
  onDelete: () => Promise<void>
  onUpload: (file: File, kind: ProductImage['kind'], alt: string) => Promise<void>
  onDeleteImage: (image: ProductImage) => Promise<void>
  busy: boolean
}

function ProductEditor({ product, onChange, onSave, onDelete, onUpload, onDeleteImage, busy }: ProductEditorProps) {
  const [imageKind, setImageKind] = useState<ProductImage['kind']>('primary')
  const update = <K extends keyof Product>(field: K, value: Product[K]) => onChange({ ...product, [field]: value })
  const variants = product.variants ?? []
  const changeVariant = (index: number, field: keyof ProductVariant, value: string | number | boolean) => {
    update('variants', variants.map((variant, current) => current === index ? { ...variant, [field]: value } : variant))
  }
  const addVariant = () => update('variants', [...variants, {
    sku: `${product.sku || 'SKU'}-${variants.length + 1}`, size: '', color: 'Чёрный', stock: 0, active: true,
  }])
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await onUpload(file, imageKind, product.name)
    event.target.value = ''
  }
  return (
    <section className="admin-editor">
      <header><div><span>{product.id ? product.sku : 'Черновик'}</span><h2>{product.name}</h2></div><div><button className="admin-danger" disabled={busy || !product.id} onClick={onDelete}><Trash2 /> Удалить</button><button className="admin-primary" disabled={busy} onClick={onSave}><Save /> Сохранить</button></div></header>
      <div className="admin-form-grid">
        <label>Название<input value={product.name} onChange={(event) => update('name', event.target.value)} /></label>
        <label>Slug<input value={product.slug} onChange={(event) => update('slug', event.target.value)} placeholder="futbolka-tr" /></label>
        <label>Артикул<input value={product.sku} onChange={(event) => update('sku', event.target.value)} /></label>
        <label>Коллекция<input value={product.collection} onChange={(event) => update('collection', event.target.value)} /></label>
        <label>Цена, ₽<input type="number" min="0" value={product.price} onChange={(event) => update('price', Number(event.target.value))} /></label>
        <label>Порядок<input type="number" value={product.sortOrder ?? 0} onChange={(event) => update('sortOrder', Number(event.target.value))} /></label>
        <label>Статус<select value={product.status} onChange={(event) => update('status', event.target.value as Product['status'])}><option value="active">Опубликован</option><option value="hidden">Скрыт</option><option value="coming-soon">Скоро</option></select></label>
        <label>Положение заглушки<select value={product.sprite} onChange={(event) => update('sprite', event.target.value as Product['sprite'])}><option value="tl">Верх слева</option><option value="tr">Верх справа</option><option value="bl">Низ слева</option><option value="br">Низ справа</option></select></label>
        <label className="wide">Описание<textarea value={product.description} onChange={(event) => update('description', event.target.value)} /></label>
        <label className="wide">Состав<textarea value={product.composition} onChange={(event) => update('composition', event.target.value)} /></label>
        <label className="wide">Посадка<textarea value={product.fit} onChange={(event) => update('fit', event.target.value)} /></label>
        <label className="admin-check"><input type="checkbox" checked={product.featured} onChange={(event) => update('featured', event.target.checked)} /> Показывать в первом дропе</label>
      </div>

      <div className="admin-subhead"><div><span>Склад</span><h3>Варианты</h3></div><button onClick={addVariant}><Plus /> Добавить вариант</button></div>
      <div className="variant-table">
        <div className="variant-row variant-head"><span>Артикул</span><span>Размер</span><span>Цвет</span><span>Остаток</span><span>Активен</span><span /></div>
        {variants.map((variant, index) => <div className="variant-row" key={`${variant.id ?? 'new'}-${index}`}>
          <input aria-label="Артикул варианта" value={variant.sku} onChange={(event) => changeVariant(index, 'sku', event.target.value)} />
          <input aria-label="Размер" value={variant.size} onChange={(event) => changeVariant(index, 'size', event.target.value)} />
          <input aria-label="Цвет" value={variant.color} onChange={(event) => changeVariant(index, 'color', event.target.value)} />
          <input aria-label="Остаток" type="number" min="0" value={variant.stock} onChange={(event) => changeVariant(index, 'stock', Number(event.target.value))} />
          <input aria-label="Активен" type="checkbox" checked={variant.active} onChange={(event) => changeVariant(index, 'active', event.target.checked)} />
          <button aria-label="Удалить вариант" onClick={() => update('variants', variants.filter((_, current) => current !== index))}><X /></button>
        </div>)}
        {variants.length === 0 ? <p className="admin-empty">Добавьте хотя бы один вариант перед публикацией товара.</p> : null}
      </div>

      <div className="admin-subhead"><div><span>Медиа</span><h3>Изображения</h3></div>{product.id ? <label className="admin-upload"><ImagePlus /> Загрузить<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} /></label> : <small>Сначала сохраните товар</small>}</div>
      {product.id ? <label className="image-kind">Назначение<select value={imageKind} onChange={(event) => setImageKind(event.target.value as ProductImage['kind'])}><option value="primary">Основное</option><option value="hover">При наведении</option><option value="gallery">Галерея</option></select></label> : null}
      <div className="admin-media-list">{(product.media ?? []).map((image) => <article key={image.id}><img src={image.url} alt={image.altText} /><div><strong>{image.kind}</strong><span>{image.altText}</span></div><button aria-label="Удалить изображение" onClick={() => onDeleteImage(image)}><Trash2 /></button></article>)}</div>
    </section>
  )
}

function OrdersPanel({ orders, onStatus }: { orders: AdminOrder[]; onStatus: (id: string, status: OrderStatus) => Promise<void> }) {
  return <section className="admin-orders-panel"><header><span>Продажи</span><h2>Заказы</h2></header>{orders.length === 0 ? <p className="admin-empty">Заказов пока нет.</p> : orders.map((order) => <article key={order.id}>
    <div><strong>{order.number}</strong><span>{new Date(order.createdAt).toLocaleString('ru-RU')}</span></div>
    <div><strong>{order.customer.name}</strong><a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a><span>{order.customer.city}, {order.customer.address}</span></div>
    <div>{order.items.map((item) => <span key={item.id}>{item.productName}, {item.size}, {item.color} × {item.quantity}</span>)}</div>
    <strong>{rubles(order.total)}</strong>
    <select aria-label={`Статус ${order.number}`} value={order.status} onChange={(event) => void onStatus(order.id, event.target.value as OrderStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
  </article>)}</section>
}

type SellerSettings = { legalName: string; inn: string; email: string }
function SettingsPanel({ initial, onSave }: { initial: Record<string, unknown>; onSave: (settings: Record<string, unknown>) => Promise<void> }) {
  const source = (initial.seller ?? {}) as Partial<SellerSettings>
  const [seller, setSeller] = useState<SellerSettings>({ legalName: source.legalName ?? '', inn: source.inn ?? '', email: source.email ?? '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      await onSave({ ...initial, seller })
      setMessage('Реквизиты сохранены')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Не удалось сохранить настройки')
    }
  }
  return <section className="admin-settings-panel"><header><span>Сайт</span><h2>Настройки</h2></header><form onSubmit={submit}>
    <label>Наименование продавца<input value={seller.legalName} onChange={(event) => setSeller({ ...seller, legalName: event.target.value })} /></label>
    <label>ИНН<input inputMode="numeric" value={seller.inn} onChange={(event) => setSeller({ ...seller, inn: event.target.value })} /></label>
    <label>Почта магазина<input type="email" value={seller.email} onChange={(event) => setSeller({ ...seller, email: event.target.value })} /></label>
    <p>Платёжные ключи здесь не хранятся. Они добавляются только как секретные переменные на сервере после заключения договора с банком.</p>
    {error ? <span className="admin-error" role="alert">{error}</span> : null}{message ? <span role="status">{message}</span> : null}<button className="admin-primary"><Save /> Сохранить</button>
  </form></section>
}

export function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [checking, setChecking] = useState(true)
  const [tab, setTab] = useState<Tab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [draft, setDraft] = useState<Product>(emptyProduct)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useDocumentMeta({ title: 'Админка — TRAPPOLA', description: 'Управление магазином TRAPPOLA.', noIndex: true })

  useEffect(() => { restoreAdminSession().then(setSession).catch(() => undefined).finally(() => setChecking(false)) }, [])
  useEffect(() => {
    if (!session) return
    Promise.all([fetchAdminProducts(), fetchAdminOrders(), fetchAdminSettings()]).then(([catalog, loadedOrders, loadedSettings]) => {
      setProducts(catalog); setOrders(loadedOrders); setSettings(loadedSettings)
      if (catalog[0]) setDraft(catalog[0])
    }).catch((failure) => setMessage(failure instanceof Error ? failure.message : 'Не удалось загрузить данные'))
  }, [session])
  if (checking) return <main className="admin-loading">Проверяем сессию…</main>
  if (!session) return <LoginForm onLogin={setSession} />

  const run = async (task: () => Promise<void>, success: string) => {
    setBusy(true); setMessage('')
    try { await task(); setMessage(success) } catch (failure) { setMessage(failure instanceof Error ? failure.message : 'Операция не выполнена') } finally { setBusy(false) }
  }
  const saveProduct = () => run(async () => {
    const next = draft.id ? await updateAdminProduct(draft) : await createAdminProduct(draft)
    setProducts(next)
    const saved = next.find((product) => product.slug === draft.slug)
    if (saved) setDraft(saved)
  }, 'Товар сохранён')
  const removeProduct = async () => {
    if (!draft.id || !window.confirm(`Удалить «${draft.name}»?`)) return
    await run(async () => {
    await deleteAdminProduct(draft.id)
    const next = products.filter((product) => product.id !== draft.id)
    setProducts(next); setDraft(next[0] ?? emptyProduct())
    }, 'Товар удалён')
  }
  const uploadImage = (file: File, kind: ProductImage['kind'], alt: string) => run(async () => {
    const next = await uploadAdminImage(draft.id, file, kind, alt)
    setProducts(next); setDraft(next.find((product) => product.id === draft.id) ?? draft)
  }, 'Изображение загружено')
  const removeImage = async (image: ProductImage) => {
    if (!window.confirm('Удалить изображение?')) return
    await run(async () => {
      await deleteAdminImage(image.id)
      const next = await fetchAdminProducts(); setProducts(next); setDraft(next.find((product) => product.id === draft.id) ?? draft)
    }, 'Изображение удалено')
  }
  const changeOrderStatus = async (id: string, status: OrderStatus) => {
    await run(async () => setOrders(await updateAdminOrderStatus(id, status)), 'Статус заказа обновлён')
  }

  return <main className="admin-page">
    <aside className="admin-sidebar"><strong>TRAPPOLA</strong><nav>
      <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}><Boxes /> Товары</button>
      <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}><PackageCheck /> Заказы <i>{orders.filter((order) => order.status === 'new').length}</i></button>
      <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}><Settings /> Настройки</button>
    </nav><div><span>{session.admin.displayName}</span><small>{session.admin.email}</small><button onClick={() => void logoutAdmin().finally(() => setSession(null))}><LogOut /> Выйти</button></div></aside>
    <div className="admin-workspace">
      {message ? <p className="admin-message" role="status">{message}</p> : null}
      {tab === 'products' ? <div className="admin-products"><aside><header><div><span>Каталог</span><h1>Товары</h1></div><button onClick={() => setDraft(emptyProduct())}><Plus /></button></header>{products.map((product) => <button key={product.id} className={draft.id === product.id ? 'active' : ''} onClick={() => setDraft(product)}><span>{product.sku}</span><strong>{product.name}</strong><small>{product.status === 'active' ? rubles(product.price) : product.status}</small></button>)}</aside><ProductEditor product={draft} onChange={setDraft} onSave={saveProduct} onDelete={removeProduct} onUpload={uploadImage} onDeleteImage={removeImage} busy={busy} /></div> : null}
      {tab === 'orders' ? <OrdersPanel orders={orders} onStatus={changeOrderStatus} /> : null}
      {tab === 'settings' ? <SettingsPanel initial={settings} onSave={async (next) => { await saveAdminSettings(next); setSettings(next) }} /> : null}
    </div>
  </main>
}

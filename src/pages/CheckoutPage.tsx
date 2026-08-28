import { useState, type FormEvent } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import type { CartLine, OrderCustomer, OrderRecord, ResolvedCartLine, Route } from '../types'
import { cartTotal } from '../lib/cart'
import { track } from '../lib/analytics'
import { useDocumentMeta } from '../hooks/useDocumentMeta'

const rubles = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`

const emptyCustomer: OrderCustomer = { name: '', phone: '', email: '', city: '', address: '', comment: '' }

type Props = {
  cart: CartLine[]
  resolvedCart: ResolvedCartLine[]
  apiMode: boolean
  onOrder: (customer: OrderCustomer) => Promise<OrderRecord>
  onNavigate: (route: Route) => void
}

export function CheckoutPage({ cart, resolvedCart, apiMode, onOrder, onNavigate }: Props) {
  const [customer, setCustomer] = useState(emptyCustomer)
  const [agreed, setAgreed] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<OrderRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const total = cartTotal(resolvedCart)
  useDocumentMeta({ title: 'Оформление заказа — TRAPPOLA', description: 'Оформление заказа TRAPPOLA.', noIndex: true })

  const update = (field: keyof OrderCustomer, value: string) => setCustomer((current) => ({ ...current, [field]: value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!agreed || cart.length === 0) return
    setSubmitting(true)
    setError('')
    try {
      const order = await onOrder(customer)
      setSubmittedOrder(order)
      track('order_submitted', { order_id: order.id, total: order.total })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Не удалось оформить заказ')
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedOrder) {
    return (
      <main className="checkout-success">
        <Check />
        <h1>Заказ<br />сохранён</h1>
        <p>Номер заявки: <strong>{submittedOrder.number ?? submittedOrder.id}</strong>. {apiMode ? 'Заявка передана магазину. Оплата пока не списана — менеджер свяжется с вами.' : 'Сейчас это безопасный демонстрационный режим: данные сохранены только в этом браузере, деньги не списаны.'}</p>
        <button onClick={() => onNavigate({ name: 'home' })}>Вернуться на главную</button>
      </main>
    )
  }

  if (resolvedCart.length === 0) {
    return (
      <main className="checkout-success">
        <h1>Корзина<br />пуста</h1>
        <p>Добавьте вещи из каталога, чтобы перейти к оформлению.</p>
        <button onClick={() => onNavigate({ name: 'catalog' })}>Открыть каталог</button>
      </main>
    )
  }

  return (
    <main className="inner-page checkout-page">
      <div>
        <span>Последний шаг</span><h1>Оформление<br />заказа</h1>
        <form onSubmit={submit}>
          <label>Имя<input required autoComplete="name" value={customer.name} onChange={(event) => update('name', event.target.value)} /></label>
          <label>Телефон<input required type="tel" autoComplete="tel" inputMode="tel" value={customer.phone} onChange={(event) => update('phone', event.target.value)} /></label>
          <label>Email для подтверждения<input required type="email" autoComplete="email" value={customer.email} onChange={(event) => update('email', event.target.value)} /></label>
          <label>Город<input required autoComplete="address-level2" value={customer.city} onChange={(event) => update('city', event.target.value)} /></label>
          <label>Адрес или пункт выдачи<input required autoComplete="street-address" value={customer.address} onChange={(event) => update('address', event.target.value)} /></label>
          <label>Комментарий<textarea value={customer.comment} onChange={(event) => update('comment', event.target.value)} /></label>
          <label className="consent-field"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /> <span>Согласен с <button type="button" onClick={() => onNavigate({ name: 'privacy' })}>политикой конфиденциальности</button> и условиями обработки заявки.</span></label>
          {error ? <p className="checkout-error" role="alert">{error}</p> : null}
          <button type="submit" disabled={!agreed || submitting}>{submitting ? 'Отправляем…' : apiMode ? 'Отправить заказ' : 'Сохранить тестовый заказ'} <ArrowRight /></button>
        </form>
      </div>
      <aside>
        <h2>Ваш заказ</h2>
        {resolvedCart.map((line) => <p key={`${line.productId}-${line.size}-${line.color}`}>{line.product.name} × {line.quantity}<span>{rubles(line.product.price * line.quantity)}</span></p>)}
        <strong>Итого <span>{rubles(total)}</span></strong>
        <small>Оплата и доставка будут подключены после выбора сервисов и получения реквизитов продавца.</small>
      </aside>
    </main>
  )
}

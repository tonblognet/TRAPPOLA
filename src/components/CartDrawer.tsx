import { ArrowRight, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import type { ResolvedCartLine, Route } from '../types'
import { cartTotal } from '../lib/cart'
import { ProductVisual } from './ProductVisual'

const rubles = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`

type Props = {
  cart: ResolvedCartLine[]
  open: boolean
  onClose: () => void
  onQuantity: (index: number, delta: number) => void
  onNavigate: (route: Route) => void
}

export function CartDrawer({ cart, open, onClose, onQuantity, onNavigate }: Props) {
  const total = cartTotal(cart)
  const checkout = () => { onClose(); onNavigate({ name: 'checkout' }) }

  return (
    <>
      <button className={open ? 'scrim visible' : 'scrim'} onClick={onClose} aria-label="Закрыть корзину" tabIndex={open ? 0 : -1} />
      <aside className={open ? 'cart-drawer open' : 'cart-drawer'} aria-hidden={!open} aria-label="Корзина">
        <div className="cart-head"><h2>Корзина</h2><button onClick={onClose} aria-label="Закрыть"><X /></button></div>
        {cart.length === 0 ? (
          <div className="empty-cart"><ShoppingBag /><p>Пока пусто.<br />Выберите свою вещь.</p></div>
        ) : (
          <>
            <div className="cart-lines">
              {cart.map((line, index) => (
                <div className="cart-line" key={`${line.productId}-${line.size}-${line.color}`}>
                  <ProductVisual product={line.product} />
                  <div>
                    <strong>{line.product.name}</strong>
                    <small>{line.color} / {line.size}</small>
                    <span>{rubles(line.product.price)}</span>
                    <div className="qty">
                      <button onClick={() => onQuantity(index, -1)} aria-label={`Уменьшить количество ${line.product.name}`}><Minus /></button>
                      <b>{line.quantity}</b>
                      <button onClick={() => onQuantity(index, 1)} aria-label={`Увеличить количество ${line.product.name}`}><Plus /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-total">
              <span>Итого</span><strong>{rubles(total)}</strong>
              <button onClick={checkout}>Оформить заказ <ArrowRight /></button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

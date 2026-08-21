import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import type { Route } from '../types'

type Props = {
  cartCount: number
  onNavigate: (route: Route) => void
  onCart: () => void
}

export function SiteHeader({ cartCount, onNavigate, onCart }: Props) {
  const [open, setOpen] = useState(false)
  const navigate = (route: Route) => { onNavigate(route); setOpen(false) }

  return (
    <header className={open ? 'site-header site-header--menu-open' : 'site-header'}>
      <button className="wordmark" onClick={() => navigate({ name: 'home' })} aria-label="На главную">TRAPPOLA</button>
      <nav className={open ? 'nav nav--open' : 'nav'} aria-label="Основная навигация">
        <button onClick={() => navigate({ name: 'catalog' })}>Коллекции</button>
        <button onClick={() => navigate({ name: 'about' })}>О бренде</button>
        <button onClick={() => navigate({ name: 'delivery' })}>Доставка</button>
      </nav>
      <div className="header-actions">
        <button className="cart-trigger" onClick={onCart} aria-label={`Корзина, товаров: ${cartCount}`}>Корзина <span>{cartCount}</span></button>
        <button className="menu-trigger" onClick={() => setOpen((current) => !current)} aria-label={open ? 'Закрыть меню' : 'Открыть меню'}>{open ? <X /> : <Menu />}</button>
      </div>
    </header>
  )
}

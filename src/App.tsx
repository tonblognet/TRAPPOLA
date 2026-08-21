import { useEffect, useMemo, useState } from 'react'
import type { CartLine, OrderRecord, Product, Route } from './types'
import { useRouter } from './hooks/useRouter'
import { loadCatalog, publicProducts, resetCatalog, saveCatalog } from './lib/catalog'
import { addCartItem, CART_STORAGE_KEY, CART_STORAGE_VERSION, cartCount, changeCartQuantity, isCart, resolveCart } from './lib/cart'
import { loadOrders, saveOrder } from './lib/orders'
import { readVersioned, writeVersioned } from './lib/storage'
import { track } from './lib/analytics'
import { SiteHeader } from './components/SiteHeader'
import { SiteFooter } from './components/SiteFooter'
import { CartDrawer } from './components/CartDrawer'
import { HomePage } from './pages/HomePage'
import { CatalogPage } from './pages/CatalogPage'
import { ProductPage } from './pages/ProductPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { AboutPage, ContactsPage, DeliveryPage, NotFoundPage, OfferPage, PrivacyPage, ReturnsPage } from './pages/ContentPages'
import { StudioPage } from './pages/StudioPage'

const browserStorage = typeof window === 'undefined' ? undefined : window.localStorage

export default function App() {
  const { route, navigate: routeNavigate } = useRouter()
  const [products, setProducts] = useState<Product[]>(() => loadCatalog(browserStorage))
  const [cart, setCart] = useState<CartLine[]>(() => readVersioned(browserStorage, CART_STORAGE_KEY, CART_STORAGE_VERSION, [], isCart)
    .filter((line) => products.some((product) => product.id === line.productId)))
  const [orders, setOrders] = useState<OrderRecord[]>(() => loadOrders(browserStorage))
  const [cartOpen, setCartOpen] = useState(false)

  const visibleProducts = useMemo(() => publicProducts(products), [products])
  const resolvedCart = useMemo(() => resolveCart(cart, products), [cart, products])

  useEffect(() => writeVersioned(browserStorage, CART_STORAGE_KEY, CART_STORAGE_VERSION, cart), [cart])

  const navigate = (next: Route) => {
    setCartOpen(false)
    if (next.name === 'checkout') track('checkout_start', { items: cartCount(cart) })
    routeNavigate(next)
  }

  const addToCart = (product: Product, size: string, color: string) => {
    setCart((current) => addCartItem(current, { productId: product.id, size, color }))
    setCartOpen(true)
    track('add_to_cart', { product_id: product.id, product: product.name, size, color, price: product.price })
  }

  const saveProducts = (next: Product[]) => {
    saveCatalog(browserStorage, next)
    setProducts(next)
    setCart((current) => current.filter((line) => next.some((product) => product.id === line.productId)))
  }

  const restoreProducts = () => {
    const restored = resetCatalog(browserStorage)
    setProducts(restored)
    setCart((current) => current.filter((line) => restored.some((product) => product.id === line.productId)))
    return restored
  }

  const completeOrder = (order: OrderRecord) => {
    setOrders(saveOrder(browserStorage, order))
    setCart([])
  }

  const page = (() => {
    switch (route.name) {
      case 'home': return <HomePage products={visibleProducts} onNavigate={navigate} />
      case 'catalog': return <CatalogPage products={visibleProducts} onNavigate={navigate} />
      case 'about': return <AboutPage />
      case 'delivery': return <DeliveryPage />
      case 'returns': return <ReturnsPage />
      case 'contacts': return <ContactsPage />
      case 'privacy': return <PrivacyPage />
      case 'offer': return <OfferPage />
      case 'checkout': return <CheckoutPage cart={cart} resolvedCart={resolvedCart} onOrder={completeOrder} onNavigate={navigate} />
      case 'studio': return <StudioPage products={products} orders={orders} onSave={saveProducts} onReset={restoreProducts} />
      case 'product': {
        const product = visibleProducts.find((item) => item.slug === route.slug)
        return product ? <ProductPage key={product.id} product={product} onAdd={addToCart} /> : <NotFoundPage onNavigate={navigate} />
      }
      default: return <NotFoundPage onNavigate={navigate} />
    }
  })()

  if (route.name === 'studio') return page

  return (
    <div className="app">
      <SiteHeader cartCount={cartCount(cart)} onNavigate={navigate} onCart={() => setCartOpen(true)} />
      {page}
      <SiteFooter onNavigate={navigate} />
      <CartDrawer cart={resolvedCart} open={cartOpen} onClose={() => setCartOpen(false)} onQuantity={(index, delta) => setCart((current) => changeCartQuantity(current, index, delta))} onNavigate={navigate} />
    </div>
  )
}

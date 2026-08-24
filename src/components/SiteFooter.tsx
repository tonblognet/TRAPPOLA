import type { Route } from '../types'

export function SiteFooter({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <footer className="footer">
      <div className="footer-top">
        <strong>TRAPPOLA</strong>
        <div>
          <button onClick={() => onNavigate({ name: 'catalog' })}>Каталог</button>
          <button onClick={() => onNavigate({ name: 'about' })}>О бренде</button>
          <button onClick={() => onNavigate({ name: 'delivery' })}>Доставка и оплата</button>
          <button onClick={() => onNavigate({ name: 'returns' })}>Возврат</button>
          <button onClick={() => onNavigate({ name: 'contacts' })}>Контакты</button>
          <button onClick={() => onNavigate({ name: 'offer' })}>Оферта</button>
        </div>
        <address>
          Moscow / Russia<br />
          <a href="mailto:info@trappola.ru">info@trappola.ru</a>
          <span className="footer-seller">ИП Мельникова Елена Анатольевна<br />ИНН 773303945515</span>
        </address>
      </div>
      <div className="footer-bottom">
        <span>© TRAPPOLA 2026</span>
        <button onClick={() => onNavigate({ name: 'privacy' })}>Политика конфиденциальности</button>
      </div>
    </footer>
  )
}

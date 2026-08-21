import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Route } from '../types'
import { assetUrl } from '../lib/assets'
import { useDocumentMeta } from '../hooks/useDocumentMeta'

export function AboutPage() {
  useDocumentMeta({ title: 'О бренде — TRAPPOLA', description: 'TRAPPOLA начинается на границе повседневной улицы и ателье.' })
  return <main className="inner-page text-page"><span>TRAPPOLA / Москва</span><h1>Одежда<br />как форма<br />свободы</h1><div className="text-columns"><p>TRAPPOLA начинается на границе двух состояний: повседневной улицы и вещи, собранной почти как сценический костюм.</p><p>Первая линия — футболки и лонгсливы свободного силуэта. Затем появятся худи, брюки, костюмы, сумки, текстиль и парфюм для дома.</p></div><img src={assetUrl('collection-atelier.png')} alt="TRAPPOLA ATELIER" /></main>
}

export function DeliveryPage() {
  useDocumentMeta({ title: 'Доставка и оплата — TRAPPOLA', description: 'Предварительная информация о доставке, оплате и возврате заказов TRAPPOLA.' })
  return <main className="inner-page service-page"><div className="page-intro"><span>Информация</span><h1>Доставка<br />и оплата</h1><p>Финальные условия будут опубликованы до начала продаж.</p></div><div className="service-list"><section><span>01</span><h2>Оплата</h2><p>Платёжный сервис и онлайн-касса подключаются после получения реквизитов продавца. До этого сайт работает без списания денег.</p></section><section><span>02</span><h2>Доставка</h2><p>Планируется доставка по России. Перевозчик, тарифы и сроки будут указаны перед запуском продаж.</p></section><section><span>03</span><h2>Подтверждение</h2><p>После подключения системы заказов покупатель получит подтверждение и статус заказа на указанный email.</p></section></div></main>
}

export function ReturnsPage() {
  useDocumentMeta({ title: 'Возврат — TRAPPOLA', description: 'Предварительная информация о возврате товаров TRAPPOLA.' })
  return <DraftLegalPage index="02" title={<>Возврат<br />товаров</>}><p>Эта страница подготовлена как технический шаблон. Сроки, адрес возврата, порядок обращения и реквизиты продавца будут заполнены после утверждения юридической схемы продаж.</p><p>До официального запуска информация на этой странице не является публичной офертой.</p></DraftLegalPage>
}

export function PrivacyPage() {
  useDocumentMeta({ title: 'Политика конфиденциальности — TRAPPOLA', description: 'Черновик политики обработки персональных данных TRAPPOLA.', noIndex: true })
  return <DraftLegalPage index="03" title={<>Политика<br />данных</>}><p>Технический шаблон подготовлен. Для финальной версии нужны наименование и реквизиты оператора персональных данных, адрес, цели и сроки обработки, перечень подключённых сервисов и контакт для обращений.</p><p>До заполнения реквизитов форма заказа работает только в демонстрационном режиме и не отправляет данные на сервер.</p></DraftLegalPage>
}

export function OfferPage() {
  useDocumentMeta({ title: 'Публичная оферта — TRAPPOLA', description: 'Черновик публичной оферты TRAPPOLA.', noIndex: true })
  return <DraftLegalPage index="04" title={<>Публичная<br />оферта</>}><p>Подготовлен каркас страницы. Финальный документ зависит от формы продавца, способов оплаты, доставки, возврата, гарантий и реквизитов.</p><p>Документ необходимо согласовать с юристом до подключения приёма платежей.</p></DraftLegalPage>
}

export function ContactsPage() {
  useDocumentMeta({ title: 'Контакты — TRAPPOLA', description: 'Контакты бренда одежды TRAPPOLA.' })
  return <main className="inner-page contact-page"><div className="page-intro"><span>Связь</span><h1>Контакты</h1><p>Москва, Россия<br /><a href="mailto:info@trappola.ru">info@trappola.ru</a></p></div><div className="service-list"><section><span>01</span><h2>Покупателям</h2><p>Вопросы о коллекциях, размерах, заказах и доставке: <a href="mailto:info@trappola.ru">info@trappola.ru</a>.</p></section><section><span>02</span><h2>Сотрудничество</h2><p>Контакты для съёмок, шоурумов и партнёрств будут добавлены перед запуском.</p></section></div></main>
}

export function NotFoundPage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  useDocumentMeta({ title: 'Страница не найдена — TRAPPOLA', description: 'Запрошенная страница не найдена.', noIndex: true })
  return <main className="checkout-success"><h1>404</h1><p>Такой страницы нет или она была перемещена.</p><button onClick={() => onNavigate({ name: 'home' })}>На главную <ArrowRight /></button></main>
}

function DraftLegalPage({ index, title, children }: { index: string; title: ReactNode; children: ReactNode }) {
  return <main className="inner-page legal-page"><div className="page-intro"><span>{index} / Технический шаблон</span><h1>{title}</h1><p>Требует заполнения реквизитов и юридической проверки перед запуском продаж.</p></div><div className="legal-copy">{children}</div></main>
}

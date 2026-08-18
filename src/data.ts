export type Product = {
  id: number
  name: string
  collection: string
  description: string
  price: number
  colors: string[]
  sizes: string[]
  sprite: 'tl' | 'tr' | 'bl' | 'br'
}

export const products: Product[] = [
  { id: 1, name: 'Футболка TR', collection: 'TR', description: 'Широкий рукав, свободный силуэт, тональный знак TR.', price: 6900, colors: ['Чёрный', 'Белый'], sizes: ['M–L', 'XL–XXL'], sprite: 'tl' },
  { id: 2, name: 'Лонгслив TR', collection: 'TR', description: 'Удлинённый прямой рукав без манжеты, знак TR у сердца.', price: 7900, colors: ['Чёрный', 'Белый'], sizes: ['M–L', 'XL–XXL'], sprite: 'tr' },
  { id: 3, name: 'Футболка «Угол»', collection: 'УГОЛ', description: 'Оверсайз-футболка с графическим принтом коллекции «Угол».', price: 7500, colors: ['Чёрный'], sizes: ['M–L', 'XL–XXL'], sprite: 'br' },
  { id: 4, name: 'Лонгслив «Угол»', collection: 'УГОЛ', description: 'Свободный лонгслив с угловой графикой и прямым рукавом.', price: 8500, colors: ['Графит'], sizes: ['M–L', 'XL–XXL'], sprite: 'br' },
  { id: 5, name: 'Футболка «Капкан»', collection: 'КАПКАН', description: 'Прямоугольный графический принт, плотный хлопок, оверсайз.', price: 7900, colors: ['Чёрный'], sizes: ['M–L', 'XL–XXL'], sprite: 'bl' },
  { id: 6, name: 'Лонгслив «Капкан»', collection: 'КАПКАН', description: 'Удлинённый лонгслив с монохромной графикой.', price: 8900, colors: ['Чёрный', 'Серый'], sizes: ['M–L', 'XL–XXL'], sprite: 'bl' },
]

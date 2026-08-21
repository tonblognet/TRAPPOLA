import type { CSSProperties } from 'react'
import type { Product } from '../types'
import { assetUrl } from '../lib/assets'

export function ProductVisual({ product }: { product: Product }) {
  if (product.images?.primary) {
    return (
      <span className="product-visual product-visual--photos" role="img" aria-label={product.images.alt}>
        <img src={assetUrl(product.images.primary)} alt="" />
        {product.images.hover ? <img className="product-visual__hover" src={assetUrl(product.images.hover)} alt="" /> : null}
      </span>
    )
  }

  return (
    <span
      className={`product-visual sprite-${product.sprite}`}
      role="img"
      aria-label={product.name}
      style={{ backgroundImage: `url(${assetUrl('products-sprite.png')})` } as CSSProperties}
    />
  )
}

import Link from 'next/link'

import type { PublicPharmacyCatalogProductProjection } from '@/features/pharmacy/contracts'
import { cn } from '@/lib/utils'
import { prescriptionRequirementLabel, publicCatalogAvailability } from '../lib/catalog-availability'
import { categoryLabel } from '../lib/categories'
import { formatMoney } from '../lib/money'
import { AddProductButton } from './AddProductButton'
import { ProductImage } from './ProductImage'

/** A catalogue card: photo well, serif title, one line of detail, red price and a round cart button. */
export function ProductCard({ product, locationId, orderingEnabled, size = 'md', className }: { product: PublicPharmacyCatalogProductProjection; locationId: string; orderingEnabled: boolean; size?: 'sm' | 'md'; className?: string }) {
  const availability = publicCatalogAvailability(product)
  const requirement = prescriptionRequirementLabel(product.prescriptionRequirement)
  const href = `/products/${encodeURIComponent(product.handle)}`
  const canAdd = orderingEnabled && availability.canOrder
  return <article className={cn('rx-drawer group relative flex min-w-0 flex-col overflow-hidden', className)}>
    <Link href={href} aria-label={`View ${product.title}`} className="rx-photo relative block aspect-[4/3] overflow-hidden">
      <ProductImage src={product.imageUrl} alt={product.title} fallbackLabel={product.title} sizes={size === 'sm' ? '(max-width: 1024px) 40vw, 12vw' : '(max-width: 1024px) 50vw, 22vw'} className="object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]" />
      {requirement && <span className="rx-plate absolute left-2 top-2 z-10 px-2 py-0.5 text-[12px] font-semibold">{requirement}</span>}
    </Link>
    <div className={cn('flex flex-1 flex-col', size === 'sm' ? 'px-2.5 pb-2.5 pt-2' : 'px-3 pb-3 pt-3 sm:px-4 sm:pb-4')}>
      {product.category && <p className="truncate text-[10.5px] text-muted-foreground sm:text-[13px]">{categoryLabel(product.category)}</p>}
      <h3 className={cn('mt-0.5 leading-snug', size === 'sm' ? 'text-[12px] font-medium' : 'rx-serif text-[16.5px] sm:text-[19px]')}>
        <Link href={href} className="line-clamp-2 break-words hover:text-primary">{product.title}</Link>
      </h3>
      {product.description && size === 'md' && <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground max-sm:hidden sm:text-[14px]">{product.description}</p>}
      <div className="mt-auto flex items-center justify-between gap-1 pt-1.5">
        <div className="min-w-0">
          <p className={cn('rx-num text-primary', size === 'sm' ? 'text-[13px] font-semibold' : 'rx-serif text-[19px] sm:text-[21px]')}>{formatMoney(product.priceAmount, product.currencyCode)}</p>
          {!availability.canOrder && <p className="text-[12.5px] text-muted-foreground">Unavailable</p>}
        </div>
        {canAdd && <AddProductButton locationId={locationId} productId={product.id} label={`Add ${product.title} to cart`} variant="round" discSize={size} />}
      </div>
    </div>
  </article>
}

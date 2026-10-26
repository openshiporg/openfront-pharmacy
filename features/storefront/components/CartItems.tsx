'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Minus, Plus, X } from 'lucide-react'

import type { PharmacyCartProjection } from '@/features/pharmacy/contracts'
import { prescriptionRequirementLabel } from '../lib/catalog-availability'
import { updateCartItem } from '../lib/data/cart'
import { formatMoney } from '../lib/money'
import { ProductImage } from './ProductImage'
import { trackClass } from './rx-ui'

const stepClass = 'grid size-8 place-items-center rounded-[4px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:opacity-50 max-sm:size-9'

export function CartItems({ items }: { items: PharmacyCartProjection['items'] }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function change(cartItemId: string, quantity: number) {
    setError('')
    startTransition(async () => {
      const result = await updateCartItem({ cartItemId, quantity })
      if (!result.success) return setError(result.error)
      router.refresh()
    })
  }

  return <div>
    <ul className="divide-y divide-[var(--rx-rule)]">
      {items.map((item) => {
        const requirement = prescriptionRequirementLabel(item.product.prescriptionRequirement)
        return <li key={item.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center">
          <Link href={`/products/${encodeURIComponent(item.product.handle)}`} className="relative size-[4.5rem] overflow-hidden rounded-[4px] border border-border bg-muted sm:size-20"><ProductImage src={item.product.imageUrl} alt="" sizes="80px" /></Link>
          <div className="min-w-0">
            <h3 className="font-semibold leading-snug">{item.product.title}</h3>
            <p className="rx-num mt-1 text-sm text-muted-foreground">{formatMoney(item.unitPriceAmount, item.product.currencyCode)}</p>
            {requirement && <p className="mt-1 text-[13px] font-medium text-accent-foreground">{requirement}</p>}
          </div>
          <div className="col-start-2 flex items-center justify-between gap-3 sm:col-start-auto sm:justify-end">
            <div role="group" aria-label={`Quantity of ${item.product.title}`} className={`${trackClass} gap-1`}>
              <button type="button" aria-label={`Decrease ${item.product.title}`} disabled={pending} className={stepClass} onClick={() => change(item.id, item.quantity - 1)}><Minus className="size-3.5" /></button>
              <span className="rx-num w-6 text-center text-sm" aria-live="polite">{item.quantity}</span>
              <button type="button" aria-label={`Increase ${item.product.title}`} disabled={pending} className={stepClass} onClick={() => change(item.id, item.quantity + 1)}><Plus className="size-3.5" /></button>
            </div>
            <span className="rx-num w-20 text-right text-sm font-medium">{formatMoney(item.unitPriceAmount * item.quantity, item.product.currencyCode)}</span>
            <button type="button" aria-label={`Remove ${item.product.title}`} disabled={pending} className="grid size-10 place-items-center rounded-[4px] text-muted-foreground hover:bg-muted hover:text-destructive" onClick={() => change(item.id, 0)}><X className="size-4" /></button>
          </div>
        </li>
      })}
    </ul>
    {error && <p role="alert" className="mt-4 rounded-[4px] bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
  </div>
}

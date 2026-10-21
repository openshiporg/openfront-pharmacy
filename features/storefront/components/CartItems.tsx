'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Trash2 } from 'lucide-react'

import type { PharmacyCartProjection } from '@/features/pharmacy/contracts'
import { updateCartItem } from '../lib/data/cart'
import { formatMoney } from '../lib/money'
import { ProductImage } from './ProductImage'

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
    <ul className="divide-y divide-border border-y border-border">
      {items.map((item) => <li key={item.id} className="flex items-center gap-4 py-5">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted"><ProductImage src={item.product.imageUrl} alt="" sizes="64px" /></div>
        <div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{item.product.title}</h3><p className="text-sm text-muted-foreground">{formatMoney(item.unitPriceAmount, item.product.currencyCode)}</p></div>
        <div className="flex items-center gap-1 rounded-full border border-border p-1">
          <button type="button" aria-label={`Decrease ${item.product.title}`} disabled={pending} className="grid size-9 place-items-center" onClick={() => change(item.id, item.quantity - 1)}><Minus className="size-3" /></button>
          <span className="w-6 text-center text-sm">{item.quantity}</span>
          <button type="button" aria-label={`Increase ${item.product.title}`} disabled={pending} className="grid size-9 place-items-center" onClick={() => change(item.id, item.quantity + 1)}><Plus className="size-3" /></button>
        </div>
        <button type="button" aria-label={`Remove ${item.product.title}`} disabled={pending} className="grid size-9 place-items-center text-muted-foreground hover:text-destructive" onClick={() => change(item.id, 0)}><Trash2 className="size-4" /></button>
      </li>)}
    </ul>
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
  </div>
}

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Minus, Plus, ShoppingCart } from 'lucide-react'

import { cn } from '@/lib/utils'
import { addToCart } from '../lib/data/cart'
import { buttonClass } from './rx-ui'

/**
 * Adds a product to the cart. `round` is the card's red cart disc (label is its accessible name);
 * `block` is the full-width button with an optional quantity stepper on the product page.
 */
export function AddProductButton({ locationId, productId, label = 'Add to cart', className, align = 'end', variant = 'block', withQuantity = false, discSize = 'md' }: { locationId: string; productId: string; label?: string; className?: string; align?: 'start' | 'end'; variant?: 'block' | 'round'; withQuantity?: boolean; discSize?: 'sm' | 'md' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [pending, startTransition] = useTransition()

  function add() {
    setError('')
    setAdded(false)
    startTransition(async () => {
      const result = await addToCart({ locationId, productId, quantity })
      if (!result.success) return setError(result.error)
      setAdded(true)
      router.refresh()
    })
  }

  if (variant === 'round') return <div className="relative shrink-0">
    {/* The button is the full tap area; the painted disc inside is the design's small round cart. */}
    <button type="button" disabled={pending} onClick={add} aria-label={added ? `${label}: added` : label} title={error || undefined} className={cn('group/cart grid place-items-center rounded-[999px] transition-transform active:scale-95 disabled:opacity-70', discSize === 'sm' ? '-m-2 size-12' : '-m-1 size-12', className)}>
      <span className={cn('grid place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_3px_8px_-3px_oklch(0.5_0.19_25/0.7)] group-hover/cart:brightness-110', discSize === 'sm' ? 'size-6' : 'size-10')}>
        {pending ? <Loader2 aria-hidden="true" className={cn('animate-spin', discSize === 'sm' ? 'size-3' : 'size-[18px]')} /> : added ? <Check aria-hidden="true" className={discSize === 'sm' ? 'size-3' : 'size-[18px]'} /> : <ShoppingCart aria-hidden="true" strokeWidth={1.8} className={discSize === 'sm' ? 'size-3' : 'size-[18px]'} />}
      </span>
    </button>
    <span aria-live="polite" className="sr-only">{added ? 'Added to cart' : error}</span>
    {error && <p role="alert" className="absolute bottom-full right-0 mb-1 w-44 rounded-[4px] bg-card p-2 text-[12px] text-destructive shadow-[0_0_0_1px_var(--rx-rule)]">{error}</p>}
  </div>

  return <div className={cn('grid gap-3', align === 'end' ? 'justify-items-end text-right' : 'justify-items-stretch')}>
    {withQuantity && <div>
      <p className="rx-serif text-[18px]">Quantity</p>
      <div role="group" aria-label="Quantity" className="mt-2 inline-flex h-11 items-stretch overflow-hidden rounded-[6px] border border-input bg-card">
        <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1 || pending} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid w-11 place-items-center text-muted-foreground hover:bg-muted disabled:opacity-40"><Minus className="size-4" /></button>
        <span className="rx-num grid w-16 place-items-center border-x border-input text-[16px]" aria-live="polite">{quantity}</span>
        <button type="button" aria-label="Increase quantity" disabled={quantity >= 20 || pending} onClick={() => setQuantity((value) => Math.min(20, value + 1))} className="grid w-11 place-items-center text-muted-foreground hover:bg-muted disabled:opacity-40"><Plus className="size-4" /></button>
      </div>
    </div>}
    <button type="button" disabled={pending} onClick={add} className={cn(buttonClass, 'rounded-full', className)}>
      {added ? <Check aria-hidden="true" className="size-[18px]" /> : <ShoppingCart aria-hidden="true" strokeWidth={1.8} className="size-[18px]" />}
      {pending ? 'Adding…' : added ? 'Added to cart' : label}
    </button>
    {added && <Link href="/cart" className="text-[14px] font-semibold text-primary underline-offset-4 hover:underline">View cart</Link>}
    {error && <p role="alert" className="text-[13px] text-destructive">{error}</p>}
  </div>
}

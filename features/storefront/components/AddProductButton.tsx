'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { addToCart } from '../lib/data/cart'
import { buttonClass } from './rx-ui'

export function AddProductButton({ locationId, productId, label = 'Add to cart', className, align = 'end', compact = false }: { locationId: string; productId: string; label?: string; className?: string; align?: 'start' | 'end'; compact?: boolean }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)
  const [pending, startTransition] = useTransition()

  function add() {
    setError('')
    setAdded(false)
    startTransition(async () => {
      const result = await addToCart({ locationId, productId })
      if (!result.success) return setError(result.error)
      setAdded(true)
      router.refresh()
    })
  }

  return <div className={cn('grid gap-1.5', align === 'end' ? 'justify-items-end text-right' : 'justify-items-start')}>
    <button type="button" disabled={pending} onClick={add} className={cn(buttonClass, compact && 'min-h-10 px-4 max-sm:min-h-11', className)}>
      {added ? <Check aria-hidden="true" className="size-4" /> : <Plus aria-hidden="true" className="size-4" />}
      {pending ? 'Adding…' : added ? 'Added' : label}
    </button>
    {added && <Link href="/cart" className="text-xs font-semibold text-primary underline-offset-4 hover:underline">View cart</Link>}
    {error && <p role="alert" className="max-w-60 text-xs text-destructive">{error}</p>}
  </div>
}

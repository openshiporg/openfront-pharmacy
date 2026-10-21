'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { addToCart } from '../lib/data/cart'

export function AddProductButton({ locationId, productId, label = 'Add to cart', className, align = 'end' }: { locationId: string; productId: string; label?: string; className?: string; align?: 'start' | 'end' }) {
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

  return <div className={`grid gap-2 ${align === 'end' ? 'justify-items-end text-right' : 'justify-items-start'}`}>
    <Button type="button" disabled={pending} onClick={add} className={className ?? 'rounded-full'}>{pending ? 'Adding…' : label}</Button>
    {added && <Link href="/cart" className="text-xs font-semibold text-primary underline-offset-4 hover:underline">Added · View cart</Link>}
    {error && <p role="alert" className="max-w-56 text-xs text-destructive">{error}</p>}
  </div>
}

'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Callout, RxButton as Button } from '@/features/platform/components/rx-ui'
import { updateLocationContact } from '../actions'

type Address = { line1?: string; line2?: string; city?: string; region?: string; postalCode?: string }

export function LocationContactForm({ id, name, phone, address }: { id: string; name: string; phone?: string | null; address?: Address | null }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const value = (key: string) => String(data.get(key) || '')
    setError('')
    startTransition(async () => {
      const result = await updateLocationContact(id, { name: value('name'), phone: value('phone'), line1: value('line1'), line2: value('line2'), city: value('city'), region: value('region'), postalCode: value('postalCode') })
      if (!result.success) return setError(result.error)
      toast.success('Location saved')
      router.refresh()
    })
  }

  const field = (key: string, label: string, defaultValue?: string | null, extra?: Record<string, unknown>) => <div className="grid gap-1.5"><Label htmlFor={`loc-${key}`}>{label}</Label><Input id={`loc-${key}`} name={key} defaultValue={defaultValue || ''} {...extra} /></div>

  return <form onSubmit={submit} className="grid gap-3">
    <div className="grid gap-3 sm:grid-cols-2">{field('name', 'Name', name, { required: true, maxLength: 120 })}{field('phone', 'Phone', phone, { type: 'tel', maxLength: 40 })}</div>
    <div className="grid gap-3 sm:grid-cols-2">{field('line1', 'Street', address?.line1, { required: true })}{field('line2', 'Suite (optional)', address?.line2)}</div>
    <div className="grid gap-3 sm:grid-cols-3">{field('city', 'City', address?.city, { required: true })}{field('region', 'State', address?.region)}{field('postalCode', 'ZIP code', address?.postalCode, { required: true, inputMode: 'numeric' })}</div>
    {error && <Callout tone="danger">{error}</Callout>}
    <Button type="submit" disabled={pending} className="w-fit">{pending ? 'Saving…' : 'Save'}</Button>
  </form>
}

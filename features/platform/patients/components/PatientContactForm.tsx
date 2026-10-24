'use client'

import { useRef, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Callout, Pill, RxButton as Button, Track } from '@/features/platform/components/rx-ui'
import { updatePatientContactAction } from '../actions'

const METHODS = [['phone', 'Phone'], ['sms', 'SMS'], ['email', 'Email'], ['portal', 'Portal'], ['none', 'None']] as const
type Address = { line1?: string; line2?: string; city?: string; region?: string; postalCode?: string }

export function PatientContactForm({ patientId, email, phone, preferredContactMethod, address }: { patientId: string; email?: string | null; phone?: string | null; preferredContactMethod: string; address?: Address | null }) {
  const router = useRouter()
  const [method, setMethod] = useState(preferredContactMethod || 'none')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  // One key per edit, reused on retry.
  const key = useRef<string | null>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const value = (name: string) => String(data.get(name) || '').trim()
    const nextAddress = { line1: value('line1'), line2: value('line2'), city: value('city'), region: value('region'), postalCode: value('postalCode') }
    key.current ||= `patient-contact:${patientId}:${crypto.randomUUID()}`
    setError('')
    startTransition(async () => {
      const result = await updatePatientContactAction({ patientId, email: value('email'), phone: value('phone'), preferredContactMethod: method, address: nextAddress.line1 ? nextAddress : null, idempotencyKey: key.current!, reason: value('reason'), attested: data.get('attested') === 'on' })
      if (!result.success) return setError(result.error)
      key.current = null
      toast.success('Contact updated')
      router.refresh()
    })
  }

  return <form onSubmit={submit} className="grid gap-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5"><Label htmlFor="pc-email">Email</Label><Input id="pc-email" name="email" type="email" defaultValue={email || ''} /></div>
      <div className="grid gap-1.5"><Label htmlFor="pc-phone">Phone</Label><Input id="pc-phone" name="phone" type="tel" defaultValue={phone || ''} /></div>
    </div>
    <div className="grid gap-1.5"><span className="text-sm font-medium">Preferred contact</span><Track label="Preferred contact" className="w-fit">{METHODS.map(([value, label]) => <Pill key={value} active={method === value} onClick={() => setMethod(value)}>{label}</Pill>)}</Track></div>
    <div className="grid gap-3 sm:grid-cols-2"><div className="grid gap-1.5"><Label htmlFor="pc-line1">Street</Label><Input id="pc-line1" name="line1" defaultValue={address?.line1 || ''} /></div><div className="grid gap-1.5"><Label htmlFor="pc-line2">Unit</Label><Input id="pc-line2" name="line2" defaultValue={address?.line2 || ''} /></div></div>
    <div className="grid gap-3 sm:grid-cols-3"><div className="grid gap-1.5"><Label htmlFor="pc-city">City</Label><Input id="pc-city" name="city" defaultValue={address?.city || ''} /></div><div className="grid gap-1.5"><Label htmlFor="pc-region">State</Label><Input id="pc-region" name="region" defaultValue={address?.region || ''} /></div><div className="grid gap-1.5"><Label htmlFor="pc-zip">ZIP code</Label><Input id="pc-zip" name="postalCode" defaultValue={address?.postalCode || ''} /></div></div>
    <div className="grid gap-1.5"><Label htmlFor="pc-reason">Reason</Label><Input id="pc-reason" name="reason" minLength={3} required /></div>
    <label className="flex items-start gap-2.5 text-sm"><input type="checkbox" name="attested" required className="mt-0.5 size-4" />I confirmed this change with the patient.</label>
    {error && <Callout tone="danger">{error}</Callout>}
    <Button type="submit" disabled={pending} className="w-fit">{pending ? 'Saving…' : 'Save contact'}</Button>
  </form>
}

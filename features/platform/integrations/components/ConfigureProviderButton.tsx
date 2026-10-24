'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Callout, RxButton as Button } from '@/features/platform/components/rx-ui'
import { configureIntegrationProvider } from '../actions'

/** Endpoint and credential setup for an eRx or insurance provider. Credentials are write-only. */
export function ConfigureProviderButton({ providerId, name, providerType }: { providerId: string; name: string; providerType: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const erx = providerType === 'erx'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const value = (key: string) => String(data.get(key) || '').trim()
    setError('')
    startTransition(async () => {
      const result = await configureIntegrationProvider(providerId, { baseUrl: value('baseUrl'), validationPath: value('validationPath'), submitPath: value('submitPath'), statusPath: value('statusPath'), prescriberValidationPath: erx ? value('prescriberValidationPath') : undefined, bearerToken: value('bearerToken'), webhookSecret: value('webhookSecret') })
      if (!result.success) return setError(result.error)
      toast.success(`${name} configured`)
      setOpen(false)
      router.refresh()
    })
  }

  const field = (key: string, label: string, extra: Record<string, unknown> = {}) => <div className="grid gap-1.5"><Label htmlFor={`cfg-${key}`}>{label}</Label><Input id={`cfg-${key}`} name={key} required {...extra} className="font-mono text-sm" /></div>

  return <>
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Configure</Button>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto p-5 sm:max-w-md">
        <SheetTitle>{name}</SheetTitle>
        <form onSubmit={submit} className="mt-5 grid gap-3">
          {field('baseUrl', 'Base URL', { type: 'url', placeholder: 'https://' })}
          {field('validationPath', 'Health check path', { placeholder: '/health' })}
          {field('submitPath', 'Submit path')}
          {field('statusPath', 'Status path')}
          {erx && field('prescriberValidationPath', 'Prescriber validation path (with {npi})', { placeholder: '/prescribers/{npi}' })}
          {field('bearerToken', 'Bearer token', { type: 'password', minLength: 16, autoComplete: 'off' })}
          {field('webhookSecret', 'Webhook secret', { type: 'password', minLength: 32, autoComplete: 'off' })}
          {error && <Callout tone="danger">{error}</Callout>}
          <Button type="submit" disabled={pending} className="w-fit">{pending ? 'Checking connection…' : 'Save and verify'}</Button>
        </form>
      </SheetContent>
    </Sheet>
  </>
}

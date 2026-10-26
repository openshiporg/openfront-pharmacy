'use client'

import { useActionState, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buttonClass } from '../../../components/rx-ui'
import { updateCustomerEmail, updateCustomerName, updateCustomerPassword } from '../../../lib/data/user'

const initial = { success: false, error: null as string | null }
const inputClass = 'h-11 rounded-[4px] bg-background'

function Status({ state, message }: { state: typeof initial; message: string }) {
  if (state.error) return <p role="alert" className="text-sm text-destructive">{state.error}</p>
  return state.success ? <p role="status" className="text-sm font-medium text-primary">{message}</p> : null
}

function Row({ title, action, children }: { title: string; action: (formData: FormData) => void; children: ReactNode }) {
  return <form action={action} className="grid gap-4 px-4 py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:px-5">
    <h2 className="font-semibold">{title}</h2>
    <div className="grid gap-3">{children}</div>
  </form>
}

export function ProfileName({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateCustomerName, initial)
  return <Row title="Name" action={action}>
    <Label htmlFor="profile-name" className="sr-only">Name</Label>
    <Input id="profile-name" name="name" defaultValue={name} autoComplete="name" maxLength={120} required className={inputClass} />
    <Status state={state} message="Name updated." />
    <button type="submit" disabled={pending} className={`${buttonClass} w-fit min-h-10`}>{pending ? 'Saving…' : 'Save'}</button>
  </Row>
}

export function ProfileEmail({ email }: { email: string }) {
  const [state, action, pending] = useActionState(updateCustomerEmail, initial)
  return <Row title="Email" action={action}>
    <div className="grid gap-2"><Label htmlFor="profile-email">New email</Label><Input id="profile-email" name="email" type="email" defaultValue={email} autoComplete="email" maxLength={254} required className={inputClass} /></div>
    <div className="grid gap-2"><Label htmlFor="profile-email-password">Current password</Label><Input id="profile-email-password" name="currentPassword" type="password" autoComplete="current-password" required className={inputClass} /></div>
    <Status state={state} message="Email updated." />
    <button type="submit" disabled={pending} className={`${buttonClass} w-fit min-h-10`}>{pending ? 'Saving…' : 'Save'}</button>
  </Row>
}

export function ProfilePassword() {
  const [state, action, pending] = useActionState(updateCustomerPassword, initial)
  return <Row title="Password" action={action}>
    <div className="grid gap-2"><Label htmlFor="profile-current-password">Current password</Label><Input id="profile-current-password" name="currentPassword" type="password" autoComplete="current-password" required className={inputClass} /></div>
    <div className="grid gap-2"><Label htmlFor="profile-password">New password</Label><Input id="profile-password" name="password" type="password" autoComplete="new-password" minLength={12} required className={inputClass} /></div>
    <div className="grid gap-2"><Label htmlFor="profile-password-confirm">Confirm new password</Label><Input id="profile-password-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required className={inputClass} /></div>
    <Status state={state} message="Password updated." />
    <button type="submit" disabled={pending} className={`${buttonClass} w-fit min-h-10`}>{pending ? 'Saving…' : 'Change password'}</button>
  </Row>
}

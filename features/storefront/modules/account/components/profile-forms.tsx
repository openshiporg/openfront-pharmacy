'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateCustomerEmail, updateCustomerName, updateCustomerPassword } from '../../../lib/data/user'

const initial = { success: false, error: null as string | null }

function Status({ state, message }: { state: typeof initial; message: string }) {
  if (state.error) return <p role="alert" className="text-sm text-destructive">{state.error}</p>
  return state.success ? <p role="status" className="text-sm text-primary">{message}</p> : null
}

export function ProfileName({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateCustomerName, initial)
  return <form action={action} className="space-y-3 rounded-xl bg-card p-5">
    <Label htmlFor="profile-name">Name</Label>
    <Input id="profile-name" name="name" defaultValue={name} autoComplete="name" maxLength={120} required />
    <Status state={state} message="Name updated." />
    <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
  </form>
}

export function ProfileEmail({ email }: { email: string }) {
  const [state, action, pending] = useActionState(updateCustomerEmail, initial)
  return <form action={action} className="space-y-3 rounded-xl bg-card p-5">
    <Label htmlFor="profile-email">Email</Label>
    <Input id="profile-email" name="email" type="email" defaultValue={email} autoComplete="email" maxLength={254} required />
    <Status state={state} message="Email updated." />
    <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
  </form>
}

export function ProfilePassword() {
  const [state, action, pending] = useActionState(updateCustomerPassword, initial)
  return <form action={action} className="space-y-3 rounded-xl bg-card p-5">
    <Label htmlFor="profile-password">New password</Label>
    <Input id="profile-password" name="password" type="password" autoComplete="new-password" minLength={12} required />
    <Label htmlFor="profile-password-confirm">Confirm new password</Label>
    <Input id="profile-password-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required />
    <Status state={state} message="Password updated." />
    <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Change password'}</Button>
  </form>
}

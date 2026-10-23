'use client'

import { useActionState } from 'react'
import Link from 'next/link'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Notice, buttonClass } from '../components/rx-ui'
import { requestPasswordReset, resetPassword } from '../lib/data/user'

const inputClass = 'h-11 rounded-xl bg-background'

export function ResetPasswordPage({ token, email }: { token?: string; email?: string }) {
  const [requestState, requestAction, requestPending] = useActionState(requestPasswordReset, { sent: false, error: null })
  const [resetState, resetAction, resetPending] = useActionState(resetPassword, { done: false, error: null })

  return <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8">
    <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
    {token
      ? resetState.done
        ? <Notice tone="brand" className="mt-6">Password changed.</Notice>
        : <form action={resetAction} className="mt-6 grid gap-5">
          <input type="hidden" name="token" value={token} />
          <div className="grid gap-2"><Label htmlFor="reset-email">Email</Label><Input id="reset-email" name="email" type="email" autoComplete="email" defaultValue={email} readOnly={Boolean(email)} required className={inputClass} /></div>
          <div className="grid gap-2"><Label htmlFor="reset-password">New password</Label><Input id="reset-password" name="password" type="password" autoComplete="new-password" minLength={12} required className={inputClass} /></div>
          {resetState.error && <p role="alert" className="text-sm text-destructive">{resetState.error}</p>}
          <button type="submit" disabled={resetPending} className={`${buttonClass} min-h-12 w-full`}>{resetPending ? 'Saving…' : 'Change password'}</button>
        </form>
      : requestState.sent
        ? <Notice tone="brand" className="mt-6">If an account exists for that email, a reset link is on its way.</Notice>
        : <form action={requestAction} className="mt-6 grid gap-5">
          <div className="grid gap-2"><Label htmlFor="reset-request-email">Email</Label><Input id="reset-request-email" name="email" type="email" autoComplete="email" required className={inputClass} /></div>
          {requestState.error && <p role="alert" className="text-sm text-destructive">{requestState.error}</p>}
          <button type="submit" disabled={requestPending} className={`${buttonClass} min-h-12 w-full`}>{requestPending ? 'Sending…' : 'Send reset link'}</button>
        </form>}
    <Link href="/account" className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-primary">Back to sign in</Link>
  </div>
}

export default ResetPasswordPage

'use client'

import { useActionState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset, resetPassword } from '../lib/data/user'

export function ResetPasswordPage({ token }: { token?: string }) {
  const [requestState, requestAction, requestPending] = useActionState(requestPasswordReset, { sent: false, error: null })
  const [resetState, resetAction, resetPending] = useActionState(resetPassword, { done: false, error: null })

  return <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 sm:p-10">
    <h1 className="text-3xl font-semibold tracking-tight">Reset password</h1>
    {token
      ? resetState.done
        ? <p className="mt-6 text-sm">Your password was changed. <Link href="/account" className="font-semibold text-primary">Sign in</Link></p>
        : <form action={resetAction} className="mt-8 space-y-5">
          <input type="hidden" name="token" value={token} />
          <div className="space-y-2"><Label htmlFor="reset-email">Email</Label><Input id="reset-email" name="email" type="email" autoComplete="email" required /></div>
          <div className="space-y-2"><Label htmlFor="reset-password">New password</Label><Input id="reset-password" name="password" type="password" autoComplete="new-password" minLength={12} required /></div>
          {resetState.error && <p role="alert" className="text-sm text-destructive">{resetState.error}</p>}
          <Button type="submit" disabled={resetPending} className="h-11 w-full rounded-full">{resetPending ? 'Saving…' : 'Change password'}</Button>
        </form>
      : requestState.sent
        ? <p className="mt-6 text-sm">If an account exists for that email, we sent a link to reset the password.</p>
        : <form action={requestAction} className="mt-8 space-y-5">
          <div className="space-y-2"><Label htmlFor="reset-request-email">Email</Label><Input id="reset-request-email" name="email" type="email" autoComplete="email" required /></div>
          {requestState.error && <p role="alert" className="text-sm text-destructive">{requestState.error}</p>}
          <Button type="submit" disabled={requestPending} className="h-11 w-full rounded-full">{requestPending ? 'Sending…' : 'Send reset link'}</Button>
        </form>}
    <Link href="/account" className="mt-8 inline-block text-sm font-medium text-primary">Back to sign in</Link>
  </div>
}

export default ResetPasswordPage

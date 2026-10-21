'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, signUp } from '../lib/data/user'

export function LoginPage({ from }: { from?: string }) {
  const [view, setView] = useState<'signin' | 'signup'>('signin')
  const [signinError, signinAction, signinPending] = useActionState(login, null)
  const [signupError, signupAction, signupPending] = useActionState(signUp, null)

  return <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 sm:p-10">
    <h1 className="text-3xl font-semibold tracking-tight">{view === 'signin' ? 'Sign in' : 'Create account'}</h1>
    <p className="mt-2 text-sm text-muted-foreground">{view === 'signin' ? 'View your orders, prescriptions and refills.' : 'Track orders and request refills online.'}</p>

    {view === 'signin'
      ? <form action={signinAction} className="mt-8 space-y-5">
        {from && <input type="hidden" name="from" value={from} />}
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3"><Label htmlFor="password">Password</Label><Link href="/account/reset" className="text-sm text-primary hover:underline">Forgot password?</Link></div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {signinError && <p role="alert" className="text-sm font-medium text-destructive">{signinError}</p>}
        <Button type="submit" disabled={signinPending} className="h-11 w-full rounded-full">{signinPending && <Loader2 className="mr-2 size-4 animate-spin" />}Sign in</Button>
      </form>
      : <form action={signupAction} className="mt-8 space-y-5">
        {from && <input type="hidden" name="from" value={from} />}
        <div className="space-y-2"><Label htmlFor="signup-name">Full name</Label><Input id="signup-name" name="name" autoComplete="name" maxLength={120} required /></div>
        <div className="space-y-2"><Label htmlFor="signup-email">Email</Label><Input id="signup-email" name="email" type="email" autoComplete="email" maxLength={254} required /></div>
        <div className="space-y-2"><Label htmlFor="signup-password">Password</Label><Input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={1000} required /><p className="text-xs text-muted-foreground">At least 12 characters.</p></div>
        {signupError && <p role="alert" className="text-sm font-medium text-destructive">{signupError}</p>}
        <Button type="submit" disabled={signupPending} className="h-11 w-full rounded-full">{signupPending && <Loader2 className="mr-2 size-4 animate-spin" />}Create account</Button>
      </form>}

    <p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
      {view === 'signin' ? <>Don&apos;t have an account? <button type="button" onClick={() => setView('signup')} className="font-medium text-primary">Create one</button></> : <>Already have an account? <button type="button" onClick={() => setView('signin')} className="font-medium text-primary">Sign in</button></>}
    </p>
  </div>
}

export default LoginPage

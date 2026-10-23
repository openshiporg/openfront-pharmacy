'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pill, Track, buttonClass } from '../components/rx-ui'
import { login, signUp } from '../lib/data/user'

const inputClass = 'h-11 rounded-xl bg-background'

export function LoginPage({ from }: { from?: string }) {
  const [view, setView] = useState<'signin' | 'signup'>('signin')
  const [signinError, signinAction, signinPending] = useActionState(login, null)
  const [signupError, signupAction, signupPending] = useActionState(signUp, null)

  return <div className="w-full max-w-md">
    <Track label="Account access" className="mx-auto mb-6 flex w-fit">
      <Pill active={view === 'signin'} onClick={() => setView('signin')} className="min-w-32">Sign in</Pill>
      <Pill active={view === 'signup'} onClick={() => setView('signup')} className="min-w-32">Create account</Pill>
    </Track>
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{view === 'signin' ? 'Sign in' : 'Create account'}</h1>

      {view === 'signin'
        ? <form action={signinAction} className="mt-6 grid gap-5">
          {from && <input type="hidden" name="from" value={from} />}
          <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required className={inputClass} /></div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3"><Label htmlFor="password">Password</Label><Link href="/account/reset" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link></div>
            <Input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
          </div>
          {signinError && <p role="alert" className="text-sm font-medium text-destructive">{signinError}</p>}
          <button type="submit" disabled={signinPending} className={`${buttonClass} min-h-12 w-full`}>{signinPending && <Loader2 className="size-4 animate-spin" />}Sign in</button>
        </form>
        : <form action={signupAction} className="mt-6 grid gap-5">
          {from && <input type="hidden" name="from" value={from} />}
          <div className="grid gap-2"><Label htmlFor="signup-name">Full name</Label><Input id="signup-name" name="name" autoComplete="name" maxLength={120} required className={inputClass} /></div>
          <div className="grid gap-2"><Label htmlFor="signup-email">Email</Label><Input id="signup-email" name="email" type="email" autoComplete="email" maxLength={254} required className={inputClass} /></div>
          <div className="grid gap-2"><Label htmlFor="signup-password">Password</Label><Input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={1000} required aria-describedby="signup-password-rule" className={inputClass} /><p id="signup-password-rule" className="text-xs text-muted-foreground">At least 12 characters</p></div>
          {signupError && <p role="alert" className="text-sm font-medium text-destructive">{signupError}</p>}
          <button type="submit" disabled={signupPending} className={`${buttonClass} min-h-12 w-full`}>{signupPending && <Loader2 className="size-4 animate-spin" />}Create account</button>
        </form>}
    </div>
  </div>
}

export default LoginPage

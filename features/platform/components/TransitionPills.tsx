'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Callout, buttonClass } from './rx-ui'

export type TransitionResult = { success: true } | { success: false; error: string }

/**
 * Explicit state transitions as a row of outline buttons. Each option carries a bound server
 * action; the page refreshes after a successful transition.
 */
export function TransitionPills({ label, options }: { label: string; options: Array<{ label: string; action: () => Promise<TransitionResult>; danger?: boolean }> }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  if (!options.length) return null
  return <div className="grid gap-2">
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => <button key={option.label} type="button" disabled={pending} onClick={() => {
        setError('')
        startTransition(async () => {
          const result = await option.action()
          if (!result.success) return setError(result.error)
          router.refresh()
        })
      }} className={`${buttonClass} ${option.danger ? 'text-red-700 dark:text-red-400' : ''}`}>{option.label}</button>)}
    </div>
    {error && <Callout tone="danger">{error}</Callout>}
  </div>
}

'use client'

import { useState, useTransition } from 'react'
import { RxButton as Button } from '@/features/platform/components/rx-ui'
import type { PharmacyTaskOption } from '@/features/pharmacy/contracts'
import { linkPatientAccountAction } from '../actions'

export function PatientAccountLinkForm({ patientId, candidates }: { patientId: string; candidates: PharmacyTaskOption[] }) {
  const [userId, setUserId] = useState(candidates[0]?.id || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  if (!candidates.length) return <p className="text-sm text-muted-foreground">Create an unlinked user account before linking this patient.</p>
  return <div className="space-y-4"><label className="text-sm">User account<select value={userId} onChange={(event) => setUserId(event.target.value)} className="mt-2 block w-full rounded-lg border bg-background px-3 py-2">{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label} · {candidate.detail}</option>)}</select></label><Button disabled={pending || !userId} onClick={() => { setMessage(''); setError(''); startTransition(() => linkPatientAccountAction({ patientId, userId }).then((result) => setMessage(result.reused ? 'This account is already linked.' : 'Patient account linked.')).catch((cause) => setError(cause instanceof Error ? cause.message : 'Account link failed'))) }}>{pending ? 'Linking…' : 'Link patient account'}</Button>{message && <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}</div>
}

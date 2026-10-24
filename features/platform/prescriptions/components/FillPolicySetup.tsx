'use client'
import { useEffect, useState } from 'react'
import type { PharmacyTaskOption } from '@/features/pharmacy/contracts'
import { loadFillPolicyAction } from '../actions/fills'
import { Dot } from '@/features/platform/components/rx-ui'
import { PrescriptionFillWorkbench } from './PrescriptionFillWorkbench'
import { type ActionValue, unwrapAction } from '@/features/platform/lib/action-result'

export function FillPolicySetup({ organizations }: { organizations: PharmacyTaskOption[] }) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || '')
  const [readback, setReadback] = useState<ActionValue<typeof loadFillPolicyAction> | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setReadback(null); setError('')
    if (organizationId) unwrapAction(loadFillPolicyAction(organizationId)).then(value => { if (active) setReadback(value) }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Policy readback unavailable') })
    return () => { active = false }
  }, [organizationId])
  if (!organizations.length) return <p>Organization-wide membership required.</p>
  return <section className="space-y-4">
        <label className="block text-sm">Organization<select className="mt-2 block w-full rounded-lg border bg-background px-3 py-2" value={organizationId} onChange={e => setOrganizationId(e.target.value)}>{organizations.map(org => <option key={org.id} value={org.id}>{org.label}</option>)}</select></label>
    {readback && <><p className="flex items-baseline gap-2 text-sm font-medium"><Dot tone={readback.configured ? 'ok' : 'warn'} />{readback.configured ? `Configured · ${readback.version}` : 'Not configured'}</p><PrescriptionFillWorkbench key={organizationId} prescriptionId="" setupOnly onPolicyRecorded={() => unwrapAction(loadFillPolicyAction(organizationId)).then(setReadback).catch(cause => setError(cause instanceof Error ? cause.message : "Policy readback unavailable"))} workbench={{ organizationId, policyConfigured: readback.configured, canConfigure: true, items: [], fills: [], totalCount: 0, hasMore: false }} /></>}
    {!readback && !error && organizationId && <p role="status">Checking current policy authority…</p>}
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
  </section>
}

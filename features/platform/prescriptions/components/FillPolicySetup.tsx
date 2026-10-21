'use client'
import { useEffect, useState } from 'react'
import type { PharmacyTaskOption } from '@/features/pharmacy/contracts'
import { loadFillPolicyAction } from '../actions/fills'
import { PrescriptionFillWorkbench } from './PrescriptionFillWorkbench'

export function FillPolicySetup({ organizations }: { organizations: PharmacyTaskOption[] }) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || '')
  const [readback, setReadback] = useState<Awaited<ReturnType<typeof loadFillPolicyAction>> | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setReadback(null); setError('')
    if (organizationId) loadFillPolicyAction(organizationId).then(value => { if (active) setReadback(value) }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Policy readback unavailable') })
    return () => { active = false }
  }, [organizationId])
  if (!organizations.length) return <p>Organization-wide membership required.</p>
  return <section className="space-y-4 rounded-xl border p-5">
    <h2 className="font-semibold">Reviewed fill-entitlement policy</h2>
    <p className="text-sm text-muted-foreground">Configure before the first new prescription. Organization-wide credentialed pharmacist, organization-management and consequential-action authority are required. No policy is silently seeded.</p>
    <label className="block text-sm">Organization<select className="mt-2 block w-full rounded border bg-background p-2" value={organizationId} onChange={e => setOrganizationId(e.target.value)}>{organizations.map(org => <option key={org.id} value={org.id}>{org.label}</option>)}</select></label>
    {readback && <><p className="text-sm">Fill policy: {readback.configured ? `configured (${readback.version})` : 'not configured'}.</p><PrescriptionFillWorkbench key={organizationId} prescriptionId="" setupOnly onPolicyRecorded={() => loadFillPolicyAction(organizationId).then(setReadback).catch(cause => setError(cause instanceof Error ? cause.message : "Policy readback unavailable"))} workbench={{ organizationId, policyConfigured: readback.configured, canConfigure: true, items: [], fills: [], totalCount: 0, hasMore: false }} /></>}
    {!readback && !error && organizationId && <p role="status">Checking current policy authority…</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>
}

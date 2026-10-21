'use client'

import { decimalToMinorUnits } from '@/features/lib/minor-units'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PharmacyTaskOption } from '@/features/pharmacy/contracts'
import { recordCashPolicyAction, recordDrugReferenceReviewAction, recordPrescriberCredentialReviewAction, recordStaffCredentialReviewAction } from '../actions'

function defaultExpiry() {
  return new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10)
}

function EvidenceFields({ values, set }: { values: Record<string, string>; set: (key: string, value: string) => void }) {
  return <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-sm">Credential type<Input value={values.credentialType} onChange={(event) => set('credentialType', event.target.value)} placeholder="e.g. pharmacist license or prescriber license" className="mt-2" /></label>
    <label className="text-sm">Jurisdiction<Input value={values.jurisdiction} onChange={(event) => set('jurisdiction', event.target.value)} placeholder="State or other jurisdiction" className="mt-2" /></label>
    <label className="text-sm">Identifier<Input value={values.identifier} onChange={(event) => set('identifier', event.target.value)} placeholder="Operator-reviewed identifier" className="mt-2" /></label>
    <label className="text-sm">Review expires<Input type="date" min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)} value={values.expiresAt} onChange={(event) => set('expiresAt', event.target.value)} className="mt-2" /></label>
    <label className="text-sm sm:col-span-2">Source reference<Input value={values.verificationReference} onChange={(event) => set('verificationReference', event.target.value)} placeholder="Board lookup reference, dated document reference, or contracted-provider reference" className="mt-2" /></label>
    <label className="text-sm sm:col-span-2">Review reason<Input value={values.reason} onChange={(event) => set('reason', event.target.value)} placeholder="Describe what the authorized human reviewed" className="mt-2" /></label>
  </div>
}

function useEvidence() {
  const [values, setValues] = useState({ credentialType: '', jurisdiction: '', identifier: '', expiresAt: defaultExpiry(), verificationReference: '', reason: '' })
  return { values, set: (key: string, value: string) => setValues((current) => ({ ...current, [key]: value })) }
}

export function CredentialReviewForms({ organizations, memberships, prescribers, drugReferences }: { organizations: PharmacyTaskOption[]; memberships: PharmacyTaskOption[]; prescribers: PharmacyTaskOption[]; drugReferences: PharmacyTaskOption[] }) {
  const staff = useEvidence()
  const prescriber = useEvidence()
  const [drugReferenceId, setDrugReferenceId] = useState(drugReferences[0]?.id || '')
  const [drugSourceName, setDrugSourceName] = useState('')
  const [drugSourceVersion, setDrugSourceVersion] = useState('')
  const [drugSourceReference, setDrugSourceReference] = useState('')
  const [drugReason, setDrugReason] = useState('')
  const [drugAttested, setDrugAttested] = useState(false)
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || '')
  const [taxRatePercent, setTaxRatePercent] = useState('0')
  const [cashPolicyReference, setCashPolicyReference] = useState('')
  const [cashPolicyReason, setCashPolicyReason] = useState('')
  const [cashPolicyAttested, setCashPolicyAttested] = useState(false)
  const [membershipId, setMembershipId] = useState(memberships[0]?.id || '')
  const [prescriberId, setPrescriberId] = useState(prescribers[0]?.id || '')
  const [attestedStaff, setAttestedStaff] = useState(false)
  const [attestedPrescriber, setAttestedPrescriber] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const ready = (values: Record<string, string>, id: string, attested: boolean) => Boolean(id && attested && Object.values(values).every((value) => value.trim()) && values.reason.trim().length >= 8)
  const run = (task: () => Promise<{ status: string; expiresAt?: string }>) => { setError(''); setMessage(''); startTransition(() => task().then((result) => setMessage(result.expiresAt ? `Review evidence ${result.status}; current through ${new Date(result.expiresAt).toLocaleDateString()}.` : `Policy evidence ${result.status}.`)).catch((cause) => setError(cause instanceof Error ? cause.message : 'Review failed'))) }

  return <div className="space-y-8">
    <p className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">Record reviews performed by your pharmacy staff.</p>
    <section className="space-y-4 rounded-xl border p-5"><div><h2 className="font-semibold">Cash and tax policy review</h2><p className="mt-1 text-sm text-muted-foreground">Required for cash sales and cash dispensing.</p></div><label className="text-sm">Organization<select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} className="mt-2 block w-full rounded-md border bg-background px-3 py-2">{organizations.map((entry) => <option key={entry.id} value={entry.id}>{entry.label} · {entry.detail}</option>)}</select></label><label className="text-sm">Tax rate percent<Input inputMode="decimal" value={taxRatePercent} onChange={(event) => setTaxRatePercent(event.target.value)} className="mt-2" /></label><label className="text-sm">Policy source reference<Input value={cashPolicyReference} onChange={(event) => setCashPolicyReference(event.target.value)} className="mt-2" /></label><label className="text-sm">Review reason<Input value={cashPolicyReason} onChange={(event) => setCashPolicyReason(event.target.value)} className="mt-2" /></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={cashPolicyAttested} onChange={(event) => setCashPolicyAttested(event.target.checked)} className="mt-1" />I confirm this tax rate comes from the named source.</label><Button disabled={pending || !organizationId || !cashPolicyAttested || !cashPolicyReference.trim() || cashPolicyReason.trim().length < 8 || decimalToMinorUnits(taxRatePercent, 10000) === null} onClick={() => run(() => recordCashPolicyAction({ organizationId, taxRateBps: decimalToMinorUnits(taxRatePercent, 10000) ?? -1, policyReference: cashPolicyReference, reason: cashPolicyReason, attested: true }))}>Record cash/tax policy</Button></section>
    <section className="space-y-4 rounded-xl border p-5"><div><h2 className="font-semibold">Staff credential review</h2><p className="mt-1 text-sm text-muted-foreground">Required before pharmacist workflows.</p></div><label className="text-sm">Membership<select value={membershipId} onChange={(event) => setMembershipId(event.target.value)} className="mt-2 block w-full rounded-md border bg-background px-3 py-2">{memberships.map((entry) => <option key={entry.id} value={entry.id}>{entry.label} · {entry.detail}</option>)}</select></label><EvidenceFields values={staff.values} set={staff.set} /><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={attestedStaff} onChange={(event) => setAttestedStaff(event.target.checked)} className="mt-1" />I confirm I reviewed this credential against the named source.</label><Button disabled={pending || !ready(staff.values, membershipId, attestedStaff)} onClick={() => run(() => recordStaffCredentialReviewAction({ membershipId, ...staff.values, expiresAt: new Date(`${staff.values.expiresAt}T12:00:00.000Z`).toISOString(), attested: true }))}>Record staff review</Button></section>
    <section className="space-y-4 rounded-xl border p-5"><div><h2 className="font-semibold">Prescriber credential review</h2><p className="mt-1 text-sm text-muted-foreground">Requires a current staff review.</p></div><label className="text-sm">Prescriber<select value={prescriberId} onChange={(event) => setPrescriberId(event.target.value)} className="mt-2 block w-full rounded-md border bg-background px-3 py-2">{prescribers.map((entry) => <option key={entry.id} value={entry.id}>{entry.label} · {entry.detail}</option>)}</select></label><EvidenceFields values={prescriber.values} set={prescriber.set} /><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={attestedPrescriber} onChange={(event) => setAttestedPrescriber(event.target.checked)} className="mt-1" />I confirm I reviewed this prescriber against the named source.</label><Button disabled={pending || !ready(prescriber.values, prescriberId, attestedPrescriber)} onClick={() => run(() => recordPrescriberCredentialReviewAction({ prescriberId, ...prescriber.values, expiresAt: new Date(`${prescriber.values.expiresAt}T12:00:00.000Z`).toISOString(), attested: true }))}>Record prescriber review</Button></section>
    <section className="space-y-4 rounded-xl border p-5"><div><h2 className="font-semibold">Drug reference review</h2><p className="mt-1 text-sm text-muted-foreground">Only active, non-controlled items can be approved.</p></div><label className="text-sm">Drug reference<select value={drugReferenceId} onChange={(event) => setDrugReferenceId(event.target.value)} className="mt-2 block w-full rounded-md border bg-background px-3 py-2">{drugReferences.map((entry) => <option key={`${entry.scopeId}:${entry.id}`} value={entry.id}>{entry.label} · {entry.detail}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Source name<Input value={drugSourceName} onChange={(event) => setDrugSourceName(event.target.value)} className="mt-2" /></label><label className="text-sm">Source version/date<Input value={drugSourceVersion} onChange={(event) => setDrugSourceVersion(event.target.value)} className="mt-2" /></label><label className="text-sm sm:col-span-2">Source record reference<Input value={drugSourceReference} onChange={(event) => setDrugSourceReference(event.target.value)} className="mt-2" /></label><label className="text-sm sm:col-span-2">Review reason<Input value={drugReason} onChange={(event) => setDrugReason(event.target.value)} className="mt-2" /></label></div><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={drugAttested} onChange={(event) => setDrugAttested(event.target.checked)} className="mt-1" />I confirm the named source lists this item as active and non-controlled.</label><Button disabled={pending || !drugReferenceId || !drugAttested || !drugSourceName.trim() || !drugSourceVersion.trim() || !drugSourceReference.trim() || drugReason.trim().length < 8} onClick={() => { const option = drugReferences.find((entry) => entry.id === drugReferenceId); if (!option) return; run(() => recordDrugReferenceReviewAction({ organizationId: option.scopeId, drugReferenceId, marketingStatus: 'active', controlledSchedule: 'none', sourceName: drugSourceName, sourceVersion: drugSourceVersion, sourceReference: drugSourceReference, reason: drugReason, attested: true })) }}>Record non-controlled drug review</Button></section>
    {message && <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900">{message}</p>}{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{error}</p>}
  </div>
}

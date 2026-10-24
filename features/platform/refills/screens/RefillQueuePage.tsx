import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import { OperationalPage, type OperationalItem } from '@/features/platform/components/OperationalPage'
import { shortDate } from '../../lib/mutate'

type Refill = {
  id: string; status: string; requestNote?: string | null; resolutionNote?: string | null; requestedAt: string; resolvedAt?: string | null
  patient?: { id: string; displayName?: string | null } | null
  prescription?: { id: string; prescriptionNumber: string; status: string } | null
  prescriptionItem?: { medicationNameSnapshot?: string | null; refillsRemaining: number } | null
  location?: { name: string } | null
}

const OPEN = ['requested', 'under_review', 'prescriber_contacted']

export async function RefillQueuePage() {
  const response = await keystoneClient<{ refillRequests: Refill[] }>('query Refills { refillRequests(orderBy: [{ requestedAt: desc }], take: 200) { id status requestNote resolutionNote requestedAt resolvedAt patient { id displayName } prescription { id prescriptionNumber status } prescriptionItem { medicationNameSnapshot refillsRemaining } location { name } } }')
  const refills = response.success ? response.data.refillRequests : []
  // Open requests first, oldest first, so the longest-waiting patient is at the top.
  const ordered = [...refills.filter((refill) => OPEN.includes(refill.status)).reverse(), ...refills.filter((refill) => !OPEN.includes(refill.status))]
  const items: OperationalItem[] = ordered.map((refill) => ({
    id: refill.id,
    href: refill.prescription ? `/dashboard/platform/prescriptions/${refill.prescription.id}` : undefined,
    title: refill.prescriptionItem?.medicationNameSnapshot || 'Medication',
    subtitle: `${refill.prescription?.prescriptionNumber || 'Prescription'} · ${refill.patient?.displayName || 'Patient'}${refill.location ? ` · ${refill.location.name}` : ''}`,
    status: refill.status,
    details: [
      { label: 'Requested', value: shortDate(refill.requestedAt) },
      { label: 'Refills left', value: String(refill.prescriptionItem?.refillsRemaining ?? 'Not reported') },
      { label: 'Patient note', value: refill.requestNote || 'None' },
      { label: 'Prescription', value: refill.prescription?.status.replaceAll('_', ' ') || 'Not reported' },
      { label: 'Resolution', value: refill.resolutionNote || (refill.resolvedAt ? shortDate(refill.resolvedAt) : 'Open') },
    ],
  }))
  return <OperationalPage title="Refills" description="" items={items} emptyMessage="No refill requests yet" error={response.success ? undefined : response.error} attentionStatuses={['requested', 'under_review', 'prescriber_contacted']} />
}

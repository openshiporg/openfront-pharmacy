import Link from 'next/link'

import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import { OperationalPage, type OperationalItem } from '@/features/platform/components/OperationalPage'
import { RecordDrawerButton } from '@/features/platform/components/RecordDrawerButton'
import { TransitionPills } from '@/features/platform/components/TransitionPills'
import { humanize } from '@/features/platform/components/rx-ui'
import { shortDate } from '../../lib/mutate'
import { setMembershipStatus } from '../actions'

type Membership = {
  id: string; membershipRole: string; status: string
  user?: { id: string; name: string; email: string } | null
  organization?: { name: string } | null
  location?: { name: string } | null
  externalCredentialValidated: boolean; credentialType?: string | null; credentialJurisdiction?: string | null; credentialExpiresAt?: string | null
}

const CREDENTIALED = ['owner', 'pharmacist']

function credentialState(membership: Membership) {
  if (!CREDENTIALED.includes(membership.membershipRole)) return 'Not required'
  if (!membership.externalCredentialValidated) return 'Not recorded'
  if (membership.credentialExpiresAt && new Date(membership.credentialExpiresAt).getTime() < Date.now()) return `Expired ${shortDate(membership.credentialExpiresAt)}`
  return `${membership.credentialType || 'License'}${membership.credentialJurisdiction ? ` · ${membership.credentialJurisdiction}` : ''} · until ${shortDate(membership.credentialExpiresAt)}`
}

function statusOptions(membership: Membership) {
  if (membership.status === 'revoked') return []
  return [
    ...(membership.status !== 'active' ? [{ label: membership.status === 'invited' ? 'Activate' : 'Reactivate', action: setMembershipStatus.bind(null, membership.id, 'active') }] : []),
    ...(membership.status === 'active' ? [{ label: 'Suspend', action: setMembershipStatus.bind(null, membership.id, 'suspended') }] : []),
    { label: 'Revoke', action: setMembershipStatus.bind(null, membership.id, 'revoked'), danger: true },
  ]
}

export async function StaffPage() {
  const response = await keystoneClient<{ organizationMemberships: Membership[] }>('query Staff { organizationMemberships(orderBy: [{ createdAt: asc }], take: 300) { id membershipRole status user { id name email } organization { name } location { name } externalCredentialValidated credentialType credentialJurisdiction credentialExpiresAt } }')
  const items: OperationalItem[] = response.success ? response.data.organizationMemberships.map((membership) => {
    const credential = credentialState(membership)
    const needsCredential = CREDENTIALED.includes(membership.membershipRole) && (credential === 'Not recorded' || credential.startsWith('Expired'))
    return {
      id: membership.id,
      title: membership.user?.name || 'Unknown user',
      subtitle: `${membership.user?.email || ''} · ${humanize(membership.membershipRole)} · ${membership.location?.name || 'All locations'}`,
      status: needsCredential && membership.status === 'active' ? 'credential_required' : membership.status,
      details: [
        { label: 'Role', value: humanize(membership.membershipRole) },
        { label: 'Credential', value: credential },
        { label: 'Scope', value: membership.location?.name || `${membership.organization?.name || 'Organization'} (all locations)` },
        { label: 'Status', value: humanize(membership.status) },
      ],
      actions: <>
        <TransitionPills label={`Membership of ${membership.user?.name || 'staff member'}`} options={statusOptions(membership)} />
        {membership.status !== 'revoked' && <RecordDrawerButton listPath="organization-memberships" itemId={membership.id} label="Role" />}
      </>,
    }
  }) : []
  const toolbar = <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]"><Link href="/dashboard/platform/credentials" className="font-medium underline underline-offset-4">Credential review</Link><Link href="/dashboard/users" className="font-medium underline underline-offset-4">User accounts</Link><Link href="/dashboard/roles" className="font-medium underline underline-offset-4">Roles</Link></p>
  return <OperationalPage title="Staff" description="" items={items} emptyMessage="No staff memberships yet" error={response.success ? undefined : response.error} attentionStatuses={['invited', 'suspended', 'credential_required']} primaryAction={{ listKey: 'organization-memberships', label: 'Add member' }} toolbar={toolbar} />
}

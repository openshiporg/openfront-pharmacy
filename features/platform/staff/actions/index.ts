'use server'

import { runMutation } from '../../lib/mutate'

export async function setMembershipStatus(id: string, status: 'active' | 'suspended' | 'revoked') {
  return runMutation('mutation MembershipStatus($id: ID!, $status: String!) { updateOrganizationMembership(where: { id: $id }, data: { status: $status }) { id } }', { id, status }, ['/dashboard/platform/staff'])
}

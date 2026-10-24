'use server'

import { runMutation } from '../../lib/mutate'

export async function setSupplierStatus(id: string, status: 'active' | 'suspended') {
  return runMutation('mutation SupplierStatus($id: ID!, $status: String!) { updateSupplier(where: { id: $id }, data: { status: $status }) { id } }', { id, status }, ['/dashboard/platform/suppliers', `/dashboard/platform/suppliers/${id}`])
}

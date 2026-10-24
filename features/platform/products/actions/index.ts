'use server'

import { runMutation } from '../../lib/mutate'

const UPDATE = 'mutation UpdateProduct($id: ID!, $data: ProductUpdateInput!) { updateProduct(where: { id: $id }, data: $data) { id } }'
const paths = (id: string) => ['/dashboard/platform/products', `/dashboard/platform/products/${id}`]

export async function setProductStatus(id: string, status: 'draft' | 'published' | 'archived') {
  return runMutation(UPDATE, { id, data: { status } }, paths(id))
}

export async function setProductChannel(id: string, channel: 'onlineAvailable' | 'posAvailable', enabled: boolean) {
  return runMutation(UPDATE, { id, data: { [channel]: enabled } }, paths(id))
}

import { revalidatePath } from 'next/cache'

import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { TransitionResult } from '../components/TransitionPills'

/** Runs one GraphQL mutation as the signed-in user and revalidates the given dashboard paths. */
export async function runMutation(query: string, variables: Record<string, unknown>, paths: string[]): Promise<TransitionResult> {
  const response = await keystoneClient(query, variables)
  if (!response.success) return { success: false, error: response.error }
  for (const path of paths) revalidatePath(path)
  return { success: true }
}

export function money(amount: number | null | undefined, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format((amount || 0) / 100)
}

export function shortDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : ''
}

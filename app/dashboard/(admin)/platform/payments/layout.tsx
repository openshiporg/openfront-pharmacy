import type { ReactNode } from 'react'

import { requirePlatformPage } from '@/features/platform/lib/page-access'

export default async function Layout({ children }: { children: ReactNode }) {
  await requirePlatformPage('payments')
  return children
}

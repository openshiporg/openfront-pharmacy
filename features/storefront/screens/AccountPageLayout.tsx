import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { getCustomer, signOut } from '../lib/data/user'

export const metadata: Metadata = { title: 'Account' }

export async function AccountPageLayout({ dashboard, login }: { dashboard?: ReactNode; login?: ReactNode }) {
  const customer = await getCustomer()
  if (!customer) return <div className="flex min-h-[calc(100dvh-16rem)] items-center justify-center px-4 py-12">{login}</div>

  return <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-8">
    <aside>
      <p className="truncate font-semibold">{customer.name}</p>
      <p className="truncate text-sm text-muted-foreground">{customer.email}</p>
      <nav aria-label="Account" className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium lg:grid">
        <Link href="/account" className="inline-flex min-h-11 items-center hover:text-primary">Overview</Link>
        <Link href="/account/profile" className="inline-flex min-h-11 items-center hover:text-primary">Profile</Link>
        <form action={signOut}><button type="submit" className="inline-flex min-h-11 items-center hover:text-primary">Sign out</button></form>
      </nav>
    </aside>
    <div className="min-w-0">{dashboard}</div>
  </div>
}

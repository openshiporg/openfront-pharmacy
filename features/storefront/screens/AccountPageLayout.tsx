import type { ReactNode } from 'react'
import type { Metadata } from 'next'

import { AccountNav } from '../modules/account/components/account-nav'
import { getCustomer } from '../lib/data/user'

export const metadata: Metadata = { title: 'Account' }

export async function AccountPageLayout({ dashboard, login }: { dashboard?: ReactNode; login?: ReactNode }) {
  const customer = await getCustomer()
  if (!customer) return <div className="flex min-h-[calc(100dvh-16rem)] items-start justify-center px-4 py-10 sm:items-center sm:py-16">{login}</div>

  return <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
    <div className="flex flex-col gap-5 border-b border-[var(--rx-rule)] pb-6">
      <div className="min-w-0">
        <p className="rx-eyebrow truncate">{customer.email}</p>
        <h1 className="mt-1.5 truncate text-[2rem] font-semibold leading-tight tracking-[-0.02em]">{customer.name}</h1>
      </div>
      <AccountNav />
    </div>
    <div className="min-w-0 pt-8">{dashboard}</div>
  </div>
}

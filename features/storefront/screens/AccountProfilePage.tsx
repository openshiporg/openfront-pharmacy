import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProfileEmail, ProfileName, ProfilePassword } from '../modules/account/components/profile-forms'
import { getCustomer } from '../lib/data/user'

export const metadata: Metadata = { title: 'Profile' }

export async function AccountProfilePage() {
  const customer = await getCustomer()
  if (!customer) notFound()
  return <div>
    <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
    <div className="mt-8 grid gap-4">
      <ProfileName name={customer.name} />
      <ProfileEmail email={customer.email} />
      <ProfilePassword />
    </div>
  </div>
}

export default AccountProfilePage

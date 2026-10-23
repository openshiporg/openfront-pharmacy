import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Band } from '../components/rx-ui'
import { ProfileEmail, ProfileName, ProfilePassword } from '../modules/account/components/profile-forms'
import { getCustomer } from '../lib/data/user'

export const metadata: Metadata = { title: 'Profile' }

export async function AccountProfilePage() {
  const customer = await getCustomer()
  if (!customer) notFound()
  return <Band>
    <ProfileName name={customer.name} />
    <ProfileEmail email={customer.email} />
    <ProfilePassword />
  </Band>
}

export default AccountProfilePage

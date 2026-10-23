'use client'

import { usePathname } from 'next/navigation'

import { PillLink, Track, pillClass } from '../../../components/rx-ui'
import { signOut } from '../../../lib/data/user'

export function AccountNav() {
  const pathname = usePathname() ?? '/account'
  return <nav aria-label="Account" className="flex flex-wrap items-center justify-between gap-3">
    <Track label="Account sections">
      <PillLink href="/account" active={pathname === '/account' || pathname.startsWith('/account/orders')}>Overview</PillLink>
      <PillLink href="/account/profile" active={pathname.startsWith('/account/profile')}>Profile</PillLink>
    </Track>
    <form action={signOut}><button type="submit" className={`${pillClass} px-4`}>Sign out</button></form>
  </nav>
}

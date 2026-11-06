'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, House, ShoppingBag, UserRound } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Pages laid out as a catalogue: the store rail on the left with the header beside it. */
export function isRailPath(pathname: string) {
  return pathname === '/' || pathname === '/products'
}

const TABS = [
  { href: '/', label: 'Home', icon: House, match: (path: string) => path === '/' },
  { href: '/products', label: 'Shop', icon: ShoppingBag, match: (path: string) => path.startsWith('/products') },
  { href: '/prescriptions', label: 'Refill', icon: ClipboardList, match: (path: string) => path.startsWith('/prescriptions') },
  { href: '/account', label: 'Profile', icon: UserRound, match: (path: string) => path.startsWith('/account') },
]

/** Phone tab bar, floating above the page bottom. */
function TabBar({ more }: { more: ReactNode }) {
  const pathname = usePathname() ?? '/'
  return <nav aria-label="Quick links" className="fixed inset-x-3 bottom-2.5 z-30 lg:hidden">
    <ul className="grid grid-cols-5 rounded-[20px] bg-card px-1 py-0.5 shadow-[0_0_0_1px_var(--rx-rule),0_10px_30px_-10px_oklch(0.3_0.02_30/0.35)]">
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname)
        return <li key={href}><Link href={href} aria-current={active ? 'page' : undefined} className={cn('flex min-h-12 flex-col items-center justify-center gap-0.5 text-[12px] leading-none', active ? 'text-primary' : 'text-foreground/80')}><Icon aria-hidden="true" strokeWidth={1.6} className="size-[22px]" />{label}</Link></li>
      })}
      <li className="flex">{more}</li>
    </ul>
  </nav>
}

export function StoreShell({ railHeader, plainHeader, sidebar, footer, more, children }: { railHeader: ReactNode; plainHeader: ReactNode; sidebar: ReactNode; footer: ReactNode; more: ReactNode; children: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const rail = isRailPath(pathname)
  // A product page carries its own sticky add-to-cart bar on phones in place of the tab bar.
  const tabs = !pathname.startsWith('/products/')
  return <div className="flex min-h-dvh overflow-x-clip bg-background font-sans text-foreground antialiased">
    {rail && <aside aria-label="Store menu" className="hidden w-[244px] shrink-0 border-r border-[var(--rx-rule)] bg-card lg:block xl:w-[232px]">
      <nav aria-label="Departments" className="sticky top-0 max-h-dvh overflow-y-auto px-6 pb-8 pt-5 no-scrollbar">{sidebar}</nav>
    </aside>}
    <div className={cn('flex min-w-0 flex-1 flex-col lg:pb-0', tabs && 'pb-24')}>
      {rail ? railHeader : plainHeader}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
    {tabs && <TabBar more={more} />}
  </div>
}

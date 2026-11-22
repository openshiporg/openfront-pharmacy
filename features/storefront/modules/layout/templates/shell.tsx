'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/** Pages laid out as a catalogue: the store rail on the left with the header beside it. */
export function isRailPath(pathname: string) {
  return pathname === '/' || pathname === '/products'
}

export function StoreShell({ railHeader, plainHeader, sidebar, footer, children }: { railHeader: ReactNode; plainHeader: ReactNode; sidebar: ReactNode; footer: ReactNode; children: ReactNode }) {
  const pathname = usePathname() ?? '/'
  const rail = isRailPath(pathname)
  return <div className="flex min-h-dvh overflow-x-clip bg-background font-sans text-foreground antialiased">
    {rail && <aside aria-label="Store menu" className="hidden w-[244px] shrink-0 border-r border-[var(--rx-rule)] bg-card lg:block xl:w-[232px]">
      <nav aria-label="Departments" className="sticky top-0 max-h-dvh overflow-y-auto px-6 pb-8 pt-5 no-scrollbar">{sidebar}</nav>
    </aside>}
    <div className="flex min-w-0 flex-1 flex-col">
      {rail ? railHeader : plainHeader}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  </div>
}

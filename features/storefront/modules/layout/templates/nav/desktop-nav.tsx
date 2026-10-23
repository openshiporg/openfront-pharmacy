'use client'

import { usePathname } from 'next/navigation'

import { PillLink, Track } from '../../../../components/rx-ui'
import { NAV_LINKS, isActivePath } from './links'

export function DesktopNav() {
  const pathname = usePathname() ?? '/'
  return <nav aria-label="Store" className="hidden md:block">
    <Track label="Store sections">
      {NAV_LINKS.map((link) => <PillLink key={link.href} href={link.href} active={isActivePath(pathname, link.href)}>{link.label}</PillLink>)}
    </Track>
  </nav>
}

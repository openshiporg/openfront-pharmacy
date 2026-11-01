import Link from 'next/link'
import { ArrowRight, ArrowRightLeft, Clock, FileClock, History, MapPin, PackageSearch, Phone, RefreshCw, UserRound, UserRoundCog } from 'lucide-react'

import { CategoryIcon } from '../../../../components/CategoryIcon'
import { categoryLabel } from '../../../../lib/categories'
import type { StoreCategory } from '../../../../lib/data/store'
import { categoryHref } from './links'

const itemClass = 'rx-serif flex min-h-8 items-center gap-2.5 rounded-[4px] text-[16px] leading-tight lg:min-h-[30px] lg:text-[15.5px] text-foreground hover:text-primary max-lg:min-h-11'
const iconClass = 'size-4 shrink-0 text-primary'

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <div>
    <p className="rx-eyebrow mb-1.5">{title}</p>
    <ul className="grid">{children}</ul>
  </div>
}

/** The store's left rail: prescriptions, product categories with products, store and account links. */
export function SideMenu({ categories, phone, signedIn, onNavigate }: { categories: StoreCategory[]; phone?: string | null; signedIn: boolean; onNavigate?: () => void }) {
  const item = (href: string, icon: React.ReactNode, label: string) => <li key={label}><Link href={href} onClick={onNavigate} className={itemClass}>{icon}{label}</Link></li>
  return <div className="grid gap-6">
    <Group title="Prescriptions">
      {item('/account#account-prescriptions', <RefreshCw aria-hidden="true" strokeWidth={1.6} className={iconClass} />, 'Refill prescription')}
      {item('/prescriptions#transfer', <ArrowRightLeft aria-hidden="true" strokeWidth={1.6} className={iconClass} />, 'Transfer prescription')}
      {item('/order-status', <PackageSearch aria-hidden="true" strokeWidth={1.6} className={iconClass} />, 'Track an order')}
    </Group>
    {categories.length > 0 && <Group title="Shop OTC">
      {categories.map((entry) => item(categoryHref(entry.value), <CategoryIcon category={entry.value} className="size-4" />, categoryLabel(entry.value)))}
    </Group>}
    <Group title="Store">
      {item('/prescriptions#location', <MapPin aria-hidden="true" strokeWidth={1.6} className={iconClass} />, 'Store location')}
      {item('/prescriptions#location', <Clock aria-hidden="true" strokeWidth={1.6} className={iconClass} />, 'Store hours')}
      {phone && <li><a href={`tel:${phone}`} onClick={onNavigate} className={itemClass}><Phone aria-hidden="true" strokeWidth={1.6} className={iconClass} />Call store</a></li>}
    </Group>
    <Group title="Account">
      {item('/account', <UserRound aria-hidden="true" strokeWidth={1.6} className={iconClass} />, signedIn ? 'My account' : 'Sign in / Register')}
      {item('/account#account-orders', <History aria-hidden="true" strokeWidth={1.6} className={iconClass} />, 'Order history')}
      {item('/account#account-prescriptions', <FileClock aria-hidden="true" strokeWidth={1.6} className={iconClass} />, 'Prescription history')}
      {signedIn && item('/account/profile', <UserRoundCog aria-hidden="true" strokeWidth={1.6} className={iconClass} />, 'Profile')}
    </Group>
    {phone && <div className="rounded-[6px] border border-dashed border-primary/45 bg-accent/60 p-4">
      <p className="rx-serif text-[19px] leading-tight">Need help?</p>
      <p className="mt-1 text-[14px] text-muted-foreground">Our pharmacists are here for you.</p>
      <a href={`tel:${phone}`} className="rx-serif mt-2 inline-flex min-h-9 items-center gap-1.5 text-[16px] text-primary hover:underline">Call now<ArrowRight aria-hidden="true" className="size-4" /></a>
    </div>}
  </div>
}

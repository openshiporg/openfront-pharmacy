import Link from 'next/link'
import { ChevronDown, Clock, MapPin, Phone, Search, ShoppingCart, UserRound } from 'lucide-react'

import type { PublicPharmacyLocationProjection, PublicPharmacyOperatorBrandProjection } from '@/features/pharmacy/contracts'
import { openState, formatDay } from '@/features/pharmacy/hours'
import { CategoryIcon } from '../../../../components/CategoryIcon'
import { StoreBrand } from '../../../../components/StoreBrand'
import { categoryLabel } from '../../../../lib/categories'
import { formatAddress } from '../../../../lib/money'
import type { StoreCategory } from '../../../../lib/data/store'
import { MobileMenu } from './mobile-menu'
import { PRESCRIPTION_LINKS, categoryHref } from './links'

export { NAV_LINKS } from './links'

export type NavBrand = Pick<PublicPharmacyOperatorBrandProjection, 'displayName' | 'logoIcon' | 'logoColor' | 'supportPhone'>
export type NavLocation = Pick<PublicPharmacyLocationProjection, 'name' | 'phone' | 'address' | 'hours' | 'timezone' | 'pickupEnabled' | 'deliveryEnabled'>

/** Today's pharmacy-counter hours, e.g. "Today 9 am – 7 pm", or null when the location has no hours. */
export function todayHours(location?: NavLocation | null) {
  if (!location?.hours) return null
  const state = openState(location.hours.pharmacy, location.timezone)
  return state.today < 0 ? null : `${state.open ? 'Open today' : 'Today'} ${formatDay(state.todayHours)}`
}

function CartLink({ cartCount, className = '' }: { cartCount: number; className?: string }) {
  return <Link href="/cart" aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`} className={`relative inline-flex size-11 shrink-0 items-center justify-center rounded-[4px] text-foreground hover:text-primary ${className}`}>
    <ShoppingCart aria-hidden="true" strokeWidth={1.7} className="size-[22px]" />
    <span className="rx-num absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold leading-[18px] text-primary-foreground">{cartCount}</span>
  </Link>
}

export function HeaderSearch({ placeholder = 'Search for medications, vitamins, and more…', className = '', pill = false }: { placeholder?: string; className?: string; pill?: boolean }) {
  return <form role="search" action="/products" className={`relative min-w-0 ${className}`}>
    <label className="block">
      <span className="sr-only">Search products</span>
      <input type="search" name="q" maxLength={100} placeholder={placeholder} className={`h-11 w-full border border-input bg-card pl-4 pr-11 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 ${pill ? 'rounded-full' : 'rounded-[4px]'}`} />
    </label>
    <button type="submit" aria-label="Search" className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-foreground/70 hover:text-primary"><Search aria-hidden="true" className="size-[18px]" strokeWidth={1.8} /></button>
  </form>
}

/** A header menu that opens on hover or keyboard focus. */
function Dropdown({ label, href, children }: { label: string; href: string; children: React.ReactNode }) {
  return <div className="group/menu relative">
    <Link href={href} className="rx-serif inline-flex min-h-11 items-center gap-1 whitespace-nowrap text-[17px] text-foreground hover:text-primary">{label}<ChevronDown aria-hidden="true" className="size-3.5 transition-transform group-focus-within/menu:rotate-180 group-hover/menu:rotate-180" /></Link>
    <div className="invisible absolute left-1/2 top-full z-40 min-w-56 -translate-x-1/2 pt-1 opacity-0 transition-opacity duration-150 group-focus-within/menu:visible group-focus-within/menu:opacity-100 group-hover/menu:visible group-hover/menu:opacity-100">
      <div className="rx-panel grid p-1.5 shadow-[0_0_0_1px_var(--rx-rule),0_12px_28px_-12px_oklch(0.3_0.02_30/0.3)]">{children}</div>
    </div>
  </div>
}

function MenuItem({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="flex min-h-10 items-center gap-2.5 rounded-[4px] px-3 text-[15px] text-foreground hover:bg-muted hover:text-primary">{children}</Link>
}

function PrimaryNav({ categories, location, phone }: { categories: StoreCategory[]; location?: NavLocation | null; phone?: string | null }) {
  return <nav aria-label="Store" className="flex items-center gap-6 xl:gap-8">
    <Dropdown label="Prescriptions" href="/prescriptions">{PRESCRIPTION_LINKS.map((link) => <MenuItem key={link.label} href={link.href}>{link.label}</MenuItem>)}</Dropdown>
    <Dropdown label="Shop OTC" href="/products">
      {categories.map((entry) => <MenuItem key={entry.value} href={categoryHref(entry.value)}><CategoryIcon category={entry.value} className="size-4" />{categoryLabel(entry.value)}</MenuItem>)}
      <MenuItem href="/products">All products</MenuItem>
    </Dropdown>
    <Dropdown label="Store" href="/prescriptions#location">
      {location && <MenuItem href="/prescriptions#location">{location.name}</MenuItem>}
      <MenuItem href="/prescriptions#location">Store hours</MenuItem>
      {phone && <MenuItem href={`tel:${phone}`}>Call store</MenuItem>}
    </Dropdown>
  </nav>
}

export default function Nav({ brand, location, cartCount, categories, signedIn, variant }: { brand: NavBrand; location?: NavLocation | null; cartCount: number; categories: StoreCategory[]; signedIn: boolean; variant: 'rail' | 'plain' }) {
  const phone = location?.phone || brand.supportPhone
  const address = formatAddress(location?.address)
  const hours = todayHours(location)

  return <header className="relative z-30">
    {/* Phone and tablet: menu, centred wordmark, cart; then search and account. */}
    <div className="lg:hidden">
      <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 px-3 pt-2">
        <MobileMenu brand={brand} categories={categories} phone={phone} signedIn={signedIn} />
        <div className="flex min-w-0 justify-center"><StoreBrand name={brand.displayName} logoIcon={brand.logoIcon} logoColor={brand.logoColor} /></div>
        <CartLink cartCount={cartCount} />
      </div>
      <div className="flex items-center gap-2.5 px-4 pb-1 pt-3">
        <HeaderSearch pill placeholder="Search products…" className="min-w-0 flex-1" />
        <Link href="/account" className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-[15px] font-medium text-primary-foreground shadow-[0_4px_10px_-4px_oklch(0.5_0.19_25/0.6)]"><UserRound aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />{signedIn ? 'Account' : 'Sign in'}</Link>
      </div>
    </div>

    {/* Desktop */}
    {variant === 'rail'
      ? <div className="hidden lg:block">
        <div className="border-b border-[var(--rx-rule)]">
          <div className="flex min-h-12 items-center gap-6 px-8 text-[14px] text-foreground/75 xl:px-16">
            {hours && <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Clock aria-hidden="true" className="size-4 text-primary" strokeWidth={1.7} />{hours}</span>}
            {address && <span className="inline-flex min-w-0 items-center gap-1.5"><MapPin aria-hidden="true" className="size-4 shrink-0 text-primary" strokeWidth={1.7} /><span className="truncate">{address}</span></span>}
            <div className="ml-auto flex items-center gap-3">
              <Link href="/account" className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap text-foreground hover:text-primary"><UserRound aria-hidden="true" className="size-4" strokeWidth={1.7} />{signedIn ? 'Account' : 'Sign in'}</Link>
              <CartLink cartCount={cartCount} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-8 px-8 py-4 xl:px-16">
          <StoreBrand name={brand.displayName} logoIcon={brand.logoIcon} logoColor={brand.logoColor} className="shrink-0" />
          <HeaderSearch className="w-full max-w-[26rem] flex-1" />
          <div className="ml-auto flex items-center gap-6 xl:gap-8">
            <PrimaryNav categories={categories} location={location} phone={phone} />
            {phone && <a href={`tel:${phone}`} className="rx-serif hidden min-h-11 items-center gap-2 whitespace-nowrap text-[17px] text-foreground hover:text-primary 2xl:inline-flex"><Phone aria-hidden="true" className="size-[18px] text-primary" strokeWidth={1.7} />Call pharmacist</a>}
          </div>
        </div>
      </div>
      : <div className="hidden border-b border-[var(--rx-rule)] bg-card lg:block">
        <div className="mx-auto flex max-w-[90rem] items-center gap-8 px-8 pb-2 pt-4 xl:px-16">
          <StoreBrand name={brand.displayName} logoIcon={brand.logoIcon} logoColor={brand.logoColor} className="shrink-0" />
          <div className="flex min-w-0 items-center gap-6 text-[15px] text-foreground/80">
            {location && <Link href="/prescriptions#location" className="inline-flex min-w-0 items-center gap-1.5 hover:text-primary"><MapPin aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.7} /><span className="truncate">{typeof location.address?.line1 === 'string' ? location.address.line1 : location.name}</span><ChevronDown aria-hidden="true" className="size-3.5" /></Link>}
            {hours && <span className="hidden items-center gap-1.5 whitespace-nowrap xl:inline-flex"><Clock aria-hidden="true" className="size-4" strokeWidth={1.7} />{hours}</span>}
          </div>
          <HeaderSearch pill placeholder="Search products…" className="w-full max-w-[30rem] flex-1" />
          {phone && <a href={`tel:${phone}`} className="hidden items-center gap-2.5 whitespace-nowrap xl:inline-flex"><Phone aria-hidden="true" className="size-6 text-primary" strokeWidth={1.6} /><span className="grid leading-tight"><span className="text-[13px] text-muted-foreground">Questions?</span><span className="rx-num rx-serif text-[19px] text-primary">{phone}</span></span></a>}
          <Link href="/account" className="ml-auto inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-[15px] hover:text-primary"><UserRound aria-hidden="true" className="size-[18px]" strokeWidth={1.7} />{signedIn ? 'My account' : 'Sign in'}</Link>
        </div>
        <div className="mx-auto flex max-w-[90rem] items-center gap-10 px-8 pb-2 xl:px-16">
          <Link href="/" className="rx-serif inline-flex min-h-11 items-center text-[18px] hover:text-primary">Home</Link>
          <Link href="/products" className="rx-serif inline-flex min-h-11 items-center text-[18px] hover:text-primary">Products</Link>
          <PrimaryNav categories={categories} location={location} phone={phone} />
          <Link href="/order-status" className="rx-serif inline-flex min-h-11 items-center text-[18px] hover:text-primary">Track order</Link>
          <Link href="/cart" className="rx-serif ml-auto inline-flex min-h-11 items-center gap-2 rounded-[6px] bg-primary px-4 text-[17px] text-primary-foreground hover:brightness-110"><ShoppingCart aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />Cart (<span className="rx-num">{cartCount}</span>)</Link>
        </div>
      </div>}
  </header>
}


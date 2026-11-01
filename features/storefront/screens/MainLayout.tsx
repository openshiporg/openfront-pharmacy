import Nav from '../modules/layout/templates/nav'
import Footer from '../modules/layout/templates/footer'
import { MobileMenu } from '../modules/layout/templates/nav/mobile-menu'
import { SideMenu } from '../modules/layout/templates/nav/side-menu'
import { StoreShell } from '../modules/layout/templates/shell'
import { getStorefront, getStorefrontCategories } from '../lib/data/store'
import { retrieveCart } from '../lib/data/cart'
import { getCustomer } from '../lib/data/user'

export async function MainLayout({ children }: { children: React.ReactNode }) {
  const [storefront, cart, customer] = await Promise.all([getStorefront(), retrieveCart(), getCustomer()])
  const brand = storefront?.brand ?? { displayName: 'Pharmacy', tagline: '', logoIcon: null, logoColor: null, supportEmail: null, supportPhone: null }
  const location = storefront?.location ?? null
  const categories = location ? await getStorefrontCategories(location.id) : []
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  const phone = location?.phone || brand.supportPhone
  const signedIn = Boolean(customer)
  const navProps = { brand, location, cartCount, categories, signedIn }

  return <StoreShell
    railHeader={<Nav {...navProps} variant="rail" />}
    plainHeader={<Nav {...navProps} variant="plain" />}
    sidebar={<SideMenu categories={categories} phone={phone} signedIn={signedIn} />}
    footer={<Footer brand={brand} location={location} categories={categories} />}
    more={<MobileMenu brand={brand} categories={categories} phone={phone} signedIn={signedIn} trigger="tab" />}
  >{children}</StoreShell>
}

export function StoreUnavailable() {
  return <section className="mx-auto max-w-xl px-4 py-24 text-center">
    <h1 className="rx-display text-[2.25rem]">This store is unavailable right now</h1>
    <p className="mt-3 text-muted-foreground">Try again later.</p>
  </section>
}

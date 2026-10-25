import Nav from '../modules/layout/templates/nav'
import Footer from '../modules/layout/templates/footer'
import { getStorefront } from '../lib/data/store'
import { retrieveCart } from '../lib/data/cart'

export async function MainLayout({ children }: { children: React.ReactNode }) {
  const [storefront, cart] = await Promise.all([getStorefront(), retrieveCart()])
  const brand = storefront?.brand ?? { displayName: 'Pharmacy', tagline: '', logoIcon: null, logoColor: null, supportEmail: null, supportPhone: null }
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return <div className="flex min-h-dvh flex-col overflow-x-clip bg-background font-sans text-foreground antialiased">
    <Nav brand={brand} location={storefront?.location} cartCount={cartCount} />
    <div className="flex-1">{children}</div>
    <Footer brand={brand} location={storefront?.location} />
  </div>
}

export function StoreUnavailable() {
  return <section className="mx-auto max-w-xl px-4 py-24 text-center">
    <h1 className="text-3xl font-semibold tracking-tight">This store is unavailable right now</h1>
    <p className="mt-3 text-muted-foreground">Try again later.</p>
  </section>
}

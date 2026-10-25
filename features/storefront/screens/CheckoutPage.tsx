import type { Metadata } from 'next'
import Link from 'next/link'

import { CheckoutForm } from '../components/CheckoutForm'
import { OpenNow } from '../components/LocationHours'
import { EmptyState, PageHead, buttonClass } from '../components/rx-ui'
import { retrieveCart } from '../lib/data/cart'
import { getPaymentProviders } from '../lib/data/checkout'
import { getStorefront } from '../lib/data/store'
import { getCustomer } from '../lib/data/user'
import { formatMoney } from '../lib/money'
import { CartSummary } from './CartPage'

export const metadata: Metadata = { title: 'Checkout' }

export async function CheckoutPage() {
  const [cart, customer, storefront] = await Promise.all([retrieveCart(), getCustomer(), getStorefront()])
  if (!cart?.items.length) return <div className="mx-auto max-w-2xl px-4 py-16">
    <EmptyState title="Your cart is empty"><Link href="/products" className={buttonClass}>Shop</Link></EmptyState>
  </div>
  const providers = await getPaymentProviders(cart.location.id)
  const currencyCode = cart.items[0]?.product.currencyCode ?? 'USD'
  const location = storefront?.locations.find((entry) => entry.id === cart.location.id)
  const pickupHours = location?.hours ? <p className="text-sm"><OpenNow week={location.hours.pharmacy} timezone={location.timezone} label="Pickup at the pharmacy counter" /></p> : null

  return <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
    <PageHead title="Checkout" meta={cart.location.name}>
      {!customer && <Link href="/account?from=/checkout" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">Sign in</Link>}
    </PageHead>
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
      <section aria-label="Checkout details" className="min-w-0 rx-card p-5 sm:p-7">
        <CheckoutForm providers={providers} pickupEnabled={cart.location.pickupEnabled} deliveryEnabled={cart.location.deliveryEnabled} defaultEmail={customer?.email} defaultName={customer?.name} stripeKey={process.env.NEXT_PUBLIC_STRIPE_KEY || null} totalLabel={formatMoney(cart.totalAmount, currencyCode)} pickupHours={pickupHours} />
      </section>
      <aside aria-label="Order summary" className="h-fit rx-card p-6 lg:sticky lg:top-28">
        <div className="flex items-baseline justify-between gap-3"><h2 className="font-semibold">Order summary</h2><Link href="/cart" className="text-sm font-semibold text-primary">Edit</Link></div>
        <ul className="my-5 grid gap-2.5 text-sm">{cart.items.map((item) => <li key={item.id} className="flex justify-between gap-3"><span className="min-w-0 truncate"><span className="rx-num text-muted-foreground">{item.quantity}×</span> {item.product.title}</span><span className="rx-num">{formatMoney(item.unitPriceAmount * item.quantity, currencyCode)}</span></li>)}</ul>
        <CartSummary {...cart} currencyCode={currencyCode} />
      </aside>
    </div>
  </div>
}

export default CheckoutPage

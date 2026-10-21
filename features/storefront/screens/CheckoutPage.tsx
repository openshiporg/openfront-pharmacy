import type { Metadata } from 'next'
import Link from 'next/link'

import { CheckoutForm } from '../components/CheckoutForm'
import { retrieveCart } from '../lib/data/cart'
import { getPaymentProviders } from '../lib/data/checkout'
import { getCustomer } from '../lib/data/user'
import { formatMoney } from '../lib/money'
import { CartSummary } from './CartPage'

export const metadata: Metadata = { title: 'Checkout' }

export async function CheckoutPage() {
  const [cart, customer] = await Promise.all([retrieveCart(), getCustomer()])
  if (!cart?.items.length) return <div className="mx-auto max-w-2xl px-4 py-24 text-center">
    <h1 className="text-3xl font-semibold tracking-tight">Your cart is empty</h1>
    <Link href="/products" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Shop products</Link>
  </div>
  const providers = await getPaymentProviders(cart.location.id)
  const currencyCode = cart.items[0]?.product.currencyCode ?? 'USD'

  return <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
    <section className="min-w-0">
      <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
      {!customer && <p className="mt-2 text-sm text-muted-foreground">Have an account? <Link href="/account?from=/checkout" className="font-semibold text-primary">Sign in</Link></p>}
      <div className="mt-8"><CheckoutForm providers={providers} pickupEnabled={cart.location.pickupEnabled} deliveryEnabled={cart.location.deliveryEnabled} defaultEmail={customer?.email} /></div>
    </section>
    <aside className="h-fit rounded-2xl bg-card p-6">
      <h2 className="text-xl font-semibold">Order summary</h2>
      <p className="mt-1 text-sm text-muted-foreground">{cart.location.name}</p>
      <ul className="my-5 space-y-2 text-sm">{cart.items.map((item) => <li key={item.id} className="flex justify-between gap-3"><span className="min-w-0 truncate">{item.quantity} × {item.product.title}</span><span>{formatMoney(item.unitPriceAmount * item.quantity, currencyCode)}</span></li>)}</ul>
      <CartSummary {...cart} currencyCode={currencyCode} />
      <Link href="/cart" className="mt-5 inline-block text-sm font-semibold text-primary">Edit cart</Link>
    </aside>
  </div>
}

export default CheckoutPage

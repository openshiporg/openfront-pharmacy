import type { Metadata } from 'next'
import Link from 'next/link'

import { CartItems } from '../components/CartItems'
import { retrieveCart } from '../lib/data/cart'
import { formatMoney } from '../lib/money'

export const metadata: Metadata = { title: 'Cart' }

export function CartSummary({ subtotalAmount, taxAmount, deliveryAmount, totalAmount, currencyCode }: { subtotalAmount: number; taxAmount: number; deliveryAmount: number; totalAmount: number; currencyCode: string }) {
  return <dl className="space-y-3 text-sm">
    <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatMoney(subtotalAmount, currencyCode)}</dd></div>
    <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd>{formatMoney(taxAmount, currencyCode)}</dd></div>
    {deliveryAmount > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{formatMoney(deliveryAmount, currencyCode)}</dd></div>}
    <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(totalAmount, currencyCode)}</dd></div>
  </dl>
}

export async function CartPage() {
  const cart = await retrieveCart()
  const currencyCode = cart?.items[0]?.product.currencyCode ?? 'USD'

  return <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
    <section className="min-w-0">
      <h1 className="text-3xl font-semibold tracking-tight">Cart</h1>
      {cart && <p className="mt-2 text-sm text-muted-foreground">{cart.location.name}</p>}
      {cart?.items.length
        ? <div className="mt-8"><CartItems items={cart.items} /></div>
        : <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">Your cart is empty. <Link href="/products" className="font-semibold text-primary">Shop products</Link></div>}
    </section>
    {cart?.items.length ? <aside className="h-fit rounded-2xl bg-card p-6">
      <h2 className="mb-5 text-xl font-semibold">Order summary</h2>
      <CartSummary {...cart} currencyCode={currencyCode} />
      <Link href="/checkout" className="mt-6 flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Checkout</Link>
    </aside> : null}
  </div>
}

export default CartPage

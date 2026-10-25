import type { Metadata } from 'next'
import Link from 'next/link'

import { CartItems } from '../components/CartItems'
import { EmptyState, PageHead, buttonClass } from '../components/rx-ui'
import { retrieveCart } from '../lib/data/cart'
import { formatMoney } from '../lib/money'

export const metadata: Metadata = { title: 'Cart' }

export function CartSummary({ subtotalAmount, taxAmount, deliveryAmount, totalAmount, currencyCode }: { subtotalAmount: number; taxAmount: number; deliveryAmount: number; totalAmount: number; currencyCode: string }) {
  return <dl className="grid gap-2.5 text-sm">
    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Subtotal</dt><dd className="rx-num">{formatMoney(subtotalAmount, currencyCode)}</dd></div>
    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Tax</dt><dd className="rx-num">{formatMoney(taxAmount, currencyCode)}</dd></div>
    {deliveryAmount > 0 && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Delivery</dt><dd className="rx-num">{formatMoney(deliveryAmount, currencyCode)}</dd></div>}
    <div className="mt-1 flex justify-between gap-4 border-t-2 border-dotted border-[var(--rx-perf)] pt-3 text-base font-semibold"><dt>Total</dt><dd className="rx-num">{formatMoney(totalAmount, currencyCode)}</dd></div>
  </dl>
}

export async function CartPage() {
  const cart = await retrieveCart()
  const currencyCode = cart?.items[0]?.product.currencyCode ?? 'USD'
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
    <PageHead title={<span className="flex items-baseline gap-3">Cart{count > 0 && <span className="rx-num text-base font-normal text-muted-foreground">{count}</span>}</span>} meta={cart?.location.name} />
    {cart?.items.length
      ? <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <section aria-label="Items" className="min-w-0"><CartItems items={cart.items} /></section>
        <aside aria-label="Order summary" className="h-fit rounded-[22px] bg-card p-6 lg:sticky lg:top-28">
          <CartSummary {...cart} currencyCode={currencyCode} />
          <Link href="/checkout" className={`${buttonClass} mt-6 w-full min-h-12`}>Checkout</Link>
        </aside>
      </div>
      : <div className="mt-8"><EmptyState title="Your cart is empty"><Link href="/products" className={buttonClass}>Shop</Link></EmptyState></div>}
  </div>
}

export default CartPage

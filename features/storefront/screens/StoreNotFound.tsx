import Link from 'next/link'

import { buttonClass } from '../components/rx-ui'

export function StoreNotFound() {
  return <section className="mx-auto max-w-xl px-4 py-24 text-center">
    <p className="rx-eyebrow">404</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight">Page not found</h1>
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Link href="/" className={buttonClass}>Home</Link>
      <Link href="/products" className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-primary hover:bg-muted">Shop</Link>
    </div>
  </section>
}

'use client'

import { decimalToMinorUnits } from '@/features/lib/minor-units'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { CheckCircle2, Minus, Plus, Search, ShoppingBasket } from 'lucide-react'

import { Callout, Count, Dot, EmptyBand, ListBand, Mono, Pill, RxButton as Button, TitleLine, Track, buttonClass } from '@/features/platform/components/rx-ui'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs'
import type { PharmacyCatalogProductProjection, PharmacyOperatorLocationProjection } from '@/features/pharmacy/contracts'
import { calculateTaxAmount, calculateTaxableSubtotal } from '@/features/keystone/workflows/commerce-policy'
import { recoverPosOrder, submitPosOrder } from '../actions'
import { unwrapAction } from '@/features/platform/lib/action-result'
import { formatDateTime } from '@/features/platform/lib/dates'

type CashReceipt = { orderNumber: string; paymentId: string; recordedAt: string; currencyCode: string; paymentStatus: string; lines: Array<{ title: string; sku: string; quantity: number; unitPriceAmount: number; lineTotalAmount: number }>; subtotalAmount: number; taxAmount: number; totalAmount: number; cashReceivedAmount: number; changeDueAmount: number }
const WALK_IN = '__walk_in__'

type PosPendingIntent = { idempotencyKey: string; locationId: string; customerCartId?: string | null; fulfillmentMethod?: string | null; items: Array<{ productId: string; quantity: number }>; cashReceivedAmount: number; reason: string; attested: boolean }

export function PosPageClient({ location, products, customers, timeZone }: { location: PharmacyOperatorLocationProjection | null; products: PharmacyCatalogProductProjection[]; customers: Array<{ id: string; label: string }>; timeZone?: string | null }) {
  const [isPending, startTransition] = useTransition()
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cashReceived, setCashReceived] = useState('')
  const [customerCartId, setCustomerCartId] = useState('')
  const [fulfillmentMethod, setFulfillmentMethod] = useState('pos')
  const [reason, setReason] = useState('Walk-in cash sale')
  const [attested, setAttested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<CashReceipt | null>(null)
  const [intentUnresolved, setIntentUnresolved] = useState(false)
  const idempotencyKey = useRef<string | null>(null)
  const pendingIntent = useRef<PosPendingIntent | null>(null)
  const [query, setQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'unavailable'>('available')
  const [sort, setSort] = useState<'title' | 'price-low' | 'price-high' | 'stock'>('title')
  const lines = useMemo(() => products.filter((product) => (cart[product.id] || 0) > 0).map((product) => ({ product, quantity: cart[product.id] })), [cart, products])
  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    return products.filter((product) => {
      const available = (product.availableQuantity || 0) > 0
      const matchesStock = stockFilter === 'all' || (stockFilter === 'available' ? available : !available)
      const matchesSearch = !normalized || [product.title, product.sku, product.category].filter(Boolean).join(' ').toLocaleLowerCase().includes(normalized)
      return matchesStock && matchesSearch
    }).sort((a, b) => sort === 'price-low' ? a.priceAmount - b.priceAmount : sort === 'price-high' ? b.priceAmount - a.priceAmount : sort === 'stock' ? (b.availableQuantity || 0) - (a.availableQuantity || 0) : a.title.localeCompare(b.title))
  }, [products, query, sort, stockFilter])
  const subtotal = lines.reduce((sum, line) => sum + line.product.priceAmount * line.quantity, 0)
  const taxableSubtotal = calculateTaxableSubtotal(lines.map((line) => ({ unitPriceAmount: line.product.priceAmount, quantity: line.quantity, taxable: line.product.taxable })))
  const tax = calculateTaxAmount(taxableSubtotal, location?.cashTaxRateBps || 0)
  const total = subtotal + tax
  const cashReceivedAmount = decimalToMinorUnits(cashReceived, 100_000_000) ?? -1
  const setQuantity = (productId: string, quantity: number) => setCart((current) => ({ ...current, [productId]: Math.max(0, Math.min(99, quantity)) }))

  const locationId = location?.id
  useEffect(() => {
    if (!locationId) return
    const storageKey = `pharmacy-pos-pending:${locationId}`
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return
    try {
      const intent = JSON.parse(raw) as PosPendingIntent
      if (intent.locationId !== locationId || !intent.idempotencyKey || !Array.isArray(intent.items)) return
      pendingIntent.current = intent
      idempotencyKey.current = intent.idempotencyKey
      setCart(Object.fromEntries(intent.items.map((item) => [item.productId, item.quantity])))
      setCashReceived((intent.cashReceivedAmount / 100).toFixed(2))
      setFulfillmentMethod(intent.fulfillmentMethod || 'pos')
      setCustomerCartId(intent.customerCartId || '')
      setReason(intent.reason)
      setAttested(intent.attested)
      setIntentUnresolved(true)
      setMessage('An unfinished sale was restored. Retry it to recover the receipt.')
      unwrapAction(recoverPosOrder(intent.idempotencyKey)).then((order) => {
        if (!order) return
        setReceipt({ orderNumber: order.orderNumber, paymentId: order.paymentId, recordedAt: order.recordedAt, currencyCode: order.currencyCode, paymentStatus: order.paymentStatus, lines: order.lines, subtotalAmount: order.subtotalAmount, taxAmount: order.taxAmount, totalAmount: order.totalAmount, cashReceivedAmount: order.cashReceivedAmount, changeDueAmount: order.changeDueAmount })
        setMessage(`Recovered cash sale ${order.orderNumber}.`)
        sessionStorage.removeItem(storageKey)
        idempotencyKey.current = null
        pendingIntent.current = null
        setIntentUnresolved(false)
        setCart({}); setCashReceived(''); setAttested(false)
      }).catch(() => setError("Couldn't recover the receipt. Retry the same sale; don't start a new one."))
    } catch {
      setError("Couldn't read the unfinished sale. Check recent orders before starting a new sale.")
      setIntentUnresolved(true)
    }
  }, [locationId])

  function sell() {
    if (!location) return setError('No pharmacy location available')
    setError(''); setMessage('')
    const intent: PosPendingIntent = pendingIntent.current || {
      locationId: location.id,
      customerCartId: customerCartId || null,
      fulfillmentMethod,
      items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      cashReceivedAmount,
      reason,
      attested,
      idempotencyKey: idempotencyKey.current || crypto.randomUUID(),
    }
    pendingIntent.current = intent
    idempotencyKey.current = intent.idempotencyKey
    sessionStorage.setItem(`pharmacy-pos-pending:${location.id}`, JSON.stringify(intent))
    setIntentUnresolved(true)
    startTransition(() => unwrapAction(submitPosOrder(intent)).then((order) => {
      setReceipt({ orderNumber: order.orderNumber, paymentId: order.paymentId, recordedAt: order.recordedAt, currencyCode: order.currencyCode, paymentStatus: order.paymentStatus, lines: order.lines, subtotalAmount: order.subtotalAmount, taxAmount: order.taxAmount, totalAmount: order.totalAmount, cashReceivedAmount: order.cashReceivedAmount, changeDueAmount: order.changeDueAmount })
      setMessage(`Cash sale ${order.orderNumber} recorded. Total ${new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currencyCode }).format(order.totalAmount / 100)}.`)
      sessionStorage.removeItem(`pharmacy-pos-pending:${location.id}`)
      idempotencyKey.current = null
      pendingIntent.current = null
      setIntentUnresolved(false)
      setCart({}); setCashReceived(''); setAttested(false)
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Sale failed')))
  }
  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: '/' },
    { type: 'page' as const, label: 'Platform' },
    { type: 'page' as const, label: 'Point of Sale' },
  ]
  const money = (amount: number, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
  const tenders = Array.from(new Set([total, ...[500, 1000, 2000, 5000].map((step) => Math.ceil(total / step) * step)])).filter((amount) => amount >= total && amount > 0).slice(0, 4)
  const stockCounts = { available: products.filter((product) => (product.availableQuantity || 0) > 0).length, unavailable: products.filter((product) => (product.availableQuantity || 0) <= 0).length, all: products.length }

  if (!location) return <section className="flex flex-col overflow-hidden">
    <PageBreadcrumbs items={breadcrumbs} />
    <div className="max-w-3xl space-y-4 p-4 md:p-6">
      <TitleLine title="Point of Sale" tone="warn" state="Unavailable" />
      <Callout tone="warn">Add a pharmacy location with pickup enabled to start selling.</Callout>
    </div>
  </section>

  return <section className="flex flex-col overflow-hidden" aria-busy={isPending}>
    <PageBreadcrumbs items={breadcrumbs} actions={<span className="flex items-center gap-2 text-sm text-muted-foreground"><ShoppingBasket className="size-4" /><Mono>{itemCount}</Mono></span>} />
    <div className="space-y-4 p-4 pb-28 md:p-6 lg:pb-6">
      <header>
        <p className="text-xs text-muted-foreground">{location.name}</p>
        <TitleLine className="mt-1" title="Point of Sale" tone={location.cashSalesEnabled ? 'ok' : 'warn'} state={location.cashSalesEnabled ? 'Cash sales on' : 'Cash sales off'} />
      </header>

      {message && <Callout tone="muted"><span role="status" aria-live="polite" className="inline-flex items-baseline gap-2 text-foreground"><CheckCircle2 aria-hidden="true" className="size-4 translate-y-0.5 text-emerald-600" />{message}</span></Callout>}
      {error && <Callout tone="danger">{error}</Callout>}
      {isPending && <p role="status" className="sr-only">Recording cash sale</p>}

      {receipt && <section className="mx-auto w-full max-w-md rounded-[6px] bg-background p-5 font-mono text-[13px] border border-border print:max-w-none print:ring-0" aria-label="Cash receipt">
        <div className="flex items-start justify-between gap-4 border-b border-dashed pb-3 font-sans">
          <div><p className="text-base font-semibold">{location.operatorDisplayName}</p><p className="text-xs text-muted-foreground">{location.name}{location.operatorPhone ? ` · ${location.operatorPhone}` : ''}</p></div>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">Print</Button>
        </div>
        <div className="grid gap-0.5 border-b border-dashed py-3 text-[11px] text-muted-foreground"><p>ORDER {receipt.orderNumber}</p><p>PAYMENT {receipt.paymentId} · {receipt.paymentStatus.replaceAll('_', ' ')}</p><p>{formatDateTime(receipt.recordedAt, timeZone)}</p></div>
        <div className="grid gap-1.5 border-b border-dashed py-3">{receipt.lines.map((line, index) => <div key={`${line.sku}:${index}`} className="flex justify-between gap-4"><span className="min-w-0">{line.quantity}× {line.title}<span className="block text-[11px] text-muted-foreground">{line.sku}</span></span><span className="tabular-nums">{money(line.lineTotalAmount, receipt.currencyCode)}</span></div>)}</div>
        <dl className="grid gap-1 pt-3 tabular-nums"><div className="flex justify-between"><dt>Subtotal</dt><dd>{money(receipt.subtotalAmount, receipt.currencyCode)}</dd></div><div className="flex justify-between"><dt>Tax</dt><dd>{money(receipt.taxAmount, receipt.currencyCode)}</dd></div><div className="flex justify-between font-semibold"><dt>Total</dt><dd>{money(receipt.totalAmount, receipt.currencyCode)}</dd></div><div className="flex justify-between"><dt>Cash</dt><dd>{money(receipt.cashReceivedAmount, receipt.currencyCode)}</dd></div><div className="flex justify-between"><dt>Change</dt><dd>{money(receipt.changeDueAmount, receipt.currencyCode)}</dd></div></dl>
      </section>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-end gap-x-5 gap-y-2 border-b border-border">
            <label className="relative mb-2 min-w-0 flex-1 basis-56">
              <span className="sr-only">Search products</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, SKU or category" className="h-8 rounded-[5px] pl-8 max-sm:h-10" />
            </label>
            <Track label="Stock" className="border-b-0">
              <Pill active={stockFilter === 'available'} onClick={() => setStockFilter('available')}>In stock <Count>{stockCounts.available}</Count></Pill>
              <Pill active={stockFilter === 'unavailable'} onClick={() => setStockFilter('unavailable')}>Out <Count>{stockCounts.unavailable}</Count></Pill>
              <Pill active={stockFilter === 'all'} onClick={() => setStockFilter('all')}>All <Count>{stockCounts.all}</Count></Pill>
            </Track>
            <Track label="Sort" className="border-b-0">
              <Pill active={sort === 'title'} onClick={() => setSort('title')}>Name</Pill>
              <Pill active={sort === 'price-low'} onClick={() => setSort('price-low')}>Lowest price</Pill>
              <Pill active={sort === 'price-high'} onClick={() => setSort('price-high')}>Highest price</Pill>
              <Pill active={sort === 'stock'} onClick={() => setSort('stock')}>Stock</Pill>
            </Track>
          </div>
          {visibleProducts.length === 0
            ? <EmptyBand>{products.length === 0 ? 'No products available' : 'No products match your search'}</EmptyBand>
            : <ListBand>{visibleProducts.map((product) => {
              const quantity = cart[product.id] || 0
              const available = (product.availableQuantity || 0) > 0
              return <div key={product.id} className={`flex items-center gap-3 px-3.5 py-2.5 sm:px-4 ${quantity > 0 ? 'bg-teal-50/70 dark:bg-teal-950/20' : 'bg-card'}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-baseline gap-2"><Dot tone={available ? 'ok' : 'muted'} /><h2 className="truncate text-[13px] font-medium text-foreground">{product.title}</h2></div>
                  <p className="mt-0.5 truncate pl-3 text-xs text-muted-foreground">{product.sku} · {product.availableQuantity || 0} on hand</p>
                </div>
                <Mono className="shrink-0 text-sm">{money(product.priceAmount, product.currencyCode)}</Mono>
                <div role="group" aria-label={`Quantity of ${product.title}`} className="flex shrink-0 items-center gap-1">
                  <button type="button" className={`${buttonClass} size-8 px-0 max-sm:size-10`} onClick={() => setQuantity(product.id, quantity - 1)} disabled={intentUnresolved || quantity === 0} aria-label={`Remove one ${product.title} from cart`}><Minus className="size-3.5" /></button>
                  <Mono className="w-6 text-center text-sm" aria-label={`${quantity} ${product.title} in cart`}>{quantity}</Mono>
                  <button type="button" className={`${buttonClass} size-8 px-0 max-sm:size-10`} onClick={() => setQuantity(product.id, quantity + 1)} disabled={intentUnresolved || !available || quantity >= (product.availableQuantity || 0)} aria-label={`Add one ${product.title} to cart`}><Plus className="size-3.5" /></button>
                </div>
              </div>
            })}</ListBand>}
        </div>

        <aside id="sale" aria-label="Sale" className="space-y-4 rounded-[6px] border border-border bg-card p-4 lg:sticky lg:top-4">
          <div className="flex items-baseline justify-between gap-3"><h2 className="text-sm font-semibold text-foreground">Sale</h2><Count>{itemCount} items</Count></div>
          {lines.length > 0 && <ul className="grid gap-1 text-sm">{lines.map((line) => <li key={line.product.id} className="flex justify-between gap-3"><span className="min-w-0 truncate"><Mono className="text-muted-foreground">{line.quantity}×</Mono> {line.product.title}</span><Mono>{money(line.product.priceAmount * line.quantity)}</Mono></li>)}</ul>}
          <div className="grid gap-2"><Label>Customer</Label><Select value={customerCartId || WALK_IN} disabled={intentUnresolved} onValueChange={(value) => setCustomerCartId(value === WALK_IN ? '' : value)}><SelectTrigger aria-label="Customer" className="rounded-[5px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={WALK_IN}>Walk-in</SelectItem>{customers.map(customer => <SelectItem key={customer.id} value={customer.id}>{customer.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><span className="text-sm font-medium">Handoff</span><Track label="Handoff" className="w-fit"><Pill active={fulfillmentMethod === 'pos'} disabled={intentUnresolved} onClick={() => setFulfillmentMethod('pos')}>Collected now</Pill><Pill active={fulfillmentMethod === 'pickup'} disabled={intentUnresolved} onClick={() => setFulfillmentMethod('pickup')}>Pickup later</Pill></Track></div>
          <dl className="grid gap-1.5 border-y border-border py-3 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd><Mono>{money(subtotal)}</Mono></dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd><Mono>{money(tax)}</Mono></dd></div><div className="flex items-baseline justify-between pt-1"><dt className="font-semibold">Total</dt><dd><Mono className="text-2xl">{money(total)}</Mono></dd></div></dl>
          {!location.cashSalesEnabled && <Callout tone="warn">Cash sales are not enabled for this pharmacy.</Callout>}
          <div className="grid gap-2"><Label htmlFor="pos-cash">Cash received (USD)</Label><Input id="pos-cash" inputMode="decimal" value={cashReceived} onChange={(event) => setCashReceived(event.target.value)} disabled={intentUnresolved} className="h-9 rounded-[5px] tabular-nums" />
            {tenders.length > 0 && !intentUnresolved && <div role="group" aria-label="Quick cash amounts" className="flex flex-wrap gap-1.5">{tenders.map((amount, index) => <button type="button" key={amount} aria-pressed={cashReceivedAmount === amount} onClick={() => setCashReceived((amount / 100).toFixed(2))} className={`${buttonClass} tabular-nums aria-pressed:border-foreground aria-pressed:bg-muted`}>{index === 0 && amount === total ? 'Exact' : money(amount)}</button>)}</div>}
          </div>
          {cashReceivedAmount >= total && total > 0 && <div className="flex items-baseline justify-between rounded-[6px] bg-emerald-50 px-4 py-3 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100"><span className="text-sm font-medium">Change due</span><Mono className="text-xl">{money(cashReceivedAmount - total)}</Mono></div>}
          <div className="grid gap-2"><Label htmlFor="pos-reason">Note</Label><Input id="pos-reason" value={reason} onChange={(event) => setReason(event.target.value)} disabled={intentUnresolved} className="h-9 rounded-[5px]" /></div>
          <label className="flex items-start gap-3 text-sm"><Checkbox checked={attested} onCheckedChange={(checked) => setAttested(checked === true)} disabled={intentUnresolved} className="mt-0.5" />I received the cash and will return the change shown.</label>
          <Button onClick={sell} disabled={isPending || (!intentUnresolved && !location.cashSalesEnabled) || (intentUnresolved ? !pendingIntent.current : (!lines.length || cashReceivedAmount < total || reason.trim().length < 8 || !attested))} className="min-h-11 w-full">{isPending ? 'Recording…' : intentUnresolved ? 'Retry sale' : 'Record cash sale'}</Button>
        </aside>
      </div>
    </div>

    {itemCount > 0 && <a href="#sale" className="fixed inset-x-3 bottom-3 z-20 flex min-h-12 items-center justify-between rounded-[6px] bg-foreground px-5 text-sm font-semibold text-background shadow-lg lg:hidden"><span><Mono>{itemCount}</Mono> items</span><Mono>{money(total)}</Mono></a>}
  </section>
}

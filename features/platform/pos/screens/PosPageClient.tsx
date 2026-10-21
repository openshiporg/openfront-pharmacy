'use client'

import { decimalToMinorUnits } from '@/features/lib/minor-units'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { AlertCircle, CheckCircle2, Minus, Plus, Search, ShoppingBasket } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs'
import type { PharmacyCatalogProductProjection, PharmacyOperatorLocationProjection } from '@/features/pharmacy/contracts'
import { calculateTaxAmount, calculateTaxableSubtotal } from '@/features/keystone/workflows/commerce-policy'
import { recoverPosOrder, submitPosOrder } from '../actions'

type CashReceipt = { orderNumber: string; paymentId: string; recordedAt: string; currencyCode: string; paymentStatus: string; lines: Array<{ title: string; sku: string; quantity: number; unitPriceAmount: number; lineTotalAmount: number }>; subtotalAmount: number; taxAmount: number; totalAmount: number; cashReceivedAmount: number; changeDueAmount: number }
const WALK_IN = '__walk_in__'

type PosPendingIntent = { idempotencyKey: string; locationId: string; customerCartId?: string | null; fulfillmentMethod?: string | null; items: Array<{ productId: string; quantity: number }>; cashReceivedAmount: number; reason: string; attested: boolean }

export function PosPageClient({ location, products, customers }: { location: PharmacyOperatorLocationProjection | null; products: PharmacyCatalogProductProjection[]; customers: Array<{ id: string; label: string }> }) {
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
      recoverPosOrder(intent.idempotencyKey).then((order) => {
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
    startTransition(() => submitPosOrder(intent).then((order) => {
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

  if (!location) return <section className="flex flex-col overflow-hidden">
    <PageBreadcrumbs items={breadcrumbs} />
    <div className="max-w-3xl p-4 md:p-6">
      <Alert>
        <AlertCircle className="size-4" />
        <AlertTitle>Point of sale unavailable</AlertTitle>
        <AlertDescription>Add a pharmacy location with pickup enabled to start selling.</AlertDescription>
      </Alert>
    </div>
  </section>

  return <section className="flex flex-col overflow-hidden" aria-busy={isPending}>
    <PageBreadcrumbs items={breadcrumbs} actions={<span className="flex items-center gap-2 text-sm text-muted-foreground"><ShoppingBasket className="size-4" />{itemCount} items</span>} />
    <div className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Point of Sale</h1>
        <p className="text-muted-foreground">{location.name} · Cash sales</p>
      </header>

      {message && <Alert role="status" aria-live="polite"><CheckCircle2 className="size-4" /><AlertDescription>{message}</AlertDescription></Alert>}
      {error && <Alert variant="destructive"><AlertCircle className="size-4" /><AlertDescription>{error}</AlertDescription></Alert>}
      {isPending && <p role="status" className="sr-only">Recording cash sale</p>}

      {receipt && <section className="rounded-xl border bg-background p-6 print:border-0" aria-label="Cash receipt">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xl font-bold">{location.operatorDisplayName}</p><p className="text-sm text-muted-foreground">{location.name}{location.operatorPhone ? ` · ${location.operatorPhone}` : ''}</p><p className="mt-1 text-xs text-muted-foreground">Cash receipt · Payment {receipt.paymentStatus.replaceAll('_', ' ')}</p></div>
          <Button variant="outline" onClick={() => window.print()} className="print:hidden">Print receipt</Button>
        </div>
        <div className="mt-5 border-y py-3 text-xs text-muted-foreground"><p>Order {receipt.orderNumber}</p><p>Payment {receipt.paymentId}</p><p>{new Date(receipt.recordedAt).toLocaleString()}</p></div>
        <div className="mt-4 space-y-2 text-sm">{receipt.lines.map((line, index) => <div key={`${line.sku}:${index}`} className="flex justify-between gap-4"><span>{line.quantity} × {line.title} ({line.sku})</span><span>{money(line.lineTotalAmount, receipt.currencyCode)}</span></div>)}</div>
        <dl className="ml-auto mt-5 w-56 space-y-1 border-t pt-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{money(receipt.subtotalAmount, receipt.currencyCode)}</dd></div><div className="flex justify-between"><dt>Tax</dt><dd>{money(receipt.taxAmount, receipt.currencyCode)}</dd></div><div className="flex justify-between font-bold"><dt>Total</dt><dd>{money(receipt.totalAmount, receipt.currencyCode)}</dd></div><div className="flex justify-between"><dt>Cash received</dt><dd>{money(receipt.cashReceivedAmount, receipt.currencyCode)}</dd></div><div className="flex justify-between"><dt>Change</dt><dd>{money(receipt.changeDueAmount, receipt.currencyCode)}</dd></div></dl>
      </section>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, SKU, or category" aria-label="Search products" className="h-10 w-full rounded-lg pl-9" />
        </div>
        <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as typeof stockFilter)}>
          <SelectTrigger className="h-10 w-44 rounded-lg" aria-label="Stock"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="available">In stock</SelectItem><SelectItem value="unavailable">Out of stock</SelectItem><SelectItem value="all">All products</SelectItem></SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
          <SelectTrigger className="h-10 w-44 rounded-lg" aria-label="Sort"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="title">Name A–Z</SelectItem><SelectItem value="price-low">Price low–high</SelectItem><SelectItem value="price-high">Price high–low</SelectItem><SelectItem value="stock">Stock</SelectItem></SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div>{visibleProducts.length === 0
          ? <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{products.length === 0 ? 'No products available' : 'No products match your search.'}</div>
          : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visibleProducts.map((product) => {
            const quantity = cart[product.id] || 0
            const available = (product.availableQuantity || 0) > 0
            return <article key={product.id} className="rounded-xl border bg-background p-4">
              <div className="flex items-start justify-between gap-3"><p className="text-xs uppercase tracking-wider text-muted-foreground">{product.sku}</p><Badge variant={available ? 'secondary' : 'outline'}>{available ? 'In stock' : 'Out of stock'}</Badge></div>
              <h2 className="mt-2 font-semibold">{product.title}</h2>
              <p className="mt-2 text-xs text-muted-foreground">{product.availableQuantity || 0} in stock</p>
              <div className="mt-6 flex items-center justify-between"><span className="text-lg">{money(product.priceAmount, product.currencyCode)}</span><div className="flex items-center rounded-full border"><button type="button" className="grid size-9 place-items-center disabled:opacity-40" onClick={() => setQuantity(product.id, quantity - 1)} disabled={intentUnresolved || quantity === 0} aria-label={`Remove one ${product.title} from cart`}><Minus className="size-3" /></button><span className="w-7 text-center" aria-label={`${quantity} ${product.title} in cart`}>{quantity}</span><button type="button" className="grid size-9 place-items-center disabled:opacity-40" onClick={() => setQuantity(product.id, quantity + 1)} disabled={intentUnresolved || !available || quantity >= (product.availableQuantity || 0)} aria-label={`Add one ${product.title} to cart`}><Plus className="size-3" /></button></div></div>
            </article>
          })}</div>}
        </div>

        <aside className="h-fit space-y-4 rounded-xl border bg-background p-5">
          <h2 className="font-semibold">Sale</h2>
          <div className="space-y-2"><Label>Customer</Label><Select value={customerCartId || WALK_IN} disabled={intentUnresolved} onValueChange={(value) => setCustomerCartId(value === WALK_IN ? '' : value)}><SelectTrigger aria-label="Customer"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={WALK_IN}>Walk-in</SelectItem>{customers.map(customer => <SelectItem key={customer.id} value={customer.id}>{customer.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Handoff</Label><Select value={fulfillmentMethod} disabled={intentUnresolved} onValueChange={setFulfillmentMethod}><SelectTrigger aria-label="Handoff"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pos">Collected now</SelectItem><SelectItem value="pickup">Pickup later</SelectItem></SelectContent></Select></div>
          <div className="space-y-2 border-y py-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between"><span>Tax</span><span>{money(tax)}</span></div><div className="flex justify-between text-base font-semibold"><span>Total</span><span>{money(total)}</span></div></div>
          {!location.cashSalesEnabled && <Alert><AlertCircle className="size-4" /><AlertDescription>Cash sales are not enabled for this pharmacy.</AlertDescription></Alert>}
          <div className="space-y-2"><Label htmlFor="pos-cash">Cash received (USD)</Label><Input id="pos-cash" inputMode="decimal" value={cashReceived} onChange={(event) => setCashReceived(event.target.value)} disabled={intentUnresolved} /></div>
          {cashReceivedAmount >= total && total > 0 && <p className="text-sm font-medium">Change due: {money(cashReceivedAmount - total)}</p>}
          <div className="space-y-2"><Label htmlFor="pos-reason">Note</Label><Input id="pos-reason" value={reason} onChange={(event) => setReason(event.target.value)} disabled={intentUnresolved} /></div>
          <label className="flex items-start gap-3 text-sm"><Checkbox checked={attested} onCheckedChange={(checked) => setAttested(checked === true)} disabled={intentUnresolved} className="mt-0.5" />I received the cash and will return the change shown.</label>
          <Button onClick={sell} disabled={isPending || (!intentUnresolved && !location.cashSalesEnabled) || (intentUnresolved ? !pendingIntent.current : (!lines.length || cashReceivedAmount < total || reason.trim().length < 8 || !attested))} className="w-full">{isPending ? 'Recording…' : intentUnresolved ? 'Retry sale' : 'Record cash sale'}</Button>
        </aside>
      </div>
    </div>
  </section>
}

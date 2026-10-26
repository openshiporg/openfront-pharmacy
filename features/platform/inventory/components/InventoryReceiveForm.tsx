'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { RxButton as Button } from '@/features/platform/components/rx-ui'
import { Input } from '@/components/ui/input'
import type { PharmacyInventoryReceiptOptions, PharmacyProductOptionWorklistProjection, PharmacyTaskOption } from '@/features/pharmacy/contracts'
import { loadInventoryReceiptProductPageAction, receiveInventoryAction } from '../actions'
import { unwrapAction } from '@/features/platform/lib/action-result'

const productPageSize = 50

export function InventoryReceiveForm({ options, initialProductWorklist }: { options: PharmacyInventoryReceiptOptions; initialProductWorklist: PharmacyProductOptionWorklistProjection }) {
  const [locationId, setLocationId] = useState(options.locations[0]?.id || '')
  const [productStatus, setProductStatus] = useState('')
  const [products, setProducts] = useState<PharmacyTaskOption[]>(initialProductWorklist.items)
  const [totalProductCount, setTotalProductCount] = useState(initialProductWorklist.totalCount)
  const [hasMoreProducts, setHasMoreProducts] = useState(initialProductWorklist.hasMore)
  const [nextProductCursor, setNextProductCursor] = useState<string | null>(initialProductWorklist.nextCursor || null)
  const [productSearch, setProductSearch] = useState('')
  const [productId, setProductId] = useState(initialProductWorklist.items[0]?.id || '')
  const [productLoading, setProductLoading] = useState(false)
  const [productError, setProductError] = useState('')
  const productRequestId = useRef(0)
  const organizationId = options.locations.find((entry) => entry.id === locationId)?.scopeId
  const suppliers = options.suppliers.filter((entry) => entry.scopeId === organizationId)
  const visibleProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase()
    const matches = products.filter((entry) => !term || `${entry.label} ${entry.detail || ''}`.toLowerCase().includes(term))
    const selected = products.find((entry) => entry.id === productId)
    return selected && !matches.some((entry) => entry.id === selected.id) ? [selected, ...matches] : matches
  }, [products, productId, productSearch])

  async function loadFirstProductPage(nextLocationId: string, nextStatus: string) {
    const requestId = ++productRequestId.current
    setProductLoading(true)
    setProductError('')
    setProducts([])
    setTotalProductCount(0)
    setHasMoreProducts(false)
    setNextProductCursor(null)
    setProductId('')
    try {
      const worklist = await unwrapAction(loadInventoryReceiptProductPageAction({ locationId: nextLocationId, first: productPageSize, after: null, status: nextStatus || null }))
      if (requestId !== productRequestId.current) return
      setProducts(worklist.items)
      setTotalProductCount(worklist.totalCount)
      setHasMoreProducts(worklist.hasMore)
      setNextProductCursor(worklist.nextCursor || null)
      setProductId(worklist.items[0]?.id || '')
    } catch (cause) {
      if (requestId === productRequestId.current) setProductError(cause instanceof Error ? cause.message : 'Product options could not be loaded')
    } finally {
      if (requestId === productRequestId.current) setProductLoading(false)
    }
  }

  async function loadMoreProductPage() {
    if (!hasMoreProducts || !nextProductCursor || productLoading || !locationId) return
    const requestId = ++productRequestId.current
    const cursor = nextProductCursor
    setProductLoading(true)
    setProductError('')
    try {
      const worklist = await unwrapAction(loadInventoryReceiptProductPageAction({ locationId, first: productPageSize, after: cursor, status: productStatus || null }))
      if (requestId !== productRequestId.current) return
      setProducts((current) => {
        const seen = new Set(current.map((entry) => entry.id))
        return [...current, ...worklist.items.filter((entry) => !seen.has(entry.id))]
      })
      setTotalProductCount(worklist.totalCount)
      setHasMoreProducts(worklist.hasMore)
      setNextProductCursor(worklist.nextCursor || null)
    } catch (cause) {
      if (requestId === productRequestId.current) setProductError(cause instanceof Error ? cause.message : 'More product options could not be loaded')
    } finally {
      if (requestId === productRequestId.current) setProductLoading(false)
    }
  }

  const [supplierId, setSupplierId] = useState('')
  const [lotNumber, setLotNumber] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [attested, setAttested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const idempotencyKey = useRef<string | null>(null)

  function submit() {
    setMessage(''); setError('')
    startTransition(() => unwrapAction(receiveInventoryAction({
      productId, locationId, supplierId: supplierId || undefined, lotNumber, serialNumber: serialNumber.trim() || undefined,
      expirationDate: new Date(`${expirationDate}T12:00:00.000Z`).toISOString(), quantity,
      coldChainRequired: false,
      coldChainEvidenceComplete: true,
      reason, idempotencyKey: idempotencyKey.current || (idempotencyKey.current = `receive:${crypto.randomUUID()}`), attested,
    })).then((result) => { idempotencyKey.current = null; setMessage(`Lot ${lotNumber.trim()} recorded with ${result.quantityAvailable} available.`) }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Receipt failed')))
  }

  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  const ready = locationId && productId && products.some((entry) => entry.id === productId && entry.scopeId === locationId) && lotNumber.trim() && expirationDate >= tomorrow && quantity > 0 && reason.trim().length >= 8 && attested
  return <div className="grid gap-4 sm:grid-cols-2">
    <label className="text-sm">Location<select value={locationId} onChange={(event) => { const nextLocationId = event.target.value; setLocationId(nextLocationId); setSupplierId(''); setProductSearch(''); void loadFirstProductPage(nextLocationId, productStatus) }} className="mt-2 block w-full rounded-[5px] border bg-background px-3 py-2">{options.locations.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
    <div className="grid gap-2">
      <label className="text-sm">Filter product status<select value={productStatus} onChange={(event) => { const nextStatus = event.target.value; setProductStatus(nextStatus); setProductSearch(''); void loadFirstProductPage(locationId, nextStatus) }} className="mt-2 block w-full rounded-[5px] border bg-background px-3 py-2"><option value="">Draft and published</option><option value="draft">Draft</option><option value="published">Published</option></select></label>
      <label className="text-sm">Search loaded product options<Input type="search" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} className="mt-2" placeholder="Search loaded products" /></label>
      <label className="text-sm">Product<select value={productId} onChange={(event) => setProductId(event.target.value)} disabled={productLoading || !products.length} className="mt-2 block w-full rounded-[5px] border bg-background px-3 py-2"><option value="">Select</option>{visibleProducts.map((entry) => <option key={entry.id} value={entry.id}>{entry.label} · {entry.detail}</option>)}</select></label>
      <p className="text-xs text-muted-foreground">Showing {products.length} of {totalProductCount} products.</p>
      {hasMoreProducts && <Button type="button" variant="outline" disabled={productLoading} onClick={() => void loadMoreProductPage()}>{productLoading ? 'Loading products…' : 'Load more products'}</Button>}
      {productLoading && !products.length && <p role="status" className="text-sm text-muted-foreground">Loading products…</p>}
      {!productLoading && totalProductCount === 0 && <p className="text-sm text-muted-foreground">No products available for this location.</p>}
      {productError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{productError}</p>}
      {!productLoading && products.length > 0 && visibleProducts.length === 0 && <p className="text-sm text-muted-foreground">No products match your search.</p>}
    </div>
    <label className="text-sm">Supplier<select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="mt-2 block w-full rounded-[5px] border bg-background px-3 py-2"><option value="">No supplier link</option>{suppliers.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
    <label className="text-sm">Lot number<Input value={lotNumber} onChange={(event) => setLotNumber(event.target.value)} className="mt-2" /></label>
    <label className="text-sm">Serial / package identifier (optional)<Input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} className="mt-2" /></label>
    <label className="text-sm">Expiration date<Input type="date" min={tomorrow} value={expirationDate} onChange={(event) => setExpirationDate(event.target.value)} className="mt-2" /></label>
    <label className="text-sm">Quantity received<Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="mt-2" /></label>
    <p className="rounded-[5px] bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-2">Cold-chain receiving isn&apos;t supported. Receive room-temperature, non-controlled products only.</p>
    <label className="text-sm sm:col-span-2">Receiving reason<Input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2" /></label>
    <label className="flex items-start gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" />I am the authorized human recording this receipt and attest that the source evidence was reviewed.</label>
    <div className="sm:col-span-2"><Button disabled={pending || !ready} onClick={submit}>Record inventory receipt</Button></div>
    {message && <p className="rounded-[5px] bg-teal-50 p-3 text-sm text-teal-800 sm:col-span-2">{message}</p>}
    {error && <p className="rounded-[5px] bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</p>}
  </div>
}

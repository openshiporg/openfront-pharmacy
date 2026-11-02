import assert from 'node:assert/strict'
import { test } from 'node:test'

import { parsePhotoReference, productPhotoSnapshot, resolveLinePhoto } from './product-photo'
import { signedGuestOrderProjection } from '../mutations/getGuestPharmacyOrder'

const STOCK = 'https://images.unsplash.com/photo-1?auto=format'
let signedAt = 0
const context = {
  images(storage: string) {
    assert.equal(storage, 'my_images')
    return { getUrl: async (id: string, extension: string) => `https://bucket.example/${id}.${extension}?X-Amz-Signature=sig${++signedAt}` }
  },
}

test('an uploaded photo is snapshotted as a stable storage reference, not a signed URL', () => {
  const snapshot = productPhotoSnapshot({ imageUrl: STOCK, image: { id: 'FryP-lsCQvXQoxcee3J9bw', extension: 'png' } })
  assert.equal(snapshot, 'storage:my_images/FryP-lsCQvXQoxcee3J9bw.png')
  assert.doesNotMatch(snapshot!, /X-Amz|https?:/)
  assert.deepEqual(parsePhotoReference(snapshot), { id: 'FryP-lsCQvXQoxcee3J9bw', extension: 'png' })
})

test('without an upload the snapshot falls back to the image URL, or nothing', () => {
  assert.equal(productPhotoSnapshot({ imageUrl: STOCK, image: null }), STOCK)
  assert.equal(productPhotoSnapshot({ imageUrl: STOCK, image: { id: null, extension: null } }), STOCK)
  assert.equal(productPhotoSnapshot({ imageUrl: null }), undefined)
  assert.equal(parsePhotoReference(STOCK), null)
})

test('a stored reference is signed fresh on every read; a plain URL passes through untouched', async () => {
  const reference = 'storage:my_images/abc_1.png'
  const first = await resolveLinePhoto(reference, context)
  const second = await resolveLinePhoto(reference, context)
  assert.match(first!, /^https:\/\/bucket\.example\/abc_1\.png\?X-Amz-Signature=/)
  assert.notEqual(first, second)
  assert.equal(await resolveLinePhoto(STOCK, context), STOCK)
  assert.equal(await resolveLinePhoto(null, context), null)
  assert.equal(await resolveLinePhoto('storage:my_images/../x.png', context), null)
})

test('a signing failure shows no photo rather than a broken reference', async () => {
  const failing = { images: () => ({ getUrl: async () => { throw new Error('S3 down') } }) }
  assert.equal(await resolveLinePhoto('storage:my_images/abc.png', failing), null)
})

test('the customer order projection signs uploaded photos and keeps fallback URLs', async () => {
  const order = {
    id: 'o1', orderNumber: 'RX-1', status: 'paid', fulfillmentMethod: 'pickup', subtotalAmount: 2, taxAmount: 0, deliveryAmount: 0, totalAmount: 2, currencyCode: 'USD', createdAt: '2026-11-02T00:00:00Z',
    location: { name: 'Main', timezone: 'America/New_York' },
    lineItems: [
      { id: 'l1', title: 'Allergy', quantity: 1, unitPriceAmount: 1, lineTotalAmount: 1, imageUrl: productPhotoSnapshot({ imageUrl: STOCK, image: { id: 'up1', extension: 'png' } }), prescriptionRequirementSnapshot: 'none' },
      { id: 'l2', title: 'Thermometer', quantity: 1, unitPriceAmount: 1, lineTotalAmount: 1, imageUrl: productPhotoSnapshot({ imageUrl: STOCK }), prescriptionRequirementSnapshot: 'none' },
    ],
  }
  const projection = await signedGuestOrderProjection(order, context as any)
  assert.match(projection.lines[0].imageUrl!, /^https:\/\/bucket\.example\/up1\.png\?X-Amz-Signature=/)
  assert.equal(projection.lines[1].imageUrl, STOCK)
})

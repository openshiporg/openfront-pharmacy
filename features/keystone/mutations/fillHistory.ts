import type { Context } from '.keystone/types'
import { authorizedFillReadback } from './fillReadback'
import { readStore, fillMetadataQuery, eventMetadataQuery, readFillProjection, readEventPage, readEventProjection } from './fillReadProjection'
import { scopedFill, scopedEvent, readCursor, writeCursor, cursorBoundary } from '../workflows/fill-read-scope'
import { DomainError } from './lib/errors'

export async function pharmacyFillHistory(_root: unknown, args: { prescriptionId: string; fillId: string; after?: string | null }, context: Context) {
  const { scope } = await authorizedFillReadback(context, args.prescriptionId)
  const q = readStore(context)
  const value = await q.PrescriptionFill.findOne({ where: { id: args.fillId }, query: fillMetadataQuery })
  if (!value) throw new DomainError('Fill not found in current prescription scope')
  const fill = scopedFill(value, scope, args.fillId)
  let boundary: Record<string, unknown> = {}
  if (args.after) {
    const cursor = readCursor(args.after, scope, 'operator_fill_history', fill.id)
    const anchor = scopedEvent(await q.PrescriptionFillEvent.findOne({ where: { id: cursor.id }, query: eventMetadataQuery }), scope, fill, cursor.id)
    if (anchor.createdAt !== cursor.createdAt || anchor.version !== cursor.version) throw new DomainError('Invalid or stale history cursor')
    boundary = cursorBoundary(cursor)
  }
  const records = await readEventPage(context, scope, fill, 21, boundary)
  const page = records.slice(0, 20)
  const projection = await readFillProjection(context, scope, fill)
  const projected = await Promise.all(records.map(event => readEventProjection(context, scope, fill, event, projection.policyVersion)))
  const events = projected.slice(0, 20)
  const last = page.length ? scopedEvent(page[page.length - 1], scope, fill) : null
  return { events, hasMore: records.length > 20,
    nextCursor: records.length > 20 && last ? writeCursor(scope, 'operator_fill_history', last, fill.id) : null }
}

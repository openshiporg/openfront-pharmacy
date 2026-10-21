import type { Context } from '.keystone/types'
import { assertCurrentTransactionActor } from './current-authority'

export function orderedLockKeys(keys: string[]) {
  return [...new Set(keys.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

export async function acquireTransactionLocks(context: Context, keys: string[]) {
  const sudo = context.sudo()
  for (const key of orderedLockKeys(keys)) {
    await sudo.prisma.$queryRaw`SELECT 1 AS "locked" FROM pg_advisory_xact_lock(hashtext(${`pharmacy:${key}`}))`
  }
}

export class DomainConflictError extends Error {
  code = 'PHARMACY_CONFLICT'
  constructor() { super('The record changed while this request was running. Retry the same idempotent request.') }
}

export function isRetryableTransactionError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as any).code) : ''
  const message = error instanceof Error ? error.message : String(error)
  return ['P2034', 'P2037'].includes(code) || /serialization|deadlock|could not serialize/i.test(message)
}

export async function withDomainTransaction<T>(
  context: Context,
  lockKeys: string[],
  operation: (transactionContext: Context) => Promise<T>,
  options: { retries?: number } = {},
) {
  const retries = Math.max(0, Math.min(5, options.retries ?? 3))
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await context.transaction(async (transactionContext) => {
        await acquireTransactionLocks(transactionContext, lockKeys)
        await assertCurrentTransactionActor(transactionContext)
        return operation(transactionContext)
      }, { isolationLevel: 'Serializable' as any, maxWait: 10_000, timeout: 120_000 } as any)
    } catch (error) {
      if (!isRetryableTransactionError(error)) throw error
      if (attempt === retries) throw new DomainConflictError()
      await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1)))
    }
  }
  throw new DomainConflictError()
}

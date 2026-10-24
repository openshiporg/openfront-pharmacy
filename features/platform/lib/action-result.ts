/**
 * Server actions can't throw a message to the browser: production replaces it with a digest. Actions
 * throw ActionError, `guardAction` turns it into a value, and the client `unwrapAction` throws it again
 * so components keep their `.catch(cause => cause.message)`.
 */
export type ActionFailure = { actionError: string }

export class ActionError extends Error {}

export async function guardAction<T>(run: () => Promise<T>): Promise<T | ActionFailure> {
  try {
    return await run()
  } catch (error) {
    if (error instanceof ActionError) return { actionError: error.message }
    throw error
  }
}

export async function unwrapAction<T>(pending: Promise<T | ActionFailure>): Promise<T> {
  const value = await pending
  if (value && typeof value === 'object' && 'actionError' in value) throw new Error(value.actionError)
  return value as T
}

/** What a guarded action resolves to once unwrapped. */
export type ActionValue<F extends (...args: any[]) => Promise<unknown>> = Exclude<Awaited<ReturnType<F>>, ActionFailure>

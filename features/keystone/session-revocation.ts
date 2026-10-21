export function nextSessionTokenVersion(
  operation: string,
  resolvedPassword: unknown,
  currentTokenVersion: unknown,
): number | undefined {
  if (operation !== 'update' || resolvedPassword === undefined) return undefined
  return Number(currentTokenVersion || 0) + 1
}

export function isSessionTokenVersionCurrent(
  sessionTokenVersion: unknown,
  currentTokenVersion: number | null | undefined,
): boolean {
  return Number(sessionTokenVersion) === Number(currentTokenVersion || 0)
}

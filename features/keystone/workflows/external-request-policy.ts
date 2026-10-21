export const MAX_EXTERNAL_RESPONSE_BYTES = 1024 * 1024

export function externalFetchOptions(options: RequestInit = {}): RequestInit {
  return { ...options, redirect: 'error' }
}

export async function readBoundedExternalResponse(response: Response, maxBytes = MAX_EXTERNAL_RESPONSE_BYTES) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) throw new Error('External response size limit is invalid')
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await response.body?.cancel().catch(() => undefined)
    throw new Error('External response exceeds the configured size limit')
  }
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let bytesRead = 0
  let text = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytesRead += value.byteLength
      if (bytesRead > maxBytes) {
        await reader.cancel().catch(() => undefined)
        throw new Error('External response exceeds the configured size limit')
      }
      text += decoder.decode(value, { stream: true })
    }
    return text + decoder.decode()
  } finally {
    reader.releaseLock()
  }
}

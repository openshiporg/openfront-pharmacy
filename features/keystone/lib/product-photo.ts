/**
 * Order lines keep a photo snapshot. An uploaded product photo is stored as a stable
 * storage reference, never as its signed URL (signed URLs expire); it is signed again
 * each time the line is read. Products without an upload keep their plain image URL.
 */
export const PRODUCT_PHOTO_STORAGE = 'my_images'
const PREFIX = `storage:${PRODUCT_PHOTO_STORAGE}/`

/** Product fields the snapshot needs. */
export const PRODUCT_PHOTO_QUERY = 'imageUrl image { id extension }'

type PhotoProduct = { imageUrl?: string | null; image?: { id?: string | null; extension?: string | null } | null }

/** The value to store on an order line for this product. */
export function productPhotoSnapshot(product: PhotoProduct): string | undefined {
  const id = product.image?.id
  const extension = product.image?.extension
  if (id && extension && /^[\w-]+$/.test(id) && /^[a-z0-9]+$/i.test(extension)) return `${PREFIX}${id}.${extension}`
  return product.imageUrl || undefined
}

/** The stored reference split into id and extension, or null for a plain URL. */
export function parsePhotoReference(value: string | null | undefined): { id: string; extension: string } | null {
  if (!value?.startsWith(PREFIX)) return null
  const match = /^([\w-]+)\.([a-z0-9]+)$/i.exec(value.slice(PREFIX.length))
  return match ? { id: match[1], extension: match[2] } : null
}

type ImageSigner = { images(storage: string): { getUrl(id: string, extension: any): Promise<string> | string } }

/** A displayable URL for a stored line photo: references are signed now, plain URLs pass through. */
export async function resolveLinePhoto(value: string | null | undefined, context: ImageSigner): Promise<string | null> {
  if (!value) return null
  const reference = parsePhotoReference(value)
  // A malformed storage reference is not a URL; show no photo.
  if (!reference) return value.startsWith('storage:') ? null : value
  try {
    return await context.images(PRODUCT_PHOTO_STORAGE).getUrl(reference.id, reference.extension)
  } catch {
    return null
  }
}

import Link from 'next/link'
import { sanitizeStoreLogoSvg } from '@/features/lib/sanitize-store-logo'
import { normalizeStoreLogoColor } from '@/features/lib/store-logo'

export function StoreBrand({ name, logoIcon, logoColor }: { name: string; logoIcon?: string | null; logoColor?: string | null }) {
  const svg = sanitizeStoreLogoSvg(logoIcon || '')
  return <Link href="/" className="inline-flex min-h-11 min-w-0 max-w-full items-center gap-2.5 py-1">
    {svg && <span aria-hidden="true" className="block size-8 shrink-0 overflow-hidden [&>svg]:block [&>svg]:size-full" style={{ filter: `hue-rotate(${normalizeStoreLogoColor(logoColor)}deg)` }} dangerouslySetInnerHTML={{ __html: svg }} />}
    <span className="block min-w-0 truncate whitespace-nowrap text-lg font-semibold tracking-tight text-primary">{name}</span>
  </Link>
}

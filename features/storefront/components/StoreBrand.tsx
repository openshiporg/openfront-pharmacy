import Link from 'next/link'
import { sanitizeStoreLogoSvg } from '@/features/lib/sanitize-store-logo'
import { normalizeStoreLogoColor } from '@/features/lib/store-logo'

export function StoreMark({ logoIcon, logoColor, className = 'size-8' }: { logoIcon?: string | null; logoColor?: string | null; className?: string }) {
  const svg = sanitizeStoreLogoSvg(logoIcon || '')
  if (!svg) return null
  return <span aria-hidden="true" className={`block shrink-0 overflow-hidden [&>svg]:block [&>svg]:size-full ${className}`} style={{ filter: `hue-rotate(${normalizeStoreLogoColor(logoColor)}deg)` }} dangerouslySetInnerHTML={{ __html: svg }} />
}

export function StoreBrand({ name, logoIcon, logoColor }: { name: string; logoIcon?: string | null; logoColor?: string | null }) {
  return <Link href="/" className="inline-flex min-h-11 min-w-0 max-w-full items-center gap-2.5 rounded-lg py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
    <StoreMark logoIcon={logoIcon} logoColor={logoColor} />
    <span className="block min-w-0 truncate whitespace-nowrap text-[17px] font-semibold tracking-[-0.01em]">{name}</span>
  </Link>
}

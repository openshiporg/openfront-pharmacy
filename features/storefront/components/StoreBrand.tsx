import Link from 'next/link'
import { storeOwnMark } from '../lib/store-mark'
import { normalizeStoreLogoColor } from '@/features/lib/store-logo'
import { cn } from '@/lib/utils'

export function StoreMark({ logoIcon, logoColor, className = 'size-8' }: { logoIcon?: string | null; logoColor?: string | null; className?: string }) {
  const svg = storeOwnMark(logoIcon)
  if (!svg) return null
  return <span aria-hidden="true" className={`block shrink-0 overflow-hidden [&>svg]:block [&>svg]:size-full ${className}`} style={{ filter: `hue-rotate(${normalizeStoreLogoColor(logoColor)}deg)` }} dangerouslySetInnerHTML={{ __html: svg }} />
}

/** The store's mark from its settings beside its name, set plainly in the store sans (mixed case, dark). */
export function StoreBrand({ name, logoIcon, logoColor, size = 'md', className }: { name: string; logoIcon?: string | null; logoColor?: string | null; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const nameSize = size === 'lg' ? 'text-[26px] sm:text-[30px]' : size === 'sm' ? 'text-[19px]' : 'text-[20px] sm:text-[26px] lg:text-[24px]'
  const markSize = size === 'sm' ? 'size-6' : 'size-6 sm:size-9'
  return <Link href="/" aria-label={`${name} home`} className={cn('inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-full py-1 sm:gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}>
    <StoreMark logoIcon={logoIcon} logoColor={logoColor} className={markSize} />
    <span className={cn('min-w-0 max-w-full truncate font-medium leading-none tracking-[-0.01em] text-foreground', nameSize)}>{name.trim()}</span>
  </Link>
}

import Link from 'next/link'
import { storeOwnMark } from '../lib/store-mark'
import { normalizeStoreLogoColor } from '@/features/lib/store-logo'
import { cn } from '@/lib/utils'

export function StoreMark({ logoIcon, logoColor, className = 'size-8' }: { logoIcon?: string | null; logoColor?: string | null; className?: string }) {
  const svg = storeOwnMark(logoIcon)
  if (!svg) return null
  return <span aria-hidden="true" className={`block shrink-0 overflow-hidden [&>svg]:block [&>svg]:size-full ${className}`} style={{ filter: `hue-rotate(${normalizeStoreLogoColor(logoColor)}deg)` }} dangerouslySetInnerHTML={{ __html: svg }} />
}

/** Splits a trailing trade word ("Pharmacy", "Drugs", "Apothecary", "Chemist") onto a letter-spaced second line. */
function splitName(name: string) {
  const match = name.trim().match(/^(.+?)\s+(pharmacy|drugs|drug store|apothecary|chemists?)$/i)
  return match ? { main: match[1], trade: match[2] } : { main: name.trim(), trade: '' }
}

/** The store's mark from its settings beside its name, set as a red serif wordmark. */
export function StoreBrand({ name, logoIcon, logoColor, size = 'md', className }: { name: string; logoIcon?: string | null; logoColor?: string | null; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { main, trade } = splitName(name)
  const mainSize = size === 'lg' ? 'text-[30px] sm:text-[34px]' : size === 'sm' ? 'text-[20px]' : 'text-[20px] sm:text-[34px]'
  const tradeSize = size === 'sm' ? 'text-[9.5px] tracking-[0.34em]' : 'text-[9px] tracking-[0.42em] sm:text-[13px]'
  const markSize = size === 'sm' ? 'size-6' : 'size-5 sm:size-9'
  return <Link href="/" aria-label={`${name} home`} className={cn('inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-[4px] py-1 sm:gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}>
    <StoreMark logoIcon={logoIcon} logoColor={logoColor} className={markSize} />
    <span className="grid min-w-0 justify-items-center text-primary">
      <span className={cn('rx-serif max-w-full truncate font-medium uppercase leading-none tracking-[0.02em]', mainSize)}>{main}</span>
      {trade && <span className={cn('rx-serif mt-1 pl-[0.42em] font-normal uppercase leading-none text-foreground/80', tradeSize)}>{trade}</span>}
    </span>
  </Link>
}

// Pharmacy platform kit: underline tabs for filters, flat 5px buttons, bordered lists and
// tables with a status column, and plain label fields, built on the dashboard's own tokens so
// pages read as dense pharmacy operations software in the shared shell, light and dark.

import type { ComponentProps, ReactNode } from 'react'
import Link from 'next/link'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'

export const DOT_TONES = {
  ok: 'bg-emerald-500 dark:bg-emerald-400',
  warn: 'bg-amber-500 dark:bg-amber-400',
  danger: 'bg-red-500 dark:bg-red-400',
  info: 'bg-sky-500 dark:bg-sky-400',
  accent: 'bg-teal-600 dark:bg-teal-400',
  muted: 'bg-zinc-400 dark:bg-zinc-500',
} as const

export type DotTone = keyof typeof DOT_TONES

const TEXT_TONES: Record<DotTone, string> = {
  ok: 'text-emerald-700 dark:text-emerald-400',
  warn: 'text-amber-700 dark:text-amber-400',
  danger: 'text-red-700 dark:text-red-400',
  info: 'text-sky-700 dark:text-sky-400',
  accent: 'text-teal-700 dark:text-teal-400',
  muted: 'text-muted-foreground',
}

/** A label that starts with a capital: stored states read "pending review". */
const upperFirst = (value: ReactNode) => typeof value === 'string' && value ? value.charAt(0).toUpperCase() + value.slice(1) : value

/** Status text in its tone colour, for a status column. */
export function StatusText({ tone, children, className }: { tone: DotTone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-baseline gap-1.5 whitespace-nowrap text-[13px] font-medium', TEXT_TONES[tone], className)}><Dot tone={tone} />{upperFirst(children)}</span>
}

/** 6px status mark for a title line or status cell: give the parent `items-baseline`. */
export function Dot({ tone = 'muted', className }: { tone?: DotTone; className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block size-1.5 shrink-0 -translate-y-[0.15em] rounded-full', DOT_TONES[tone], className)} />
}

/** The underline tab bar. */
export const trackClass = 'inline-flex max-w-full items-end gap-5 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

/** An underline tab; the current one is underlined in the foreground colour. */
export const pillClass = 'relative -mb-px inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent pb-2 pt-1.5 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[active=true]:border-foreground data-[active=true]:text-foreground max-sm:min-h-10'

/** A flat 5px button; outline is the default secondary action. */
export const buttonClass = 'inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[5px] border border-border bg-background px-3 text-[13px] font-medium text-foreground shadow-xs transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 max-sm:min-h-10'

/** Primary action: a solid foreground button. */
export const primaryPillClass = 'inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[5px] border border-foreground bg-foreground px-3 text-[13px] font-medium text-background transition-colors duration-150 hover:bg-foreground/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 max-sm:min-h-10'

export function Track({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return <div role="group" aria-label={label} className={cn(trackClass, className)}>{children}</div>
}

export function Pill({ active, className, ...props }: ComponentProps<'button'> & { active?: boolean }) {
  return <button type="button" aria-pressed={Boolean(active)} data-active={Boolean(active)} className={cn(pillClass, className)} {...props} />
}

export function PillLink({ active, className, ...props }: ComponentProps<typeof Link> & { active?: boolean }) {
  return <Link aria-current={active ? 'page' : undefined} data-active={Boolean(active)} className={cn(pillClass, className)} {...props} />
}

/** A secondary action as a link: an outline button. */
export function RaisedLink({ className, children, ...props }: ComponentProps<typeof Link>) {
  return <Link className={cn(buttonClass, className)} {...props}>{children}</Link>
}

export function Count({ children }: { children: ReactNode }) {
  return <span className="text-xs font-normal tabular-nums text-muted-foreground">{children ?? 0}</span>
}

/** Page or record title with an optional state dot on the same line. */
export function TitleLine({ as: Tag = 'h1', title, tone, state, className, titleClassName }: { as?: 'h1' | 'h2' | 'h3'; title: ReactNode; tone?: DotTone; state?: ReactNode; className?: string; titleClassName?: string }) {
  return <div className={cn('flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1', className)}>
    <Tag className={cn('min-w-0 font-semibold tracking-tight text-foreground', Tag === 'h1' ? 'text-lg' : 'text-[14px]', titleClassName)}>{title}</Tag>
    {state && <span className={cn('inline-flex items-baseline gap-1.5 whitespace-nowrap text-[13px] font-medium', tone ? TEXT_TONES[tone] : 'text-muted-foreground')}>{tone && <Dot tone={tone} />}{upperFirst(state)}</span>}
  </div>
}

/** A bordered list with ruled rows. */
export function ListBand({ className, children, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-w-0 divide-y divide-border overflow-hidden rounded-[6px] border border-border bg-card', className)} {...props}>{children}</div>
}

export function SectionTitle({ children, meta, action }: { children: ReactNode; meta?: ReactNode; action?: ReactNode }) {
  return <div className="mb-2 flex min-h-8 flex-wrap items-center justify-between gap-3">
    <h2 className="flex items-baseline gap-2 text-[13px] font-semibold text-foreground">{children}{meta !== undefined && <Count>{meta}</Count>}</h2>
    {action}
  </div>
}

/** A label over its value. */
export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={cn('min-w-0', className)}>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 break-words text-[13px] font-medium text-foreground">{children}</dd>
  </div>
}

/** Figures: tabular numerals in the UI face. */
export function Mono({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('tabular-nums', className)} {...props} />
}

export function Callout({ tone = 'warn', title, children, className }: { tone?: 'warn' | 'danger' | 'muted'; title?: ReactNode; children?: ReactNode; className?: string }) {
  return <div role={tone === 'muted' ? 'status' : 'alert'} className={cn('rounded-[6px] border px-3 py-2.5 text-[13px]', tone === 'warn' && 'border-amber-300/70 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100', tone === 'danger' && 'border-red-300/70 bg-red-50 text-red-950 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-100', tone === 'muted' && 'border-border bg-card text-muted-foreground', className)}>
    {title && <p className="flex items-baseline gap-2 font-semibold"><Dot tone={tone === 'muted' ? 'muted' : tone} />{title}</p>}
    {children && <div className={cn(title && 'mt-1.5')}>{children}</div>}
  </div>
}

export function EmptyBand({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-[6px] border border-dashed border-border px-6 py-8 text-center">
    <p className="text-[13px] text-muted-foreground">{children}</p>
    {action}
  </div>
}

export function humanize(value?: string | null) {
  return value ? value.replaceAll('_', ' ') : ''
}

/** Tone for the common pharmacy workflow states. */
export function statusTone(status?: string | null): DotTone {
  const value = String(status || '')
  if (['active', 'available', 'validated', 'human_verified', 'confirmed', 'approved', 'dispensed', 'completed', 'handed_off', 'ready', 'ready_for_pickup', 'delivered', 'processed', 'paid', 'closed', 'resolved', 'recorded'].includes(value)) return 'ok'
  if (['expired', 'recalled', 'rejected', 'cancelled', 'failed', 'payment_failed', 'dead_letter', 'error', 'exception', 'restricted', 'disabled'].includes(value)) return 'danger'
  if (['pending_review', 'needs_information', 'on_hold', 'hold', 'quarantined', 'review_required', 'not_reviewed', 'validation_required', 'retry_pending', 'refund_pending', 'refill_requested', 'transfer_requested', 'inactive', 'merged'].includes(value)) return 'warn'
  if (['pending', 'draft', 'processing', 'preparing', 'in_progress', 'partially_dispensed', 'ready_to_dispense', 'out_for_delivery', 'quarantined_pending'].includes(value)) return 'info'
  return 'muted'
}

type RxButtonProps = ComponentProps<'button'> & {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

/** In-page action button: primary is solid, outline/secondary is bordered, destructive is red text on a border. Same props as the ui Button. */
export function RxButton({ variant = 'default', size = 'default', asChild, className, ...props }: RxButtonProps) {
  const Component = asChild ? Slot : 'button'
  const sizing = size === 'icon' ? 'size-8 px-0 max-sm:size-10' : size === 'sm' ? 'min-h-7 px-2.5 text-xs' : size === 'lg' ? 'min-h-9 px-4' : ''
  const look = variant === 'outline' || variant === 'secondary' ? buttonClass
    : variant === 'ghost' ? cn(buttonClass, 'border-transparent bg-transparent shadow-none')
    : variant === 'link' ? 'inline-flex items-center gap-1 text-[13px] font-medium text-foreground underline-offset-4 hover:underline'
    : variant === 'destructive' ? cn(buttonClass, 'text-red-700 hover:border-red-300 hover:bg-red-50 dark:text-red-400 dark:hover:border-red-900 dark:hover:bg-red-950/40')
    : primaryPillClass
  return <Component className={cn(look, '[&_svg]:size-4', sizing, className)} {...props} />
}

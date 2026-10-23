// Pharmacy platform kit: the raised-pill-in-recessed-track control, title-line status
// dots, list bands and label fields, built on the dashboard's own tokens so pages sit
// naturally in the shared shell in light and dark.

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

/** 8px dot for a title line: give the parent `items-baseline`. */
export function Dot({ tone = 'muted', className }: { tone?: DotTone; className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block size-2 shrink-0 -translate-y-[0.1em] rounded-full', DOT_TONES[tone], className)} />
}

export const trackClass = 'inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-muted p-[3px] shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] [scrollbar-width:none] dark:bg-muted/60'

export const pillClass = 'inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-medium text-muted-foreground transition-[color,background-color,box-shadow] duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-[0_1px_2px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.06)] dark:data-[active=true]:bg-zinc-800 max-sm:min-h-10'

/** Primary action: an ink pill. */
export const primaryPillClass = 'inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-foreground px-4 text-[13px] font-semibold text-background transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 max-sm:min-h-10'

export function Track({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return <div role="group" aria-label={label} className={cn(trackClass, className)}>{children}</div>
}

export function Pill({ active, className, ...props }: ComponentProps<'button'> & { active?: boolean }) {
  return <button type="button" aria-pressed={Boolean(active)} data-active={Boolean(active)} className={cn(pillClass, className)} {...props} />
}

export function PillLink({ active, className, ...props }: ComponentProps<typeof Link> & { active?: boolean }) {
  return <Link aria-current={active ? 'page' : undefined} data-active={Boolean(active)} className={cn(pillClass, className)} {...props} />
}

/** A secondary action: one raised pill in its own recessed track. */
export function RaisedLink({ className, children, ...props }: ComponentProps<typeof Link>) {
  return <span className={cn(trackClass, 'w-fit')}><Link data-active="true" className={cn(pillClass, 'px-3.5 font-semibold', className)} {...props}>{children}</Link></span>
}

export function Count({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{children ?? 0}</span>
}

/** Page or record title with an optional state dot on the same line. */
export function TitleLine({ as: Tag = 'h1', title, tone, state, className, titleClassName }: { as?: 'h1' | 'h2' | 'h3'; title: ReactNode; tone?: DotTone; state?: ReactNode; className?: string; titleClassName?: string }) {
  return <div className={cn('flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1', className)}>
    <Tag className={cn('min-w-0 font-semibold tracking-tight text-foreground', Tag === 'h1' ? 'text-2xl' : 'text-[15px]', titleClassName)}>{title}</Tag>
    {state && <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap text-sm capitalize text-muted-foreground">{tone && <Dot tone={tone} />}{state}</span>}
  </div>
}

/** One recessed band with hairline rows, instead of stacked cards. */
export function ListBand({ className, children, ...props }: ComponentProps<'div'>) {
  return <div className={cn('divide-y divide-border overflow-hidden rounded-xl bg-muted/40 shadow-[inset_0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-inset ring-border/60', className)} {...props}>{children}</div>
}

export function SectionTitle({ children, meta, action }: { children: ReactNode; meta?: ReactNode; action?: ReactNode }) {
  return <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
    <h2 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">{children}{meta !== undefined && <Count>{meta}</Count>}</h2>
    {action}
  </div>
}

/** Mono label over a value, as on a dispensing label. */
export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={cn('min-w-0', className)}>
    <dt className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">{label}</dt>
    <dd className="mt-1 break-words text-sm font-medium text-foreground">{children}</dd>
  </div>
}

export function Mono({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('font-mono tabular-nums', className)} {...props} />
}

export function Callout({ tone = 'warn', title, children, className }: { tone?: 'warn' | 'danger' | 'muted'; title?: ReactNode; children?: ReactNode; className?: string }) {
  return <div role={tone === 'muted' ? 'status' : 'alert'} className={cn('rounded-xl px-4 py-3 text-sm', tone === 'warn' && 'bg-amber-50 text-amber-950 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-900', tone === 'danger' && 'bg-red-50 text-red-950 ring-1 ring-inset ring-red-200 dark:bg-red-950/30 dark:text-red-100 dark:ring-red-900', tone === 'muted' && 'bg-muted/60 text-muted-foreground', className)}>
    {title && <p className="flex items-baseline gap-2 font-semibold"><Dot tone={tone === 'muted' ? 'muted' : tone} />{title}</p>}
    {children && <div className={cn(title && 'mt-1.5')}>{children}</div>}
  </div>
}

export function EmptyBand({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="flex min-h-44 flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-10 text-center">
    <p className="text-sm font-medium text-foreground">{children}</p>
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

/**
 * In-page action button. Primary is an ink pill; outline/secondary is a raised pill in
 * its own recessed track; destructive is a red pill. Same props as the ui Button.
 */
export function RxButton({ variant = 'default', size = 'default', asChild, className, ...props }: RxButtonProps) {
  const Component = asChild ? Slot : 'button'
  const sizing = size === 'icon' ? 'size-9 px-0 max-sm:size-10' : size === 'sm' ? 'min-h-8 px-3 text-xs' : size === 'lg' ? 'min-h-10 px-5' : ''
  if (variant === 'outline' || variant === 'secondary') {
    return <span className={cn(trackClass, 'w-fit align-middle', className?.includes('w-full') && 'flex w-full', className?.match(/\bm[trblxy]?-\S+/g)?.join(' '))}>
      <Component data-active="true" className={cn(pillClass, 'px-3.5 font-semibold [&_svg]:size-4', sizing, className?.replace(/\bm[trblxy]?-\S+/g, ''))} {...props} />
    </span>
  }
  return <Component className={cn(
    variant === 'ghost' ? cn(pillClass, 'hover:bg-muted') : variant === 'link' ? 'inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline' : variant === 'destructive' ? cn(primaryPillClass, 'bg-red-600 text-white dark:bg-red-500') : primaryPillClass,
    '[&_svg]:size-4',
    sizing,
    className,
  )} {...props} />
}

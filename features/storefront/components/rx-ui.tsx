// Storefront kit: pills with a solid ink chosen state, title-line status dots, perforated
// bands and buttons. Server-safe; client pieces import from here too.

import type { ComponentProps, ReactNode } from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export const DOT_TONES = {
  ok: 'bg-emerald-400',
  warn: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-sky-400',
  brand: 'bg-primary',
  muted: 'bg-muted-foreground/45',
} as const

export type DotTone = keyof typeof DOT_TONES

/** 8px dot for a title line: give the parent `items-baseline`. */
export function Dot({ tone = 'muted', className }: { tone?: DotTone; className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block size-2 shrink-0 -translate-y-[0.1em] rounded-full', DOT_TONES[tone], className)} />
}

/** A heading with a status dot and state label on the same line. */
export function TitleLine({ as: Tag = 'h2', title, tone, state, className, titleClassName }: { as?: 'h1' | 'h2' | 'h3'; title: ReactNode; tone?: DotTone; state?: ReactNode; className?: string; titleClassName?: string }) {
  return <div className={cn('flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1', className)}>
    <Tag className={cn('min-w-0 font-semibold tracking-tight', titleClassName)}>{title}</Tag>
    {state && <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap text-sm text-muted-foreground">{tone && <Dot tone={tone} />}{state}</span>}
  </div>
}

export const trackClass = 'inline-flex max-w-full items-center gap-1 overflow-x-auto no-scrollbar'

export const pillClass = 'inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[14px] bg-muted px-4 text-[14px] font-semibold text-muted-foreground transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-foreground active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-foreground data-[active=true]:text-background max-sm:min-h-11'

export function Track({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return <div role="group" aria-label={label} className={cn(trackClass, className)}>{children}</div>
}

export function Pill({ active, className, ...props }: ComponentProps<'button'> & { active?: boolean }) {
  return <button type="button" aria-pressed={Boolean(active)} data-active={Boolean(active)} className={cn(pillClass, className)} {...props} />
}

export function PillLink({ active, className, ...props }: ComponentProps<typeof Link> & { active?: boolean }) {
  return <Link aria-current={active ? 'page' : undefined} data-active={Boolean(active)} className={cn(pillClass, className)} {...props} />
}

/** Primary action: a solid brand pill. */
export const buttonClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-primary px-6 text-[15px] font-bold text-primary-foreground transition-[filter,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:brightness-110 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60'

/** Secondary action: the chosen-pill style, as a link. */
export function SecondaryAction({ className, children, ...props }: ComponentProps<typeof Link>) {
  return <span className={cn(trackClass, 'w-fit')}><Link data-active="true" className={cn(pillClass, 'min-h-10 px-4 font-semibold', className)} {...props}>{children}</Link></span>
}

/** A band: one card-stock panel with perforated rows. */
export function Band({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rx-card divide-y-2 divide-dotted divide-[var(--rx-perf)] overflow-hidden', className)}>{children}</div>
}

/** Small field label over a value, as on a dispensing label. */
export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={cn('min-w-0', className)}>
    <dt className="rx-eyebrow">{label}</dt>
    <dd className="mt-1 break-words text-sm font-medium">{children}</dd>
  </div>
}

export function PageHead({ eyebrow, title, meta, className, children }: { eyebrow?: ReactNode; title: ReactNode; meta?: ReactNode; className?: string; children?: ReactNode }) {
  return <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
    <div className="min-w-0">
      <h1 className="text-[2.5rem] font-extrabold leading-[0.95] tracking-[-0.04em] text-balance sm:text-[3.5rem]">{title}</h1>
      {meta && <p className="mt-2 text-sm text-muted-foreground">{meta}</p>}
    </div>
    {children}
  </header>
}

export function Notice({ tone = 'muted', children, className }: { tone?: 'muted' | 'danger' | 'brand'; children: ReactNode; className?: string }) {
  return <p role={tone === 'danger' ? 'alert' : 'status'} className={cn('rounded-[14px] px-4 py-3 text-sm', tone === 'danger' ? 'bg-destructive/10 text-destructive' : tone === 'brand' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground', className)}>{children}</p>
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="rx-card px-6 py-14 text-center">
    <p className="font-semibold">{title}</p>
    {children && <div className="mt-4 flex justify-center">{children}</div>}
  </div>
}

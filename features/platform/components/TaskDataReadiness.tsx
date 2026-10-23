import { cn } from '@/lib/utils'
import { Callout, Dot } from './rx-ui'

export function TaskDataReadiness({ metrics, missingMessage }: {
  metrics: Array<{ label: string; value: number }>
  missingMessage?: string
}) {
  return (
    <div className="space-y-3">
      <dl className={cn('grid gap-px overflow-hidden rounded-lg bg-border ring-1 ring-border', metrics.length > 2 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2')}>
        {metrics.map((metric) => <div key={metric.label} className="bg-background px-4 py-3">
          <dt className="flex items-baseline gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground"><Dot tone={metric.value > 0 ? 'ok' : 'warn'} className="size-1.5" />{metric.label}</dt>
          <dd className="mt-1 font-mono text-xl tabular-nums text-foreground">{metric.value}</dd>
        </div>)}
      </dl>
      {missingMessage && <Callout tone="warn">{missingMessage}</Callout>}
    </div>
  )
}

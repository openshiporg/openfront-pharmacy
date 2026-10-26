import { cn } from '@/lib/utils'
import { Callout, Dot } from './rx-ui'

export function TaskDataReadiness({ metrics, missingMessage }: {
  metrics: Array<{ label: string; value: number }>
  missingMessage?: string
}) {
  return (
    <div className="space-y-3">
      <dl className={cn('grid gap-px overflow-hidden rounded-[6px] border border-border bg-border', metrics.length > 2 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2')}>
        {metrics.map((metric) => <div key={metric.label} className="bg-card px-3 py-2">
          <dt className="flex items-baseline gap-1.5 text-xs text-muted-foreground"><Dot tone={metric.value > 0 ? 'ok' : 'warn'} className="size-1.5" />{metric.label}</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{metric.value}</dd>
        </div>)}
      </dl>
      {missingMessage && <Callout tone="warn">{missingMessage}</Callout>}
    </div>
  )
}

import { AlertCircle } from 'lucide-react'

export function TaskDataReadiness({ metrics, missingMessage }: {
  metrics: Array<{ label: string; value: number }>
  missingMessage?: string
}) {
  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => <div key={metric.label} className="rounded-lg border bg-muted/20 p-4"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{metric.label}</dt><dd className="mt-2 text-2xl font-semibold">{metric.value}</dd></div>)}
      </dl>
      {missingMessage && <div role="status" className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><AlertCircle className="mt-0.5 size-4 shrink-0" /><p>{missingMessage}</p></div>}
    </div>
  )
}

import { Callout } from './rx-ui'

/** Says what is missing before a task can start. Says nothing when the task is ready. */
export function TaskDataReadiness({ metrics, missingMessage }: {
  metrics: Array<{ label: string; value: number }>
  missingMessage?: string
}) {
  if (!missingMessage) return null
  const missing = metrics.filter((metric) => metric.value === 0).map((metric) => metric.label.toLowerCase())
  return <Callout tone="warn">{missingMessage}{missing.length > 0 && <span className="mt-1 block text-[13px]">Still needed: {missing.join(', ')}.</span>}</Callout>
}

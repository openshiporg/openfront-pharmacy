import type { WorkflowPriority } from './WorkflowQueuePage'

export function reportedAge(value?: string | null, now = Date.now()) {
  if (!value) return 'Age not reported'
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Age not reported'
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000))
  if (minutes < 60) return `${minutes}m in workflow`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h in workflow`
  return `${Math.floor(hours / 24)}d in workflow`
}

export function expiryContext(value?: string | null, now = Date.now()): { label: string; priority: WorkflowPriority; exception?: string } {
  if (!value) return { label: 'Expiration not reported', priority: 'attention', exception: 'Expiration evidence is missing' }
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return { label: 'Expiration not reported', priority: 'attention', exception: 'Expiration evidence is invalid' }
  const days = Math.ceil((timestamp - now) / 86_400_000)
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, priority: 'critical', exception: 'Lot is past its reported expiration date' }
  if (days <= 60) return { label: `Expires in ${days}d`, priority: 'attention', exception: 'Lot expires within 60 days' }
  return { label: `Expires in ${days}d`, priority: 'routine' }
}

export function strongestPriority(...priorities: WorkflowPriority[]): WorkflowPriority {
  if (priorities.includes('critical')) return 'critical'
  if (priorities.includes('attention')) return 'attention'
  return 'routine'
}

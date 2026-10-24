'use server'

import { runMutation } from '../../lib/mutate'

export async function replayOutboxEvent(eventId: string) {
  return runMutation('mutation Replay($eventId: ID!) { replayPharmacyOutboxEvent(eventId: $eventId) { id status } }', { eventId }, ['/dashboard/platform/audit'])
}

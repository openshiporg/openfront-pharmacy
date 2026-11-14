/**
 * Dashboard model pages follow the list's own access (2026-11-13 re-audit).
 *
 * The generic /dashboard/<list> pages and the home page's model cards read Keystone's per-session
 * `isHidden` and `hideCreate`. Unless a list sets them itself:
 * - a list is hidden when the role cannot query it, when its row filter matches nothing for the role,
 *   or when its rows are patient or prescription records the role has no private-data authority for;
 * - "Create" is hidden when the role cannot create in the list (the server refuses that write anyway).
 */
import { canReadPrivatePatientRecords, canReadPrivatePrescriptionRecords, rules } from '../access'

type AnyArgs = Record<string, any>
type AnyFn = (args: AnyArgs) => any

const PATIENT_ROW_RULES = new Set<unknown>([
  rules.canReadPatients,
  rules.canReadPatientChildren,
  rules.canReadLocationScopedPatientChildren,
])
const PRESCRIPTION_ROW_RULES = new Set<unknown>([
  rules.canReadPrescriptionRecords,
  rules.canReadPrescriptionChildren,
])

function operationRule(access: any, operation: 'query' | 'create'): AnyFn | undefined {
  if (typeof access === 'function') return access
  const rule = access?.operation
  if (typeof rule === 'function') return rule
  return typeof rule?.[operation] === 'function' ? rule[operation] : undefined
}

export function secureAdminUi<T extends Record<string, any>>(lists: T): T {
  return Object.fromEntries(Object.entries(lists).map(([listKey, list]) => {
    const ui = list.ui ?? {}
    const query = operationRule(list.access, 'query')
    const create = operationRule(list.access, 'create')
    const filter: AnyFn | undefined = typeof list.access === 'object' && typeof list.access?.filter?.query === 'function' ? list.access.filter.query : undefined
    const next = { ...ui }
    if (ui.isHidden === undefined) {
      next.isHidden = async (args: AnyArgs) => {
        const call = { ...args, listKey, operation: 'query' }
        if (query && !(await query(call))) return true
        if (filter && PATIENT_ROW_RULES.has(filter)) return !canReadPrivatePatientRecords({ session: args.session })
        if (filter && PRESCRIPTION_ROW_RULES.has(filter)) return !canReadPrivatePrescriptionRecords({ session: args.session })
        return Boolean(filter && (await filter(call)) === false)
      }
    }
    if (ui.hideCreate === undefined && create) {
      next.hideCreate = async (args: AnyArgs) => !(await create({ ...args, listKey, operation: 'create' }))
    }
    return [listKey, { ...list, ui: next }]
  })) as T
}

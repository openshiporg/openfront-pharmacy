/**
 * Filter and sort access for every list (2026-11-13 PHI fix).
 *
 * Keystone checks `isFilterable` per field but applies no access control to the rows a nested
 * relation filter reaches, so `drugReferencesCount(where: { prescriptionItems: { some: { prescription:
 * { patient: { lastName: { startsWith: "B" } } } } } })` counted patients a signed-out visitor cannot read.
 *
 * - A relationship field is filterable only when the viewer can query the related list (and read the
 *   relationship field itself), and the related list's own row filter is ANDed into every nested filter,
 *   so a filter can only ever match rows the viewer could read.
 * - A field with a read rule is filterable and orderable only when that rule passes.
 * - Secrets (password and token hashes, provider credentials, request fingerprints) are never filterable.
 *
 * Sudo contexts keep full filtering: Keystone's sudo schema forces isFilterable/isOrderable on and the
 * injected row filter is skipped when the context is sudo.
 */

type AnyArgs = Record<string, any>
type AnyFn = (args: AnyArgs) => any
type ListConfig = { access?: any; fields: Record<string, any> }

export const NEVER_FILTERABLE_FIELDS = new Set([
  'password',
  'passwordResetToken',
  'magicAuthToken',
  'tokenHash',
  'tokenPrefix',
  'tokenVersion',
  'guestTokenHash',
  'credentials',
  'requestFingerprint',
  'commandFingerprint',
  'identityKey',
])

const allow = () => true

function operationQuery(list: ListConfig): AnyFn {
  const access = list.access
  if (typeof access === 'function') return access
  const operation = access?.operation
  if (typeof operation === 'function') return operation
  return operation?.query ?? allow
}

function filterQuery(list: ListConfig): AnyFn {
  const access = list.access
  if (typeof access === 'function') return allow
  return access?.filter?.query ?? allow
}

function fieldRead(access: any): AnyFn | undefined {
  if (typeof access === 'function') return access
  return typeof access?.read === 'function' ? access.read : undefined
}

// Objects produced by list access filters; nested relation filters inside them are not re-scoped.
const trusted = new WeakSet<object>()
function trust<T>(value: T): T {
  if (value && typeof value === 'object' && !trusted.has(value as object)) {
    trusted.add(value as object)
    for (const child of Object.values(value as object)) trust(child)
  }
  return value
}

const sudoContexts = new WeakMap<object, boolean>()
function isSudo(context: any) {
  if (!context || typeof context !== 'object') return false
  let sudo = sudoContexts.get(context)
  if (sudo === undefined) {
    sudo = Boolean(context.sudo && context.sudo().graphql.schema === context.graphql?.schema)
    sudoContexts.set(context, sudo)
  }
  return sudo
}

async function listQueryAccess(lists: Record<string, ListConfig>, listKey: string, context: any) {
  const list = lists[listKey]
  const args = { session: context?.session, context, listKey, operation: 'query' }
  if (!list || !(await operationQuery(list)(args))) return false
  return await filterQuery(list)(args) as boolean | Record<string, unknown>
}

const NO_ROWS = { id: { in: [] as string[] } }

async function scopeRelationFilter(
  lists: Record<string, ListConfig>,
  foreignListKey: string,
  many: boolean,
  value: any,
  context: any,
) {
  if (value === null || value === undefined || trusted.has(value) || isSudo(context)) return value
  const rowFilter = await listQueryAccess(lists, foreignListKey, context)
  if (rowFilter === true) return value
  const scope = trust(rowFilter === false ? NO_ROWS : rowFilter)
  if (!many) return { AND: [value, scope] }
  return Object.fromEntries(Object.entries(value).map(([key, inner]) => {
    if (inner === null) return [key, inner]
    // every: each row the viewer can read matches; rows it cannot read do not count either way.
    if (key === 'every') return [key, { OR: [inner, { NOT: [scope] }] }]
    return [key, { AND: [inner, scope] }]
  }))
}

function secureField(lists: Record<string, ListConfig>, fieldKey: string, fieldFunc: any) {
  if (typeof fieldFunc !== 'function') return fieldFunc
  return (data: any) => {
    const f = fieldFunc(data)
    if (NEVER_FILTERABLE_FIELDS.has(fieldKey)) return { ...f, isFilterable: false, isOrderable: false }

    const read = fieldRead(f.access)
    const readGate = async (args: AnyArgs) => !read || Boolean(await read({ ...args, operation: 'read' }))

    if (f.dbField?.kind === 'relation') {
      const foreignListKey: string = f.dbField.list
      const many = f.dbField.mode === 'many'
      const where = f.input?.where
      return {
        ...f,
        isFilterable: async (args: AnyArgs) =>
          (await readGate(args)) && (await listQueryAccess(lists, foreignListKey, args.context)) !== false,
        isOrderable: readGate,
        input: where ? {
          ...f.input,
          where: {
            ...where,
            resolve: async (value: any, context: any, resolve: any) => {
              const scoped = await scopeRelationFilter(lists, foreignListKey, many, value, context)
              if (!many || scoped === value) return where.resolve ? where.resolve(scoped, context, resolve) : resolve(scoped)
              // Keystone's many-relation resolver ignores its argument and reads the original input object
              // synchronously, so swap the scoped keys in for the call and restore them straight after;
              // the filter-access walk that follows then sees only the viewer's own filter.
              const original = { ...value }
              Object.assign(value, scoped)
              try {
                return where.resolve ? where.resolve(value, context, resolve) : resolve(value)
              } finally {
                for (const key of Object.keys(value)) delete value[key]
                Object.assign(value, original)
              }
            },
          },
        } : f.input,
      }
    }

    if (!read) return f
    return { ...f, isFilterable: readGate, isOrderable: readGate }
  }
}

/** The list's own row filters are already the viewer's scope; their nested relation filters are not re-scoped. */
function trustAccessFilters(access: any) {
  if (!access || typeof access !== 'object' || !access.filter) return access
  const filter = Object.fromEntries(Object.entries(access.filter).map(([operation, rule]) => [operation,
    typeof rule === 'function' ? async (args: AnyArgs) => trust(await (rule as AnyFn)(args)) : rule]))
  return { ...access, filter }
}

/** Applies the rules above to every field of every list. Call on the final config (after withAuth). */
export function secureFilterAccess<T extends { lists: Record<string, any> }>(config: T): T {
  const lists = config.lists as Record<string, ListConfig>
  return {
    ...config,
    lists: Object.fromEntries(Object.entries(lists).map(([listKey, list]) => [listKey, {
      ...list,
      access: trustAccessFilters(list.access),
      fields: Object.fromEntries(Object.entries(list.fields).map(([fieldKey, fieldFunc]) =>
        [fieldKey, fieldKey.startsWith('__group') ? fieldFunc : secureField(lists, fieldKey, fieldFunc)])),
    }])),
  }
}

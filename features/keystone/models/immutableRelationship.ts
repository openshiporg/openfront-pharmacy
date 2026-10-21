import { denyAll } from '@keystone-6/core/access'

/** Parent-side relationship writes can bypass the child list's operation policy. */
export const immutableRelationship = {
  create: denyAll,
  update: denyAll,
}

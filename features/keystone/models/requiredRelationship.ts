/**
 * Keystone relationships are nullable in its default Prisma output. These
 * relations are tenant or evidence identity, so their database columns must
 * be required as well as guarded by domain hooks.
 */
export const requiredRelationshipDb = {
  extendPrismaSchema(field: string) {
    return field.replaceAll('?', '')
  },
}

import { GraphQLError } from "graphql";
import type { Plugin } from "graphql-yoga";

// Keystone attaches the raw Prisma invocation (inputs, password hashes) to KS_PRISMA_ERROR as
// extensions.debug / extensions.prisma. Only local development may see them.
export const stripPrismaDebug: Plugin = {
  onExecutionResult({ result, setResult }) {
    if (process.env.NODE_ENV === "development" || !result || !("errors" in result) || !result.errors?.length) return;
    setResult({
      ...result,
      errors: result.errors.map((error) => {
        const { debug, prisma, ...extensions } = (error.extensions || {}) as Record<string, unknown>;
        if (debug === undefined && prisma === undefined) return error;
        return new GraphQLError(error.message, { nodes: error.nodes, source: error.source, positions: error.positions, path: error.path, extensions });
      }),
    });
  },
};


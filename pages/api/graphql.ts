import { keystoneContext } from '../../features/keystone/context'
import { createYoga } from "graphql-yoga";
import { stripPrismaDebug } from "../../features/keystone/security/graphql-errors";
// @ts-ignore
import processRequest from "graphql-upload/processRequest.js";
import { type NextApiRequest, type NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const contentType = req.headers["content-type"];
  if (contentType?.startsWith("multipart/form-data")) {
    req.body = await processRequest(req, res);
  }

  return createYoga({
    graphiql: false,
    graphqlEndpoint: "/api/graphql",
    schema: keystoneContext.graphql.schema,
    context: ({ req, res }: { req: any; res: any }) => {
      return keystoneContext.withRequest(req, res);
    },
    multipart: false,
    plugins: [stripPrismaDebug],
  })(req, res);
}
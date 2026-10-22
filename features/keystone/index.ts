import { s3ForcePathStyle } from "./lib/s3-storage";
import { createAuth } from '@keystone-6/auth'
import { config } from '@keystone-6/core'
import 'dotenv/config'
import Iron from '@hapi/iron'
import * as cookie from 'cookie'

import { permissions } from './access'
import { sendPasswordResetEmail } from './lib/mail'
import { models } from './models'
import { permissionsList } from './models/fields'
import { isSessionTokenVersionCurrent } from './session-revocation'
import { extendGraphqlSchema } from './mutations'

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

function productionEnv(name: string, developmentFallback: string): string {
  if (process.env[name]) return process.env[name]!
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} is required in production`)
  }
  return developmentFallback
}

const databaseURL = requiredEnv('DATABASE_URL')
const sessionSecret = requiredEnv('SESSION_SECRET')
if (sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters long')
}

export const basePath = '/dashboard'

const sessionConfig = {
  maxAge: 60 * 60 * 24 * 30,
  secret: sessionSecret,
}

const bucketName = productionEnv('S3_BUCKET_NAME', 'keystone-test')
const region = productionEnv('S3_REGION', 'ap-southeast-2')
const accessKeyId = productionEnv('S3_ACCESS_KEY_ID', 'keystone')
const secretAccessKey = productionEnv('S3_SECRET_ACCESS_KEY', 'keystone')
const endpoint = productionEnv('S3_ENDPOINT', 'https://sfo3.digitaloceanspaces.com')

// A sealed session is valid only while its tokenVersion matches the user's
// current tokenVersion (bumped on password change).
async function refreshHumanSession(context: any, session: any) {
  if (session?.listKey !== 'User' || !session.itemId) return undefined
  const current = await context.prisma.user.findUnique({ where: { id: session.itemId }, select: { tokenVersion: true } })
  if (!current || !isSessionTokenVersionCurrent(session.tokenVersion, current.tokenVersion)) return undefined
  return session
}

export function statelessSessions({
  secret,
  maxAge = 60 * 60 * 24 * 30,
  path = '/',
  secure = process.env.NODE_ENV === 'production',
  ironOptions = Iron.defaults,
  domain,
  sameSite = 'lax' as const,
  cookieName = 'keystonejs-session',
}: {
  secret: string
  maxAge?: number
  path?: string
  secure?: boolean
  ironOptions?: any
  domain?: string
  sameSite?: 'lax' | 'none' | 'strict' | boolean
  cookieName?: string
}) {
  if (!secret) {
    throw new Error('You must specify a session secret to use sessions')
  }
  if (secret.length < 32) {
    throw new Error('The session secret must be at least 32 characters long')
  }

  return {
    async get({ context }: { context: any }) {
      if (!context?.req) return

      const authHeader = context.req.headers.authorization
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const accessToken = authHeader.slice(7)
        try {
          return await refreshHumanSession(context, await Iron.unseal(accessToken, secret, ironOptions))
        } catch { return undefined }
      }
      const cookies = cookie.parse(context.req.headers.cookie || '')
      const token = cookies[cookieName]
      if (!token) return
      try {
        return await refreshHumanSession(context, await Iron.unseal(token, secret, ironOptions))
      } catch { return undefined }
    },
    async end({ context }: { context: any }) {
      if (!context?.res) return

      context.res.setHeader(
        'Set-Cookie',
        cookie.serialize(cookieName, '', {
          maxAge: 0,
          expires: new Date(),
          httpOnly: true,
          secure,
          path,
          sameSite,
          domain,
        })
      )
    },
    async start({ context, data }: { context: any; data: any }) {
      if (!context?.res) return

      let sessionData = data
      if (data?.listKey === 'User' && data?.itemId) {
        const current = await context.prisma.user.findUnique({ where: { id: data.itemId }, select: { tokenVersion: true } })
        if (!current) throw new Error('Cannot start a session for a missing user')
        sessionData = { ...data, tokenVersion: Number(current.tokenVersion || 0) }
      }
      const sealedData = await Iron.seal(sessionData, secret, {
        ...ironOptions,
        ttl: maxAge * 1000,
      })
      context.res.setHeader(
        'Set-Cookie',
        cookie.serialize(cookieName, sealedData, {
          maxAge,
          expires: new Date(Date.now() + maxAge * 1000),
          httpOnly: true,
          secure,
          path,
          sameSite,
          domain,
        })
      )

      return sealedData
    },
  }
}

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'password',
  initFirstItem: {
    fields: ['name', 'email', 'password'],
    itemData: {
      role: {
        create: Object.fromEntries([
          ['name', 'Admin'],
          ...permissionsList.map((permission) => [permission, true]),
        ]),
      },
    },
  },
  passwordResetLink: {
    async sendToken(args) {
      await sendPasswordResetEmail(args.token, args.identity)
    },
  },
  sessionData: `
    id
    name
    email
    tokenVersion
    role {
      id
      name
      ${permissionsList.join('\n      ')}
    }
  `,
})

export default withAuth(config({
  db: { provider: 'postgresql', url: databaseURL },
  lists: models,
  storage: {
    my_images: {
      kind: 's3',
      type: 'image',
      bucketName,
      region,
      accessKeyId,
      secretAccessKey,
      endpoint,
      signed: { expiry: 5000 },
      forcePathStyle: s3ForcePathStyle(endpoint),
    },
  },
  ui: {
    isAccessAllowed: ({ session }) => permissions.canAccessDashboard({ session }),
    basePath,
  },
  session: statelessSessions(sessionConfig),
  graphql: { extendGraphqlSchema },
}))

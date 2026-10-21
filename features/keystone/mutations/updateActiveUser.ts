import type { Context } from '.keystone/types'

type UpdateActiveUserArgs = {
  data: { email?: string | null; name?: string | null; password?: string | null; onboardingStatus?: string | null }
  oldPassword?: string | null
}

async function updateActiveUser(_root: unknown, { data, oldPassword }: UpdateActiveUserArgs, context: Context) {
  const sudoContext = context.sudo()

  const session = context.session
  if (!session?.itemId) {
    throw new Error('Not authenticated')
  }

  const existingUser = await sudoContext.query.User.findOne({
    where: { id: session.itemId },
    query: 'id email',
  })

  if (!existingUser) {
    throw new Error('User not found')
  }

  if (data.password && !oldPassword) {
    throw new Error('Old password is required to update password')
  }

  if (data.password) {
    const result = await sudoContext.graphql.raw({
      query: `
        mutation VerifyPassword($email: String!, $password: String!) {
          authenticateUserWithPassword(email: $email, password: $password) {
            __typename
          }
        }
      `,
      variables: { email: existingUser.email, password: oldPassword },
    }) as { data?: { authenticateUserWithPassword?: { __typename?: string } } }

    if (result.data?.authenticateUserWithPassword?.__typename !== 'UserAuthenticationWithPasswordSuccess') {
      throw new Error('Invalid old password')
    }
  }

  const update = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => ['email', 'name', 'password', 'onboardingStatus'].includes(key) && value != null),
  )

  return sudoContext.db.User.updateOne({
    where: { id: session.itemId },
    data: update,
  })
}

export default updateActiveUser

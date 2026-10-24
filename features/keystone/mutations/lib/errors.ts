import { GraphQLError } from 'graphql'

/**
 * A refusal the operator can act on ("Prescriber with a valid NPI is required"). Yoga masks every
 * non-GraphQLError as "Unexpected error." in production, so domain rules throw this instead.
 */
export class DomainError extends GraphQLError {
  constructor(message = 'Invalid request', code = 'BAD_USER_INPUT') {
    super(message, { extensions: { code } })
  }
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { isEmailConfigured } from '@/features/keystone/lib/mail'
import { storefrontRequest } from '../storefront-client'
import { removeAuthToken, setAuthToken } from './cookies'

export type Customer = { id: string; name: string; email: string }

const SIGN_IN_ERROR = 'Incorrect email or password.'

/** A same-origin storefront path to return to after signing in, or null. */
function safeReturnPath(value: FormDataEntryValue | null) {
  const path = typeof value === 'string' ? value.trim() : ''
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\') || /^\/(dashboard|api)(\/|$|\?)/.test(path)) return null
  return path
}

export async function getCustomer(): Promise<Customer | null> {
  const response = await storefrontRequest<{ authenticatedItem: Customer | null }>('query StorefrontCustomer { authenticatedItem { ... on User { id name email } } }')
  return response.success && response.data.authenticatedItem?.id ? response.data.authenticatedItem : null
}

async function authenticate(email: string, password: string) {
  const response = await storefrontRequest<{ authenticateUserWithPassword: { sessionToken?: string; message?: string } | null }>(
    'mutation StorefrontSignIn($email: String!, $password: String!) { authenticateUserWithPassword(email: $email, password: $password) { ... on UserAuthenticationWithPasswordSuccess { sessionToken } ... on UserAuthenticationWithPasswordFailure { message } } }',
    { email, password },
  )
  const token = response.success ? response.data.authenticateUserWithPassword?.sessionToken : undefined
  if (!token) return false
  await setAuthToken(token)
  return true
}

export async function login(_state: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  if (!email || !password) return 'Enter your email and password.'
  if (!(await authenticate(email, password))) return SIGN_IN_ERROR
  const from = safeReturnPath(formData.get('from'))
  revalidatePath('/', 'layout')
  if (from) redirect(from)
  return null
}

export async function signUp(_state: string | null, formData: FormData): Promise<string | null> {
  const name = String(formData.get('name') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const response = await storefrontRequest<{ registerPharmacyCustomer: boolean }>(
    'mutation StorefrontSignUp($name: String!, $email: String!, $password: String!) { registerPharmacyCustomer(name: $name, email: $email, password: $password) }',
    { name, email, password },
    'Your account could not be created. Please try again.',
  )
  if (!response.success) return response.error
  if (!(await authenticate(email.toLowerCase(), password))) return 'Your account was created. Sign in to continue.'
  const from = safeReturnPath(formData.get('from'))
  revalidatePath('/', 'layout')
  if (from) redirect(from)
  return null
}

export async function signOut() {
  await storefrontRequest('mutation StorefrontSignOut { endSession }')
  await removeAuthToken()
  revalidatePath('/', 'layout')
  redirect('/account')
}

export async function requestPasswordReset(_state: { sent: boolean; error: string | null }, formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  if (!email) return { sent: false, error: 'Enter your email address.' }
  if (!(await isEmailConfigured())) return { sent: false, error: 'Password reset by email is not set up for this store. Call the pharmacy to reset your password.' }
  const response = await storefrontRequest('mutation StorefrontSendReset($email: String!) { sendUserPasswordResetLink(email: $email) }', { email })
  if (!response.success) return { sent: false, error: response.error }
  return { sent: true, error: null }
}

export async function resetPassword(_state: { done: boolean; error: string | null }, formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  const token = String(formData.get('token') || '')
  const password = String(formData.get('password') || '')
  if (password.length < 12) return { done: false, error: 'Password must be at least 12 characters.' }
  const response = await storefrontRequest<{ redeemUserPasswordResetToken: { code: string; message: string } | null }>(
    'mutation StorefrontRedeemReset($email: String!, $token: String!, $password: String!) { redeemUserPasswordResetToken(email: $email, token: $token, password: $password) { code message } }',
    { email, token, password },
  )
  if (!response.success) return { done: false, error: response.error }
  if (response.data.redeemUserPasswordResetToken) return { done: false, error: 'This reset link is invalid or has expired. Request a new one.' }
  return { done: true, error: null }
}

type ProfileState = { success: boolean; error: string | null }

async function updateOwnUser(data: Record<string, string>, fallback: string): Promise<ProfileState> {
  const customer = await getCustomer()
  if (!customer) return { success: false, error: 'Sign in again to update your profile.' }
  const response = await storefrontRequest('mutation StorefrontUpdateProfile($id: ID!, $data: UserUpdateInput!) { updateUser(where: { id: $id }, data: $data) { id } }', { id: customer.id, data }, fallback)
  if (!response.success) return { success: false, error: response.error }
  revalidatePath('/account', 'layout')
  return { success: true, error: null }
}

export async function updateCustomerName(_state: ProfileState, formData: FormData) {
  const name = String(formData.get('name') || '').trim()
  if (!name || name.length > 120) return { success: false, error: 'Enter your name.' }
  return updateOwnUser({ name }, 'Your name could not be updated. Please try again.')
}

export async function updateCustomerEmail(_state: ProfileState, formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: 'Enter a valid email address.' }
  return updateOwnUser({ email }, 'Your email could not be updated. It may already be in use.')
}

export async function updateCustomerPassword(_state: ProfileState, formData: FormData) {
  const password = String(formData.get('password') || '')
  const confirm = String(formData.get('confirmPassword') || '')
  if (password.length < 12) return { success: false, error: 'Password must be at least 12 characters.' }
  if (password !== confirm) return { success: false, error: 'Passwords do not match.' }
  const customer = await getCustomer()
  if (!customer) return { success: false, error: 'Sign in again to update your password.' }
  const result = await updateOwnUser({ password }, 'Your password could not be updated. Choose a less common password.')
  // A password change ends existing sessions; sign the customer back in with the new password.
  if (result.success) await authenticate(customer.email, password)
  return result
}

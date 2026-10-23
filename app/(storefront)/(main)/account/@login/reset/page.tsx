import type { Metadata } from 'next'
import { ResetPasswordPage } from '@/features/storefront/screens/ResetPasswordPage'

export const metadata: Metadata = { title: 'Reset password' }

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string; email?: string }> }) {
  const { token, email } = await searchParams
  return <ResetPasswordPage token={token} email={email} />
}

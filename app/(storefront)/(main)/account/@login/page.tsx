import type { Metadata } from 'next'
import { LoginPage } from '@/features/storefront/screens/LoginPage'

export const metadata: Metadata = { title: 'Sign in' }

export default async function Page({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams
  return <LoginPage from={from} />
}

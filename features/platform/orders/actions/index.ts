'use server'

import { revalidatePath } from 'next/cache'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'

function result<T>(response: Awaited<ReturnType<typeof keystoneClient<T>>>, path: string) {
  if (!response.success) throw new Error(response.error)
  revalidatePath(path)
  return response.data
}

export async function refundCashPaymentAction(input: { paymentId: string; orderId: string; cashReturnedAmount: number; idempotencyKey: string; reason: string; attested: boolean }) {
  const response = await keystoneClient<{ refundPharmacyCashPayment: { success: boolean; reused: boolean; paymentId: string; status: string; amount: number } }>(`mutation CashRefund($paymentId: ID!, $cashReturnedAmount: Int!, $idempotencyKey: String!, $reason: String!, $attested: Boolean!) { refundPharmacyCashPayment(paymentId: $paymentId, cashReturnedAmount: $cashReturnedAmount, idempotencyKey: $idempotencyKey, reason: $reason, attested: $attested) { success reused paymentId status amount } }`, input)
  return result(response, `/dashboard/platform/orders/${input.orderId}`).refundPharmacyCashPayment
}

export async function refundPaymentAction(input: { paymentId: string; orderId: string; reason: string; attested: boolean }) {
  const response = await keystoneClient<{ refundPharmacyPayment: { success: boolean; reused?: boolean | null; paymentId: string; status: string; amount: number } }>(`mutation Refund($paymentId: ID!, $reason: String!, $attested: Boolean!) { refundPharmacyPayment(paymentId: $paymentId, reason: $reason, attested: $attested) { success reused paymentId status amount } }`, input)
  return result(response, `/dashboard/platform/orders/${input.orderId}`).refundPharmacyPayment
}

export async function transitionFulfillmentAction(input: { fulfillmentId: string; orderId: string; status: string; reason: string; attested: boolean }) {
  const response = await keystoneClient<{ transitionOrderFulfillment: { success: boolean; reused?: boolean | null; fulfillmentId: string; orderId: string; approvalId?: string | null; status: string } }>(`mutation Fulfill($fulfillmentId: ID!, $status: String!, $reason: String!, $attested: Boolean!) { transitionOrderFulfillment(fulfillmentId: $fulfillmentId, status: $status, reason: $reason, attested: $attested) { success reused fulfillmentId orderId approvalId status } }`, input)
  return result(response, `/dashboard/platform/orders/${input.orderId}`).transitionOrderFulfillment
}

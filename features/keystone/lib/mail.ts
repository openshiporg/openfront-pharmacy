// Server-only mail helpers. Not a 'use server' module: these must never be callable as server actions.
import { createTransport, getTestMessageUrl } from "nodemailer";
import { emailButton, emailLayout, emailMuted, emailParagraph } from "./email-layout";

// Utility function to get base URL for emails
function getBaseUrlForEmails(): string {
  if (process.env.SMTP_STORE_LINK) {
    return process.env.SMTP_STORE_LINK;
  }
  
  // Fallback warning - this should be set in production
  console.warn('SMTP_STORE_LINK not set. Please add SMTP_STORE_LINK to your environment variables for email links to work properly.');
  return '';
}

const transport = createTransport({
  // @ts-ignore
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

function passwordResetEmail({ url }: { url: string }): string {
  return emailLayout({
    preheader: "Use this link to choose a new password.",
    title: "Reset your password",
    body: `${emailParagraph("We received a request to reset the password for your account. Use the button below to choose a new one.")}
${emailButton("Reset password", url)}
${emailMuted("If you did not request this, you can safely ignore this email. Your password will not change.")}`,
  });
}

/** Whether outgoing email is set up for this store (the existing SMTP_* settings). */
export async function isEmailConfigured(): Promise<boolean> {
  return Boolean(process.env.SMTP_HOST)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] as string)
}

/** An absolute origin for links: SMTP_STORE_LINK when set, otherwise the public host of the current request. */
export function requestOrigin(request?: { headers?: Record<string, string | string[] | undefined> }) {
  const configured = getBaseUrlForEmails()
  if (configured) return configured.replace(/\/$/, '')
  const header = (name: string) => {
    const value = request?.headers?.[name]
    return Array.isArray(value) ? value[0] : value
  }
  const host = header('x-forwarded-host') || header('host')
  if (!host) return ''
  const protocol = header('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}

/**
 * Keystone passwordResetLink.sendToken. Staff (dashboard access) get the dashboard reset page; customers get
 * the storefront reset page with their email prefilled. Without email set up, nothing is sent.
 */
export async function sendPasswordResetToken({ itemId, identity, token, context }: { itemId: string | number | bigint; identity: string; token: string; context: any }): Promise<void> {
  if (!(await isEmailConfigured())) {
    console.warn('Password reset email skipped: SMTP_HOST is not set.')
    return
  }
  const user = await context.sudo().query.User.findOne({ where: { id: String(itemId) }, query: 'id role { canAccessDashboard }' })
  const origin = requestOrigin(context.req)
  const url = user?.role?.canAccessDashboard
    ? `${origin}/dashboard/reset?token=${encodeURIComponent(token)}`
    : `${origin}/account/reset?${new URLSearchParams({ token, email: identity })}`
  await sendPasswordResetEmail(token, identity, undefined, url)
}

export async function sendOrderConfirmationEmail({ to, orderNumber, storeName, url }: { to: string; orderNumber: string; storeName: string; url: string }): Promise<boolean> {
  if (!(await isEmailConfigured())) return false
  const info = await transport.sendMail({
    to,
    from: process.env.SMTP_FROM,
    subject: `${storeName}: order ${orderNumber}`,
    html: emailLayout({
      storeName,
      preheader: `Order ${orderNumber} received`,
      title: 'Order received',
      body: `${emailParagraph(`Order <strong>${escapeHtml(orderNumber)}</strong> received.`)}
${emailButton('Track order', url)}`,
    }),
  })
  if (process.env.MAIL_USER?.includes("ethereal.email")) {
    console.log(`📧 Message Sent!  Preview it at ${getTestMessageUrl(info as any)}`);
  }
  return true
}

export async function sendPasswordResetEmail(resetToken: string, to: string, baseUrl?: string, url?: string): Promise<void> {
  // Use provided baseUrl or fall back to utility function
  const frontendUrl = baseUrl || getBaseUrlForEmails();
  
  // email the user a token
  const info = await transport.sendMail({
    to,
    from: process.env.SMTP_FROM,
    subject: "Your password reset token!",
    html: passwordResetEmail({
      url: url || `${frontendUrl}/dashboard/reset?token=${resetToken}`,
    }),
  });
  if (process.env.MAIL_USER?.includes("ethereal.email")) {
    console.log(`📧 Message Sent!  Preview it at ${getTestMessageUrl(info as any)}`);
  }
}
/**
 * "Ready for pickup" (Digital Pharmacist / Shopify local pickup). Prescription notices are minimum
 * necessary: they name the pharmacy and a reference, never the medication.
 */
export async function sendPickupReadyEmail({ to, storeName, kind, reference, locationName, phone, url }: { to: string; storeName: string; kind: 'prescription' | 'order'; reference: string; locationName: string; phone?: string | null; url: string }): Promise<{ sent: boolean; messageId?: string }> {
  if (!(await isEmailConfigured())) return { sent: false }
  const headline = kind === 'prescription' ? 'Your prescription is ready for pickup' : `Order ${reference} is ready for pickup`
  const detail = kind === 'prescription'
    ? `Pick it up at the pharmacy counter at ${locationName}. Bring a photo ID.`
    : `Pick it up at ${locationName}. Bring your order number.`
  const info = await transport.sendMail({
    to,
    from: process.env.SMTP_FROM,
    subject: `${storeName}: ${kind === 'prescription' ? 'prescription ready for pickup' : `order ${reference} is ready for pickup`}`,
    html: emailLayout({
      storeName,
      preheader: headline,
      title: headline,
      body: `${emailParagraph(escapeHtml(detail))}
${phone ? emailMuted(`Questions? Call ${escapeHtml(phone)}.`) : ''}
${url ? emailButton(kind === 'prescription' ? 'View in your account' : 'View order', url) : ''}`,
    }),
  })
  return { sent: true, messageId: (info as any)?.messageId }
}

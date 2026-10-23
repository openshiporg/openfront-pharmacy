// Server-only mail helpers. Not a 'use server' module: these must never be callable as server actions.
import { createTransport, getTestMessageUrl } from "nodemailer";

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
  const backgroundColor = "#f9f9f9";
  const textColor = "#444444";
  const mainBackgroundColor = "#ffffff";
  const buttonBackgroundColor = "#346df1";
  const buttonBorderColor = "#346df1";
  const buttonTextColor = "#ffffff";

  return `
    <body style="background: ${backgroundColor};">
      <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: ${mainBackgroundColor}; max-width: 600px; margin: auto; border-radius: 10px;">
        <tr>
          <td align="center" style="padding: 10px 0px 0px 0px; font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
            Please click below to reset your password
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 5px;" bgcolor="${buttonBackgroundColor}"><a href="${url}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${buttonTextColor}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${buttonBorderColor}; display: inline-block; font-weight: bold;">Reset Password</a></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
            If you did not request this email you can safely ignore it.
          </td>
        </tr>
      </table>
    </body>
  `;
}

/** Whether outgoing email is set up for this store (the existing SMTP_* settings). */
export async function isEmailConfigured(): Promise<boolean> {
  return Boolean(process.env.SMTP_HOST)
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] as string)
}

/** An absolute origin for links: SMTP_STORE_LINK when set, otherwise the public host of the current request. */
function requestOrigin(request?: { headers?: Record<string, string | string[] | undefined> }) {
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
    html: `
    <body style="background: #f9f9f9;">
      <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: #ffffff; max-width: 600px; margin: auto; border-radius: 10px; font-family: Helvetica, Arial, sans-serif; color: #444444;">
        <tr><td align="center" style="font-size: 18px;">${escapeHtml(storeName)}</td></tr>
        <tr><td align="center" style="font-size: 16px;">Order <strong>${escapeHtml(orderNumber)}</strong> received</td></tr>
        <tr><td align="center" style="padding: 10px 0 20px;"><a href="${escapeHtml(url)}" target="_blank" style="font-size: 16px; color: #ffffff; background: #1f6f5c; text-decoration: none; border-radius: 999px; padding: 12px 22px; display: inline-block; font-weight: bold;">Track order</a></td></tr>
      </table>
    </body>`,
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
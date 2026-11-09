"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __glob = (map) => (path) => {
  var fn = map[path];
  if (fn) return fn();
  throw new Error("Module not found in bundle: " + path);
};
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// features/keystone/lib/email-layout.ts
function storeNameFromEnv(fallback = "Pharmacy") {
  const match = /^\s*"?([^"<]+?)"?\s*</.exec(process.env.SMTP_FROM || "");
  return match?.[1]?.trim() || fallback;
}
function emailButton(label, href) {
  return `<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:8px 0 24px;">
<tr><td class="em-btn" align="center" bgcolor="${C.button}" style="border-radius:8px;background:${C.button};">
<a class="em-btn-a" href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:600;line-height:20px;color:${C.buttonText};text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
</td></tr></table>`;
}
function emailLayout(input) {
  const store = escapeHtml(input.storeName || storeNameFromEnv());
  const support = escapeHtml(input.supportEmail || SUPPORT_EMAIL);
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(input.title)}</title>
<style>
:root { color-scheme: light dark; supported-color-schemes: light dark; }
body { margin:0; padding:0; -webkit-text-size-adjust:100%; }
a { color:${C.link}; }
@media (max-width: 620px) { .em-pad { padding-left:20px !important; padding-right:20px !important; } }
@media (prefers-color-scheme: dark) {
  .em-canvas { background:#09090b !important; }
  .em-card { background:#18181b !important; border-color:#27272a !important; }
  .em-text { color:#fafafa !important; }
  .em-muted { color:#a1a1aa !important; }
  .em-line { border-color:#3f3f46 !important; }
  .em-panel { background:#27272a !important; border-color:#3f3f46 !important; color:#fafafa !important; }
  .em-btn { background:#fafafa !important; }
  .em-btn-a { color:#18181b !important; }
  .em-link { color:#fafafa !important; }
}
[data-ogsc] .em-text { color:#fafafa !important; }
[data-ogsc] .em-muted { color:#a1a1aa !important; }
[data-ogsb] .em-canvas { background:#09090b !important; }
[data-ogsb] .em-card { background:#18181b !important; }
</style>
</head>
<body class="em-canvas" style="margin:0;padding:0;background:${C.canvas};">
${input.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(input.preheader)}</div>` : ""}
<table role="presentation" class="em-canvas" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${C.canvas}" style="background:${C.canvas};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;">
<tr><td class="em-pad" style="padding:8px 32px 20px;font-family:${FONT};font-size:18px;line-height:24px;font-weight:700;letter-spacing:-0.01em;"><span class="em-text" style="color:${C.text};">${store}</span></td></tr>
<tr><td class="em-card" bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.line};border-radius:12px;">
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
<tr><td class="em-pad" style="padding:32px 32px 16px;">
<h1 class="em-text" style="margin:0 0 16px;font-family:${FONT};font-size:24px;line-height:32px;font-weight:700;letter-spacing:-0.02em;color:${C.text};">${escapeHtml(input.title)}</h1>
${input.body}
</td></tr>
</table>
</td></tr>
<tr><td class="em-pad" style="padding:20px 32px 8px;font-family:${FONT};font-size:13px;line-height:20px;color:${C.subtle};">
<span class="em-muted" style="color:${C.subtle};">${input.footerNote ? `${input.footerNote}<br>` : ""}Questions? Email <a class="em-link" href="mailto:${support}" style="color:${C.muted};text-decoration:underline;">${support}</a>.<br>${store}</span>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
var SUPPORT_EMAIL, FONT, C, escapeHtml, p, emailParagraph, emailMuted;
var init_email_layout = __esm({
  "features/keystone/lib/email-layout.ts"() {
    "use strict";
    SUPPORT_EMAIL = "hello@pharmacy.openship.org";
    FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
    C = {
      canvas: "#f4f4f5",
      card: "#ffffff",
      text: "#18181b",
      muted: "#52525b",
      subtle: "#71717a",
      line: "#e4e4e7",
      panel: "#fafafa",
      button: "#18181b",
      buttonText: "#ffffff",
      link: "#18181b"
    };
    escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    p = (html, style = "") => `<p class="em-text" style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:24px;color:${C.text};${style}">${html}</p>`;
    emailParagraph = p;
    emailMuted = (html) => `<p class="em-muted" style="margin:0 0 16px;font-family:${FONT};font-size:14px;line-height:22px;color:${C.muted};">${html}</p>`;
  }
});

// features/keystone/lib/mail.ts
var mail_exports = {};
__export(mail_exports, {
  isEmailConfigured: () => isEmailConfigured,
  requestOrigin: () => requestOrigin,
  sendOrderConfirmationEmail: () => sendOrderConfirmationEmail,
  sendPasswordResetEmail: () => sendPasswordResetEmail,
  sendPasswordResetToken: () => sendPasswordResetToken,
  sendPickupReadyEmail: () => sendPickupReadyEmail
});
function getBaseUrlForEmails() {
  if (process.env.SMTP_STORE_LINK) {
    return process.env.SMTP_STORE_LINK;
  }
  console.warn("SMTP_STORE_LINK not set. Please add SMTP_STORE_LINK to your environment variables for email links to work properly.");
  return "";
}
function passwordResetEmail({ url }) {
  return emailLayout({
    preheader: "Use this link to choose a new password.",
    title: "Reset your password",
    body: `${emailParagraph("We received a request to reset the password for your account. Use the button below to choose a new one.")}
${emailButton("Reset password", url)}
${emailMuted("If you did not request this, you can safely ignore this email. Your password will not change.")}`
  });
}
async function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST);
}
function escapeHtml2(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}
function requestOrigin(request) {
  const configured = getBaseUrlForEmails();
  if (configured) return configured.replace(/\/$/, "");
  const header = (name) => {
    const value = request?.headers?.[name];
    return Array.isArray(value) ? value[0] : value;
  };
  const host = header("x-forwarded-host") || header("host");
  if (!host) return "";
  const protocol = header("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
async function sendPasswordResetToken({ itemId, identity, token, context }) {
  if (!await isEmailConfigured()) {
    console.warn("Password reset email skipped: SMTP_HOST is not set.");
    return;
  }
  const user = await context.sudo().query.User.findOne({ where: { id: String(itemId) }, query: "id role { canAccessDashboard }" });
  const origin = requestOrigin(context.req);
  const url = user?.role?.canAccessDashboard ? `${origin}/dashboard/reset?token=${encodeURIComponent(token)}` : `${origin}/account/reset?${new URLSearchParams({ token, email: identity })}`;
  await sendPasswordResetEmail(token, identity, void 0, url);
}
async function sendOrderConfirmationEmail({ to, orderNumber: orderNumber2, storeName, url }) {
  if (!await isEmailConfigured()) return false;
  const info = await transport.sendMail({
    to,
    from: process.env.SMTP_FROM,
    subject: `${storeName}: order ${orderNumber2}`,
    html: emailLayout({
      storeName,
      preheader: `Order ${orderNumber2} received`,
      title: "Order received",
      body: `${emailParagraph(`Order <strong>${escapeHtml2(orderNumber2)}</strong> received.`)}
${emailButton("Track order", url)}`
    })
  });
  if (process.env.MAIL_USER?.includes("ethereal.email")) {
    console.log(`\u{1F4E7} Message Sent!  Preview it at ${(0, import_nodemailer.getTestMessageUrl)(info)}`);
  }
  return true;
}
async function sendPasswordResetEmail(resetToken, to, baseUrl, url) {
  const frontendUrl = baseUrl || getBaseUrlForEmails();
  const info = await transport.sendMail({
    to,
    from: process.env.SMTP_FROM,
    subject: "Your password reset token!",
    html: passwordResetEmail({
      url: url || `${frontendUrl}/dashboard/reset?token=${resetToken}`
    })
  });
  if (process.env.MAIL_USER?.includes("ethereal.email")) {
    console.log(`\u{1F4E7} Message Sent!  Preview it at ${(0, import_nodemailer.getTestMessageUrl)(info)}`);
  }
}
async function sendPickupReadyEmail({ to, storeName, kind, reference, locationName, phone, url }) {
  if (!await isEmailConfigured()) return { sent: false };
  const headline = kind === "prescription" ? "Your prescription is ready for pickup" : `Order ${reference} is ready for pickup`;
  const detail = kind === "prescription" ? `Pick it up at the pharmacy counter at ${locationName}. Bring a photo ID.` : `Pick it up at ${locationName}. Bring your order number.`;
  const info = await transport.sendMail({
    to,
    from: process.env.SMTP_FROM,
    subject: `${storeName}: ${kind === "prescription" ? "prescription ready for pickup" : `order ${reference} is ready for pickup`}`,
    html: emailLayout({
      storeName,
      preheader: headline,
      title: headline,
      body: `${emailParagraph(escapeHtml2(detail))}
${phone ? emailMuted(`Questions? Call ${escapeHtml2(phone)}.`) : ""}
${url ? emailButton(kind === "prescription" ? "View in your account" : "View order", url) : ""}`
    })
  });
  return { sent: true, messageId: info?.messageId };
}
var import_nodemailer, transport;
var init_mail = __esm({
  "features/keystone/lib/mail.ts"() {
    "use strict";
    import_nodemailer = require("nodemailer");
    init_email_layout();
    transport = (0, import_nodemailer.createTransport)({
      // @ts-ignore
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
});

// features/integrations/payment/stripe.ts
var stripe_exports = {};
__export(stripe_exports, {
  capturePaymentFunction: () => capturePaymentFunction,
  createPaymentFunction: () => createPaymentFunction,
  generatePaymentLinkFunction: () => generatePaymentLinkFunction,
  getPaymentStatusFunction: () => getPaymentStatusFunction,
  handleWebhookFunction: () => handleWebhookFunction,
  refundPaymentFunction: () => refundPaymentFunction
});
async function createPaymentFunction({ cart, amount, currency }) {
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: currency.toLowerCase(),
    automatic_payment_methods: {
      enabled: true
    },
    metadata: cart?.id ? { cartId: cart.id } : void 0
  }, cart?.id ? { idempotencyKey: `cart:${cart.id}:${amount}:${currency.toLowerCase()}` } : void 0);
  return {
    status: paymentIntent.status,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  };
}
async function capturePaymentFunction({ paymentId, amount, idempotencyKey }) {
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.capture(
    paymentId,
    { ...amount ? { amount_to_capture: amount } : {} },
    idempotencyKey ? { idempotencyKey } : void 0
  );
  return {
    status: paymentIntent.status,
    amount: paymentIntent.amount_received,
    currency: paymentIntent.currency,
    data: paymentIntent
  };
}
async function refundPaymentFunction({ paymentId, amount, idempotencyKey }) {
  const stripe = getStripeClient();
  const refund = await stripe.refunds.create({
    payment_intent: paymentId,
    ...amount ? { amount } : {}
  }, idempotencyKey ? { idempotencyKey } : void 0);
  return {
    status: refund.status,
    amount: refund.amount,
    currency: refund.currency,
    data: refund
  };
}
async function getPaymentStatusFunction({ paymentId }) {
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
  return {
    status: paymentIntent.status,
    amount: paymentIntent.amount_received || paymentIntent.amount,
    currency: paymentIntent.currency,
    data: paymentIntent
  };
}
async function generatePaymentLinkFunction({ paymentId }) {
  return `https://dashboard.stripe.com/payments/${paymentId}`;
}
async function handleWebhookFunction({ event, headers }) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret is not configured");
  }
  const stripe = getStripeClient();
  try {
    if (!headers.__rawBody) throw new Error("Raw webhook body is required");
    const stripeEvent = stripe.webhooks.constructEvent(
      headers.__rawBody,
      headers["stripe-signature"],
      webhookSecret
    );
    return {
      isValid: true,
      event: stripeEvent,
      type: stripeEvent.type,
      resource: stripeEvent.data.object
    };
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
var import_stripe, getStripeClient;
var init_stripe = __esm({
  "features/integrations/payment/stripe.ts"() {
    "use strict";
    import_stripe = __toESM(require("stripe"));
    getStripeClient = () => {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        throw new Error("Stripe secret key not configured");
      }
      return new import_stripe.default(stripeKey, {
        apiVersion: "2026-06-24.dahlia"
      });
    };
  }
});

// features/integrations/payment/paypal.ts
var paypal_exports = {};
__export(paypal_exports, {
  capturePaymentFunction: () => capturePaymentFunction2,
  createPaymentFunction: () => createPaymentFunction2,
  generatePaymentLinkFunction: () => generatePaymentLinkFunction2,
  getPaymentStatusFunction: () => getPaymentStatusFunction2,
  handleWebhookFunction: () => handleWebhookFunction2,
  refundPaymentFunction: () => refundPaymentFunction2
});
async function handleWebhookFunction2({ event, headers }) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new Error("PayPal webhook ID is not configured");
  }
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: event
    })
  });
  const verification = await response.json();
  const isValid = verification.verification_status === "SUCCESS";
  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }
  return {
    isValid: true,
    event,
    type: event.event_type,
    resource: event.resource
  };
}
async function createPaymentFunction2({ cart, amount, currency }) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(
    `${baseUrl}/v2/checkout/orders`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...cart?.id ? { "PayPal-Request-Id": `cart-${cart.id}-${amount}-${currency.toUpperCase()}` } : {}
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: cart?.id,
            amount: {
              currency_code: currency.toUpperCase(),
              value: formatPayPalAmount(amount, currency)
            }
          }
        ]
      })
    }
  );
  const order = await response.json();
  if (order.error) {
    throw new Error(`PayPal order creation failed: ${order.error.message}`);
  }
  return {
    orderId: order.id,
    status: order.status
  };
}
async function capturePaymentFunction2({ paymentId, idempotencyKey }) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(
    `${baseUrl}/v2/checkout/orders/${paymentId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...idempotencyKey ? { "PayPal-Request-Id": idempotencyKey } : {}
      }
    }
  );
  const capture = await response.json();
  if (capture.error) {
    throw new Error(`PayPal capture failed: ${capture.error.message}`);
  }
  const capturedAmount = capture.purchase_units[0].payments.captures[0].amount;
  return {
    status: capture.status,
    amount: parsePayPalAmount(capturedAmount.value, capturedAmount.currency_code),
    currency: capturedAmount.currency_code,
    data: capture
  };
}
async function refundPaymentFunction2({ paymentId, amount = 0, currency = "USD", idempotencyKey }) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(
    `${baseUrl}/v2/payments/captures/${paymentId}/refund`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...idempotencyKey ? { "PayPal-Request-Id": idempotencyKey } : {}
      },
      body: JSON.stringify({
        amount: {
          value: formatPayPalAmount(amount, currency),
          currency_code: currency.toUpperCase()
        }
      })
    }
  );
  const refund = await response.json();
  if (refund.error) {
    throw new Error(`PayPal refund failed: ${refund.error.message}`);
  }
  return {
    status: refund.status,
    amount: parsePayPalAmount(refund.amount.value, refund.amount.currency_code),
    currency: refund.amount.currency_code,
    data: refund
  };
}
async function getPaymentStatusFunction2({ paymentId }) {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(
    `${baseUrl}/v2/checkout/orders/${paymentId}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  const order = await response.json();
  if (order.error) {
    throw new Error(`PayPal status check failed: ${order.error.message}`);
  }
  const orderAmount = order.purchase_units[0].amount;
  return {
    status: order.status,
    amount: parsePayPalAmount(orderAmount.value, orderAmount.currency_code),
    currency: orderAmount.currency_code,
    data: order
  };
}
async function generatePaymentLinkFunction2({ paymentId }) {
  return `https://www.paypal.com/activity/payment/${paymentId}`;
}
var NO_DIVISION_CURRENCIES, getPayPalBaseUrl, formatPayPalAmount, parsePayPalAmount, getPayPalAccessToken;
var init_paypal = __esm({
  "features/integrations/payment/paypal.ts"() {
    "use strict";
    NO_DIVISION_CURRENCIES = [
      "JPY",
      "KRW",
      "VND",
      "CLP",
      "PYG",
      "XAF",
      "XOF",
      "BIF",
      "DJF",
      "GNF",
      "KMF",
      "MGA",
      "RWF",
      "XPF",
      "HTG",
      "VUV",
      "XAG",
      "XDR",
      "XAU"
    ];
    getPayPalBaseUrl = () => {
      const isSandbox = process.env.NEXT_PUBLIC_PAYPAL_SANDBOX !== "false";
      return isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
    };
    formatPayPalAmount = (amount, currency) => {
      const upperCurrency = currency.toUpperCase();
      const isNoDivision = NO_DIVISION_CURRENCIES.includes(upperCurrency);
      if (isNoDivision) {
        return amount.toString();
      }
      return (amount / 100).toFixed(2);
    };
    parsePayPalAmount = (value, currency) => {
      const upperCurrency = currency.toUpperCase();
      const isNoDivision = NO_DIVISION_CURRENCIES.includes(upperCurrency);
      if (isNoDivision) {
        return parseInt(value, 10);
      }
      return Math.round(parseFloat(value) * 100);
    };
    getPayPalAccessToken = async () => {
      const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
      const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        throw new Error("PayPal credentials not configured");
      }
      const baseUrl = getPayPalBaseUrl();
      const response = await fetch(
        `${baseUrl}/v1/oauth2/token`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Language": "en_US",
            Authorization: `Basic ${Buffer.from(
              `${clientId}:${clientSecret}`
            ).toString("base64")}`
          },
          body: "grant_type=client_credentials"
        }
      );
      const { access_token } = await response.json();
      if (!access_token) {
        throw new Error("Failed to get PayPal access token");
      }
      return access_token;
    };
  }
});

// features/integrations/payment/manual.ts
var manual_exports = {};
__export(manual_exports, {
  capturePaymentFunction: () => capturePaymentFunction3,
  createPaymentFunction: () => createPaymentFunction3,
  generatePaymentLinkFunction: () => generatePaymentLinkFunction3,
  getPaymentStatusFunction: () => getPaymentStatusFunction3,
  handleWebhookFunction: () => handleWebhookFunction3,
  refundPaymentFunction: () => refundPaymentFunction3
});
async function handleWebhookFunction3() {
  throw new Error("Manual payment providers do not accept webhook ingress");
}
async function createPaymentFunction3({ cart, amount, currency }) {
  return {
    status: "pending",
    data: {
      status: "pending",
      amount,
      currency: currency.toLowerCase()
    }
  };
}
async function capturePaymentFunction3({ paymentId, amount = 0 }) {
  return {
    status: "captured",
    amount,
    data: {
      status: "captured",
      amount,
      captured_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
async function refundPaymentFunction3({ paymentId, amount = 0, currency = "USD" }) {
  return {
    status: "refunded",
    amount,
    currency,
    data: {
      status: "refunded",
      amount,
      refunded_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
async function getPaymentStatusFunction3({ paymentId }) {
  return {
    status: "succeeded",
    data: {
      status: "succeeded"
    }
  };
}
async function generatePaymentLinkFunction3({ paymentId }) {
  return null;
}
var init_manual = __esm({
  "features/integrations/payment/manual.ts"() {
    "use strict";
  }
});

// features/integrations/payment/index.ts
var payment_exports = {};
__export(payment_exports, {
  paymentProviderAdapters: () => paymentProviderAdapters
});
var paymentProviderAdapters;
var init_payment = __esm({
  "features/integrations/payment/index.ts"() {
    "use strict";
    paymentProviderAdapters = {
      stripe: () => Promise.resolve().then(() => (init_stripe(), stripe_exports)),
      paypal: () => Promise.resolve().then(() => (init_paypal(), paypal_exports)),
      manual: () => Promise.resolve().then(() => (init_manual(), manual_exports))
    };
  }
});

// features/keystone/workflows/external-request-policy.ts
function externalFetchOptions(options = {}) {
  return { ...options, redirect: "error" };
}
async function readBoundedExternalResponse(response, maxBytes = MAX_EXTERNAL_RESPONSE_BYTES) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) throw new Error("External response size limit is invalid");
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await response.body?.cancel().catch(() => void 0);
    throw new Error("External response exceeds the configured size limit");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text44 = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel().catch(() => void 0);
        throw new Error("External response exceeds the configured size limit");
      }
      text44 += decoder.decode(value, { stream: true });
    }
    return text44 + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}
var MAX_EXTERNAL_RESPONSE_BYTES;
var init_external_request_policy = __esm({
  "features/keystone/workflows/external-request-policy.ts"() {
    "use strict";
    MAX_EXTERNAL_RESPONSE_BYTES = 1024 * 1024;
  }
});

// features/integrations/erx/manual.ts
var manual_exports2 = {};
__export(manual_exports2, {
  normalizeConfiguration: () => normalizeConfiguration,
  statusFunction: () => statusFunction,
  submitFunction: () => submitFunction,
  validateConfigurationFunction: () => validateConfigurationFunction,
  validatePrescriberFunction: () => validatePrescriberFunction,
  webhookFunction: () => webhookFunction
});
function safeBaseUrl(value) {
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("Production integration endpoints must use HTTPS");
  }
  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("Integration endpoint protocol is invalid");
  }
  url.username = "";
  url.password = "";
  return url.toString().replace(/\/$/, "");
}
function safePath(value) {
  if (!/^\/[A-Za-z0-9_./{}-]{1,200}$/.test(value) || value.includes("..")) {
    throw new Error("Integration endpoint path is invalid");
  }
  return value;
}
function normalizeConfiguration(input) {
  return {
    baseUrl: safeBaseUrl(input.baseUrl),
    validationPath: safePath(input.validationPath),
    submitPath: safePath(input.submitPath),
    statusPath: safePath(input.statusPath),
    prescriberValidationPath: input.prescriberValidationPath ? safePath(input.prescriberValidationPath) : null
  };
}
async function providerRequest(provider, path, init) {
  const baseUrl = safeBaseUrl(String(provider.configuration?.baseUrl || ""));
  const url = new URL(safePath(path), `${baseUrl}/`);
  const response = await fetch(
    url,
    externalFetchOptions({
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${provider.credentials?.bearerToken || ""}`,
        ...init.headers || {}
      },
      signal: AbortSignal.timeout(2e4)
    })
  );
  const text44 = await readBoundedExternalResponse(response);
  let body = null;
  try {
    body = text44 ? JSON.parse(text44) : {};
  } catch {
    body = { message: text44.slice(0, 1e3) };
  }
  if (!response.ok) throw new Error(`Integration provider returned HTTP ${response.status}`);
  return body;
}
async function validateConfigurationFunction({ provider }) {
  return providerRequest(provider, String(provider.configuration?.validationPath || ""), { method: "GET" });
}
async function validatePrescriberFunction({ provider, npi }) {
  const path = String(provider.configuration?.prescriberValidationPath || "").replace("{npi}", npi);
  return providerRequest(provider, path, { method: "GET" });
}
async function submitFunction({
  provider,
  payload,
  idempotencyKey
}) {
  return providerRequest(provider, String(provider.configuration?.submitPath || ""), {
    method: "POST",
    headers: { "idempotency-key": idempotencyKey },
    body: JSON.stringify(payload)
  });
}
async function statusFunction({
  provider,
  externalReference
}) {
  const path = String(provider.configuration?.statusPath || "").replace(
    "{externalReference}",
    encodeURIComponent(externalReference)
  );
  return providerRequest(provider, path, { method: "GET" });
}
async function webhookFunction({
  provider,
  event,
  headers
}) {
  const secret = provider.credentials?.webhookSecret;
  const rawBody = headers.__rawBody;
  if (!secret) throw new Error("Webhook secret is not configured");
  if (!rawBody) throw new Error("Raw webhook body is required");
  const actual = Buffer.from((0, import_node_crypto12.createHmac)("sha256", secret).update(rawBody).digest("hex"));
  const expected = Buffer.from(headers["x-pharmacy-signature-sha256"] || "");
  if (actual.length !== expected.length || !(0, import_node_crypto12.timingSafeEqual)(actual, expected)) {
    throw new Error("Webhook signature is invalid");
  }
  return { isValid: true, event };
}
var import_node_crypto12;
var init_manual2 = __esm({
  "features/integrations/erx/manual.ts"() {
    "use strict";
    import_node_crypto12 = require("node:crypto");
    init_external_request_policy();
  }
});

// features/integrations/erx/index.ts
var erx_exports = {};
__export(erx_exports, {
  erxProviderAdapters: () => erxProviderAdapters
});
var erxProviderAdapters;
var init_erx = __esm({
  "features/integrations/erx/index.ts"() {
    "use strict";
    erxProviderAdapters = {
      manual: () => Promise.resolve().then(() => (init_manual2(), manual_exports2))
    };
  }
});

// features/integrations/insurance/manual.ts
var manual_exports3 = {};
__export(manual_exports3, {
  statusFunction: () => statusFunction,
  submitFunction: () => submitFunction,
  validateConfigurationFunction: () => validateConfigurationFunction,
  webhookFunction: () => webhookFunction
});
var init_manual3 = __esm({
  "features/integrations/insurance/manual.ts"() {
    "use strict";
    init_manual2();
  }
});

// features/integrations/insurance/index.ts
var insurance_exports = {};
__export(insurance_exports, {
  insuranceProviderAdapters: () => insuranceProviderAdapters
});
var insuranceProviderAdapters;
var init_insurance = __esm({
  "features/integrations/insurance/index.ts"() {
    "use strict";
    insuranceProviderAdapters = {
      manual: () => Promise.resolve().then(() => (init_manual3(), manual_exports3))
    };
  }
});

// keystone.ts
var keystone_exports = {};
__export(keystone_exports, {
  default: () => keystone_default2
});
module.exports = __toCommonJS(keystone_exports);

// features/keystone/lib/s3-storage.ts
function s3ForcePathStyle(endpoint2) {
  let hostname = "";
  try {
    hostname = endpoint2 ? new URL(endpoint2).hostname : "";
  } catch {
  }
  return !(hostname === "storageapi.dev" || hostname.endsWith(".storageapi.dev"));
}

// features/keystone/index.ts
var import_auth = require("@keystone-6/auth");
var import_core45 = require("@keystone-6/core");
var import_config = require("dotenv/config");
var import_iron = __toESM(require("@hapi/iron"));
var cookie = __toESM(require("cookie"));

// features/keystone/access.ts
var byId = (id) => ({ id: { equals: id } });
function isSignedIn({ session }) {
  return Boolean(session);
}
function canChangeOwnPassword({ session, item }) {
  return Boolean(session && session.itemId === item.id.toString() && session.data?.role);
}
function canChangeSignInEmail({ session, item }) {
  if (!session) return false;
  if (session.itemId !== item.id.toString()) return permissions.canManageUsers({ session });
  return Boolean(session.data?.role);
}
function rolePermission(permission2) {
  return ({ session }) => session?.data.role?.[permission2] === true;
}
var permissions = {
  canAccessDashboard: rolePermission("canAccessDashboard"),
  canManageOrganizations: rolePermission("canManageOrganizations"),
  canManageLocations: rolePermission("canManageLocations"),
  canManageUsers: rolePermission("canManageUsers"),
  canManageRoles: rolePermission("canManageRoles"),
  canManageCatalog: rolePermission("canManageCatalog"),
  canManageInventory: rolePermission("canManageInventory"),
  canManageRecalls: rolePermission("canManageRecalls"),
  canManagePatients: rolePermission("canManagePatients"),
  canViewPatientPrivateData: rolePermission("canViewPatientPrivateData"),
  canManagePrescriptions: rolePermission("canManagePrescriptions"),
  canReviewPrescriptions: rolePermission("canReviewPrescriptions"),
  canDispenseMedications: rolePermission("canDispenseMedications"),
  canManageOrders: rolePermission("canManageOrders"),
  canManagePayments: rolePermission("canManagePayments"),
  canManageIntegrations: rolePermission("canManageIntegrations"),
  canManageOnboarding: rolePermission("canManageOnboarding"),
  canViewAuditLogs: rolePermission("canViewAuditLogs"),
  canApproveConsequentialActions: rolePermission("canApproveConsequentialActions")
};
function scoped(session, branches) {
  if (!session) return false;
  return { OR: branches(session.itemId) };
}
var organizationMembershipBranch = (userId) => ({
  organization: { memberships: { some: { user: byId(userId), status: { equals: "active" }, location: null } } }
});
var organizationWidePatientBranch = (userId) => ({
  patient: {
    organizations: {
      some: { memberships: { some: { user: byId(userId), status: { equals: "active" }, location: null } } }
    }
  }
});
var locationMembershipBranch = (userId) => ({
  location: {
    OR: [
      { memberships: { some: { user: byId(userId), status: { equals: "active" } } } },
      { organization: { memberships: { some: { user: byId(userId), status: { equals: "active" }, location: null } } } }
    ]
  }
});
var legacyOrderPaymentBranch = (userId) => ({
  order: { location: { OR: [
    { memberships: { some: { user: byId(userId), status: { equals: "active" } } } },
    { organization: { memberships: { some: { user: byId(userId), status: { equals: "active" }, location: null } } } }
  ] } }
});
var sharedOrganizationPeopleBranch = (userId) => ({
  memberships: {
    some: {
      status: { equals: "active" },
      organization: { memberships: { some: { user: byId(userId), status: { equals: "active" } } } }
    }
  }
});
var sharedOrganizationMembershipBranch = (userId) => ({
  organization: { memberships: { some: { user: byId(userId), status: { equals: "active" } } } }
});
var legacyCartPaymentBranch = (userId) => ({
  cart: { location: { OR: [
    { memberships: { some: { user: byId(userId), status: { equals: "active" } } } },
    { organization: { memberships: { some: { user: byId(userId), status: { equals: "active" }, location: null } } } }
  ] } }
});
var hasPrivatePatientReadAuthority = (session, capabilities) => Boolean(session) && permissions.canViewPatientPrivateData({ session }) && capabilities.some((permission2) => permission2({ session }));
var patientReadCapabilities = [
  permissions.canManagePatients,
  permissions.canManagePrescriptions,
  permissions.canReviewPrescriptions,
  permissions.canDispenseMedications,
  permissions.canManageRecalls
];
var prescriptionReadCapabilities = [
  permissions.canManagePatients,
  permissions.canManagePrescriptions,
  permissions.canReviewPrescriptions,
  permissions.canDispenseMedications
];
var prescriptionLocationMembershipBranch = (userId) => ({
  prescription: { location: locationMembershipBranch(userId).location }
});
var rules = {
  canReadPeople({ session }) {
    if (!session) return false;
    return permissions.canManageUsers({ session }) ? { OR: [{ id: { equals: session.itemId } }, sharedOrganizationPeopleBranch(session.itemId)] } : { id: { equals: session.itemId } };
  },
  canUpdatePeople({ session }) {
    if (!session) return false;
    return permissions.canManageUsers({ session }) ? { OR: [{ id: { equals: session.itemId } }, sharedOrganizationPeopleBranch(session.itemId)] } : { id: { equals: session.itemId } };
  },
  canReadMemberships({ session }) {
    if (!session) return false;
    return permissions.canManageUsers({ session }) ? { OR: [{ user: byId(session.itemId) }, sharedOrganizationMembershipBranch(session.itemId)] } : { user: byId(session.itemId) };
  },
  canReadOrganizations({ session }) {
    return scoped(session, (userId) => [
      { memberships: { some: { user: byId(userId), status: { equals: "active" } } } }
    ]);
  },
  canReadLocations({ session }) {
    return scoped(session, (userId) => [
      { memberships: { some: { user: byId(userId), status: { equals: "active" } } } },
      { organization: { memberships: { some: { user: byId(userId), status: { equals: "active" }, location: null } } } }
    ]);
  },
  canReadOrganizationRecords({ session }) {
    return scoped(session, (userId) => [organizationMembershipBranch(userId)]);
  },
  canReadLocationRecords({ session }) {
    return scoped(session, (userId) => [locationMembershipBranch(userId)]);
  },
  canReadTenantRecords({ session }) {
    return scoped(session, (userId) => [
      organizationMembershipBranch(userId),
      locationMembershipBranch(userId)
    ]);
  },
  canReadPatients({ session }) {
    const staffCanReadPrivate = hasPrivatePatientReadAuthority(session, patientReadCapabilities);
    return scoped(session, (userId) => [
      { user: byId(userId) },
      ...staffCanReadPrivate ? [{
        organizations: {
          some: { memberships: { some: { user: byId(userId), status: { equals: "active" }, location: null } } }
        }
      }] : []
    ]);
  },
  canReadPatientChildren({ session }) {
    const staffCanReadPrivate = hasPrivatePatientReadAuthority(session, patientReadCapabilities);
    return scoped(session, (userId) => [
      { patient: { user: byId(userId) } },
      ...staffCanReadPrivate ? [organizationWidePatientBranch(userId)] : []
    ]);
  },
  canReadLocationScopedPatientChildren({ session }) {
    const staffCanReadPrivate = hasPrivatePatientReadAuthority(session, patientReadCapabilities);
    return scoped(session, (userId) => [
      { patient: { user: byId(userId) } },
      ...staffCanReadPrivate ? [locationMembershipBranch(userId)] : []
    ]);
  },
  canReadPrescriptionRecords({ session }) {
    const staffCanReadPrivate = hasPrivatePatientReadAuthority(session, prescriptionReadCapabilities);
    return scoped(session, (userId) => [
      { patient: { user: byId(userId) } },
      ...staffCanReadPrivate ? [locationMembershipBranch(userId)] : []
    ]);
  },
  canReadPrescriptionChildren({ session }) {
    const staffCanReadPrivate = hasPrivatePatientReadAuthority(session, prescriptionReadCapabilities);
    return scoped(session, (userId) => [
      { prescription: { patient: { user: byId(userId) } } },
      ...staffCanReadPrivate ? [prescriptionLocationMembershipBranch(userId)] : []
    ]);
  },
  canReadOrders({ session }) {
    return scoped(session, (userId) => [
      { customer: byId(userId) },
      locationMembershipBranch(userId)
    ]);
  },
  canReadCartItems({ session }) {
    return scoped(session, (userId) => [
      { cart: { customer: byId(userId) } },
      { cart: organizationMembershipBranch(userId) },
      { cart: locationMembershipBranch(userId) }
    ]);
  },
  canReadOrderLineItems({ session }) {
    return scoped(session, (userId) => [
      { order: { customer: byId(userId) } },
      { order: organizationMembershipBranch(userId) },
      { order: locationMembershipBranch(userId) }
    ]);
  },
  canReadPayments({ session }) {
    return scoped(session, (userId) => [locationMembershipBranch(userId), legacyOrderPaymentBranch(userId)]);
  },
  canReadPaymentSessions({ session }) {
    return scoped(session, (userId) => [locationMembershipBranch(userId), legacyCartPaymentBranch(userId)]);
  }
};

// features/keystone/index.ts
init_mail();

// features/keystone/models/AuditEvent.ts
var import_core = require("@keystone-6/core");

// features/keystone/models/trackingFields.ts
var import_fields = require("@keystone-6/core/fields");
var trackingFields = {
  createdAt: (0, import_fields.timestamp)({
    access: { read: () => true, create: () => false, update: () => false },
    validation: { isRequired: true },
    defaultValue: { kind: "now" },
    ui: {
      createView: { fieldMode: "hidden" },
      itemView: { fieldMode: "read" }
    }
  }),
  updatedAt: (0, import_fields.timestamp)({
    access: { read: () => true, create: () => false, update: () => false },
    db: { updatedAt: true },
    validation: { isRequired: true },
    defaultValue: { kind: "now" },
    ui: {
      createView: { fieldMode: "hidden" },
      itemView: { fieldMode: "read" }
    }
  })
};

// features/keystone/models/AuditEvent.ts
var import_fields2 = require("@keystone-6/core/fields");

// features/keystone/models/requiredRelationship.ts
var requiredRelationshipDb = {
  extendPrismaSchema(field) {
    return field.replaceAll("?", "");
  }
};

// features/keystone/models/AuditEvent.ts
var denyMutation = () => false;
var AuditEvent = (0, import_core.list)({
  access: {
    operation: { query: permissions.canViewAuditLogs, create: denyMutation, update: denyMutation, delete: denyMutation },
    filter: { query: rules.canReadTenantRecords }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    eventKey: (0, import_fields2.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    eventType: (0, import_fields2.text)({ validation: { isRequired: true } }),
    resourceType: (0, import_fields2.text)({ validation: { isRequired: true } }),
    resourceId: (0, import_fields2.text)({ validation: { isRequired: true } }),
    occurredAt: (0, import_fields2.timestamp)({ validation: { isRequired: true }, defaultValue: { kind: "now" } }),
    actorType: (0, import_fields2.text)({ validation: { isRequired: true }, defaultValue: "user" }),
    metadata: (0, import_fields2.json)({ ui: { description: "Minimum necessary, non-secret audit metadata." } }),
    organization: (0, import_fields2.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields2.relationship)({ ref: "PharmacyLocation" }),
    actor: (0, import_fields2.relationship)({ ref: "User.auditEvents", access: { create: denyMutation, update: denyMutation } }),
    patient: (0, import_fields2.relationship)({ ref: "PatientProfile.auditEvents", access: { create: denyMutation, update: denyMutation } }),
    ...trackingFields
  }
});

// features/keystone/models/Cart.ts
var import_core2 = require("@keystone-6/core");
var import_access2 = require("@keystone-6/core/access");
var import_fields3 = require("@keystone-6/core/fields");
var Cart = (0, import_core2.list)({
  access: {
    operation: {
      query: permissions.canManageOrders,
      create: import_access2.denyAll,
      update: import_access2.denyAll,
      delete: import_access2.denyAll
    },
    filter: { query: rules.canReadOrders }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    guestTokenHash: (0, import_fields3.text)({ access: { read: import_access2.denyAll, create: import_access2.denyAll, update: import_access2.denyAll }, isIndexed: true }),
    status: (0, import_fields3.select)({
      type: "string",
      options: [
        { label: "Active", value: "active" },
        { label: "Submitted", value: "submitted" },
        { label: "Expired", value: "expired" },
        { label: "Abandoned", value: "abandoned" }
      ],
      defaultValue: "active"
    }),
    fulfillmentMethod: (0, import_fields3.select)({
      type: "string",
      options: [
        { label: "Pickup", value: "pickup" },
        { label: "Delivery", value: "delivery" }
      ],
      defaultValue: "pickup"
    }),
    subtotalAmount: (0, import_fields3.integer)({ defaultValue: 0, validation: { min: 0 } }),
    taxAmount: (0, import_fields3.integer)({ defaultValue: 0, validation: { min: 0 } }),
    deliveryAmount: (0, import_fields3.integer)({ defaultValue: 0, validation: { min: 0 } }),
    totalAmount: (0, import_fields3.integer)({ defaultValue: 0, validation: { min: 0 } }),
    expiresAt: (0, import_fields3.timestamp)(),
    organization: (0, import_fields3.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields3.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    customer: (0, import_fields3.relationship)({ ref: "User.carts" }),
    items: (0, import_fields3.relationship)({ ref: "CartItem.cart", many: true }),
    paymentSessions: (0, import_fields3.relationship)({ ref: "PaymentSession.cart", many: true }),
    order: (0, import_fields3.relationship)({ ref: "Order.cart" }),
    ...trackingFields
  }
});

// features/keystone/models/CartItem.ts
var import_core3 = require("@keystone-6/core");
var import_access4 = require("@keystone-6/core/access");
var import_fields4 = require("@keystone-6/core/fields");

// features/lib/minor-units.ts
var MAX_MINOR_UNITS = 2147483647;
function assertMinorUnits(value, label = "Amount") {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_MINOR_UNITS) throw new Error(`${label} must be bounded non-negative integer minor units`);
  return value;
}

// features/keystone/workflows/commerce-policy.ts
function assertProductCanEnterPublicCart(product) {
  if (product.status !== "published" || product.onlineAvailable !== true) {
    throw new Error("Product is not available for online ordering");
  }
  if (product.prescriptionRequirement !== "none") {
    throw new Error("This product cannot be added to a public cart; use the authorized prescription workflow");
  }
}
function lineAmount(item) {
  assertMinorUnits(item.unitPriceAmount, "Unit price");
  if (!Number.isSafeInteger(item.quantity) || item.quantity < 0) throw new Error("Quantity must be a non-negative integer");
  return assertMinorUnits(item.unitPriceAmount * item.quantity, "Line total");
}
function calculateTaxableSubtotal(items) {
  return items.reduce((sum, item) => {
    const amount = lineAmount(item);
    return assertMinorUnits(sum + (item.taxable === false ? 0 : amount), "Taxable subtotal");
  }, 0);
}
function calculateTaxAmount(subtotalAmount, taxRateBps) {
  assertMinorUnits(subtotalAmount, "Subtotal");
  if (!Number.isInteger(taxRateBps) || taxRateBps < 0 || taxRateBps > 1e4) throw new Error("Tax rate basis points are invalid");
  return Math.floor((subtotalAmount * taxRateBps + 5e3) / 1e4);
}
function assertCashTender(totalAmount, cashReceivedAmount) {
  if (!Number.isInteger(totalAmount) || totalAmount < 0 || !Number.isInteger(cashReceivedAmount) || cashReceivedAmount < totalAmount || cashReceivedAmount > 1e8) {
    throw new Error("Cash received must be an integer amount at least equal to the order total");
  }
  return { cashReceivedAmount, changeDueAmount: cashReceivedAmount - totalAmount };
}
function calculateCartTotals(items, taxAmount = 0, deliveryAmount = 0) {
  const subtotalAmount = items.reduce((sum, item) => assertMinorUnits(sum + lineAmount(item), "Subtotal"), 0);
  const safeTax = assertMinorUnits(taxAmount, "Tax");
  const safeDelivery = assertMinorUnits(deliveryAmount, "Delivery");
  return {
    subtotalAmount,
    taxAmount: safeTax,
    deliveryAmount: safeDelivery,
    totalAmount: assertMinorUnits(subtotalAmount + safeTax + safeDelivery, "Total")
  };
}

// features/keystone/hooks/cart-item.ts
function affectedCartIds(operation, item, originalItem) {
  const ids = /* @__PURE__ */ new Set();
  const currentId = item?.cartId || item?.cart?.id;
  const originalId = originalItem?.cartId || originalItem?.cart?.id;
  if (currentId) ids.add(currentId);
  if ((operation === "update" || operation === "delete") && originalId) ids.add(originalId);
  return [...ids].sort();
}
async function recalculateCartSnapshot(context, cartId) {
  const sudo = context.sudo();
  const cart = await sudo.query.Cart.findOne({
    where: { id: cartId },
    query: "id deliveryAmount items { quantity unitPriceAmount }"
  });
  if (!cart) return;
  const totals = calculateCartTotals(cart.items, 0, cart.deliveryAmount || 0);
  await sudo.db.Cart.updateOne({ where: { id: cart.id }, data: totals });
}
async function resolveCartAndProduct(context, operation, resolvedData, item) {
  const cartId = resolvedData.cart?.connect?.id || item?.cartId;
  const productId = resolvedData.product?.connect?.id || item?.productId;
  if (!cartId || !productId) return { cart: null, product: null };
  const sudo = context.sudo();
  const [cart, product] = await Promise.all([
    sudo.query.Cart.findOne({ where: { id: cartId }, query: "id status location { id }" }),
    sudo.query.Product.findOne({ where: { id: productId }, query: "id status onlineAvailable prescriptionRequirement priceAmount location { id }" })
  ]);
  return { cart, product };
}
var cartItemHooks = {
  async resolveInput({ operation, resolvedData, item, context }) {
    if (operation === "delete") return resolvedData;
    const { product } = await resolveCartAndProduct(context, operation, resolvedData, item);
    return product ? { ...resolvedData, unitPriceAmount: product.priceAmount } : resolvedData;
  },
  async validateInput({ operation, resolvedData, item, context, addValidationError }) {
    if (operation === "delete") return;
    const { cart, product } = await resolveCartAndProduct(context, operation, resolvedData, item);
    if (!cart || !product) return addValidationError("Cart item requires an existing cart and product");
    if (cart.status !== "active") addValidationError("Cart items can only change while the cart is active");
    if (cart.location?.id !== product.location?.id) addValidationError("Cart and product must belong to the same location");
    if (product.status !== "published" || !product.onlineAvailable || product.prescriptionRequirement !== "none") {
      addValidationError("Only published OTC products can enter this cart");
    }
  },
  async beforeOperation({ operation, resolvedData, item, context }) {
    const cartId = resolvedData?.cart?.connect?.id || item?.cartId;
    if (cartId) {
      await context.sudo().prisma.$queryRaw`SELECT 1 AS "locked" FROM pg_advisory_xact_lock(hashtext(${`pharmacy:cart:${cartId}`}))`;
    }
    if (operation === "delete" && item?.cartId) {
      const cart = await context.sudo().query.Cart.findOne({ where: { id: item.cartId }, query: "status" });
      if (cart?.status !== "active") throw new Error("Cart items can only change while the cart is active");
    }
  },
  async afterOperation({ operation, item, originalItem, context }) {
    for (const cartId of affectedCartIds(operation, item, originalItem)) {
      await recalculateCartSnapshot(context, cartId);
    }
  }
};

// features/keystone/models/CartItem.ts
var CartItem = (0, import_core3.list)({
  access: {
    operation: {
      query: permissions.canManageOrders,
      create: import_access4.denyAll,
      update: import_access4.denyAll,
      delete: import_access4.denyAll
    },
    filter: { query: rules.canReadCartItems }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: cartItemHooks,
  fields: {
    quantity: (0, import_fields4.integer)({ validation: { isRequired: true, min: 1 }, defaultValue: 1 }),
    unitPriceAmount: (0, import_fields4.integer)({ validation: { isRequired: true, min: 0 } }),
    cart: (0, import_fields4.relationship)({ ref: "Cart.items", db: requiredRelationshipDb }),
    product: (0, import_fields4.relationship)({ ref: "Product.cartItems", db: requiredRelationshipDb }),
    ...trackingFields
  }
});

// features/keystone/models/ClinicalSafetyReview.ts
var import_core4 = require("@keystone-6/core");
var import_access6 = require("@keystone-6/core/access");
var import_fields5 = require("@keystone-6/core/fields");
var ClinicalSafetyReview = (0, import_core4.list)({
  access: {
    operation: { query: isSignedIn, create: import_access6.denyAll, update: import_access6.denyAll, delete: import_access6.denyAll },
    filter: { query: rules.canReadPrescriptionChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    reviewKey: (0, import_fields5.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    fillNumber: (0, import_fields5.integer)({ validation: { isRequired: true, min: 1 } }),
    outcome: (0, import_fields5.select)({
      type: "string",
      options: [
        { label: "Human review clear", value: "clear" },
        { label: "Human-documented override", value: "override" },
        { label: "Rejected", value: "rejected" }
      ],
      validation: { isRequired: true }
    }),
    allergiesReviewed: (0, import_fields5.checkbox)({ defaultValue: false }),
    medicationHistoryReviewed: (0, import_fields5.checkbox)({ defaultValue: false }),
    interactionsReviewed: (0, import_fields5.checkbox)({ defaultValue: false }),
    duplicateTherapyReviewed: (0, import_fields5.checkbox)({ defaultValue: false }),
    contraindicationsReviewed: (0, import_fields5.checkbox)({ defaultValue: false }),
    doseReviewed: (0, import_fields5.checkbox)({ defaultValue: false }),
    counselingPlanReviewed: (0, import_fields5.checkbox)({ defaultValue: false }),
    reviewReference: (0, import_fields5.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    notes: (0, import_fields5.text)({ access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: "textarea" } }),
    overrideReason: (0, import_fields5.text)({ access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: "textarea" } }),
    evidenceSnapshot: (0, import_fields5.json)({ access: { read: permissions.canViewPatientPrivateData } }),
    reviewedAt: (0, import_fields5.timestamp)({ defaultValue: { kind: "now" }, validation: { isRequired: true } }),
    organization: (0, import_fields5.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields5.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    patient: (0, import_fields5.relationship)({ ref: "PatientProfile.safetyReviews", db: requiredRelationshipDb }),
    prescription: (0, import_fields5.relationship)({ ref: "Prescription.safetyReviews", db: requiredRelationshipDb }),
    pharmacist: (0, import_fields5.relationship)({ ref: "User", db: requiredRelationshipDb }),
    approval: (0, import_fields5.relationship)({ ref: "HumanApproval", db: requiredRelationshipDb }),
    ...trackingFields
  }
});

// features/keystone/models/ConsentRecord.ts
var import_core5 = require("@keystone-6/core");
var import_fields6 = require("@keystone-6/core/fields");
var denyMutation2 = () => false;
var ConsentRecord = (0, import_core5.list)({
  access: {
    operation: { query: isSignedIn, create: denyMutation2, update: denyMutation2, delete: denyMutation2 },
    filter: { query: rules.canReadPatientChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: {
    validateInput: ({ operation, resolvedData, addValidationError }) => {
      if (operation !== "create") return;
      const hasTransfer = Boolean(resolvedData.transfer?.connect?.id);
      const hasOrder = Boolean(resolvedData.order?.connect?.id);
      if (hasTransfer === hasOrder) addValidationError("Consent must attach to exactly one transfer or order subject");
      if (hasTransfer && !resolvedData.patient?.connect?.id) addValidationError("Transfer consent requires a patient relationship");
    }
  },
  fields: {
    consentType: (0, import_fields6.select)({
      type: "string",
      options: [
        { label: "Privacy notice", value: "privacy_notice" },
        { label: "Communications", value: "communications" },
        { label: "Prescription transfer", value: "prescription_transfer" },
        { label: "Delivery", value: "delivery" },
        { label: "Insurance submission", value: "insurance_submission" }
      ],
      validation: { isRequired: true }
    }),
    policyVersion: (0, import_fields6.text)({ validation: { isRequired: true } }),
    statementKey: (0, import_fields6.text)({ validation: { isRequired: true } }),
    accepted: (0, import_fields6.checkbox)({ defaultValue: false }),
    captureMethod: (0, import_fields6.text)({ validation: { isRequired: true } }),
    grantedAt: (0, import_fields6.timestamp)({ validation: { isRequired: true }, defaultValue: { kind: "now" } }),
    revokedAt: (0, import_fields6.timestamp)(),
    evidence: (0, import_fields6.json)({
      access: { read: permissions.canViewPatientPrivateData },
      ui: { description: "Bounded evidence only; never store raw prescription, payment, or clinical payloads." }
    }),
    patient: (0, import_fields6.relationship)({ ref: "PatientProfile.consents" }),
    actor: (0, import_fields6.relationship)({ ref: "User" }),
    transfer: (0, import_fields6.relationship)({ ref: "PrescriptionTransfer.consent" }),
    order: (0, import_fields6.relationship)({ ref: "Order.consent" }),
    ...trackingFields
  }
});

// features/keystone/models/DispensingLabel.ts
var import_core6 = require("@keystone-6/core");
var import_access9 = require("@keystone-6/core/access");
var import_fields7 = require("@keystone-6/core/fields");
var DispensingLabel = (0, import_core6.list)({
  access: {
    operation: { query: isSignedIn, create: import_access9.denyAll, update: import_access9.denyAll, delete: import_access9.denyAll },
    filter: { query: rules.canReadPrescriptionChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    labelNumber: (0, import_fields7.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    fillNumber: (0, import_fields7.integer)({ validation: { isRequired: true, min: 1 } }),
    operatorNameSnapshot: (0, import_fields7.text)({ validation: { isRequired: true } }),
    operatorPhoneSnapshot: (0, import_fields7.text)(),
    locationNameSnapshot: (0, import_fields7.text)({ validation: { isRequired: true } }),
    locationAddressSnapshot: (0, import_fields7.json)(),
    patientNameSnapshot: (0, import_fields7.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    prescriberNameSnapshot: (0, import_fields7.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    medicationNameSnapshot: (0, import_fields7.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    sigSnapshot: (0, import_fields7.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    quantityDispensed: (0, import_fields7.integer)({ validation: { isRequired: true, min: 1 } }),
    lotNumberSnapshot: (0, import_fields7.text)({ validation: { isRequired: true } }),
    ndc11Snapshot: (0, import_fields7.text)(),
    expirationDateSnapshot: (0, import_fields7.timestamp)({ validation: { isRequired: true } }),
    auxiliaryWarnings: (0, import_fields7.json)({ access: { read: permissions.canViewPatientPrivateData } }),
    counselingOutcome: (0, import_fields7.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    dispensedAt: (0, import_fields7.timestamp)({ defaultValue: { kind: "now" }, validation: { isRequired: true } }),
    // Will-call: a label is printed when the fill goes to the bin; the order is
    // linked at pickup. A return to stock voids the label instead of deleting it.
    voidedAt: (0, import_fields7.timestamp)({ db: { isNullable: true } }),
    voidReason: (0, import_fields7.text)(),
    organization: (0, import_fields7.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields7.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    patient: (0, import_fields7.relationship)({ ref: "PatientProfile.dispensingLabels", db: requiredRelationshipDb }),
    prescription: (0, import_fields7.relationship)({ ref: "Prescription.dispensingLabels", db: requiredRelationshipDb }),
    prescriptionItem: (0, import_fields7.relationship)({ ref: "PrescriptionItem.dispensingLabels", db: requiredRelationshipDb }),
    order: (0, import_fields7.relationship)({ ref: "Order.dispensingLabels" }),
    fill: (0, import_fields7.relationship)({ ref: "PrescriptionFill" }),
    pharmacist: (0, import_fields7.relationship)({ ref: "User", db: requiredRelationshipDb }),
    approval: (0, import_fields7.relationship)({ ref: "HumanApproval", db: requiredRelationshipDb }),
    ...trackingFields
  }
});

// features/keystone/models/DrugReference.ts
var import_core7 = require("@keystone-6/core");
var import_access11 = require("@keystone-6/core/access");
var import_fields8 = require("@keystone-6/core/fields");
var REVIEW_ONLY = { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "read" } };
var DrugReference = (0, import_core7.list)({
  access: {
    operation: {
      query: () => true,
      create: permissions.canManageCatalog,
      update: permissions.canManageCatalog,
      delete: import_access11.denyAll
    }
  },
  hooks: {
    validateInput: async ({ operation, resolvedData, item, context, addValidationError }) => {
      const value = (field) => resolvedData[field] !== void 0 ? resolvedData[field] : item?.[field];
      for (const [field, label] of [["genericName", "Generic name"], ["strength", "Strength"], ["dosageForm", "Dosage form"]]) {
        if (!String(value(field) || "").trim()) addValidationError(`${label} is required`);
      }
      if (operation === "update" && item && ["ndc11", "genericName", "strength", "dosageForm", "route"].some((field) => resolvedData[field] !== void 0)) {
        const reviews = await context.sudo().query.DrugReferenceReview.count({ where: { drugReference: { id: { equals: String(item.id) } } } });
        if (reviews > 0) addValidationError("Reviewed drug references cannot change NDC, ingredient, strength, dosage form or route");
      }
    }
  },
  graphql: { omit: { delete: true } },
  ui: { hideDelete: true, listView: { initialColumns: ["proprietaryName", "genericName", "ndc11", "marketingStatus"] } },
  fields: {
    ndc11: (0, import_fields8.text)({
      isIndexed: "unique",
      validation: {
        isRequired: true,
        match: { regex: /^\d{11}$/, explanation: "NDC must be normalized to exactly 11 digits" }
      }
    }),
    proprietaryName: (0, import_fields8.text)({ validation: { isRequired: true } }),
    genericName: (0, import_fields8.text)(),
    labelerName: (0, import_fields8.text)(),
    dosageForm: (0, import_fields8.text)(),
    route: (0, import_fields8.text)(),
    strength: (0, import_fields8.text)(),
    rxNormCui: (0, import_fields8.text)(),
    controlledSchedule: (0, import_fields8.select)({
      access: { create: import_access11.denyAll, update: import_access11.denyAll },
      ui: REVIEW_ONLY,
      type: "string",
      options: [
        { label: "Not scheduled", value: "none" },
        { label: "Schedule I", value: "schedule_i" },
        { label: "Schedule II", value: "schedule_ii" },
        { label: "Schedule III", value: "schedule_iii" },
        { label: "Schedule IV", value: "schedule_iv" },
        { label: "Schedule V", value: "schedule_v" },
        { label: "Unverified", value: "unverified" }
      ],
      defaultValue: "unverified"
    }),
    marketingStatus: (0, import_fields8.select)({
      access: { create: import_access11.denyAll, update: import_access11.denyAll },
      ui: REVIEW_ONLY,
      type: "string",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Unverified", value: "unverified" }
      ],
      defaultValue: "unverified"
    }),
    sourceName: (0, import_fields8.text)({
      defaultValue: "manual",
      access: { create: import_access11.denyAll, update: import_access11.denyAll },
      ui: REVIEW_ONLY
    }),
    sourceVersion: (0, import_fields8.text)({
      access: { create: import_access11.denyAll, update: import_access11.denyAll },
      ui: REVIEW_ONLY
    }),
    sourceReference: (0, import_fields8.text)({
      access: { create: import_access11.denyAll, update: import_access11.denyAll },
      ui: REVIEW_ONLY
    }),
    sourceVerified: (0, import_fields8.checkbox)({
      defaultValue: false,
      access: { create: import_access11.denyAll, update: import_access11.denyAll },
      ui: REVIEW_ONLY
    }),
    reviewedAt: (0, import_fields8.timestamp)({
      access: { create: import_access11.denyAll, update: import_access11.denyAll },
      ui: REVIEW_ONLY
    }),
    reviewedBy: (0, import_fields8.relationship)({
      ref: "User",
      access: { create: import_access11.denyAll, update: import_access11.denyAll },
      ui: REVIEW_ONLY
    }),
    referenceData: (0, import_fields8.json)(),
    products: (0, import_fields8.relationship)({ ref: "Product.drugReference", many: true }),
    reviews: (0, import_fields8.relationship)({ ref: "DrugReferenceReview.drugReference", many: true }),
    prescriptionItems: (0, import_fields8.relationship)({ ref: "PrescriptionItem.drugReference", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/DrugReferenceReview.ts
var import_core8 = require("@keystone-6/core");
var import_access13 = require("@keystone-6/core/access");
var import_fields9 = require("@keystone-6/core/fields");
var DrugReferenceReview = (0, import_core8.list)({
  access: {
    operation: { query: isSignedIn, create: import_access13.denyAll, update: import_access13.denyAll, delete: import_access13.denyAll },
    filter: { query: rules.canReadOrganizationRecords }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    reviewKey: (0, import_fields9.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    status: (0, import_fields9.select)({ type: "string", options: [{ label: "Active evidence", value: "active" }, { label: "Superseded", value: "superseded" }, { label: "Rejected", value: "rejected" }], defaultValue: "active" }),
    marketingStatusSnapshot: (0, import_fields9.select)({ type: "string", options: [{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }], validation: { isRequired: true } }),
    controlledScheduleSnapshot: (0, import_fields9.select)({ type: "string", options: [{ label: "Not scheduled", value: "none" }, { label: "Controlled or unsupported", value: "controlled_or_unsupported" }], validation: { isRequired: true } }),
    sourceName: (0, import_fields9.text)({ validation: { isRequired: true } }),
    sourceVersion: (0, import_fields9.text)({ validation: { isRequired: true } }),
    sourceReference: (0, import_fields9.text)({ validation: { isRequired: true } }),
    reviewedAt: (0, import_fields9.timestamp)({ defaultValue: { kind: "now" }, validation: { isRequired: true } }),
    organization: (0, import_fields9.relationship)({ ref: "Organization.drugReferenceReviews", db: requiredRelationshipDb }),
    drugReference: (0, import_fields9.relationship)({ ref: "DrugReference.reviews", db: requiredRelationshipDb }),
    reviewedBy: (0, import_fields9.relationship)({ ref: "User", db: requiredRelationshipDb }),
    approval: (0, import_fields9.relationship)({ ref: "HumanApproval", db: requiredRelationshipDb }),
    ...trackingFields
  }
});

// features/keystone/models/ExternalIntegrationWorkflow.ts
var import_core9 = require("@keystone-6/core");
var import_access15 = require("@keystone-6/core/access");
var import_fields10 = require("@keystone-6/core/fields");
var ExternalIntegrationWorkflow = (0, import_core9.list)({
  access: { operation: { query: import_access15.denyAll, create: import_access15.denyAll, update: import_access15.denyAll, delete: import_access15.denyAll } },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { isHidden: true },
  fields: {
    workflowKey: (0, import_fields10.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    workflowType: (0, import_fields10.select)({ type: "string", options: [{ label: "eRx", value: "erx" }, { label: "Insurance", value: "insurance" }], validation: { isRequired: true } }),
    resourceType: (0, import_fields10.text)({ validation: { isRequired: true } }),
    resourceId: (0, import_fields10.text)({ validation: { isRequired: true }, isIndexed: true }),
    status: (0, import_fields10.select)({
      type: "string",
      options: [
        { label: "Pending submission", value: "pending_submission" },
        { label: "Submitted", value: "submitted" },
        { label: "Pending", value: "pending" },
        { label: "Accepted", value: "accepted" },
        { label: "Rejected", value: "rejected" },
        { label: "Failed", value: "failed" }
      ],
      defaultValue: "pending_submission"
    }),
    idempotencyKey: (0, import_fields10.text)({ validation: { isRequired: true }, isIndexed: true }),
    externalReference: (0, import_fields10.text)({ isIndexed: true }),
    requestPayload: (0, import_fields10.json)(),
    responsePayload: (0, import_fields10.json)(),
    attempts: (0, import_fields10.integer)({ defaultValue: 0, validation: { min: 0 } }),
    lastError: (0, import_fields10.text)({ db: { isNullable: true }, ui: { displayMode: "textarea" } }),
    submittedAt: (0, import_fields10.timestamp)(),
    resolvedAt: (0, import_fields10.timestamp)(),
    organization: (0, import_fields10.relationship)({ ref: "Organization.externalIntegrationWorkflows", db: requiredRelationshipDb }),
    location: (0, import_fields10.relationship)({ ref: "PharmacyLocation.externalIntegrationWorkflows", db: requiredRelationshipDb }),
    provider: (0, import_fields10.relationship)({ ref: "IntegrationProvider.workflows", db: requiredRelationshipDb }),
    ...trackingFields
  }
});

// features/keystone/models/Fulfillment.ts
var import_core10 = require("@keystone-6/core");
var import_access16 = require("@keystone-6/core/access");
var import_fields11 = require("@keystone-6/core/fields");

// features/keystone/hooks/fulfillment.ts
var TRANSITIONS = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "out_for_delivery", "cancelled"],
  ready: ["handed_off", "cancelled"],
  out_for_delivery: ["handed_off", "cancelled"],
  handed_off: [],
  cancelled: []
};
function assertFulfillmentTransition(from, to) {
  if (from === to) return;
  if (!TRANSITIONS[from]?.includes(to)) throw new Error(`Invalid fulfillment transition: ${from} -> ${to}`);
}
var fulfillmentHooks = {
  async validateInput({ operation, resolvedData, item, context, addValidationError }) {
    if (operation === "create") {
      const organizationId = resolvedData.organization?.connect?.id;
      const locationId = resolvedData.location?.connect?.id;
      const orderId = resolvedData.order?.connect?.id;
      if (!organizationId || !locationId || !orderId) {
        addValidationError("Fulfillment requires organization, location, and order relationships");
      } else {
        const order = await context.sudo().query.Order.findOne({ where: { id: orderId }, query: "organization { id } location { id } fulfillment { id }" });
        if (!order || order.organization?.id !== organizationId || order.location?.id !== locationId || order.fulfillment?.id) {
          addValidationError("Fulfillment must be the sole fulfillment for one tenant order");
        }
      }
    }
    if (operation === "update" && resolvedData.status) {
      try {
        assertFulfillmentTransition(item.status, resolvedData.status);
      } catch (error) {
        addValidationError(error instanceof Error ? error.message : "Invalid fulfillment transition");
      }
    }
  },
  resolveInput({ operation, resolvedData }) {
    if (operation !== "update") return resolvedData;
    if (resolvedData.status === "ready" && !resolvedData.readyAt) return { ...resolvedData, readyAt: (/* @__PURE__ */ new Date()).toISOString() };
    if (resolvedData.status === "handed_off" && !resolvedData.handedOffAt) return { ...resolvedData, handedOffAt: (/* @__PURE__ */ new Date()).toISOString() };
    return resolvedData;
  },
  beforeOperation({ operation, inputData }) {
    if (operation === "update") {
      if (["organization", "location", "order", "method"].some((field) => inputData?.[field] !== void 0)) throw new Error("Fulfillment identity and method are immutable");
    }
    if (operation === "delete") throw new Error("Fulfillment lifecycle evidence cannot be deleted");
  }
};

// features/keystone/models/Fulfillment.ts
var Fulfillment = (0, import_core10.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: import_access16.denyAll,
      update: import_access16.denyAll,
      delete: import_access16.denyAll
    },
    filter: { query: rules.canReadTenantRecords, update: rules.canReadTenantRecords, delete: rules.canReadTenantRecords }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: fulfillmentHooks,
  fields: {
    method: (0, import_fields11.select)({
      type: "string",
      options: [
        { label: "Pickup", value: "pickup" },
        { label: "Delivery", value: "delivery" },
        { label: "Point of sale", value: "pos" }
      ],
      validation: { isRequired: true }
    }),
    status: (0, import_fields11.select)({
      type: "string",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Preparing", value: "preparing" },
        { label: "Ready", value: "ready" },
        { label: "Out for delivery", value: "out_for_delivery" },
        { label: "Handed off", value: "handed_off" },
        { label: "Cancelled", value: "cancelled" }
      ],
      defaultValue: "pending"
    }),
    handoffCodeHash: (0, import_fields11.text)({ access: { read: () => false } }),
    readyAt: (0, import_fields11.timestamp)(),
    handedOffAt: (0, import_fields11.timestamp)(),
    organization: (0, import_fields11.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields11.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    order: (0, import_fields11.relationship)({ ref: "Order.fulfillment", db: requiredRelationshipDb }),
    assignedTo: (0, import_fields11.relationship)({ ref: "User" }),
    ...trackingFields
  }
});

// features/keystone/models/HumanApproval.ts
var import_core11 = require("@keystone-6/core");
var import_fields12 = require("@keystone-6/core/fields");
var denyMutation3 = () => false;
var HumanApproval = (0, import_core11.list)({
  access: {
    operation: { query: permissions.canViewAuditLogs, create: denyMutation3, update: denyMutation3, delete: denyMutation3 },
    filter: { query: rules.canReadTenantRecords }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    actionType: (0, import_fields12.select)({
      type: "string",
      options: [
        { label: "Patient record evidence", value: "patient_record" },
        { label: "Prescription review", value: "prescription_review" },
        { label: "Clinical safety review", value: "clinical_safety_review" },
        { label: "Clinical safety re-review hold", value: "clinical_safety_hold" },
        { label: "Drug reference review", value: "drug_reference_review" },
        { label: "Dispense", value: "dispense" },
        { label: "Transfer", value: "transfer" },
        { label: "Refill", value: "refill" },
        { label: "Recall disposition", value: "recall_disposition" },
        { label: "Inventory adjustment", value: "inventory_adjustment" },
        { label: "Cold-chain disposition", value: "cold_chain_disposition" },
        { label: "Credential review evidence", value: "credential_review" },
        { label: "Order handoff", value: "order_handoff" },
        { label: "Cash/tax policy review", value: "cash_policy" },
        { label: "Cash tender received", value: "cash_tender" },
        { label: "Cash refund returned", value: "cash_refund" },
        { label: "Card charged at the counter", value: "card_tender" },
        { label: "Consequential agent action", value: "agent_action" }
      ],
      validation: { isRequired: true }
    }),
    reason: (0, import_fields12.text)({ validation: { isRequired: true }, ui: { displayMode: "textarea" } }),
    attested: (0, import_fields12.checkbox)({ defaultValue: false }),
    approvedAt: (0, import_fields12.timestamp)({ validation: { isRequired: true }, defaultValue: { kind: "now" } }),
    evidence: (0, import_fields12.json)({
      access: { read: permissions.canViewAuditLogs },
      ui: { description: "Bounded evidence only; never copy raw patient, payment, or external adapter payloads." }
    }),
    organization: (0, import_fields12.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields12.relationship)({ ref: "PharmacyLocation" }),
    actor: (0, import_fields12.relationship)({ ref: "User.humanApprovals", db: requiredRelationshipDb }),
    prescriptions: (0, import_fields12.relationship)({ ref: "Prescription.approval", many: true }),
    prescriptionReviews: (0, import_fields12.relationship)({ ref: "PrescriptionReview.approval", many: true }),
    refillRequests: (0, import_fields12.relationship)({ ref: "RefillRequest.approval", many: true }),
    transfers: (0, import_fields12.relationship)({ ref: "PrescriptionTransfer.approval", many: true }),
    recalls: (0, import_fields12.relationship)({ ref: "Recall.approval", many: true }),
    inventoryMovements: (0, import_fields12.relationship)({ ref: "InventoryMovement.approval", many: true }),
    temperatureExcursions: (0, import_fields12.relationship)({ ref: "TemperatureExcursion.approval", many: true }),
    orders: (0, import_fields12.relationship)({ ref: "Order.approval", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/IntegrationProvider.ts
var import_core12 = require("@keystone-6/core");
var import_access20 = require("@keystone-6/core/access");
var import_fields13 = require("@keystone-6/core/fields");

// features/keystone/models/immutableRelationship.ts
var import_access19 = require("@keystone-6/core/access");
var immutableRelationship = {
  create: import_access19.denyAll,
  update: import_access19.denyAll
};

// features/keystone/models/IntegrationProvider.ts
var IntegrationProvider = (0, import_core12.list)({
  access: {
    operation: {
      query: import_access20.denyAll,
      create: import_access20.denyAll,
      update: import_access20.denyAll,
      delete: import_access20.denyAll
    },
    filter: { query: rules.canReadOrganizationRecords, update: rules.canReadOrganizationRecords, delete: rules.canReadOrganizationRecords }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  hooks: {
    resolveInput: ({ operation, resolvedData }) => {
      if (operation !== "create") return resolvedData;
      const organizationId = resolvedData.organization?.connect?.id;
      return organizationId && resolvedData.code ? { ...resolvedData, providerKey: `${organizationId}:${resolvedData.code}` } : resolvedData;
    },
    validateInput: ({ operation, resolvedData, addValidationError }) => {
      if (operation === "create" && (!resolvedData.organization?.connect?.id || !resolvedData.code)) {
        addValidationError("Integration provider requires organization and code identity");
      }
      if (operation === "update" && ["organization", "code", "providerKey"].some((field) => resolvedData[field] !== void 0)) {
        addValidationError("Integration provider organization and code cannot be changed");
      }
    }
  },
  ui: { isHidden: true },
  fields: {
    providerKey: (0, import_fields13.text)({ isIndexed: "unique", access: { update: import_access20.denyAll } }),
    name: (0, import_fields13.text)({ validation: { isRequired: true } }),
    code: (0, import_fields13.text)({ validation: { isRequired: true }, isIndexed: true }),
    providerType: (0, import_fields13.select)({
      type: "string",
      options: [
        { label: "Prescriber / eRx", value: "erx" },
        { label: "Wholesaler", value: "wholesaler" },
        { label: "Insurance", value: "insurance" },
        { label: "Tax", value: "tax" },
        { label: "Payment", value: "payment" }
      ],
      validation: { isRequired: true }
    }),
    status: (0, import_fields13.select)({
      type: "string",
      options: [
        { label: "Unconfigured", value: "unconfigured" },
        { label: "Sandbox", value: "sandbox" },
        { label: "Active", value: "active" },
        { label: "Disabled", value: "disabled" }
      ],
      defaultValue: "unconfigured"
    }),
    credentials: (0, import_fields13.json)({ access: { read: import_access20.denyAll, create: import_access20.denyAll, update: import_access20.denyAll } }),
    configuration: (0, import_fields13.json)(),
    submitFunction: (0, import_fields13.text)({ validation: { isRequired: true } }),
    statusFunction: (0, import_fields13.text)({ validation: { isRequired: true } }),
    webhookFunction: (0, import_fields13.text)({ validation: { isRequired: true } }),
    externalValidationComplete: (0, import_fields13.checkbox)({ defaultValue: false }),
    validationReference: (0, import_fields13.text)(),
    validatedAt: (0, import_fields13.timestamp)(),
    organization: (0, import_fields13.relationship)({ ref: "Organization.integrationProviders", db: requiredRelationshipDb }),
    suppliers: (0, import_fields13.relationship)({ ref: "Supplier.integrationProvider", many: true, access: immutableRelationship }),
    prescribers: (0, import_fields13.relationship)({ ref: "Prescriber.integrationProvider", many: true, access: immutableRelationship }),
    paymentProviders: (0, import_fields13.relationship)({ ref: "PaymentProvider.integrationProvider", many: true, access: immutableRelationship }),
    workflows: (0, import_fields13.relationship)({ ref: "ExternalIntegrationWorkflow.provider", many: true, access: immutableRelationship }),
    webhookEvents: (0, import_fields13.relationship)({ ref: "IntegrationWebhookEvent.provider", many: true, access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/InventoryLot.ts
var import_core13 = require("@keystone-6/core");
var import_access22 = require("@keystone-6/core/access");
var import_fields14 = require("@keystone-6/core/fields");

// features/keystone/hooks/inventory-lot.ts
function validateLotQuantities(input) {
  for (const [name, value] of Object.entries({
    quantityReceived: input.quantityReceived,
    quantityAvailable: input.quantityAvailable,
    quantityQuarantined: input.quantityQuarantined
  })) {
    if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a non-negative integer`);
  }
  if (input.quantityQuarantined > input.quantityAvailable) throw new Error("Quarantined quantity cannot exceed available quantity");
  if (input.coldChainRequired) {
    if (typeof input.minimumTemperatureC !== "number" || typeof input.maximumTemperatureC !== "number") {
      throw new Error("Cold-chain lots require a temperature range");
    }
    if (input.minimumTemperatureC >= input.maximumTemperatureC) throw new Error("Cold-chain temperature range is invalid");
    if (input.status === "available" && !input.coldChainEvidenceComplete) {
      throw new Error("Cold-chain evidence is required before a lot becomes available");
    }
  }
}
var inventoryLotHooks = {
  resolveInput({ operation, resolvedData, item }) {
    if (operation === "delete") return resolvedData;
    const quantityAvailable = resolvedData.quantityAvailable ?? item?.quantityAvailable;
    const status = resolvedData.status ?? item?.status;
    if (quantityAvailable === 0 && !["quarantined", "recalled", "expired"].includes(status)) {
      return { ...resolvedData, status: "depleted" };
    }
    return resolvedData;
  },
  async validateInput({ operation, resolvedData, item, context, addValidationError }) {
    if (operation === "delete") return;
    const merged = { ...item };
    for (const [field, value] of Object.entries(resolvedData)) {
      if (value !== void 0) merged[field] = value;
    }
    try {
      validateLotQuantities(merged);
    } catch (error) {
      addValidationError(error instanceof Error ? error.message : "Invalid inventory lot");
    }
    const productId = resolvedData.product?.connect?.id || item?.productId;
    const locationId = resolvedData.location?.connect?.id || item?.locationId;
    if (!productId || !locationId) {
      addValidationError("Inventory lot requires product and location");
      return;
    }
    const [product, location] = await Promise.all([
      context.sudo().query.Product.findOne({ where: { id: productId }, query: "organization { id } location { id }" }),
      context.sudo().query.PharmacyLocation.findOne({ where: { id: locationId }, query: "organization { id }" })
    ]);
    if (!product || !location || product.organization?.id !== location.organization?.id || product.location?.id !== locationId) {
      addValidationError("Inventory lot product and location must belong to the same tenant");
    }
  },
  beforeOperation({ operation, resolvedData, item }) {
    if (operation === "delete" && (item?.quantityAvailable > 0 || item?.quantityQuarantined > 0)) {
      throw new Error("A non-empty inventory lot cannot be deleted");
    }
    if (operation === "update") {
      const immutable = ["lotNumber", "product", "location", "quantityReceived", "receivedAt"];
      if (immutable.some((field) => resolvedData[field] !== void 0)) {
        throw new Error("Inventory lot identity and receiving snapshot are immutable");
      }
    }
  }
};

// features/keystone/models/InventoryLot.ts
var InventoryLot = (0, import_core13.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canManageInventory({ session }) || permissions.canManageRecalls({ session }) || permissions.canDispenseMedications({ session }),
      create: import_access22.denyAll,
      update: import_access22.denyAll,
      delete: import_access22.denyAll
    },
    filter: { query: rules.canReadLocationRecords, update: rules.canReadLocationRecords, delete: rules.canReadLocationRecords }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true, listView: { initialColumns: ["lotNumber", "product", "expirationDate", "quantityAvailable", "status"] } },
  hooks: inventoryLotHooks,
  fields: {
    lotNumber: (0, import_fields14.text)({ validation: { isRequired: true }, isIndexed: true }),
    serialNumber: (0, import_fields14.text)(),
    expirationDate: (0, import_fields14.timestamp)({ validation: { isRequired: true } }),
    receivedAt: (0, import_fields14.timestamp)({ validation: { isRequired: true }, defaultValue: { kind: "now" } }),
    quantityReceived: (0, import_fields14.integer)({ validation: { isRequired: true, min: 0 } }),
    quantityAvailable: (0, import_fields14.integer)({ validation: { isRequired: true, min: 0 } }),
    quantityQuarantined: (0, import_fields14.integer)({ validation: { isRequired: true, min: 0 }, defaultValue: 0 }),
    status: (0, import_fields14.select)({
      type: "string",
      options: [
        { label: "Available", value: "available" },
        { label: "Quarantined", value: "quarantined" },
        { label: "Expired", value: "expired" },
        { label: "Recalled", value: "recalled" },
        { label: "Depleted", value: "depleted" }
      ],
      defaultValue: "quarantined"
    }),
    storageBin: (0, import_fields14.text)(),
    coldChainRequired: (0, import_fields14.checkbox)({ defaultValue: false }),
    minimumTemperatureC: (0, import_fields14.float)(),
    maximumTemperatureC: (0, import_fields14.float)(),
    coldChainEvidenceComplete: (0, import_fields14.checkbox)({ defaultValue: false }),
    product: (0, import_fields14.relationship)({ ref: "Product.inventoryLots", access: { create: import_access22.denyAll, update: import_access22.denyAll }, db: requiredRelationshipDb }),
    location: (0, import_fields14.relationship)({ ref: "PharmacyLocation.inventoryLots", access: { create: import_access22.denyAll, update: import_access22.denyAll }, db: requiredRelationshipDb }),
    supplier: (0, import_fields14.relationship)({ ref: "Supplier.inventoryLots", access: { create: import_access22.denyAll, update: import_access22.denyAll } }),
    movements: (0, import_fields14.relationship)({ ref: "InventoryMovement.lot", many: true }),
    temperatureExcursions: (0, import_fields14.relationship)({ ref: "TemperatureExcursion.lot", many: true }),
    recalls: (0, import_fields14.relationship)({ ref: "Recall.lots", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/IntegrationWebhookEvent.ts
var import_core14 = require("@keystone-6/core");
var import_access24 = require("@keystone-6/core/access");
var import_fields15 = require("@keystone-6/core/fields");
var IntegrationWebhookEvent = (0, import_core14.list)({
  access: { operation: { query: import_access24.denyAll, create: import_access24.denyAll, update: import_access24.denyAll, delete: import_access24.denyAll } },
  graphql: { omit: { create: true, update: true, delete: true } },
  fields: {
    eventKey: (0, import_fields15.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    externalEventId: (0, import_fields15.text)({ validation: { isRequired: true }, isIndexed: true }),
    eventType: (0, import_fields15.text)({ validation: { isRequired: true } }),
    status: (0, import_fields15.select)({ type: "string", options: [{ label: "Processed", value: "processed" }, { label: "Ignored", value: "ignored" }, { label: "Failed", value: "failed" }], defaultValue: "processed" }),
    payload: (0, import_fields15.json)(),
    receivedAt: (0, import_fields15.timestamp)({ defaultValue: { kind: "now" } }),
    organization: (0, import_fields15.relationship)({ ref: "Organization.integrationWebhookEvents", db: requiredRelationshipDb }),
    provider: (0, import_fields15.relationship)({ ref: "IntegrationProvider.webhookEvents", db: requiredRelationshipDb }),
    workflow: (0, import_fields15.relationship)({ ref: "ExternalIntegrationWorkflow" }),
    ...trackingFields
  }
});

// features/keystone/models/InventoryMovement.ts
var import_core15 = require("@keystone-6/core");
var import_fields16 = require("@keystone-6/core/fields");

// features/keystone/hooks/inventory-movement.ts
var NEGATIVE_MOVEMENTS = /* @__PURE__ */ new Set(["dispense", "sale", "reserve", "expire", "destroy"]);
var POSITIVE_MOVEMENTS = /* @__PURE__ */ new Set(["receive", "return", "release"]);
function validateMovementSign(type, quantityDelta) {
  if (!Number.isInteger(quantityDelta)) throw new Error("Inventory movement quantity must be an integer");
  if (NEGATIVE_MOVEMENTS.has(type) && quantityDelta >= 0) throw new Error(`${type} inventory movements must reduce quantity`);
  if (type === "release" && quantityDelta === 0) return;
  if (POSITIVE_MOVEMENTS.has(type) && quantityDelta <= 0) throw new Error(`${type} inventory movements must increase quantity`);
}
var inventoryMovementHooks = {
  resolveInput({ operation, resolvedData, context }) {
    if (operation === "create" && !resolvedData.actor && context.session?.itemId) {
      return { ...resolvedData, actor: { connect: { id: context.session.itemId } } };
    }
    return resolvedData;
  },
  async validateInput({ operation, resolvedData, context, addValidationError }) {
    if (operation !== "create") return;
    try {
      validateMovementSign(resolvedData.movementType, resolvedData.quantityDelta);
    } catch (error) {
      addValidationError(error instanceof Error ? error.message : "Invalid inventory movement");
    }
    const organizationId = resolvedData.organization?.connect?.id;
    const locationId = resolvedData.location?.connect?.id;
    const productId = resolvedData.product?.connect?.id;
    const lotId = resolvedData.lot?.connect?.id;
    if (!organizationId || !locationId || !productId || !lotId) {
      addValidationError("Inventory movement requires organization, location, product, and lot");
      return;
    }
    const lot = await context.sudo().query.InventoryLot.findOne({
      where: { id: lotId },
      query: "product { id organization { id } } location { id }"
    });
    if (!lot || lot.product?.id !== productId || lot.product?.organization?.id !== organizationId || lot.location?.id !== locationId) {
      addValidationError("Inventory movement relations must identify one tenant lot");
    }
  },
  beforeOperation({ operation }) {
    if (operation !== "create") throw new Error("Inventory movements are immutable evidence");
  }
};

// features/keystone/models/InventoryMovement.ts
var denyMutation4 = () => false;
var InventoryMovement = (0, import_core15.list)({
  access: {
    operation: { query: ({ session }) => permissions.canManageInventory({ session }) || permissions.canManageRecalls({ session }) || permissions.canDispenseMedications({ session }), create: denyMutation4, update: denyMutation4, delete: denyMutation4 },
    filter: { query: rules.canReadLocationRecords }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: inventoryMovementHooks,
  fields: {
    movementType: (0, import_fields16.select)({
      type: "string",
      options: [
        { label: "Receive", value: "receive" },
        { label: "Reserve", value: "reserve" },
        { label: "Dispense", value: "dispense" },
        { label: "Sale", value: "sale" },
        { label: "Return", value: "return" },
        { label: "Quarantine", value: "quarantine" },
        { label: "Release", value: "release" },
        { label: "Recall", value: "recall" },
        { label: "Expire", value: "expire" },
        { label: "Destroy", value: "destroy" },
        { label: "Adjust", value: "adjust" }
      ],
      validation: { isRequired: true }
    }),
    quantityDelta: (0, import_fields16.integer)({ validation: { isRequired: true } }),
    reason: (0, import_fields16.text)({ validation: { isRequired: true } }),
    idempotencyKey: (0, import_fields16.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    requestFingerprint: (0, import_fields16.text)({ db: { isNullable: true } }),
    occurredAt: (0, import_fields16.timestamp)({ validation: { isRequired: true }, defaultValue: { kind: "now" } }),
    organization: (0, import_fields16.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields16.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    product: (0, import_fields16.relationship)({ ref: "Product", db: requiredRelationshipDb }),
    lot: (0, import_fields16.relationship)({ ref: "InventoryLot.movements", db: requiredRelationshipDb }),
    actor: (0, import_fields16.relationship)({ ref: "User" }),
    patient: (0, import_fields16.relationship)({ ref: "PatientProfile" }),
    prescription: (0, import_fields16.relationship)({ ref: "Prescription" }),
    prescriptionItem: (0, import_fields16.relationship)({ ref: "PrescriptionItem" }),
    order: (0, import_fields16.relationship)({ ref: "Order" }),
    approval: (0, import_fields16.relationship)({ ref: "HumanApproval.inventoryMovements" }),
    ...trackingFields
  }
});

// features/keystone/models/MachineCredential.ts
var import_core16 = require("@keystone-6/core");
var import_access26 = require("@keystone-6/core/access");
var import_fields17 = require("@keystone-6/core/fields");
var MachineCredential = (0, import_core16.list)({
  access: { operation: { query: import_access26.denyAll, create: import_access26.denyAll, update: import_access26.denyAll, delete: import_access26.denyAll } },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { isHidden: true },
  fields: {
    name: (0, import_fields17.text)({ validation: { isRequired: true } }),
    tokenPrefix: (0, import_fields17.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    tokenHash: (0, import_fields17.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    scopes: (0, import_fields17.json)(),
    status: (0, import_fields17.select)({
      type: "string",
      options: [
        { label: "Active", value: "active" },
        { label: "Revoked", value: "revoked" }
      ],
      defaultValue: "active"
    }),
    expiresAt: (0, import_fields17.timestamp)({ validation: { isRequired: true } }),
    revokedAt: (0, import_fields17.timestamp)(),
    lastUsedAt: (0, import_fields17.timestamp)(),
    rateWindowStartedAt: (0, import_fields17.timestamp)(),
    rateRequestCount: (0, import_fields17.integer)({ defaultValue: 0, validation: { min: 0 } }),
    organization: (0, import_fields17.relationship)({ ref: "Organization.machineCredentials", db: requiredRelationshipDb }),
    location: (0, import_fields17.relationship)({ ref: "PharmacyLocation.machineCredentials" }),
    createdBy: (0, import_fields17.relationship)({ ref: "User.createdMachineCredentials", db: requiredRelationshipDb }),
    ...trackingFields
  }
});

// features/keystone/models/Order.ts
var import_core17 = require("@keystone-6/core");
var import_access27 = require("@keystone-6/core/access");
var import_fields18 = require("@keystone-6/core/fields");

// features/keystone/hooks/order.ts
var IMMUTABLE_ORDER_FIELDS = /* @__PURE__ */ new Set([
  "orderNumber",
  "idempotencyKey",
  "guestTokenHash",
  "checkoutEvidence",
  "fulfillmentMethod",
  "subtotalAmount",
  "taxAmount",
  "deliveryAmount",
  "totalAmount",
  "currencyCode",
  "shippingAddressSnapshot",
  "billingAddressSnapshot",
  "organization",
  "location",
  "customer",
  "patient",
  "prescription",
  "cart"
]);
function validateOrderTotals(input) {
  for (const [name, value] of Object.entries(input)) {
    assertMinorUnits(value, name);
  }
  if (input.totalAmount !== input.subtotalAmount + input.taxAmount + input.deliveryAmount) {
    throw new Error("Order total does not match its immutable component snapshots");
  }
}
var orderHooks = {
  validateInput({ operation, resolvedData, inputData, addValidationError }) {
    if (operation === "create") {
      if (!resolvedData.idempotencyKey) addValidationError("Order idempotency key is required");
      const sourceCount = [
        Boolean(resolvedData.cart?.connect?.id),
        Boolean(resolvedData.prescription?.connect?.id),
        ["pos", "pickup"].includes(resolvedData.fulfillmentMethod) && ["operator_attested_otc_pos_cash", "otc_pos_card"].includes(resolvedData.checkoutEvidence?.workflow) && Boolean(resolvedData.approval?.connect?.id) && resolvedData.checkoutEvidence.approvalId === resolvedData.approval.connect.id
      ].filter(Boolean).length;
      if (!resolvedData.organization?.connect?.id || !resolvedData.location?.connect?.id || sourceCount !== 1) {
        addValidationError("Order requires organization, location, and exactly one authorized cart, prescription, or cash-POS source");
      }
      try {
        validateOrderTotals({
          subtotalAmount: resolvedData.subtotalAmount,
          taxAmount: resolvedData.taxAmount,
          deliveryAmount: resolvedData.deliveryAmount,
          totalAmount: resolvedData.totalAmount
        });
      } catch (error) {
        addValidationError(error instanceof Error ? error.message : "Invalid order totals");
      }
    }
    if (operation === "update") {
      const changedImmutableFields = Object.keys(inputData || {}).filter((field) => IMMUTABLE_ORDER_FIELDS.has(field));
      if (changedImmutableFields.length) addValidationError(`Checkout identity, tenant ownership, and snapshots are immutable: ${changedImmutableFields.join(", ")}`);
    }
  },
  beforeOperation({ operation, item }) {
    if (operation === "delete") throw new Error(`Order ${item?.id || ""} is immutable lifecycle evidence`);
  }
};
var orderLineItemHooks = {
  validateInput({ operation, resolvedData, addValidationError }) {
    if (operation !== "create") return;
    if (!resolvedData.order?.connect?.id || !resolvedData.product?.connect?.id) {
      addValidationError("Order line requires order and product relationships");
    }
    if (resolvedData.lineTotalAmount !== resolvedData.unitPriceAmount * resolvedData.quantity) {
      addValidationError("Order line total does not match unit price and quantity snapshots");
    }
  },
  beforeOperation({ operation }) {
    if (operation !== "create") throw new Error("Order line snapshots are immutable");
  }
};

// features/keystone/models/Order.ts
var Order = (0, import_core17.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: import_access27.denyAll,
      update: import_access27.denyAll,
      delete: import_access27.denyAll
    },
    filter: { query: rules.canReadOrders, update: rules.canReadOrders }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true, listView: { initialColumns: ["orderNumber", "status", "fulfillmentMethod", "location", "totalAmount"] } },
  hooks: orderHooks,
  fields: {
    orderNumber: (0, import_fields18.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    idempotencyKey: (0, import_fields18.text)({ isIndexed: "unique", access: { update: import_access27.denyAll } }),
    guestTokenHash: (0, import_fields18.text)({ access: { read: import_access27.denyAll, create: import_access27.denyAll, update: import_access27.denyAll }, isIndexed: true }),
    checkoutEvidence: (0, import_fields18.json)({ access: { read: permissions.canViewAuditLogs, update: () => false } }),
    email: (0, import_fields18.text)({ access: { read: permissions.canViewPatientPrivateData } }),
    phone: (0, import_fields18.text)({ access: { read: permissions.canViewPatientPrivateData } }),
    // The name staff match at pickup or delivery.
    customerName: (0, import_fields18.text)({ access: { read: permissions.canViewPatientPrivateData } }),
    status: (0, import_fields18.select)({
      access: { update: () => false },
      type: "string",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Review required", value: "review_required" },
        { label: "Approved", value: "approved" },
        { label: "Processing", value: "processing" },
        { label: "Ready", value: "ready" },
        { label: "Out for delivery", value: "out_for_delivery" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" }
      ],
      defaultValue: "pending"
    }),
    fulfillmentMethod: (0, import_fields18.select)({
      type: "string",
      options: [
        { label: "Pickup", value: "pickup" },
        { label: "Delivery", value: "delivery" },
        { label: "Point of sale", value: "pos" }
      ],
      defaultValue: "pickup"
    }),
    subtotalAmount: (0, import_fields18.integer)({ validation: { isRequired: true, min: 0 } }),
    taxAmount: (0, import_fields18.integer)({ validation: { isRequired: true, min: 0 }, defaultValue: 0 }),
    deliveryAmount: (0, import_fields18.integer)({ validation: { isRequired: true, min: 0 }, defaultValue: 0 }),
    totalAmount: (0, import_fields18.integer)({ validation: { isRequired: true, min: 0 } }),
    currencyCode: (0, import_fields18.text)({ validation: { isRequired: true }, defaultValue: "USD" }),
    pickupAt: (0, import_fields18.timestamp)(),
    deliveryWindow: (0, import_fields18.text)(),
    shippingAddressSnapshot: (0, import_fields18.json)({ access: { read: permissions.canViewPatientPrivateData, update: () => false } }),
    billingAddressSnapshot: (0, import_fields18.json)({ access: { read: permissions.canViewPatientPrivateData, update: () => false } }),
    organization: (0, import_fields18.relationship)({ ref: "Organization.orders", db: requiredRelationshipDb }),
    location: (0, import_fields18.relationship)({ ref: "PharmacyLocation.orders", db: requiredRelationshipDb }),
    customer: (0, import_fields18.relationship)({ ref: "User.orders", access: immutableRelationship }),
    patient: (0, import_fields18.relationship)({ ref: "PatientProfile.orders", access: immutableRelationship }),
    prescription: (0, import_fields18.relationship)({ ref: "Prescription.orders", access: immutableRelationship }),
    cart: (0, import_fields18.relationship)({ ref: "Cart.order", access: immutableRelationship }),
    consent: (0, import_fields18.relationship)({ ref: "ConsentRecord.order", access: immutableRelationship }),
    approval: (0, import_fields18.relationship)({ ref: "HumanApproval.orders", access: immutableRelationship }),
    lineItems: (0, import_fields18.relationship)({ ref: "OrderLineItem.order", many: true, access: immutableRelationship }),
    dispensingLabels: (0, import_fields18.relationship)({ ref: "DispensingLabel.order", many: true, access: immutableRelationship }),
    payments: (0, import_fields18.relationship)({ ref: "Payment.order", many: true, access: immutableRelationship }),
    fulfillment: (0, import_fields18.relationship)({ ref: "Fulfillment.order", access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/OrderLineItem.ts
var import_core18 = require("@keystone-6/core");
var import_fields19 = require("@keystone-6/core/fields");
var denyMutation5 = () => false;
var OrderLineItem = (0, import_core18.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: denyMutation5,
      update: denyMutation5,
      delete: denyMutation5
    },
    filter: { query: rules.canReadOrderLineItems }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: orderLineItemHooks,
  fields: {
    title: (0, import_fields19.text)({ validation: { isRequired: true }, access: { update: denyMutation5 } }),
    sku: (0, import_fields19.text)({ access: { update: denyMutation5 } }),
    ndc11Snapshot: (0, import_fields19.text)({ access: { update: denyMutation5 } }),
    quantity: (0, import_fields19.integer)({ validation: { isRequired: true, min: 1 }, access: { update: denyMutation5 } }),
    unitPriceAmount: (0, import_fields19.integer)({ validation: { isRequired: true, min: 0 }, access: { update: denyMutation5 } }),
    lineTotalAmount: (0, import_fields19.integer)({ validation: { isRequired: true, min: 0 }, access: { update: denyMutation5 } }),
    imageUrl: (0, import_fields19.text)({ access: { update: denyMutation5 } }),
    prescriptionRequirementSnapshot: (0, import_fields19.text)({ validation: { isRequired: true }, access: { update: denyMutation5 } }),
    metadata: (0, import_fields19.json)({ access: { read: permissions.canManageOrders, update: denyMutation5 } }),
    order: (0, import_fields19.relationship)({ ref: "Order.lineItems", access: { update: denyMutation5 }, db: requiredRelationshipDb }),
    product: (0, import_fields19.relationship)({ ref: "Product.orderLineItems", access: { create: denyMutation5, update: denyMutation5 }, db: requiredRelationshipDb }),
    lotAllocationSnapshot: (0, import_fields19.json)({ access: { read: permissions.canManageInventory, update: denyMutation5 } }),
    ...trackingFields
  }
});

// features/keystone/models/Organization.ts
var import_core19 = require("@keystone-6/core");
var import_access30 = require("@keystone-6/core/access");
var import_fields20 = require("@keystone-6/core/fields");

// features/platform/store-settings/lib/icon-registry.ts
var LOGO_ICONS = [
  {
    id: "3portals",
    name: "3Portals",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g clip-rule="evenodd" fill-rule="evenodd"><path d="m34.5868 8.40061-9.6868-2.59556c-.6687-.17919-1.2108.23679-1.2108.92911v10.02854c0 .6923.5421 1.3988 1.2108 1.578l9.6868 2.5955c.6687.1792 1.2109-.2368 1.2109-.9291v-10.02848c0-.69232-.5422-1.39882-1.2109-1.57801zm-9.6868-6.35625c-2.6749-.71674-4.8434.94718-4.8434 3.71647v10.02847c0 2.7693 2.1685 5.5953 4.8434 6.312l9.6868 2.5956c2.6749.7168 4.8434-.9472 4.8434-3.7165v-10.0284c0-2.76934-2.1685-5.59533-4.8434-6.31207z" fill="#8098f9"/><path d="m26.9812 16.5707-12.1085-3.2444c-.6687-.1792-1.2109.2368-1.2109.9291v12.5356c0 .6923.5422 1.3988 1.2109 1.578l12.1085 3.2445c.6687.1792 1.2108-.2368 1.2108-.9291v-12.5356c0-.6924-.5421-1.3989-1.2108-1.5781zm-12.1085-7.0051c-2.6749-.71674-4.8434.9472-4.8434 3.7165v12.5356c0 2.7693 2.1685 5.5953 4.8434 6.312l12.1085 3.2445c2.6749.7167 4.8433-.9472 4.8433-3.7165v-12.5356c0-2.7693-2.1684-5.5953-4.8433-6.312z" fill="#6172f3"/><path d="m19.3736 24.7409-14.53021-3.8934c-.66873-.1792-1.21085.2368-1.21085.9291v15.0428c0 .6923.54212 1.3988 1.21085 1.578l14.53021 3.8933c.6687.1792 1.2108-.2368 1.2108-.9291v-15.0427c0-.6923-.5421-1.3988-1.2108-1.578zm-14.53021-7.6541c-2.67493-.7167-4.84339.9472-4.84339 3.7165v15.0427c0 2.7693 2.16846 5.5953 4.84339 6.3121l14.53021 3.8933c2.6749.7168 4.8433-.9472 4.8433-3.7164v-15.0428c0-2.7693-2.1684-5.5953-4.8433-6.312z" fill="#444ce7"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g clip-rule="evenodd" fill="#fff" fill-rule="evenodd"><path d="m34.5868 8.40061-9.6868-2.59556c-.6687-.17919-1.2108.23679-1.2108.92911v10.02854c0 .6923.5421 1.3988 1.2108 1.578l9.6868 2.5955c.6687.1792 1.2109-.2368 1.2109-.9291v-10.02848c0-.69232-.5422-1.39882-1.2109-1.57801zm-9.6868-6.35625c-2.6749-.71674-4.8434.94718-4.8434 3.71647v10.02847c0 2.7693 2.1685 5.5953 4.8434 6.312l9.6868 2.5956c2.6749.7168 4.8434-.9472 4.8434-3.7165v-10.0284c0-2.76934-2.1685-5.59533-4.8434-6.31207z" opacity=".5"/><path d="m26.9812 16.5707-12.1085-3.2444c-.6687-.1792-1.2109.2368-1.2109.9291v12.5356c0 .6923.5422 1.3988 1.2109 1.578l12.1085 3.2445c.6687.1792 1.2108-.2368 1.2108-.9291v-12.5356c0-.6924-.5421-1.3989-1.2108-1.5781zm-12.1085-7.0051c-2.6749-.71674-4.8434.9472-4.8434 3.7165v12.5356c0 2.7693 2.1685 5.5953 4.8434 6.312l12.1085 3.2445c2.6749.7167 4.8433-.9472 4.8433-3.7165v-12.5356c0-2.7693-2.1684-5.5953-4.8433-6.312z" opacity=".7"/><path d="m19.3736 24.7409-14.53021-3.8934c-.66873-.1792-1.21085.2368-1.21085.9291v15.0428c0 .6923.54212 1.3988 1.21085 1.578l14.53021 3.8933c.6687.1792 1.2108-.2368 1.2108-.9291v-15.0427c0-.6923-.5421-1.3988-1.2108-1.578zm-14.53021-7.6541c-2.67493-.7167-4.84339.9472-4.84339 3.7165v15.0427c0 2.7693 2.16846 5.5953 4.84339 6.3121l14.53021 3.8933c2.6749.7168 4.8433-.9472 4.8433-3.7164v-15.0428c0-2.7693-2.1684-5.5953-4.8433-6.312z"/></g></svg>`
  },
  {
    id: "45-degrees",
    name: "45 Degrees",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 24 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m0 15.8981h17.3455l-17.061314 17.0613 2.756374 2.7564 17.06134-17.0613v17.3455h.1104l3.7877-3.7877v-15.9638l-4.2485-4.2485h-15.96596l-3.78553995 3.7855z" fill="#155eef"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 24 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m0 15.8981h17.3455l-17.061314 17.0613 2.756374 2.7564 17.06134-17.0613v17.3455h.1104l3.7877-3.7877v-15.9638l-4.2485-4.2485h-15.96596l-3.78553995 3.7855z" fill="#155eef"/></svg>`
  },
  {
    id: "acme-corp",
    name: "Acme Corp",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 48 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m0 24c15.2548 0 24-8.7452 24-24 0 15.2548 8.7452 24 24 24-15.2548 0-24 8.7452-24 24 0-15.2548-8.7452-24-24-24z" fill="#155eef" fill-rule="evenodd"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 48 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m0 24c15.2548 0 24-8.7452 24-24 0 15.2548 8.7452 24 24 24-15.2548 0-24 8.7452-24 24 0-15.2548-8.7452-24-24-24z" fill="#155eef" fill-rule="evenodd"/></svg>`
  },
  {
    id: "alphawave",
    name: "AlphaWave",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 47 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m24.9706 7.03309c-3.1242-3.1242-8.1896-3.1242-11.3137 0l-11.31375 11.31371c-3.124199 3.1242-3.124199 8.1895 0 11.3137l11.31375 11.3137c3.1241 3.1242 8.1895 3.1242 11.3137 0l5.3982-5.3983c-4.4939-1.7337-7.682-6.0944-7.682-11.1997 0-5.3087 3.4472-9.8123 8.2254-11.3943-.0935-.0982-.1884-.1955-.2848-.292z" fill="#155eef"/><path d="m30.3691 35.5798c1.3398.5168 2.7955.8001 4.3174.8001 6.6274 0 12-5.3726 12-12s-5.3726-12-12-12c-1.3185 0-2.5873.2126-3.774.6055 5.9623 6.2681 5.8675 16.1836-.2846 22.3356z" fill="#155eef" opacity=".7"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 47 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m24.9706 7.03309c-3.1242-3.1242-8.1896-3.1242-11.3137 0l-11.31375 11.31371c-3.124199 3.1242-3.124199 8.1895 0 11.3137l11.31375 11.3137c3.1241 3.1242 8.1895 3.1242 11.3137 0l5.3982-5.3983c-4.4939-1.7337-7.682-6.0944-7.682-11.1997 0-5.3087 3.4472-9.8123 8.2254-11.3943-.0935-.0982-.1884-.1955-.2848-.292z" fill="#155eef"/><path d="m30.3691 35.5798c1.3398.5168 2.7955.8001 4.3174.8001 6.6274 0 12-5.3726 12-12s-5.3726-12-12-12c-1.3185 0-2.5873.2126-3.774.6055 5.9623 6.2681 5.8675 16.1836-.2846 22.3356z" fill="#155eef" opacity=".7"/></svg>`
  },
  {
    id: "alt-shift",
    name: "Alt+Shift",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#155eef"><path d="m23.4538 34.7189c-3.1818-1.1818-6.4544-1.3636-9.4544-.5455-2.0909.5455-4.09082 1.6364-5.90897 3l-1.27273 1.0909-.36362.3636.81816.7273c.09091 0 .09092.0909.18183.1818.18181.1818.36364.2727.63636.4545l.54542.3636.54545-.4545c.09091-.0909.27273-.2727.45454-.3636 1.63636-1.3636 3.45446-2.2727 5.36356-2.7272 2.4545-.6364 5.0908-.5455 7.7271.4545 2.1818.8182 6.6363 1.8181 11.9998-.4545l.1818-.091.2728-.2727c0-.0909.0909-.0909.1818-.1818.4545-.5454.9091-1.0909 1.2727-1.7272l1.8181-2.8182-2.909 1.6363c-4.2727 2.3636-8.1817 2.8182-12.0907 1.3637z"/><path d="m10.9998 24.9011c2.4545-.6363 5.0908-.5454 7.7272.4546 2.909 1.0909 10.3634 2.6363 18.7269-4.909l1.8182-1.8182-.1819-.4545c-.0909-.3636-.2727-.8182-.4545-1.2727l-.4545-1.2727-.9091.909c-.0909.1819-.2727.2728-.4546.4546-3.9999 4.0908-10.1816 8.2726-17.2724 5.7272-3.1817-1.1818-6.4544-1.3637-9.4544-.5455-2.909.8182-5.45442 2.3636-7.81801 4.5454v-.0909l-1.363614 1.4545c0 .0909-.090891.0909-.181798.1818l-.27274.2727.090913.3637c.090908.4545.272717.909.363625 1.3636l.545454 1.4545.90907-1.1818c.09091-.1818.27272-.2727.36363-.4545 1.90905-1.7273 4.54538-4.1818 8.27257-5.1818z"/><path d="m2.1818 23.2646c2.09088-2.1818 4.45445-3.5454 6.99987-4.2727 2.45453-.6363 5.09083-.5454 7.72713.4546 8.1817 2.9999 15.2725-1.9091 18.3633-4.5454l1.1818-1.1818.4546-.3636-.3637-.5455c-.2727-.2727-.4545-.6363-.7272-1l-.5455-.7272-.6363.6363c-.0909.0909-.2727.2727-.3637.3637-3.8181 3.6363-9.7271 7.3635-16.4542 4.8181-3.1818-1.1818-6.4544-1.3637-9.4544-.5455-1.90906.5455-3.72721 1.4545-5.54536 2.6363l-1.909065 1.5455c-.181815.1818-.272722.2727-.454537.4545l-.181799.1818v.2727c-.090907.6364-.090918 1.2727-.1818259 1.8182l-.0909131 2.2727 1.54544-1.6364c.18181-.1818.36364-.4545.63636-.6363z"/><path d="m26.0908 40.9007c-.2727-.0909-.4545-.1819-.7272-.2728-3.1818-1.1818-6.4545-1.3636-9.4545-.5454-.6363.1818-1.2726.3636-1.909.6364l-2.1818.9999-.5454.2728 1.8181.6363c.5455.1818 1.0909.3637 1.6364.5455l.2727.0909.2727-.0909c.2727-.0909.5455-.2728.8182-.2728.1818 0 .3636-.0909.5454-.1818 2.1818-.5454 4.5454-.5454 7.0908.2727.2727.091.4546.1819.7273.2728l.4545.1818.2727-.0909c.6364-.1818 1.3636-.3636 1.9091-.6364l2.5454-.909-2.6363-.6364c-.2727-.0909-.6364-.1818-.9091-.2727z"/><path d="m40 22.0829-1.3636 1.3636c-.1818.1818-.3636.3636-.5454.5454-3.7272 3.5454-9.7271 7.3635-16.4543 4.8181-3.1818-1.1818-6.4544-1.3636-9.4544-.5454-2.81811.8182-5.36354 2.2727-7.63623 4.4545l-1.18179 1.2727-.36362.4545.36362.5454c.27273.3637.45455.6364.63637 1l.54542.8182.63636-.8182c.09091-.0909.27272-.2727.36363-.3636 2.18178-2.3636 4.54534-3.8181 7.27264-4.5454 2.4545-.6364 5.0908-.5454 7.7271.4545 2.2727.8182 4.6363 1.0909 6.9999.8182 4.1817-.4545 8.3635-2.8181 11.4543-5.4544.1819-.1818.3636-.2727.5455-.4546l.2727-.2727v-.2727c0-.5455.0909-1.1818.0909-1.7273z"/><path d="m5.45373 13.7196c.54545-.2728 1.18182-.4546 1.72726-.6364 2.45451-.6364 5.09081-.5455 7.72711.4545 1.7273.6364 3.4545.9091 5.3636.9091 3.8181 0 7.6362-1.3636 11.1816-3.9999l1.8181-1.45455-.8181-.63636c-.2727-.27273-.6364-.54544-1-.72725l-.5455-.36363-.4545.36363c-.1818.09091-.2727.27272-.4545.36362-4.8181 3.63634-9.6362 4.63634-14.1816 2.90904-3.2727-1.18178-6.54535-1.45451-9.81802-.4545-.27272.0909-.54544.1818-.90907.2727l-.1818.0909-.27274.2727c0 .0909-.09089.0909-.1818.1818-.36363.5455-.81818 1-1.18181 1.5455l-1.72724 2.6363 2.81814-1.4545c.45453 0 .81815-.1818 1.09087-.2727z"/><path d="m12.9089 7.53769.2727.09091c1.1818.45454 3 .90907 5.2726.90907 2.3636 0 4.6363-.54545 6.909-1.45452l2.8181-1.36361-1.909-.63634c-.5454-.18182-1.0909-.36363-1.7273-.45454h-.2727l-.2727.09089c-.2727.0909-.5455.27274-.8182.36365-2.7272.99998-5.4544 1.1818-8.0907.45454-.2728-.09091-.5455-.18183-.8182-.27274l-.2727-.09091-.2728.09091c-.5454.18181-1.0908.36364-1.6363.63636l-2.09087.90908 2.18177.63633c.1818-.0909.4546.00001.7273.09092z"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m23.4538 34.7189c-3.1818-1.1818-6.4544-1.3636-9.4544-.5455-2.0909.5455-4.09082 1.6364-5.90897 3l-1.27273 1.0909-.36362.3636.81816.7273c.09091 0 .09092.0909.18183.1818.18181.1818.36364.2727.63636.4545l.54542.3636.54545-.4545c.09091-.0909.27273-.2727.45454-.3636 1.63636-1.3636 3.45446-2.2727 5.36356-2.7272 2.4545-.6364 5.0908-.5455 7.7271.4545 2.1818.8182 6.6363 1.8181 11.9998-.4545l.1818-.091.2728-.2727c0-.0909.0909-.0909.1818-.1818.4545-.5454.9091-1.0909 1.2727-1.7272l1.8181-2.8182-2.909 1.6363c-4.2727 2.3636-8.1817 2.8182-12.0907 1.3637z"/><path d="m10.9998 24.9011c2.4545-.6363 5.0908-.5454 7.7272.4546 2.909 1.0909 10.3634 2.6363 18.7269-4.909l1.8182-1.8182-.1819-.4545c-.0909-.3636-.2727-.8182-.4545-1.2727l-.4545-1.2727-.9091.909c-.0909.1819-.2727.2728-.4546.4546-3.9999 4.0908-10.1816 8.2726-17.2724 5.7272-3.1817-1.1818-6.4544-1.3637-9.4544-.5455-2.909.8182-5.45442 2.3636-7.81801 4.5454v-.0909l-1.363614 1.4545c0 .0909-.090891.0909-.181798.1818l-.27274.2727.090913.3637c.090908.4545.272717.909.363625 1.3636l.545454 1.4545.90907-1.1818c.09091-.1818.27272-.2727.36363-.4545 1.90905-1.7273 4.54538-4.1818 8.27257-5.1818z"/><path d="m2.1818 23.2646c2.09088-2.1818 4.45445-3.5454 6.99987-4.2727 2.45453-.6363 5.09083-.5454 7.72713.4546 8.1817 2.9999 15.2725-1.9091 18.3633-4.5454l1.1818-1.1818.4546-.3636-.3637-.5455c-.2727-.2727-.4545-.6363-.7272-1l-.5455-.7272-.6363.6363c-.0909.0909-.2727.2727-.3637.3637-3.8181 3.6363-9.7271 7.3635-16.4542 4.8181-3.1818-1.1818-6.4544-1.3637-9.4544-.5455-1.90906.5455-3.72721 1.4545-5.54536 2.6363l-1.909065 1.5455c-.181815.1818-.272722.2727-.454537.4545l-.181799.1818v.2727c-.090907.6364-.090918 1.2727-.1818259 1.8182l-.0909131 2.2727 1.54544-1.6364c.18181-.1818.36364-.4545.63636-.6363z"/><path d="m26.0908 40.9007c-.2727-.0909-.4545-.1819-.7272-.2728-3.1818-1.1818-6.4545-1.3636-9.4545-.5454-.6363.1818-1.2726.3636-1.909.6364l-2.1818.9999-.5454.2728 1.8181.6363c.5455.1818 1.0909.3637 1.6364.5455l.2727.0909.2727-.0909c.2727-.0909.5455-.2728.8182-.2728.1818 0 .3636-.0909.5454-.1818 2.1818-.5454 4.5454-.5454 7.0908.2727.2727.091.4546.1819.7273.2728l.4545.1818.2727-.0909c.6364-.1818 1.3636-.3636 1.9091-.6364l2.5454-.909-2.6363-.6364c-.2727-.0909-.6364-.1818-.9091-.2727z"/><path d="m40 22.0829-1.3636 1.3636c-.1818.1818-.3636.3636-.5454.5454-3.7272 3.5454-9.7271 7.3635-16.4543 4.8181-3.1818-1.1818-6.4544-1.3636-9.4544-.5454-2.81811.8182-5.36354 2.2727-7.63623 4.4545l-1.18179 1.2727-.36362.4545.36362.5454c.27273.3637.45455.6364.63637 1l.54542.8182.63636-.8182c.09091-.0909.27272-.2727.36363-.3636 2.18178-2.3636 4.54534-3.8181 7.27264-4.5454 2.4545-.6364 5.0908-.5454 7.7271.4545 2.2727.8182 4.6363 1.0909 6.9999.8182 4.1817-.4545 8.3635-2.8181 11.4543-5.4544.1819-.1818.3636-.2727.5455-.4546l.2727-.2727v-.2727c0-.5455.0909-1.1818.0909-1.7273z"/><path d="m5.45373 13.7196c.54545-.2728 1.18182-.4546 1.72726-.6364 2.45451-.6364 5.09081-.5455 7.72711.4545 1.7273.6364 3.4545.9091 5.3636.9091 3.8181 0 7.6362-1.3636 11.1816-3.9999l1.8181-1.45455-.8181-.63636c-.2728-.27273-.6364-.54544-1-.72725l-.5455-.36363-.4545.36363c-.1818.09091-.2727.27272-.4545.36362-4.8181 3.63634-9.6362 4.63634-14.1816 2.90904-3.2727-1.18178-6.54535-1.45451-9.81802-.4545-.27272.0909-.54544.1818-.90907.2727l-.1818.0909-.27274.2727c0 .0909-.09089.0909-.1818.1818-.36363.5455-.81818 1-1.18181 1.5455l-1.72724 2.6363 2.81814-1.4545c.45453 0 .81815-.1818 1.09087-.2727z"/><path d="m12.9089 7.53769.2727.09091c1.1818.45454 3 .90907 5.2726.90907 2.3636 0 4.6363-.54545 6.909-1.45452l2.8181-1.36361-1.909-.63634c-.5454-.18182-1.0909-.36363-1.7273-.45454h-.2727l-.2727.09089c-.2727.0909-.5455.27274-.8182.36365-2.7272.99998-5.4544 1.1818-8.0907.45454-.2728-.09091-.5455-.18183-.8182-.27274l-.2727-.09091-.2728.09091c-.5454.18181-1.0908.36364-1.6363.63636l-2.09087.90908 2.18177.63633c.1818-.0909.4546.00001.7273.09092z"/></g></svg>`
  },
  {
    id: "biosynthesis",
    name: "Biosynthesis",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g clip-rule="evenodd" fill-rule="evenodd"><path d="m4.29111 28.6025c.90712.9019.9071 2.3641-.00003 3.266l-.04646.0462c-.90713.9019-2.37788.9018-3.284994-.0001-.9071177-.9019-.9071038-2.3641.000031-3.266l.046453-.0462c.90714-.9019 2.37788-.9018 3.285.0001z" fill="#a4bcfd"/><path d="m15.2112 29.298c.9055.9035.9028 2.3658-.006 3.266l-6.43424 6.3741c-.90876.9002-2.3795.8976-3.28499-.0059-.90548-.9035-.90282-2.3658.00594-3.266l6.43429-6.3741c.9088-.9002 2.3795-.8976 3.285.0059z" fill="#6172f3"/><path d="m23.9431 40.2706c.7116-1.0613 2.1538-1.348 3.2212-.6405l.1394.0923c1.0674.7075 1.3558 2.1414.6442 3.2026-.7116 1.0613-2.1538 1.3481-3.2212.6406l-.1394-.0924c-1.0674-.7075-1.3558-2.1414-.6442-3.2026z" fill="#a4bcfd"/><path d="m39.2728 28.4638c.9072.9019.9072 2.3641 0 3.266l-3.159 3.1408c-.9072.9019-2.3779.9019-3.285 0s-.9071-2.3641 0-3.266l3.1591-3.1408c.9071-.9019 2.3778-.9019 3.2849 0z" fill="#6172f3"/><g fill="#444ce7"><path d="m39.3197 16.8473c.9071.9019.9071 2.3642 0 3.266l-23.3446 23.2098c-.9071.9019-2.3779.9019-3.285 0s-.9071-2.3641 0-3.266l23.3446-23.2098c.9071-.9019 2.3778-.9019 3.285 0z"/><path d="m34.905 9.71133c.9072.90187.9072 2.36417 0 3.26607l-13.426 13.3485c-.9071.9019-2.3779.9019-3.285 0s-.9071-2.3642 0-3.2661l13.4261-13.34847c.9071-.90189 2.3778-.90189 3.2849 0z"/><path d="m27.8187 5.18362c.9077.90128.9087 2.36353.0022 3.26603l-17.2588 17.18215c-.90647.9025-2.37721.9035-3.28495.0022-.90773-.9013-.90872-2.3635-.00221-3.266l17.25876-17.18218c.9065-.9025 2.3772-.90348 3.285-.0022z"/></g><path d="m10.7276 10.6841c.9056.9035.9031 2.3657-.0056 3.266l-6.75949 6.6974c-.90869.9003-2.37943.8978-3.28499-.0056-.905563-.9035-.903032-2.3657.005654-3.2661l6.759476-6.6973c.90868-.90034 2.37942-.89783 3.28495.0056z" fill="#6172f3"/><path d="m14.8678 4.00024c1.2828 0 2.3228 1.03397 2.3228 2.30944v.23094c0 1.27546-1.04 2.30943-2.3228 2.30943-1.2829 0-2.3229-1.03397-2.3229-2.30943v-.23094c0-1.27547 1.04-2.30944 2.3229-2.30944z" fill="#a4bcfd"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g clip-rule="evenodd" fill="#fff" fill-rule="evenodd"><path d="m4.29111 28.6025c.90712.9019.9071 2.3641-.00003 3.266l-.04646.0462c-.90713.9019-2.37788.9018-3.284994-.0001-.9071177-.9019-.9071038-2.3641.000031-3.266l.046453-.0462c.90714-.9019 2.37788-.9018 3.285.0001z" opacity=".5"/><path d="m15.2112 29.298c.9055.9035.9028 2.3658-.006 3.266l-6.43424 6.3741c-.90876.9002-2.3795.8976-3.28499-.0059-.90548-.9035-.90282-2.3658.00594-3.266l6.43429-6.3741c.9088-.9002 2.3795-.8976 3.285.0059z" opacity=".7"/><path d="m23.9431 40.2706c.7116-1.0613 2.1538-1.348 3.2212-.6405l.1394.0923c1.0674.7075 1.3558 2.1414.6442 3.2026-.7116 1.0613-2.1538 1.3481-3.2212.6406l-.1394-.0924c-1.0674-.7075-1.3558-2.1414-.6442-3.2026z" opacity=".5"/><path d="m39.2728 28.4638c.9072.9019.9072 2.3641 0 3.266l-3.159 3.1408c-.9072.9019-2.3779.9019-3.285 0s-.9071-2.3641 0-3.266l3.1591-3.1408c.9071-.9019 2.3778-.9019 3.2849 0z" opacity=".7"/><path d="m39.3197 16.8473c.9071.9019.9071 2.3642 0 3.266l-23.3446 23.2098c-.9071.9019-2.3779.9019-3.285 0s-.9071-2.3641 0-3.266l23.3446-23.2098c.9071-.9019 2.3778-.9019 3.285 0z"/><path d="m34.905 9.71133c.9072.90187.9072 2.36417 0 3.26607l-13.426 13.3485c-.9071.9019-2.3779.9019-3.285 0s-.9071-2.3642 0-3.2661l13.4261-13.34847c.9071-.90189 2.3778-.90189 3.2849 0z"/><path d="m27.8187 5.18362c.9077.90128.9087 2.36353.0022 3.26603l-17.2588 17.18215c-.90647.9025-2.37721.9035-3.28495.0022-.90773-.9013-.90872-2.3635-.00221-3.266l17.25876-17.18218c.9065-.9025 2.3772-.90348 3.285-.0022z"/><path d="m10.7276 10.6841c.9056.9035.9031 2.3657-.0056 3.266l-6.75949 6.6974c-.90869.9003-2.37943.8978-3.28499-.0056-.905563-.9035-.903032-2.3657.005654-3.2661l6.759476-6.6973c.90868-.90034 2.37942-.89783 3.28495.0056z" opacity=".7"/><path d="m14.8678 4.00024c1.2828 0 2.3228 1.03397 2.3228 2.30944v.23094c0 1.27546-1.04 2.30943-2.3228 2.30943-1.2829 0-2.3229-1.03397-2.3229-2.30943v-.23094c0-1.27547 1.04-2.30944 2.3229-2.30944z" opacity=".5"/></g></svg>`
  },
  {
    id: "boltshift",
    name: "Boltshift",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m20 44c11.0457 0 20-8.9543 20-20s-8.9543-20-20-20c-11.04572 0-20 8.9543-20 20s8.95428 20 20 20zm6.2393-30.6832c.3037-1.0787-.7432-1.7167-1.6993-1.0355l-13.3469 9.5083c-1.0369.7387-.8738 2.2104.245 2.2104h3.5146v-.0272h6.8498l-5.5813 1.9693-2.4605 8.7411c-.3037 1.0788.7431 1.7167 1.6993 1.0355l13.3469-9.5082c1.0369-.7387.8737-2.2105-.245-2.2105h-5.3298z" fill="#155eef" fill-rule="evenodd"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m20 44c11.0457 0 20-8.9543 20-20s-8.9543-20-20-20c-11.04572 0-20 8.9543-20 20s8.95428 20 20 20zm6.2393-30.6832c.3037-1.0787-.7432-1.7167-1.6993-1.0355l-13.3469 9.5083c-1.0369.7387-.8738 2.2104.245 2.2104h3.5146v-.0272h6.8498l-5.5813 1.9693-2.4605 8.7411c-.3037 1.0788.7431 1.7167 1.6993 1.0355l13.3469-9.5082c1.0369-.7387.8737-2.2105-.245-2.2105h-5.3298z" fill="#fff" fill-rule="evenodd"/></svg>`
  },
  {
    id: "buildingblocks",
    name: "BuildingBlocks",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 37 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m12.8841 4.30945-6.8842 3.97574 6.8891 3.97661 6.8862-3.97575zm8.8919 7.44025-6.887 3.9762-.0007 7.9532 6.8877-3.9771zm2 11.4164-6.8879 3.9772 6.8889 3.9765 6.8871-3.9763zm8.8879 7.4416-6.8868 3.9761v7.9522l6.8868-3.9761zm-10.8868 11.9287v-7.9525l-6.8891-3.9766v7.9525zm-10.8888-18.8569-6.8883-3.9775v-7.9526l6.889 3.9765zm-.0003 4.6187-9.38814-5.4209c-.928127-.5359-1.49986-1.5262-1.49986-2.598v-11.99368c0-.71444.381106-1.37463.999789-1.73193l10.383811-5.996798c.9281-.5359626 2.0716-.5361538 2.9998-.000505l10.3922 5.996973c.619.3572 1.0004 1.01758 1.0004 1.73226v11.41638l9.888 5.7096c.6188.3573.9999 1.0175.9999 1.732v11.9937c0 1.0718-.5718 2.0621-1.5 2.598l-10.3868 5.9969c-.6187.3572-1.381.3572-1.9998.0001l-10.3891-5.9969c-.9283-.5358-1.5002-1.5263-1.5002-2.5982z" fill="#155eef" fill-rule="evenodd"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 37 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m12.8841 4.30945-6.8842 3.97574 6.8891 3.97661 6.8862-3.97575zm8.8919 7.44025-6.887 3.9762-.0007 7.9532 6.8877-3.9771zm2 11.4164-6.8879 3.9772 6.8889 3.9765 6.8871-3.9763zm8.8879 7.4416-6.8868 3.9761v7.9522l6.8868-3.9761zm-10.8868 11.9287v-7.9525l-6.8891-3.9766v7.9525zm-10.8888-18.8569-6.8883-3.9775v-7.9526l6.889 3.9765zm-.0003 4.6187-9.38814-5.4209c-.928127-.5359-1.49986-1.5262-1.49986-2.598v-11.99368c0-.71444.381106-1.37463.999789-1.73193l10.383811-5.996798c.9281-.5359626 2.0716-.5361538 2.9998-.000505l10.3922 5.996973c.619.3572 1.0004 1.01758 1.0004 1.73226v11.41638l9.888 5.7096c.6188.3573.9999 1.0175.9999 1.732v11.9937c0 1.0718-.5718 2.0621-1.5 2.598l-10.3868 5.9969c-.6187.3572-1.381.3572-1.9998.0001l-10.3891-5.9969c-.9283-.5358-1.5002-1.5263-1.5002-2.5982z" fill="#155eef" fill-rule="evenodd"/></svg>`
  },
  {
    id: "calescence",
    name: "Calescence",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 36 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g clip-rule="evenodd" fill="#1570ef" fill-rule="evenodd"><path d="m35.3721 14v8.0492h-9.9698v-2.2927z"/><path d="m35.3699 14.0001-9.9698 5.7565-7.3513-4.2436v-11.513z" opacity=".9"/><path d="m18.0512 4v11.513l-7.349 4.2436-9.969778-5.7565z" opacity=".8"/><path d="m10.7002 19.7565v8.4868l-9.969731 5.756v-19.9993z" opacity=".7"/><path d="m18.0492 32.4871v11.5129l-17.318731-10.0006 9.969731-5.756z" opacity=".6"/><path d="m35.3699 33.9994-17.3211 10.0006v-11.5129l7.3513-4.2437z" opacity=".5"/><path d="m35.3721 25.9507v8.0487l-9.9698-5.756v-2.2927z" opacity=".4"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 36 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g clip-rule="evenodd" fill="#fff" fill-rule="evenodd"><path d="m35.3721 14v8.0492h-9.9698v-2.2927z"/><path d="m35.3699 14.0001-9.9698 5.7565-7.3513-4.2436v-11.513z" opacity=".9"/><path d="m18.0512 4v11.513l-7.349 4.2436-9.969778-5.7565z" opacity=".8"/><path d="m10.7002 19.7565v8.4868l-9.969731 5.756v-19.9993z" opacity=".7"/><path d="m18.0492 32.4871v11.5129l-17.318731-10.0006 9.969731-5.756z" opacity=".6"/><path d="m35.3699 33.9994-17.3211 10.0006v-11.5129l7.3513-4.2437z" opacity=".5"/><path d="m35.3721 25.9507v8.0487l-9.9698-5.756v-2.2927z" opacity=".4"/></g></svg>`
  },
  {
    id: "capsule",
    name: "Capsule",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="18" fill="#1570ef" r="14"/><circle cx="26" cy="30" fill="#53b1fd" r="14"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><circle cx="14" cy="18" opacity=".7" r="14"/><circle cx="26" cy="30" opacity=".7" r="14"/></g></svg>`
  },
  {
    id: "constellation",
    name: "Constellation",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 44 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#155eef"><path d="m16 8 5.0912 10.9088 10.9088 5.0912-10.9088 5.0912-5.0912 10.9088-5.0912-10.9088-10.9088-5.0912 10.9088-5.0912z"/><path d="m20.0469 31.3286 6.3539-1.0932 3.6 9.7646 3.6-9.7646 10.2565 1.7646-6.6564-8 6.6564-8-10.2565 1.7646-3.6-9.7646-3.6 9.7646-6.3539-1.0932 1.0442 2.2374 10.9088 5.0912-10.9088 5.0912z" opacity=".5"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 44 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m16 8 5.0912 10.9088 10.9088 5.0912-10.9088 5.0912-5.0912 10.9088-5.0912-10.9088-10.9088-5.0912 10.9088-5.0912z"/><path d="m20.0469 31.3286 6.3539-1.0932 3.6 9.7646 3.6-9.7646 10.2565 1.7646-6.6564-8 6.6564-8-10.2565 1.7646-3.6-9.7646-3.6 9.7646-6.3539-1.0932 1.0442 2.2374 10.9088 5.0912-10.9088 5.0912z" opacity=".5"/></g></svg>`
  },
  {
    id: "codecraft",
    name: "Codecraft",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m0 9c0-2.76142 2.23858-5 5-5h10c2.7614 0 5 2.23858 5 5v9.8192c.0002.06.0003.1203.0003.1808 0 2.7575 2.2322 4.9936 4.9881 5h.0116 10c2.7614 0 5 2.2386 5 5v10c0 2.7614-2.2386 5-5 5h-10c-2.7614 0-5-2.2386-5-5v-10c0-.0139.0001-.0277.0002-.0416-.0224-2.7422-2.2523-4.9584-4.9999-4.9584-.0129 0-.0258 0-.0387 0h-9.9616c-2.76142 0-5-2.2386-5-5z" fill="#155eef"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m0 9c0-2.76142 2.23858-5 5-5h10c2.7614 0 5 2.23858 5 5v9.8192c.0002.06.0003.1203.0003.1808 0 2.7575 2.2322 4.9936 4.9881 5h.0116 10c2.7614 0 5 2.2386 5 5v10c0 2.7614-2.2386 5-5 5h-10c-2.7614 0-5-2.2386-5-5v-10c0-.0139.0001-.0277.0002-.0416-.0224-2.7422-2.2523-4.9584-4.9999-4.9584-.0129 0-.0258 0-.0387 0h-9.9616c-2.76142 0-5-2.2386-5-5z" fill="#155eef"/></svg>`
  },
  {
    id: "command-r",
    name: "Command+R",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 32 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m18.6667 30.6667c7.3638 0 13.3333-5.9696 13.3333-13.3334 0-7.36376-5.9695-13.3333-13.3333-13.3333h-18.6667v26.6667z" fill="#155eef"/><path d="m0 4 32 40h-21.3333l-10.6667-13.3333z" fill="#2e90fa"/><path d="m21.1488 30.436c-.8042.1515-1.6339.2307-2.4821.2307h-18.6667v-26.6667z" fill="#53b1fd"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 32 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m18.6667 30.6667c7.3638 0 13.3333-5.9696 13.3333-13.3334 0-7.36376-5.9695-13.3333-13.3333-13.3333h-18.6667v26.6667z" opacity=".7"/><path d="m0 4 32 40h-21.3333l-10.6667-13.3333z" opacity=".7"/><path d="m21.1488 30.436c-.8042.1515-1.6339.2307-2.4821.2307h-18.6667v-26.6667z" opacity=".7"/></g></svg>`
  },
  {
    id: "contrast-ai",
    name: "ContrastAI",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m20 4c11.0457 0 20 8.9543 20 20s-8.9543 20-20 20-20-8.9543-20-20 8.9543-20 20-20zm15 20c0 8.2843-6.7157 15-15 15v-30c8.2843 0 15 6.7157 15 15z" fill="#155eef" fill-rule="evenodd"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m20 4c11.0457 0 20 8.9543 20 20s-8.9543 20-20 20-20-8.9543-20-20 8.9543-20 20-20zm15 20c0 8.2843-6.7157 15-15 15v-30c8.2843 0 15 6.7157 15 15z" fill="#fff" fill-rule="evenodd"/></svg>`
  },
  {
    id: "convergence",
    name: "Convergence",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 42 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m22.1017 20.8596 9.8995-9.8994-2.1213-2.12137-7.3389 7.33887v-13.1777h-3v13.1777l-7.3388-7.33887-2.1213 2.12137 9.8995 9.8994 1.0606 1.0607zm2.1207 2.1214 9.8995-9.8995 2.1213 2.1213-7.3388 7.3388h13.0956v3h-13.0956l7.3388 7.3389-2.1213 2.1213-9.8995-9.8995-1.0607-1.0607zm-16.26224 12.0208 9.89944-9.8995 1.0607-1.0607-1.0607-1.0606-9.89944-9.8995-2.12133 2.1213 7.33887 7.3388h-13.17574688v3h13.17574688l-7.33887 7.3389zm12.02024-7.7782-9.8995 9.8995 2.1213 2.1213 7.3388-7.3388v13.0944h3v-13.0944l7.3389 7.3388 2.1213-2.1213-9.8995-9.8995-1.0607-1.0607z" fill="#155eef" fill-rule="evenodd"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 42 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m22.1017 20.8596 9.8995-9.8994-2.1213-2.12137-7.3389 7.33887v-13.1777h-3v13.1777l-7.3388-7.33887-2.1213 2.12137 9.8995 9.8994 1.0606 1.0607zm2.1207 2.1214 9.8995-9.8995 2.1213 2.1213-7.3388 7.3388h13.0956v3h-13.0956l7.3388 7.3389-2.1213 2.1213-9.8995-9.8995-1.0607-1.0607zm-16.26224 12.0208 9.89944-9.8995 1.0607-1.0607-1.0607-1.0606-9.89944-9.8995-2.12133 2.1213 7.33887 7.3388h-13.17574688v3h13.17574688l-7.33887 7.3389zm12.02024-7.7782-9.8995 9.8995 2.1213 2.1213 7.3388-7.3388v13.0944h3v-13.0944l7.3389 7.3388 2.1213-2.1213-9.8995-9.8995-1.0607-1.0607z" fill="#155eef" fill-rule="evenodd"/></svg>`
  },
  {
    id: "core-os",
    name: "CoreOS",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 42 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m15.2286 4.99951c-3.2154 0-6.18655 1.71539-7.79425 4.5l-5.7735 9.99999c-1.6076941 2.7846-1.607697 6.2154 0 9l5.7735 10c1.6077 2.7846 4.57885 4.5 7.79425 4.5h11.547c3.2154 0 6.1865-1.7154 7.7942-4.5l5.7735-10c1.6077-2.7846 1.6077-6.2154 0-9l-5.7735-9.99999c-1.6077-2.78461-4.5788-4.5-7.7942-4.5zm11.547 5.99999h-7.2169c-1.1547 0-1.8762 1.2499-1.298 2.2494 1.784 3.0838 3.5722 6.1653 5.3536 9.2506.5359.9282.5359 2.0718 0 3-1.7814 3.0854-3.5696 6.1668-5.3536 9.2506-.5782.9995.1433 2.2494 1.298 2.2494h7.2169c1.0718 0 2.0622-.5718 2.5981-1.5l5.7735-10c.5359-.9282.5359-2.0718 0-3l-5.7735-10c-.5359-.9282-1.5263-1.5-2.5981-1.5z" fill="#155eef" fill-rule="evenodd"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 42 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m15.2286 4.99951c-3.2154 0-6.18655 1.71539-7.79425 4.5l-5.7735 9.99999c-1.6076941 2.7846-1.607697 6.2154 0 9l5.7735 10c1.6077 2.7846 4.57885 4.5 7.79425 4.5h11.547c3.2154 0 6.1865-1.7154 7.7942-4.5l5.7735-10c1.6077-2.7846 1.6077-6.2154 0-9l-5.7735-9.99999c-1.6077-2.78461-4.5788-4.5-7.7942-4.5zm11.547 5.99999h-7.2169c-1.1547 0-1.8762 1.2499-1.298 2.2494 1.784 3.0838 3.5722 6.1653 5.3536 9.2506.5359.9282.5359 2.0718 0 3-1.7814 3.0854-3.5696 6.1668-5.3536 9.2506-.5782.9995.1433 2.2494 1.298 2.2494h7.2169c1.0718 0 2.0622-.5718 2.5981-1.5l5.7735-10c.5359-.9282.5359-2.0718 0-3l-5.7735-10c-.5359-.9282-1.5263-1.5-2.5981-1.5z" fill="#155eef" fill-rule="evenodd"/></svg>`
  },
  {
    id: "cubekit",
    name: "Cubekit",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m0 14.5264v18.9473l17.8947-12.2437v-18.94741z" fill="#155eef" opacity=".5"/><path d="m0 33.4737v-18.9474l17.8947 12.2438v18.9474z" fill="#1570ef" opacity=".5"/><path d="m40 14.5263v18.9474l-17.8947-12.2438v-18.94737z" fill="#155eef" opacity=".5"/><path d="m40 33.4737v-18.9474l-17.8947 12.2438v18.9474z" fill="#1570ef" opacity=".5"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m0 14.5264v18.9473l17.8947-12.2437v-18.94741z" opacity=".5"/><path d="m0 33.4737v-18.9474l17.8947 12.2438v18.9474z" opacity=".5"/><path d="m40 14.5263v18.9474l-17.8947-12.2438v-18.94737z" opacity=".5"/><path d="m40 33.4737v-18.9474l-17.8947 12.2438v18.9474z" opacity=".5"/></g></svg>`
  },
  {
    id: "europa",
    name: "Europa",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#155eef"><path d="m28.6446 39.168c-.6032 1.3404-1.353 2.6531-2.2519 3.7888 7.4581-2.5137 12.9483-9.3054 13.5527-17.4568h-2.6549c-3.2399 0-5.8424 2.5861-6.369 5.7829-.4855 2.9468-1.2621 5.6301-2.2769 7.8851z"/><path d="m22.7724 25.5c3.3921 0 6.167 2.8299 5.5439 6.1643-1.3533 7.2424-4.5667 12.3357-8.3155 12.3357-4.7435 0-8.6299-8.1549-8.975-18.5z"/><path d="m30.9904 17.1502c.4961 3.2267 3.1106 5.8498 6.3752 5.8498h2.6107c-.4123-8.3729-5.9735-15.39183-13.5836-17.95683.8989 1.13575 1.6487 2.44843 2.2519 3.78878 1.0643 2.36505 1.8666 5.20115 2.3458 8.31825z"/><path d="m28.4165 16.8957c.5674 3.3176-2.1954 6.1043-5.5612 6.1043h-11.8434c.2344-10.5811 4.1693-19 8.9889-19 3.8447 0 7.1263 5.35721 8.4157 12.8957z"/><path d="m8.51131 23c.11359-5.4083 1.14536-10.3894 2.84579-14.16805.6031-1.34035 1.3529-2.65303 2.2519-3.78878-7.61011 2.565-13.171316 9.58393-13.5836094 17.95683z"/><path d="m.0562286 25.5c.6043994 8.1514 6.0946514 14.9431 13.5527714 17.4568-.899-1.1357-1.6488-2.4484-2.2519-3.7888-1.6479-3.6619-2.66781-8.4531-2.83264-13.668z"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m28.6446 39.168c-.6032 1.3404-1.353 2.6531-2.2519 3.7888 7.4581-2.5137 12.9483-9.3054 13.5527-17.4568h-2.6549c-3.2399 0-5.8424 2.5861-6.369 5.7829-.4855 2.9468-1.2621 5.6301-2.2769 7.8851z"/><path d="m22.7724 25.5c3.3921 0 6.167 2.8299 5.5439 6.1643-1.3533 7.2424-4.5667 12.3357-8.3155 12.3357-4.7435 0-8.6299-8.1549-8.975-18.5z"/><path d="m30.9904 17.1502c.4961 3.2267 3.1106 5.8498 6.3752 5.8498h2.6107c-.4123-8.3729-5.9735-15.39183-13.5836-17.95683.8989 1.13575 1.6487 2.44843 2.2519 3.78878 1.0643 2.36505 1.8666 5.20115 2.3458 8.31825z"/><path d="m28.4165 16.8957c.5674 3.3176-2.1954 6.1043-5.5612 6.1043h-11.8434c.2344-10.5811 4.1693-19 8.9889-19 3.8447 0 7.1263 5.35721 8.4157 12.8957z"/><path d="m8.51131 23c.11359-5.4083 1.14536-10.3894 2.84579-14.16805.6031-1.34035 1.3529-2.65303 2.2519-3.78878-7.61011 2.565-13.171316 9.58393-13.5836094 17.95683z"/><path d="m.0562286 25.5c.6043994 8.1514 6.0946514 14.9431 13.5527714 17.4568-.899-1.1357-1.6488-2.4484-2.2519-3.7888-1.6479-3.6619-2.66781-8.4531-2.83264-13.668z"/></g></svg>`
  },
  {
    id: "feather-dev",
    name: "FeatherDev",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 44 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m36.3068 11.4224c-.4322-.4323-.8644-.8645-1.2967-1.2967-1.2966-1.38311-2.6797-2.76621-4.4086-3.63065-1.9882-1.03733-4.1493-.778-6.3104-.778-3.2849 0-11.4971 0-16.33798 0l3.28488 4.40865h19.6228c1.8153 0 3.3713.3458 4.8409 1.2967.2593.0864.5186.0864.6051 0z" fill="#53b1fd"/><path d="m39.9368 18.511c-.4322-.4322-.8645-.8645-1.2967-1.2967-1.2967-1.3831-2.6797-2.7662-4.4086-3.6306-1.9882-1.0374-4.1494-.778-6.3105-.778-2.8526 0-9.6817 0-14.5226 0l3.2849 4.4086h17.8939c1.8154 0 3.3714.3458 4.8409 1.2967.1729.0864.3458.0864.5187 0z" fill="#2e90fa"/><path d="m44 25.4263c-.4322-.4323-.8645-.8645-1.2967-1.2967-1.2966-1.3831-2.6797-2.7662-4.4086-3.6307-1.9882-1.0373-4.1493-.7779-6.3104-.7779-2.6798 0-8.558 0-13.3124 0l3.2848 4.4086h16.5973c1.8153 0 3.3713.3458 4.8409 1.2967.2593.0864.4322.1729.6051 0z" fill="#1570ef"/><path d="m7.60742 37.0961c.43222.4322.86444.8644 1.29666 1.2966 1.29662 1.3831 2.67972 2.7662 4.40862 3.6307 1.9882 1.0373 4.1493.778 6.3104.778h16.338l-3.2849-4.4087c-5.9646 0-15.3006 0-19.6228 0-1.8153 0-3.37132-.3457-4.84087-1.2966-.25933-.0865-.43222-.0865-.60511 0z" fill="#53b1fd"/><path d="m3.97656 30.0079c.43222.4323.86444.8645 1.29666 1.2967 1.29667 1.3831 2.67976 2.7662 4.40864 3.6307 1.98824 1.0373 4.14934.778 6.31044.778h14.5226l-3.2849-4.4087c-5.8782 0-13.9175 0-17.89391 0-1.81532 0-3.37132-.3458-4.84087-1.2967-.17289-.0864-.34577-.0864-.51866 0z" fill="#2e90fa"/><path d="m0 23.0058c.43222.4322.864441.8644 1.29666 1.2966 1.29666 1.3831 2.67977 2.7662 4.40866 3.6307 1.98821 1.0373 4.1493.778 6.31038.778h13.3124l-3.2849-4.4087c-5.7053 0-12.96657 0-16.59722 0-1.81533 0-3.37132-.3458-4.840874-1.2966-.259332-.0865-.432218-.0865-.605106 0z" fill="#1570ef"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 44 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m36.3068 11.4224c-.4322-.4323-.8644-.8645-1.2967-1.2967-1.2966-1.38311-2.6797-2.76621-4.4086-3.63065-1.9882-1.03733-4.1493-.778-6.3104-.778-3.2849 0-11.4971 0-16.33798 0l3.28488 4.40865h19.6228c1.8153 0 3.3713.3458 4.8409 1.2967.2593.0864.5186.0864.6051 0z" opacity=".5"/><path d="m39.9368 18.511c-.4322-.4322-.8645-.8645-1.2967-1.2967-1.2967-1.3831-2.6797-2.7662-4.4086-3.6306-1.9882-1.0374-4.1494-.778-6.3105-.778-2.8526 0-9.6817 0-14.5226 0l3.2849 4.4086h17.8939c1.8154 0 3.3714.3458 4.8409 1.2967.1729.0864.3458.0864.5187 0z" opacity=".7"/><path d="m44 25.4263c-.4322-.4323-.8645-.8645-1.2967-1.2967-1.2966-1.3831-2.6797-2.7662-4.4086-3.6307-1.9882-1.0373-4.1493-.7779-6.3104-.7779-2.6798 0-8.558 0-13.3124 0l3.2848 4.4086h16.5973c1.8153 0 3.3713.3458 4.8409 1.2967.2593.0864.4322.1729.6051 0z"/><path d="m7.60742 37.0961c.43222.4322.86444.8644 1.29666 1.2966 1.29662 1.3832 2.67972 2.7662 4.40862 3.6307 1.9882 1.0373 4.1493.778 6.3104.778h16.338l-3.2849-4.4087c-5.9646 0-15.3006 0-19.6228 0-1.8153 0-3.37132-.3457-4.84087-1.2966-.25933-.0865-.43222-.0865-.60511 0z" opacity=".5"/><path d="m3.97656 30.0079c.43222.4323.86444.8645 1.29666 1.2967 1.29667 1.3831 2.67976 2.7662 4.40864 3.6307 1.98824 1.0373 4.14934.778 6.31044.778h14.5226l-3.2849-4.4087c-5.8782 0-13.9175 0-17.89391 0-1.81532 0-3.37132-.3458-4.84087-1.2967-.17289-.0864-.34577-.0864-.51866 0z" opacity=".7"/><path d="m0 23.0058c.43222.4322.864441.8644 1.29666 1.2966 1.29666 1.3831 2.67977 2.7662 4.40866 3.6307 1.98821 1.0373 4.1493.778 6.31038.778h13.3124l-3.2849-4.4087c-5.7053 0-12.96657 0-16.59722 0-1.81533 0-3.37132-.3458-4.840874-1.2966-.259332-.0865-.432218-.0865-.605106 0z"/></g></svg>`
  },
  {
    id: "flora-fauna",
    name: "Flora&Fauna",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m13.7146 4c-2.2564 0-4.4203.89634-6.01579 2.49183l-7.69881 7.69877v3.524c0 2.4897 1.06944 4.7296 2.77401 6.2854-1.70457 1.5558-2.77401 3.7957-2.77401 6.2854v3.524l7.69881 7.6988c1.59549 1.5955 3.75939 2.4918 6.01579 2.4918 2.4897 0 4.7296-1.0694 6.2854-2.774 1.5558 1.7046 3.7957 2.774 6.2854 2.774 2.2564 0 4.4203-.8963 6.0158-2.4918l7.6988-7.6988v-3.524c0-2.4897-1.0694-4.7296-2.774-6.2854 1.7046-1.5558 2.774-3.7957 2.774-6.2854v-3.524l-7.6988-7.69877c-1.5955-1.59549-3.7594-2.49183-6.0158-2.49183-2.4897 0-4.7296 1.06944-6.2854 2.77401-1.5558-1.70457-3.7957-2.77401-6.2854-2.77401zm12.0442 20c-.0959-.0875-.19-.1774-.2822-.2696l-5.4766-5.4766-5.4766 5.4766c-.0922.0922-.1863.1821-.2822.2696.0959.0875.19.1774.2822.2696l5.4766 5.4766 5.4766-5.4766c.0922-.0922.1863-.1821.2822-.2696zm-3.5366 9.8094v1.683c0 2.244 1.8192 4.0632 4.0632 4.0632 1.0776 0 2.1111-.4281 2.8731-1.1901l6.3971-6.3971v-1.683c0-2.244-1.8192-4.0632-4.0632-4.0632-1.0776 0-2.1111.4281-2.8731 1.1901zm-4.4444 0-6.3971-6.3971c-.762-.762-1.79546-1.1901-2.87308-1.1901-2.24403 0-4.06318 1.8192-4.06318 4.0632v1.683l6.39706 6.3971c.762.762 1.7955 1.1901 2.8731 1.1901 2.244 0 4.0632-1.8192 4.0632-4.0632zm0-21.3018v1.683l-6.3971 6.3971c-.762.762-1.79546 1.1901-2.87308 1.1901-2.24403 0-4.06318-1.8192-4.06318-4.0632v-1.683l6.39706-6.39708c.762-.76199 1.7955-1.19007 2.8731-1.19007 2.244 0 4.0632 1.81915 4.0632 4.06315zm10.8415 8.0801-6.3971-6.3971v-1.683c0-2.244 1.8192-4.06315 4.0632-4.06315 1.0776 0 2.1111.42808 2.8731 1.19007l6.3971 6.39708v1.683c0 2.244-1.8192 4.0632-4.0632 4.0632-1.0776 0-2.1111-.4281-2.8731-1.1901z" fill="#155eef" fill-rule="evenodd"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m13.7146 4c-2.2564 0-4.4203.89634-6.01579 2.49183l-7.69881 7.69877v3.524c0 2.4897 1.06944 4.7296 2.77401 6.2854-1.70457 1.5558-2.77401 3.7957-2.77401 6.2854v3.524l7.69881 7.6988c1.59549 1.5955 3.75939 2.4918 6.01579 2.4918 2.4897 0 4.7296-1.0694 6.2854-2.774 1.5558 1.7046 3.7957 2.774 6.2854 2.774 2.2564 0 4.4203-.8963 6.0158-2.4918l7.6988-7.6988v-3.524c0-2.4897-1.0694-4.7296-2.774-6.2854 1.7046-1.5558 2.774-3.7957 2.774-6.2854v-3.524l-7.6988-7.69877c-1.5955-1.59549-3.7594-2.49183-6.0158-2.49183-2.4897 0-4.7296 1.06944-6.2854 2.77401-1.5558-1.70457-3.7957-2.77401-6.2854-2.77401zm12.0442 20c-.0959-.0875-.19-.1774-.2822-.2696l-5.4766-5.4766-5.4766 5.4766c-.0922.0922-.1863.1821-.2822.2696.0959.0875.19.1774.2822.2696l5.4766 5.4766 5.4766-5.4766c.0922-.0922.1863-.1821.2822-.2696zm-3.5366 9.8094v1.683c0 2.244 1.8192 4.0632 4.0632 4.0632 1.0776 0 2.1111-.4281 2.8731-1.1901l6.3971-6.3971v-1.683c0-2.244-1.8192-4.0632-4.0632-4.0632-1.0776 0-2.1111.4281-2.8731 1.1901zm-4.4444 0-6.3971-6.3971c-.762-.762-1.79546-1.1901-2.87308-1.1901-2.24403 0-4.06318 1.8192-4.06318 4.0632v1.683l6.39706 6.3971c.762.762 1.7955 1.1901 2.8731 1.1901 2.244 0 4.0632-1.8192 4.0632-4.0632zm0-21.3018v1.683l-6.3971 6.3971c-.762.762-1.79546 1.1901-2.87308 1.1901-2.24403 0-4.06318-1.8192-4.06318-4.0632v-1.683l6.39706-6.39708c.762-.76199 1.7955-1.19007 2.8731-1.19007 2.244 0 4.0632 1.81915 4.0632 4.06315zm10.8415 8.0801-6.3971-6.3971v-1.683c0-2.244 1.8192-4.06315 4.0632-4.06315 1.0776 0 2.1111.42808 2.8731 1.19007l6.3971 6.39708v1.683c0 2.244-1.8192 4.0632-4.0632 4.0632-1.0776 0-2.1111-.4281-2.8731-1.1901z" fill="#fff" fill-rule="evenodd"/></svg>`
  },
  {
    id: "focal-point",
    name: "FocalPoint",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m10.7788 6.1817 4.6901 17.5036v-19.24382c.3719-.08679.7478-.16322 1.1273-.22897v19.47459l5.2752-19.6871c.3801.03442.7572.07945 1.1309.13479l-5.3176 19.84571 10.5701-18.30794c.3443.15492.6835.31927 1.0172.49274l-10.6095 18.3763 15.1464-15.1465c.2731.25824.5389.52407.7971.7972l-15.1486 15.1487 18.3784-10.6108c.1734.3337.3377.6729.4926 1.0173l-18.3034 10.5675 19.8403-5.3162c.0553.3737.1003.7508.1347 1.1309l-19.6869 5.2751h19.4741c-.0658.3796-.1422.7554-.229 1.1273h-19.2481l17.507 4.691c-.1798.3443-.3693.6827-.5681 1.0149l-17.2257-4.6156 14.3874 8.3066c-.2723.2801-.5528.5522-.8411.8161l-14.1087-8.1457 10.6759 10.6758c-.3377.1973-.6817.385-1.0316.5628l-10.4426-10.4426 6.8421 11.8508c-.3746.1059-.7537.2012-1.1368.2855l-6.6825-11.5744 3.2219 12.0243c-.2872.0122-.5759.0184-.8661.0184-.0991 0-.198-.0007-.2967-.0022l-3.1483-11.7497v11.4569c-.3795-.0657-.7554-.1421-1.1273-.2289v-11.2261l-2.7759 10.36c-.3541-.1396-.7033-.289-1.0471-.4478l2.7337-10.2024-5.13175 8.8884c-.3177-.2034-.62928-.4156-.9344-.6361l5.09135-8.8186-7.1301 7.1302c-.2731-.2583-.53893-.5241-.79717-.7971l7.12787-7.1279-8.81599 5.0899c-.22059-.3051-.4328-.6167-.6363-.9344l8.89259-5.1341-10.20737 2.735c-.15888-.3438-.3083-.693-.44793-1.047l10.3599-2.776h-11.226124c-.086806-.3719-.163256-.7477-.22903-1.1273h11.452154l-11.74511583-3.1471c-.00145443-.0995-.00218417-.1991-.00218417-.2989 0-.2894.00613487-.5774.0182816-.8639l12.0258184 3.2224-11.57621-6.6836c.084291-.3832.179549-.7623.285427-1.1369l11.855683 6.8449-10.44698-10.447c.17774-.3499.36544-.6939.56273-1.0315l10.68025 10.6802-8.14896-14.1144c.26387-.2882.53605-.56863.81617-.84096l8.30809 14.38996-4.61634-17.22828c.33214-.1988.67064-.38826 1.01484-.56802z" fill="#155eef"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m10.7788 6.1817 4.6901 17.5036v-19.24382c.3719-.08679.7478-.16322 1.1273-.22897v19.47459l5.2752-19.6871c.3801.03442.7572.07945 1.1309.13479l-5.3176 19.84571 10.5701-18.30794c.3443.15492.6835.31927 1.0172.49274l-10.6095 18.3763 15.1464-15.1465c.2731.25824.5389.52407.7971.7972l-15.1486 15.1487 18.3784-10.6108c.1734.3337.3377.6729.4926 1.0173l-18.3034 10.5675 19.8403-5.3162c.0553.3737.1003.7508.1347 1.1309l-19.6869 5.2751h19.4741c-.0658.3796-.1422.7554-.229 1.1273h-19.2481l17.507 4.691c-.1798.3443-.3693.6827-.5681 1.0149l-17.2257-4.6156 14.3874 8.3066c-.2723.2801-.5528.5522-.8411.8161l-14.1087-8.1457 10.6759 10.6758c-.3377.1973-.6817.385-1.0316.5628l-10.4426-10.4426 6.8421 11.8508c-.3746.1059-.7537.2012-1.1368.2855l-6.6825-11.5744 3.2219 12.0243c-.2872.0122-.5759.0184-.8661.0184-.0991 0-.198-.0007-.2967-.0022l-3.1483-11.7497v11.4569c-.3795-.0657-.7554-.1421-1.1273-.2289v-11.2261l-2.7759 10.36c-.3541-.1396-.7033-.289-1.0471-.4478l2.7337-10.2024-5.13174 8.8884c-.31771-.2034-.62929-.4156-.93441-.6361l5.09135-8.8186-7.1301 7.1302c-.2731-.2583-.53893-.5241-.79717-.7971l7.12787-7.1279-8.81599 5.0899c-.22059-.3051-.4328-.6167-.6363-.9344l8.89259-5.1341-10.20737 2.735c-.15888-.3438-.3083-.693-.44793-1.047l10.3599-2.776h-11.226124c-.086806-.3719-.163256-.7477-.22903-1.1273h11.452154l-11.74511583-3.1471c-.00145443-.0995-.00218417-.1991-.00218417-.2989 0-.2894.00613486-.5774.0182816-.8639l12.0258184 3.2224-11.57621-6.6836c.084291-.3832.179549-.7623.285427-1.1369l11.855683 6.8449-10.44698-10.447c.17774-.3499.36544-.6939.56273-1.0315l10.68025 10.6802-8.14896-14.1144c.26387-.2882.53605-.56863.81617-.84096l8.30809 14.38996-4.61634-17.22828c.33214-.1988.67064-.38826 1.01484-.56802z" fill="#fff"/></svg>`
  },
  {
    id: "foresight",
    name: "Foresight",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 31 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#444ce7"><path d="m-.00195312 17.8433 30.90545312-17.8433-.8189 12.6994-26.32058 15.1961z"/><path d="m3.76367 27.8951 21.73573-12.5492-.8189 12.6994-17.15086 9.902z" opacity=".5"/><path d="m7.52734 37.9477 12.56596-7.255-.8189 12.6994-7.9811 4.6079z" opacity=".25"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 31 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m-.00195312 17.8433 30.90545312-17.8433-.8189 12.6994-26.32058 15.1961z"/><path d="m3.76367 27.8951 21.73573-12.5492-.8189 12.6994-17.15086 9.902z" opacity=".5"/><path d="m7.52734 37.9477 12.56596-7.255-.8189 12.6994-7.9811 4.6079z" opacity=".25"/></g></svg>`
  },
  {
    id: "galileo",
    name: "Galileo",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m29.5411 6.41772c2.6913 5.27688 4.209 11.25228 4.209 17.58218s-1.5177 12.3054-4.2091 17.5823c6.2304-3.3881 10.4593-9.9914 10.4593-17.5823s-4.2289-14.19404-10.4592-17.58218z" fill="#6172f3"/><path d="m20.5481 5.99826c-.9047-1.28153-2.4457-1.9717-3.9913-1.70349-9.40496 1.63214-16.5568 9.83343-16.5568 19.70503 0 9.8717 7.1518 18.0729 16.5567 19.7051 1.5456.2682 3.0867-.4219 3.9913-1.7035 3.5923-5.0889 5.7025-11.2988 5.7025-18.0016 0-6.7027-2.1101-12.9126-5.7024-18.00154z" fill="#444ce7"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m29.5411 6.41772c2.6913 5.27688 4.209 11.25228 4.209 17.58218s-1.5177 12.3054-4.2091 17.5823c6.2304-3.3881 10.4593-9.9914 10.4593-17.5823s-4.2289-14.19404-10.4592-17.58218z" opacity=".7"/><path d="m20.5481 5.99826c-.9047-1.28153-2.4457-1.9717-3.9913-1.70349-9.40496 1.63214-16.5568 9.83343-16.5568 19.70503 0 9.8717 7.1518 18.0729 16.5567 19.7051 1.5456.2682 3.0867-.4219 3.9913-1.7035 3.5923-5.0889 5.7025-11.2988 5.7025-18.0016 0-6.7027-2.1101-12.9126-5.7024-18.00154z"/></g></svg>`
  },
  {
    id: "global-bank",
    name: "GlobalBank",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m27.6627 4h-15.3253l-12.3374 12.3373v15.3253l12.3374 12.3374h15.3253l12.3373-12.3374v-15.3253zm-13.2049 27.8554-7.90357-7.9036 7.90357-7.9036c2.988-2.988 7.9037-2.988 10.8916 0l7.9036 7.9036-7.9036 7.9036c-2.9879 2.988-7.8072 2.988-10.8916 0z" fill="#444ce7"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m27.6627 4h-15.3253l-12.3374 12.3373v15.3253l12.3374 12.3374h15.3253l12.3373-12.3374v-15.3253zm-13.2049 27.8554-7.90357-7.9036 7.90357-7.9036c2.988-2.988 7.9037-2.988 10.8916 0l7.9036 7.9036-7.9036 7.9036c-2.9879 2.988-7.8072 2.988-10.8916 0z" fill="#fff"/></svg>`
  },
  {
    id: "hexsmith",
    name: "Hexsmith",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#155eef"><path d="m9.72461 41.7983h18.49589c1.2717 0 2.4469-.6785 3.0827-1.7798l4.1102-7.1191h-20.5481z" opacity=".7"/><path d="m25.1445 15.1015h-20.55661l4.11021-7.11909c.63585-1.10133 1.811-1.77977 3.0827-1.77977h18.4959z" opacity=".4"/><path d="m39.5272 25.7801c.6358-1.1014.6358-2.4582 0-3.5596l-4.1102-7.1191-5.1378 8.8989h-20.55068l5.13718 8.8989h20.5481l.0016-.0027.0016.0027z" opacity=".4"/><path d="m14.8634 32.8992-5.13775-8.8988-5.13776 8.8988 5.13776 8.8989z"/><path d="m25.1445 15.1014h-20.55593l-4.108166 7.1192c-.635516 1.1013-.635318 2.458.000521 3.5591l4.111125 7.1195 5.13775-8.8989h20.55l.0013-.0021z" opacity=".7"/><path d="m35.4181 15.1015-5.1378-8.89886-5.1377 8.89886 5.1377 8.8989z"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m9.72461 41.7983h18.49589c1.2717 0 2.4469-.6785 3.0827-1.7798l4.1102-7.1191h-20.5481z" opacity=".7"/><path d="m25.1445 15.1015h-20.55661l4.11021-7.11909c.63585-1.10133 1.811-1.77977 3.0827-1.77977h18.4959z" opacity=".4"/><path d="m39.5272 25.7801c.6358-1.1013.6358-2.4582 0-3.5596l-4.1102-7.1191-5.1378 8.8989h-20.55068l5.13718 8.8989h20.5481l.0016-.0027.0016.0027z" opacity=".4"/><path d="m14.8634 32.8992-5.13775-8.8988-5.13776 8.8988 5.13776 8.8989z"/><path d="m25.1445 15.1014h-20.55593l-4.108166 7.1192c-.635516 1.1013-.635318 2.458.000521 3.5591l4.111125 7.1195 5.13775-8.8989h20.55l.0013-.0022z" opacity=".7"/><path d="m35.4181 15.1015-5.1378-8.89886-5.1377 8.89886 5.1377 8.8989z"/></g></svg>`
  },
  {
    id: "hourglass",
    name: "Hourglass",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 30 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m0 41.2222c0 1.5341 1.24365 2.7778 2.77778 2.7778h24.44442c1.5341 0 2.7778-1.2437 2.7778-2.7778v-7.2222c0-8.2843-6.7157-15-15-15-8.28427 0-15 6.7157-15 15z" fill="#1570ef"/><path d="m0 6.77778c0-1.53413 1.24365-2.77778 2.77778-2.77778h24.44442c1.5341 0 2.7778 1.24365 2.7778 2.77778v7.22222c0 8.2843-6.7157 15-15 15-8.28427 0-15-6.7157-15-15z" fill="#53b1fd" opacity=".5"/></svg>`,
    darkSvg: `<svg width="100%" height="100%" viewBox="0 0 30 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity="0.7" d="M0 41.2222C0 42.7563 1.24365 44 2.77778 44H27.2222C28.7563 44 30 42.7563 30 41.2222V34C30 25.7157 23.2843 19 15 19C6.71573 19 0 25.7157 0 34V41.2222Z" fill="white"/><path opacity="0.7" d="M0 6.77778C0 5.24365 1.24365 4 2.77778 4H27.2222C28.7563 4 30 5.24365 30 6.77778V14C30 22.2843 23.2843 29 15 29C6.71573 29 0 22.2843 0 14V6.77778Z" fill="white"/></svg>`
  },
  {
    id: "kintsugi",
    name: "Kintsugi",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m20 4 4.2861 9.6525 9.856-3.79464-3.7946 9.85604 9.6525 4.2861-9.6525 4.2861 3.7946 9.856-9.856-3.7946-4.2861 9.6525-4.2861-9.6525-9.85604 3.7946 3.79469-9.856-9.65255-4.2861 9.65255-4.2861-3.79469-9.85604 9.85604 3.79464z" fill="#155eef"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m20 4 4.2861 9.6525 9.856-3.79464-3.7946 9.85604 9.6525 4.2861-9.6525 4.2861 3.7946 9.856-9.856-3.7946-4.2861 9.6525-4.2861-9.6525-9.85604 3.7946 3.79469-9.856-9.65255-4.2861 9.65255-4.2861-3.79469-9.85604 9.85604 3.79464z" fill="#155eef"/></svg>`
  },
  {
    id: "layers",
    name: "Layers",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#155eef"><path d="m5.03741 15.4637c.7506-2.8008 3.62961-5.67985 6.43049-6.43044l17.4617-4.67957c2.8009-.7506 4.4629.91146 3.7123 3.71231l-4.6795 17.4617c-.7506 2.8009-3.6297 5.6799-6.4305 6.4305l-17.46175 4.6796c-2.80085.7505-4.462904-.9115-3.712306-3.7124z" opacity=".7"/><path d="m12.0355 22.4642c.7506-2.8008 3.6296-5.6799 6.4304-6.4305l17.4617-4.6795c2.8009-.7506 4.4629.9114 3.7123 3.7123l-4.6795 17.4617c-.7506 2.8009-3.6296 5.6799-6.4305 6.4305l-17.4617 4.6795c-2.80085.7506-4.46291-.9114-3.71231-3.7123z" opacity=".7"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m5.03741 15.4637c.7506-2.8008 3.62961-5.67985 6.43049-6.43044l17.4617-4.67957c2.8009-.7506 4.4629.91146 3.7123 3.71231l-4.6795 17.4617c-.7506 2.8009-3.6297 5.6799-6.4305 6.4305l-17.46175 4.6795c-2.80085.7506-4.462904-.9114-3.712306-3.7123z" opacity=".7"/><path d="m12.0355 22.4642c.7506-2.8008 3.6296-5.6799 6.4304-6.4305l17.4617-4.6795c2.8009-.7506 4.4629.9114 3.7123 3.7123l-4.6795 17.4617c-.7506 2.8009-3.6296 5.6799-6.4305 6.4305l-17.4617 4.6795c-2.80085.7506-4.46291-.9114-3.71231-3.7123z" opacity=".7"/></g></svg>`
  },
  {
    id: "lightspeed",
    name: "Lightspeed",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 48 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m0 24c0 6.6274 5.37258 12 12 12v-12c0 6.6274 5.3726 12 12 12v-12c0 6.6274 5.3726 12 12 12s12-5.3726 12-12-5.3726-12-12-12-12 5.3726-12 12v-12c-6.6274 0-12 5.3726-12 12v-12c-6.62742 0-12 5.3726-12 12z" fill="#155eef"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 48 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m0 24c0 6.6274 5.37258 12 12 12v-12c0 6.6274 5.3726 12 12 12v-12c0 6.6274 5.3726 12 12 12s12-5.3726 12-12-5.3726-12-12-12-12 5.3726-12 12v-12c-6.6274 0-12 5.3726-12 12v-12c-6.62742 0-12 5.3726-12 12z" fill="#155eef"/></svg>`
  },
  {
    id: "luminescence",
    name: "Luminescence",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#155eef"><path d="m32.3008 36h-.1015c-.0261.0402-.0523.0804-.0787.1204-2.7604 1.8201-6.0668 2.8794-9.6206 2.8794-9.665 0-17.5-7.835-17.5-17.5 0-3.5538 1.05931-6.8602 2.87939-9.6206.04009-.0264.08029-.0527.12061-.0788v-.1017c-.04056.0599-.08077.1201-.12061.1805-4.7469 3.1299-7.87939 8.5094-7.87939 14.6206 0 9.665 7.83502 17.5 17.5 17.5 6.1112 0 11.4907-3.1325 14.6206-7.8794.0603-.0398.1204-.0799.1802-.1204z"/><g opacity=".5"><path d="m40.0003 21.5c0 6.1112-3.1325 11.4907-7.8794 14.6206 1.8201-2.7604 2.8794-6.0668 2.8794-9.6206 0-9.665-7.835-17.5-17.5-17.5-3.5538 0-6.8602 1.0593-9.6206 2.8794 3.1299-4.74691 8.5094-7.8794 14.6206-7.8794 9.665 0 17.5 7.835 17.5 17.5z"/><path d="m32.0003 36.1994c.0403-.0261.0805-.0524.1206-.0788-.0398.0604-.08.1206-.1206.1805z"/><path d="m7.80088 12c.02611-.0403.05238-.0805.07882-.1206-.06043.0398-.12059.08-.18048.1206z"/></g></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m32.3008 36h-.1015c-.0261.0402-.0523.0804-.0787.1204-2.7604 1.8201-6.0668 2.8794-9.6206 2.8794-9.665 0-17.5-7.835-17.5-17.5 0-3.5538 1.05931-6.8602 2.87939-9.6206.04009-.0264.08029-.0527.12061-.0788v-.1017c-.04056.0599-.08077.1201-.12061.1805-4.7469 3.1299-7.87939 8.5094-7.87939 14.6206 0 9.665 7.83502 17.5 17.5 17.5 6.1112 0 11.4907-3.1325 14.6206-7.8794.0603-.0398.1204-.0799.1802-.1204z"/><g opacity=".5"><path d="m40.0003 21.5c0 6.1112-3.1325 11.4907-7.8794 14.6206 1.8201-2.7604 2.8794-6.0668 2.8794-9.6206 0-9.665-7.835-17.5-17.5-17.5-3.5538 0-6.8602 1.0593-9.6206 2.8794 3.1299-4.74691 8.5094-7.8794 14.6206-7.8794 9.665 0 17.5 7.835 17.5 17.5z"/><path d="m32.0003 36.1994c.0403-.0261.0805-.0524.1206-.0788-.0398.0604-.08.1206-.1206.1805z"/><path d="m7.80088 12c.02611-.0403.05238-.0805.07882-.1206-.06043.0398-.12059.08-.18048.1206z"/></g></g></svg>`
  },
  {
    id: "luminous",
    name: "Luminous",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 42 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#155eef"><path d="m14.1061 19.6565c5.499-2.6299 9.8025-7.0929 12.2731-12.67168-1.5939-1.67362-3.666-2.86907-5.8975-3.58634l-1.1954-.39848c-.0797.15939-.1594.39849-.1594.55788-1.9127 5.41936-5.8178 9.80262-11.07766 12.27322-3.66599 1.7533-6.37564 4.9412-7.650763 8.7666l-.398477 1.1955c.159391.0797.39848.1593.557871.1593 1.514209.5579 3.028419 1.2752 4.462939 2.1519 1.99238-3.5864 5.18019-6.6148 9.08529-8.4479z"/><path d="m37.2173 19.9753c-2.9487 4.463-7.0132 8.0494-12.034 10.4403-4.0645 1.9127-7.1726 5.499-8.6071 9.8026l-.3985 1.3549c1.5142 1.3548 3.3472 2.3909 5.3396 3.0284l1.1955.3985c.0796-.1594.1593-.3985.1593-.5579 1.9127-5.4193 5.8178-9.8026 11.0777-12.2732 3.666-1.7533 6.4553-4.9412 7.6507-8.7666l.3985-1.1954c-1.6736-.4782-3.2675-1.2752-4.7817-2.2316z" opacity=".6"/><path d="m12.9903 37.4284c1.9924-4.7818 5.6584-8.6869 10.3604-10.9184 4.3035-2.0721 7.8898-5.26 10.3604-9.1651-1.833-1.7533-3.3472-3.7458-4.463-6.1366-2.9487 5.4193-7.571 9.8026-13.2294 12.5123-3.2675 1.5142-5.8974 4.1442-7.49136 7.3321 1.75326 1.6736 3.18786 3.7457 4.30356 6.0569 0 0 .0797.1594.1594.3188z" opacity=".8"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 42 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m14.1061 19.6565c5.499-2.6299 9.8025-7.0929 12.2731-12.67168-1.5939-1.67362-3.666-2.86907-5.8975-3.58634l-1.1954-.39848c-.0797.15939-.1594.39849-.1594.55788-1.9127 5.41936-5.8178 9.80262-11.07766 12.27322-3.66599 1.7533-6.37564 4.9412-7.650763 8.7666l-.398477 1.1955c.159391.0797.39848.1593.557871.1593 1.514209.5579 3.028419 1.2752 4.462939 2.1519 1.99238-3.5864 5.18019-6.6148 9.08529-8.4479z"/><path d="m37.2173 19.9753c-2.9487 4.463-7.0132 8.0494-12.034 10.4403-4.0645 1.9127-7.1726 5.499-8.6071 9.8026l-.3985 1.3549c1.5142 1.3548 3.3472 2.3909 5.3396 3.0284l1.1955.3985c.0796-.1594.1593-.3985.1593-.5579 1.9127-5.4193 5.8178-9.8026 11.0777-12.2732 3.666-1.7533 6.4553-4.9412 7.6507-8.7666l.3985-1.1954c-1.6736-.4782-3.2675-1.2752-4.7817-2.2316z" opacity=".5"/><path d="m12.9903 37.4284c1.9924-4.7818 5.6584-8.6869 10.3604-10.9184 4.3035-2.0721 7.8898-5.26 10.3604-9.1651-1.833-1.7533-3.3472-3.7458-4.463-6.1366-2.9487 5.4193-7.571 9.8026-13.2294 12.5123-3.2675 1.5142-5.8974 4.1442-7.49136 7.3321 1.75326 1.6736 3.18786 3.7457 4.30356 6.0569 0 0 .0797.1594.1594.3188z" opacity=".7"/></g></svg>`
  },
  {
    id: "pollinate",
    name: "Pollinate",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 38 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#155eef"><path d="m25.0008 24c0 3.3137-2.6863 6-6 6s-6-2.6863-6-6 2.6863-6 6-6 6 2.6863 6 6z"/><path d="m25.0008 10c0 3.3137-2.6863 6-6 6s-6-2.6863-6-6c0-3.31371 2.6863-6 6-6s6 2.68629 6 6z"/><path d="m37.125 31c0 3.3137-2.6863 6-6 6s-6-2.6863-6-6 2.6863-6 6-6 6 2.6863 6 6z"/><path d="m37.127 17.0002c0 3.3137-2.6863 6-6 6-3.3138 0-6-2.6863-6-6s2.6862-6 6-6c3.3137 0 6 2.6863 6 6z"/><path d="m25.0008 38c0 3.3137-2.6863 6-6 6s-6-2.6863-6-6 2.6863-6 6-6 6 2.6863 6 6z"/><path d="m12.877 17c0 3.3137-2.6863 6-6.00005 6-3.31371 0-5.999997-2.6863-5.999997-6s2.686287-6 5.999997-6c3.31375 0 6.00005 2.6863 6.00005 6z"/><path d="m12.875 30.9997c0 3.3137-2.6863 6-6 6-3.31371 0-6-2.6863-6-6s2.68629-6 6-6c3.3137 0 6 2.6863 6 6z"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 38 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m25.0008 24c0 3.3137-2.6863 6-6 6s-6-2.6863-6-6 2.6863-6 6-6 6 2.6863 6 6z"/><path d="m25.0008 10c0 3.3137-2.6863 6-6 6s-6-2.6863-6-6c0-3.31371 2.6863-6 6-6s6 2.68629 6 6z"/><path d="m37.125 31c0 3.3137-2.6863 6-6 6s-6-2.6863-6-6 2.6863-6 6-6 6 2.6863 6 6z"/><path d="m37.127 17.0002c0 3.3137-2.6863 6-6 6-3.3138 0-6-2.6863-6-6s2.6862-6 6-6c3.3137 0 6 2.6863 6 6z"/><path d="m25.0008 38c0 3.3137-2.6863 6-6 6s-6-2.6863-6-6 2.6863-6 6-6 6 2.6863 6 6z"/><path d="m12.877 17c0 3.3137-2.6863 6-6.00005 6-3.31371 0-5.999997-2.6863-5.999997-6s2.686287-6 5.999997-6c3.31375 0 6.00005 2.6863 6.00005 6z"/><path d="m12.875 30.9997c0 3.3137-2.6863 6-6 6-3.31371 0-6-2.6863-6-6s2.68629-6 6-6c3.3137 0 6 2.6863 6 6z"/></g></svg>`
  },
  {
    id: "polymath",
    name: "Polymath",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 38 48" width="100%" xmlns="http://www.w3.org/2000/svg"><circle cx="19" cy="24" r="16" stroke="#155eef" stroke-width="6"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 38 48" width="100%" xmlns="http://www.w3.org/2000/svg"><circle cx="19" cy="24" r="16" stroke="#fff" stroke-width="6"/></svg>`
  },
  {
    id: "prometheus",
    name: "Prometheus",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 44 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#155eef"><path d="m10.4993 16.5h-7.29875c-1.76731 0-3.20055 1.4327-3.20055 3.2v2.8h11c2.7614 0 5-2.2386 5-5s2.2386-5 5-5h19c2.2091 0 4-1.7909 4-4v-3h-22.5c-3.0376 0-5.5 2.46243-5.5 5.5 0 3.0376-2.4631 5.5-5.5007 5.5z"/><path d="m10.4993 26.5h-7.29875c-1.76731 0-3.20055 1.4327-3.20055 3.2v2.8h11c2.7614 0 5-2.2386 5-5s2.2386-5 5-5h13c2.2091 0 4-1.7909 4-4v-3h-16.5c-3.0376 0-5.5 2.4624-5.5 5.5s-2.4631 5.5-5.5007 5.5z" opacity=".7"/><path d="m10.4993 36.5h-7.29875c-1.76731 0-3.20055 1.4327-3.20055 3.2v2.8h11c2.7614 0 5-2.2386 5-5s2.2386-5 5-5h7.8c1.7673 0 3.2-1.4327 3.2-3.2v-3.8h-10.5c-3.0376 0-5.5 2.4624-5.5 5.5s-2.4631 5.5-5.5007 5.5z" opacity=".5"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 44 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m10.4993 16.5h-7.29875c-1.76731 0-3.20055 1.4327-3.20055 3.2v2.8h11c2.7614 0 5-2.2386 5-5s2.2386-5 5-5h19c2.2091 0 4-1.7909 4-4v-3h-22.5c-3.0376 0-5.5 2.46243-5.5 5.5 0 3.0376-2.4631 5.5-5.5007 5.5z"/><path d="m10.4993 26.5h-7.29875c-1.76731 0-3.20055 1.4327-3.20055 3.2v2.8h11c2.7614 0 5-2.2386 5-5s2.2386-5 5-5h13c2.2091 0 4-1.7909 4-4v-3h-16.5c-3.0376 0-5.5 2.4624-5.5 5.5s-2.4631 5.5-5.5007 5.5z" opacity=".75"/><path d="m10.4993 36.5h-7.29875c-1.76731 0-3.20055 1.4327-3.20055 3.2v2.8h11c2.7614 0 5-2.2386 5-5s2.2386-5 5-5h7.8c1.7673 0 3.2-1.4327 3.2-3.2v-3.8h-10.5c-3.0376 0-5.5 2.4624-5.5 5.5s-2.4631 5.5-5.5007 5.5z" opacity=".5"/></g></svg>`
  },
  {
    id: "quantum",
    name: "Quantum",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 39 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#155eef"><path d="m9 23c0-5.5228 4.4772-10 10-10 5.5229 0 10 4.4772 10 10h9c0-10.4934-8.5066-19-19-19-10.49341 0-18.99999908 8.5066-19 19s8.50659 19 19 19v-9c-5.5228 0-10-4.4771-10-10z"/><path d="m29 23c0 5.5228 4.4772 10 10 10v9c-10.4934 0-19-8.5066-19-19z" opacity=".5"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 39 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m9 23c0-5.5228 4.4772-10 10-10 5.5229 0 10 4.4772 10 10h9c0-10.4934-8.5066-19-19-19-10.49341 0-18.99999908 8.5066-19 19s8.50659 19 19 19v-9c-5.5228 0-10-4.4771-10-10z"/><path d="m29 23c0 5.5228 4.4772 10 10 10v9c-10.4934 0-19-8.5066-19-19z" opacity=".5"/></g></svg>`
  },
  {
    id: "quartz-ai",
    name: "QuartzAI",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 44 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m17.6264 6.5h14.8017l11.4661 18.6661-15.7786 15.9489-22.68835-4.0459-5.157719-19.2098zm.5273 4.9692-6.816 15.105 6.4504 5.3411 8.8246-3.7975zm12.3276 15.3 9.2139-2.7073-7.1983-11.7184zm-.6163-17.2692h-9.3468l7.3309 14.4284zm6.9795 18.5263-6.779 1.9919-.5448 5.4109zm-10.5005 9.008.5824-5.7856-6.0573 2.6067zm-6.8394-.5022-10.91261-1.9459 1.64741-5.0264 6.438 5.3308zm-11.69782-9.1824-2.7037-3.0571 1.66868 6.215zm-3.53432-8.5248 4.81433 5.4437 5.50351-12.1963z" fill="#155eef" fill-rule="evenodd"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 44 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m17.6264 6.5h14.8017l11.4661 18.6661-15.7786 15.9489-22.68835-4.0459-5.157719-19.2098zm.5273 4.9692-6.816 15.105 6.4504 5.3411 8.8246-3.7975zm12.3276 15.3 9.2139-2.7073-7.1983-11.7184zm-.6163-17.2692h-9.3468l7.3309 14.4284zm6.9795 18.5263-6.779 1.9919-.5448 5.4109zm-10.5005 9.008.5824-5.7856-6.0573 2.6067zm-6.8394-.5022-10.91261-1.9459 1.64741-5.0264 6.438 5.3308zm-11.69782-9.1824-2.7037-3.0571 1.66868 6.215zm-3.53432-8.5248 4.81433 5.4437 5.50351-12.1963z" fill="#fff" fill-rule="evenodd"/></svg>`
  },
  {
    id: "radius",
    name: "Radius",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g clip-rule="evenodd" fill="#155eef" fill-rule="evenodd"><path d="m18.5 19v-15h3v15z"/><path d="m18.5 44v-15h3v15z"/><path d="m22.4754 19.404 10.6066-10.60664 2.1214 2.12134-8.4853 8.4853z"/><path d="m4.79776 37.0816 10.60664-10.6066 2.1213 2.1214-10.60662 10.6066z"/><path d="m26.7178 28.5963 8.4853 8.4852-2.1213 2.1214-10.6066-10.6066z"/><path d="m6.91885 8.79727 10.60665 10.60663-2.1214 2.1213-10.60657-10.6066z"/><path d="m18.5 22.5h21.5v3h-21.5z"/><path d="m.00000026 22.5h14.99999974v3h-15z"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g clip-rule="evenodd" fill="#155eef" fill-rule="evenodd"><path d="m18.5 19v-15h3v15z"/><path d="m18.5 44v-15h3v15z"/><path d="m22.4754 19.404 10.6066-10.60664 2.1214 2.12134-8.4853 8.4853z"/><path d="m4.79776 37.0816 10.60664-10.6066 2.1213 2.1214-10.60662 10.6066z"/><path d="m26.7178 28.5963 8.4853 8.4852-2.1213 2.1214-10.6066-10.6066z"/><path d="m6.91885 8.79727 10.60665 10.60663-2.1214 2.1213-10.60657-10.6066z"/><path d="m18.5 22.5h21.5v3h-21.5z"/><path d="m.00000026 22.5h14.99999974v3h-15z"/></g></svg>`
  },
  {
    id: "railspeed",
    name: "Railspeed",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 36 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#155eef"><path d="m0 7.5h28.8c2.5202 0 3.7804 0 4.743.49047.8467.43143 1.5351 1.11984 1.9665 1.96657.4905.96256.4905 2.22276.4905 4.74296v1.8h-28.8c-2.52024 0-3.78035 0-4.74296-.4905-.84673-.4314-1.535139-1.1198-1.966569-1.9665-.490471-.9626-.490471-2.2228-.490471-4.743z"/><path d="m0 28.5h28.8c2.5202 0 3.7804 0 4.743-.4905.8467-.4314 1.5351-1.1198 1.9665-1.9665.4905-.9626.4905-2.2228.4905-4.743v-1.8h-28.8c-2.52024 0-3.78035 0-4.74296.4905-.84673.4314-1.535139 1.1198-1.966569 1.9665-.490471.9626-.490471 2.2228-.490471 4.743z"/><path d="m14 31.5h14.8c2.5202 0 3.7804 0 4.743.4905.8467.4314 1.5351 1.1198 1.9665 1.9665.4905.9626.4905 2.2228.4905 4.743v1.8h-14.8c-2.5202 0-3.7804 0-4.743-.4905-.8467-.4314-1.5351-1.1198-1.9665-1.9665-.4905-.9626-.4905-2.2228-.4905-4.743z"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 36 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m0 7.5h28.8c2.5202 0 3.7804 0 4.743.49047.8467.43143 1.5351 1.11984 1.9665 1.96657.4905.96256.4905 2.22276.4905 4.74296v1.8h-28.8c-2.52024 0-3.78035 0-4.74296-.4905-.84673-.4314-1.535139-1.1198-1.966569-1.9665-.490471-.9626-.490471-2.2228-.490471-4.743z"/><path d="m0 28.5h28.8c2.5202 0 3.7804 0 4.743-.4905.8467-.4314 1.5351-1.1198 1.9665-1.9665.4905-.9626.4905-2.2228.4905-4.743v-1.8h-28.8c-2.52024 0-3.78035 0-4.74296.4905-.84673.4314-1.535139 1.1198-1.966569 1.9665-.490471.9626-.490471 2.2228-.490471 4.743z"/><path d="m14 31.5h14.8c2.5202 0 3.7804 0 4.743.4905.8467.4314 1.5351 1.1198 1.9665 1.9665.4905.9626.4905 2.2228.4905 4.743v1.8h-14.8c-2.5202 0-3.7804 0-4.743-.4905-.8467-.4314-1.5351-1.1198-1.9665-1.9665-.4905-.9626-.4905-2.2228-.4905-4.743z"/></g></svg>`
  },
  {
    id: "refractional",
    name: "Refractional",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 48 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="m48 11h-17.0775c-1.2151 0-2.3644.5524-3.1235 1.5012l-1.598 1.9976c-.7591.9488-1.9084 1.5012-3.1235 1.5012h-15.0775l-4 5h17.0775c1.2151 0 2.3644-.5524 3.1235-1.5012l1.598-1.9976c.7591-.9488 1.9084-1.5012 3.1235-1.5012h15.0775z" fill="#444ce7"/><path d="m46 19h-17.0775c-1.2151 0-2.3644.5524-3.1235 1.5012l-1.598 1.9976c-.7591.9488-1.9084 1.5012-3.1235 1.5012h-15.0775l-4 5h17.0775c1.2151 0 2.3644-.5524 3.1235-1.5012l1.598-1.9976c.7591-.9488 1.9084-1.5012 3.1235-1.5012h15.0775z" fill="#155eef"/><path d="m44 27h-17.0775c-1.2151 0-2.3644.5524-3.1235 1.5012l-1.598 1.9976c-.7591.9488-1.9084 1.5012-3.1235 1.5012h-15.0775l-4 5h17.0775c1.2151 0 2.3644-.5524 3.1235-1.5012l1.598-1.9976c.7591-.9488 1.9084-1.5012 3.1235-1.5012h15.0775z" fill="#8098f9"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 48 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m48 11h-17.0775c-1.2151 0-2.3644.5524-3.1235 1.5012l-1.598 1.9976c-.7591.9488-1.9084 1.5012-3.1235 1.5012h-15.0775l-4 5h17.0775c1.2151 0 2.3644-.5524 3.1235-1.5012l1.598-1.9976c.7591-.9488 1.9084-1.5012 3.1235-1.5012h15.0775z"/><path d="m46 19h-17.0775c-1.2151 0-2.3644.5524-3.1235 1.5012l-1.598 1.9976c-.7591.9488-1.9084 1.5012-3.1235 1.5012h-15.0775l-4 5h17.0775c1.2151 0 2.3644-.5524 3.1235-1.5012l1.598-1.9976c.7591-.9488 1.9084-1.5012 3.1235-1.5012h15.0775z"/><path d="m44 27h-17.0775c-1.2151 0-2.3644.5524-3.1235 1.5012l-1.598 1.9976c-.7591.9488-1.9084 1.5012-3.1235 1.5012h-15.0775l-4 5h17.0775c1.2151 0 2.3644-.5524 3.1235-1.5012l1.598-1.9976c.7591-.9488 1.9084-1.5012 3.1235-1.5012h15.0775z"/></g></svg>`
  },
  {
    id: "renaissance",
    name: "Renaissance",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 35 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m12.7018 5c1.841 0 3.4172 1.31967 3.7408 3.13199l.4648 2.60271c.3236 1.8123 1.8998 3.132 3.7408 3.132h3.1518c4.8969 0 8.8667 3.9697 8.8667 8.8666 0 2.9333-1.4244 5.5339-3.6191 7.1479.92.3126 1.6466.809 2.1799 1.461.549.7191.9411 1.7411 1.1764 3.028.0392.3406.0883.6718.1373 1.003s.098.6624.1372 1.003c.0408.3538.0709.6566.096.9083.0232.233.042.4223.0609.5679.0784 1.0598.1961 1.9303.3529 2.5738.1655.9048.4994 1.7867.9727 2.5738h-6.6982c-.3137-.6056-.5098-1.3248-.6666-2.1196-.1349-.6836-.2408-1.5352-.3676-2.5548-.0207-.1659-.0418-.3362-.0638-.5111l-.2353-1.7411c-.1961-1.3247-.4314-2.271-.6667-2.8766-.2745-.5677-.7058-.9841-1.2941-1.2112-.6274-.2271-1.5686-.3856-2.9019-.3856h-.3018c-1.841 0-3.4172-1.3197-3.7408-3.132l-.4648-2.6027c-.3236-1.8123-1.8998-3.132-3.7408-3.132h-5.68517v10.1334h-6.33333v-27.8667zm13.6315 17.7333c0 1.3992-1.1342 2.5334-2.5333 2.5334h-3.1518c-1.841 0-3.4172-1.3197-3.7408-3.132l-.4648-2.6027c-.3236-1.8123-1.8998-3.132-3.7408-3.132h-5.36847v-5.0667h5.68517c1.841 0 3.4172 1.3197 3.7408 3.132l.4647 2.6027c.3237 1.8123 1.8999 3.132 3.7409 3.132h2.8351c1.3991 0 2.5333 1.1342 2.5333 2.5333z" fill="#1849a9" fill-rule="evenodd"/></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 35 48" width="100%" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="m12.7018 5c1.841 0 3.4172 1.31967 3.7408 3.13199l.4648 2.60271c.3236 1.8123 1.8998 3.132 3.7408 3.132h3.1518c4.8969 0 8.8667 3.9697 8.8667 8.8666 0 2.9333-1.4244 5.5339-3.6191 7.1479.92.3126 1.6466.809 2.1799 1.461.549.7191.9411 1.7411 1.1764 3.028.0392.3406.0883.6718.1373 1.003s.098.6624.1372 1.003c.0408.3538.0709.6566.096.9083.0232.233.042.4223.0609.5679.0784 1.0598.1961 1.9303.3529 2.5738.1655.9048.4994 1.7867.9727 2.5738h-6.6982c-.3137-.6056-.5098-1.3247-.6666-2.1196-.1349-.6836-.2408-1.5352-.3676-2.5548-.0207-.1659-.0418-.3362-.0638-.5111l-.2353-1.7411c-.1961-1.3247-.4314-2.271-.6667-2.8766-.2745-.5677-.7058-.9841-1.2941-1.2112-.6274-.2271-1.5686-.3856-2.9019-.3856h-.3018c-1.841 0-3.4172-1.3197-3.7408-3.132l-.4648-2.6027c-.3236-1.8123-1.8998-3.132-3.7408-3.132h-5.68517v10.1334h-6.33333v-27.8667zm13.6315 17.7333c0 1.3992-1.1342 2.5334-2.5333 2.5334h-3.1518c-1.841 0-3.4172-1.3197-3.7408-3.132l-.4648-2.6027c-.3236-1.8123-1.8998-3.132-3.7408-3.132h-5.36847v-5.0667h5.68517c1.841 0 3.4172 1.3197 3.7408 3.132l.4647 2.6027c.3237 1.8123 1.8999 3.132 3.7409 3.132h2.8351c1.3991 0 2.5333 1.1342 2.5333 2.5333z" fill="#fff" fill-rule="evenodd"/></svg>`
  },
  {
    id: "sisyphus",
    name: "Sisyphus",
    lightSvg: `<svg fill="none" height="100%" viewBox="0 0 32 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#155eef"><path d="m.599609 19.2002h9.59998v9.59999h-9.59998z"/><path d="m31.4004 28.7998h9.6v9.59999h-9.6z" transform="matrix(-1 0 -0 -1 62.8008 57.5996)"/><path d="m10.1992 19.2001 11.6-9.6v9.6l-11.6 9.6z" opacity=".2"/><path d="m21.7988 28.7999-11.6 9.6v-9.6l11.6-9.6z" opacity=".5"/><path d="m.599609 19.2 21.199991-19.2v9.59999l-11.6 9.60001z" opacity=".6"/><path d="m31.4004 28.8-21.2 19.2v-9.6l11.6-9.6z" opacity=".7"/></g></svg>`,
    darkSvg: `<svg fill="none" height="100%" viewBox="0 0 32 48" width="100%" xmlns="http://www.w3.org/2000/svg"><g fill="#155eef"><path d="m.599609 19.2002h9.59998v9.59999h-9.59998z"/><path d="m31.4004 28.7998h9.6v9.59999h-9.6z" transform="matrix(-1 0 -0 -1 62.8008 57.5996)"/><path d="m10.1992 19.2001 11.6-9.6v9.6l-11.6 9.6z" opacity=".2"/><path d="m21.7988 28.7999-11.6 9.6v-9.6l11.6-9.6z" opacity=".5"/><path d="m.599609 19.2 21.199991-19.2v9.59999l-11.6 9.60001z" opacity=".6"/><path d="m31.4004 28.8-21.2 19.2v-9.6l11.6-9.6z" opacity=".7"/></g></svg>`
  },
  {
    id: "solaris-energy",
    name: "Solaris Energy",
    lightSvg: `<svg width="100%" height="100%" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 4V16.3604C20 19.087 16.6569 20.3998 14.8016 18.4017L7 10M40 24H27.6396C24.913 24 23.6002 20.6569 25.5983 18.8016L34 11M20 44V31.6396C20 28.913 23.3431 27.6002 25.1984 29.5983L33 38M0 24L12.3604 24C15.087 24 16.3998 27.3431 14.4017 29.1984L6 37" stroke="#175CD3" stroke-width="4"/></svg>`,
    darkSvg: `<svg width="100%" height="100%" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 4V16.3604C20 19.087 16.6569 20.3998 14.8016 18.4017L7 10M40 24H27.6396C24.913 24 23.6002 20.6569 25.5983 18.8016L34 11M20 44V31.6396C20 28.913 23.3431 27.6002 25.1984 29.5983L33 38M0 24L12.3604 24C15.087 24 16.3998 27.3431 14.4017 29.1984L6 37" stroke="white" stroke-width="4"/></svg>`
  }
];

// features/lib/store-logo.ts
var DEFAULT_STORE_LOGO_ICON = LOGO_ICONS.find((icon) => icon.id === "capsule").lightSvg;
var DEFAULT_STORE_LOGO_COLOR = "295";
function normalizeStoreLogoColor(value) {
  const numeric = Number.parseFloat(String(value ?? DEFAULT_STORE_LOGO_COLOR));
  if (!Number.isFinite(numeric)) return DEFAULT_STORE_LOGO_COLOR;
  return String((numeric % 360 + 360) % 360);
}

// features/keystone/utils/storeLogo.ts
var ALLOWED_ELEMENTS = /* @__PURE__ */ new Set([
  "svg",
  "g",
  "path",
  "defs",
  "lineargradient",
  "radialgradient",
  "stop",
  "clippath",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "title",
  "desc"
]);
var ALLOWED_ATTRIBUTES = /* @__PURE__ */ new Set([
  "xmlns",
  "fill",
  "fill-rule",
  "clip-rule",
  "height",
  "width",
  "viewbox",
  "d",
  "clip-path",
  "id",
  "x1",
  "x2",
  "y1",
  "y2",
  "gradientunits",
  "gradienttransform",
  "offset",
  "stop-color",
  "stop-opacity",
  "opacity",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x",
  "y",
  "transform",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "points",
  "role",
  "aria-hidden",
  "aria-label",
  "preserveaspectratio"
]);
var ATTRIBUTE_PATTERN = /\s+([A-Za-z_:][\w:.-]*)\s*=\s*("[^"]*"|'[^']*')/g;
var TAG_PATTERN = /<\/?\s*([A-Za-z][\w:-]*)([^<>]*)>/g;
function sanitizeStoreLogoSvg(svg) {
  const source = svg.trim();
  if (!source.startsWith("<svg") || !source.endsWith("</svg>") || source.length > 1e5) {
    return "";
  }
  if (/<!|<\?|\b(?:javascript|data|vbscript):|\bon[a-z]+\s*=|\b(?:href|src|style)\s*=/i.test(source)) {
    return "";
  }
  let tagCount = 0;
  let match;
  TAG_PATTERN.lastIndex = 0;
  while (match = TAG_PATTERN.exec(source)) {
    tagCount += 1;
    const element = match[1].toLowerCase();
    if (!ALLOWED_ELEMENTS.has(element)) return "";
    if (match[0].startsWith("</")) continue;
    const attributes = match[2];
    let consumed = "";
    ATTRIBUTE_PATTERN.lastIndex = 0;
    let attributeMatch;
    while (attributeMatch = ATTRIBUTE_PATTERN.exec(attributes)) {
      consumed += attributeMatch[0];
      const attribute = attributeMatch[1].toLowerCase();
      const value = attributeMatch[2].slice(1, -1);
      if (!ALLOWED_ATTRIBUTES.has(attribute)) return "";
      if (attribute === "id" && !/^[A-Za-z_][\w:.-]*$/.test(value)) return "";
      if (/url\(/i.test(value) && !/^url\(#[A-Za-z_][\w:.-]*\)$/.test(value)) return "";
    }
    const remainder = attributes.replace(consumed, "").replace(/\//g, "").trim();
    if (remainder) return "";
  }
  TAG_PATTERN.lastIndex = 0;
  if (tagCount === 0 || source.replace(TAG_PATTERN, "").trim()) return "";
  return source;
}

// features/pharmacy/branding.ts
var HOST_PORT = /:\d+$/;
var SAFE_TENANT_KEY = /^[a-z0-9](?:[a-z0-9.-]{0,98}[a-z0-9])?$/;
var SAFE_HEX_COLOR = /^#[0-9a-f]{6}$/i;
function normalizeStorefrontTenantKey(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(HOST_PORT, "");
  if (!SAFE_TENANT_KEY.test(normalized)) throw new Error("Storefront tenant key is invalid");
  return normalized;
}
function safeBrandColor(value, fallback) {
  return SAFE_HEX_COLOR.test(value || "") ? String(value) : fallback;
}
function operatorBrandFromOrganization(organization) {
  if (!organization?.id || !organization?.storefrontKey || !organization?.operatorDisplayName) {
    throw new Error("Operator branding is not configured");
  }
  return {
    organizationId: organization.id,
    tenantKey: organization.storefrontKey,
    displayName: organization.operatorDisplayName,
    tagline: organization.operatorTagline || "Independent pharmacy care",
    primaryColor: safeBrandColor(organization.brandPrimaryColor, "#18352b"),
    accentColor: safeBrandColor(organization.brandAccentColor, "#8ec9ad"),
    logoUrl: organization.brandLogoUrl || null,
    logoIcon: sanitizeStoreLogoSvg(organization.logoIcon || DEFAULT_STORE_LOGO_ICON),
    logoColor: normalizeStoreLogoColor(organization.logoColor),
    heroUrl: organization.storefrontHeroUrl || null,
    supportEmail: organization.supportEmail || null,
    supportPhone: organization.supportPhone || null,
    privacyNotice: organization.privacyNotice || null
  };
}

// features/keystone/models/Organization.ts
var Organization = (0, import_core19.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: import_access30.denyAll,
      update: permissions.canManageOrganizations,
      delete: import_access30.denyAll
    },
    filter: { query: rules.canReadOrganizations, update: rules.canReadOrganizations, delete: rules.canReadOrganizations }
  },
  graphql: { omit: { create: true, delete: true } },
  hooks: {
    resolveInput: ({ resolvedData }) => ({
      ...resolvedData,
      ...resolvedData.storefrontKey !== void 0 ? { storefrontKey: normalizeStorefrontTenantKey(resolvedData.storefrontKey) } : {},
      ...resolvedData.storefrontHost !== void 0 ? { storefrontHost: normalizeStorefrontTenantKey(resolvedData.storefrontHost) } : {},
      ...resolvedData.operatorDisplayName !== void 0 ? { operatorDisplayName: String(resolvedData.operatorDisplayName || "").trim() } : {},
      ...resolvedData.operatorTagline !== void 0 ? { operatorTagline: String(resolvedData.operatorTagline || "").trim() } : {}
    }),
    validateInput: ({ resolvedData, addValidationError }) => {
      if (resolvedData.operatorDisplayName !== void 0 && !String(resolvedData.operatorDisplayName || "").trim()) addValidationError("Operator display name is required");
      if (resolvedData.brandPrimaryColor !== void 0 && safeBrandColor(resolvedData.brandPrimaryColor, "") !== resolvedData.brandPrimaryColor) addValidationError("Primary brand color must be a six-digit hex color");
      if (resolvedData.brandAccentColor !== void 0 && safeBrandColor(resolvedData.brandAccentColor, "") !== resolvedData.brandAccentColor) addValidationError("Accent brand color must be a six-digit hex color");
    }
  },
  ui: { hideCreate: true, hideDelete: true, listView: { initialColumns: ["name", "slug", "status"] } },
  fields: {
    name: (0, import_fields20.text)({ validation: { isRequired: true } }),
    slug: (0, import_fields20.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    storefrontKey: (0, import_fields20.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    storefrontHost: (0, import_fields20.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    operatorDisplayName: (0, import_fields20.text)({ validation: { isRequired: true } }),
    operatorTagline: (0, import_fields20.text)({ defaultValue: "Independent pharmacy care" }),
    brandPrimaryColor: (0, import_fields20.text)({ defaultValue: "#18352b" }),
    brandAccentColor: (0, import_fields20.text)({ defaultValue: "#8ec9ad" }),
    brandLogoUrl: (0, import_fields20.text)(),
    storefrontHero: (0, import_fields20.image)({ storage: "my_images", label: "Storefront hero photo" }),
    storefrontHeroUrl: (0, import_fields20.virtual)({ field: import_core19.graphql.field({ type: import_core19.graphql.String, resolve: (item, _args, context) => item.storefrontHero_id && item.storefrontHero_extension ? context.images("my_images").getUrl(item.storefrontHero_id, item.storefrontHero_extension) : null }) }),
    logoIcon: (0, import_fields20.text)({ defaultValue: DEFAULT_STORE_LOGO_ICON, hooks: {
      resolveInput: ({ resolvedData, fieldKey }) => resolvedData[fieldKey] === void 0 ? void 0 : sanitizeStoreLogoSvg(String(resolvedData[fieldKey] || "")),
      validateInput: ({ inputData, resolvedData, fieldKey, addValidationError }) => {
        if (typeof inputData[fieldKey] === "string" && inputData[fieldKey].trim() && !resolvedData[fieldKey]) addValidationError("Logo must be a valid, safe SVG document");
      }
    } }),
    logoColor: (0, import_fields20.text)({ defaultValue: DEFAULT_STORE_LOGO_COLOR, hooks: {
      resolveInput: ({ resolvedData, fieldKey }) => resolvedData[fieldKey] === void 0 ? void 0 : normalizeStoreLogoColor(resolvedData[fieldKey])
    } }),
    // Retained column; no longer read or written.
    isDemo: (0, import_fields20.checkbox)({ defaultValue: false, access: { create: import_access30.denyAll, update: import_access30.denyAll }, ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "hidden" }, listView: { fieldMode: "hidden" } } }),
    supportEmail: (0, import_fields20.text)(),
    supportPhone: (0, import_fields20.text)(),
    privacyNotice: (0, import_fields20.text)({ ui: { displayMode: "textarea", description: "Notice of Privacy Practices shown at /privacy and linked from checkout." } }),
    prescriptionFillPolicy: (0, import_fields20.json)({ access: { create: import_access30.denyAll, update: import_access30.denyAll }, ui: { description: "Versioned operator-reviewed policy; only the controlled fill policy command may change it. Existing fills keep their snapshot." } }),
    willCallReturnDays: (0, import_fields20.integer)({ defaultValue: 10, validation: { isRequired: true, min: 1, max: 60 }, ui: { description: "Days a filled prescription waits in will-call before staff should review it for return to stock. Staff still confirm each return." } }),
    cashSalesEnabled: (0, import_fields20.checkbox)({ defaultValue: false, access: { create: import_access30.denyAll, update: import_access30.denyAll }, ui: { description: "Enabled only by the operator-attested cash/tax policy workflow." } }),
    cashTaxRateBps: (0, import_fields20.integer)({ defaultValue: 0, validation: { min: 0, max: 1e4 }, access: { create: import_access30.denyAll, update: import_access30.denyAll } }),
    cashTaxPolicyReference: (0, import_fields20.text)({ access: { create: import_access30.denyAll, update: import_access30.denyAll } }),
    cashPolicyReviewedAt: (0, import_fields20.timestamp)({ access: { create: import_access30.denyAll, update: import_access30.denyAll } }),
    cashPolicyReviewedBy: (0, import_fields20.relationship)({ ref: "User", access: { create: import_access30.denyAll, update: import_access30.denyAll } }),
    status: (0, import_fields20.select)({
      type: "string",
      options: [
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
        { label: "Archived", value: "archived" }
      ],
      defaultValue: "active"
    }),
    locations: (0, import_fields20.relationship)({ ref: "PharmacyLocation.organization", many: true, access: immutableRelationship }),
    memberships: (0, import_fields20.relationship)({ ref: "OrganizationMembership.organization", many: true, access: immutableRelationship }),
    patients: (0, import_fields20.relationship)({ ref: "PatientProfile.organizations", many: true, access: immutableRelationship }),
    products: (0, import_fields20.relationship)({ ref: "Product.organization", many: true, access: immutableRelationship }),
    drugReferenceReviews: (0, import_fields20.relationship)({ ref: "DrugReferenceReview.organization", many: true, access: immutableRelationship }),
    prescriptions: (0, import_fields20.relationship)({ ref: "Prescription.organization", many: true, access: immutableRelationship }),
    recalls: (0, import_fields20.relationship)({ ref: "Recall.organization", many: true, access: immutableRelationship }),
    orders: (0, import_fields20.relationship)({ ref: "Order.organization", many: true, access: immutableRelationship }),
    integrationProviders: (0, import_fields20.relationship)({ ref: "IntegrationProvider.organization", many: true, access: immutableRelationship }),
    paymentWebhookEvents: (0, import_fields20.relationship)({ ref: "PaymentWebhookEvent.organization", many: true, access: immutableRelationship }),
    machineCredentials: (0, import_fields20.relationship)({ ref: "MachineCredential.organization", many: true, access: immutableRelationship }),
    externalIntegrationWorkflows: (0, import_fields20.relationship)({ ref: "ExternalIntegrationWorkflow.organization", many: true, access: immutableRelationship }),
    integrationWebhookEvents: (0, import_fields20.relationship)({ ref: "IntegrationWebhookEvent.organization", many: true, access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/OrganizationMembership.ts
var import_core20 = require("@keystone-6/core");
var import_access32 = require("@keystone-6/core/access");
var import_fields21 = require("@keystone-6/core/fields");
async function hasOrganizationWideMembership(context, organizationId, membershipRole) {
  const userId = context.session?.itemId;
  if (!userId || !organizationId) return false;
  const memberships = await context.sudo().query.OrganizationMembership.findMany({
    where: {
      user: { id: { equals: userId } },
      organization: { id: { equals: organizationId } },
      status: { equals: "active" },
      location: null,
      ...membershipRole ? { membershipRole: { equals: membershipRole } } : {}
    },
    take: 1,
    query: "id"
  });
  return memberships.length > 0;
}
var notOwnMembership = ({ session, item }) => Boolean(session?.itemId) && String(item?.userId) !== session.itemId;
var OrganizationMembership = (0, import_core20.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageUsers,
      update: permissions.canManageUsers,
      delete: import_access32.denyAll
    },
    filter: {
      query: rules.canReadMemberships,
      update: rules.canReadMemberships,
      delete: rules.canReadMemberships
    }
  },
  hooks: {
    resolveInput: ({ operation, resolvedData }) => {
      if (operation !== "create") return resolvedData;
      const userId = resolvedData.user?.connect?.id;
      const organizationId = resolvedData.organization?.connect?.id;
      const locationId = resolvedData.location?.connect?.id || "*";
      return userId && organizationId ? { ...resolvedData, membershipKey: `${userId}:${organizationId}:${locationId}` } : resolvedData;
    },
    validateInput: async ({ operation, resolvedData, item, context, addValidationError }) => {
      if (operation === "create") {
        const userId = resolvedData.user?.connect?.id;
        const organizationId = resolvedData.organization?.connect?.id;
        const locationId = resolvedData.location?.connect?.id;
        if (!userId || !organizationId) return addValidationError("Membership requires user and organization relationships");
        const existingMembers = await context.sudo().query.OrganizationMembership.count({ where: { organization: { id: { equals: organizationId } } } });
        if (existingMembers > 0) {
          if (!await hasOrganizationWideMembership(context, organizationId)) addValidationError("You need organization-wide access to add members to this organization");
          if (resolvedData.membershipRole === "owner" && !await hasOrganizationWideMembership(context, organizationId, "owner")) addValidationError("Only an owner can add another owner");
        }
        if (locationId) {
          const location = await context.sudo().query.PharmacyLocation.findOne({ where: { id: locationId }, query: "organization { id }" });
          if (location?.organization?.id !== organizationId) addValidationError("Membership location must belong to its organization");
        }
      }
      if (operation === "update" && ["user", "organization", "location", "membershipKey"].some((field) => resolvedData[field] !== void 0)) {
        addValidationError("Membership user, organization and location cannot be changed");
      }
      if (operation === "update" && item && (resolvedData.membershipRole !== void 0 || resolvedData.status !== void 0)) {
        const organizationId = String(item.organizationId);
        if (!await hasOrganizationWideMembership(context, organizationId)) addValidationError("You need organization-wide access to change memberships in this organization");
        if ((resolvedData.membershipRole === "owner" || item.membershipRole === "owner") && !await hasOrganizationWideMembership(context, organizationId, "owner")) {
          addValidationError("Only an owner can grant or change owner memberships");
        }
      }
    }
  },
  ui: { listView: { initialColumns: ["user", "organization", "location", "membershipRole", "status"] } },
  fields: {
    membershipKey: (0, import_fields21.text)({ isIndexed: "unique", access: { create: import_access32.denyAll, update: import_access32.denyAll } }),
    user: (0, import_fields21.relationship)({ ref: "User.memberships", db: requiredRelationshipDb }),
    organization: (0, import_fields21.relationship)({ ref: "Organization.memberships", db: requiredRelationshipDb }),
    location: (0, import_fields21.relationship)({ ref: "PharmacyLocation.memberships" }),
    membershipRole: (0, import_fields21.select)({
      access: { update: notOwnMembership },
      type: "string",
      options: [
        { label: "Owner", value: "owner" },
        { label: "Administrator", value: "administrator" },
        { label: "Pharmacist", value: "pharmacist" },
        { label: "Technician", value: "technician" },
        { label: "Cashier", value: "cashier" },
        { label: "Delivery", value: "delivery" },
        { label: "Read only", value: "read_only" }
      ],
      defaultValue: "read_only"
    }),
    status: (0, import_fields21.select)({
      access: { update: notOwnMembership },
      type: "string",
      options: [
        { label: "Invited", value: "invited" },
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
        { label: "Revoked", value: "revoked" }
      ],
      defaultValue: "invited"
    }),
    externalCredentialValidated: (0, import_fields21.checkbox)({
      defaultValue: false,
      access: { create: import_access32.denyAll, update: import_access32.denyAll },
      ui: { description: "Organization-recorded review evidence only; the software does not validate licensure." }
    }),
    credentialVerificationMethod: (0, import_fields21.select)({
      type: "string",
      options: [
        { label: "Not recorded", value: "not_recorded" },
        { label: "Organization-recorded source review", value: "organization_recorded" },
        { label: "Contracted external provider", value: "external_provider" }
      ],
      defaultValue: "not_recorded",
      access: { create: import_access32.denyAll, update: import_access32.denyAll }
    }),
    credentialType: (0, import_fields21.text)({ access: { create: import_access32.denyAll, update: import_access32.denyAll } }),
    credentialJurisdiction: (0, import_fields21.text)({ access: { create: import_access32.denyAll, update: import_access32.denyAll } }),
    credentialIdentifier: (0, import_fields21.text)({ access: { create: import_access32.denyAll, update: import_access32.denyAll } }),
    credentialValidationReference: (0, import_fields21.text)({ access: { create: import_access32.denyAll, update: import_access32.denyAll } }),
    credentialValidatedAt: (0, import_fields21.timestamp)({ access: { create: import_access32.denyAll, update: import_access32.denyAll } }),
    credentialExpiresAt: (0, import_fields21.timestamp)({ access: { create: import_access32.denyAll, update: import_access32.denyAll } }),
    credentialVerifiedBy: (0, import_fields21.relationship)({ ref: "User", access: { create: import_access32.denyAll, update: import_access32.denyAll } }),
    ...trackingFields
  }
});

// features/keystone/models/PatientAllergy.ts
var import_core21 = require("@keystone-6/core");
var import_access34 = require("@keystone-6/core/access");
var import_fields22 = require("@keystone-6/core/fields");
var PatientAllergy = (0, import_core21.list)({
  access: {
    operation: { query: isSignedIn, create: import_access34.denyAll, update: import_access34.denyAll, delete: import_access34.denyAll },
    filter: { query: rules.canReadPatientChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    allergyKey: (0, import_fields22.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    requestFingerprint: (0, import_fields22.text)({ validation: { isRequired: true } }),
    allergen: (0, import_fields22.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    reaction: (0, import_fields22.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    severity: (0, import_fields22.select)({
      type: "string",
      options: [
        { label: "Unknown", value: "unknown" },
        { label: "Mild", value: "mild" },
        { label: "Moderate", value: "moderate" },
        { label: "Severe", value: "severe" }
      ],
      defaultValue: "unknown"
    }),
    status: (0, import_fields22.select)({ type: "string", options: [{ label: "Active", value: "active" }, { label: "No known allergies", value: "none_known" }, { label: "Entered in error", value: "entered_in_error" }, { label: "Inactive", value: "inactive" }], defaultValue: "active" }),
    source: (0, import_fields22.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    sourceReference: (0, import_fields22.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    recordedAt: (0, import_fields22.timestamp)({ defaultValue: { kind: "now" }, validation: { isRequired: true } }),
    organization: (0, import_fields22.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    patient: (0, import_fields22.relationship)({ ref: "PatientProfile.allergies", db: requiredRelationshipDb }),
    recordedBy: (0, import_fields22.relationship)({ ref: "User", db: requiredRelationshipDb }),
    approval: (0, import_fields22.relationship)({ ref: "HumanApproval" }),
    ...trackingFields
  }
});

// features/keystone/models/PatientMedication.ts
var import_core22 = require("@keystone-6/core");
var import_access36 = require("@keystone-6/core/access");
var import_fields23 = require("@keystone-6/core/fields");
var PatientMedication = (0, import_core22.list)({
  access: {
    operation: { query: isSignedIn, create: import_access36.denyAll, update: import_access36.denyAll, delete: import_access36.denyAll },
    filter: { query: rules.canReadPatientChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    medicationKey: (0, import_fields23.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    requestFingerprint: (0, import_fields23.text)({ validation: { isRequired: true } }),
    medicationName: (0, import_fields23.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    directions: (0, import_fields23.text)({ access: { read: permissions.canViewPatientPrivateData } }),
    status: (0, import_fields23.select)({ type: "string", options: [{ label: "Current", value: "current" }, { label: "No current medications", value: "none_known" }, { label: "Discontinued", value: "discontinued" }, { label: "Entered in error", value: "entered_in_error" }], defaultValue: "current" }),
    source: (0, import_fields23.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    sourceReference: (0, import_fields23.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    recordedAt: (0, import_fields23.timestamp)({ defaultValue: { kind: "now" }, validation: { isRequired: true } }),
    organization: (0, import_fields23.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    patient: (0, import_fields23.relationship)({ ref: "PatientProfile.medications", db: requiredRelationshipDb }),
    recordedBy: (0, import_fields23.relationship)({ ref: "User", db: requiredRelationshipDb }),
    approval: (0, import_fields23.relationship)({ ref: "HumanApproval" }),
    ...trackingFields
  }
});

// features/keystone/models/PatientProfile.ts
var import_core23 = require("@keystone-6/core");
var import_access38 = require("@keystone-6/core/access");
var import_fields24 = require("@keystone-6/core/fields");
var privateRead = { read: permissions.canViewPatientPrivateData };
var PatientProfile = (0, import_core23.list)({
  access: {
    operation: {
      query: import_access38.denyAll,
      create: import_access38.denyAll,
      update: import_access38.denyAll,
      delete: import_access38.denyAll
    }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  hooks: {
    validateInput: ({ operation, resolvedData, addValidationError }) => {
      if (operation === "create" && !resolvedData.organizations?.connect?.length) addValidationError("Patient requires an organization relationship");
      if (operation === "update" && resolvedData.organizations !== void 0) addValidationError("Patient organization cannot be changed");
    }
  },
  ui: { isHidden: true, listView: { initialColumns: ["displayName", "status", "patientNumber", "dateOfBirth"] } },
  fields: {
    patientNumber: (0, import_fields24.text)({ validation: { isRequired: true }, isIndexed: "unique", access: privateRead }),
    identityKey: (0, import_fields24.text)({ isIndexed: "unique", db: { isNullable: true }, access: privateRead }),
    requestFingerprint: (0, import_fields24.text)({ db: { isNullable: true }, access: privateRead }),
    firstName: (0, import_fields24.text)({ validation: { isRequired: true }, access: privateRead }),
    lastName: (0, import_fields24.text)({ validation: { isRequired: true }, access: privateRead }),
    displayName: (0, import_fields24.virtual)({
      access: privateRead,
      field: import_core23.graphql.field({
        type: import_core23.graphql.String,
        resolve(item) {
          return `${String(item.firstName || "")} ${String(item.lastName || "")}`.trim();
        }
      })
    }),
    status: (0, import_fields24.select)({
      type: "string",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Archived", value: "archived" }
      ],
      defaultValue: "active"
    }),
    dateOfBirth: (0, import_fields24.timestamp)({ access: privateRead }),
    email: (0, import_fields24.text)({ access: privateRead }),
    phone: (0, import_fields24.text)({ access: privateRead }),
    address: (0, import_fields24.json)({ access: privateRead }),
    identityVerificationStatus: (0, import_fields24.select)({
      type: "string",
      options: [
        { label: "Not recorded", value: "unverified" },
        { label: "Operator-confirmed match", value: "confirmed" },
        { label: "Rejected mismatch", value: "rejected" }
      ],
      defaultValue: "unverified",
      access: { ...privateRead, create: import_access38.denyAll, update: import_access38.denyAll }
    }),
    identityReference: (0, import_fields24.text)({ access: { ...privateRead, create: import_access38.denyAll, update: import_access38.denyAll } }),
    identityVerifiedAt: (0, import_fields24.timestamp)({ access: { ...privateRead, create: import_access38.denyAll, update: import_access38.denyAll } }),
    identityVerifiedBy: (0, import_fields24.relationship)({ ref: "User", access: { ...privateRead, create: import_access38.denyAll, update: import_access38.denyAll } }),
    identityEvidence: (0, import_fields24.json)({ access: privateRead, ui: { description: "Operator-recorded identity matching evidence; not a government identity validation claim." } }),
    preferredContactMethod: (0, import_fields24.select)({
      access: privateRead,
      type: "string",
      options: [
        { label: "Phone", value: "phone" },
        { label: "SMS", value: "sms" },
        { label: "Email", value: "email" },
        { label: "Portal", value: "portal" },
        { label: "None", value: "none" }
      ],
      defaultValue: "none"
    }),
    notes: (0, import_fields24.text)({ access: privateRead, ui: { displayMode: "textarea", description: "Minimum necessary operational note; do not use as a full medical record." } }),
    user: (0, import_fields24.relationship)({ ref: "User.patientProfile" }),
    organizations: (0, import_fields24.relationship)({ ref: "Organization.patients", many: true, db: requiredRelationshipDb }),
    consents: (0, import_fields24.relationship)({ ref: "ConsentRecord.patient", many: true }),
    allergies: (0, import_fields24.relationship)({ ref: "PatientAllergy.patient", many: true }),
    medications: (0, import_fields24.relationship)({ ref: "PatientMedication.patient", many: true }),
    safetyReviews: (0, import_fields24.relationship)({ ref: "ClinicalSafetyReview.patient", many: true }),
    dispensingLabels: (0, import_fields24.relationship)({ ref: "DispensingLabel.patient", many: true }),
    prescriptions: (0, import_fields24.relationship)({ ref: "Prescription.patient", many: true }),
    refillRequests: (0, import_fields24.relationship)({ ref: "RefillRequest.patient", many: true }),
    transfers: (0, import_fields24.relationship)({ ref: "PrescriptionTransfer.patient", many: true }),
    orders: (0, import_fields24.relationship)({ ref: "Order.patient", many: true }),
    auditEvents: (0, import_fields24.relationship)({ ref: "AuditEvent.patient", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/Payment.ts
var import_core24 = require("@keystone-6/core");
var import_access40 = require("@keystone-6/core/access");
var import_fields25 = require("@keystone-6/core/fields");
var Payment = (0, import_core24.list)({
  access: {
    operation: {
      query: permissions.canManagePayments,
      create: import_access40.denyAll,
      update: import_access40.denyAll,
      delete: import_access40.denyAll
    },
    filter: { query: rules.canReadPayments }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    amount: (0, import_fields25.integer)({ validation: { isRequired: true, min: 0 } }),
    currencyCode: (0, import_fields25.text)({ validation: { isRequired: true }, defaultValue: "USD" }),
    status: (0, import_fields25.select)({
      type: "string",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Authorized", value: "authorized" },
        { label: "Captured", value: "captured" },
        { label: "Refund pending", value: "refund_pending" },
        { label: "Refunded", value: "refunded" },
        { label: "Failed", value: "failed" },
        { label: "Cancelled (unpaid)", value: "cancelled" }
      ],
      defaultValue: "pending"
    }),
    tenderMethod: (0, import_fields25.select)({ type: "string", options: [{ label: "Provider", value: "provider" }, { label: "Operator-attested cash", value: "cash" }], defaultValue: "provider" }),
    cashReceivedAmount: (0, import_fields25.integer)({ validation: { min: 0 } }),
    changeDueAmount: (0, import_fields25.integer)({ validation: { min: 0 } }),
    externalPaymentId: (0, import_fields25.text)({ isIndexed: true }),
    processedAt: (0, import_fields25.timestamp)(),
    data: (0, import_fields25.json)({ access: { read: permissions.canManagePayments } }),
    organization: (0, import_fields25.relationship)({ ref: "Organization" }),
    location: (0, import_fields25.relationship)({ ref: "PharmacyLocation" }),
    order: (0, import_fields25.relationship)({ ref: "Order.payments", db: requiredRelationshipDb }),
    provider: (0, import_fields25.relationship)({ ref: "PaymentProvider.payments" }),
    session: (0, import_fields25.relationship)({ ref: "PaymentSession.payment" }),
    recordedBy: (0, import_fields25.relationship)({ ref: "User" }),
    approval: (0, import_fields25.relationship)({ ref: "HumanApproval" }),
    ...trackingFields
  }
});

// features/keystone/models/PaymentProvider.ts
var import_core25 = require("@keystone-6/core");
var import_access42 = require("@keystone-6/core/access");
var import_fields26 = require("@keystone-6/core/fields");
var PaymentProvider = (0, import_core25.list)({
  access: {
    operation: {
      query: permissions.canManagePayments,
      create: permissions.canManagePayments,
      update: permissions.canManagePayments,
      delete: permissions.canManagePayments
    },
    filter: { query: rules.canReadOrganizationRecords, update: rules.canReadOrganizationRecords, delete: rules.canReadOrganizationRecords }
  },
  hooks: {
    resolveInput: ({ operation, resolvedData }) => {
      if (operation !== "create") return resolvedData;
      const organizationId = resolvedData.organization?.connect?.id;
      return organizationId && resolvedData.code ? { ...resolvedData, providerKey: `${organizationId}:${resolvedData.code}` } : resolvedData;
    },
    validateInput: async ({ operation, resolvedData, context, addValidationError }) => {
      const organizationId = resolvedData.organization?.connect?.id;
      if (operation === "create" && (!organizationId || !resolvedData.code)) {
        addValidationError("Payment provider requires organization and code identity");
      }
      if (operation === "create" && organizationId) {
        const membership = await context.sudo().query.OrganizationMembership.findMany({ where: { user: { id: { equals: context.session?.itemId || "" } }, organization: { id: { equals: organizationId } }, status: { equals: "active" } }, take: 1, query: "id" });
        if (!membership.length) addValidationError("Payment provider organization must belong to the active operator");
      }
      if (operation === "update" && ["organization", "code", "providerKey"].some((field) => resolvedData[field] !== void 0)) {
        addValidationError("Payment provider organization and code cannot be changed");
      }
    },
    validateDelete: async ({ item, context, addValidationError }) => {
      const [sessions, payments] = await Promise.all([
        context.prisma.paymentSession.count({ where: { providerId: String(item.id) } }),
        context.prisma.payment.count({ where: { providerId: String(item.id) } })
      ]);
      if (sessions || payments) addValidationError("Payment providers with payment history cannot be deleted; uninstall them instead");
    }
  },
  fields: {
    providerKey: (0, import_fields26.text)({ isIndexed: "unique", access: { update: import_access42.denyAll } }),
    name: (0, import_fields26.text)({ validation: { isRequired: true } }),
    code: (0, import_fields26.text)({
      isIndexed: true,
      validation: {
        isRequired: true,
        match: {
          regex: /^pp_[a-zA-Z0-9-_]+$/,
          explanation: 'Payment provider code must start with "pp_" followed by alphanumeric characters, hyphens or underscores'
        }
      }
    }),
    isInstalled: (0, import_fields26.checkbox)({ defaultValue: false }),
    credentials: (0, import_fields26.json)({ access: { read: import_access42.denyAll } }),
    metadata: (0, import_fields26.json)(),
    createPaymentFunction: (0, import_fields26.text)({ validation: { isRequired: true } }),
    capturePaymentFunction: (0, import_fields26.text)({ validation: { isRequired: true } }),
    refundPaymentFunction: (0, import_fields26.text)({ validation: { isRequired: true } }),
    getPaymentStatusFunction: (0, import_fields26.text)({ validation: { isRequired: true } }),
    generatePaymentLinkFunction: (0, import_fields26.text)({ validation: { isRequired: true } }),
    handleWebhookFunction: (0, import_fields26.text)({ validation: { isRequired: true } }),
    organization: (0, import_fields26.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    integrationProvider: (0, import_fields26.relationship)({ ref: "IntegrationProvider.paymentProviders" }),
    paymentSessions: (0, import_fields26.relationship)({ ref: "PaymentSession.provider", many: true }),
    payments: (0, import_fields26.relationship)({ ref: "Payment.provider", many: true }),
    webhookEvents: (0, import_fields26.relationship)({ ref: "PaymentWebhookEvent.provider", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/PaymentSession.ts
var import_core26 = require("@keystone-6/core");
var import_access44 = require("@keystone-6/core/access");
var import_fields27 = require("@keystone-6/core/fields");
var PaymentSession = (0, import_core26.list)({
  access: {
    operation: {
      query: permissions.canManagePayments,
      create: import_access44.denyAll,
      update: import_access44.denyAll,
      delete: import_access44.denyAll
    },
    filter: { query: rules.canReadPaymentSessions }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    amount: (0, import_fields27.integer)({ validation: { isRequired: true, min: 0 } }),
    currencyCode: (0, import_fields27.text)({ validation: { isRequired: true }, defaultValue: "USD" }),
    status: (0, import_fields27.select)({
      type: "string",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Requires action", value: "requires_action" },
        { label: "Authorized", value: "authorized" },
        { label: "Captured", value: "captured" },
        { label: "Settled without order", value: "settled_unordered" },
        { label: "Compensation pending", value: "compensation_pending" },
        { label: "Compensated", value: "compensated" },
        { label: "Failed", value: "failed" },
        { label: "Cancelled", value: "cancelled" }
      ],
      defaultValue: "pending"
    }),
    isSelected: (0, import_fields27.checkbox)({ defaultValue: true }),
    idempotencyKey: (0, import_fields27.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    externalPaymentId: (0, import_fields27.text)({ isIndexed: true, db: { isNullable: true } }),
    reconciliationStatus: (0, import_fields27.select)({
      type: "string",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Settled without order", value: "settled_unordered" },
        { label: "Ordered", value: "ordered" },
        { label: "Compensation pending", value: "compensation_pending" },
        { label: "Compensated", value: "compensated" },
        { label: "Manual review", value: "manual_review" }
      ],
      defaultValue: "pending"
    }),
    reconciliationAttempts: (0, import_fields27.integer)({ validation: { min: 0 }, defaultValue: 0 }),
    lastReconciledAt: (0, import_fields27.timestamp)(),
    failureReason: (0, import_fields27.text)({ db: { isNullable: true }, ui: { displayMode: "textarea" } }),
    data: (0, import_fields27.json)({ access: { read: permissions.canManagePayments } }),
    organization: (0, import_fields27.relationship)({ ref: "Organization" }),
    location: (0, import_fields27.relationship)({ ref: "PharmacyLocation" }),
    cart: (0, import_fields27.relationship)({ ref: "Cart.paymentSessions", db: requiredRelationshipDb }),
    provider: (0, import_fields27.relationship)({ ref: "PaymentProvider.paymentSessions", db: requiredRelationshipDb }),
    payment: (0, import_fields27.relationship)({ ref: "Payment.session" }),
    ...trackingFields
  }
});

// features/keystone/models/PaymentWebhookEvent.ts
var import_core27 = require("@keystone-6/core");
var import_access46 = require("@keystone-6/core/access");
var import_fields28 = require("@keystone-6/core/fields");
var PaymentWebhookEvent = (0, import_core27.list)({
  access: { operation: { query: import_access46.denyAll, create: import_access46.denyAll, update: import_access46.denyAll, delete: import_access46.denyAll } },
  graphql: { omit: { create: true, update: true, delete: true } },
  fields: {
    eventKey: (0, import_fields28.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    externalEventId: (0, import_fields28.text)({ validation: { isRequired: true }, isIndexed: true }),
    eventType: (0, import_fields28.text)({ validation: { isRequired: true } }),
    status: (0, import_fields28.select)({
      type: "string",
      options: [
        { label: "Received", value: "received" },
        { label: "Processed", value: "processed" },
        { label: "Ignored", value: "ignored" },
        { label: "Failed", value: "failed" }
      ],
      defaultValue: "received"
    }),
    resource: (0, import_fields28.json)(),
    error: (0, import_fields28.text)({ ui: { displayMode: "textarea" } }),
    receivedAt: (0, import_fields28.timestamp)({ defaultValue: { kind: "now" } }),
    processedAt: (0, import_fields28.timestamp)(),
    organization: (0, import_fields28.relationship)({ ref: "Organization.paymentWebhookEvents", db: requiredRelationshipDb }),
    provider: (0, import_fields28.relationship)({ ref: "PaymentProvider.webhookEvents", db: requiredRelationshipDb }),
    ...trackingFields
  }
});

// features/keystone/models/PharmacyLocation.ts
var import_core28 = require("@keystone-6/core");
var import_access47 = require("@keystone-6/core/access");
var import_fields29 = require("@keystone-6/core/fields");

// features/pharmacy/hours.ts
var TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
function normalizeDay(value) {
  if (value === null) return null;
  if (!value || typeof value !== "object") return void 0;
  const { open, close } = value;
  if (typeof open !== "string" || typeof close !== "string" || !TIME.test(open) || !TIME.test(close) || close <= open) return void 0;
  return { open, close };
}
function normalizeWeek(value) {
  if (!Array.isArray(value) || value.length !== 7) return void 0;
  const days = value.map(normalizeDay);
  return days.some((day) => day === void 0) ? void 0 : days;
}
function normalizeWeeklyHours(value) {
  if (!value || typeof value !== "object") return null;
  const store = normalizeWeek(value.store);
  const pharmacy = normalizeWeek(value.pharmacy);
  return store && pharmacy ? { store, pharmacy } : null;
}
function weeklyHoursError(value) {
  if (value === null || value === void 0) return null;
  return normalizeWeeklyHours(value) ? null : "Hours need an opening and a later closing time (HH:MM) for each open day.";
}
var DEFAULT_WEEK = [null, ...Array.from({ length: 5 }, () => ({ open: "09:00", close: "19:00" })), { open: "09:00", close: "17:00" }];

// features/keystone/models/PharmacyLocation.ts
var PharmacyLocation = (0, import_core28.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageLocations,
      update: permissions.canManageLocations,
      delete: import_access47.denyAll
    },
    filter: { query: rules.canReadLocations, update: rules.canReadLocations, delete: rules.canReadLocations }
  },
  hooks: {
    validateInput: async ({ operation, resolvedData, context, addValidationError }) => {
      const hoursError = resolvedData.hours !== void 0 ? weeklyHoursError(resolvedData.hours) : null;
      if (hoursError) addValidationError(hoursError);
      if (resolvedData.timezone !== void 0) {
        try {
          new Intl.DateTimeFormat("en-US", { timeZone: String(resolvedData.timezone) });
        } catch {
          addValidationError("Time zone is not a valid IANA zone, for example America/New_York");
        }
      }
      const organizationId = resolvedData.organization?.connect?.id;
      if (operation === "create" && !organizationId) addValidationError("Location requires an organization relationship");
      if (operation === "create" && organizationId) {
        const membership = await context.sudo().query.OrganizationMembership.findMany({
          where: { user: { id: { equals: context.session?.itemId || "" } }, organization: { id: { equals: organizationId } }, status: { equals: "active" }, location: null },
          take: 1,
          query: "id"
        });
        if (!membership.length) addValidationError("You need organization-wide access to add a location to this organization");
      }
      if (operation === "update" && resolvedData.organization !== void 0) addValidationError("Location organization is immutable");
    }
  },
  graphql: { omit: { delete: true } },
  ui: { hideDelete: true, listView: { initialColumns: ["name", "code", "status", "organization"] } },
  fields: {
    name: (0, import_fields29.text)({ validation: { isRequired: true } }),
    code: (0, import_fields29.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    status: (0, import_fields29.select)({
      type: "string",
      options: [
        { label: "Active", value: "active" },
        { label: "Temporarily closed", value: "temporarily_closed" },
        { label: "Archived", value: "archived" }
      ],
      defaultValue: "active"
    }),
    organization: (0, import_fields29.relationship)({ ref: "Organization.locations", db: requiredRelationshipDb }),
    memberships: (0, import_fields29.relationship)({ ref: "OrganizationMembership.location", many: true, access: immutableRelationship }),
    address: (0, import_fields29.json)({ ui: { description: "Operational address only; validate jurisdiction-specific requirements externally." } }),
    timezone: (0, import_fields29.text)({ defaultValue: "America/New_York" }),
    // Weekly hours: { store: Day[7], pharmacy: Day[7] }, Sunday first; a Day is { open: 'HH:MM', close: 'HH:MM' } or null when closed.
    hours: (0, import_fields29.json)({ ui: { description: "Weekly store and pharmacy counter hours, edited in Store Settings." } }),
    phone: (0, import_fields29.text)(),
    onlineOrderingEnabled: (0, import_fields29.checkbox)({ defaultValue: true, access: { create: permissions.canManageLocations, update: permissions.canManageLocations } }),
    pickupEnabled: (0, import_fields29.checkbox)({ defaultValue: true }),
    deliveryEnabled: (0, import_fields29.checkbox)({ defaultValue: false, access: { create: permissions.canManageLocations, update: permissions.canManageLocations } }),
    products: (0, import_fields29.relationship)({ ref: "Product.location", many: true, access: immutableRelationship }),
    inventoryLots: (0, import_fields29.relationship)({ ref: "InventoryLot.location", many: true, access: immutableRelationship }),
    prescriptions: (0, import_fields29.relationship)({ ref: "Prescription.location", many: true, access: immutableRelationship }),
    recalls: (0, import_fields29.relationship)({ ref: "Recall.location", many: true, access: immutableRelationship }),
    orders: (0, import_fields29.relationship)({ ref: "Order.location", many: true, access: immutableRelationship }),
    machineCredentials: (0, import_fields29.relationship)({ ref: "MachineCredential.location", many: true, access: immutableRelationship }),
    externalIntegrationWorkflows: (0, import_fields29.relationship)({ ref: "ExternalIntegrationWorkflow.location", many: true, access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/Prescriber.ts
var import_core29 = require("@keystone-6/core");
var import_access49 = require("@keystone-6/core/access");
var import_fields30 = require("@keystone-6/core/fields");
var Prescriber = (0, import_core29.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManagePrescriptions,
      update: permissions.canManagePrescriptions,
      delete: import_access49.denyAll
    },
    filter: { query: rules.canReadOrganizationRecords, update: rules.canReadOrganizationRecords }
  },
  hooks: {
    validateInput: async ({ operation, resolvedData, context, addValidationError }) => {
      if (operation === "create" && !resolvedData.organization?.connect?.id) addValidationError("Prescriber requires an organization relationship");
      if (operation === "create" && resolvedData.organization?.connect?.id) {
        const membership = await context.sudo().query.OrganizationMembership.findMany({ where: { user: { id: { equals: context.session?.itemId || "" } }, organization: { id: { equals: resolvedData.organization.connect.id } }, status: { equals: "active" } }, take: 1, query: "id" });
        if (!membership.length) addValidationError("Prescriber organization must belong to the active operator");
      }
      if (operation === "update" && resolvedData.organization !== void 0) addValidationError("Prescriber organization is immutable");
      if (operation === "update" && ["verificationStatus", "externalValidationComplete", "verificationMethod", "credentialType", "credentialJurisdiction", "credentialIdentifier", "credentialExpiresAt", "validationReference", "validatedAt", "verifiedBy"].some((field) => resolvedData[field] !== void 0)) {
        addValidationError("Prescriber validation state is controlled by the credential evidence workflow");
      }
      if (operation === "create" && (resolvedData.externalValidationComplete === true || resolvedData.verificationStatus === "validated")) {
        addValidationError("New prescribers must complete the credential evidence workflow");
      }
    }
  },
  graphql: { omit: { delete: true } },
  ui: { hideDelete: true, listView: { initialColumns: ["name", "npi", "verificationStatus", "credentialExpiresAt", "organization"] } },
  fields: {
    name: (0, import_fields30.text)({ validation: { isRequired: true } }),
    npi: (0, import_fields30.text)({ isIndexed: true }),
    phone: (0, import_fields30.text)(),
    fax: (0, import_fields30.text)(),
    externalIdentifier: (0, import_fields30.text)(),
    verificationStatus: (0, import_fields30.select)({
      type: "string",
      options: [
        { label: "Unverified", value: "unverified" },
        { label: "Pending verification evidence", value: "pending" },
        { label: "Verification evidence recorded", value: "validated" },
        { label: "Rejected", value: "rejected" }
      ],
      defaultValue: "unverified"
    }),
    externalValidationComplete: (0, import_fields30.checkbox)({ defaultValue: false, access: { update: import_access49.denyAll }, ui: { description: "Recorded evidence flag; not a software licensure claim." } }),
    verificationMethod: (0, import_fields30.select)({
      type: "string",
      options: [
        { label: "Not recorded", value: "not_recorded" },
        { label: "Organization-recorded source review", value: "organization_recorded" },
        { label: "Contracted external provider", value: "external_provider" }
      ],
      defaultValue: "not_recorded",
      access: { update: import_access49.denyAll }
    }),
    credentialType: (0, import_fields30.text)({ access: { update: import_access49.denyAll } }),
    credentialJurisdiction: (0, import_fields30.text)({ access: { update: import_access49.denyAll } }),
    credentialIdentifier: (0, import_fields30.text)({ access: { update: import_access49.denyAll } }),
    credentialExpiresAt: (0, import_fields30.timestamp)({ access: { update: import_access49.denyAll } }),
    validationReference: (0, import_fields30.text)({ access: { update: import_access49.denyAll } }),
    validatedAt: (0, import_fields30.timestamp)({ access: { update: import_access49.denyAll } }),
    verifiedBy: (0, import_fields30.relationship)({ ref: "User", access: { update: import_access49.denyAll } }),
    organization: (0, import_fields30.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    integrationProvider: (0, import_fields30.relationship)({ ref: "IntegrationProvider.prescribers" }),
    prescriptions: (0, import_fields30.relationship)({ ref: "Prescription.prescriber", many: true, access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/Prescription.ts
var import_core30 = require("@keystone-6/core");
var import_access51 = require("@keystone-6/core/access");
var import_fields31 = require("@keystone-6/core/fields");

// features/keystone/workflows/pharmacy-state.ts
var prescriptionTransitions = {
  draft: ["pending_review", "cancelled"],
  pending_review: ["needs_information", "approved", "rejected", "cancelled"],
  needs_information: ["pending_review", "cancelled"],
  approved: ["ready_to_dispense", "fill_closed", "cancelled"],
  ready_to_dispense: ["approved", "partially_dispensed", "ready_for_pickup", "dispensed", "fill_closed", "cancelled"],
  // Will-call bin: filled and labelled, waiting for the patient. Picked up -> dispensed;
  // returned to stock -> fill_closed.
  ready_for_pickup: ["dispensed", "fill_closed", "cancelled"],
  partially_dispensed: ["approved", "partially_dispensed", "dispensed", "fill_closed", "cancelled"],
  rejected: [],
  dispensed: ["approved", "cancelled"],
  fill_closed: ["approved", "cancelled"],
  cancelled: []
};
var terminalPrescriptionStatuses = /* @__PURE__ */ new Set(["rejected", "cancelled"]);
function isTerminalPrescriptionStatus(status) {
  return terminalPrescriptionStatuses.has(status);
}
function assertPrescriptionTransition(previousStatus, nextStatus) {
  if (previousStatus === nextStatus) return;
  if (isTerminalPrescriptionStatus(previousStatus)) {
    throw new Error(`Prescription status ${previousStatus} is terminal`);
  }
  if (!prescriptionTransitions[previousStatus]?.includes(nextStatus)) {
    throw new Error(`Invalid prescription transition: ${previousStatus} -> ${nextStatus}`);
  }
}
var recallTransitions = {
  draft: ["active", "cancelled"],
  active: ["quarantined", "cancelled"],
  quarantined: ["resolved", "closed"],
  resolved: ["closed"],
  closed: [],
  cancelled: []
};
function assertRecallTransition(previousStatus, nextStatus) {
  if (previousStatus === nextStatus) return;
  if (!recallTransitions[previousStatus]?.includes(nextStatus)) {
    throw new Error(`Invalid recall transition: ${previousStatus} -> ${nextStatus}`);
  }
}
function assertAuthorizedHumanApproval(input) {
  if (!input.actorId?.trim()) {
    throw new Error("An authenticated authorized human is required");
  }
  if (input.attested !== true) {
    throw new Error("Explicit human attestation is required");
  }
  if (!input.reason?.trim() || input.reason.trim().length < 8) {
    throw new Error("A meaningful approval reason is required");
  }
}
var PAYMENT_SESSION_TRANSITIONS = {
  pending: ["requires_action", "authorized", "captured", "settled_unordered", "failed", "cancelled"],
  requires_action: ["pending", "authorized", "captured", "settled_unordered", "failed", "cancelled"],
  authorized: ["captured", "settled_unordered", "failed", "cancelled"],
  // Money arrived but no order exists yet: it becomes an order payment, or is refunded.
  settled_unordered: ["captured", "compensation_pending", "compensated"],
  captured: [],
  compensation_pending: ["compensated"],
  compensated: [],
  // A success that arrives after a failure or cancel is real money and must surface for reconciliation.
  failed: ["settled_unordered"],
  cancelled: ["settled_unordered"]
};
function canMovePaymentSession(from, to) {
  return from === to || Boolean(PAYMENT_SESSION_TRANSITIONS[from]?.includes(to));
}
var PAYMENT_TRANSITIONS = {
  pending: ["authorized", "captured", "failed", "cancelled"],
  authorized: ["captured", "failed", "cancelled"],
  captured: ["refund_pending", "refunded"],
  refund_pending: ["refunded"],
  refunded: [],
  failed: [],
  cancelled: []
};
function canMovePayment(from, to) {
  return from === to || Boolean(PAYMENT_TRANSITIONS[from]?.includes(to));
}
var QUARANTINABLE_LOT_STATUSES = ["available", "quarantined"];
function lotStatusAfterAdjustment(current, targetQuantity) {
  if (targetQuantity === 0) return ["available", "depleted"].includes(current) ? "depleted" : null;
  return current === "depleted" ? "available" : null;
}
var EXCURSION_DISPOSITIONS = ["released", "destroyed"];
var OPEN_EXCURSION_STATUSES = ["open", "under_review"];
function excursionDispositionError(input) {
  if (!EXCURSION_DISPOSITIONS.includes(input.disposition)) return "Disposition must be released or destroyed";
  if (!OPEN_EXCURSION_STATUSES.includes(input.excursionStatus)) return `This excursion is already closed (${input.excursionStatus.replace(/_/g, " ")})`;
  if (!input.note?.trim() || input.note.trim().length < 8) return "A disposition note of at least 8 characters is required";
  const expired = input.lotStatus === "expired" || new Date(input.lotExpiresAt).getTime() <= (input.now ?? /* @__PURE__ */ new Date()).getTime();
  if (input.disposition === "released") {
    if (input.lotStatus === "recalled") return "A recalled lot cannot be released; dispose of it through the recall";
    if (expired) return "An expired lot cannot be released back to stock";
    if (input.lotStatus !== "quarantined") return `A ${input.lotStatus} lot cannot be released`;
  }
  if (input.disposition === "destroyed" && input.lotStatus !== "quarantined") {
    return input.lotStatus === "recalled" ? "A recalled lot is destroyed through its recall disposition" : `A ${input.lotStatus} lot cannot be written off from an excursion`;
  }
  return null;
}
function lotAfterExcursionDisposition(disposition, lot, otherOpenExcursions) {
  if (disposition === "destroyed") return { status: "depleted", quantityAvailable: 0, quantityQuarantined: 0, writeOff: lot.quantityAvailable };
  if (otherOpenExcursions > 0) return { status: "quarantined", quantityAvailable: lot.quantityAvailable, quantityQuarantined: lot.quantityAvailable, writeOff: 0 };
  return { status: lot.quantityAvailable > 0 ? "available" : "depleted", quantityAvailable: lot.quantityAvailable, quantityQuarantined: 0, writeOff: 0 };
}

// features/keystone/models/Prescription.ts
var Prescription = (0, import_core30.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: import_access51.denyAll,
      update: import_access51.denyAll,
      delete: import_access51.denyAll
    },
    filter: { query: rules.canReadPrescriptionRecords, update: rules.canReadPrescriptionRecords }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  hooks: {
    validateInput: async ({ operation, item, resolvedData, context, addValidationError }) => {
      if (operation === "create") {
        const organizationId = resolvedData.organization?.connect?.id;
        const locationId = resolvedData.location?.connect?.id;
        const patientId = resolvedData.patient?.connect?.id;
        const prescriberId = resolvedData.prescriber?.connect?.id;
        if (!organizationId || !locationId || !patientId || !prescriberId) {
          addValidationError("Prescription requires organization, location, patient, and prescriber relationships");
          return;
        }
        const [location, patient, prescriber] = await Promise.all([
          context.sudo().query.PharmacyLocation.findOne({ where: { id: locationId }, query: "organization { id }" }),
          context.sudo().query.PatientProfile.findOne({ where: { id: patientId }, query: "organizations { id }" }),
          context.sudo().query.Prescriber.findOne({ where: { id: prescriberId }, query: "organization { id }" })
        ]);
        if (location?.organization?.id !== organizationId || prescriber?.organization?.id !== organizationId || !patient?.organizations?.some((organization) => organization.id === organizationId)) {
          addValidationError("Prescription location, patient and prescriber must belong to the same pharmacy");
        }
      }
      if (operation === "update" && item && resolvedData.status) {
        try {
          assertPrescriptionTransition(String(item.status), String(resolvedData.status));
        } catch (error) {
          addValidationError(error instanceof Error ? error.message : "Invalid prescription transition");
        }
      }
    },
    beforeOperation: ({ operation, resolvedData }) => {
      if (operation === "update" && ["organization", "location", "patient", "prescriber", "prescriptionNumber"].some((field) => resolvedData[field] !== void 0)) {
        throw new Error("Prescription number, patient, prescriber and location cannot be changed");
      }
      if (operation === "delete") throw new Error("Prescription lifecycle evidence cannot be deleted");
    }
  },
  ui: { hideCreate: true, listView: { initialColumns: ["prescriptionNumber", "patient", "source", "status", "location"] } },
  fields: {
    prescriptionNumber: (0, import_fields31.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    intakeRequestFingerprint: (0, import_fields31.text)({ db: { isNullable: true }, access: { read: import_access51.denyAll, create: import_access51.denyAll, update: import_access51.denyAll } }),
    source: (0, import_fields31.select)({
      type: "string",
      options: [
        { label: "Paper", value: "paper" },
        { label: "Electronic boundary", value: "erx" },
        { label: "Transfer", value: "transfer" },
        { label: "Phone", value: "phone" },
        { label: "Manual intake", value: "manual" }
      ],
      defaultValue: "manual"
    }),
    sourceVerificationStatus: (0, import_fields31.select)({
      type: "string",
      options: [
        { label: "Unverified", value: "unverified" },
        { label: "Pending", value: "pending" },
        { label: "Verified by authorized human", value: "human_verified" },
        { label: "Rejected", value: "rejected" }
      ],
      defaultValue: "unverified"
    }),
    externalReference: (0, import_fields31.text)({ access: { read: permissions.canViewPatientPrivateData } }),
    status: (0, import_fields31.select)({
      access: { update: () => false },
      type: "string",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Pending review", value: "pending_review" },
        { label: "Needs information", value: "needs_information" },
        { label: "Approved", value: "approved" },
        { label: "Ready to dispense", value: "ready_to_dispense" },
        { label: "Partially dispensed", value: "partially_dispensed" },
        { label: "Ready for pickup", value: "ready_for_pickup" },
        { label: "Dispensed", value: "dispensed" },
        { label: "Fill closed with undispensed quantity", value: "fill_closed" },
        { label: "Rejected", value: "rejected" },
        { label: "Cancelled", value: "cancelled" }
      ],
      defaultValue: "draft"
    }),
    writtenAt: (0, import_fields31.timestamp)(),
    expiresAt: (0, import_fields31.timestamp)(),
    approvedAt: (0, import_fields31.timestamp)({ access: { update: () => false } }),
    dispensedAt: (0, import_fields31.timestamp)({ access: { update: () => false } }),
    organization: (0, import_fields31.relationship)({ ref: "Organization.prescriptions", db: requiredRelationshipDb }),
    location: (0, import_fields31.relationship)({ ref: "PharmacyLocation.prescriptions", db: requiredRelationshipDb }),
    patient: (0, import_fields31.relationship)({ ref: "PatientProfile.prescriptions", db: requiredRelationshipDb }),
    prescriber: (0, import_fields31.relationship)({ ref: "Prescriber.prescriptions", db: requiredRelationshipDb }),
    items: (0, import_fields31.relationship)({ ref: "PrescriptionItem.prescription", many: true }),
    reviews: (0, import_fields31.relationship)({ ref: "PrescriptionReview.prescription", many: true }),
    safetyReviews: (0, import_fields31.relationship)({ ref: "ClinicalSafetyReview.prescription", many: true }),
    dispensingLabels: (0, import_fields31.relationship)({ ref: "DispensingLabel.prescription", many: true }),
    refillRequests: (0, import_fields31.relationship)({ ref: "RefillRequest.prescription", many: true }),
    transfers: (0, import_fields31.relationship)({ ref: "PrescriptionTransfer.prescription", many: true }),
    approval: (0, import_fields31.relationship)({ ref: "HumanApproval.prescriptions" }),
    orders: (0, import_fields31.relationship)({ ref: "Order.prescription", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/PrescriptionFill.ts
var import_core31 = require("@keystone-6/core");
var import_access53 = require("@keystone-6/core/access");
var import_fields32 = require("@keystone-6/core/fields");
var PrescriptionFill = (0, import_core31.list)({
  access: {
    operation: { query: isSignedIn, create: import_access53.denyAll, update: import_access53.denyAll, delete: import_access53.denyAll },
    filter: { query: rules.canReadPrescriptionChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  hooks: { beforeOperation: ({ operation, inputData }) => {
    if (operation === "delete") throw new Error("Fill lineage cannot be deleted");
    const mutable = ["status", "version", "creditState", "quantityDispensed", "quantityReleased", "openKey", "approval"];
    if (operation === "update" && Object.keys(inputData).some((k) => !mutable.includes(k))) throw new Error("Fill authority snapshot is immutable");
  } },
  ui: { hideCreate: true },
  fields: {
    reservationKey: (0, import_fields32.text)({ isIndexed: "unique" }),
    requestFingerprint: (0, import_fields32.text)({ access: { read: import_access53.denyAll } }),
    openKey: (0, import_fields32.text)({ isIndexed: "unique", db: { isNullable: true } }),
    kind: (0, import_fields32.text)(),
    status: (0, import_fields32.text)({ defaultValue: "requested" }),
    version: (0, import_fields32.integer)({ defaultValue: 1, validation: { isRequired: true, min: 1 } }),
    fillNumber: (0, import_fields32.integer)({ validation: { isRequired: true, min: 1 } }),
    creditState: (0, import_fields32.text)({ defaultValue: "reserved" }),
    authorizedQuantity: (0, import_fields32.integer)({ validation: { isRequired: true, min: 1 } }),
    quantityDispensed: (0, import_fields32.integer)({ defaultValue: 0, validation: { isRequired: true, min: 0 } }),
    quantityReleased: (0, import_fields32.integer)({ defaultValue: 0, validation: { isRequired: true, min: 0 } }),
    itemVersion: (0, import_fields32.text)(),
    authorityVersion: (0, import_fields32.text)(),
    policySnapshot: (0, import_fields32.json)(),
    priceSnapshot: (0, import_fields32.json)(),
    expiresAt: (0, import_fields32.timestamp)({ validation: { isRequired: true } }),
    organization: (0, import_fields32.relationship)({ ref: "Organization", access: immutableRelationship, db: requiredRelationshipDb }),
    location: (0, import_fields32.relationship)({ ref: "PharmacyLocation", access: immutableRelationship, db: requiredRelationshipDb }),
    patient: (0, import_fields32.relationship)({ ref: "PatientProfile", access: immutableRelationship, db: requiredRelationshipDb }),
    prescription: (0, import_fields32.relationship)({ ref: "Prescription", access: immutableRelationship, db: requiredRelationshipDb }),
    prescriptionItem: (0, import_fields32.relationship)({ ref: "PrescriptionItem", access: immutableRelationship, db: requiredRelationshipDb }),
    refillRequest: (0, import_fields32.relationship)({ ref: "RefillRequest", access: immutableRelationship }),
    approval: (0, import_fields32.relationship)({ ref: "HumanApproval", access: immutableRelationship }),
    reservedBy: (0, import_fields32.relationship)({ ref: "User", access: immutableRelationship, db: requiredRelationshipDb }),
    // No inverse fields: omitted lists must not acquire parent-side write paths.
    ...trackingFields
  }
});

// features/keystone/models/PrescriptionFillEvent.ts
var import_core32 = require("@keystone-6/core");
var import_access55 = require("@keystone-6/core/access");
var import_fields33 = require("@keystone-6/core/fields");
var PrescriptionFillEvent = (0, import_core32.list)({
  access: {
    operation: { query: isSignedIn, create: import_access55.denyAll, update: import_access55.denyAll, delete: import_access55.denyAll },
    filter: { query: rules.canReadPrescriptionChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  hooks: { beforeOperation: ({ operation }) => {
    if (operation !== "create") throw new Error("Fill events are append-only");
  } },
  ui: { hideCreate: true },
  fields: {
    eventKey: (0, import_fields33.text)({ isIndexed: "unique" }),
    commandFingerprint: (0, import_fields33.text)({ access: { read: import_access55.denyAll } }),
    action: (0, import_fields33.text)(),
    version: (0, import_fields33.integer)({ validation: { isRequired: true, min: 1 } }),
    quantity: (0, import_fields33.integer)({ defaultValue: 0, validation: { isRequired: true, min: 0 } }),
    // Snapshot is privileged evidence, never returned as raw patient JSON.
    evidence: (0, import_fields33.json)({ access: { read: permissions.canViewPatientPrivateData } }),
    result: (0, import_fields33.json)({ access: { read: permissions.canViewPatientPrivateData } }),
    fill: (0, import_fields33.relationship)({ ref: "PrescriptionFill", access: immutableRelationship, db: requiredRelationshipDb }),
    prescription: (0, import_fields33.relationship)({ ref: "Prescription", access: immutableRelationship, db: requiredRelationshipDb }),
    actor: (0, import_fields33.relationship)({ ref: "User", access: immutableRelationship, db: requiredRelationshipDb }),
    approval: (0, import_fields33.relationship)({ ref: "HumanApproval", access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/PrescriptionItem.ts
var import_core33 = require("@keystone-6/core");
var import_access57 = require("@keystone-6/core/access");
var import_fields34 = require("@keystone-6/core/fields");
var PrescriptionItem = (0, import_core33.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: import_access57.denyAll,
      update: import_access57.denyAll,
      delete: import_access57.denyAll
    },
    filter: { query: rules.canReadPrescriptionChildren, update: rules.canReadPrescriptionChildren, delete: rules.canReadPrescriptionChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: {
    validateInput: ({ operation, resolvedData, addValidationError }) => {
      if (operation === "create" && (!resolvedData.prescription?.connect?.id || !resolvedData.product?.connect?.id)) {
        addValidationError("Prescription item requires prescription and product relationships");
      }
    },
    beforeOperation: ({ operation, inputData }) => {
      if (operation === "delete") throw new Error("Prescription item evidence cannot be deleted");
      if (operation === "update" && Object.keys(inputData || {}).some((field) => !["quantityDispensed", "refillsRemaining", "refillsReserved", "activeFillNumber"].includes(field))) {
        throw new Error("Prescription item identity and prescribed snapshot are immutable");
      }
    }
  },
  fields: {
    medicationNameSnapshot: (0, import_fields34.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    sig: (0, import_fields34.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: "textarea" } }),
    fillLineage: (0, import_fields34.text)({ db: { isNullable: true }, access: { update: import_access57.denyAll } }),
    activeFillNumber: (0, import_fields34.integer)({ db: { isNullable: true }, access: { create: import_access57.denyAll, update: import_access57.denyAll } }),
    quantityPrescribed: (0, import_fields34.integer)({ validation: { isRequired: true, min: 1 } }),
    daysSupply: (0, import_fields34.integer)({ validation: { min: 1 } }),
    refillsAuthorized: (0, import_fields34.integer)({ validation: { min: 0 }, defaultValue: 0 }),
    refillsRemaining: (0, import_fields34.integer)({ validation: { min: 0 }, defaultValue: 0 }),
    refillsReserved: (0, import_fields34.integer)({ validation: { min: 0 }, defaultValue: 0 }),
    quantityDispensed: (0, import_fields34.integer)({ validation: { min: 0 }, defaultValue: 0 }),
    substitutionAllowed: (0, import_fields34.checkbox)({ defaultValue: false }),
    prescription: (0, import_fields34.relationship)({ ref: "Prescription.items", access: { create: import_access57.denyAll, update: import_access57.denyAll }, db: requiredRelationshipDb }),
    drugReference: (0, import_fields34.relationship)({ ref: "DrugReference.prescriptionItems", db: requiredRelationshipDb }),
    product: (0, import_fields34.relationship)({ ref: "Product.prescriptionItems", access: { create: import_access57.denyAll, update: import_access57.denyAll }, db: requiredRelationshipDb }),
    refillRequests: (0, import_fields34.relationship)({ ref: "RefillRequest.prescriptionItem", many: true }),
    dispensingLabels: (0, import_fields34.relationship)({ ref: "DispensingLabel.prescriptionItem", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/PrescriptionReview.ts
var import_core34 = require("@keystone-6/core");
var import_fields35 = require("@keystone-6/core/fields");
var denyMutation6 = () => false;
var PrescriptionReview = (0, import_core34.list)({
  access: {
    operation: { query: isSignedIn, create: denyMutation6, update: denyMutation6, delete: denyMutation6 },
    filter: { query: rules.canReadPrescriptionChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    decision: (0, import_fields35.select)({
      type: "string",
      options: [
        { label: "Approved", value: "approved" },
        { label: "Needs information", value: "needs_information" },
        { label: "Rejected", value: "rejected" }
      ],
      validation: { isRequired: true }
    }),
    reason: (0, import_fields35.text)({ validation: { isRequired: true }, ui: { displayMode: "textarea" } }),
    humanAttested: (0, import_fields35.checkbox)({ defaultValue: false }),
    reviewedAt: (0, import_fields35.timestamp)({ validation: { isRequired: true }, defaultValue: { kind: "now" } }),
    prescription: (0, import_fields35.relationship)({ ref: "Prescription.reviews", db: requiredRelationshipDb }),
    patient: (0, import_fields35.relationship)({ ref: "PatientProfile", db: requiredRelationshipDb }),
    pharmacist: (0, import_fields35.relationship)({ ref: "User.prescriptionReviews", db: requiredRelationshipDb }),
    approval: (0, import_fields35.relationship)({ ref: "HumanApproval.prescriptionReviews", db: requiredRelationshipDb }),
    ...trackingFields
  }
});

// features/keystone/models/PrescriptionTransfer.ts
var import_core35 = require("@keystone-6/core");
var import_fields36 = require("@keystone-6/core/fields");
var PrescriptionTransfer = (0, import_core35.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: () => false,
      update: () => false,
      delete: () => false
    },
    filter: { query: rules.canReadPrescriptionChildren, update: rules.canReadPrescriptionChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    idempotencyKey: (0, import_fields36.text)({ isIndexed: "unique" }),
    direction: (0, import_fields36.select)({
      type: "string",
      options: [
        { label: "Inbound", value: "inbound" },
        { label: "Outbound", value: "outbound" }
      ],
      validation: { isRequired: true }
    }),
    status: (0, import_fields36.select)({
      access: { update: () => false },
      type: "string",
      options: [
        { label: "Requested", value: "requested" },
        { label: "Consent recorded", value: "consent_recorded" },
        { label: "Under review", value: "under_review" },
        { label: "Accepted", value: "accepted" },
        { label: "Completed", value: "completed" },
        { label: "Rejected", value: "rejected" },
        { label: "Cancelled", value: "cancelled" }
      ],
      defaultValue: "requested"
    }),
    counterpartyName: (0, import_fields36.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    counterpartyPhone: (0, import_fields36.text)({ access: { read: permissions.canViewPatientPrivateData } }),
    requestedAt: (0, import_fields36.timestamp)({ defaultValue: { kind: "now" } }),
    completedAt: (0, import_fields36.timestamp)({ access: { update: () => false } }),
    patient: (0, import_fields36.relationship)({ ref: "PatientProfile.transfers", db: requiredRelationshipDb }),
    prescription: (0, import_fields36.relationship)({ ref: "Prescription.transfers", db: requiredRelationshipDb }),
    consent: (0, import_fields36.relationship)({ ref: "ConsentRecord.transfer" }),
    approval: (0, import_fields36.relationship)({ ref: "HumanApproval.transfers" }),
    ...trackingFields
  }
});

// features/keystone/models/Product.ts
var import_core36 = require("@keystone-6/core");
var import_fields37 = require("@keystone-6/core/fields");
var Product = (0, import_core36.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageCatalog,
      update: permissions.canManageCatalog,
      delete: permissions.canManageCatalog
    },
    filter: {
      query: ({ session }) => permissions.canManageCatalog({ session }) || permissions.canManageInventory({ session }) || permissions.canManageOrders({ session }) ? rules.canReadTenantRecords({ session }) : false,
      update: rules.canReadTenantRecords,
      delete: rules.canReadTenantRecords
    }
  },
  hooks: {
    resolveInput: {
      // An empty handle is generated from the title, made unique with a numeric suffix.
      create: async ({ resolvedData, context }) => {
        if (String(resolvedData.handle || "").trim() || !resolvedData.title) return resolvedData;
        const base = String(resolvedData.title).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "product";
        let handle = base;
        for (let suffix = 2; await context.sudo().query.Product.count({ where: { handle: { equals: handle } } }); suffix += 1) handle = `${base}-${suffix}`;
        return { ...resolvedData, handle };
      }
    },
    validate: {
      create: async ({ resolvedData, context, addValidationError }) => {
        const organizationId = resolvedData.organization?.connect?.id;
        const locationId = resolvedData.location?.connect?.id;
        if (!organizationId || !locationId) return addValidationError("Product requires organization and location relationships");
        const [location, membership] = await Promise.all([
          context.sudo().query.PharmacyLocation.findOne({ where: { id: locationId }, query: "organization { id }" }),
          context.sudo().query.OrganizationMembership.findMany({ where: { user: { id: { equals: context.session?.itemId || "" } }, organization: { id: { equals: organizationId } }, status: { equals: "active" } }, take: 1, query: "id" })
        ]);
        if (location?.organization?.id !== organizationId) addValidationError("Product location must belong to its organization");
        if (!membership.length) addValidationError("Product organization must belong to the active operator");
        if ((resolvedData.prescriptionRequirement ?? "none") !== "none" && !resolvedData.drugReference?.connect?.id) {
          addValidationError("Prescription products require a drug/NDC reference");
        }
      },
      update: async ({ resolvedData, item, context, addValidationError }) => {
        if (["organization", "location"].some((field) => resolvedData[field] !== void 0)) {
          addValidationError("Product organization and location cannot be changed");
        }
        const currentRequirement = String(item.prescriptionRequirement || "none");
        const nextRequirement = String(resolvedData.prescriptionRequirement ?? currentRequirement);
        const nextDrugReferenceId = resolvedData.drugReference === void 0 ? item.drugReferenceId : resolvedData.drugReference?.connect?.id || null;
        if (nextRequirement !== "none" && !nextDrugReferenceId) {
          addValidationError("Prescription products require a drug/NDC reference");
        }
        const safetyFieldChanged = currentRequirement !== "none" && nextRequirement === "none" || resolvedData.drugReference !== void 0 && nextDrugReferenceId !== item.drugReferenceId;
        if (safetyFieldChanged) {
          const openItems = await context.sudo().query.PrescriptionItem.count({
            where: {
              product: { id: { equals: String(item.id) } },
              prescription: { status: { notIn: ["dispensed", "fill_closed", "rejected", "cancelled"] } }
            }
          });
          if (openItems > 0) addValidationError("This product is on open prescriptions; close them before changing its prescription requirement or drug reference");
        }
        if (item.coldChainRequired === true && resolvedData.coldChainRequired === false) {
          const coldLots = await context.sudo().query.InventoryLot.count({
            where: { product: { id: { equals: String(item.id) } }, coldChainRequired: { equals: true }, quantityAvailable: { gt: 0 } }
          });
          if (coldLots > 0) addValidationError("This product has cold-chain stock on hand; it must stay cold-chain while that stock remains");
        }
      },
      delete: async ({ item, context, addValidationError }) => {
        const [lotCount, orderLineCount] = await Promise.all([
          context.prisma.inventoryLot.count({ where: { productId: String(item.id) } }),
          context.prisma.orderLineItem.count({ where: { productId: String(item.id) } })
        ]);
        if (lotCount || orderLineCount) addValidationError("Referenced products must be archived instead of deleted");
      }
    }
  },
  ui: { listView: { initialColumns: ["title", "sku", "prescriptionRequirement", "status", "onlineAvailable"] } },
  fields: {
    title: (0, import_fields37.text)({ validation: { isRequired: true } }),
    handle: (0, import_fields37.text)({ isIndexed: "unique", label: "Handle (optional)" }),
    sku: (0, import_fields37.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    description: (0, import_fields37.text)({ ui: { displayMode: "textarea" } }),
    status: (0, import_fields37.select)({
      type: "string",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" }
      ],
      defaultValue: "draft"
    }),
    category: (0, import_fields37.select)({
      type: "string",
      options: [
        { label: "Prescription", value: "prescription" },
        { label: "OTC medication", value: "otc_medication" },
        { label: "First aid", value: "first_aid" },
        { label: "Wellness", value: "wellness" },
        { label: "Personal care", value: "personal_care" },
        { label: "Medical supply", value: "medical_supply" },
        { label: "Allergy", value: "allergy" },
        { label: "Cold and flu", value: "cold_and_flu" },
        { label: "Digestive health", value: "digestive_health" },
        { label: "Vitamins and supplements", value: "vitamins" },
        { label: "Health devices", value: "health_devices" }
      ],
      defaultValue: "otc_medication"
    }),
    prescriptionRequirement: (0, import_fields37.select)({
      type: "string",
      options: [
        { label: "None", value: "none" },
        { label: "Prescription required", value: "prescription_required" },
        { label: "Pharmacist review required", value: "pharmacist_review_required" }
      ],
      defaultValue: "none"
    }),
    priceAmount: (0, import_fields37.integer)({ validation: { isRequired: true, min: 0 }, defaultValue: 0, label: "Price (cents)" }),
    currencyCode: (0, import_fields37.text)({ defaultValue: "USD", validation: { isRequired: true } }),
    taxable: (0, import_fields37.checkbox)({ defaultValue: true }),
    onlineAvailable: (0, import_fields37.checkbox)({ defaultValue: false }),
    posAvailable: (0, import_fields37.checkbox)({ defaultValue: true }),
    coldChainRequired: (0, import_fields37.checkbox)({ defaultValue: false }),
    imageUrl: (0, import_fields37.text)({ label: "Image URL", ui: { description: "External photo URL. An uploaded photo takes precedence." } }),
    image: (0, import_fields37.image)({ storage: "my_images", label: "Photo" }),
    /** The photo shoppers see: the uploaded image (signed at read time) or the external URL. */
    photoUrl: (0, import_fields37.virtual)({
      field: import_core36.graphql.field({
        type: import_core36.graphql.String,
        async resolve(item, _args, context) {
          if (item.image_id && item.image_extension) return context.images("my_images").getUrl(item.image_id, item.image_extension);
          return item.imageUrl || null;
        }
      }),
      ui: { itemView: { fieldMode: "hidden" }, listView: { fieldMode: "hidden" } }
    }),
    organization: (0, import_fields37.relationship)({ ref: "Organization.products", db: requiredRelationshipDb }),
    location: (0, import_fields37.relationship)({ ref: "PharmacyLocation.products", db: requiredRelationshipDb }),
    drugReference: (0, import_fields37.relationship)({ ref: "DrugReference.products" }),
    inventoryLots: (0, import_fields37.relationship)({ ref: "InventoryLot.product", many: true, access: immutableRelationship }),
    cartItems: (0, import_fields37.relationship)({ ref: "CartItem.product", many: true, access: immutableRelationship }),
    orderLineItems: (0, import_fields37.relationship)({ ref: "OrderLineItem.product", many: true, access: immutableRelationship }),
    prescriptionItems: (0, import_fields37.relationship)({ ref: "PrescriptionItem.product", many: true, access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/Recall.ts
var import_core37 = require("@keystone-6/core");
var import_access62 = require("@keystone-6/core/access");
var import_fields38 = require("@keystone-6/core/fields");
var Recall = (0, import_core37.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: import_access62.denyAll,
      update: import_access62.denyAll,
      delete: import_access62.denyAll
    },
    filter: { query: rules.canReadTenantRecords, update: rules.canReadTenantRecords }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  hooks: {
    validateInput: ({ operation, item, resolvedData, addValidationError }) => {
      if (operation === "create" && (!resolvedData.organization?.connect?.id || !resolvedData.lots?.connect?.length)) {
        addValidationError("Recall requires an organization and at least one affected lot");
      }
      if (operation !== "update" || !item || !resolvedData.status) return;
      try {
        assertRecallTransition(String(item.status), String(resolvedData.status));
      } catch (error) {
        addValidationError(error instanceof Error ? error.message : "Invalid recall transition");
      }
    },
    beforeOperation: ({ operation, resolvedData }) => {
      if (operation === "update" && ["recallNumber", "organization", "location", "lots", "classification", "reason", "source"].some((field) => resolvedData[field] !== void 0)) {
        throw new Error("Recall identity, scope, and affected-lot snapshot are immutable after opening");
      }
      if (operation === "delete") throw new Error("Recall lifecycle evidence cannot be deleted");
    }
  },
  ui: { hideCreate: true, listView: { initialColumns: ["recallNumber", "classification", "status", "initiatedAt"] } },
  fields: {
    recallNumber: (0, import_fields38.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    classification: (0, import_fields38.select)({
      type: "string",
      options: [
        { label: "Class I", value: "class_i" },
        { label: "Class II", value: "class_ii" },
        { label: "Class III", value: "class_iii" },
        { label: "Market withdrawal", value: "market_withdrawal" },
        { label: "Unverified", value: "unverified" }
      ],
      defaultValue: "unverified"
    }),
    status: (0, import_fields38.select)({
      type: "string",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Active", value: "active" },
        { label: "Quarantined", value: "quarantined" },
        { label: "Resolved", value: "resolved" },
        { label: "Closed", value: "closed" },
        { label: "Cancelled", value: "cancelled" }
      ],
      defaultValue: "draft"
    }),
    reason: (0, import_fields38.text)({ validation: { isRequired: true }, ui: { displayMode: "textarea" } }),
    source: (0, import_fields38.text)(),
    sourceValidationReference: (0, import_fields38.text)(),
    initiatedAt: (0, import_fields38.timestamp)({ defaultValue: { kind: "now" } }),
    closedAt: (0, import_fields38.timestamp)(),
    organization: (0, import_fields38.relationship)({ ref: "Organization.recalls", db: requiredRelationshipDb }),
    location: (0, import_fields38.relationship)({ ref: "PharmacyLocation.recalls" }),
    lots: (0, import_fields38.relationship)({ ref: "InventoryLot.recalls", many: true, db: requiredRelationshipDb }),
    exposures: (0, import_fields38.relationship)({ ref: "RecallExposure.recall", many: true }),
    approval: (0, import_fields38.relationship)({ ref: "HumanApproval.recalls" }),
    ...trackingFields
  }
});

// features/keystone/models/RecallExposure.ts
var import_core38 = require("@keystone-6/core");
var import_access64 = require("@keystone-6/core/access");
var import_fields39 = require("@keystone-6/core/fields");
var RecallExposure = (0, import_core38.list)({
  access: {
    operation: { query: isSignedIn, create: import_access64.denyAll, update: import_access64.denyAll, delete: import_access64.denyAll },
    filter: { query: rules.canReadLocationScopedPatientChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    exposureKey: (0, import_fields39.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    status: (0, import_fields39.select)({ type: "string", options: [{ label: "Outreach required", value: "outreach_required" }, { label: "Contacted", value: "contacted" }, { label: "Returned", value: "returned" }, { label: "Resolved", value: "resolved" }, { label: "Unable to reach", value: "unable_to_reach" }], defaultValue: "outreach_required" }),
    quantityDispensed: (0, import_fields39.integer)({ validation: { isRequired: true, min: 1 } }),
    contactMethod: (0, import_fields39.text)({ access: { read: permissions.canViewPatientPrivateData } }),
    outcome: (0, import_fields39.text)({ access: { read: permissions.canViewPatientPrivateData } }),
    notes: (0, import_fields39.text)({ access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: "textarea" } }),
    lastActionAt: (0, import_fields39.timestamp)(),
    resolvedAt: (0, import_fields39.timestamp)(),
    organization: (0, import_fields39.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields39.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    recall: (0, import_fields39.relationship)({ ref: "Recall.exposures", db: requiredRelationshipDb }),
    movement: (0, import_fields39.relationship)({ ref: "InventoryMovement", db: requiredRelationshipDb }),
    patient: (0, import_fields39.relationship)({ ref: "PatientProfile", db: requiredRelationshipDb }),
    prescription: (0, import_fields39.relationship)({ ref: "Prescription" }),
    order: (0, import_fields39.relationship)({ ref: "Order" }),
    lastActor: (0, import_fields39.relationship)({ ref: "User" }),
    approval: (0, import_fields39.relationship)({ ref: "HumanApproval" }),
    ...trackingFields
  }
});

// features/keystone/models/RefillRequest.ts
var import_core39 = require("@keystone-6/core");
var import_fields40 = require("@keystone-6/core/fields");
var RefillRequest = (0, import_core39.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: () => false,
      update: () => false,
      delete: () => false
    },
    filter: { query: rules.canReadPrescriptionChildren, update: rules.canReadPrescriptionChildren, delete: rules.canReadPrescriptionChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    idempotencyKey: (0, import_fields40.text)({ isIndexed: "unique" }),
    requestFingerprint: (0, import_fields40.text)({ db: { isNullable: true } }),
    openRequestKey: (0, import_fields40.text)({ isIndexed: "unique", db: { isNullable: true } }),
    status: (0, import_fields40.select)({
      access: { update: () => false },
      type: "string",
      options: [
        { label: "Requested", value: "requested" },
        { label: "Under review", value: "under_review" },
        { label: "Prescriber contacted", value: "prescriber_contacted" },
        { label: "Approved", value: "approved" },
        { label: "Fulfilled", value: "fulfilled" },
        { label: "Rejected", value: "rejected" },
        { label: "Cancelled", value: "cancelled" }
      ],
      defaultValue: "requested"
    }),
    requestNote: (0, import_fields40.text)({ access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: "textarea" } }),
    resolutionNote: (0, import_fields40.text)({ db: { isNullable: true }, access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: "textarea" } }),
    requestedAt: (0, import_fields40.timestamp)({ defaultValue: { kind: "now" } }),
    resolvedAt: (0, import_fields40.timestamp)({ access: { update: () => false } }),
    patient: (0, import_fields40.relationship)({ ref: "PatientProfile.refillRequests", db: requiredRelationshipDb }),
    prescription: (0, import_fields40.relationship)({ ref: "Prescription.refillRequests", db: requiredRelationshipDb }),
    prescriptionItem: (0, import_fields40.relationship)({ ref: "PrescriptionItem.refillRequests" }),
    location: (0, import_fields40.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    approval: (0, import_fields40.relationship)({ ref: "HumanApproval.refillRequests" }),
    ...trackingFields
  }
});

// features/keystone/models/PrescriptionRequest.ts
var import_core40 = require("@keystone-6/core");
var import_access67 = require("@keystone-6/core/access");
var import_fields41 = require("@keystone-6/core/fields");
var PrescriptionRequest = (0, import_core40.list)({
  access: { operation: { query: import_access67.denyAll, create: import_access67.denyAll, update: import_access67.denyAll, delete: import_access67.denyAll } },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { isHidden: true },
  fields: {
    idempotencyKey: (0, import_fields41.text)({ isIndexed: "unique" }),
    kind: (0, import_fields41.select)({
      type: "string",
      options: [
        { label: "Patient registration", value: "registration" },
        { label: "Transfer", value: "transfer" },
        { label: "New prescription", value: "new_prescription" },
        { label: "Refill by Rx number", value: "refill" }
      ],
      validation: { isRequired: true }
    }),
    status: (0, import_fields41.select)({
      type: "string",
      options: [
        { label: "Requested", value: "requested" },
        { label: "In review", value: "in_review" },
        { label: "Completed", value: "completed" },
        { label: "Declined", value: "declined" }
      ],
      defaultValue: "requested"
    }),
    organization: (0, import_fields41.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields41.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    user: (0, import_fields41.relationship)({ ref: "User", db: requiredRelationshipDb }),
    patient: (0, import_fields41.relationship)({ ref: "PatientProfile" }),
    firstName: (0, import_fields41.text)(),
    lastName: (0, import_fields41.text)(),
    dateOfBirth: (0, import_fields41.timestamp)(),
    phone: (0, import_fields41.text)(),
    email: (0, import_fields41.text)(),
    allergies: (0, import_fields41.text)({ ui: { displayMode: "textarea" } }),
    insurance: (0, import_fields41.text)({ ui: { displayMode: "textarea" } }),
    counterpartyName: (0, import_fields41.text)(),
    counterpartyPhone: (0, import_fields41.text)(),
    prescriberName: (0, import_fields41.text)(),
    prescriberPhone: (0, import_fields41.text)(),
    medications: (0, import_fields41.text)({ ui: { displayMode: "textarea" } }),
    note: (0, import_fields41.text)({ ui: { displayMode: "textarea" } }),
    resolutionNote: (0, import_fields41.text)({ ui: { displayMode: "textarea" } }),
    resolvedAt: (0, import_fields41.timestamp)(),
    resolvedBy: (0, import_fields41.relationship)({ ref: "User" }),
    ...trackingFields
  }
});

// features/keystone/models/Role.ts
var import_core41 = require("@keystone-6/core");
var import_fields43 = require("@keystone-6/core/fields");

// features/keystone/models/fields.ts
var import_fields42 = require("@keystone-6/core/fields");
var permission = (label) => (0, import_fields42.checkbox)({ defaultValue: false, label });
var permissionFields = {
  canAccessDashboard: permission("Access dashboard"),
  canManageOrganizations: permission("Manage organizations"),
  canManageLocations: permission("Manage pharmacy locations"),
  canManageUsers: permission("Manage users"),
  canManageRoles: permission("Manage roles"),
  canManageCatalog: permission("Manage drug and product catalog"),
  canManageInventory: permission("Manage inventory"),
  canManageRecalls: permission("Manage recalls"),
  canManagePatients: permission("Manage patients"),
  canViewPatientPrivateData: permission("View patient private data"),
  canManagePrescriptions: permission("Manage prescription workflow"),
  canReviewPrescriptions: permission("Record pharmacist reviews"),
  canDispenseMedications: permission("Record dispensing"),
  canManageOrders: permission("Manage POS and online orders"),
  canManagePayments: permission("Manage payments"),
  canManageIntegrations: permission("Manage integrations"),
  canManageOnboarding: permission("Manage onboarding"),
  canViewAuditLogs: permission("View audit logs"),
  canApproveConsequentialActions: permission("Approve consequential actions")
};
var permissionsList = Object.keys(permissionFields);

// features/keystone/models/Role.ts
var Role = (0, import_core41.list)({
  access: {
    operation: {
      query: ({ session }) => permissions.canManageRoles({ session }) || permissions.canManageUsers({ session }) || permissions.canAccessDashboard({ session }),
      create: permissions.canManageRoles,
      update: permissions.canManageRoles,
      delete: permissions.canManageRoles
    }
  },
  ui: {
    hideCreate: (args) => !permissions.canManageRoles(args),
    hideDelete: (args) => !permissions.canManageRoles(args),
    isHidden: (args) => !permissions.canManageRoles(args) && !permissions.canManageUsers(args),
    listView: { initialColumns: ["name", "canAccessDashboard", "canReviewPrescriptions", "canDispenseMedications"] }
  },
  fields: {
    name: (0, import_fields43.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    ...permissionFields,
    assignedTo: (0, import_fields43.relationship)({ ref: "User.role", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/Supplier.ts
var import_core42 = require("@keystone-6/core");
var import_access69 = require("@keystone-6/core/access");
var import_fields45 = require("@keystone-6/core/fields");
var Supplier = (0, import_core42.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageInventory,
      update: permissions.canManageInventory,
      delete: import_access69.denyAll
    },
    filter: { query: rules.canReadOrganizationRecords, update: rules.canReadOrganizationRecords }
  },
  hooks: {
    validateInput: async ({ operation, resolvedData, context, addValidationError }) => {
      if (operation === "create" && !resolvedData.organization?.connect?.id) addValidationError("Supplier requires an organization relationship");
      if (operation === "create" && resolvedData.organization?.connect?.id) {
        const membership = await context.sudo().query.OrganizationMembership.findMany({ where: { user: { id: { equals: context.session?.itemId || "" } }, organization: { id: { equals: resolvedData.organization.connect.id } }, status: { equals: "active" } }, take: 1, query: "id" });
        if (!membership.length) addValidationError("Supplier organization must belong to the active operator");
      }
      if (operation === "update" && resolvedData.organization !== void 0) addValidationError("Supplier organization is immutable");
    }
  },
  graphql: { omit: { delete: true } },
  ui: { hideDelete: true, listView: { initialColumns: ["name", "status", "organization"] } },
  fields: {
    name: (0, import_fields45.text)({ validation: { isRequired: true } }),
    accountReference: (0, import_fields45.text)(),
    status: (0, import_fields45.select)({
      type: "string",
      options: [
        { label: "Pending validation", value: "pending_validation" },
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" }
      ],
      defaultValue: "pending_validation"
    }),
    organization: (0, import_fields45.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    integrationProvider: (0, import_fields45.relationship)({ ref: "IntegrationProvider.suppliers" }),
    inventoryLots: (0, import_fields45.relationship)({ ref: "InventoryLot.supplier", many: true, access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/TemperatureExcursion.ts
var import_core43 = require("@keystone-6/core");
var import_access71 = require("@keystone-6/core/access");
var import_fields46 = require("@keystone-6/core/fields");
var TemperatureExcursion = (0, import_core43.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: import_access71.denyAll,
      update: import_access71.denyAll,
      delete: import_access71.denyAll
    },
    filter: { query: rules.canReadTenantRecords, update: rules.canReadTenantRecords, delete: rules.canReadTenantRecords }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: {
    validateInput: ({ operation, resolvedData, addValidationError }) => {
      if (operation !== "create") return;
      if (!resolvedData.organization?.connect?.id || !resolvedData.location?.connect?.id || !resolvedData.lot?.connect?.id) {
        addValidationError("Temperature excursion requires organization, location, and lot relationships");
      }
      if (resolvedData.observedMinimumC > resolvedData.observedMaximumC) addValidationError("Observed temperature range is invalid");
    },
    beforeOperation: ({ operation }) => {
      if (operation !== "create") throw new Error("Temperature excursion evidence is immutable; use a disposition operation");
    }
  },
  fields: {
    idempotencyKey: (0, import_fields46.text)({ isIndexed: "unique" }),
    observedMinimumC: (0, import_fields46.float)({ validation: { isRequired: true } }),
    observedMaximumC: (0, import_fields46.float)({ validation: { isRequired: true } }),
    startedAt: (0, import_fields46.timestamp)({ validation: { isRequired: true } }),
    endedAt: (0, import_fields46.timestamp)(),
    status: (0, import_fields46.select)({
      type: "string",
      options: [
        { label: "Open", value: "open" },
        { label: "Under review", value: "under_review" },
        { label: "Released", value: "released" },
        { label: "Destroyed", value: "destroyed" }
      ],
      defaultValue: "open"
    }),
    dispositionReason: (0, import_fields46.text)({ ui: { displayMode: "textarea" } }),
    // Written once by resolvePharmacyTemperatureExcursion: the pharmacist's note and when the excursion closed.
    resolutionNote: (0, import_fields46.text)({ ui: { displayMode: "textarea" } }),
    resolvedAt: (0, import_fields46.timestamp)(),
    organization: (0, import_fields46.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields46.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    lot: (0, import_fields46.relationship)({ ref: "InventoryLot.temperatureExcursions", db: requiredRelationshipDb }),
    reviewedBy: (0, import_fields46.relationship)({ ref: "User", db: requiredRelationshipDb }),
    approval: (0, import_fields46.relationship)({ ref: "HumanApproval.temperatureExcursions", db: requiredRelationshipDb }),
    ...trackingFields
  }
});

// features/keystone/models/User.ts
var import_core44 = require("@keystone-6/core");
var import_access74 = require("@keystone-6/core/access");
var import_fields48 = require("@keystone-6/core/fields");

// features/keystone/session-revocation.ts
function nextSessionTokenVersion(operation, resolvedPassword, currentTokenVersion) {
  if (operation !== "update" || resolvedPassword === void 0) return void 0;
  return Number(currentTokenVersion || 0) + 1;
}
function isSessionTokenVersionCurrent(sessionTokenVersion, currentTokenVersion) {
  return Number(sessionTokenVersion) === Number(currentTokenVersion || 0);
}

// features/keystone/security/user-create.ts
var canCreateUserRole = permissions.canManageUsers;
var PUBLIC_USER_CREATE_FIELDS = /* @__PURE__ */ new Set([
  "name",
  "email",
  "password",
  // createAuth merges initFirstItem.itemData into the DB API input before list
  // hooks run. Public callers cannot supply role because User.role field access
  // is enforced before resolveInput; allowing it here preserves the first admin.
  "role"
]);
function resolvePublicUserCreateData({
  inputData,
  resolvedData
}) {
  const restrictedData = { ...resolvedData };
  for (const key of Object.keys(inputData ?? {})) {
    if (!PUBLIC_USER_CREATE_FIELDS.has(key)) {
      delete restrictedData[key];
    }
  }
  return restrictedData;
}
async function firstUserAdminRoleId(context) {
  const prisma = context.sudo().prisma;
  if (await prisma.user.count() > 0) return null;
  const grants = Object.fromEntries(permissionsList.map((permission2) => [permission2, true]));
  const upserted = await prisma.role.upsert({ where: { name: "Admin" }, create: { name: "Admin", ...grants }, update: grants, select: { id: true } });
  const roleId = upserted?.id ?? (await prisma.role.findUnique({ where: { name: "Admin" }, select: { id: true } }))?.id;
  if (!roleId) throw new Error("The Admin role could not be created.");
  return String(roleId);
}

// features/keystone/models/User.ts
var User = (0, import_core44.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: () => true,
      update: isSignedIn,
      delete: import_access74.denyAll
    },
    filter: { query: rules.canReadPeople, update: rules.canUpdatePeople }
  },
  hooks: {
    resolveInput: async ({ operation, inputData, resolvedData, item, context }) => {
      let data = resolvedData;
      if (operation === "create" && !permissions.canManageUsers({ session: context.session })) {
        data = resolvePublicUserCreateData({ inputData, resolvedData });
      }
      if (operation === "create" && !data.role) {
        const adminRoleId = await firstUserAdminRoleId(context);
        if (adminRoleId) data = { ...data, role: { connect: { id: adminRoleId } } };
      }
      const nextTokenVersion = nextSessionTokenVersion(operation, data.password, item?.tokenVersion);
      return nextTokenVersion !== void 0 ? { ...data, tokenVersion: nextTokenVersion } : data;
    }
  },
  ui: {
    hideCreate: (args) => !permissions.canManageUsers(args),
    hideDelete: true,
    listView: { initialColumns: ["name", "email", "role", "onboardingStatus"] }
  },
  fields: {
    name: (0, import_fields48.text)({ validation: { isRequired: true } }),
    email: (0, import_fields48.text)({ validation: { isRequired: true }, isIndexed: "unique", access: { update: canChangeSignInEmail } }),
    password: (0, import_fields48.password)({
      validation: { isRequired: true, length: { min: 12, max: 1e3 }, rejectCommon: true },
      access: {
        read: import_access74.denyAll,
        update: canChangeOwnPassword
      }
    }),
    role: (0, import_fields48.relationship)({
      ref: "Role.assignedTo",
      access: {
        create: canCreateUserRole,
        // Role managers may change any role; user managers may assign roles to other users only.
        update: ({ session, item }) => permissions.canManageRoles({ session }) || permissions.canManageUsers({ session }) && String(item?.id) !== session?.itemId
      },
      ui: {
        itemView: { fieldMode: (args) => permissions.canManageUsers(args) ? "edit" : "read" }
      }
    }),
    tokenVersion: (0, import_fields48.integer)({ defaultValue: 0, access: { create: import_access74.denyAll, update: import_access74.denyAll }, ui: { itemView: { fieldMode: "hidden" }, createView: { fieldMode: "hidden" } } }),
    onboardingStatus: (0, import_fields48.select)({
      type: "string",
      options: [
        { label: "Not started", value: "not_started" },
        { label: "In progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
        { label: "Dismissed", value: "dismissed" }
      ],
      defaultValue: "not_started"
    }),
    memberships: (0, import_fields48.relationship)({ ref: "OrganizationMembership.user", many: true, access: immutableRelationship }),
    patientProfile: (0, import_fields48.relationship)({ ref: "PatientProfile.user", access: immutableRelationship }),
    carts: (0, import_fields48.relationship)({ ref: "Cart.customer", many: true, access: immutableRelationship }),
    orders: (0, import_fields48.relationship)({ ref: "Order.customer", many: true, access: immutableRelationship }),
    prescriptionReviews: (0, import_fields48.relationship)({ ref: "PrescriptionReview.pharmacist", many: true, access: immutableRelationship }),
    humanApprovals: (0, import_fields48.relationship)({ ref: "HumanApproval.actor", many: true, access: immutableRelationship }),
    auditEvents: (0, import_fields48.relationship)({ ref: "AuditEvent.actor", many: true, access: immutableRelationship }),
    createdMachineCredentials: (0, import_fields48.relationship)({ ref: "MachineCredential.createdBy", many: true, access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/index.ts
var models = {
  AuditEvent,
  Cart,
  CartItem,
  ClinicalSafetyReview,
  ConsentRecord,
  DispensingLabel,
  DrugReference,
  DrugReferenceReview,
  ExternalIntegrationWorkflow,
  Fulfillment,
  HumanApproval,
  IntegrationProvider,
  IntegrationWebhookEvent,
  InventoryLot,
  InventoryMovement,
  MachineCredential,
  Order,
  OrderLineItem,
  Organization,
  OrganizationMembership,
  PatientAllergy,
  PatientMedication,
  PatientProfile,
  Payment,
  PaymentProvider,
  PaymentSession,
  PaymentWebhookEvent,
  PharmacyLocation,
  Prescriber,
  Prescription,
  PrescriptionFill,
  PrescriptionFillEvent,
  PrescriptionItem,
  PrescriptionRequest,
  PrescriptionReview,
  PrescriptionTransfer,
  Product,
  Recall,
  RecallExposure,
  RefillRequest,
  Role,
  Supplier,
  TemperatureExcursion,
  User
};

// features/keystone/mutations/customerAccount.ts
var import_graphql2 = require("graphql");

// features/keystone/security/cart-token.ts
var import_node_crypto = require("node:crypto");
function createGuestCartToken() {
  return (0, import_node_crypto.randomBytes)(32).toString("base64url");
}
function hashGuestCartToken(token) {
  return (0, import_node_crypto.createHash)("sha256").update(token).digest("hex");
}
function verifyGuestCartToken(token, expectedHash) {
  const actual = Buffer.from(hashGuestCartToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && (0, import_node_crypto.timingSafeEqual)(actual, expected);
}

// features/keystone/mutations/lib/errors.ts
var import_graphql = require("graphql");
var DomainError = class extends import_graphql.GraphQLError {
  constructor(message = "Invalid request", code = "BAD_USER_INPUT") {
    super(message, { extensions: { code } });
  }
};

// features/keystone/lib/product-photo.ts
var PRODUCT_PHOTO_STORAGE = "my_images";
var PREFIX = `storage:${PRODUCT_PHOTO_STORAGE}/`;
function productPhotoSnapshot(product) {
  const id = product.image?.id;
  const extension = product.image?.extension;
  if (id && extension && /^[\w-]+$/.test(id) && /^[a-z0-9]+$/i.test(extension)) return `${PREFIX}${id}.${extension}`;
  return product.imageUrl || void 0;
}
function parsePhotoReference(value) {
  if (!value?.startsWith(PREFIX)) return null;
  const match = /^([\w-]+)\.([a-z0-9]+)$/i.exec(value.slice(PREFIX.length));
  return match ? { id: match[1], extension: match[2] } : null;
}
async function resolveLinePhoto(value, context) {
  if (!value) return null;
  const reference = parsePhotoReference(value);
  if (!reference) return value.startsWith("storage:") ? null : value;
  try {
    return await context.images(PRODUCT_PHOTO_STORAGE).getUrl(reference.id, reference.extension);
  } catch {
    return null;
  }
}

// features/keystone/mutations/getGuestPharmacyOrder.ts
async function getGuestPharmacyOrder(_root, args, context) {
  if (!args.guestOrderToken?.trim()) throw new DomainError("Guest order token is required");
  const order = await context.sudo().query.Order.findOne({
    where: { id: args.orderId },
    query: GUEST_ORDER_QUERY
  });
  if (!order?.guestTokenHash || !verifyGuestCartToken(args.guestOrderToken, order.guestTokenHash)) throw new DomainError("Guest order not found");
  return signedGuestOrderProjection(order, context);
}
async function lookupPharmacyOrder(_root, args, context) {
  const orderNumber2 = args.orderNumber?.trim().toUpperCase();
  const email = args.email?.trim().toLowerCase();
  if (!orderNumber2 || !email || orderNumber2.length > 64 || email.length > 254) return null;
  const order = await context.sudo().query.Order.findOne({ where: { orderNumber: orderNumber2 }, query: `email ${GUEST_ORDER_QUERY}` }).catch(() => null);
  if (!order?.email || order.email.trim().toLowerCase() !== email) return null;
  return signedGuestOrderProjection(order, context);
}
var GUEST_ORDER_QUERY = `
      id orderNumber guestTokenHash status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount currencyCode pickupAt deliveryWindow createdAt
      location { name timezone }
      lineItems { id title sku quantity unitPriceAmount lineTotalAmount imageUrl prescriptionRequirementSnapshot }
      fulfillment { method status readyAt handedOffAt }
    `;
async function signedGuestOrderProjection(order, context) {
  const projection = guestOrderProjection(order);
  const lines = await Promise.all(projection.lines.map(async (line) => ({ ...line, imageUrl: await resolveLinePhoto(line.imageUrl, context) })));
  return { ...projection, lines };
}
function guestOrderProjection(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    subtotalAmount: order.subtotalAmount,
    taxAmount: order.taxAmount,
    deliveryAmount: order.deliveryAmount,
    totalAmount: order.totalAmount,
    currencyCode: order.currencyCode,
    pickupAt: order.pickupAt,
    deliveryWindow: order.deliveryWindow,
    createdAt: order.createdAt,
    locationName: order.location?.name || "Pharmacy",
    locationTimezone: order.location?.timezone || "America/New_York",
    lines: (order.lineItems || []).map((line) => ({
      id: line.id,
      title: line.title,
      sku: line.sku,
      quantity: line.quantity,
      unitPriceAmount: line.unitPriceAmount,
      lineTotalAmount: line.lineTotalAmount,
      imageUrl: line.imageUrl,
      prescriptionRequirement: line.prescriptionRequirementSnapshot
    })),
    fulfillment: order.fulfillment ? {
      method: order.fulfillment.method,
      status: order.fulfillment.status,
      readyAt: order.fulfillment.readyAt,
      handedOffAt: order.fulfillment.handedOffAt
    } : null
  };
}

// features/keystone/mutations/customerAccount.ts
function userInputError(message) {
  return new import_graphql2.GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}
async function registerPharmacyCustomer(_root, args, context) {
  if (context.session?.itemId) throw userInputError("Sign out before creating another account");
  const name = args.name.trim();
  const email = args.email.trim().toLowerCase();
  if (!name || name.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw userInputError("Enter a valid name and email");
  if (args.password.length < 12) throw userInputError("Password must be at least 12 characters");
  const sudo = context.sudo();
  if (await sudo.query.User.count() === 0) throw userInputError("This store is not open for accounts yet");
  if (await sudo.query.User.count({ where: { email: { equals: email } } })) throw userInputError("An account with this email already exists. Sign in instead.");
  await sudo.query.User.createOne({ data: { name, email, password: args.password, onboardingStatus: "dismissed" }, query: "id" });
  return true;
}
async function pharmacyCustomerOrder(_root, args, context) {
  const userId = context.session?.itemId;
  if (!userId || context.session?.listKey !== "User") throw new DomainError("Authentication required");
  const [order] = await context.query.Order.findMany({ where: { id: { equals: args.orderId }, customer: { id: { equals: userId } } }, take: 1, query: "id orderNumber status totalAmount currencyCode createdAt lineItems { title quantity unitPriceAmount }" });
  if (!order) throw new DomainError("Order not found");
  return order;
}
async function pharmacyCustomerOrderDetails(_root, args, context) {
  const userId = context.session?.itemId;
  if (!userId || context.session?.listKey !== "User") throw new DomainError("Authentication required");
  const [owned] = await context.query.Order.findMany({ where: { id: { equals: args.orderId }, customer: { id: { equals: userId } } }, take: 1, query: "id" });
  if (!owned) throw new DomainError("Order not found");
  const order = await context.sudo().query.Order.findOne({ where: { id: owned.id }, query: GUEST_ORDER_QUERY });
  if (!order) throw new DomainError("Order not found");
  return signedGuestOrderProjection(order, context);
}
async function pharmacyCustomerAccount(_root, _args, context) {
  const userId = context.session?.itemId;
  if (!userId || context.session?.listKey !== "User") throw new DomainError("Authentication required");
  const user = await context.query.User.findOne({ where: { id: userId }, query: "id name" });
  if (!user) throw new DomainError("Account not found");
  const linkedPatients = await context.sudo().query.PatientProfile.count({ where: { user: { id: { equals: userId } } } });
  const orders = await context.query.Order.findMany({ where: { customer: { id: { equals: userId } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50, query: "id orderNumber status totalAmount currencyCode createdAt lineItems { title quantity unitPriceAmount }" });
  return { id: user.id, name: user.name, hasPatientProfile: linkedPatients > 0, orders };
}

// features/keystone/mutations/index.ts
var import_schema = require("@graphql-tools/schema");

// features/keystone/mutations/cashWorkflows.ts
var import_node_crypto5 = require("node:crypto");

// features/keystone/workflows/lot-eligibility.ts
var BLOCKING_RECALL_STATUSES = /* @__PURE__ */ new Set(["active", "quarantined"]);
function lotHasBlockingRecall(lot) {
  return Boolean(lot.recalls?.some((recall) => BLOCKING_RECALL_STATUSES.has(String(recall.status))));
}
function eligibleLotQuantity(lot, now = Date.now()) {
  if (lot.status !== "available") return 0;
  if (!lot.expirationDate || new Date(lot.expirationDate).getTime() <= now) return 0;
  if (lot.coldChainRequired && !lot.coldChainEvidenceComplete) return 0;
  if (lotHasBlockingRecall(lot)) return 0;
  return Math.max(0, Number(lot.quantityAvailable || 0) - Number(lot.quantityQuarantined || 0));
}
function isLotEligible(lot, now = Date.now()) {
  return eligibleLotQuantity(lot, now) > 0;
}

// features/keystone/mutations/lib/authorization.ts
async function requireTenantMembership(context, input) {
  const userId = context.session?.itemId;
  if (!userId) throw new DomainError("Authentication required");
  await context.prisma.$queryRaw`SELECT id FROM "OrganizationMembership" WHERE "user" = ${userId} AND organization = ${input.organizationId} FOR SHARE`;
  await context.prisma.$queryRaw`SELECT id FROM "Organization" WHERE id = ${input.organizationId} FOR SHARE`;
  if (input.locationId) {
    await context.prisma.$queryRaw`SELECT id FROM "PharmacyLocation" WHERE id = ${input.locationId} FOR SHARE`;
    const location = await context.sudo().query.PharmacyLocation.findOne({
      where: { id: input.locationId },
      query: "id status organization { id status }"
    });
    if (!location || location.organization?.id !== input.organizationId || location.status !== "active" || location.organization.status !== "active") {
      throw new DomainError("An active location is required");
    }
  }
  const memberships = await context.sudo().query.OrganizationMembership.findMany({
    where: {
      user: { id: { equals: userId } },
      organization: { id: { equals: input.organizationId }, status: { equals: "active" } },
      status: { equals: "active" },
      ...input.organizationWide ? { location: null } : input.locationId ? {
        OR: [
          { location: null },
          { location: { id: { equals: input.locationId }, status: { equals: "active" } } }
        ]
      } : {}
    },
    query: "id membershipRole externalCredentialValidated credentialVerificationMethod credentialType credentialJurisdiction credentialIdentifier credentialValidationReference credentialValidatedAt credentialExpiresAt credentialVerifiedBy { id } organization { id status } location { id status }"
  });
  const activeMemberships = memberships.filter(
    (membership2) => membership2.organization?.status === "active" && (!membership2.location || membership2.location.status === "active") && (!input.locationId || !membership2.location || membership2.location.id === input.locationId)
  );
  if (!activeMemberships.length) throw new DomainError("You do not have access to this pharmacy");
  const hasCurrentCredentialEvidence = (membership2) => {
    const credentialExpiresAt = membership2.credentialExpiresAt ? new Date(membership2.credentialExpiresAt).getTime() : Number.NaN;
    return ["owner", "pharmacist"].includes(membership2.membershipRole) && membership2.externalCredentialValidated === true && ["organization_recorded", "external_provider"].includes(membership2.credentialVerificationMethod || "") && Boolean(membership2.credentialType?.trim()) && Boolean(membership2.credentialJurisdiction?.trim()) && Boolean(membership2.credentialIdentifier?.trim()) && Boolean(membership2.credentialValidationReference?.trim()) && Boolean(membership2.credentialVerifiedBy?.id) && Number.isFinite(credentialExpiresAt) && credentialExpiresAt > Date.now();
  };
  const membership = input.pharmacist ? activeMemberships.find(hasCurrentCredentialEvidence) : activeMemberships.find((entry) => !entry.location) || activeMemberships[0];
  if (!membership && input.pharmacist) {
    throw new DomainError("Current organization-recorded pharmacist credential review evidence is required; the software does not validate licensure");
  }
  return { userId, membership: membership || activeMemberships[0] };
}
function requirePermission(context, permission2) {
  if (!permissions[permission2]({ session: context.session })) {
    throw new DomainError(`Permission required: ${permission2}`);
  }
}

// features/keystone/mutations/lib/evidence.ts
var import_node_crypto2 = require("node:crypto");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)])
    );
  }
  return value;
}
function evidencePayloadHash(value) {
  return (0, import_node_crypto2.createHash)("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}
async function createHumanApproval(context, input) {
  assertAuthorizedHumanApproval(input);
  return context.sudo().query.HumanApproval.createOne({
    data: {
      organization: { connect: { id: input.organizationId } },
      location: input.locationId ? { connect: { id: input.locationId } } : void 0,
      actor: { connect: { id: input.actorId } },
      actionType: input.actionType,
      reason: input.reason,
      attested: true,
      evidence: input.evidence || {}
    },
    query: "id approvedAt"
  });
}
async function recordAuditEvent(context, input) {
  return context.sudo().query.AuditEvent.createOne({
    data: {
      eventKey: input.eventKey,
      organization: { connect: { id: input.organizationId } },
      location: input.locationId ? { connect: { id: input.locationId } } : void 0,
      actor: input.actorId ? { connect: { id: input.actorId } } : void 0,
      patient: input.patientId ? { connect: { id: input.patientId } } : void 0,
      actorType: input.actorId ? "user" : "guest",
      eventType: input.eventType,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata || {}
    },
    query: "id eventKey"
  });
}
async function recordAudit(context, input) {
  const snapshotHash = evidencePayloadHash({
    eventType: input.eventType,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    organizationId: input.organizationId,
    locationId: input.locationId || null,
    actorId: input.actorId || null,
    patientId: input.patientId || null,
    data: input.metadata || {}
  });
  const sudo = context.sudo();
  const existing = await sudo.query.AuditEvent.findOne({
    where: { eventKey: input.eventKey },
    query: "id eventType resourceType resourceId metadata organization { id } location { id } actor { id } patient { id }"
  });
  if (existing) {
    const existingHash = evidencePayloadHash({
      eventType: existing.eventType,
      resourceType: existing.resourceType,
      resourceId: existing.resourceId,
      organizationId: existing.organization?.id ?? input.organizationId,
      locationId: existing.location?.id || null,
      actorId: existing.actor?.id || null,
      patientId: existing.patient?.id || null,
      data: existing.metadata || {}
    });
    if (existingHash !== snapshotHash) throw new DomainError("Evidence idempotency key was reused with a different snapshot");
    return { created: false, auditEventId: existing.id };
  }
  const audit = await recordAuditEvent(context, input);
  return { created: true, auditEventId: audit.id };
}

// features/keystone/mutations/lib/current-authority.ts
var CURRENT_ACTOR_SELECTION = `id tokenVersion role { id name ${Object.keys(permissions).join(" ")} }`;
async function assertCurrentTransactionActor(context) {
  const id = context.session?.itemId;
  if (!id) return;
  await context.prisma.$queryRaw`SELECT id FROM "User" WHERE id = ${id} FOR SHARE`;
  await context.prisma.$queryRaw`SELECT id FROM "Role" WHERE id = (SELECT role FROM "User" WHERE id = ${id}) FOR SHARE`;
  const actor = await context.sudo().query.User.findOne({ where: { id }, query: CURRENT_ACTOR_SELECTION });
  if (!actor) throw new DomainError("Current actor is unavailable");
  const session = context.session;
  if (session.tokenVersion !== void 0 && Number(session.tokenVersion) !== actor.tokenVersion) throw new DomainError("Current session was revoked");
  for (const permission2 of Object.keys(permissions)) {
    if (session.data?.role?.[permission2] === true && actor.role?.[permission2] !== true) throw new DomainError("Current operator permission was revoked");
  }
}

// features/keystone/mutations/lib/transaction.ts
function orderedLockKeys(keys) {
  return [...new Set(keys.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}
async function acquireTransactionLocks(context, keys) {
  const sudo = context.sudo();
  for (const key of orderedLockKeys(keys)) {
    await sudo.prisma.$queryRaw`SELECT 1 AS "locked" FROM pg_advisory_xact_lock(hashtext(${`pharmacy:${key}`}))`;
  }
}
var DomainConflictError = class extends DomainError {
  constructor() {
    super("The record changed while this request was running. Retry the same idempotent request.", "PHARMACY_CONFLICT");
  }
};
function isRetryableTransactionError(error) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : String(error);
  return ["P2034", "P2037"].includes(code) || /serialization|deadlock|could not serialize/i.test(message);
}
async function withDomainTransaction(context, lockKeys, operation, options = {}) {
  const retries = Math.max(0, Math.min(5, options.retries ?? 3));
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await context.transaction(async (transactionContext) => {
        await acquireTransactionLocks(transactionContext, lockKeys);
        await assertCurrentTransactionActor(transactionContext);
        return operation(transactionContext);
      }, { isolationLevel: "Serializable", maxWait: 1e4, timeout: 12e4 });
    } catch (error) {
      if (!isRetryableTransactionError(error)) throw error;
      if (attempt === retries) throw new DomainConflictError();
      await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1)));
    }
  }
  throw new DomainConflictError();
}

// features/keystone/utils/paymentProviderAdapter.ts
init_payment();
var ADAPTER_OPERATIONS = /* @__PURE__ */ new Set([
  "createPaymentFunction",
  "capturePaymentFunction",
  "refundPaymentFunction",
  "getPaymentStatusFunction",
  "generatePaymentLinkFunction",
  "handleWebhookFunction",
  "cancelPaymentFunction"
]);
var FORWARDED_HEADERS = (key) => {
  const k = key.toLowerCase();
  return k === "stripe-signature" || k === "__rawbody" || k.startsWith("paypal-");
};
function paymentAdapterPayload(provider, args) {
  const projectedProvider = { id: provider.id, code: provider.code, credentials: provider.credentials || {}, metadata: provider.metadata || {} };
  const input = { ...args };
  if (input.headers && typeof input.headers === "object") {
    input.headers = Object.fromEntries(Object.entries(input.headers).filter(([key]) => FORWARDED_HEADERS(key)));
  }
  return { ...input, provider: projectedProvider };
}
async function executeAdapterFunction({ provider, functionName, args }) {
  if (!ADAPTER_OPERATIONS.has(functionName)) throw new Error("Unknown payment adapter operation");
  const functionPath = provider?.[functionName];
  if (typeof functionPath !== "string" || !functionPath) throw new Error("Payment adapter is not configured");
  const payload = paymentAdapterPayload(provider, args);
  if (/^https:\/\//i.test(functionPath)) {
    try {
      const response = await fetch(functionPath, {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(3e4),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`status ${response.status}`);
      return await response.json();
    } catch {
      throw new Error("External payment adapter request failed; reconcile the original attempt before retrying");
    }
  }
  if (/^[a-z]+:/i.test(functionPath)) throw new Error("External payment adapters must use HTTPS");
  const loader = paymentProviderAdapters[functionPath];
  if (!loader) throw new Error("Unknown registered payment adapter");
  const adapter = await loader();
  const fn = adapter[functionName];
  if (typeof fn !== "function") throw new Error(`Function ${functionName} not found in adapter ${functionPath}`);
  try {
    return await fn(payload);
  } catch (error) {
    throw new Error(
      `Error executing ${functionName} for provider ${functionPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
async function createPayment({ provider, cart, amount, currency }) {
  return executeAdapterFunction({
    provider,
    functionName: "createPaymentFunction",
    args: { cart, amount, currency }
  });
}
async function refundPayment({ provider, paymentId, amount, currency, idempotencyKey }) {
  return executeAdapterFunction({
    provider,
    functionName: "refundPaymentFunction",
    args: { paymentId, amount, currency, idempotencyKey }
  });
}
async function getPaymentStatus({ provider, paymentId }) {
  return executeAdapterFunction({
    provider,
    functionName: "getPaymentStatusFunction",
    args: { paymentId }
  });
}
async function handleWebhook({ provider, event, headers }) {
  return executeAdapterFunction({
    provider,
    functionName: "handleWebhookFunction",
    args: { event, headers }
  });
}

// features/keystone/mutations/paymentOperations.ts
var import_node_crypto4 = require("node:crypto");

// features/keystone/security/order-token.ts
var import_node_crypto3 = require("node:crypto");
function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("A strong session secret is required for guest checkout");
  return secret;
}
function createGuestOrderToken(cartId, idempotencyKey) {
  return (0, import_node_crypto3.createHmac)("sha256", sessionSecret()).update(`pharmacy-order:${cartId}:${idempotencyKey}`).digest("base64url");
}
function verifyGuestOrderToken(cartId, idempotencyKey, token) {
  try {
    const actual = Buffer.from(token);
    const expected = Buffer.from(createGuestOrderToken(cartId, idempotencyKey));
    return actual.length === expected.length && (0, import_node_crypto3.timingSafeEqual)(actual, expected);
  } catch {
    return false;
  }
}

// features/keystone/mutations/lib/cartAccess.ts
async function loadAndAssertCartAccess(context, cartId, guestToken, options = {}) {
  const cart = await context.sudo().query.Cart.findOne({
    where: { id: cartId },
    query: `
      id status guestTokenHash expiresAt fulfillmentMethod
      subtotalAmount taxAmount deliveryAmount totalAmount
      organization { id }
      location { id onlineOrderingEnabled deliveryEnabled pickupEnabled }
      customer { id }
      items {
        id quantity unitPriceAmount
        product {
          id title sku handle status onlineAvailable prescriptionRequirement
          priceAmount currencyCode taxable imageUrl
          drugReference { ndc11 }
        }
      }
      paymentSessions { id amount status externalPaymentId reconciliationStatus data isSelected provider { id code isInstalled organization { id } } }
      order { id orderNumber idempotencyKey status totalAmount currencyCode fulfillment { status } }
    `
  });
  if (!cart || cart.status !== "active" && !(options.allowSubmitted && cart.status === "submitted")) throw new DomainError("Active cart not found");
  if (cart.expiresAt && new Date(cart.expiresAt).getTime() <= Date.now()) throw new DomainError("Cart has expired");
  const userId = context.session?.itemId;
  if (userId) {
    if (cart.customer?.id !== userId) throw new DomainError("You do not have access to this cart");
  } else {
    const validCartToken = Boolean(guestToken && !cart.customer && cart.guestTokenHash && verifyGuestCartToken(guestToken, cart.guestTokenHash));
    const validReplayToken = Boolean(
      options.allowSubmitted && cart.status === "submitted" && guestToken && cart.order?.idempotencyKey && verifyGuestOrderToken(cart.id, cart.order.idempotencyKey, guestToken)
    );
    if (!validCartToken && !validReplayToken) throw new DomainError("You do not have access to this cart");
  }
  return cart;
}

// features/keystone/mutations/paymentOperations.ts
var PAYMENT_PROVIDER_ADAPTER_FIELDS = "id code isInstalled createPaymentFunction capturePaymentFunction refundPaymentFunction getPaymentStatusFunction generatePaymentLinkFunction handleWebhookFunction";
function isManualPaymentProvider(provider) {
  return provider.createPaymentFunction === "manual";
}
function paymentProviderOption(provider) {
  return { code: provider.code, name: provider.name, payAtPickup: isManualPaymentProvider(provider) };
}
function paymentSessionResult(session) {
  return {
    id: session.id,
    amount: session.amount,
    currencyCode: session.currencyCode,
    status: session.status,
    providerCode: session.provider?.code || "",
    providerName: session.provider?.name || "Payment provider",
    clientSecret: typeof session.data?.clientSecret === "string" ? session.data.clientSecret : null
  };
}
function normalizeStatus(status) {
  if (["succeeded", "captured"].includes(status || "")) return "captured";
  if (["requires_action", "requires_payment_method", "requires_confirmation"].includes(status || "")) return "requires_action";
  if (status === "failed") return "failed";
  return "pending";
}
async function activePharmacyPaymentProviders(_root, args, context) {
  const location = await context.sudo().query.PharmacyLocation.findOne({ where: { id: args.locationId }, query: "id organization { id } onlineOrderingEnabled" });
  if (!location) return [];
  if (!location.onlineOrderingEnabled) {
    if (!permissions.canManageOrders({ session: context.session })) return [];
    await requireTenantMembership(context, { organizationId: location.organization.id, locationId: location.id });
  }
  const providers = await context.sudo().query.PaymentProvider.findMany({
    where: { organization: { id: { equals: location.organization.id } }, isInstalled: { equals: true } },
    query: "name code createPaymentFunction"
  });
  return providers.map(paymentProviderOption);
}
async function refundPharmacyPayment(_root, args, context) {
  if (!permissions.canManagePayments({ session: context.session })) throw new DomainError("Permission required: canManagePayments");
  if (!args.attested || args.reason.trim().length < 3) throw new DomainError("A refund reason and human confirmation are required");
  const prepared = await withDomainTransaction(context, [`payment:${args.paymentId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const payment = await sudo.query.Payment.findOne({
      where: { id: args.paymentId },
      query: `id status amount currencyCode externalPaymentId data order { id orderNumber organization { id } location { id } } provider { ${PAYMENT_PROVIDER_ADAPTER_FIELDS} }`
    });
    if (!payment?.order || !payment.provider) throw new DomainError("Payment not found");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: payment.order.organization.id, locationId: payment.order.location.id });
    if (payment.status === "refunded") return { reused: true, payment, userId };
    if (!["captured", "refund_pending"].includes(payment.status) || !payment.externalPaymentId) throw new DomainError("Only captured payments can be refunded");
    if (payment.status === "captured") {
      await sudo.query.Payment.updateOne({ where: { id: payment.id }, data: { status: "refund_pending", data: { ...payment.data || {}, refundReason: args.reason.trim() } } });
    }
    return { reused: false, payment, userId };
  });
  if (prepared.reused) return { success: true, reused: true, paymentId: prepared.payment.id, status: "refunded", amount: prepared.payment.amount };
  const providerResult = await refundPayment({
    provider: prepared.payment.provider,
    paymentId: prepared.payment.externalPaymentId,
    amount: prepared.payment.amount,
    currency: prepared.payment.currencyCode,
    idempotencyKey: `refund:${prepared.payment.id}`
  });
  if (!["refunded", "succeeded"].includes(providerResult.status)) throw new DomainError(`Refund remains pending: ${providerResult.status || "unknown"}`);
  return withDomainTransaction(context, [`payment:${args.paymentId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const current = await sudo.query.Payment.findOne({ where: { id: args.paymentId }, query: "id status amount order { id organization { id } location { id } }" });
    if (!current?.order) throw new DomainError("Payment not found");
    if (current.status === "refunded") return { success: true, reused: true, paymentId: current.id, status: current.status, amount: current.amount };
    await sudo.query.Payment.updateOne({ where: { id: current.id }, data: { status: "refunded", data: { refund: providerResult, reason: args.reason.trim() } } });
    await recordAudit(transactionContext, {
      eventKey: `payment.refunded:${current.id}`,
      organizationId: current.order.organization.id,
      locationId: current.order.location.id,
      actorId: prepared.userId,
      eventType: "payment.refunded",
      resourceType: "Payment",
      resourceId: current.id,
      metadata: { orderId: current.order.id, amount: current.amount, reason: args.reason.trim() }
    });
    return { success: true, reused: false, paymentId: current.id, status: "refunded", amount: current.amount };
  });
}
async function initiatePharmacyPaymentSession(_root, args, context) {
  const cart = await loadAndAssertCartAccess(context, args.cartId, args.guestToken);
  if (!cart.items.length || cart.totalAmount < 1) throw new DomainError("Cart is empty");
  const provider = (await context.sudo().query.PaymentProvider.findMany({
    where: { code: { equals: args.providerCode }, organization: { id: { equals: cart.organization.id } } },
    take: 1,
    query: `${PAYMENT_PROVIDER_ADAPTER_FIELDS} organization { id }`
  }))[0];
  if (!provider?.isInstalled) throw new DomainError("Payment provider is not available for this cart");
  const idempotencyKey = (0, import_node_crypto4.createHash)("sha256").update(`${cart.id}:${provider.id}:${cart.totalAmount}`).digest("hex");
  const prepared = await withDomainTransaction(context, [`cart:${cart.id}`, `payment-session:${idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.PaymentSession.findOne({ where: { idempotencyKey }, query: "id amount currencyCode status externalPaymentId data provider { code name }" });
    if (existing?.externalPaymentId) return existing;
    const current = await loadAndAssertCartAccess(transactionContext, cart.id, args.guestToken);
    for (const session of current.paymentSessions.filter((entry) => entry.isSelected)) {
      await sudo.query.PaymentSession.updateOne({ where: { id: session.id }, data: { isSelected: false } });
    }
    if (existing) {
      await sudo.query.PaymentSession.updateOne({ where: { id: existing.id }, data: { isSelected: true } });
      return existing;
    }
    return sudo.query.PaymentSession.createOne({
      data: {
        amount: current.totalAmount,
        currencyCode: current.items[0]?.product?.currencyCode || "USD",
        status: "pending",
        reconciliationStatus: "pending",
        isSelected: true,
        idempotencyKey,
        organization: { connect: { id: current.organization.id } },
        location: { connect: { id: current.location.id } },
        cart: { connect: { id: current.id } },
        provider: { connect: { id: provider.id } }
      },
      query: "id amount currencyCode status externalPaymentId data provider { code name }"
    });
  });
  if (prepared.externalPaymentId) return paymentSessionResult(prepared);
  let providerData;
  try {
    providerData = await createPayment({ provider, cart: { id: cart.id }, amount: cart.totalAmount, currency: prepared.currencyCode });
  } catch (error) {
    await withDomainTransaction(context, [`payment-session:${prepared.id}`], async (transactionContext) => {
      await transactionContext.sudo().query.PaymentSession.updateOne({
        where: { id: prepared.id },
        data: { status: "failed", reconciliationStatus: "manual_review", failureReason: error instanceof Error ? error.message.slice(0, 1e3) : "Provider initiation failed" }
      });
    });
    throw error;
  }
  const externalPaymentId = providerData?.paymentIntentId || providerData?.orderId || (isManualPaymentProvider(provider) ? `manual:${prepared.id}` : null);
  if (!externalPaymentId) throw new DomainError("Payment provider did not return a payment reference");
  return withDomainTransaction(context, [`payment-session:${prepared.id}`], async (transactionContext) => {
    const session = await transactionContext.sudo().query.PaymentSession.updateOne({
      where: { id: prepared.id },
      data: {
        status: normalizeStatus(providerData.status),
        externalPaymentId,
        data: providerData,
        reconciliationStatus: "pending",
        lastReconciledAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      query: "id amount currencyCode status externalPaymentId data provider { code name }"
    });
    return paymentSessionResult(session);
  });
}

// features/keystone/mutations/counterCard.ts
function counterCardReference(scope, idempotencyKey) {
  return `${scope}:${idempotencyKey}`;
}
async function counterCardProvider(context, organizationId) {
  const [provider] = await context.sudo().query.PaymentProvider.findMany({
    where: { organization: { id: { equals: organizationId } }, isInstalled: { equals: true }, createPaymentFunction: { equals: "stripe" } },
    take: 1,
    query: `${PAYMENT_PROVIDER_ADAPTER_FIELDS} name`
  });
  if (!provider) throw new DomainError("Card payments need Stripe installed under Payment providers");
  return provider;
}
async function openCounterCardIntent(context, input) {
  if (!Number.isInteger(input.amount) || input.amount < 50) throw new DomainError("Card payments must be at least $0.50");
  const provider = await counterCardProvider(context, input.organizationId);
  const result = await createPayment({ provider, cart: { id: counterCardReference(input.scope, input.idempotencyKey) }, amount: input.amount, currency: input.currencyCode });
  if (!result?.clientSecret || !result?.paymentIntentId) throw new DomainError("Stripe did not open a card payment");
  return { clientSecret: result.clientSecret, paymentIntentId: result.paymentIntentId, amount: input.amount, currencyCode: input.currencyCode };
}
async function verifyCounterCardIntent(context, input) {
  if (!/^pi_[A-Za-z0-9]+$/.test(input.paymentIntentId || "")) throw new DomainError("Card payment reference is invalid");
  const provider = await counterCardProvider(context, input.organizationId);
  const status = await getPaymentStatus({ provider, paymentId: input.paymentIntentId });
  const intent = status?.data || {};
  if (intent.metadata?.cartId !== counterCardReference(input.scope, input.idempotencyKey)) throw new DomainError("Card payment belongs to a different sale");
  if (status.status !== "succeeded") throw new DomainError(status.status === "processing" ? "The card payment is still processing. Retry in a moment." : "The card has not been charged yet");
  const card = intent.payment_method_details?.card || intent.latest_charge?.payment_method_details?.card || null;
  return { providerId: provider.id, paymentIntentId: input.paymentIntentId, amount: Number(status.amount), currencyCode: String(status.currency || "").toUpperCase(), last4: card?.last4 || null, brand: card?.brand || null };
}
function assertCounterCardCovers(card, totalAmount, currencyCode) {
  if (card.amount !== totalAmount || card.currencyCode !== currencyCode.toUpperCase()) {
    throw new DomainError("The card was charged a different amount than this sale. The charge will be refunded; start the sale again.");
  }
}
async function refundRefusedCounterCard(context, card, error, committed) {
  if (!card || error instanceof DomainConflictError) return error;
  if (await committed().catch(() => true)) return error;
  const message = error instanceof Error ? error.message : "The sale could not be recorded";
  try {
    const provider = await context.sudo().query.PaymentProvider.findOne({ where: { id: card.providerId }, query: PAYMENT_PROVIDER_ADAPTER_FIELDS });
    await refundPayment({ provider, paymentId: card.paymentIntentId, amount: card.amount, currency: card.currencyCode, idempotencyKey: `counter-card-void:${card.paymentIntentId}` });
    return new DomainError(`${message}. The card charge was refunded.`);
  } catch {
    return new DomainError(`${message}. The card was charged and the automatic refund failed: refund ${card.paymentIntentId} in Stripe.`);
  }
}

// features/keystone/mutations/cashWorkflows.ts
async function recordPharmacyCashPolicy(_root, args, context) {
  requirePermission(context, "canManagePayments");
  requirePermission(context, "canApproveConsequentialActions");
  if (!Number.isInteger(args.taxRateBps) || args.taxRateBps < 0 || args.taxRateBps > 1e4) throw new DomainError("Tax rate must be integer basis points between 0 and 10000");
  if (!args.policyReference?.trim()) throw new DomainError("Cash/tax policy source reference is required");
  return withDomainTransaction(context, [`cash-policy:${args.organizationId}`], async (transactionContext) => {
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: args.organizationId });
    const approval = await createHumanApproval(transactionContext, { organizationId: args.organizationId, actorId: userId, actionType: "cash_policy", reason: args.reason, attested: args.attested, evidence: { taxRateBps: args.taxRateBps, policyReference: args.policyReference.trim(), scope: "operator_attested_cash_direct_pay" } });
    await transactionContext.sudo().query.Organization.updateOne({ where: { id: args.organizationId }, data: { cashSalesEnabled: true, cashTaxRateBps: args.taxRateBps, cashTaxPolicyReference: args.policyReference.trim(), cashPolicyReviewedAt: (/* @__PURE__ */ new Date()).toISOString(), cashPolicyReviewedBy: { connect: { id: userId } } }, query: "id" });
    await recordAudit(transactionContext, { eventKey: `cash_policy.recorded:${args.organizationId}:${approval.id}`, organizationId: args.organizationId, actorId: userId, eventType: "cash_policy.recorded", resourceType: "Organization", resourceId: args.organizationId, metadata: { taxRateBps: args.taxRateBps, policyReference: args.policyReference.trim(), approvalId: approval.id } });
    return { success: true, organizationId: args.organizationId, status: "enabled", taxRateBps: args.taxRateBps, approvalId: approval.id };
  });
}
async function readCommittedPosReceipt(sudo, orderId, reused) {
  const order = await sudo.query.Order.findOne({
    where: { id: orderId },
    query: "id orderNumber status createdAt subtotalAmount taxAmount totalAmount currencyCode lineItems(orderBy: { createdAt: asc }) { title sku quantity unitPriceAmount lineTotalAmount } payments { id status amount currencyCode tenderMethod cashReceivedAmount changeDueAmount externalPaymentId }"
  });
  const payment = order?.payments?.find((entry) => entry.tenderMethod === "cash" || entry.tenderMethod === "provider");
  const card = payment?.tenderMethod === "provider";
  const lineSubtotal = (order?.lineItems || []).reduce((sum, line) => sum + line.lineTotalAmount, 0);
  const tenderEvidenceOk = card ? !!payment.externalPaymentId : payment && payment.cashReceivedAmount != null && payment.changeDueAmount != null && payment.cashReceivedAmount >= payment.amount && payment.changeDueAmount === payment.cashReceivedAmount - payment.amount;
  if (!order || !payment || !["captured", "refunded"].includes(payment.status) || payment.amount !== order.totalAmount || payment.currencyCode !== order.currencyCode || !tenderEvidenceOk || lineSubtotal !== order.subtotalAmount || order.subtotalAmount + order.taxAmount !== order.totalAmount) {
    throw new DomainError("Committed POS receipt evidence is incomplete or inconsistent; do not submit a new sale");
  }
  return {
    success: true,
    reused,
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    recordedAt: order.createdAt,
    lines: (order.lineItems || []).map((line) => ({ title: line.title, sku: line.sku || "", quantity: line.quantity, unitPriceAmount: line.unitPriceAmount, lineTotalAmount: line.lineTotalAmount })),
    subtotalAmount: order.subtotalAmount,
    taxAmount: order.taxAmount,
    totalAmount: order.totalAmount,
    currencyCode: order.currencyCode,
    paymentId: payment.id,
    paymentStatus: payment.status,
    tenderMethod: card ? "card" : "cash",
    cashReceivedAmount: card ? payment.amount : payment.cashReceivedAmount,
    changeDueAmount: card ? 0 : payment.changeDueAmount
  };
}
function posSaleTotals(pricedItems, taxRateBps) {
  const subtotalAmount = pricedItems.reduce((sum, entry) => sum + entry.product.priceAmount * entry.quantity, 0);
  const taxableSubtotalAmount = calculateTaxableSubtotal(pricedItems.map((entry) => ({ unitPriceAmount: entry.product.priceAmount, quantity: entry.quantity, taxable: entry.product.taxable })));
  const taxAmount = calculateTaxAmount(taxableSubtotalAmount, taxRateBps);
  return { subtotalAmount, taxableSubtotalAmount, taxAmount, totalAmount: subtotalAmount + taxAmount };
}
async function openPharmacyPosCardPayment(_root, args, context) {
  requirePermission(context, "canManageOrders");
  requirePermission(context, "canManagePayments");
  if (!args.idempotencyKey?.trim() || args.idempotencyKey.length > 200) throw new DomainError("A request key is required");
  const items = (args.items || []).filter((entry) => entry?.productId && Number.isInteger(entry.quantity) && entry.quantity > 0 && entry.quantity <= 99);
  if (!items.length || items.length > 50 || items.length !== args.items.length) throw new DomainError("POS order must contain 1-50 valid line items");
  const sudo = context.sudo();
  const location = await sudo.query.PharmacyLocation.findOne({ where: { id: args.locationId }, query: "id status organization { id cashSalesEnabled cashTaxRateBps cashTaxPolicyReference cashPolicyReviewedAt }" });
  if (!location || location.status !== "active") throw new DomainError("POS location not found");
  await requireTenantMembership(context, { organizationId: location.organization.id, locationId: location.id });
  if (location.organization.cashSalesEnabled !== true || !location.organization.cashTaxPolicyReference?.trim() || !location.organization.cashPolicyReviewedAt) throw new DomainError("Operator-attested cash and tax policy must be configured before POS sales");
  const products = await sudo.query.Product.findMany({ where: { id: { in: items.map((entry) => entry.productId) } }, take: 50, query: "id priceAmount currencyCode taxable status posAvailable prescriptionRequirement organization { id } location { id }" });
  if (products.length !== items.length || products.some((product) => product.organization?.id !== location.organization.id || product.location?.id !== location.id || product.status !== "published" || product.posAvailable !== true || product.prescriptionRequirement !== "none")) throw new DomainError("Every POS item must be an available OTC product in this tenant location");
  const currencies = [...new Set(products.map((product) => product.currencyCode))];
  if (currencies.length !== 1) throw new DomainError("POS order currency mismatch");
  const { totalAmount } = posSaleTotals(items.map((entry) => ({ ...entry, product: products.find((product) => product.id === entry.productId) })), location.organization.cashTaxRateBps || 0);
  return openCounterCardIntent(context, { organizationId: location.organization.id, scope: "pos", idempotencyKey: args.idempotencyKey, amount: totalAmount, currencyCode: currencies[0] });
}
async function pharmacyPosCustomers(_root, args, context) {
  requirePermission(context, "canManageOrders");
  const location = await context.sudo().query.PharmacyLocation.findOne({ where: { id: args.locationId }, query: "id organization { id }" });
  if (!location) throw new DomainError("Location not found");
  await requireTenantMembership(context, { organizationId: location.organization.id, locationId: location.id });
  const carts = await context.sudo().query.Cart.findMany({ where: { organization: { id: { equals: location.organization.id } }, location: { id: { equals: location.id } }, status: { equals: "active" }, expiresAt: { gt: (/* @__PURE__ */ new Date()).toISOString() }, customer: { role: null }, items: { some: { quantity: { gt: 0 } } } }, orderBy: { createdAt: "desc" }, take: 100, query: "id customer { id name }" });
  const seen = /* @__PURE__ */ new Set();
  return carts.filter((cart) => {
    if (!cart.customer?.id || seen.has(cart.customer.id)) return false;
    seen.add(cart.customer.id);
    return true;
  }).map((cart) => ({ id: cart.id, label: `${cart.customer.name} \xB7 ${cart.id.slice(-6)}`, scopeId: location.id }));
}
async function submitPharmacyPosCashOrder(_root, args, context) {
  requirePermission(context, "canManageOrders");
  requirePermission(context, "canManagePayments");
  requirePermission(context, "canManageInventory");
  if (args.tenderMethod && !["cash", "card"].includes(args.tenderMethod)) throw new DomainError("Tender must be cash or card");
  let card = null;
  if (args.tenderMethod === "card") {
    if (!args.idempotencyKey?.trim() || args.idempotencyKey.length > 200) throw new DomainError("A request key is required");
    const scope = await context.sudo().query.PharmacyLocation.findOne({ where: { id: args.locationId }, query: "id organization { id }" });
    if (!scope) throw new DomainError("POS location not found");
    await requireTenantMembership(context, { organizationId: scope.organization.id, locationId: scope.id });
    card = await verifyCounterCardIntent(context, { organizationId: scope.organization.id, scope: "pos", idempotencyKey: args.idempotencyKey, paymentIntentId: args.paymentIntentId || "" });
  }
  try {
    return await recordPosSale(args, context, card);
  } catch (error) {
    throw await refundRefusedCounterCard(context, card, error, async () => !!await context.sudo().query.Order.findOne({ where: { idempotencyKey: `pos-cash:${args.idempotencyKey}` }, query: "id" }));
  }
}
async function recordPosSale(args, context, card) {
  const method = args.fulfillmentMethod || "pos";
  if (!["pos", "pickup"].includes(method)) throw new DomainError("Cash fulfillment method is invalid");
  const items = (args.items || []).filter((entry) => entry?.productId && Number.isInteger(entry.quantity) && entry.quantity > 0 && entry.quantity <= 99);
  if (!items.length || items.length > 50 || items.length !== args.items.length) throw new DomainError("POS order must contain 1-50 valid line items");
  if (!args.idempotencyKey?.trim() || args.idempotencyKey.length > 200) throw new DomainError("A request key is required");
  const requestFingerprint = (0, import_node_crypto5.createHash)("sha256").update(JSON.stringify({ locationId: args.locationId, ...args.customerCartId ? { customerCartId: args.customerCartId } : {}, ...method === "pickup" ? { fulfillmentMethod: method } : {}, items: [...items].sort((left, right) => left.productId.localeCompare(right.productId)), ...card ? { tender: "card", paymentIntentId: card.paymentIntentId } : { cashReceivedAmount: args.cashReceivedAmount }, reason: args.reason?.trim(), attested: args.attested })).digest("hex");
  return withDomainTransaction(context, [`pos-cash:${args.idempotencyKey}`, ...args.customerCartId ? [`cart:${args.customerCartId}`] : [], ...items.map((entry) => `product:${entry.productId}`)], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.Order.findOne({ where: { idempotencyKey: `pos-cash:${args.idempotencyKey}` }, query: "id orderNumber status totalAmount currencyCode checkoutEvidence payments { id status } organization { id } location { id }" });
    if (existing) {
      if (!existing.organization?.id || !existing.location?.id) throw new DomainError("POS replay scope is incomplete; operator reconciliation is required");
      await requireTenantMembership(transactionContext, { organizationId: existing.organization.id, locationId: existing.location.id });
      if (existing.checkoutEvidence?.requestFingerprint !== requestFingerprint) throw new DomainError("POS idempotency key was reused with different input");
      return readCommittedPosReceipt(sudo, existing.id, true);
    }
    const location = await sudo.query.PharmacyLocation.findOne({ where: { id: args.locationId }, query: "id name status pickupEnabled organization { id cashSalesEnabled cashTaxRateBps cashTaxPolicyReference cashPolicyReviewedAt }" });
    if (!location || location.status !== "active") throw new DomainError("POS location not found");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: location.organization.id, locationId: location.id });
    if (method === "pickup" && location.pickupEnabled !== true) throw new DomainError("Pickup is unavailable at this location");
    let customerId;
    if (args.customerCartId) {
      const cart = await sudo.query.Cart.findOne({ where: { id: args.customerCartId }, query: "id status expiresAt organization { id } location { id } customer { id role { id } } items(take: 1) { id }" });
      if (!cart || cart.organization?.id !== location.organization.id || cart.location?.id !== location.id || cart.status !== "active" || !cart.expiresAt || new Date(cart.expiresAt).getTime() <= Date.now() || !cart.customer?.id || cart.customer.role || !cart.items.length) throw new DomainError("Customer cart is not available in this tenant location");
      customerId = cart.customer.id;
    }
    if (location.organization.cashSalesEnabled !== true || !location.organization.cashTaxPolicyReference?.trim() || !location.organization.cashPolicyReviewedAt) throw new DomainError("Operator-attested cash and tax policy must be configured before POS sales");
    const productIds = [...new Set(items.map((entry) => entry.productId))];
    if (productIds.length !== items.length) throw new DomainError("Combine duplicate POS product lines before submission");
    let products = await sudo.query.Product.findMany({ where: { id: { in: productIds } }, take: 50, query: "id title sku imageUrl image { id extension } priceAmount currencyCode taxable status posAvailable prescriptionRequirement organization { id } location { id } drugReference { ndc11 } inventoryLots(orderBy: { expirationDate: asc }, take: 100) { id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }" });
    if (products.length !== items.length || products.some((product) => product.organization?.id !== location.organization.id || product.location?.id !== location.id || product.status !== "published" || product.posAvailable !== true || product.prescriptionRequirement !== "none")) throw new DomainError("Every POS item must be an available OTC product in this tenant location");
    await acquireTransactionLocks(transactionContext, products.flatMap((product) => product.inventoryLots.map((lot) => `lot:${lot.id}`)));
    products = await sudo.query.Product.findMany({ where: { id: { in: productIds } }, take: 50, query: "id title sku imageUrl image { id extension } priceAmount currencyCode taxable status posAvailable prescriptionRequirement organization { id } location { id } drugReference { ndc11 } inventoryLots(orderBy: { expirationDate: asc }, take: 100) { id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }" });
    const currencies = [...new Set(products.map((product) => product.currencyCode))];
    if (currencies.length !== 1) throw new DomainError("POS order currency mismatch");
    const pricedItems = items.map((entry) => ({ ...entry, product: products.find((product) => product.id === entry.productId) }));
    const { subtotalAmount, taxableSubtotalAmount, taxAmount, totalAmount } = posSaleTotals(pricedItems, location.organization.cashTaxRateBps || 0);
    if (card) assertCounterCardCovers(card, totalAmount, currencies[0]);
    const tender = card ? { cashReceivedAmount: totalAmount, changeDueAmount: 0 } : assertCashTender(totalAmount, args.cashReceivedAmount);
    const workflow = card ? "otc_pos_card" : "operator_attested_otc_pos_cash";
    const approval = await createHumanApproval(transactionContext, { organizationId: location.organization.id, locationId: location.id, actorId: userId, actionType: card ? "card_tender" : "cash_tender", reason: args.reason, attested: args.attested, evidence: { workflow, subtotalAmount, taxableSubtotalAmount, taxAmount, totalAmount, ...card ? { paymentIntentId: card.paymentIntentId } : { cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount }, taxRateBps: location.organization.cashTaxRateBps || 0, providerSettlementClaimed: !!card } });
    const suffix = (0, import_node_crypto5.createHash)("sha256").update(args.idempotencyKey).digest("hex").slice(0, 12).toUpperCase();
    const order = await sudo.query.Order.createOne({ data: { orderNumber: `POS-${suffix}`, idempotencyKey: `pos-cash:${args.idempotencyKey}`, checkoutEvidence: { workflow, customerCartId: args.customerCartId || null, customerId: customerId || null, approvalId: approval.id, requestFingerprint, taxRateBps: location.organization.cashTaxRateBps || 0, taxableSubtotalAmount, taxAmount, providerSettlementClaimed: !!card }, status: method === "pickup" ? "processing" : "completed", fulfillmentMethod: method, subtotalAmount, taxAmount, deliveryAmount: 0, totalAmount, currencyCode: currencies[0], customer: customerId ? { connect: { id: customerId } } : void 0, organization: { connect: { id: location.organization.id } }, location: { connect: { id: location.id } }, approval: { connect: { id: approval.id } } }, query: "id orderNumber status" });
    for (const entry of items) {
      const product = products.find((candidate) => candidate.id === entry.productId);
      let remaining = entry.quantity;
      const allocations = [];
      for (const lot of product.inventoryLots.filter((candidate) => candidate.location?.id === location.id && isLotEligible(candidate))) {
        if (remaining === 0) break;
        const quantity = Math.min(remaining, eligibleLotQuantity(lot));
        if (quantity < 1) continue;
        allocations.push({ lotId: lot.id, lotNumber: lot.lotNumber, quantity, expirationDate: lot.expirationDate });
        remaining -= quantity;
      }
      if (remaining > 0) throw new DomainError(`Insufficient eligible inventory for ${product.title}`);
      await sudo.query.OrderLineItem.createOne({ data: { title: product.title, sku: product.sku, ndc11Snapshot: product.drugReference?.ndc11 || void 0, quantity: entry.quantity, unitPriceAmount: product.priceAmount, lineTotalAmount: product.priceAmount * entry.quantity, imageUrl: productPhotoSnapshot(product), prescriptionRequirementSnapshot: "none", metadata: { taxable: product.taxable !== false, taxableAmount: product.taxable === false ? 0 : product.priceAmount * entry.quantity }, lotAllocationSnapshot: allocations, order: { connect: { id: order.id } }, product: { connect: { id: product.id } } } });
      for (const allocation of allocations) {
        const lot = product.inventoryLots.find((candidate) => candidate.id === allocation.lotId);
        const nextQuantity = lot.quantityAvailable - allocation.quantity;
        await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { quantityAvailable: nextQuantity, ...nextQuantity === 0 ? { status: "depleted" } : {} } });
        await sudo.query.InventoryMovement.createOne({ data: { movementType: "sale", quantityDelta: -allocation.quantity, reason: args.reason, idempotencyKey: `pos:${args.idempotencyKey}:${product.id}:${lot.id}`, organization: { connect: { id: location.organization.id } }, location: { connect: { id: location.id } }, product: { connect: { id: product.id } }, lot: { connect: { id: lot.id } }, actor: { connect: { id: userId } }, order: { connect: { id: order.id } }, approval: { connect: { id: approval.id } } } });
      }
    }
    const payment = await sudo.query.Payment.createOne({ data: { amount: totalAmount, currencyCode: currencies[0], status: "captured", ...card ? { tenderMethod: "provider", externalPaymentId: card.paymentIntentId, provider: { connect: { id: card.providerId } }, data: { evidenceType: "stripe_payment_intent_succeeded", approvalId: approval.id, providerSettlementClaimed: true, brand: card.brand, last4: card.last4 } } : { tenderMethod: "cash", cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount, data: { evidenceType: "operator_attested_cash_received", approvalId: approval.id, providerSettlementClaimed: false } }, processedAt: (/* @__PURE__ */ new Date()).toISOString(), organization: { connect: { id: location.organization.id } }, location: { connect: { id: location.id } }, order: { connect: { id: order.id } }, recordedBy: { connect: { id: userId } }, approval: { connect: { id: approval.id } } }, query: "id status" });
    await sudo.query.Fulfillment.createOne({ data: { method, status: method === "pickup" ? "preparing" : "handed_off", ...method === "pos" ? { readyAt: (/* @__PURE__ */ new Date()).toISOString(), handedOffAt: (/* @__PURE__ */ new Date()).toISOString() } : {}, organization: { connect: { id: location.organization.id } }, location: { connect: { id: location.id } }, order: { connect: { id: order.id } }, assignedTo: { connect: { id: userId } } } });
    await recordAudit(transactionContext, { eventKey: `pos.${card ? "card" : "cash"}_sale:${args.idempotencyKey}`, organizationId: location.organization.id, locationId: location.id, actorId: userId, eventType: card ? "pos.card_sale_recorded" : "pos.cash_sale_recorded", resourceType: "Order", resourceId: order.id, metadata: { paymentId: payment.id, lineCount: items.length, subtotalAmount, taxableSubtotalAmount, taxAmount, totalAmount, approvalId: approval.id, providerSettlementClaimed: !!card } });
    return readCommittedPosReceipt(sudo, order.id, false);
  });
}
async function pharmacyPosCashReceipt(_root, args, context) {
  requirePermission(context, "canManageOrders");
  requirePermission(context, "canManagePayments");
  if (!args.idempotencyKey?.trim() || args.idempotencyKey.length > 200) throw new DomainError("A request key is required");
  const sudo = context.sudo();
  const order = await sudo.query.Order.findOne({
    where: { idempotencyKey: `pos-cash:${args.idempotencyKey}` },
    query: "id organization { id } location { id }"
  });
  if (!order) return null;
  if (!order.organization?.id || !order.location?.id) throw new DomainError("POS receipt scope is incomplete; operator reconciliation is required");
  await requireTenantMembership(context, { organizationId: order.organization.id, locationId: order.location.id });
  return readCommittedPosReceipt(sudo, order.id, true);
}
async function refundPharmacyCashPayment(_root, args, context) {
  requirePermission(context, "canManagePayments");
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  const requestFingerprint = (0, import_node_crypto5.createHash)("sha256").update(JSON.stringify({ paymentId: args.paymentId, cashReturnedAmount: args.cashReturnedAmount, reason: args.reason?.trim(), attested: args.attested })).digest("hex");
  return withDomainTransaction(context, [`payment:${args.paymentId}`, `cash-refund:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const payment = await sudo.query.Payment.findOne({ where: { id: args.paymentId }, query: "id amount status tenderMethod data organization { id } location { id } order { id patient { id } } approval { id }" });
    if (!payment || payment.tenderMethod !== "cash") throw new DomainError("Cash payment not found");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: payment.organization.id, locationId: payment.location?.id });
    const eventKey = `payment.cash_refunded:${args.idempotencyKey}`;
    const existing = await sudo.query.AuditEvent.findOne({ where: { eventKey }, query: "id resourceId metadata" });
    if (existing) {
      if (existing.resourceId !== payment.id || existing.metadata?.requestFingerprint !== requestFingerprint) throw new DomainError("Cash refund idempotency key was reused with different input");
      return { success: true, reused: true, paymentId: payment.id, status: "refunded", amount: payment.amount };
    }
    if (payment.status === "refunded") throw new DomainError("Cash payment was already refunded under a different request");
    if (payment.status !== "captured" || args.cashReturnedAmount !== payment.amount) throw new DomainError("Bounded cash refunds must return the exact captured amount");
    const approval = await createHumanApproval(transactionContext, { organizationId: payment.organization.id, locationId: payment.location?.id, actorId: userId, actionType: "cash_refund", reason: args.reason, attested: args.attested, evidence: { paymentId: payment.id, cashReturnedAmount: args.cashReturnedAmount, inventoryRestocked: false, custodyClaim: false } });
    await transactionContext.prisma.payment.update({ where: { id: payment.id }, data: { status: "refunded", data: { ...payment.data || {}, cashRefund: { returnedAmount: args.cashReturnedAmount, returnedAt: (/* @__PURE__ */ new Date()).toISOString(), actorId: userId, approvalId: approval.id, inventoryRestocked: false } }, approvalId: approval.id } });
    await recordAudit(transactionContext, { eventKey, organizationId: payment.organization.id, locationId: payment.location?.id, actorId: userId, patientId: payment.order?.patient?.id, eventType: "payment.cash_refunded", resourceType: "Payment", resourceId: payment.id, metadata: { orderId: payment.order?.id, amount: payment.amount, approvalId: approval.id, requestFingerprint, inventoryRestocked: false } });
    return { success: true, reused: false, paymentId: payment.id, status: "refunded", amount: payment.amount };
  });
}

// features/keystone/mutations/publicQueries.ts
var import_node_crypto6 = require("node:crypto");
var PUBLIC_CATALOG_SEARCH_LIMIT = 100;
var PUBLIC_CATALOG_CURSOR_LIMIT = 2048;
function normalizePublicCatalogSearch(search) {
  if (search == null) return null;
  if (typeof search !== "string") throw new DomainError("Catalog search is invalid");
  const normalized = search.trim();
  if (!normalized) return null;
  if (normalized.length > PUBLIC_CATALOG_SEARCH_LIMIT || /[\u0000-\u001f\u007f]/u.test(normalized)) {
    throw new DomainError("Catalog search is invalid");
  }
  return normalized;
}
function publicCatalogPageSize(first) {
  if (first == null) return 50;
  if (!Number.isInteger(first) || first < 1) throw new DomainError("Catalog page size must be a positive integer");
  return Math.min(first, 100);
}
function decodePublicCatalogCursor(cursor, expectedScope) {
  if (cursor == null) return null;
  if (typeof cursor !== "string" || cursor.length > PUBLIC_CATALOG_CURSOR_LIMIT) throw new DomainError("Catalog cursor is invalid");
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof value?.title !== "string" || value.title.length > 1e3 || typeof value?.id !== "string" || !value.id || value.id.length > 256 || value.scope !== expectedScope) throw new DomainError();
    return { title: value.title, id: value.id };
  } catch {
    throw new DomainError("Catalog cursor is invalid");
  }
}
function encodePublicCatalogCursor(record2, scope) {
  return Buffer.from(JSON.stringify({ ...record2, scope })).toString("base64url");
}
function publicCatalogCursorWhere(where, cursor) {
  if (!cursor) return where;
  return {
    AND: [where, {
      OR: [
        { title: { gt: cursor.title } },
        { AND: [{ title: { equals: cursor.title } }, { id: { gt: cursor.id } }] }
      ]
    }]
  };
}
function normalizePublicLocationSearch(search) {
  if (search == null) return null;
  if (typeof search !== "string") throw new DomainError("Location search is invalid");
  const normalized = search.trim();
  if (!normalized) return null;
  if (normalized.length > PUBLIC_CATALOG_SEARCH_LIMIT || /[\u0000-\u001f\u007f]/u.test(normalized)) {
    throw new DomainError("Location search is invalid");
  }
  return normalized;
}
function publicLocationPageSize(first) {
  if (first == null) return 50;
  if (!Number.isInteger(first) || first < 1) throw new DomainError("Location page size must be a positive integer");
  return Math.min(first, 100);
}
function decodePublicLocationCursor(cursor, expectedScope) {
  if (cursor == null) return null;
  if (typeof cursor !== "string" || cursor.length > PUBLIC_CATALOG_CURSOR_LIMIT) throw new DomainError("Location cursor is invalid");
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof value?.name !== "string" || value.name.length > 1e3 || typeof value?.id !== "string" || !value.id || value.id.length > 256 || value.scope !== expectedScope) throw new DomainError();
    return { name: value.name, id: value.id };
  } catch {
    throw new DomainError("Location cursor is invalid");
  }
}
function encodePublicLocationCursor(record2, scope) {
  return Buffer.from(JSON.stringify({ ...record2, scope })).toString("base64url");
}
function publicLocationCursorWhere(where, cursor) {
  if (!cursor) return where;
  return {
    AND: [where, {
      OR: [
        { name: { gt: cursor.name } },
        { AND: [{ name: { equals: cursor.name } }, { id: { gt: cursor.id } }] }
      ]
    }]
  };
}
var PUBLIC_TENANT_QUERY = "id storefrontKey storefrontHost operatorDisplayName operatorTagline brandPrimaryColor brandAccentColor brandLogoUrl logoIcon logoColor storefrontHeroUrl supportEmail supportPhone privacyNotice";
function optionalTenantKey(tenantKey) {
  if (!tenantKey?.trim()) return null;
  try {
    return normalizeStorefrontTenantKey(tenantKey);
  } catch {
    return null;
  }
}
async function loadPublicTenant(context, tenantKey) {
  const key = optionalTenantKey(tenantKey);
  const sudo = context.sudo();
  if (key) {
    const matches = await sudo.query.Organization.findMany({
      where: {
        status: { equals: "active" },
        OR: [
          { storefrontKey: { equals: key } },
          { storefrontHost: { equals: key } },
          { slug: { equals: key } }
        ]
      },
      take: 2,
      query: PUBLIC_TENANT_QUERY
    });
    if (matches.length === 1) return matches[0];
  }
  const active = await sudo.query.Organization.findMany({
    where: { status: { equals: "active" } },
    orderBy: [{ createdAt: "asc" }],
    take: 2,
    query: PUBLIC_TENANT_QUERY
  });
  if (active.length === 1) return active[0];
  throw new DomainError(active.length ? "Store not found" : "Store is not set up yet");
}
async function publicPharmacyTenant(_root, args, context) {
  const search = normalizePublicLocationSearch(args.search);
  const pageSize = publicLocationPageSize(args.first);
  const organization = await loadPublicTenant(context, args.tenantKey);
  const baseWhere = {
    organization: { id: { equals: organization.id } },
    status: { equals: "active" },
    OR: [{ pickupEnabled: { equals: true } }, { deliveryEnabled: { equals: true } }]
  };
  if (search) {
    baseWhere.AND = [{ OR: [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } }
    ] }];
  }
  const cursorScope = (0, import_node_crypto6.createHash)("sha256").update(JSON.stringify({
    locations: "public-pharmacy",
    organizationId: organization.id,
    search,
    status: "active"
  })).digest("base64url");
  const cursor = decodePublicLocationCursor(args.after, cursorScope);
  const sudo = context.sudo();
  const [totalCount, records] = await Promise.all([
    sudo.query.PharmacyLocation.count({ where: baseWhere }),
    sudo.query.PharmacyLocation.findMany({
      where: publicLocationCursorWhere(baseWhere, cursor),
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: pageSize + 1,
      query: "id name code status address phone timezone hours onlineOrderingEnabled pickupEnabled deliveryEnabled"
    })
  ]);
  const hasMore = records.length > pageSize;
  const pageRecords = records.slice(0, pageSize);
  const locations = pageRecords.map((location) => ({
    id: location.id,
    name: location.name,
    code: location.code,
    address: location.address,
    phone: location.phone,
    timezone: location.timezone || "America/New_York",
    hours: normalizeWeeklyHours(location.hours),
    onlineOrderingEnabled: location.onlineOrderingEnabled === true,
    pickupEnabled: location.pickupEnabled === true,
    deliveryEnabled: location.deliveryEnabled === true
  }));
  const lastLocation = pageRecords.at(-1);
  return {
    brand: operatorBrandFromOrganization(organization),
    locations,
    locationsTotalCount: totalCount,
    hasMoreLocations: hasMore,
    nextLocationCursor: hasMore && lastLocation ? encodePublicLocationCursor({ name: lastLocation.name, id: lastLocation.id }, cursorScope) : null
  };
}
async function publicPharmacyLocations(root, args, context) {
  return (await publicPharmacyTenant(root, args, context)).locations;
}
var PUBLIC_CATALOG_CATEGORIES = ["otc_medication", "first_aid", "wellness", "personal_care", "medical_supply", "allergy", "cold_and_flu", "digestive_health", "vitamins", "health_devices"];
function normalizePublicCatalogCategory(value) {
  if (value == null || value === "") return null;
  if (!PUBLIC_CATALOG_CATEGORIES.includes(value)) throw new DomainError("Category is not available");
  return value;
}
async function publicPharmacyCategories(_root, args, context) {
  const organization = await loadPublicTenant(context, args.tenantKey);
  const products = await context.sudo().query.Product.findMany({
    where: { organization: { id: { equals: organization.id } }, location: { id: { equals: args.locationId }, status: { equals: "active" } }, status: { equals: "published" }, onlineAvailable: { equals: true }, prescriptionRequirement: { equals: "none" } },
    take: 2e3,
    query: "category"
  });
  const counts = /* @__PURE__ */ new Map();
  for (const product of products) if (PUBLIC_CATALOG_CATEGORIES.includes(product.category)) counts.set(product.category, (counts.get(product.category) || 0) + 1);
  return PUBLIC_CATALOG_CATEGORIES.filter((value) => counts.has(value)).map((value) => ({ value, count: counts.get(value) || 0 }));
}
async function publicPharmacyCatalog(_root, args, context) {
  const organization = await loadPublicTenant(context, args.tenantKey);
  const category = normalizePublicCatalogCategory(args.category);
  const location = (await context.sudo().query.PharmacyLocation.findMany({
    take: 1,
    where: {
      id: { equals: args.locationId },
      organization: { id: { equals: organization.id } },
      status: { equals: "active" }
    },
    query: "id status pickupEnabled deliveryEnabled"
  }))[0];
  if (!location || location.status !== "active" || location.pickupEnabled !== true && location.deliveryEnabled !== true) {
    throw new DomainError("This location is not available");
  }
  const search = normalizePublicCatalogSearch(args.search);
  const pageSize = publicCatalogPageSize(args.first);
  const baseWhere = {
    organization: { id: { equals: organization.id } },
    location: { id: { equals: args.locationId } },
    status: { equals: "published" },
    onlineAvailable: { equals: true },
    prescriptionRequirement: { equals: "none" },
    ...category ? { category: { equals: category } } : {}
  };
  if (search) {
    baseWhere.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { category: { equals: search.toLowerCase().replaceAll(" ", "_") } }
    ];
  }
  const cursorScope = (0, import_node_crypto6.createHash)("sha256").update(JSON.stringify({
    catalog: "public-pharmacy",
    organizationId: organization.id,
    locationId: args.locationId,
    search,
    category,
    status: "published",
    onlineAvailable: true,
    prescriptionRequirement: "none"
  })).digest("base64url");
  const cursor = decodePublicCatalogCursor(args.after, cursorScope);
  const sudo = context.sudo();
  const [totalCount, records] = await Promise.all([
    sudo.query.Product.count({ where: baseWhere }),
    sudo.query.Product.findMany({
      where: publicCatalogCursorWhere(baseWhere, cursor),
      orderBy: [{ title: "asc" }, { id: "asc" }],
      take: pageSize + 1,
      query: "id title handle sku description category priceAmount currencyCode taxable imageUrl: photoUrl prescriptionRequirement inventoryLots(where: { quantityAvailable: { gt: 0 } }, orderBy: { expirationDate: asc }, take: 101) { status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }"
    })
  ]);
  const hasMore = records.length > pageSize;
  const pageRecords = records.slice(0, pageSize);
  const items = pageRecords.map((record2) => {
    const lots = (record2.inventoryLots || []).filter((lot) => lot.location?.id === args.locationId);
    const availableQuantity = lots.reduce((sum, lot) => sum + eligibleLotQuantity(lot), 0);
    return {
      id: record2.id,
      title: record2.title,
      handle: record2.handle,
      sku: record2.sku,
      description: record2.description,
      category: record2.category,
      priceAmount: record2.priceAmount,
      currencyCode: record2.currencyCode,
      taxable: record2.taxable,
      imageUrl: record2.imageUrl,
      prescriptionRequirement: record2.prescriptionRequirement,
      availableQuantity,
      inStock: availableQuantity > 0,
      inventorySummaryStatus: (record2.inventoryLots?.length || 0) <= 100 ? "verified" : "not_verified"
    };
  });
  const lastRecord = pageRecords.at(-1);
  return {
    items,
    totalCount,
    hasMore,
    nextCursor: hasMore && lastRecord ? encodePublicCatalogCursor({ title: lastRecord.title, id: lastRecord.id }, cursorScope) : null
  };
}
async function pharmacyOperationalSummary(_root, _args, context) {
  if (!isSignedIn({ session: context.session })) throw new DomainError("Authentication required");
  const sudo = context.sudo();
  const memberships = await sudo.query.OrganizationMembership.findMany({
    where: { user: { id: { equals: context.session.itemId } }, status: { equals: "active" } },
    query: "organization { id locations { id } } location { id }"
  });
  const organizationIds = [...new Set(memberships.map((membership) => membership.organization?.id).filter(Boolean))];
  const locationIds = [...new Set(memberships.flatMap((membership) => membership.location?.id ? [membership.location.id] : membership.organization?.locations?.map((location) => location.id) || []))];
  if (!organizationIds.length) return { pendingReview: 0, readyToDispense: 0, activeRecalls: 0, expiringLots: 0, processingOrders: 0 };
  const [pendingReview, readyToDispense, activeRecalls, expiringLots, processingOrders] = await Promise.all([
    sudo.query.Prescription.count({ where: { organization: { id: { in: organizationIds } }, status: { equals: "pending_review" } } }),
    sudo.query.Prescription.count({ where: { organization: { id: { in: organizationIds } }, status: { equals: "ready_to_dispense" } } }),
    sudo.query.Recall.count({ where: { organization: { id: { in: organizationIds } }, status: { in: ["active", "quarantined"] } } }),
    sudo.query.InventoryLot.count({ where: { location: { id: { in: locationIds } }, expirationDate: { lte: new Date(Date.now() + 60 * 864e5).toISOString() }, status: { equals: "available" } } }),
    sudo.query.Order.count({ where: { organization: { id: { in: organizationIds } }, status: { in: ["pending", "processing", "ready"] } } })
  ]);
  return { pendingReview, readyToDispense, activeRecalls, expiringLots, processingOrders };
}

// features/keystone/mutations/cartOperations.ts
var CART_QUERY = `
  id status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount expiresAt
  organization { id name }
  location { id name pickupEnabled deliveryEnabled }
  customer { id }
  items {
    id quantity unitPriceAmount
    product { id title handle sku description category priceAmount currencyCode imageUrl: photoUrl prescriptionRequirement }
  }
`;
async function cartResponse(context, cartId) {
  return context.sudo().query.Cart.findOne({ where: { id: cartId }, query: CART_QUERY });
}
async function createPharmacyCart(_root, args, context) {
  const location = await context.sudo().query.PharmacyLocation.findOne({
    where: { id: args.locationId },
    query: "id status onlineOrderingEnabled pickupEnabled deliveryEnabled organization { id slug storefrontKey storefrontHost }"
  });
  const staffPos = permissions.canManageOrders({ session: context.session });
  if (!location || location.status !== "active" || !location.onlineOrderingEnabled && !staffPos) throw new DomainError("Location is not accepting orders");
  if (staffPos) await requireTenantMembership(context, { organizationId: location.organization.id, locationId: location.id });
  if (!staffPos) {
    const organization = await loadPublicTenant(context, args.tenantKey);
    if (organization.id !== location.organization.id) throw new DomainError("This location is not available");
    if (location.pickupEnabled !== true && location.deliveryEnabled !== true) throw new DomainError("Location is not accepting orders");
  }
  const guestToken = context.session?.itemId ? null : createGuestCartToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString();
  const cart = await context.sudo().query.Cart.createOne({
    data: {
      organization: { connect: { id: location.organization.id } },
      location: { connect: { id: location.id } },
      customer: context.session?.itemId ? { connect: { id: context.session.itemId } } : void 0,
      guestTokenHash: guestToken ? hashGuestCartToken(guestToken) : void 0,
      expiresAt
    },
    query: CART_QUERY
  });
  return { cart, guestToken };
}
async function pharmacyCart(_root, args, context) {
  const cart = await loadAndAssertCartAccess(context, args.cartId, args.guestToken);
  return cartResponse(context, cart.id);
}
async function addPharmacyCartItem(_root, args, context) {
  if (!Number.isInteger(args.quantity) || args.quantity < 1 || args.quantity > 99) throw new DomainError("Quantity must be between 1 and 99");
  return withDomainTransaction(context, [`cart:${args.cartId}`], async (transactionContext) => {
    const cart = await loadAndAssertCartAccess(transactionContext, args.cartId, args.guestToken);
    const product = await transactionContext.sudo().query.Product.findOne({
      where: { id: args.productId },
      query: "id status onlineAvailable prescriptionRequirement priceAmount location { id } inventoryLots { status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }"
    });
    if (!product || product.location?.id !== cart.location.id) throw new DomainError("Product is not available at this location");
    assertProductCanEnterPublicCart(product);
    const existing = cart.items.find((item) => item.product?.id === product.id);
    const requestedQuantity = (existing?.quantity || 0) + args.quantity;
    const availableQuantity = (product.inventoryLots || []).filter((lot) => lot.location?.id === cart.location.id).reduce((sum, lot) => sum + eligibleLotQuantity(lot), 0);
    if (requestedQuantity > availableQuantity) throw new DomainError("Requested quantity is not available from eligible inventory");
    if (existing) {
      const quantity = requestedQuantity;
      if (quantity > 99) throw new DomainError("Quantity must be between 1 and 99");
      await transactionContext.sudo().query.CartItem.updateOne({ where: { id: existing.id }, data: { quantity } });
    } else {
      await transactionContext.sudo().query.CartItem.createOne({
        data: {
          cart: { connect: { id: cart.id } },
          product: { connect: { id: product.id } },
          quantity: args.quantity
        }
      });
    }
    return cartResponse(transactionContext, cart.id);
  });
}
async function updatePharmacyCartItem(_root, args, context) {
  const item = await context.sudo().query.CartItem.findOne({ where: { id: args.cartItemId }, query: "id cart { id }" });
  if (!item?.cart) throw new DomainError("Cart item not found");
  if (!Number.isInteger(args.quantity) || args.quantity < 0 || args.quantity > 99) throw new DomainError("Quantity must be between 0 and 99");
  return withDomainTransaction(context, [`cart:${item.cart.id}`], async (transactionContext) => {
    const cart = await loadAndAssertCartAccess(transactionContext, item.cart.id, args.guestToken);
    const current = await transactionContext.sudo().query.CartItem.findOne({ where: { id: args.cartItemId }, query: "id cart { id } product { inventoryLots { status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } } }" });
    if (!current || current.cart?.id !== cart.id) throw new DomainError("Cart item not found");
    if (args.quantity > 0) {
      const availableQuantity = (current.product?.inventoryLots || []).filter((lot) => lot.location?.id === cart.location.id).reduce((sum, lot) => sum + eligibleLotQuantity(lot), 0);
      if (args.quantity > availableQuantity) throw new DomainError("Requested quantity is not available from eligible inventory");
    }
    if (args.quantity === 0) await transactionContext.sudo().query.CartItem.deleteOne({ where: { id: current.id } });
    else await transactionContext.sudo().query.CartItem.updateOne({ where: { id: current.id }, data: { quantity: args.quantity } });
    return cartResponse(transactionContext, cart.id);
  });
}
async function removePharmacyCartItem(root, args, context) {
  return updatePharmacyCartItem(root, { ...args, quantity: 0 }, context);
}

// features/keystone/mutations/clinicalWorkflows.ts
var import_node_crypto8 = require("node:crypto");

// features/keystone/workflows/clinical-safety.ts
function assertDrugReferenceEligibleForBoundedDispensing(input) {
  if (input.sourceVerified !== true || input.marketingStatus !== "active" || input.controlledSchedule !== "none") {
    throw new Error("A current operator-reviewed, active, non-controlled drug reference is required");
  }
  if (!input.sourceName?.trim() || !input.sourceVersion?.trim() || !input.sourceReference?.trim() || !input.reviewedAt || Number.isNaN(new Date(input.reviewedAt).getTime())) {
    throw new Error("Drug reference provenance evidence is incomplete");
  }
}
function isHumanSafetyReviewStale(input, expectedFillNumber, latestEvidenceChange) {
  if (!input || input.fillNumber !== expectedFillNumber || !["clear", "override"].includes(input.outcome || "") || !input.reviewedAt || !latestEvidenceChange) return false;
  const reviewedAt = new Date(input.reviewedAt).getTime();
  const evidenceChangedAt = new Date(latestEvidenceChange).getTime();
  return Number.isFinite(reviewedAt) && Number.isFinite(evidenceChangedAt) && evidenceChangedAt > reviewedAt;
}
function assertCurrentHumanSafetyReview(input, expectedFillNumber, latestPatientRecordChange) {
  if (!input || input.fillNumber !== expectedFillNumber || !["clear", "override"].includes(input.outcome || "")) throw new Error("A current human clinical safety review is required for this fill");
  for (const [name, value] of Object.entries({
    allergies: input.allergiesReviewed,
    medicationHistory: input.medicationHistoryReviewed,
    interactions: input.interactionsReviewed,
    duplicateTherapy: input.duplicateTherapyReviewed,
    contraindications: input.contraindicationsReviewed,
    dose: input.doseReviewed,
    counselingPlan: input.counselingPlanReviewed
  })) {
    if (value !== true) throw new Error(`${name} review evidence is incomplete`);
  }
  if (!input.reviewReference?.trim() || !input.reviewedAt || Number.isNaN(new Date(input.reviewedAt).getTime())) throw new Error("Clinical safety review source evidence is incomplete");
  if (input.outcome === "override" && (!input.overrideReason || input.overrideReason.trim().length < 8)) throw new Error("A meaningful human override reason is required");
  if (latestPatientRecordChange && new Date(latestPatientRecordChange).getTime() > new Date(input.reviewedAt).getTime()) {
    throw new Error("Patient identity, allergy, or medication history changed after the safety review");
  }
}
function assertPrescriptionItemProductIdentity(input) {
  const reviewedDrugReferenceId = input.drugReference?.id;
  const productDrugReferenceId = input.product?.drugReference?.id;
  if (!input.product?.id || !reviewedDrugReferenceId || !productDrugReferenceId || reviewedDrugReferenceId !== productDrugReferenceId) {
    throw new Error("Prescription product identity does not match the drug reference reviewed at intake; dispensing is blocked");
  }
}
function currentFillNumber(item) {
  if (Number.isSafeInteger(item.activeFillNumber) && Number(item.activeFillNumber) > 0) return Number(item.activeFillNumber);
  return 1 + Math.max(0, Number(item.refillsAuthorized || 0) - Number(item.refillsRemaining || 0));
}

// features/keystone/workflows/fill-entitlement.ts
var import_node_crypto7 = require("node:crypto");

// features/keystone/workflows/fill-price.ts
function fillPricePortion(price, authorized, alreadyDispensed, quantity) {
  if (![price, authorized, alreadyDispensed, quantity].every(Number.isSafeInteger) || price < 0 || authorized < 1 || alreadyDispensed < 0 || quantity < 1 || alreadyDispensed + quantity > authorized) throw new Error("Fill price allocation is invalid");
  return Number(BigInt(price) * BigInt(alreadyDispensed + quantity) / BigInt(authorized) - BigInt(price) * BigInt(alreadyDispensed) / BigInt(authorized));
}

// features/keystone/workflows/fill-entitlement.ts
var FILL_LINEAGE = "per_fill_v1";
function fillHash(value) {
  const canonical = (v) => Array.isArray(v) ? v.map(canonical) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])])) : v ?? null;
  return (0, import_node_crypto7.createHash)("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}
function parseFillPolicy(value) {
  if (!value || typeof value.version !== "string" || !value.version.trim() || value.version.length > 100 || typeof value.reference !== "string" || !value.reference.trim() || value.reference.length > 1e3 || value.consumeOn !== "first_dispense" || typeof value.allowPartial !== "boolean" || !Number.isSafeInteger(value.reservationMinutes) || value.reservationMinutes < 1 || value.reservationMinutes > 525600 || !Array.isArray(value.releaseReasons) || !value.releaseReasons.length || value.releaseReasons.some((r) => !["cancelled", "no_pickup", "expired"].includes(r))) {
    throw new Error("Versioned pharmacist-reviewed fill policy is required; no clinical policy is inferred");
  }
  return {
    version: value.version.trim(),
    reference: value.reference.trim(),
    consumeOn: "first_dispense",
    allowPartial: value.allowPartial,
    reservationMinutes: value.reservationMinutes,
    releaseReasons: [...new Set(value.releaseReasons)]
  };
}
function prescriptionItemVersion(p2, item) {
  return fillHash({
    prescriptionId: p2.id,
    organizationId: p2.organization?.id,
    locationId: p2.location?.id,
    patientId: p2.patient?.id,
    prescriberId: p2.prescriber?.id,
    itemId: item.id,
    productId: item.product?.id,
    drugReferenceId: item.drugReference?.id,
    medicationName: item.medicationNameSnapshot,
    sig: item.sig,
    quantity: item.quantityPrescribed,
    daysSupply: item.daysSupply,
    refillsAuthorized: item.refillsAuthorized,
    substitutionAllowed: item.substitutionAllowed
  });
}
function prescriptionAuthorityVersion(p2) {
  return fillHash({
    sourceVerificationStatus: p2.sourceVerificationStatus,
    writtenAt: p2.writtenAt,
    expiresAt: p2.expiresAt,
    prescriber: p2.prescriber,
    patient: {
      id: p2.patient?.id,
      identityVerificationStatus: p2.patient?.identityVerificationStatus,
      identityReference: p2.patient?.identityReference,
      identityVerifiedAt: p2.patient?.identityVerifiedAt,
      identityVerifiedBy: p2.patient?.identityVerifiedBy
    }
  });
}
function assertFillConservation(f) {
  for (const v of [f.version, f.authorizedQuantity, f.quantityDispensed, f.quantityReleased]) {
    if (!Number.isSafeInteger(v) || v < 0 || v > 2147483647) throw new Error("Fill counters require reconciliation");
  }
  if (f.authorizedQuantity < 1 || f.version < 1 || f.version >= 2147483647 || f.quantityDispensed + f.quantityReleased > f.authorizedQuantity) throw new Error("Fill quantity conservation violated");
  if (!["original", "refill"].includes(f.kind) || !["reserved", "consumed", "released"].includes(f.creditState)) throw new Error("Fill entitlement evidence is invalid");
  if (f.quantityDispensed > 0 !== (f.creditState === "consumed")) throw new Error("Dispensed quantity must retain exactly one consumed entitlement");
  if (!["requested", "approved", "partially_dispensed", "ready", "dispensed", "released"].includes(f.status) || f.creditState === "released" && f.status !== "released") throw new Error("Fill lifecycle evidence is invalid");
  if (["requested", "approved"].includes(f.status) && (f.quantityDispensed !== 0 || f.quantityReleased !== 0 || f.creditState !== "reserved")) throw new Error("Unconsumed reservation evidence is invalid");
  if (f.status === "partially_dispensed" && (f.quantityDispensed < 1 || f.quantityDispensed >= f.authorizedQuantity || f.quantityReleased !== 0)) throw new Error("Partial fill evidence is invalid");
  if (["ready", "dispensed"].includes(f.status) && (f.quantityDispensed !== f.authorizedQuantity || f.quantityReleased !== 0)) throw new Error("Completed fill evidence is invalid");
  if (["ready", "dispensed", "released"].includes(f.status) && f.quantityDispensed + f.quantityReleased !== f.authorizedQuantity) throw new Error("Closed fill must account for every authorized unit");
}
function dispenseFillPlan(f, expectedVersion, quantity, now = Date.now(), hold = false) {
  assertFillConservation(f);
  if (f.version !== expectedVersion) throw new Error("Fill version changed; refresh the workbench");
  if (!["approved", "partially_dispensed"].includes(f.status)) throw new Error("Fill is not approved for dispensing");
  const expiry = new Date(f.expiresAt).getTime();
  if (!Number.isFinite(expiry) || expiry <= now) throw new Error("Fill reservation expired; record an authorized release");
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > f.authorizedQuantity - f.quantityDispensed - f.quantityReleased) throw new Error("Quantity exceeds this fill reservation");
  const policy = parseFillPolicy(f.policySnapshot);
  if (!policy.allowPartial && quantity !== f.authorizedQuantity - f.quantityDispensed) throw new Error("Partial dispensing is not admitted by the recorded fill policy");
  const quantityDispensed = f.quantityDispensed + quantity;
  if (hold && (f.quantityDispensed !== 0 || quantityDispensed !== f.authorizedQuantity)) throw new Error("Will-call holds one complete fill; partial fills are handed off directly");
  return {
    quantityDispensed,
    creditState: "consumed",
    version: f.version + 1,
    status: hold ? "ready" : quantityDispensed === f.authorizedQuantity ? "dispensed" : "partially_dispensed",
    debitRefill: f.kind === "refill" && f.creditState === "reserved"
  };
}
function releaseFillPlan(f, expectedVersion, cause, now = Date.now()) {
  assertFillConservation(f);
  if (f.version !== expectedVersion) throw new Error("Fill version changed; refresh the workbench");
  if (f.status === "ready") throw new Error("A filled will-call fill is returned to stock, not released");
  if (!["requested", "approved", "partially_dispensed"].includes(f.status)) throw new Error("Fill is already closed");
  if (!parseFillPolicy(f.policySnapshot).releaseReasons.includes(cause)) throw new Error("Release reason is not admitted by the recorded fill policy");
  if (cause === "expired" && (!Number.isFinite(new Date(f.expiresAt).getTime()) || new Date(f.expiresAt).getTime() > now)) throw new Error("Reservation has not expired");
  return {
    status: "released",
    version: f.version + 1,
    quantityReleased: f.authorizedQuantity - f.quantityDispensed,
    creditState: f.creditState === "consumed" ? "consumed" : "released",
    releaseRefill: f.kind === "refill" && f.creditState === "reserved"
  };
}
function pickupFillPlan(f, expectedVersion) {
  assertFillConservation(f);
  if (f.version !== expectedVersion) throw new Error("Fill version changed; refresh the workbench");
  if (f.status !== "ready") throw new Error("Only a filled will-call fill can be picked up");
  return { status: "dispensed", version: f.version + 1 };
}
function returnToStockPlan(f, expectedVersion, cause, alreadyReturned = false, now = Date.now()) {
  assertFillConservation(f);
  if (alreadyReturned && f.status === "released") return { noop: true };
  if (f.status === "dispensed") throw new Error("Picked-up fills cannot be returned to stock");
  if (f.status !== "ready") throw new Error("Only a filled will-call fill can be returned to stock");
  if (f.version !== expectedVersion) throw new Error("Fill version changed; refresh the workbench");
  const unconsumed = { ...f, status: "approved", quantityDispensed: 0, creditState: "reserved" };
  const release = releaseFillPlan(unconsumed, f.version, cause, now);
  return { noop: false, unitsRestocked: f.quantityDispensed, restoreRefill: f.kind === "refill", release, data: { quantityDispensed: 0 } };
}

// features/keystone/workflows/prescription-eligibility.ts
function isValidNpi(value) {
  if (!/^\d{10}$/.test(value || "")) return false;
  const digits = `80840${value}`.split("").map(Number);
  const check = digits.pop();
  let sum = 0;
  for (let index = digits.length - 1, double = true; index >= 0; index -= 1, double = !double) {
    let digit = digits[index] * (double ? 2 : 1);
    if (digit > 9) digit -= 9;
    sum += digit;
  }
  return (10 - sum % 10) % 10 === check;
}
function assertPrescriptionClinicallyEligible(input, now = Date.now()) {
  if (input.sourceVerificationStatus !== "human_verified") throw new DomainError("Prescription source must be verified by an authorized human");
  if (!input.writtenAt || new Date(input.writtenAt).getTime() > now) throw new DomainError("Prescription written date is invalid");
  if (!input.expiresAt || new Date(input.expiresAt).getTime() <= now) throw new DomainError("Prescription is expired");
  const prescriber = input.prescriber;
  const credentialExpiry = prescriber?.credentialExpiresAt ? new Date(prescriber.credentialExpiresAt).getTime() : Number.NaN;
  if (prescriber?.verificationStatus !== "validated" || prescriber.externalValidationComplete !== true || !["organization_recorded", "external_provider"].includes(prescriber.verificationMethod || "") || !isValidNpi(prescriber.npi) || !prescriber.credentialType?.trim() || !prescriber.credentialJurisdiction?.trim() || !prescriber.credentialIdentifier?.trim() || !prescriber.validationReference?.trim() || !prescriber.verifiedBy?.id || !Number.isFinite(credentialExpiry) || credentialExpiry <= now) {
    throw new DomainError("Current organization-recorded prescriber identity and credential review evidence is required");
  }
}

// features/keystone/mutations/fillWorkflows.ts
var FILL_PRESCRIPTION_QUERY = `id status sourceVerificationStatus writtenAt expiresAt
  organization { id prescriptionFillPolicy cashSalesEnabled cashTaxRateBps cashTaxPolicyReference cashPolicyReviewedAt } location { id }
  patient { id status organizations { id } user { id } identityVerificationStatus identityReference identityVerifiedAt identityVerifiedBy { id } }
  prescriber { id organization { id } npi verificationStatus externalValidationComplete verificationMethod credentialType credentialJurisdiction credentialIdentifier credentialExpiresAt validationReference verifiedBy { id } }
  items { id prescription { id } fillLineage activeFillNumber medicationNameSnapshot sig quantityPrescribed quantityDispensed daysSupply refillsAuthorized refillsRemaining refillsReserved substitutionAllowed drugReference { id } product { id title sku priceAmount currencyCode taxable drugReference { id } } }`;
var FILL_QUERY = `id reservationKey requestFingerprint openKey status kind version fillNumber creditState authorizedQuantity quantityDispensed quantityReleased itemVersion authorityVersion expiresAt policySnapshot priceSnapshot createdAt prescription { id } prescriptionItem { id } organization { id } location { id } patient { id } refillRequest { id } approval { id }`;
var connect = (id) => ({ connect: { id } });
function fillStore(context) {
  const query = context.sudo().query;
  if (!query.PrescriptionFill || !query.PrescriptionFillEvent) throw new DomainError("Per-fill lineage requires the isolated schema/migration gate; legacy records are not converted automatically");
  return query;
}
async function currentFillPermission(context, permission2) {
  requirePermission(context, permission2);
  const actor = await context.sudo().query.User.findOne({ where: { id: context.session.itemId }, query: `id role { ${permission2} }` });
  if (!actor?.role?.[permission2]) throw new DomainError("Current operator permission was revoked");
}
async function loadFillPrescription(context, prescriptionId) {
  const p2 = await context.sudo().query.Prescription.findOne({ where: { id: prescriptionId }, query: FILL_PRESCRIPTION_QUERY });
  if (!p2?.organization?.id || !p2.location?.id || !p2.patient?.id || p2.patient.status !== "active" || !p2.patient.organizations?.some((o) => o.id === p2.organization.id) || p2.prescriber?.organization?.id !== p2.organization.id) throw new DomainError("Current prescription/patient/prescriber scope requires reconciliation");
  return p2;
}
async function assertItemFillLedger(context, p2, item) {
  if (item.fillLineage !== FILL_LINEAGE) return;
  const store = context.prisma.prescriptionFill;
  if (!store) throw new DomainError("Per-fill schema gate is required");
  const where = { prescriptionId: p2.id, prescriptionItemId: item.id, organizationId: p2.organization.id, locationId: p2.location.id, patientId: p2.patient.id };
  const [totals, consumed, reserved] = await Promise.all([
    store.aggregate({ where, _sum: { quantityDispensed: true } }),
    store.count({ where: { ...where, kind: "refill", creditState: "consumed" } }),
    store.count({ where: { ...where, kind: "refill", creditState: "reserved" } })
  ]);
  for (const value of [totals, consumed, reserved]) if (value instanceof Error) throw value;
  if ((totals._sum.quantityDispensed ?? 0) !== item.quantityDispensed || consumed !== item.refillsAuthorized - item.refillsRemaining || reserved !== item.refillsReserved) {
    throw new DomainError("Item counters disagree with immutable fill lineage; reconciliation is required");
  }
}
function assertFillBinding(fill, p2, item, clinical = true) {
  if (fill.prescription?.id !== p2.id || fill.prescriptionItem?.id !== item?.id || fill.organization?.id !== p2.organization.id || fill.location?.id !== p2.location.id || fill.patient?.id !== p2.patient.id || fill.itemVersion !== prescriptionItemVersion(p2, item)) {
    throw new DomainError("Prescription item or patient changed; reconcile without rewriting history");
  }
  if (clinical) {
    if (fill.priceSnapshot?.taxRateBps !== p2.organization.cashTaxRateBps || fill.priceSnapshot?.taxPolicyReference !== p2.organization.cashTaxPolicyReference) throw new DomainError("Cash tax policy changed after reservation; explicit reconciliation is required");
    assertPrescriptionClinicallyEligible(p2);
    assertPrescriptionItemProductIdentity(item);
    if (fill.authorityVersion !== prescriptionAuthorityVersion(p2)) throw new DomainError("Prescriber/source/patient authority changed after reservation; fresh evidence is required");
  }
}
async function appendFillEvent(context, fill, input) {
  const q = fillStore(context);
  await q.PrescriptionFillEvent.createOne({ data: {
    eventKey: input.eventKey,
    commandFingerprint: input.fingerprint,
    action: input.action,
    version: fill.version,
    quantity: input.quantity || 0,
    fill: connect(fill.id),
    prescription: connect(fill.prescription.id),
    actor: connect(input.actorId),
    approval: input.approvalId ? connect(input.approvalId) : void 0,
    result: input.result,
    evidence: {
      ...input.evidence,
      readBindingVersion: 1,
      purpose: "prescription_fill_history",
      fillId: fill.id,
      prescriptionId: fill.prescription.id,
      prescriptionItemId: fill.prescriptionItem.id,
      organizationId: fill.organization.id,
      locationId: fill.location.id,
      patientId: fill.patient.id,
      actorId: input.actorId,
      refillRequestId: fill.refillRequest?.id || null,
      fillVersion: fill.version,
      itemVersion: fill.itemVersion,
      authorityVersion: fill.authorityVersion,
      policyVersion: fill.policySnapshot.version
    }
  } });
  await recordAudit(context, {
    eventKey: input.eventKey,
    organizationId: fill.organization.id,
    locationId: fill.location.id,
    actorId: input.actorId,
    patientId: fill.patient.id,
    eventType: `prescription_fill.${input.action}`,
    resourceType: "PrescriptionFill",
    resourceId: fill.id,
    metadata: {
      fillId: fill.id,
      fillNumber: fill.fillNumber,
      version: fill.version,
      kind: fill.kind,
      creditState: fill.creditState,
      authorizedQuantity: fill.authorizedQuantity,
      quantityDispensed: fill.quantityDispensed,
      quantityReleased: fill.quantityReleased,
      approvalId: input.approvalId,
      commandFingerprint: input.fingerprint,
      ...input.evidence
    }
  });
}
async function casFill(context, fill, data) {
  const result = await context.prisma.prescriptionFill.updateMany({ where: { id: fill.id, version: fill.version, status: fill.status }, data });
  if (result instanceof Error) throw result;
  if (result.count !== 1) throw new DomainError("Fill version changed; refresh the workbench");
  return { ...fill, ...data };
}
async function reserveFillInTransaction(context, p2, item, input) {
  const q = fillStore(context);
  if (p2.items.length !== 1) throw new DomainError("Per-fill workflow requires one prescription item; multi-item authority is not inferred");
  if (item.fillLineage !== FILL_LINEAGE) throw new DomainError("Legacy item has no per-fill entitlement provenance; explicit reconciliation is required");
  assertPrescriptionClinicallyEligible(p2);
  assertPrescriptionItemProductIdentity(item);
  await assertItemFillLedger(context, p2, item);
  if (!input.expectedItemVersion || input.expectedItemVersion !== prescriptionItemVersion(p2, item)) throw new DomainError("Prescription item version changed; refresh before reserving");
  const existing = await q.PrescriptionFill.findOne({ where: { reservationKey: input.key }, query: FILL_QUERY });
  if (existing) {
    assertFillBinding(existing, p2, item);
    if (existing.requestFingerprint !== input.fingerprint) throw new DomainError("Fill reservation key is already bound to another request");
    return { fill: existing, reused: true };
  }
  if (await q.PrescriptionFill.findOne({ where: { openKey: `item:${item.id}` }, query: "id" })) throw new DomainError("This item already has an open fill; recover or release that fill");
  if (!p2.organization.prescriptionFillPolicy?.approvalId) throw new DomainError("Fill policy lacks recorded operator approval");
  if (p2.organization.cashSalesEnabled !== true || !p2.organization.cashTaxPolicyReference?.trim() || !p2.organization.cashPolicyReviewedAt || !Number.isInteger(p2.organization.cashTaxRateBps)) throw new DomainError("Reviewed cash/tax policy is required before fill reservation");
  if (item.product.currencyCode !== "USD" || !Number.isSafeInteger(item.product.priceAmount) || item.product.priceAmount < 0) throw new DomainError("Fill price/currency requires bounded USD cash policy reconciliation");
  const cashPolicy = { taxRateBps: p2.organization.cashTaxRateBps, policyReference: p2.organization.cashTaxPolicyReference };
  const policySnapshot = { ...parseFillPolicy(p2.organization.prescriptionFillPolicy), approvalId: p2.organization.prescriptionFillPolicy.approvalId };
  if (!Number.isSafeInteger(item.quantityPrescribed) || item.quantityPrescribed < 1) throw new DomainError("Prescribed quantity requires reconciliation");
  let fillNumber = 1;
  if (input.kind === "original") {
    if (!["approved", "fill_closed"].includes(p2.status) || item.quantityDispensed !== 0 || item.refillsRemaining !== item.refillsAuthorized || item.refillsReserved !== 0) throw new DomainError("Original fill requires approved unused authority");
  } else {
    if (!["dispensed", "fill_closed"].includes(p2.status) || item.quantityDispensed < 1 || item.refillsRemaining - item.refillsReserved < 1) throw new DomainError("No unreserved refill entitlement is available");
    fillNumber = 2 + item.refillsAuthorized - item.refillsRemaining;
    await context.sudo().query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { refillsReserved: item.refillsReserved + 1 } });
  }
  await context.sudo().query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { activeFillNumber: fillNumber } });
  const fill = await q.PrescriptionFill.createOne({ data: {
    reservationKey: input.key,
    requestFingerprint: input.fingerprint,
    openKey: `item:${item.id}`,
    kind: input.kind,
    status: input.kind === "original" ? "approved" : "requested",
    fillNumber,
    creditState: "reserved",
    authorizedQuantity: item.quantityPrescribed,
    itemVersion: prescriptionItemVersion(p2, item),
    authorityVersion: prescriptionAuthorityVersion(p2),
    policySnapshot,
    priceSnapshot: { amount: item.product.priceAmount, currencyCode: item.product.currencyCode, taxable: item.product.taxable !== false, taxAmount: calculateTaxAmount(item.product.taxable !== false ? item.product.priceAmount : 0, cashPolicy.taxRateBps), taxRateBps: cashPolicy.taxRateBps, taxPolicyReference: cashPolicy.policyReference, title: item.product.title, sku: item.product.sku },
    expiresAt: new Date(Math.min(new Date(p2.expiresAt).getTime(), Date.now() + policySnapshot.reservationMinutes * 6e4)).toISOString(),
    organization: connect(p2.organization.id),
    location: connect(p2.location.id),
    patient: connect(p2.patient.id),
    prescription: connect(p2.id),
    prescriptionItem: connect(item.id),
    reservedBy: connect(input.actorId),
    refillRequest: input.refillRequestId ? connect(input.refillRequestId) : void 0,
    approval: input.approvalId ? connect(input.approvalId) : void 0
  }, query: FILL_QUERY });
  await appendFillEvent(context, fill, { eventKey: `fill.reserved:${input.key}`, fingerprint: input.fingerprint, action: "reserved", actorId: input.actorId, approvalId: input.approvalId, result: { fillId: fill.id, status: fill.status } });
  return { fill, reused: false };
}
async function reservePharmacyPrescriptionFill(_root, args, context) {
  await currentFillPermission(context, "canReviewPrescriptions");
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `prescription-item:${args.prescriptionItemId}`, `fill-command:${args.idempotencyKey}`], async (tx) => {
    const p2 = await loadFillPrescription(tx, args.prescriptionId);
    const { userId } = await requireTenantMembership(tx, { organizationId: p2.organization.id, locationId: p2.location.id, pharmacist: true });
    await currentFillPermission(tx, "canReviewPrescriptions");
    const item = p2.items.find((i) => i.id === args.prescriptionItemId);
    if (!item) throw new DomainError("Prescription item not found");
    const fingerprint2 = fillHash({ ...args, actorId: userId });
    const existing = await fillStore(tx).PrescriptionFill.findOne({ where: { reservationKey: args.idempotencyKey }, query: FILL_QUERY });
    if (existing) {
      assertFillBinding(existing, p2, item);
      await assertItemFillLedger(tx, p2, item);
      if (existing.requestFingerprint !== fingerprint2) throw new DomainError("Fill reservation key is already bound to another request");
      return { success: true, reused: true, fillId: existing.id, status: existing.status, version: existing.version };
    }
    const approval = await createHumanApproval(tx, {
      organizationId: p2.organization.id,
      locationId: p2.location.id,
      actorId: userId,
      actionType: "prescription_review",
      reason: args.reason,
      attested: args.attested,
      evidence: { stage: "fill_reservation", itemVersion: args.expectedItemVersion }
    });
    const { fill } = await reserveFillInTransaction(tx, p2, item, { kind: "original", actorId: userId, key: args.idempotencyKey, fingerprint: fingerprint2, expectedItemVersion: args.expectedItemVersion, approvalId: approval.id });
    if (p2.status === "fill_closed") await tx.sudo().query.Prescription.updateOne({ where: { id: p2.id }, data: { status: "approved" } });
    return { success: true, reused: false, fillId: fill.id, status: fill.status, version: fill.version };
  });
}
async function releasePharmacyPrescriptionFill(_root, args, context) {
  await currentFillPermission(context, "canReviewPrescriptions");
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `fill-command:${args.idempotencyKey}`], async (tx) => {
    const p2 = await loadFillPrescription(tx, args.prescriptionId);
    const { userId } = await requireTenantMembership(tx, { organizationId: p2.organization.id, locationId: p2.location.id, pharmacist: true });
    await currentFillPermission(tx, "canReviewPrescriptions");
    const q = fillStore(tx), fill = await q.PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY });
    const item = p2.items.find((i) => i.id === fill?.prescriptionItem?.id);
    if (!fill || !item) throw new DomainError("Fill not found");
    assertFillBinding(fill, p2, item, false);
    await assertItemFillLedger(tx, p2, item);
    const fingerprint2 = fillHash({ ...args, actorId: userId });
    const eventKey = `fill.release:${args.idempotencyKey}`;
    const prior = await q.PrescriptionFillEvent.findOne({ where: { eventKey }, query: "id commandFingerprint result" });
    if (prior) {
      if (prior.commandFingerprint !== fingerprint2) throw new DomainError("Fill release key is already bound to another request");
      return { ...prior.result, reused: true };
    }
    const plan = releaseFillPlan(fill, args.expectedVersion, args.cause);
    const approval = await createHumanApproval(tx, {
      organizationId: p2.organization.id,
      locationId: p2.location.id,
      actorId: userId,
      actionType: "prescription_review",
      reason: args.reason,
      attested: args.attested,
      evidence: { stage: "fill_release", fillId: fill.id, cause: args.cause, entitlementRestored: false, inventoryRestocked: false }
    });
    const updated = await applyFillReleaseInTransaction(tx, p2, item, fill, plan, args.reason);
    const result = { success: true, reused: false, fillId: fill.id, status: "released", version: updated.version };
    await appendFillEvent(tx, updated, {
      eventKey,
      fingerprint: fingerprint2,
      action: "released",
      actorId: userId,
      approvalId: approval.id,
      quantity: plan.quantityReleased,
      result,
      evidence: { cause: args.cause, inventoryRestocked: false, entitlementConsumed: plan.creditState === "consumed" }
    });
    return result;
  });
}
async function applyFillReleaseInTransaction(tx, p2, item, fill, plan, reason, extra = {}) {
  if (plan.releaseRefill) {
    if (item.refillsReserved < 1) throw new DomainError("Refill reservation counter requires reconciliation");
    await tx.sudo().query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { refillsReserved: item.refillsReserved - 1 } });
  }
  const { releaseRefill, ...data } = plan;
  const updated = await casFill(tx, fill, { ...data, ...extra, openKey: null });
  if (fill.refillRequest?.id) await tx.sudo().query.RefillRequest.updateOne({ where: { id: fill.refillRequest.id }, data: { status: "cancelled", openRequestKey: null, resolutionNote: reason, resolvedAt: (/* @__PURE__ */ new Date()).toISOString() } });
  if (fill.status !== "requested") await tx.sudo().query.Prescription.updateOne({ where: { id: p2.id }, data: { status: "fill_closed" } });
  return updated;
}
async function consumeFillInTransaction(tx, fill, item, expectedVersion, quantity, input) {
  const plan = dispenseFillPlan(fill, expectedVersion, quantity, Date.now(), input.hold === true);
  if (plan.debitRefill) {
    if (item.refillsReserved < 1 || item.refillsRemaining < 1) throw new DomainError("Refill reservation evidence requires reconciliation");
    await tx.sudo().query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { refillsReserved: item.refillsReserved - 1, refillsRemaining: item.refillsRemaining - 1 } });
  }
  const { debitRefill, ...data } = plan;
  const updated = await casFill(tx, fill, { ...data, ...plan.status === "dispensed" ? { openKey: null } : {} });
  await appendFillEvent(tx, updated, {
    eventKey: `fill.dispense:${input.key}`,
    fingerprint: input.fingerprint,
    action: plan.status === "ready" ? "filled" : "dispensed",
    actorId: input.actorId,
    approvalId: input.approvalId,
    quantity,
    result: input.result,
    evidence: { movementId: input.movementId, clinicalSafetyReviewId: input.safetyReviewId }
  });
  return updated;
}
async function pharmacyFillPolicy(_root, args, context) {
  await currentFillPermission(context, "canManageOrganizations");
  await currentFillPermission(context, "canApproveConsequentialActions");
  await requireTenantMembership(context, { organizationId: args.organizationId, organizationWide: true, pharmacist: true });
  const organization = await context.sudo().query.Organization.findOne({ where: { id: args.organizationId }, query: "id prescriptionFillPolicy" });
  if (!organization) throw new DomainError("Organization not found");
  return { organizationId: organization.id, configured: Boolean(organization.prescriptionFillPolicy?.approvalId), version: organization.prescriptionFillPolicy?.version || null };
}
async function recordPharmacyFillPolicy(_root, args, context) {
  await currentFillPermission(context, "canManageOrganizations");
  await currentFillPermission(context, "canApproveConsequentialActions");
  const policy = parseFillPolicy(args.policy);
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  return withDomainTransaction(context, [`fill-policy:${args.organizationId}`, `fill-policy-command:${args.idempotencyKey}`], async (tx) => {
    const { userId } = await requireTenantMembership(tx, { organizationId: args.organizationId, organizationWide: true, pharmacist: true });
    await currentFillPermission(tx, "canManageOrganizations");
    await currentFillPermission(tx, "canApproveConsequentialActions");
    const fingerprint2 = fillHash({ ...args, policy, actorId: userId }), eventKey = `fill.policy:${args.idempotencyKey}`;
    const prior = await tx.sudo().query.AuditEvent.findOne({ where: { eventKey }, query: "id metadata" });
    if (prior) {
      if (prior.metadata?.commandFingerprint !== fingerprint2) throw new DomainError("Policy key is already bound to another request");
      return { success: true, reused: true, status: "configured" };
    }
    const organization = await tx.sudo().query.Organization.findOne({ where: { id: args.organizationId }, query: "id prescriptionFillPolicy" });
    if (organization.prescriptionFillPolicy?.version === policy.version && fillHash(parseFillPolicy(organization.prescriptionFillPolicy)) !== fillHash(policy)) throw new DomainError("Changed policy requires a new version");
    const approval = await createHumanApproval(tx, {
      organizationId: args.organizationId,
      actorId: userId,
      actionType: "prescription_review",
      reason: args.reason,
      attested: args.attested,
      evidence: { stage: "fill_policy", policy, clinicalValidityClaimed: false, nonRetroactive: true }
    });
    await tx.sudo().query.Organization.updateOne({ where: { id: args.organizationId }, data: { prescriptionFillPolicy: { ...policy, approvalId: approval.id } } });
    await recordAudit(tx, {
      eventKey,
      organizationId: args.organizationId,
      actorId: userId,
      eventType: "prescription_fill.policy_recorded",
      resourceType: "Organization",
      resourceId: args.organizationId,
      metadata: { policy, approvalId: approval.id, commandFingerprint: fingerprint2, nonRetroactive: true }
    });
    return { success: true, reused: false, status: "configured" };
  });
}

// features/keystone/mutations/clinicalWorkflows.ts
async function recordPharmacyDrugReferenceReview(_root, args, context) {
  requirePermission(context, "canManageCatalog");
  requirePermission(context, "canApproveConsequentialActions");
  if (!["active", "inactive"].includes(args.marketingStatus)) throw new DomainError("Marketing status is invalid");
  if (!["none", "controlled_or_unsupported"].includes(args.controlledSchedule)) throw new DomainError("Controlled schedule review is invalid");
  if (![args.sourceName, args.sourceVersion, args.sourceReference].every((value) => value?.trim())) throw new DomainError("Drug source name, version, and reference are required");
  return withDomainTransaction(context, [`drug-reference:${args.drugReferenceId}`, `drug-reference-review:${args.organizationId}:${args.drugReferenceId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const [drugReference, existing] = await Promise.all([
      sudo.query.DrugReference.findOne({ where: { id: args.drugReferenceId }, query: "id ndc11" }),
      sudo.query.DrugReferenceReview.findMany({ where: { reviewKey: { equals: `${args.organizationId}:${args.drugReferenceId}` } }, take: 1, query: "id status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference approval { id }" }).then((records) => records[0])
    ]);
    if (!drugReference) throw new DomainError("Drug reference not found");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: args.organizationId, pharmacist: true });
    if (existing && existing.status === "active" && existing.marketingStatusSnapshot === args.marketingStatus && existing.controlledScheduleSnapshot === args.controlledSchedule && existing.sourceName === args.sourceName.trim() && existing.sourceVersion === args.sourceVersion.trim() && existing.sourceReference === args.sourceReference.trim()) {
      return { success: true, reused: true, reviewId: existing.id, status: existing.status, approvalId: existing.approval?.id };
    }
    const approval = await createHumanApproval(transactionContext, { organizationId: args.organizationId, actorId: userId, actionType: "drug_reference_review", reason: args.reason, attested: args.attested, evidence: { drugReferenceId: drugReference.id, ndc11: drugReference.ndc11, marketingStatus: args.marketingStatus, controlledSchedule: args.controlledSchedule, sourceName: args.sourceName.trim(), sourceVersion: args.sourceVersion.trim(), sourceReference: args.sourceReference.trim(), softwareValidationPerformed: false } });
    const prisma = transactionContext.prisma;
    const now = /* @__PURE__ */ new Date();
    const data = { status: "active", marketingStatusSnapshot: args.marketingStatus, controlledScheduleSnapshot: args.controlledSchedule, sourceName: args.sourceName.trim(), sourceVersion: args.sourceVersion.trim(), sourceReference: args.sourceReference.trim(), reviewedAt: now, organizationId: args.organizationId, drugReferenceId: drugReference.id, reviewedById: userId, approvalId: approval.id };
    const review = existing ? await prisma.drugReferenceReview.update({ where: { id: existing.id }, data, select: { id: true, status: true } }) : await prisma.drugReferenceReview.create({ data: { reviewKey: `${args.organizationId}:${drugReference.id}`, ...data }, select: { id: true, status: true } });
    await recordAudit(transactionContext, { eventKey: `drug_reference.reviewed:${review.id}:${approval.id}`, organizationId: args.organizationId, actorId: userId, eventType: "drug_reference.review_recorded", resourceType: "DrugReferenceReview", resourceId: review.id, metadata: { drugReferenceId: drugReference.id, approvalId: approval.id, marketingStatus: args.marketingStatus, controlledSchedule: args.controlledSchedule, softwareValidationPerformed: false } });
    return { success: true, reused: false, reviewId: review.id, status: review.status, approvalId: approval.id };
  });
}
function clinicalSafetyReviewRequestFingerprint(input) {
  return (0, import_node_crypto8.createHash)("sha256").update(JSON.stringify({
    ...input,
    reviewReference: input.reviewReference?.trim(),
    notes: input.notes?.trim() || null,
    overrideReason: input.overrideReason?.trim() || null,
    reason: input.reason?.trim()
  })).digest("hex");
}
async function recordPrescriptionClinicalSafetyReview(_root, args, context) {
  requirePermission(context, "canReviewPrescriptions");
  if (!["clear", "override", "rejected"].includes(args.outcome)) throw new DomainError("Clinical safety review outcome is invalid");
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  const candidate = {
    fillNumber: 1,
    ...args,
    reviewedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (args.outcome !== "rejected") assertCurrentHumanSafetyReview(candidate, 1);
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `clinical-review:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: 'id status organization { id } location { id } patient { id identityVerificationStatus identityReference identityVerifiedAt identityVerifiedBy { id } allergies(where: { status: { in: ["active", "none_known"] } }) { id updatedAt } medications(where: { status: { in: ["current", "none_known"] } }) { id updatedAt } } items { id fillLineage activeFillNumber refillsAuthorized refillsRemaining drugReference { id } }'
    });
    if (!prescription || !["pending_review", "needs_information", "approved"].includes(prescription.status)) throw new DomainError("Prescription is not available for clinical safety review");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: prescription.organization.id, locationId: prescription.location.id, pharmacist: true });
    let fill = null;
    if (prescription.items.some((item) => item.fillLineage === FILL_LINEAGE)) {
      await currentFillPermission(transactionContext, "canReviewPrescriptions");
      const current = await loadFillPrescription(transactionContext, prescription.id);
      if (args.fillId) {
        fill = await fillStore(transactionContext).PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY });
        const item = current.items.find((entry) => entry.id === fill?.prescriptionItem?.id);
        if (!fill || !item || fill.version !== args.expectedFillVersion || !["approved", "partially_dispensed"].includes(fill.status) || new Date(fill.expiresAt).getTime() <= Date.now()) throw new DomainError("A current fill identity/version is required for safety review");
        assertFillBinding(fill, current, item);
        await assertItemFillLedger(transactionContext, current, item);
      } else if (!["pending_review", "needs_information"].includes(prescription.status)) throw new DomainError("Exact fill reservation is required; an intake review does not clear a new reservation");
    }
    const requestFingerprint = clinicalSafetyReviewRequestFingerprint({
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      prescriptionId: prescription.id,
      ...fill ? { fillId: fill.id, expectedFillVersion: args.expectedFillVersion } : {},
      outcome: args.outcome,
      allergiesReviewed: args.allergiesReviewed,
      medicationHistoryReviewed: args.medicationHistoryReviewed,
      interactionsReviewed: args.interactionsReviewed,
      duplicateTherapyReviewed: args.duplicateTherapyReviewed,
      contraindicationsReviewed: args.contraindicationsReviewed,
      doseReviewed: args.doseReviewed,
      counselingPlanReviewed: args.counselingPlanReviewed,
      reviewReference: args.reviewReference,
      notes: args.notes,
      overrideReason: args.overrideReason,
      reason: args.reason,
      attested: args.attested
    });
    if (prescription.patient.identityVerificationStatus !== "confirmed" || !prescription.patient.identityReference?.trim() || !prescription.patient.identityVerifiedAt || !prescription.patient.identityVerifiedBy?.id) throw new DomainError("Current operator-recorded patient identity evidence is required before clinical review");
    if (!prescription.patient.allergies?.length || !prescription.patient.medications?.length) throw new DomainError("Explicit allergy and medication history evidence is required; record no-known/no-current entries when applicable");
    const fillNumbers = prescription.items.map((item) => currentFillNumber(item));
    const fillNumber = Math.max(...fillNumbers);
    if (!fillNumbers.length || fillNumbers.some((value) => value !== fillNumber)) throw new DomainError("Prescription items are not aligned to one fill review");
    if (args.outcome !== "rejected") assertCurrentHumanSafetyReview({ ...candidate, fillNumber }, fillNumber);
    const reviewKey = `${prescription.id}:${fillNumber}:${args.idempotencyKey.trim()}`;
    const existing = (await sudo.query.ClinicalSafetyReview.findMany({ where: { reviewKey: { equals: reviewKey } }, take: 1, query: "id outcome evidenceSnapshot approval { id }" }))[0];
    if (existing && existing.evidenceSnapshot?.requestFingerprint !== requestFingerprint) throw new DomainError("Clinical safety review idempotency key was reused with different input");
    if (existing) return { success: true, reused: true, reviewId: existing.id, prescriptionId: prescription.id, outcome: existing.outcome, approvalId: existing.approval?.id };
    const drugReferenceIds = [...new Set(prescription.items.map((item) => item.drugReference?.id).filter(Boolean))];
    const drugReviews = await sudo.query.DrugReferenceReview.findMany({
      where: { organization: { id: { equals: prescription.organization.id } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: "active" } },
      take: 100,
      query: "id drugReference { id } status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference reviewedAt"
    });
    if (!drugReferenceIds.length || drugReviews.length !== drugReferenceIds.length) throw new DomainError("Every prescription item requires drug reference review evidence");
    for (const review2 of drugReviews) assertDrugReferenceEligibleForBoundedDispensing({ sourceVerified: review2.status === "active", marketingStatus: review2.marketingStatusSnapshot, controlledSchedule: review2.controlledScheduleSnapshot, sourceName: review2.sourceName, sourceVersion: review2.sourceVersion, sourceReference: review2.sourceReference, reviewedAt: review2.reviewedAt });
    const approval = await createHumanApproval(transactionContext, { organizationId: prescription.organization.id, locationId: prescription.location.id, actorId: userId, actionType: "clinical_safety_review", reason: args.reason, attested: args.attested, evidence: { prescriptionId: prescription.id, fillId: fill?.id || null, itemVersion: fill?.itemVersion || null, authorityVersion: fill?.authorityVersion || null, fillNumber, outcome: args.outcome, reviewReference: args.reviewReference.trim(), softwareClinicalDecisionPerformed: false } });
    const review = await sudo.query.ClinicalSafetyReview.createOne({
      data: {
        reviewKey,
        fillNumber,
        outcome: args.outcome,
        allergiesReviewed: args.allergiesReviewed,
        medicationHistoryReviewed: args.medicationHistoryReviewed,
        interactionsReviewed: args.interactionsReviewed,
        duplicateTherapyReviewed: args.duplicateTherapyReviewed,
        contraindicationsReviewed: args.contraindicationsReviewed,
        doseReviewed: args.doseReviewed,
        counselingPlanReviewed: args.counselingPlanReviewed,
        reviewReference: args.reviewReference.trim(),
        notes: args.notes?.trim() || void 0,
        overrideReason: args.overrideReason?.trim() || void 0,
        evidenceSnapshot: { ...fill ? { fillId: fill.id, fillVersion: fill.version, itemVersion: fill.itemVersion, authorityVersion: fill.authorityVersion } : {}, allergyRecordIds: prescription.patient.allergies.map((entry) => entry.id), medicationRecordIds: prescription.patient.medications.map((entry) => entry.id), drugReferenceReviewIds: drugReviews.map((entry) => entry.id), requestFingerprint, recordedAt: (/* @__PURE__ */ new Date()).toISOString(), softwareClinicalDecisionPerformed: false },
        organization: { connect: { id: prescription.organization.id } },
        location: { connect: { id: prescription.location.id } },
        patient: { connect: { id: prescription.patient.id } },
        prescription: { connect: { id: prescription.id } },
        pharmacist: { connect: { id: userId } },
        approval: { connect: { id: approval.id } }
      },
      query: "id outcome reviewedAt"
    });
    if (fill) await appendFillEvent(transactionContext, fill, { eventKey: `fill.clinical:${review.id}`, fingerprint: requestFingerprint, action: "clinical_reviewed", actorId: userId, approvalId: approval.id, result: { reviewId: review.id, outcome: review.outcome }, evidence: { clinicalSafetyReviewId: review.id, outcome: args.outcome, fillVersion: fill.version } });
    await recordAudit(transactionContext, { eventKey: `prescription.clinical_safety_reviewed:${review.id}`, organizationId: prescription.organization.id, locationId: prescription.location.id, actorId: userId, patientId: prescription.patient.id, eventType: "prescription.clinical_safety_review_recorded", resourceType: "ClinicalSafetyReview", resourceId: review.id, metadata: { prescriptionId: prescription.id, fillNumber, outcome: args.outcome, approvalId: approval.id, softwareClinicalDecisionPerformed: false } });
    return { success: true, reused: false, reviewId: review.id, prescriptionId: prescription.id, outcome: review.outcome, approvalId: approval.id };
  });
}
async function holdPrescriptionForClinicalReReview(_root, args, context) {
  requirePermission(context, "canReviewPrescriptions");
  if (!args.reason?.trim()) throw new DomainError("A reason for the clinical safety hold is required");
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: 'id status approval { id actionType reason evidence } organization { id } location { id } patient { id identityVerifiedAt allergies(where: { status: { in: ["active", "none_known"] } }) { id updatedAt } medications(where: { status: { in: ["current", "none_known"] } }) { id updatedAt } } items { id fillLineage activeFillNumber refillsAuthorized refillsRemaining drugReference { id } } safetyReviews(orderBy: { reviewedAt: desc }, take: 1) { id fillNumber outcome reviewedAt }'
    });
    if (!prescription) throw new DomainError("Prescription not found");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: prescription.organization.id, locationId: prescription.location.id, pharmacist: true });
    const fillNumbers = prescription.items.map((item) => currentFillNumber(item));
    const fillNumber = fillNumbers.length ? Math.max(...fillNumbers) : 0;
    const latestReview = prescription.safetyReviews?.[0];
    const drugReferenceIds = [...new Set(prescription.items.map((item) => item.drugReference?.id).filter(Boolean))];
    const drugReviews = await sudo.query.DrugReferenceReview.findMany({
      where: { organization: { id: { equals: prescription.organization.id } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: "active" } },
      take: 100,
      query: "id reviewedAt"
    });
    const evidenceChanges = [prescription.patient?.identityVerifiedAt, ...(prescription.patient?.allergies || []).map((entry) => entry.updatedAt), ...(prescription.patient?.medications || []).map((entry) => entry.updatedAt), ...drugReviews.map((entry) => entry.reviewedAt)].filter(Boolean);
    const latestEvidenceChange = evidenceChanges.sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).at(-1);
    const requestFingerprint = (0, import_node_crypto8.createHash)("sha256").update(JSON.stringify({ prescriptionId: prescription.id, organizationId: prescription.organization.id, locationId: prescription.location.id, actorId: userId, reason: args.reason.trim(), attested: args.attested, safetyReviewId: latestReview?.id || null, latestEvidenceChange: latestEvidenceChange || null })).digest("hex");
    if (prescription.status === "approved" && prescription.approval?.actionType === "clinical_safety_hold") {
      if (prescription.approval.evidence?.requestFingerprint !== requestFingerprint) throw new DomainError("Clinical safety hold replay does not match the recorded action");
      return { success: true, reused: true, prescriptionId: prescription.id, status: "approved", approvalId: prescription.approval.id };
    }
    if (!["ready_to_dispense", "partially_dispensed"].includes(prescription.status) || !latestReview || !isHumanSafetyReviewStale(latestReview, fillNumber, latestEvidenceChange)) {
      throw new DomainError("A clinical safety re-review hold is available only when new patient or drug-reference evidence invalidates the current fill review");
    }
    const approval = await createHumanApproval(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      actionType: "clinical_safety_hold",
      reason: args.reason,
      attested: args.attested,
      evidence: { prescriptionId: prescription.id, safetyReviewId: latestReview.id, latestEvidenceChange, requestFingerprint, softwareClinicalDecisionPerformed: false }
    });
    await sudo.query.Prescription.updateOne({ where: { id: prescription.id }, data: { status: "approved", approval: { connect: { id: approval.id } } } });
    await recordAudit(transactionContext, {
      eventKey: `prescription.clinical_safety_hold:${prescription.id}:${approval.id}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      patientId: prescription.patient.id,
      eventType: "prescription.clinical_safety_hold_recorded",
      resourceType: "Prescription",
      resourceId: prescription.id,
      metadata: { safetyReviewId: latestReview.id, latestEvidenceChange, approvalId: approval.id, requestFingerprint }
    });
    return { success: true, reused: false, prescriptionId: prescription.id, status: "approved", approvalId: approval.id };
  });
}

// features/keystone/mutations/credentialWorkflows.ts
function validateCredentialEvidence(args) {
  const expiresAt = new Date(args.expiresAt);
  if (![args.credentialType, args.jurisdiction, args.identifier, args.verificationReference].every((value) => value?.trim())) {
    throw new DomainError("Credential type, jurisdiction, identifier, expiration, and source reference are required");
  }
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) throw new DomainError("Credential review expiration must be in the future");
  if (expiresAt.getTime() > Date.now() + 5 * 366 * 864e5) throw new DomainError("Credential review expiration is outside the supported review window");
  return expiresAt;
}
async function recordPharmacyStaffCredentialReview(_root, args, context) {
  requirePermission(context, "canManageUsers");
  requirePermission(context, "canApproveConsequentialActions");
  const expiresAt = validateCredentialEvidence(args);
  return withDomainTransaction(context, [`membership:${args.membershipId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const membership = await sudo.query.OrganizationMembership.findOne({
      where: { id: args.membershipId },
      query: "id membershipRole status organization { id } location { id } user { id } externalCredentialValidated credentialValidationReference credentialExpiresAt"
    });
    if (!membership || membership.status !== "active" || !["owner", "pharmacist"].includes(membership.membershipRole)) throw new DomainError("Active owner or pharmacist membership not found");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: membership.organization.id, locationId: membership.location?.id });
    const approval = await createHumanApproval(transactionContext, {
      organizationId: membership.organization.id,
      locationId: membership.location?.id,
      actorId: userId,
      actionType: "credential_review",
      reason: args.reason,
      attested: args.attested,
      evidence: { membershipId: membership.id, subjectUserId: membership.user.id, verificationMethod: "organization_recorded", verificationReference: args.verificationReference.trim(), credentialType: args.credentialType.trim(), jurisdiction: args.jurisdiction.trim(), expiresAt: expiresAt.toISOString(), softwareValidationPerformed: false }
    });
    const prisma = transactionContext.prisma;
    await prisma.organizationMembership.update({
      where: { id: membership.id },
      data: {
        externalCredentialValidated: true,
        credentialVerificationMethod: "organization_recorded",
        credentialType: args.credentialType.trim(),
        credentialJurisdiction: args.jurisdiction.trim(),
        credentialIdentifier: args.identifier.trim(),
        credentialValidationReference: args.verificationReference.trim(),
        credentialValidatedAt: /* @__PURE__ */ new Date(),
        credentialExpiresAt: expiresAt,
        credentialVerifiedById: userId
      }
    });
    await recordAudit(transactionContext, {
      eventKey: `membership.credential_reviewed:${membership.id}:${approval.id}`,
      organizationId: membership.organization.id,
      locationId: membership.location?.id,
      actorId: userId,
      eventType: "membership.credential_review_recorded",
      resourceType: "OrganizationMembership",
      resourceId: membership.id,
      metadata: { approvalId: approval.id, expiresAt: expiresAt.toISOString(), verificationMethod: "organization_recorded", softwareValidationPerformed: false }
    });
    return { success: true, membershipId: membership.id, status: "recorded", expiresAt: expiresAt.toISOString(), approvalId: approval.id };
  });
}
async function recordPharmacyPrescriberCredentialReview(_root, args, context) {
  requirePermission(context, "canReviewPrescriptions");
  requirePermission(context, "canApproveConsequentialActions");
  const expiresAt = validateCredentialEvidence(args);
  return withDomainTransaction(context, [`prescriber:${args.prescriberId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const prescriber = await sudo.query.Prescriber.findOne({ where: { id: args.prescriberId }, query: "id npi organization { id }" });
    if (!prescriber || !isValidNpi(prescriber.npi)) throw new DomainError("Prescriber with a valid NPI is required");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: prescriber.organization.id, pharmacist: true });
    const approval = await createHumanApproval(transactionContext, {
      organizationId: prescriber.organization.id,
      actorId: userId,
      actionType: "credential_review",
      reason: args.reason,
      attested: args.attested,
      evidence: { prescriberId: prescriber.id, verificationMethod: "organization_recorded", verificationReference: args.verificationReference.trim(), credentialType: args.credentialType.trim(), jurisdiction: args.jurisdiction.trim(), expiresAt: expiresAt.toISOString(), softwareValidationPerformed: false }
    });
    const prisma = transactionContext.prisma;
    await prisma.prescriber.update({
      where: { id: prescriber.id },
      data: {
        verificationStatus: "validated",
        externalValidationComplete: true,
        verificationMethod: "organization_recorded",
        credentialType: args.credentialType.trim(),
        credentialJurisdiction: args.jurisdiction.trim(),
        credentialIdentifier: args.identifier.trim(),
        credentialExpiresAt: expiresAt,
        validationReference: args.verificationReference.trim(),
        validatedAt: /* @__PURE__ */ new Date(),
        verifiedById: userId
      }
    });
    await recordAudit(transactionContext, {
      eventKey: `prescriber.credential_reviewed:${prescriber.id}:${approval.id}`,
      organizationId: prescriber.organization.id,
      actorId: userId,
      eventType: "prescriber.credential_review_recorded",
      resourceType: "Prescriber",
      resourceId: prescriber.id,
      metadata: { approvalId: approval.id, expiresAt: expiresAt.toISOString(), verificationMethod: "organization_recorded", softwareValidationPerformed: false }
    });
    return { success: true, prescriberId: prescriber.id, status: "recorded", expiresAt: expiresAt.toISOString(), approvalId: approval.id };
  });
}

// features/keystone/workflows/fill-read-scope.ts
var readScopeError = () => new Error("Fill evidence scope requires reconciliation");
function record(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw readScopeError();
  return value;
}
function readId(value) {
  if (typeof value !== "string" || !value || value.length > 200 || !/^[A-Za-z0-9:_-]+$/.test(value)) throw readScopeError();
  return value;
}
var linkedId = (value) => readId(record(value).id);
function integer20(value, min = 0) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > 2147483647) throw readScopeError();
  return value;
}
function timestamp37(value) {
  if (typeof value !== "string" || !Number.isFinite(new Date(value).getTime())) throw readScopeError();
  return value;
}
function hash(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) throw readScopeError();
  return value;
}
function prescriptionReadScope(value, expectedId) {
  const p2 = record(value);
  if (p2.id !== expectedId || !Array.isArray(p2.items) || !p2.items.length) throw readScopeError();
  const itemIds = p2.items.map((value2) => {
    const item = record(value2);
    if (linkedId(item.prescription) !== p2.id) throw readScopeError();
    return readId(item.id);
  });
  if (new Set(itemIds).size !== itemIds.length || linkedId(record(p2.prescriber).organization) !== linkedId(p2.organization)) throw readScopeError();
  return { prescriptionId: readId(p2.id), organizationId: linkedId(p2.organization), locationId: linkedId(p2.location), patientId: linkedId(p2.patient), prescriberId: linkedId(p2.prescriber), itemIds };
}
var FILL_READ_METADATA = "id requestFingerprint openKey status kind version fillNumber creditState authorizedQuantity quantityDispensed quantityReleased itemVersion authorityVersion expiresAt createdAt prescription { id } prescriptionItem { id prescription { id } } organization { id } location { id } patient { id } refillRequest { id } reservedBy { id }";
function scopedFill(value, scope, expectedId) {
  const f = record(value), id = readId(f.id), itemId = linkedId(f.prescriptionItem);
  if (expectedId && id !== expectedId || linkedId(record(f.prescriptionItem).prescription) !== scope.prescriptionId || linkedId(f.prescription) !== scope.prescriptionId || linkedId(f.organization) !== scope.organizationId || linkedId(f.location) !== scope.locationId || linkedId(f.patient) !== scope.patientId || !scope.itemIds.includes(itemId)) throw readScopeError();
  const version = integer20(f.version, 1), fillNumber = integer20(f.fillNumber, 1);
  const authorizedQuantity = integer20(f.authorizedQuantity, 1), quantityDispensed = integer20(f.quantityDispensed), quantityReleased = integer20(f.quantityReleased);
  if (quantityDispensed + quantityReleased > authorizedQuantity || !["original", "refill"].includes(String(f.kind)) || !["requested", "approved", "partially_dispensed", "ready", "dispensed", "released"].includes(String(f.status)) || !["reserved", "consumed", "released"].includes(String(f.creditState))) throw readScopeError();
  return {
    id,
    itemId,
    reservedById: linkedId(f.reservedBy),
    version,
    fillNumber,
    authorizedQuantity,
    quantityDispensed,
    quantityReleased,
    kind: String(f.kind),
    status: String(f.status),
    creditState: String(f.creditState),
    openKey: f.openKey,
    itemVersion: hash(f.itemVersion),
    authorityVersion: hash(f.authorityVersion),
    requestFingerprint: hash(f.requestFingerprint),
    createdAt: timestamp37(f.createdAt),
    expiresAt: timestamp37(f.expiresAt),
    refillRequestId: f.refillRequest ? linkedId(f.refillRequest) : null
  };
}
function fillReadWhere(scope) {
  return { prescription: { id: { equals: scope.prescriptionId } }, prescriptionItem: { id: { in: scope.itemIds }, prescription: { id: { equals: scope.prescriptionId } } }, organization: { id: { equals: scope.organizationId } }, location: { id: { equals: scope.locationId } }, patient: { id: { equals: scope.patientId } } };
}
var EVENT_READ_METADATA = `id commandFingerprint action version quantity createdAt actor { id } approval { id } prescription { id } fill { ${FILL_READ_METADATA} }`;
function scopedEvent(value, scope, fill, expectedId) {
  const e = record(value), id = readId(e.id), linked = scopedFill(e.fill, scope, fill.id);
  if (expectedId && id !== expectedId || linkedId(e.prescription) !== scope.prescriptionId || linked.itemId !== fill.itemId || linked.version !== fill.version || linked.itemVersion !== fill.itemVersion || linked.authorityVersion !== fill.authorityVersion) throw readScopeError();
  const version = integer20(e.version, 1);
  if (version > fill.version || !["reserved", "approved", "rejected", "released", "dispensed", "clinical_reviewed", "filled", "picked_up", "returned_to_stock"].includes(String(e.action))) throw readScopeError();
  const quantity = integer20(e.quantity);
  if (e.action === "dispensed" ? quantity < 1 || quantity > fill.quantityDispensed : e.action === "filled" ? quantity < 1 || quantity > fill.authorizedQuantity : ["released", "returned_to_stock"].includes(String(e.action)) ? quantity > fill.quantityReleased : quantity !== 0) throw readScopeError();
  const commandFingerprint = hash(e.commandFingerprint);
  if (e.action === "reserved" && (commandFingerprint !== fill.requestFingerprint || linkedId(e.actor) !== fill.reservedById)) throw readScopeError();
  return { id, action: String(e.action), version, commandFingerprint, quantity, createdAt: timestamp37(e.createdAt), actorId: linkedId(e.actor), approvalId: e.approval ? linkedId(e.approval) : null };
}
function eventReadWhere(scope, fill) {
  return { fill: { ...fillReadWhere(scope), id: { equals: fill.id } }, prescription: { id: { equals: scope.prescriptionId } }, version: { gte: 1, lte: fill.version } };
}
function sameScope(left, right) {
  return left.prescriptionId === right.prescriptionId && left.organizationId === right.organizationId && left.locationId === right.locationId && left.patientId === right.patientId && left.prescriberId === right.prescriberId && left.itemIds.length === right.itemIds.length && left.itemIds.every((id) => right.itemIds.includes(id));
}
function readCursor(after, scope, purpose, fillId) {
  if (after.length > 2e3) throw new Error("Invalid scoped cursor");
  try {
    const c = record(JSON.parse(Buffer.from(after, "base64url").toString()));
    if (c.purpose !== purpose || c.fillId !== fillId || !sameScope(record(c.scope), scope)) throw Error();
    return { id: readId(c.id), createdAt: timestamp37(c.createdAt), version: integer20(c.version, 1) };
  } catch {
    throw new Error("Invalid scoped cursor");
  }
}
function writeCursor(scope, purpose, row, fillId) {
  return Buffer.from(JSON.stringify({ scope, purpose, fillId, ...row })).toString("base64url");
}
var cursorBoundary = (c) => ({ OR: [{ createdAt: { lt: c.createdAt } }, { createdAt: { equals: c.createdAt }, id: { lt: c.id } }] });

// features/keystone/mutations/fillReadProjection.ts
var readStore = (context) => fillStore(context);
var fillMetadataQuery = FILL_READ_METADATA;
var eventMetadataQuery = EVENT_READ_METADATA;
var equalFill = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function tuple(value, scope) {
  const r = record(value);
  if (linkedId(r.organization) !== scope.organizationId || linkedId(r.location) !== scope.locationId || linkedId(r.patient) !== scope.patientId || linkedId(r.prescription) !== scope.prescriptionId) throw readScopeError();
  return r;
}
async function readFillProjection(context, scope, fill) {
  const q = readStore(context);
  const value = record(await q.PrescriptionFill.findOne({ where: { id: fill.id }, query: `${FILL_READ_METADATA} policySnapshot priceSnapshot` }));
  if (!equalFill(scopedFill(value, scope, fill.id), fill)) throw readScopeError();
  const policy = parseFillPolicy(value.policySnapshot), price = record(value.priceSnapshot);
  assertFillConservation({ ...fill, policySnapshot: policy });
  const priceAmount = integer20(price.amount), taxAmount = integer20(price.taxAmount);
  if (typeof price.currencyCode !== "string" || !/^[A-Z]{3}$/.test(price.currencyCode) || typeof price.taxable !== "boolean") throw readScopeError();
  if (fill.refillRequestId) {
    const request = record(await q.RefillRequest.findOne({ where: { id: fill.refillRequestId }, query: "id prescription { id } prescriptionItem { id } patient { id } location { id }" }));
    if (request.id !== fill.refillRequestId || linkedId(request.prescription) !== scope.prescriptionId || linkedId(request.prescriptionItem) !== fill.itemId || linkedId(request.patient) !== scope.patientId || linkedId(request.location) !== scope.locationId) throw readScopeError();
  }
  const attempt = 1 + await q.PrescriptionFill.count({ where: { AND: [fillReadWhere(scope), { prescriptionItem: { id: { equals: fill.itemId } } }, { fillNumber: { equals: fill.fillNumber } }, { OR: [{ createdAt: { lt: fill.createdAt } }, { createdAt: { equals: fill.createdAt }, id: { lt: fill.id } }] }] } });
  return {
    id: fill.id,
    prescriptionItemId: fill.itemId,
    refillRequestId: fill.refillRequestId,
    attempt,
    kind: fill.kind,
    status: fill.status,
    version: fill.version,
    fillNumber: fill.fillNumber,
    creditState: fill.creditState,
    authorizedQuantity: fill.authorizedQuantity,
    quantityDispensed: fill.quantityDispensed,
    quantityReleased: fill.quantityReleased,
    quantityRemaining: fill.authorizedQuantity - fill.quantityDispensed - fill.quantityReleased,
    expiresAt: fill.expiresAt,
    policyVersion: policy.version,
    policyReference: policy.reference,
    allowPartial: policy.allowPartial,
    releaseReasons: policy.releaseReasons,
    priceAmount,
    taxAmount,
    currencyCode: price.currencyCode,
    taxable: price.taxable,
    itemVersion: fill.itemVersion
  };
}
async function readEventProjection(context, scope, fill, metadata, policyVersion) {
  const q = readStore(context), event = scopedEvent(metadata, scope, fill);
  const data = record(await q.PrescriptionFillEvent.findOne({ where: { id: event.id }, query: `${EVENT_READ_METADATA} evidence result` }));
  if (JSON.stringify(scopedEvent(data, scope, fill, event.id)) !== JSON.stringify(event)) throw readScopeError();
  const evidence = record(data.evidence), result = record(data.result);
  if (evidence.itemVersion !== fill.itemVersion || evidence.authorityVersion !== fill.authorityVersion || evidence.policyVersion !== policyVersion || result.fillId != null && result.fillId !== fill.id || result.prescriptionId != null && result.prescriptionId !== scope.prescriptionId || result.approvalId != null && result.approvalId !== event.approvalId || result.version != null && result.version !== event.version || result.refillRequestId != null && result.refillRequestId !== fill.refillRequestId || evidence.refillRequestId != null && evidence.refillRequestId !== fill.refillRequestId) throw readScopeError();
  if (evidence.readBindingVersion != null && (evidence.readBindingVersion !== 1 || evidence.purpose !== "prescription_fill_history" || evidence.fillId !== fill.id || evidence.prescriptionId !== scope.prescriptionId || evidence.prescriptionItemId !== fill.itemId || evidence.organizationId !== scope.organizationId || evidence.locationId !== scope.locationId || evidence.patientId !== scope.patientId || evidence.actorId !== event.actorId || evidence.refillRequestId !== fill.refillRequestId || evidence.fillVersion !== event.version)) throw readScopeError();
  if (event.action === "clinical_reviewed") {
    const reviewId = readId(evidence.clinicalSafetyReviewId);
    const review = tuple(await q.ClinicalSafetyReview.findOne({ where: { id: reviewId }, query: "id fillNumber organization { id } location { id } patient { id } prescription { id } pharmacist { id } approval { id }" }), scope);
    if (review.id !== reviewId || review.fillNumber !== fill.fillNumber || linkedId(review.pharmacist) !== event.actorId || linkedId(review.approval) !== event.approvalId) throw readScopeError();
    const detail = record(await q.ClinicalSafetyReview.findOne({ where: { id: reviewId }, query: "id evidenceSnapshot" }));
    const snapshot = record(detail.evidenceSnapshot);
    if (detail.id !== reviewId || snapshot.fillId !== fill.id || snapshot.fillVersion !== event.version || snapshot.itemVersion !== fill.itemVersion || snapshot.authorityVersion !== fill.authorityVersion || snapshot.requestFingerprint !== event.commandFingerprint) throw readScopeError();
  }
  let reason = null;
  if (event.approvalId) {
    const approval = record(await q.HumanApproval.findOne({ where: { id: event.approvalId }, query: "id organization { id } location { id } actor { id } actionType attested" }));
    const actionType = ["dispensed", "filled"].includes(event.action) ? "dispense" : event.action === "picked_up" ? "dispense" : event.action === "clinical_reviewed" ? "clinical_safety_review" : "prescription_review";
    if (approval.id !== event.approvalId || linkedId(approval.organization) !== scope.organizationId || linkedId(approval.location) !== scope.locationId || linkedId(approval.actor) !== event.actorId || approval.attested !== true || approval.actionType !== actionType) throw readScopeError();
    const bound = record(await q.HumanApproval.findOne({ where: { id: event.approvalId }, query: "id evidence" }));
    const binding = record(bound.evidence);
    if (binding.fillId != null) {
      if (bound.id !== event.approvalId || binding.fillId !== fill.id || binding.itemVersion != null && binding.itemVersion !== fill.itemVersion || binding.authorityVersion != null && binding.authorityVersion !== fill.authorityVersion) throw readScopeError();
      const privateApproval = record(await q.HumanApproval.findOne({ where: { id: event.approvalId }, query: "id reason" }));
      if (privateApproval.id !== event.approvalId || typeof privateApproval.reason !== "string") throw readScopeError();
      reason = privateApproval.reason;
    }
  }
  let orderId = null, orderNumber2 = null;
  if (result.orderId != null) {
    if (!["dispensed", "picked_up"].includes(event.action)) throw readScopeError();
    if (event.action === "dispensed") {
      const movementId = readId(evidence.movementId);
      const movement = tuple(await q.InventoryMovement.findOne({ where: { id: movementId }, query: "id requestFingerprint movementType quantityDelta organization { id } location { id } patient { id } prescription { id } prescriptionItem { id } order { id } actor { id } approval { id }" }), scope);
      if (movement.id !== movementId || movement.requestFingerprint !== event.commandFingerprint || movement.movementType !== "dispense" || movement.quantityDelta !== -event.quantity || linkedId(movement.prescriptionItem) !== fill.itemId || linkedId(movement.actor) !== event.actorId || linkedId(movement.approval) !== event.approvalId || linkedId(movement.order) !== result.orderId) throw readScopeError();
    }
    const id = readId(result.orderId);
    const order = tuple(await q.Order.findOne({ where: { id }, query: "id organization { id } location { id } patient { id } prescription { id }" }), scope);
    if (order.id !== id) throw readScopeError();
    const receipt = record(await q.Order.findOne({ where: { id }, query: "id orderNumber" }));
    if (receipt.id !== id || typeof receipt.orderNumber !== "string" || receipt.orderNumber !== result.orderNumber) throw readScopeError();
    orderId = id;
    orderNumber2 = receipt.orderNumber;
  }
  return { id: event.id, action: event.action, version: event.version, quantity: event.quantity, occurredAt: event.createdAt, actorName: "Recorded operator", reason, orderId, orderNumber: orderNumber2 };
}
async function readEventPage(context, scope, fill, take, boundary = {}) {
  const q = readStore(context);
  const records = await q.PrescriptionFillEvent.findMany({ where: { AND: [eventReadWhere(scope, fill), boundary] }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take, query: EVENT_READ_METADATA });
  records.forEach((value) => scopedEvent(value, scope, fill));
  return records;
}

// features/keystone/mutations/fillReadback.ts
async function authorizedFillReadback(context, prescriptionId) {
  if (!context.session?.itemId || !permissions.canViewPatientPrivateData({ session: context.session })) throw new DomainError("Patient private-data permission required");
  const permission2 = permissions.canReviewPrescriptions({ session: context.session }) ? "canReviewPrescriptions" : "canDispenseMedications";
  await currentFillPermission(context, permission2);
  const q = readStore(context);
  const actor = record(await q.User.findOne({ where: { id: context.session.itemId }, query: "id role { canViewPatientPrivateData canManageOrganizations canApproveConsequentialActions }" }));
  const role = record(actor.role);
  if (actor.id !== context.session.itemId || role.canViewPatientPrivateData !== true) throw new DomainError("Current patient private-data permission was revoked");
  const metadata = await q.Prescription.findOne({ where: { id: prescriptionId }, query: "id organization { id } location { id } patient { id } prescriber { id organization { id } } items { id prescription { id } }" });
  const scope = prescriptionReadScope(metadata, prescriptionId);
  await requireTenantMembership(context, { organizationId: scope.organizationId, locationId: scope.locationId, pharmacist: true });
  const p2 = record(await loadFillPrescription(context, prescriptionId));
  if (!sameScope(prescriptionReadScope(p2, prescriptionId), scope)) throw readScopeError();
  return { p: p2, role, scope };
}
async function pharmacyFillWorkbench(_root, args, context) {
  const { p: p2, role, scope } = await authorizedFillReadback(context, args.prescriptionId);
  const q = readStore(context);
  let boundary = {};
  if (args.after) {
    const cursor = readCursor(args.after, scope, "operator_fill_workbench");
    const anchor = scopedFill(await q.PrescriptionFill.findOne({ where: { id: cursor.id }, query: fillMetadataQuery }), scope, cursor.id);
    if (anchor.createdAt !== cursor.createdAt || anchor.version !== cursor.version) throw new DomainError("Invalid or stale fill cursor");
    boundary = cursorBoundary(cursor);
  }
  const base = fillReadWhere(scope);
  const records = await q.PrescriptionFill.findMany({ where: { AND: [base, boundary] }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 21, query: fillMetadataQuery });
  const validated = records.map((value) => scopedFill(value, scope));
  const projections = await Promise.all(validated.map((fill) => readFillProjection(context, scope, fill)));
  const page = validated.slice(0, 20);
  const fills = await Promise.all(page.map(async (fill, index) => {
    const projection = projections[index];
    const events = await readEventPage(context, scope, fill, 11);
    const projected = await Promise.all(events.map((event) => readEventProjection(context, scope, fill, event, projection.policyVersion)));
    return { ...projection, events: projected.slice(0, 10), hasMoreEvents: events.length > 10 };
  }));
  let canConfigure = false;
  if (role.canManageOrganizations === true && role.canApproveConsequentialActions === true) {
    try {
      await requireTenantMembership(context, { organizationId: scope.organizationId, organizationWide: true, pharmacist: true });
      canConfigure = true;
    } catch {
    }
  }
  const items = p2.items.map(record);
  const openItems = await Promise.all(items.map(async (item) => {
    const value = await q.PrescriptionFill.findOne({ where: { openKey: `item:${item.id}` }, query: fillMetadataQuery });
    if (!value) return null;
    const fill = scopedFill(value, scope);
    if (fill.itemId !== item.id || fill.openKey !== `item:${item.id}`) throw readScopeError();
    return fill;
  }));
  const last = page.at(-1);
  const totalCount = await q.PrescriptionFill.count({ where: base });
  if (!Number.isSafeInteger(totalCount) || totalCount < validated.length) throw readScopeError();
  return {
    organizationId: scope.organizationId,
    policyConfigured: Boolean(record(p2.organization).prescriptionFillPolicy && record(record(p2.organization).prescriptionFillPolicy).approvalId),
    canConfigure,
    items: items.map((item, index) => ({
      id: item.id,
      itemVersion: prescriptionItemVersion(p2, item),
      lineage: item.fillLineage || "legacy",
      originalReservable: item.fillLineage === FILL_LINEAGE && ["approved", "fill_closed"].includes(String(p2.status)) && item.quantityDispensed === 0 && item.refillsRemaining === item.refillsAuthorized && !openItems[index]
    })),
    fills,
    totalCount,
    hasMore: records.length > 20,
    nextCursor: records.length > 20 && last ? writeCursor(scope, "operator_fill_workbench", last) : null
  };
}

// features/keystone/mutations/fillHistory.ts
async function pharmacyFillHistory(_root, args, context) {
  const { scope } = await authorizedFillReadback(context, args.prescriptionId);
  const q = readStore(context);
  const value = await q.PrescriptionFill.findOne({ where: { id: args.fillId }, query: fillMetadataQuery });
  if (!value) throw new DomainError("Fill not found in current prescription scope");
  const fill = scopedFill(value, scope, args.fillId);
  let boundary = {};
  if (args.after) {
    const cursor = readCursor(args.after, scope, "operator_fill_history", fill.id);
    const anchor = scopedEvent(await q.PrescriptionFillEvent.findOne({ where: { id: cursor.id }, query: eventMetadataQuery }), scope, fill, cursor.id);
    if (anchor.createdAt !== cursor.createdAt || anchor.version !== cursor.version) throw new DomainError("Invalid or stale history cursor");
    boundary = cursorBoundary(cursor);
  }
  const records = await readEventPage(context, scope, fill, 21, boundary);
  const page = records.slice(0, 20);
  const projection = await readFillProjection(context, scope, fill);
  const projected = await Promise.all(records.map((event) => readEventProjection(context, scope, fill, event, projection.policyVersion)));
  const events = projected.slice(0, 20);
  const last = page.length ? scopedEvent(page[page.length - 1], scope, fill) : null;
  return {
    events,
    hasMore: records.length > 20,
    nextCursor: records.length > 20 && last ? writeCursor(scope, "operator_fill_history", last, fill.id) : null
  };
}

// features/keystone/mutations/lib/fulfillment-cancel.ts
var SETTLED_PAYMENT_STATUSES = /* @__PURE__ */ new Set(["refunded", "failed", "cancelled"]);
var OPEN_FULFILLMENT_STATUSES = /* @__PURE__ */ new Set(["pending", "preparing", "ready", "out_for_delivery"]);
function isUnpaidPickupPayment(payment) {
  return typeof payment === "object" && payment !== null && payment.status === "pending" && payment.provider?.createPaymentFunction === "manual";
}
function canCancelFulfillment(fulfillmentStatus, payments) {
  if (!fulfillmentStatus || !OPEN_FULFILLMENT_STATUSES.has(fulfillmentStatus)) return false;
  return payments.every((payment) => isUnpaidPickupPayment(payment) || SETTLED_PAYMENT_STATUSES.has(String(typeof payment === "object" ? payment?.status || "" : payment || "")));
}
var FORWARD_TRANSITIONS = {
  pending: ["preparing"],
  preparing: ["ready"],
  ready: ["handed_off"]
};
function availableFulfillmentTransitions(fulfillmentStatus, payments) {
  const forward = FORWARD_TRANSITIONS[fulfillmentStatus || ""] || [];
  return canCancelFulfillment(fulfillmentStatus, payments) ? [...forward, "cancelled"] : forward;
}

// features/keystone/mutations/pickupNotice.ts
async function deliver(context, notice) {
  const sudo = context.sudo();
  const record2 = (suffix, eventType, metadata) => sudo.prisma.auditEvent.create({ data: {
    eventKey: `notice.pickup_ready:${notice.noticeKey}${suffix}`,
    eventType,
    actorType: "system",
    organizationId: notice.organizationId,
    locationId: notice.locationId,
    patientId: notice.patientId || null,
    resourceType: notice.resourceType,
    resourceId: notice.resourceId,
    metadata: { channel: "email", kind: notice.kind, ...metadata }
  } });
  const to = notice.to?.trim();
  if (!to || !notice.consented) {
    await record2("", "notice.pickup_ready.skipped", { reason: !to ? "no_email" : "patient_preference" }).catch(() => {
    });
    return;
  }
  try {
    await record2("", "notice.pickup_ready.claimed", {});
  } catch {
    return;
  }
  try {
    const { requestOrigin: requestOrigin2, sendPickupReadyEmail: sendPickupReadyEmail2 } = await Promise.resolve().then(() => (init_mail(), mail_exports));
    const [organization, location] = await Promise.all([
      sudo.query.Organization.findOne({ where: { id: notice.organizationId }, query: "name operatorDisplayName supportPhone" }),
      sudo.query.PharmacyLocation.findOne({ where: { id: notice.locationId }, query: "name phone" })
    ]);
    const origin = requestOrigin2(context.req);
    const result = await sendPickupReadyEmail2({
      to,
      storeName: organization?.operatorDisplayName || organization?.name || "Pharmacy",
      kind: notice.kind,
      reference: notice.reference,
      locationName: location?.name || "the pharmacy",
      phone: location?.phone || organization?.supportPhone,
      url: origin ? `${origin}${notice.path}` : ""
    });
    await record2(":result", result.sent ? "notice.pickup_ready.sent" : "notice.pickup_ready.skipped", result.sent ? { messageId: result.messageId || null } : { reason: "email_not_configured" });
  } catch (error) {
    await record2(":result", "notice.pickup_ready.failed", { error: error instanceof Error ? error.message.slice(0, 300) : "send_failed" }).catch(() => {
    });
  }
}
async function notifyPrescriptionReady(context, input) {
  try {
    const prescription = await context.sudo().query.Prescription.findOne({
      where: { id: input.prescriptionId },
      query: "id prescriptionNumber status organization { id } location { id } patient { id email preferredContactMethod user { email } }"
    });
    if (!prescription || prescription.status !== "ready_for_pickup") return;
    const patient = prescription.patient;
    const preference = patient?.preferredContactMethod || "none";
    await deliver(context, {
      kind: "prescription",
      noticeKey: `fill:${input.fillId}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      patientId: patient?.id,
      resourceType: "PrescriptionFill",
      resourceId: input.fillId,
      reference: prescription.prescriptionNumber || "",
      to: patient?.email || patient?.user?.email,
      // Phone/SMS-only patients are called from will-call; email/portal/none (no stated preference) get email.
      consented: !["phone", "sms"].includes(preference),
      path: "/prescriptions"
    });
  } catch (error) {
    console.error("Prescription ready notice failed:", error instanceof Error ? error.message : "unknown");
  }
}
async function notifyOrderReady(context, input) {
  try {
    const fulfillment = await context.sudo().query.Fulfillment.findOne({
      where: { id: input.fulfillmentId },
      query: "id method status organization { id } location { id } order { id orderNumber email customer { email } patient { id } }"
    });
    if (!fulfillment?.order || fulfillment.method !== "pickup" || fulfillment.status !== "ready") return;
    const order = fulfillment.order;
    await deliver(context, {
      kind: "order",
      noticeKey: `fulfillment:${fulfillment.id}`,
      organizationId: fulfillment.organization.id,
      locationId: fulfillment.location.id,
      patientId: order.patient?.id,
      resourceType: "Fulfillment",
      resourceId: fulfillment.id,
      reference: order.orderNumber,
      to: order.email || order.customer?.email,
      consented: true,
      path: `/order-status?${new URLSearchParams({ orderId: order.id })}`
    });
  } catch (error) {
    console.error("Order ready notice failed:", error instanceof Error ? error.message : "unknown");
  }
}

// features/keystone/mutations/fulfillmentWorkflows.ts
var ORDER_STATUS = {
  preparing: "processing",
  ready: "ready",
  out_for_delivery: "out_for_delivery",
  handed_off: "completed",
  cancelled: "cancelled"
};
async function transitionOrderFulfillment(_root, args, context) {
  requirePermission(context, "canManageOrders");
  if (!ORDER_STATUS[args.status]) throw new DomainError("Unsupported fulfillment status");
  const result = await transitionInTransaction(args, context);
  if (args.status === "ready") await notifyOrderReady(context, { fulfillmentId: args.fulfillmentId });
  return result;
}
async function transitionInTransaction(args, context) {
  return withDomainTransaction(context, [`fulfillment:${args.fulfillmentId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const fulfillment = await sudo.query.Fulfillment.findOne({
      where: { id: args.fulfillmentId },
      query: "id method status organization { id } location { id } assignedTo { id } order { id status lineItems { id prescriptionRequirementSnapshot lotAllocationSnapshot product { id } } patient { id } approval { id } payments { id status provider { createPaymentFunction } } }"
    });
    if (!fulfillment?.order) throw new DomainError("Fulfillment not found");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: fulfillment.organization.id,
      locationId: fulfillment.location.id
    });
    if (args.status === "out_for_delivery" && fulfillment.method !== "delivery") throw new DomainError("Only delivery orders can go out for delivery");
    if (args.status === "cancelled" && fulfillment.status !== "cancelled" && !canCancelFulfillment(fulfillment.status, fulfillment.order.payments || [])) {
      throw new DomainError("Cancelling a paid order requires a refund; use the refund action instead");
    }
    const assigneeId = fulfillment.assignedTo?.id || userId;
    if (args.status === "handed_off" && assigneeId !== userId) throw new DomainError("Only the assigned staff member can record the handoff");
    const payments = fulfillment.order.payments || [];
    const pickupPayments = payments.filter((payment) => payment.status === "pending" && isManualPaymentProvider(payment.provider || {}));
    if (args.status === "handed_off" && !payments.some((payment) => payment.status === "captured") && !pickupPayments.length) throw new DomainError("Payment must be captured before handoff");
    if (fulfillment.status === args.status) {
      return { success: true, reused: true, fulfillmentId: fulfillment.id, orderId: fulfillment.order.id, status: args.status, approvalId: fulfillment.order.approval?.id };
    }
    const consequential = ["handed_off", "cancelled"].includes(args.status);
    const approval = consequential ? await createHumanApproval(transactionContext, {
      organizationId: fulfillment.organization.id,
      locationId: fulfillment.location.id,
      actorId: userId,
      actionType: "order_handoff",
      reason: args.reason,
      attested: args.attested,
      evidence: { fulfillmentId: fulfillment.id, previousStatus: fulfillment.status, status: args.status }
    }) : null;
    if (args.status === "cancelled" && pickupPayments.length) {
      if (fulfillment.method !== "pickup" || !["pending", "preparing", "ready"].includes(fulfillment.status)) throw new DomainError("Unpaid cancellation requires an uncollected pickup order");
      const lines = fulfillment.order.lineItems || [];
      if (lines.some((line) => line.prescriptionRequirementSnapshot !== "none")) throw new DomainError("Prescription orders require the pharmacist return-to-stock workflow");
      const allocations = lines.flatMap((line) => {
        if (!Array.isArray(line.lotAllocationSnapshot) || !line.product?.id) throw new DomainError("Missing original inventory allocation");
        return line.lotAllocationSnapshot.map((allocation) => ({ ...allocation, productId: line.product.id, lineId: line.id }));
      });
      if (allocations.some((a) => !a.lotId || !Number.isSafeInteger(a.quantity) || a.quantity <= 0)) throw new DomainError("Invalid original inventory allocation");
      await acquireTransactionLocks(transactionContext, allocations.map((a) => `lot:${a.lotId}`));
      for (const allocation of allocations) {
        const lot = await sudo.query.InventoryLot.findOne({ where: { id: allocation.lotId }, query: "id quantityAvailable product { id organization { id } } location { id }" });
        if (!lot || lot.product?.id !== allocation.productId || lot.product.organization?.id !== fulfillment.organization.id || lot.location?.id !== fulfillment.location.id) throw new DomainError("Allocation does not match this tenant lot");
        await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { quantityAvailable: lot.quantityAvailable + allocation.quantity } });
        await sudo.query.InventoryMovement.createOne({ data: {
          movementType: "release",
          quantityDelta: allocation.quantity,
          reason: args.reason,
          idempotencyKey: `cancel:${fulfillment.id}:${allocation.lineId}:${lot.id}`,
          organization: { connect: { id: fulfillment.organization.id } },
          location: { connect: { id: fulfillment.location.id } },
          product: { connect: { id: allocation.productId } },
          lot: { connect: { id: lot.id } },
          order: { connect: { id: fulfillment.order.id } },
          actor: { connect: { id: userId } },
          approval: { connect: { id: approval.id } }
        } });
      }
      for (const payment of payments.filter(isUnpaidPickupPayment)) {
        await sudo.query.Payment.updateOne({ where: { id: payment.id }, data: { status: "cancelled", processedAt: (/* @__PURE__ */ new Date()).toISOString(), recordedBy: { connect: { id: userId } }, approval: { connect: { id: approval.id } } } });
      }
    }
    if (args.status === "handed_off") {
      for (const payment of pickupPayments) {
        await sudo.query.Payment.updateOne({
          where: { id: payment.id },
          data: { status: "captured", processedAt: (/* @__PURE__ */ new Date()).toISOString(), recordedBy: { connect: { id: userId } }, ...approval ? { approval: { connect: { id: approval.id } } } : {} },
          query: "id"
        });
      }
    }
    await sudo.query.Fulfillment.updateOne({ where: { id: fulfillment.id }, data: { status: args.status, ...args.status === "preparing" || !fulfillment.assignedTo ? { assignedTo: { connect: { id: userId } } } : {} } });
    await sudo.query.Order.updateOne({
      where: { id: fulfillment.order.id },
      data: { status: ORDER_STATUS[args.status], ...approval ? { approval: { connect: { id: approval.id } } } : {} }
    });
    await recordAudit(transactionContext, {
      eventKey: `fulfillment.${args.status}:${fulfillment.id}`,
      organizationId: fulfillment.organization.id,
      locationId: fulfillment.location.id,
      actorId: userId,
      patientId: fulfillment.order.patient?.id,
      eventType: `fulfillment.${args.status}`,
      resourceType: "Fulfillment",
      resourceId: fulfillment.id,
      metadata: { orderId: fulfillment.order.id, previousStatus: fulfillment.status, approvalId: approval?.id || null }
    });
    return { success: true, reused: false, fulfillmentId: fulfillment.id, orderId: fulfillment.order.id, status: args.status, approvalId: approval?.id };
  });
}

// features/keystone/mutations/prescriptionRequests.ts
var import_node_crypto9 = require("node:crypto");
var import_graphql3 = require("graphql");
var KINDS = ["registration", "transfer", "new_prescription", "refill"];
var RESOLUTIONS = ["in_review", "completed", "declined"];
var REQUEST_FIELDS = "id kind status createdAt resolvedAt resolutionNote firstName lastName dateOfBirth phone email allergies insurance counterpartyName counterpartyPhone prescriberName prescriberPhone medications note organization { id } location { id name } user { id name email } patient { id }";
function userInputError2(message) {
  return new import_graphql3.GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}
function clean(value, max) {
  const text44 = String(value ?? "").trim();
  if (text44.length > max) throw userInputError2(`Keep each answer under ${max} characters.`);
  return text44;
}
function customerProjection(request) {
  return { id: request.id, kind: request.kind, status: request.status, createdAt: request.createdAt, resolvedAt: request.resolvedAt, resolutionNote: request.resolutionNote || null, locationName: request.location?.name || "Pharmacy", counterpartyName: request.counterpartyName || null, medications: request.medications || null };
}
function staffProjection(request) {
  return {
    ...customerProjection(request),
    customerName: request.user?.name || "",
    customerEmail: request.user?.email || "",
    organizationId: request.organization?.id || "",
    patientId: request.patient?.id || null,
    firstName: request.firstName || null,
    lastName: request.lastName || null,
    dateOfBirth: request.dateOfBirth || null,
    phone: request.phone || null,
    email: request.email || null,
    allergies: request.allergies || null,
    insurance: request.insurance || null,
    counterpartyPhone: request.counterpartyPhone || null,
    prescriberName: request.prescriberName || null,
    prescriberPhone: request.prescriberPhone || null,
    note: request.note || null
  };
}
function requireCustomer(context) {
  const userId = context.session?.itemId;
  if (!userId || context.session?.listKey !== "User") throw userInputError2("Sign in to send a request.");
  return String(userId);
}
async function submitPharmacyPrescriptionRequest(_root, args, context) {
  const userId = requireCustomer(context);
  const input = args.input;
  if (!KINDS.includes(input.kind)) throw userInputError2("Choose a request type.");
  const kind = input.kind;
  const idempotencyKey = clean(input.idempotencyKey, 200);
  if (!idempotencyKey) throw userInputError2("A request key is required.");
  const sudo = context.sudo();
  const existing = await sudo.query.PrescriptionRequest.findOne({ where: { idempotencyKey }, query: `${REQUEST_FIELDS}` });
  if (existing) {
    if (existing.user?.id !== userId) throw userInputError2("This request key is already in use.");
    return customerProjection(existing);
  }
  const location = await sudo.query.PharmacyLocation.findOne({ where: { id: input.locationId }, query: "id status organization { id status }" });
  if (!location || location.status !== "active" || location.organization?.status !== "active") throw userInputError2("Choose an open pharmacy location.");
  const data = {
    firstName: clean(input.firstName, 120),
    lastName: clean(input.lastName, 120),
    phone: clean(input.phone, 40),
    allergies: clean(input.allergies, 1e3),
    insurance: clean(input.insurance, 1e3),
    counterpartyName: clean(input.counterpartyName, 200),
    counterpartyPhone: clean(input.counterpartyPhone, 40),
    prescriberName: clean(input.prescriberName, 200),
    prescriberPhone: clean(input.prescriberPhone, 40),
    medications: clean(input.medications, 2e3),
    note: clean(input.note, 1e3)
  };
  const dateOfBirth = input.dateOfBirth ? /* @__PURE__ */ new Date(`${String(input.dateOfBirth).slice(0, 10)}T00:00:00.000Z`) : null;
  if (dateOfBirth && (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth.getTime() > Date.now())) throw userInputError2("Enter a valid date of birth.");
  if (!data.phone) throw userInputError2("Enter a phone number the pharmacy can call.");
  if (kind === "registration") {
    if (!data.firstName || !data.lastName || !dateOfBirth) throw userInputError2("Enter your legal name and date of birth.");
    if (!data.allergies) throw userInputError2('List your allergies, or enter "None".');
  }
  if (kind === "transfer" && (!data.counterpartyName || !data.medications)) throw userInputError2("Enter the pharmacy to transfer from and the medications.");
  if (kind === "new_prescription" && (!data.prescriberName || !data.medications)) throw userInputError2("Enter the prescriber and the medications.");
  if (kind === "refill" && !data.medications) throw userInputError2("Enter the Rx number from your label.");
  const user = await sudo.query.User.findOne({ where: { id: userId }, query: "id email patientProfile { id }" });
  const request = await sudo.query.PrescriptionRequest.createOne({
    data: {
      idempotencyKey,
      kind,
      status: "requested",
      organization: { connect: { id: location.organization.id } },
      location: { connect: { id: location.id } },
      user: { connect: { id: userId } },
      ...user?.patientProfile?.id ? { patient: { connect: { id: user.patientProfile.id } } } : {},
      ...data,
      email: user?.email || "",
      dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null
    },
    query: REQUEST_FIELDS
  });
  await recordAudit(context, {
    eventKey: `prescription_request.submitted:${request.id}`,
    organizationId: location.organization.id,
    locationId: location.id,
    actorId: userId,
    patientId: user?.patientProfile?.id || void 0,
    eventType: "prescription_request.submitted",
    resourceType: "PrescriptionRequest",
    resourceId: request.id,
    metadata: { kind, fingerprint: (0, import_node_crypto9.createHash)("sha256").update(idempotencyKey).digest("hex") }
  });
  return customerProjection(request);
}
async function pharmacyCustomerPrescriptionRequests(_root, _args, context) {
  const userId = requireCustomer(context);
  const requests = await context.sudo().query.PrescriptionRequest.findMany({ where: { user: { id: { equals: userId } } }, orderBy: [{ createdAt: "desc" }], take: 25, query: REQUEST_FIELDS });
  return requests.map(customerProjection);
}
function canWorkRequests(context) {
  const session = context.session;
  return permissions.canManagePatients({ session }) || permissions.canManagePrescriptions({ session });
}
async function pharmacyPrescriptionRequestQueue(_root, args, context) {
  const userId = context.session?.itemId;
  if (!userId) throw new DomainError("Authentication required");
  if (!canWorkRequests(context)) throw new DomainError("Permission required: canManagePatients or canManagePrescriptions");
  const sudo = context.sudo();
  const memberships = await sudo.query.OrganizationMembership.findMany({
    where: { user: { id: { equals: String(userId) } }, status: { equals: "active" }, organization: { status: { equals: "active" } } },
    query: "organization { id } location { id }"
  });
  const scopes = memberships.map((membership) => membership.location?.id ? { location: { id: { equals: membership.location.id } } } : { organization: { id: { equals: membership.organization.id } } });
  if (!scopes.length) return [];
  const status = args.status && ["requested", ...RESOLUTIONS].includes(args.status) ? args.status : null;
  const requests = await sudo.query.PrescriptionRequest.findMany({
    where: { AND: [{ OR: scopes }, ...status ? [{ status: { equals: status } }] : [], ...args.requestId ? [{ id: { equals: args.requestId } }] : []] },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    query: REQUEST_FIELDS
  });
  return requests.map(staffProjection);
}
async function resolvePharmacyPrescriptionRequest(_root, args, context) {
  if (!canWorkRequests(context)) throw new DomainError("Permission required: canManagePatients or canManagePrescriptions");
  if (!RESOLUTIONS.includes(args.status)) throw new DomainError("Choose in review, completed or declined");
  const note = clean(args.note, 1e3);
  if (args.status === "declined" && note.length < 3) throw userInputError2("Give the reason for declining.");
  const sudo = context.sudo();
  const request = await sudo.query.PrescriptionRequest.findOne({ where: { id: args.requestId }, query: REQUEST_FIELDS });
  if (!request) throw new DomainError("Request not found");
  const { userId } = await requireTenantMembership(context, { organizationId: request.organization.id, locationId: request.location.id });
  if (["completed", "declined"].includes(request.status)) throw userInputError2("This request is already closed.");
  const terminal = args.status !== "in_review";
  const patient = args.patientId ? await sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: "id user { id } organizations { id }" }) : null;
  if (args.patientId && !patient?.organizations?.some((organization) => organization.id === request.organization.id)) throw new DomainError("Patient not found in this pharmacy");
  if (patient && !patient.user && request.user?.id) {
    const customer = await sudo.query.User.findOne({ where: { id: request.user.id }, query: "id patientProfile { id }" });
    if (customer && !customer.patientProfile) {
      await sudo.query.PatientProfile.updateOne({ where: { id: patient.id }, data: { user: { connect: { id: customer.id } } } });
      await recordAudit(context, {
        eventKey: `patient.account_linked:${patient.id}:${customer.id}`,
        organizationId: request.organization.id,
        actorId: String(userId),
        patientId: patient.id,
        eventType: "patient.account_linked",
        resourceType: "PatientProfile",
        resourceId: patient.id,
        metadata: { userId: customer.id, requestId: request.id }
      });
    }
  }
  const updated = await sudo.query.PrescriptionRequest.updateOne({
    where: { id: request.id },
    data: { status: args.status, resolutionNote: note || request.resolutionNote || "", ...patient ? { patient: { connect: { id: patient.id } } } : {}, ...terminal ? { resolvedAt: (/* @__PURE__ */ new Date()).toISOString(), resolvedBy: { connect: { id: String(userId) } } } : {} },
    query: REQUEST_FIELDS
  });
  await recordAudit(context, {
    eventKey: `prescription_request.${args.status}:${request.id}`,
    organizationId: request.organization.id,
    locationId: request.location.id,
    actorId: String(userId),
    patientId: request.patient?.id || void 0,
    eventType: `prescription_request.${args.status}`,
    resourceType: "PrescriptionRequest",
    resourceId: request.id,
    metadata: { kind: request.kind }
  });
  return staffProjection(updated);
}

// features/keystone/mutations/inventoryWorkflows.ts
var import_node_crypto10 = require("node:crypto");

// features/keystone/workflows/product-location.ts
function isProductAtActiveTenantLocation(product, location) {
  return Boolean(
    product && location && location.status === "active" && location.organization?.status === "active" && location.organization.id && location.id && product.organization?.id === location.organization.id && product.location?.id === location.id
  );
}

// features/keystone/mutations/inventoryWorkflows.ts
async function receiveInventoryLot(_root, args, context) {
  requirePermission(context, "canManageInventory");
  if (!Number.isInteger(args.quantity) || args.quantity < 1) throw new DomainError("Received quantity must be a positive integer");
  if (!args.idempotencyKey?.trim() || !args.lotNumber?.trim()) throw new DomainError("Lot number and idempotency key are required");
  const expirationDate = new Date(args.expirationDate);
  if (Number.isNaN(expirationDate.getTime()) || expirationDate.getTime() <= Date.now()) throw new DomainError("Expiration date must be in the future");
  if (args.coldChainRequired) {
    if (typeof args.minimumTemperatureC !== "number" || typeof args.maximumTemperatureC !== "number" || args.minimumTemperatureC >= args.maximumTemperatureC) throw new DomainError("Cold-chain receipt needs a storage range with the minimum below the maximum");
    if (!args.coldChainEvidenceComplete) throw new DomainError("Review the shipment temperature log before receiving cold-chain stock");
  }
  const requestFingerprint = (0, import_node_crypto10.createHash)("sha256").update(JSON.stringify({ productId: args.productId, locationId: args.locationId, supplierId: args.supplierId || null, lotNumber: args.lotNumber.trim(), serialNumber: args.serialNumber?.trim() || null, expirationDate: expirationDate.toISOString(), quantity: args.quantity, coldChainRequired: args.coldChainRequired, minimumTemperatureC: args.minimumTemperatureC ?? null, maximumTemperatureC: args.maximumTemperatureC ?? null, coldChainEvidenceComplete: args.coldChainEvidenceComplete, reason: args.reason?.trim(), attested: args.attested })).digest("hex");
  return withDomainTransaction(context, [`inventory-idempotency:${args.idempotencyKey}`, `product:${args.productId}`, `lot-number:${args.locationId}:${args.lotNumber}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.InventoryMovement.findOne({ where: { idempotencyKey: args.idempotencyKey }, query: "id requestFingerprint lot { id quantityAvailable location { id } product { organization { id } } }" });
    if (existing) {
      const organizationId = existing.lot?.product?.organization?.id;
      const locationId = existing.lot?.location?.id;
      if (!organizationId || !locationId) throw new DomainError("Receiving replay scope is incomplete; operator reconciliation is required");
      await requireTenantMembership(transactionContext, { organizationId, locationId });
      if (existing.requestFingerprint !== requestFingerprint) throw new DomainError("Receiving idempotency key was reused with different input");
      return { success: true, reused: true, movementId: existing.id, lotId: existing.lot.id, quantityAvailable: existing.lot.quantityAvailable };
    }
    const [product, location, supplier] = await Promise.all([
      sudo.query.Product.findOne({ where: { id: args.productId }, query: "id organization { id } location { id } coldChainRequired" }),
      sudo.query.PharmacyLocation.findOne({ where: { id: args.locationId }, query: "id status organization { id status }" }),
      args.supplierId ? sudo.query.Supplier.findOne({ where: { id: args.supplierId }, query: "id organization { id } status" }) : null
    ]);
    if (!isProductAtActiveTenantLocation(product, location)) {
      throw new DomainError("This product cannot be received at this location");
    }
    if (product.coldChainRequired && !args.coldChainRequired) throw new DomainError("This product is cold-chain; receive it with its storage range and temperature log");
    if (!product.coldChainRequired && args.coldChainRequired) throw new DomainError("This product is not marked cold-chain; update the product before receiving it refrigerated");
    if (args.supplierId && (!supplier || supplier.organization?.id !== location.organization.id || supplier.status !== "active")) {
      throw new DomainError("Supplier must be active in the receiving organization");
    }
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: location.organization.id, locationId: location.id });
    const approval = await createHumanApproval(transactionContext, {
      organizationId: location.organization.id,
      locationId: location.id,
      actorId: userId,
      actionType: "inventory_adjustment",
      reason: args.reason,
      attested: args.attested,
      evidence: { action: "receive", lotNumber: args.lotNumber.trim(), quantity: args.quantity, idempotencyKey: args.idempotencyKey }
    });
    const lot = await sudo.query.InventoryLot.createOne({
      data: {
        lotNumber: args.lotNumber.trim(),
        serialNumber: args.serialNumber?.trim() || void 0,
        expirationDate: expirationDate.toISOString(),
        quantityReceived: args.quantity,
        quantityAvailable: args.quantity,
        quantityQuarantined: 0,
        status: "available",
        coldChainRequired: args.coldChainRequired,
        minimumTemperatureC: args.coldChainRequired ? args.minimumTemperatureC : null,
        maximumTemperatureC: args.coldChainRequired ? args.maximumTemperatureC : null,
        coldChainEvidenceComplete: true,
        product: { connect: { id: product.id } },
        location: { connect: { id: location.id } },
        supplier: supplier ? { connect: { id: supplier.id } } : void 0
      },
      query: "id quantityAvailable"
    });
    const movement = await sudo.query.InventoryMovement.createOne({
      data: {
        movementType: "receive",
        quantityDelta: args.quantity,
        reason: args.reason,
        idempotencyKey: args.idempotencyKey,
        requestFingerprint,
        organization: { connect: { id: location.organization.id } },
        location: { connect: { id: location.id } },
        product: { connect: { id: product.id } },
        lot: { connect: { id: lot.id } },
        actor: { connect: { id: userId } },
        approval: { connect: { id: approval.id } }
      },
      query: "id"
    });
    await recordAudit(transactionContext, {
      eventKey: `inventory.received:${args.idempotencyKey}`,
      organizationId: location.organization.id,
      locationId: location.id,
      actorId: userId,
      eventType: "inventory.received",
      resourceType: "InventoryLot",
      resourceId: lot.id,
      metadata: { movementId: movement.id, productId: product.id, lotNumber: args.lotNumber.trim(), serialRecorded: Boolean(args.serialNumber?.trim()), quantity: args.quantity }
    });
    return { success: true, reused: false, movementId: movement.id, lotId: lot.id, quantityAvailable: lot.quantityAvailable, approvalId: approval.id };
  });
}
async function adjustInventoryLot(_root, args, context) {
  requirePermission(context, "canManageInventory");
  if (!Number.isInteger(args.targetQuantity) || args.targetQuantity < 0) throw new DomainError("Target quantity must be a non-negative integer");
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  const requestFingerprint = (0, import_node_crypto10.createHash)("sha256").update(JSON.stringify({ lotId: args.lotId, targetQuantity: args.targetQuantity, reason: args.reason?.trim(), attested: args.attested })).digest("hex");
  return withDomainTransaction(context, [`inventory-idempotency:${args.idempotencyKey}`, `lot:${args.lotId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.InventoryMovement.findOne({
      where: { idempotencyKey: args.idempotencyKey },
      query: "id quantityDelta requestFingerprint lot { id quantityAvailable product { organization { id } } location { id } }"
    });
    if (existing) {
      const organizationId = existing.lot?.product?.organization?.id;
      const locationId = existing.lot?.location?.id;
      if (!organizationId || !locationId) throw new DomainError("Inventory replay scope is incomplete; operator reconciliation is required");
      await requireTenantMembership(transactionContext, { organizationId, locationId });
      if (existing.lot?.id !== args.lotId || existing.requestFingerprint !== requestFingerprint) throw new DomainError("Inventory idempotency key was reused with different input");
      return { success: true, reused: true, movementId: existing.id, quantityAvailable: existing.lot.quantityAvailable };
    }
    const lot = await sudo.query.InventoryLot.findOne({
      where: { id: args.lotId },
      query: "id quantityAvailable quantityQuarantined status product { id organization { id } } location { id }"
    });
    if (!lot) throw new DomainError("Inventory lot not found");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: lot.product.organization.id,
      locationId: lot.location.id
    });
    if (["recalled", "expired"].includes(lot.status)) throw new DomainError(`A ${lot.status} lot cannot be adjusted; use its recall or disposal workflow`);
    if (args.targetQuantity < lot.quantityQuarantined) throw new DomainError("Available quantity cannot be lower than quarantined quantity");
    const approval = await createHumanApproval(transactionContext, {
      organizationId: lot.product.organization.id,
      locationId: lot.location.id,
      actorId: userId,
      actionType: "inventory_adjustment",
      reason: args.reason,
      attested: args.attested,
      evidence: { previousQuantity: lot.quantityAvailable, targetQuantity: args.targetQuantity, idempotencyKey: args.idempotencyKey }
    });
    const quantityDelta = args.targetQuantity - lot.quantityAvailable;
    await sudo.query.InventoryLot.updateOne({
      where: { id: lot.id },
      // Counting stock back in revives a depleted lot; counting a quarantined lot to zero keeps it quarantined.
      data: { quantityAvailable: args.targetQuantity, ...lotStatusAfterAdjustment(lot.status, args.targetQuantity) ? { status: lotStatusAfterAdjustment(lot.status, args.targetQuantity) } : {} }
    });
    const movement = await sudo.query.InventoryMovement.createOne({
      data: {
        movementType: "adjust",
        quantityDelta,
        reason: args.reason,
        idempotencyKey: args.idempotencyKey,
        requestFingerprint,
        organization: { connect: { id: lot.product.organization.id } },
        location: { connect: { id: lot.location.id } },
        product: { connect: { id: lot.product.id } },
        lot: { connect: { id: lot.id } },
        actor: { connect: { id: userId } },
        approval: { connect: { id: approval.id } }
      },
      query: "id"
    });
    await recordAudit(transactionContext, {
      eventKey: `inventory.adjusted:${args.idempotencyKey}`,
      organizationId: lot.product.organization.id,
      locationId: lot.location.id,
      actorId: userId,
      eventType: "inventory.adjusted",
      resourceType: "InventoryLot",
      resourceId: lot.id,
      metadata: { movementId: movement.id, quantityDelta, quantityAvailable: args.targetQuantity }
    });
    return { success: true, reused: false, movementId: movement.id, quantityAvailable: args.targetQuantity };
  });
}
async function quarantineRecallLots(_root, args, context) {
  requirePermission(context, "canManageRecalls");
  const candidate = await context.sudo().query.Recall.findOne({ where: { id: args.recallId }, query: "id lots { id }" });
  if (!candidate) throw new DomainError("Recall not found");
  return withDomainTransaction(
    context,
    [`recall:${args.recallId}`, ...candidate.lots.map((lot) => `lot:${lot.id}`)],
    async (transactionContext) => {
      const sudo = transactionContext.sudo();
      const recall = await sudo.query.Recall.findOne({
        where: { id: args.recallId },
        query: "id status organization { id } location { id } approval { id } lots { id quantityAvailable product { id } location { id } }"
      });
      if (!recall) throw new DomainError("Recall not found");
      const { userId } = await requireTenantMembership(transactionContext, {
        organizationId: recall.organization.id,
        locationId: recall.location?.id,
        organizationWide: !recall.location?.id
      });
      if (recall.status === "quarantined") {
        return { success: true, reused: true, recallId: recall.id, status: recall.status, lotCount: recall.lots.length, approvalId: recall.approval?.id };
      }
      if (recall.status !== "active") throw new DomainError("Recall must be active before quarantine");
      if (!recall.lots.length) throw new DomainError("Recall has no affected lots");
      const approval = await createHumanApproval(transactionContext, {
        organizationId: recall.organization.id,
        locationId: recall.location?.id,
        actorId: userId,
        actionType: "recall_disposition",
        reason: args.reason,
        attested: args.attested,
        evidence: { recallId: recall.id, lotCount: recall.lots.length }
      });
      for (const lot of recall.lots) {
        await sudo.query.InventoryLot.updateOne({
          where: { id: lot.id },
          data: { status: "recalled", quantityQuarantined: lot.quantityAvailable }
        });
        await sudo.query.InventoryMovement.createOne({
          data: {
            movementType: "recall",
            quantityDelta: 0,
            reason: args.reason,
            idempotencyKey: `recall:${recall.id}:lot:${lot.id}`,
            organization: { connect: { id: recall.organization.id } },
            location: { connect: { id: lot.location.id } },
            product: { connect: { id: lot.product.id } },
            lot: { connect: { id: lot.id } },
            actor: { connect: { id: userId } },
            approval: { connect: { id: approval.id } }
          }
        });
      }
      await sudo.query.Recall.updateOne({
        where: { id: recall.id },
        data: { status: "quarantined", approval: { connect: { id: approval.id } } }
      });
      await recordAudit(transactionContext, {
        eventKey: `recall.quarantined:${recall.id}`,
        organizationId: recall.organization.id,
        locationId: recall.location?.id,
        actorId: userId,
        eventType: "recall.lots_quarantined",
        resourceType: "Recall",
        resourceId: recall.id,
        metadata: { lotIds: recall.lots.map((lot) => lot.id), approvalId: approval.id }
      });
      return { success: true, reused: false, recallId: recall.id, status: "quarantined", lotCount: recall.lots.length, approvalId: approval.id };
    }
  );
}

// features/keystone/workflows/external-integration-idempotency.ts
var import_node_crypto11 = require("node:crypto");
function canonicalize2(value) {
  if (Array.isArray(value)) return value.map(canonicalize2);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize2(entry)])
    );
  }
  return value;
}
function fingerprint(value) {
  return (0, import_node_crypto11.createHash)("sha256").update(JSON.stringify(canonicalize2(value))).digest("hex");
}
function externalIntegrationRequestMatches(existing, request) {
  if (!existing.provider?.id || !existing.organization?.id || !existing.location?.id || existing.requestPayload == null) return false;
  return fingerprint({
    providerId: existing.provider.id,
    workflowType: existing.workflowType,
    resourceType: existing.resourceType,
    resourceId: existing.resourceId,
    idempotencyKey: existing.idempotencyKey,
    organizationId: existing.organization.id,
    locationId: existing.location.id,
    payload: existing.requestPayload
  }) === fingerprint(request);
}

// features/keystone/mutations/integrationWorkflows.ts
init_manual2();

// import("../../integrations/**/*/**/*.ts") in features/keystone/utils/integrationProviderAdapter.ts
var globImport_integrations_ts = __glob({
  "../../integrations/erx/index.ts": () => Promise.resolve().then(() => (init_erx(), erx_exports)),
  "../../integrations/erx/manual.ts": () => Promise.resolve().then(() => (init_manual2(), manual_exports2)),
  "../../integrations/insurance/index.ts": () => Promise.resolve().then(() => (init_insurance(), insurance_exports)),
  "../../integrations/insurance/manual.ts": () => Promise.resolve().then(() => (init_manual3(), manual_exports3)),
  "../../integrations/payment/index.ts": () => Promise.resolve().then(() => (init_payment(), payment_exports)),
  "../../integrations/payment/manual.ts": () => Promise.resolve().then(() => (init_manual(), manual_exports)),
  "../../integrations/payment/paypal.ts": () => Promise.resolve().then(() => (init_paypal(), paypal_exports)),
  "../../integrations/payment/stripe.ts": () => Promise.resolve().then(() => (init_stripe(), stripe_exports))
});

// features/keystone/utils/integrationProviderAdapter.ts
async function executeAdapterFunction2({
  provider,
  functionName,
  exportName = functionName,
  args
}) {
  const functionPath = provider[functionName];
  if (!functionPath) {
    throw new Error(`Integration provider has no ${functionName} configured`);
  }
  if (functionPath.startsWith("http")) {
    const response = await fetch(functionPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, functionName: exportName, ...args })
    });
    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    return response.json();
  }
  const adapter = await globImport_integrations_ts(`../../integrations/${provider.providerType}/${functionPath}.ts`);
  const fn = adapter[exportName];
  if (!fn) {
    throw new Error(
      `Function ${exportName} not found in adapter ${provider.providerType}/${functionPath}`
    );
  }
  try {
    return await fn({ provider, ...args });
  } catch (error) {
    throw new Error(
      `Error executing ${exportName} for provider ${functionPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
async function validateProviderConfiguration({ provider }) {
  return executeAdapterFunction2({
    provider,
    functionName: "submitFunction",
    exportName: "validateConfigurationFunction",
    args: {}
  });
}
async function validatePrescriber({ provider, npi }) {
  return executeAdapterFunction2({
    provider,
    functionName: "submitFunction",
    exportName: "validatePrescriberFunction",
    args: { npi }
  });
}
async function submitWorkflow({
  provider,
  payload,
  idempotencyKey
}) {
  return executeAdapterFunction2({
    provider,
    functionName: "submitFunction",
    args: { payload, idempotencyKey }
  });
}
async function getWorkflowStatus({
  provider,
  externalReference
}) {
  return executeAdapterFunction2({
    provider,
    functionName: "statusFunction",
    args: { externalReference }
  });
}
async function handleWebhook2({
  provider,
  event,
  headers
}) {
  return executeAdapterFunction2({
    provider,
    functionName: "webhookFunction",
    args: { event, headers }
  });
}

// features/keystone/mutations/integrationWorkflows.ts
async function configurePharmacyIntegrationProvider(_root, args, context) {
  if (!permissions.canManageIntegrations({ session: context.session })) throw new DomainError("Permission required: canManageIntegrations");
  if (args.bearerToken.length < 16 || args.webhookSecret.length < 32) throw new DomainError("Provider credentials do not meet minimum length requirements");
  const provider = await context.sudo().query.IntegrationProvider.findOne({ where: { id: args.providerId }, query: "id providerType organization { id }" });
  if (!provider || !["erx", "insurance"].includes(provider.providerType)) throw new DomainError("Configurable integration provider not found");
  const { userId } = await requireTenantMembership(context, { organizationId: provider.organization.id });
  if (provider.providerType === "erx" && (!args.prescriberValidationPath || !args.prescriberValidationPath.includes("{npi}"))) throw new DomainError("eRx configuration requires a prescriber validation path containing {npi}");
  const configuration = normalizeConfiguration(args);
  const credentials = { bearerToken: args.bearerToken, webhookSecret: args.webhookSecret };
  const adapterFunctions = { submitFunction: "manual", statusFunction: "manual", webhookFunction: "manual" };
  await validateProviderConfiguration({ provider: { providerType: provider.providerType, ...adapterFunctions, configuration, credentials } });
  return withDomainTransaction(context, [`integration-provider:${provider.id}`], async (transactionContext) => {
    await transactionContext.sudo().query.IntegrationProvider.updateOne({
      where: { id: provider.id },
      data: { configuration, credentials, ...adapterFunctions, status: "active", externalValidationComplete: true, validatedAt: (/* @__PURE__ */ new Date()).toISOString(), validationReference: `health:${new URL(configuration.baseUrl).host}` }
    });
    await recordAudit(transactionContext, {
      eventKey: `integration.configured:${provider.id}:${Date.now()}`,
      organizationId: provider.organization.id,
      actorId: userId,
      eventType: "integration.configured",
      resourceType: "IntegrationProvider",
      resourceId: provider.id,
      metadata: { providerType: provider.providerType, baseHost: new URL(configuration.baseUrl).host }
    });
    return { success: true, providerId: provider.id, status: "active" };
  });
}
async function validatePharmacyPrescriber(_root, args, context) {
  if (!permissions.canManagePrescriptions({ session: context.session })) throw new DomainError("Permission required: canManagePrescriptions");
  const [provider, prescriber] = await Promise.all([
    context.sudo().query.IntegrationProvider.findOne({ where: { id: args.providerId }, query: "id providerType status externalValidationComplete configuration credentials submitFunction organization { id }" }),
    context.sudo().query.Prescriber.findOne({ where: { id: args.prescriberId }, query: "id npi organization { id }" })
  ]);
  if (!provider || provider.providerType !== "erx" || provider.status !== "active" || !provider.externalValidationComplete || !provider.configuration?.prescriberValidationPath) throw new DomainError("Active eRx prescriber validation provider not found");
  if (!prescriber || prescriber.organization.id !== provider.organization.id || !isValidNpi(prescriber.npi)) throw new DomainError("Prescriber has no valid NPI in this provider tenant");
  const { userId } = await requireTenantMembership(context, { organizationId: prescriber.organization.id });
  const result = await validatePrescriber({ provider, npi: prescriber.npi });
  const credentialExpiresAt = result.credentialExpiresAt ? new Date(result.credentialExpiresAt) : null;
  if (result.valid !== true || !result.validationReference || !result.credentialType || !result.credentialJurisdiction || !result.credentialIdentifier || !credentialExpiresAt || Number.isNaN(credentialExpiresAt.getTime()) || credentialExpiresAt.getTime() <= Date.now()) {
    throw new DomainError("External provider response lacks current prescriber identity and credential evidence");
  }
  return withDomainTransaction(context, [`prescriber:${prescriber.id}`], async (transactionContext) => {
    await transactionContext.prisma.prescriber.update({ where: { id: prescriber.id }, data: { verificationStatus: "validated", externalValidationComplete: true, verificationMethod: "external_provider", credentialType: String(result.credentialType).slice(0, 200), credentialJurisdiction: String(result.credentialJurisdiction).slice(0, 200), credentialIdentifier: String(result.credentialIdentifier).slice(0, 200), credentialExpiresAt, validationReference: String(result.validationReference).slice(0, 500), validatedAt: /* @__PURE__ */ new Date(), verifiedById: userId } });
    await recordAudit(transactionContext, {
      eventKey: `prescriber.validated:${prescriber.id}:${result.validationReference}`,
      organizationId: prescriber.organization.id,
      actorId: userId,
      eventType: "prescriber.externally_validated",
      resourceType: "Prescriber",
      resourceId: prescriber.id,
      metadata: { providerId: provider.id, validationReference: result.validationReference, credentialExpiresAt: credentialExpiresAt.toISOString(), verificationMethod: "external_provider" }
    });
    return { success: true, prescriberId: prescriber.id, status: "validated", validationReference: String(result.validationReference) };
  });
}
async function resourcePayload(context, providerType, resourceId) {
  if (providerType === "erx") {
    const prescription = await context.sudo().query.Prescription.findOne({
      where: { id: resourceId },
      query: "id prescriptionNumber source sourceVerificationStatus writtenAt expiresAt organization { id } location { id } patient { patientNumber displayName dateOfBirth } prescriber { name npi verificationStatus externalValidationComplete } items { medicationNameSnapshot sig quantityPrescribed refillsAuthorized product { sku drugReference { ndc11 } } }"
    });
    if (!prescription) throw new DomainError("Prescription not found");
    return { resourceType: "Prescription", organizationId: prescription.organization.id, locationId: prescription.location.id, payload: prescription };
  }
  const order = await context.sudo().query.Order.findOne({
    where: { id: resourceId },
    query: "id orderNumber totalAmount currencyCode organization { id } location { id } patient { patientNumber } lineItems { title ndc11Snapshot quantity unitPriceAmount }"
  });
  if (!order) throw new DomainError("Order not found");
  return { resourceType: "Order", organizationId: order.organization.id, locationId: order.location.id, payload: order };
}
async function submitPharmacyExternalWorkflow(_root, args, context) {
  if (!args.idempotencyKey.trim() || args.idempotencyKey.length > 200) throw new DomainError("A bounded idempotency key is required");
  const provider = await context.sudo().query.IntegrationProvider.findOne({
    where: { id: args.providerId },
    query: "id providerType status externalValidationComplete configuration credentials submitFunction organization { id }"
  });
  if (!provider || !["erx", "insurance"].includes(provider.providerType) || provider.status !== "active" || !provider.externalValidationComplete) throw new DomainError("Active validated integration provider not found");
  const required = provider.providerType === "erx" ? "canManagePrescriptions" : "canManagePayments";
  if (!permissions[required]({ session: context.session })) throw new DomainError(`Permission required: ${required}`);
  const resource = await resourcePayload(context, provider.providerType, args.resourceId);
  if (resource.organizationId !== provider.organization.id) throw new DomainError("Integration provider and resource tenant do not match");
  const { userId } = await requireTenantMembership(context, { organizationId: resource.organizationId, locationId: resource.locationId });
  const requestSnapshot = {
    providerId: provider.id,
    workflowType: provider.providerType,
    resourceType: resource.resourceType,
    resourceId: args.resourceId,
    idempotencyKey: args.idempotencyKey,
    organizationId: resource.organizationId,
    locationId: resource.locationId,
    payload: resource.payload
  };
  const workflowKey = `${provider.id}:${args.idempotencyKey}`;
  const workflow = await withDomainTransaction(context, [`integration-workflow:${workflowKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.ExternalIntegrationWorkflow.findOne({
      where: { workflowKey },
      query: "id status externalReference workflowType resourceType resourceId idempotencyKey requestPayload organization { id } location { id } provider { id }"
    });
    if (existing) {
      if (!externalIntegrationRequestMatches(existing, requestSnapshot)) {
        throw new DomainError("Integration idempotency key was reused with a different provider, scope, resource, or payload");
      }
      return existing;
    }
    return sudo.query.ExternalIntegrationWorkflow.createOne({
      data: {
        workflowKey,
        workflowType: provider.providerType,
        resourceType: resource.resourceType,
        resourceId: args.resourceId,
        idempotencyKey: args.idempotencyKey,
        requestPayload: resource.payload,
        organization: { connect: { id: resource.organizationId } },
        location: { connect: { id: resource.locationId } },
        provider: { connect: { id: provider.id } }
      },
      query: "id status externalReference"
    });
  });
  if (workflow.externalReference) return { success: true, reused: true, workflowId: workflow.id, status: workflow.status, externalReference: workflow.externalReference };
  let result;
  try {
    result = await submitWorkflow({ provider, payload: resource.payload, idempotencyKey: args.idempotencyKey });
  } catch (error) {
    await context.sudo().query.ExternalIntegrationWorkflow.updateOne({ where: { id: workflow.id }, data: { status: "failed", attempts: 1, lastError: error instanceof Error ? error.message : "Submission failed" } });
    throw error;
  }
  const status = ["accepted", "rejected", "pending"].includes(result.status) ? result.status : "submitted";
  await withDomainTransaction(context, [`integration-workflow:${workflow.id}`], async (transactionContext) => {
    await transactionContext.sudo().query.ExternalIntegrationWorkflow.updateOne({ where: { id: workflow.id }, data: { status, externalReference: result.externalReference, responsePayload: result, attempts: 1, submittedAt: (/* @__PURE__ */ new Date()).toISOString(), ...status === "accepted" || status === "rejected" ? { resolvedAt: (/* @__PURE__ */ new Date()).toISOString() } : {} } });
    await recordAudit(transactionContext, {
      eventKey: `integration.submitted:${workflow.id}`,
      organizationId: resource.organizationId,
      locationId: resource.locationId,
      actorId: userId,
      eventType: `integration.${provider.providerType}.submitted`,
      resourceType: "ExternalIntegrationWorkflow",
      resourceId: workflow.id,
      metadata: { sourceResourceType: resource.resourceType, sourceResourceId: args.resourceId, status }
    });
  });
  return { success: true, reused: false, workflowId: workflow.id, status, externalReference: result.externalReference || null };
}
async function refreshPharmacyExternalWorkflow(_root, args, context) {
  const workflow = await context.sudo().query.ExternalIntegrationWorkflow.findOne({
    where: { id: args.workflowId },
    query: "id status externalReference attempts resourceType organization { id } location { id } provider { id providerType status externalValidationComplete configuration credentials statusFunction }"
  });
  if (!workflow?.provider || !workflow.externalReference) throw new DomainError("Submitted integration workflow not found");
  const required = workflow.provider.providerType === "erx" ? "canManagePrescriptions" : "canManagePayments";
  if (!permissions[required]({ session: context.session })) throw new DomainError(`Permission required: ${required}`);
  await requireTenantMembership(context, { organizationId: workflow.organization.id, locationId: workflow.location.id });
  const result = await getWorkflowStatus({ provider: workflow.provider, externalReference: workflow.externalReference });
  const status = ["accepted", "rejected", "pending"].includes(result.status) ? result.status : "pending";
  await context.sudo().query.ExternalIntegrationWorkflow.updateOne({ where: { id: workflow.id }, data: { status, responsePayload: result, attempts: workflow.attempts + 1, lastError: null, ...status === "accepted" || status === "rejected" ? { resolvedAt: (/* @__PURE__ */ new Date()).toISOString() } : {} } });
  return { success: true, reused: false, workflowId: workflow.id, status, externalReference: workflow.externalReference };
}
async function ingestPharmacyIntegrationWebhook(_root, args, context) {
  const provider = await context.sudo().query.IntegrationProvider.findOne({ where: { providerKey: args.providerKey }, query: "id providerType status credentials webhookFunction organization { id }" });
  if (!provider || provider.status !== "active") throw new DomainError("Webhook provider not found");
  const headers = Object.fromEntries(Object.entries(args.headers || {}).map(([key, value]) => [key === "__rawBody" ? key : key.toLowerCase(), String(value ?? "")]));
  await handleWebhook2({ provider, event: args.event, headers });
  const payload = args.event || {};
  if (!payload.eventId || !payload.externalReference || !["accepted", "rejected", "pending"].includes(payload.status)) throw new DomainError("Webhook envelope is invalid");
  const eventKey = `${provider.id}:${payload.eventId}`;
  return withDomainTransaction(context, [`integration-webhook:${eventKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.IntegrationWebhookEvent.findOne({ where: { eventKey }, query: "id status" });
    if (existing) return { accepted: true, reused: true, eventId: payload.eventId, status: existing.status };
    const workflow = (await sudo.query.ExternalIntegrationWorkflow.findMany({ where: { provider: { id: { equals: provider.id } }, externalReference: { equals: payload.externalReference } }, take: 1, query: "id" }))[0];
    if (workflow) await sudo.query.ExternalIntegrationWorkflow.updateOne({ where: { id: workflow.id }, data: { status: payload.status, responsePayload: payload, ...payload.status !== "pending" ? { resolvedAt: (/* @__PURE__ */ new Date()).toISOString() } : {} } });
    await sudo.query.IntegrationWebhookEvent.createOne({ data: { eventKey, externalEventId: payload.eventId, eventType: payload.type || "status", status: workflow ? "processed" : "ignored", payload, organization: { connect: { id: provider.organization.id } }, provider: { connect: { id: provider.id } }, workflow: workflow ? { connect: { id: workflow.id } } : void 0 } });
    return { accepted: true, reused: false, eventId: payload.eventId, status: workflow ? "processed" : "ignored" };
  });
}

// features/keystone/mutations/intakeWorkflows.ts
var import_node_crypto13 = require("node:crypto");
async function intakePharmacyPrescription(_root, args, context) {
  requirePermission(context, "canManagePrescriptions");
  if (!["paper", "phone"].includes(args.source)) {
    throw new DomainError("Bounded launch intake supports only operator-reviewed paper or phone sources; eRx, transfer conversion, and generic manual intake require their dedicated authority and evidence workflows");
  }
  if (!args.prescriptionNumber?.trim() || !args.items.length) throw new DomainError("Prescription number and at least one item are required");
  if (args.items.length !== 1) throw new DomainError("Enter one prescription item per prescription");
  const writtenAt = new Date(args.writtenAt);
  const expiresAt = new Date(args.expiresAt);
  if (Number.isNaN(writtenAt.getTime()) || Number.isNaN(expiresAt.getTime()) || writtenAt.getTime() > Date.now() || expiresAt.getTime() <= writtenAt.getTime()) {
    throw new DomainError("Prescription written and expiration dates are invalid");
  }
  for (const item of args.items) {
    if (!item.productId || !item.medicationName?.trim() || !item.sig?.trim() || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isInteger(item.refillsAuthorized) || item.refillsAuthorized < 0) {
      throw new DomainError("Prescription item is invalid");
    }
  }
  const requestFingerprint = (0, import_node_crypto13.createHash)("sha256").update(JSON.stringify({ organizationId: args.organizationId, locationId: args.locationId, patientId: args.patientId, prescriberId: args.prescriberId, prescriptionNumber: args.prescriptionNumber.trim(), source: args.source, externalReference: args.externalReference?.trim() || null, writtenAt: writtenAt.toISOString(), expiresAt: expiresAt.toISOString(), items: args.items, reason: args.reason?.trim(), attested: args.attested })).digest("hex");
  return withDomainTransaction(context, [`prescription-number:${args.prescriptionNumber.trim()}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.Prescription.findOne({ where: { prescriptionNumber: args.prescriptionNumber.trim() }, query: "id status intakeRequestFingerprint organization { id } location { id } approval { id }" });
    if (existing) {
      if (!existing.organization?.id || !existing.location?.id) throw new DomainError("Prescription replay scope is incomplete; operator reconciliation is required");
      await requireTenantMembership(transactionContext, { organizationId: existing.organization.id, locationId: existing.location.id, pharmacist: true });
      if (!existing.intakeRequestFingerprint || existing.intakeRequestFingerprint !== requestFingerprint) throw new DomainError("Prescription number is already bound to different or legacy intake evidence; do not replay it");
      return { success: true, reused: true, prescriptionId: existing.id, status: existing.status, approvalId: existing.approval?.id };
    }
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: args.organizationId,
      locationId: args.locationId,
      pharmacist: true
    });
    const organization = await sudo.query.Organization.findOne({ where: { id: args.organizationId }, query: "id prescriptionFillPolicy" });
    parseFillPolicy(organization?.prescriptionFillPolicy);
    if (!organization?.prescriptionFillPolicy?.approvalId) throw new DomainError("Fill policy requires recorded pharmacist approval before intake");
    const [products, patient, prescriber] = await Promise.all([
      sudo.query.Product.findMany({
        where: { id: { in: [...new Set(args.items.map((item) => item.productId))] } },
        query: "id title organization { id } location { id } drugReference { id }"
      }),
      sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: "id status organizations { id }" }),
      sudo.query.Prescriber.findOne({ where: { id: args.prescriberId }, query: "id npi verificationStatus externalValidationComplete verificationMethod credentialType credentialJurisdiction credentialIdentifier credentialExpiresAt validationReference verifiedBy { id } organization { id }" })
    ]);
    if (!patient || patient.status !== "active" || !patient.organizations?.some((organization2) => organization2.id === args.organizationId)) throw new DomainError("Active patient is not in the prescription organization");
    if (!prescriber || prescriber.organization?.id !== args.organizationId) throw new DomainError("Prescriber is not in the prescription organization");
    assertPrescriptionClinicallyEligible({ sourceVerificationStatus: "human_verified", writtenAt, expiresAt, prescriber });
    if (products.length !== new Set(args.items.map((item) => item.productId)).size || products.some((product) => product.organization?.id !== args.organizationId || product.location?.id !== args.locationId || !product.drugReference?.id)) {
      throw new DomainError("Every prescription item must use an NDC-linked product from this pharmacy");
    }
    const drugReferenceIds = [...new Set(products.map((product) => product.drugReference.id))];
    const drugReviews = await sudo.query.DrugReferenceReview.findMany({ where: { organization: { id: { equals: args.organizationId } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: "active" } }, take: 100, query: "id status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference reviewedAt drugReference { id }" });
    if (drugReviews.length !== drugReferenceIds.length) throw new DomainError("Every prescription item requires drug reference review evidence");
    for (const review of drugReviews) assertDrugReferenceEligibleForBoundedDispensing({ sourceVerified: review.status === "active", marketingStatus: review.marketingStatusSnapshot, controlledSchedule: review.controlledScheduleSnapshot, sourceName: review.sourceName, sourceVersion: review.sourceVersion, sourceReference: review.sourceReference, reviewedAt: review.reviewedAt });
    const approval = await createHumanApproval(transactionContext, {
      organizationId: args.organizationId,
      locationId: args.locationId,
      actorId: userId,
      actionType: "prescription_review",
      reason: args.reason,
      attested: args.attested,
      evidence: { stage: "source_verification", source: args.source, externalReference: args.externalReference || null, requestFingerprint }
    });
    const prescription = await sudo.query.Prescription.createOne({
      data: {
        prescriptionNumber: args.prescriptionNumber.trim(),
        intakeRequestFingerprint: requestFingerprint,
        source: args.source,
        sourceVerificationStatus: "human_verified",
        externalReference: args.externalReference?.trim() || void 0,
        status: "pending_review",
        writtenAt: writtenAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        organization: { connect: { id: args.organizationId } },
        location: { connect: { id: args.locationId } },
        patient: { connect: { id: args.patientId } },
        prescriber: { connect: { id: args.prescriberId } },
        approval: { connect: { id: approval.id } }
      },
      query: "id status"
    });
    for (const item of args.items) {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) throw new DomainError("Prescription product disappeared during intake");
      await sudo.query.PrescriptionItem.createOne({
        data: {
          medicationNameSnapshot: item.medicationName.trim(),
          sig: item.sig.trim(),
          fillLineage: FILL_LINEAGE,
          quantityPrescribed: item.quantity,
          daysSupply: item.daysSupply || void 0,
          refillsAuthorized: item.refillsAuthorized,
          refillsRemaining: item.refillsAuthorized,
          substitutionAllowed: item.substitutionAllowed,
          prescription: { connect: { id: prescription.id } },
          product: { connect: { id: product.id } },
          drugReference: product.drugReference?.id ? { connect: { id: product.drugReference.id } } : void 0
        }
      });
    }
    await recordAudit(transactionContext, {
      eventKey: `prescription.intake:${args.organizationId}:${args.prescriptionNumber.trim()}`,
      organizationId: args.organizationId,
      locationId: args.locationId,
      actorId: userId,
      patientId: args.patientId,
      eventType: "prescription.intake_recorded",
      resourceType: "Prescription",
      resourceId: prescription.id,
      metadata: { source: args.source, itemCount: args.items.length, approvalId: approval.id }
    });
    return { success: true, reused: false, prescriptionId: prescription.id, status: prescription.status, approvalId: approval.id };
  });
}

// features/keystone/mutations/patientRecordWorkflows.ts
var import_node_crypto14 = require("node:crypto");
function normalize(value) {
  return value.trim().replace(/\s+/g, " ");
}
function digest(value) {
  return (0, import_node_crypto14.createHash)("sha256").update(JSON.stringify(value)).digest("hex");
}
function safePatientNumber(value) {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,40}$/.test(normalized)) throw new DomainError("Patient number must use 3-40 letters, numbers, or hyphens");
  return normalized;
}
async function createPharmacyPatient(_root, args, context) {
  requirePermission(context, "canManagePatients");
  const patientNumber = safePatientNumber(args.patientNumber);
  const firstName = normalize(args.firstName);
  const lastName = normalize(args.lastName);
  const dateOfBirth = new Date(args.dateOfBirth);
  if (!firstName || !lastName || Number.isNaN(dateOfBirth.getTime()) || dateOfBirth.getTime() >= Date.now()) throw new DomainError("Patient name and a past date of birth are required");
  if (!["phone", "sms", "email", "portal", "none"].includes(args.preferredContactMethod)) throw new DomainError("Preferred contact method is invalid");
  if (!args.identityMethod?.trim() || !args.identityReference?.trim()) throw new DomainError("Operator identity matching method and reference are required");
  const identityKey = `${args.organizationId}:${patientNumber}`;
  const requestFingerprint = digest({ organizationId: args.organizationId, patientNumber, firstName, lastName, dateOfBirth: dateOfBirth.toISOString().slice(0, 10), email: args.email?.trim().toLowerCase() || "", phone: args.phone?.trim() || "", preferredContactMethod: args.preferredContactMethod, address: args.address || null, identityMethod: args.identityMethod.trim(), identityReference: args.identityReference.trim(), reason: args.reason?.trim(), attested: args.attested });
  return withDomainTransaction(context, [`patient-identity:${identityKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: args.organizationId, organizationWide: true });
    const existing = (await sudo.query.PatientProfile.findMany({ where: { identityKey: { equals: identityKey } }, take: 1, query: "id patientNumber requestFingerprint status" }))[0];
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) throw new DomainError("Patient identity already exists with different matching data");
      return { success: true, reused: true, patientId: existing.id, patientNumber: existing.patientNumber, status: existing.status };
    }
    const approval = await createHumanApproval(transactionContext, { organizationId: args.organizationId, actorId: userId, actionType: "patient_record", reason: args.reason, attested: args.attested, evidence: { identityMethod: args.identityMethod.trim(), identityReference: args.identityReference.trim(), softwareIdentityValidationPerformed: false } });
    const patient = await sudo.query.PatientProfile.createOne({
      data: {
        patientNumber,
        identityKey,
        requestFingerprint,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth.toISOString(),
        email: args.email?.trim().toLowerCase() || void 0,
        phone: args.phone?.trim() || void 0,
        preferredContactMethod: args.preferredContactMethod,
        address: args.address || void 0,
        identityVerificationStatus: "confirmed",
        identityReference: args.identityReference.trim(),
        identityVerifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
        identityVerifiedBy: { connect: { id: userId } },
        identityEvidence: { method: args.identityMethod.trim(), reference: args.identityReference.trim(), recordedAt: (/* @__PURE__ */ new Date()).toISOString(), approvalId: approval.id, softwareValidationPerformed: false },
        organizations: { connect: [{ id: args.organizationId }] }
      },
      query: "id patientNumber status"
    });
    await recordAudit(transactionContext, { eventKey: `patient.created:${identityKey}`, organizationId: args.organizationId, actorId: userId, patientId: patient.id, eventType: "patient.created", resourceType: "PatientProfile", resourceId: patient.id, metadata: { patientNumber, approvalId: approval.id, identityMethod: args.identityMethod.trim(), softwareIdentityValidationPerformed: false } });
    return { success: true, reused: false, patientId: patient.id, patientNumber: patient.patientNumber, status: patient.status };
  });
}
async function updatePharmacyPatientContact(_root, args, context) {
  requirePermission(context, "canManagePatients");
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  if (!["phone", "sms", "email", "portal", "none"].includes(args.preferredContactMethod)) throw new DomainError("Preferred contact method is invalid");
  const requestFingerprint = digest({ patientId: args.patientId, email: args.email?.trim().toLowerCase() || "", phone: args.phone?.trim() || "", preferredContactMethod: args.preferredContactMethod, address: args.address || null, reason: args.reason?.trim(), attested: args.attested });
  return withDomainTransaction(context, [`patient:${args.patientId}`, `patient-contact:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const patient = await sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: "id organizations { id }" });
    if (!patient?.organizations?.length) throw new DomainError("Patient not found");
    const organizationId = patient.organizations[0].id;
    const { userId } = await requireTenantMembership(transactionContext, { organizationId, organizationWide: true });
    const existingEvent = await sudo.query.AuditEvent.findOne({ where: { eventKey: `patient.contact_updated:${args.idempotencyKey}` }, query: "id resourceId metadata" });
    if (existingEvent) {
      if (existingEvent.resourceId !== patient.id || existingEvent.metadata?.requestFingerprint !== requestFingerprint) throw new DomainError("Patient contact idempotency key was reused with different input");
      return { success: true, reused: true, patientId: patient.id, status: "active" };
    }
    const approval = await createHumanApproval(transactionContext, { organizationId, actorId: userId, actionType: "patient_record", reason: args.reason, attested: args.attested, evidence: { action: "contact_update", patientId: patient.id, requestFingerprint } });
    await transactionContext.prisma.patientProfile.update({ where: { id: patient.id }, data: { email: args.email?.trim().toLowerCase() || "", phone: args.phone?.trim() || "", preferredContactMethod: args.preferredContactMethod, address: args.address || null } });
    await recordAudit(transactionContext, { eventKey: `patient.contact_updated:${args.idempotencyKey}`, organizationId, actorId: userId, patientId: patient.id, eventType: "patient.contact_updated", resourceType: "PatientProfile", resourceId: patient.id, metadata: { approvalId: approval.id, preferredContactMethod: args.preferredContactMethod, requestFingerprint } });
    return { success: true, reused: false, patientId: patient.id, status: "active" };
  });
}
async function recordPharmacyPatientAllergy(_root, args, context) {
  requirePermission(context, "canManagePatients");
  if (!["unknown", "mild", "moderate", "severe"].includes(args.severity)) throw new DomainError("Allergy severity is invalid");
  return recordPatientHistoryEntry(transactionInput("allergy", args), context);
}
async function recordPharmacyPatientMedication(_root, args, context) {
  requirePermission(context, "canManagePatients");
  return recordPatientHistoryEntry(transactionInput("medication", args), context);
}
async function recordPharmacyPatientNoneKnown(_root, args, context) {
  requirePermission(context, "canManagePatients");
  if (args.kind !== "allergy" && args.kind !== "medication") throw new DomainError("Kind must be allergy or medication");
  const statement = args.kind === "allergy" ? { allergen: NONE_KNOWN.allergy, reaction: "None reported", severity: "unknown" } : { medicationName: NONE_KNOWN.medication };
  return recordPatientHistoryEntry({ ...transactionInput(args.kind, { ...args, ...statement }), noneKnown: true }, context);
}
var NONE_KNOWN = { allergy: "No known allergies (NKA)", medication: "No current medications" };
function transactionInput(kind, args) {
  return { kind, args };
}
async function recordPatientHistoryEntry(input, context) {
  const { kind, args, noneKnown = false } = input;
  if (!args.idempotencyKey?.trim() || !args.source?.trim() || !args.sourceReference?.trim()) throw new DomainError("Idempotency key and source evidence are required");
  const label = normalize(kind === "allergy" ? args.allergen : args.medicationName);
  if (!label || kind === "allergy" && !normalize(args.reaction)) throw new DomainError(`${kind === "allergy" ? "Allergen and reaction" : "Medication name"} are required`);
  return withDomainTransaction(context, [`patient:${args.patientId}`, `${kind}:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const patient = await sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: "id organizations { id }" });
    if (!patient?.organizations?.length) throw new DomainError("Patient not found");
    const organizationId = patient.organizations[0].id;
    const { userId } = await requireTenantMembership(transactionContext, { organizationId, organizationWide: true });
    const requestFingerprint = digest({ organizationId, patientId: patient.id, kind, noneKnown, label, reaction: args.reaction?.trim() || "", directions: args.directions?.trim() || "", severity: args.severity || "", source: args.source.trim(), sourceReference: args.sourceReference.trim(), reason: args.reason?.trim(), attested: args.attested });
    const key = `${kind}:${organizationId}:${args.idempotencyKey.trim()}`;
    const model = kind === "allergy" ? sudo.query.PatientAllergy : sudo.query.PatientMedication;
    const uniqueField = kind === "allergy" ? "allergyKey" : "medicationKey";
    const existing = (await model.findMany({ where: { [uniqueField]: { equals: key } }, take: 1, query: `id requestFingerprint` }))[0];
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) throw new DomainError(`${kind} idempotency key is already bound to different evidence`);
      return { success: true, reused: true, recordId: existing.id, status: "active" };
    }
    const activeStatus = kind === "allergy" ? "active" : "current";
    const current = await model.findMany({ where: { patient: { id: { equals: patient.id } }, status: { in: [activeStatus, "none_known"] } }, query: "id status" });
    if (noneKnown && current.some((entry) => entry.status === activeStatus)) throw new DomainError(kind === "allergy" ? "This patient has recorded allergies. Mark them inactive first." : "This patient has current medications. Mark them discontinued first.");
    const approval = await createHumanApproval(transactionContext, { organizationId, actorId: userId, actionType: "patient_record", reason: args.reason, attested: args.attested, evidence: { action: noneKnown ? `${kind}_none_known_recorded` : `${kind}_recorded`, sourceReference: args.sourceReference.trim() } });
    for (const entry of current.filter((entry2) => entry2.status === "none_known")) await model.updateOne({ where: { id: entry.id }, data: { status: kind === "allergy" ? "inactive" : "discontinued" } });
    const common = { [uniqueField]: key, requestFingerprint, source: args.source.trim(), sourceReference: args.sourceReference.trim(), organization: { connect: { id: organizationId } }, patient: { connect: { id: patient.id } }, recordedBy: { connect: { id: userId } }, approval: { connect: { id: approval.id } } };
    const record2 = kind === "allergy" ? await sudo.query.PatientAllergy.createOne({ data: { ...common, allergen: label, reaction: normalize(args.reaction), severity: args.severity, ...noneKnown ? { status: "none_known" } : {} }, query: "id status" }) : await sudo.query.PatientMedication.createOne({ data: { ...common, medicationName: label, directions: args.directions?.trim() || void 0, ...noneKnown ? { status: "none_known" } : {} }, query: "id status" });
    await recordAudit(transactionContext, { eventKey: `patient.${kind}_recorded:${args.idempotencyKey}`, organizationId, actorId: userId, patientId: patient.id, eventType: `patient.${kind}_recorded`, resourceType: kind === "allergy" ? "PatientAllergy" : "PatientMedication", resourceId: record2.id, metadata: { approvalId: approval.id, sourceReference: args.sourceReference.trim() } });
    return { success: true, reused: false, recordId: record2.id, status: record2.status };
  });
}

// features/keystone/mutations/patientWorkflows.ts
var import_node_crypto15 = require("node:crypto");

// features/keystone/mutations/lib/patient-accounts.ts
async function patientAccountWhere(context, organizationIds, patientEmail) {
  const requests = await context.sudo().query.PrescriptionRequest.findMany({
    where: { organization: { id: { in: organizationIds } } },
    orderBy: { createdAt: "desc" },
    take: 500,
    query: "user { id }"
  });
  const requesterIds = [...new Set(requests.map((request) => request.user?.id).filter(Boolean))];
  const email = patientEmail?.trim();
  return {
    OR: [
      { memberships: { some: { status: { equals: "active" }, organization: { id: { in: organizationIds } } } } },
      ...requesterIds.length ? [{ id: { in: requesterIds } }] : [],
      ...email ? [{ email: { equals: email, mode: "insensitive" } }] : []
    ]
  };
}

// features/keystone/mutations/patientWorkflows.ts
var TRANSFER_CONSENT = {
  policyVersion: "2026-07-18",
  statementKey: "openfront_pharmacy_prescription_transfer_consent_v1"
};
async function patientAccess(context, patientId, organizationId, locationId) {
  const patient = await context.sudo().query.PatientProfile.findOne({ where: { id: patientId }, query: "id status user { id } organizations { id }" });
  const location = await context.sudo().query.PharmacyLocation.findOne({ where: { id: locationId }, query: "id status organization { id status }" });
  if (!location || location.status !== "active" || location.organization?.id !== organizationId || location.organization.status !== "active") throw new DomainError("An active location is required");
  if (!patient || patient.status !== "active" || !patient.organizations.some((organization) => organization.id === organizationId)) throw new DomainError("Patient not found in this organization");
  if (patient.user?.id === context.session?.itemId) return { patient, actorId: context.session.itemId };
  if (!permissions.canManagePrescriptions({ session: context.session })) throw new DomainError("You do not have access to this patient workflow");
  await currentFillPermission(context, "canManagePrescriptions");
  const { userId } = await requireTenantMembership(context, { organizationId, locationId });
  return { patient, actorId: userId };
}
async function linkPharmacyPatientAccount(_root, args, context) {
  if (!permissions.canManagePatients({ session: context.session })) throw new DomainError("Permission required: canManagePatients");
  return withDomainTransaction(context, [`patient:${args.patientId}`, `user:${args.userId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const [patient, user] = await Promise.all([
      sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: "id email user { id } organizations { id }" }),
      sudo.query.User.findOne({ where: { id: args.userId }, query: "id patientProfile { id }" })
    ]);
    if (!patient?.organizations?.length || !user) throw new DomainError("Patient or user not found");
    const organizationId = patient.organizations[0].id;
    const { userId: actorId } = await requireTenantMembership(transactionContext, { organizationId });
    const eligible = await sudo.query.User.count({ where: { AND: [{ id: { equals: user.id } }, await patientAccountWhere(transactionContext, [organizationId], patient.email)] } });
    if (!eligible) throw new DomainError("This account has no connection to the pharmacy: it needs an online request from the customer or the patient's email");
    if (patient.user?.id === user.id && user.patientProfile?.id === patient.id) return { success: true, reused: true, patientId: patient.id, userId: user.id };
    if (patient.user?.id || user.patientProfile?.id) throw new DomainError("Patient or user is already linked to another account");
    await sudo.query.PatientProfile.updateOne({ where: { id: patient.id }, data: { user: { connect: { id: user.id } } } });
    await recordAudit(transactionContext, {
      eventKey: `patient.account_linked:${patient.id}:${user.id}`,
      organizationId,
      actorId,
      patientId: patient.id,
      eventType: "patient.account_linked",
      resourceType: "PatientProfile",
      resourceId: patient.id,
      metadata: { userId: user.id }
    });
    return { success: true, reused: false, patientId: patient.id, userId: user.id };
  });
}
async function requestPrescriptionRefill(_root, args, context) {
  if (!context.session?.itemId) throw new DomainError("Authentication required");
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  return withDomainTransaction(context, [`refill-idempotency:${args.idempotencyKey}`, `prescription:${args.prescriptionId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.RefillRequest.findOne({
      where: { idempotencyKey: args.idempotencyKey },
      query: "id status requestFingerprint patient { id } prescription { id } prescriptionItem { id } location { id }"
    });
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: "id status organization { id } location { id } patient { id } items { id fillLineage refillsRemaining refillsReserved }"
    });
    if (!prescription || prescription.patient.id !== args.patientId || prescription.location.id !== args.locationId) throw new DomainError("Prescription not found");
    const { actorId } = await patientAccess(transactionContext, args.patientId, prescription.organization.id, prescription.location.id);
    const item = prescription.items.find((entry) => entry.id === args.prescriptionItemId);
    if (!item) throw new DomainError("Prescription item does not belong to this prescription");
    const requestFingerprint = (0, import_node_crypto15.createHash)("sha256").update(JSON.stringify({
      organizationId: prescription.organization.id,
      actorId,
      prescriptionId: prescription.id,
      prescriptionItemId: item.id,
      patientId: args.patientId,
      locationId: args.locationId,
      note: args.note?.trim() || "",
      ...item.fillLineage === FILL_LINEAGE ? { expectedItemVersion: args.expectedItemVersion } : {}
    })).digest("hex");
    if (existing) {
      if (!existing.requestFingerprint || existing.requestFingerprint !== requestFingerprint) {
        throw new DomainError("Refill idempotency key is already bound to another request");
      }
      if (item.fillLineage === FILL_LINEAGE) {
        const current2 = await loadFillPrescription(transactionContext, prescription.id);
        const fill = await fillStore(transactionContext).PrescriptionFill.findOne({ where: { reservationKey: `refill:${args.idempotencyKey}` }, query: FILL_QUERY });
        if (!fill) throw new DomainError("Refill lineage is missing");
        assertFillBinding(fill, current2, current2.items.find((entry) => entry.id === item.id));
      }
      return { success: true, reused: true, refillRequestId: existing.id, status: existing.status };
    }
    if (item.fillLineage !== FILL_LINEAGE) throw new DomainError("Legacy refill authority requires explicit reconciliation; no historical counter conversion is inferred");
    if (!["dispensed", "fill_closed"].includes(prescription.status)) throw new DomainError("Current authorized fill must be completely dispensed before requesting a refill");
    if (item.refillsRemaining - item.refillsReserved < 1) throw new DomainError("No unreserved refills remain for this prescription item");
    const openRequestKey = `refill:${item.id}`;
    const openRequest = await sudo.query.RefillRequest.findOne({ where: { openRequestKey }, query: "id status" });
    if (openRequest) throw new DomainError("An open refill request already owns this entitlement; recover that request");
    const refill = await sudo.query.RefillRequest.createOne({
      data: {
        idempotencyKey: args.idempotencyKey,
        requestFingerprint,
        openRequestKey,
        patient: { connect: { id: args.patientId } },
        prescription: { connect: { id: prescription.id } },
        prescriptionItem: { connect: { id: item.id } },
        location: { connect: { id: args.locationId } },
        requestNote: args.note?.trim() || void 0,
        status: "requested"
      },
      query: "id status requestedAt"
    });
    const current = await loadFillPrescription(transactionContext, prescription.id);
    const currentItem = current.items.find((entry) => entry.id === item.id);
    await reserveFillInTransaction(transactionContext, current, currentItem, { kind: "refill", actorId, key: `refill:${args.idempotencyKey}`, fingerprint: requestFingerprint, expectedItemVersion: args.expectedItemVersion || void 0, refillRequestId: refill.id });
    await recordAudit(transactionContext, {
      eventKey: `refill.requested:${args.idempotencyKey}`,
      organizationId: prescription.organization.id,
      locationId: args.locationId,
      actorId,
      patientId: args.patientId,
      eventType: "refill.requested",
      resourceType: "RefillRequest",
      resourceId: refill.id,
      metadata: { prescriptionId: prescription.id, prescriptionItemId: item.id, reservedRefills: item.refillsReserved + 1 }
    });
    return { success: true, reused: false, refillRequestId: refill.id, status: refill.status };
  });
}
async function resolvePrescriptionRefill(_root, args, context) {
  if (!permissions.canReviewPrescriptions({ session: context.session })) throw new DomainError("Permission required: canReviewPrescriptions");
  if (!["approved", "rejected"].includes(args.decision)) throw new DomainError("Refill decision must be approved or rejected");
  await currentFillPermission(context, "canReviewPrescriptions");
  const identity = await context.sudo().query.RefillRequest.findOne({ where: { id: args.refillRequestId }, query: "id prescription { id }" });
  if (!identity?.prescription?.id) throw new DomainError("Refill request not found");
  return withDomainTransaction(context, [`refill:${args.refillRequestId}`, `prescription:${identity.prescription.id}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const refill = await sudo.query.RefillRequest.findOne({
      where: { id: args.refillRequestId },
      query: "id status patient { id } location { id } prescriptionItem { id fillLineage refillsRemaining refillsReserved } prescription { id status organization { id } location { id } } approval { id reason }"
    });
    if (!refill?.prescriptionItem || !refill.prescription) throw new DomainError("Refill request not found");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: refill.prescription.organization.id,
      locationId: refill.prescription.location.id,
      pharmacist: true
    });
    if (refill.prescription.id !== identity.prescription.id || refill.patient.id !== (await loadFillPrescription(transactionContext, identity.prescription.id)).patient.id || refill.location?.id !== refill.prescription.location.id) throw new DomainError("Refill scope changed");
    await currentFillPermission(transactionContext, "canReviewPrescriptions");
    if (refill.prescriptionItem.fillLineage === FILL_LINEAGE) {
      const q = fillStore(transactionContext), p2 = await loadFillPrescription(transactionContext, refill.prescription.id);
      const fill = (await q.PrescriptionFill.findMany({ where: { refillRequest: { id: { equals: refill.id } } }, take: 2, query: FILL_QUERY }))[0];
      const item = p2.items.find((i) => i.id === refill.prescriptionItem.id);
      if (!fill || !item) throw new DomainError("Refill fill lineage is missing");
      assertFillBinding(fill, p2, item, args.decision === "approved");
      await assertItemFillLedger(transactionContext, p2, item);
      const fingerprint2 = fillHash({ ...args, actorId: userId }), eventKey = `fill.resolve:${refill.id}`;
      const prior = await q.PrescriptionFillEvent.findOne({ where: { eventKey }, query: "commandFingerprint result" });
      if (prior) {
        if (prior.commandFingerprint !== fingerprint2) throw new DomainError("Refill decision replay differs from the original intent");
        return { ...prior.result, reused: true };
      }
      if (refill.status !== "requested" || fill.status !== "requested" || fill.version !== args.expectedFillVersion) throw new DomainError("Refill state/version changed; refresh the workbench");
      if (item.refillsReserved < 1 || item.refillsRemaining < 1) throw new DomainError("Refill reservation evidence is missing");
      if (args.decision === "approved" && new Date(fill.expiresAt).getTime() <= Date.now()) throw new DomainError("Refill reservation expired; record an authorized release");
      const approval2 = await createHumanApproval(transactionContext, {
        organizationId: p2.organization.id,
        locationId: p2.location.id,
        actorId: userId,
        actionType: "prescription_review",
        reason: args.reason,
        attested: args.attested,
        evidence: { refillRequestId: refill.id, fillId: fill.id, itemVersion: fill.itemVersion, authorityVersion: fill.authorityVersion, decision: args.decision }
      });
      const approved = args.decision === "approved";
      if (!approved) await sudo.query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { refillsReserved: item.refillsReserved - 1 } });
      const updated = await casFill(transactionContext, fill, {
        status: approved ? "approved" : "released",
        version: fill.version + 1,
        ...approved ? {} : { creditState: "released", quantityReleased: fill.authorizedQuantity, openKey: null }
      });
      await sudo.query.RefillRequest.updateOne({ where: { id: refill.id }, data: { status: args.decision, ...approved ? {} : { openRequestKey: null }, resolutionNote: args.reason, resolvedAt: (/* @__PURE__ */ new Date()).toISOString(), approval: { connect: { id: approval2.id } } } });
      if (approved) await sudo.query.Prescription.updateOne({ where: { id: p2.id }, data: { status: "approved", approval: { connect: { id: approval2.id } } } });
      const result = { success: true, reused: false, refillRequestId: refill.id, status: args.decision, approvalId: approval2.id };
      await appendFillEvent(transactionContext, updated, { eventKey, fingerprint: fingerprint2, action: args.decision, actorId: userId, approvalId: approval2.id, result, evidence: { refillRequestId: refill.id, refillsRemaining: item.refillsRemaining, refillsReserved: item.refillsReserved - (approved ? 0 : 1) } });
      return result;
    }
    if (["approved", "rejected"].includes(refill.status)) {
      if (refill.status !== args.decision || refill.approval?.reason !== args.reason) throw new DomainError("Refill resolution replay does not match the recorded decision and reason");
      return { success: true, reused: true, refillRequestId: refill.id, status: refill.status, approvalId: refill.approval?.id };
    }
    if (args.decision === "approved") throw new DomainError("Legacy refill approval requires explicit lineage reconciliation");
    if (refill.prescriptionItem.refillsReserved < 1) throw new DomainError("Refill reservation evidence is missing");
    const approval = await createHumanApproval(transactionContext, {
      organizationId: refill.prescription.organization.id,
      locationId: refill.prescription.location.id,
      actorId: userId,
      actionType: "prescription_review",
      reason: args.reason,
      attested: args.attested,
      evidence: { refillRequestId: refill.id, prescriptionItemId: refill.prescriptionItem.id, decision: args.decision }
    });
    await sudo.query.PrescriptionItem.updateOne({
      where: { id: refill.prescriptionItem.id },
      data: {
        refillsReserved: refill.prescriptionItem.refillsReserved - 1
      }
    });
    await sudo.query.RefillRequest.updateOne({
      where: { id: refill.id },
      data: { status: args.decision, openRequestKey: null, resolutionNote: args.reason, resolvedAt: (/* @__PURE__ */ new Date()).toISOString(), approval: { connect: { id: approval.id } } }
    });
    await recordAudit(transactionContext, {
      eventKey: `refill.${args.decision}:${refill.id}`,
      organizationId: refill.prescription.organization.id,
      locationId: refill.prescription.location.id,
      actorId: userId,
      patientId: refill.patient.id,
      eventType: `refill.${args.decision}`,
      resourceType: "RefillRequest",
      resourceId: refill.id,
      metadata: { prescriptionId: refill.prescription.id, prescriptionItemId: refill.prescriptionItem.id, approvalId: approval.id }
    });
    return { success: true, reused: false, refillRequestId: refill.id, status: args.decision, approvalId: approval.id };
  });
}
async function requestPrescriptionTransfer(_root, args, context) {
  if (!context.session?.itemId) throw new DomainError("Authentication required");
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  if (!args.consentAccepted || args.policyVersion !== TRANSFER_CONSENT.policyVersion || args.statementKey !== TRANSFER_CONSENT.statementKey) {
    throw new DomainError("Current prescription transfer consent is required");
  }
  if (!["inbound", "outbound"].includes(args.direction)) throw new DomainError("Invalid transfer direction");
  const requestFingerprint = (0, import_node_crypto15.createHash)("sha256").update(JSON.stringify({ prescriptionId: args.prescriptionId, patientId: args.patientId, direction: args.direction, counterpartyName: args.counterpartyName?.trim(), counterpartyPhone: args.counterpartyPhone?.trim() || null, consentAccepted: args.consentAccepted, policyVersion: args.policyVersion, statementKey: args.statementKey })).digest("hex");
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `transfer-idempotency:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.PrescriptionTransfer.findOne({ where: { idempotencyKey: args.idempotencyKey }, query: "id status patient { id } prescription { id organization { id } location { id } patient { id } } consent { evidence }" });
    if (existing) {
      if (existing.prescription?.id !== args.prescriptionId || existing.patient?.id !== args.patientId || existing.prescription.patient?.id !== args.patientId || !existing.prescription.organization?.id || !existing.prescription.location?.id) throw new DomainError("Transfer replay scope is incomplete or does not match");
      await patientAccess(transactionContext, existing.patient.id, existing.prescription.organization.id, existing.prescription.location.id);
      if (existing.consent?.evidence?.requestFingerprint !== requestFingerprint) throw new DomainError("Transfer idempotency key was reused with different input");
      return { success: true, reused: true, transferId: existing.id, status: existing.status };
    }
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: "id organization { id } location { id } patient { id }"
    });
    if (!prescription || prescription.patient.id !== args.patientId) throw new DomainError("Prescription not found");
    const { actorId } = await patientAccess(transactionContext, args.patientId, prescription.organization.id, prescription.location.id);
    const transfer = await sudo.query.PrescriptionTransfer.createOne({
      data: {
        idempotencyKey: args.idempotencyKey,
        direction: args.direction,
        status: "requested",
        counterpartyName: args.counterpartyName.trim(),
        counterpartyPhone: args.counterpartyPhone?.trim() || void 0,
        patient: { connect: { id: args.patientId } },
        prescription: { connect: { id: prescription.id } }
      },
      query: "id status"
    });
    const consent = await sudo.query.ConsentRecord.createOne({
      data: {
        consentType: "prescription_transfer",
        policyVersion: args.policyVersion,
        statementKey: args.statementKey,
        accepted: true,
        captureMethod: "authenticated_transfer_request",
        patient: { connect: { id: args.patientId } },
        actor: { connect: { id: actorId } },
        transfer: { connect: { id: transfer.id } },
        evidence: { direction: args.direction, idempotencyKey: args.idempotencyKey, requestFingerprint }
      },
      query: "id"
    });
    await sudo.query.PrescriptionTransfer.updateOne({ where: { id: transfer.id }, data: { status: "consent_recorded", consent: { connect: { id: consent.id } } } });
    await recordAudit(transactionContext, {
      eventKey: `prescription_transfer.requested:${args.idempotencyKey}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId,
      patientId: args.patientId,
      eventType: "prescription_transfer.requested",
      resourceType: "PrescriptionTransfer",
      resourceId: transfer.id,
      metadata: { consentId: consent.id, direction: args.direction }
    });
    return { success: true, reused: false, transferId: transfer.id, status: "consent_recorded" };
  });
}
async function approvePrescriptionTransfer(_root, args, context) {
  if (!permissions.canReviewPrescriptions({ session: context.session })) throw new DomainError("Permission required: canReviewPrescriptions");
  return withDomainTransaction(context, [`transfer:${args.transferId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const transfer = await sudo.query.PrescriptionTransfer.findOne({
      where: { id: args.transferId },
      query: "id status patient { id } consent { id accepted } approval { id reason actionType } prescription { id organization { id } location { id } }"
    });
    if (!transfer) throw new DomainError("Transfer is not ready for authorized review");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: transfer.prescription.organization.id,
      locationId: transfer.prescription.location.id,
      pharmacist: true
    });
    if (transfer.status === "accepted" && transfer.approval?.id && (transfer.approval.actionType !== "transfer" || transfer.approval.reason !== args.reason)) throw new DomainError("Transfer approval replay does not match the recorded reason");
    if (transfer.status === "accepted" && transfer.approval?.id) {
      return { success: true, reused: true, transferId: transfer.id, status: transfer.status, approvalId: transfer.approval.id };
    }
    if (transfer.status !== "consent_recorded" || !transfer.consent?.accepted) throw new DomainError("Transfer is not ready for authorized review");
    const approval = await createHumanApproval(transactionContext, {
      organizationId: transfer.prescription.organization.id,
      locationId: transfer.prescription.location.id,
      actorId: userId,
      actionType: "transfer",
      reason: args.reason,
      attested: args.attested,
      evidence: { transferId: transfer.id, consentId: transfer.consent.id }
    });
    await sudo.query.PrescriptionTransfer.updateOne({
      where: { id: transfer.id },
      data: { status: "accepted", approval: { connect: { id: approval.id } } }
    });
    await recordAudit(transactionContext, {
      eventKey: `prescription_transfer.accepted:${transfer.id}`,
      organizationId: transfer.prescription.organization.id,
      locationId: transfer.prescription.location.id,
      actorId: userId,
      patientId: transfer.patient.id,
      eventType: "prescription_transfer.accepted",
      resourceType: "PrescriptionTransfer",
      resourceId: transfer.id,
      metadata: { consentId: transfer.consent.id, approvalId: approval.id }
    });
    return { success: true, reused: false, transferId: transfer.id, status: "accepted", approvalId: approval.id };
  });
}

// features/keystone/mutations/operationalQueries.ts
var import_node_crypto16 = require("node:crypto");

// features/keystone/workflows/recall-exposure.ts
function recallExposureMovementWhere(lotIds) {
  return {
    lot: { id: { in: lotIds } },
    movementType: { in: ["dispense", "sale"] },
    quantityDelta: { lt: 0 }
  };
}
function unlinkedRecallExposureCount(candidateMovementCount, linkedMovementCount) {
  if (!Number.isInteger(candidateMovementCount) || candidateMovementCount < 0 || !Number.isInteger(linkedMovementCount) || linkedMovementCount < 0) {
    throw new Error("Recall exposure counts must be non-negative integers");
  }
  return Math.max(0, candidateMovementCount - linkedMovementCount);
}
function assessRecallExposureReconciliation(input) {
  const counts = [input.candidateMovementCount, input.exposureCount, input.linkedExposureCount];
  if (counts.some((value) => !Number.isInteger(value) || value < 0)) throw new Error("Recall exposure counts must be non-negative integers");
  const linkedMovementCount = new Set(input.linkedMovementIds).size;
  return {
    linkedMovementCount,
    unlinkedExposureCount: unlinkedRecallExposureCount(input.candidateMovementCount, linkedMovementCount),
    exposureReconciliationComplete: input.candidateMovementCount === linkedMovementCount && input.exposureCount === input.linkedExposureCount && input.linkedExposureCount === linkedMovementCount
  };
}

// features/pharmacy/will-call.ts
var DAY = 864e5;
function willCallWhere(filter, stores, now = Date.now()) {
  const agedBefore = (days) => ({ status: { equals: "ready_for_pickup" }, dispensingLabels: { some: { voidedAt: null, order: null, dispensedAt: { lte: new Date(now - days * DAY).toISOString() } } } });
  if (filter === "7") return agedBefore(7);
  return { OR: stores.map((store) => ({ organization: { id: { equals: store.id } }, ...agedBefore(store.willCallReturnDays ?? 10) })) };
}

// features/keystone/mutations/operationalQueries.ts
function decodeStableCursor(cursor, expectedScope) {
  if (!cursor) return null;
  if (cursor.length > 2048) throw new DomainError("Worklist cursor is invalid");
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof value?.createdAt !== "string" || Number.isNaN(new Date(value.createdAt).getTime()) || typeof value?.id !== "string" || !value.id || value.id.length > 256) throw new DomainError();
    if (expectedScope !== void 0 && value.scope !== expectedScope) throw new DomainError();
    return { createdAt: new Date(value.createdAt).toISOString(), id: value.id };
  } catch {
    throw new DomainError("Worklist cursor is invalid");
  }
}
function stableCursorWhere(where, cursor, timestampField = "createdAt", direction = "desc") {
  if (!cursor) return where;
  const operator = direction === "asc" ? "gt" : "lt";
  return { AND: [where, { OR: [
    { [timestampField]: { [operator]: cursor.createdAt } },
    { AND: [{ [timestampField]: { equals: cursor.createdAt } }, { id: { [operator]: cursor.id } }] }
  ] }] };
}
function encodeStableCursor(record2, scope) {
  return Buffer.from(JSON.stringify({ createdAt: new Date(record2.createdAt).toISOString(), id: record2.id, ...scope ? { scope } : {} })).toString("base64url");
}
function boundedPageSize(value) {
  if (value == null) return 50;
  if (!Number.isInteger(value) || value < 1) throw new DomainError("Worklist page size must be a positive integer");
  return Math.min(value, 100);
}
function requireAny(context, allowed) {
  if (!context.session?.itemId) throw new DomainError("Authentication required");
  if (!allowed.some((permission2) => permissions[permission2]({ session: context.session }))) {
    throw new DomainError("You do not have permission to read this pharmacy projection");
  }
}
function requirePatientPrivateData(context) {
  if (!permissions.canViewPatientPrivateData({ session: context.session })) {
    throw new DomainError("Patient private-data permission is required for this projection");
  }
}
function prescriptionActions(status) {
  if (["pending_review", "needs_information"].includes(status)) return ["clinical_safety_review", "review"];
  if (status === "approved") return ["clinical_safety_review", "authorize_dispensing"];
  if (["ready_to_dispense", "partially_dispensed"].includes(status)) return ["record_dispensing"];
  if (status === "ready_for_pickup") return ["pickup", "return_to_stock"];
  return [];
}
async function tenantScope(context) {
  if (!context.session?.itemId) throw new DomainError("Authentication required");
  const memberships = await context.sudo().query.OrganizationMembership.findMany({
    where: {
      user: { id: { equals: context.session.itemId } },
      status: { equals: "active" },
      organization: { status: { equals: "active" } }
    },
    query: 'organization { id name locations(where: { status: { equals: "active" } }) { id name status } } location { id name status }'
  });
  const activeMemberships = memberships.filter((membership) => !membership.location || membership.location.status === "active");
  return {
    organizationIds: [...new Set(activeMemberships.map((membership) => membership.organization?.id).filter(Boolean))],
    organizationWideIds: [...new Set(activeMemberships.filter((membership) => !membership.location).map((membership) => membership.organization?.id).filter(Boolean))],
    locationIds: [...new Set(activeMemberships.flatMap((membership) => membership.location?.id ? [membership.location.id] : membership.organization?.locations?.map((location) => location.id) || []))]
  };
}
function tenantEventFilter(scope) {
  return {
    organization: { id: { in: scope.organizationIds } },
    OR: [
      { AND: [{ organization: { id: { in: scope.organizationWideIds } } }, { location: null }] },
      { location: { id: { in: scope.locationIds } } }
    ]
  };
}
async function validatedPharmacistScope(context) {
  if (!context.session?.itemId) return { organizationIds: [], locationIds: [] };
  const memberships = await context.sudo().query.OrganizationMembership.findMany({
    where: {
      user: { id: { equals: context.session.itemId } },
      status: { equals: "active" },
      membershipRole: { in: ["owner", "pharmacist"] },
      externalCredentialValidated: { equals: true },
      credentialVerificationMethod: { in: ["organization_recorded", "external_provider"] },
      credentialExpiresAt: { gt: (/* @__PURE__ */ new Date()).toISOString() },
      credentialValidationReference: { not: { equals: "" } }
    },
    query: 'organization { id status locations(where: { status: { equals: "active" } }) { id status } } location { id status } credentialType credentialJurisdiction credentialIdentifier'
  });
  const eligible = memberships.filter((entry) => entry.organization?.status === "active" && (!entry.location || entry.location.status === "active") && entry.credentialType?.trim() && entry.credentialJurisdiction?.trim() && entry.credentialIdentifier?.trim());
  return {
    organizationIds: [...new Set(eligible.map((entry) => entry.organization?.id).filter(Boolean))],
    locationIds: [...new Set(eligible.flatMap((entry) => entry.location?.id ? [entry.location.id] : entry.organization?.locations?.map((location) => location.id) || []))]
  };
}
async function pharmacyCatalogQueue(_root, _args, context) {
  requireAny(context, ["canManageCatalog", "canManageInventory"]);
  const scope = await tenantScope(context);
  const records = await context.sudo().query.Product.findMany({
    where: { organization: { id: { in: scope.organizationIds } }, location: { id: { in: scope.locationIds } } },
    orderBy: { title: "asc" },
    take: 200,
    query: "id title handle sku status category prescriptionRequirement priceAmount currencyCode onlineAvailable posAvailable coldChainRequired location { id name }"
  });
  return records.map((record2) => ({
    id: record2.id,
    title: record2.title,
    handle: record2.handle,
    sku: record2.sku,
    status: record2.status,
    category: record2.category,
    prescriptionRequirement: record2.prescriptionRequirement,
    priceAmount: record2.priceAmount,
    currencyCode: record2.currencyCode,
    onlineAvailable: record2.onlineAvailable,
    posAvailable: record2.posAvailable,
    coldChainRequired: record2.coldChainRequired,
    locationId: record2.location?.id,
    locationName: record2.location?.name || "Unassigned",
    availableQuantity: null,
    quarantinedQuantity: null,
    inventorySummaryStatus: "not_verified"
  }));
}
async function pharmacyPrescriptionIntakeOptions(_root, _args, context) {
  requireAny(context, ["canManagePrescriptions"]);
  requirePatientPrivateData(context);
  const scope = await validatedPharmacistScope(context);
  if (!scope.organizationIds.length) throw new DomainError("Current organization-recorded pharmacist credential review evidence is required for intake");
  const sudo = context.sudo();
  const [organizations, locations, patients, prescribers, products] = await Promise.all([
    sudo.query.Organization.findMany({ where: { id: { in: scope.organizationIds } }, orderBy: { name: "asc" }, query: "id name" }),
    sudo.query.PharmacyLocation.findMany({ where: { id: { in: scope.locationIds } }, orderBy: { name: "asc" }, query: "id name organization { id }" }),
    sudo.query.PatientProfile.findMany({ where: { organizations: { some: { id: { in: scope.organizationIds } } }, status: { equals: "active" } }, orderBy: { createdAt: "desc" }, take: 200, query: "id displayName patientNumber organizations { id }" }),
    sudo.query.Prescriber.findMany({ where: { organization: { id: { in: scope.organizationIds } } }, orderBy: { name: "asc" }, take: 200, query: "id name verificationStatus organization { id }" }),
    sudo.query.Product.findMany({ where: { organization: { id: { in: scope.organizationIds } }, location: { id: { in: scope.locationIds } }, status: { equals: "published" }, prescriptionRequirement: { in: ["prescription_required", "pharmacist_review_required"] } }, orderBy: { title: "asc" }, take: 200, query: "id title sku organization { id } location { id }" })
  ]);
  return {
    organizations: organizations.map((entry) => ({ id: entry.id, label: entry.name, scopeId: entry.id, detail: null })),
    locations: locations.map((entry) => ({ id: entry.id, label: entry.name, scopeId: entry.organization?.id, detail: null })),
    patients: patients.flatMap((entry) => (entry.organizations || []).filter((organization) => scope.organizationIds.includes(organization.id)).map((organization) => ({ id: entry.id, label: entry.displayName, scopeId: organization.id, detail: entry.patientNumber }))),
    prescribers: prescribers.map((entry) => ({ id: entry.id, label: entry.name, scopeId: entry.organization?.id || "", detail: entry.verificationStatus })),
    products: products.map((entry) => ({ id: entry.id, label: entry.title, scopeId: entry.location?.id || "", detail: entry.sku }))
  };
}
async function pharmacyPatientRecordOptions(_root, _args, context) {
  requireAny(context, ["canManagePatients"]);
  requirePatientPrivateData(context);
  const scope = await tenantScope(context);
  const organizations = await context.sudo().query.Organization.findMany({ where: { id: { in: scope.organizationIds }, status: { equals: "active" } }, orderBy: { name: "asc" }, take: 100, query: "id name" });
  return { organizations: organizations.map((entry) => ({ id: entry.id, label: entry.name, scopeId: entry.id, detail: null })) };
}
async function pharmacyCredentialReviewOptions(_root, _args, context) {
  requireAny(context, ["canManageUsers", "canReviewPrescriptions"]);
  const scope = await tenantScope(context);
  const sudo = context.sudo();
  const [memberships, prescribers, products, organizations, catalog, stockedPrescriptionLots] = await Promise.all([
    sudo.query.OrganizationMembership.findMany({
      where: { organization: { id: { in: scope.organizationIds } }, status: { equals: "active" }, membershipRole: { in: ["owner", "pharmacist"] } },
      orderBy: { createdAt: "asc" },
      take: 100,
      query: "id membershipRole credentialExpiresAt user { name } organization { id name } location { name }"
    }),
    sudo.query.Prescriber.findMany({ where: { organization: { id: { in: scope.organizationIds } } }, orderBy: { name: "asc" }, take: 200, query: "id name npi credentialExpiresAt organization { id }" }),
    sudo.query.Product.findMany({ where: { organization: { id: { in: scope.organizationIds } } }, orderBy: { title: "asc" }, take: 300, query: "id title sku organization { id } drugReference { id ndc11 proprietaryName reviews { id status organization { id } reviewedAt } }" }),
    sudo.query.Organization.findMany({ where: { id: { in: scope.organizationIds } }, orderBy: { name: "asc" }, take: 100, query: "id name cashSalesEnabled cashTaxRateBps cashTaxPolicyReference" }),
    // The drug reference catalog is shared; each pharmacy reviews an entry before stocking or dispensing it.
    sudo.query.DrugReference.findMany({ orderBy: { proprietaryName: "asc" }, take: 200, query: "id ndc11 proprietaryName reviews { id status organization { id } reviewedAt }" }),
    sudo.query.InventoryLot.count({ where: { status: { equals: "available" }, quantityAvailable: { gt: 0 }, product: { organization: { id: { in: scope.organizationIds } }, prescriptionRequirement: { not: { equals: "none" } } } } })
  ]);
  const drugReferences = /* @__PURE__ */ new Map();
  for (const product of products) {
    if (!product.drugReference?.id || drugReferences.has(`${product.organization?.id}:${product.drugReference.id}`)) continue;
    const currentReview = product.drugReference.reviews?.find((review) => review.organization?.id === product.organization?.id && review.status === "active");
    drugReferences.set(`${product.organization?.id}:${product.drugReference.id}`, { id: product.drugReference.id, label: product.drugReference.proprietaryName || product.title, scopeId: product.organization?.id, detail: `${product.drugReference.ndc11 || "NDC missing"} \xB7 ${currentReview ? `reviewed ${new Date(currentReview.reviewedAt).toISOString().slice(0, 10)}` : "review required"}` });
  }
  for (const organization of organizations) {
    for (const reference of catalog) {
      if (drugReferences.has(`${organization.id}:${reference.id}`)) continue;
      const currentReview = reference.reviews?.find((review) => review.organization?.id === organization.id && review.status === "active");
      drugReferences.set(`${organization.id}:${reference.id}`, { id: reference.id, label: reference.proprietaryName, scopeId: organization.id, detail: `${reference.ndc11 || "NDC missing"} \xB7 ${currentReview ? `reviewed ${new Date(currentReview.reviewedAt).toISOString().slice(0, 10)}` : "review required"}` });
    }
  }
  const now = Date.now();
  const current = (value) => Boolean(value && new Date(value).getTime() > now);
  const reviewedReferenceIds = new Set(catalog.filter((reference) => reference.reviews?.some((review) => review.status === "active" && scope.organizationIds.includes(review.organization?.id))).map((reference) => reference.id));
  return {
    organizationWideOrganizationIds: scope.organizationWideIds,
    setup: {
      pharmacistReviewed: memberships.some((entry) => current(entry.credentialExpiresAt)),
      prescriberHasNpi: prescribers.some((entry) => isValidNpi(entry.npi)),
      prescriberReady: prescribers.some((entry) => isValidNpi(entry.npi) && current(entry.credentialExpiresAt)),
      drugReferenceReviewed: reviewedReferenceIds.size > 0 || products.some((product) => product.drugReference?.reviews?.some((review) => review.status === "active" && review.organization?.id === product.organization?.id)),
      cashPolicyRecorded: organizations.some((entry) => entry.cashSalesEnabled),
      prescriptionProductStocked: stockedPrescriptionLots > 0
    },
    organizations: organizations.map((entry) => ({ id: entry.id, label: entry.name, scopeId: entry.id, detail: entry.cashSalesEnabled ? `Cash enabled \xB7 ${(entry.cashTaxRateBps / 100).toFixed(2)}% \xB7 ${entry.cashTaxPolicyReference}` : "Cash/tax policy review required" })),
    memberships: memberships.map((entry) => ({ id: entry.id, label: `${entry.user?.name || "Staff member"} \xB7 ${entry.membershipRole}`, scopeId: entry.organization?.id, detail: entry.credentialExpiresAt ? `Review expires ${new Date(entry.credentialExpiresAt).toISOString().slice(0, 10)}` : entry.location?.name || entry.organization?.name })),
    prescribers: prescribers.map((entry) => ({ id: entry.id, label: entry.name, scopeId: entry.organization?.id, detail: `${entry.npi ? `NPI ${entry.npi}` : "NPI missing"}${entry.credentialExpiresAt ? ` \xB7 review expires ${new Date(entry.credentialExpiresAt).toISOString().slice(0, 10)}` : ""}` })),
    drugReferences: [...drugReferences.values()]
  };
}
async function pharmacyInventoryReceiptOptions(_root, _args, context) {
  requireAny(context, ["canManageInventory"]);
  const scope = await tenantScope(context);
  const sudo = context.sudo();
  const [locations, suppliers] = await Promise.all([
    sudo.query.PharmacyLocation.findMany({ where: { id: { in: scope.locationIds } }, orderBy: { name: "asc" }, query: "id name organization { id }" }),
    sudo.query.Supplier.findMany({ where: { organization: { id: { in: scope.organizationIds } } }, orderBy: { name: "asc" }, take: 200, query: "id name organization { id }" })
  ]);
  return {
    locations: locations.map((entry) => ({ id: entry.id, label: entry.name, scopeId: entry.organization?.id || "", detail: null })),
    suppliers: suppliers.map((entry) => ({ id: entry.id, label: entry.name, scopeId: entry.organization?.id || "", detail: null }))
  };
}
var receiptProductStatuses = /* @__PURE__ */ new Set(["draft", "published"]);
function inventoryReceiptProductQueueFilter(scope, filters) {
  const organizationIds = [...new Set(scope.organizationIds)].sort();
  const authorizedLocationIds = [...new Set(scope.locationIds)].sort();
  const locationId = filters.locationId;
  if (typeof locationId !== "string" || !locationId.trim() || !authorizedLocationIds.includes(locationId)) {
    throw new DomainError("You do not have access to this location");
  }
  const status = filters.status ?? null;
  if (status !== null && (typeof status !== "string" || !receiptProductStatuses.has(status))) {
    throw new DomainError("Product selector status filter is invalid");
  }
  const where = {
    organization: { id: { in: organizationIds } },
    location: { id: { equals: locationId } },
    status: status ? { equals: status } : { in: ["draft", "published"] }
  };
  const cursorScope = (0, import_node_crypto16.createHash)("sha256").update(JSON.stringify({
    worklist: "inventory-receipt-products",
    organizationIds,
    authorizedLocationIds,
    locationId,
    status
  })).digest("base64url");
  return { where, cursorScope };
}
async function pharmacyInventoryReceiptProductWorklist(_root, args, context) {
  requireAny(context, ["canManageInventory"]);
  const pageSize = boundedPageSize(args.first);
  const scope = await tenantScope(context);
  const { where: baseWhere, cursorScope } = inventoryReceiptProductQueueFilter(scope, args);
  const cursor = decodeStableCursor(args.after, cursorScope);
  const [totalCount, products] = await Promise.all([
    context.sudo().query.Product.count({ where: baseWhere }),
    context.sudo().query.Product.findMany({
      where: stableCursorWhere(baseWhere, cursor),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: pageSize + 1,
      query: "id title sku createdAt coldChainRequired"
    })
  ]);
  const hasMore = products.length > pageSize;
  const pageProducts = products.slice(0, pageSize);
  return {
    items: pageProducts.map((product) => ({ id: product.id, label: product.title, scopeId: args.locationId, detail: product.sku, coldChainRequired: Boolean(product.coldChainRequired) })),
    totalCount,
    hasMore,
    nextCursor: hasMore && pageProducts.length ? encodeStableCursor({ createdAt: pageProducts[pageProducts.length - 1].createdAt, id: pageProducts[pageProducts.length - 1].id }, cursorScope) : null
  };
}
async function pharmacyPrescriberDirectory(_root, _args, context) {
  requireAny(context, ["canManagePrescriptions", "canReviewPrescriptions"]);
  const scope = await tenantScope(context);
  const records = await context.sudo().query.Prescriber.findMany({
    where: { organization: { id: { in: scope.organizationIds } } },
    orderBy: { name: "asc" },
    take: 200,
    query: "id name npi phone fax verificationStatus externalValidationComplete organization { name } prescriptions { id }"
  });
  return records.map((record2) => ({
    id: record2.id,
    name: record2.name,
    npi: record2.npi,
    phone: record2.phone,
    fax: record2.fax,
    verificationStatus: record2.verificationStatus,
    externalValidationComplete: record2.externalValidationComplete,
    organizationName: record2.organization?.name || "Unassigned",
    prescriptionCount: record2.prescriptions?.length || 0
  }));
}
async function pharmacyPrescriptionQueue(_root, _args, context) {
  requireAny(context, ["canManagePrescriptions", "canReviewPrescriptions", "canDispenseMedications"]);
  requirePatientPrivateData(context);
  const scope = await tenantScope(context);
  const records = await context.sudo().query.Prescription.findMany({
    where: { organization: { id: { in: scope.organizationIds } }, location: { id: { in: scope.locationIds } } },
    orderBy: { createdAt: "desc" },
    take: 100,
    query: "id prescriptionNumber status source sourceVerificationStatus createdAt writtenAt patient { displayName } prescriber { name verificationStatus } location { name } items(take: 1) { medicationNameSnapshot quantityPrescribed refillsRemaining }"
  });
  return records.map((record2) => ({
    id: record2.id,
    prescriptionNumber: record2.prescriptionNumber,
    status: record2.status,
    source: record2.source,
    sourceVerificationStatus: record2.sourceVerificationStatus,
    createdAt: record2.createdAt,
    writtenAt: record2.writtenAt,
    patientDisplayName: record2.patient?.displayName || "Private patient",
    prescriberName: record2.prescriber?.name || "Unassigned",
    prescriberVerificationStatus: record2.prescriber?.verificationStatus || "unverified",
    locationName: record2.location?.name || "Unassigned",
    medicationName: record2.items?.[0]?.medicationNameSnapshot || null,
    quantityPrescribed: record2.items?.[0]?.quantityPrescribed ?? null,
    refillsRemaining: record2.items?.[0]?.refillsRemaining ?? null
  }));
}
async function pharmacyPrescriptionWorklist(_root, args, context) {
  requireAny(context, ["canManagePrescriptions", "canReviewPrescriptions", "canDispenseMedications"]);
  requirePatientPrivateData(context);
  const pharmacistScope = await validatedPharmacistScope(context);
  const pageSize = boundedPageSize(args.first);
  const cursor = decodeStableCursor(args.after);
  let willCallFilterWhere = null;
  if (args.willCall === "7") willCallFilterWhere = willCallWhere("7", []);
  else if (args.willCall === "due") {
    const stores = await context.sudo().query.Organization.findMany({ where: { id: { in: pharmacistScope.organizationIds } }, take: 100, query: "id willCallReturnDays" });
    willCallFilterWhere = willCallWhere("due", stores);
  } else if (args.willCall) throw new DomainError("Unknown will-call filter");
  const baseWhere = {
    organization: { id: { in: pharmacistScope.organizationIds } },
    location: { id: { in: pharmacistScope.locationIds } },
    ...willCallFilterWhere ? willCallFilterWhere : {
      OR: [
        { status: { in: ["draft", "pending_review", "needs_information", "approved", "ready_to_dispense", "partially_dispensed", "ready_for_pickup"] } },
        { refillRequests: { some: { status: { in: ["requested", "under_review", "prescriber_contacted"] } } } },
        { transfers: { some: { status: { in: ["requested", "consent_recorded", "under_review"] } } } }
      ]
    }
  };
  const [totalCount, records] = await Promise.all([
    context.sudo().query.Prescription.count({ where: baseWhere }),
    context.sudo().query.Prescription.findMany({
      where: stableCursorWhere(baseWhere, cursor),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: pageSize + 1,
      query: 'id prescriptionNumber status source sourceVerificationStatus createdAt writtenAt patient { displayName } prescriber { name verificationStatus } location { name } items(take: 1) { medicationNameSnapshot quantityPrescribed refillsRemaining } refillRequests(where: { status: { in: ["requested", "under_review", "prescriber_contacted"] } }, take: 50) { id } transfers(where: { status: { in: ["requested", "consent_recorded", "under_review"] } }, take: 50) { id } organization { willCallReturnDays } dispensingLabels(where: { voidedAt: null, order: null }, orderBy: { dispensedAt: desc }, take: 1) { dispensedAt }'
    })
  ]);
  const hasMore = records.length > pageSize;
  const pageRecords = records.slice(0, pageSize);
  const items = pageRecords.map((record2) => ({
    id: record2.id,
    prescriptionNumber: record2.prescriptionNumber,
    status: record2.status,
    source: record2.source,
    sourceVerificationStatus: record2.sourceVerificationStatus,
    createdAt: record2.createdAt,
    writtenAt: record2.writtenAt,
    patientDisplayName: record2.patient?.displayName || "Private patient",
    prescriberName: record2.prescriber?.name || "Unassigned",
    prescriberVerificationStatus: record2.prescriber?.verificationStatus || "unverified",
    locationName: record2.location?.name || "Unassigned",
    medicationName: record2.items?.[0]?.medicationNameSnapshot || null,
    quantityPrescribed: record2.items?.[0]?.quantityPrescribed ?? null,
    refillsRemaining: record2.items?.[0]?.refillsRemaining ?? null,
    openRefillCount: record2.refillRequests?.length || 0,
    openTransferCount: record2.transfers?.length || 0,
    readyAt: record2.status === "ready_for_pickup" ? record2.dispensingLabels?.[0]?.dispensedAt || null : null,
    willCallReturnDays: record2.organization?.willCallReturnDays ?? 10
  }));
  return { items, totalCount, hasMore, nextCursor: hasMore && pageRecords.length ? encodeStableCursor({ createdAt: pageRecords[pageRecords.length - 1].createdAt, id: pageRecords[pageRecords.length - 1].id }) : null };
}
async function pharmacyPrescriptionTask(_root, args, context) {
  requireAny(context, ["canReviewPrescriptions", "canDispenseMedications"]);
  requirePatientPrivateData(context);
  const scope = await tenantScope(context);
  const pharmacistScope = await validatedPharmacistScope(context);
  const prescription = await context.sudo().query.Prescription.findOne({
    where: { id: args.prescriptionId },
    query: `
      id prescriptionNumber status source sourceVerificationStatus writtenAt expiresAt
      organization { id operatorDisplayName supportPhone cashSalesEnabled cashTaxRateBps cashTaxPolicyReference willCallReturnDays } location { id name }
      patient { id displayName identityVerificationStatus identityReference identityVerifiedAt allergies(where: { status: { in: ["active", "none_known"] } }) { id allergen reaction severity updatedAt } medications(where: { status: { in: ["current", "none_known"] } }) { id medicationName directions updatedAt } } prescriber { id name verificationStatus }
      approval { id approvedAt }
      items {
        id fillLineage activeFillNumber medicationNameSnapshot sig quantityPrescribed daysSupply refillsAuthorized refillsRemaining substitutionAllowed drugReference { id }
        product {
          id title sku priceAmount currencyCode taxable
          inventoryLots(orderBy: { expirationDate: asc }) {
            id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete
            recalls { status }
            location { id }
          }
        }
      }
      reviews(orderBy: { reviewedAt: desc }) { id decision reason reviewedAt pharmacist { name } }
      safetyReviews(orderBy: { reviewedAt: desc }, take: 10) { id fillNumber outcome reviewReference notes overrideReason reviewedAt pharmacist { name } }
      dispensingLabels(orderBy: { dispensedAt: desc }, take: 10) { id labelNumber fillNumber operatorNameSnapshot operatorPhoneSnapshot locationNameSnapshot locationAddressSnapshot patientNameSnapshot prescriberNameSnapshot medicationNameSnapshot sigSnapshot quantityDispensed lotNumberSnapshot ndc11Snapshot expirationDateSnapshot auxiliaryWarnings counselingOutcome dispensedAt voidedAt voidReason }
      refillRequests(orderBy: { requestedAt: desc }, take: 50) { id status requestNote resolutionNote requestedAt resolvedAt prescriptionItem { id medicationNameSnapshot } }
      transfers(orderBy: { requestedAt: desc }, take: 50) { id direction status counterpartyName counterpartyPhone requestedAt completedAt consent { id accepted } }
    `
  });
  if (!prescription || !scope.organizationIds.includes(prescription.organization?.id) || !scope.locationIds.includes(prescription.location?.id) || !pharmacistScope.locationIds.includes(prescription.location?.id)) {
    throw new DomainError("Prescription not found");
  }
  const now = Date.now();
  const fillNumbers = prescription.items.map((item) => currentFillNumber(item));
  const fillNumber = fillNumbers.length ? Math.max(...fillNumbers) : 0;
  const drugReferenceIds = [...new Set(prescription.items.map((item) => item.drugReference?.id).filter(Boolean))];
  const drugReviews = await context.sudo().query.DrugReferenceReview.findMany({
    where: { organization: { id: { equals: prescription.organization.id } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: "active" } },
    take: 100,
    query: "id reviewedAt"
  });
  const evidenceChanges = [prescription.patient?.identityVerifiedAt, ...(prescription.patient?.allergies || []).map((entry) => entry.updatedAt), ...(prescription.patient?.medications || []).map((entry) => entry.updatedAt), ...drugReviews.map((entry) => entry.reviewedAt)].filter(Boolean);
  const latestEvidenceChange = evidenceChanges.sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).at(-1);
  const latestSafetyReview = prescription.safetyReviews?.[0];
  const safetyReviewStale = isHumanSafetyReviewStale(latestSafetyReview, fillNumber, latestEvidenceChange);
  const availableActions = prescriptionActions(prescription.status);
  if (["ready_to_dispense", "partially_dispensed"].includes(prescription.status) && safetyReviewStale) availableActions.push("hold_for_clinical_review");
  return {
    id: prescription.id,
    prescriptionNumber: prescription.prescriptionNumber,
    status: prescription.status,
    source: prescription.source,
    sourceVerificationStatus: prescription.sourceVerificationStatus,
    writtenAt: prescription.writtenAt,
    expiresAt: prescription.expiresAt,
    patientId: prescription.patient?.id,
    patientDisplayName: prescription.patient?.displayName || "Private patient",
    patientIdentityVerificationStatus: prescription.patient?.identityVerificationStatus || "unverified",
    patientIdentityEvidenceRecorded: Boolean(prescription.patient?.identityReference && prescription.patient?.identityVerifiedAt),
    prescriberId: prescription.prescriber?.id,
    prescriberName: prescription.prescriber?.name || "Unassigned",
    prescriberVerificationStatus: prescription.prescriber?.verificationStatus || "unverified",
    locationId: prescription.location.id,
    locationName: prescription.location.name,
    operatorDisplayName: prescription.organization.operatorDisplayName,
    operatorPhone: prescription.organization.supportPhone || null,
    cashSalesEnabled: prescription.organization.cashSalesEnabled === true && Boolean(prescription.organization.cashTaxPolicyReference),
    cashTaxRateBps: prescription.organization.cashTaxRateBps || 0,
    willCallReturnDays: prescription.organization.willCallReturnDays ?? 10,
    approvalRecorded: Boolean(prescription.approval?.id),
    approvedAt: prescription.approval?.approvedAt || null,
    availableActions: pharmacistScope.locationIds.includes(prescription.location.id) ? availableActions.filter((action) => ["review", "clinical_safety_review", "hold_for_clinical_review"].includes(action) ? permissions.canReviewPrescriptions({ session: context.session }) : permissions.canDispenseMedications({ session: context.session })) : [],
    items: (prescription.items || []).map((item) => ({
      id: item.id,
      fillLineage: item.fillLineage || null,
      medicationName: item.medicationNameSnapshot,
      sig: item.sig,
      quantityPrescribed: item.quantityPrescribed,
      daysSupply: item.daysSupply,
      refillsAuthorized: item.refillsAuthorized,
      refillsRemaining: item.refillsRemaining,
      substitutionAllowed: item.substitutionAllowed,
      productId: item.product?.id,
      productTitle: item.product?.title || item.medicationNameSnapshot,
      productSku: item.product?.sku || "",
      priceAmount: item.product?.priceAmount || 0,
      currencyCode: item.product?.currencyCode || "USD",
      taxable: item.product?.taxable !== false,
      eligibleLots: (item.product?.inventoryLots || []).filter((lot) => lot.location?.id === prescription.location.id && isLotEligible(lot, now)).map((lot) => ({
        id: lot.id,
        lotNumber: lot.lotNumber,
        expirationDate: lot.expirationDate,
        eligibleQuantity: eligibleLotQuantity(lot, now),
        coldChainRequired: lot.coldChainRequired
      }))
    })),
    patientAllergies: (prescription.patient?.allergies || []).map((entry) => ({ id: entry.id, allergen: entry.allergen, reaction: entry.reaction, severity: entry.severity })),
    patientMedications: (prescription.patient?.medications || []).map((entry) => ({ id: entry.id, medicationName: entry.medicationName, directions: entry.directions })),
    safetyReviews: (prescription.safetyReviews || []).map((review) => ({ id: review.id, fillNumber: review.fillNumber, outcome: review.outcome, reviewReference: review.reviewReference, notes: review.notes, overrideReason: review.overrideReason, reviewedAt: review.reviewedAt, pharmacistName: review.pharmacist?.name || "Authorized reviewer" })),
    dispensingLabels: (prescription.dispensingLabels || []).map((label) => ({ id: label.id, labelNumber: label.labelNumber, fillNumber: label.fillNumber, operatorName: label.operatorNameSnapshot, operatorPhone: label.operatorPhoneSnapshot, locationName: label.locationNameSnapshot, locationAddress: label.locationAddressSnapshot, patientName: label.patientNameSnapshot, prescriberName: label.prescriberNameSnapshot, medicationName: label.medicationNameSnapshot, sig: label.sigSnapshot, quantityDispensed: label.quantityDispensed, lotNumber: label.lotNumberSnapshot, ndc11: label.ndc11Snapshot, expirationDate: label.expirationDateSnapshot, auxiliaryWarnings: Array.isArray(label.auxiliaryWarnings) ? label.auxiliaryWarnings : [], counselingOutcome: label.counselingOutcome, dispensedAt: label.dispensedAt, voidedAt: label.voidedAt || null, voidReason: label.voidReason || null })),
    refillRequests: (prescription.refillRequests || []).map((entry) => ({ id: entry.id, status: entry.status, requestNote: entry.requestNote, resolutionNote: entry.resolutionNote, requestedAt: entry.requestedAt, resolvedAt: entry.resolvedAt, prescriptionItemId: entry.prescriptionItem?.id, medicationName: entry.prescriptionItem?.medicationNameSnapshot || "Prescription item" })),
    transfers: (prescription.transfers || []).map((entry) => ({ id: entry.id, direction: entry.direction, status: entry.status, counterpartyName: entry.counterpartyName, counterpartyPhone: entry.counterpartyPhone, requestedAt: entry.requestedAt, completedAt: entry.completedAt, consentRecorded: entry.consent?.accepted === true })),
    reviews: (prescription.reviews || []).map((review) => ({
      id: review.id,
      decision: review.decision,
      reason: review.reason,
      reviewedAt: review.reviewedAt,
      pharmacistName: review.pharmacist?.name || "Authorized reviewer"
    }))
  };
}
var inventoryLotQueueStatuses = /* @__PURE__ */ new Set(["available", "quarantined", "expired", "recalled", "depleted"]);
function inventoryLotQueueFilter(locationIds, filters) {
  const allowedLocationIds = [...new Set(locationIds)].sort();
  let scopedLocationIds = allowedLocationIds;
  if (filters.locationId != null) {
    if (typeof filters.locationId !== "string" || !filters.locationId.trim() || !allowedLocationIds.includes(filters.locationId)) {
      throw new DomainError("You do not have access to this location");
    }
    scopedLocationIds = [filters.locationId];
  }
  const status = filters.status ?? null;
  if (status !== null && (typeof status !== "string" || !inventoryLotQueueStatuses.has(status))) {
    throw new DomainError("Inventory status filter is invalid");
  }
  const where = { location: { id: { in: scopedLocationIds } } };
  if (status) where.status = { equals: status };
  const scope = (0, import_node_crypto16.createHash)("sha256").update(JSON.stringify({ worklist: "inventory-lots", locationIds: scopedLocationIds, status })).digest("base64url");
  return { where, scope };
}
async function pharmacyInventoryQueue(_root, args, context) {
  requireAny(context, ["canManageInventory", "canManageRecalls", "canDispenseMedications"]);
  const pageSize = boundedPageSize(args.first);
  const scope = await tenantScope(context);
  const { where: baseWhere, scope: cursorScope } = inventoryLotQueueFilter(scope.locationIds, args);
  const cursor = decodeStableCursor(args.after, cursorScope);
  const [totalCount, records] = await Promise.all([
    context.sudo().query.InventoryLot.count({ where: baseWhere }),
    context.sudo().query.InventoryLot.findMany({
      where: stableCursorWhere(baseWhere, cursor, "expirationDate", "asc"),
      orderBy: [{ expirationDate: "asc" }, { id: "asc" }],
      take: pageSize + 1,
      query: 'id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete storageBin product { title sku } location { name } recallsCount(where: { status: { in: ["active", "quarantined"] } }) temperatureExcursionsCount(where: { status: { in: ["open", "under_review"] } })'
    })
  ]);
  const hasMore = records.length > pageSize;
  const pageRecords = records.slice(0, pageSize);
  const items = pageRecords.map((record2) => ({
    id: record2.id,
    lotNumber: record2.lotNumber,
    status: record2.status,
    expirationDate: record2.expirationDate,
    quantityAvailable: record2.quantityAvailable,
    quantityQuarantined: record2.quantityQuarantined,
    coldChainRequired: record2.coldChainRequired,
    coldChainEvidenceComplete: record2.coldChainEvidenceComplete,
    storageBin: record2.storageBin,
    productTitle: record2.product?.title || "Unlinked product",
    productSku: record2.product?.sku || "",
    locationName: record2.location?.name || "Unassigned",
    activeRecallCount: record2.recallsCount || 0,
    openExcursionCount: record2.temperatureExcursionsCount || 0
  }));
  return {
    items,
    totalCount,
    hasMore,
    nextCursor: hasMore && pageRecords.length ? encodeStableCursor({ createdAt: pageRecords[pageRecords.length - 1].expirationDate, id: pageRecords[pageRecords.length - 1].id }, cursorScope) : null
  };
}
async function pharmacyInventoryLotTask(_root, args, context) {
  requireAny(context, ["canManageInventory", "canManageRecalls", "canDispenseMedications"]);
  const scope = await tenantScope(context);
  const lot = await context.sudo().query.InventoryLot.findOne({
    where: { id: args.lotId },
    query: `
      id lotNumber serialNumber status expirationDate receivedAt quantityReceived quantityAvailable quantityQuarantined
      storageBin coldChainRequired minimumTemperatureC maximumTemperatureC coldChainEvidenceComplete
      product { id title sku } location { id name }
      recalls { id recallNumber status classification }
      temperatureExcursions(orderBy: { startedAt: desc }) { id status observedMinimumC observedMaximumC startedAt endedAt dispositionReason resolutionNote resolvedAt }
      movements(orderBy: { occurredAt: desc }, take: 50) { id movementType quantityDelta reason occurredAt actor { name } }
    `
  });
  if (!lot || !scope.locationIds.includes(lot.location?.id)) throw new DomainError("Inventory lot not found");
  return {
    id: lot.id,
    lotNumber: lot.lotNumber,
    serialNumber: lot.serialNumber,
    status: lot.status,
    expirationDate: lot.expirationDate,
    receivedAt: lot.receivedAt,
    quantityReceived: lot.quantityReceived,
    quantityAvailable: lot.quantityAvailable,
    quantityQuarantined: lot.quantityQuarantined,
    eligibleQuantity: eligibleLotQuantity(lot),
    storageBin: lot.storageBin,
    coldChainRequired: lot.coldChainRequired,
    minimumTemperatureC: lot.minimumTemperatureC,
    maximumTemperatureC: lot.maximumTemperatureC,
    coldChainEvidenceComplete: lot.coldChainEvidenceComplete,
    productId: lot.product?.id,
    productTitle: lot.product?.title || "Unlinked product",
    productSku: lot.product?.sku || "",
    locationId: lot.location.id,
    locationName: lot.location.name,
    canAdjust: !["recalled", "expired"].includes(lot.status),
    recalls: (lot.recalls || []).map((recall) => ({ id: recall.id, recallNumber: recall.recallNumber, status: recall.status, classification: recall.classification })),
    excursions: (lot.temperatureExcursions || []).map((excursion) => ({
      id: excursion.id,
      status: excursion.status,
      observedMinimumC: excursion.observedMinimumC,
      observedMaximumC: excursion.observedMaximumC,
      startedAt: excursion.startedAt,
      endedAt: excursion.endedAt,
      dispositionReason: excursion.dispositionReason || null,
      resolutionNote: excursion.resolutionNote || null,
      resolvedAt: excursion.resolvedAt || null
    })),
    movements: (lot.movements || []).map((movement) => ({
      id: movement.id,
      movementType: movement.movementType,
      quantityDelta: movement.quantityDelta,
      reason: movement.reason,
      occurredAt: movement.occurredAt,
      actorName: movement.actor?.name || "System"
    }))
  };
}
async function pharmacyRecallOpenOptions(_root, _args, context) {
  requireAny(context, ["canManageRecalls"]);
  const scope = await tenantScope(context);
  const sudo = context.sudo();
  const [organizations, locations, lots] = await Promise.all([
    sudo.query.Organization.findMany({ where: { id: { in: scope.organizationIds } }, orderBy: { name: "asc" }, take: 100, query: "id name" }),
    sudo.query.PharmacyLocation.findMany({ where: { id: { in: scope.locationIds } }, orderBy: { name: "asc" }, take: 100, query: "id name organization { id }" }),
    sudo.query.InventoryLot.findMany({ where: { location: { id: { in: scope.locationIds } }, quantityReceived: { gt: 0 } }, orderBy: { expirationDate: "asc" }, take: 1e4, query: "id lotNumber status quantityReceived quantityAvailable product { title sku organization { id } } location { id name }" })
  ]);
  return {
    organizations: organizations.map((entry) => ({ id: entry.id, label: entry.name, scopeId: entry.id, detail: null })),
    organizationWideOrganizationIds: scope.organizationWideIds,
    locations: locations.map((entry) => ({ id: entry.id, label: entry.name, scopeId: entry.organization?.id, detail: null })),
    lots: lots.map((entry) => ({ id: entry.id, label: `${entry.product?.title || "Product"} \xB7 ${entry.lotNumber}`, organizationId: entry.product?.organization?.id, locationId: entry.location?.id, detail: `${entry.location?.name || "Unknown location"} \xB7 ${entry.status} \xB7 ${entry.quantityAvailable}/${entry.quantityReceived} available/received \xB7 ${entry.product?.sku || ""}` }))
  };
}
async function pharmacyRecallQueue(_root, _args, context) {
  requireAny(context, ["canManageRecalls", "canManageInventory"]);
  const scope = await tenantScope(context);
  const records = await context.sudo().query.Recall.findMany({
    where: tenantEventFilter(scope),
    orderBy: { initiatedAt: "desc" },
    take: 100,
    query: "id recallNumber classification status reason source initiatedAt location { name } lots { id status quantityAvailable quantityQuarantined } exposures { status } approval { id approvedAt actor { name } }"
  });
  return Promise.all(records.map(async (record2) => {
    const lotIds = (record2.lots || []).map((lot) => lot.id);
    const candidateWhere = recallExposureMovementWhere(lotIds);
    const [candidateMovementCount, candidateMovements, exposureCount] = await Promise.all([
      context.sudo().query.InventoryMovement.count({ where: candidateWhere }),
      context.sudo().query.InventoryMovement.findMany({ where: candidateWhere, orderBy: { occurredAt: "asc" }, take: 1e4, query: "id" }),
      context.sudo().query.RecallExposure.count({ where: { recall: { id: { equals: record2.id } } } })
    ]);
    const candidateMovementIds = candidateMovements.map((movement) => movement.id);
    const linkedRows = candidateMovementIds.length ? await context.sudo().query.RecallExposure.findMany({ where: { recall: { id: { equals: record2.id } }, movement: { id: { in: candidateMovementIds } } }, take: 1e4, query: "id movement { id }" }) : [];
    const linkedMovementIds = linkedRows.map((entry) => entry.movement?.id).filter(Boolean);
    const { unlinkedExposureCount } = assessRecallExposureReconciliation({ candidateMovementCount, linkedMovementIds, exposureCount, linkedExposureCount: linkedRows.length });
    return {
      id: record2.id,
      recallNumber: record2.recallNumber,
      classification: record2.classification,
      status: record2.status,
      reason: record2.reason,
      source: record2.source,
      initiatedAt: record2.initiatedAt,
      locationName: record2.location?.name || null,
      affectedLotCount: record2.lots?.length || 0,
      quarantinedLotCount: (record2.lots || []).filter((lot) => ["quarantined", "recalled"].includes(lot.status) || lot.quantityQuarantined >= lot.quantityAvailable).length,
      unresolvedExposureCount: (record2.exposures || []).filter((exposure) => !["returned", "resolved", "unable_to_reach"].includes(exposure.status)).length + unlinkedExposureCount,
      approvalRecorded: Boolean(record2.approval?.id),
      approvedAt: record2.approval?.approvedAt || null,
      approvedBy: record2.approval?.actor?.name || null
    };
  }));
}
async function pharmacyRecallWorklist(_root, args, context) {
  requireAny(context, ["canManageRecalls"]);
  requirePatientPrivateData(context);
  const scope = await tenantScope(context);
  const pageSize = boundedPageSize(args.first);
  const cursor = decodeStableCursor(args.after);
  const baseWhere = tenantEventFilter(scope);
  const [totalCount, records] = await Promise.all([
    context.sudo().query.Recall.count({ where: baseWhere }),
    context.sudo().query.Recall.findMany({
      where: stableCursorWhere(baseWhere, cursor, "initiatedAt"),
      orderBy: [{ initiatedAt: "desc" }, { id: "desc" }],
      take: pageSize + 1,
      query: "id recallNumber classification status reason source initiatedAt location { name } lots { id status quantityAvailable quantityQuarantined } approval { id approvedAt actor { name } }"
    })
  ]);
  const hasMore = records.length > pageSize;
  const pageRecords = records.slice(0, pageSize);
  const items = await Promise.all(pageRecords.map(async (record2) => {
    const lotIds = (record2.lots || []).map((lot) => lot.id);
    const candidateWhere = recallExposureMovementWhere(lotIds);
    const [candidateMovementCount, candidateMovements, exposureCount, unresolvedExposureCount] = await Promise.all([
      context.sudo().query.InventoryMovement.count({ where: candidateWhere }),
      context.sudo().query.InventoryMovement.findMany({ where: candidateWhere, orderBy: { occurredAt: "asc" }, take: 1e4, query: "id" }),
      context.sudo().query.RecallExposure.count({ where: { recall: { id: { equals: record2.id } } } }),
      context.sudo().query.RecallExposure.count({ where: { recall: { id: { equals: record2.id } }, status: { in: ["outreach_required", "contacted"] } } })
    ]);
    const candidateMovementIds = candidateMovements.map((movement) => movement.id);
    const linkedRows = candidateMovementIds.length ? await context.sudo().query.RecallExposure.findMany({ where: { recall: { id: { equals: record2.id } }, movement: { id: { in: candidateMovementIds } } }, take: 1e4, query: "id movement { id }" }) : [];
    const linkedMovementIds = linkedRows.map((entry) => entry.movement?.id).filter(Boolean);
    const { unlinkedExposureCount } = assessRecallExposureReconciliation({ candidateMovementCount, linkedMovementIds, exposureCount, linkedExposureCount: linkedRows.length });
    return {
      id: record2.id,
      recallNumber: record2.recallNumber,
      classification: record2.classification,
      status: record2.status,
      reason: record2.reason,
      source: record2.source,
      initiatedAt: record2.initiatedAt,
      locationName: record2.location?.name || null,
      affectedLotCount: record2.lots?.length || 0,
      quarantinedLotCount: (record2.lots || []).filter((lot) => ["quarantined", "recalled"].includes(lot.status) || lot.quantityQuarantined >= lot.quantityAvailable).length,
      unresolvedExposureCount: unresolvedExposureCount + unlinkedExposureCount,
      approvalRecorded: Boolean(record2.approval?.id),
      approvedAt: record2.approval?.approvedAt || null,
      approvedBy: record2.approval?.actor?.name || null
    };
  }));
  return { items, totalCount, hasMore, nextCursor: hasMore && pageRecords.length ? encodeStableCursor({ createdAt: pageRecords[pageRecords.length - 1].initiatedAt, id: pageRecords[pageRecords.length - 1].id }) : null };
}
async function pharmacyRecallTask(_root, args, context) {
  requireAny(context, ["canManageRecalls"]);
  requirePatientPrivateData(context);
  const scope = await tenantScope(context);
  const recall = (await context.sudo().query.Recall.findMany({
    take: 1,
    where: {
      id: { equals: args.recallId },
      organization: { id: { in: scope.organizationIds } },
      OR: [
        { location: { id: { in: scope.locationIds } } },
        { AND: [{ location: null }, { organization: { id: { in: scope.organizationWideIds } } }] }
      ]
    },
    query: "id recallNumber classification status reason source initiatedAt closedAt organization { id } location { id name } lots { id lotNumber status quantityAvailable quantityQuarantined product { title sku } location { name } } exposures(orderBy: { createdAt: asc }, take: 10000) { id status quantityDispensed contactMethod outcome notes lastActionAt resolvedAt patient { id displayName } prescription { id prescriptionNumber } order { id orderNumber } } approval { id approvedAt actor { name } }"
  }))[0];
  if (!recall) throw new DomainError("Recall not found");
  const candidateWhere = recallExposureMovementWhere((recall.lots || []).map((lot) => lot.id));
  const [candidateMovementCount, candidateMovements, exposureCount] = await Promise.all([
    context.sudo().query.InventoryMovement.count({ where: candidateWhere }),
    context.sudo().query.InventoryMovement.findMany({ where: candidateWhere, orderBy: { occurredAt: "asc" }, take: 1e4, query: "id" }),
    context.sudo().query.RecallExposure.count({ where: { recall: { id: { equals: recall.id } } } })
  ]);
  const candidateMovementIds = candidateMovements.map((movement) => movement.id);
  const linkedRows = candidateMovementIds.length ? await context.sudo().query.RecallExposure.findMany({ where: { recall: { id: { equals: recall.id } }, movement: { id: { in: candidateMovementIds } } }, take: 1e4, query: "id movement { id }" }) : [];
  const linkedMovementIds = linkedRows.map((entry) => entry.movement?.id).filter(Boolean);
  const { linkedMovementCount, unlinkedExposureCount, exposureReconciliationComplete } = assessRecallExposureReconciliation({ candidateMovementCount, linkedMovementIds, exposureCount, linkedExposureCount: linkedRows.length });
  return {
    id: recall.id,
    recallNumber: recall.recallNumber,
    classification: recall.classification,
    status: recall.status,
    reason: recall.reason,
    source: recall.source,
    initiatedAt: recall.initiatedAt,
    closedAt: recall.closedAt,
    locationId: recall.location?.id || null,
    locationName: recall.location?.name || null,
    approvalRecorded: Boolean(recall.approval?.id),
    approvedAt: recall.approval?.approvedAt || null,
    canQuarantine: recall.status === "active" && (recall.lots || []).length > 0,
    canClose: exposureReconciliationComplete && unlinkedExposureCount === 0 && ["quarantined", "resolved"].includes(recall.status) && (recall.lots || []).every((lot) => lot.quantityQuarantined === 0) && (recall.exposures || []).every((exposure) => ["returned", "resolved", "unable_to_reach"].includes(exposure.status)),
    unlinkedExposureCount,
    exposureReconciliationComplete,
    approvedBy: recall.approval?.actor?.name || null,
    exposures: (recall.exposures || []).map((entry) => ({ id: entry.id, status: entry.status, quantityDispensed: entry.quantityDispensed, contactMethod: entry.contactMethod, outcome: entry.outcome, notes: entry.notes, lastActionAt: entry.lastActionAt, resolvedAt: entry.resolvedAt, patientId: entry.patient?.id, patientDisplayName: entry.patient?.displayName || "Private patient", prescriptionId: entry.prescription?.id, prescriptionNumber: entry.prescription?.prescriptionNumber, orderId: entry.order?.id, orderNumber: entry.order?.orderNumber })),
    lots: (recall.lots || []).map((lot) => ({
      id: lot.id,
      lotNumber: lot.lotNumber,
      status: lot.status,
      quantityAvailable: lot.quantityAvailable,
      quantityQuarantined: lot.quantityQuarantined,
      productTitle: lot.product?.title || "Unlinked product",
      productSku: lot.product?.sku || "",
      locationName: lot.location?.name || "Unassigned"
    }))
  };
}
var orderStatuses = /* @__PURE__ */ new Set(["pending", "review_required", "approved", "processing", "ready", "out_for_delivery", "completed", "cancelled"]);
var orderFulfillmentMethods = /* @__PURE__ */ new Set(["pickup", "delivery", "pos"]);
function pharmacyOrderQueueFilter(scope, filters) {
  const organizationIds = [...new Set(scope.organizationIds)].sort();
  const locationIds = [...new Set(scope.locationIds)].sort();
  const status = filters.status ?? null;
  const fulfillmentMethod = filters.fulfillmentMethod ?? null;
  if (status !== null && (typeof status !== "string" || !orderStatuses.has(status))) {
    throw new DomainError("Order status filter is invalid");
  }
  if (fulfillmentMethod !== null && (typeof fulfillmentMethod !== "string" || !orderFulfillmentMethods.has(fulfillmentMethod))) {
    throw new DomainError("Order fulfillment filter is invalid");
  }
  const where = {
    organization: { id: { in: organizationIds } },
    location: { id: { in: locationIds } }
  };
  if (status) where.status = { equals: status };
  if (fulfillmentMethod) where.fulfillmentMethod = { equals: fulfillmentMethod };
  const cursorScope = (0, import_node_crypto16.createHash)("sha256").update(JSON.stringify({
    worklist: "orders",
    organizationIds,
    locationIds,
    status,
    fulfillmentMethod
  })).digest("base64url");
  return { where, cursorScope };
}
async function pharmacyOrderQueue(_root, args, context) {
  requireAny(context, ["canManageOrders"]);
  const pageSize = boundedPageSize(args.first);
  const scope = await tenantScope(context);
  const { where: baseWhere, cursorScope } = pharmacyOrderQueueFilter(scope, args);
  const cursor = decodeStableCursor(args.after, cursorScope);
  const [totalCount, records] = await Promise.all([
    context.sudo().query.Order.count({ where: baseWhere }),
    context.sudo().query.Order.findMany({
      where: stableCursorWhere(baseWhere, cursor),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: pageSize + 1,
      query: 'id orderNumber status fulfillmentMethod totalAmount currencyCode createdAt location { name } lineItemsCount lineItems(where: { prescriptionRequirementSnapshot: { not: { equals: "none" } } }, take: 1) { id } fulfillment { id status } payments(take: 1) { status }'
    })
  ]);
  const hasMore = records.length > pageSize;
  const pageRecords = records.slice(0, pageSize);
  const items = pageRecords.map((record2) => ({
    id: record2.id,
    orderNumber: record2.orderNumber,
    status: record2.status,
    fulfillmentMethod: record2.fulfillmentMethod,
    totalAmount: record2.totalAmount,
    currencyCode: record2.currencyCode,
    createdAt: record2.createdAt,
    locationName: record2.location?.name || "Unassigned",
    lineItemCount: record2.lineItemsCount || 0,
    hasPrescriptionLines: (record2.lineItems || []).length > 0,
    fulfillmentId: record2.fulfillment?.id || null,
    fulfillmentStatus: record2.fulfillment?.status || "pending",
    paymentStatus: record2.payments?.[0]?.status || "unpaid"
  }));
  return {
    items,
    totalCount,
    hasMore,
    nextCursor: hasMore && pageRecords.length ? encodeStableCursor({ createdAt: pageRecords[pageRecords.length - 1].createdAt, id: pageRecords[pageRecords.length - 1].id }, cursorScope) : null
  };
}
async function pharmacyOrderTask(_root, args, context) {
  requireAny(context, ["canManageOrders"]);
  const scope = await tenantScope(context);
  const order = await context.sudo().query.Order.findOne({
    where: { id: args.orderId },
    query: `
      id orderNumber status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount currencyCode createdAt pickupAt deliveryWindow
      customerName email phone
      organization { id } location { id name }
      lineItems { id title sku ndc11Snapshot quantity unitPriceAmount lineTotalAmount imageUrl prescriptionRequirementSnapshot }
      fulfillment { id method status readyAt handedOffAt assignedTo { name } }
      payments { id status amount currencyCode tenderMethod cashReceivedAmount changeDueAmount processedAt provider { name code createPaymentFunction } }
    `
  });
  if (!order || !scope.organizationIds.includes(order.organization?.id) || !scope.locationIds.includes(order.location?.id)) throw new DomainError("Order not found");
  const contact = permissions.canViewPatientPrivateData({ session: context.session });
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    customerName: contact ? order.customerName || null : null,
    customerEmail: contact ? order.email || null : null,
    customerPhone: contact ? order.phone || null : null,
    subtotalAmount: order.subtotalAmount,
    taxAmount: order.taxAmount,
    deliveryAmount: order.deliveryAmount,
    totalAmount: order.totalAmount,
    currencyCode: order.currencyCode,
    createdAt: order.createdAt,
    pickupAt: order.pickupAt,
    deliveryWindow: order.deliveryWindow,
    locationId: order.location.id,
    locationName: order.location.name,
    availableFulfillmentStatuses: availableFulfillmentTransitions(order.fulfillment?.status, order.payments || []),
    lines: await Promise.all((order.lineItems || []).map(async (line) => ({
      id: line.id,
      title: line.title,
      sku: line.sku,
      ndc11: line.ndc11Snapshot,
      imageUrl: await resolveLinePhoto(line.imageUrl, context),
      quantity: line.quantity,
      unitPriceAmount: line.unitPriceAmount,
      lineTotalAmount: line.lineTotalAmount,
      prescriptionRequirement: line.prescriptionRequirementSnapshot
    }))),
    fulfillment: order.fulfillment ? {
      id: order.fulfillment.id,
      method: order.fulfillment.method,
      status: order.fulfillment.status,
      readyAt: order.fulfillment.readyAt,
      handedOffAt: order.fulfillment.handedOffAt,
      assignedToName: order.fulfillment.assignedTo?.name || null
    } : null,
    payment: order.payments?.[0] ? {
      id: order.payments[0].id,
      status: order.payments[0].status,
      amount: order.payments[0].amount,
      currencyCode: order.payments[0].currencyCode,
      processedAt: order.payments[0].processedAt,
      tenderMethod: order.payments[0].tenderMethod || "provider",
      cashReceivedAmount: order.payments[0].cashReceivedAmount,
      changeDueAmount: order.payments[0].changeDueAmount,
      providerName: order.payments[0].tenderMethod === "cash" ? "Operator-attested cash" : order.payments[0].provider?.name || "Unknown provider",
      providerCode: order.payments[0].provider?.code || ""
    } : null
  };
}
function patientSafeProjection(record2) {
  const activeConsents = (record2.consents || []).filter((consent) => consent.accepted && !consent.revokedAt);
  return {
    id: record2.id,
    patientNumber: record2.patientNumber,
    displayName: record2.displayName,
    status: record2.status,
    preferredContactMethod: record2.preferredContactMethod,
    identityVerificationStatus: record2.identityVerificationStatus,
    hasIdentityEvidence: Boolean(record2.identityReference && record2.identityVerifiedAt),
    organizationNames: (record2.organizations || []).map((organization) => organization.name),
    prescriptionCount: record2.prescriptionsCount || 0,
    activeConsentCount: activeConsents.length,
    latestConsentAt: activeConsents[0]?.grantedAt || null,
    allergies: (record2.allergies || []).map((entry) => ({ id: entry.id, allergen: entry.allergen, reaction: entry.reaction, severity: entry.severity, status: entry.status, source: entry.source, recordedAt: entry.recordedAt })),
    medications: (record2.medications || []).map((entry) => ({ id: entry.id, medicationName: entry.medicationName, directions: entry.directions, status: entry.status, source: entry.source, recordedAt: entry.recordedAt }))
  };
}
async function pharmacyPatientAccountCandidates(_root, args, context) {
  requireAny(context, ["canManagePatients"]);
  requirePatientPrivateData(context);
  const scope = await tenantScope(context);
  const patient = await context.sudo().query.PatientProfile.findOne({ where: { id: args.patientId }, query: "id email user { id email name } organizations { id }" });
  if (!patient || !patient.organizations?.some((organization) => scope.organizationIds.includes(organization.id))) throw new DomainError("Patient not found");
  const patientOrganizationIds = patient.organizations.map((organization) => organization.id).filter((id) => scope.organizationIds.includes(id));
  const users = await context.sudo().query.User.findMany({
    where: {
      OR: [
        ...patient.user?.id ? [{ id: { equals: patient.user.id } }] : [],
        await patientAccountWhere(context, patientOrganizationIds, patient.email)
      ]
    },
    orderBy: { name: "asc" },
    take: 200,
    query: "id name email patientProfile { id }"
  });
  const available = users.filter((user) => !user.patientProfile || user.id === patient.user?.id);
  return available.map((user) => ({ id: user.id, label: user.name, scopeId: user.id, detail: user.email }));
}
async function pharmacyPatientPortal(_root, _args, context) {
  if (!context.session?.itemId) throw new DomainError("Authentication required");
  const patient = (await context.sudo().query.PatientProfile.findMany({
    where: { user: { id: { equals: context.session.itemId } } },
    take: 1,
    query: `
      id patientNumber displayName preferredContactMethod
      prescriptions(orderBy: { createdAt: desc }) {
        id prescriptionNumber status organization { id } location { id name } prescriber { id name }
        items { id fillLineage product { id } drugReference { id } medicationNameSnapshot sig quantityPrescribed quantityDispensed daysSupply refillsAuthorized refillsRemaining refillsReserved substitutionAllowed }
        refillRequests(orderBy: { requestedAt: desc }, take: 1) { status }
      }
      orders(orderBy: { createdAt: desc }, take: 50) {
        id orderNumber status totalAmount currencyCode createdAt fulfillment { status }
      }
    `
  }))[0];
  if (!patient) throw new DomainError("No patient profile is linked to this account");
  return {
    id: patient.id,
    patientNumber: patient.patientNumber,
    displayName: patient.displayName,
    preferredContactMethod: patient.preferredContactMethod,
    prescriptions: (patient.prescriptions || []).map((prescription) => {
      const refillableItem = prescription.items?.find((item) => item.refillsRemaining > item.refillsReserved) || prescription.items?.[0];
      return {
        id: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber,
        status: prescription.status,
        locationId: prescription.location?.id || "",
        locationName: prescription.location?.name || "Pharmacy",
        prescriberName: prescription.prescriber?.name || "Prescriber pending",
        prescriptionItemId: refillableItem?.id || "",
        medicationName: refillableItem?.medicationNameSnapshot || "Prescription",
        refillsRemaining: Math.max(0, (refillableItem?.refillsRemaining || 0) - (refillableItem?.refillsReserved || 0)),
        fillLineage: refillableItem?.fillLineage || null,
        refillEligible: refillableItem?.fillLineage === "per_fill_v1" && refillableItem?.quantityDispensed > 0 && ["dispensed", "fill_closed"].includes(prescription.status),
        itemVersion: refillableItem ? prescriptionItemVersion({ ...prescription, patient: { id: patient.id } }, refillableItem) : null,
        lastRefillStatus: prescription.refillRequests?.[0]?.status || null
      };
    }),
    orders: (patient.orders || []).map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      fulfillmentStatus: order.fulfillment?.status || "pending",
      totalAmount: order.totalAmount,
      currencyCode: order.currencyCode,
      createdAt: order.createdAt
    }))
  };
}
async function pharmacyPatientDirectory(_root, _args, context) {
  requireAny(context, ["canManagePatients", "canManagePrescriptions"]);
  requirePatientPrivateData(context);
  const scope = await tenantScope(context);
  const records = await context.sudo().query.PatientProfile.findMany({
    where: { organizations: { some: { id: { in: scope.organizationIds } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
    query: "id patientNumber displayName status preferredContactMethod identityVerificationStatus identityReference identityVerifiedAt organizations { name } consents(orderBy: { grantedAt: desc }) { accepted grantedAt revokedAt } allergies(orderBy: { recordedAt: desc }, take: 100) { id allergen reaction severity status source recordedAt } medications(orderBy: { recordedAt: desc }, take: 100) { id medicationName directions status source recordedAt } prescriptionsCount"
  });
  return records.map(patientSafeProjection);
}
async function pharmacyPatientSafeView(_root, args, context) {
  requireAny(context, ["canManagePatients", "canManagePrescriptions"]);
  requirePatientPrivateData(context);
  const scope = await tenantScope(context);
  const patient = await context.sudo().query.PatientProfile.findOne({
    where: { id: args.patientId },
    query: "id patientNumber displayName status email phone address preferredContactMethod identityVerificationStatus identityReference identityVerifiedAt organizations { id name } consents(orderBy: { grantedAt: desc }) { accepted grantedAt revokedAt } allergies(orderBy: { recordedAt: desc }, take: 100) { id allergen reaction severity status source recordedAt } medications(orderBy: { recordedAt: desc }, take: 100) { id medicationName directions status source recordedAt } prescriptionsCount"
  });
  if (!patient || !patient.organizations?.some((organization) => scope.organizationIds.includes(organization.id))) throw new DomainError("Patient not found");
  return { ...patientSafeProjection(patient), email: patient.email || null, phone: patient.phone || null, address: patient.address || null };
}
async function pharmacyIntegrationStatus(_root, _args, context) {
  requireAny(context, ["canManageIntegrations"]);
  const scope = await tenantScope(context);
  const records = await context.sudo().query.IntegrationProvider.findMany({
    where: { organization: { id: { in: scope.organizationIds } } },
    orderBy: { providerType: "asc" },
    query: "id name code providerType status externalValidationComplete validationReference organization { name }"
  });
  return records.map((record2) => ({
    id: record2.id,
    name: record2.name,
    code: record2.code,
    providerType: record2.providerType,
    status: record2.status,
    externalValidationComplete: record2.externalValidationComplete,
    hasValidationReference: Boolean(record2.validationReference),
    organizationName: record2.organization?.name || "Unassigned"
  }));
}
async function pharmacyAuditTimeline(_root, args, context) {
  requireAny(context, ["canViewAuditLogs"]);
  const scope = await tenantScope(context);
  const records = await context.sudo().query.AuditEvent.findMany({
    where: tenantEventFilter(scope),
    orderBy: { occurredAt: "desc" },
    take: Math.max(1, Math.min(100, args.take || 50)),
    query: "id eventKey eventType resourceType resourceId occurredAt actorType actor { name } location { name }"
  });
  return records.map((record2) => ({
    id: record2.id,
    eventKey: record2.eventKey || null,
    eventType: record2.eventType,
    resourceType: record2.resourceType,
    resourceId: record2.resourceId,
    occurredAt: record2.occurredAt,
    actorType: record2.actorType,
    actorName: record2.actor?.name || null,
    locationName: record2.location?.name || null
  }));
}
async function pharmacyOperatorLocations(_root, _args, context) {
  requireAny(context, ["canManageOrders"]);
  const scope = await tenantScope(context);
  const records = await context.sudo().query.PharmacyLocation.findMany({
    where: { id: { in: scope.locationIds }, status: { equals: "active" } },
    orderBy: { name: "asc" },
    query: "id name code pickupEnabled deliveryEnabled organization { operatorDisplayName supportPhone cashSalesEnabled cashTaxRateBps cashTaxPolicyReference }"
  });
  return records.map((record2) => ({
    id: record2.id,
    name: record2.name,
    code: record2.code,
    pickupEnabled: record2.pickupEnabled,
    deliveryEnabled: record2.deliveryEnabled,
    operatorDisplayName: record2.organization?.operatorDisplayName || record2.name,
    operatorPhone: record2.organization?.supportPhone || null,
    cashSalesEnabled: record2.organization?.cashSalesEnabled === true && Boolean(record2.organization?.cashTaxPolicyReference),
    cashTaxRateBps: record2.organization?.cashTaxRateBps || 0
  }));
}
async function pharmacyPosCatalog(_root, args, context) {
  requireAny(context, ["canManageOrders"]);
  const scope = await tenantScope(context);
  if (!scope.locationIds.includes(args.locationId)) throw new DomainError("Location not found");
  const records = await context.sudo().query.Product.findMany({
    where: {
      location: { id: { equals: args.locationId } },
      status: { equals: "published" },
      posAvailable: { equals: true },
      prescriptionRequirement: { equals: "none" }
    },
    orderBy: { title: "asc" },
    take: 100,
    query: "id title handle sku description category priceAmount currencyCode taxable imageUrl: photoUrl prescriptionRequirement inventoryLots { status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }"
  });
  return records.map((record2) => {
    const availableQuantity = (record2.inventoryLots || []).filter((lot) => lot.location?.id === args.locationId).reduce((sum, lot) => sum + eligibleLotQuantity(lot), 0);
    return { ...record2, inventoryLots: void 0, availableQuantity, inStock: availableQuantity > 0 };
  }).filter((record2) => record2.inStock);
}

// features/keystone/mutations/handlePaymentProviderWebhook.ts
var NO_DIVISION_CURRENCIES2 = /* @__PURE__ */ new Set([
  "JPY",
  "KRW",
  "VND",
  "CLP",
  "PYG",
  "XAF",
  "XOF",
  "BIF",
  "DJF",
  "GNF",
  "KMF",
  "MGA",
  "RWF",
  "XPF",
  "HTG",
  "VUV",
  "XAG",
  "XDR",
  "XAU"
]);
function assertProviderAmount(providerCode, resource, payment) {
  const expectedCurrency = String(payment.currencyCode).toUpperCase();
  if (providerCode.includes("stripe")) {
    const amount = Number(resource.amount_received ?? resource.amount);
    if (amount !== payment.amount || String(resource.currency).toUpperCase() !== expectedCurrency) {
      throw new DomainError("Provider webhook amount or currency mismatch");
    }
    return;
  }
  if (providerCode.includes("paypal")) {
    const evidence = resource.amount;
    const divisor = NO_DIVISION_CURRENCIES2.has(expectedCurrency) ? 1 : 100;
    if (!evidence || Number(evidence.value) !== payment.amount / divisor || String(evidence.currency_code).toUpperCase() !== expectedCurrency) {
      throw new DomainError("Provider webhook amount or currency mismatch");
    }
  }
}
function normalizedHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers || {}).map(([key, value]) => [
      key === "__rawBody" ? key : key.toLowerCase(),
      Array.isArray(value) ? String(value[0] || "") : String(value || "")
    ])
  );
}
function webhookPaymentId(resource) {
  if (typeof resource?.payment_intent === "string") return resource.payment_intent;
  if (typeof resource?.supplementary_data?.related_ids?.order_id === "string") return resource.supplementary_data.related_ids.order_id;
  if (typeof resource?.id === "string") return resource.id;
  return null;
}
async function handlePaymentProviderWebhook(_root, { providerId, event, headers }, context) {
  const provider = await context.sudo().query.PaymentProvider.findOne({
    where: { id: providerId },
    query: "id code isInstalled handleWebhookFunction organization { id }"
  });
  if (!provider && providerId.includes(":")) return ingestPharmacyIntegrationWebhook(null, { providerKey: providerId, event, headers }, context);
  if (!provider?.isInstalled) throw new DomainError("Payment provider not found");
  const verified = await handleWebhook({ provider, event, headers: normalizedHeaders(headers) });
  const type = String(verified?.type || "");
  const resource = verified?.resource || {};
  const providerEventId = String(verified?.event?.id || event?.id || resource.id || "");
  if (!verified?.isValid || !type || !providerEventId) throw new DomainError("Webhook signature or event envelope is invalid");
  const eventKey = `${provider.id}:${providerEventId}`;
  return withDomainTransaction(context, [`payment-webhook:${eventKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.PaymentWebhookEvent.findOne({ where: { eventKey }, query: "id status" });
    if (existing) return { accepted: true, reused: true, eventId: providerEventId, status: existing.status };
    const webhookEvent = await sudo.query.PaymentWebhookEvent.createOne({
      data: {
        eventKey,
        externalEventId: providerEventId,
        eventType: type,
        resource,
        status: "received",
        organization: { connect: { id: provider.organization.id } },
        provider: { connect: { id: provider.id } }
      },
      query: "id"
    });
    const succeeded = /payment_intent\.succeeded|PAYMENT\.CAPTURE\.COMPLETED/.test(type);
    const failed = /payment_intent\.payment_failed|payment_intent\.canceled|PAYMENT\.CAPTURE\.DENIED|PAYMENT\.AUTHORIZATION\.VOIDED/.test(type);
    const refunded = /^refund\.|PAYMENT\.CAPTURE\.REFUNDED/.test(type);
    const paymentId = webhookPaymentId(resource);
    let handled = false;
    if (paymentId) {
      const sessions = await sudo.query.PaymentSession.findMany({
        where: { externalPaymentId: { equals: paymentId }, provider: { id: { equals: provider.id } } },
        query: "id status amount currencyCode payment { id }"
      });
      if (succeeded) {
        for (const session of sessions) {
          assertProviderAmount(provider.code, resource, { amount: session.amount, currencyCode: session.currencyCode });
          const next = session.payment ? "captured" : "settled_unordered";
          if (!canMovePaymentSession(session.status, next)) continue;
          await sudo.query.PaymentSession.updateOne({
            where: { id: session.id },
            data: {
              status: next,
              reconciliationStatus: session.payment ? "ordered" : "settled_unordered",
              lastReconciledAt: (/* @__PURE__ */ new Date()).toISOString(),
              failureReason: null
            }
          });
        }
        handled = sessions.length > 0;
      } else if (failed) {
        for (const session of sessions) {
          if (!canMovePaymentSession(session.status, "failed")) continue;
          await sudo.query.PaymentSession.updateOne({ where: { id: session.id }, data: { status: "failed", reconciliationStatus: "manual_review", lastReconciledAt: (/* @__PURE__ */ new Date()).toISOString() } });
        }
        handled = sessions.length > 0;
      } else if (refunded) {
        const payments = await sudo.query.Payment.findMany({ where: { externalPaymentId: { equals: paymentId }, provider: { id: { equals: provider.id } } }, query: "id status" });
        if (resource?.status === "succeeded" || resource?.status === "COMPLETED") {
          for (const payment of payments) if (canMovePayment(payment.status, "refunded")) await sudo.query.Payment.updateOne({ where: { id: payment.id }, data: { status: "refunded" } });
        }
        handled = payments.length > 0;
      }
    }
    await sudo.query.PaymentWebhookEvent.updateOne({
      where: { id: webhookEvent.id },
      data: { status: handled ? "processed" : "ignored", processedAt: (/* @__PURE__ */ new Date()).toISOString() }
    });
    return { accepted: true, reused: false, eventId: providerEventId, status: handled ? "processed" : "ignored" };
  });
}
var handlePaymentProviderWebhook_default = handlePaymentProviderWebhook;

// features/keystone/mutations/paymentRecovery.ts
async function reconcilePharmacyPaymentSession(_root, args, context) {
  if (!permissions.canManagePayments({ session: context.session })) throw new DomainError("Permission required: canManagePayments");
  const session = await context.sudo().query.PaymentSession.findOne({
    where: { id: args.paymentSessionId },
    query: `id status reconciliationStatus reconciliationAttempts externalPaymentId amount currencyCode data cart { id status organization { id } location { id } order { id } } provider { ${PAYMENT_PROVIDER_ADAPTER_FIELDS} }`
  });
  if (!session?.cart || !session.provider || !session.externalPaymentId) throw new DomainError("Payment session not found");
  const { userId } = await requireTenantMembership(context, { organizationId: session.cart.organization.id, locationId: session.cart.location.id });
  if (session.cart.order?.id && canMovePaymentSession(session.status, "captured")) {
    return withDomainTransaction(context, [`payment-session:${session.id}`], async (transactionContext) => {
      await transactionContext.sudo().query.PaymentSession.updateOne({ where: { id: session.id }, data: { status: "captured", reconciliationStatus: "ordered", lastReconciledAt: (/* @__PURE__ */ new Date()).toISOString(), failureReason: null } });
      return { success: true, status: "ordered", paymentSessionId: session.id };
    });
  }
  if (session.reconciliationStatus === "compensation_pending") {
    const compensation = await refundPayment({ provider: session.provider, paymentId: session.externalPaymentId, amount: session.amount, currency: session.currencyCode, idempotencyKey: `checkout-compensation:${session.id}` });
    if (!["refunded", "succeeded"].includes(compensation?.status)) throw new DomainError("Payment compensation is still pending");
    return withDomainTransaction(context, [`payment-session:${session.id}`], async (transactionContext) => {
      await transactionContext.sudo().query.PaymentSession.updateOne({ where: { id: session.id }, data: { status: "compensated", reconciliationStatus: "compensated", reconciliationAttempts: session.reconciliationAttempts + 1, lastReconciledAt: (/* @__PURE__ */ new Date()).toISOString(), failureReason: null, data: { ...session.data || {}, compensation } } });
      await recordAudit(transactionContext, {
        eventKey: `payment.compensated:${session.id}`,
        organizationId: session.cart.organization.id,
        locationId: session.cart.location.id,
        actorId: userId,
        eventType: "payment.compensated",
        resourceType: "PaymentSession",
        resourceId: session.id,
        metadata: { cartId: session.cart.id }
      });
      return { success: true, status: "compensated", paymentSessionId: session.id };
    });
  }
  if (["captured", "compensated"].includes(session.status)) return { success: true, status: session.status, paymentSessionId: session.id };
  const providerStatus = await getPaymentStatus({ provider: session.provider, paymentId: session.externalPaymentId });
  const settled = ["captured", "succeeded"].includes(providerStatus?.status);
  return withDomainTransaction(context, [`payment-session:${session.id}`], async (transactionContext) => {
    await transactionContext.sudo().query.PaymentSession.updateOne({
      where: { id: session.id },
      data: {
        status: settled ? "settled_unordered" : providerStatus?.status === "failed" ? "failed" : "pending",
        reconciliationStatus: settled ? "settled_unordered" : providerStatus?.status === "failed" ? "manual_review" : "pending",
        reconciliationAttempts: session.reconciliationAttempts + 1,
        lastReconciledAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    return { success: true, status: settled ? "settled_unordered" : providerStatus?.status || "pending", paymentSessionId: session.id };
  });
}

// features/keystone/mutations/prescriptionWorkflows.ts
var import_node_crypto17 = require("node:crypto");
var CLINICAL_QUERY = "sourceVerificationStatus writtenAt expiresAt prescriber { npi verificationStatus externalValidationComplete verificationMethod credentialType credentialJurisdiction credentialIdentifier credentialExpiresAt validationReference verifiedBy { id } }";
var SAFETY_QUERY = `
  patient { id displayName identityVerificationStatus identityReference identityVerifiedAt identityVerifiedBy { id } allergies(where: { status: { in: ["active", "none_known"] } }) { id updatedAt } medications(where: { status: { in: ["current", "none_known"] } }) { id updatedAt } }
  safetyReviews(orderBy: { reviewedAt: desc }, take: 1) {
    id fillNumber outcome allergiesReviewed medicationHistoryReviewed interactionsReviewed duplicateTherapyReviewed contraindicationsReviewed doseReviewed counselingPlanReviewed reviewReference overrideReason reviewedAt evidenceSnapshot
  }
`;
async function assertPrescriptionSafetyEvidence(context, prescription, fillSpecific = false) {
  if (prescription.patient?.identityVerificationStatus !== "confirmed" || !prescription.patient?.identityReference?.trim() || !prescription.patient?.identityVerifiedAt || !prescription.patient?.identityVerifiedBy?.id) {
    throw new DomainError("Current operator-recorded patient identity evidence is required");
  }
  if (!prescription.patient.allergies?.length || !prescription.patient.medications?.length) throw new DomainError("Explicit allergy and medication history evidence is required for this fill");
  const fillNumbers = prescription.items.map((item) => currentFillNumber(item));
  const fillNumber = Math.max(...fillNumbers);
  if (!fillNumbers.length || fillNumbers.some((value) => value !== fillNumber)) throw new DomainError("Prescription items are not aligned to one fill review");
  const latestPatientChange = [...prescription.patient?.allergies || [], ...prescription.patient?.medications || [], { updatedAt: prescription.patient.identityVerifiedAt }].map((entry) => entry.updatedAt).filter(Boolean).sort().at(-1);
  const review = prescription.safetyReviews?.[0];
  if (fillSpecific && prescription.items.some((item) => item.fillLineage === FILL_LINEAGE)) {
    const fills = await fillStore(context).PrescriptionFill.findMany({ where: { prescription: { id: { equals: prescription.id } }, openKey: { not: { equals: null } } }, take: 2, query: FILL_QUERY });
    const fill = fills[0], evidence = review?.evidenceSnapshot;
    if (fills.length !== 1 || !fill || evidence?.fillId !== fill.id || evidence.itemVersion !== fill.itemVersion || evidence.authorityVersion !== fill.authorityVersion || new Date(review.reviewedAt).getTime() < new Date(fill.createdAt).getTime()) throw new DomainError("A versioned human safety review for this exact fill reservation is required");
  }
  assertCurrentHumanSafetyReview(review, fillNumber, latestPatientChange);
  const drugReferenceIds = [...new Set(prescription.items.map((item) => item.drugReference?.id).filter(Boolean))];
  const drugReviews = await context.sudo().query.DrugReferenceReview.findMany({
    where: { organization: { id: { equals: prescription.organization.id } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: "active" } },
    take: 100,
    query: "id status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference reviewedAt"
  });
  if (!drugReferenceIds.length || drugReviews.length !== drugReferenceIds.length) throw new DomainError("Current drug reference review evidence is required");
  for (const drugReview of drugReviews) {
    assertDrugReferenceEligibleForBoundedDispensing({ sourceVerified: drugReview.status === "active", marketingStatus: drugReview.marketingStatusSnapshot, controlledSchedule: drugReview.controlledScheduleSnapshot, sourceName: drugReview.sourceName, sourceVersion: drugReview.sourceVersion, sourceReference: drugReview.sourceReference, reviewedAt: drugReview.reviewedAt });
    if (new Date(drugReview.reviewedAt).getTime() > new Date(review.reviewedAt).getTime()) throw new DomainError("Drug reference evidence changed after the clinical safety review");
  }
  return review;
}
async function recordPrescriptionReview(_root, args, context) {
  requirePermission(context, "canReviewPrescriptions");
  if (!["approved", "needs_information", "rejected"].includes(args.decision)) throw new DomainError("Invalid review decision");
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: `id status ${CLINICAL_QUERY} ${SAFETY_QUERY} organization { id } location { id } items { id fillLineage activeFillNumber refillsAuthorized refillsRemaining drugReference { id } } reviews(orderBy: { reviewedAt: desc }, take: 1) { id decision reason approval { id reason } }`
    });
    if (!prescription) throw new DomainError("Prescription not found");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      pharmacist: true
    });
    const prior = prescription.reviews?.[0];
    if (prescription.status === args.decision && prior?.decision === args.decision && (prior.reason !== args.reason || prior.approval?.reason !== args.reason)) throw new DomainError("Prescription review replay does not match the recorded reason");
    if (prescription.status === args.decision && prior?.decision === args.decision) {
      return { success: true, reused: true, prescriptionId: prescription.id, reviewId: prior.id, approvalId: prior.approval?.id, status: args.decision };
    }
    if (args.decision === "approved") {
      assertPrescriptionClinicallyEligible(prescription);
      await assertPrescriptionSafetyEvidence(transactionContext, prescription);
    }
    assertPrescriptionTransition(prescription.status, args.decision);
    const approval = await createHumanApproval(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      actionType: "prescription_review",
      reason: args.reason,
      attested: args.attested,
      evidence: { decision: args.decision, priorStatus: prescription.status }
    });
    const review = await sudo.query.PrescriptionReview.createOne({
      data: {
        decision: args.decision,
        reason: args.reason,
        humanAttested: true,
        prescription: { connect: { id: prescription.id } },
        patient: { connect: { id: prescription.patient.id } },
        pharmacist: { connect: { id: userId } },
        approval: { connect: { id: approval.id } }
      },
      query: "id decision reviewedAt"
    });
    await sudo.query.Prescription.updateOne({
      where: { id: prescription.id },
      data: {
        status: args.decision,
        approval: { connect: { id: approval.id } },
        ...args.decision === "approved" ? { approvedAt: (/* @__PURE__ */ new Date()).toISOString() } : {}
      }
    });
    await recordAudit(transactionContext, {
      eventKey: `prescription.reviewed:${prescription.id}:${review.id}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      patientId: prescription.patient.id,
      eventType: "prescription.reviewed",
      resourceType: "Prescription",
      resourceId: prescription.id,
      metadata: { decision: args.decision, reviewId: review.id, approvalId: approval.id }
    });
    return { success: true, reused: false, prescriptionId: prescription.id, reviewId: review.id, approvalId: approval.id, status: args.decision };
  });
}
async function authorizePrescriptionDispensing(_root, args, context) {
  requirePermission(context, "canDispenseMedications");
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: `id status ${CLINICAL_QUERY} ${SAFETY_QUERY} organization { id } location { id } items { id fillLineage activeFillNumber refillsAuthorized refillsRemaining drugReference { id } } approval { id reason actionType } reviews(orderBy: { reviewedAt: desc }, take: 1) { id decision }`
    });
    if (!prescription) throw new DomainError("Prescription not found");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      pharmacist: true
    });
    if (prescription.items.some((item) => item.fillLineage === FILL_LINEAGE)) {
      await currentFillPermission(transactionContext, "canDispenseMedications");
      const current = await loadFillPrescription(transactionContext, prescription.id);
      const fills = await fillStore(transactionContext).PrescriptionFill.findMany({ where: { prescription: { id: { equals: prescription.id } }, openKey: { not: { equals: null } } }, take: 2, query: FILL_QUERY });
      if (fills.length !== 1 || current.items.length !== 1) throw new DomainError("Exactly one current item/fill is required");
      const fill = fills[0];
      const item = current.items.find((entry) => entry.id === fill?.prescriptionItem?.id);
      if (!fill || !item || !["approved", "partially_dispensed"].includes(fill.status) || new Date(fill.expiresAt).getTime() <= Date.now()) throw new DomainError("An approved current fill reservation is required");
      assertFillBinding(fill, current, item);
      await assertItemFillLedger(transactionContext, current, item);
      await assertPrescriptionSafetyEvidence(transactionContext, prescription, true);
    }
    if (prescription.status === "ready_to_dispense" && prescription.approval?.id && (prescription.approval.actionType !== "dispense" || prescription.approval.reason !== args.reason)) throw new DomainError("Dispensing authorization replay does not match the recorded reason");
    if (prescription.status === "ready_to_dispense" && prescription.approval?.id) {
      return { success: true, reused: true, prescriptionId: prescription.id, status: prescription.status, approvalId: prescription.approval.id };
    }
    assertPrescriptionClinicallyEligible(prescription);
    const safetyReview = await assertPrescriptionSafetyEvidence(transactionContext, prescription, true);
    if (!prescription.reviews?.some((review) => review.decision === "approved")) throw new DomainError("Approved pharmacist review required");
    assertPrescriptionTransition(prescription.status, "ready_to_dispense");
    const approval = await createHumanApproval(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      actionType: "dispense",
      reason: args.reason,
      attested: args.attested,
      evidence: { stage: "ready_to_dispense", reviewId: prescription.reviews[0].id, clinicalSafetyReviewId: safetyReview.id }
    });
    await sudo.query.Prescription.updateOne({
      where: { id: prescription.id },
      data: { status: "ready_to_dispense", approval: { connect: { id: approval.id } } }
    });
    await recordAudit(transactionContext, {
      eventKey: `prescription.dispensing_authorized:${prescription.id}:${approval.id}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      patientId: prescription.patient.id,
      eventType: "prescription.dispensing_authorized",
      resourceType: "Prescription",
      resourceId: prescription.id,
      metadata: { approvalId: approval.id, reviewId: prescription.reviews[0].id, clinicalSafetyReviewId: safetyReview.id }
    });
    return { success: true, reused: false, prescriptionId: prescription.id, status: "ready_to_dispense", approvalId: approval.id };
  });
}
async function createCashPickupSale(tx, s) {
  const sudo = tx.sudo();
  const { subtotalAmount, taxableSubtotalAmount, taxAmount, totalAmount, currencyCode } = s;
  const cashApproval = await createHumanApproval(tx, {
    organizationId: s.prescription.organization.id,
    locationId: s.prescription.location.id,
    actorId: s.userId,
    actionType: s.card ? "card_tender" : "cash_tender",
    reason: s.reason,
    attested: s.attested,
    evidence: { subtotalAmount, taxableSubtotalAmount, taxAmount, amountDue: totalAmount, ...s.card ? { paymentIntentId: s.card.paymentIntentId } : { cashReceivedAmount: s.tender.cashReceivedAmount, changeDueAmount: s.tender.changeDueAmount }, taxRateBps: s.prescription.organization.cashTaxRateBps || 0, taxPolicyReference: s.prescription.organization.cashTaxPolicyReference, providerSettlementClaimed: !!s.card }
  });
  const order = await sudo.query.Order.createOne({
    data: {
      orderNumber: `RX-${s.operationSuffix}`,
      idempotencyKey: `rx-cash:${s.idempotencyKey}`,
      checkoutEvidence: { workflow: s.card ? "prescription_pickup_card" : "operator_attested_cash_prescription_pickup", pharmacistReviewId: s.pharmacistReviewId ?? null, clinicalSafetyReviewId: s.clinicalSafetyReviewId, dispenseApprovalId: s.dispenseApprovalId, cashApprovalId: cashApproval.id, taxRateBps: s.prescription.organization.cashTaxRateBps || 0, taxableSubtotalAmount, taxAmount, providerSettlementClaimed: !!s.card },
      status: "completed",
      fulfillmentMethod: "pickup",
      subtotalAmount,
      taxAmount,
      deliveryAmount: 0,
      totalAmount,
      currencyCode,
      organization: { connect: { id: s.prescription.organization.id } },
      location: { connect: { id: s.prescription.location.id } },
      patient: { connect: { id: s.prescription.patient.id } },
      prescription: { connect: { id: s.prescription.id } },
      approval: { connect: { id: cashApproval.id } }
    },
    query: "id orderNumber"
  });
  await sudo.query.OrderLineItem.createOne({
    data: {
      title: s.fill ? s.fill.priceSnapshot.title : s.item.product.title,
      sku: s.fill ? s.fill.priceSnapshot.sku : s.item.product.sku,
      ndc11Snapshot: s.item.product.drugReference?.ndc11 || void 0,
      quantity: 1,
      unitPriceAmount: subtotalAmount,
      lineTotalAmount: subtotalAmount,
      imageUrl: productPhotoSnapshot(s.item.product),
      prescriptionRequirementSnapshot: s.item.product.prescriptionRequirement,
      metadata: { dispensedUnits: s.quantity, prescriptionItemId: s.item.id, fillId: s.fill?.id || null, fillNumber: s.fillNumber, taxable: s.item.product.taxable !== false, taxableAmount: taxableSubtotalAmount },
      lotAllocationSnapshot: [{ lotId: s.lot.id, lotNumber: s.lot.lotNumber, quantity: s.quantity, expirationDate: s.lot.expirationDate }],
      order: { connect: { id: order.id } },
      product: { connect: { id: s.item.product.id } }
    }
  });
  const payment = await sudo.query.Payment.createOne({
    data: {
      amount: totalAmount,
      currencyCode,
      status: "captured",
      ...s.card ? { tenderMethod: "provider", externalPaymentId: s.card.paymentIntentId, provider: { connect: { id: s.card.providerId } }, data: { evidenceType: "stripe_payment_intent_succeeded", approvalId: cashApproval.id, providerSettlementClaimed: true, brand: s.card.brand, last4: s.card.last4 } } : { tenderMethod: "cash", cashReceivedAmount: s.tender.cashReceivedAmount, changeDueAmount: s.tender.changeDueAmount, data: { evidenceType: "operator_attested_cash_received", approvalId: cashApproval.id, providerSettlementClaimed: false } },
      processedAt: s.at,
      organization: { connect: { id: s.prescription.organization.id } },
      location: { connect: { id: s.prescription.location.id } },
      order: { connect: { id: order.id } },
      recordedBy: { connect: { id: s.userId } },
      approval: { connect: { id: cashApproval.id } }
    },
    query: "id status"
  });
  await sudo.query.Fulfillment.createOne({
    data: {
      method: "pickup",
      status: "handed_off",
      readyAt: s.readyAt || s.at,
      handedOffAt: s.at,
      organization: { connect: { id: s.prescription.organization.id } },
      location: { connect: { id: s.prescription.location.id } },
      order: { connect: { id: order.id } },
      assignedTo: { connect: { id: s.userId } }
    }
  });
  return { order, payment, cashApproval };
}
async function recordPrescriptionDispensing(_root, args, context) {
  requirePermission(context, "canDispenseMedications");
  const hold = args.hold === true;
  if (!Number.isInteger(args.quantity) || args.quantity < 1) throw new DomainError("Dispensed quantity must be a positive integer");
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  if (!["offered_accepted", "offered_declined"].includes(args.counselingOutcome)) throw new DomainError("Counseling offer outcome must be recorded");
  const auxiliaryWarnings = [...new Set((args.auxiliaryWarnings || []).map((value) => value.trim()).filter(Boolean))];
  if (!auxiliaryWarnings.length || auxiliaryWarnings.length > 20 || auxiliaryWarnings.some((value) => value.length > 200)) throw new DomainError("Auxiliary warning evidence is invalid");
  const result = await recordDispensingInTransaction(args, auxiliaryWarnings, hold, context);
  if (hold && args.fillId && result?.status === "ready_for_pickup") await notifyPrescriptionReady(context, { prescriptionId: args.prescriptionId, fillId: args.fillId });
  return result;
}
async function recordDispensingInTransaction(args, auxiliaryWarnings, hold, context) {
  return withDomainTransaction(context, [
    `dispense:${args.idempotencyKey}`,
    `lot:${args.lotId}`,
    `prescription:${args.prescriptionId}`,
    `prescription-item:${args.prescriptionItemId}`
  ], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existingMovement = await sudo.query.InventoryMovement.findOne({
      where: { idempotencyKey: `dispense:${args.idempotencyKey}` },
      query: "id requestFingerprint approval { id } order { id orderNumber totalAmount currencyCode payments { id status amount cashReceivedAmount changeDueAmount } lineItems { title } dispensingLabels { id } }"
    });
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: `
        id status ${CLINICAL_QUERY} ${SAFETY_QUERY}
        organization { id operatorDisplayName supportPhone cashSalesEnabled cashTaxRateBps cashTaxPolicyReference cashPolicyReviewedAt }
        location { id name address phone }
        prescriber { name npi verificationStatus externalValidationComplete verificationMethod credentialType credentialJurisdiction credentialIdentifier credentialExpiresAt validationReference }
        approval { id }
        items { id fillLineage activeFillNumber refillsReserved medicationNameSnapshot sig quantityPrescribed quantityDispensed refillsAuthorized refillsRemaining product { id title sku priceAmount currencyCode taxable imageUrl image { id extension } prescriptionRequirement drugReference { id ndc11 } } drugReference { id ndc11 } }
        reviews(where: { decision: { equals: "approved" } }, orderBy: { reviewedAt: desc }, take: 1) { id }
      `
    });
    if (!prescription) throw new DomainError("Prescription not found");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      pharmacist: true
    });
    const item = prescription.items.find((entry) => entry.id === args.prescriptionItemId);
    if (!item) throw new DomainError("Prescription item does not belong to this prescription");
    let fill = null;
    if (item.fillLineage === FILL_LINEAGE) {
      await currentFillPermission(transactionContext, "canDispenseMedications");
      const current = await loadFillPrescription(transactionContext, prescription.id);
      fill = args.fillId ? await fillStore(transactionContext).PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY }) : null;
      if (!fill || !Number.isSafeInteger(args.expectedFillVersion)) throw new DomainError("Fill identity and expected version are required");
      const currentItem = current.items.find((entry) => entry.id === item.id);
      assertFillBinding(fill, current, currentItem);
      await assertItemFillLedger(transactionContext, current, currentItem);
    }
    const requestFingerprint = (0, import_node_crypto17.createHash)("sha256").update(JSON.stringify({
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      prescriptionId: prescription.id,
      prescriptionItemId: item.id,
      lotId: args.lotId,
      quantity: args.quantity,
      cashReceivedAmount: args.cashReceivedAmount,
      auxiliaryWarnings,
      counselingOutcome: args.counselingOutcome,
      reason: args.reason.trim(),
      attested: args.attested,
      ...fill ? { fillId: fill.id, expectedFillVersion: args.expectedFillVersion, itemVersion: fill.itemVersion } : {},
      ...hold ? { hold } : {}
    })).digest("hex");
    if (existingMovement) {
      if (!existingMovement.requestFingerprint || existingMovement.requestFingerprint !== requestFingerprint) {
        throw new DomainError("Dispensing idempotency key is already bound to another operation");
      }
      return { success: true, reused: true, prescriptionId: prescription.id, status: prescription.status, approvalId: existingMovement.approval?.id, orderId: existingMovement.order?.id, orderNumber: existingMovement.order?.orderNumber, receiptItemTitle: existingMovement.order?.lineItems?.[0]?.title, paymentId: existingMovement.order?.payments?.[0]?.id, labelId: existingMovement.order?.dispensingLabels?.[0]?.id, totalAmount: existingMovement.order?.totalAmount, cashReceivedAmount: existingMovement.order?.payments?.[0]?.cashReceivedAmount, changeDueAmount: existingMovement.order?.payments?.[0]?.changeDueAmount, currencyCode: existingMovement.order?.currencyCode };
    }
    assertPrescriptionItemProductIdentity(item);
    assertPrescriptionClinicallyEligible(prescription);
    const safetyReview = await assertPrescriptionSafetyEvidence(transactionContext, prescription, true);
    if (!["ready_to_dispense", "partially_dispensed"].includes(prescription.status) || !prescription.approval || !prescription.reviews?.length) {
      throw new DomainError("Prescription is not authorized for dispensing");
    }
    if (hold && !fill) throw new DomainError("Will-call holds require a per-fill reservation");
    const fillPlan = fill ? dispenseFillPlan(fill, args.expectedFillVersion, args.quantity, Date.now(), hold) : null;
    const authorizedFills = 1 + item.refillsAuthorized - item.refillsRemaining;
    const authorizedQuantity = item.quantityPrescribed * authorizedFills;
    const remainingAuthorizedQuantity = fill ? fill.authorizedQuantity - fill.quantityDispensed - fill.quantityReleased : authorizedQuantity - item.quantityDispensed;
    if (args.quantity > remainingAuthorizedQuantity) throw new DomainError("Dispensed quantity exceeds the remaining authorized quantity");
    if (prescription.items.length !== 1 || !fill && (remainingAuthorizedQuantity !== item.quantityPrescribed || args.quantity !== item.quantityPrescribed)) {
      throw new DomainError("Dispense one complete prescription item per cash pickup; partial and multi-item dispensing are not supported");
    }
    if (prescription.organization.cashSalesEnabled !== true || !prescription.organization.cashTaxPolicyReference?.trim() || !prescription.organization.cashPolicyReviewedAt) {
      throw new DomainError("Operator-attested cash and tax policy must be configured before dispensing");
    }
    const currencyCode = fill ? fill.priceSnapshot.currencyCode : item.product.currencyCode;
    const subtotalAmount = fill ? fillPricePortion(fill.priceSnapshot.amount, fill.authorizedQuantity, fill.quantityDispensed, args.quantity) : item.product.priceAmount;
    const taxable = fill ? fill.priceSnapshot.taxable : item.product.taxable !== false;
    const taxableSubtotalAmount = taxable ? subtotalAmount : 0;
    const taxAmount = fill ? fillPricePortion(fill.priceSnapshot.taxAmount, fill.authorizedQuantity, fill.quantityDispensed, args.quantity) : calculateTaxAmount(taxableSubtotalAmount, prescription.organization.cashTaxRateBps || 0);
    const totalAmount = subtotalAmount + taxAmount;
    const tender = hold ? null : assertCashTender(totalAmount, args.cashReceivedAmount);
    const lot = await sudo.query.InventoryLot.findOne({
      where: { id: args.lotId },
      query: "id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } product { id } location { id }"
    });
    if (!lot || lot.location.id !== prescription.location.id || lot.product.id !== item.product?.id) throw new DomainError("Inventory lot does not match this prescription item and location");
    if (!isLotEligible(lot) || lot.quantityAvailable - lot.quantityQuarantined < args.quantity) throw new DomainError("Inventory lot is not eligible for dispensing");
    const approval = await createHumanApproval(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      actionType: "dispense",
      reason: args.reason,
      attested: args.attested,
      evidence: { prescriptionItemId: item.id, fillId: fill?.id || null, fillVersion: fill?.version || null, itemVersion: fill?.itemVersion || null, lotId: lot.id, quantity: args.quantity, pharmacistReviewId: prescription.reviews[0].id, clinicalSafetyReviewId: safetyReview.id, idempotencyKey: args.idempotencyKey }
    });
    const operationSuffix = (0, import_node_crypto17.createHash)("sha256").update(args.idempotencyKey).digest("hex").slice(0, 12).toUpperCase();
    const dispensedAt = (/* @__PURE__ */ new Date()).toISOString();
    const sale = tender ? await createCashPickupSale(transactionContext, {
      prescription,
      item,
      fill,
      userId,
      reason: args.reason,
      attested: args.attested,
      idempotencyKey: args.idempotencyKey,
      operationSuffix,
      at: dispensedAt,
      dispenseApprovalId: approval.id,
      clinicalSafetyReviewId: safetyReview.id,
      pharmacistReviewId: prescription.reviews[0].id,
      fillNumber: safetyReview.fillNumber,
      quantity: args.quantity,
      lot,
      subtotalAmount,
      taxableSubtotalAmount,
      taxAmount,
      totalAmount,
      currencyCode,
      tender
    }) : null;
    const label = await sudo.query.DispensingLabel.createOne({
      data: {
        labelNumber: `LBL-${operationSuffix}`,
        fillNumber: safetyReview.fillNumber,
        operatorNameSnapshot: prescription.organization.operatorDisplayName,
        operatorPhoneSnapshot: prescription.organization.supportPhone || prescription.location.phone || void 0,
        locationNameSnapshot: prescription.location.name,
        locationAddressSnapshot: prescription.location.address || void 0,
        patientNameSnapshot: prescription.patient.displayName,
        prescriberNameSnapshot: prescription.prescriber.name,
        medicationNameSnapshot: item.medicationNameSnapshot,
        sigSnapshot: item.sig,
        quantityDispensed: args.quantity,
        lotNumberSnapshot: lot.lotNumber,
        ndc11Snapshot: item.product.drugReference?.ndc11 || void 0,
        expirationDateSnapshot: lot.expirationDate,
        auxiliaryWarnings,
        counselingOutcome: args.counselingOutcome,
        dispensedAt,
        organization: { connect: { id: prescription.organization.id } },
        location: { connect: { id: prescription.location.id } },
        patient: { connect: { id: prescription.patient.id } },
        prescription: { connect: { id: prescription.id } },
        prescriptionItem: { connect: { id: item.id } },
        ...sale ? { order: { connect: { id: sale.order.id } } } : {},
        ...fill ? { fill: { connect: { id: fill.id } } } : {},
        pharmacist: { connect: { id: userId } },
        approval: { connect: { id: approval.id } }
      },
      query: "id labelNumber"
    });
    await sudo.query.InventoryLot.updateOne({
      where: { id: lot.id },
      data: { quantityAvailable: lot.quantityAvailable - args.quantity, ...lot.quantityAvailable - args.quantity === 0 ? { status: "depleted" } : {} }
    });
    await sudo.query.PrescriptionItem.updateOne({
      where: { id: item.id },
      data: { quantityDispensed: item.quantityDispensed + args.quantity }
    });
    const movement = await sudo.query.InventoryMovement.createOne({
      data: {
        movementType: "dispense",
        quantityDelta: -args.quantity,
        reason: args.reason,
        idempotencyKey: `dispense:${args.idempotencyKey}`,
        requestFingerprint,
        organization: { connect: { id: prescription.organization.id } },
        location: { connect: { id: prescription.location.id } },
        product: { connect: { id: lot.product.id } },
        lot: { connect: { id: lot.id } },
        actor: { connect: { id: userId } },
        patient: { connect: { id: prescription.patient.id } },
        prescription: { connect: { id: prescription.id } },
        prescriptionItem: { connect: { id: item.id } },
        ...sale ? { order: { connect: { id: sale.order.id } } } : {},
        approval: { connect: { id: approval.id } }
      },
      query: "id"
    });
    const order = sale?.order, payment = sale?.payment, cashApproval = sale?.cashApproval;
    if (fill) {
      const result = { success: true, reused: false, prescriptionId: prescription.id, status: fillPlan.status, approvalId: approval.id, orderId: order?.id ?? null, orderNumber: order?.orderNumber ?? null, receiptItemTitle: item.product.title, paymentId: payment?.id ?? null, labelId: label.id, totalAmount, cashReceivedAmount: tender?.cashReceivedAmount ?? null, changeDueAmount: tender?.changeDueAmount ?? null, currencyCode };
      await consumeFillInTransaction(transactionContext, fill, item, args.expectedFillVersion, args.quantity, { key: args.idempotencyKey, fingerprint: requestFingerprint, actorId: userId, approvalId: approval.id, result, movementId: movement.id, safetyReviewId: safetyReview.id, hold });
      if (fillPlan.status === "dispensed" && fill.refillRequest?.id) await sudo.query.RefillRequest.updateOne({ where: { id: fill.refillRequest.id }, data: { status: "fulfilled", openRequestKey: null } });
    }
    const allCurrentFillsComplete = fill ? fillPlan.status === "dispensed" : prescription.items.every((entry) => {
      const nextDispensed = entry.id === item.id ? entry.quantityDispensed + args.quantity : entry.quantityDispensed;
      const entryAuthorizedQuantity = entry.quantityPrescribed * (1 + entry.refillsAuthorized - entry.refillsRemaining);
      return nextDispensed >= entryAuthorizedQuantity;
    });
    const nextStatus = hold ? "ready_for_pickup" : allCurrentFillsComplete ? "dispensed" : "partially_dispensed";
    await sudo.query.Prescription.updateOne({
      where: { id: prescription.id },
      data: { status: nextStatus, ...allCurrentFillsComplete && !hold ? { dispensedAt: (/* @__PURE__ */ new Date()).toISOString() } : {}, approval: { connect: { id: approval.id } } }
    });
    await recordAudit(transactionContext, {
      eventKey: `prescription.dispensed:${args.idempotencyKey}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      patientId: prescription.patient.id,
      eventType: hold ? "prescription.filled_for_pickup" : allCurrentFillsComplete ? "prescription.dispensed" : "prescription.partially_dispensed",
      resourceType: "Prescription",
      resourceId: prescription.id,
      metadata: { prescriptionItemId: item.id, fillId: fill?.id || null, fillVersion: fill ? fill.version + 1 : null, lotId: lot.id, quantity: args.quantity, quantityDispensed: item.quantityDispensed + args.quantity, movementId: movement.id, orderId: order?.id ?? null, paymentId: payment?.id ?? null, labelId: label.id, approvalId: approval.id, cashApprovalId: cashApproval?.id ?? null, willCall: hold, clinicalSafetyReviewId: safetyReview.id, subtotalAmount, taxableSubtotalAmount, taxAmount, providerSettlementClaimed: false }
    });
    return { success: true, reused: false, prescriptionId: prescription.id, status: nextStatus, approvalId: approval.id, orderId: order?.id ?? null, orderNumber: order?.orderNumber ?? null, receiptItemTitle: item.product.title, paymentId: payment?.id ?? null, labelId: label.id, totalAmount, cashReceivedAmount: tender?.cashReceivedAmount ?? null, changeDueAmount: tender?.changeDueAmount ?? null, currencyCode };
  });
}
async function loadWillCallEvidence(tx, fill) {
  const sudo = tx.sudo();
  const [label] = await sudo.query.DispensingLabel.findMany({ where: { fill: { id: { equals: fill.id } }, voidedAt: { equals: null } }, take: 1, query: "id labelNumber dispensedAt" });
  const [filled] = await fillStore(tx).PrescriptionFillEvent.findMany({ where: { fill: { id: { equals: fill.id } }, action: { equals: "filled" } }, orderBy: [{ createdAt: "desc" }], take: 1, query: "id evidence" });
  const movementId = filled?.evidence?.movementId;
  const movement = movementId ? await sudo.query.InventoryMovement.findOne({ where: { id: movementId }, query: "id movementType quantityDelta lot { id lotNumber expirationDate status quantityAvailable } product { id }" }) : null;
  if (!label || !movement || movement.movementType !== "dispense" || -movement.quantityDelta !== fill.quantityDispensed) throw new DomainError("Will-call label and stock evidence require reconciliation");
  return { label, movement, lot: movement.lot };
}
function willCallAmountDue(fill) {
  const subtotalAmount = fillPricePortion(fill.priceSnapshot.amount, fill.authorizedQuantity, 0, fill.authorizedQuantity);
  const taxAmount = fillPricePortion(fill.priceSnapshot.taxAmount, fill.authorizedQuantity, 0, fill.authorizedQuantity);
  return { subtotalAmount, taxAmount, totalAmount: subtotalAmount + taxAmount, currencyCode: fill.priceSnapshot.currencyCode };
}
async function openPrescriptionPickupCardPayment(_root, args, context) {
  requirePermission(context, "canDispenseMedications");
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  const sudo = context.sudo();
  const prescription = await sudo.query.Prescription.findOne({ where: { id: args.prescriptionId }, query: "id status organization { id } location { id }" });
  if (!prescription) throw new DomainError("Prescription not found");
  await requireTenantMembership(context, { organizationId: prescription.organization.id, locationId: prescription.location.id, pharmacist: true });
  if (prescription.status !== "ready_for_pickup") throw new DomainError("Prescription is not waiting for pickup");
  const fill = await fillStore(context).PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY });
  if (!fill || fill.prescription?.id !== prescription.id || fill.status !== "ready") throw new DomainError("Fill is not in will-call");
  const due = willCallAmountDue(fill);
  return openCounterCardIntent(context, { organizationId: prescription.organization.id, scope: "rx", idempotencyKey: args.idempotencyKey, amount: due.totalAmount, currencyCode: due.currencyCode });
}
async function pickupPrescriptionFill(_root, args, context) {
  requirePermission(context, "canDispenseMedications");
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  if (args.tenderMethod && !["cash", "card"].includes(args.tenderMethod)) throw new DomainError("Tender must be cash or card");
  let card = null;
  if (args.tenderMethod === "card") {
    const scope = await context.sudo().query.Prescription.findOne({ where: { id: args.prescriptionId }, query: "id organization { id } location { id }" });
    if (!scope) throw new DomainError("Prescription not found");
    await requireTenantMembership(context, { organizationId: scope.organization.id, locationId: scope.location.id, pharmacist: true });
    card = await verifyCounterCardIntent(context, { organizationId: scope.organization.id, scope: "rx", idempotencyKey: args.idempotencyKey, paymentIntentId: args.paymentIntentId || "" });
  }
  try {
    return await recordWillCallPickup(args, context, card);
  } catch (error) {
    throw await refundRefusedCounterCard(context, card, error, async () => !!await fillStore(context).PrescriptionFillEvent.findOne({ where: { eventKey: `fill.pickup:${args.idempotencyKey}` }, query: "id" }));
  }
}
async function recordWillCallPickup(args, context, card) {
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `fill:${args.fillId}`, `fill-command:${args.idempotencyKey}`], async (tx) => {
    const sudo = tx.sudo();
    const prescription = await sudo.query.Prescription.findOne({ where: { id: args.prescriptionId }, query: `id status ${SAFETY_QUERY}
      organization { id cashSalesEnabled cashTaxRateBps cashTaxPolicyReference cashPolicyReviewedAt } location { id }
      items { id product { id title sku taxable imageUrl image { id extension } prescriptionRequirement drugReference { ndc11 } } }
      reviews(where: { decision: { equals: "approved" } }, orderBy: { reviewedAt: desc }, take: 1) { id }` });
    if (!prescription) throw new DomainError("Prescription not found");
    const { userId } = await requireTenantMembership(tx, { organizationId: prescription.organization.id, locationId: prescription.location.id, pharmacist: true });
    await currentFillPermission(tx, "canDispenseMedications");
    const current = await loadFillPrescription(tx, prescription.id);
    const fill = await fillStore(tx).PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY });
    const currentItem = current.items.find((entry) => entry.id === fill?.prescriptionItem?.id);
    const item = prescription.items.find((entry) => entry.id === currentItem?.id);
    if (!fill || !currentItem || !item) throw new DomainError("Fill not found");
    assertFillBinding(fill, current, currentItem, false);
    const fingerprint2 = fillHash({ ...args, actorId: userId }), eventKey = `fill.pickup:${args.idempotencyKey}`;
    const prior = await fillStore(tx).PrescriptionFillEvent.findOne({ where: { eventKey }, query: "id commandFingerprint result" });
    if (prior) {
      if (prior.commandFingerprint !== fingerprint2) throw new DomainError("Pickup key is already bound to another request");
      return { ...prior.result, reused: true };
    }
    await assertItemFillLedger(tx, current, currentItem);
    const plan = pickupFillPlan(fill, args.expectedFillVersion);
    if (prescription.status !== "ready_for_pickup") throw new DomainError("Prescription is not waiting for pickup");
    if (prescription.organization.cashSalesEnabled !== true || !prescription.organization.cashTaxPolicyReference?.trim() || !prescription.organization.cashPolicyReviewedAt) throw new DomainError("Operator-attested cash and tax policy must be configured before pickup");
    const { label, lot } = await loadWillCallEvidence(tx, fill);
    const { subtotalAmount, taxAmount, totalAmount, currencyCode } = willCallAmountDue(fill);
    if (card) assertCounterCardCovers(card, totalAmount, currencyCode);
    const tender = card ? { cashReceivedAmount: totalAmount, changeDueAmount: 0 } : assertCashTender(totalAmount, args.cashReceivedAmount);
    const approval = await createHumanApproval(tx, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      actionType: "dispense",
      reason: args.reason,
      attested: args.attested,
      evidence: { stage: "will_call_pickup", fillId: fill.id, fillVersion: fill.version, itemVersion: fill.itemVersion, labelId: label.id, idempotencyKey: args.idempotencyKey }
    });
    const at = (/* @__PURE__ */ new Date()).toISOString();
    const sale = await createCashPickupSale(tx, {
      prescription,
      item,
      fill,
      userId,
      reason: args.reason,
      attested: args.attested,
      idempotencyKey: args.idempotencyKey,
      operationSuffix: (0, import_node_crypto17.createHash)("sha256").update(args.idempotencyKey).digest("hex").slice(0, 12).toUpperCase(),
      at,
      readyAt: label.dispensedAt,
      dispenseApprovalId: approval.id,
      clinicalSafetyReviewId: prescription.safetyReviews?.[0]?.id,
      pharmacistReviewId: prescription.reviews?.[0]?.id,
      fillNumber: fill.fillNumber,
      quantity: fill.quantityDispensed,
      lot,
      subtotalAmount,
      taxableSubtotalAmount: fill.priceSnapshot.taxable ? subtotalAmount : 0,
      taxAmount,
      totalAmount,
      currencyCode,
      tender,
      card
    });
    await sudo.query.DispensingLabel.updateOne({ where: { id: label.id }, data: { order: { connect: { id: sale.order.id } } } });
    const updated = await casFill(tx, fill, { ...plan, openKey: null });
    if (fill.refillRequest?.id) await sudo.query.RefillRequest.updateOne({ where: { id: fill.refillRequest.id }, data: { status: "fulfilled", openRequestKey: null } });
    await sudo.query.Prescription.updateOne({ where: { id: prescription.id }, data: { status: "dispensed", dispensedAt: at, approval: { connect: { id: approval.id } } } });
    const result = { success: true, reused: false, prescriptionId: prescription.id, status: "dispensed", approvalId: approval.id, orderId: sale.order.id, orderNumber: sale.order.orderNumber, receiptItemTitle: item.product.title, paymentId: sale.payment.id, labelId: label.id, totalAmount, cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount, currencyCode, tenderMethod: card ? "card" : "cash" };
    await appendFillEvent(tx, updated, { eventKey, fingerprint: fingerprint2, action: "picked_up", actorId: userId, approvalId: approval.id, result, evidence: { labelId: label.id, orderId: sale.order.id, paymentId: sale.payment.id, cashApprovalId: sale.cashApproval.id } });
    return result;
  });
}
async function returnPrescriptionFillToStock(_root, args, context) {
  await currentFillPermission(context, "canReviewPrescriptions");
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `fill:${args.fillId}`, `fill-command:${args.idempotencyKey}`], async (tx) => {
    const sudo = tx.sudo(), q = fillStore(tx);
    const p2 = await loadFillPrescription(tx, args.prescriptionId);
    const { userId } = await requireTenantMembership(tx, { organizationId: p2.organization.id, locationId: p2.location.id, pharmacist: true });
    await currentFillPermission(tx, "canReviewPrescriptions");
    const fill = await q.PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY });
    const item = p2.items.find((entry) => entry.id === fill?.prescriptionItem?.id);
    if (!fill || !item) throw new DomainError("Fill not found");
    assertFillBinding(fill, p2, item, false);
    const fingerprint2 = fillHash({ ...args, actorId: userId }), eventKey = `fill.return:${args.idempotencyKey}`;
    const prior = await q.PrescriptionFillEvent.findOne({ where: { eventKey }, query: "id commandFingerprint result" });
    if (prior) {
      if (prior.commandFingerprint !== fingerprint2) throw new DomainError("Return key is already bound to another request");
      return { ...prior.result, reused: true };
    }
    const returned = await q.PrescriptionFillEvent.count({ where: { fill: { id: { equals: fill.id } }, action: { equals: "returned_to_stock" } } });
    const plan = returnToStockPlan(fill, args.expectedFillVersion, args.cause, returned > 0);
    if (plan.noop) return { success: true, reused: true, fillId: fill.id, status: fill.status, version: fill.version };
    await assertItemFillLedger(tx, p2, item);
    const { label, movement, lot } = await loadWillCallEvidence(tx, fill);
    await acquireTransactionLocks(tx, [`lot:${lot.id}`, `prescription-item:${item.id}`]);
    const approval = await createHumanApproval(tx, {
      organizationId: p2.organization.id,
      locationId: p2.location.id,
      actorId: userId,
      actionType: "prescription_review",
      reason: args.reason,
      attested: args.attested,
      evidence: { stage: "return_to_stock", fillId: fill.id, cause: args.cause, entitlementRestored: plan.restoreRefill, inventoryRestocked: plan.unitsRestocked, labelId: label.id, reversedMovementId: movement.id }
    });
    await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { quantityAvailable: lot.quantityAvailable + plan.unitsRestocked, ...lot.status === "depleted" ? { status: "available" } : {} } });
    const returnMovement = await sudo.query.InventoryMovement.createOne({ data: {
      movementType: "return",
      quantityDelta: plan.unitsRestocked,
      reason: args.reason,
      idempotencyKey: `return-to-stock:${args.idempotencyKey}`,
      requestFingerprint: fingerprint2,
      organization: { connect: { id: p2.organization.id } },
      location: { connect: { id: p2.location.id } },
      product: { connect: { id: movement.product.id } },
      lot: { connect: { id: lot.id } },
      actor: { connect: { id: userId } },
      patient: { connect: { id: p2.patient.id } },
      prescription: { connect: { id: p2.id } },
      prescriptionItem: { connect: { id: item.id } },
      approval: { connect: { id: approval.id } }
    }, query: "id" });
    const unconsumed = {
      ...item,
      quantityDispensed: item.quantityDispensed - plan.unitsRestocked,
      refillsRemaining: item.refillsRemaining + (plan.restoreRefill ? 1 : 0),
      refillsReserved: item.refillsReserved + (plan.restoreRefill ? 1 : 0)
    };
    await sudo.query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { quantityDispensed: unconsumed.quantityDispensed, refillsRemaining: unconsumed.refillsRemaining, refillsReserved: unconsumed.refillsReserved } });
    const updated = await applyFillReleaseInTransaction(tx, p2, unconsumed, fill, plan.release, args.reason, plan.data);
    await sudo.query.DispensingLabel.updateOne({ where: { id: label.id }, data: { voidedAt: (/* @__PURE__ */ new Date()).toISOString(), voidReason: args.reason } });
    const result = { success: true, reused: false, fillId: fill.id, status: "released", version: updated.version };
    await appendFillEvent(tx, updated, {
      eventKey,
      fingerprint: fingerprint2,
      action: "returned_to_stock",
      actorId: userId,
      approvalId: approval.id,
      quantity: plan.unitsRestocked,
      result,
      evidence: { cause: args.cause, inventoryRestocked: true, entitlementRestored: plan.restoreRefill, labelId: label.id, reversedMovementId: movement.id, movementId: returnMovement.id }
    });
    return result;
  });
}

// features/keystone/mutations/coldChainWorkflows.ts
async function recordTemperatureExcursion(_root, args, context) {
  requirePermission(context, "canManageInventory");
  if (!args.idempotencyKey?.trim() || !args.reason?.trim()) throw new DomainError("Idempotency key and reason are required");
  if (!Number.isFinite(args.observedMinimumC) || !Number.isFinite(args.observedMaximumC) || args.observedMinimumC > args.observedMaximumC) {
    throw new DomainError("Observed temperature range is invalid");
  }
  return withDomainTransaction(context, [`excursion-idempotency:${args.idempotencyKey}`, `lot:${args.lotId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.TemperatureExcursion.findOne({ where: { idempotencyKey: args.idempotencyKey }, query: "id status lot { id } approval { id }" });
    if (existing) {
      if (existing.lot?.id !== args.lotId) throw new DomainError("Excursion idempotency key belongs to another lot");
      return { success: true, reused: true, excursionId: existing.id, lotId: existing.lot.id, status: existing.status, approvalId: existing.approval?.id };
    }
    const lot = await sudo.query.InventoryLot.findOne({
      where: { id: args.lotId },
      query: "id status quantityAvailable product { id organization { id } } location { id } coldChainRequired"
    });
    if (!lot?.coldChainRequired) throw new DomainError("Cold-chain inventory lot not found");
    if (!QUARANTINABLE_LOT_STATUSES.includes(lot.status)) throw new DomainError(`A ${lot.status} lot cannot be quarantined for a temperature excursion`);
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: lot.product.organization.id, locationId: lot.location.id });
    const approval = await createHumanApproval(transactionContext, {
      organizationId: lot.product.organization.id,
      locationId: lot.location.id,
      actorId: userId,
      actionType: "cold_chain_disposition",
      reason: args.reason,
      attested: args.attested,
      evidence: { action: "quarantine_excursion", lotId: lot.id, observedMinimumC: args.observedMinimumC, observedMaximumC: args.observedMaximumC }
    });
    const excursion = await sudo.query.TemperatureExcursion.createOne({
      data: {
        idempotencyKey: args.idempotencyKey,
        observedMinimumC: args.observedMinimumC,
        observedMaximumC: args.observedMaximumC,
        startedAt: new Date(args.startedAt).toISOString(),
        endedAt: args.endedAt ? new Date(args.endedAt).toISOString() : void 0,
        status: "open",
        dispositionReason: args.reason,
        organization: { connect: { id: lot.product.organization.id } },
        location: { connect: { id: lot.location.id } },
        lot: { connect: { id: lot.id } },
        reviewedBy: { connect: { id: userId } },
        approval: { connect: { id: approval.id } }
      },
      query: "id status"
    });
    await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { status: "quarantined", quantityQuarantined: lot.quantityAvailable, coldChainEvidenceComplete: false } });
    await sudo.query.InventoryMovement.createOne({
      data: {
        movementType: "quarantine",
        quantityDelta: 0,
        reason: args.reason,
        idempotencyKey: `cold-chain:${args.idempotencyKey}`,
        organization: { connect: { id: lot.product.organization.id } },
        location: { connect: { id: lot.location.id } },
        product: { connect: { id: lot.product.id } },
        lot: { connect: { id: lot.id } },
        actor: { connect: { id: userId } },
        approval: { connect: { id: approval.id } }
      }
    });
    await recordAudit(transactionContext, {
      eventKey: `cold_chain.excursion:${args.idempotencyKey}`,
      organizationId: lot.product.organization.id,
      locationId: lot.location.id,
      actorId: userId,
      eventType: "cold_chain.excursion_recorded",
      resourceType: "TemperatureExcursion",
      resourceId: excursion.id,
      metadata: { lotId: lot.id, status: "quarantined", approvalId: approval.id }
    });
    return { success: true, reused: false, excursionId: excursion.id, lotId: lot.id, status: excursion.status, approvalId: approval.id };
  });
}
async function resolveTemperatureExcursion(_root, args, context) {
  requirePermission(context, "canManageInventory");
  if (!args.idempotencyKey?.trim()) throw new DomainError("Idempotency key is required");
  const candidate = await context.sudo().query.TemperatureExcursion.findOne({ where: { id: args.excursionId }, query: "id lot { id }" });
  if (!candidate?.lot?.id) throw new DomainError("Temperature excursion not found");
  return withDomainTransaction(context, [`excursion:${args.excursionId}`, `lot:${candidate.lot.id}`, `excursion-disposition:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const excursion = await sudo.query.TemperatureExcursion.findOne({
      where: { id: args.excursionId },
      query: "id status resolutionNote organization { id } location { id } lot { id status expirationDate quantityAvailable quantityQuarantined product { id } location { id } }"
    });
    if (!excursion?.lot) throw new DomainError("Temperature excursion not found");
    const lot = excursion.lot;
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: excursion.organization.id, locationId: excursion.location.id });
    const replay = await sudo.query.InventoryMovement.findOne({ where: { idempotencyKey: `excursion-disposition:${args.idempotencyKey}` }, query: "id lot { id }" });
    if (replay) {
      if (replay.lot?.id !== lot.id || excursion.status !== args.disposition) throw new DomainError("Disposition idempotency key was reused with different input");
      return { success: true, reused: true, excursionId: excursion.id, lotId: lot.id, status: excursion.status, lotStatus: lot.status, quantityAvailable: lot.quantityAvailable, movementId: replay.id };
    }
    const refusal = excursionDispositionError({ excursionStatus: excursion.status, disposition: args.disposition, note: args.note, lotStatus: lot.status, lotExpiresAt: lot.expirationDate });
    if (refusal) throw new DomainError(refusal, "TRANSITION_REFUSED");
    const disposition = args.disposition;
    const otherOpen = await sudo.query.TemperatureExcursion.count({ where: { lot: { id: { equals: lot.id } }, id: { not: { equals: excursion.id } }, status: { in: ["open", "under_review"] } } });
    const next = lotAfterExcursionDisposition(disposition, lot, disposition === "destroyed" ? 0 : otherOpen);
    const note = args.note.trim();
    const approval = await createHumanApproval(transactionContext, {
      organizationId: excursion.organization.id,
      locationId: excursion.location.id,
      actorId: userId,
      actionType: "cold_chain_disposition",
      reason: note,
      attested: args.attested,
      evidence: { action: `excursion_${disposition}`, excursionId: excursion.id, lotId: lot.id, writeOff: next.writeOff, idempotencyKey: args.idempotencyKey }
    });
    const closed = await transactionContext.prisma.temperatureExcursion.updateMany({
      where: { id: excursion.id, status: { in: ["open", "under_review"] } },
      data: { status: disposition, resolutionNote: note, resolvedAt: /* @__PURE__ */ new Date(), reviewedById: userId, approvalId: approval.id }
    });
    if (closed.count !== 1) throw new DomainError("This excursion was resolved by someone else; reload it", "TRANSITION_REFUSED");
    await sudo.query.InventoryLot.updateOne({
      where: { id: lot.id },
      data: {
        status: next.status,
        quantityAvailable: next.quantityAvailable,
        quantityQuarantined: next.quantityQuarantined,
        ...disposition === "released" && next.status !== "quarantined" ? { coldChainEvidenceComplete: true } : {}
      }
    });
    const movement = await sudo.query.InventoryMovement.createOne({
      data: {
        movementType: disposition === "destroyed" ? "destroy" : "release",
        quantityDelta: -next.writeOff,
        reason: disposition === "destroyed" ? `Write-off after temperature excursion: ${note}` : `Released after temperature excursion: ${note}`,
        idempotencyKey: `excursion-disposition:${args.idempotencyKey}`,
        organization: { connect: { id: excursion.organization.id } },
        location: { connect: { id: lot.location.id } },
        product: { connect: { id: lot.product.id } },
        lot: { connect: { id: lot.id } },
        actor: { connect: { id: userId } },
        approval: { connect: { id: approval.id } }
      },
      query: "id"
    });
    await recordAudit(transactionContext, {
      eventKey: `cold_chain.excursion_${disposition}:${excursion.id}`,
      organizationId: excursion.organization.id,
      locationId: excursion.location.id,
      actorId: userId,
      eventType: `cold_chain.excursion_${disposition}`,
      resourceType: "TemperatureExcursion",
      resourceId: excursion.id,
      metadata: { lotId: lot.id, movementId: movement.id, lotStatus: next.status, writeOff: next.writeOff, approvalId: approval.id }
    });
    return { success: true, reused: false, excursionId: excursion.id, lotId: lot.id, status: disposition, lotStatus: next.status, quantityAvailable: next.quantityAvailable, movementId: movement.id, approvalId: approval.id };
  });
}

// features/keystone/mutations/recallWorkflows.ts
var import_node_crypto18 = require("node:crypto");
async function reconcileRecallExposures(context, recallId) {
  return withDomainTransaction(context, [`recall-exposures:${recallId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const recall = await sudo.query.Recall.findOne({ where: { id: recallId }, query: "id status recallNumber classification sourceValidationReference organization { id } location { id } lots { id } approval { id }" });
    if (!recall?.organization?.id) throw new DomainError("Recall exposure reconciliation scope is incomplete");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: recall.organization.id, locationId: recall.location?.id, organizationWide: !recall.location?.id });
    const lotIds = (recall.lots || []).map((lot) => lot.id);
    const candidateWhere = recallExposureMovementWhere(lotIds);
    const [candidateMovementCount, candidateMovements] = await Promise.all([
      sudo.query.InventoryMovement.count({ where: candidateWhere }),
      sudo.query.InventoryMovement.findMany({ where: candidateWhere, orderBy: { occurredAt: "asc" }, take: 1e4, query: "id quantityDelta patient { id } prescription { id } order { id } location { id }" })
    ]);
    const candidateMovementIds = candidateMovements.map((movement) => movement.id);
    const initialLinks = candidateMovementIds.length ? await sudo.query.RecallExposure.findMany({ where: { recall: { id: { equals: recall.id } }, movement: { id: { in: candidateMovementIds } } }, take: 1e4, query: "id movement { id }" }) : [];
    const alreadyLinkedMovementIds = new Set(initialLinks.map((entry) => entry.movement?.id).filter(Boolean));
    if (recall.status !== "closed") {
      for (const movement of candidateMovements) {
        if (!movement.patient?.id || !movement.location?.id || alreadyLinkedMovementIds.has(movement.id)) continue;
        const exposureKey = `${recall.id}:${movement.id}`;
        await sudo.query.RecallExposure.createOne({
          data: {
            exposureKey,
            status: "outreach_required",
            quantityDispensed: Math.abs(movement.quantityDelta),
            organization: { connect: { id: recall.organization.id } },
            location: { connect: { id: movement.location.id } },
            recall: { connect: { id: recall.id } },
            movement: { connect: { id: movement.id } },
            patient: { connect: { id: movement.patient.id } },
            prescription: movement.prescription?.id ? { connect: { id: movement.prescription.id } } : void 0,
            order: movement.order?.id ? { connect: { id: movement.order.id } } : void 0
          }
        });
      }
    }
    const linkedRows = candidateMovementIds.length ? await sudo.query.RecallExposure.findMany({ where: { recall: { id: { equals: recall.id } }, movement: { id: { in: candidateMovementIds } } }, take: 1e4, query: "id movement { id }" }) : [];
    const linkedMovementIds = linkedRows.map((entry) => entry.movement?.id).filter(Boolean);
    const exposureCount = await sudo.query.RecallExposure.count({ where: { recall: { id: { equals: recall.id } } } });
    const reconciliation = assessRecallExposureReconciliation({ candidateMovementCount, linkedMovementIds, exposureCount, linkedExposureCount: linkedRows.length });
    const { unlinkedExposureCount, exposureReconciliationComplete } = reconciliation;
    if (recall.status !== "closed") {
      await recordAudit(transactionContext, {
        eventKey: `recall.opened:${recall.organization.id}:${recall.recallNumber}`,
        organizationId: recall.organization.id,
        locationId: recall.location?.id,
        actorId: userId,
        eventType: "recall.opened_and_quarantined",
        resourceType: "Recall",
        resourceId: recall.id,
        metadata: { recallNumber: recall.recallNumber, classification: recall.classification, sourceReference: recall.sourceValidationReference, lotIds, exposureReconciliationStatus: "pending", approvalId: recall.approval?.id }
      });
      await recordAudit(transactionContext, {
        eventKey: `recall.exposure_reconciliation:${recall.id}:${candidateMovementCount}:${reconciliation.linkedMovementCount}:${exposureCount}:${exposureReconciliationComplete}`,
        organizationId: recall.organization.id,
        locationId: recall.location?.id,
        actorId: userId,
        eventType: "recall.exposure_reconciliation_recorded",
        resourceType: "Recall",
        resourceId: recall.id,
        metadata: { candidateMovementCount, linkedMovementCount: reconciliation.linkedMovementCount, exposureCount, unlinkedExposureCount, complete: exposureReconciliationComplete }
      });
    }
    return { candidateMovementCount, linkedMovementCount: reconciliation.linkedMovementCount, exposureCount, unlinkedExposureCount, exposureReconciliationComplete };
  });
}
async function openPharmacyRecall(_root, args, context) {
  requirePermission(context, "canManageRecalls");
  if (!["class_i", "class_ii", "class_iii", "market_withdrawal"].includes(args.classification)) throw new DomainError("Recall classification is invalid");
  if (!args.recallNumber?.trim() || !args.reason?.trim() || !args.source?.trim() || !args.sourceReference?.trim() || !args.lotIds.length) throw new DomainError("Recall number, reason, source, source reference, and affected lots are required");
  const requestFingerprint = (0, import_node_crypto18.createHash)("sha256").update(JSON.stringify({ organizationId: args.organizationId, locationId: args.locationId || null, recallNumber: args.recallNumber.trim(), classification: args.classification, reason: args.reason.trim(), source: args.source.trim(), sourceReference: args.sourceReference.trim(), lotIds: [...new Set(args.lotIds)].sort(), attested: args.attested })).digest("hex");
  const holdResult = await withDomainTransaction(context, [`recall-number:${args.recallNumber.trim()}`, ...args.lotIds.map((id) => `lot:${id}`)], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.Recall.findOne({ where: { recallNumber: args.recallNumber.trim() }, query: "id status organization { id } location { id } lots { id } approval { id evidence }" });
    if (existing) {
      if (!existing.organization?.id) throw new DomainError("Recall replay scope is incomplete; operator reconciliation is required");
      await requireTenantMembership(transactionContext, { organizationId: existing.organization.id, locationId: existing.location?.id, organizationWide: !existing.location?.id });
      if (existing.approval?.evidence?.requestFingerprint !== requestFingerprint) throw new DomainError("Recall number was reused with different input");
      return { success: true, reused: true, recallId: existing.id, status: existing.status, lotCount: existing.lots.length, approvalId: existing.approval?.id };
    }
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: args.organizationId, locationId: args.locationId, organizationWide: !args.locationId });
    const lots = await sudo.query.InventoryLot.findMany({
      where: { id: { in: [...new Set(args.lotIds)] } },
      query: "id quantityAvailable product { id organization { id } } location { id }"
    });
    if (lots.length !== new Set(args.lotIds).size || lots.some((lot) => lot.product?.organization?.id !== args.organizationId || args.locationId && lot.location?.id !== args.locationId)) {
      throw new DomainError("Every affected lot must belong to this pharmacy");
    }
    const approval = await createHumanApproval(transactionContext, {
      organizationId: args.organizationId,
      locationId: args.locationId,
      actorId: userId,
      actionType: "recall_disposition",
      reason: args.reason,
      attested: args.attested,
      evidence: { action: "open", recallNumber: args.recallNumber.trim(), classification: args.classification, lotIds: lots.map((lot) => lot.id), requestFingerprint }
    });
    const recall = await sudo.query.Recall.createOne({
      data: {
        recallNumber: args.recallNumber.trim(),
        classification: args.classification,
        status: "active",
        reason: args.reason.trim(),
        source: args.source.trim(),
        sourceValidationReference: args.sourceReference.trim(),
        organization: { connect: { id: args.organizationId } },
        location: args.locationId ? { connect: { id: args.locationId } } : void 0,
        lots: { connect: lots.map((lot) => ({ id: lot.id })) },
        approval: { connect: { id: approval.id } }
      },
      query: "id status"
    });
    for (const lot of lots) {
      await sudo.query.InventoryLot.updateOne({
        where: { id: lot.id },
        data: { status: "recalled", quantityQuarantined: lot.quantityAvailable }
      });
      await sudo.query.InventoryMovement.createOne({
        data: {
          movementType: "recall",
          quantityDelta: 0,
          reason: args.reason.trim(),
          idempotencyKey: `recall:${recall.id}:lot:${lot.id}`,
          organization: { connect: { id: args.organizationId } },
          location: { connect: { id: lot.location.id } },
          product: { connect: { id: lot.product.id } },
          lot: { connect: { id: lot.id } },
          actor: { connect: { id: userId } },
          approval: { connect: { id: approval.id } }
        }
      });
    }
    await sudo.query.Recall.updateOne({ where: { id: recall.id }, data: { status: "quarantined" } });
    return { success: true, reused: false, recallId: recall.id, status: "quarantined", lotCount: lots.length, approvalId: approval.id };
  });
  try {
    const reconciliation = await reconcileRecallExposures(context, holdResult.recallId);
    return { ...holdResult, unlinkedExposureCount: reconciliation.unlinkedExposureCount };
  } catch {
    throw new DomainError(`Recall hold ${holdResult.recallId} is committed, but exposure reconciliation did not complete. Verify the recall task and retry the same recall input; do not assume the hold failed.`);
  }
}
async function recordRecallExposureAction(_root, args, context) {
  requirePermission(context, "canManageRecalls");
  if (!["contacted", "returned", "resolved", "unable_to_reach"].includes(args.status)) throw new DomainError("Recall exposure status is invalid");
  if (!args.contactMethod?.trim() || !args.outcome?.trim()) throw new DomainError("Contact method and outcome are required");
  const requestFingerprint = (0, import_node_crypto18.createHash)("sha256").update(JSON.stringify({ exposureId: args.exposureId, status: args.status, contactMethod: args.contactMethod.trim(), outcome: args.outcome.trim(), notes: args.notes?.trim() || null, reason: args.reason?.trim(), attested: args.attested })).digest("hex");
  return withDomainTransaction(context, [`recall-exposure:${args.exposureId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const exposure = await sudo.query.RecallExposure.findOne({ where: { id: args.exposureId }, query: "id status organization { id } location { id } recall { id status } patient { id } approval { id evidence }" });
    if (!exposure || !["quarantined", "resolved"].includes(exposure.recall?.status)) throw new DomainError("Recall exposure is not actionable");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: exposure.organization.id, locationId: exposure.location.id });
    if (exposure.status === args.status && exposure.approval?.id && exposure.approval.evidence?.requestFingerprint !== requestFingerprint) throw new DomainError("Recall exposure replay input does not match the recorded action");
    if (exposure.status === args.status && exposure.approval?.id) return { success: true, reused: true, exposureId: exposure.id, status: exposure.status, approvalId: exposure.approval.id };
    if (["returned", "resolved", "unable_to_reach"].includes(exposure.status)) throw new DomainError("Recall exposure is already resolved");
    const approval = await createHumanApproval(transactionContext, { organizationId: exposure.organization.id, locationId: exposure.location.id, actorId: userId, actionType: "recall_disposition", reason: args.reason, attested: args.attested, evidence: { exposureId: exposure.id, status: args.status, contactMethod: args.contactMethod.trim(), outcome: args.outcome.trim(), requestFingerprint, custodyClaimed: false } });
    const resolved = ["returned", "resolved", "unable_to_reach"].includes(args.status);
    await transactionContext.prisma.recallExposure.update({ where: { id: exposure.id }, data: { status: args.status, contactMethod: args.contactMethod.trim(), outcome: args.outcome.trim(), notes: args.notes?.trim() || null, lastActionAt: /* @__PURE__ */ new Date(), resolvedAt: resolved ? /* @__PURE__ */ new Date() : null, lastActorId: userId, approvalId: approval.id } });
    await recordAudit(transactionContext, { eventKey: `recall.exposure_${args.status}:${exposure.id}:${approval.id}`, organizationId: exposure.organization.id, locationId: exposure.location.id, actorId: userId, patientId: exposure.patient.id, eventType: `recall.exposure_${args.status}`, resourceType: "RecallExposure", resourceId: exposure.id, metadata: { recallId: exposure.recall.id, approvalId: approval.id, contactMethod: args.contactMethod.trim(), custodyClaimed: false } });
    return { success: true, reused: false, exposureId: exposure.id, status: args.status, approvalId: approval.id };
  });
}
async function disposeRecallLot(_root, args, context) {
  requirePermission(context, "canManageRecalls");
  if (!Number.isInteger(args.quantity) || args.quantity < 1 || !args.dispositionReference?.trim() || !args.idempotencyKey?.trim()) throw new DomainError("Quantity, disposition reference, and idempotency key are required");
  const requestFingerprint = (0, import_node_crypto18.createHash)("sha256").update(JSON.stringify({ recallId: args.recallId, lotId: args.lotId, quantity: args.quantity, dispositionReference: args.dispositionReference.trim(), reason: args.reason?.trim(), attested: args.attested })).digest("hex");
  return withDomainTransaction(context, [`recall:${args.recallId}`, `lot:${args.lotId}`, `recall-disposition:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const recall = await sudo.query.Recall.findOne({ where: { id: args.recallId }, query: "id status organization { id } location { id } lots { id quantityAvailable quantityQuarantined product { id } location { id } }" });
    const lot = recall?.lots?.find((entry) => entry.id === args.lotId);
    if (!recall || !recall.organization?.id || !lot?.location?.id) throw new DomainError("Recall disposition scope is incomplete; operator reconciliation is required");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: recall.organization.id, locationId: lot.location.id });
    const existing = await sudo.query.InventoryMovement.findOne({ where: { idempotencyKey: `recall-disposition:${args.idempotencyKey}` }, query: "id requestFingerprint lot { id }" });
    if (existing) {
      if (existing.lot?.id !== args.lotId || existing.requestFingerprint !== requestFingerprint) throw new DomainError("Disposition idempotency key was reused with different input");
      return { success: true, reused: true, recallId: args.recallId, lotId: args.lotId, movementId: existing.id, status: "disposed" };
    }
    if (recall.status !== "quarantined") throw new DomainError("Quarantined recall lot not found");
    if (args.quantity !== lot.quantityQuarantined || args.quantity > lot.quantityAvailable) throw new DomainError("Bounded recall disposition must dispose the complete quarantined quantity");
    const approval = await createHumanApproval(transactionContext, { organizationId: recall.organization.id, locationId: lot.location.id, actorId: userId, actionType: "recall_disposition", reason: args.reason, attested: args.attested, evidence: { recallId: recall.id, lotId: lot.id, quantity: args.quantity, dispositionReference: args.dispositionReference.trim(), physicalDispositionRecorded: true } });
    await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { quantityAvailable: lot.quantityAvailable - args.quantity, quantityQuarantined: 0, status: lot.quantityAvailable - args.quantity === 0 ? "depleted" : "recalled" } });
    const movement = await sudo.query.InventoryMovement.createOne({ data: { movementType: "destroy", quantityDelta: -args.quantity, reason: args.reason, idempotencyKey: `recall-disposition:${args.idempotencyKey}`, requestFingerprint, organization: { connect: { id: recall.organization.id } }, location: { connect: { id: lot.location.id } }, product: { connect: { id: lot.product.id } }, lot: { connect: { id: lot.id } }, actor: { connect: { id: userId } }, approval: { connect: { id: approval.id } } }, query: "id" });
    await recordAudit(transactionContext, { eventKey: `recall.lot_disposed:${args.idempotencyKey}`, organizationId: recall.organization.id, locationId: lot.location.id, actorId: userId, eventType: "recall.lot_disposed", resourceType: "InventoryLot", resourceId: lot.id, metadata: { recallId: recall.id, movementId: movement.id, quantity: args.quantity, dispositionReference: args.dispositionReference.trim(), approvalId: approval.id } });
    return { success: true, reused: false, recallId: recall.id, lotId: lot.id, movementId: movement.id, status: "disposed" };
  });
}
async function closePharmacyRecall(_root, args, context) {
  requirePermission(context, "canManageRecalls");
  return withDomainTransaction(context, [`recall:${args.recallId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const recall = await sudo.query.Recall.findOne({ where: { id: args.recallId }, query: "id status organization { id } location { id } closedAt approval { id reason actionType } lots { id quantityQuarantined } exposures(take: 10000) { id status }" });
    if (!recall) throw new DomainError("Recall not found");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: recall.organization.id, locationId: recall.location?.id, organizationWide: !recall.location?.id });
    const candidateWhere = recallExposureMovementWhere((recall.lots || []).map((lot) => lot.id));
    const [candidateMovementCount, candidateMovements, exposureCount] = await Promise.all([
      sudo.query.InventoryMovement.count({ where: candidateWhere }),
      sudo.query.InventoryMovement.findMany({ where: candidateWhere, orderBy: { occurredAt: "asc" }, take: 1e4, query: "id" }),
      sudo.query.RecallExposure.count({ where: { recall: { id: { equals: recall.id } } } })
    ]);
    const candidateMovementIds = candidateMovements.map((movement) => movement.id);
    const linkedRows = candidateMovementIds.length ? await sudo.query.RecallExposure.findMany({ where: { recall: { id: { equals: recall.id } }, movement: { id: { in: candidateMovementIds } } }, take: 1e4, query: "id movement { id }" }) : [];
    const linkedMovementIds = linkedRows.map((entry) => entry.movement?.id).filter(Boolean);
    const reconciliation = assessRecallExposureReconciliation({ candidateMovementCount, linkedMovementIds, exposureCount, linkedExposureCount: linkedRows.length });
    const exposureReconciliationComplete = reconciliation.exposureReconciliationComplete && exposureCount === (recall.exposures || []).length;
    if (recall.status === "closed" && !exposureReconciliationComplete) throw new DomainError("Recall exposure reconciliation is incomplete; closure evidence requires operator review");
    if (recall.status === "closed" && (recall.approval?.actionType !== "recall_disposition" || recall.approval?.reason !== args.reason)) throw new DomainError("Recall closure replay does not match the recorded reason");
    if (recall.status === "closed") return { success: true, reused: true, recallId: recall.id, status: recall.status, approvalId: recall.approval?.id };
    if (!["quarantined", "resolved"].includes(recall.status)) throw new DomainError("Recall is not ready for closure");
    if (!exposureReconciliationComplete) throw new DomainError("Every sale/dispense movement must have a recorded exposure before recall closure");
    if (recall.lots.some((lot) => lot.quantityQuarantined > 0)) throw new DomainError("All quarantined lot quantities require recorded disposition before closure");
    if (recall.exposures.some((exposure) => !["returned", "resolved", "unable_to_reach"].includes(exposure.status))) throw new DomainError("Every dispensed exposure requires a resolved outreach record before closure");
    const approval = await createHumanApproval(transactionContext, { organizationId: recall.organization.id, locationId: recall.location?.id, actorId: userId, actionType: "recall_disposition", reason: args.reason, attested: args.attested, evidence: { recallId: recall.id, lotCount: recall.lots.length, exposureCount: recall.exposures.length, allDispositionRecorded: true } });
    await sudo.query.Recall.updateOne({ where: { id: recall.id }, data: { status: "closed", closedAt: (/* @__PURE__ */ new Date()).toISOString(), approval: { connect: { id: approval.id } } } });
    await recordAudit(transactionContext, { eventKey: `recall.closed:${recall.id}:${approval.id}`, organizationId: recall.organization.id, locationId: recall.location?.id, actorId: userId, eventType: "recall.closed", resourceType: "Recall", resourceId: recall.id, metadata: { approvalId: approval.id, lotCount: recall.lots.length, exposureCount: recall.exposures.length } });
    return { success: true, reused: false, recallId: recall.id, status: "closed", approvalId: approval.id };
  });
}

// features/keystone/mutations/redirectToInit.ts
async function redirectToInit(root, args, context) {
  const userCount = await context.sudo().query.User.count({});
  if (userCount === 0) {
    return true;
  }
  return false;
}
var redirectToInit_default = redirectToInit;

// features/keystone/mutations/updateActiveUser.ts
async function updateActiveUser(_root, { data, oldPassword }, context) {
  const sudoContext = context.sudo();
  const session = context.session;
  if (!session?.itemId) {
    throw new DomainError("Not authenticated");
  }
  const existingUser = await sudoContext.query.User.findOne({
    where: { id: session.itemId },
    query: "id email"
  });
  if (!existingUser) {
    throw new DomainError("User not found");
  }
  const emailChanged = data.email != null && data.email.trim().toLowerCase() !== String(existingUser.email).toLowerCase();
  if ((data.password || emailChanged) && !oldPassword) {
    throw new DomainError("Enter your current password");
  }
  if (data.password || emailChanged) {
    const result = await sudoContext.graphql.raw({
      query: `
        mutation VerifyPassword($email: String!, $password: String!) {
          authenticateUserWithPassword(email: $email, password: $password) {
            __typename
          }
        }
      `,
      variables: { email: existingUser.email, password: oldPassword }
    });
    if (result.data?.authenticateUserWithPassword?.__typename !== "UserAuthenticationWithPasswordSuccess") {
      throw new DomainError("Current password is incorrect");
    }
  }
  const update = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => ["email", "name", "password", "onboardingStatus"].includes(key) && value != null)
  );
  return sudoContext.db.User.updateOne({
    where: { id: session.itemId },
    data: update
  });
}
var updateActiveUser_default = updateActiveUser;

// features/platform/onboarding/lib/seed.json
var seed_default = {
  organization: {
    name: "Cedar & Elm Pharmacy",
    slug: "cedar-elm-community-pharmacy",
    storefrontKey: "cedar-elm",
    operatorDisplayName: "Cedar & Elm Pharmacy",
    operatorTagline: "Care, close to home",
    brandPrimaryColor: "#18352b",
    brandAccentColor: "#8ec9ad",
    logoIcon: '<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="18" fill="#1570ef" r="14"/><circle cx="26" cy="30" fill="#53b1fd" r="14"/></svg>',
    logoColor: "295",
    supportEmail: "hello@pharmacy.openship.org",
    supportPhone: "(212) 555-0142"
  },
  cashPolicy: {
    taxRateBps: 0,
    policyReference: "Standard cash policy"
  },
  location: {
    name: "Cedar & Elm \u2014 Upper West Side",
    code: "CEDAR-ELM-MAIN-001",
    timezone: "America/New_York",
    phone: "(212) 555-0142",
    address: {
      line1: "247 West 72nd Street",
      city: "New York",
      region: "NY",
      postalCode: "10023",
      countryCode: "US"
    },
    hours: {
      store: [
        null,
        {
          open: "09:00",
          close: "19:00"
        },
        {
          open: "09:00",
          close: "19:00"
        },
        {
          open: "09:00",
          close: "19:00"
        },
        {
          open: "09:00",
          close: "19:00"
        },
        {
          open: "09:00",
          close: "19:00"
        },
        {
          open: "09:00",
          close: "17:00"
        }
      ],
      pharmacy: [
        null,
        {
          open: "09:00",
          close: "19:00"
        },
        {
          open: "09:00",
          close: "19:00"
        },
        {
          open: "09:00",
          close: "19:00"
        },
        {
          open: "09:00",
          close: "19:00"
        },
        {
          open: "09:00",
          close: "19:00"
        },
        {
          open: "09:00",
          close: "17:00"
        }
      ]
    }
  },
  paymentProviders: [
    {
      profile: "full",
      name: "Stripe",
      code: "pp_stripe_stripe",
      isInstalled: false,
      createPaymentFunction: "stripe",
      capturePaymentFunction: "stripe",
      refundPaymentFunction: "stripe",
      getPaymentStatusFunction: "stripe",
      generatePaymentLinkFunction: "stripe",
      handleWebhookFunction: "stripe"
    },
    {
      profile: "minimal",
      name: "Pay at pickup",
      code: "pp_system_default",
      isInstalled: true,
      createPaymentFunction: "manual",
      capturePaymentFunction: "manual",
      refundPaymentFunction: "manual",
      getPaymentStatusFunction: "manual",
      generatePaymentLinkFunction: "manual",
      handleWebhookFunction: "manual"
    }
  ],
  integrationProviders: [
    {
      code: "int_erx",
      name: "eRx",
      providerType: "erx"
    },
    {
      code: "int_wholesaler",
      name: "Wholesaler",
      providerType: "wholesaler"
    },
    {
      code: "int_insurance",
      name: "Insurance",
      providerType: "insurance"
    },
    {
      code: "int_tax",
      name: "Tax",
      providerType: "tax"
    }
  ],
  suppliers: [
    {
      profile: "minimal",
      name: "Northeast Pharmaceutical Supply",
      accountReference: "NPS-20418",
      status: "active"
    },
    {
      profile: "full",
      name: "Harbor Medical Distributors",
      accountReference: "HMD-7731",
      status: "active"
    }
  ],
  drugReferences: [
    {
      ndc11: "99999050001",
      proprietaryName: "Amoxicillin (sample)",
      genericName: "amoxicillin",
      labelerName: "Sample labeler",
      dosageForm: "capsule",
      route: "oral",
      strength: "500 mg"
    }
  ],
  products: [
    {
      profile: "minimal",
      title: "Pain Relief Tablets",
      handle: "pain-relief-tablets",
      sku: "OTC-PAIN-001",
      description: "500 mg acetaminophen tablets for temporary relief of minor aches and fever. 100 count.",
      category: "otc_medication",
      prescriptionRequirement: "none",
      priceAmount: 899,
      imageUrl: "https://images.unsplash.com/photo-1519161720427-f7711f9efce3?auto=format&fit=crop&w=900&q=80"
    },
    {
      profile: "minimal",
      title: "24-Hour Allergy Relief",
      handle: "allergy-relief-tablets",
      sku: "OTC-ALLERGY-001",
      description: "Once-daily cetirizine tablets for indoor and outdoor allergy symptoms. 30 count.",
      category: "allergy",
      prescriptionRequirement: "none",
      priceAmount: 1299,
      imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=900&q=80"
    },
    {
      profile: "full",
      title: "Heartburn Relief Tablets",
      handle: "heartburn-relief-tablets",
      sku: "OTC-DIGEST-001",
      description: "Acid reducer tablets for heartburn relief. 25 count.",
      category: "digestive_health",
      prescriptionRequirement: "none",
      priceAmount: 1099,
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80"
    },
    {
      profile: "full",
      title: "Complete First Aid Kit",
      handle: "complete-first-aid-kit",
      sku: "AID-001",
      description: "A compact home first-aid kit with bandages, gauze, tape, wipes, and gloves.",
      category: "first_aid",
      prescriptionRequirement: "none",
      priceAmount: 2499,
      imageUrl: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=900&q=80"
    },
    {
      profile: "full",
      title: "Digital Thermometer",
      handle: "digital-thermometer",
      sku: "DEV-TEMP-001",
      description: "Fast-read oral digital thermometer with storage case.",
      category: "health_devices",
      prescriptionRequirement: "none",
      priceAmount: 1499,
      imageUrl: "https://images.unsplash.com/photo-1609725236589-d987ffc8133a?auto=format&fit=crop&w=900&q=80"
    },
    {
      profile: "full",
      title: "Saline Nasal Spray",
      handle: "saline-nasal-spray",
      sku: "OTC-COLD-001",
      description: "Drug-free moisturizing saline mist for dry nasal passages. 3 fl oz.",
      category: "cold_and_flu",
      prescriptionRequirement: "none",
      priceAmount: 699,
      imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80"
    },
    {
      profile: "full",
      title: "Sensitive Skin Adhesive Bandages",
      handle: "sensitive-skin-bandages",
      sku: "AID-BANDAGE-001",
      description: "Flexible assorted-size bandages with gentle adhesive. 40 count.",
      category: "first_aid",
      prescriptionRequirement: "none",
      priceAmount: 749,
      imageUrl: "https://images.unsplash.com/photo-1609840534195-e6385ca0d10a?auto=format&fit=crop&w=900&q=80"
    },
    {
      profile: "full",
      title: "Daily Multivitamin",
      handle: "daily-multivitamin",
      sku: "VIT-MULTI-001",
      description: "Once-daily multivitamin tablets for adults. 90 count.",
      category: "vitamins",
      prescriptionRequirement: "none",
      priceAmount: 1599,
      imageUrl: "https://images.unsplash.com/photo-1763667926453-6a992d38ac43?auto=format&fit=crop&w=900&q=80"
    },
    {
      profile: "full",
      title: "Amoxicillin 500 mg Capsules",
      handle: "amoxicillin-500-mg-capsules",
      sku: "RX-AMOX-500",
      description: "Sample prescription item for trying the dispensing workflow.",
      category: "prescription",
      prescriptionRequirement: "prescription_required",
      priceAmount: 1299,
      ndc11: "99999050001"
    }
  ],
  lots: [
    {
      lotNumber: "LOT-OTC-PAIN-001",
      sku: "OTC-PAIN-001",
      quantity: 80,
      expirationOffsetDays: 365,
      coldChainRequired: false
    },
    {
      lotNumber: "LOT-OTC-ALLERGY-001",
      sku: "OTC-ALLERGY-001",
      quantity: 60,
      expirationOffsetDays: 300,
      coldChainRequired: false
    },
    {
      lotNumber: "LOT-OTC-DIGEST-001",
      sku: "OTC-DIGEST-001",
      quantity: 45,
      expirationOffsetDays: 330,
      coldChainRequired: false
    },
    {
      lotNumber: "LOT-AID-001",
      sku: "AID-001",
      quantity: 25,
      expirationOffsetDays: 540,
      coldChainRequired: false
    },
    {
      lotNumber: "LOT-DEV-TEMP-001",
      sku: "DEV-TEMP-001",
      quantity: 20,
      expirationOffsetDays: 720,
      coldChainRequired: false
    },
    {
      lotNumber: "LOT-OTC-COLD-001",
      sku: "OTC-COLD-001",
      quantity: 35,
      expirationOffsetDays: 420,
      coldChainRequired: false
    },
    {
      lotNumber: "LOT-AID-BANDAGE-001",
      sku: "AID-BANDAGE-001",
      quantity: 50,
      expirationOffsetDays: 600,
      coldChainRequired: false
    },
    {
      lotNumber: "LOT-VIT-MULTI-001",
      sku: "VIT-MULTI-001",
      quantity: 40,
      expirationOffsetDays: 450,
      coldChainRequired: false
    },
    {
      lotNumber: "LOT-RX-AMOX-500-001",
      sku: "RX-AMOX-500",
      quantity: 200,
      expirationOffsetDays: 540,
      coldChainRequired: false
    }
  ],
  patients: [
    {
      patientNumber: "P-1001",
      firstName: "Jordan",
      lastName: "Morgan",
      phone: "(212) 555-0199",
      preferredContactMethod: "phone",
      ageYears: 38
    },
    {
      patientNumber: "P-1002",
      firstName: "Priya",
      lastName: "Raman",
      phone: "(212) 555-0174",
      preferredContactMethod: "sms",
      ageYears: 52
    },
    {
      patientNumber: "P-1003",
      firstName: "Marcus",
      lastName: "Bell",
      phone: "(212) 555-0163",
      preferredContactMethod: "phone",
      ageYears: 67
    }
  ],
  prescribers: [
    {
      name: "Dr. Elena Ruiz, MD",
      phone: "(212) 555-0110",
      fax: "(212) 555-0111",
      npi: "1234567893"
    },
    {
      name: "Dr. Samuel Okafor, DO",
      phone: "(212) 555-0120",
      fax: "(212) 555-0121"
    }
  ]
};

// features/keystone/mutations/runPharmacyOnboarding.ts
var ONBOARDING_STATUSES = ["not_started", "in_progress", "completed", "dismissed"];
async function pharmacyOnboardingState(_root, _args, context) {
  const userId = context.session?.itemId;
  if (!userId) throw new DomainError("Authentication required");
  const user = await context.sudo().query.User.findOne({ where: { id: userId }, query: "id onboardingStatus" });
  if (!user) throw new DomainError("Authenticated user not found");
  return { userId: user.id, status: user.onboardingStatus || "not_started", canManageOnboarding: permissions.canManageOnboarding({ session: context.session }) };
}
async function setPharmacyOnboardingStatus(_root, args, context) {
  const userId = context.session?.itemId;
  if (!userId) throw new DomainError("Authentication required");
  if (!ONBOARDING_STATUSES.includes(args.status)) throw new DomainError("Invalid onboarding status");
  const user = await context.sudo().query.User.updateOne({ where: { id: userId }, data: { onboardingStatus: args.status }, query: "id onboardingStatus" });
  return { userId: user.id, status: user.onboardingStatus || args.status };
}
function relativeDate(days) {
  const value = /* @__PURE__ */ new Date();
  value.setUTCDate(value.getUTCDate() + days);
  value.setUTCHours(12, 0, 0, 0);
  return value.toISOString();
}
function birthDate(yearsAgo) {
  const value = /* @__PURE__ */ new Date();
  value.setUTCFullYear(value.getUTCFullYear() - yearsAgo);
  value.setUTCMonth(0, 15);
  value.setUTCHours(12, 0, 0, 0);
  return value.toISOString();
}
function requestStorefrontHost(context) {
  const host = context.req?.headers?.host;
  if (typeof host !== "string" || !host.trim()) return null;
  try {
    const normalized = normalizeStorefrontTenantKey(host);
    return ["localhost", "127.0.0.1", "::1"].includes(normalized) ? null : normalized;
  } catch {
    return null;
  }
}
var forTemplate = (entries, template) => (entries || []).filter((entry) => template === "full" || entry.profile !== "full");
var withoutProfile = ({ profile: _profile, ...entry }) => entry;
async function runPharmacyOnboarding(_root, args, context) {
  const userId = context.session?.itemId;
  if (!userId || !permissions.canManageOnboarding({ session: context.session })) throw new DomainError("You do not have permission to run onboarding");
  const template = args.template === "minimal" ? "minimal" : "full";
  const seed = seed_default;
  const products = forTemplate(seed.products, template);
  const selectedSkus = new Set(products.map((product) => product.sku));
  const lots = (seed.lots || []).filter((lot) => selectedSkus.has(lot.sku));
  const paymentProviders = forTemplate(seed.paymentProviders, template);
  const suppliers = forTemplate(seed.suppliers, template);
  const patients = template === "full" ? seed.patients || [] : [];
  const prescribers = template === "full" ? seed.prescribers || [] : [];
  const storefrontHost = requestStorefrontHost(context) || seed.organization.slug;
  return withDomainTransaction(context, [`onboarding:${userId}`, `onboarding-store:${seed.organization.slug}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const [memberships, existingOrganizations, existingLocations] = await Promise.all([
      sudo.query.OrganizationMembership.findMany({ where: { user: { id: { equals: userId } } }, query: "id status location { id } organization { id }" }),
      sudo.query.Organization.findMany({ where: { OR: [{ slug: { equals: seed.organization.slug } }, { storefrontKey: { equals: seed.organization.storefrontKey } }, { storefrontHost: { equals: storefrontHost } }] }, take: 1, query: "id" }),
      sudo.query.PharmacyLocation.findMany({ where: { code: { equals: seed.location.code } }, take: 1, query: "id organization { id }" })
    ]);
    const organizationConflict = existingOrganizations[0];
    const locationConflict = existingLocations[0];
    const ownerMembership = organizationConflict ? memberships.find((entry) => entry.organization?.id === organizationConflict.id && !entry.location && entry.status === "active") : null;
    if (ownerMembership && organizationConflict) {
      await sudo.query.User.updateOne({ where: { id: userId }, data: { onboardingStatus: "completed" }, query: "id" });
      const [productCount, lotCount, patientCount, prescriberCount, supplierCount, paymentProviderCount] = await Promise.all([
        sudo.query.Product.count({ where: { organization: { id: { equals: organizationConflict.id } } } }),
        sudo.query.InventoryLot.count({ where: { product: { organization: { id: { equals: organizationConflict.id } } } } }),
        sudo.query.PatientProfile.count({ where: { organizations: { some: { id: { equals: organizationConflict.id } } } } }),
        sudo.query.Prescriber.count({ where: { organization: { id: { equals: organizationConflict.id } } } }),
        sudo.query.Supplier.count({ where: { organization: { id: { equals: organizationConflict.id } } } }),
        sudo.query.PaymentProvider.count({ where: { organization: { id: { equals: organizationConflict.id } } } })
      ]);
      return {
        completed: true,
        reused: true,
        template,
        organizationId: organizationConflict.id,
        locationId: locationConflict?.organization?.id === organizationConflict.id ? locationConflict.id : null,
        counts: { drugReferences: 0, paymentProviders: paymentProviderCount, suppliers: supplierCount, products: productCount, lots: lotCount, patients: patientCount, prescribers: prescriberCount, prescriptions: 0 }
      };
    }
    if (memberships.some((entry) => entry.status === "active") || organizationConflict || locationConflict) {
      throw new DomainError("Store data already exists. Onboarding can only run on a new installation.");
    }
    const organization = await sudo.query.Organization.createOne({
      data: {
        logoIcon: DEFAULT_STORE_LOGO_ICON,
        logoColor: DEFAULT_STORE_LOGO_COLOR,
        ...seed.organization,
        storefrontHost,
        status: "active",
        cashSalesEnabled: true,
        cashTaxRateBps: seed.cashPolicy?.taxRateBps ?? 0,
        cashTaxPolicyReference: seed.cashPolicy?.policyReference,
        cashPolicyReviewedAt: (/* @__PURE__ */ new Date()).toISOString(),
        cashPolicyReviewedBy: { connect: { id: userId } }
      },
      query: "id"
    });
    const connectOrganization = { connect: { id: organization.id } };
    await sudo.query.OrganizationMembership.createOne({
      data: { user: { connect: { id: userId } }, organization: connectOrganization, status: "active", membershipRole: "owner" },
      query: "id"
    });
    const location = await sudo.query.PharmacyLocation.createOne({
      data: { ...seed.location, status: "active", organization: connectOrganization, onlineOrderingEnabled: true, pickupEnabled: true, deliveryEnabled: false },
      query: "id"
    });
    const connectLocation = { connect: { id: location.id } };
    for (const provider of paymentProviders) {
      await sudo.query.PaymentProvider.createOne({ data: { ...withoutProfile(provider), organization: connectOrganization }, query: "id" });
    }
    for (const provider of seed.integrationProviders || []) {
      await sudo.query.IntegrationProvider.createOne({
        data: { ...provider, status: "unconfigured", submitFunction: "unconfigured", statusFunction: "unconfigured", webhookFunction: "unconfigured", externalValidationComplete: false, organization: connectOrganization },
        query: "id"
      });
    }
    const supplierIds = [];
    for (const supplier of suppliers) {
      const created = await sudo.query.Supplier.createOne({ data: { ...withoutProfile(supplier), organization: connectOrganization }, query: "id" });
      supplierIds.push(created.id);
    }
    const references = /* @__PURE__ */ new Map();
    for (const entry of seed.drugReferences || []) {
      const existing = await sudo.query.DrugReference.findOne({ where: { ndc11: entry.ndc11 }, query: "id" });
      const reference = existing || await sudo.query.DrugReference.createOne({ data: entry, query: "id" });
      references.set(entry.ndc11, reference.id);
    }
    const productIds = /* @__PURE__ */ new Map();
    for (const entry of products) {
      const product = await sudo.query.Product.createOne({
        data: {
          title: entry.title,
          handle: entry.handle,
          sku: entry.sku,
          category: entry.category,
          description: entry.description,
          prescriptionRequirement: entry.prescriptionRequirement,
          priceAmount: entry.priceAmount,
          imageUrl: entry.imageUrl,
          status: "published",
          onlineAvailable: entry.prescriptionRequirement === "none",
          posAvailable: true,
          organization: connectOrganization,
          location: connectLocation,
          ...entry.ndc11 && references.get(entry.ndc11) ? { drugReference: { connect: { id: references.get(entry.ndc11) } } } : {}
        },
        query: "id"
      });
      productIds.set(entry.sku, product.id);
    }
    for (const entry of lots) {
      const productId = productIds.get(entry.sku);
      if (!productId) throw new DomainError(`Product ${entry.sku} is missing for lot ${entry.lotNumber}`);
      const lot = await sudo.query.InventoryLot.createOne({
        data: {
          lotNumber: entry.lotNumber,
          product: { connect: { id: productId } },
          location: connectLocation,
          ...supplierIds[0] ? { supplier: { connect: { id: supplierIds[0] } } } : {},
          expirationDate: relativeDate(entry.expirationOffsetDays),
          quantityReceived: entry.quantity,
          quantityAvailable: entry.quantity,
          quantityQuarantined: 0,
          status: "available",
          storageBin: `MAIN-${entry.sku}`,
          coldChainRequired: entry.coldChainRequired,
          coldChainEvidenceComplete: !entry.coldChainRequired
        },
        query: "id"
      });
      await sudo.query.InventoryMovement.createOne({
        data: {
          movementType: "receive",
          quantityDelta: entry.quantity,
          reason: "Opening stock",
          idempotencyKey: `onboarding:${organization.id}:lot:${lot.id}`,
          occurredAt: (/* @__PURE__ */ new Date()).toISOString(),
          organization: connectOrganization,
          location: connectLocation,
          product: { connect: { id: productId } },
          lot: { connect: { id: lot.id } },
          actor: { connect: { id: userId } }
        },
        query: "id"
      });
    }
    for (const { ageYears, ...patient } of patients) {
      await sudo.query.PatientProfile.createOne({
        data: { ...patient, dateOfBirth: birthDate(ageYears || 40), status: "active", organizations: { connect: [{ id: organization.id }] } },
        query: "id"
      });
    }
    for (const prescriber of prescribers) {
      await sudo.query.Prescriber.createOne({
        data: { ...prescriber, verificationStatus: "unverified", organization: connectOrganization },
        query: "id"
      });
    }
    await sudo.query.User.updateOne({ where: { id: userId }, data: { onboardingStatus: "completed" }, query: "id" });
    const counts = {
      drugReferences: references.size,
      paymentProviders: paymentProviders.length,
      suppliers: suppliers.length,
      products: products.length,
      lots: lots.length,
      patients: patients.length,
      prescribers: prescribers.length,
      prescriptions: 0
    };
    await recordAudit(transactionContext, {
      eventKey: `onboarding.completed:${organization.id}`,
      organizationId: organization.id,
      locationId: location.id,
      actorId: userId,
      eventType: "onboarding.completed",
      resourceType: "Organization",
      resourceId: organization.id,
      metadata: { template, ...counts }
    });
    return { completed: true, reused: false, template, organizationId: organization.id, locationId: location.id, counts };
  });
}

// features/keystone/mutations/submitPharmacyOrder.ts
var import_node_crypto19 = require("node:crypto");
var CHECKOUT_CONSENT = {
  policyVersion: "2026-07-18",
  statementKey: "openfront_pharmacy_checkout_privacy_acknowledgement_v1"
};
function requireCheckoutConsent(input) {
  if (!input.privacyConsentAccepted) throw new DomainError("Privacy acknowledgement is required");
  if (input.policyVersion !== CHECKOUT_CONSENT.policyVersion || input.statementKey !== CHECKOUT_CONSENT.statementKey) {
    throw new DomainError("Privacy acknowledgement does not match the current policy");
  }
}
function normalizedEmail(value) {
  const email = value.trim().toLowerCase();
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DomainError("A valid email address is required");
  return email;
}
var ORDER_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function orderNumber() {
  const code = [...(0, import_node_crypto19.randomBytes)(8)].map((byte) => ORDER_ALPHABET[byte % ORDER_ALPHABET.length]).join("");
  return `RXO-${code.slice(0, 4)}-${code.slice(4)}`;
}
function checkoutReplay(cart, idempotencyKey, guestToken) {
  if (!cart.order || cart.order.idempotencyKey !== idempotencyKey) throw new DomainError("Cart was already submitted with another idempotency key");
  return {
    success: true,
    reused: true,
    orderId: cart.order.id,
    orderNumber: cart.order.orderNumber,
    status: cart.order.status,
    fulfillmentStatus: cart.order.fulfillment?.status || "pending",
    totalAmount: cart.order.totalAmount,
    currencyCode: cart.order.currencyCode,
    guestOrderToken: guestToken
  };
}
async function submitPharmacyOrder(_root, args, context) {
  const input = args.input;
  if (!["pickup", "delivery", "pos"].includes(input.fulfillmentMethod)) throw new DomainError("Fulfillment method is invalid");
  requireCheckoutConsent(input);
  const idempotencyKey = input.idempotencyKey?.trim();
  if (!idempotencyKey || idempotencyKey.length > 200) throw new DomainError("A bounded idempotency key is required");
  const email = normalizedEmail(input.email);
  const customerName = input.customerName?.trim().replace(/\s+/g, " ") || "";
  if (customerName.length > 120 || !customerName && input.fulfillmentMethod !== "pos") throw new DomainError(input.fulfillmentMethod === "delivery" ? "Enter the name for delivery" : "Enter the name for pickup");
  const shippingAddress = input.fulfillmentMethod === "delivery" ? input.shippingAddress || null : null;
  if (input.fulfillmentMethod === "delivery" && !shippingAddress) throw new DomainError("A delivery address is required");
  const cart = await loadAndAssertCartAccess(context, input.cartId, input.guestToken, { allowSubmitted: true });
  const replayToken = context.session?.itemId ? null : createGuestOrderToken(cart.id, idempotencyKey);
  if (cart.status === "submitted") return checkoutReplay(cart, idempotencyKey, replayToken);
  if (input.fulfillmentMethod === "pos") {
    requirePermission(context, "canManageOrders");
    await requireTenantMembership(context, { organizationId: cart.organization.id, locationId: cart.location.id });
  }
  if (!cart.items.length) throw new DomainError("Cart is empty");
  if (input.fulfillmentMethod === "pickup" && !cart.location.pickupEnabled) throw new DomainError("Pickup is not enabled at this location");
  if (input.fulfillmentMethod === "delivery" && !cart.location.deliveryEnabled) throw new DomainError("Delivery is not available at this location");
  if (input.fulfillmentMethod === "pos" && !context.session?.itemId) throw new DomainError("Point-of-sale checkout requires an authenticated staff session");
  const paymentSession = cart.paymentSessions.find((session) => session.id === input.paymentSessionId);
  if (!paymentSession?.isSelected || !paymentSession.provider?.isInstalled) throw new DomainError("Selected payment session not found for this cart");
  if (paymentSession.amount !== cart.totalAmount) throw new DomainError("Payment amount does not match cart total");
  const paymentId = paymentSession.externalPaymentId || paymentSession.data?.paymentIntentId || paymentSession.data?.orderId;
  if (!paymentId) throw new DomainError("Payment session is missing provider payment id");
  const provider = await context.sudo().query.PaymentProvider.findOne({ where: { id: paymentSession.provider.id }, query: PAYMENT_PROVIDER_ADAPTER_FIELDS });
  if (!provider?.isInstalled) throw new DomainError("Selected payment session not found for this cart");
  const manualTender = isManualPaymentProvider(provider);
  if (manualTender && input.fulfillmentMethod === "delivery") throw new DomainError("Delivery orders are paid online. Choose card payment.");
  const paymentStatus = manualTender ? { status: "pending" } : await getPaymentStatus({ provider, paymentId });
  if (!manualTender && !["captured", "succeeded"].includes(paymentStatus.status)) throw new DomainError(`Payment is not settled: ${paymentStatus.status || "unknown"}`);
  await withDomainTransaction(context, [`payment-session:${paymentSession.id}`], async (transactionContext) => {
    await transactionContext.sudo().query.PaymentSession.updateOne({
      where: { id: paymentSession.id },
      data: {
        status: manualTender ? "pending" : "settled_unordered",
        reconciliationStatus: manualTender ? "pending" : "settled_unordered",
        externalPaymentId: paymentId,
        reconciliationAttempts: 1,
        lastReconciledAt: (/* @__PURE__ */ new Date()).toISOString(),
        failureReason: null
      }
    });
  });
  const productIds = [...new Set(cart.items.map((item) => item.product.id))];
  try {
    return await withDomainTransaction(context, [`cart:${cart.id}`, ...productIds.map((id) => `product:${id}`)], async (transactionContext) => {
      const sudo = transactionContext.sudo();
      const transactionLots = await sudo.query.InventoryLot.findMany({
        where: { product: { id: { in: productIds } }, location: { id: { equals: cart.location.id } } },
        query: "id"
      });
      await acquireTransactionLocks(transactionContext, transactionLots.map((lot) => `lot:${lot.id}`));
      const accessCart = await loadAndAssertCartAccess(transactionContext, input.cartId, input.guestToken, { allowSubmitted: true });
      if (accessCart.status === "submitted") return checkoutReplay(accessCart, idempotencyKey, replayToken);
      const current = await sudo.query.Cart.findOne({
        where: { id: cart.id },
        query: `
        id status subtotalAmount taxAmount deliveryAmount totalAmount
        organization { id } location { id }
        customer { id patientProfile { id } }
        items {
          id quantity unitPriceAmount
          product {
            id title sku handle status onlineAvailable prescriptionRequirement priceAmount currencyCode imageUrl image { id extension } taxable
            drugReference { ndc11 }
            inventoryLots(orderBy: { expirationDate: asc }) {
              id lotNumber expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete status
              recalls { status }
              location { id }
            }
          }
        }
      `
      });
      if (!current || current.status !== "active" || !current.items.length) throw new DomainError("Cart is no longer available");
      for (const item of current.items) {
        if (item.product.prescriptionRequirement !== "none") throw new DomainError("Prescription products require the authorized prescription workflow");
        if (item.product.status !== "published" || !item.product.onlineAvailable) throw new DomainError(`${item.product.title} is no longer available`);
        if (item.unitPriceAmount !== item.product.priceAmount) throw new DomainError("Product price changed; review the cart before checkout");
      }
      const totals = calculateCartTotals(current.items, current.taxAmount, current.deliveryAmount);
      if (totals.totalAmount !== current.totalAmount) throw new DomainError("Cart total changed; review the cart before checkout");
      const createdOrder = await sudo.query.Order.createOne({
        data: {
          orderNumber: orderNumber(),
          idempotencyKey,
          guestTokenHash: replayToken ? hashGuestCartToken(replayToken) : void 0,
          checkoutEvidence: {
            policyVersion: input.policyVersion,
            statementKey: input.statementKey,
            acceptedAt: (/* @__PURE__ */ new Date()).toISOString(),
            captureMethod: "storefront_checkout",
            idempotencyKey
          },
          email,
          phone: input.phone?.trim() || void 0,
          customerName: customerName || void 0,
          status: "processing",
          fulfillmentMethod: input.fulfillmentMethod,
          subtotalAmount: totals.subtotalAmount,
          taxAmount: totals.taxAmount,
          deliveryAmount: totals.deliveryAmount,
          totalAmount: totals.totalAmount,
          currencyCode: current.items[0].product.currencyCode,
          pickupAt: input.pickupAt || void 0,
          deliveryWindow: input.deliveryWindow || void 0,
          shippingAddressSnapshot: shippingAddress || void 0,
          organization: { connect: { id: current.organization.id } },
          location: { connect: { id: current.location.id } },
          customer: current.customer?.id ? { connect: { id: current.customer.id } } : void 0,
          patient: current.customer?.patientProfile?.id ? { connect: { id: current.customer.patientProfile.id } } : void 0,
          cart: { connect: { id: current.id } }
        },
        query: "id orderNumber"
      });
      for (const item of current.items) {
        let remaining = item.quantity;
        const allocations = [];
        for (const lot of item.product.inventoryLots) {
          if (remaining === 0) break;
          if (lot.location?.id !== current.location.id || !isLotEligible(lot)) continue;
          const available = eligibleLotQuantity(lot);
          const allocated = Math.min(remaining, available);
          if (!allocated) continue;
          await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { quantityAvailable: lot.quantityAvailable - allocated } });
          await sudo.query.InventoryMovement.createOne({
            data: {
              movementType: "sale",
              quantityDelta: -allocated,
              reason: `Order ${createdOrder.orderNumber}`,
              idempotencyKey: `order:${createdOrder.id}:lot:${lot.id}`,
              organization: { connect: { id: current.organization.id } },
              location: { connect: { id: current.location.id } },
              product: { connect: { id: item.product.id } },
              lot: { connect: { id: lot.id } },
              actor: context.session?.itemId ? { connect: { id: context.session.itemId } } : void 0
            }
          });
          allocations.push({ lotId: lot.id, lotNumber: lot.lotNumber, quantity: allocated, expirationDate: lot.expirationDate });
          remaining -= allocated;
        }
        if (remaining > 0) throw new DomainError(`Insufficient eligible lot inventory for ${item.product.title}`);
        await sudo.query.OrderLineItem.createOne({
          data: {
            order: { connect: { id: createdOrder.id } },
            product: { connect: { id: item.product.id } },
            title: item.product.title,
            sku: item.product.sku,
            ndc11Snapshot: item.product.drugReference?.ndc11 || void 0,
            quantity: item.quantity,
            unitPriceAmount: item.unitPriceAmount,
            lineTotalAmount: item.unitPriceAmount * item.quantity,
            imageUrl: productPhotoSnapshot(item.product),
            prescriptionRequirementSnapshot: item.product.prescriptionRequirement,
            metadata: { productId: item.product.id, handle: item.product.handle },
            lotAllocationSnapshot: allocations
          }
        });
      }
      const fulfillment = await sudo.query.Fulfillment.createOne({
        data: {
          method: input.fulfillmentMethod,
          status: "preparing",
          organization: { connect: { id: current.organization.id } },
          location: { connect: { id: current.location.id } },
          order: { connect: { id: createdOrder.id } }
        },
        query: "id"
      });
      await sudo.query.Payment.createOne({
        data: {
          amount: totals.totalAmount,
          currencyCode: current.items[0].product.currencyCode,
          status: manualTender ? "pending" : "captured",
          externalPaymentId: paymentId,
          processedAt: manualTender ? void 0 : (/* @__PURE__ */ new Date()).toISOString(),
          data: { providerStatus: paymentStatus.status },
          organization: { connect: { id: current.organization.id } },
          location: { connect: { id: current.location.id } },
          order: { connect: { id: createdOrder.id } },
          provider: { connect: { id: paymentSession.provider.id } },
          session: { connect: { id: paymentSession.id } }
        }
      });
      await sudo.query.PaymentSession.updateOne({ where: { id: paymentSession.id }, data: { status: manualTender ? "pending" : "captured", reconciliationStatus: "ordered", failureReason: null, lastReconciledAt: (/* @__PURE__ */ new Date()).toISOString() } });
      for (const item of current.items) await sudo.query.CartItem.deleteOne({ where: { id: item.id } });
      await sudo.query.Cart.updateOne({ where: { id: current.id }, data: { status: "submitted" } });
      if (current.customer?.patientProfile?.id) {
        const consent = await sudo.query.ConsentRecord.createOne({
          data: {
            consentType: "privacy_notice",
            policyVersion: input.policyVersion,
            statementKey: input.statementKey,
            accepted: true,
            captureMethod: "storefront_checkout",
            patient: { connect: { id: current.customer.patientProfile.id } },
            actor: current.customer.id ? { connect: { id: current.customer.id } } : void 0,
            order: { connect: { id: createdOrder.id } },
            evidence: { fulfillmentMethod: input.fulfillmentMethod, idempotencyKey }
          },
          query: "id"
        });
        await sudo.query.Order.updateOne({ where: { id: createdOrder.id }, data: { consent: { connect: { id: consent.id } } } });
      }
      await recordAudit(transactionContext, {
        eventKey: `order.submitted:${idempotencyKey}`,
        organizationId: current.organization.id,
        locationId: current.location.id,
        actorId: context.session?.itemId,
        patientId: current.customer?.patientProfile?.id,
        eventType: "order.submitted",
        resourceType: "Order",
        resourceId: createdOrder.id,
        metadata: { fulfillmentMethod: input.fulfillmentMethod, fulfillmentId: fulfillment.id, totalAmount: totals.totalAmount }
      });
      return {
        success: true,
        reused: false,
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        status: "processing",
        fulfillmentStatus: "preparing",
        totalAmount: totals.totalAmount,
        currencyCode: current.items[0].product.currencyCode,
        guestOrderToken: replayToken
      };
    });
  } catch (error) {
    const completedCart = await context.sudo().query.Cart.findOne({
      where: { id: cart.id },
      query: "id status order { id orderNumber idempotencyKey status totalAmount currencyCode fulfillment { status } }"
    });
    if (completedCart?.status === "submitted" && completedCart.order) {
      if (completedCart.order.idempotencyKey === idempotencyKey) return checkoutReplay({ ...cart, order: completedCart.order }, idempotencyKey, replayToken);
      throw new DomainError("Cart was committed by another checkout request; payment remains bound to the committed order");
    }
    const recoveryState = await context.sudo().query.PaymentSession.findOne({
      where: { id: paymentSession.id },
      query: "id payment { id order { id } } cart { order { id } }"
    });
    if (recoveryState?.payment?.order?.id || recoveryState?.cart?.order?.id) {
      throw new DomainError("Payment is already bound to a committed order and cannot be compensated");
    }
    if (manualTender) throw error;
    let compensation = null;
    let compensationError = null;
    try {
      compensation = await refundPayment({
        provider,
        paymentId,
        amount: cart.totalAmount,
        currency: cart.items[0]?.product?.currencyCode || "USD",
        idempotencyKey: `checkout-compensation:${paymentSession.id}`
      });
      if (!["refunded", "succeeded"].includes(compensation?.status)) throw new DomainError(`Provider returned ${compensation?.status || "unknown"}`);
    } catch (cause) {
      compensationError = cause;
    }
    await withDomainTransaction(context, [`payment-session:${paymentSession.id}`], async (transactionContext) => {
      await transactionContext.sudo().query.PaymentSession.updateOne({
        where: { id: paymentSession.id },
        data: {
          status: compensationError ? "compensation_pending" : "compensated",
          reconciliationStatus: compensationError ? "compensation_pending" : "compensated",
          failureReason: compensationError ? `Order creation failed: ${error instanceof Error ? error.message : "unknown"}; compensation failed: ${compensationError instanceof Error ? compensationError.message : "unknown"}`.slice(0, 2e3) : `Order creation failed and payment was compensated: ${error instanceof Error ? error.message : "unknown"}`.slice(0, 2e3),
          lastReconciledAt: (/* @__PURE__ */ new Date()).toISOString(),
          data: { ...paymentSession.data || {}, compensation }
        }
      });
      await recordAudit(transactionContext, {
        eventKey: `payment.checkout_recovery:${paymentSession.id}`,
        organizationId: cart.organization.id,
        locationId: cart.location.id,
        actorId: context.session?.itemId,
        eventType: compensationError ? "payment.compensation_required" : "payment.compensated",
        resourceType: "PaymentSession",
        resourceId: paymentSession.id,
        metadata: { cartId: cart.id, idempotencyKey, paymentId }
      });
    });
    if (compensationError) throw new DomainError("Payment settled but order creation failed. Recovery is pending; contact the pharmacy with the cart reference.");
    throw new DomainError("Order creation failed after payment. The payment was automatically refunded; retry checkout with a new payment session.");
  }
}

// features/keystone/mutations/index.ts
var graphql4 = String.raw;
function extendGraphqlSchema(baseSchema) {
  return (0, import_schema.mergeSchemas)({
    schemas: [baseSchema],
    typeDefs: graphql4`
      type PharmacyCatalogProduct {
        id: ID!
        title: String!
        handle: String!
        sku: String!
        description: String
        category: String
        priceAmount: Int!
        currencyCode: String!
        taxable: Boolean!
        imageUrl: String
        prescriptionRequirement: String!
        availableQuantity: Int!
        inStock: Boolean!
      }

      type PublicPharmacyCatalogProduct {
        id: ID!
        title: String!
        handle: String!
        sku: String!
        description: String
        category: String
        priceAmount: Int!
        currencyCode: String!
        taxable: Boolean!
        imageUrl: String
        prescriptionRequirement: String!
        availableQuantity: Int
        inStock: Boolean
        inventorySummaryStatus: String!
      }
      type PublicPharmacyCatalogWorklist { items: [PublicPharmacyCatalogProduct!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }

      type PharmacyCatalogQueueItem {
        id: ID!
        title: String!
        handle: String!
        sku: String!
        status: String!
        category: String!
        prescriptionRequirement: String!
        priceAmount: Int!
        currencyCode: String!
        onlineAvailable: Boolean!
        posAvailable: Boolean!
        coldChainRequired: Boolean!
        locationId: ID!
        locationName: String!
        availableQuantity: Int
        quarantinedQuantity: Int
        inventorySummaryStatus: String!
      }

      type PharmacyTaskOption { id: ID!, label: String!, scopeId: ID!, detail: String, coldChainRequired: Boolean }
      type PharmacyPrescriptionIntakeOptions {
        organizations: [PharmacyTaskOption!]!
        locations: [PharmacyTaskOption!]!
        patients: [PharmacyTaskOption!]!
        prescribers: [PharmacyTaskOption!]!
        products: [PharmacyTaskOption!]!
      }
      type PharmacyRecallLotOption { id: ID!, label: String!, organizationId: ID!, locationId: ID!, detail: String }
      type PharmacyRecallOpenOptions { organizations: [PharmacyTaskOption!]!, organizationWideOrganizationIds: [ID!]!, locations: [PharmacyTaskOption!]!, lots: [PharmacyRecallLotOption!]! }
      type PharmacyInventoryReceiptOptions {
        locations: [PharmacyTaskOption!]!
        suppliers: [PharmacyTaskOption!]!
      }
      type PharmacyProductOptionWorklist { items: [PharmacyTaskOption!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }
      type PharmacyPatientRecordOptions { organizations: [PharmacyTaskOption!]! }
      type PharmacyDispensingSetup {
        pharmacistReviewed: Boolean!
        prescriberReady: Boolean!
        prescriberHasNpi: Boolean!
        drugReferenceReviewed: Boolean!
        cashPolicyRecorded: Boolean!
        prescriptionProductStocked: Boolean!
      }
      type PharmacyCredentialReviewOptions {
        organizationWideOrganizationIds: [ID!]!
        setup: PharmacyDispensingSetup!
        organizations: [PharmacyTaskOption!]!
        memberships: [PharmacyTaskOption!]!
        prescribers: [PharmacyTaskOption!]!
        drugReferences: [PharmacyTaskOption!]!
      }

      type PublicPharmacyCategory { value: String!, count: Int! }
      type PublicPharmacyLocation {
        id: ID!
        name: String!
        code: String!
        address: JSON
        phone: String
        timezone: String!
        hours: JSON
        onlineOrderingEnabled: Boolean!
        pickupEnabled: Boolean!
        deliveryEnabled: Boolean!
      }
      type PublicPharmacyOperatorBrand {
        organizationId: ID!
        tenantKey: String!
        displayName: String!
        tagline: String!
        primaryColor: String!
        accentColor: String!
        logoUrl: String
        logoIcon: String
        logoColor: String
        heroUrl: String
        supportEmail: String
        supportPhone: String
        privacyNotice: String
      }
      type PublicPharmacyTenant {
        brand: PublicPharmacyOperatorBrand!
        locations: [PublicPharmacyLocation!]!
        locationsTotalCount: Int!
        hasMoreLocations: Boolean!
        nextLocationCursor: String
      }

      type PharmacyCartProduct {
        id: ID!
        title: String!
        handle: String!
        sku: String!
        description: String
        category: String
        priceAmount: Int!
        currencyCode: String!
        imageUrl: String
        prescriptionRequirement: String!
      }
      type PharmacyCartItem { id: ID!, quantity: Int!, unitPriceAmount: Int!, product: PharmacyCartProduct! }
      type PharmacyCartOrganization { id: ID!, name: String! }
      type PharmacyCartLocation { id: ID!, name: String!, pickupEnabled: Boolean!, deliveryEnabled: Boolean! }
      type PharmacyCart {
        id: ID!
        status: String!
        fulfillmentMethod: String!
        subtotalAmount: Int!
        taxAmount: Int!
        deliveryAmount: Int!
        totalAmount: Int!
        expiresAt: String
        organization: PharmacyCartOrganization!
        location: PharmacyCartLocation!
        items: [PharmacyCartItem!]!
      }
      type CreatePharmacyCartResult { cart: PharmacyCart!, guestToken: String }

      type PharmacyOperatorLocation { id: ID!, name: String!, code: String!, pickupEnabled: Boolean!, deliveryEnabled: Boolean!, operatorDisplayName: String!, operatorPhone: String, cashSalesEnabled: Boolean!, cashTaxRateBps: Int! }
      type PharmacyPaymentProviderOption { code: String!, name: String!, payAtPickup: Boolean! }
      type PharmacyPaymentSessionResult {
        id: ID!
        amount: Int!
        currencyCode: String!
        status: String!
        providerCode: String!
        providerName: String!
        clientSecret: String
      }

      type GuestPharmacyOrderLine {
        id: ID!
        title: String!
        sku: String
        quantity: Int!
        unitPriceAmount: Int!
        lineTotalAmount: Int!
        imageUrl: String
        prescriptionRequirement: String!
      }
      type GuestPharmacyFulfillment { method: String!, status: String!, readyAt: String, handedOffAt: String }
      type GuestPharmacyOrder {
        id: ID!
        orderNumber: String!
        status: String!
        fulfillmentMethod: String!
        subtotalAmount: Int!
        taxAmount: Int!
        deliveryAmount: Int!
        totalAmount: Int!
        currencyCode: String!
        pickupAt: String
        deliveryWindow: String
        createdAt: String!
        locationName: String!
        locationTimezone: String!
        lines: [GuestPharmacyOrderLine!]!
        fulfillment: GuestPharmacyFulfillment
      }

      type PharmacyPrescriberDirectoryItem {
        id: ID!
        name: String!
        npi: String
        phone: String
        fax: String
        verificationStatus: String!
        externalValidationComplete: Boolean!
        organizationName: String!
        prescriptionCount: Int!
      }

      type PharmacyPrescriptionQueueItem {
        id: ID!
        prescriptionNumber: String!
        status: String!
        source: String!
        sourceVerificationStatus: String!
        createdAt: String!
        writtenAt: String
        patientDisplayName: String!
        prescriberName: String!
        prescriberVerificationStatus: String!
        locationName: String!
        medicationName: String
        quantityPrescribed: Int
        refillsRemaining: Int
        openRefillCount: Int
        openTransferCount: Int
        readyAt: String
        willCallReturnDays: Int!
      }
      type PharmacyPrescriptionWorklist { items: [PharmacyPrescriptionQueueItem!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }
      type PharmacyEligibleLot {
        id: ID!
        lotNumber: String!
        expirationDate: String!
        eligibleQuantity: Int!
        coldChainRequired: Boolean!
      }
      type PharmacyPrescriptionTaskItem {
        id: ID!
        fillLineage: String
        medicationName: String!
        sig: String!
        quantityPrescribed: Int!
        daysSupply: Int
        refillsAuthorized: Int!
        refillsRemaining: Int!
        substitutionAllowed: Boolean!
        productId: ID!
        productTitle: String!
        productSku: String!
        priceAmount: Int!
        currencyCode: String!
        taxable: Boolean!
        eligibleLots: [PharmacyEligibleLot!]!
      }
      type PharmacyPrescriptionPatientAllergy { id: ID!, allergen: String!, reaction: String!, severity: String! }
      type PharmacyPrescriptionPatientMedication { id: ID!, medicationName: String!, directions: String }
      type PharmacyClinicalSafetyReviewProjection { id: ID!, fillNumber: Int!, outcome: String!, reviewReference: String!, notes: String, overrideReason: String, reviewedAt: String!, pharmacistName: String! }
      type PharmacyDispensingLabelProjection { id: ID!, labelNumber: String!, fillNumber: Int!, operatorName: String!, operatorPhone: String, locationName: String!, locationAddress: JSON, patientName: String!, prescriberName: String!, medicationName: String!, sig: String!, quantityDispensed: Int!, lotNumber: String!, ndc11: String, expirationDate: String!, auxiliaryWarnings: [String!]!, counselingOutcome: String!, dispensedAt: String!, voidedAt: String, voidReason: String }
      type PharmacyRefillTaskProjection { id: ID!, status: String!, requestNote: String, resolutionNote: String, requestedAt: String!, resolvedAt: String, prescriptionItemId: ID!, medicationName: String! }
      type PharmacyTransferTaskProjection { id: ID!, direction: String!, status: String!, counterpartyName: String!, counterpartyPhone: String, requestedAt: String!, completedAt: String, consentRecorded: Boolean! }
      type PharmacyPrescriptionReviewProjection {
        id: ID!
        decision: String!
        reason: String!
        reviewedAt: String!
        pharmacistName: String!
      }
      type PharmacyPrescriptionTask {
        id: ID!
        prescriptionNumber: String!
        status: String!
        source: String!
        sourceVerificationStatus: String!
        writtenAt: String
        expiresAt: String
        patientId: ID!
        patientDisplayName: String!
        patientIdentityVerificationStatus: String!
        patientIdentityEvidenceRecorded: Boolean!
        prescriberId: ID!
        prescriberName: String!
        prescriberVerificationStatus: String!
        locationId: ID!
        locationName: String!
        operatorDisplayName: String!
        operatorPhone: String
        cashSalesEnabled: Boolean!
        cashTaxRateBps: Int!
        willCallReturnDays: Int!
        approvalRecorded: Boolean!
        approvedAt: String
        availableActions: [String!]!
        items: [PharmacyPrescriptionTaskItem!]!
        patientAllergies: [PharmacyPrescriptionPatientAllergy!]!
        patientMedications: [PharmacyPrescriptionPatientMedication!]!
        safetyReviews: [PharmacyClinicalSafetyReviewProjection!]!
        dispensingLabels: [PharmacyDispensingLabelProjection!]!
        refillRequests: [PharmacyRefillTaskProjection!]!
        transfers: [PharmacyTransferTaskProjection!]!
        reviews: [PharmacyPrescriptionReviewProjection!]!
      }

      type PharmacyInventoryLotQueueItem {
        id: ID!
        lotNumber: String!
        status: String!
        expirationDate: String!
        quantityAvailable: Int!
        quantityQuarantined: Int!
        coldChainRequired: Boolean!
        coldChainEvidenceComplete: Boolean!
        storageBin: String
        productTitle: String!
        productSku: String!
        locationName: String!
        activeRecallCount: Int!
        openExcursionCount: Int!
      }
      type PharmacyInventoryWorklist { items: [PharmacyInventoryLotQueueItem!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }
      type PharmacyInventoryMovementProjection {
        id: ID!
        movementType: String!
        quantityDelta: Int!
        reason: String!
        occurredAt: String!
        actorName: String!
      }
      type PharmacyTemperatureExcursionProjection {
        id: ID!
        status: String!
        observedMinimumC: Float!
        observedMaximumC: Float!
        startedAt: String!
        endedAt: String
        dispositionReason: String
        resolutionNote: String
        resolvedAt: String
      }
      type PharmacyExcursionResult { success: Boolean!, reused: Boolean, excursionId: ID!, lotId: ID!, status: String!, lotStatus: String, quantityAvailable: Int, movementId: ID, approvalId: ID }
      type PharmacyRecallReference { id: ID!, recallNumber: String!, status: String!, classification: String! }
      type PharmacyInventoryLotTask {
        id: ID!
        lotNumber: String!
        serialNumber: String
        status: String!
        expirationDate: String!
        receivedAt: String!
        quantityReceived: Int!
        quantityAvailable: Int!
        quantityQuarantined: Int!
        eligibleQuantity: Int!
        storageBin: String
        coldChainRequired: Boolean!
        minimumTemperatureC: Float
        maximumTemperatureC: Float
        coldChainEvidenceComplete: Boolean!
        productId: ID!
        productTitle: String!
        productSku: String!
        locationId: ID!
        locationName: String!
        canAdjust: Boolean!
        recalls: [PharmacyRecallReference!]!
        excursions: [PharmacyTemperatureExcursionProjection!]!
        movements: [PharmacyInventoryMovementProjection!]!
      }

      type PharmacyRecallQueueItem {
        id: ID!
        recallNumber: String!
        classification: String!
        status: String!
        reason: String!
        source: String
        initiatedAt: String!
        locationName: String
        affectedLotCount: Int!
        quarantinedLotCount: Int!
        unresolvedExposureCount: Int!
        approvalRecorded: Boolean!
        approvedAt: String
        approvedBy: String
      }
      type PharmacyRecallWorklist { items: [PharmacyRecallQueueItem!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }
      type PharmacyRecallExposureProjection { id: ID!, status: String!, quantityDispensed: Int!, contactMethod: String, outcome: String, notes: String, lastActionAt: String, resolvedAt: String, patientId: ID!, patientDisplayName: String!, prescriptionId: ID, prescriptionNumber: String, orderId: ID, orderNumber: String }
      type PharmacyRecallLotProjection {
        id: ID!
        lotNumber: String!
        status: String!
        quantityAvailable: Int!
        quantityQuarantined: Int!
        productTitle: String!
        productSku: String!
        locationName: String!
      }
      type PharmacyRecallTask {
        id: ID!
        recallNumber: String!
        classification: String!
        status: String!
        reason: String!
        source: String
        initiatedAt: String!
        closedAt: String
        locationId: ID
        locationName: String
        approvalRecorded: Boolean!
        approvedAt: String
        approvedBy: String
        canQuarantine: Boolean!
        canClose: Boolean!
        unlinkedExposureCount: Int!
        exposureReconciliationComplete: Boolean!
        exposures: [PharmacyRecallExposureProjection!]!
        lots: [PharmacyRecallLotProjection!]!
      }

      type PharmacyOrderQueueItem {
        id: ID!
        orderNumber: String!
        status: String!
        fulfillmentMethod: String!
        totalAmount: Int!
        currencyCode: String!
        createdAt: String!
        locationName: String!
        lineItemCount: Int!
        hasPrescriptionLines: Boolean!
        fulfillmentId: ID
        fulfillmentStatus: String!
        paymentStatus: String!
      }
      type PharmacyOrderWorklist { items: [PharmacyOrderQueueItem!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }
      type PharmacyOrderLineProjection {
        id: ID!
        title: String!
        sku: String
        ndc11: String
        imageUrl: String
        quantity: Int!
        unitPriceAmount: Int!
        lineTotalAmount: Int!
        prescriptionRequirement: String!
      }
      type PharmacyFulfillmentProjection {
        id: ID!
        method: String!
        status: String!
        readyAt: String
        handedOffAt: String
        assignedToName: String
      }
      type PharmacyPaymentProjection {
        id: ID!
        status: String!
        amount: Int!
        currencyCode: String!
        processedAt: String
        tenderMethod: String!
        cashReceivedAmount: Int
        changeDueAmount: Int
        providerName: String!
        providerCode: String!
      }
      type PharmacyOrderTask {
        id: ID!
        orderNumber: String!
        status: String!
        fulfillmentMethod: String!
        customerName: String
        customerEmail: String
        customerPhone: String
        subtotalAmount: Int!
        taxAmount: Int!
        deliveryAmount: Int!
        totalAmount: Int!
        currencyCode: String!
        createdAt: String!
        pickupAt: String
        deliveryWindow: String
        locationId: ID!
        locationName: String!
        availableFulfillmentStatuses: [String!]!
        lines: [PharmacyOrderLineProjection!]!
        fulfillment: PharmacyFulfillmentProjection
        payment: PharmacyPaymentProjection
      }

      type PharmacyPatientPortalPrescription {
        id: ID!
        prescriptionItemId: ID!
        prescriptionNumber: String!
        status: String!
        locationId: ID!
        locationName: String!
        prescriberName: String!
        medicationName: String!
        refillsRemaining: Int!
        itemVersion: String
        refillEligible: Boolean
        fillLineage: String
        lastRefillStatus: String
      }
      type PharmacyPatientPortalOrder {
        id: ID!
        orderNumber: String!
        status: String!
        fulfillmentStatus: String!
        totalAmount: Int!
        currencyCode: String!
        createdAt: String!
      }
      type PharmacyPatientPortal {
        id: ID!
        patientNumber: String!
        displayName: String!
        preferredContactMethod: String!
        prescriptions: [PharmacyPatientPortalPrescription!]!
        orders: [PharmacyPatientPortalOrder!]!
      }

      type PatientAllergyProjection { id: ID!, allergen: String!, reaction: String!, severity: String!, status: String!, source: String!, recordedAt: String! }
      type PatientMedicationProjection { id: ID!, medicationName: String!, directions: String, status: String!, source: String!, recordedAt: String! }
      type PatientSafeProjection {
        id: ID!
        patientNumber: String!
        displayName: String!
        status: String!
        email: String
        phone: String
        address: JSON
        preferredContactMethod: String!
        identityVerificationStatus: String!
        hasIdentityEvidence: Boolean!
        organizationNames: [String!]!
        prescriptionCount: Int!
        activeConsentCount: Int!
        latestConsentAt: String
        allergies: [PatientAllergyProjection!]!
        medications: [PatientMedicationProjection!]!
      }

      type PharmacyIntegrationStatus {
        id: ID!
        name: String!
        code: String!
        providerType: String!
        status: String!
        externalValidationComplete: Boolean!
        hasValidationReference: Boolean!
        organizationName: String!
      }
      type PharmacyAuditTimelineEvent {
        id: ID!
        eventKey: String
        eventType: String!
        resourceType: String!
        resourceId: String!
        occurredAt: String!
        actorType: String!
        actorName: String
        locationName: String
      }

      type PharmacyPatientAccountLinkResult { success: Boolean!, reused: Boolean, patientId: ID!, userId: ID! }
      type PharmacyPatientRecordResult { success: Boolean!, reused: Boolean!, patientId: ID!, patientNumber: String, status: String! }
      type PharmacyPatientHistoryResult { success: Boolean!, reused: Boolean!, recordId: ID!, status: String! }
      type PharmacyClinicalSafetyReviewResult { success: Boolean!, reused: Boolean!, reviewId: ID!, prescriptionId: ID!, outcome: String!, approvalId: ID! }
      type PharmacyDrugReferenceReviewResult { success: Boolean!, reused: Boolean!, reviewId: ID!, status: String!, approvalId: ID! }
      type PharmacyCredentialReviewResult { success: Boolean!, membershipId: ID, prescriberId: ID, status: String!, expiresAt: String!, approvalId: ID! }
      type PharmacyRefundResult { success: Boolean!, reused: Boolean, paymentId: ID!, status: String!, amount: Int! }
      type PharmacyCashPolicyResult { success: Boolean!, organizationId: ID!, status: String!, taxRateBps: Int!, approvalId: ID! }
      type PharmacyPosCashReceiptLine { title: String!, sku: String!, quantity: Int!, unitPriceAmount: Int!, lineTotalAmount: Int! }
      type PharmacyPosCashOrderResult { success: Boolean!, reused: Boolean!, orderId: ID!, orderNumber: String!, status: String!, recordedAt: String!, lines: [PharmacyPosCashReceiptLine!]!, subtotalAmount: Int!, taxAmount: Int!, totalAmount: Int!, currencyCode: String!, paymentId: ID!, paymentStatus: String!, tenderMethod: String, cashReceivedAmount: Int!, changeDueAmount: Int! }
      type PharmacyCounterCardPayment { clientSecret: String!, paymentIntentId: String!, amount: Int!, currencyCode: String! }
      type PharmacyPaymentReconciliationResult { success: Boolean!, paymentSessionId: ID!, status: String! }
      type PharmacyPaymentWebhookResult { accepted: Boolean!, reused: Boolean!, eventId: String!, status: String! }
      type PharmacyIntegrationConfigurationResult { success: Boolean!, providerId: ID!, status: String! }
      type PharmacyPrescriberValidationResult { success: Boolean!, prescriberId: ID!, status: String!, validationReference: String! }
      type PharmacyExternalWorkflowResult { success: Boolean!, reused: Boolean!, workflowId: ID!, status: String!, externalReference: String }
      type PharmacyIntegrationWebhookResult { accepted: Boolean!, reused: Boolean!, eventId: String!, status: String! }
      type PharmacyPrescriptionActionResult { success: Boolean!, reused: Boolean, prescriptionId: ID, reviewId: ID, approvalId: ID, orderId: ID, orderNumber: String, receiptItemTitle: String, paymentId: ID, labelId: ID, status: String, totalAmount: Int, cashReceivedAmount: Int, changeDueAmount: Int, currencyCode: String, tenderMethod: String }
      type PharmacyTransferResult { success: Boolean!, reused: Boolean, transferId: ID!, approvalId: ID, status: String! }
      type PharmacyRefillResult { success: Boolean!, reused: Boolean, refillRequestId: ID!, status: String!, approvalId: ID }
      type PharmacyFillCommandResult { success: Boolean!, reused: Boolean!, fillId: ID, status: String!, version: Int }
      type PharmacyFillEventProjection { id: ID!, action: String!, version: Int!, quantity: Int!, occurredAt: String!, actorName: String!, reason: String, orderId: ID, orderNumber: String }
      type PharmacyFillProjection {
        id: ID!, prescriptionItemId: ID!, refillRequestId: ID, kind: String!, status: String!, version: Int!, fillNumber: Int!,
        attempt: Int!, creditState: String!, authorizedQuantity: Int!, quantityDispensed: Int!, quantityReleased: Int!, quantityRemaining: Int!,
        expiresAt: String!, policyVersion: String!, policyReference: String!, allowPartial: Boolean!, releaseReasons: [String!]!,
        priceAmount: Int!, taxAmount: Int!, currencyCode: String!, taxable: Boolean!, itemVersion: String!,
        events: [PharmacyFillEventProjection!]!, hasMoreEvents: Boolean!
      }
      type PharmacyFillItemProjection { id: ID!, itemVersion: String!, lineage: String!, originalReservable: Boolean! }
      type PharmacyFillPolicyReadback { organizationId: ID!, configured: Boolean!, version: String }
      type PharmacyFillHistory { events: [PharmacyFillEventProjection!]!, hasMore: Boolean!, nextCursor: String }
      type PharmacyFillWorkbench { organizationId: ID!, policyConfigured: Boolean!, canConfigure: Boolean!,
        items: [PharmacyFillItemProjection!]!, fills: [PharmacyFillProjection!]!, totalCount: Int!, hasMore: Boolean!, nextCursor: String }
      type PharmacyInventoryActionResult { success: Boolean!, reused: Boolean, movementId: ID, lotId: ID, quantityAvailable: Int, recallId: ID, lotCount: Int, unlinkedExposureCount: Int, approvalId: ID, status: String }
      type PharmacyRecallExposureActionResult { success: Boolean!, reused: Boolean!, exposureId: ID!, status: String!, approvalId: ID! }
      type SubmitPharmacyOrderResult {
        success: Boolean!
        reused: Boolean
        orderId: ID!
        orderNumber: String!
        status: String!
        fulfillmentStatus: String!
        totalAmount: Int!
        currencyCode: String!
        guestOrderToken: String
      }
      type PharmacyFulfillmentResult { success: Boolean!, reused: Boolean, fulfillmentId: ID!, orderId: ID!, approvalId: ID, status: String! }
      type PharmacyOnboardingCounts { drugReferences: Int!, paymentProviders: Int!, suppliers: Int!, products: Int!, lots: Int!, patients: Int!, prescribers: Int!, prescriptions: Int! }
      type PharmacyOnboardingResult { completed: Boolean!, reused: Boolean!, template: String!, organizationId: ID!, locationId: ID, counts: PharmacyOnboardingCounts! }
      input UserUpdateProfileInput { email: String, name: String, password: String, onboardingStatus: String }
      type PharmacyOnboardingState { userId: ID!, status: String!, canManageOnboarding: Boolean! }
      type PharmacyOnboardingStatusResult { userId: ID!, status: String! }
      type PharmacyOperationalSummary { pendingReview: Int!, readyToDispense: Int!, activeRecalls: Int!, expiringLots: Int!, processingOrders: Int! }

      input PharmacyPosCashItemInput { productId: ID!, quantity: Int! }
      input PharmacyPrescriptionIntakeItemInput {
        productId: ID!
        medicationName: String!
        sig: String!
        quantity: Int!
        daysSupply: Int
        refillsAuthorized: Int!
        substitutionAllowed: Boolean!
      }
      input SubmitPharmacyOrderInput {
        cartId: ID!
        paymentSessionId: ID!
        idempotencyKey: String!
        guestToken: String
        email: String!
        phone: String
        customerName: String
        fulfillmentMethod: String!
        pickupAt: String
        deliveryWindow: String
        shippingAddress: JSON
        privacyConsentAccepted: Boolean!
        policyVersion: String!
        statementKey: String!
      }

      type PharmacyCustomerLine { title: String!, quantity: Int!, unitPriceAmount: Int! }
      type PharmacyCustomerOrder { id: ID!, orderNumber: String!, status: String!, totalAmount: Int!, currencyCode: String!, createdAt: String!, lineItems: [PharmacyCustomerLine!]! }
      type PharmacyCustomerAccount { id: ID!, name: String!, hasPatientProfile: Boolean!, orders: [PharmacyCustomerOrder!]! }
      input PharmacyPrescriptionRequestInput {
        locationId: ID!
        kind: String!
        idempotencyKey: String!
        firstName: String
        lastName: String
        dateOfBirth: String
        phone: String
        allergies: String
        insurance: String
        counterpartyName: String
        counterpartyPhone: String
        prescriberName: String
        prescriberPhone: String
        medications: String
        note: String
      }
      type PharmacyCustomerPrescriptionRequest { id: ID!, kind: String!, status: String!, createdAt: String!, resolvedAt: String, resolutionNote: String, locationName: String!, counterpartyName: String, medications: String }
      type PharmacyPrescriptionRequest {
        id: ID!
        organizationId: ID!
        kind: String!
        status: String!
        createdAt: String!
        resolvedAt: String
        resolutionNote: String
        locationName: String!
        counterpartyName: String
        medications: String
        customerName: String!
        customerEmail: String!
        patientId: ID
        firstName: String
        lastName: String
        dateOfBirth: String
        phone: String
        email: String
        allergies: String
        insurance: String
        counterpartyPhone: String
        prescriberName: String
        prescriberPhone: String
        note: String
      }
      type Query {
        pharmacyPosCustomers(locationId: ID!): [PharmacyTaskOption!]!
        pharmacyCustomerAccount: PharmacyCustomerAccount!
        pharmacyCustomerOrder(orderId: ID!): PharmacyCustomerOrder!
        pharmacyCustomerOrderDetails(orderId: ID!): GuestPharmacyOrder!
        pharmacyCustomerPrescriptionRequests: [PharmacyCustomerPrescriptionRequest!]!
        pharmacyPrescriptionRequestQueue(status: String, requestId: ID): [PharmacyPrescriptionRequest!]!
        pharmacyFillPolicy(organizationId: ID!): PharmacyFillPolicyReadback!
        pharmacyFillHistory(prescriptionId: ID!, fillId: ID!, after: String): PharmacyFillHistory!
        pharmacyFillWorkbench(prescriptionId: ID!, after: String): PharmacyFillWorkbench!
        redirectToInit: Boolean
        publicPharmacyTenant(tenantKey: String, search: String, first: Int, after: String): PublicPharmacyTenant!
        publicPharmacyLocations(tenantKey: String): [PublicPharmacyLocation!]!
        publicPharmacyCatalog(tenantKey: String, locationId: ID!, search: String, category: String, first: Int, after: String): PublicPharmacyCatalogWorklist!
        publicPharmacyCategories(tenantKey: String, locationId: ID!): [PublicPharmacyCategory!]!
        pharmacyCatalogQueue: [PharmacyCatalogQueueItem!]!
        pharmacyPrescriptionIntakeOptions: PharmacyPrescriptionIntakeOptions!
        pharmacyInventoryReceiptOptions: PharmacyInventoryReceiptOptions!
        pharmacyInventoryReceiptProductWorklist(locationId: ID!, first: Int, after: String, status: String): PharmacyProductOptionWorklist!
        pharmacyCredentialReviewOptions: PharmacyCredentialReviewOptions!
        pharmacyPatientRecordOptions: PharmacyPatientRecordOptions!
        pharmacyCart(cartId: ID!, guestToken: String): PharmacyCart
        activePharmacyPaymentProviders(locationId: ID!): [PharmacyPaymentProviderOption!]!
        guestPharmacyOrder(orderId: ID!, guestOrderToken: String!): GuestPharmacyOrder
        lookupPharmacyOrder(orderNumber: String!, email: String!): GuestPharmacyOrder
        pharmacyOperationalSummary: PharmacyOperationalSummary!
        pharmacyOnboardingState: PharmacyOnboardingState!
        pharmacyOperatorLocations: [PharmacyOperatorLocation!]!
        pharmacyPosCatalog(locationId: ID!): [PharmacyCatalogProduct!]!
        pharmacyPosCashReceipt(idempotencyKey: String!): PharmacyPosCashOrderResult
        pharmacyPrescriberDirectory: [PharmacyPrescriberDirectoryItem!]!
        pharmacyPrescriptionQueue: [PharmacyPrescriptionQueueItem!]!
        pharmacyPrescriptionWorklist(first: Int, after: String, willCall: String): PharmacyPrescriptionWorklist!
        pharmacyPrescriptionTask(prescriptionId: ID!): PharmacyPrescriptionTask!
        pharmacyInventoryQueue(first: Int, after: String, locationId: ID, status: String): PharmacyInventoryWorklist!
        pharmacyInventoryLotTask(lotId: ID!): PharmacyInventoryLotTask!
        pharmacyRecallOpenOptions: PharmacyRecallOpenOptions!
        pharmacyRecallQueue: [PharmacyRecallQueueItem!]!
        pharmacyRecallWorklist(first: Int, after: String): PharmacyRecallWorklist!
        pharmacyRecallTask(recallId: ID!): PharmacyRecallTask!
        pharmacyOrderQueue(first: Int, after: String, status: String, fulfillmentMethod: String): PharmacyOrderWorklist!
        pharmacyOrderTask(orderId: ID!): PharmacyOrderTask!
        pharmacyPatientAccountCandidates(patientId: ID!): [PharmacyTaskOption!]!
        pharmacyPatientDirectory: [PatientSafeProjection!]!
        pharmacyPatientPortal: PharmacyPatientPortal!
        pharmacyPatientSafeView(patientId: ID!): PatientSafeProjection!
        pharmacyIntegrationStatus: [PharmacyIntegrationStatus!]!
        pharmacyAuditTimeline(take: Int): [PharmacyAuditTimelineEvent!]!
      }

      type Mutation {
        submitPharmacyPrescriptionRequest(input: PharmacyPrescriptionRequestInput!): PharmacyCustomerPrescriptionRequest!
        resolvePharmacyPrescriptionRequest(requestId: ID!, status: String!, note: String, patientId: ID): PharmacyPrescriptionRequest!
        registerPharmacyCustomer(name: String!, email: String!, password: String!): Boolean!
        updateActiveUser(data: UserUpdateProfileInput!, oldPassword: String): User
        recordPharmacyFillPolicy(organizationId: ID!, policy: JSON!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyFillCommandResult!
        reservePharmacyPrescriptionFill(prescriptionId: ID!, prescriptionItemId: ID!, expectedItemVersion: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyFillCommandResult!
        releasePharmacyPrescriptionFill(prescriptionId: ID!, fillId: ID!, expectedVersion: Int!, cause: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyFillCommandResult!
        createPharmacyCart(locationId: ID!, tenantKey: String): CreatePharmacyCartResult!
        addPharmacyCartItem(cartId: ID!, productId: ID!, quantity: Int!, guestToken: String): PharmacyCart!
        updatePharmacyCartItem(cartItemId: ID!, quantity: Int!, guestToken: String): PharmacyCart!
        removePharmacyCartItem(cartItemId: ID!, guestToken: String): PharmacyCart!
        initiatePharmacyPaymentSession(cartId: ID!, providerCode: String!, guestToken: String): PharmacyPaymentSessionResult!
        submitPharmacyOrder(input: SubmitPharmacyOrderInput!): SubmitPharmacyOrderResult!
        refundPharmacyPayment(paymentId: ID!, reason: String!, attested: Boolean!): PharmacyRefundResult!
        refundPharmacyCashPayment(paymentId: ID!, cashReturnedAmount: Int!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyRefundResult!
        recordPharmacyCashPolicy(organizationId: ID!, taxRateBps: Int!, policyReference: String!, reason: String!, attested: Boolean!): PharmacyCashPolicyResult!
        submitPharmacyPosCashOrder(locationId: ID!, customerCartId: ID, fulfillmentMethod: String, items: [PharmacyPosCashItemInput!]!, cashReceivedAmount: Int!, idempotencyKey: String!, reason: String!, attested: Boolean!, tenderMethod: String, paymentIntentId: String): PharmacyPosCashOrderResult!
        openPharmacyPosCardPayment(locationId: ID!, items: [PharmacyPosCashItemInput!]!, idempotencyKey: String!): PharmacyCounterCardPayment!
        openPrescriptionPickupCardPayment(prescriptionId: ID!, fillId: ID!, idempotencyKey: String!): PharmacyCounterCardPayment!
        reconcilePharmacyPaymentSession(paymentSessionId: ID!): PharmacyPaymentReconciliationResult!
        handlePaymentProviderWebhook(providerId: ID!, event: JSON!, headers: JSON!): PharmacyPaymentWebhookResult!
        configurePharmacyIntegrationProvider(providerId: ID!, baseUrl: String!, validationPath: String!, submitPath: String!, statusPath: String!, prescriberValidationPath: String, bearerToken: String!, webhookSecret: String!): PharmacyIntegrationConfigurationResult!
        validatePharmacyPrescriber(providerId: ID!, prescriberId: ID!): PharmacyPrescriberValidationResult!
        submitPharmacyExternalWorkflow(providerId: ID!, resourceId: ID!, idempotencyKey: String!): PharmacyExternalWorkflowResult!
        refreshPharmacyExternalWorkflow(workflowId: ID!): PharmacyExternalWorkflowResult!
        ingestPharmacyIntegrationWebhook(providerKey: String!, event: JSON!, headers: JSON!): PharmacyIntegrationWebhookResult!

        intakePharmacyPrescription(organizationId: ID!, locationId: ID!, patientId: ID!, prescriberId: ID!, prescriptionNumber: String!, source: String!, externalReference: String, writtenAt: String!, expiresAt: String!, items: [PharmacyPrescriptionIntakeItemInput!]!, reason: String!, attested: Boolean!): PharmacyPrescriptionActionResult!
        recordPrescriptionReview(prescriptionId: ID!, decision: String!, reason: String!, attested: Boolean!): PharmacyPrescriptionActionResult!
        authorizePrescriptionDispensing(prescriptionId: ID!, reason: String!, attested: Boolean!): PharmacyPrescriptionActionResult!
        recordPrescriptionDispensing(prescriptionId: ID!, prescriptionItemId: ID!, lotId: ID!, quantity: Int!, cashReceivedAmount: Int!, auxiliaryWarnings: [String!]!, counselingOutcome: String!, idempotencyKey: String!, reason: String!, attested: Boolean!, fillId: ID, expectedFillVersion: Int, hold: Boolean): PharmacyPrescriptionActionResult!
        pickupPrescriptionFill(prescriptionId: ID!, fillId: ID!, expectedFillVersion: Int!, cashReceivedAmount: Int!, idempotencyKey: String!, reason: String!, attested: Boolean!, tenderMethod: String, paymentIntentId: String): PharmacyPrescriptionActionResult!
        returnPrescriptionFillToStock(prescriptionId: ID!, fillId: ID!, expectedFillVersion: Int!, cause: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyFillCommandResult!
        createPharmacyPatient(organizationId: ID!, patientNumber: String!, firstName: String!, lastName: String!, dateOfBirth: String!, email: String, phone: String, preferredContactMethod: String!, address: JSON, identityMethod: String!, identityReference: String!, reason: String!, attested: Boolean!): PharmacyPatientRecordResult!
        updatePharmacyPatientContact(patientId: ID!, email: String, phone: String, preferredContactMethod: String!, address: JSON, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyPatientRecordResult!
        recordPharmacyPatientAllergy(patientId: ID!, allergen: String!, reaction: String!, severity: String!, source: String!, sourceReference: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyPatientHistoryResult!
        recordPharmacyPatientMedication(patientId: ID!, medicationName: String!, directions: String, source: String!, sourceReference: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyPatientHistoryResult!
        recordPharmacyPatientNoneKnown(patientId: ID!, kind: String!, source: String!, sourceReference: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyPatientHistoryResult!
        linkPharmacyPatientAccount(patientId: ID!, userId: ID!): PharmacyPatientAccountLinkResult!
        requestPrescriptionRefill(prescriptionId: ID!, prescriptionItemId: ID!, patientId: ID!, locationId: ID!, note: String, idempotencyKey: String!, expectedItemVersion: String): PharmacyRefillResult!
        resolvePrescriptionRefill(refillRequestId: ID!, decision: String!, reason: String!, attested: Boolean!, expectedFillVersion: Int): PharmacyRefillResult!
        requestPrescriptionTransfer(prescriptionId: ID!, patientId: ID!, direction: String!, counterpartyName: String!, counterpartyPhone: String, consentAccepted: Boolean!, policyVersion: String!, statementKey: String!, idempotencyKey: String!): PharmacyTransferResult!
        approvePrescriptionTransfer(transferId: ID!, reason: String!, attested: Boolean!): PharmacyTransferResult!
        recordPharmacyStaffCredentialReview(membershipId: ID!, credentialType: String!, jurisdiction: String!, identifier: String!, expiresAt: String!, verificationReference: String!, reason: String!, attested: Boolean!): PharmacyCredentialReviewResult!
        recordPharmacyPrescriberCredentialReview(prescriberId: ID!, credentialType: String!, jurisdiction: String!, identifier: String!, expiresAt: String!, verificationReference: String!, reason: String!, attested: Boolean!): PharmacyCredentialReviewResult!
        recordPharmacyDrugReferenceReview(organizationId: ID!, drugReferenceId: ID!, marketingStatus: String!, controlledSchedule: String!, sourceName: String!, sourceVersion: String!, sourceReference: String!, reason: String!, attested: Boolean!): PharmacyDrugReferenceReviewResult!
        recordPrescriptionClinicalSafetyReview(prescriptionId: ID!, outcome: String!, allergiesReviewed: Boolean!, medicationHistoryReviewed: Boolean!, interactionsReviewed: Boolean!, duplicateTherapyReviewed: Boolean!, contraindicationsReviewed: Boolean!, doseReviewed: Boolean!, counselingPlanReviewed: Boolean!, reviewReference: String!, notes: String, overrideReason: String, idempotencyKey: String!, reason: String!, attested: Boolean!, fillId: ID, expectedFillVersion: Int): PharmacyClinicalSafetyReviewResult!
        holdPrescriptionForClinicalReReview(prescriptionId: ID!, reason: String!, attested: Boolean!): PharmacyPrescriptionActionResult!

        receivePharmacyInventoryLot(productId: ID!, locationId: ID!, supplierId: ID, lotNumber: String!, serialNumber: String, expirationDate: String!, quantity: Int!, coldChainRequired: Boolean!, minimumTemperatureC: Float, maximumTemperatureC: Float, coldChainEvidenceComplete: Boolean!, reason: String!, idempotencyKey: String!, attested: Boolean!): PharmacyInventoryActionResult!
        adjustPharmacyInventoryLot(lotId: ID!, targetQuantity: Int!, reason: String!, idempotencyKey: String!, attested: Boolean!): PharmacyInventoryActionResult!
        recordPharmacyTemperatureExcursion(lotId: ID!, observedMinimumC: Float!, observedMaximumC: Float!, startedAt: String!, endedAt: String, reason: String!, idempotencyKey: String!, attested: Boolean!): PharmacyExcursionResult!
        resolvePharmacyTemperatureExcursion(excursionId: ID!, disposition: String!, note: String!, idempotencyKey: String!, attested: Boolean!): PharmacyExcursionResult!
        openPharmacyRecall(organizationId: ID!, locationId: ID, recallNumber: String!, classification: String!, reason: String!, source: String!, sourceReference: String!, lotIds: [ID!]!, attested: Boolean!): PharmacyInventoryActionResult!
        quarantineRecallLots(recallId: ID!, reason: String!, attested: Boolean!): PharmacyInventoryActionResult!
        recordRecallExposureAction(exposureId: ID!, status: String!, contactMethod: String!, outcome: String!, notes: String, reason: String!, attested: Boolean!): PharmacyRecallExposureActionResult!
        disposeRecallLot(recallId: ID!, lotId: ID!, quantity: Int!, dispositionReference: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyInventoryActionResult!
        closePharmacyRecall(recallId: ID!, reason: String!, attested: Boolean!): PharmacyInventoryActionResult!
        transitionOrderFulfillment(fulfillmentId: ID!, status: String!, reason: String!, attested: Boolean!): PharmacyFulfillmentResult!
        setPharmacyOnboardingStatus(status: String!): PharmacyOnboardingStatusResult!
        runPharmacyOnboarding(template: String): PharmacyOnboardingResult!
      }
    `,
    resolvers: {
      Query: {
        pharmacyPosCustomers,
        pharmacyCustomerAccount,
        pharmacyCustomerOrder,
        pharmacyCustomerOrderDetails,
        pharmacyCustomerPrescriptionRequests,
        pharmacyPrescriptionRequestQueue,
        pharmacyFillPolicy,
        pharmacyFillWorkbench,
        pharmacyFillHistory,
        redirectToInit: redirectToInit_default,
        publicPharmacyTenant,
        publicPharmacyLocations,
        publicPharmacyCatalog,
        publicPharmacyCategories,
        pharmacyCatalogQueue,
        pharmacyPrescriptionIntakeOptions,
        pharmacyInventoryReceiptOptions,
        pharmacyInventoryReceiptProductWorklist,
        pharmacyCredentialReviewOptions,
        pharmacyPatientRecordOptions,
        pharmacyCart,
        activePharmacyPaymentProviders,
        guestPharmacyOrder: getGuestPharmacyOrder,
        lookupPharmacyOrder,
        pharmacyOperationalSummary,
        pharmacyOnboardingState,
        pharmacyOperatorLocations,
        pharmacyPosCatalog,
        pharmacyPosCashReceipt,
        pharmacyPrescriberDirectory,
        pharmacyPrescriptionQueue,
        pharmacyPrescriptionWorklist,
        pharmacyPrescriptionTask,
        pharmacyInventoryQueue,
        pharmacyInventoryLotTask,
        pharmacyRecallOpenOptions,
        pharmacyRecallQueue,
        pharmacyRecallWorklist,
        pharmacyRecallTask,
        pharmacyOrderQueue,
        pharmacyOrderTask,
        pharmacyPatientAccountCandidates,
        pharmacyPatientDirectory,
        pharmacyPatientPortal,
        pharmacyPatientSafeView,
        pharmacyIntegrationStatus,
        pharmacyAuditTimeline
      },
      Mutation: {
        registerPharmacyCustomer,
        submitPharmacyPrescriptionRequest,
        resolvePharmacyPrescriptionRequest,
        updateActiveUser: updateActiveUser_default,
        recordPharmacyFillPolicy,
        reservePharmacyPrescriptionFill,
        releasePharmacyPrescriptionFill,
        createPharmacyCart,
        addPharmacyCartItem,
        updatePharmacyCartItem,
        removePharmacyCartItem,
        initiatePharmacyPaymentSession,
        submitPharmacyOrder,
        refundPharmacyPayment,
        refundPharmacyCashPayment,
        recordPharmacyCashPolicy,
        submitPharmacyPosCashOrder,
        openPharmacyPosCardPayment,
        openPrescriptionPickupCardPayment,
        reconcilePharmacyPaymentSession,
        handlePaymentProviderWebhook: handlePaymentProviderWebhook_default,
        configurePharmacyIntegrationProvider,
        validatePharmacyPrescriber,
        submitPharmacyExternalWorkflow,
        refreshPharmacyExternalWorkflow,
        ingestPharmacyIntegrationWebhook,
        intakePharmacyPrescription,
        recordPrescriptionReview,
        authorizePrescriptionDispensing,
        recordPrescriptionDispensing,
        pickupPrescriptionFill,
        returnPrescriptionFillToStock,
        createPharmacyPatient,
        updatePharmacyPatientContact,
        recordPharmacyPatientAllergy,
        recordPharmacyPatientMedication,
        recordPharmacyPatientNoneKnown,
        linkPharmacyPatientAccount,
        requestPrescriptionRefill,
        resolvePrescriptionRefill,
        requestPrescriptionTransfer,
        approvePrescriptionTransfer,
        recordPharmacyStaffCredentialReview,
        recordPharmacyPrescriberCredentialReview,
        recordPharmacyDrugReferenceReview,
        recordPrescriptionClinicalSafetyReview,
        holdPrescriptionForClinicalReReview,
        receivePharmacyInventoryLot: receiveInventoryLot,
        adjustPharmacyInventoryLot: adjustInventoryLot,
        recordPharmacyTemperatureExcursion: recordTemperatureExcursion,
        resolvePharmacyTemperatureExcursion: resolveTemperatureExcursion,
        openPharmacyRecall,
        quarantineRecallLots,
        recordRecallExposureAction,
        disposeRecallLot,
        closePharmacyRecall,
        transitionOrderFulfillment,
        setPharmacyOnboardingStatus,
        runPharmacyOnboarding
      }
    }
  });
}

// features/keystone/database-url.ts
var POOL_SIZES = { web: 15, worker: 5 };
var OVERRIDE_ENV = {
  web: "DATABASE_CONNECTION_LIMIT",
  worker: "DATABASE_CONNECTION_LIMIT_WORKER"
};
function pooledDatabaseUrl(url, role = "web") {
  if (!url || !/^postgres(ql)?:\/\//.test(url)) return url;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.searchParams.has("connection_limit")) return url;
  const override = Number(process.env[OVERRIDE_ENV[role]]);
  parsed.searchParams.set("connection_limit", String(Number.isInteger(override) && override > 0 ? override : POOL_SIZES[role]));
  return parsed.toString();
}

// features/keystone/lib/keystonePrismaErrors.ts
var RAW_METHOD = /^\$(queryRaw|executeRaw|queryRawUnsafe|executeRawUnsafe|queryRawTyped|runCommandRaw)$/;
var clients = /* @__PURE__ */ new WeakMap();
var delegates = /* @__PURE__ */ new WeakMap();
function isKeystonePrismaError(value) {
  return value instanceof Error && value.extensions?.code === "KS_PRISMA_ERROR";
}
function rethrowKeystonePrismaError(value) {
  if (!isKeystonePrismaError(value)) return value;
  const prisma = value.extensions.prisma ?? {};
  throw Object.assign(value, { code: prisma.code, meta: prisma.meta, clientVersion: prisma.clientVersion });
}
function throwing(result) {
  if (!result || typeof result.then !== "function") return rethrowKeystonePrismaError(result);
  const settled = () => result.then(rethrowKeystonePrismaError);
  return new Proxy(result, {
    get(target, key) {
      if (key === "then") return (ok, fail) => settled().then(ok, fail);
      if (key === "catch") return (fail) => settled().catch(fail);
      if (key === "finally") return (done) => settled().finally(done);
      const value = Reflect.get(target, key, target);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
}
function throwingDelegate(delegate) {
  const cached = delegates.get(delegate);
  if (cached) return cached;
  const wrapped = new Proxy(delegate, {
    get(target, key) {
      const value = Reflect.get(target, key, target);
      return typeof value === "function" ? (...args) => throwing(value.apply(target, args)) : value;
    }
  });
  delegates.set(delegate, wrapped);
  return wrapped;
}
function throwKeystonePrismaErrors(client) {
  const cached = clients.get(client);
  if (cached) return cached;
  const wrapped = new Proxy(client, {
    get(target, key) {
      const value = Reflect.get(target, key, target);
      if (key === "$transaction" && typeof value === "function") {
        return (work, ...options) => {
          if (typeof work === "function") return value.call(target, (tx) => work(throwKeystonePrismaErrors(tx)), ...options);
          return Promise.resolve(value.call(target, work, ...options)).then((results) => Array.isArray(results) ? results.map(rethrowKeystonePrismaError) : results);
        };
      }
      if (key === "$extends" && typeof value === "function") return (...args) => throwKeystonePrismaErrors(value.apply(target, args));
      if (typeof key === "string" && RAW_METHOD.test(key) && typeof value === "function") return (...args) => throwing(value.apply(target, args));
      if (typeof value === "function") return value.bind(target);
      if (typeof key === "string" && !key.startsWith("$") && value && typeof value === "object" && typeof value.findFirst === "function") return throwingDelegate(value);
      return value;
    }
  });
  clients.set(client, wrapped);
  return wrapped;
}

// features/keystone/index.ts
function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
function productionEnv(name, developmentFallback) {
  if (process.env[name]) return process.env[name];
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} is required in production`);
  }
  return developmentFallback;
}
var databaseURL = requiredEnv("DATABASE_URL");
var sessionSecret2 = requiredEnv("SESSION_SECRET");
if (sessionSecret2.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters long");
}
var basePath = "/dashboard";
var sessionConfig = {
  maxAge: 60 * 60 * 24 * 30,
  secret: sessionSecret2
};
var bucketName = productionEnv("S3_BUCKET_NAME", "keystone-test");
var region = productionEnv("S3_REGION", "ap-southeast-2");
var accessKeyId = productionEnv("S3_ACCESS_KEY_ID", "keystone");
var secretAccessKey = productionEnv("S3_SECRET_ACCESS_KEY", "keystone");
var endpoint = productionEnv("S3_ENDPOINT", "https://sfo3.digitaloceanspaces.com");
async function refreshHumanSession(context, session) {
  if (session?.listKey !== "User" || !session.itemId) return void 0;
  const current = await context.prisma.user.findUnique({ where: { id: session.itemId }, select: { tokenVersion: true } });
  if (!current || !isSessionTokenVersionCurrent(session.tokenVersion, current.tokenVersion)) return void 0;
  return session;
}
function statelessSessions({
  secret,
  maxAge = 60 * 60 * 24 * 30,
  path = "/",
  secure = process.env.NODE_ENV === "production",
  ironOptions = import_iron.default.defaults,
  domain,
  sameSite = "lax",
  cookieName = "keystonejs-session"
}) {
  if (!secret) {
    throw new Error("You must specify a session secret to use sessions");
  }
  if (secret.length < 32) {
    throw new Error("The session secret must be at least 32 characters long");
  }
  return {
    async get({ context }) {
      if (!context?.req) return;
      const authHeader = context.req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        const accessToken = authHeader.slice(7);
        try {
          return await refreshHumanSession(context, await import_iron.default.unseal(accessToken, secret, ironOptions));
        } catch {
          return void 0;
        }
      }
      const cookies = cookie.parse(context.req.headers.cookie || "");
      const token = cookies[cookieName];
      if (!token) return;
      try {
        return await refreshHumanSession(context, await import_iron.default.unseal(token, secret, ironOptions));
      } catch {
        return void 0;
      }
    },
    async end({ context }) {
      if (!context?.res) return;
      context.res.setHeader(
        "Set-Cookie",
        cookie.serialize(cookieName, "", {
          maxAge: 0,
          expires: /* @__PURE__ */ new Date(),
          httpOnly: true,
          secure,
          path,
          sameSite,
          domain
        })
      );
    },
    async start({ context, data }) {
      if (!context?.res) return;
      let sessionData = data;
      if (data?.listKey === "User" && data?.itemId) {
        const current = await context.prisma.user.findUnique({ where: { id: data.itemId }, select: { tokenVersion: true } });
        if (!current) throw new Error("Cannot start a session for a missing user");
        sessionData = { ...data, tokenVersion: Number(current.tokenVersion || 0) };
      }
      const sealedData = await import_iron.default.seal(sessionData, secret, {
        ...ironOptions,
        ttl: maxAge * 1e3
      });
      context.res.setHeader(
        "Set-Cookie",
        cookie.serialize(cookieName, sealedData, {
          maxAge,
          expires: new Date(Date.now() + maxAge * 1e3),
          httpOnly: true,
          secure,
          path,
          sameSite,
          domain
        })
      );
      return sealedData;
    }
  };
}
var { withAuth } = (0, import_auth.createAuth)({
  listKey: "User",
  identityField: "email",
  secretField: "password",
  // The first user's Admin role is assigned in the User resolveInput hook (security/user-create.ts),
  // not through itemData's nested role.create.
  initFirstItem: {
    fields: ["name", "email", "password"]
  },
  passwordResetLink: {
    async sendToken(args) {
      await sendPasswordResetToken(args);
    }
  },
  sessionData: `
    id
    name
    email
    tokenVersion
    role {
      id
      name
      ${permissionsList.join("\n      ")}
    }
  `
});
var keystone_default = withAuth((0, import_core45.config)({
  db: { provider: "postgresql", url: pooledDatabaseUrl(databaseURL), extendPrismaClient: throwKeystonePrismaErrors },
  lists: models,
  storage: {
    my_images: {
      kind: "s3",
      type: "image",
      bucketName,
      region,
      accessKeyId,
      secretAccessKey,
      endpoint,
      signed: { expiry: 5e3 },
      forcePathStyle: s3ForcePathStyle(endpoint)
    }
  },
  ui: {
    isAccessAllowed: ({ session }) => permissions.canAccessDashboard({ session }),
    basePath
  },
  session: statelessSessions(sessionConfig),
  graphql: { extendGraphqlSchema }
}));

// keystone.ts
var keystone_default2 = keystone_default;
//# sourceMappingURL=config.js.map

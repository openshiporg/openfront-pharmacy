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
  let text45 = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel().catch(() => void 0);
        throw new Error("External response exceeds the configured size limit");
      }
      text45 += decoder.decode(value, { stream: true });
    }
    return text45 + decoder.decode();
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
  const text45 = await readBoundedExternalResponse(response);
  let body = null;
  try {
    body = text45 ? JSON.parse(text45) : {};
  } catch {
    body = { message: text45.slice(0, 1e3) };
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
var import_core46 = require("@keystone-6/core");
var import_config = require("dotenv/config");
var import_iron = __toESM(require("@hapi/iron"));
var cookie = __toESM(require("cookie"));

// features/keystone/access.ts
var byId = (id) => ({ id: { equals: id } });
function isSignedIn({ session }) {
  return Boolean(session);
}
function canChangeOwnPassword({ session, item }) {
  return Boolean(session && session.itemId === item.id.toString());
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

// features/keystone/lib/mail.ts
var import_nodemailer = require("nodemailer");
function getBaseUrlForEmails() {
  if (process.env.SMTP_STORE_LINK) {
    return process.env.SMTP_STORE_LINK;
  }
  console.warn("SMTP_STORE_LINK not set. Please add SMTP_STORE_LINK to your environment variables for email links to work properly.");
  return "";
}
var transport = (0, import_nodemailer.createTransport)({
  // @ts-ignore
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
function passwordResetEmail({ url }) {
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
async function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST);
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
    organization: (0, import_fields7.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields7.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    patient: (0, import_fields7.relationship)({ ref: "PatientProfile.dispensingLabels", db: requiredRelationshipDb }),
    prescription: (0, import_fields7.relationship)({ ref: "Prescription.dispensingLabels", db: requiredRelationshipDb }),
    prescriptionItem: (0, import_fields7.relationship)({ ref: "PrescriptionItem.dispensingLabels", db: requiredRelationshipDb }),
    order: (0, import_fields7.relationship)({ ref: "Order.dispensingLabels", db: requiredRelationshipDb }),
    pharmacist: (0, import_fields7.relationship)({ ref: "User", db: requiredRelationshipDb }),
    approval: (0, import_fields7.relationship)({ ref: "HumanApproval", db: requiredRelationshipDb }),
    ...trackingFields
  }
});

// features/keystone/models/DrugReference.ts
var import_core7 = require("@keystone-6/core");
var import_access11 = require("@keystone-6/core/access");
var import_fields8 = require("@keystone-6/core/fields");
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
      type: "string",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Unverified", value: "unverified" }
      ],
      defaultValue: "unverified"
    }),
    sourceName: (0, import_fields8.text)({ defaultValue: "manual", access: { create: import_access11.denyAll, update: import_access11.denyAll } }),
    sourceVersion: (0, import_fields8.text)({ access: { create: import_access11.denyAll, update: import_access11.denyAll } }),
    sourceReference: (0, import_fields8.text)({ access: { create: import_access11.denyAll, update: import_access11.denyAll } }),
    sourceVerified: (0, import_fields8.checkbox)({
      defaultValue: false,
      access: { create: import_access11.denyAll, update: import_access11.denyAll }
    }),
    reviewedAt: (0, import_fields8.timestamp)({ access: { create: import_access11.denyAll, update: import_access11.denyAll } }),
    reviewedBy: (0, import_fields8.relationship)({ ref: "User", access: { create: import_access11.denyAll, update: import_access11.denyAll } }),
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
        ["pos", "pickup"].includes(resolvedData.fulfillmentMethod) && resolvedData.checkoutEvidence?.workflow === "operator_attested_otc_pos_cash" && Boolean(resolvedData.approval?.connect?.id) && resolvedData.checkoutEvidence.approvalId === resolvedData.approval.connect.id
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

// features/keystone/models/OutboxEvent.ts
var import_core19 = require("@keystone-6/core");
var import_access30 = require("@keystone-6/core/access");
var import_fields20 = require("@keystone-6/core/fields");
var OutboxEvent = (0, import_core19.list)({
  access: {
    operation: {
      query: import_access30.denyAll,
      create: import_access30.denyAll,
      update: import_access30.denyAll,
      delete: import_access30.denyAll
    },
    filter: { query: rules.canReadTenantRecords }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: {
    isHidden: true,
    hideCreate: true,
    hideDelete: true,
    listView: { initialColumns: ["eventType", "aggregateType", "aggregateId", "status", "occurredAt"] }
  },
  fields: {
    eventKey: (0, import_fields20.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    eventType: (0, import_fields20.text)({ validation: { isRequired: true }, isIndexed: true }),
    aggregateType: (0, import_fields20.text)({ validation: { isRequired: true }, isIndexed: true }),
    aggregateId: (0, import_fields20.text)({ validation: { isRequired: true }, isIndexed: true }),
    payload: (0, import_fields20.json)({ access: { update: import_access30.denyAll } }),
    payloadHash: (0, import_fields20.text)({ validation: { isRequired: true }, access: { update: import_access30.denyAll } }),
    status: (0, import_fields20.select)({
      type: "string",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Processing", value: "processing" },
        { label: "Delivered", value: "delivered" },
        { label: "Failed", value: "failed" },
        { label: "Dead letter", value: "dead_letter" }
      ],
      defaultValue: "pending",
      validation: { isRequired: true }
    }),
    attempts: (0, import_fields20.integer)({ defaultValue: 0, validation: { isRequired: true, min: 0 } }),
    maxAttempts: (0, import_fields20.integer)({ defaultValue: 8, validation: { isRequired: true, min: 1 } }),
    replayCount: (0, import_fields20.integer)({ defaultValue: 0, validation: { isRequired: true, min: 0 } }),
    lastError: (0, import_fields20.text)({ db: { isNullable: true } }),
    nextAttemptAt: (0, import_fields20.timestamp)(),
    lockedAt: (0, import_fields20.timestamp)(),
    lockToken: (0, import_fields20.text)({ isIndexed: true, db: { isNullable: true } }),
    occurredAt: (0, import_fields20.timestamp)({ validation: { isRequired: true }, defaultValue: { kind: "now" }, access: { update: import_access30.denyAll } }),
    processedAt: (0, import_fields20.timestamp)(),
    ...trackingFields,
    organization: (0, import_fields20.relationship)({ ref: "Organization.outboxEvents", db: requiredRelationshipDb }),
    location: (0, import_fields20.relationship)({ ref: "PharmacyLocation.outboxEvents" })
  }
});

// features/keystone/models/Organization.ts
var import_core20 = require("@keystone-6/core");
var import_access32 = require("@keystone-6/core/access");
var import_fields21 = require("@keystone-6/core/fields");

// features/lib/store-logo.ts
var DEFAULT_STORE_LOGO_ICON = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" height="100%" width="100%" viewBox="0 0 42 48"><path fill="#155eef" fill-rule="evenodd" d="m22.102 20.86 9.9-9.9L29.88 8.84l-7.339 7.339V3h-3v13.178l-7.339-7.34-2.121 2.122 9.9 9.9 1.06 1.06zm2.12 2.121 9.9-9.9 2.121 2.122-7.339 7.339H42v3H28.904l7.34 7.339L34.121 35l-9.9-9.899-1.06-1.06zM7.96 35.001l9.9-9.899 1.06-1.06-1.06-1.061-9.9-9.9-2.121 2.122 7.339 7.339H.002v3h13.176l-7.34 7.339zm12.02-7.777-9.9 9.9 2.122 2.12 7.339-7.338V45h3V31.906l7.339 7.338L32 37.124l-9.9-9.9-1.06-1.061z" clip-rule="evenodd"/></svg>';
var DEFAULT_STORE_LOGO_COLOR = "0";
function normalizeStoreLogoColor(value) {
  const numeric = Number.parseFloat(String(value ?? DEFAULT_STORE_LOGO_COLOR));
  if (!Number.isFinite(numeric)) return DEFAULT_STORE_LOGO_COLOR;
  return String((numeric % 360 + 360) % 360);
}

// features/lib/sanitize-store-logo.ts
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
  if (!source.startsWith("<svg") || !source.endsWith("</svg>") || source.length > 1e5) return "";
  if (/<!|<\?|\b(?:javascript|data|vbscript):|\bon[a-z]+\s*=|\b(?:href|src|style)\s*=/i.test(source)) return "";
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
    supportEmail: organization.supportEmail || null,
    supportPhone: organization.supportPhone || null,
    privacyNotice: organization.privacyNotice || null
  };
}

// features/keystone/models/Organization.ts
var Organization = (0, import_core20.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: import_access32.denyAll,
      update: permissions.canManageOrganizations,
      delete: import_access32.denyAll
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
    name: (0, import_fields21.text)({ validation: { isRequired: true } }),
    slug: (0, import_fields21.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    storefrontKey: (0, import_fields21.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    storefrontHost: (0, import_fields21.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    operatorDisplayName: (0, import_fields21.text)({ validation: { isRequired: true } }),
    operatorTagline: (0, import_fields21.text)({ defaultValue: "Independent pharmacy care" }),
    brandPrimaryColor: (0, import_fields21.text)({ defaultValue: "#18352b" }),
    brandAccentColor: (0, import_fields21.text)({ defaultValue: "#8ec9ad" }),
    brandLogoUrl: (0, import_fields21.text)(),
    logoIcon: (0, import_fields21.text)({ defaultValue: DEFAULT_STORE_LOGO_ICON, hooks: {
      resolveInput: ({ resolvedData, fieldKey }) => resolvedData[fieldKey] === void 0 ? void 0 : sanitizeStoreLogoSvg(String(resolvedData[fieldKey] || "")),
      validateInput: ({ inputData, resolvedData, fieldKey, addValidationError }) => {
        if (typeof inputData[fieldKey] === "string" && inputData[fieldKey].trim() && !resolvedData[fieldKey]) addValidationError("Logo must be a valid, safe SVG document");
      }
    } }),
    logoColor: (0, import_fields21.text)({ defaultValue: DEFAULT_STORE_LOGO_COLOR, hooks: {
      resolveInput: ({ resolvedData, fieldKey }) => resolvedData[fieldKey] === void 0 ? void 0 : normalizeStoreLogoColor(resolvedData[fieldKey])
    } }),
    // Retained column; no longer read or written.
    isDemo: (0, import_fields21.checkbox)({ defaultValue: false, access: { create: import_access32.denyAll, update: import_access32.denyAll }, ui: { createView: { fieldMode: "hidden" }, itemView: { fieldMode: "hidden" }, listView: { fieldMode: "hidden" } } }),
    supportEmail: (0, import_fields21.text)(),
    supportPhone: (0, import_fields21.text)(),
    privacyNotice: (0, import_fields21.text)({ ui: { displayMode: "textarea", description: "Notice of Privacy Practices shown at /privacy and linked from checkout." } }),
    prescriptionFillPolicy: (0, import_fields21.json)({ access: { create: import_access32.denyAll, update: import_access32.denyAll }, ui: { description: "Versioned operator-reviewed policy; only the controlled fill policy command may change it. Existing fills keep their snapshot." } }),
    cashSalesEnabled: (0, import_fields21.checkbox)({ defaultValue: false, access: { create: import_access32.denyAll, update: import_access32.denyAll }, ui: { description: "Enabled only by the operator-attested cash/tax policy workflow." } }),
    cashTaxRateBps: (0, import_fields21.integer)({ defaultValue: 0, validation: { min: 0, max: 1e4 }, access: { create: import_access32.denyAll, update: import_access32.denyAll } }),
    cashTaxPolicyReference: (0, import_fields21.text)({ access: { create: import_access32.denyAll, update: import_access32.denyAll } }),
    cashPolicyReviewedAt: (0, import_fields21.timestamp)({ access: { create: import_access32.denyAll, update: import_access32.denyAll } }),
    cashPolicyReviewedBy: (0, import_fields21.relationship)({ ref: "User", access: { create: import_access32.denyAll, update: import_access32.denyAll } }),
    status: (0, import_fields21.select)({
      type: "string",
      options: [
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
        { label: "Archived", value: "archived" }
      ],
      defaultValue: "active"
    }),
    locations: (0, import_fields21.relationship)({ ref: "PharmacyLocation.organization", many: true, access: immutableRelationship }),
    memberships: (0, import_fields21.relationship)({ ref: "OrganizationMembership.organization", many: true, access: immutableRelationship }),
    patients: (0, import_fields21.relationship)({ ref: "PatientProfile.organizations", many: true, access: immutableRelationship }),
    products: (0, import_fields21.relationship)({ ref: "Product.organization", many: true, access: immutableRelationship }),
    drugReferenceReviews: (0, import_fields21.relationship)({ ref: "DrugReferenceReview.organization", many: true, access: immutableRelationship }),
    prescriptions: (0, import_fields21.relationship)({ ref: "Prescription.organization", many: true, access: immutableRelationship }),
    recalls: (0, import_fields21.relationship)({ ref: "Recall.organization", many: true, access: immutableRelationship }),
    orders: (0, import_fields21.relationship)({ ref: "Order.organization", many: true, access: immutableRelationship }),
    integrationProviders: (0, import_fields21.relationship)({ ref: "IntegrationProvider.organization", many: true, access: immutableRelationship }),
    outboxEvents: (0, import_fields21.relationship)({ ref: "OutboxEvent.organization", many: true, access: immutableRelationship }),
    paymentWebhookEvents: (0, import_fields21.relationship)({ ref: "PaymentWebhookEvent.organization", many: true, access: immutableRelationship }),
    machineCredentials: (0, import_fields21.relationship)({ ref: "MachineCredential.organization", many: true, access: immutableRelationship }),
    externalIntegrationWorkflows: (0, import_fields21.relationship)({ ref: "ExternalIntegrationWorkflow.organization", many: true, access: immutableRelationship }),
    integrationWebhookEvents: (0, import_fields21.relationship)({ ref: "IntegrationWebhookEvent.organization", many: true, access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/OrganizationMembership.ts
var import_core21 = require("@keystone-6/core");
var import_access34 = require("@keystone-6/core/access");
var import_fields22 = require("@keystone-6/core/fields");
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
var OrganizationMembership = (0, import_core21.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageUsers,
      update: permissions.canManageUsers,
      delete: import_access34.denyAll
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
    membershipKey: (0, import_fields22.text)({ isIndexed: "unique", access: { create: import_access34.denyAll, update: import_access34.denyAll } }),
    user: (0, import_fields22.relationship)({ ref: "User.memberships", db: requiredRelationshipDb }),
    organization: (0, import_fields22.relationship)({ ref: "Organization.memberships", db: requiredRelationshipDb }),
    location: (0, import_fields22.relationship)({ ref: "PharmacyLocation.memberships" }),
    membershipRole: (0, import_fields22.select)({
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
    status: (0, import_fields22.select)({
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
    externalCredentialValidated: (0, import_fields22.checkbox)({
      defaultValue: false,
      access: { create: import_access34.denyAll, update: import_access34.denyAll },
      ui: { description: "Organization-recorded review evidence only; the software does not validate licensure." }
    }),
    credentialVerificationMethod: (0, import_fields22.select)({
      type: "string",
      options: [
        { label: "Not recorded", value: "not_recorded" },
        { label: "Organization-recorded source review", value: "organization_recorded" },
        { label: "Contracted external provider", value: "external_provider" }
      ],
      defaultValue: "not_recorded",
      access: { create: import_access34.denyAll, update: import_access34.denyAll }
    }),
    credentialType: (0, import_fields22.text)({ access: { create: import_access34.denyAll, update: import_access34.denyAll } }),
    credentialJurisdiction: (0, import_fields22.text)({ access: { create: import_access34.denyAll, update: import_access34.denyAll } }),
    credentialIdentifier: (0, import_fields22.text)({ access: { create: import_access34.denyAll, update: import_access34.denyAll } }),
    credentialValidationReference: (0, import_fields22.text)({ access: { create: import_access34.denyAll, update: import_access34.denyAll } }),
    credentialValidatedAt: (0, import_fields22.timestamp)({ access: { create: import_access34.denyAll, update: import_access34.denyAll } }),
    credentialExpiresAt: (0, import_fields22.timestamp)({ access: { create: import_access34.denyAll, update: import_access34.denyAll } }),
    credentialVerifiedBy: (0, import_fields22.relationship)({ ref: "User", access: { create: import_access34.denyAll, update: import_access34.denyAll } }),
    ...trackingFields
  }
});

// features/keystone/models/PatientAllergy.ts
var import_core22 = require("@keystone-6/core");
var import_access36 = require("@keystone-6/core/access");
var import_fields23 = require("@keystone-6/core/fields");
var PatientAllergy = (0, import_core22.list)({
  access: {
    operation: { query: isSignedIn, create: import_access36.denyAll, update: import_access36.denyAll, delete: import_access36.denyAll },
    filter: { query: rules.canReadPatientChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    allergyKey: (0, import_fields23.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    requestFingerprint: (0, import_fields23.text)({ validation: { isRequired: true } }),
    allergen: (0, import_fields23.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    reaction: (0, import_fields23.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    severity: (0, import_fields23.select)({
      type: "string",
      options: [
        { label: "Unknown", value: "unknown" },
        { label: "Mild", value: "mild" },
        { label: "Moderate", value: "moderate" },
        { label: "Severe", value: "severe" }
      ],
      defaultValue: "unknown"
    }),
    status: (0, import_fields23.select)({ type: "string", options: [{ label: "Active", value: "active" }, { label: "Entered in error", value: "entered_in_error" }, { label: "Inactive", value: "inactive" }], defaultValue: "active" }),
    source: (0, import_fields23.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    sourceReference: (0, import_fields23.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    recordedAt: (0, import_fields23.timestamp)({ defaultValue: { kind: "now" }, validation: { isRequired: true } }),
    organization: (0, import_fields23.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    patient: (0, import_fields23.relationship)({ ref: "PatientProfile.allergies", db: requiredRelationshipDb }),
    recordedBy: (0, import_fields23.relationship)({ ref: "User", db: requiredRelationshipDb }),
    approval: (0, import_fields23.relationship)({ ref: "HumanApproval" }),
    ...trackingFields
  }
});

// features/keystone/models/PatientMedication.ts
var import_core23 = require("@keystone-6/core");
var import_access38 = require("@keystone-6/core/access");
var import_fields24 = require("@keystone-6/core/fields");
var PatientMedication = (0, import_core23.list)({
  access: {
    operation: { query: isSignedIn, create: import_access38.denyAll, update: import_access38.denyAll, delete: import_access38.denyAll },
    filter: { query: rules.canReadPatientChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    medicationKey: (0, import_fields24.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    requestFingerprint: (0, import_fields24.text)({ validation: { isRequired: true } }),
    medicationName: (0, import_fields24.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    directions: (0, import_fields24.text)({ access: { read: permissions.canViewPatientPrivateData } }),
    status: (0, import_fields24.select)({ type: "string", options: [{ label: "Current", value: "current" }, { label: "Discontinued", value: "discontinued" }, { label: "Entered in error", value: "entered_in_error" }], defaultValue: "current" }),
    source: (0, import_fields24.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    sourceReference: (0, import_fields24.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    recordedAt: (0, import_fields24.timestamp)({ defaultValue: { kind: "now" }, validation: { isRequired: true } }),
    organization: (0, import_fields24.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    patient: (0, import_fields24.relationship)({ ref: "PatientProfile.medications", db: requiredRelationshipDb }),
    recordedBy: (0, import_fields24.relationship)({ ref: "User", db: requiredRelationshipDb }),
    approval: (0, import_fields24.relationship)({ ref: "HumanApproval" }),
    ...trackingFields
  }
});

// features/keystone/models/PatientProfile.ts
var import_core24 = require("@keystone-6/core");
var import_access40 = require("@keystone-6/core/access");
var import_fields25 = require("@keystone-6/core/fields");
var privateRead = { read: permissions.canViewPatientPrivateData };
var PatientProfile = (0, import_core24.list)({
  access: {
    operation: {
      query: import_access40.denyAll,
      create: import_access40.denyAll,
      update: import_access40.denyAll,
      delete: import_access40.denyAll
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
    patientNumber: (0, import_fields25.text)({ validation: { isRequired: true }, isIndexed: "unique", access: privateRead }),
    identityKey: (0, import_fields25.text)({ isIndexed: "unique", db: { isNullable: true }, access: privateRead }),
    requestFingerprint: (0, import_fields25.text)({ db: { isNullable: true }, access: privateRead }),
    firstName: (0, import_fields25.text)({ validation: { isRequired: true }, access: privateRead }),
    lastName: (0, import_fields25.text)({ validation: { isRequired: true }, access: privateRead }),
    displayName: (0, import_fields25.virtual)({
      access: privateRead,
      field: import_core24.graphql.field({
        type: import_core24.graphql.String,
        resolve(item) {
          return `${String(item.firstName || "")} ${String(item.lastName || "")}`.trim();
        }
      })
    }),
    status: (0, import_fields25.select)({
      type: "string",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Archived", value: "archived" }
      ],
      defaultValue: "active"
    }),
    dateOfBirth: (0, import_fields25.timestamp)({ access: privateRead }),
    email: (0, import_fields25.text)({ access: privateRead }),
    phone: (0, import_fields25.text)({ access: privateRead }),
    address: (0, import_fields25.json)({ access: privateRead }),
    identityVerificationStatus: (0, import_fields25.select)({
      type: "string",
      options: [
        { label: "Not recorded", value: "unverified" },
        { label: "Operator-confirmed match", value: "confirmed" },
        { label: "Rejected mismatch", value: "rejected" }
      ],
      defaultValue: "unverified",
      access: { ...privateRead, create: import_access40.denyAll, update: import_access40.denyAll }
    }),
    identityReference: (0, import_fields25.text)({ access: { ...privateRead, create: import_access40.denyAll, update: import_access40.denyAll } }),
    identityVerifiedAt: (0, import_fields25.timestamp)({ access: { ...privateRead, create: import_access40.denyAll, update: import_access40.denyAll } }),
    identityVerifiedBy: (0, import_fields25.relationship)({ ref: "User", access: { ...privateRead, create: import_access40.denyAll, update: import_access40.denyAll } }),
    identityEvidence: (0, import_fields25.json)({ access: privateRead, ui: { description: "Operator-recorded identity matching evidence; not a government identity validation claim." } }),
    preferredContactMethod: (0, import_fields25.select)({
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
    notes: (0, import_fields25.text)({ access: privateRead, ui: { displayMode: "textarea", description: "Minimum necessary operational note; do not use as a full medical record." } }),
    user: (0, import_fields25.relationship)({ ref: "User.patientProfile" }),
    organizations: (0, import_fields25.relationship)({ ref: "Organization.patients", many: true, db: requiredRelationshipDb }),
    consents: (0, import_fields25.relationship)({ ref: "ConsentRecord.patient", many: true }),
    allergies: (0, import_fields25.relationship)({ ref: "PatientAllergy.patient", many: true }),
    medications: (0, import_fields25.relationship)({ ref: "PatientMedication.patient", many: true }),
    safetyReviews: (0, import_fields25.relationship)({ ref: "ClinicalSafetyReview.patient", many: true }),
    dispensingLabels: (0, import_fields25.relationship)({ ref: "DispensingLabel.patient", many: true }),
    prescriptions: (0, import_fields25.relationship)({ ref: "Prescription.patient", many: true }),
    refillRequests: (0, import_fields25.relationship)({ ref: "RefillRequest.patient", many: true }),
    transfers: (0, import_fields25.relationship)({ ref: "PrescriptionTransfer.patient", many: true }),
    orders: (0, import_fields25.relationship)({ ref: "Order.patient", many: true }),
    auditEvents: (0, import_fields25.relationship)({ ref: "AuditEvent.patient", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/Payment.ts
var import_core25 = require("@keystone-6/core");
var import_access42 = require("@keystone-6/core/access");
var import_fields26 = require("@keystone-6/core/fields");
var Payment = (0, import_core25.list)({
  access: {
    operation: {
      query: permissions.canManagePayments,
      create: import_access42.denyAll,
      update: import_access42.denyAll,
      delete: import_access42.denyAll
    },
    filter: { query: rules.canReadPayments }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    amount: (0, import_fields26.integer)({ validation: { isRequired: true, min: 0 } }),
    currencyCode: (0, import_fields26.text)({ validation: { isRequired: true }, defaultValue: "USD" }),
    status: (0, import_fields26.select)({
      type: "string",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Authorized", value: "authorized" },
        { label: "Captured", value: "captured" },
        { label: "Refund pending", value: "refund_pending" },
        { label: "Refunded", value: "refunded" },
        { label: "Failed", value: "failed" }
      ],
      defaultValue: "pending"
    }),
    tenderMethod: (0, import_fields26.select)({ type: "string", options: [{ label: "Provider", value: "provider" }, { label: "Operator-attested cash", value: "cash" }], defaultValue: "provider" }),
    cashReceivedAmount: (0, import_fields26.integer)({ validation: { min: 0 } }),
    changeDueAmount: (0, import_fields26.integer)({ validation: { min: 0 } }),
    externalPaymentId: (0, import_fields26.text)({ isIndexed: true }),
    processedAt: (0, import_fields26.timestamp)(),
    data: (0, import_fields26.json)({ access: { read: permissions.canManagePayments } }),
    organization: (0, import_fields26.relationship)({ ref: "Organization" }),
    location: (0, import_fields26.relationship)({ ref: "PharmacyLocation" }),
    order: (0, import_fields26.relationship)({ ref: "Order.payments", db: requiredRelationshipDb }),
    provider: (0, import_fields26.relationship)({ ref: "PaymentProvider.payments" }),
    session: (0, import_fields26.relationship)({ ref: "PaymentSession.payment" }),
    recordedBy: (0, import_fields26.relationship)({ ref: "User" }),
    approval: (0, import_fields26.relationship)({ ref: "HumanApproval" }),
    ...trackingFields
  }
});

// features/keystone/models/PaymentProvider.ts
var import_core26 = require("@keystone-6/core");
var import_access44 = require("@keystone-6/core/access");
var import_fields27 = require("@keystone-6/core/fields");
var PaymentProvider = (0, import_core26.list)({
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
    providerKey: (0, import_fields27.text)({ isIndexed: "unique", access: { update: import_access44.denyAll } }),
    name: (0, import_fields27.text)({ validation: { isRequired: true } }),
    code: (0, import_fields27.text)({
      isIndexed: true,
      validation: {
        isRequired: true,
        match: {
          regex: /^pp_[a-zA-Z0-9-_]+$/,
          explanation: 'Payment provider code must start with "pp_" followed by alphanumeric characters, hyphens or underscores'
        }
      }
    }),
    isInstalled: (0, import_fields27.checkbox)({ defaultValue: false }),
    credentials: (0, import_fields27.json)({ access: { read: import_access44.denyAll } }),
    metadata: (0, import_fields27.json)(),
    createPaymentFunction: (0, import_fields27.text)({ validation: { isRequired: true } }),
    capturePaymentFunction: (0, import_fields27.text)({ validation: { isRequired: true } }),
    refundPaymentFunction: (0, import_fields27.text)({ validation: { isRequired: true } }),
    getPaymentStatusFunction: (0, import_fields27.text)({ validation: { isRequired: true } }),
    generatePaymentLinkFunction: (0, import_fields27.text)({ validation: { isRequired: true } }),
    handleWebhookFunction: (0, import_fields27.text)({ validation: { isRequired: true } }),
    organization: (0, import_fields27.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    integrationProvider: (0, import_fields27.relationship)({ ref: "IntegrationProvider.paymentProviders" }),
    paymentSessions: (0, import_fields27.relationship)({ ref: "PaymentSession.provider", many: true }),
    payments: (0, import_fields27.relationship)({ ref: "Payment.provider", many: true }),
    webhookEvents: (0, import_fields27.relationship)({ ref: "PaymentWebhookEvent.provider", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/PaymentSession.ts
var import_core27 = require("@keystone-6/core");
var import_access46 = require("@keystone-6/core/access");
var import_fields28 = require("@keystone-6/core/fields");
var PaymentSession = (0, import_core27.list)({
  access: {
    operation: {
      query: permissions.canManagePayments,
      create: import_access46.denyAll,
      update: import_access46.denyAll,
      delete: import_access46.denyAll
    },
    filter: { query: rules.canReadPaymentSessions }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    amount: (0, import_fields28.integer)({ validation: { isRequired: true, min: 0 } }),
    currencyCode: (0, import_fields28.text)({ validation: { isRequired: true }, defaultValue: "USD" }),
    status: (0, import_fields28.select)({
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
    isSelected: (0, import_fields28.checkbox)({ defaultValue: true }),
    idempotencyKey: (0, import_fields28.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    externalPaymentId: (0, import_fields28.text)({ isIndexed: true, db: { isNullable: true } }),
    reconciliationStatus: (0, import_fields28.select)({
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
    reconciliationAttempts: (0, import_fields28.integer)({ validation: { min: 0 }, defaultValue: 0 }),
    lastReconciledAt: (0, import_fields28.timestamp)(),
    failureReason: (0, import_fields28.text)({ db: { isNullable: true }, ui: { displayMode: "textarea" } }),
    data: (0, import_fields28.json)({ access: { read: permissions.canManagePayments } }),
    organization: (0, import_fields28.relationship)({ ref: "Organization" }),
    location: (0, import_fields28.relationship)({ ref: "PharmacyLocation" }),
    cart: (0, import_fields28.relationship)({ ref: "Cart.paymentSessions", db: requiredRelationshipDb }),
    provider: (0, import_fields28.relationship)({ ref: "PaymentProvider.paymentSessions", db: requiredRelationshipDb }),
    payment: (0, import_fields28.relationship)({ ref: "Payment.session" }),
    ...trackingFields
  }
});

// features/keystone/models/PaymentWebhookEvent.ts
var import_core28 = require("@keystone-6/core");
var import_access48 = require("@keystone-6/core/access");
var import_fields29 = require("@keystone-6/core/fields");
var PaymentWebhookEvent = (0, import_core28.list)({
  access: { operation: { query: import_access48.denyAll, create: import_access48.denyAll, update: import_access48.denyAll, delete: import_access48.denyAll } },
  graphql: { omit: { create: true, update: true, delete: true } },
  fields: {
    eventKey: (0, import_fields29.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    externalEventId: (0, import_fields29.text)({ validation: { isRequired: true }, isIndexed: true }),
    eventType: (0, import_fields29.text)({ validation: { isRequired: true } }),
    status: (0, import_fields29.select)({
      type: "string",
      options: [
        { label: "Received", value: "received" },
        { label: "Processed", value: "processed" },
        { label: "Ignored", value: "ignored" },
        { label: "Failed", value: "failed" }
      ],
      defaultValue: "received"
    }),
    resource: (0, import_fields29.json)(),
    error: (0, import_fields29.text)({ ui: { displayMode: "textarea" } }),
    receivedAt: (0, import_fields29.timestamp)({ defaultValue: { kind: "now" } }),
    processedAt: (0, import_fields29.timestamp)(),
    organization: (0, import_fields29.relationship)({ ref: "Organization.paymentWebhookEvents", db: requiredRelationshipDb }),
    provider: (0, import_fields29.relationship)({ ref: "PaymentProvider.webhookEvents", db: requiredRelationshipDb }),
    ...trackingFields
  }
});

// features/keystone/models/PharmacyLocation.ts
var import_core29 = require("@keystone-6/core");
var import_access49 = require("@keystone-6/core/access");
var import_fields30 = require("@keystone-6/core/fields");

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
var DEFAULT_WEEK = [null, ...Array.from({ length: 5 }, () => ({ open: "09:00", close: "19:00" })), { open: "10:00", close: "16:00" }];

// features/keystone/models/PharmacyLocation.ts
var PharmacyLocation = (0, import_core29.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageLocations,
      update: permissions.canManageLocations,
      delete: import_access49.denyAll
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
    name: (0, import_fields30.text)({ validation: { isRequired: true } }),
    code: (0, import_fields30.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    status: (0, import_fields30.select)({
      type: "string",
      options: [
        { label: "Active", value: "active" },
        { label: "Temporarily closed", value: "temporarily_closed" },
        { label: "Archived", value: "archived" }
      ],
      defaultValue: "active"
    }),
    organization: (0, import_fields30.relationship)({ ref: "Organization.locations", db: requiredRelationshipDb }),
    memberships: (0, import_fields30.relationship)({ ref: "OrganizationMembership.location", many: true, access: immutableRelationship }),
    address: (0, import_fields30.json)({ ui: { description: "Operational address only; validate jurisdiction-specific requirements externally." } }),
    timezone: (0, import_fields30.text)({ defaultValue: "America/New_York" }),
    // Weekly hours: { store: Day[7], pharmacy: Day[7] }, Sunday first; a Day is { open: 'HH:MM', close: 'HH:MM' } or null when closed.
    hours: (0, import_fields30.json)({ ui: { description: "Weekly store and pharmacy counter hours, edited in Store Settings." } }),
    phone: (0, import_fields30.text)(),
    onlineOrderingEnabled: (0, import_fields30.checkbox)({ defaultValue: true, access: { create: permissions.canManageLocations, update: permissions.canManageLocations } }),
    pickupEnabled: (0, import_fields30.checkbox)({ defaultValue: true }),
    deliveryEnabled: (0, import_fields30.checkbox)({ defaultValue: false, access: { create: permissions.canManageLocations, update: permissions.canManageLocations } }),
    products: (0, import_fields30.relationship)({ ref: "Product.location", many: true, access: immutableRelationship }),
    inventoryLots: (0, import_fields30.relationship)({ ref: "InventoryLot.location", many: true, access: immutableRelationship }),
    prescriptions: (0, import_fields30.relationship)({ ref: "Prescription.location", many: true, access: immutableRelationship }),
    recalls: (0, import_fields30.relationship)({ ref: "Recall.location", many: true, access: immutableRelationship }),
    orders: (0, import_fields30.relationship)({ ref: "Order.location", many: true, access: immutableRelationship }),
    outboxEvents: (0, import_fields30.relationship)({ ref: "OutboxEvent.location", many: true, access: immutableRelationship }),
    machineCredentials: (0, import_fields30.relationship)({ ref: "MachineCredential.location", many: true, access: immutableRelationship }),
    externalIntegrationWorkflows: (0, import_fields30.relationship)({ ref: "ExternalIntegrationWorkflow.location", many: true, access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/Prescriber.ts
var import_core30 = require("@keystone-6/core");
var import_access51 = require("@keystone-6/core/access");
var import_fields31 = require("@keystone-6/core/fields");
var Prescriber = (0, import_core30.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManagePrescriptions,
      update: permissions.canManagePrescriptions,
      delete: import_access51.denyAll
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
    name: (0, import_fields31.text)({ validation: { isRequired: true } }),
    npi: (0, import_fields31.text)({ isIndexed: true }),
    phone: (0, import_fields31.text)(),
    fax: (0, import_fields31.text)(),
    externalIdentifier: (0, import_fields31.text)(),
    verificationStatus: (0, import_fields31.select)({
      type: "string",
      options: [
        { label: "Unverified", value: "unverified" },
        { label: "Pending verification evidence", value: "pending" },
        { label: "Verification evidence recorded", value: "validated" },
        { label: "Rejected", value: "rejected" }
      ],
      defaultValue: "unverified"
    }),
    externalValidationComplete: (0, import_fields31.checkbox)({ defaultValue: false, access: { update: import_access51.denyAll }, ui: { description: "Recorded evidence flag; not a software licensure claim." } }),
    verificationMethod: (0, import_fields31.select)({
      type: "string",
      options: [
        { label: "Not recorded", value: "not_recorded" },
        { label: "Organization-recorded source review", value: "organization_recorded" },
        { label: "Contracted external provider", value: "external_provider" }
      ],
      defaultValue: "not_recorded",
      access: { update: import_access51.denyAll }
    }),
    credentialType: (0, import_fields31.text)({ access: { update: import_access51.denyAll } }),
    credentialJurisdiction: (0, import_fields31.text)({ access: { update: import_access51.denyAll } }),
    credentialIdentifier: (0, import_fields31.text)({ access: { update: import_access51.denyAll } }),
    credentialExpiresAt: (0, import_fields31.timestamp)({ access: { update: import_access51.denyAll } }),
    validationReference: (0, import_fields31.text)({ access: { update: import_access51.denyAll } }),
    validatedAt: (0, import_fields31.timestamp)({ access: { update: import_access51.denyAll } }),
    verifiedBy: (0, import_fields31.relationship)({ ref: "User", access: { update: import_access51.denyAll } }),
    organization: (0, import_fields31.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    integrationProvider: (0, import_fields31.relationship)({ ref: "IntegrationProvider.prescribers" }),
    prescriptions: (0, import_fields31.relationship)({ ref: "Prescription.prescriber", many: true, access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/Prescription.ts
var import_core31 = require("@keystone-6/core");
var import_access53 = require("@keystone-6/core/access");
var import_fields32 = require("@keystone-6/core/fields");

// features/keystone/workflows/pharmacy-state.ts
var prescriptionTransitions = {
  draft: ["pending_review", "cancelled"],
  pending_review: ["needs_information", "approved", "rejected", "cancelled"],
  needs_information: ["pending_review", "cancelled"],
  approved: ["ready_to_dispense", "fill_closed", "cancelled"],
  ready_to_dispense: ["approved", "partially_dispensed", "dispensed", "fill_closed", "cancelled"],
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

// features/keystone/models/Prescription.ts
var Prescription = (0, import_core31.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: import_access53.denyAll,
      update: import_access53.denyAll,
      delete: import_access53.denyAll
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
    prescriptionNumber: (0, import_fields32.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    intakeRequestFingerprint: (0, import_fields32.text)({ db: { isNullable: true }, access: { read: import_access53.denyAll, create: import_access53.denyAll, update: import_access53.denyAll } }),
    source: (0, import_fields32.select)({
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
    sourceVerificationStatus: (0, import_fields32.select)({
      type: "string",
      options: [
        { label: "Unverified", value: "unverified" },
        { label: "Pending", value: "pending" },
        { label: "Verified by authorized human", value: "human_verified" },
        { label: "Rejected", value: "rejected" }
      ],
      defaultValue: "unverified"
    }),
    externalReference: (0, import_fields32.text)({ access: { read: permissions.canViewPatientPrivateData } }),
    status: (0, import_fields32.select)({
      access: { update: () => false },
      type: "string",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Pending review", value: "pending_review" },
        { label: "Needs information", value: "needs_information" },
        { label: "Approved", value: "approved" },
        { label: "Ready to dispense", value: "ready_to_dispense" },
        { label: "Partially dispensed", value: "partially_dispensed" },
        { label: "Dispensed", value: "dispensed" },
        { label: "Fill closed with undispensed quantity", value: "fill_closed" },
        { label: "Rejected", value: "rejected" },
        { label: "Cancelled", value: "cancelled" }
      ],
      defaultValue: "draft"
    }),
    writtenAt: (0, import_fields32.timestamp)(),
    expiresAt: (0, import_fields32.timestamp)(),
    approvedAt: (0, import_fields32.timestamp)({ access: { update: () => false } }),
    dispensedAt: (0, import_fields32.timestamp)({ access: { update: () => false } }),
    organization: (0, import_fields32.relationship)({ ref: "Organization.prescriptions", db: requiredRelationshipDb }),
    location: (0, import_fields32.relationship)({ ref: "PharmacyLocation.prescriptions", db: requiredRelationshipDb }),
    patient: (0, import_fields32.relationship)({ ref: "PatientProfile.prescriptions", db: requiredRelationshipDb }),
    prescriber: (0, import_fields32.relationship)({ ref: "Prescriber.prescriptions", db: requiredRelationshipDb }),
    items: (0, import_fields32.relationship)({ ref: "PrescriptionItem.prescription", many: true }),
    reviews: (0, import_fields32.relationship)({ ref: "PrescriptionReview.prescription", many: true }),
    safetyReviews: (0, import_fields32.relationship)({ ref: "ClinicalSafetyReview.prescription", many: true }),
    dispensingLabels: (0, import_fields32.relationship)({ ref: "DispensingLabel.prescription", many: true }),
    refillRequests: (0, import_fields32.relationship)({ ref: "RefillRequest.prescription", many: true }),
    transfers: (0, import_fields32.relationship)({ ref: "PrescriptionTransfer.prescription", many: true }),
    approval: (0, import_fields32.relationship)({ ref: "HumanApproval.prescriptions" }),
    orders: (0, import_fields32.relationship)({ ref: "Order.prescription", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/PrescriptionFill.ts
var import_core32 = require("@keystone-6/core");
var import_access55 = require("@keystone-6/core/access");
var import_fields33 = require("@keystone-6/core/fields");
var PrescriptionFill = (0, import_core32.list)({
  access: {
    operation: { query: isSignedIn, create: import_access55.denyAll, update: import_access55.denyAll, delete: import_access55.denyAll },
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
    reservationKey: (0, import_fields33.text)({ isIndexed: "unique" }),
    requestFingerprint: (0, import_fields33.text)({ access: { read: import_access55.denyAll } }),
    openKey: (0, import_fields33.text)({ isIndexed: "unique", db: { isNullable: true } }),
    kind: (0, import_fields33.text)(),
    status: (0, import_fields33.text)({ defaultValue: "requested" }),
    version: (0, import_fields33.integer)({ defaultValue: 1, validation: { isRequired: true, min: 1 } }),
    fillNumber: (0, import_fields33.integer)({ validation: { isRequired: true, min: 1 } }),
    creditState: (0, import_fields33.text)({ defaultValue: "reserved" }),
    authorizedQuantity: (0, import_fields33.integer)({ validation: { isRequired: true, min: 1 } }),
    quantityDispensed: (0, import_fields33.integer)({ defaultValue: 0, validation: { isRequired: true, min: 0 } }),
    quantityReleased: (0, import_fields33.integer)({ defaultValue: 0, validation: { isRequired: true, min: 0 } }),
    itemVersion: (0, import_fields33.text)(),
    authorityVersion: (0, import_fields33.text)(),
    policySnapshot: (0, import_fields33.json)(),
    priceSnapshot: (0, import_fields33.json)(),
    expiresAt: (0, import_fields33.timestamp)({ validation: { isRequired: true } }),
    organization: (0, import_fields33.relationship)({ ref: "Organization", access: immutableRelationship, db: requiredRelationshipDb }),
    location: (0, import_fields33.relationship)({ ref: "PharmacyLocation", access: immutableRelationship, db: requiredRelationshipDb }),
    patient: (0, import_fields33.relationship)({ ref: "PatientProfile", access: immutableRelationship, db: requiredRelationshipDb }),
    prescription: (0, import_fields33.relationship)({ ref: "Prescription", access: immutableRelationship, db: requiredRelationshipDb }),
    prescriptionItem: (0, import_fields33.relationship)({ ref: "PrescriptionItem", access: immutableRelationship, db: requiredRelationshipDb }),
    refillRequest: (0, import_fields33.relationship)({ ref: "RefillRequest", access: immutableRelationship }),
    approval: (0, import_fields33.relationship)({ ref: "HumanApproval", access: immutableRelationship }),
    reservedBy: (0, import_fields33.relationship)({ ref: "User", access: immutableRelationship, db: requiredRelationshipDb }),
    // No inverse fields: omitted lists must not acquire parent-side write paths.
    ...trackingFields
  }
});

// features/keystone/models/PrescriptionFillEvent.ts
var import_core33 = require("@keystone-6/core");
var import_access57 = require("@keystone-6/core/access");
var import_fields34 = require("@keystone-6/core/fields");
var PrescriptionFillEvent = (0, import_core33.list)({
  access: {
    operation: { query: isSignedIn, create: import_access57.denyAll, update: import_access57.denyAll, delete: import_access57.denyAll },
    filter: { query: rules.canReadPrescriptionChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  hooks: { beforeOperation: ({ operation }) => {
    if (operation !== "create") throw new Error("Fill events are append-only");
  } },
  ui: { hideCreate: true },
  fields: {
    eventKey: (0, import_fields34.text)({ isIndexed: "unique" }),
    commandFingerprint: (0, import_fields34.text)({ access: { read: import_access57.denyAll } }),
    action: (0, import_fields34.text)(),
    version: (0, import_fields34.integer)({ validation: { isRequired: true, min: 1 } }),
    quantity: (0, import_fields34.integer)({ defaultValue: 0, validation: { isRequired: true, min: 0 } }),
    // Snapshot is privileged evidence, never returned as raw patient JSON.
    evidence: (0, import_fields34.json)({ access: { read: permissions.canViewPatientPrivateData } }),
    result: (0, import_fields34.json)({ access: { read: permissions.canViewPatientPrivateData } }),
    fill: (0, import_fields34.relationship)({ ref: "PrescriptionFill", access: immutableRelationship, db: requiredRelationshipDb }),
    prescription: (0, import_fields34.relationship)({ ref: "Prescription", access: immutableRelationship, db: requiredRelationshipDb }),
    actor: (0, import_fields34.relationship)({ ref: "User", access: immutableRelationship, db: requiredRelationshipDb }),
    approval: (0, import_fields34.relationship)({ ref: "HumanApproval", access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/PrescriptionItem.ts
var import_core34 = require("@keystone-6/core");
var import_access59 = require("@keystone-6/core/access");
var import_fields35 = require("@keystone-6/core/fields");
var PrescriptionItem = (0, import_core34.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: import_access59.denyAll,
      update: import_access59.denyAll,
      delete: import_access59.denyAll
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
    medicationNameSnapshot: (0, import_fields35.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    sig: (0, import_fields35.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: "textarea" } }),
    fillLineage: (0, import_fields35.text)({ db: { isNullable: true }, access: { update: import_access59.denyAll } }),
    activeFillNumber: (0, import_fields35.integer)({ db: { isNullable: true }, access: { create: import_access59.denyAll, update: import_access59.denyAll } }),
    quantityPrescribed: (0, import_fields35.integer)({ validation: { isRequired: true, min: 1 } }),
    daysSupply: (0, import_fields35.integer)({ validation: { min: 1 } }),
    refillsAuthorized: (0, import_fields35.integer)({ validation: { min: 0 }, defaultValue: 0 }),
    refillsRemaining: (0, import_fields35.integer)({ validation: { min: 0 }, defaultValue: 0 }),
    refillsReserved: (0, import_fields35.integer)({ validation: { min: 0 }, defaultValue: 0 }),
    quantityDispensed: (0, import_fields35.integer)({ validation: { min: 0 }, defaultValue: 0 }),
    substitutionAllowed: (0, import_fields35.checkbox)({ defaultValue: false }),
    prescription: (0, import_fields35.relationship)({ ref: "Prescription.items", access: { create: import_access59.denyAll, update: import_access59.denyAll }, db: requiredRelationshipDb }),
    drugReference: (0, import_fields35.relationship)({ ref: "DrugReference.prescriptionItems", db: requiredRelationshipDb }),
    product: (0, import_fields35.relationship)({ ref: "Product.prescriptionItems", access: { create: import_access59.denyAll, update: import_access59.denyAll }, db: requiredRelationshipDb }),
    refillRequests: (0, import_fields35.relationship)({ ref: "RefillRequest.prescriptionItem", many: true }),
    dispensingLabels: (0, import_fields35.relationship)({ ref: "DispensingLabel.prescriptionItem", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/PrescriptionReview.ts
var import_core35 = require("@keystone-6/core");
var import_fields36 = require("@keystone-6/core/fields");
var denyMutation6 = () => false;
var PrescriptionReview = (0, import_core35.list)({
  access: {
    operation: { query: isSignedIn, create: denyMutation6, update: denyMutation6, delete: denyMutation6 },
    filter: { query: rules.canReadPrescriptionChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    decision: (0, import_fields36.select)({
      type: "string",
      options: [
        { label: "Approved", value: "approved" },
        { label: "Needs information", value: "needs_information" },
        { label: "Rejected", value: "rejected" }
      ],
      validation: { isRequired: true }
    }),
    reason: (0, import_fields36.text)({ validation: { isRequired: true }, ui: { displayMode: "textarea" } }),
    humanAttested: (0, import_fields36.checkbox)({ defaultValue: false }),
    reviewedAt: (0, import_fields36.timestamp)({ validation: { isRequired: true }, defaultValue: { kind: "now" } }),
    prescription: (0, import_fields36.relationship)({ ref: "Prescription.reviews", db: requiredRelationshipDb }),
    patient: (0, import_fields36.relationship)({ ref: "PatientProfile", db: requiredRelationshipDb }),
    pharmacist: (0, import_fields36.relationship)({ ref: "User.prescriptionReviews", db: requiredRelationshipDb }),
    approval: (0, import_fields36.relationship)({ ref: "HumanApproval.prescriptionReviews", db: requiredRelationshipDb }),
    ...trackingFields
  }
});

// features/keystone/models/PrescriptionTransfer.ts
var import_core36 = require("@keystone-6/core");
var import_fields37 = require("@keystone-6/core/fields");
var PrescriptionTransfer = (0, import_core36.list)({
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
    idempotencyKey: (0, import_fields37.text)({ isIndexed: "unique" }),
    direction: (0, import_fields37.select)({
      type: "string",
      options: [
        { label: "Inbound", value: "inbound" },
        { label: "Outbound", value: "outbound" }
      ],
      validation: { isRequired: true }
    }),
    status: (0, import_fields37.select)({
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
    counterpartyName: (0, import_fields37.text)({ validation: { isRequired: true }, access: { read: permissions.canViewPatientPrivateData } }),
    counterpartyPhone: (0, import_fields37.text)({ access: { read: permissions.canViewPatientPrivateData } }),
    requestedAt: (0, import_fields37.timestamp)({ defaultValue: { kind: "now" } }),
    completedAt: (0, import_fields37.timestamp)({ access: { update: () => false } }),
    patient: (0, import_fields37.relationship)({ ref: "PatientProfile.transfers", db: requiredRelationshipDb }),
    prescription: (0, import_fields37.relationship)({ ref: "Prescription.transfers", db: requiredRelationshipDb }),
    consent: (0, import_fields37.relationship)({ ref: "ConsentRecord.transfer" }),
    approval: (0, import_fields37.relationship)({ ref: "HumanApproval.transfers" }),
    ...trackingFields
  }
});

// features/keystone/models/Product.ts
var import_core37 = require("@keystone-6/core");
var import_fields38 = require("@keystone-6/core/fields");
var Product = (0, import_core37.list)({
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
    title: (0, import_fields38.text)({ validation: { isRequired: true } }),
    handle: (0, import_fields38.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    sku: (0, import_fields38.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    description: (0, import_fields38.text)({ ui: { displayMode: "textarea" } }),
    status: (0, import_fields38.select)({
      type: "string",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" }
      ],
      defaultValue: "draft"
    }),
    category: (0, import_fields38.select)({
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
    prescriptionRequirement: (0, import_fields38.select)({
      type: "string",
      options: [
        { label: "None", value: "none" },
        { label: "Prescription required", value: "prescription_required" },
        { label: "Pharmacist review required", value: "pharmacist_review_required" }
      ],
      defaultValue: "none"
    }),
    priceAmount: (0, import_fields38.integer)({ validation: { isRequired: true, min: 0 }, defaultValue: 0, label: "Price (minor units)" }),
    currencyCode: (0, import_fields38.text)({ defaultValue: "USD", validation: { isRequired: true } }),
    taxable: (0, import_fields38.checkbox)({ defaultValue: true }),
    onlineAvailable: (0, import_fields38.checkbox)({ defaultValue: false }),
    posAvailable: (0, import_fields38.checkbox)({ defaultValue: true }),
    coldChainRequired: (0, import_fields38.checkbox)({ defaultValue: false }),
    imageUrl: (0, import_fields38.text)(),
    organization: (0, import_fields38.relationship)({ ref: "Organization.products", db: requiredRelationshipDb }),
    location: (0, import_fields38.relationship)({ ref: "PharmacyLocation.products", db: requiredRelationshipDb }),
    drugReference: (0, import_fields38.relationship)({ ref: "DrugReference.products" }),
    inventoryLots: (0, import_fields38.relationship)({ ref: "InventoryLot.product", many: true, access: immutableRelationship }),
    cartItems: (0, import_fields38.relationship)({ ref: "CartItem.product", many: true, access: immutableRelationship }),
    orderLineItems: (0, import_fields38.relationship)({ ref: "OrderLineItem.product", many: true, access: immutableRelationship }),
    prescriptionItems: (0, import_fields38.relationship)({ ref: "PrescriptionItem.product", many: true, access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/Recall.ts
var import_core38 = require("@keystone-6/core");
var import_access64 = require("@keystone-6/core/access");
var import_fields39 = require("@keystone-6/core/fields");
var Recall = (0, import_core38.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: import_access64.denyAll,
      update: import_access64.denyAll,
      delete: import_access64.denyAll
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
    recallNumber: (0, import_fields39.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    classification: (0, import_fields39.select)({
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
    status: (0, import_fields39.select)({
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
    reason: (0, import_fields39.text)({ validation: { isRequired: true }, ui: { displayMode: "textarea" } }),
    source: (0, import_fields39.text)(),
    sourceValidationReference: (0, import_fields39.text)(),
    initiatedAt: (0, import_fields39.timestamp)({ defaultValue: { kind: "now" } }),
    closedAt: (0, import_fields39.timestamp)(),
    organization: (0, import_fields39.relationship)({ ref: "Organization.recalls", db: requiredRelationshipDb }),
    location: (0, import_fields39.relationship)({ ref: "PharmacyLocation.recalls" }),
    lots: (0, import_fields39.relationship)({ ref: "InventoryLot.recalls", many: true, db: requiredRelationshipDb }),
    exposures: (0, import_fields39.relationship)({ ref: "RecallExposure.recall", many: true }),
    approval: (0, import_fields39.relationship)({ ref: "HumanApproval.recalls" }),
    ...trackingFields
  }
});

// features/keystone/models/RecallExposure.ts
var import_core39 = require("@keystone-6/core");
var import_access66 = require("@keystone-6/core/access");
var import_fields40 = require("@keystone-6/core/fields");
var RecallExposure = (0, import_core39.list)({
  access: {
    operation: { query: isSignedIn, create: import_access66.denyAll, update: import_access66.denyAll, delete: import_access66.denyAll },
    filter: { query: rules.canReadLocationScopedPatientChildren }
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  fields: {
    exposureKey: (0, import_fields40.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    status: (0, import_fields40.select)({ type: "string", options: [{ label: "Outreach required", value: "outreach_required" }, { label: "Contacted", value: "contacted" }, { label: "Returned", value: "returned" }, { label: "Resolved", value: "resolved" }, { label: "Unable to reach", value: "unable_to_reach" }], defaultValue: "outreach_required" }),
    quantityDispensed: (0, import_fields40.integer)({ validation: { isRequired: true, min: 1 } }),
    contactMethod: (0, import_fields40.text)({ access: { read: permissions.canViewPatientPrivateData } }),
    outcome: (0, import_fields40.text)({ access: { read: permissions.canViewPatientPrivateData } }),
    notes: (0, import_fields40.text)({ access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: "textarea" } }),
    lastActionAt: (0, import_fields40.timestamp)(),
    resolvedAt: (0, import_fields40.timestamp)(),
    organization: (0, import_fields40.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields40.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    recall: (0, import_fields40.relationship)({ ref: "Recall.exposures", db: requiredRelationshipDb }),
    movement: (0, import_fields40.relationship)({ ref: "InventoryMovement", db: requiredRelationshipDb }),
    patient: (0, import_fields40.relationship)({ ref: "PatientProfile", db: requiredRelationshipDb }),
    prescription: (0, import_fields40.relationship)({ ref: "Prescription" }),
    order: (0, import_fields40.relationship)({ ref: "Order" }),
    lastActor: (0, import_fields40.relationship)({ ref: "User" }),
    approval: (0, import_fields40.relationship)({ ref: "HumanApproval" }),
    ...trackingFields
  }
});

// features/keystone/models/RefillRequest.ts
var import_core40 = require("@keystone-6/core");
var import_fields41 = require("@keystone-6/core/fields");
var RefillRequest = (0, import_core40.list)({
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
    idempotencyKey: (0, import_fields41.text)({ isIndexed: "unique" }),
    requestFingerprint: (0, import_fields41.text)({ db: { isNullable: true } }),
    openRequestKey: (0, import_fields41.text)({ isIndexed: "unique", db: { isNullable: true } }),
    status: (0, import_fields41.select)({
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
    requestNote: (0, import_fields41.text)({ access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: "textarea" } }),
    resolutionNote: (0, import_fields41.text)({ db: { isNullable: true }, access: { read: permissions.canViewPatientPrivateData }, ui: { displayMode: "textarea" } }),
    requestedAt: (0, import_fields41.timestamp)({ defaultValue: { kind: "now" } }),
    resolvedAt: (0, import_fields41.timestamp)({ access: { update: () => false } }),
    patient: (0, import_fields41.relationship)({ ref: "PatientProfile.refillRequests", db: requiredRelationshipDb }),
    prescription: (0, import_fields41.relationship)({ ref: "Prescription.refillRequests", db: requiredRelationshipDb }),
    prescriptionItem: (0, import_fields41.relationship)({ ref: "PrescriptionItem.refillRequests" }),
    location: (0, import_fields41.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    approval: (0, import_fields41.relationship)({ ref: "HumanApproval.refillRequests" }),
    ...trackingFields
  }
});

// features/keystone/models/PrescriptionRequest.ts
var import_core41 = require("@keystone-6/core");
var import_access69 = require("@keystone-6/core/access");
var import_fields42 = require("@keystone-6/core/fields");
var PrescriptionRequest = (0, import_core41.list)({
  access: { operation: { query: import_access69.denyAll, create: import_access69.denyAll, update: import_access69.denyAll, delete: import_access69.denyAll } },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { isHidden: true },
  fields: {
    idempotencyKey: (0, import_fields42.text)({ isIndexed: "unique" }),
    kind: (0, import_fields42.select)({
      type: "string",
      options: [
        { label: "Patient registration", value: "registration" },
        { label: "Transfer", value: "transfer" },
        { label: "New prescription", value: "new_prescription" }
      ],
      validation: { isRequired: true }
    }),
    status: (0, import_fields42.select)({
      type: "string",
      options: [
        { label: "Requested", value: "requested" },
        { label: "In review", value: "in_review" },
        { label: "Completed", value: "completed" },
        { label: "Declined", value: "declined" }
      ],
      defaultValue: "requested"
    }),
    organization: (0, import_fields42.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields42.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    user: (0, import_fields42.relationship)({ ref: "User", db: requiredRelationshipDb }),
    patient: (0, import_fields42.relationship)({ ref: "PatientProfile" }),
    firstName: (0, import_fields42.text)(),
    lastName: (0, import_fields42.text)(),
    dateOfBirth: (0, import_fields42.timestamp)(),
    phone: (0, import_fields42.text)(),
    email: (0, import_fields42.text)(),
    allergies: (0, import_fields42.text)({ ui: { displayMode: "textarea" } }),
    insurance: (0, import_fields42.text)({ ui: { displayMode: "textarea" } }),
    counterpartyName: (0, import_fields42.text)(),
    counterpartyPhone: (0, import_fields42.text)(),
    prescriberName: (0, import_fields42.text)(),
    prescriberPhone: (0, import_fields42.text)(),
    medications: (0, import_fields42.text)({ ui: { displayMode: "textarea" } }),
    note: (0, import_fields42.text)({ ui: { displayMode: "textarea" } }),
    resolutionNote: (0, import_fields42.text)({ ui: { displayMode: "textarea" } }),
    resolvedAt: (0, import_fields42.timestamp)(),
    resolvedBy: (0, import_fields42.relationship)({ ref: "User" }),
    ...trackingFields
  }
});

// features/keystone/models/Role.ts
var import_core42 = require("@keystone-6/core");
var import_fields44 = require("@keystone-6/core/fields");

// features/keystone/models/fields.ts
var import_fields43 = require("@keystone-6/core/fields");
var permission = (label) => (0, import_fields43.checkbox)({ defaultValue: false, label });
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
var Role = (0, import_core42.list)({
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
    name: (0, import_fields44.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    ...permissionFields,
    assignedTo: (0, import_fields44.relationship)({ ref: "User.role", many: true }),
    ...trackingFields
  }
});

// features/keystone/models/Supplier.ts
var import_core43 = require("@keystone-6/core");
var import_access71 = require("@keystone-6/core/access");
var import_fields46 = require("@keystone-6/core/fields");
var Supplier = (0, import_core43.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageInventory,
      update: permissions.canManageInventory,
      delete: import_access71.denyAll
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
    name: (0, import_fields46.text)({ validation: { isRequired: true } }),
    accountReference: (0, import_fields46.text)(),
    status: (0, import_fields46.select)({
      type: "string",
      options: [
        { label: "Pending validation", value: "pending_validation" },
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" }
      ],
      defaultValue: "pending_validation"
    }),
    organization: (0, import_fields46.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    integrationProvider: (0, import_fields46.relationship)({ ref: "IntegrationProvider.suppliers" }),
    inventoryLots: (0, import_fields46.relationship)({ ref: "InventoryLot.supplier", many: true, access: immutableRelationship }),
    ...trackingFields
  }
});

// features/keystone/models/TemperatureExcursion.ts
var import_core44 = require("@keystone-6/core");
var import_access73 = require("@keystone-6/core/access");
var import_fields47 = require("@keystone-6/core/fields");
var TemperatureExcursion = (0, import_core44.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: import_access73.denyAll,
      update: import_access73.denyAll,
      delete: import_access73.denyAll
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
    idempotencyKey: (0, import_fields47.text)({ isIndexed: "unique" }),
    observedMinimumC: (0, import_fields47.float)({ validation: { isRequired: true } }),
    observedMaximumC: (0, import_fields47.float)({ validation: { isRequired: true } }),
    startedAt: (0, import_fields47.timestamp)({ validation: { isRequired: true } }),
    endedAt: (0, import_fields47.timestamp)(),
    status: (0, import_fields47.select)({
      type: "string",
      options: [
        { label: "Open", value: "open" },
        { label: "Under review", value: "under_review" },
        { label: "Released", value: "released" },
        { label: "Destroyed", value: "destroyed" }
      ],
      defaultValue: "open"
    }),
    dispositionReason: (0, import_fields47.text)({ ui: { displayMode: "textarea" } }),
    organization: (0, import_fields47.relationship)({ ref: "Organization", db: requiredRelationshipDb }),
    location: (0, import_fields47.relationship)({ ref: "PharmacyLocation", db: requiredRelationshipDb }),
    lot: (0, import_fields47.relationship)({ ref: "InventoryLot.temperatureExcursions", db: requiredRelationshipDb }),
    reviewedBy: (0, import_fields47.relationship)({ ref: "User", db: requiredRelationshipDb }),
    approval: (0, import_fields47.relationship)({ ref: "HumanApproval.temperatureExcursions", db: requiredRelationshipDb }),
    ...trackingFields
  }
});

// features/keystone/models/User.ts
var import_core45 = require("@keystone-6/core");
var import_access76 = require("@keystone-6/core/access");
var import_fields49 = require("@keystone-6/core/fields");

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
var User = (0, import_core45.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: () => true,
      update: isSignedIn,
      delete: import_access76.denyAll
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
    name: (0, import_fields49.text)({ validation: { isRequired: true } }),
    email: (0, import_fields49.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
    password: (0, import_fields49.password)({
      validation: { isRequired: true, length: { min: 12, max: 1e3 }, rejectCommon: true },
      access: {
        read: import_access76.denyAll,
        update: canChangeOwnPassword
      }
    }),
    role: (0, import_fields49.relationship)({
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
    tokenVersion: (0, import_fields49.integer)({ defaultValue: 0, access: { create: import_access76.denyAll, update: import_access76.denyAll }, ui: { itemView: { fieldMode: "hidden" }, createView: { fieldMode: "hidden" } } }),
    onboardingStatus: (0, import_fields49.select)({
      type: "string",
      options: [
        { label: "Not started", value: "not_started" },
        { label: "In progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
        { label: "Dismissed", value: "dismissed" }
      ],
      defaultValue: "not_started"
    }),
    memberships: (0, import_fields49.relationship)({ ref: "OrganizationMembership.user", many: true, access: immutableRelationship }),
    patientProfile: (0, import_fields49.relationship)({ ref: "PatientProfile.user", access: immutableRelationship }),
    carts: (0, import_fields49.relationship)({ ref: "Cart.customer", many: true, access: immutableRelationship }),
    orders: (0, import_fields49.relationship)({ ref: "Order.customer", many: true, access: immutableRelationship }),
    prescriptionReviews: (0, import_fields49.relationship)({ ref: "PrescriptionReview.pharmacist", many: true, access: immutableRelationship }),
    humanApprovals: (0, import_fields49.relationship)({ ref: "HumanApproval.actor", many: true, access: immutableRelationship }),
    auditEvents: (0, import_fields49.relationship)({ ref: "AuditEvent.actor", many: true, access: immutableRelationship }),
    createdMachineCredentials: (0, import_fields49.relationship)({ ref: "MachineCredential.createdBy", many: true, access: immutableRelationship }),
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
  OutboxEvent,
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
var import_graphql = require("graphql");

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

// features/keystone/mutations/getGuestPharmacyOrder.ts
async function getGuestPharmacyOrder(_root, args, context) {
  if (!args.guestOrderToken?.trim()) throw new Error("Guest order token is required");
  const order = await context.sudo().query.Order.findOne({
    where: { id: args.orderId },
    query: GUEST_ORDER_QUERY
  });
  if (!order?.guestTokenHash || !verifyGuestCartToken(args.guestOrderToken, order.guestTokenHash)) throw new Error("Guest order not found");
  return guestOrderProjection(order);
}
async function lookupPharmacyOrder(_root, args, context) {
  const orderNumber2 = args.orderNumber?.trim();
  const email = args.email?.trim().toLowerCase();
  if (!orderNumber2 || !email || orderNumber2.length > 64 || email.length > 254) return null;
  const order = await context.sudo().query.Order.findOne({ where: { orderNumber: orderNumber2 }, query: `email ${GUEST_ORDER_QUERY}` }).catch(() => null);
  if (!order?.email || order.email.trim().toLowerCase() !== email) return null;
  return guestOrderProjection(order);
}
var GUEST_ORDER_QUERY = `
      id orderNumber guestTokenHash status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount currencyCode pickupAt deliveryWindow createdAt
      location { name timezone }
      lineItems { id title sku quantity unitPriceAmount lineTotalAmount imageUrl prescriptionRequirementSnapshot }
      fulfillment { method status readyAt handedOffAt }
    `;
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
  return new import_graphql.GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
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
  if (!userId || context.session?.listKey !== "User") throw new Error("Authentication required");
  const [order] = await context.query.Order.findMany({ where: { id: { equals: args.orderId }, customer: { id: { equals: userId } } }, take: 1, query: "id orderNumber status totalAmount currencyCode createdAt lineItems { title quantity unitPriceAmount }" });
  if (!order) throw new Error("Order not found");
  return order;
}
async function pharmacyCustomerOrderDetails(_root, args, context) {
  const userId = context.session?.itemId;
  if (!userId || context.session?.listKey !== "User") throw new Error("Authentication required");
  const [owned] = await context.query.Order.findMany({ where: { id: { equals: args.orderId }, customer: { id: { equals: userId } } }, take: 1, query: "id" });
  if (!owned) throw new Error("Order not found");
  const order = await context.sudo().query.Order.findOne({ where: { id: owned.id }, query: GUEST_ORDER_QUERY });
  if (!order) throw new Error("Order not found");
  return guestOrderProjection(order);
}
async function pharmacyCustomerAccount(_root, _args, context) {
  const userId = context.session?.itemId;
  if (!userId || context.session?.listKey !== "User") throw new Error("Authentication required");
  const user = await context.query.User.findOne({ where: { id: userId }, query: "id name patientProfile { id }" });
  if (!user) throw new Error("Account not found");
  const orders = await context.query.Order.findMany({ where: { customer: { id: { equals: userId } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50, query: "id orderNumber status totalAmount currencyCode createdAt lineItems { title quantity unitPriceAmount }" });
  return { id: user.id, name: user.name, hasPatientProfile: Boolean(user.patientProfile?.id), orders };
}

// features/keystone/mutations/index.ts
var import_schema = require("@graphql-tools/schema");

// features/keystone/mutations/cashWorkflows.ts
var import_node_crypto3 = require("node:crypto");

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
  if (!userId) throw new Error("Authentication required");
  await context.prisma.$queryRaw`SELECT id FROM "OrganizationMembership" WHERE "user" = ${userId} AND organization = ${input.organizationId} FOR SHARE`;
  await context.prisma.$queryRaw`SELECT id FROM "Organization" WHERE id = ${input.organizationId} FOR SHARE`;
  if (input.locationId) {
    await context.prisma.$queryRaw`SELECT id FROM "PharmacyLocation" WHERE id = ${input.locationId} FOR SHARE`;
    const location = await context.sudo().query.PharmacyLocation.findOne({
      where: { id: input.locationId },
      query: "id status organization { id status }"
    });
    if (!location || location.organization?.id !== input.organizationId || location.status !== "active" || location.organization.status !== "active") {
      throw new Error("An active location is required");
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
  if (!activeMemberships.length) throw new Error("You do not have access to this pharmacy");
  const hasCurrentCredentialEvidence = (membership2) => {
    const credentialExpiresAt = membership2.credentialExpiresAt ? new Date(membership2.credentialExpiresAt).getTime() : Number.NaN;
    return ["owner", "pharmacist"].includes(membership2.membershipRole) && membership2.externalCredentialValidated === true && ["organization_recorded", "external_provider"].includes(membership2.credentialVerificationMethod || "") && Boolean(membership2.credentialType?.trim()) && Boolean(membership2.credentialJurisdiction?.trim()) && Boolean(membership2.credentialIdentifier?.trim()) && Boolean(membership2.credentialValidationReference?.trim()) && Boolean(membership2.credentialVerifiedBy?.id) && Number.isFinite(credentialExpiresAt) && credentialExpiresAt > Date.now();
  };
  const membership = input.pharmacist ? activeMemberships.find(hasCurrentCredentialEvidence) : activeMemberships.find((entry) => !entry.location) || activeMemberships[0];
  if (!membership && input.pharmacist) {
    throw new Error("Current organization-recorded pharmacist credential review evidence is required; the software does not validate licensure");
  }
  return { userId, membership: membership || activeMemberships[0] };
}
function requirePermission(context, permission2) {
  if (!permissions[permission2]({ session: context.session })) {
    throw new Error(`Permission required: ${permission2}`);
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
async function recordAuditAndOutbox(context, input) {
  const payload = canonicalize({
    eventKey: input.eventKey,
    eventType: input.eventType,
    occurredAt: (/* @__PURE__ */ new Date()).toISOString(),
    aggregate: { type: input.resourceType, id: input.resourceId },
    tenant: { organizationId: input.organizationId, locationId: input.locationId || null },
    actorId: input.actorId || null,
    patientId: input.patientId || null,
    data: input.metadata || {}
  });
  const payloadHash = evidencePayloadHash(payload);
  const sudo = context.sudo();
  const existing = await sudo.query.OutboxEvent.findOne({
    where: { eventKey: input.eventKey },
    query: "id eventKey eventType payloadHash status"
  });
  if (existing) {
    if (existing.eventType !== input.eventType || existing.payloadHash !== payloadHash) {
      const comparable = { ...payload, occurredAt: void 0 };
      const existingEvent = await sudo.query.OutboxEvent.findOne({ where: { id: existing.id }, query: "payload" });
      const existingComparable = { ...existingEvent?.payload, occurredAt: void 0 };
      if (evidencePayloadHash(comparable) !== evidencePayloadHash(existingComparable)) {
        throw new Error("Evidence idempotency key was reused with a different snapshot");
      }
    }
    return { created: false, auditEventId: null, outboxEventId: existing.id, status: existing.status };
  }
  const audit = await recordAuditEvent(context, input);
  const outbox = await sudo.query.OutboxEvent.createOne({
    data: {
      eventKey: input.eventKey,
      eventType: input.eventType,
      aggregateType: input.resourceType,
      aggregateId: input.resourceId,
      payload,
      payloadHash,
      organization: { connect: { id: input.organizationId } },
      location: input.locationId ? { connect: { id: input.locationId } } : void 0
    },
    query: "id status"
  });
  return { created: true, auditEventId: audit.id, outboxEventId: outbox.id, status: outbox.status };
}

// features/keystone/mutations/lib/current-authority.ts
var CURRENT_ACTOR_SELECTION = `id tokenVersion role { id name ${Object.keys(permissions).join(" ")} }`;
async function assertCurrentTransactionActor(context) {
  const id = context.session?.itemId;
  if (!id) return;
  await context.prisma.$queryRaw`SELECT id FROM "User" WHERE id = ${id} FOR SHARE`;
  await context.prisma.$queryRaw`SELECT id FROM "Role" WHERE id = (SELECT role FROM "User" WHERE id = ${id}) FOR SHARE`;
  const actor = await context.sudo().query.User.findOne({ where: { id }, query: CURRENT_ACTOR_SELECTION });
  if (!actor) throw new Error("Current actor is unavailable");
  const session = context.session;
  if (session.tokenVersion !== void 0 && Number(session.tokenVersion) !== actor.tokenVersion) throw new Error("Current session was revoked");
  for (const permission2 of Object.keys(permissions)) {
    if (session.data?.role?.[permission2] === true && actor.role?.[permission2] !== true) throw new Error("Current operator permission was revoked");
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
var DomainConflictError = class extends Error {
  constructor() {
    super("The record changed while this request was running. Retry the same idempotent request.");
    this.code = "PHARMACY_CONFLICT";
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

// features/keystone/mutations/cashWorkflows.ts
async function recordPharmacyCashPolicy(_root, args, context) {
  requirePermission(context, "canManagePayments");
  requirePermission(context, "canApproveConsequentialActions");
  if (!Number.isInteger(args.taxRateBps) || args.taxRateBps < 0 || args.taxRateBps > 1e4) throw new Error("Tax rate must be integer basis points between 0 and 10000");
  if (!args.policyReference?.trim()) throw new Error("Cash/tax policy source reference is required");
  return withDomainTransaction(context, [`cash-policy:${args.organizationId}`], async (transactionContext) => {
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: args.organizationId });
    const approval = await createHumanApproval(transactionContext, { organizationId: args.organizationId, actorId: userId, actionType: "cash_policy", reason: args.reason, attested: args.attested, evidence: { taxRateBps: args.taxRateBps, policyReference: args.policyReference.trim(), scope: "operator_attested_cash_direct_pay" } });
    await transactionContext.sudo().query.Organization.updateOne({ where: { id: args.organizationId }, data: { cashSalesEnabled: true, cashTaxRateBps: args.taxRateBps, cashTaxPolicyReference: args.policyReference.trim(), cashPolicyReviewedAt: (/* @__PURE__ */ new Date()).toISOString(), cashPolicyReviewedBy: { connect: { id: userId } } }, query: "id" });
    await recordAuditAndOutbox(transactionContext, { eventKey: `cash_policy.recorded:${args.organizationId}:${approval.id}`, organizationId: args.organizationId, actorId: userId, eventType: "cash_policy.recorded", resourceType: "Organization", resourceId: args.organizationId, metadata: { taxRateBps: args.taxRateBps, policyReference: args.policyReference.trim(), approvalId: approval.id } });
    return { success: true, organizationId: args.organizationId, status: "enabled", taxRateBps: args.taxRateBps, approvalId: approval.id };
  });
}
async function readCommittedPosReceipt(sudo, orderId, reused) {
  const order = await sudo.query.Order.findOne({
    where: { id: orderId },
    query: "id orderNumber status createdAt subtotalAmount taxAmount totalAmount currencyCode lineItems(orderBy: { createdAt: asc }) { title sku quantity unitPriceAmount lineTotalAmount } payments { id status amount currencyCode tenderMethod cashReceivedAmount changeDueAmount }"
  });
  const payment = order?.payments?.find((entry) => entry.tenderMethod === "cash");
  const lineSubtotal = (order?.lineItems || []).reduce((sum, line) => sum + line.lineTotalAmount, 0);
  if (!order || !payment || !["captured", "refunded"].includes(payment.status) || payment.amount !== order.totalAmount || payment.currencyCode !== order.currencyCode || payment.cashReceivedAmount == null || payment.changeDueAmount == null || payment.cashReceivedAmount < payment.amount || payment.changeDueAmount !== payment.cashReceivedAmount - payment.amount || lineSubtotal !== order.subtotalAmount || order.subtotalAmount + order.taxAmount !== order.totalAmount) {
    throw new Error("Committed POS receipt evidence is incomplete or inconsistent; do not submit a new sale");
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
    cashReceivedAmount: payment.cashReceivedAmount,
    changeDueAmount: payment.changeDueAmount
  };
}
async function pharmacyPosCustomers(_root, args, context) {
  requirePermission(context, "canManageOrders");
  const location = await context.sudo().query.PharmacyLocation.findOne({ where: { id: args.locationId }, query: "id organization { id }" });
  if (!location) throw new Error("Location not found");
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
  const method = args.fulfillmentMethod || "pos";
  if (!["pos", "pickup"].includes(method)) throw new Error("Cash fulfillment method is invalid");
  const items = (args.items || []).filter((entry) => entry?.productId && Number.isInteger(entry.quantity) && entry.quantity > 0 && entry.quantity <= 99);
  if (!items.length || items.length > 50 || items.length !== args.items.length) throw new Error("POS order must contain 1-50 valid line items");
  if (!args.idempotencyKey?.trim() || args.idempotencyKey.length > 200) throw new Error("A request key is required");
  const requestFingerprint = (0, import_node_crypto3.createHash)("sha256").update(JSON.stringify({ locationId: args.locationId, ...args.customerCartId ? { customerCartId: args.customerCartId } : {}, ...method === "pickup" ? { fulfillmentMethod: method } : {}, items: [...items].sort((left, right) => left.productId.localeCompare(right.productId)), cashReceivedAmount: args.cashReceivedAmount, reason: args.reason?.trim(), attested: args.attested })).digest("hex");
  return withDomainTransaction(context, [`pos-cash:${args.idempotencyKey}`, ...args.customerCartId ? [`cart:${args.customerCartId}`] : [], ...items.map((entry) => `product:${entry.productId}`)], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.Order.findOne({ where: { idempotencyKey: `pos-cash:${args.idempotencyKey}` }, query: "id orderNumber status totalAmount currencyCode checkoutEvidence payments { id status } organization { id } location { id }" });
    if (existing) {
      if (!existing.organization?.id || !existing.location?.id) throw new Error("POS replay scope is incomplete; operator reconciliation is required");
      await requireTenantMembership(transactionContext, { organizationId: existing.organization.id, locationId: existing.location.id });
      if (existing.checkoutEvidence?.requestFingerprint !== requestFingerprint) throw new Error("POS idempotency key was reused with different input");
      return readCommittedPosReceipt(sudo, existing.id, true);
    }
    const location = await sudo.query.PharmacyLocation.findOne({ where: { id: args.locationId }, query: "id name status pickupEnabled organization { id cashSalesEnabled cashTaxRateBps cashTaxPolicyReference cashPolicyReviewedAt }" });
    if (!location || location.status !== "active") throw new Error("POS location not found");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: location.organization.id, locationId: location.id });
    if (method === "pickup" && location.pickupEnabled !== true) throw new Error("Pickup is unavailable at this location");
    let customerId;
    if (args.customerCartId) {
      const cart = await sudo.query.Cart.findOne({ where: { id: args.customerCartId }, query: "id status expiresAt organization { id } location { id } customer { id role { id } } items(take: 1) { id }" });
      if (!cart || cart.organization?.id !== location.organization.id || cart.location?.id !== location.id || cart.status !== "active" || !cart.expiresAt || new Date(cart.expiresAt).getTime() <= Date.now() || !cart.customer?.id || cart.customer.role || !cart.items.length) throw new Error("Customer cart is not available in this tenant location");
      customerId = cart.customer.id;
    }
    if (location.organization.cashSalesEnabled !== true || !location.organization.cashTaxPolicyReference?.trim() || !location.organization.cashPolicyReviewedAt) throw new Error("Operator-attested cash and tax policy must be configured before POS sales");
    const productIds = [...new Set(items.map((entry) => entry.productId))];
    if (productIds.length !== items.length) throw new Error("Combine duplicate POS product lines before submission");
    let products = await sudo.query.Product.findMany({ where: { id: { in: productIds } }, take: 50, query: "id title sku imageUrl priceAmount currencyCode taxable status posAvailable prescriptionRequirement organization { id } location { id } drugReference { ndc11 } inventoryLots(orderBy: { expirationDate: asc }, take: 100) { id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }" });
    if (products.length !== items.length || products.some((product) => product.organization?.id !== location.organization.id || product.location?.id !== location.id || product.status !== "published" || product.posAvailable !== true || product.prescriptionRequirement !== "none")) throw new Error("Every POS item must be an available OTC product in this tenant location");
    await acquireTransactionLocks(transactionContext, products.flatMap((product) => product.inventoryLots.map((lot) => `lot:${lot.id}`)));
    products = await sudo.query.Product.findMany({ where: { id: { in: productIds } }, take: 50, query: "id title sku imageUrl priceAmount currencyCode taxable status posAvailable prescriptionRequirement organization { id } location { id } drugReference { ndc11 } inventoryLots(orderBy: { expirationDate: asc }, take: 100) { id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }" });
    const currencies = [...new Set(products.map((product) => product.currencyCode))];
    if (currencies.length !== 1) throw new Error("POS order currency mismatch");
    const pricedItems = items.map((entry) => ({ ...entry, product: products.find((product) => product.id === entry.productId) }));
    const subtotalAmount = pricedItems.reduce((sum, entry) => sum + entry.product.priceAmount * entry.quantity, 0);
    const taxableSubtotalAmount = calculateTaxableSubtotal(pricedItems.map((entry) => ({ unitPriceAmount: entry.product.priceAmount, quantity: entry.quantity, taxable: entry.product.taxable })));
    const taxAmount = calculateTaxAmount(taxableSubtotalAmount, location.organization.cashTaxRateBps || 0);
    const totalAmount = subtotalAmount + taxAmount;
    const tender = assertCashTender(totalAmount, args.cashReceivedAmount);
    const approval = await createHumanApproval(transactionContext, { organizationId: location.organization.id, locationId: location.id, actorId: userId, actionType: "cash_tender", reason: args.reason, attested: args.attested, evidence: { workflow: "operator_attested_otc_pos_cash", subtotalAmount, taxableSubtotalAmount, taxAmount, totalAmount, cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount, taxRateBps: location.organization.cashTaxRateBps || 0, providerSettlementClaimed: false } });
    const suffix = (0, import_node_crypto3.createHash)("sha256").update(args.idempotencyKey).digest("hex").slice(0, 12).toUpperCase();
    const order = await sudo.query.Order.createOne({ data: { orderNumber: `POS-${suffix}`, idempotencyKey: `pos-cash:${args.idempotencyKey}`, checkoutEvidence: { workflow: "operator_attested_otc_pos_cash", customerCartId: args.customerCartId || null, customerId: customerId || null, approvalId: approval.id, requestFingerprint, taxRateBps: location.organization.cashTaxRateBps || 0, taxableSubtotalAmount, taxAmount, providerSettlementClaimed: false }, status: method === "pickup" ? "processing" : "completed", fulfillmentMethod: method, subtotalAmount, taxAmount, deliveryAmount: 0, totalAmount, currencyCode: currencies[0], customer: customerId ? { connect: { id: customerId } } : void 0, organization: { connect: { id: location.organization.id } }, location: { connect: { id: location.id } }, approval: { connect: { id: approval.id } } }, query: "id orderNumber status" });
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
      if (remaining > 0) throw new Error(`Insufficient eligible inventory for ${product.title}`);
      await sudo.query.OrderLineItem.createOne({ data: { title: product.title, sku: product.sku, ndc11Snapshot: product.drugReference?.ndc11 || void 0, quantity: entry.quantity, unitPriceAmount: product.priceAmount, lineTotalAmount: product.priceAmount * entry.quantity, imageUrl: product.imageUrl || void 0, prescriptionRequirementSnapshot: "none", metadata: { taxable: product.taxable !== false, taxableAmount: product.taxable === false ? 0 : product.priceAmount * entry.quantity }, lotAllocationSnapshot: allocations, order: { connect: { id: order.id } }, product: { connect: { id: product.id } } } });
      for (const allocation of allocations) {
        const lot = product.inventoryLots.find((candidate) => candidate.id === allocation.lotId);
        const nextQuantity = lot.quantityAvailable - allocation.quantity;
        await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { quantityAvailable: nextQuantity, ...nextQuantity === 0 ? { status: "depleted" } : {} } });
        await sudo.query.InventoryMovement.createOne({ data: { movementType: "sale", quantityDelta: -allocation.quantity, reason: args.reason, idempotencyKey: `pos:${args.idempotencyKey}:${product.id}:${lot.id}`, organization: { connect: { id: location.organization.id } }, location: { connect: { id: location.id } }, product: { connect: { id: product.id } }, lot: { connect: { id: lot.id } }, actor: { connect: { id: userId } }, order: { connect: { id: order.id } }, approval: { connect: { id: approval.id } } } });
      }
    }
    const payment = await sudo.query.Payment.createOne({ data: { amount: totalAmount, currencyCode: currencies[0], status: "captured", tenderMethod: "cash", cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount, processedAt: (/* @__PURE__ */ new Date()).toISOString(), data: { evidenceType: "operator_attested_cash_received", approvalId: approval.id, providerSettlementClaimed: false }, organization: { connect: { id: location.organization.id } }, location: { connect: { id: location.id } }, order: { connect: { id: order.id } }, recordedBy: { connect: { id: userId } }, approval: { connect: { id: approval.id } } }, query: "id status" });
    await sudo.query.Fulfillment.createOne({ data: { method, status: method === "pickup" ? "preparing" : "handed_off", ...method === "pos" ? { readyAt: (/* @__PURE__ */ new Date()).toISOString(), handedOffAt: (/* @__PURE__ */ new Date()).toISOString() } : {}, organization: { connect: { id: location.organization.id } }, location: { connect: { id: location.id } }, order: { connect: { id: order.id } }, assignedTo: { connect: { id: userId } } } });
    await recordAuditAndOutbox(transactionContext, { eventKey: `pos.cash_sale:${args.idempotencyKey}`, organizationId: location.organization.id, locationId: location.id, actorId: userId, eventType: "pos.cash_sale_recorded", resourceType: "Order", resourceId: order.id, metadata: { paymentId: payment.id, lineCount: items.length, subtotalAmount, taxableSubtotalAmount, taxAmount, totalAmount, approvalId: approval.id, providerSettlementClaimed: false } });
    return readCommittedPosReceipt(sudo, order.id, false);
  });
}
async function pharmacyPosCashReceipt(_root, args, context) {
  requirePermission(context, "canManageOrders");
  requirePermission(context, "canManagePayments");
  if (!args.idempotencyKey?.trim() || args.idempotencyKey.length > 200) throw new Error("A request key is required");
  const sudo = context.sudo();
  const order = await sudo.query.Order.findOne({
    where: { idempotencyKey: `pos-cash:${args.idempotencyKey}` },
    query: "id organization { id } location { id }"
  });
  if (!order) return null;
  if (!order.organization?.id || !order.location?.id) throw new Error("POS receipt scope is incomplete; operator reconciliation is required");
  await requireTenantMembership(context, { organizationId: order.organization.id, locationId: order.location.id });
  return readCommittedPosReceipt(sudo, order.id, true);
}
async function refundPharmacyCashPayment(_root, args, context) {
  requirePermission(context, "canManagePayments");
  if (!args.idempotencyKey?.trim()) throw new Error("Idempotency key is required");
  const requestFingerprint = (0, import_node_crypto3.createHash)("sha256").update(JSON.stringify({ paymentId: args.paymentId, cashReturnedAmount: args.cashReturnedAmount, reason: args.reason?.trim(), attested: args.attested })).digest("hex");
  return withDomainTransaction(context, [`payment:${args.paymentId}`, `cash-refund:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const payment = await sudo.query.Payment.findOne({ where: { id: args.paymentId }, query: "id amount status tenderMethod data organization { id } location { id } order { id patient { id } } approval { id }" });
    if (!payment || payment.tenderMethod !== "cash") throw new Error("Cash payment not found");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: payment.organization.id, locationId: payment.location?.id });
    const eventKey = `payment.cash_refunded:${args.idempotencyKey}`;
    const existing = await sudo.query.AuditEvent.findOne({ where: { eventKey }, query: "id resourceId metadata" });
    if (existing) {
      if (existing.resourceId !== payment.id || existing.metadata?.requestFingerprint !== requestFingerprint) throw new Error("Cash refund idempotency key was reused with different input");
      return { success: true, reused: true, paymentId: payment.id, status: "refunded", amount: payment.amount };
    }
    if (payment.status === "refunded") throw new Error("Cash payment was already refunded under a different request");
    if (payment.status !== "captured" || args.cashReturnedAmount !== payment.amount) throw new Error("Bounded cash refunds must return the exact captured amount");
    const approval = await createHumanApproval(transactionContext, { organizationId: payment.organization.id, locationId: payment.location?.id, actorId: userId, actionType: "cash_refund", reason: args.reason, attested: args.attested, evidence: { paymentId: payment.id, cashReturnedAmount: args.cashReturnedAmount, inventoryRestocked: false, custodyClaim: false } });
    await transactionContext.prisma.payment.update({ where: { id: payment.id }, data: { status: "refunded", data: { ...payment.data || {}, cashRefund: { returnedAmount: args.cashReturnedAmount, returnedAt: (/* @__PURE__ */ new Date()).toISOString(), actorId: userId, approvalId: approval.id, inventoryRestocked: false } }, approvalId: approval.id } });
    await recordAuditAndOutbox(transactionContext, { eventKey, organizationId: payment.organization.id, locationId: payment.location?.id, actorId: userId, patientId: payment.order?.patient?.id, eventType: "payment.cash_refunded", resourceType: "Payment", resourceId: payment.id, metadata: { orderId: payment.order?.id, amount: payment.amount, approvalId: approval.id, requestFingerprint, inventoryRestocked: false } });
    return { success: true, reused: false, paymentId: payment.id, status: "refunded", amount: payment.amount };
  });
}

// features/keystone/security/order-token.ts
var import_node_crypto4 = require("node:crypto");
function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("A strong session secret is required for guest checkout");
  return secret;
}
function createGuestOrderToken(cartId, idempotencyKey) {
  return (0, import_node_crypto4.createHmac)("sha256", sessionSecret()).update(`pharmacy-order:${cartId}:${idempotencyKey}`).digest("base64url");
}
function verifyGuestOrderToken(cartId, idempotencyKey, token) {
  try {
    const actual = Buffer.from(token);
    const expected = Buffer.from(createGuestOrderToken(cartId, idempotencyKey));
    return actual.length === expected.length && (0, import_node_crypto4.timingSafeEqual)(actual, expected);
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
  if (!cart || cart.status !== "active" && !(options.allowSubmitted && cart.status === "submitted")) throw new Error("Active cart not found");
  if (cart.expiresAt && new Date(cart.expiresAt).getTime() <= Date.now()) throw new Error("Cart has expired");
  const userId = context.session?.itemId;
  if (userId) {
    if (cart.customer?.id !== userId) throw new Error("You do not have access to this cart");
  } else {
    const validCartToken = Boolean(guestToken && !cart.customer && cart.guestTokenHash && verifyGuestCartToken(guestToken, cart.guestTokenHash));
    const validReplayToken = Boolean(
      options.allowSubmitted && cart.status === "submitted" && guestToken && cart.order?.idempotencyKey && verifyGuestOrderToken(cart.id, cart.order.idempotencyKey, guestToken)
    );
    if (!validCartToken && !validReplayToken) throw new Error("You do not have access to this cart");
  }
  return cart;
}

// features/keystone/mutations/publicQueries.ts
var import_node_crypto5 = require("node:crypto");
var PUBLIC_CATALOG_SEARCH_LIMIT = 100;
var PUBLIC_CATALOG_CURSOR_LIMIT = 2048;
function normalizePublicCatalogSearch(search) {
  if (search == null) return null;
  if (typeof search !== "string") throw new Error("Catalog search is invalid");
  const normalized = search.trim();
  if (!normalized) return null;
  if (normalized.length > PUBLIC_CATALOG_SEARCH_LIMIT || /[\u0000-\u001f\u007f]/u.test(normalized)) {
    throw new Error("Catalog search is invalid");
  }
  return normalized;
}
function publicCatalogPageSize(first) {
  if (first == null) return 50;
  if (!Number.isInteger(first) || first < 1) throw new Error("Catalog page size must be a positive integer");
  return Math.min(first, 100);
}
function decodePublicCatalogCursor(cursor, expectedScope) {
  if (cursor == null) return null;
  if (typeof cursor !== "string" || cursor.length > PUBLIC_CATALOG_CURSOR_LIMIT) throw new Error("Catalog cursor is invalid");
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof value?.title !== "string" || value.title.length > 1e3 || typeof value?.id !== "string" || !value.id || value.id.length > 256 || value.scope !== expectedScope) throw new Error();
    return { title: value.title, id: value.id };
  } catch {
    throw new Error("Catalog cursor is invalid");
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
  if (typeof search !== "string") throw new Error("Location search is invalid");
  const normalized = search.trim();
  if (!normalized) return null;
  if (normalized.length > PUBLIC_CATALOG_SEARCH_LIMIT || /[\u0000-\u001f\u007f]/u.test(normalized)) {
    throw new Error("Location search is invalid");
  }
  return normalized;
}
function publicLocationPageSize(first) {
  if (first == null) return 50;
  if (!Number.isInteger(first) || first < 1) throw new Error("Location page size must be a positive integer");
  return Math.min(first, 100);
}
function decodePublicLocationCursor(cursor, expectedScope) {
  if (cursor == null) return null;
  if (typeof cursor !== "string" || cursor.length > PUBLIC_CATALOG_CURSOR_LIMIT) throw new Error("Location cursor is invalid");
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof value?.name !== "string" || value.name.length > 1e3 || typeof value?.id !== "string" || !value.id || value.id.length > 256 || value.scope !== expectedScope) throw new Error();
    return { name: value.name, id: value.id };
  } catch {
    throw new Error("Location cursor is invalid");
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
var PUBLIC_TENANT_QUERY = "id storefrontKey storefrontHost operatorDisplayName operatorTagline brandPrimaryColor brandAccentColor brandLogoUrl logoIcon logoColor supportEmail supportPhone privacyNotice";
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
  throw new Error(active.length ? "Store not found" : "Store is not set up yet");
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
  const cursorScope = (0, import_node_crypto5.createHash)("sha256").update(JSON.stringify({
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
  if (!PUBLIC_CATALOG_CATEGORIES.includes(value)) throw new Error("Category is not available");
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
    throw new Error("This location is not available");
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
  const cursorScope = (0, import_node_crypto5.createHash)("sha256").update(JSON.stringify({
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
      query: "id title handle sku description category priceAmount currencyCode taxable imageUrl prescriptionRequirement inventoryLots(where: { quantityAvailable: { gt: 0 } }, orderBy: { expirationDate: asc }, take: 101) { status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }"
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
  if (!isSignedIn({ session: context.session })) throw new Error("Authentication required");
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
    product { id title handle sku description category priceAmount currencyCode imageUrl prescriptionRequirement }
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
  if (!location || location.status !== "active" || !location.onlineOrderingEnabled && !staffPos) throw new Error("Location is not accepting orders");
  if (staffPos) await requireTenantMembership(context, { organizationId: location.organization.id, locationId: location.id });
  if (!staffPos) {
    const organization = await loadPublicTenant(context, args.tenantKey);
    if (organization.id !== location.organization.id) throw new Error("This location is not available");
    if (location.pickupEnabled !== true && location.deliveryEnabled !== true) throw new Error("Location is not accepting orders");
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
  if (!Number.isInteger(args.quantity) || args.quantity < 1 || args.quantity > 99) throw new Error("Quantity must be between 1 and 99");
  return withDomainTransaction(context, [`cart:${args.cartId}`], async (transactionContext) => {
    const cart = await loadAndAssertCartAccess(transactionContext, args.cartId, args.guestToken);
    const product = await transactionContext.sudo().query.Product.findOne({
      where: { id: args.productId },
      query: "id status onlineAvailable prescriptionRequirement priceAmount location { id } inventoryLots { status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }"
    });
    if (!product || product.location?.id !== cart.location.id) throw new Error("Product is not available at this location");
    assertProductCanEnterPublicCart(product);
    const existing = cart.items.find((item) => item.product?.id === product.id);
    const requestedQuantity = (existing?.quantity || 0) + args.quantity;
    const availableQuantity = (product.inventoryLots || []).filter((lot) => lot.location?.id === cart.location.id).reduce((sum, lot) => sum + eligibleLotQuantity(lot), 0);
    if (requestedQuantity > availableQuantity) throw new Error("Requested quantity is not available from eligible inventory");
    if (existing) {
      const quantity = requestedQuantity;
      if (quantity > 99) throw new Error("Quantity must be between 1 and 99");
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
  if (!item?.cart) throw new Error("Cart item not found");
  if (!Number.isInteger(args.quantity) || args.quantity < 0 || args.quantity > 99) throw new Error("Quantity must be between 0 and 99");
  return withDomainTransaction(context, [`cart:${item.cart.id}`], async (transactionContext) => {
    const cart = await loadAndAssertCartAccess(transactionContext, item.cart.id, args.guestToken);
    const current = await transactionContext.sudo().query.CartItem.findOne({ where: { id: args.cartItemId }, query: "id cart { id } product { inventoryLots { status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } } }" });
    if (!current || current.cart?.id !== cart.id) throw new Error("Cart item not found");
    if (args.quantity > 0) {
      const availableQuantity = (current.product?.inventoryLots || []).filter((lot) => lot.location?.id === cart.location.id).reduce((sum, lot) => sum + eligibleLotQuantity(lot), 0);
      if (args.quantity > availableQuantity) throw new Error("Requested quantity is not available from eligible inventory");
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
var import_node_crypto7 = require("node:crypto");

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
var import_node_crypto6 = require("node:crypto");

// features/keystone/workflows/fill-price.ts
function fillPricePortion(price, authorized, alreadyDispensed, quantity) {
  if (![price, authorized, alreadyDispensed, quantity].every(Number.isSafeInteger) || price < 0 || authorized < 1 || alreadyDispensed < 0 || quantity < 1 || alreadyDispensed + quantity > authorized) throw new Error("Fill price allocation is invalid");
  return Number(BigInt(price) * BigInt(alreadyDispensed + quantity) / BigInt(authorized) - BigInt(price) * BigInt(alreadyDispensed) / BigInt(authorized));
}

// features/keystone/workflows/fill-entitlement.ts
var FILL_LINEAGE = "per_fill_v1";
function fillHash(value) {
  const canonical = (v) => Array.isArray(v) ? v.map(canonical) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])])) : v ?? null;
  return (0, import_node_crypto6.createHash)("sha256").update(JSON.stringify(canonical(value))).digest("hex");
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
function prescriptionItemVersion(p, item) {
  return fillHash({
    prescriptionId: p.id,
    organizationId: p.organization?.id,
    locationId: p.location?.id,
    patientId: p.patient?.id,
    prescriberId: p.prescriber?.id,
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
function prescriptionAuthorityVersion(p) {
  return fillHash({
    sourceVerificationStatus: p.sourceVerificationStatus,
    writtenAt: p.writtenAt,
    expiresAt: p.expiresAt,
    prescriber: p.prescriber,
    patient: {
      id: p.patient?.id,
      identityVerificationStatus: p.patient?.identityVerificationStatus,
      identityReference: p.patient?.identityReference,
      identityVerifiedAt: p.patient?.identityVerifiedAt,
      identityVerifiedBy: p.patient?.identityVerifiedBy
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
  if (!["requested", "approved", "partially_dispensed", "dispensed", "released"].includes(f.status) || f.creditState === "released" && f.status !== "released") throw new Error("Fill lifecycle evidence is invalid");
  if (["requested", "approved"].includes(f.status) && (f.quantityDispensed !== 0 || f.quantityReleased !== 0 || f.creditState !== "reserved")) throw new Error("Unconsumed reservation evidence is invalid");
  if (f.status === "partially_dispensed" && (f.quantityDispensed < 1 || f.quantityDispensed >= f.authorizedQuantity || f.quantityReleased !== 0)) throw new Error("Partial fill evidence is invalid");
  if (f.status === "dispensed" && (f.quantityDispensed !== f.authorizedQuantity || f.quantityReleased !== 0)) throw new Error("Completed fill evidence is invalid");
  if (["dispensed", "released"].includes(f.status) && f.quantityDispensed + f.quantityReleased !== f.authorizedQuantity) throw new Error("Closed fill must account for every authorized unit");
}
function dispenseFillPlan(f, expectedVersion, quantity, now = Date.now()) {
  assertFillConservation(f);
  if (f.version !== expectedVersion) throw new Error("Fill version changed; refresh the workbench");
  if (!["approved", "partially_dispensed"].includes(f.status)) throw new Error("Fill is not approved for dispensing");
  const expiry = new Date(f.expiresAt).getTime();
  if (!Number.isFinite(expiry) || expiry <= now) throw new Error("Fill reservation expired; record an authorized release");
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > f.authorizedQuantity - f.quantityDispensed - f.quantityReleased) throw new Error("Quantity exceeds this fill reservation");
  const policy = parseFillPolicy(f.policySnapshot);
  if (!policy.allowPartial && quantity !== f.authorizedQuantity - f.quantityDispensed) throw new Error("Partial dispensing is not admitted by the recorded fill policy");
  const quantityDispensed = f.quantityDispensed + quantity;
  return {
    quantityDispensed,
    creditState: "consumed",
    version: f.version + 1,
    status: quantityDispensed === f.authorizedQuantity ? "dispensed" : "partially_dispensed",
    debitRefill: f.kind === "refill" && f.creditState === "reserved"
  };
}
function releaseFillPlan(f, expectedVersion, cause, now = Date.now()) {
  assertFillConservation(f);
  if (f.version !== expectedVersion) throw new Error("Fill version changed; refresh the workbench");
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
  if (input.sourceVerificationStatus !== "human_verified") throw new Error("Prescription source must be verified by an authorized human");
  if (!input.writtenAt || new Date(input.writtenAt).getTime() > now) throw new Error("Prescription written date is invalid");
  if (!input.expiresAt || new Date(input.expiresAt).getTime() <= now) throw new Error("Prescription is expired");
  const prescriber = input.prescriber;
  const credentialExpiry = prescriber?.credentialExpiresAt ? new Date(prescriber.credentialExpiresAt).getTime() : Number.NaN;
  if (prescriber?.verificationStatus !== "validated" || prescriber.externalValidationComplete !== true || !["organization_recorded", "external_provider"].includes(prescriber.verificationMethod || "") || !isValidNpi(prescriber.npi) || !prescriber.credentialType?.trim() || !prescriber.credentialJurisdiction?.trim() || !prescriber.credentialIdentifier?.trim() || !prescriber.validationReference?.trim() || !prescriber.verifiedBy?.id || !Number.isFinite(credentialExpiry) || credentialExpiry <= now) {
    throw new Error("Current organization-recorded prescriber identity and credential review evidence is required");
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
  if (!query.PrescriptionFill || !query.PrescriptionFillEvent) throw new Error("Per-fill lineage requires the isolated schema/migration gate; legacy records are not converted automatically");
  return query;
}
async function currentFillPermission(context, permission2) {
  requirePermission(context, permission2);
  const actor = await context.sudo().query.User.findOne({ where: { id: context.session.itemId }, query: `id role { ${permission2} }` });
  if (!actor?.role?.[permission2]) throw new Error("Current operator permission was revoked");
}
async function loadFillPrescription(context, prescriptionId) {
  const p = await context.sudo().query.Prescription.findOne({ where: { id: prescriptionId }, query: FILL_PRESCRIPTION_QUERY });
  if (!p?.organization?.id || !p.location?.id || !p.patient?.id || p.patient.status !== "active" || !p.patient.organizations?.some((o) => o.id === p.organization.id) || p.prescriber?.organization?.id !== p.organization.id) throw new Error("Current prescription/patient/prescriber scope requires reconciliation");
  return p;
}
async function assertItemFillLedger(context, p, item) {
  if (item.fillLineage !== FILL_LINEAGE) return;
  const store = context.prisma.prescriptionFill;
  if (!store) throw new Error("Per-fill schema gate is required");
  const where = { prescriptionId: p.id, prescriptionItemId: item.id, organizationId: p.organization.id, locationId: p.location.id, patientId: p.patient.id };
  const [totals, consumed, reserved] = await Promise.all([
    store.aggregate({ where, _sum: { quantityDispensed: true } }),
    store.count({ where: { ...where, kind: "refill", creditState: "consumed" } }),
    store.count({ where: { ...where, kind: "refill", creditState: "reserved" } })
  ]);
  for (const value of [totals, consumed, reserved]) if (value instanceof Error) throw value;
  if ((totals._sum.quantityDispensed ?? 0) !== item.quantityDispensed || consumed !== item.refillsAuthorized - item.refillsRemaining || reserved !== item.refillsReserved) {
    throw new Error("Item counters disagree with immutable fill lineage; reconciliation is required");
  }
}
function assertFillBinding(fill, p, item, clinical = true) {
  if (fill.prescription?.id !== p.id || fill.prescriptionItem?.id !== item?.id || fill.organization?.id !== p.organization.id || fill.location?.id !== p.location.id || fill.patient?.id !== p.patient.id || fill.itemVersion !== prescriptionItemVersion(p, item)) {
    throw new Error("Prescription item or patient changed; reconcile without rewriting history");
  }
  if (clinical) {
    if (fill.priceSnapshot?.taxRateBps !== p.organization.cashTaxRateBps || fill.priceSnapshot?.taxPolicyReference !== p.organization.cashTaxPolicyReference) throw new Error("Cash tax policy changed after reservation; explicit reconciliation is required");
    assertPrescriptionClinicallyEligible(p);
    assertPrescriptionItemProductIdentity(item);
    if (fill.authorityVersion !== prescriptionAuthorityVersion(p)) throw new Error("Prescriber/source/patient authority changed after reservation; fresh evidence is required");
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
  await recordAuditAndOutbox(context, {
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
  if (result.count !== 1) throw new Error("Fill version changed; refresh the workbench");
  return { ...fill, ...data };
}
async function reserveFillInTransaction(context, p, item, input) {
  const q = fillStore(context);
  if (p.items.length !== 1) throw new Error("Per-fill workflow requires one prescription item; multi-item authority is not inferred");
  if (item.fillLineage !== FILL_LINEAGE) throw new Error("Legacy item has no per-fill entitlement provenance; explicit reconciliation is required");
  assertPrescriptionClinicallyEligible(p);
  assertPrescriptionItemProductIdentity(item);
  await assertItemFillLedger(context, p, item);
  if (!input.expectedItemVersion || input.expectedItemVersion !== prescriptionItemVersion(p, item)) throw new Error("Prescription item version changed; refresh before reserving");
  const existing = await q.PrescriptionFill.findOne({ where: { reservationKey: input.key }, query: FILL_QUERY });
  if (existing) {
    assertFillBinding(existing, p, item);
    if (existing.requestFingerprint !== input.fingerprint) throw new Error("Fill reservation key is already bound to another request");
    return { fill: existing, reused: true };
  }
  if (await q.PrescriptionFill.findOne({ where: { openKey: `item:${item.id}` }, query: "id" })) throw new Error("This item already has an open fill; recover or release that fill");
  if (!p.organization.prescriptionFillPolicy?.approvalId) throw new Error("Fill policy lacks recorded operator approval");
  if (p.organization.cashSalesEnabled !== true || !p.organization.cashTaxPolicyReference?.trim() || !p.organization.cashPolicyReviewedAt || !Number.isInteger(p.organization.cashTaxRateBps)) throw new Error("Reviewed cash/tax policy is required before fill reservation");
  if (item.product.currencyCode !== "USD" || !Number.isSafeInteger(item.product.priceAmount) || item.product.priceAmount < 0) throw new Error("Fill price/currency requires bounded USD cash policy reconciliation");
  const cashPolicy = { taxRateBps: p.organization.cashTaxRateBps, policyReference: p.organization.cashTaxPolicyReference };
  const policySnapshot = { ...parseFillPolicy(p.organization.prescriptionFillPolicy), approvalId: p.organization.prescriptionFillPolicy.approvalId };
  if (!Number.isSafeInteger(item.quantityPrescribed) || item.quantityPrescribed < 1) throw new Error("Prescribed quantity requires reconciliation");
  let fillNumber = 1;
  if (input.kind === "original") {
    if (!["approved", "fill_closed"].includes(p.status) || item.quantityDispensed !== 0 || item.refillsRemaining !== item.refillsAuthorized || item.refillsReserved !== 0) throw new Error("Original fill requires approved unused authority");
  } else {
    if (!["dispensed", "fill_closed"].includes(p.status) || item.quantityDispensed < 1 || item.refillsRemaining - item.refillsReserved < 1) throw new Error("No unreserved refill entitlement is available");
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
    itemVersion: prescriptionItemVersion(p, item),
    authorityVersion: prescriptionAuthorityVersion(p),
    policySnapshot,
    priceSnapshot: { amount: item.product.priceAmount, currencyCode: item.product.currencyCode, taxable: item.product.taxable !== false, taxAmount: calculateTaxAmount(item.product.taxable !== false ? item.product.priceAmount : 0, cashPolicy.taxRateBps), taxRateBps: cashPolicy.taxRateBps, taxPolicyReference: cashPolicy.policyReference, title: item.product.title, sku: item.product.sku },
    expiresAt: new Date(Math.min(new Date(p.expiresAt).getTime(), Date.now() + policySnapshot.reservationMinutes * 6e4)).toISOString(),
    organization: connect(p.organization.id),
    location: connect(p.location.id),
    patient: connect(p.patient.id),
    prescription: connect(p.id),
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
  if (!args.idempotencyKey?.trim()) throw new Error("Idempotency key is required");
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `prescription-item:${args.prescriptionItemId}`, `fill-command:${args.idempotencyKey}`], async (tx) => {
    const p = await loadFillPrescription(tx, args.prescriptionId);
    const { userId } = await requireTenantMembership(tx, { organizationId: p.organization.id, locationId: p.location.id, pharmacist: true });
    await currentFillPermission(tx, "canReviewPrescriptions");
    const item = p.items.find((i) => i.id === args.prescriptionItemId);
    if (!item) throw new Error("Prescription item not found");
    const fingerprint2 = fillHash({ ...args, actorId: userId });
    const existing = await fillStore(tx).PrescriptionFill.findOne({ where: { reservationKey: args.idempotencyKey }, query: FILL_QUERY });
    if (existing) {
      assertFillBinding(existing, p, item);
      await assertItemFillLedger(tx, p, item);
      if (existing.requestFingerprint !== fingerprint2) throw new Error("Fill reservation key is already bound to another request");
      return { success: true, reused: true, fillId: existing.id, status: existing.status, version: existing.version };
    }
    const approval = await createHumanApproval(tx, {
      organizationId: p.organization.id,
      locationId: p.location.id,
      actorId: userId,
      actionType: "prescription_review",
      reason: args.reason,
      attested: args.attested,
      evidence: { stage: "fill_reservation", itemVersion: args.expectedItemVersion }
    });
    const { fill } = await reserveFillInTransaction(tx, p, item, { kind: "original", actorId: userId, key: args.idempotencyKey, fingerprint: fingerprint2, expectedItemVersion: args.expectedItemVersion, approvalId: approval.id });
    if (p.status === "fill_closed") await tx.sudo().query.Prescription.updateOne({ where: { id: p.id }, data: { status: "approved" } });
    return { success: true, reused: false, fillId: fill.id, status: fill.status, version: fill.version };
  });
}
async function releasePharmacyPrescriptionFill(_root, args, context) {
  await currentFillPermission(context, "canReviewPrescriptions");
  if (!args.idempotencyKey?.trim()) throw new Error("Idempotency key is required");
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `fill-command:${args.idempotencyKey}`], async (tx) => {
    const p = await loadFillPrescription(tx, args.prescriptionId);
    const { userId } = await requireTenantMembership(tx, { organizationId: p.organization.id, locationId: p.location.id, pharmacist: true });
    await currentFillPermission(tx, "canReviewPrescriptions");
    const q = fillStore(tx), fill = await q.PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY });
    const item = p.items.find((i) => i.id === fill?.prescriptionItem?.id);
    if (!fill || !item) throw new Error("Fill not found");
    assertFillBinding(fill, p, item, false);
    await assertItemFillLedger(tx, p, item);
    const fingerprint2 = fillHash({ ...args, actorId: userId });
    const eventKey = `fill.release:${args.idempotencyKey}`;
    const prior = await q.PrescriptionFillEvent.findOne({ where: { eventKey }, query: "id commandFingerprint result" });
    if (prior) {
      if (prior.commandFingerprint !== fingerprint2) throw new Error("Fill release key is already bound to another request");
      return { ...prior.result, reused: true };
    }
    const plan = releaseFillPlan(fill, args.expectedVersion, args.cause);
    const approval = await createHumanApproval(tx, {
      organizationId: p.organization.id,
      locationId: p.location.id,
      actorId: userId,
      actionType: "prescription_review",
      reason: args.reason,
      attested: args.attested,
      evidence: { stage: "fill_release", fillId: fill.id, cause: args.cause, entitlementRestored: false, inventoryRestocked: false }
    });
    if (plan.releaseRefill) {
      if (item.refillsReserved < 1) throw new Error("Refill reservation counter requires reconciliation");
      await tx.sudo().query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { refillsReserved: item.refillsReserved - 1 } });
    }
    const { releaseRefill, ...data } = plan;
    const updated = await casFill(tx, fill, { ...data, openKey: null });
    if (fill.refillRequest?.id) await tx.sudo().query.RefillRequest.updateOne({ where: { id: fill.refillRequest.id }, data: { status: "cancelled", openRequestKey: null, resolutionNote: args.reason, resolvedAt: (/* @__PURE__ */ new Date()).toISOString() } });
    if (fill.status !== "requested") await tx.sudo().query.Prescription.updateOne({ where: { id: p.id }, data: { status: "fill_closed" } });
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
async function consumeFillInTransaction(tx, fill, item, expectedVersion, quantity, input) {
  const plan = dispenseFillPlan(fill, expectedVersion, quantity);
  if (plan.debitRefill) {
    if (item.refillsReserved < 1 || item.refillsRemaining < 1) throw new Error("Refill reservation evidence requires reconciliation");
    await tx.sudo().query.PrescriptionItem.updateOne({ where: { id: item.id }, data: { refillsReserved: item.refillsReserved - 1, refillsRemaining: item.refillsRemaining - 1 } });
  }
  const { debitRefill, ...data } = plan;
  const updated = await casFill(tx, fill, { ...data, ...plan.status === "dispensed" ? { openKey: null } : {} });
  await appendFillEvent(tx, updated, {
    eventKey: `fill.dispense:${input.key}`,
    fingerprint: input.fingerprint,
    action: "dispensed",
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
  if (!organization) throw new Error("Organization not found");
  return { organizationId: organization.id, configured: Boolean(organization.prescriptionFillPolicy?.approvalId), version: organization.prescriptionFillPolicy?.version || null };
}
async function recordPharmacyFillPolicy(_root, args, context) {
  await currentFillPermission(context, "canManageOrganizations");
  await currentFillPermission(context, "canApproveConsequentialActions");
  const policy = parseFillPolicy(args.policy);
  if (!args.idempotencyKey?.trim()) throw new Error("Idempotency key is required");
  return withDomainTransaction(context, [`fill-policy:${args.organizationId}`, `fill-policy-command:${args.idempotencyKey}`], async (tx) => {
    const { userId } = await requireTenantMembership(tx, { organizationId: args.organizationId, organizationWide: true, pharmacist: true });
    await currentFillPermission(tx, "canManageOrganizations");
    await currentFillPermission(tx, "canApproveConsequentialActions");
    const fingerprint2 = fillHash({ ...args, policy, actorId: userId }), eventKey = `fill.policy:${args.idempotencyKey}`;
    const prior = await tx.sudo().query.AuditEvent.findOne({ where: { eventKey }, query: "id metadata" });
    if (prior) {
      if (prior.metadata?.commandFingerprint !== fingerprint2) throw new Error("Policy key is already bound to another request");
      return { success: true, reused: true, status: "configured" };
    }
    const organization = await tx.sudo().query.Organization.findOne({ where: { id: args.organizationId }, query: "id prescriptionFillPolicy" });
    if (organization.prescriptionFillPolicy?.version === policy.version && fillHash(parseFillPolicy(organization.prescriptionFillPolicy)) !== fillHash(policy)) throw new Error("Changed policy requires a new version");
    const approval = await createHumanApproval(tx, {
      organizationId: args.organizationId,
      actorId: userId,
      actionType: "prescription_review",
      reason: args.reason,
      attested: args.attested,
      evidence: { stage: "fill_policy", policy, clinicalValidityClaimed: false, nonRetroactive: true }
    });
    await tx.sudo().query.Organization.updateOne({ where: { id: args.organizationId }, data: { prescriptionFillPolicy: { ...policy, approvalId: approval.id } } });
    await recordAuditAndOutbox(tx, {
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
  if (!["active", "inactive"].includes(args.marketingStatus)) throw new Error("Marketing status is invalid");
  if (!["none", "controlled_or_unsupported"].includes(args.controlledSchedule)) throw new Error("Controlled schedule review is invalid");
  if (![args.sourceName, args.sourceVersion, args.sourceReference].every((value) => value?.trim())) throw new Error("Drug source name, version, and reference are required");
  return withDomainTransaction(context, [`drug-reference:${args.drugReferenceId}`, `drug-reference-review:${args.organizationId}:${args.drugReferenceId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const [drugReference, existing] = await Promise.all([
      sudo.query.DrugReference.findOne({ where: { id: args.drugReferenceId }, query: "id ndc11" }),
      sudo.query.DrugReferenceReview.findMany({ where: { reviewKey: { equals: `${args.organizationId}:${args.drugReferenceId}` } }, take: 1, query: "id status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference approval { id }" }).then((records) => records[0])
    ]);
    if (!drugReference) throw new Error("Drug reference not found");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: args.organizationId, pharmacist: true });
    if (existing && existing.status === "active" && existing.marketingStatusSnapshot === args.marketingStatus && existing.controlledScheduleSnapshot === args.controlledSchedule && existing.sourceName === args.sourceName.trim() && existing.sourceVersion === args.sourceVersion.trim() && existing.sourceReference === args.sourceReference.trim()) {
      return { success: true, reused: true, reviewId: existing.id, status: existing.status, approvalId: existing.approval?.id };
    }
    const approval = await createHumanApproval(transactionContext, { organizationId: args.organizationId, actorId: userId, actionType: "drug_reference_review", reason: args.reason, attested: args.attested, evidence: { drugReferenceId: drugReference.id, ndc11: drugReference.ndc11, marketingStatus: args.marketingStatus, controlledSchedule: args.controlledSchedule, sourceName: args.sourceName.trim(), sourceVersion: args.sourceVersion.trim(), sourceReference: args.sourceReference.trim(), softwareValidationPerformed: false } });
    const prisma = transactionContext.prisma;
    const now = /* @__PURE__ */ new Date();
    const data = { status: "active", marketingStatusSnapshot: args.marketingStatus, controlledScheduleSnapshot: args.controlledSchedule, sourceName: args.sourceName.trim(), sourceVersion: args.sourceVersion.trim(), sourceReference: args.sourceReference.trim(), reviewedAt: now, organizationId: args.organizationId, drugReferenceId: drugReference.id, reviewedById: userId, approvalId: approval.id };
    const review = existing ? await prisma.drugReferenceReview.update({ where: { id: existing.id }, data, select: { id: true, status: true } }) : await prisma.drugReferenceReview.create({ data: { reviewKey: `${args.organizationId}:${drugReference.id}`, ...data }, select: { id: true, status: true } });
    await recordAuditAndOutbox(transactionContext, { eventKey: `drug_reference.reviewed:${review.id}:${approval.id}`, organizationId: args.organizationId, actorId: userId, eventType: "drug_reference.review_recorded", resourceType: "DrugReferenceReview", resourceId: review.id, metadata: { drugReferenceId: drugReference.id, approvalId: approval.id, marketingStatus: args.marketingStatus, controlledSchedule: args.controlledSchedule, softwareValidationPerformed: false } });
    return { success: true, reused: false, reviewId: review.id, status: review.status, approvalId: approval.id };
  });
}
function clinicalSafetyReviewRequestFingerprint(input) {
  return (0, import_node_crypto7.createHash)("sha256").update(JSON.stringify({
    ...input,
    reviewReference: input.reviewReference?.trim(),
    notes: input.notes?.trim() || null,
    overrideReason: input.overrideReason?.trim() || null,
    reason: input.reason?.trim()
  })).digest("hex");
}
async function recordPrescriptionClinicalSafetyReview(_root, args, context) {
  requirePermission(context, "canReviewPrescriptions");
  if (!["clear", "override", "rejected"].includes(args.outcome)) throw new Error("Clinical safety review outcome is invalid");
  if (!args.idempotencyKey?.trim()) throw new Error("Idempotency key is required");
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
      query: 'id status organization { id } location { id } patient { id identityVerificationStatus identityReference identityVerifiedAt identityVerifiedBy { id } allergies(where: { status: { equals: "active" } }) { id updatedAt } medications(where: { status: { equals: "current" } }) { id updatedAt } } items { id fillLineage activeFillNumber refillsAuthorized refillsRemaining drugReference { id } }'
    });
    if (!prescription || !["pending_review", "needs_information", "approved"].includes(prescription.status)) throw new Error("Prescription is not available for clinical safety review");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: prescription.organization.id, locationId: prescription.location.id, pharmacist: true });
    let fill = null;
    if (prescription.items.some((item) => item.fillLineage === FILL_LINEAGE)) {
      await currentFillPermission(transactionContext, "canReviewPrescriptions");
      const current = await loadFillPrescription(transactionContext, prescription.id);
      if (args.fillId) {
        fill = await fillStore(transactionContext).PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY });
        const item = current.items.find((entry) => entry.id === fill?.prescriptionItem?.id);
        if (!fill || !item || fill.version !== args.expectedFillVersion || !["approved", "partially_dispensed"].includes(fill.status) || new Date(fill.expiresAt).getTime() <= Date.now()) throw new Error("A current fill identity/version is required for safety review");
        assertFillBinding(fill, current, item);
        await assertItemFillLedger(transactionContext, current, item);
      } else if (!["pending_review", "needs_information"].includes(prescription.status)) throw new Error("Exact fill reservation is required; an intake review does not clear a new reservation");
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
    if (prescription.patient.identityVerificationStatus !== "confirmed" || !prescription.patient.identityReference?.trim() || !prescription.patient.identityVerifiedAt || !prescription.patient.identityVerifiedBy?.id) throw new Error("Current operator-recorded patient identity evidence is required before clinical review");
    if (!prescription.patient.allergies?.length || !prescription.patient.medications?.length) throw new Error("Explicit allergy and medication history evidence is required; record no-known/no-current entries when applicable");
    const fillNumbers = prescription.items.map((item) => currentFillNumber(item));
    const fillNumber = Math.max(...fillNumbers);
    if (!fillNumbers.length || fillNumbers.some((value) => value !== fillNumber)) throw new Error("Prescription items are not aligned to one fill review");
    if (args.outcome !== "rejected") assertCurrentHumanSafetyReview({ ...candidate, fillNumber }, fillNumber);
    const reviewKey = `${prescription.id}:${fillNumber}:${args.idempotencyKey.trim()}`;
    const existing = (await sudo.query.ClinicalSafetyReview.findMany({ where: { reviewKey: { equals: reviewKey } }, take: 1, query: "id outcome evidenceSnapshot approval { id }" }))[0];
    if (existing && existing.evidenceSnapshot?.requestFingerprint !== requestFingerprint) throw new Error("Clinical safety review idempotency key was reused with different input");
    if (existing) return { success: true, reused: true, reviewId: existing.id, prescriptionId: prescription.id, outcome: existing.outcome, approvalId: existing.approval?.id };
    const drugReferenceIds = [...new Set(prescription.items.map((item) => item.drugReference?.id).filter(Boolean))];
    const drugReviews = await sudo.query.DrugReferenceReview.findMany({
      where: { organization: { id: { equals: prescription.organization.id } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: "active" } },
      take: 100,
      query: "id drugReference { id } status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference reviewedAt"
    });
    if (!drugReferenceIds.length || drugReviews.length !== drugReferenceIds.length) throw new Error("Every prescription item requires drug reference review evidence");
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
    await recordAuditAndOutbox(transactionContext, { eventKey: `prescription.clinical_safety_reviewed:${review.id}`, organizationId: prescription.organization.id, locationId: prescription.location.id, actorId: userId, patientId: prescription.patient.id, eventType: "prescription.clinical_safety_review_recorded", resourceType: "ClinicalSafetyReview", resourceId: review.id, metadata: { prescriptionId: prescription.id, fillNumber, outcome: args.outcome, approvalId: approval.id, softwareClinicalDecisionPerformed: false } });
    return { success: true, reused: false, reviewId: review.id, prescriptionId: prescription.id, outcome: review.outcome, approvalId: approval.id };
  });
}
async function holdPrescriptionForClinicalReReview(_root, args, context) {
  requirePermission(context, "canReviewPrescriptions");
  if (!args.reason?.trim()) throw new Error("A reason for the clinical safety hold is required");
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: 'id status approval { id actionType reason evidence } organization { id } location { id } patient { id identityVerifiedAt allergies(where: { status: { equals: "active" } }) { id updatedAt } medications(where: { status: { equals: "current" } }) { id updatedAt } } items { id fillLineage activeFillNumber refillsAuthorized refillsRemaining drugReference { id } } safetyReviews(orderBy: { reviewedAt: desc }, take: 1) { id fillNumber outcome reviewedAt }'
    });
    if (!prescription) throw new Error("Prescription not found");
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
    const requestFingerprint = (0, import_node_crypto7.createHash)("sha256").update(JSON.stringify({ prescriptionId: prescription.id, organizationId: prescription.organization.id, locationId: prescription.location.id, actorId: userId, reason: args.reason.trim(), attested: args.attested, safetyReviewId: latestReview?.id || null, latestEvidenceChange: latestEvidenceChange || null })).digest("hex");
    if (prescription.status === "approved" && prescription.approval?.actionType === "clinical_safety_hold") {
      if (prescription.approval.evidence?.requestFingerprint !== requestFingerprint) throw new Error("Clinical safety hold replay does not match the recorded action");
      return { success: true, reused: true, prescriptionId: prescription.id, status: "approved", approvalId: prescription.approval.id };
    }
    if (!["ready_to_dispense", "partially_dispensed"].includes(prescription.status) || !latestReview || !isHumanSafetyReviewStale(latestReview, fillNumber, latestEvidenceChange)) {
      throw new Error("A clinical safety re-review hold is available only when new patient or drug-reference evidence invalidates the current fill review");
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
    await recordAuditAndOutbox(transactionContext, {
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
    throw new Error("Credential type, jurisdiction, identifier, expiration, and source reference are required");
  }
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) throw new Error("Credential review expiration must be in the future");
  if (expiresAt.getTime() > Date.now() + 5 * 366 * 864e5) throw new Error("Credential review expiration is outside the supported review window");
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
    if (!membership || membership.status !== "active" || !["owner", "pharmacist"].includes(membership.membershipRole)) throw new Error("Active owner or pharmacist membership not found");
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
    await recordAuditAndOutbox(transactionContext, {
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
    if (!prescriber || !isValidNpi(prescriber.npi)) throw new Error("Prescriber with a valid NPI is required");
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
    await recordAuditAndOutbox(transactionContext, {
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
function integer21(value, min = 0) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > 2147483647) throw readScopeError();
  return value;
}
function timestamp38(value) {
  if (typeof value !== "string" || !Number.isFinite(new Date(value).getTime())) throw readScopeError();
  return value;
}
function hash(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) throw readScopeError();
  return value;
}
function prescriptionReadScope(value, expectedId) {
  const p = record(value);
  if (p.id !== expectedId || !Array.isArray(p.items) || !p.items.length) throw readScopeError();
  const itemIds = p.items.map((value2) => {
    const item = record(value2);
    if (linkedId(item.prescription) !== p.id) throw readScopeError();
    return readId(item.id);
  });
  if (new Set(itemIds).size !== itemIds.length || linkedId(record(p.prescriber).organization) !== linkedId(p.organization)) throw readScopeError();
  return { prescriptionId: readId(p.id), organizationId: linkedId(p.organization), locationId: linkedId(p.location), patientId: linkedId(p.patient), prescriberId: linkedId(p.prescriber), itemIds };
}
var FILL_READ_METADATA = "id requestFingerprint openKey status kind version fillNumber creditState authorizedQuantity quantityDispensed quantityReleased itemVersion authorityVersion expiresAt createdAt prescription { id } prescriptionItem { id prescription { id } } organization { id } location { id } patient { id } refillRequest { id } reservedBy { id }";
function scopedFill(value, scope, expectedId) {
  const f = record(value), id = readId(f.id), itemId = linkedId(f.prescriptionItem);
  if (expectedId && id !== expectedId || linkedId(record(f.prescriptionItem).prescription) !== scope.prescriptionId || linkedId(f.prescription) !== scope.prescriptionId || linkedId(f.organization) !== scope.organizationId || linkedId(f.location) !== scope.locationId || linkedId(f.patient) !== scope.patientId || !scope.itemIds.includes(itemId)) throw readScopeError();
  const version = integer21(f.version, 1), fillNumber = integer21(f.fillNumber, 1);
  const authorizedQuantity = integer21(f.authorizedQuantity, 1), quantityDispensed = integer21(f.quantityDispensed), quantityReleased = integer21(f.quantityReleased);
  if (quantityDispensed + quantityReleased > authorizedQuantity || !["original", "refill"].includes(String(f.kind)) || !["requested", "approved", "partially_dispensed", "dispensed", "released"].includes(String(f.status)) || !["reserved", "consumed", "released"].includes(String(f.creditState))) throw readScopeError();
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
    createdAt: timestamp38(f.createdAt),
    expiresAt: timestamp38(f.expiresAt),
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
  const version = integer21(e.version, 1);
  if (version > fill.version || !["reserved", "approved", "rejected", "released", "dispensed", "clinical_reviewed"].includes(String(e.action))) throw readScopeError();
  const quantity = integer21(e.quantity);
  if (e.action === "dispensed" ? quantity < 1 || quantity > fill.quantityDispensed : e.action === "released" ? quantity > fill.quantityReleased : quantity !== 0) throw readScopeError();
  const commandFingerprint = hash(e.commandFingerprint);
  if (e.action === "reserved" && (commandFingerprint !== fill.requestFingerprint || linkedId(e.actor) !== fill.reservedById)) throw readScopeError();
  return { id, action: String(e.action), version, commandFingerprint, quantity, createdAt: timestamp38(e.createdAt), actorId: linkedId(e.actor), approvalId: e.approval ? linkedId(e.approval) : null };
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
    return { id: readId(c.id), createdAt: timestamp38(c.createdAt), version: integer21(c.version, 1) };
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
  const priceAmount = integer21(price.amount), taxAmount = integer21(price.taxAmount);
  if (typeof price.currencyCode !== "string" || !/^[A-Z]{3}$/.test(price.currencyCode) || typeof price.taxable !== "boolean") throw readScopeError();
  if (fill.refillRequestId) {
    const request = record(await q.RefillRequest.findOne({ where: { id: fill.refillRequestId }, query: "id prescription { id } prescriptionItem { id } patient { id } location { id }" }));
    if (request.id !== fill.refillRequestId || linkedId(request.prescription) !== scope.prescriptionId || linkedId(request.prescriptionItem) !== fill.itemId || linkedId(request.patient) !== scope.patientId || linkedId(request.location) !== scope.locationId) throw readScopeError();
  }
  return {
    id: fill.id,
    prescriptionItemId: fill.itemId,
    refillRequestId: fill.refillRequestId,
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
    const actionType = event.action === "dispensed" ? "dispense" : event.action === "clinical_reviewed" ? "clinical_safety_review" : "prescription_review";
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
    if (event.action !== "dispensed") throw readScopeError();
    const movementId = readId(evidence.movementId);
    const movement = tuple(await q.InventoryMovement.findOne({ where: { id: movementId }, query: "id requestFingerprint movementType quantityDelta organization { id } location { id } patient { id } prescription { id } prescriptionItem { id } order { id } actor { id } approval { id }" }), scope);
    if (movement.id !== movementId || movement.requestFingerprint !== event.commandFingerprint || movement.movementType !== "dispense" || movement.quantityDelta !== -event.quantity || linkedId(movement.prescriptionItem) !== fill.itemId || linkedId(movement.actor) !== event.actorId || linkedId(movement.approval) !== event.approvalId || linkedId(movement.order) !== result.orderId) throw readScopeError();
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
  if (!context.session?.itemId || !permissions.canViewPatientPrivateData({ session: context.session })) throw new Error("Patient private-data permission required");
  const permission2 = permissions.canReviewPrescriptions({ session: context.session }) ? "canReviewPrescriptions" : "canDispenseMedications";
  await currentFillPermission(context, permission2);
  const q = readStore(context);
  const actor = record(await q.User.findOne({ where: { id: context.session.itemId }, query: "id role { canViewPatientPrivateData canManageOrganizations canApproveConsequentialActions }" }));
  const role = record(actor.role);
  if (actor.id !== context.session.itemId || role.canViewPatientPrivateData !== true) throw new Error("Current patient private-data permission was revoked");
  const metadata = await q.Prescription.findOne({ where: { id: prescriptionId }, query: "id organization { id } location { id } patient { id } prescriber { id organization { id } } items { id prescription { id } }" });
  const scope = prescriptionReadScope(metadata, prescriptionId);
  await requireTenantMembership(context, { organizationId: scope.organizationId, locationId: scope.locationId, pharmacist: true });
  const p = record(await loadFillPrescription(context, prescriptionId));
  if (!sameScope(prescriptionReadScope(p, prescriptionId), scope)) throw readScopeError();
  return { p, role, scope };
}
async function pharmacyFillWorkbench(_root, args, context) {
  const { p, role, scope } = await authorizedFillReadback(context, args.prescriptionId);
  const q = readStore(context);
  let boundary = {};
  if (args.after) {
    const cursor = readCursor(args.after, scope, "operator_fill_workbench");
    const anchor = scopedFill(await q.PrescriptionFill.findOne({ where: { id: cursor.id }, query: fillMetadataQuery }), scope, cursor.id);
    if (anchor.createdAt !== cursor.createdAt || anchor.version !== cursor.version) throw new Error("Invalid or stale fill cursor");
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
  const items = p.items.map(record);
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
    policyConfigured: Boolean(record(p.organization).prescriptionFillPolicy && record(record(p.organization).prescriptionFillPolicy).approvalId),
    canConfigure,
    items: items.map((item, index) => ({
      id: item.id,
      itemVersion: prescriptionItemVersion(p, item),
      lineage: item.fillLineage || "legacy",
      originalReservable: item.fillLineage === FILL_LINEAGE && ["approved", "fill_closed"].includes(String(p.status)) && item.quantityDispensed === 0 && item.refillsRemaining === item.refillsAuthorized && !openItems[index]
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
  if (!value) throw new Error("Fill not found in current prescription scope");
  const fill = scopedFill(value, scope, args.fillId);
  let boundary = {};
  if (args.after) {
    const cursor = readCursor(args.after, scope, "operator_fill_history", fill.id);
    const anchor = scopedEvent(await q.PrescriptionFillEvent.findOne({ where: { id: cursor.id }, query: eventMetadataQuery }), scope, fill, cursor.id);
    if (anchor.createdAt !== cursor.createdAt || anchor.version !== cursor.version) throw new Error("Invalid or stale history cursor");
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

// features/keystone/mutations/paymentOperations.ts
var import_node_crypto8 = require("node:crypto");

// import("../../integrations/payment/**/*.ts") in features/keystone/utils/paymentProviderAdapter.ts
var globImport_integrations_payment_ts = __glob({
  "../../integrations/payment/index.ts": () => Promise.resolve().then(() => (init_payment(), payment_exports)),
  "../../integrations/payment/manual.ts": () => Promise.resolve().then(() => (init_manual(), manual_exports)),
  "../../integrations/payment/paypal.ts": () => Promise.resolve().then(() => (init_paypal(), paypal_exports)),
  "../../integrations/payment/stripe.ts": () => Promise.resolve().then(() => (init_stripe(), stripe_exports))
});

// features/keystone/utils/paymentProviderAdapter.ts
async function executeAdapterFunction({ provider, functionName, args }) {
  const functionPath = provider[functionName];
  if (functionPath.startsWith("http")) {
    const response = await fetch(functionPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, ...args })
    });
    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    return response.json();
  }
  const adapter = await globImport_integrations_payment_ts(`../../integrations/payment/${functionPath}.ts`);
  const fn = adapter[functionName];
  if (!fn) {
    throw new Error(
      `Function ${functionName} not found in adapter ${functionPath}`
    );
  }
  try {
    return await fn({ provider, ...args });
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
  if (!permissions.canManagePayments({ session: context.session })) throw new Error("Permission required: canManagePayments");
  if (!args.attested || args.reason.trim().length < 3) throw new Error("A refund reason and human confirmation are required");
  const prepared = await withDomainTransaction(context, [`payment:${args.paymentId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const payment = await sudo.query.Payment.findOne({
      where: { id: args.paymentId },
      query: `id status amount currencyCode externalPaymentId data order { id orderNumber organization { id } location { id } } provider { ${PAYMENT_PROVIDER_ADAPTER_FIELDS} }`
    });
    if (!payment?.order || !payment.provider) throw new Error("Payment not found");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: payment.order.organization.id, locationId: payment.order.location.id });
    if (payment.status === "refunded") return { reused: true, payment, userId };
    if (!["captured", "refund_pending"].includes(payment.status) || !payment.externalPaymentId) throw new Error("Only captured payments can be refunded");
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
  if (!["refunded", "succeeded"].includes(providerResult.status)) throw new Error(`Refund remains pending: ${providerResult.status || "unknown"}`);
  return withDomainTransaction(context, [`payment:${args.paymentId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const current = await sudo.query.Payment.findOne({ where: { id: args.paymentId }, query: "id status amount order { id organization { id } location { id } }" });
    if (!current?.order) throw new Error("Payment not found");
    if (current.status === "refunded") return { success: true, reused: true, paymentId: current.id, status: current.status, amount: current.amount };
    await sudo.query.Payment.updateOne({ where: { id: current.id }, data: { status: "refunded", data: { refund: providerResult, reason: args.reason.trim() } } });
    await recordAuditAndOutbox(transactionContext, {
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
  if (!cart.items.length || cart.totalAmount < 1) throw new Error("Cart is empty");
  const provider = (await context.sudo().query.PaymentProvider.findMany({
    where: { code: { equals: args.providerCode }, organization: { id: { equals: cart.organization.id } } },
    take: 1,
    query: `${PAYMENT_PROVIDER_ADAPTER_FIELDS} organization { id }`
  }))[0];
  if (!provider?.isInstalled) throw new Error("Payment provider is not available for this cart");
  const idempotencyKey = (0, import_node_crypto8.createHash)("sha256").update(`${cart.id}:${provider.id}:${cart.totalAmount}`).digest("hex");
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
  if (!externalPaymentId) throw new Error("Payment provider did not return a payment reference");
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
  if (!ORDER_STATUS[args.status]) throw new Error("Unsupported fulfillment status");
  return withDomainTransaction(context, [`fulfillment:${args.fulfillmentId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const fulfillment = await sudo.query.Fulfillment.findOne({
      where: { id: args.fulfillmentId },
      query: "id method status organization { id } location { id } assignedTo { id } order { id status patient { id } approval { id } payments { id status provider { createPaymentFunction } } }"
    });
    if (!fulfillment?.order) throw new Error("Fulfillment not found");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: fulfillment.organization.id,
      locationId: fulfillment.location.id
    });
    if (args.status === "out_for_delivery" && fulfillment.method !== "delivery") throw new Error("Only delivery orders can go out for delivery");
    if (args.status === "cancelled") throw new Error("Cancelling a paid order requires a refund; use the refund action instead");
    if (args.status === "handed_off" && fulfillment.assignedTo?.id !== userId) throw new Error("Only the assigned staff member can record the handoff");
    const payments = fulfillment.order.payments || [];
    const pickupPayments = payments.filter((payment) => payment.status === "pending" && isManualPaymentProvider(payment.provider || {}));
    if (args.status === "handed_off" && !payments.some((payment) => payment.status === "captured") && !pickupPayments.length) throw new Error("Payment must be captured before handoff");
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
    if (args.status === "handed_off") {
      for (const payment of pickupPayments) {
        await sudo.query.Payment.updateOne({
          where: { id: payment.id },
          data: { status: "captured", processedAt: (/* @__PURE__ */ new Date()).toISOString(), recordedBy: { connect: { id: userId } }, ...approval ? { approval: { connect: { id: approval.id } } } : {} },
          query: "id"
        });
      }
    }
    await sudo.query.Fulfillment.updateOne({ where: { id: fulfillment.id }, data: { status: args.status, ...args.status === "preparing" ? { assignedTo: { connect: { id: userId } } } : {} } });
    await sudo.query.Order.updateOne({
      where: { id: fulfillment.order.id },
      data: { status: ORDER_STATUS[args.status], ...approval ? { approval: { connect: { id: approval.id } } } : {} }
    });
    await recordAuditAndOutbox(transactionContext, {
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
var import_graphql2 = require("graphql");
var KINDS = ["registration", "transfer", "new_prescription"];
var RESOLUTIONS = ["in_review", "completed", "declined"];
var REQUEST_FIELDS = "id kind status createdAt resolvedAt resolutionNote firstName lastName dateOfBirth phone email allergies insurance counterpartyName counterpartyPhone prescriberName prescriberPhone medications note organization { id } location { id name } user { id name email } patient { id }";
function userInputError2(message) {
  return new import_graphql2.GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}
function clean(value, max) {
  const text45 = String(value ?? "").trim();
  if (text45.length > max) throw userInputError2(`Keep each answer under ${max} characters.`);
  return text45;
}
function customerProjection(request) {
  return { id: request.id, kind: request.kind, status: request.status, createdAt: request.createdAt, resolvedAt: request.resolvedAt, resolutionNote: request.resolutionNote || null, locationName: request.location?.name || "Pharmacy", counterpartyName: request.counterpartyName || null, medications: request.medications || null };
}
function staffProjection(request) {
  return {
    ...customerProjection(request),
    customerName: request.user?.name || "",
    customerEmail: request.user?.email || "",
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
  await recordAuditAndOutbox(context, {
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
  if (!userId) throw new Error("Authentication required");
  if (!canWorkRequests(context)) throw new Error("Permission required: canManagePatients or canManagePrescriptions");
  const sudo = context.sudo();
  const memberships = await sudo.query.OrganizationMembership.findMany({
    where: { user: { id: { equals: String(userId) } }, status: { equals: "active" }, organization: { status: { equals: "active" } } },
    query: "organization { id } location { id }"
  });
  const scopes = memberships.map((membership) => membership.location?.id ? { location: { id: { equals: membership.location.id } } } : { organization: { id: { equals: membership.organization.id } } });
  if (!scopes.length) return [];
  const status = args.status && ["requested", ...RESOLUTIONS].includes(args.status) ? args.status : null;
  const requests = await sudo.query.PrescriptionRequest.findMany({
    where: { AND: [{ OR: scopes }, ...status ? [{ status: { equals: status } }] : []] },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    query: REQUEST_FIELDS
  });
  return requests.map(staffProjection);
}
async function resolvePharmacyPrescriptionRequest(_root, args, context) {
  if (!canWorkRequests(context)) throw new Error("Permission required: canManagePatients or canManagePrescriptions");
  if (!RESOLUTIONS.includes(args.status)) throw new Error("Choose in review, completed or declined");
  const note = clean(args.note, 1e3);
  if (args.status === "declined" && note.length < 3) throw userInputError2("Give the reason for declining.");
  const sudo = context.sudo();
  const request = await sudo.query.PrescriptionRequest.findOne({ where: { id: args.requestId }, query: REQUEST_FIELDS });
  if (!request) throw new Error("Request not found");
  const { userId } = await requireTenantMembership(context, { organizationId: request.organization.id, locationId: request.location.id });
  if (["completed", "declined"].includes(request.status)) throw userInputError2("This request is already closed.");
  const terminal = args.status !== "in_review";
  const updated = await sudo.query.PrescriptionRequest.updateOne({
    where: { id: request.id },
    data: { status: args.status, resolutionNote: note || request.resolutionNote || "", ...terminal ? { resolvedAt: (/* @__PURE__ */ new Date()).toISOString(), resolvedBy: { connect: { id: String(userId) } } } : {} },
    query: REQUEST_FIELDS
  });
  await recordAuditAndOutbox(context, {
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
    product && product.coldChainRequired === false && location && location.status === "active" && location.organization?.status === "active" && location.organization.id && location.id && product.organization?.id === location.organization.id && product.location?.id === location.id
  );
}

// features/keystone/mutations/inventoryWorkflows.ts
async function receiveInventoryLot(_root, args, context) {
  requirePermission(context, "canManageInventory");
  if (!Number.isInteger(args.quantity) || args.quantity < 1) throw new Error("Received quantity must be a positive integer");
  if (!args.idempotencyKey?.trim() || !args.lotNumber?.trim()) throw new Error("Lot number and idempotency key are required");
  const expirationDate = new Date(args.expirationDate);
  if (Number.isNaN(expirationDate.getTime()) || expirationDate.getTime() <= Date.now()) throw new Error("Expiration date must be in the future");
  if (args.coldChainRequired) throw new Error("Cold-chain receiving is not supported yet");
  const requestFingerprint = (0, import_node_crypto10.createHash)("sha256").update(JSON.stringify({ productId: args.productId, locationId: args.locationId, supplierId: args.supplierId || null, lotNumber: args.lotNumber.trim(), serialNumber: args.serialNumber?.trim() || null, expirationDate: expirationDate.toISOString(), quantity: args.quantity, coldChainRequired: args.coldChainRequired, minimumTemperatureC: args.minimumTemperatureC ?? null, maximumTemperatureC: args.maximumTemperatureC ?? null, coldChainEvidenceComplete: args.coldChainEvidenceComplete, reason: args.reason?.trim(), attested: args.attested })).digest("hex");
  return withDomainTransaction(context, [`inventory-idempotency:${args.idempotencyKey}`, `product:${args.productId}`, `lot-number:${args.locationId}:${args.lotNumber}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.InventoryMovement.findOne({ where: { idempotencyKey: args.idempotencyKey }, query: "id requestFingerprint lot { id quantityAvailable location { id } product { organization { id } } }" });
    if (existing) {
      const organizationId = existing.lot?.product?.organization?.id;
      const locationId = existing.lot?.location?.id;
      if (!organizationId || !locationId) throw new Error("Receiving replay scope is incomplete; operator reconciliation is required");
      await requireTenantMembership(transactionContext, { organizationId, locationId });
      if (existing.requestFingerprint !== requestFingerprint) throw new Error("Receiving idempotency key was reused with different input");
      return { success: true, reused: true, movementId: existing.id, lotId: existing.lot.id, quantityAvailable: existing.lot.quantityAvailable };
    }
    const [product, location, supplier] = await Promise.all([
      sudo.query.Product.findOne({ where: { id: args.productId }, query: "id organization { id } location { id } coldChainRequired" }),
      sudo.query.PharmacyLocation.findOne({ where: { id: args.locationId }, query: "id status organization { id status }" }),
      args.supplierId ? sudo.query.Supplier.findOne({ where: { id: args.supplierId }, query: "id organization { id } status" }) : null
    ]);
    if (!isProductAtActiveTenantLocation(product, location)) {
      throw new Error("This product cannot be received at this location");
    }
    if (args.supplierId && (!supplier || supplier.organization?.id !== location.organization.id || supplier.status !== "active")) {
      throw new Error("Supplier must be active in the receiving organization");
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
        coldChainRequired: false,
        minimumTemperatureC: null,
        maximumTemperatureC: null,
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
    await recordAuditAndOutbox(transactionContext, {
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
  if (!Number.isInteger(args.targetQuantity) || args.targetQuantity < 0) throw new Error("Target quantity must be a non-negative integer");
  if (!args.idempotencyKey?.trim()) throw new Error("Idempotency key is required");
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
      if (!organizationId || !locationId) throw new Error("Inventory replay scope is incomplete; operator reconciliation is required");
      await requireTenantMembership(transactionContext, { organizationId, locationId });
      if (existing.lot?.id !== args.lotId || existing.requestFingerprint !== requestFingerprint) throw new Error("Inventory idempotency key was reused with different input");
      return { success: true, reused: true, movementId: existing.id, quantityAvailable: existing.lot.quantityAvailable };
    }
    const lot = await sudo.query.InventoryLot.findOne({
      where: { id: args.lotId },
      query: "id quantityAvailable quantityQuarantined status product { id organization { id } } location { id }"
    });
    if (!lot) throw new Error("Inventory lot not found");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: lot.product.organization.id,
      locationId: lot.location.id
    });
    if (args.targetQuantity < lot.quantityQuarantined) throw new Error("Available quantity cannot be lower than quarantined quantity");
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
      data: { quantityAvailable: args.targetQuantity, status: args.targetQuantity === 0 ? "depleted" : lot.status }
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
    await recordAuditAndOutbox(transactionContext, {
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
  if (!candidate) throw new Error("Recall not found");
  return withDomainTransaction(
    context,
    [`recall:${args.recallId}`, ...candidate.lots.map((lot) => `lot:${lot.id}`)],
    async (transactionContext) => {
      const sudo = transactionContext.sudo();
      const recall = await sudo.query.Recall.findOne({
        where: { id: args.recallId },
        query: "id status organization { id } location { id } approval { id } lots { id quantityAvailable product { id } location { id } }"
      });
      if (!recall) throw new Error("Recall not found");
      const { userId } = await requireTenantMembership(transactionContext, {
        organizationId: recall.organization.id,
        locationId: recall.location?.id,
        organizationWide: !recall.location?.id
      });
      if (recall.status === "quarantined") {
        return { success: true, reused: true, recallId: recall.id, status: recall.status, lotCount: recall.lots.length, approvalId: recall.approval?.id };
      }
      if (recall.status !== "active") throw new Error("Recall must be active before quarantine");
      if (!recall.lots.length) throw new Error("Recall has no affected lots");
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
      await recordAuditAndOutbox(transactionContext, {
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
  if (!permissions.canManageIntegrations({ session: context.session })) throw new Error("Permission required: canManageIntegrations");
  if (args.bearerToken.length < 16 || args.webhookSecret.length < 32) throw new Error("Provider credentials do not meet minimum length requirements");
  const provider = await context.sudo().query.IntegrationProvider.findOne({ where: { id: args.providerId }, query: "id providerType organization { id }" });
  if (!provider || !["erx", "insurance"].includes(provider.providerType)) throw new Error("Configurable integration provider not found");
  const { userId } = await requireTenantMembership(context, { organizationId: provider.organization.id });
  if (provider.providerType === "erx" && (!args.prescriberValidationPath || !args.prescriberValidationPath.includes("{npi}"))) throw new Error("eRx configuration requires a prescriber validation path containing {npi}");
  const configuration = normalizeConfiguration(args);
  const credentials = { bearerToken: args.bearerToken, webhookSecret: args.webhookSecret };
  const adapterFunctions = { submitFunction: "manual", statusFunction: "manual", webhookFunction: "manual" };
  await validateProviderConfiguration({ provider: { providerType: provider.providerType, ...adapterFunctions, configuration, credentials } });
  return withDomainTransaction(context, [`integration-provider:${provider.id}`], async (transactionContext) => {
    await transactionContext.sudo().query.IntegrationProvider.updateOne({
      where: { id: provider.id },
      data: { configuration, credentials, ...adapterFunctions, status: "active", externalValidationComplete: true, validatedAt: (/* @__PURE__ */ new Date()).toISOString(), validationReference: `health:${new URL(configuration.baseUrl).host}` }
    });
    await recordAuditAndOutbox(transactionContext, {
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
  if (!permissions.canManagePrescriptions({ session: context.session })) throw new Error("Permission required: canManagePrescriptions");
  const [provider, prescriber] = await Promise.all([
    context.sudo().query.IntegrationProvider.findOne({ where: { id: args.providerId }, query: "id providerType status externalValidationComplete configuration credentials submitFunction organization { id }" }),
    context.sudo().query.Prescriber.findOne({ where: { id: args.prescriberId }, query: "id npi organization { id }" })
  ]);
  if (!provider || provider.providerType !== "erx" || provider.status !== "active" || !provider.externalValidationComplete || !provider.configuration?.prescriberValidationPath) throw new Error("Active eRx prescriber validation provider not found");
  if (!prescriber || prescriber.organization.id !== provider.organization.id || !isValidNpi(prescriber.npi)) throw new Error("Prescriber has no valid NPI in this provider tenant");
  const { userId } = await requireTenantMembership(context, { organizationId: prescriber.organization.id });
  const result = await validatePrescriber({ provider, npi: prescriber.npi });
  const credentialExpiresAt = result.credentialExpiresAt ? new Date(result.credentialExpiresAt) : null;
  if (result.valid !== true || !result.validationReference || !result.credentialType || !result.credentialJurisdiction || !result.credentialIdentifier || !credentialExpiresAt || Number.isNaN(credentialExpiresAt.getTime()) || credentialExpiresAt.getTime() <= Date.now()) {
    throw new Error("External provider response lacks current prescriber identity and credential evidence");
  }
  return withDomainTransaction(context, [`prescriber:${prescriber.id}`], async (transactionContext) => {
    await transactionContext.prisma.prescriber.update({ where: { id: prescriber.id }, data: { verificationStatus: "validated", externalValidationComplete: true, verificationMethod: "external_provider", credentialType: String(result.credentialType).slice(0, 200), credentialJurisdiction: String(result.credentialJurisdiction).slice(0, 200), credentialIdentifier: String(result.credentialIdentifier).slice(0, 200), credentialExpiresAt, validationReference: String(result.validationReference).slice(0, 500), validatedAt: /* @__PURE__ */ new Date(), verifiedById: userId } });
    await recordAuditAndOutbox(transactionContext, {
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
    if (!prescription) throw new Error("Prescription not found");
    return { resourceType: "Prescription", organizationId: prescription.organization.id, locationId: prescription.location.id, payload: prescription };
  }
  const order = await context.sudo().query.Order.findOne({
    where: { id: resourceId },
    query: "id orderNumber totalAmount currencyCode organization { id } location { id } patient { patientNumber } lineItems { title ndc11Snapshot quantity unitPriceAmount }"
  });
  if (!order) throw new Error("Order not found");
  return { resourceType: "Order", organizationId: order.organization.id, locationId: order.location.id, payload: order };
}
async function submitPharmacyExternalWorkflow(_root, args, context) {
  if (!args.idempotencyKey.trim() || args.idempotencyKey.length > 200) throw new Error("A bounded idempotency key is required");
  const provider = await context.sudo().query.IntegrationProvider.findOne({
    where: { id: args.providerId },
    query: "id providerType status externalValidationComplete configuration credentials submitFunction organization { id }"
  });
  if (!provider || !["erx", "insurance"].includes(provider.providerType) || provider.status !== "active" || !provider.externalValidationComplete) throw new Error("Active validated integration provider not found");
  const required = provider.providerType === "erx" ? "canManagePrescriptions" : "canManagePayments";
  if (!permissions[required]({ session: context.session })) throw new Error(`Permission required: ${required}`);
  const resource = await resourcePayload(context, provider.providerType, args.resourceId);
  if (resource.organizationId !== provider.organization.id) throw new Error("Integration provider and resource tenant do not match");
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
        throw new Error("Integration idempotency key was reused with a different provider, scope, resource, or payload");
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
    await recordAuditAndOutbox(transactionContext, {
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
  if (!workflow?.provider || !workflow.externalReference) throw new Error("Submitted integration workflow not found");
  const required = workflow.provider.providerType === "erx" ? "canManagePrescriptions" : "canManagePayments";
  if (!permissions[required]({ session: context.session })) throw new Error(`Permission required: ${required}`);
  await requireTenantMembership(context, { organizationId: workflow.organization.id, locationId: workflow.location.id });
  const result = await getWorkflowStatus({ provider: workflow.provider, externalReference: workflow.externalReference });
  const status = ["accepted", "rejected", "pending"].includes(result.status) ? result.status : "pending";
  await context.sudo().query.ExternalIntegrationWorkflow.updateOne({ where: { id: workflow.id }, data: { status, responsePayload: result, attempts: workflow.attempts + 1, lastError: null, ...status === "accepted" || status === "rejected" ? { resolvedAt: (/* @__PURE__ */ new Date()).toISOString() } : {} } });
  return { success: true, reused: false, workflowId: workflow.id, status, externalReference: workflow.externalReference };
}
async function ingestPharmacyIntegrationWebhook(_root, args, context) {
  const provider = await context.sudo().query.IntegrationProvider.findOne({ where: { providerKey: args.providerKey }, query: "id providerType status credentials webhookFunction organization { id }" });
  if (!provider || provider.status !== "active") throw new Error("Webhook provider not found");
  const headers = Object.fromEntries(Object.entries(args.headers || {}).map(([key, value]) => [key === "__rawBody" ? key : key.toLowerCase(), String(value ?? "")]));
  await handleWebhook2({ provider, event: args.event, headers });
  const payload = args.event || {};
  if (!payload.eventId || !payload.externalReference || !["accepted", "rejected", "pending"].includes(payload.status)) throw new Error("Webhook envelope is invalid");
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
    throw new Error("Bounded launch intake supports only operator-reviewed paper or phone sources; eRx, transfer conversion, and generic manual intake require their dedicated authority and evidence workflows");
  }
  if (!args.prescriptionNumber?.trim() || !args.items.length) throw new Error("Prescription number and at least one item are required");
  if (args.items.length !== 1) throw new Error("Enter one prescription item per prescription");
  const writtenAt = new Date(args.writtenAt);
  const expiresAt = new Date(args.expiresAt);
  if (Number.isNaN(writtenAt.getTime()) || Number.isNaN(expiresAt.getTime()) || writtenAt.getTime() > Date.now() || expiresAt.getTime() <= writtenAt.getTime()) {
    throw new Error("Prescription written and expiration dates are invalid");
  }
  for (const item of args.items) {
    if (!item.productId || !item.medicationName?.trim() || !item.sig?.trim() || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isInteger(item.refillsAuthorized) || item.refillsAuthorized < 0) {
      throw new Error("Prescription item is invalid");
    }
  }
  const requestFingerprint = (0, import_node_crypto13.createHash)("sha256").update(JSON.stringify({ organizationId: args.organizationId, locationId: args.locationId, patientId: args.patientId, prescriberId: args.prescriberId, prescriptionNumber: args.prescriptionNumber.trim(), source: args.source, externalReference: args.externalReference?.trim() || null, writtenAt: writtenAt.toISOString(), expiresAt: expiresAt.toISOString(), items: args.items, reason: args.reason?.trim(), attested: args.attested })).digest("hex");
  return withDomainTransaction(context, [`prescription-number:${args.prescriptionNumber.trim()}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.Prescription.findOne({ where: { prescriptionNumber: args.prescriptionNumber.trim() }, query: "id status intakeRequestFingerprint organization { id } location { id } approval { id }" });
    if (existing) {
      if (!existing.organization?.id || !existing.location?.id) throw new Error("Prescription replay scope is incomplete; operator reconciliation is required");
      await requireTenantMembership(transactionContext, { organizationId: existing.organization.id, locationId: existing.location.id, pharmacist: true });
      if (!existing.intakeRequestFingerprint || existing.intakeRequestFingerprint !== requestFingerprint) throw new Error("Prescription number is already bound to different or legacy intake evidence; do not replay it");
      return { success: true, reused: true, prescriptionId: existing.id, status: existing.status, approvalId: existing.approval?.id };
    }
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: args.organizationId,
      locationId: args.locationId,
      pharmacist: true
    });
    const organization = await sudo.query.Organization.findOne({ where: { id: args.organizationId }, query: "id prescriptionFillPolicy" });
    parseFillPolicy(organization?.prescriptionFillPolicy);
    if (!organization?.prescriptionFillPolicy?.approvalId) throw new Error("Fill policy requires recorded pharmacist approval before intake");
    const [products, patient, prescriber] = await Promise.all([
      sudo.query.Product.findMany({
        where: { id: { in: [...new Set(args.items.map((item) => item.productId))] } },
        query: "id title organization { id } location { id } drugReference { id }"
      }),
      sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: "id status organizations { id }" }),
      sudo.query.Prescriber.findOne({ where: { id: args.prescriberId }, query: "id npi verificationStatus externalValidationComplete verificationMethod credentialType credentialJurisdiction credentialIdentifier credentialExpiresAt validationReference verifiedBy { id } organization { id }" })
    ]);
    if (!patient || patient.status !== "active" || !patient.organizations?.some((organization2) => organization2.id === args.organizationId)) throw new Error("Active patient is not in the prescription organization");
    if (!prescriber || prescriber.organization?.id !== args.organizationId) throw new Error("Prescriber is not in the prescription organization");
    assertPrescriptionClinicallyEligible({ sourceVerificationStatus: "human_verified", writtenAt, expiresAt, prescriber });
    if (products.length !== new Set(args.items.map((item) => item.productId)).size || products.some((product) => product.organization?.id !== args.organizationId || product.location?.id !== args.locationId || !product.drugReference?.id)) {
      throw new Error("Every prescription item must use an NDC-linked product from this pharmacy");
    }
    const drugReferenceIds = [...new Set(products.map((product) => product.drugReference.id))];
    const drugReviews = await sudo.query.DrugReferenceReview.findMany({ where: { organization: { id: { equals: args.organizationId } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: "active" } }, take: 100, query: "id status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference reviewedAt drugReference { id }" });
    if (drugReviews.length !== drugReferenceIds.length) throw new Error("Every prescription item requires drug reference review evidence");
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
      if (!product) throw new Error("Prescription product disappeared during intake");
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
    await recordAuditAndOutbox(transactionContext, {
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
  if (!/^[A-Z0-9-]{3,40}$/.test(normalized)) throw new Error("Patient number must use 3-40 letters, numbers, or hyphens");
  return normalized;
}
async function createPharmacyPatient(_root, args, context) {
  requirePermission(context, "canManagePatients");
  const patientNumber = safePatientNumber(args.patientNumber);
  const firstName = normalize(args.firstName);
  const lastName = normalize(args.lastName);
  const dateOfBirth = new Date(args.dateOfBirth);
  if (!firstName || !lastName || Number.isNaN(dateOfBirth.getTime()) || dateOfBirth.getTime() >= Date.now()) throw new Error("Patient name and a past date of birth are required");
  if (!["phone", "sms", "email", "portal", "none"].includes(args.preferredContactMethod)) throw new Error("Preferred contact method is invalid");
  if (!args.identityMethod?.trim() || !args.identityReference?.trim()) throw new Error("Operator identity matching method and reference are required");
  const identityKey = `${args.organizationId}:${patientNumber}`;
  const requestFingerprint = digest({ organizationId: args.organizationId, patientNumber, firstName, lastName, dateOfBirth: dateOfBirth.toISOString().slice(0, 10), email: args.email?.trim().toLowerCase() || "", phone: args.phone?.trim() || "", preferredContactMethod: args.preferredContactMethod, address: args.address || null, identityMethod: args.identityMethod.trim(), identityReference: args.identityReference.trim(), reason: args.reason?.trim(), attested: args.attested });
  return withDomainTransaction(context, [`patient-identity:${identityKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: args.organizationId, organizationWide: true });
    const existing = (await sudo.query.PatientProfile.findMany({ where: { identityKey: { equals: identityKey } }, take: 1, query: "id patientNumber requestFingerprint status" }))[0];
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) throw new Error("Patient identity already exists with different matching data");
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
    await recordAuditAndOutbox(transactionContext, { eventKey: `patient.created:${identityKey}`, organizationId: args.organizationId, actorId: userId, patientId: patient.id, eventType: "patient.created", resourceType: "PatientProfile", resourceId: patient.id, metadata: { patientNumber, approvalId: approval.id, identityMethod: args.identityMethod.trim(), softwareIdentityValidationPerformed: false } });
    return { success: true, reused: false, patientId: patient.id, patientNumber: patient.patientNumber, status: patient.status };
  });
}
async function updatePharmacyPatientContact(_root, args, context) {
  requirePermission(context, "canManagePatients");
  if (!args.idempotencyKey?.trim()) throw new Error("Idempotency key is required");
  if (!["phone", "sms", "email", "portal", "none"].includes(args.preferredContactMethod)) throw new Error("Preferred contact method is invalid");
  const requestFingerprint = digest({ patientId: args.patientId, email: args.email?.trim().toLowerCase() || "", phone: args.phone?.trim() || "", preferredContactMethod: args.preferredContactMethod, address: args.address || null, reason: args.reason?.trim(), attested: args.attested });
  return withDomainTransaction(context, [`patient:${args.patientId}`, `patient-contact:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const patient = await sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: "id organizations { id }" });
    if (!patient?.organizations?.length) throw new Error("Patient not found");
    const organizationId = patient.organizations[0].id;
    const { userId } = await requireTenantMembership(transactionContext, { organizationId, organizationWide: true });
    const existingEvent = await sudo.query.AuditEvent.findOne({ where: { eventKey: `patient.contact_updated:${args.idempotencyKey}` }, query: "id resourceId metadata" });
    if (existingEvent) {
      if (existingEvent.resourceId !== patient.id || existingEvent.metadata?.requestFingerprint !== requestFingerprint) throw new Error("Patient contact idempotency key was reused with different input");
      return { success: true, reused: true, patientId: patient.id, status: "active" };
    }
    const approval = await createHumanApproval(transactionContext, { organizationId, actorId: userId, actionType: "patient_record", reason: args.reason, attested: args.attested, evidence: { action: "contact_update", patientId: patient.id, requestFingerprint } });
    await transactionContext.prisma.patientProfile.update({ where: { id: patient.id }, data: { email: args.email?.trim().toLowerCase() || "", phone: args.phone?.trim() || "", preferredContactMethod: args.preferredContactMethod, address: args.address || null } });
    await recordAuditAndOutbox(transactionContext, { eventKey: `patient.contact_updated:${args.idempotencyKey}`, organizationId, actorId: userId, patientId: patient.id, eventType: "patient.contact_updated", resourceType: "PatientProfile", resourceId: patient.id, metadata: { approvalId: approval.id, preferredContactMethod: args.preferredContactMethod, requestFingerprint } });
    return { success: true, reused: false, patientId: patient.id, status: "active" };
  });
}
async function recordPharmacyPatientAllergy(_root, args, context) {
  requirePermission(context, "canManagePatients");
  if (!["unknown", "mild", "moderate", "severe"].includes(args.severity)) throw new Error("Allergy severity is invalid");
  return recordPatientHistoryEntry(transactionInput("allergy", args), context);
}
async function recordPharmacyPatientMedication(_root, args, context) {
  requirePermission(context, "canManagePatients");
  return recordPatientHistoryEntry(transactionInput("medication", args), context);
}
function transactionInput(kind, args) {
  return { kind, args };
}
async function recordPatientHistoryEntry(input, context) {
  const { kind, args } = input;
  if (!args.idempotencyKey?.trim() || !args.source?.trim() || !args.sourceReference?.trim()) throw new Error("Idempotency key and source evidence are required");
  const label = normalize(kind === "allergy" ? args.allergen : args.medicationName);
  if (!label || kind === "allergy" && !normalize(args.reaction)) throw new Error(`${kind === "allergy" ? "Allergen and reaction" : "Medication name"} are required`);
  return withDomainTransaction(context, [`patient:${args.patientId}`, `${kind}:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const patient = await sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: "id organizations { id }" });
    if (!patient?.organizations?.length) throw new Error("Patient not found");
    const organizationId = patient.organizations[0].id;
    const { userId } = await requireTenantMembership(transactionContext, { organizationId, organizationWide: true });
    const requestFingerprint = digest({ organizationId, patientId: patient.id, kind, label, reaction: args.reaction?.trim() || "", directions: args.directions?.trim() || "", severity: args.severity || "", source: args.source.trim(), sourceReference: args.sourceReference.trim(), reason: args.reason?.trim(), attested: args.attested });
    const key = `${kind}:${organizationId}:${args.idempotencyKey.trim()}`;
    const model = kind === "allergy" ? sudo.query.PatientAllergy : sudo.query.PatientMedication;
    const uniqueField = kind === "allergy" ? "allergyKey" : "medicationKey";
    const existing = (await model.findMany({ where: { [uniqueField]: { equals: key } }, take: 1, query: `id requestFingerprint` }))[0];
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) throw new Error(`${kind} idempotency key is already bound to different evidence`);
      return { success: true, reused: true, recordId: existing.id, status: "active" };
    }
    const approval = await createHumanApproval(transactionContext, { organizationId, actorId: userId, actionType: "patient_record", reason: args.reason, attested: args.attested, evidence: { action: `${kind}_recorded`, sourceReference: args.sourceReference.trim() } });
    const common = { [uniqueField]: key, requestFingerprint, source: args.source.trim(), sourceReference: args.sourceReference.trim(), organization: { connect: { id: organizationId } }, patient: { connect: { id: patient.id } }, recordedBy: { connect: { id: userId } }, approval: { connect: { id: approval.id } } };
    const record2 = kind === "allergy" ? await sudo.query.PatientAllergy.createOne({ data: { ...common, allergen: label, reaction: normalize(args.reaction), severity: args.severity }, query: "id status" }) : await sudo.query.PatientMedication.createOne({ data: { ...common, medicationName: label, directions: args.directions?.trim() || void 0 }, query: "id status" });
    await recordAuditAndOutbox(transactionContext, { eventKey: `patient.${kind}_recorded:${args.idempotencyKey}`, organizationId, actorId: userId, patientId: patient.id, eventType: `patient.${kind}_recorded`, resourceType: kind === "allergy" ? "PatientAllergy" : "PatientMedication", resourceId: record2.id, metadata: { approvalId: approval.id, sourceReference: args.sourceReference.trim() } });
    return { success: true, reused: false, recordId: record2.id, status: record2.status };
  });
}

// features/keystone/mutations/patientWorkflows.ts
var import_node_crypto15 = require("node:crypto");
var TRANSFER_CONSENT = {
  policyVersion: "2026-07-18",
  statementKey: "openfront_pharmacy_prescription_transfer_consent_v1"
};
async function patientAccess(context, patientId, organizationId, locationId) {
  const patient = await context.sudo().query.PatientProfile.findOne({ where: { id: patientId }, query: "id status user { id } organizations { id }" });
  const location = await context.sudo().query.PharmacyLocation.findOne({ where: { id: locationId }, query: "id status organization { id status }" });
  if (!location || location.status !== "active" || location.organization?.id !== organizationId || location.organization.status !== "active") throw new Error("An active location is required");
  if (!patient || patient.status !== "active" || !patient.organizations.some((organization) => organization.id === organizationId)) throw new Error("Patient not found in this organization");
  if (patient.user?.id === context.session?.itemId) return { patient, actorId: context.session.itemId };
  if (!permissions.canManagePrescriptions({ session: context.session })) throw new Error("You do not have access to this patient workflow");
  await currentFillPermission(context, "canManagePrescriptions");
  const { userId } = await requireTenantMembership(context, { organizationId, locationId });
  return { patient, actorId: userId };
}
async function linkPharmacyPatientAccount(_root, args, context) {
  if (!permissions.canManagePatients({ session: context.session })) throw new Error("Permission required: canManagePatients");
  return withDomainTransaction(context, [`patient:${args.patientId}`, `user:${args.userId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const [patient, user] = await Promise.all([
      sudo.query.PatientProfile.findOne({ where: { id: args.patientId }, query: "id user { id } organizations { id }" }),
      sudo.query.User.findOne({ where: { id: args.userId }, query: 'id patientProfile { id } memberships(where: { status: { equals: "active" } }) { organization { id } }' })
    ]);
    if (!patient?.organizations?.length || !user) throw new Error("Patient or user not found");
    const organizationId = patient.organizations[0].id;
    const { userId: actorId } = await requireTenantMembership(transactionContext, { organizationId });
    if (!user.memberships?.some((membership) => membership.organization?.id === organizationId)) throw new Error("User is not available in the patient organization");
    if (patient.user?.id === user.id && user.patientProfile?.id === patient.id) return { success: true, reused: true, patientId: patient.id, userId: user.id };
    if (patient.user?.id || user.patientProfile?.id) throw new Error("Patient or user is already linked to another account");
    await sudo.query.PatientProfile.updateOne({ where: { id: patient.id }, data: { user: { connect: { id: user.id } } } });
    await recordAuditAndOutbox(transactionContext, {
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
  if (!context.session?.itemId) throw new Error("Authentication required");
  if (!args.idempotencyKey?.trim()) throw new Error("Idempotency key is required");
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
    if (!prescription || prescription.patient.id !== args.patientId || prescription.location.id !== args.locationId) throw new Error("Prescription not found");
    const { actorId } = await patientAccess(transactionContext, args.patientId, prescription.organization.id, prescription.location.id);
    const item = prescription.items.find((entry) => entry.id === args.prescriptionItemId);
    if (!item) throw new Error("Prescription item does not belong to this prescription");
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
        throw new Error("Refill idempotency key is already bound to another request");
      }
      if (item.fillLineage === FILL_LINEAGE) {
        const current2 = await loadFillPrescription(transactionContext, prescription.id);
        const fill = await fillStore(transactionContext).PrescriptionFill.findOne({ where: { reservationKey: `refill:${args.idempotencyKey}` }, query: FILL_QUERY });
        if (!fill) throw new Error("Refill lineage is missing");
        assertFillBinding(fill, current2, current2.items.find((entry) => entry.id === item.id));
      }
      return { success: true, reused: true, refillRequestId: existing.id, status: existing.status };
    }
    if (item.fillLineage !== FILL_LINEAGE) throw new Error("Legacy refill authority requires explicit reconciliation; no historical counter conversion is inferred");
    if (!["dispensed", "fill_closed"].includes(prescription.status)) throw new Error("Current authorized fill must be completely dispensed before requesting a refill");
    if (item.refillsRemaining - item.refillsReserved < 1) throw new Error("No unreserved refills remain for this prescription item");
    const openRequestKey = `refill:${item.id}`;
    const openRequest = await sudo.query.RefillRequest.findOne({ where: { openRequestKey }, query: "id status" });
    if (openRequest) throw new Error("An open refill request already owns this entitlement; recover that request");
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
    await recordAuditAndOutbox(transactionContext, {
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
  if (!permissions.canReviewPrescriptions({ session: context.session })) throw new Error("Permission required: canReviewPrescriptions");
  if (!["approved", "rejected"].includes(args.decision)) throw new Error("Refill decision must be approved or rejected");
  await currentFillPermission(context, "canReviewPrescriptions");
  const identity = await context.sudo().query.RefillRequest.findOne({ where: { id: args.refillRequestId }, query: "id prescription { id }" });
  if (!identity?.prescription?.id) throw new Error("Refill request not found");
  return withDomainTransaction(context, [`refill:${args.refillRequestId}`, `prescription:${identity.prescription.id}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const refill = await sudo.query.RefillRequest.findOne({
      where: { id: args.refillRequestId },
      query: "id status patient { id } location { id } prescriptionItem { id fillLineage refillsRemaining refillsReserved } prescription { id status organization { id } location { id } } approval { id reason }"
    });
    if (!refill?.prescriptionItem || !refill.prescription) throw new Error("Refill request not found");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: refill.prescription.organization.id,
      locationId: refill.prescription.location.id,
      pharmacist: true
    });
    if (refill.prescription.id !== identity.prescription.id || refill.patient.id !== (await loadFillPrescription(transactionContext, identity.prescription.id)).patient.id || refill.location?.id !== refill.prescription.location.id) throw new Error("Refill scope changed");
    await currentFillPermission(transactionContext, "canReviewPrescriptions");
    if (refill.prescriptionItem.fillLineage === FILL_LINEAGE) {
      const q = fillStore(transactionContext), p = await loadFillPrescription(transactionContext, refill.prescription.id);
      const fill = (await q.PrescriptionFill.findMany({ where: { refillRequest: { id: { equals: refill.id } } }, take: 2, query: FILL_QUERY }))[0];
      const item = p.items.find((i) => i.id === refill.prescriptionItem.id);
      if (!fill || !item) throw new Error("Refill fill lineage is missing");
      assertFillBinding(fill, p, item, args.decision === "approved");
      await assertItemFillLedger(transactionContext, p, item);
      const fingerprint2 = fillHash({ ...args, actorId: userId }), eventKey = `fill.resolve:${refill.id}`;
      const prior = await q.PrescriptionFillEvent.findOne({ where: { eventKey }, query: "commandFingerprint result" });
      if (prior) {
        if (prior.commandFingerprint !== fingerprint2) throw new Error("Refill decision replay differs from the original intent");
        return { ...prior.result, reused: true };
      }
      if (refill.status !== "requested" || fill.status !== "requested" || fill.version !== args.expectedFillVersion) throw new Error("Refill state/version changed; refresh the workbench");
      if (item.refillsReserved < 1 || item.refillsRemaining < 1) throw new Error("Refill reservation evidence is missing");
      if (args.decision === "approved" && new Date(fill.expiresAt).getTime() <= Date.now()) throw new Error("Refill reservation expired; record an authorized release");
      const approval2 = await createHumanApproval(transactionContext, {
        organizationId: p.organization.id,
        locationId: p.location.id,
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
      if (approved) await sudo.query.Prescription.updateOne({ where: { id: p.id }, data: { status: "approved", approval: { connect: { id: approval2.id } } } });
      const result = { success: true, reused: false, refillRequestId: refill.id, status: args.decision, approvalId: approval2.id };
      await appendFillEvent(transactionContext, updated, { eventKey, fingerprint: fingerprint2, action: args.decision, actorId: userId, approvalId: approval2.id, result, evidence: { refillRequestId: refill.id, refillsRemaining: item.refillsRemaining, refillsReserved: item.refillsReserved - (approved ? 0 : 1) } });
      return result;
    }
    if (["approved", "rejected"].includes(refill.status)) {
      if (refill.status !== args.decision || refill.approval?.reason !== args.reason) throw new Error("Refill resolution replay does not match the recorded decision and reason");
      return { success: true, reused: true, refillRequestId: refill.id, status: refill.status, approvalId: refill.approval?.id };
    }
    if (args.decision === "approved") throw new Error("Legacy refill approval requires explicit lineage reconciliation");
    if (refill.prescriptionItem.refillsReserved < 1) throw new Error("Refill reservation evidence is missing");
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
    await recordAuditAndOutbox(transactionContext, {
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
  if (!context.session?.itemId) throw new Error("Authentication required");
  if (!args.idempotencyKey?.trim()) throw new Error("Idempotency key is required");
  if (!args.consentAccepted || args.policyVersion !== TRANSFER_CONSENT.policyVersion || args.statementKey !== TRANSFER_CONSENT.statementKey) {
    throw new Error("Current prescription transfer consent is required");
  }
  if (!["inbound", "outbound"].includes(args.direction)) throw new Error("Invalid transfer direction");
  const requestFingerprint = (0, import_node_crypto15.createHash)("sha256").update(JSON.stringify({ prescriptionId: args.prescriptionId, patientId: args.patientId, direction: args.direction, counterpartyName: args.counterpartyName?.trim(), counterpartyPhone: args.counterpartyPhone?.trim() || null, consentAccepted: args.consentAccepted, policyVersion: args.policyVersion, statementKey: args.statementKey })).digest("hex");
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`, `transfer-idempotency:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.PrescriptionTransfer.findOne({ where: { idempotencyKey: args.idempotencyKey }, query: "id status patient { id } prescription { id organization { id } location { id } patient { id } } consent { evidence }" });
    if (existing) {
      if (existing.prescription?.id !== args.prescriptionId || existing.patient?.id !== args.patientId || existing.prescription.patient?.id !== args.patientId || !existing.prescription.organization?.id || !existing.prescription.location?.id) throw new Error("Transfer replay scope is incomplete or does not match");
      await patientAccess(transactionContext, existing.patient.id, existing.prescription.organization.id, existing.prescription.location.id);
      if (existing.consent?.evidence?.requestFingerprint !== requestFingerprint) throw new Error("Transfer idempotency key was reused with different input");
      return { success: true, reused: true, transferId: existing.id, status: existing.status };
    }
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: "id organization { id } location { id } patient { id }"
    });
    if (!prescription || prescription.patient.id !== args.patientId) throw new Error("Prescription not found");
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
    await recordAuditAndOutbox(transactionContext, {
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
  if (!permissions.canReviewPrescriptions({ session: context.session })) throw new Error("Permission required: canReviewPrescriptions");
  return withDomainTransaction(context, [`transfer:${args.transferId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const transfer = await sudo.query.PrescriptionTransfer.findOne({
      where: { id: args.transferId },
      query: "id status patient { id } consent { id accepted } approval { id reason actionType } prescription { id organization { id } location { id } }"
    });
    if (!transfer) throw new Error("Transfer is not ready for authorized review");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: transfer.prescription.organization.id,
      locationId: transfer.prescription.location.id,
      pharmacist: true
    });
    if (transfer.status === "accepted" && transfer.approval?.id && (transfer.approval.actionType !== "transfer" || transfer.approval.reason !== args.reason)) throw new Error("Transfer approval replay does not match the recorded reason");
    if (transfer.status === "accepted" && transfer.approval?.id) {
      return { success: true, reused: true, transferId: transfer.id, status: transfer.status, approvalId: transfer.approval.id };
    }
    if (transfer.status !== "consent_recorded" || !transfer.consent?.accepted) throw new Error("Transfer is not ready for authorized review");
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
    await recordAuditAndOutbox(transactionContext, {
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

// features/keystone/mutations/operationalQueries.ts
function decodeStableCursor(cursor, expectedScope) {
  if (!cursor) return null;
  if (cursor.length > 2048) throw new Error("Worklist cursor is invalid");
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof value?.createdAt !== "string" || Number.isNaN(new Date(value.createdAt).getTime()) || typeof value?.id !== "string" || !value.id || value.id.length > 256) throw new Error();
    if (expectedScope !== void 0 && value.scope !== expectedScope) throw new Error();
    return { createdAt: new Date(value.createdAt).toISOString(), id: value.id };
  } catch {
    throw new Error("Worklist cursor is invalid");
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
  if (!Number.isInteger(value) || value < 1) throw new Error("Worklist page size must be a positive integer");
  return Math.min(value, 100);
}
function requireAny(context, allowed) {
  if (!context.session?.itemId) throw new Error("Authentication required");
  if (!allowed.some((permission2) => permissions[permission2]({ session: context.session }))) {
    throw new Error("You do not have permission to read this pharmacy projection");
  }
}
function requirePatientPrivateData(context) {
  if (!permissions.canViewPatientPrivateData({ session: context.session })) {
    throw new Error("Patient private-data permission is required for this projection");
  }
}
var fulfillmentTransitions = {
  pending: ["preparing"],
  preparing: ["ready"],
  ready: ["handed_off"]
};
function prescriptionActions(status) {
  if (["pending_review", "needs_information"].includes(status)) return ["clinical_safety_review", "review"];
  if (status === "approved") return ["clinical_safety_review", "authorize_dispensing"];
  if (["ready_to_dispense", "partially_dispensed"].includes(status)) return ["record_dispensing"];
  return [];
}
async function tenantScope(context) {
  if (!context.session?.itemId) throw new Error("Authentication required");
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
  if (!scope.organizationIds.length) throw new Error("Current organization-recorded pharmacist credential review evidence is required for intake");
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
  const [memberships, prescribers, products, organizations] = await Promise.all([
    sudo.query.OrganizationMembership.findMany({
      where: { organization: { id: { in: scope.organizationIds } }, status: { equals: "active" }, membershipRole: { in: ["owner", "pharmacist"] } },
      orderBy: { createdAt: "asc" },
      take: 100,
      query: "id membershipRole credentialExpiresAt user { name } organization { id name } location { name }"
    }),
    sudo.query.Prescriber.findMany({ where: { organization: { id: { in: scope.organizationIds } } }, orderBy: { name: "asc" }, take: 200, query: "id name npi credentialExpiresAt organization { id }" }),
    sudo.query.Product.findMany({ where: { organization: { id: { in: scope.organizationIds } } }, orderBy: { title: "asc" }, take: 300, query: "id title sku organization { id } drugReference { id ndc11 proprietaryName reviews { id status organization { id } reviewedAt } }" }),
    sudo.query.Organization.findMany({ where: { id: { in: scope.organizationIds } }, orderBy: { name: "asc" }, take: 100, query: "id name cashSalesEnabled cashTaxRateBps cashTaxPolicyReference" })
  ]);
  const drugReferences = /* @__PURE__ */ new Map();
  for (const product of products) {
    if (!product.drugReference?.id || drugReferences.has(`${product.organization?.id}:${product.drugReference.id}`)) continue;
    const currentReview = product.drugReference.reviews?.find((review) => review.organization?.id === product.organization?.id && review.status === "active");
    drugReferences.set(`${product.organization?.id}:${product.drugReference.id}`, { id: product.drugReference.id, label: product.drugReference.proprietaryName || product.title, scopeId: product.organization?.id, detail: `${product.drugReference.ndc11 || "NDC missing"} \xB7 ${currentReview ? `reviewed ${new Date(currentReview.reviewedAt).toISOString().slice(0, 10)}` : "review required"}` });
  }
  return {
    organizationWideOrganizationIds: scope.organizationWideIds,
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
    throw new Error("You do not have access to this location");
  }
  const status = filters.status ?? null;
  if (status !== null && (typeof status !== "string" || !receiptProductStatuses.has(status))) {
    throw new Error("Product selector status filter is invalid");
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
      query: "id title sku createdAt"
    })
  ]);
  const hasMore = products.length > pageSize;
  const pageProducts = products.slice(0, pageSize);
  return {
    items: pageProducts.map((product) => ({ id: product.id, label: product.title, scopeId: args.locationId, detail: product.sku })),
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
  const baseWhere = {
    organization: { id: { in: pharmacistScope.organizationIds } },
    location: { id: { in: pharmacistScope.locationIds } },
    OR: [
      { status: { in: ["draft", "pending_review", "needs_information", "approved", "ready_to_dispense", "partially_dispensed"] } },
      { refillRequests: { some: { status: { in: ["requested", "under_review", "prescriber_contacted"] } } } },
      { transfers: { some: { status: { in: ["requested", "consent_recorded", "under_review"] } } } }
    ]
  };
  const [totalCount, records] = await Promise.all([
    context.sudo().query.Prescription.count({ where: baseWhere }),
    context.sudo().query.Prescription.findMany({
      where: stableCursorWhere(baseWhere, cursor),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: pageSize + 1,
      query: 'id prescriptionNumber status source sourceVerificationStatus createdAt writtenAt patient { displayName } prescriber { name verificationStatus } location { name } items(take: 1) { medicationNameSnapshot quantityPrescribed refillsRemaining } refillRequests(where: { status: { in: ["requested", "under_review", "prescriber_contacted"] } }, take: 50) { id } transfers(where: { status: { in: ["requested", "consent_recorded", "under_review"] } }, take: 50) { id }'
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
    openTransferCount: record2.transfers?.length || 0
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
      organization { id operatorDisplayName supportPhone cashSalesEnabled cashTaxRateBps cashTaxPolicyReference } location { id name }
      patient { id displayName identityVerificationStatus identityReference identityVerifiedAt allergies(where: { status: { equals: "active" } }) { id allergen reaction severity updatedAt } medications(where: { status: { equals: "current" } }) { id medicationName directions updatedAt } } prescriber { id name verificationStatus }
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
      dispensingLabels(orderBy: { dispensedAt: desc }, take: 10) { id labelNumber fillNumber operatorNameSnapshot operatorPhoneSnapshot locationNameSnapshot locationAddressSnapshot patientNameSnapshot prescriberNameSnapshot medicationNameSnapshot sigSnapshot quantityDispensed lotNumberSnapshot ndc11Snapshot expirationDateSnapshot auxiliaryWarnings counselingOutcome dispensedAt }
      refillRequests(orderBy: { requestedAt: desc }, take: 50) { id status requestNote resolutionNote requestedAt resolvedAt prescriptionItem { id medicationNameSnapshot } }
      transfers(orderBy: { requestedAt: desc }, take: 50) { id direction status counterpartyName counterpartyPhone requestedAt completedAt consent { id accepted } }
    `
  });
  if (!prescription || !scope.organizationIds.includes(prescription.organization?.id) || !scope.locationIds.includes(prescription.location?.id) || !pharmacistScope.locationIds.includes(prescription.location?.id)) {
    throw new Error("Prescription not found");
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
    dispensingLabels: (prescription.dispensingLabels || []).map((label) => ({ id: label.id, labelNumber: label.labelNumber, fillNumber: label.fillNumber, operatorName: label.operatorNameSnapshot, operatorPhone: label.operatorPhoneSnapshot, locationName: label.locationNameSnapshot, locationAddress: label.locationAddressSnapshot, patientName: label.patientNameSnapshot, prescriberName: label.prescriberNameSnapshot, medicationName: label.medicationNameSnapshot, sig: label.sigSnapshot, quantityDispensed: label.quantityDispensed, lotNumber: label.lotNumberSnapshot, ndc11: label.ndc11Snapshot, expirationDate: label.expirationDateSnapshot, auxiliaryWarnings: Array.isArray(label.auxiliaryWarnings) ? label.auxiliaryWarnings : [], counselingOutcome: label.counselingOutcome, dispensedAt: label.dispensedAt })),
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
      throw new Error("You do not have access to this location");
    }
    scopedLocationIds = [filters.locationId];
  }
  const status = filters.status ?? null;
  if (status !== null && (typeof status !== "string" || !inventoryLotQueueStatuses.has(status))) {
    throw new Error("Inventory status filter is invalid");
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
      temperatureExcursions(orderBy: { startedAt: desc }) { id status observedMinimumC observedMaximumC startedAt endedAt }
      movements(orderBy: { occurredAt: desc }, take: 50) { id movementType quantityDelta reason occurredAt actor { name } }
    `
  });
  if (!lot || !scope.locationIds.includes(lot.location?.id)) throw new Error("Inventory lot not found");
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
      endedAt: excursion.endedAt
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
  if (!recall) throw new Error("Recall not found");
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
    throw new Error("Order status filter is invalid");
  }
  if (fulfillmentMethod !== null && (typeof fulfillmentMethod !== "string" || !orderFulfillmentMethods.has(fulfillmentMethod))) {
    throw new Error("Order fulfillment filter is invalid");
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
      organization { id } location { id name }
      lineItems { id title sku ndc11Snapshot quantity unitPriceAmount lineTotalAmount prescriptionRequirementSnapshot }
      fulfillment { id method status readyAt handedOffAt assignedTo { name } }
      payments { id status amount currencyCode tenderMethod cashReceivedAmount changeDueAmount processedAt provider { name code } }
    `
  });
  if (!order || !scope.organizationIds.includes(order.organization?.id) || !scope.locationIds.includes(order.location?.id)) throw new Error("Order not found");
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
    createdAt: order.createdAt,
    pickupAt: order.pickupAt,
    deliveryWindow: order.deliveryWindow,
    locationId: order.location.id,
    locationName: order.location.name,
    availableFulfillmentStatuses: fulfillmentTransitions[order.fulfillment?.status || ""] || [],
    lines: (order.lineItems || []).map((line) => ({
      id: line.id,
      title: line.title,
      sku: line.sku,
      ndc11: line.ndc11Snapshot,
      quantity: line.quantity,
      unitPriceAmount: line.unitPriceAmount,
      lineTotalAmount: line.lineTotalAmount,
      prescriptionRequirement: line.prescriptionRequirementSnapshot
    })),
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
  const patient = await context.sudo().query.PatientProfile.findOne({ where: { id: args.patientId }, query: "id user { id email name } organizations { id }" });
  if (!patient || !patient.organizations?.some((organization) => scope.organizationIds.includes(organization.id))) throw new Error("Patient not found");
  const patientOrganizationIds = patient.organizations.map((organization) => organization.id).filter((id) => scope.organizationIds.includes(id));
  const users = await context.sudo().query.User.findMany({
    where: {
      OR: [
        ...patient.user?.id ? [{ id: { equals: patient.user.id } }] : [],
        { memberships: { some: { status: { equals: "active" }, organization: { id: { in: patientOrganizationIds } } } } }
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
  if (!context.session?.itemId) throw new Error("Authentication required");
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
  if (!patient) throw new Error("No patient profile is linked to this account");
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
  if (!patient || !patient.organizations?.some((organization) => scope.organizationIds.includes(organization.id))) throw new Error("Patient not found");
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
async function pharmacyOutboxTimeline(_root, args, context) {
  requireAny(context, ["canManageIntegrations", "canViewAuditLogs"]);
  const scope = await tenantScope(context);
  const records = await context.sudo().query.OutboxEvent.findMany({
    where: tenantEventFilter(scope),
    orderBy: { occurredAt: "desc" },
    take: Math.max(1, Math.min(100, args.take || 50)),
    query: "id eventKey eventType aggregateType aggregateId status attempts replayCount occurredAt processedAt lastError"
  });
  return records.map((record2) => ({
    id: record2.id,
    eventKey: record2.eventKey,
    eventType: record2.eventType,
    aggregateType: record2.aggregateType,
    aggregateId: record2.aggregateId,
    status: record2.status,
    attempts: record2.attempts,
    replayCount: record2.replayCount,
    occurredAt: record2.occurredAt,
    processedAt: record2.processedAt,
    hasError: Boolean(record2.lastError)
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
  if (!scope.locationIds.includes(args.locationId)) throw new Error("Location not found");
  const records = await context.sudo().query.Product.findMany({
    where: {
      location: { id: { equals: args.locationId } },
      status: { equals: "published" },
      posAvailable: { equals: true },
      prescriptionRequirement: { equals: "none" }
    },
    orderBy: { title: "asc" },
    take: 100,
    query: "id title handle sku description category priceAmount currencyCode taxable imageUrl prescriptionRequirement inventoryLots { status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } location { id } }"
  });
  return records.map((record2) => {
    const availableQuantity = (record2.inventoryLots || []).filter((lot) => lot.location?.id === args.locationId).reduce((sum, lot) => sum + eligibleLotQuantity(lot), 0);
    return { ...record2, inventoryLots: void 0, availableQuantity, inStock: availableQuantity > 0 };
  }).filter((record2) => record2.inStock);
}
var pharmacyOutboxQueue = pharmacyOutboxTimeline;

// features/keystone/mutations/outboxWorkflows.ts
async function replayPharmacyOutboxEvent(_root, args, context) {
  requirePermission(context, "canManageIntegrations");
  return withDomainTransaction(context, [`outbox:${args.eventId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const event = await sudo.query.OutboxEvent.findOne({
      where: { id: args.eventId },
      query: "id eventKey status replayCount organization { id } location { id }"
    });
    if (!event) throw new Error("Outbox event not found");
    await requireTenantMembership(transactionContext, {
      organizationId: event.organization.id,
      locationId: event.location?.id
    });
    if (event.status === "pending") return { id: event.id, status: event.status, replayCount: event.replayCount, reused: true };
    if (!["failed", "dead_letter"].includes(event.status)) throw new Error("Only failed or dead-letter outbox events can be replayed");
    const updated = await sudo.db.OutboxEvent.updateOne({
      where: { id: event.id },
      data: {
        status: "pending",
        attempts: 0,
        replayCount: event.replayCount + 1,
        lastError: null,
        processedAt: null,
        nextAttemptAt: null,
        lockToken: null,
        lockedAt: null
      }
    });
    return { id: updated.id, status: "pending", replayCount: event.replayCount + 1, reused: false };
  });
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
      throw new Error("Provider webhook amount or currency mismatch");
    }
    return;
  }
  if (providerCode.includes("paypal")) {
    const evidence = resource.amount;
    const divisor = NO_DIVISION_CURRENCIES2.has(expectedCurrency) ? 1 : 100;
    if (!evidence || Number(evidence.value) !== payment.amount / divisor || String(evidence.currency_code).toUpperCase() !== expectedCurrency) {
      throw new Error("Provider webhook amount or currency mismatch");
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
  if (!provider?.isInstalled) throw new Error("Payment provider not found");
  const verified = await handleWebhook({ provider, event, headers: normalizedHeaders(headers) });
  const type = String(verified?.type || "");
  const resource = verified?.resource || {};
  const providerEventId = String(verified?.event?.id || event?.id || resource.id || "");
  if (!verified?.isValid || !type || !providerEventId) throw new Error("Webhook signature or event envelope is invalid");
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
        query: "id amount currencyCode payment { id }"
      });
      if (succeeded) {
        for (const session of sessions) {
          assertProviderAmount(provider.code, resource, { amount: session.amount, currencyCode: session.currencyCode });
          await sudo.query.PaymentSession.updateOne({
            where: { id: session.id },
            data: {
              status: session.payment ? "captured" : "settled_unordered",
              reconciliationStatus: session.payment ? "ordered" : "settled_unordered",
              lastReconciledAt: (/* @__PURE__ */ new Date()).toISOString(),
              failureReason: null
            }
          });
        }
        handled = sessions.length > 0;
      } else if (failed) {
        for (const session of sessions) {
          await sudo.query.PaymentSession.updateOne({ where: { id: session.id }, data: { status: "failed", reconciliationStatus: "manual_review", lastReconciledAt: (/* @__PURE__ */ new Date()).toISOString() } });
        }
        handled = sessions.length > 0;
      } else if (refunded) {
        const payments = await sudo.query.Payment.findMany({ where: { externalPaymentId: { equals: paymentId }, provider: { id: { equals: provider.id } } }, query: "id status" });
        if (resource?.status === "succeeded" || resource?.status === "COMPLETED") {
          for (const payment of payments) await sudo.query.Payment.updateOne({ where: { id: payment.id }, data: { status: "refunded" } });
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
  if (!permissions.canManagePayments({ session: context.session })) throw new Error("Permission required: canManagePayments");
  const session = await context.sudo().query.PaymentSession.findOne({
    where: { id: args.paymentSessionId },
    query: `id status reconciliationStatus reconciliationAttempts externalPaymentId amount currencyCode data cart { id status organization { id } location { id } order { id } } provider { ${PAYMENT_PROVIDER_ADAPTER_FIELDS} }`
  });
  if (!session?.cart || !session.provider || !session.externalPaymentId) throw new Error("Payment session not found");
  const { userId } = await requireTenantMembership(context, { organizationId: session.cart.organization.id, locationId: session.cart.location.id });
  if (session.cart.order?.id) {
    return withDomainTransaction(context, [`payment-session:${session.id}`], async (transactionContext) => {
      await transactionContext.sudo().query.PaymentSession.updateOne({ where: { id: session.id }, data: { status: "captured", reconciliationStatus: "ordered", lastReconciledAt: (/* @__PURE__ */ new Date()).toISOString(), failureReason: null } });
      return { success: true, status: "ordered", paymentSessionId: session.id };
    });
  }
  if (session.reconciliationStatus === "compensation_pending") {
    const compensation = await refundPayment({ provider: session.provider, paymentId: session.externalPaymentId, amount: session.amount, currency: session.currencyCode, idempotencyKey: `checkout-compensation:${session.id}` });
    if (!["refunded", "succeeded"].includes(compensation?.status)) throw new Error("Payment compensation is still pending");
    return withDomainTransaction(context, [`payment-session:${session.id}`], async (transactionContext) => {
      await transactionContext.sudo().query.PaymentSession.updateOne({ where: { id: session.id }, data: { status: "compensated", reconciliationStatus: "compensated", reconciliationAttempts: session.reconciliationAttempts + 1, lastReconciledAt: (/* @__PURE__ */ new Date()).toISOString(), failureReason: null, data: { ...session.data || {}, compensation } } });
      await recordAuditAndOutbox(transactionContext, {
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
  patient { id displayName identityVerificationStatus identityReference identityVerifiedAt identityVerifiedBy { id } allergies(where: { status: { equals: "active" } }) { id updatedAt } medications(where: { status: { equals: "current" } }) { id updatedAt } }
  safetyReviews(orderBy: { reviewedAt: desc }, take: 1) {
    id fillNumber outcome allergiesReviewed medicationHistoryReviewed interactionsReviewed duplicateTherapyReviewed contraindicationsReviewed doseReviewed counselingPlanReviewed reviewReference overrideReason reviewedAt evidenceSnapshot
  }
`;
async function assertPrescriptionSafetyEvidence(context, prescription, fillSpecific = false) {
  if (prescription.patient?.identityVerificationStatus !== "confirmed" || !prescription.patient?.identityReference?.trim() || !prescription.patient?.identityVerifiedAt || !prescription.patient?.identityVerifiedBy?.id) {
    throw new Error("Current operator-recorded patient identity evidence is required");
  }
  if (!prescription.patient.allergies?.length || !prescription.patient.medications?.length) throw new Error("Explicit allergy and medication history evidence is required for this fill");
  const fillNumbers = prescription.items.map((item) => currentFillNumber(item));
  const fillNumber = Math.max(...fillNumbers);
  if (!fillNumbers.length || fillNumbers.some((value) => value !== fillNumber)) throw new Error("Prescription items are not aligned to one fill review");
  const latestPatientChange = [...prescription.patient?.allergies || [], ...prescription.patient?.medications || [], { updatedAt: prescription.patient.identityVerifiedAt }].map((entry) => entry.updatedAt).filter(Boolean).sort().at(-1);
  const review = prescription.safetyReviews?.[0];
  if (fillSpecific && prescription.items.some((item) => item.fillLineage === FILL_LINEAGE)) {
    const fills = await fillStore(context).PrescriptionFill.findMany({ where: { prescription: { id: { equals: prescription.id } }, openKey: { not: { equals: null } } }, take: 2, query: FILL_QUERY });
    const fill = fills[0], evidence = review?.evidenceSnapshot;
    if (fills.length !== 1 || !fill || evidence?.fillId !== fill.id || evidence.itemVersion !== fill.itemVersion || evidence.authorityVersion !== fill.authorityVersion || new Date(review.reviewedAt).getTime() < new Date(fill.createdAt).getTime()) throw new Error("A versioned human safety review for this exact fill reservation is required");
  }
  assertCurrentHumanSafetyReview(review, fillNumber, latestPatientChange);
  const drugReferenceIds = [...new Set(prescription.items.map((item) => item.drugReference?.id).filter(Boolean))];
  const drugReviews = await context.sudo().query.DrugReferenceReview.findMany({
    where: { organization: { id: { equals: prescription.organization.id } }, drugReference: { id: { in: drugReferenceIds } }, status: { equals: "active" } },
    take: 100,
    query: "id status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference reviewedAt"
  });
  if (!drugReferenceIds.length || drugReviews.length !== drugReferenceIds.length) throw new Error("Current drug reference review evidence is required");
  for (const drugReview of drugReviews) {
    assertDrugReferenceEligibleForBoundedDispensing({ sourceVerified: drugReview.status === "active", marketingStatus: drugReview.marketingStatusSnapshot, controlledSchedule: drugReview.controlledScheduleSnapshot, sourceName: drugReview.sourceName, sourceVersion: drugReview.sourceVersion, sourceReference: drugReview.sourceReference, reviewedAt: drugReview.reviewedAt });
    if (new Date(drugReview.reviewedAt).getTime() > new Date(review.reviewedAt).getTime()) throw new Error("Drug reference evidence changed after the clinical safety review");
  }
  return review;
}
async function recordPrescriptionReview(_root, args, context) {
  requirePermission(context, "canReviewPrescriptions");
  if (!["approved", "needs_information", "rejected"].includes(args.decision)) throw new Error("Invalid review decision");
  return withDomainTransaction(context, [`prescription:${args.prescriptionId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const prescription = await sudo.query.Prescription.findOne({
      where: { id: args.prescriptionId },
      query: `id status ${CLINICAL_QUERY} ${SAFETY_QUERY} organization { id } location { id } items { id fillLineage activeFillNumber refillsAuthorized refillsRemaining drugReference { id } } reviews(orderBy: { reviewedAt: desc }, take: 1) { id decision reason approval { id reason } }`
    });
    if (!prescription) throw new Error("Prescription not found");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      pharmacist: true
    });
    const prior = prescription.reviews?.[0];
    if (prescription.status === args.decision && prior?.decision === args.decision && (prior.reason !== args.reason || prior.approval?.reason !== args.reason)) throw new Error("Prescription review replay does not match the recorded reason");
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
    await recordAuditAndOutbox(transactionContext, {
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
    if (!prescription) throw new Error("Prescription not found");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      pharmacist: true
    });
    if (prescription.items.some((item) => item.fillLineage === FILL_LINEAGE)) {
      await currentFillPermission(transactionContext, "canDispenseMedications");
      const current = await loadFillPrescription(transactionContext, prescription.id);
      const fills = await fillStore(transactionContext).PrescriptionFill.findMany({ where: { prescription: { id: { equals: prescription.id } }, openKey: { not: { equals: null } } }, take: 2, query: FILL_QUERY });
      if (fills.length !== 1 || current.items.length !== 1) throw new Error("Exactly one current item/fill is required");
      const fill = fills[0];
      const item = current.items.find((entry) => entry.id === fill?.prescriptionItem?.id);
      if (!fill || !item || !["approved", "partially_dispensed"].includes(fill.status) || new Date(fill.expiresAt).getTime() <= Date.now()) throw new Error("An approved current fill reservation is required");
      assertFillBinding(fill, current, item);
      await assertItemFillLedger(transactionContext, current, item);
      await assertPrescriptionSafetyEvidence(transactionContext, prescription, true);
    }
    if (prescription.status === "ready_to_dispense" && prescription.approval?.id && (prescription.approval.actionType !== "dispense" || prescription.approval.reason !== args.reason)) throw new Error("Dispensing authorization replay does not match the recorded reason");
    if (prescription.status === "ready_to_dispense" && prescription.approval?.id) {
      return { success: true, reused: true, prescriptionId: prescription.id, status: prescription.status, approvalId: prescription.approval.id };
    }
    assertPrescriptionClinicallyEligible(prescription);
    const safetyReview = await assertPrescriptionSafetyEvidence(transactionContext, prescription, true);
    if (!prescription.reviews?.some((review) => review.decision === "approved")) throw new Error("Approved pharmacist review required");
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
    await recordAuditAndOutbox(transactionContext, {
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
async function recordPrescriptionDispensing(_root, args, context) {
  requirePermission(context, "canDispenseMedications");
  if (!Number.isInteger(args.quantity) || args.quantity < 1) throw new Error("Dispensed quantity must be a positive integer");
  if (!args.idempotencyKey?.trim()) throw new Error("Idempotency key is required");
  if (!["offered_accepted", "offered_declined"].includes(args.counselingOutcome)) throw new Error("Counseling offer outcome must be recorded");
  const auxiliaryWarnings = [...new Set((args.auxiliaryWarnings || []).map((value) => value.trim()).filter(Boolean))];
  if (!auxiliaryWarnings.length || auxiliaryWarnings.length > 20 || auxiliaryWarnings.some((value) => value.length > 200)) throw new Error("Auxiliary warning evidence is invalid");
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
        items { id fillLineage activeFillNumber refillsReserved medicationNameSnapshot sig quantityPrescribed quantityDispensed refillsAuthorized refillsRemaining product { id title sku priceAmount currencyCode taxable imageUrl prescriptionRequirement drugReference { id ndc11 } } drugReference { id ndc11 } }
        reviews(where: { decision: { equals: "approved" } }, orderBy: { reviewedAt: desc }, take: 1) { id }
      `
    });
    if (!prescription) throw new Error("Prescription not found");
    const { userId } = await requireTenantMembership(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      pharmacist: true
    });
    const item = prescription.items.find((entry) => entry.id === args.prescriptionItemId);
    if (!item) throw new Error("Prescription item does not belong to this prescription");
    let fill = null;
    if (item.fillLineage === FILL_LINEAGE) {
      await currentFillPermission(transactionContext, "canDispenseMedications");
      const current = await loadFillPrescription(transactionContext, prescription.id);
      fill = args.fillId ? await fillStore(transactionContext).PrescriptionFill.findOne({ where: { id: args.fillId }, query: FILL_QUERY }) : null;
      if (!fill || !Number.isSafeInteger(args.expectedFillVersion)) throw new Error("Fill identity and expected version are required");
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
      ...fill ? { fillId: fill.id, expectedFillVersion: args.expectedFillVersion, itemVersion: fill.itemVersion } : {}
    })).digest("hex");
    if (existingMovement) {
      if (!existingMovement.requestFingerprint || existingMovement.requestFingerprint !== requestFingerprint) {
        throw new Error("Dispensing idempotency key is already bound to another operation");
      }
      return { success: true, reused: true, prescriptionId: prescription.id, status: prescription.status, approvalId: existingMovement.approval?.id, orderId: existingMovement.order?.id, orderNumber: existingMovement.order?.orderNumber, receiptItemTitle: existingMovement.order?.lineItems?.[0]?.title, paymentId: existingMovement.order?.payments?.[0]?.id, labelId: existingMovement.order?.dispensingLabels?.[0]?.id, totalAmount: existingMovement.order?.totalAmount, cashReceivedAmount: existingMovement.order?.payments?.[0]?.cashReceivedAmount, changeDueAmount: existingMovement.order?.payments?.[0]?.changeDueAmount, currencyCode: existingMovement.order?.currencyCode };
    }
    assertPrescriptionItemProductIdentity(item);
    assertPrescriptionClinicallyEligible(prescription);
    const safetyReview = await assertPrescriptionSafetyEvidence(transactionContext, prescription, true);
    if (!["ready_to_dispense", "partially_dispensed"].includes(prescription.status) || !prescription.approval || !prescription.reviews?.length) {
      throw new Error("Prescription is not authorized for dispensing");
    }
    const fillPlan = fill ? dispenseFillPlan(fill, args.expectedFillVersion, args.quantity) : null;
    const authorizedFills = 1 + item.refillsAuthorized - item.refillsRemaining;
    const authorizedQuantity = item.quantityPrescribed * authorizedFills;
    const remainingAuthorizedQuantity = fill ? fill.authorizedQuantity - fill.quantityDispensed - fill.quantityReleased : authorizedQuantity - item.quantityDispensed;
    if (args.quantity > remainingAuthorizedQuantity) throw new Error("Dispensed quantity exceeds the remaining authorized quantity");
    if (prescription.items.length !== 1 || !fill && (remainingAuthorizedQuantity !== item.quantityPrescribed || args.quantity !== item.quantityPrescribed)) {
      throw new Error("Dispense one complete prescription item per cash pickup; partial and multi-item dispensing are not supported");
    }
    if (prescription.organization.cashSalesEnabled !== true || !prescription.organization.cashTaxPolicyReference?.trim() || !prescription.organization.cashPolicyReviewedAt) {
      throw new Error("Operator-attested cash and tax policy must be configured before dispensing");
    }
    const currencyCode = fill ? fill.priceSnapshot.currencyCode : item.product.currencyCode;
    const subtotalAmount = fill ? fillPricePortion(fill.priceSnapshot.amount, fill.authorizedQuantity, fill.quantityDispensed, args.quantity) : item.product.priceAmount;
    const taxable = fill ? fill.priceSnapshot.taxable : item.product.taxable !== false;
    const taxableSubtotalAmount = taxable ? subtotalAmount : 0;
    const taxAmount = fill ? fillPricePortion(fill.priceSnapshot.taxAmount, fill.authorizedQuantity, fill.quantityDispensed, args.quantity) : calculateTaxAmount(taxableSubtotalAmount, prescription.organization.cashTaxRateBps || 0);
    const totalAmount = subtotalAmount + taxAmount;
    const tender = assertCashTender(totalAmount, args.cashReceivedAmount);
    const lot = await sudo.query.InventoryLot.findOne({
      where: { id: args.lotId },
      query: "id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete recalls { status } product { id } location { id }"
    });
    if (!lot || lot.location.id !== prescription.location.id || lot.product.id !== item.product?.id) throw new Error("Inventory lot does not match this prescription item and location");
    if (!isLotEligible(lot) || lot.quantityAvailable - lot.quantityQuarantined < args.quantity) throw new Error("Inventory lot is not eligible for dispensing");
    const approval = await createHumanApproval(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      actionType: "dispense",
      reason: args.reason,
      attested: args.attested,
      evidence: { prescriptionItemId: item.id, fillId: fill?.id || null, fillVersion: fill?.version || null, itemVersion: fill?.itemVersion || null, lotId: lot.id, quantity: args.quantity, pharmacistReviewId: prescription.reviews[0].id, clinicalSafetyReviewId: safetyReview.id, idempotencyKey: args.idempotencyKey }
    });
    const cashApproval = await createHumanApproval(transactionContext, {
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      actionType: "cash_tender",
      reason: args.reason,
      attested: args.attested,
      evidence: { subtotalAmount, taxableSubtotalAmount, taxAmount, amountDue: totalAmount, cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount, taxRateBps: prescription.organization.cashTaxRateBps || 0, taxPolicyReference: prescription.organization.cashTaxPolicyReference, providerSettlementClaimed: false }
    });
    const operationSuffix = (0, import_node_crypto17.createHash)("sha256").update(args.idempotencyKey).digest("hex").slice(0, 12).toUpperCase();
    const dispensedAt = (/* @__PURE__ */ new Date()).toISOString();
    const order = await sudo.query.Order.createOne({
      data: {
        orderNumber: `RX-${operationSuffix}`,
        idempotencyKey: `rx-cash:${args.idempotencyKey}`,
        checkoutEvidence: { workflow: "operator_attested_cash_prescription_pickup", pharmacistReviewId: prescription.reviews[0].id, clinicalSafetyReviewId: safetyReview.id, dispenseApprovalId: approval.id, cashApprovalId: cashApproval.id, taxRateBps: prescription.organization.cashTaxRateBps || 0, taxableSubtotalAmount, taxAmount, providerSettlementClaimed: false },
        status: "completed",
        fulfillmentMethod: "pickup",
        subtotalAmount,
        taxAmount,
        deliveryAmount: 0,
        totalAmount,
        currencyCode,
        organization: { connect: { id: prescription.organization.id } },
        location: { connect: { id: prescription.location.id } },
        patient: { connect: { id: prescription.patient.id } },
        prescription: { connect: { id: prescription.id } },
        approval: { connect: { id: cashApproval.id } }
      },
      query: "id orderNumber"
    });
    await sudo.query.OrderLineItem.createOne({
      data: {
        title: fill ? fill.priceSnapshot.title : item.product.title,
        sku: fill ? fill.priceSnapshot.sku : item.product.sku,
        ndc11Snapshot: item.product.drugReference?.ndc11 || void 0,
        quantity: 1,
        unitPriceAmount: subtotalAmount,
        lineTotalAmount: subtotalAmount,
        imageUrl: item.product.imageUrl || void 0,
        prescriptionRequirementSnapshot: item.product.prescriptionRequirement,
        metadata: { dispensedUnits: args.quantity, prescriptionItemId: item.id, fillId: fill?.id || null, fillNumber: safetyReview.fillNumber, taxable: item.product.taxable !== false, taxableAmount: taxableSubtotalAmount },
        lotAllocationSnapshot: [{ lotId: lot.id, lotNumber: lot.lotNumber, quantity: args.quantity, expirationDate: lot.expirationDate }],
        order: { connect: { id: order.id } },
        product: { connect: { id: item.product.id } }
      }
    });
    const payment = await sudo.query.Payment.createOne({
      data: {
        amount: totalAmount,
        currencyCode,
        status: "captured",
        tenderMethod: "cash",
        cashReceivedAmount: tender.cashReceivedAmount,
        changeDueAmount: tender.changeDueAmount,
        processedAt: dispensedAt,
        data: { evidenceType: "operator_attested_cash_received", approvalId: cashApproval.id, providerSettlementClaimed: false },
        organization: { connect: { id: prescription.organization.id } },
        location: { connect: { id: prescription.location.id } },
        order: { connect: { id: order.id } },
        recordedBy: { connect: { id: userId } },
        approval: { connect: { id: cashApproval.id } }
      },
      query: "id status"
    });
    await sudo.query.Fulfillment.createOne({
      data: {
        method: "pickup",
        status: "handed_off",
        readyAt: dispensedAt,
        handedOffAt: dispensedAt,
        organization: { connect: { id: prescription.organization.id } },
        location: { connect: { id: prescription.location.id } },
        order: { connect: { id: order.id } },
        assignedTo: { connect: { id: userId } }
      }
    });
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
        order: { connect: { id: order.id } },
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
        order: { connect: { id: order.id } },
        approval: { connect: { id: approval.id } }
      },
      query: "id"
    });
    if (fill) {
      const result = { success: true, reused: false, prescriptionId: prescription.id, status: fillPlan.status, approvalId: approval.id, orderId: order.id, orderNumber: order.orderNumber, receiptItemTitle: item.product.title, paymentId: payment.id, labelId: label.id, totalAmount, cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount, currencyCode };
      await consumeFillInTransaction(transactionContext, fill, item, args.expectedFillVersion, args.quantity, { key: args.idempotencyKey, fingerprint: requestFingerprint, actorId: userId, approvalId: approval.id, result, movementId: movement.id, safetyReviewId: safetyReview.id });
      if (fillPlan.status === "dispensed" && fill.refillRequest?.id) await sudo.query.RefillRequest.updateOne({ where: { id: fill.refillRequest.id }, data: { status: "fulfilled", openRequestKey: null } });
    }
    const allCurrentFillsComplete = fill ? fillPlan.status === "dispensed" : prescription.items.every((entry) => {
      const nextDispensed = entry.id === item.id ? entry.quantityDispensed + args.quantity : entry.quantityDispensed;
      const entryAuthorizedQuantity = entry.quantityPrescribed * (1 + entry.refillsAuthorized - entry.refillsRemaining);
      return nextDispensed >= entryAuthorizedQuantity;
    });
    const nextStatus = allCurrentFillsComplete ? "dispensed" : "partially_dispensed";
    await sudo.query.Prescription.updateOne({
      where: { id: prescription.id },
      data: { status: nextStatus, ...allCurrentFillsComplete ? { dispensedAt: (/* @__PURE__ */ new Date()).toISOString() } : {}, approval: { connect: { id: approval.id } } }
    });
    await recordAuditAndOutbox(transactionContext, {
      eventKey: `prescription.dispensed:${args.idempotencyKey}`,
      organizationId: prescription.organization.id,
      locationId: prescription.location.id,
      actorId: userId,
      patientId: prescription.patient.id,
      eventType: allCurrentFillsComplete ? "prescription.dispensed" : "prescription.partially_dispensed",
      resourceType: "Prescription",
      resourceId: prescription.id,
      metadata: { prescriptionItemId: item.id, fillId: fill?.id || null, fillVersion: fill ? fill.version + 1 : null, lotId: lot.id, quantity: args.quantity, quantityDispensed: item.quantityDispensed + args.quantity, movementId: movement.id, orderId: order.id, paymentId: payment.id, labelId: label.id, approvalId: approval.id, cashApprovalId: cashApproval.id, clinicalSafetyReviewId: safetyReview.id, subtotalAmount, taxableSubtotalAmount, taxAmount, providerSettlementClaimed: false }
    });
    return { success: true, reused: false, prescriptionId: prescription.id, status: nextStatus, approvalId: approval.id, orderId: order.id, orderNumber: order.orderNumber, receiptItemTitle: item.product.title, paymentId: payment.id, labelId: label.id, totalAmount, cashReceivedAmount: tender.cashReceivedAmount, changeDueAmount: tender.changeDueAmount, currencyCode };
  });
}

// features/keystone/mutations/recallWorkflows.ts
var import_node_crypto18 = require("node:crypto");
async function reconcileRecallExposures(context, recallId) {
  return withDomainTransaction(context, [`recall-exposures:${recallId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const recall = await sudo.query.Recall.findOne({ where: { id: recallId }, query: "id status recallNumber classification sourceValidationReference organization { id } location { id } lots { id } approval { id }" });
    if (!recall?.organization?.id) throw new Error("Recall exposure reconciliation scope is incomplete");
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
      await recordAuditAndOutbox(transactionContext, {
        eventKey: `recall.opened:${recall.organization.id}:${recall.recallNumber}`,
        organizationId: recall.organization.id,
        locationId: recall.location?.id,
        actorId: userId,
        eventType: "recall.opened_and_quarantined",
        resourceType: "Recall",
        resourceId: recall.id,
        metadata: { recallNumber: recall.recallNumber, classification: recall.classification, sourceReference: recall.sourceValidationReference, lotIds, exposureReconciliationStatus: "pending", approvalId: recall.approval?.id }
      });
      await recordAuditAndOutbox(transactionContext, {
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
  if (!["class_i", "class_ii", "class_iii", "market_withdrawal"].includes(args.classification)) throw new Error("Recall classification is invalid");
  if (!args.recallNumber?.trim() || !args.reason?.trim() || !args.source?.trim() || !args.sourceReference?.trim() || !args.lotIds.length) throw new Error("Recall number, reason, source, source reference, and affected lots are required");
  const requestFingerprint = (0, import_node_crypto18.createHash)("sha256").update(JSON.stringify({ organizationId: args.organizationId, locationId: args.locationId || null, recallNumber: args.recallNumber.trim(), classification: args.classification, reason: args.reason.trim(), source: args.source.trim(), sourceReference: args.sourceReference.trim(), lotIds: [...new Set(args.lotIds)].sort(), attested: args.attested })).digest("hex");
  const holdResult = await withDomainTransaction(context, [`recall-number:${args.recallNumber.trim()}`, ...args.lotIds.map((id) => `lot:${id}`)], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const existing = await sudo.query.Recall.findOne({ where: { recallNumber: args.recallNumber.trim() }, query: "id status organization { id } location { id } lots { id } approval { id evidence }" });
    if (existing) {
      if (!existing.organization?.id) throw new Error("Recall replay scope is incomplete; operator reconciliation is required");
      await requireTenantMembership(transactionContext, { organizationId: existing.organization.id, locationId: existing.location?.id, organizationWide: !existing.location?.id });
      if (existing.approval?.evidence?.requestFingerprint !== requestFingerprint) throw new Error("Recall number was reused with different input");
      return { success: true, reused: true, recallId: existing.id, status: existing.status, lotCount: existing.lots.length, approvalId: existing.approval?.id };
    }
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: args.organizationId, locationId: args.locationId, organizationWide: !args.locationId });
    const lots = await sudo.query.InventoryLot.findMany({
      where: { id: { in: [...new Set(args.lotIds)] } },
      query: "id quantityAvailable product { id organization { id } } location { id }"
    });
    if (lots.length !== new Set(args.lotIds).size || lots.some((lot) => lot.product?.organization?.id !== args.organizationId || args.locationId && lot.location?.id !== args.locationId)) {
      throw new Error("Every affected lot must belong to this pharmacy");
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
    throw new Error(`Recall hold ${holdResult.recallId} is committed, but exposure reconciliation did not complete. Verify the recall task and retry the same recall input; do not assume the hold failed.`);
  }
}
async function recordRecallExposureAction(_root, args, context) {
  requirePermission(context, "canManageRecalls");
  if (!["contacted", "returned", "resolved", "unable_to_reach"].includes(args.status)) throw new Error("Recall exposure status is invalid");
  if (!args.contactMethod?.trim() || !args.outcome?.trim()) throw new Error("Contact method and outcome are required");
  const requestFingerprint = (0, import_node_crypto18.createHash)("sha256").update(JSON.stringify({ exposureId: args.exposureId, status: args.status, contactMethod: args.contactMethod.trim(), outcome: args.outcome.trim(), notes: args.notes?.trim() || null, reason: args.reason?.trim(), attested: args.attested })).digest("hex");
  return withDomainTransaction(context, [`recall-exposure:${args.exposureId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const exposure = await sudo.query.RecallExposure.findOne({ where: { id: args.exposureId }, query: "id status organization { id } location { id } recall { id status } patient { id } approval { id evidence }" });
    if (!exposure || !["quarantined", "resolved"].includes(exposure.recall?.status)) throw new Error("Recall exposure is not actionable");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: exposure.organization.id, locationId: exposure.location.id });
    if (exposure.status === args.status && exposure.approval?.id && exposure.approval.evidence?.requestFingerprint !== requestFingerprint) throw new Error("Recall exposure replay input does not match the recorded action");
    if (exposure.status === args.status && exposure.approval?.id) return { success: true, reused: true, exposureId: exposure.id, status: exposure.status, approvalId: exposure.approval.id };
    if (["returned", "resolved", "unable_to_reach"].includes(exposure.status)) throw new Error("Recall exposure is already resolved");
    const approval = await createHumanApproval(transactionContext, { organizationId: exposure.organization.id, locationId: exposure.location.id, actorId: userId, actionType: "recall_disposition", reason: args.reason, attested: args.attested, evidence: { exposureId: exposure.id, status: args.status, contactMethod: args.contactMethod.trim(), outcome: args.outcome.trim(), requestFingerprint, custodyClaimed: false } });
    const resolved = ["returned", "resolved", "unable_to_reach"].includes(args.status);
    await transactionContext.prisma.recallExposure.update({ where: { id: exposure.id }, data: { status: args.status, contactMethod: args.contactMethod.trim(), outcome: args.outcome.trim(), notes: args.notes?.trim() || null, lastActionAt: /* @__PURE__ */ new Date(), resolvedAt: resolved ? /* @__PURE__ */ new Date() : null, lastActorId: userId, approvalId: approval.id } });
    await recordAuditAndOutbox(transactionContext, { eventKey: `recall.exposure_${args.status}:${exposure.id}:${approval.id}`, organizationId: exposure.organization.id, locationId: exposure.location.id, actorId: userId, patientId: exposure.patient.id, eventType: `recall.exposure_${args.status}`, resourceType: "RecallExposure", resourceId: exposure.id, metadata: { recallId: exposure.recall.id, approvalId: approval.id, contactMethod: args.contactMethod.trim(), custodyClaimed: false } });
    return { success: true, reused: false, exposureId: exposure.id, status: args.status, approvalId: approval.id };
  });
}
async function disposeRecallLot(_root, args, context) {
  requirePermission(context, "canManageRecalls");
  if (!Number.isInteger(args.quantity) || args.quantity < 1 || !args.dispositionReference?.trim() || !args.idempotencyKey?.trim()) throw new Error("Quantity, disposition reference, and idempotency key are required");
  const requestFingerprint = (0, import_node_crypto18.createHash)("sha256").update(JSON.stringify({ recallId: args.recallId, lotId: args.lotId, quantity: args.quantity, dispositionReference: args.dispositionReference.trim(), reason: args.reason?.trim(), attested: args.attested })).digest("hex");
  return withDomainTransaction(context, [`recall:${args.recallId}`, `lot:${args.lotId}`, `recall-disposition:${args.idempotencyKey}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const recall = await sudo.query.Recall.findOne({ where: { id: args.recallId }, query: "id status organization { id } location { id } lots { id quantityAvailable quantityQuarantined product { id } location { id } }" });
    const lot = recall?.lots?.find((entry) => entry.id === args.lotId);
    if (!recall || !recall.organization?.id || !lot?.location?.id) throw new Error("Recall disposition scope is incomplete; operator reconciliation is required");
    const { userId } = await requireTenantMembership(transactionContext, { organizationId: recall.organization.id, locationId: lot.location.id });
    const existing = await sudo.query.InventoryMovement.findOne({ where: { idempotencyKey: `recall-disposition:${args.idempotencyKey}` }, query: "id requestFingerprint lot { id }" });
    if (existing) {
      if (existing.lot?.id !== args.lotId || existing.requestFingerprint !== requestFingerprint) throw new Error("Disposition idempotency key was reused with different input");
      return { success: true, reused: true, recallId: args.recallId, lotId: args.lotId, movementId: existing.id, status: "disposed" };
    }
    if (recall.status !== "quarantined") throw new Error("Quarantined recall lot not found");
    if (args.quantity !== lot.quantityQuarantined || args.quantity > lot.quantityAvailable) throw new Error("Bounded recall disposition must dispose the complete quarantined quantity");
    const approval = await createHumanApproval(transactionContext, { organizationId: recall.organization.id, locationId: lot.location.id, actorId: userId, actionType: "recall_disposition", reason: args.reason, attested: args.attested, evidence: { recallId: recall.id, lotId: lot.id, quantity: args.quantity, dispositionReference: args.dispositionReference.trim(), physicalDispositionRecorded: true } });
    await sudo.query.InventoryLot.updateOne({ where: { id: lot.id }, data: { quantityAvailable: lot.quantityAvailable - args.quantity, quantityQuarantined: 0, status: lot.quantityAvailable - args.quantity === 0 ? "depleted" : "recalled" } });
    const movement = await sudo.query.InventoryMovement.createOne({ data: { movementType: "destroy", quantityDelta: -args.quantity, reason: args.reason, idempotencyKey: `recall-disposition:${args.idempotencyKey}`, requestFingerprint, organization: { connect: { id: recall.organization.id } }, location: { connect: { id: lot.location.id } }, product: { connect: { id: lot.product.id } }, lot: { connect: { id: lot.id } }, actor: { connect: { id: userId } }, approval: { connect: { id: approval.id } } }, query: "id" });
    await recordAuditAndOutbox(transactionContext, { eventKey: `recall.lot_disposed:${args.idempotencyKey}`, organizationId: recall.organization.id, locationId: lot.location.id, actorId: userId, eventType: "recall.lot_disposed", resourceType: "InventoryLot", resourceId: lot.id, metadata: { recallId: recall.id, movementId: movement.id, quantity: args.quantity, dispositionReference: args.dispositionReference.trim(), approvalId: approval.id } });
    return { success: true, reused: false, recallId: recall.id, lotId: lot.id, movementId: movement.id, status: "disposed" };
  });
}
async function closePharmacyRecall(_root, args, context) {
  requirePermission(context, "canManageRecalls");
  return withDomainTransaction(context, [`recall:${args.recallId}`], async (transactionContext) => {
    const sudo = transactionContext.sudo();
    const recall = await sudo.query.Recall.findOne({ where: { id: args.recallId }, query: "id status organization { id } location { id } closedAt approval { id reason actionType } lots { id quantityQuarantined } exposures(take: 10000) { id status }" });
    if (!recall) throw new Error("Recall not found");
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
    if (recall.status === "closed" && !exposureReconciliationComplete) throw new Error("Recall exposure reconciliation is incomplete; closure evidence requires operator review");
    if (recall.status === "closed" && (recall.approval?.actionType !== "recall_disposition" || recall.approval?.reason !== args.reason)) throw new Error("Recall closure replay does not match the recorded reason");
    if (recall.status === "closed") return { success: true, reused: true, recallId: recall.id, status: recall.status, approvalId: recall.approval?.id };
    if (!["quarantined", "resolved"].includes(recall.status)) throw new Error("Recall is not ready for closure");
    if (!exposureReconciliationComplete) throw new Error("Every sale/dispense movement must have a recorded exposure before recall closure");
    if (recall.lots.some((lot) => lot.quantityQuarantined > 0)) throw new Error("All quarantined lot quantities require recorded disposition before closure");
    if (recall.exposures.some((exposure) => !["returned", "resolved", "unable_to_reach"].includes(exposure.status))) throw new Error("Every dispensed exposure requires a resolved outreach record before closure");
    const approval = await createHumanApproval(transactionContext, { organizationId: recall.organization.id, locationId: recall.location?.id, actorId: userId, actionType: "recall_disposition", reason: args.reason, attested: args.attested, evidence: { recallId: recall.id, lotCount: recall.lots.length, exposureCount: recall.exposures.length, allDispositionRecorded: true } });
    await sudo.query.Recall.updateOne({ where: { id: recall.id }, data: { status: "closed", closedAt: (/* @__PURE__ */ new Date()).toISOString(), approval: { connect: { id: approval.id } } } });
    await recordAuditAndOutbox(transactionContext, { eventKey: `recall.closed:${recall.id}:${approval.id}`, organizationId: recall.organization.id, locationId: recall.location?.id, actorId: userId, eventType: "recall.closed", resourceType: "Recall", resourceId: recall.id, metadata: { approvalId: approval.id, lotCount: recall.lots.length, exposureCount: recall.exposures.length } });
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
    throw new Error("Not authenticated");
  }
  const existingUser = await sudoContext.query.User.findOne({
    where: { id: session.itemId },
    query: "id email"
  });
  if (!existingUser) {
    throw new Error("User not found");
  }
  if (data.password && !oldPassword) {
    throw new Error("Old password is required to update password");
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
      variables: { email: existingUser.email, password: oldPassword }
    });
    if (result.data?.authenticateUserWithPassword?.__typename !== "UserAuthenticationWithPasswordSuccess") {
      throw new Error("Invalid old password");
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
    name: "Cedar & Elm Community Pharmacy",
    slug: "cedar-elm-community-pharmacy",
    storefrontKey: "cedar-elm",
    operatorDisplayName: "Cedar & Elm Pharmacy",
    operatorTagline: "Care, close to home",
    brandPrimaryColor: "#18352b",
    brandAccentColor: "#8ec9ad",
    logoIcon: '<svg fill="none" height="100%" viewBox="0 0 40 48" width="100%" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="18" fill="#1570ef" r="14"/><circle cx="26" cy="30" fill="#53b1fd" r="14"/></svg>',
    logoColor: "295",
    supportEmail: "care@cedarelmpharmacy.com",
    supportPhone: "(212) 555-0142"
  },
  cashPolicy: {
    taxRateBps: 0,
    policyReference: "Standard cash policy"
  },
  location: {
    name: "Cedar & Elm \u2014 Main Street",
    code: "CEDAR-ELM-MAIN-001",
    timezone: "America/New_York",
    phone: "(212) 555-0142",
    address: {
      line1: "100 Main Street",
      city: "New York",
      region: "NY",
      postalCode: "10001",
      countryCode: "US"
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
  drugReferences: [],
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
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80"
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
      imageUrl: "https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=900&q=80"
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
      imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=80"
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
      imageUrl: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=900&q=80"
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
      imageUrl: "https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?auto=format&fit=crop&w=900&q=80"
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
      fax: "(212) 555-0111"
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
  if (!userId) throw new Error("Authentication required");
  const user = await context.sudo().query.User.findOne({ where: { id: userId }, query: "id onboardingStatus" });
  if (!user) throw new Error("Authenticated user not found");
  return { userId: user.id, status: user.onboardingStatus || "not_started", canManageOnboarding: permissions.canManageOnboarding({ session: context.session }) };
}
async function setPharmacyOnboardingStatus(_root, args, context) {
  const userId = context.session?.itemId;
  if (!userId) throw new Error("Authentication required");
  if (!ONBOARDING_STATUSES.includes(args.status)) throw new Error("Invalid onboarding status");
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
  if (!userId || !permissions.canManageOnboarding({ session: context.session })) throw new Error("You do not have permission to run onboarding");
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
      throw new Error("Store data already exists. Onboarding can only run on a new installation.");
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
      if (!productId) throw new Error(`Product ${entry.sku} is missing for lot ${entry.lotNumber}`);
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
    await recordAuditAndOutbox(transactionContext, {
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
  if (!input.privacyConsentAccepted) throw new Error("Privacy acknowledgement is required");
  if (input.policyVersion !== CHECKOUT_CONSENT.policyVersion || input.statementKey !== CHECKOUT_CONSENT.statementKey) {
    throw new Error("Privacy acknowledgement does not match the current policy");
  }
}
function normalizedEmail(value) {
  const email = value.trim().toLowerCase();
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid email address is required");
  return email;
}
function orderNumber() {
  return `RXO-${Date.now().toString(36).toUpperCase()}-${(0, import_node_crypto19.randomBytes)(3).toString("hex").toUpperCase()}`;
}
function checkoutReplay(cart, idempotencyKey, guestToken) {
  if (!cart.order || cart.order.idempotencyKey !== idempotencyKey) throw new Error("Cart was already submitted with another idempotency key");
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
  if (!["pickup", "delivery", "pos"].includes(input.fulfillmentMethod)) throw new Error("Fulfillment method is invalid");
  requireCheckoutConsent(input);
  const idempotencyKey = input.idempotencyKey?.trim();
  if (!idempotencyKey || idempotencyKey.length > 200) throw new Error("A bounded idempotency key is required");
  const email = normalizedEmail(input.email);
  const shippingAddress = input.fulfillmentMethod === "delivery" ? input.shippingAddress || null : null;
  if (input.fulfillmentMethod === "delivery" && !shippingAddress) throw new Error("A delivery address is required");
  const cart = await loadAndAssertCartAccess(context, input.cartId, input.guestToken, { allowSubmitted: true });
  const replayToken = context.session?.itemId ? null : createGuestOrderToken(cart.id, idempotencyKey);
  if (cart.status === "submitted") return checkoutReplay(cart, idempotencyKey, replayToken);
  if (input.fulfillmentMethod === "pos") {
    requirePermission(context, "canManageOrders");
    await requireTenantMembership(context, { organizationId: cart.organization.id, locationId: cart.location.id });
  }
  if (!cart.items.length) throw new Error("Cart is empty");
  if (input.fulfillmentMethod === "pickup" && !cart.location.pickupEnabled) throw new Error("Pickup is not enabled at this location");
  if (input.fulfillmentMethod === "delivery" && !cart.location.deliveryEnabled) throw new Error("Delivery is not available at this location");
  if (input.fulfillmentMethod === "pos" && !context.session?.itemId) throw new Error("Point-of-sale checkout requires an authenticated staff session");
  const paymentSession = cart.paymentSessions.find((session) => session.id === input.paymentSessionId);
  if (!paymentSession?.isSelected || !paymentSession.provider?.isInstalled) throw new Error("Selected payment session not found for this cart");
  if (paymentSession.amount !== cart.totalAmount) throw new Error("Payment amount does not match cart total");
  const paymentId = paymentSession.externalPaymentId || paymentSession.data?.paymentIntentId || paymentSession.data?.orderId;
  if (!paymentId) throw new Error("Payment session is missing provider payment id");
  const provider = await context.sudo().query.PaymentProvider.findOne({ where: { id: paymentSession.provider.id }, query: PAYMENT_PROVIDER_ADAPTER_FIELDS });
  if (!provider?.isInstalled) throw new Error("Selected payment session not found for this cart");
  const manualTender = isManualPaymentProvider(provider);
  if (manualTender && input.fulfillmentMethod === "delivery") throw new Error("Delivery orders are paid online. Choose card payment.");
  const paymentStatus = manualTender ? { status: "pending" } : await getPaymentStatus({ provider, paymentId });
  if (!manualTender && !["captured", "succeeded"].includes(paymentStatus.status)) throw new Error(`Payment is not settled: ${paymentStatus.status || "unknown"}`);
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
            id title sku handle status onlineAvailable prescriptionRequirement priceAmount currencyCode imageUrl taxable
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
      if (!current || current.status !== "active" || !current.items.length) throw new Error("Cart is no longer available");
      for (const item of current.items) {
        if (item.product.prescriptionRequirement !== "none") throw new Error("Prescription products require the authorized prescription workflow");
        if (item.product.status !== "published" || !item.product.onlineAvailable) throw new Error(`${item.product.title} is no longer available`);
        if (item.unitPriceAmount !== item.product.priceAmount) throw new Error("Product price changed; review the cart before checkout");
      }
      const totals = calculateCartTotals(current.items, current.taxAmount, current.deliveryAmount);
      if (totals.totalAmount !== current.totalAmount) throw new Error("Cart total changed; review the cart before checkout");
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
        if (remaining > 0) throw new Error(`Insufficient eligible lot inventory for ${item.product.title}`);
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
            imageUrl: item.product.imageUrl || void 0,
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
      await recordAuditAndOutbox(transactionContext, {
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
      throw new Error("Cart was committed by another checkout request; payment remains bound to the committed order");
    }
    const recoveryState = await context.sudo().query.PaymentSession.findOne({
      where: { id: paymentSession.id },
      query: "id payment { id order { id } } cart { order { id } }"
    });
    if (recoveryState?.payment?.order?.id || recoveryState?.cart?.order?.id) {
      throw new Error("Payment is already bound to a committed order and cannot be compensated");
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
      if (!["refunded", "succeeded"].includes(compensation?.status)) throw new Error(`Provider returned ${compensation?.status || "unknown"}`);
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
      await recordAuditAndOutbox(transactionContext, {
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
    if (compensationError) throw new Error("Payment settled but order creation failed. Recovery is pending; contact the pharmacy with the cart reference.");
    throw new Error("Order creation failed after payment. The payment was automatically refunded; retry checkout with a new payment session.");
  }
}

// features/keystone/mutations/index.ts
var graphql2 = String.raw;
function extendGraphqlSchema(baseSchema) {
  return (0, import_schema.mergeSchemas)({
    schemas: [baseSchema],
    typeDefs: graphql2`
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

      type PharmacyTaskOption { id: ID!, label: String!, scopeId: ID!, detail: String }
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
      type PharmacyCredentialReviewOptions {
        organizationWideOrganizationIds: [ID!]!
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
      type PharmacyDispensingLabelProjection { id: ID!, labelNumber: String!, fillNumber: Int!, operatorName: String!, operatorPhone: String, locationName: String!, locationAddress: JSON, patientName: String!, prescriberName: String!, medicationName: String!, sig: String!, quantityDispensed: Int!, lotNumber: String!, ndc11: String, expirationDate: String!, auxiliaryWarnings: [String!]!, counselingOutcome: String!, dispensedAt: String! }
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
      }
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
      type PharmacyOutboxTimelineEvent {
        id: ID!
        eventKey: String!
        eventType: String!
        aggregateType: String!
        aggregateId: String!
        status: String!
        attempts: Int!
        replayCount: Int!
        occurredAt: String!
        processedAt: String
        hasError: Boolean!
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
      type PharmacyPosCashOrderResult { success: Boolean!, reused: Boolean!, orderId: ID!, orderNumber: String!, status: String!, recordedAt: String!, lines: [PharmacyPosCashReceiptLine!]!, subtotalAmount: Int!, taxAmount: Int!, totalAmount: Int!, currencyCode: String!, paymentId: ID!, paymentStatus: String!, cashReceivedAmount: Int!, changeDueAmount: Int! }
      type PharmacyPaymentReconciliationResult { success: Boolean!, paymentSessionId: ID!, status: String! }
      type PharmacyPaymentWebhookResult { accepted: Boolean!, reused: Boolean!, eventId: String!, status: String! }
      type PharmacyIntegrationConfigurationResult { success: Boolean!, providerId: ID!, status: String! }
      type PharmacyPrescriberValidationResult { success: Boolean!, prescriberId: ID!, status: String!, validationReference: String! }
      type PharmacyExternalWorkflowResult { success: Boolean!, reused: Boolean!, workflowId: ID!, status: String!, externalReference: String }
      type PharmacyIntegrationWebhookResult { accepted: Boolean!, reused: Boolean!, eventId: String!, status: String! }
      type PharmacyPrescriptionActionResult { success: Boolean!, reused: Boolean, prescriptionId: ID, reviewId: ID, approvalId: ID, orderId: ID, orderNumber: String, receiptItemTitle: String, paymentId: ID, labelId: ID, status: String, totalAmount: Int, cashReceivedAmount: Int, changeDueAmount: Int, currencyCode: String }
      type PharmacyTransferResult { success: Boolean!, reused: Boolean, transferId: ID!, approvalId: ID, status: String! }
      type PharmacyRefillResult { success: Boolean!, reused: Boolean, refillRequestId: ID!, status: String!, approvalId: ID }
      type PharmacyFillCommandResult { success: Boolean!, reused: Boolean!, fillId: ID, status: String!, version: Int }
      type PharmacyFillEventProjection { id: ID!, action: String!, version: Int!, quantity: Int!, occurredAt: String!, actorName: String!, reason: String, orderId: ID, orderNumber: String }
      type PharmacyFillProjection {
        id: ID!, prescriptionItemId: ID!, refillRequestId: ID, kind: String!, status: String!, version: Int!, fillNumber: Int!,
        creditState: String!, authorizedQuantity: Int!, quantityDispensed: Int!, quantityReleased: Int!, quantityRemaining: Int!,
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
      type PharmacyOutboxReplayResult { id: ID!, status: String!, replayCount: Int!, reused: Boolean! }
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
        pharmacyPrescriptionRequestQueue(status: String): [PharmacyPrescriptionRequest!]!
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
        pharmacyPrescriptionWorklist(first: Int, after: String): PharmacyPrescriptionWorklist!
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
        pharmacyOutboxTimeline(take: Int): [PharmacyOutboxTimelineEvent!]!
        pharmacyOutboxQueue(take: Int): [PharmacyOutboxTimelineEvent!]!
      }

      type Mutation {
        submitPharmacyPrescriptionRequest(input: PharmacyPrescriptionRequestInput!): PharmacyCustomerPrescriptionRequest!
        resolvePharmacyPrescriptionRequest(requestId: ID!, status: String!, note: String): PharmacyPrescriptionRequest!
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
        submitPharmacyPosCashOrder(locationId: ID!, customerCartId: ID, fulfillmentMethod: String, items: [PharmacyPosCashItemInput!]!, cashReceivedAmount: Int!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyPosCashOrderResult!
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
        recordPrescriptionDispensing(prescriptionId: ID!, prescriptionItemId: ID!, lotId: ID!, quantity: Int!, cashReceivedAmount: Int!, auxiliaryWarnings: [String!]!, counselingOutcome: String!, idempotencyKey: String!, reason: String!, attested: Boolean!, fillId: ID, expectedFillVersion: Int): PharmacyPrescriptionActionResult!
        createPharmacyPatient(organizationId: ID!, patientNumber: String!, firstName: String!, lastName: String!, dateOfBirth: String!, email: String, phone: String, preferredContactMethod: String!, address: JSON, identityMethod: String!, identityReference: String!, reason: String!, attested: Boolean!): PharmacyPatientRecordResult!
        updatePharmacyPatientContact(patientId: ID!, email: String, phone: String, preferredContactMethod: String!, address: JSON, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyPatientRecordResult!
        recordPharmacyPatientAllergy(patientId: ID!, allergen: String!, reaction: String!, severity: String!, source: String!, sourceReference: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyPatientHistoryResult!
        recordPharmacyPatientMedication(patientId: ID!, medicationName: String!, directions: String, source: String!, sourceReference: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyPatientHistoryResult!
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
        openPharmacyRecall(organizationId: ID!, locationId: ID, recallNumber: String!, classification: String!, reason: String!, source: String!, sourceReference: String!, lotIds: [ID!]!, attested: Boolean!): PharmacyInventoryActionResult!
        quarantineRecallLots(recallId: ID!, reason: String!, attested: Boolean!): PharmacyInventoryActionResult!
        recordRecallExposureAction(exposureId: ID!, status: String!, contactMethod: String!, outcome: String!, notes: String, reason: String!, attested: Boolean!): PharmacyRecallExposureActionResult!
        disposeRecallLot(recallId: ID!, lotId: ID!, quantity: Int!, dispositionReference: String!, idempotencyKey: String!, reason: String!, attested: Boolean!): PharmacyInventoryActionResult!
        closePharmacyRecall(recallId: ID!, reason: String!, attested: Boolean!): PharmacyInventoryActionResult!
        transitionOrderFulfillment(fulfillmentId: ID!, status: String!, reason: String!, attested: Boolean!): PharmacyFulfillmentResult!
        replayPharmacyOutboxEvent(eventId: ID!): PharmacyOutboxReplayResult!
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
        pharmacyAuditTimeline,
        pharmacyOutboxTimeline,
        pharmacyOutboxQueue
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
        createPharmacyPatient,
        updatePharmacyPatientContact,
        recordPharmacyPatientAllergy,
        recordPharmacyPatientMedication,
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
        openPharmacyRecall,
        quarantineRecallLots,
        recordRecallExposureAction,
        disposeRecallLot,
        closePharmacyRecall,
        transitionOrderFulfillment,
        replayPharmacyOutboxEvent,
        setPharmacyOnboardingStatus,
        runPharmacyOnboarding
      }
    }
  });
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
var keystone_default = withAuth((0, import_core46.config)({
  db: { provider: "postgresql", url: databaseURL },
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

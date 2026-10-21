import { createHmac, timingSafeEqual } from "node:crypto";
import {
  externalFetchOptions,
  readBoundedExternalResponse,
} from "../../keystone/workflows/external-request-policy";

// Store-configured HTTP provider: the pharmacy records the provider base URL,
// endpoint paths, bearer token and webhook secret on the IntegrationProvider.

type ProviderInput = {
  provider: {
    configuration?: Record<string, any> | null;
    credentials?: Record<string, any> | null;
  };
};

function safeBaseUrl(value: string) {
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

function safePath(value: string) {
  if (!/^\/[A-Za-z0-9_./{}-]{1,200}$/.test(value) || value.includes("..")) {
    throw new Error("Integration endpoint path is invalid");
  }
  return value;
}

export function normalizeConfiguration(input: {
  baseUrl: string;
  validationPath: string;
  submitPath: string;
  statusPath: string;
  prescriberValidationPath?: string | null;
}) {
  return {
    baseUrl: safeBaseUrl(input.baseUrl),
    validationPath: safePath(input.validationPath),
    submitPath: safePath(input.submitPath),
    statusPath: safePath(input.statusPath),
    prescriberValidationPath: input.prescriberValidationPath
      ? safePath(input.prescriberValidationPath)
      : null,
  };
}

async function providerRequest(provider: ProviderInput["provider"], path: string, init: RequestInit) {
  const baseUrl = safeBaseUrl(String(provider.configuration?.baseUrl || ""));
  const url = new URL(safePath(path), `${baseUrl}/`);
  const response = await fetch(
    url,
    externalFetchOptions({
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${provider.credentials?.bearerToken || ""}`,
        ...(init.headers || {}),
      },
      signal: AbortSignal.timeout(20_000),
    })
  );
  const text = await readBoundedExternalResponse(response);
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text.slice(0, 1000) };
  }
  if (!response.ok) throw new Error(`Integration provider returned HTTP ${response.status}`);
  return body;
}

export async function validateConfigurationFunction({ provider }: ProviderInput) {
  return providerRequest(provider, String(provider.configuration?.validationPath || ""), { method: "GET" });
}

export async function validatePrescriberFunction({ provider, npi }: ProviderInput & { npi: string }) {
  const path = String(provider.configuration?.prescriberValidationPath || "").replace("{npi}", npi);
  return providerRequest(provider, path, { method: "GET" });
}

export async function submitFunction({
  provider,
  payload,
  idempotencyKey,
}: ProviderInput & { payload: unknown; idempotencyKey: string }) {
  return providerRequest(provider, String(provider.configuration?.submitPath || ""), {
    method: "POST",
    headers: { "idempotency-key": idempotencyKey },
    body: JSON.stringify(payload),
  });
}

export async function statusFunction({
  provider,
  externalReference,
}: ProviderInput & { externalReference: string }) {
  const path = String(provider.configuration?.statusPath || "").replace(
    "{externalReference}",
    encodeURIComponent(externalReference)
  );
  return providerRequest(provider, path, { method: "GET" });
}

export async function webhookFunction({
  provider,
  event,
  headers,
}: ProviderInput & { event: unknown; headers: Record<string, string> & { __rawBody?: string } }) {
  const secret = provider.credentials?.webhookSecret;
  const rawBody = headers.__rawBody;
  if (!secret) throw new Error("Webhook secret is not configured");
  if (!rawBody) throw new Error("Raw webhook body is required");
  const actual = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const expected = Buffer.from(headers["x-pharmacy-signature-sha256"] || "");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Webhook signature is invalid");
  }
  return { isValid: true, event };
}

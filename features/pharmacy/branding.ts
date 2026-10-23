import { sanitizeStoreLogoSvg } from '../lib/sanitize-store-logo'
import { normalizeStoreLogoColor, DEFAULT_STORE_LOGO_ICON } from '../lib/store-logo'

export type OperatorBrand = {
  organizationId: string
  tenantKey: string
  displayName: string
  tagline: string
  primaryColor: string
  accentColor: string
  logoUrl?: string | null
  logoIcon?: string | null
  logoColor?: string | null
  supportEmail?: string | null
  supportPhone?: string | null
  privacyNotice?: string | null
}

const HOST_PORT = /:\d+$/
const SAFE_TENANT_KEY = /^[a-z0-9](?:[a-z0-9.-]{0,98}[a-z0-9])?$/
const SAFE_HEX_COLOR = /^#[0-9a-f]{6}$/i

export type StorefrontRequestHeaders = Pick<Headers, 'get'>

export function normalizeStorefrontTenantKey(value: string | null | undefined) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(HOST_PORT, '')
  if (!SAFE_TENANT_KEY.test(normalized)) throw new Error('Storefront tenant key is invalid')
  return normalized
}

export function resolveStorefrontTenantKey(host: string | null | undefined) {
  return normalizeStorefrontTenantKey(host)
}

// The normalized request Host, or null when it is missing or malformed.
export function resolveStorefrontTenantKeyFromRequest(requestHeaders: StorefrontRequestHeaders) {
  const host = String(requestHeaders.get('host') || '').trim()
  if (!host || /[,\\/@\s]/.test(host) || host.includes('://')) return null
  try {
    return normalizeStorefrontTenantKey(host)
  } catch {
    return null
  }
}

export function safeBrandColor(value: string | null | undefined, fallback: string) {
  return SAFE_HEX_COLOR.test(value || '') ? String(value) : fallback
}

export function operatorBrandFromOrganization(organization: any): OperatorBrand {
  if (!organization?.id || !organization?.storefrontKey || !organization?.operatorDisplayName) {
    throw new Error('Operator branding is not configured')
  }
  return {
    organizationId: organization.id,
    tenantKey: organization.storefrontKey,
    displayName: organization.operatorDisplayName,
    tagline: organization.operatorTagline || 'Independent pharmacy care',
    primaryColor: safeBrandColor(organization.brandPrimaryColor, '#18352b'),
    accentColor: safeBrandColor(organization.brandAccentColor, '#8ec9ad'),
    logoUrl: organization.brandLogoUrl || null,
    logoIcon: sanitizeStoreLogoSvg(organization.logoIcon || DEFAULT_STORE_LOGO_ICON),
    logoColor: normalizeStoreLogoColor(organization.logoColor),
    supportEmail: organization.supportEmail || null,
    supportPhone: organization.supportPhone || null,
    privacyNotice: organization.privacyNotice || null,
  }
}

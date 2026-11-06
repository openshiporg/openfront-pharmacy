import { LOGO_ICONS } from '../platform/store-settings/lib/icon-registry';
export const DEFAULT_STORE_LOGO_ICON = LOGO_ICONS.find((icon) => icon.id === 'capsule')!.lightSvg;
export const DEFAULT_STORE_LOGO_COLOR = '295';

// This module is intentionally browser-safe. SVG sanitization lives in
// features/lib/sanitize-store-logo.ts.
export function normalizeStoreLogoColor(value: unknown): string {
  const numeric = Number.parseFloat(String(value ?? DEFAULT_STORE_LOGO_COLOR));
  if (!Number.isFinite(numeric)) return DEFAULT_STORE_LOGO_COLOR;
  return String(((numeric % 360) + 360) % 360);
}

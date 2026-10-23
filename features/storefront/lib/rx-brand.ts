import type { CSSProperties } from 'react'
import { normalizeStoreLogoColor } from '@/features/lib/store-logo'

// Untitled UI marks are drawn in #155eef. The storefront shows the mark through a CSS
// hue-rotate filter, so the store accent is that colour run through the same filter
// matrix and read back as an OKLCH hue. The accent then always matches the logo.
const BASE_RGB = [0x15 / 255, 0x5e / 255, 0xef / 255]

function hueRotate([r, g, b]: number[], degrees: number) {
  const a = (degrees * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  const m = [
    0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
  ]
  const clamp = (value: number) => Math.min(1, Math.max(0, value))
  return [clamp(m[0] * r + m[1] * g + m[2] * b), clamp(m[3] * r + m[4] * g + m[5] * b), clamp(m[6] * r + m[7] * g + m[8] * b)]
}

function oklchHue([r, g, b]: number[]) {
  const linear = (value: number) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360
}

/** OKLCH hue of the store accent for a saved logo colour (a hue-rotate angle). */
export function storeBrandHue(logoColor: unknown) {
  return Math.round(oklchHue(hueRotate(BASE_RGB, Number.parseFloat(normalizeStoreLogoColor(logoColor)))))
}

export type StoreBrandStyle = CSSProperties & { '--store-page-logo-hue': string; '--store-page-brand-hue': string }

export function storeBrandStyle(logoColor: unknown): StoreBrandStyle {
  return { '--store-page-logo-hue': normalizeStoreLogoColor(logoColor), '--store-page-brand-hue': String(storeBrandHue(logoColor)) }
}

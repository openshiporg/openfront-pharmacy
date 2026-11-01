export const NAV_LINKS = [
  { href: '/products', label: 'Shop' },
  { href: '/prescriptions', label: 'Prescriptions' },
  { href: '/order-status', label: 'Track order' },
]

export const PRESCRIPTION_LINKS = [
  { href: '/account#account-prescriptions', label: 'Refill prescription' },
  { href: '/prescriptions#transfer', label: 'Transfer prescription' },
  { href: '/order-status', label: 'Track an order' },
]

export const ACCOUNT_LINKS = [
  { href: '/account#account-orders', label: 'Order history' },
  { href: '/account#account-prescriptions', label: 'Prescription history' },
  { href: '/account/profile', label: 'Profile' },
]

export function isActivePath(pathname: string, href: string) {
  const path = href.split('#')[0].split('?')[0]
  return pathname === path || pathname.startsWith(`${path}/`)
}

/** Shop-by-category link for a product category. */
export function categoryHref(category: string) {
  return `/products?category=${category}#products`
}

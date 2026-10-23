export const NAV_LINKS = [
  { href: '/products', label: 'Shop' },
  { href: '/prescriptions', label: 'Prescriptions' },
  { href: '/order-status', label: 'Track order' },
]

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

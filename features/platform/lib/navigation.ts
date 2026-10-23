import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  Boxes,
  ClipboardList,
  CreditCard,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  Package,
  Plug,
  RotateCcw,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Store,
  Ticket,
  Users,
} from 'lucide-react'

export interface PlatformNavItem {
  title: string
  href: string
  color: string
  description: string
  icon: LucideIcon
  group?: string
}

export interface PlatformNavGroup {
  id: string
  title: string
  icon: LucideIcon
  items: PlatformNavItem[]
}

// Platform navigation items, relative to the dashboard basePath.
export const platformNavItems: PlatformNavItem[] = [
  // Standalone Items
  {
    title: 'Overview',
    href: '/platform/overview',
    color: 'teal',
    description: 'Pharmacy operations at a glance.',
    icon: LayoutDashboard,
    group: 'standalone',
  },
  {
    title: 'Prescriptions',
    href: '/platform/prescriptions',
    color: 'teal',
    description: 'Review prescriptions, refills, and transfers.',
    icon: ClipboardList,
    group: 'standalone',
  },
  {
    title: 'Orders',
    href: '/platform/orders',
    color: 'blue',
    description: 'Manage pickup, delivery, and counter orders.',
    icon: Ticket,
    group: 'standalone',
  },
  {
    title: 'Point of Sale',
    href: '/platform/pos',
    color: 'cyan',
    description: 'Ring up over-the-counter sales.',
    icon: ShoppingCart,
    group: 'standalone',
  },
  {
    title: 'Store Settings',
    href: '/platform/store-settings',
    color: 'slate',
    description: 'Configure store name, logo, and contact details.',
    icon: Store,
    group: 'standalone',
  },

  // Patient care
  {
    title: 'Patients',
    href: '/platform/patients',
    color: 'rose',
    description: 'Manage patient profiles, safety history, and consent.',
    icon: HeartPulse,
    group: 'care',
  },
  {
    title: 'Online Requests',
    href: '/platform/requests',
    color: 'teal',
    description: 'Patient registrations, transfers, and new prescriptions sent online.',
    icon: Inbox,
    group: 'care',
  },
  {
    title: 'Prescribers',
    href: '/platform/prescribers',
    color: 'indigo',
    description: 'Manage prescribers, contact details, and review status.',
    icon: Stethoscope,
    group: 'care',
  },

  // Catalog & inventory
  {
    title: 'Products',
    href: '/products',
    color: 'green',
    description: 'Create and manage your product catalog and pricing.',
    icon: Package,
    group: 'catalog',
  },
  {
    title: 'Inventory',
    href: '/platform/inventory',
    color: 'amber',
    description: 'Manage lots, expiry, quarantine, and stock by location.',
    icon: Boxes,
    group: 'catalog',
  },
  {
    title: 'Recalls',
    href: '/platform/recalls',
    color: 'red',
    description: 'Track recalls, quarantined lots, and patient outreach.',
    icon: RotateCcw,
    group: 'catalog',
  },

  // Staff & access
  {
    title: 'Users',
    href: '/users',
    color: 'purple',
    description: 'Manage staff and customer accounts.',
    icon: Users,
    group: 'access',
  },
  {
    title: 'Roles',
    href: '/roles',
    color: 'violet',
    description: 'Manage roles and permissions.',
    icon: ShieldCheck,
    group: 'access',
  },
  {
    title: 'Credential Review',
    href: '/platform/credentials',
    color: 'violet',
    description: 'Record pharmacist, prescriber, and drug reference reviews.',
    icon: BadgeCheck,
    group: 'access',
  },

  // Integrations
  {
    title: 'Payment Providers',
    href: '/payment-providers',
    color: 'slate',
    description: 'Configure payment gateways and provider settings.',
    icon: CreditCard,
    group: 'integrations',
  },
  {
    title: 'Integrations',
    href: '/platform/integrations',
    color: 'orange',
    description: 'Manage integration providers.',
    icon: Plug,
    group: 'integrations',
  },
  {
    title: 'Audit Log',
    href: '/platform/audit',
    color: 'gray',
    description: 'Review audit events and event delivery status.',
    icon: ScrollText,
    group: 'integrations',
  },
]

// Standalone navigation items (no grouping)
export const platformStandaloneItems = platformNavItems.filter((item) => item.group === 'standalone')

export const platformNavGroups: PlatformNavGroup[] = [
  {
    id: 'care',
    title: 'Patient Care',
    icon: HeartPulse,
    items: platformNavItems.filter((item) => item.group === 'care'),
  },
  {
    id: 'catalog',
    title: 'Catalog & Inventory',
    icon: Package,
    items: platformNavItems.filter((item) => item.group === 'catalog'),
  },
  {
    id: 'access',
    title: 'Staff & Access',
    icon: Users,
    items: platformNavItems.filter((item) => item.group === 'access'),
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Settings,
    items: platformNavItems.filter((item) => item.group === 'integrations'),
  },
]

// Helper function to get platform nav items with full paths
export function getPlatformNavItemsWithBasePath(basePath: string) {
  return platformNavItems.map((item) => ({
    ...item,
    href: `${basePath}${item.href}`,
  }))
}

// Helper function to get icon for a nav item by title
export function getIconForNavItem(title: string): LucideIcon {
  if (title === 'Onboarding') {
    return Sparkles
  }

  const item = platformNavItems.find((navItem) => navItem.title === title)
  return item?.icon || Package
}

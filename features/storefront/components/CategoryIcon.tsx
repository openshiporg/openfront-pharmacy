import { Bandage, BriefcaseMedical, Citrus, HandHeart, HeartPulse, Leaf, Pill, Stethoscope, Tablets, Thermometer, Wind, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

// One line icon per product category (features/keystone/models/Product.ts), drawn in the store red.
const ICONS: Record<string, LucideIcon> = {
  prescription: Tablets,
  otc_medication: Pill,
  first_aid: Bandage,
  wellness: HeartPulse,
  personal_care: HandHeart,
  medical_supply: BriefcaseMedical,
  allergy: Leaf,
  cold_and_flu: Wind,
  digestive_health: Citrus,
  vitamins: Pill,
  health_devices: Thermometer,
}

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = ICONS[category] || Stethoscope
  return <Icon aria-hidden="true" strokeWidth={1.6} className={cn('size-[18px] shrink-0 text-primary', className)} />
}

// The product list's own category labels (features/keystone/models/Product.ts).
const CATEGORY_LABELS: Record<string, string> = {
  prescription: 'Prescription',
  otc_medication: 'OTC medication',
  first_aid: 'First aid',
  wellness: 'Wellness',
  personal_care: 'Personal care',
  medical_supply: 'Medical supply',
  allergy: 'Allergy',
  cold_and_flu: 'Cold and flu',
  digestive_health: 'Digestive health',
  vitamins: 'Vitamins and supplements',
  health_devices: 'Health devices',
}

export function categoryLabel(value: string | null | undefined) {
  if (!value) return ''
  return CATEGORY_LABELS[value] || value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

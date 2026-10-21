import { Building2, Package } from 'lucide-react';

export type TemplateKey = 'full' | 'minimal';

export interface PharmacyTemplate {
  name: string;
  description: string;
  icon: React.ReactNode;
}

export const PHARMACY_TEMPLATES: Record<TemplateKey, PharmacyTemplate> = {
  minimal: {
    name: 'Basic Setup',
    description: 'One location, pay at pickup, and an essential over-the-counter catalog.',
    icon: <Package className="h-5 w-5" />,
  },
  full: {
    name: 'Complete Setup',
    description: 'Adds card payments, suppliers, a full front-store catalog, patients and prescribers.',
    icon: <Building2 className="h-5 w-5" />,
  },
};

export type SectionType =
  | 'store'
  | 'location'
  | 'paymentProviders'
  | 'integrations'
  | 'suppliers'
  | 'products'
  | 'inventory'
  | 'patients'
  | 'prescribers';

export interface SectionDefinition {
  id: number;
  type: SectionType;
  label: string;
}

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  { id: 1, type: 'store', label: 'Store Information' },
  { id: 2, type: 'location', label: 'Pharmacy Location' },
  { id: 3, type: 'paymentProviders', label: 'Payment Providers' },
  { id: 4, type: 'integrations', label: 'Integrations' },
  { id: 5, type: 'suppliers', label: 'Suppliers' },
  { id: 6, type: 'products', label: 'Products' },
  { id: 7, type: 'inventory', label: 'Opening Stock' },
  { id: 8, type: 'patients', label: 'Patients' },
  { id: 9, type: 'prescribers', label: 'Prescribers' },
];

import type { SectionType, TemplateKey } from '../config/templates';

type SeedEntry = { profile?: string; [key: string]: any };

const forTemplate = (entries: SeedEntry[] | undefined, template: TemplateKey) =>
  (entries || []).filter((entry) => template === 'full' || entry.profile !== 'full');

// Mirrors the server-side selection in runPharmacyOnboarding.
export function getSeedForTemplate(template: TemplateKey, seedData: any) {
  const products = forTemplate(seedData.products, template);
  const skus = new Set(products.map((product) => product.sku));
  return {
    organization: seedData.organization,
    location: seedData.location,
    paymentProviders: forTemplate(seedData.paymentProviders, template),
    integrationProviders: seedData.integrationProviders || [],
    suppliers: forTemplate(seedData.suppliers, template),
    products,
    lots: (seedData.lots || []).filter((lot: SeedEntry) => skus.has(lot.sku)),
    patients: template === 'full' ? seedData.patients || [] : [],
    prescribers: template === 'full' ? seedData.prescribers || [] : [],
  };
}

// Display names for each onboarding section.
export function getItemsFromJsonData(jsonData: any, sectionType: SectionType): string[] {
  if (!jsonData) return [];
  switch (sectionType) {
    case 'store':
      return jsonData.organization ? [jsonData.organization.operatorDisplayName || jsonData.organization.name] : [];
    case 'location':
      return jsonData.location ? [jsonData.location.name] : [];
    case 'paymentProviders':
      return (jsonData.paymentProviders || []).map((provider: SeedEntry) => provider.name);
    case 'integrations':
      return (jsonData.integrationProviders || []).map((provider: SeedEntry) => provider.name);
    case 'suppliers':
      return (jsonData.suppliers || []).map((supplier: SeedEntry) => supplier.name);
    case 'products':
      return (jsonData.products || []).map((product: SeedEntry) => product.title);
    case 'inventory': {
      const titles = new Map((jsonData.products || []).map((product: SeedEntry) => [product.sku, product.title]));
      return (jsonData.lots || []).map((lot: SeedEntry) => `${titles.get(lot.sku) || lot.sku} × ${lot.quantity}`);
    }
    case 'patients':
      return (jsonData.patients || []).map((patient: SeedEntry) => `${patient.firstName} ${patient.lastName}`);
    case 'prescribers':
      return (jsonData.prescribers || []).map((prescriber: SeedEntry) => prescriber.name);
    default:
      return [];
  }
}

import { StoreSettingsPageClient } from './StoreSettingsPageClient'
import { getStoreLocationHours, getStoreSettings, type StoreLocationHours } from '../actions'
import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs'

export async function StoreSettingsPage() {
  const response = await getStoreSettings()
  const locations: Record<string, StoreLocationHours[]> = {}
  if (response.success) {
    await Promise.all(response.data.map(async (store) => {
      const result = await getStoreLocationHours(store.id)
      if (result.success) locations[store.id] = result.data
    }))
  }

  return (
    <section className="overflow-hidden flex flex-col">
      <PageBreadcrumbs
        items={[
          {
            type: "link",
            label: "Dashboard",
            href: "/",
          },
          {
            type: "page",
            label: "Platform",
          },
          {
            type: "page",
            label: "Store Settings",
          },
        ]}
      />
      <StoreSettingsPageClient
        initialData={response.success ? response.data : []}
        initialError={response.success ? null : (response.error ?? null)}
        locations={locations}
      />
    </section>
  )
}

export default StoreSettingsPage

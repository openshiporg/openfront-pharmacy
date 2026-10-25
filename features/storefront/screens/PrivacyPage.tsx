import type { Metadata } from 'next'

import { Field, Notice, PageHead } from '../components/rx-ui'
import { CHECKOUT_POLICY, CHECKOUT_PRIVACY_STATEMENT } from '../lib/constants'
import { getPrivacyNotice, getStorefront } from '../lib/data/store'
import { StoreUnavailable } from './MainLayout'

export const metadata: Metadata = { title: 'Privacy notice' }

export async function PrivacyPage() {
  const [storefront, notice] = await Promise.all([getStorefront(), getPrivacyNotice()])
  if (!storefront) return <StoreUnavailable />
  const { brand, location } = storefront
  const phone = location?.phone || brand.supportPhone

  return <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
    <PageHead eyebrow={brand.displayName} title="Notice of Privacy Practices" />

    <section aria-label="Notice" className="mt-8 rounded-[22px] bg-card p-6 sm:p-8">
      {notice
        ? <div className="grid gap-4 text-[15px] leading-7">{notice.split(/\n{2,}/).map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}</div>
        : <Notice>This pharmacy has not posted its notice online yet. Ask the pharmacy for a copy.</Notice>}
    </section>

    <section aria-labelledby="privacy-checkout" className="mt-4 rounded-[22px] bg-muted p-6">
      <h2 id="privacy-checkout" className="text-lg font-semibold tracking-tight">Checkout acknowledgement</h2>
      <p className="mt-3 text-sm">{CHECKOUT_PRIVACY_STATEMENT}</p>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Version"><span className="rx-num">{CHECKOUT_POLICY.policyVersion}</span></Field>
        {(phone || brand.supportEmail) && <Field label="Privacy questions">{phone && <a href={`tel:${phone}`} className="rx-num block hover:text-primary">{phone}</a>}{brand.supportEmail && <a href={`mailto:${brand.supportEmail}`} className="block break-all hover:text-primary">{brand.supportEmail}</a>}</Field>}
      </dl>
    </section>
  </div>
}

export default PrivacyPage

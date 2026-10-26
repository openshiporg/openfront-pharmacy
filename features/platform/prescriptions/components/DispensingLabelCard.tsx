'use client'

import { buttonClass } from '@/features/platform/components/rx-ui'
import type { PharmacyPrescriptionTaskProjection } from '@/features/pharmacy/contracts'
import { formatCalendarDate, formatDay } from '@/features/platform/lib/dates'

export function DispensingLabelCard({ label, timeZone }: { label: PharmacyPrescriptionTaskProjection['dispensingLabels'][number]; timeZone?: string | null }) {
  return <article className="rounded-[6px] border-2 border-zinc-900 bg-white p-5 text-sm text-black print:break-inside-avoid">
    <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-3"><div><h3 className="text-lg font-bold">{label.operatorName}</h3><p>{label.locationName}{label.operatorPhone ? ` · ${label.operatorPhone}` : ''}</p></div><div className="text-right font-mono text-xs"><p>{label.labelNumber}</p><p>Fill {label.fillNumber}</p></div></div>
    <div className="mt-3 grid gap-2"><p><span className="font-semibold">Patient:</span> {label.patientName}</p><p><span className="font-semibold">Prescriber:</span> {label.prescriberName}</p><p className="text-base font-bold">{label.medicationName}</p><p className="rounded border border-black p-3 text-base">{label.sig}</p><div className="grid grid-cols-2 gap-2 text-xs"><p>Quantity: {label.quantityDispensed}</p><p>Lot: {label.lotNumber}</p><p>NDC: {label.ndc11 || 'Not recorded'}</p><p>Lot expiry: {formatCalendarDate(label.expirationDate)}</p><p>Dispensed: {formatDay(label.dispensedAt, timeZone)}</p><p>Counseling: {label.counselingOutcome.replaceAll('_', ' ')}</p></div></div>
    <div className="mt-3 border-t border-black pt-3"><p className="font-semibold">Operator-reviewed auxiliary warnings</p><ul className="mt-1 list-disc pl-5">{label.auxiliaryWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul><p className="mt-2 text-[10px] leading-4">Printed from recorded dispensing evidence. The software does not generate clinical warnings or validate licensure.</p></div>
    <button type="button" className={`${buttonClass} mt-4 print:hidden`} onClick={() => window.print()}>Print label</button>
  </article>
}

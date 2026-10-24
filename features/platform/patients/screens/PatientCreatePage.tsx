import { platformRequest } from '@/features/platform/lib/request'
import type { PharmacyTaskOption } from '@/features/pharmacy/contracts'
import { Field } from '@/features/platform/components/rx-ui'
import { TaskDataReadiness } from '@/features/platform/components/TaskDataReadiness'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { PatientCreateForm, type PatientPrefill } from '../components/PatientCreateForm'

type RequestDetails = { id: string; organizationId: string; firstName?: string | null; lastName?: string | null; dateOfBirth?: string | null; email?: string | null; phone?: string | null; allergies?: string | null; medications?: string | null; insurance?: string | null; customerEmail: string }

export async function PatientCreatePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const requestId = typeof params?.request === 'string' ? params.request : null
  const response = await platformRequest<{ pharmacyPatientRecordOptions: { organizations: PharmacyTaskOption[] } }>(`query { pharmacyPatientRecordOptions { organizations { id label scopeId detail } } }`)
  if (!response.success) return <TaskPage parent={{ label: 'Patients', href: '/platform/patients' }} title="Create patient" description={response.error} />
  const organizations = response.data.pharmacyPatientRecordOptions.organizations
  const requestResponse = requestId
    ? await platformRequest<{ pharmacyPrescriptionRequestQueue: RequestDetails[] }>(`query RequestForPatient($requestId: ID) { pharmacyPrescriptionRequestQueue(requestId: $requestId) { id organizationId firstName lastName dateOfBirth email phone allergies medications insurance customerEmail } }`, { requestId })
    : null
  const request = requestResponse?.success ? requestResponse.data.pharmacyPrescriptionRequestQueue[0] : undefined
  const prefill: PatientPrefill | undefined = request ? { requestId: request.id, organizationId: request.organizationId, firstName: request.firstName, lastName: request.lastName, dateOfBirth: request.dateOfBirth, email: request.email || request.customerEmail, phone: request.phone } : undefined
  return <TaskPage parent={{ label: 'Patients', href: '/platform/patients' }} title="Create patient">
    <TaskSection title="Setup"><TaskDataReadiness metrics={[{ label: 'Organizations', value: organizations.length }]} missingMessage={!organizations.length ? 'No pharmacy is available. Complete onboarding first.' : undefined} /></TaskSection>
    {request && (request.allergies || request.medications || request.insurance) && <TaskSection title="From the online request">
      <dl className="grid gap-3 sm:grid-cols-3">
        {request.allergies && <Field label="Allergies (patient-reported)"><span className="whitespace-pre-line">{request.allergies}</span></Field>}
        {request.medications && <Field label="Medications (patient-reported)"><span className="whitespace-pre-line">{request.medications}</span></Field>}
        {request.insurance && <Field label="Insurance"><span className="whitespace-pre-line">{request.insurance}</span></Field>}
      </dl>
    </TaskSection>}
    <TaskSection title="Patient identity and contact"><PatientCreateForm organizations={organizations} prefill={prefill} /></TaskSection>
  </TaskPage>
}

import type { components } from '@/api/generated/schema'

type Schemas = components['schemas']

// Schema OpenAPI marchează toate câmpurile ca opționale; API-ul le returnează mereu
export type ConsultationMedicationDto = Required<Schemas['ConsultationMedicationDto']>
export type CnasDrugLookupDto = Required<Schemas['CnasDrugLookupDto']>

export type CreateConsultationMedicationPayload = Required<Schemas['CreateConsultationMedicationCommand']>
export type UpdateConsultationMedicationPayload =
  { id: string } & Required<Schemas['UpdateConsultationMedicationRequest']>

/** Listele de compensare vin din SQL ca text separat prin virgulă ("A,C1"). */
export const parseCopaymentLists = (raw: string | null): string[] =>
  raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : []

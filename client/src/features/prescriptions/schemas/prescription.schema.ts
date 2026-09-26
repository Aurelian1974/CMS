import { z } from 'zod'
import { DOSE_MAX, DOSE_STEP } from '@/features/consultations/medications/schemas/medication.schema'

// Aceleași limite ca validatorii BE (CreatePrescriptionsCommandValidator / PrescriptionItemDataValidator)
export const MAX_ITEMS_PER_REQUEST = 50
export const MAX_QUANTITY = 9999

const doseSchema = (label: string) =>
  z.number()
    .refine((d) => d > 0 && d <= DOSE_MAX && Number.isInteger(d / DOSE_STEP), {
      message: `Doza de ${label}: între ${DOSE_STEP} și ${DOSE_MAX}, în pași de ${DOSE_STEP}`,
    })
    .nullable()

export const prescriptionItemSchema = z.object({
  // Cheie locală pentru lista din formular — nu se trimite la API
  key: z.string(),
  consultationMedicationId: z.string().nullable(),
  drugCode: z.string().nullable(),
  drugName: z.string().trim().min(1, 'Denumirea medicamentului este obligatorie').max(500, 'Maxim 500 caractere'),
  // Doar pentru afișare (snapshot din nomenclator)
  details: z.string().nullable(),
  availableLists: z.array(z.string()),
  copaymentListType: z.string().nullable(),
  diagnosisCode: z.string().max(20, 'Maxim 20 caractere').nullable(),
  doseMorning: doseSchema('dimineață'),
  doseAfternoon: doseSchema('după-amiază'),
  doseEvening: doseSchema('seară'),
  durationDays: z.number().int('Număr întreg').min(1, 'Minim 1 zi').max(365, 'Maxim 365 zile').nullable(),
  quantity: z.number().positive('Cantitate pozitivă').max(MAX_QUANTITY, `Maxim ${MAX_QUANTITY}`).nullable(),
  instructions: z.string().max(1000, 'Maxim 1000 caractere').nullable(),
}).refine((i) => !i.copaymentListType || !!i.drugCode, {
  message: 'Medicamentele compensate trebuie selectate din nomenclatorul CNAS',
  path: ['copaymentListType'],
})

export const prescriptionFormSchema = z.object({
  patientId: z.string().min(1, 'Pacientul este obligatoriu'),
  doctorId: z.string().min(1, 'Medicul este obligatoriu'),
  careTypeId: z.string(),
  insuredCategoryId: z.string(),
  treatmentDays: z.number().int('Număr întreg').min(1, 'Minim 1 zi').max(365, 'Maxim 365 zile').nullable(),
  diagnostic: z.string().max(1000, 'Maxim 1000 caractere'),
  diagnosticCodes: z.string().max(500, 'Maxim 500 caractere'),
  registryNumber: z.string().max(50, 'Maxim 50 caractere'),
  isContinuation: z.boolean(),
  referralLetterNumber: z.string().max(50, 'Maxim 50 caractere'),
  notes: z.string().max(1000, 'Maxim 1000 caractere'),
  items: z.array(prescriptionItemSchema)
    .min(1, 'Adăugați cel puțin un medicament')
    .max(MAX_ITEMS_PER_REQUEST, `Maxim ${MAX_ITEMS_PER_REQUEST} medicamente`),
})

export type PrescriptionItemFormData = z.infer<typeof prescriptionItemSchema>
export type PrescriptionFormData = z.infer<typeof prescriptionFormSchema>

export const cancelPrescriptionSchema = z.object({
  reason: z.string().trim().min(1, 'Motivul anulării este obligatoriu').max(500, 'Maxim 500 caractere'),
})

export type CancelPrescriptionFormData = z.infer<typeof cancelPrescriptionSchema>

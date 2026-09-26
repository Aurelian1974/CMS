import { z } from 'zod'

// Aceleași limite ca MedicationDoseRules (BE)
export const DOSE_MAX = 20
export const DOSE_STEP = 0.25
export const DEFAULT_DOSE = 1

const doseSchema = (label: string) =>
  z.number()
    .refine((d) => d > 0 && d <= DOSE_MAX && Number.isInteger(d / DOSE_STEP), {
      message: `Doza de ${label}: între ${DOSE_STEP} și ${DOSE_MAX}, în pași de ${DOSE_STEP}`,
    })
    .nullable()

export const medicationRowSchema = z.object({
  copaymentListType: z.string().max(20).nullable(),
  doseMorning: doseSchema('dimineață'),
  doseAfternoon: doseSchema('după-amiază'),
  doseEvening: doseSchema('seară'),
  durationDays: z.number().int('Număr întreg').min(1, 'Minim 1 zi').max(365, 'Maxim 365 zile').nullable(),
  notes: z.string().max(1000, 'Maxim 1000 caractere').nullable(),
})

export type MedicationRowData = z.infer<typeof medicationRowSchema>

type QuantityInput = Pick<MedicationRowData, 'doseMorning' | 'doseAfternoon' | 'doseEvening' | 'durationDays'>

/** Aceeași formulă ca și coloana calculată TotalQuantity din BD. */
export const computeTotalQuantity = (row: QuantityInput) => {
  const daily = (row.doseMorning ?? 0) + (row.doseAfternoon ?? 0) + (row.doseEvening ?? 0)
  return daily > 0 && row.durationDays ? { daily, total: daily * row.durationDays } : null
}

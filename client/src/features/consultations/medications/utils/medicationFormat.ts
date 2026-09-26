import type { ConsultationMedicationDto } from '../types/medication.types'

const numberFormat = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 })

export const formatQuantity = (value: number) => numberFormat.format(value)

type PosologyInput = Pick<ConsultationMedicationDto, 'doseMorning' | 'doseAfternoon' | 'doseEvening'>

/** Notație uzuală pe rețete: dimineață – după-amiază – seara (ex. „1 – 0 – 0,5”). */
export const formatPosology = (row: PosologyInput): string | null =>
  row.doseMorning === null && row.doseAfternoon === null && row.doseEvening === null
    ? null
    : [row.doseMorning, row.doseAfternoon, row.doseEvening].map((d) => formatQuantity(d ?? 0)).join(' – ')

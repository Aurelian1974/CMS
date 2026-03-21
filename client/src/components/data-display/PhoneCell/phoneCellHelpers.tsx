import { PhoneCell } from './PhoneCell'

/** Wrapper pentru Syncfusion grid template — primește rândul ca prop `data` */
export const phoneCellTemplate = (data: Record<string, unknown>) => (
  <PhoneCell value={data['phoneNumber'] as string | null} />
)

/**
 * Factory — crează un template pentru un câmp arbitrar din grid.
 * Folosit când câmpul nu se numește `phoneNumber`.
 * @example template={phoneFieldTemplate('secondaryPhone')}
 */
export const phoneFieldTemplate = (field: string) =>
  (data: Record<string, unknown>) => (
    <PhoneCell value={data[field] as string | null} />
  )

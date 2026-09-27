import type { BadgeVariant } from '@/components/ui/AppBadge'

/** Codurile din FiscalReceiptStatuses (seed 0056) — mașina de stări a bonului. */
export const RECEIPT_STATUS = {
  Pending:   'PENDING',
  Printing:  'PRINTING',
  Printed:   'PRINTED',
  Failed:    'FAILED',
  Unknown:   'UNKNOWN',
  Cancelled: 'CANCELLED',
} as const

/** Codurile de status plată calculate de ConsultationBilling_* (PaymentStatusCodes în backend). */
export const PAYMENT_STATUS = {
  Unpaid:  'NEPLATIT',
  Partial: 'PARTIAL',
  Paid:    'PLATIT',
} as const

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  [PAYMENT_STATUS.Unpaid]:  'Neplătit',
  [PAYMENT_STATUS.Partial]: 'Plătit parțial',
  [PAYMENT_STATUS.Paid]:    'Plătit',
}

export const paymentStatusVariant = (code: string): BadgeVariant => {
  switch (code) {
    case PAYMENT_STATUS.Paid:    return 'success'
    case PAYMENT_STATUS.Partial: return 'warning'
    default:                     return 'danger'
  }
}

export const receiptStatusVariant = (code: string | null): BadgeVariant => {
  switch (code) {
    case RECEIPT_STATUS.Printed:   return 'success'
    case RECEIPT_STATUS.Pending:   return 'info'
    case RECEIPT_STATUS.Printing:  return 'warning'
    case RECEIPT_STATUS.Failed:    return 'danger'
    case RECEIPT_STATUS.Unknown:   return 'critical'
    default:                       return 'neutral'
  }
}

/** Stări în care nu se știe dacă aparatul a emis bonul — se rezolvă DOAR prin reconciliere manuală. */
export const receiptIsUnresolved = (code: string | null) =>
  code === RECEIPT_STATUS.Unknown || code === RECEIPT_STATUS.Printing

export const invoiceStatusVariant = (code: string): BadgeVariant =>
  code === 'STORNATA' ? 'neutral' : 'success'

/** Numărul de factură afișat — același format ca în PDF și în lista de încasări: „FCT 123". */
export const formatInvoiceNumber = (series: string, number: number) => `${series} ${number}`

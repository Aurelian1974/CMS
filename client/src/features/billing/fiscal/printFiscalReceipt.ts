import {
  BridgeRejectedError,
  type BridgePrintResult,
  type BridgeReceiptJob,
  type fiscalBridgeApi,
} from '@/api/endpoints/fiscalBridge.api'
import type { FiscalReceiptDetailDto, ReportFiscalReceiptResultPayload } from '../types/billing.types'

export type PrintSummaryOutcome = 'NOT_STARTED' | 'PRINTED' | 'FAILED' | 'UNKNOWN'

export interface PrintSummary {
  outcome: PrintSummaryOutcome
  message: string
}

export interface PrintDeps {
  bridgeUrl: string
  token: string
  bridge: Pick<typeof fiscalBridgeApi, 'getStatus' | 'print'>
  /** PENDING / FAILED → PRINTING în ValyanClinic; întoarce conținutul bonului cu mapările aparatului. */
  start: (receiptId: string) => Promise<FiscalReceiptDetailDto>
  report: (payload: ReportFiscalReceiptResultPayload) => Promise<unknown>
}

// Limitele din ReportFiscalReceiptResultCommandValidator
const MAX_ERROR = 1000
const MAX_DEVICE_RESPONSE = 20_000

const truncate = (v: string | null, max: number) => (v && v.length > max ? v.slice(0, max) : v)

const toJob = (receipt: FiscalReceiptDetailDto): BridgeReceiptJob => ({
  jobId: receipt.id,
  lines: receipt.lines.map((l) => ({ name: l.name, unitPrice: l.unitPrice, quantity: l.quantity, taxGroup: l.taxGroup })),
  tenders: receipt.tenders.map((t) => ({ paymentCode: t.devicePaymentCode ?? '', amount: t.amount })),
})

const STATUS_CODE = { Printed: 'PRINTED', Failed: 'FAILED', Unknown: 'UNKNOWN' } as const

/**
 * Tipărirea unui bon: bridge-ul se verifică ÎNAINTE de a marca bonul „în tipărire" în aplicație,
 * deci un bridge oprit / aparat fără hârtie lasă bonul neatins (se reia oricând). După ce jobul a
 * plecat spre bridge, orice răspuns pierdut devine UNKNOWN → reconciliere, niciodată retrimitere.
 */
export const printFiscalReceipt = async (receiptId: string, deps: PrintDeps): Promise<PrintSummary> => {
  // 1. Aparatul e pregătit? (nimic nu se schimbă în aplicație dacă nu)
  try {
    const status = await deps.bridge.getStatus(deps.bridgeUrl, deps.token)
    if (!status.isReady) {
      return { outcome: 'NOT_STARTED', message: `Casa de marcat nu este pregătită: ${status.problems.join(' ')}` }
    }
  } catch (err) {
    return { outcome: 'NOT_STARTED', message: err instanceof Error ? err.message : 'Fiscal bridge-ul nu răspunde.' }
  }

  // 2. Bonul trece în „În tipărire" (o singură încercare activă, verificat de server)
  const receipt = await deps.start(receiptId)

  // 3. Tipărirea propriu-zisă
  let result: BridgePrintResult
  try {
    result = await deps.bridge.print(deps.bridgeUrl, deps.token, toJob(receipt))
  } catch (err) {
    // Bridge-ul a respins cererea înainte de aparat (token, validare) → sigur netipărit.
    // Conflictul (409) înseamnă că jobul a mai fost trimis cu alt conținut → doar reconciliere.
    const rejectedSafely = err instanceof BridgeRejectedError && err.status !== 409
    result = {
      outcome: rejectedSafely ? 'Failed' : 'Unknown',
      errorMessage: err instanceof Error ? err.message : 'Eroare necunoscută la fiscal bridge.',
      receiptNumber: null, deviceSerialNumber: null, printedAt: null, deviceResponse: null, isReplay: false,
    }
  }

  // 4. Rezultatul se salvează în aplicație
  try {
    await deps.report({
      id: receiptId,
      statusCode: STATUS_CODE[result.outcome],
      receiptNumber: result.receiptNumber,
      deviceSerialNumber: result.deviceSerialNumber,
      printedAt: result.printedAt,
      errorMessage: truncate(result.errorMessage, MAX_ERROR),
      deviceResponse: truncate(result.deviceResponse, MAX_DEVICE_RESPONSE),
    })
  } catch {
    return {
      outcome: 'UNKNOWN',
      message: result.outcome === 'Printed'
        ? `Bonul nr. ${result.receiptNumber} a fost tipărit, dar rezultatul nu a putut fi salvat în aplicație. Faceți reconcilierea bonului (rămâne „În tipărire").`
        : 'Rezultatul tipăririi nu a putut fi salvat în aplicație. Faceți reconcilierea bonului (rămâne „În tipărire").',
    }
  }

  switch (result.outcome) {
    case 'Printed':
      return { outcome: 'PRINTED', message: `Bonul fiscal nr. ${result.receiptNumber} a fost tipărit.` }
    case 'Failed':
      return { outcome: 'FAILED', message: `Bonul nu a fost tipărit: ${result.errorMessage ?? 'eroare aparat'}. Puteți reîncerca după remediere.` }
    default:
      return {
        outcome: 'UNKNOWN',
        message: `Nu se știe dacă bonul a fost tipărit (${result.errorMessage ?? 'răspuns pierdut'}). NU reîncercați — verificați pe casa de marcat și faceți reconcilierea.`,
      }
  }
}

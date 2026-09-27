// Clientul fiscal bridge-ului — serviciul local de pe PC-ul recepției (127.0.0.1).
// Folosește fetch, NU instanța axios: bridge-ul nu trebuie să primească niciodată JWT-ul aplicației.

export type BridgeOutcome = 'Printed' | 'Failed' | 'Unknown'

export interface BridgeDeviceStatus {
  isConnected: boolean
  isReady: boolean
  paperOut: boolean
  coverOpen: boolean
  fiscalReceiptOpen: boolean
  serialNumber: string | null
  model: string | null
  problems: string[]
}

export interface BridgeReceiptJob {
  jobId: string
  lines: { name: string; unitPrice: number; quantity: number; taxGroup: string }[]
  tenders: { paymentCode: string; amount: number }[]
}

export interface BridgePrintResult {
  outcome: BridgeOutcome
  receiptNumber: string | null
  deviceSerialNumber: string | null
  printedAt: string | null
  errorMessage: string | null
  deviceResponse: string | null
  isReplay: boolean
}

export interface BridgeJournalEntry {
  jobId: string
  state: 'Printing' | 'Printed' | 'Failed' | 'Unknown'
  attempts: number
  receiptNumber: string | null
  printedAt: string | null
  errorMessage: string | null
  updatedAt: string
}

/** Bridge-ul a răspuns, dar a respins cererea (token, validare, conflict) — nimic trimis la aparat. */
export class BridgeRejectedError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Bridge-ul nu a răspuns (oprit, timeout, conexiune pierdută) — rezultatul unei tipăriri e necunoscut. */
export class BridgeUnreachableError extends Error {}

const TOKEN_HEADER = 'X-Bridge-Token'

// Timpi de așteptare: statusul e rapid; tipărirea unui bon poate dura cât aparatul trimite SYN
const STATUS_TIMEOUT_MS = 5_000
const PRINT_TIMEOUT_MS = 90_000

const request = async <T>(baseUrl: string, path: string, token: string, init: RequestInit, timeoutMs: number): Promise<T> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let response: Response
  try {
    response = await fetch(`${baseUrl.replace(/\/+$/, '')}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', [TOKEN_HEADER]: token, ...init.headers },
    })
  } catch {
    throw new BridgeUnreachableError('Fiscal bridge-ul nu răspunde. Verificați că serviciul rulează pe acest PC.')
  } finally {
    clearTimeout(timer)
  }

  const body = await response.json().catch(() => null) as ({ message?: string } & T) | null
  if (!response.ok) {
    throw new BridgeRejectedError(response.status, body?.message ?? `Fiscal bridge-ul a respins cererea (${response.status}).`)
  }
  return body as T
}

export const fiscalBridgeApi = {
  getStatus: (baseUrl: string, token: string) =>
    request<BridgeDeviceStatus>(baseUrl, '/api/status', token, { method: 'GET' }, STATUS_TIMEOUT_MS),

  print: (baseUrl: string, token: string, job: BridgeReceiptJob) =>
    request<BridgePrintResult>(baseUrl, '/api/receipts', token, { method: 'POST', body: JSON.stringify(job) }, PRINT_TIMEOUT_MS),

  /** Jurnalul local al unui bon; `null` = bridge-ul nu l-a primit niciodată. */
  getJob: async (baseUrl: string, token: string, jobId: string): Promise<BridgeJournalEntry | null> => {
    try {
      return await request<BridgeJournalEntry>(baseUrl, `/api/receipts/${jobId}`, token, { method: 'GET' }, STATUS_TIMEOUT_MS)
    } catch (err) {
      if (err instanceof BridgeRejectedError && err.status === 404) return null
      throw err
    }
  },
}

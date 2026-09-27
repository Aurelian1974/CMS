import { describe, expect, it, vi } from 'vitest'
import { BridgeRejectedError, BridgeUnreachableError, type BridgePrintResult } from '@/api/endpoints/fiscalBridge.api'
import { printFiscalReceipt, type PrintDeps } from '@/features/billing/fiscal/printFiscalReceipt'
import type { FiscalReceiptDetailDto } from '@/features/billing/types/billing.types'

const RECEIPT_ID = 'c5000000-0000-0000-0000-000000000001'

const receipt = {
  id: RECEIPT_ID,
  lines: [
    { id: 'l1', name: 'Consultație', unitPrice: 100, quantity: 1, lineTotal: 100, vatRateId: 'v', taxGroup: 'A', sortOrder: 1 },
    { id: 'l2', name: 'Spirometrie', unitPrice: 50, quantity: 1, lineTotal: 50, vatRateId: 'v', taxGroup: 'A', sortOrder: 2 },
  ],
  tenders: [
    { paymentMethodId: 'm1', paymentMethodCode: 'NUMERAR', paymentMethodName: 'Numerar', devicePaymentCode: 'P', amount: 150 },
  ],
} as unknown as FiscalReceiptDetailDto

const printed: BridgePrintResult = {
  outcome: 'Printed', receiptNumber: '42', deviceSerialNumber: 'DT1', printedAt: '2026-09-27T10:00:00',
  errorMessage: null, deviceResponse: 'log', isReplay: false,
}

const readyStatus = { isConnected: true, isReady: true, paperOut: false, coverOpen: false, fiscalReceiptOpen: false, serialNumber: 'DT1', model: 'DP-25', problems: [] }

const deps = (overrides: Partial<PrintDeps['bridge']> = {}, report = vi.fn().mockResolvedValue(undefined)) => {
  const start = vi.fn().mockResolvedValue(receipt)
  const bridge = {
    getStatus: vi.fn().mockResolvedValue(readyStatus),
    print: vi.fn().mockResolvedValue(printed),
    ...overrides,
  }
  return { deps: { bridgeUrl: 'http://127.0.0.1:5199', token: 't', bridge, start, report } satisfies PrintDeps, start, bridge, report }
}

describe('printFiscalReceipt', () => {
  it('should not touch the receipt when the bridge does not answer', async () => {
    const { deps: d, start } = deps({ getStatus: vi.fn().mockRejectedValue(new BridgeUnreachableError('oprit')) })

    const summary = await printFiscalReceipt(RECEIPT_ID, d)

    expect(summary.outcome).toBe('NOT_STARTED')
    expect(start).not.toHaveBeenCalled()
  })

  it('should not start printing when the device reports paper out', async () => {
    const { deps: d, start } = deps({ getStatus: vi.fn().mockResolvedValue({ ...readyStatus, isReady: false, problems: ['Lipsă hârtie.'] }) })

    const summary = await printFiscalReceipt(RECEIPT_ID, d)

    expect(summary.outcome).toBe('NOT_STARTED')
    expect(summary.message).toContain('Lipsă hârtie')
    expect(start).not.toHaveBeenCalled()
  })

  it('should send the device mappings and report PRINTED with the receipt number', async () => {
    const { deps: d, bridge, report } = deps()

    const summary = await printFiscalReceipt(RECEIPT_ID, d)

    expect(bridge.print).toHaveBeenCalledWith('http://127.0.0.1:5199', 't', {
      jobId: RECEIPT_ID,
      lines: [
        { name: 'Consultație', unitPrice: 100, quantity: 1, taxGroup: 'A' },
        { name: 'Spirometrie', unitPrice: 50, quantity: 1, taxGroup: 'A' },
      ],
      tenders: [{ paymentCode: 'P', amount: 150 }],
    })
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ id: RECEIPT_ID, statusCode: 'PRINTED', receiptNumber: '42' }))
    expect(summary.outcome).toBe('PRINTED')
  })

  it('should report UNKNOWN when the connection to the bridge is lost during printing', async () => {
    const { deps: d, report } = deps({ print: vi.fn().mockRejectedValue(new BridgeUnreachableError('timeout')) })

    const summary = await printFiscalReceipt(RECEIPT_ID, d)

    expect(report).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 'UNKNOWN' }))
    expect(summary.outcome).toBe('UNKNOWN')
  })

  it('should report FAILED when the bridge rejects the job before reaching the device', async () => {
    const { deps: d, report } = deps({ print: vi.fn().mockRejectedValue(new BridgeRejectedError(400, 'mapare lipsă')) })

    const summary = await printFiscalReceipt(RECEIPT_ID, d)

    expect(report).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 'FAILED', errorMessage: 'mapare lipsă' }))
    expect(summary.outcome).toBe('FAILED')
  })

  it('should treat a job conflict as UNKNOWN — the receipt may have been printed before', async () => {
    const { deps: d, report } = deps({ print: vi.fn().mockRejectedValue(new BridgeRejectedError(409, 'alt conținut')) })

    await printFiscalReceipt(RECEIPT_ID, d)

    expect(report).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 'UNKNOWN' }))
  })

  it('should pass through a device failure as FAILED', async () => {
    const { deps: d, report } = deps({ print: vi.fn().mockResolvedValue({ ...printed, outcome: 'Failed', receiptNumber: null, errorMessage: 'Lipsă hârtie.' }) })

    const summary = await printFiscalReceipt(RECEIPT_ID, d)

    expect(report).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 'FAILED' }))
    expect(summary.message).toContain('Puteți reîncerca')
  })

  it('should ask for reconciliation when the printed result cannot be saved', async () => {
    const { deps: d } = deps({}, vi.fn().mockRejectedValue(new Error('offline')))

    const summary = await printFiscalReceipt(RECEIPT_ID, d)

    expect(summary.outcome).toBe('UNKNOWN')
    expect(summary.message).toContain('nr. 42')
    expect(summary.message).toContain('reconcilierea')
  })

  it('should truncate oversized device responses to the server limit', async () => {
    const { deps: d, report } = deps({ print: vi.fn().mockResolvedValue({ ...printed, deviceResponse: 'x'.repeat(25_000) }) })

    await printFiscalReceipt(RECEIPT_ID, d)

    expect(report.mock.calls[0][0].deviceResponse).toHaveLength(20_000)
  })
})

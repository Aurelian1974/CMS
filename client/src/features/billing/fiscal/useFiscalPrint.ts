import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { billingApi } from '@/api/endpoints/billing.api'
import { fiscalBridgeApi } from '@/api/endpoints/fiscalBridge.api'
import { useFiscalSettings } from '@/features/settings/hooks/useFinancialSettings'
import { getBridgeToken } from './bridgeToken'
import { printFiscalReceipt, type PrintSummary } from './printFiscalReceipt'

const BILLING_KEY = ['billing'] as const
const INVOICES_KEY = ['invoices'] as const

/** Tipărirea bonurilor din recepție, prin fiscal bridge-ul de pe PC-ul curent. */
export const useFiscalPrint = () => {
  const qc = useQueryClient()
  const { data: settingsResp } = useFiscalSettings()
  const settings = settingsResp?.data
  const [printingId, setPrintingId] = useState<string | null>(null)

  const print = useCallback(async (receiptId: string): Promise<PrintSummary> => {
    if (!settings?.isEnabled) {
      return { outcome: 'NOT_STARTED', message: 'Emiterea bonurilor fiscale este dezactivată din Setări financiare.' }
    }
    const token = getBridgeToken()
    if (!token) {
      return { outcome: 'NOT_STARTED', message: 'Acest PC nu este asociat cu fiscal bridge-ul. Introduceți token-ul în Setări financiare → Stația curentă.' }
    }

    setPrintingId(receiptId)
    try {
      return await printFiscalReceipt(receiptId, {
        bridgeUrl: settings.bridgeUrl,
        token,
        bridge: fiscalBridgeApi,
        start: async (id) => {
          const resp = await billingApi.startFiscalReceipt(id)
          if (!resp.data) throw new Error('Bonul nu a putut fi pregătit pentru tipărire.')
          return resp.data
        },
        report: (payload) => billingApi.reportFiscalReceiptResult(payload),
      })
    } catch (err) {
      // Eșec la pornire (ex: bonul nu mai e în așteptare) — serverul a refuzat, nimic trimis la aparat
      return { outcome: 'NOT_STARTED', message: err instanceof Error ? err.message : 'Tipărirea nu a putut porni.' }
    } finally {
      setPrintingId(null)
      await Promise.all([
        qc.invalidateQueries({ queryKey: BILLING_KEY }),
        qc.invalidateQueries({ queryKey: INVOICES_KEY }),
      ])
    }
  }, [settings, qc])

  return { print, printingId, bridgeUrl: settings?.bridgeUrl ?? null }
}

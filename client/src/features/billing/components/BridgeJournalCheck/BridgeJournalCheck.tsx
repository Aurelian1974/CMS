import { useState } from 'react'
import { AppButton } from '@/components/ui/AppButton'
import { fiscalBridgeApi, type BridgeJournalEntry } from '@/api/endpoints/fiscalBridge.api'
import { useFiscalSettings } from '@/features/settings/hooks/useFinancialSettings'
import { formatDateTime } from '@/utils/format'
import { getBridgeToken } from '../../fiscal/bridgeToken'
import styles from './BridgeJournalCheck.module.scss'

const STATE_LABELS: Record<BridgeJournalEntry['state'], string> = {
  Printing: 'tipărire întreruptă (rezultat nesigur)',
  Printed:  'tipărit',
  Failed:   'netipărit (eroare înainte de emitere)',
  Unknown:  'rezultat necunoscut',
}

type CheckState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'missing' }
  | { kind: 'found'; entry: BridgeJournalEntry }

/**
 * Ajutor pentru reconciliere: citește jurnalul local al fiscal bridge-ului pentru bonul dat.
 * Informativ — decizia rămâne a operatorului, după verificarea pe casa de marcat.
 */
export const BridgeJournalCheck = ({ receiptId }: { receiptId: string }) => {
  const { data: settingsResp } = useFiscalSettings()
  const bridgeUrl = settingsResp?.data?.bridgeUrl
  const [state, setState] = useState<CheckState>({ kind: 'idle' })

  const check = async () => {
    const token = getBridgeToken()
    if (!bridgeUrl || !token) {
      setState({ kind: 'error', message: 'Acest PC nu este asociat cu fiscal bridge-ul (Setări financiare → Stația curentă).' })
      return
    }
    setState({ kind: 'loading' })
    try {
      const entry = await fiscalBridgeApi.getJob(bridgeUrl, token, receiptId)
      setState(entry ? { kind: 'found', entry } : { kind: 'missing' })
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Jurnalul nu a putut fi citit.' })
    }
  }

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <span>Jurnalul fiscal bridge-ului de pe acest PC</span>
        <AppButton type="button" size="sm" variant="outline-primary" onClick={() => { void check() }}
          isLoading={state.kind === 'loading'} loadingText="Se verifică…">
          Verifică
        </AppButton>
      </div>
      {state.kind === 'error' && <div className={styles.error}>{state.message}</div>}
      {state.kind === 'missing' && (
        <div>Bridge-ul de pe acest PC <strong>nu a primit</strong> acest bon. Dacă bonul a fost trimis de pe alt PC, verificați acolo.</div>
      )}
      {state.kind === 'found' && (
        <div>
          Stare: <strong>{STATE_LABELS[state.entry.state]}</strong>
          {state.entry.receiptNumber && <> · nr. bon <strong>{state.entry.receiptNumber}</strong></>}
          {' '}· {state.entry.attempts} încercări · actualizat {formatDateTime(state.entry.updatedAt)}
          {state.entry.errorMessage && <div className={styles.muted}>{state.entry.errorMessage}</div>}
        </div>
      )}
    </div>
  )
}

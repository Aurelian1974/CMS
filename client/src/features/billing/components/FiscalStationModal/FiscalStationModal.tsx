import { useEffect, useState } from 'react'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { AppBadge } from '@/components/ui/AppBadge'
import { fiscalBridgeApi, type BridgeDeviceStatus } from '@/api/endpoints/fiscalBridge.api'
import { useFiscalSettings } from '@/features/settings/hooks/useFinancialSettings'
import { clearBridgeToken, getBridgeToken, setBridgeToken } from '../../fiscal/bridgeToken'
import { InlineFeedback } from '../InlineFeedback'
import styles from './FiscalStationModal.module.scss'

interface FiscalStationModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Asocierea PC-ului curent cu fiscal bridge-ul local și verificarea casei de marcat.
 * Token-ul se obține pe PC, cu `ValyanClinic.FiscalBridge.exe --show-token`.
 */
export const FiscalStationModal = ({ isOpen, onClose }: FiscalStationModalProps) => {
  const { data: settingsResp } = useFiscalSettings(isOpen)
  const settings = settingsResp?.data
  const [token, setToken] = useState('')
  const [paired, setPaired] = useState(false)
  const [status, setStatus] = useState<BridgeDeviceStatus | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setPaired(!!getBridgeToken())
    setToken('')
    setStatus(null)
    setError(null)
  }, [isOpen])

  const test = async (value?: string) => {
    const current = value ?? getBridgeToken()
    if (!settings || !current) return
    setChecking(true)
    setError(null)
    try {
      setStatus(await fiscalBridgeApi.getStatus(settings.bridgeUrl, current))
    } catch (err) {
      setStatus(null)
      setError(err instanceof Error ? err.message : 'Fiscal bridge-ul nu răspunde.')
    } finally {
      setChecking(false)
    }
  }

  const pair = async () => {
    if (!token.trim()) return
    setBridgeToken(token)
    setPaired(true)
    setToken('')
    await test(token.trim())
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={600}
      title="Casa de marcat — stația curentă"
      bodyClassName={styles.body}
      footer={<AppButton variant="secondary" onClick={onClose}>Închide</AppButton>}
    >
      <InlineFeedback errorMsg={error} />

      {!settings?.isEnabled && (
        <div className="alert alert-warning py-2 mb-0 small">Emiterea bonurilor fiscale este dezactivată din Setări financiare.</div>
      )}

      <div className={styles.row}>
        <span className={styles.label}>Fiscal bridge</span>
        <code>{settings?.bridgeUrl ?? '—'}</code>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Asociere</span>
        {paired
          ? <AppBadge variant="success" withDot>PC asociat</AppBadge>
          : <AppBadge variant="warning" withDot>Neasociat</AppBadge>}
      </div>

      <div className={styles.pair}>
        <input
          type="password"
          className="form-control"
          placeholder={paired ? 'Token nou (doar dacă a fost regenerat)' : 'Token afișat de --show-token'}
          value={token}
          autoComplete="off"
          onChange={(e) => setToken(e.target.value)}
        />
        <AppButton variant="primary" onClick={() => { void pair() }} disabled={!token.trim()}>Asociază</AppButton>
        {paired && (
          <AppButton variant="ghost" onClick={() => { clearBridgeToken(); setPaired(false); setStatus(null) }}>Dezasociază</AppButton>
        )}
      </div>

      {paired && (
        <div className={styles.statusBox}>
          <div className={styles.row}>
            <span className={styles.label}>Stare aparat</span>
            <AppButton size="sm" variant="outline-primary" onClick={() => { void test() }} isLoading={checking} loadingText="Se verifică…">
              Verifică
            </AppButton>
          </div>
          {status && (
            <>
              <AppBadge variant={status.isReady ? 'success' : 'danger'} withDot>
                {status.isReady ? 'Pregătit pentru tipărire' : status.isConnected ? 'Nu poate tipări' : 'Nu răspunde'}
              </AppBadge>
              {status.model && <div className={styles.muted}>Model: {status.model} · Serie: {status.serialNumber ?? '—'}</div>}
              {status.problems.length > 0 && (
                <ul className={styles.problems}>{status.problems.map((p) => <li key={p}>{p}</li>)}</ul>
              )}
            </>
          )}
        </div>
      )}

      <p className={styles.hint}>
        Token-ul se păstrează doar în acest browser, pe acest PC. Dacă serviciul regenerează token-ul
        (<code>--rotate-token</code>), asociați din nou.
      </p>
    </AppModal>
  )
}

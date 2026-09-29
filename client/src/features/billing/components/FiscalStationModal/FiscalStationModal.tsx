import { useEffect, useState } from 'react'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { AppBadge } from '@/components/ui/AppBadge'
import { fiscalBridgeApi, type BridgeDeviceStatus } from '@/api/endpoints/fiscalBridge.api'
import { useAuthStore } from '@/store/authStore'
import {
  useBridgePairingKey, useCreateBridgePairingTicket, useFiscalSettings,
} from '@/features/settings/hooks/useFinancialSettings'
import { clearBridgeToken, getBridgeToken, setBridgeToken } from '../../fiscal/bridgeToken'
import { InlineFeedback } from '../InlineFeedback'
import styles from './FiscalStationModal.module.scss'

interface FiscalStationModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Asocierea PC-ului curent cu fiscal bridge-ul local și verificarea casei de marcat.
 * Doar administratorul asociază: serverul emite un tichet semnat, bridge-ul îl schimbă pe un token nou.
 */
export const FiscalStationModal = ({ isOpen, onClose }: FiscalStationModalProps) => {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const { data: settingsResp } = useFiscalSettings(isOpen)
  const settings = settingsResp?.data
  const { data: keyResp } = useBridgePairingKey(isOpen && isAdmin)
  const pairingKey = keyResp?.data
  const createTicket = useCreateBridgePairingTicket()
  const [paired, setPaired] = useState(false)
  const [pairing, setPairing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<BridgeDeviceStatus | null>(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setPaired(!!getBridgeToken())
    setStatus(null)
    setError(null)
    setSuccess(null)
    setCopied(false)
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
    if (!settings) return
    setPairing(true)
    setError(null)
    setSuccess(null)
    try {
      const ticket = (await createTicket.mutateAsync()).data?.ticket
      if (!ticket) throw new Error('Tichetul de asociere nu a putut fi emis.')
      const { token } = await fiscalBridgeApi.pair(settings.bridgeUrl, ticket)
      setBridgeToken(token)
      setPaired(true)
      setSuccess('PC-ul a fost asociat cu casa de marcat.')
      await test(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Asocierea a eșuat.')
    } finally {
      setPairing(false)
    }
  }

  const copyKey = async () => {
    if (!pairingKey?.publicKeyPem) return
    await navigator.clipboard.writeText(pairingKey.publicKeyPem)
    setCopied(true)
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
      <InlineFeedback successMsg={success} errorMsg={error} />

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

      {isAdmin ? (
        <div className={styles.pair}>
          <AppButton
            variant="primary"
            onClick={() => { void pair() }}
            isLoading={pairing}
            loadingText="Se asociază…"
            disabled={!settings}
          >
            {paired ? 'Reasociază acest PC' : 'Asociază acest PC'}
          </AppButton>
          {paired && (
            <AppButton variant="ghost" onClick={() => { clearBridgeToken(); setPaired(false); setStatus(null) }}>Dezasociază</AppButton>
          )}
        </div>
      ) : !paired && (
        <div className="alert alert-info py-2 mb-0 small">
          Asocierea acestui PC cu casa de marcat se face de un administrator, din această fereastră.
        </div>
      )}

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

      {isAdmin && pairingKey && (
        <details className={styles.setup}>
          <summary>Configurare bridge la instalare (o singură dată pe PC)</summary>
          {pairingKey.isConfigured && pairingKey.publicKeyPem ? (
            <>
              <p className={styles.hint}>
                Cheia publică de mai jos se pune în <code>Bridge:PairingPublicKey</code> din appsettings.json-ul
                bridge-ului (sau <code>install-service.ps1 -PairingPublicKey</code>), apoi se repornește serviciul.
              </p>
              <pre className={styles.key}>{pairingKey.publicKeyPem}</pre>
              <AppButton size="sm" variant="outline-primary" onClick={() => { void copyKey() }}>
                {copied ? 'Copiat' : 'Copiază cheia'}
              </AppButton>
            </>
          ) : (
            <div className="alert alert-warning py-2 mb-0 small">
              Cheia de asociere nu este configurată pe server (<code>FiscalBridge:PairingPrivateKey</code>).
            </div>
          )}
        </details>
      )}

      <p className={styles.hint}>
        Asocierea se păstrează doar în acest browser, pe acest PC. O reasociere invalidează asocierea anterioară a PC-ului.
      </p>
    </AppModal>
  )
}

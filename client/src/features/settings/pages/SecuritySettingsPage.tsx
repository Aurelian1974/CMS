import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppButton } from '@/components/ui/AppButton'
import { AppModal } from '@/components/ui/AppModal'
import { useSecuritySettings, useSaveGlobalSettings, useSaveRoleSettings } from '../hooks/useSecuritySettings'
import type { GlobalSecuritySettings, SecurityLimits } from '../types/settings.types'
import styles from './SecuritySettingsPage.module.scss'

/** Câmp numeric cu prag minim afișat, ca administratorul să știe de ce nu poate coborî. */
const NumberField = ({
  label, value, onChange, min, max, hint, disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  hint?: string
  disabled?: boolean
}) => (
  <label className={styles.field}>
    <span className={styles.fieldLabel}>{label}</span>
    <input
      type="number"
      className="form-control"
      value={value}
      min={min}
      max={max}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    {hint && <span className={styles.hint}>{hint}</span>}
  </label>
)

/**
 * Administrarea politicilor de securitate.
 *
 * Trei secțiuni: politica de parole, sesiunile per rol și pragurile de blocare plus
 * retenția. Pragurile minime vin de la server, deci formularul validează cu exact
 * aceleași valori pe care le impune backend-ul.
 */
export const SecuritySettingsPage = () => {
  const { data, isLoading, isError, error } = useSecuritySettings()
  const saveGlobal = useSaveGlobalSettings()
  const saveRole = useSaveRoleSettings()

  const [form, setForm] = useState<GlobalSecuritySettings | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [idleMinutes, setIdleMinutes] = useState(30)
  const [refreshDays, setRefreshDays] = useState(7)
  const [notice, setNotice] = useState<string | null>(null)

  /**
   * Confirmarea modificărilor disruptive se face printr-un modal, nu prin
   * `window.confirm`: dialogul nativ nu se poate stiliza, e blocat în unele
   * contexte (inclusiv în browsere automate, unde întoarce tăcut `false`) și ar
   * face acțiunea să eșueze fără ca administratorul să înțeleagă de ce.
   */
  const [pendingConfirm, setPendingConfirm] = useState<
    { messages: string[]; onConfirm: () => void } | null
  >(null)

  useEffect(() => {
    if (!data) return
    setForm(data.global)
    if (!selectedRoleId && data.roles.length > 0) setSelectedRoleId(data.roles[0].roleId)
  }, [data, selectedRoleId])

  const selectedRole = useMemo(
    () => data?.roles.find((r) => r.roleId === selectedRoleId) ?? null,
    [data, selectedRoleId],
  )

  useEffect(() => {
    if (!selectedRole) return
    setIdleMinutes(selectedRole.idleTimeoutMinutes)
    setRefreshDays(selectedRole.refreshTokenDays)
  }, [selectedRole])

  if (isLoading) return <div className="p-4">Se încarcă setările...</div>
  if (isError) return <div className="alert alert-danger m-4">{(error as Error).message}</div>
  if (!data || !form) return null

  const limits: SecurityLimits = data.limits
  const set = <K extends keyof GlobalSecuritySettings>(key: K, value: GlobalSecuritySettings[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f))

  /**
   * Modificările care deconectează utilizatori merită avertisment explicit: altfel
   * administratorul află efectul de la colegi, nu din interfață.
   */
  const disruptiveWarnings = () => {
    const w: string[] = []
    if (form.passwordExpiryDays > 0 && data.global.passwordExpiryDays === 0)
      w.push('Activarea expirării parolei va cere schimbarea parolei tuturor utilizatorilor cu parole mai vechi decât intervalul ales.')
    if (form.maxFailedLoginAttempts < data.global.maxFailedLoginAttempts)
      w.push('Scăderea numărului de încercări permise va bloca conturile mai repede.')
    return w
  }

  const doSaveGlobal = () => {
    const { passwordBlocklistEnabled: _blocklist, updatedAt: _at, updatedBy: _by, ...payload } = form
    saveGlobal.mutate(payload, {
      onSuccess: () => setNotice('Setările globale au fost salvate.'),
      onError: (e: Error) => setNotice(e.message),
    })
  }

  const handleSaveGlobal = () => {
    const warnings = disruptiveWarnings()
    if (warnings.length > 0) {
      setPendingConfirm({ messages: warnings, onConfirm: doSaveGlobal })
      return
    }
    doSaveGlobal()
  }

  const handleSaveRole = () => {
    if (!selectedRole) return

    const doSave = () =>
      saveRole.mutate(
        { roleId: selectedRole.roleId, idleTimeoutMinutes: idleMinutes, refreshTokenDays: refreshDays },
        {
          onSuccess: () => setNotice(`Setările pentru „${selectedRole.roleName}” au fost salvate.`),
          onError: (e: Error) => setNotice(e.message),
        },
      )

    if (idleMinutes < selectedRole.idleTimeoutMinutes) {
      setPendingConfirm({
        messages: [
          `Scurtarea ferestrei de inactivitate pentru „${selectedRole.roleName}” va deconecta ` +
          'mai devreme utilizatorii cu acest rol.',
        ],
        onConfirm: doSave,
      })
      return
    }

    doSave()
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Setări de securitate" />

      {notice && (
        <div className="alert alert-info py-2" role="status" onClick={() => setNotice(null)}>
          {notice}
        </div>
      )}

      {/* ===== Politica de parole ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Politica de parole</h2>
        <p className={styles.sectionNote}>
          Cerințele de compoziție sunt oprite când valoarea e 0. Lista de parole
          frecvente este întotdeauna activă și nu poate fi dezactivată.
        </p>

        <div className={styles.grid}>
          <NumberField
            label="Lungime minimă" value={form.passwordMinLength}
            onChange={(v) => set('passwordMinLength', v)}
            min={limits.minPasswordLength} max={limits.maxPasswordLength}
            hint={`minim impus: ${limits.minPasswordLength}`}
          />
          <NumberField
            label="Lungime maximă" value={form.passwordMaxLength}
            onChange={(v) => set('passwordMaxLength', v)}
            min={limits.minPasswordLength} max={limits.maxPasswordLength}
          />
          <NumberField
            label="Cifre" value={form.passwordMinDigits}
            onChange={(v) => set('passwordMinDigits', v)} min={0}
            hint="0 = fără cerință"
          />
          <NumberField
            label="Caractere speciale" value={form.passwordMinSpecial}
            onChange={(v) => set('passwordMinSpecial', v)} min={0}
            hint="0 = fără cerință"
          />
          <NumberField
            label="Litere mari" value={form.passwordMinUppercase}
            onChange={(v) => set('passwordMinUppercase', v)} min={0}
            hint="0 = fără cerință"
          />
          <NumberField
            label="Litere mici" value={form.passwordMinLowercase}
            onChange={(v) => set('passwordMinLowercase', v)} min={0}
            hint="0 = fără cerință"
          />
          <NumberField
            label="Parole reținute în istoric" value={form.passwordHistoryCount}
            onChange={(v) => set('passwordHistoryCount', v)} min={0}
            hint="0 = reutilizarea e permisă"
          />
          <NumberField
            label="Expirare parolă (zile)" value={form.passwordExpiryDays}
            onChange={(v) => set('passwordExpiryDays', v)} min={0}
            hint="0 = parola nu expiră"
          />
        </div>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={form.passwordForbidIdentityValues}
            onChange={(e) => set('passwordForbidIdentityValues', e.target.checked)}
          />
          <span>Interzice parola identică cu emailul, username-ul sau numele</span>
        </label>
      </section>

      {/* ===== Sesiuni per rol ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Sesiuni per rol</h2>
        <p className={styles.sectionNote}>
          Fereastra de inactivitate se măsoară de la ultima schimbare de ecran.
          Mișcarea mouse-ului și click-urile oarecare nu contează ca activitate.
        </p>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Rol</span>
          <select
            className="form-select"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
          >
            {data.roles.map((r) => (
              <option key={r.roleId} value={r.roleId}>
                {r.roleName} — {r.idleTimeoutMinutes} min
              </option>
            ))}
          </select>
        </label>

        <div className={styles.grid}>
          <NumberField
            label="Inactivitate (minute)" value={idleMinutes} onChange={setIdleMinutes}
            min={limits.minIdleTimeoutMinutes} max={limits.maxIdleTimeoutMinutes}
            hint={`între ${limits.minIdleTimeoutMinutes} și ${limits.maxIdleTimeoutMinutes}`}
          />
          <NumberField
            label="Durată sesiune reluabilă (zile)" value={refreshDays} onChange={setRefreshDays}
            min={limits.minRefreshTokenDays} max={limits.maxRefreshTokenDays}
            hint={`între ${limits.minRefreshTokenDays} și ${limits.maxRefreshTokenDays}`}
          />
        </div>

        <AppButton
          variant="primary"
          onClick={handleSaveRole}
          isLoading={saveRole.isPending}
          disabled={!selectedRole}
        >
          Salvează rolul
        </AppButton>
      </section>

      {/* ===== Blocare cont și retenție ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Blocare cont și retenție</h2>

        <div className={styles.grid}>
          <NumberField
            label="Încercări eșuate permise" value={form.maxFailedLoginAttempts}
            onChange={(v) => set('maxFailedLoginAttempts', v)}
            min={limits.minFailedLoginAttempts}
            hint={`minim impus: ${limits.minFailedLoginAttempts}`}
          />
          <NumberField
            label="Durată blocare (minute)" value={form.lockoutMinutes}
            onChange={(v) => set('lockoutMinutes', v)} min={limits.minLockoutMinutes}
          />
          <NumberField
            label="Retenție jurnal securitate (zile)" value={form.securityEventRetentionDays}
            onChange={(v) => set('securityEventRetentionDays', v)}
            min={limits.minSecurityEventRetentionDays}
            hint={`minim impus: ${limits.minSecurityEventRetentionDays}`}
          />
          <NumberField
            label="Retenție token-uri expirate (zile)" value={form.refreshTokenRetentionDays}
            onChange={(v) => set('refreshTokenRetentionDays', v)}
            min={limits.minRefreshTokenRetentionDays}
          />
        </div>
      </section>

      <div className={styles.actions}>
        <AppButton variant="primary" onClick={handleSaveGlobal} isLoading={saveGlobal.isPending}>
          Salvează setările globale
        </AppButton>
      </div>

      {pendingConfirm && (
        <AppModal
          isOpen
          onClose={() => setPendingConfirm(null)}
          maxWidth={480}
          title="Confirmați modificarea"
          footer={
            <>
              <AppButton variant="outline-secondary" onClick={() => setPendingConfirm(null)}>
                Anulează
              </AppButton>
              <AppButton
                variant="primary"
                onClick={() => {
                  pendingConfirm.onConfirm()
                  setPendingConfirm(null)
                }}
              >
                Continuă
              </AppButton>
            </>
          }
        >
          {pendingConfirm.messages.map((m) => (
            <p key={m} className="mb-2">{m}</p>
          ))}
        </AppModal>
      )}
    </div>
  )
}

export default SecuritySettingsPage

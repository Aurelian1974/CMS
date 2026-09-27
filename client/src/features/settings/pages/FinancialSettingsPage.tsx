import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppButton } from '@/components/ui/AppButton'
import { AppBadge } from '@/components/ui/AppBadge'
import { FeedbackAlerts } from '@/components/ui/FeedbackAlerts'
import { useFeedback } from '@/hooks/useFeedback'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { formatDateTime, formatNumber } from '@/utils/format'
import {
  useCreateInvoiceSeries, useFiscalSettings, useInvoiceSeries, useUpdateFiscalSettings, useUpdateInvoiceSeries,
} from '../hooks/useFinancialSettings'
import {
  fiscalSettingsSchema, invoiceSeriesSchema, type FiscalSettingsFormData, type InvoiceSeriesFormData,
} from '../schemas/financialSettings.schema'
import type { InvoiceSeriesDto } from '../types/financialSettings.types'
import styles from './FinancialSettingsPage.module.scss'

/**
 * Setări financiare: statutul TVA al clinicii, casa de marcat (mapări TVA / plăți, adresa bridge-ului)
 * și seriile de facturi. Secretele aparatului (port, parolă operator) nu ajung aici — stau în
 * configurația fiscal bridge-ului de pe PC-ul de la recepție.
 */
export const FinancialSettingsPage = () => {
  const { hasFull } = useHasAccess()
  const canEdit = hasFull(MODULE.Invoices)
  const { successMsg, errorMsg, showSuccess, showError, setSuccessMsg, setErrorMsg } = useFeedback()

  const { data: fiscalResp, isLoading: fiscalLoading, isError: fiscalError } = useFiscalSettings()
  const { data: seriesResp } = useInvoiceSeries()
  const fiscal = fiscalResp?.data
  const series = seriesResp?.data ?? []

  const updateFiscal = useUpdateFiscalSettings()
  const createSeries = useCreateInvoiceSeries()
  const updateSeries = useUpdateInvoiceSeries()

  const fiscalForm = useForm<FiscalSettingsFormData>({ resolver: zodResolver(fiscalSettingsSchema) })
  const seriesForm = useForm<InvoiceSeriesFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(invoiceSeriesSchema) as any,
    defaultValues: { series: '', startNumber: 1, isDefault: false },
  })

  useEffect(() => {
    if (!fiscal) return
    fiscalForm.reset({
      isEnabled: fiscal.isEnabled,
      isVatPayer: fiscal.isVatPayer,
      bridgeUrl: fiscal.bridgeUrl,
      vatMappings: fiscal.vatMappings.map((m) => ({ vatRateId: m.vatRateId, taxGroup: m.taxGroup ?? '' })),
      paymentMappings: fiscal.paymentMappings.map((m) => ({ paymentMethodId: m.paymentMethodId, devicePaymentCode: m.devicePaymentCode ?? '' })),
    })
  }, [fiscal, fiscalForm])

  const fe = fiscalForm.formState.errors

  const saveFiscal = (d: FiscalSettingsFormData) => updateFiscal.mutate(
    {
      isEnabled: d.isEnabled,
      isVatPayer: d.isVatPayer,
      bridgeUrl: d.bridgeUrl.trim(),
      vatMappings: d.vatMappings.map((m) => ({ vatRateId: m.vatRateId, taxGroup: m.taxGroup.trim() })),
      paymentMappings: d.paymentMappings.map((m) => ({ paymentMethodId: m.paymentMethodId, devicePaymentCode: m.devicePaymentCode.trim() })),
    },
    { onSuccess: () => showSuccess('Setările fiscale au fost salvate.'), onError: showError },
  )

  const addSeries = (d: InvoiceSeriesFormData) => createSeries.mutate(
    { series: d.series.trim().toUpperCase(), startNumber: d.startNumber, isDefault: d.isDefault },
    {
      onSuccess: () => { seriesForm.reset({ series: '', startNumber: 1, isDefault: false }); showSuccess('Seria a fost adăugată.') },
      onError: showError,
    },
  )

  const changeSeries = (s: InvoiceSeriesDto, patch: Partial<Pick<InvoiceSeriesDto, 'isDefault' | 'isActive'>>) =>
    updateSeries.mutate(
      { id: s.id, isDefault: patch.isDefault ?? s.isDefault, isActive: patch.isActive ?? s.isActive },
      { onSuccess: () => showSuccess(`Seria ${s.series} a fost actualizată.`), onError: showError },
    )

  if (fiscalError) {
    return (
      <div className={styles.page}>
        <div className="alert alert-danger m-4">Setările financiare nu au putut fi încărcate.</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Setări financiare" subtitle="TVA, casa de marcat și seriile de facturi" />

      {!canEdit && (
        <div className="alert alert-info py-2">Vizualizare — modificările necesită drepturi complete pe modulul Facturi.</div>
      )}

      {fiscalLoading || !fiscal ? (
        <div className={styles.section}>Se încarcă…</div>
      ) : (
        <form onSubmit={fiscalForm.handleSubmit(saveFiscal)}>
          <fieldset disabled={!canEdit} className={styles.fieldset}>
            {/* ===== TVA ===== */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Statut TVA</h2>
              <p className={styles.sectionNote}>
                Apare pe facturi în datele furnizorului. Cota aplicată fiecărui serviciu se alege din nomenclatorul de
                tarife (regim TVA) — serviciile medicale sunt de regulă scutite (art. 292 Cod fiscal). Confirmați cu
                contabilul înainte de modificare.
              </p>
              <label className={styles.check}>
                <input type="checkbox" {...fiscalForm.register('isVatPayer')} />
                <span>Clinica este plătitoare de TVA</span>
              </label>
            </section>

            {/* ===== Casa de marcat ===== */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Casa de marcat</h2>
              <p className={styles.sectionNote}>
                Bonul se tipărește prin fiscal bridge — serviciul instalat pe PC-ul de la recepție, la care e conectată
                casa de marcat. Portul, viteza și parola operatorului se configurează în bridge, nu aici.
                {fiscal.updatedAt && <> Ultima modificare: {formatDateTime(fiscal.updatedAt)}.</>}
              </p>

              <div className={styles.grid}>
                <label className={styles.check}>
                  <input type="checkbox" {...fiscalForm.register('isEnabled')} />
                  <span>Emite bon fiscal la încasările în numerar / card</span>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Adresa fiscal bridge (pe PC-ul local)</span>
                  <input className="form-control" placeholder="http://127.0.0.1:5199" {...fiscalForm.register('bridgeUrl')} />
                  {fe.bridgeUrl && <span className={styles.error}>{fe.bridgeUrl.message}</span>}
                </label>
              </div>

              <div className={styles.mappings}>
                <div>
                  <h3 className={styles.subTitle}>Grupe TVA pe aparat</h3>
                  <table className={styles.table}>
                    <thead><tr><th>Regim TVA</th><th className={styles.right}>Cotă</th><th>Grupă aparat</th></tr></thead>
                    <tbody>
                      {fiscal.vatMappings.map((m, i) => (
                        <tr key={m.vatRateId}>
                          <td>{m.vatRateName}</td>
                          <td className={styles.right}>{formatNumber(m.percent, 0)}%</td>
                          <td>
                            <input className={`form-control form-control-sm ${styles.codeInput}`} maxLength={5}
                              aria-label={`Grupa TVA pentru ${m.vatRateName}`} placeholder="ex: A"
                              {...fiscalForm.register(`vatMappings.${i}.taxGroup`)} />
                            {fe.vatMappings?.[i]?.taxGroup && <span className={styles.error}>{fe.vatMappings[i]?.taxGroup?.message}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3 className={styles.subTitle}>Tipuri de plată pe aparat</h3>
                  <table className={styles.table}>
                    <thead><tr><th>Metodă</th><th>Cod aparat</th></tr></thead>
                    <tbody>
                      {fiscal.paymentMappings.map((m, i) => (
                        <tr key={m.paymentMethodId}>
                          <td>{m.paymentMethodName}</td>
                          <td>
                            <input className={`form-control form-control-sm ${styles.codeInput}`} maxLength={5}
                              aria-label={`Codul aparatului pentru ${m.paymentMethodName}`} placeholder="ex: P"
                              {...fiscalForm.register(`paymentMappings.${i}.devicePaymentCode`)} />
                            {fe.paymentMappings?.[i]?.devicePaymentCode && <span className={styles.error}>{fe.paymentMappings[i]?.devicePaymentCode?.message}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className={styles.hint}>
                Valorile depind de programarea aparatului — se confirmă cu service-ul casei de marcat. O încasare cu
                bon fiscal este refuzată dacă regimul TVA sau metoda de plată nu are corespondent aici.
              </p>

              {canEdit && (
                <div className={styles.actions}>
                  <AppButton type="submit" variant="primary" isLoading={updateFiscal.isPending} loadingText="Se salvează…">
                    Salvează
                  </AppButton>
                </div>
              )}
            </section>
          </fieldset>
        </form>
      )}

      {/* ===== Serii facturi ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Serii facturi</h2>
        <p className={styles.sectionNote}>
          Numerotarea e continuă, fără goluri, per serie. Seriile folosite nu se pot șterge — doar dezactiva.
          Stornările se emit în seria facturii stornate.
        </p>

        <table className={styles.table}>
          <thead>
            <tr><th>Serie</th><th className={styles.right}>Ultimul număr</th><th className={styles.right}>Facturi</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.id}>
                <td className={styles.strong}>{s.series}</td>
                <td className={styles.right}>{s.lastNumber}</td>
                <td className={styles.right}>{s.invoiceCount}</td>
                <td>
                  {s.isDefault && <AppBadge variant="primary" className="me-1">Implicită</AppBadge>}
                  <AppBadge variant={s.isActive ? 'success' : 'neutral'} withDot>{s.isActive ? 'Activă' : 'Inactivă'}</AppBadge>
                </td>
                <td className={styles.right}>
                  {canEdit && !s.isDefault && s.isActive && (
                    <button type="button" className={styles.link} disabled={updateSeries.isPending}
                      onClick={() => changeSeries(s, { isDefault: true })}>Setează implicită</button>
                  )}
                  {canEdit && !s.isDefault && (
                    <button type="button" className={styles.link} disabled={updateSeries.isPending}
                      onClick={() => changeSeries(s, { isActive: !s.isActive })}>{s.isActive ? 'Dezactivează' : 'Activează'}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {canEdit && (
          <form className={styles.addSeries} onSubmit={seriesForm.handleSubmit(addSeries)}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Serie nouă</span>
              <input className="form-control" maxLength={10} placeholder="ex: FCT" {...seriesForm.register('series')} />
              {seriesForm.formState.errors.series && <span className={styles.error}>{seriesForm.formState.errors.series.message}</span>}
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Primul număr</span>
              <input type="number" className="form-control" min={1} {...seriesForm.register('startNumber')} />
              {seriesForm.formState.errors.startNumber && <span className={styles.error}>{seriesForm.formState.errors.startNumber.message}</span>}
            </label>
            <label className={styles.check}>
              <input type="checkbox" {...seriesForm.register('isDefault')} />
              <span>Implicită</span>
            </label>
            <AppButton type="submit" variant="outline-primary" isLoading={createSeries.isPending} loadingText="Se adaugă…">
              Adaugă serie
            </AppButton>
          </form>
        )}
      </section>

      <FeedbackAlerts
        successMsg={successMsg}
        errorMsg={errorMsg}
        onDismissSuccess={() => setSuccessMsg(null)}
        onDismissError={() => setErrorMsg(null)}
      />
    </div>
  )
}

export default FinancialSettingsPage

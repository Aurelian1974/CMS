import { useEffect, useState } from 'react'
import { useFeedback } from '@/hooks/useFeedback'
import { InlineFeedback } from '../InlineFeedback'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { AppBadge, type BadgeVariant } from '@/components/ui/AppBadge'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { downloadBlob } from '@/utils/download'
import { invoicesApi } from '@/api/endpoints/invoices.api'
import { useBillingLookups } from '@/features/tariffs/hooks/useTariffs'
import { useBillingServiceMutations, useCancelPayment, useConsultationBilling } from '../../hooks/useBilling'
import {
  PAYMENT_STATUS_LABELS, RECEIPT_STATUS, formatInvoiceNumber, invoiceStatusVariant,
  paymentStatusVariant, receiptIsUnresolved, receiptStatusVariant,
} from '../../constants/billing.constants'
import type { CreatePaymentResult, FiscalReceiptListDto, PaymentDto } from '../../types/billing.types'
import { ServiceLinesEditor } from '../ServiceLinesEditor'
import { CollectPaymentModal } from '../CollectPaymentModal'
import { IssueInvoiceModal } from '../IssueInvoiceModal'
import { ReasonModal } from '../ReasonModal'
import { ReconcileReceiptModal } from '../ReconcileReceiptModal'
import styles from './ConsultationBillingModal.module.scss'

export interface ConsultationBillingModalProps {
  consultationId: string | null
  onClose: () => void
  /** Acțiunile pe un bon netipărit (tipărire prin fiscal bridge). */
  renderReceiptActions?: (receipt: FiscalReceiptListDto) => React.ReactNode
  /** Apelat după o plată care a generat bon fiscal — pornește tipărirea. */
  onReceiptCreated?: (receiptId: string) => void
}

const consultationStatusVariant = (code: string): BadgeVariant =>
  code === 'FACTURATA' ? 'info' : code === 'FINALIZATA' ? 'success' : code === 'BLOCATA' ? 'danger' : 'warning'

/** Fișa de încasare a unei consultații: servicii, plăți, bonuri fiscale, facturi. */
export const ConsultationBillingModal = ({
  consultationId, onClose, renderReceiptActions, onReceiptCreated,
}: ConsultationBillingModalProps) => {
  const { canWrite, canRead } = useHasAccess()
  const { successMsg, errorMsg, showSuccess, showError, clearMessages } = useFeedback()
  const [cancelError, setCancelError] = useState<string | null>(null)
  const canCollect = canWrite(MODULE.Payments)
  const canInvoice = canWrite(MODULE.Invoices)
  const canReadInvoices = canRead(MODULE.Invoices)

  const { data: resp, isLoading, isError } = useConsultationBilling(consultationId)
  const billing = resp?.data ?? null
  const { data: lookupsResp } = useBillingLookups()
  const lookups = lookupsResp?.data

  const { add, update, remove } = useBillingServiceMutations()
  const cancelPayment = useCancelPayment()

  const [collectOpen, setCollectOpen] = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<PaymentDto | null>(null)
  const [reconcileId, setReconcileId] = useState<string | null>(null)

  const busy = add.isPending || update.isPending || remove.isPending
  const receiptById = new Map((billing?.fiscalReceipts ?? []).map((r) => [r.id, r]))

  // Mesajele unei consultații nu se păstrează la deschiderea alteia
  useEffect(() => { clearMessages() }, [consultationId, clearMessages])

  const handlePaymentDone = (result: CreatePaymentResult) => {
    setCollectOpen(false)
    showSuccess(result.isDuplicate ? 'Plata fusese deja înregistrată.' : 'Plata a fost înregistrată.')
    if (result.fiscalReceiptId && !result.isDuplicate) onReceiptCreated?.(result.fiscalReceiptId)
  }

  const handleDownloadPdf = async (id: string, series: string, number: number) => {
    try {
      downloadBlob(await invoicesApi.getPdf(id), `factura_${series}_${number}.pdf`)
    } catch (err) {
      showError(err)
    }
  }

  // O plată cu bon tipărit sau în curs de clarificare nu se mai anulează (Payment_Cancel → 50634 / 50644)
  const canCancelPayment = (p: PaymentDto) => {
    if (p.isCancelled || !canCollect) return false
    const receipt = p.fiscalReceiptId ? receiptById.get(p.fiscalReceiptId) : undefined
    return !receipt || (receipt.statusCode !== RECEIPT_STATUS.Printed && !receiptIsUnresolved(receipt.statusCode))
  }

  return (
    <>
      <AppModal
        isOpen={!!consultationId}
        onClose={onClose}
        maxWidth={980}
        title={billing ? `Încasare — ${billing.patientName}` : 'Încasare'}
        bodyClassName={styles.body}
        footer={
          <>
            <AppButton variant="secondary" onClick={onClose}>Închide</AppButton>
            {billing && canInvoice && billing.canInvoice && (
              <AppButton variant="outline-primary" onClick={() => setInvoiceOpen(true)}>Emite factură</AppButton>
            )}
            {billing && canCollect && billing.canCollect && (
              <AppButton variant="primary" onClick={() => setCollectOpen(true)}>
                Încasează {formatCurrency(billing.balance)}
              </AppButton>
            )}
          </>
        }
      >
        {isError ? (
          <div className="alert alert-danger mb-0">Situația financiară nu a putut fi încărcată.</div>
        ) : isLoading || !billing ? (
          <div className={styles.muted}>Se încarcă…</div>
        ) : (
          <>
            <InlineFeedback successMsg={successMsg} errorMsg={errorMsg} />
            <div className={styles.summary}>
              <div>
                <div className={styles.label}>Consultație</div>
                <div className={styles.value}>{formatDateTime(billing.date)} · {billing.doctorName}</div>
                <AppBadge variant={consultationStatusVariant(billing.statusCode)} withDot>{billing.statusName}</AppBadge>
              </div>
              <div>
                <div className={styles.label}>Total</div>
                <div className={styles.valueStrong}>{formatCurrency(billing.total)}</div>
              </div>
              <div>
                <div className={styles.label}>Încasat</div>
                <div className={styles.value}>{formatCurrency(billing.paid)}</div>
              </div>
              <div>
                <div className={styles.label}>Rest de plată</div>
                <div className={styles.valueStrong}>{formatCurrency(billing.balance)}</div>
                <AppBadge variant={paymentStatusVariant(billing.paymentStatus)} withDot>
                  {PAYMENT_STATUS_LABELS[billing.paymentStatus] ?? billing.paymentStatus}
                </AppBadge>
              </div>
            </div>

            <section>
              <h6 className={styles.sectionTitle}>Servicii</h6>
              <ServiceLinesEditor
                lines={billing.lines}
                total={billing.total}
                canEdit={canCollect && billing.canEditServices}
                busy={busy}
                readOnlyHint={billing.canEditServices ? undefined
                  : 'Serviciile nu mai pot fi modificate după emiterea unui document fiscal. Corecțiile se fac prin stornare.'}
                onAdd={(medicalServiceId, quantity) => add.mutate(
                  { consultationId: billing.consultationId, medicalServiceId, quantity }, { onError: showError })}
                onUpdateQuantity={(id, quantity) => update.mutate({ id, quantity }, { onError: showError })}
                onDelete={(id) => remove.mutate(id, { onError: showError })}
              />
            </section>

            <section>
              <h6 className={styles.sectionTitle}>Plăți</h6>
              {billing.payments.length === 0 ? (
                <p className={styles.muted}>Nicio plată înregistrată.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr><th>Data</th><th>Metodă</th><th>Operator</th><th className={styles.right}>Sumă</th><th>Status</th><th /></tr>
                  </thead>
                  <tbody>
                    {billing.payments.map((p) => (
                      <tr key={p.id} className={p.isCancelled ? styles.cancelledRow : undefined}>
                        <td>{formatDateTime(p.paidAt)}</td>
                        <td>{p.tenders.map((t) => `${t.paymentMethodName} ${formatCurrency(t.amount)}`).join(' + ')}</td>
                        <td>{p.operatorName ?? '—'}</td>
                        <td className={styles.right}>{formatCurrency(p.amount)}</td>
                        <td>
                          {p.isCancelled
                            ? <span title={p.cancelReason ?? undefined}><AppBadge variant="neutral">Anulată</AppBadge></span>
                            : <AppBadge variant="success">Încasată</AppBadge>}
                        </td>
                        <td className={styles.right}>
                          {canCancelPayment(p) && (
                            <button type="button" className={styles.linkDanger} onClick={() => setCancelTarget(p)}>Anulează</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {billing.fiscalReceipts.length > 0 && (
              <section>
                <h6 className={styles.sectionTitle}>Bonuri fiscale</h6>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Creat</th><th>Nr. bon</th><th className={styles.right}>Sumă</th><th>Status</th><th>Detalii</th><th /></tr>
                  </thead>
                  <tbody>
                    {billing.fiscalReceipts.map((r) => (
                      <tr key={r.id}>
                        <td>{formatDateTime(r.createdAt)}</td>
                        <td>{r.receiptNumber ?? '—'}</td>
                        <td className={styles.right}>{formatCurrency(r.amount)}</td>
                        <td><AppBadge variant={receiptStatusVariant(r.statusCode)} withDot>{r.statusName}</AppBadge></td>
                        <td className={styles.small}>
                          {r.printedAt && <>Tipărit {formatDateTime(r.printedAt)}</>}
                          {r.isManuallyReconciled && <> · reconciliat manual</>}
                          {r.lastError && <div className={styles.errorText}>{r.lastError}</div>}
                          {r.attemptCount > 1 && <div>{r.attemptCount} încercări</div>}
                        </td>
                        <td className={styles.right}>
                          {canCollect && receiptIsUnresolved(r.statusCode) && (
                            <button type="button" className={styles.linkPrimary} onClick={() => setReconcileId(r.id)}>Reconciliere</button>
                          )}
                          {canCollect && (r.statusCode === RECEIPT_STATUS.Pending || r.statusCode === RECEIPT_STATUS.Failed)
                            && renderReceiptActions?.(r)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {billing.invoices.length > 0 && (
              <section>
                <h6 className={styles.sectionTitle}>Facturi</h6>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Număr</th><th>Data</th><th>Client</th><th className={styles.right}>Total</th><th>Status</th><th /></tr>
                  </thead>
                  <tbody>
                    {billing.invoices.map((i) => (
                      <tr key={i.id}>
                        <td className={styles.strong}>{formatInvoiceNumber(i.series, i.number)}{i.isStorno && <span className={styles.small}> (storno)</span>}</td>
                        <td>{formatDate(i.issueDate)}</td>
                        <td>{i.customerName}</td>
                        <td className={styles.right}>{formatCurrency(i.total)}</td>
                        <td><AppBadge variant={invoiceStatusVariant(i.statusCode)} withDot>{i.statusName}</AppBadge></td>
                        <td className={styles.right}>
                          {canReadInvoices && (
                            <button type="button" className={styles.linkPrimary}
                              onClick={() => { void handleDownloadPdf(i.id, i.series, i.number) }}>PDF</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </>
        )}
      </AppModal>

      {/* Dialogurile secundare sunt frați ai modalului principal, nu copii — altfel ar moșteni transformarea de drag */}
      <CollectPaymentModal
        billing={collectOpen ? billing : null}
        paymentMethods={lookups?.paymentMethods ?? []}
        onClose={() => setCollectOpen(false)}
        onDone={handlePaymentDone}
      />

      <IssueInvoiceModal
        billing={invoiceOpen ? billing : null}
        series={lookups?.invoiceSeries ?? []}
        vatRates={lookups?.vatRates ?? []}
        onClose={() => setInvoiceOpen(false)}
        onDone={(r) => { setInvoiceOpen(false); showSuccess(r.isDuplicate ? 'Factura fusese deja emisă.' : 'Factura a fost emisă.') }}
      />

      <ReasonModal
        isOpen={!!cancelTarget}
        title="Anulare plată"
        description={cancelTarget && (
          <>Plata de <strong>{formatCurrency(cancelTarget.amount)}</strong> din {formatDateTime(cancelTarget.paidAt)} va fi
            marcată ca anulată. Bonul fiscal netipărit asociat se anulează și el. Operația rămâne în jurnalul de audit.</>
        )}
        confirmLabel="Anulează plata"
        isLoading={cancelPayment.isPending}
        error={cancelError}
        onClose={() => { setCancelTarget(null); setCancelError(null) }}
        onConfirm={(reason) => cancelPayment.mutate(
          { id: cancelTarget!.id, reason },
          {
            onSuccess: () => { setCancelTarget(null); setCancelError(null); showSuccess('Plata a fost anulată.') },
            onError: (err) => setCancelError(err instanceof Error ? err.message : 'Plata nu a putut fi anulată.'),
          },
        )}
      />

      <ReconcileReceiptModal
        receiptId={reconcileId}
        onClose={() => setReconcileId(null)}
        onDone={(printed) => {
          setReconcileId(null)
          showSuccess(printed ? 'Bonul a fost confirmat ca tipărit.' : 'Bonul a fost marcat ca netipărit — poate fi retipărit.')
        }}
      />
    </>
  )
}

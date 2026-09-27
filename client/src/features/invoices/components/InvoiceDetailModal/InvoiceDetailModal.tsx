import { useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { AppBadge } from '@/components/ui/AppBadge'
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/utils/format'
import { downloadBlob } from '@/utils/download'
import { invoicesApi } from '@/api/endpoints/invoices.api'
import { ReasonModal } from '@/features/billing/components/ReasonModal'
import { formatInvoiceNumber, invoiceStatusVariant } from '@/features/billing/constants/billing.constants'
import { useInvoice, useStornoInvoice } from '../../hooks/useInvoices'
import { useFeedback } from '@/hooks/useFeedback'
import { InlineFeedback } from '@/features/billing/components/InlineFeedback'
import styles from './InvoiceDetailModal.module.scss'

interface InvoiceDetailModalProps {
  invoiceId: string | null
  canStorno: boolean
  onClose: () => void
  onNavigate: (invoiceId: string) => void
}

export const InvoiceDetailModal = ({ invoiceId, canStorno, onClose, onNavigate }: InvoiceDetailModalProps) => {
  const { data: resp, isLoading } = useInvoice(invoiceId)
  const invoice = resp?.data
  const storno = useStornoInvoice()
  const { successMsg, errorMsg, showSuccess, showError, clearMessages } = useFeedback()
  const [stornoError, setStornoError] = useState<string | null>(null)

  // Mesajul de succes al stornării rămâne vizibil pe factura storno, dar nu și după închidere
  useEffect(() => { if (!invoiceId) clearMessages() }, [invoiceId, clearMessages])
  const [stornoOpen, setStornoOpen] = useState(false)
  // Cheia se generează la deschiderea confirmării — un retry nu emite a doua factură storno
  const [stornoKey, setStornoKey] = useState('')
  const [downloading, setDownloading] = useState(false)

  // Rezumatul TVA pe cote — cerință de conținut a facturii (art. 319 Cod fiscal)
  const vatSummary = useMemo(() => {
    const map = new Map<string, { label: string; net: number; vat: number }>()
    for (const l of invoice?.lines ?? []) {
      const key = `${l.vatCategoryCode}-${l.vatPercent}`
      const entry = map.get(key) ?? {
        label: l.vatPercent > 0 ? `${formatNumber(l.vatPercent, 0)}%` : (l.vatExemptionReasonText ?? `Categoria ${l.vatCategoryCode}`),
        net: 0, vat: 0,
      }
      entry.net += l.netAmount
      entry.vat += l.vatAmount
      map.set(key, entry)
    }
    return [...map.values()]
  }, [invoice])

  const handlePdf = async () => {
    if (!invoice) return
    setDownloading(true)
    try {
      downloadBlob(await invoicesApi.getPdf(invoice.id), `factura_${invoice.series}_${invoice.number}.pdf`)
    } catch (err) {
      showError(err)
    } finally {
      setDownloading(false)
    }
  }

  const canBeReversed = !!invoice && canStorno && !invoice.isStorno && invoice.statusCode !== 'STORNATA'

  return (
    <>
      <AppModal
        isOpen={!!invoiceId}
        onClose={onClose}
        maxWidth={900}
        title={invoice ? `Factura ${formatInvoiceNumber(invoice.series, invoice.number)}` : 'Factură'}
        bodyClassName={styles.body}
        footer={
          <>
            <AppButton variant="secondary" onClick={onClose}>Închide</AppButton>
            {canBeReversed && (
              <AppButton variant="danger" onClick={() => { setStornoKey(uuidv4()); setStornoError(null); setStornoOpen(true) }}>Stornează</AppButton>
            )}
            {invoice && (
              <AppButton variant="primary" onClick={() => { void handlePdf() }} isLoading={downloading} loadingText="Se generează…">
                Descarcă PDF
              </AppButton>
            )}
          </>
        }
      >
        {isLoading || !invoice ? (
          <div className={styles.muted}>Se încarcă…</div>
        ) : (
          <>
            <InlineFeedback successMsg={successMsg} errorMsg={errorMsg} />
            <div className={styles.header}>
              <div>
                <AppBadge variant={invoiceStatusVariant(invoice.statusCode)} withDot>{invoice.statusName}</AppBadge>
                {invoice.isStorno && <AppBadge variant="warning" className="ms-2">Factură storno</AppBadge>}
              </div>
              <div className={styles.meta}>
                Emisă {formatDate(invoice.issueDate)} · {invoice.createdByName ?? '—'} · {formatDateTime(invoice.issuedAt)}
              </div>
            </div>

            {invoice.isStorno && invoice.originalInvoiceId && (
              <div className={styles.link}>
                Stornează factura{' '}
                <button type="button" onClick={() => onNavigate(invoice.originalInvoiceId!)}>
                  {formatInvoiceNumber(invoice.originalSeries ?? '', invoice.originalNumber ?? 0)}
                </button>
                {invoice.originalIssueDate && <> din {formatDate(invoice.originalIssueDate)}</>}
                {invoice.stornoReason && <> — motiv: {invoice.stornoReason}</>}
              </div>
            )}
            {invoice.stornoInvoiceId && (
              <div className={styles.link}>
                Stornată prin factura{' '}
                <button type="button" onClick={() => onNavigate(invoice.stornoInvoiceId!)}>
                  {formatInvoiceNumber(invoice.stornoSeries ?? '', invoice.stornoNumber ?? 0)}
                </button>
              </div>
            )}

            <div className={styles.parties}>
              <div>
                <div className={styles.label}>Furnizor</div>
                <div className={styles.strong}>{invoice.supplierName}</div>
                <div>CUI: {invoice.supplierFiscalCode}{invoice.supplierTradeRegisterNumber && <> · {invoice.supplierTradeRegisterNumber}</>}</div>
                <div className={styles.muted}>{[invoice.supplierAddress, invoice.supplierCity, invoice.supplierCounty].filter(Boolean).join(', ')}</div>
                <div className={styles.muted}>{invoice.supplierIsVatPayer ? 'Plătitor de TVA' : 'Neplătitor de TVA'}</div>
              </div>
              <div>
                <div className={styles.label}>Client ({invoice.customerIsLegalEntity ? 'persoană juridică' : 'persoană fizică'})</div>
                <div className={styles.strong}>{invoice.customerName}</div>
                {invoice.customerFiscalCode && <div>CUI: {invoice.customerFiscalCode}{invoice.customerTradeRegisterNumber && <> · {invoice.customerTradeRegisterNumber}</>}</div>}
                {invoice.customerCnp && <div>CNP: {invoice.customerCnp}</div>}
                <div className={styles.muted}>{[invoice.customerAddress, invoice.customerCity, invoice.customerCounty].filter(Boolean).join(', ')}</div>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th><th>Denumire</th><th className={styles.right}>Cant.</th><th className={styles.right}>Preț unitar</th>
                  <th className={styles.right}>Valoare</th><th>TVA</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((l, i) => (
                  <tr key={l.id}>
                    <td>{i + 1}</td>
                    <td>{l.name}</td>
                    <td className={styles.right}>{formatNumber(l.quantity, l.quantity % 1 === 0 ? 0 : 3)}</td>
                    <td className={styles.right}>{formatCurrency(l.unitPrice)}</td>
                    <td className={styles.right}>{formatCurrency(l.lineTotal)}</td>
                    <td className={styles.small}>{l.vatPercent > 0 ? `${formatNumber(l.vatPercent, 0)}%` : l.vatCategoryCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.totals}>
              <div className={styles.vatSummary}>
                {vatSummary.map((v) => (
                  <div key={v.label}>{v.label}: bază {formatCurrency(v.net)}, TVA {formatCurrency(v.vat)}</div>
                ))}
              </div>
              <div className={styles.totalBox}>
                <div>Total fără TVA <span>{formatCurrency(invoice.totalNet)}</span></div>
                <div>TVA <span>{formatCurrency(invoice.totalVat)}</span></div>
                <div className={styles.grand}>Total de plată <span>{formatCurrency(invoice.total)}</span></div>
              </div>
            </div>

            {invoice.notes && <div className={styles.notes}>{invoice.notes}</div>}
          </>
        )}
      </AppModal>

      <ReasonModal
        isOpen={stornoOpen}
        title="Stornare factură"
        description={invoice && (
          <>Se emite o factură storno (valori negative) în seria <strong>{invoice.series}</strong>, iar factura{' '}
            <strong>{formatInvoiceNumber(invoice.series, invoice.number)}</strong> devine „Stornată". Operația este
            ireversibilă. După stornare se poate emite o factură de corecție.</>
        )}
        confirmLabel="Stornează factura"
        isLoading={storno.isPending}
        error={stornoError}
        onClose={() => setStornoOpen(false)}
        onConfirm={(reason) => {
          if (!invoice) return
          storno.mutate(
            { id: invoice.id, idempotencyKey: stornoKey, reason },
            {
              onSuccess: (r) => {
                setStornoOpen(false)
                if (!r.data) return
                showSuccess(r.data.isDuplicate ? 'Factura fusese deja stornată.'
                  : 'Factura storno a fost emisă. Factura de corecție se emite din Încasări.')
                onNavigate(r.data.invoiceId)
              },
              onError: (err) => setStornoError(err instanceof Error ? err.message : 'Stornarea nu a reușit.'),
            },
          )
        }}
      />
    </>
  )
}

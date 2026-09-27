import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { v4 as uuidv4 } from 'uuid'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { formatCurrency } from '@/utils/format'
import { useFeedback } from '@/hooks/useFeedback'
import { InlineFeedback } from '../InlineFeedback'
import type { InvoiceSeriesLookupDto, VatRateDto } from '@/features/tariffs/types/tariff.types'
import { useCreateInvoice } from '@/features/invoices/hooks/useInvoices'
import type { CreateInvoiceResult } from '@/features/invoices/types/invoice.types'
import { invoiceCustomerSchema, type InvoiceCustomerFormData } from '../../schemas/billing.schema'
import type { ConsultationBillingDto } from '../../types/billing.types'
import styles from './IssueInvoiceModal.module.scss'

interface IssueInvoiceModalProps {
  billing: ConsultationBillingDto | null
  series: InvoiceSeriesLookupDto[]
  vatRates: VatRateDto[]
  onClose: () => void
  onDone: (result: CreateInvoiceResult) => void
}

const lineTotal = (q: number, p: number) => Math.round((Number(q) || 0) * (Number(p) || 0) * 100) / 100

export const IssueInvoiceModal = ({ billing, series, vatRates, onClose, onDone }: IssueInvoiceModalProps) => {
  const isOpen = !!billing
  const createInvoice = useCreateInvoice()
  const { errorMsg, showError, clearMessages } = useFeedback()
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => uuidv4())

  // După stornarea facturii inițiale, factura nouă poate avea alte linii (Invoice_Create → 50622 altfel)
  const isCorrection = !!billing
    && billing.invoices.some((i) => i.statusCode === 'STORNATA' && !i.isStorno)
    && !billing.invoices.some((i) => i.statusCode !== 'STORNATA' && !i.isStorno)

  const { control, handleSubmit, reset, register, formState: { errors } } = useForm<InvoiceCustomerFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(invoiceCustomerSchema) as any,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
  const isLegal = useWatch({ control, name: 'customerIsLegalEntity' })
  const lines = useWatch({ control, name: 'lines' })

  useEffect(() => {
    if (!billing) return
    clearMessages()
    setIdempotencyKey(uuidv4())
    reset({
      seriesId: series.find((s) => s.isDefault)?.id ?? series[0]?.id ?? '',
      customerIsLegalEntity: false,
      customerName: billing.patientName,
      // Minimizare GDPR: CNP-ul apare pe factură doar la cererea explicită a pacientului
      includeCnp: false,
      customerFiscalCode: '',
      customerTradeRegisterNumber: '',
      customerAddress: billing.patientAddress ?? '',
      customerCity: billing.patientCity ?? '',
      customerCounty: billing.patientCounty ?? '',
      lines: billing.lines.map((l) => ({
        medicalServiceId: l.medicalServiceId,
        code: l.serviceCode,
        name: l.serviceName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        vatRateId: l.vatRateId,
      })),
    })
  }, [billing, series, reset, clearMessages])

  // Schimbarea tipului de client golește numele — PF → PJ nu trebuie să păstreze numele pacientului
  const handleCustomerType = (legal: boolean) => {
    if (!billing) return
    reset((prev) => ({
      ...prev,
      customerIsLegalEntity: legal,
      customerName: legal ? '' : billing.patientName,
      includeCnp: false,
      customerFiscalCode: '',
      customerTradeRegisterNumber: '',
    }))
  }

  const seriesOptions = useMemo(() => series.map((s) => ({ value: s.id, label: `${s.series} (următorul nr. ${s.lastNumber + 1})` })), [series])
  const vatOptions = useMemo(() => vatRates.filter((v) => v.isActive).map((v) => ({ value: v.id, label: v.name })), [vatRates])
  const total = (lines ?? []).reduce((s, l) => s + lineTotal(l?.quantity, l?.unitPrice), 0)

  const submit = (d: InvoiceCustomerFormData) => {
    if (!billing) return
    const opt = (v: string) => v.trim() || null
    createInvoice.mutate(
      {
        consultationId: billing.consultationId,
        idempotencyKey,
        seriesId: d.seriesId || null,
        customerIsLegalEntity: d.customerIsLegalEntity,
        customerName: d.customerName.trim(),
        includeCnp: !d.customerIsLegalEntity && d.includeCnp,
        customerFiscalCode: d.customerFiscalCode ? d.customerFiscalCode.toUpperCase() : null,
        customerTradeRegisterNumber: opt(d.customerTradeRegisterNumber),
        customerAddress: opt(d.customerAddress),
        customerCity: opt(d.customerCity),
        customerCounty: opt(d.customerCounty),
        lines: isCorrection
          ? d.lines.map((l) => ({ ...l, code: l.code || null, name: l.name.trim() }))
          : null,
      },
      { onSuccess: (resp) => { if (resp.data) onDone(resp.data) }, onError: showError },
    )
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={820}
      title={isCorrection ? 'Factură de corecție' : 'Emitere factură'}
      as="form"
      onSubmit={handleSubmit(submit)}
      bodyClassName={styles.body}
      footer={
        <>
          <AppButton type="button" variant="secondary" onClick={onClose} disabled={createInvoice.isPending}>Anulează</AppButton>
          <AppButton type="submit" variant="primary" isLoading={createInvoice.isPending} loadingText="Se emite…">
            Emite factura ({formatCurrency(total)})
          </AppButton>
        </>
      }
    >
      {billing && (
        <>
          <InlineFeedback errorMsg={errorMsg} />
          <div className={styles.typeSwitch} role="radiogroup" aria-label="Tip client">
            <button type="button" role="radio" aria-checked={!isLegal}
              className={!isLegal ? styles.typeActive : styles.typeOption} onClick={() => handleCustomerType(false)}>
              Persoană fizică
            </button>
            <button type="button" role="radio" aria-checked={!!isLegal}
              className={isLegal ? styles.typeActive : styles.typeOption} onClick={() => handleCustomerType(true)}>
              Persoană juridică
            </button>
          </div>

          <div className={styles.grid}>
            <FormInput<InvoiceCustomerFormData> name="customerName" control={control}
              label={isLegal ? 'Denumire firmă' : 'Nume client'} required maxLength={200} className={styles.span2} />
            <FormSelect<InvoiceCustomerFormData> name="seriesId" control={control} label="Serie" options={seriesOptions} required />

            {isLegal ? (
              <>
                <FormInput<InvoiceCustomerFormData> name="customerFiscalCode" control={control} label="CUI" required maxLength={20} />
                <FormInput<InvoiceCustomerFormData> name="customerTradeRegisterNumber" control={control} label="Nr. Reg. Com." maxLength={30} />
                <div />
              </>
            ) : (
              <label className={`${styles.checkbox} ${styles.span3}`}>
                <input type="checkbox" disabled={!billing.patientHasCnp} {...register('includeCnp')} />
                Trece CNP-ul pe factură (doar la cererea pacientului)
                {!billing.patientHasCnp && <span className={styles.muted}> — pacientul nu are CNP înregistrat</span>}
              </label>
            )}

            <FormInput<InvoiceCustomerFormData> name="customerAddress" control={control} label="Adresă"
              required={!!isLegal} maxLength={500} className={styles.span3} />
            <FormInput<InvoiceCustomerFormData> name="customerCity" control={control} label="Localitate" maxLength={100} />
            <FormInput<InvoiceCustomerFormData> name="customerCounty" control={control} label="Județ" maxLength={100} />
          </div>

          <div className={styles.sectionTitle}>
            Linii factură
            {!isCorrection && <span className={styles.muted}> — preluate din serviciile consultației</span>}
          </div>

          {isCorrection ? (
            <div className={styles.lines}>
              {fields.map((f, i) => (
                <div key={f.id} className={styles.lineRow}>
                  <FormInput<InvoiceCustomerFormData> name={`lines.${i}.name`} control={control}
                    label={i === 0 ? 'Denumire' : undefined} required maxLength={200} className={styles.lineName} />
                  <FormInput<InvoiceCustomerFormData> name={`lines.${i}.quantity`} control={control}
                    label={i === 0 ? 'Cant.' : undefined} type="number" required className={styles.lineQty} />
                  <FormInput<InvoiceCustomerFormData> name={`lines.${i}.unitPrice`} control={control}
                    label={i === 0 ? 'Preț unitar' : undefined} type="number" required className={styles.linePrice} />
                  <FormSelect<InvoiceCustomerFormData> name={`lines.${i}.vatRateId`} control={control}
                    label={i === 0 ? 'Regim TVA' : ''} options={vatOptions} required className={styles.lineVat} />
                  <span className={styles.lineTotal}>{formatCurrency(lineTotal(lines?.[i]?.quantity, lines?.[i]?.unitPrice))}</span>
                  <button type="button" className={styles.removeBtn} disabled={fields.length === 1}
                    onClick={() => remove(i)} aria-label="Elimină linia" title="Elimină">×</button>
                </div>
              ))}
              <button type="button" className={styles.addLink}
                onClick={() => append({ medicalServiceId: null, code: null, name: '', quantity: 1, unitPrice: 0, vatRateId: vatOptions[0]?.value ?? '' })}>
                + Adaugă linie
              </button>
              {errors.lines?.message && <div className={styles.error}>{errors.lines.message}</div>}
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr><th>Serviciu</th><th className={styles.right}>Cant.</th><th className={styles.right}>Preț unitar</th><th className={styles.right}>Valoare</th></tr>
              </thead>
              <tbody>
                {billing.lines.map((l) => (
                  <tr key={l.id}>
                    <td>{l.serviceName}</td>
                    <td className={styles.right}>{l.quantity}</td>
                    <td className={styles.right}>{formatCurrency(l.unitPrice)}</td>
                    <td className={styles.right}>{formatCurrency(l.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p className={styles.hint}>
            Factura emisă nu se mai poate modifica sau șterge — corecțiile se fac prin stornare și o factură nouă.
          </p>
        </>
      )}
    </AppModal>
  )
}

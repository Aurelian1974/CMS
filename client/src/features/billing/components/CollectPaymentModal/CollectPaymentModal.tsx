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
import type { PaymentMethodDto } from '@/features/tariffs/types/tariff.types'
import { useCreatePayment } from '../../hooks/useBilling'
import { createPaymentSchema, type PaymentFormData } from '../../schemas/billing.schema'
import type { ConsultationBillingDto, CreatePaymentResult } from '../../types/billing.types'
import styles from './CollectPaymentModal.module.scss'

interface CollectPaymentModalProps {
  billing: ConsultationBillingDto | null
  paymentMethods: PaymentMethodDto[]
  onClose: () => void
  onDone: (result: CreatePaymentResult) => void
}

export const CollectPaymentModal = ({ billing, paymentMethods, onClose, onDone }: CollectPaymentModalProps) => {
  const isOpen = !!billing
  const createPayment = useCreatePayment()
  const { errorMsg, showError, clearMessages } = useFeedback()

  // O cheie per deschidere a dialogului: un dublu-click sau un retry după timeout
  // ajung la aceeași plată (Payment_Create e idempotent pe cheie), nu la a doua încasare.
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => uuidv4())

  const balance = billing?.balance ?? 0
  const hasActivePayments = (billing?.payments ?? []).some((p) => !p.isCancelled)
  const fiscalMethodIds = useMemo(
    () => paymentMethods.filter((m) => m.requiresFiscalReceipt).map((m) => m.id),
    [paymentMethods],
  )

  const schema = useMemo(
    () => createPaymentSchema({ balance, fiscalMethodIds, hasActivePayments }),
    [balance, fiscalMethodIds, hasActivePayments],
  )

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { tenders: [], notes: '' },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'tenders' })
  const tenders = useWatch({ control, name: 'tenders' })

  useEffect(() => {
    if (!isOpen) return
    clearMessages()
    setIdempotencyKey(uuidv4())
    // Implicit: o plată fără bon fiscal dacă s-a încasat deja ceva, altfel prima metodă (numerar)
    const defaultMethod = hasActivePayments
      ? paymentMethods.find((m) => !m.requiresFiscalReceipt) ?? paymentMethods[0]
      : paymentMethods[0]
    reset({ tenders: [{ paymentMethodId: defaultMethod?.id ?? '', amount: balance }], notes: '' })
  }, [isOpen, billing?.consultationId, balance, hasActivePayments, paymentMethods, reset, clearMessages])

  const methodOptions = useMemo(
    () => paymentMethods.map((m) => ({ value: m.id, label: m.requiresFiscalReceipt ? `${m.name} (bon fiscal)` : m.name })),
    [paymentMethods],
  )

  const sum = Math.round((tenders ?? []).reduce((s, t) => s + (Number(t?.amount) || 0), 0) * 100) / 100
  const willPrintReceipt = (tenders ?? []).some((t) => fiscalMethodIds.includes(t?.paymentMethodId))
  const tendersError = errors.tenders?.message ?? errors.tenders?.root?.message

  const submit = (data: PaymentFormData) => {
    if (!billing) return
    createPayment.mutate(
      {
        consultationId: billing.consultationId,
        idempotencyKey,
        tenders: data.tenders.map((t) => ({ paymentMethodId: t.paymentMethodId, amount: t.amount })),
        notes: data.notes.trim() || null,
      },
      {
        onSuccess: (resp) => { if (resp.data) onDone(resp.data) },
        onError: showError,
      },
    )
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={620}
      title={billing ? `Încasare — ${billing.patientName}` : 'Încasare'}
      as="form"
      onSubmit={handleSubmit(submit)}
      bodyClassName={styles.body}
      footer={
        <>
          <AppButton type="button" variant="secondary" onClick={onClose} disabled={createPayment.isPending}>Anulează</AppButton>
          <AppButton type="submit" variant="primary" isLoading={createPayment.isPending} loadingText="Se înregistrează…">
            Încasează {formatCurrency(sum)}
          </AppButton>
        </>
      }
    >
      {billing && (
        <>
          <InlineFeedback errorMsg={errorMsg} />
          <div className={styles.summary}>
            <div><span className={styles.label}>Total</span><span className={styles.value}>{formatCurrency(billing.total)}</span></div>
            <div><span className={styles.label}>Încasat</span><span className={styles.value}>{formatCurrency(billing.paid)}</span></div>
            <div><span className={styles.label}>Rest de plată</span><span className={styles.valueStrong}>{formatCurrency(billing.balance)}</span></div>
          </div>

          <div className={styles.tenders}>
            {fields.map((field, i) => (
              <div key={field.id} className={styles.tenderRow}>
                <FormSelect<PaymentFormData> name={`tenders.${i}.paymentMethodId`} control={control}
                  label={i === 0 ? 'Metodă de plată' : ''} options={methodOptions} required className={styles.method} />
                <FormInput<PaymentFormData> name={`tenders.${i}.amount`} control={control}
                  label={i === 0 ? 'Sumă (RON)' : undefined} type="number" required className={styles.amount} />
                {fields.length > 1 && (
                  <button type="button" className={styles.removeBtn} onClick={() => remove(i)}
                    aria-label="Elimină metoda de plată" title="Elimină">×</button>
                )}
              </div>
            ))}
            {fields.length < paymentMethods.length && (
              <button type="button" className={styles.addLink}
                onClick={() => {
                  // Numerar + card se combină pe același bon; transferul rămâne separat (Payment_Create → 50635)
                  const used = new Set((tenders ?? []).map((t) => t.paymentMethodId))
                  const firstIsFiscal = fiscalMethodIds.includes(tenders?.[0]?.paymentMethodId ?? '')
                  const next = paymentMethods.find((m) => !used.has(m.id) && m.requiresFiscalReceipt === firstIsFiscal)
                    ?? paymentMethods.find((m) => !used.has(m.id))
                  append({ paymentMethodId: next?.id ?? '', amount: Math.max(0, Math.round((balance - sum) * 100) / 100) })
                }}>
                + Împarte pe mai multe metode (ex: numerar + card)
              </button>
            )}
            {tendersError && <div className={styles.error}>{tendersError}</div>}
          </div>

          {willPrintReceipt ? (
            <div className={styles.info}>
              Se va emite <strong>bonul fiscal</strong> pe casa de marcat pentru {formatCurrency(sum)}.
              Bonul se tipărește o singură dată; dacă tipărirea eșuează, se reia din fișa de încasare.
            </div>
          ) : (
            <div className={styles.infoMuted}>Plata nu generează bon fiscal (ex: transfer bancar pe bază de factură).</div>
          )}

          <FormInput<PaymentFormData> name="notes" control={control} label="Observații" multiline rows={2} maxLength={500} />
        </>
      )}
    </AppModal>
  )
}

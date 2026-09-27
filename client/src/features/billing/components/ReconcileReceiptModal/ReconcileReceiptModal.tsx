import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { AppBadge } from '@/components/ui/AppBadge'
import { FormInput } from '@/components/forms/FormInput'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useFeedback } from '@/hooks/useFeedback'
import { InlineFeedback } from '../InlineFeedback'
import { useFiscalReceipt, useReconcileFiscalReceipt } from '../../hooks/useBilling'
import { reconcileSchema, type ReconcileFormData } from '../../schemas/billing.schema'
import { receiptStatusVariant } from '../../constants/billing.constants'
import styles from './ReconcileReceiptModal.module.scss'

interface ReconcileReceiptModalProps {
  receiptId: string | null
  onClose: () => void
  onDone: (wasPrinted: boolean) => void
  /** Conținut suplimentar (ex: verificarea automată în jurnalul fiscal bridge-ului). */
  extra?: React.ReactNode
}

/**
 * Reconciliere manuală pentru bonurile cu rezultat necunoscut (conexiune pierdută în timpul
 * tipăririi). Aplicația nu retrimite niciodată automat un bon: operatorul verifică pe aparat
 * (ultimul bon emis / raportul de jurnal) și confirmă ce s-a întâmplat.
 */
export const ReconcileReceiptModal = ({ receiptId, onClose, onDone, extra }: ReconcileReceiptModalProps) => {
  const { data: resp, isLoading } = useFiscalReceipt(receiptId)
  const receipt = resp?.data
  const reconcile = useReconcileFiscalReceipt()
  const { errorMsg, showError, clearMessages } = useFeedback()

  const { control, handleSubmit, reset, register, formState: { errors } } = useForm<ReconcileFormData>({
    resolver: zodResolver(reconcileSchema),
    defaultValues: { wasPrinted: undefined, receiptNumber: '', note: '' },
  })
  const wasPrinted = useWatch({ control, name: 'wasPrinted' })

  useEffect(() => {
    if (receiptId) {
      clearMessages()
      reset({ wasPrinted: undefined, receiptNumber: '', note: '' })
    }
  }, [receiptId, reset, clearMessages])

  const submit = (data: ReconcileFormData) => {
    if (!receiptId) return
    const printed = data.wasPrinted === 'yes'
    reconcile.mutate(
      { id: receiptId, wasPrinted: printed, receiptNumber: printed ? data.receiptNumber : null, note: data.note.trim() || null },
      { onSuccess: () => onDone(printed), onError: showError },
    )
  }

  return (
    <AppModal
      isOpen={!!receiptId}
      onClose={onClose}
      maxWidth={680}
      title="Reconciliere bon fiscal"
      as="form"
      onSubmit={handleSubmit(submit)}
      bodyClassName={styles.body}
      footer={
        <>
          <AppButton type="button" variant="secondary" onClick={onClose} disabled={reconcile.isPending}>Renunță</AppButton>
          <AppButton type="submit" variant="primary" isLoading={reconcile.isPending} loadingText="Se salvează…">Confirmă</AppButton>
        </>
      }
    >
      {isLoading || !receipt ? (
        <div className={styles.muted}>Se încarcă…</div>
      ) : (
        <>
          <InlineFeedback errorMsg={errorMsg} />
          <div className={styles.warning}>
            Nu se știe dacă aparatul a emis bonul. <strong>Nu reîncercați tipărirea</strong> până nu verificați pe casa
            de marcat ultimul bon emis (sumă <strong>{formatCurrency(receipt.amount)}</strong>, creat la {formatDateTime(receipt.createdAt)}).
          </div>

          <div className={styles.meta}>
            <span>Status: <AppBadge variant={receiptStatusVariant(receipt.statusCode)} withDot>{receipt.statusName}</AppBadge></span>
            <span>Încercări: {receipt.attemptCount}</span>
            {receipt.lastError && <span className={styles.errorText}>Ultima eroare: {receipt.lastError}</span>}
          </div>

          <table className={styles.table}>
            <thead>
              <tr><th>Articol</th><th className={styles.right}>Cant.</th><th className={styles.right}>Valoare</th><th>Grupa TVA</th></tr>
            </thead>
            <tbody>
              {receipt.lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td className={styles.right}>{l.quantity}</td>
                  <td className={styles.right}>{formatCurrency(l.lineTotal)}</td>
                  <td>{l.taxGroup}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {extra}

          <fieldset className={styles.choice}>
            <legend>Rezultatul verificării pe aparat</legend>
            <label><input type="radio" value="yes" {...register('wasPrinted')} /> Bonul <strong>a fost emis</strong> de casa de marcat</label>
            <label><input type="radio" value="no" {...register('wasPrinted')} /> Bonul <strong>nu</strong> a fost emis (se poate retipări)</label>
            {errors.wasPrinted && <div className={styles.errorText}>{errors.wasPrinted.message}</div>}
          </fieldset>

          {wasPrinted === 'yes' && (
            <FormInput<ReconcileFormData> name="receiptNumber" control={control} label="Numărul bonului tipărit" required maxLength={30} />
          )}
          <FormInput<ReconcileFormData> name="note" control={control} label="Observații" multiline rows={2} maxLength={500} />
        </>
      )}
    </AppModal>
  )
}

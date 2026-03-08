import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bankAccountSchema, type BankAccountFormData } from '../../schemas/clinic.schema'
import type { ClinicBankAccountDto } from '../../types/clinic.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { AppButton } from '@/components/ui/AppButton'

interface BankAccountFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BankAccountFormData) => void
  isLoading: boolean
  editData: ClinicBankAccountDto | null
}

export const BankAccountFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
}: BankAccountFormModalProps) => {
  const isEdit = !!editData

  const { control, handleSubmit, reset, register } = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bankName: '',
      iban: '',
      currency: 'RON',
      isMain: false,
      notes: undefined,
    },
  })

  useEffect(() => {
    if (editData) {
      reset({
        bankName: editData.bankName,
        iban: editData.iban,
        currency: editData.currency as 'RON' | 'EUR' | 'USD',
        isMain: editData.isMain,
        notes: editData.notes ?? undefined,
      })
    } else {
      reset({ bankName: '', iban: '', currency: 'RON', isMain: false, notes: undefined })
    }
  }, [editData, reset])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={480}
      title={isEdit ? 'Editează Cont Bancar' : 'Cont Bancar Nou'}
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      footer={
        <>
          <AppButton variant="outline-secondary" onClick={onClose} disabled={isLoading}>
            Anulează
          </AppButton>
          <AppButton type="submit" variant="primary" isLoading={isLoading} loadingText="Se salvează...">
            {isEdit ? 'Salvează' : 'Adaugă cont'}
          </AppButton>
        </>
      }
    >
      <div className="d-flex flex-column gap-3">
        <FormInput<BankAccountFormData>
          name="bankName"
          control={control}
          label="Bancă"
          placeholder="ex: Banca Transilvania"
          required
        />
        <FormInput<BankAccountFormData>
          name="iban"
          control={control}
          label="IBAN"
          placeholder="ex: RO49AAAA1B31007593840000"
          required
        />

        <div>
          <label className="form-label fw-medium" style={{ fontSize: '0.8125rem' }}>
            Monedă <span className="text-danger">*</span>
          </label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <select className="form-select form-select-sm" {...field}>
                <option value="RON">RON</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            )}
          />
        </div>

        <FormInput<BankAccountFormData>
          name="notes"
          control={control}
          label="Observații"
          placeholder="ex: Cont principal operațional"
        />

        <div className="form-check">
          <input
            id="bankIsMain"
            type="checkbox"
            className="form-check-input"
            {...register('isMain')}
          />
          <label htmlFor="bankIsMain" className="form-check-label" style={{ fontSize: '0.875rem' }}>
            Cont principal
          </label>
        </div>
      </div>
    </AppModal>
  )
}

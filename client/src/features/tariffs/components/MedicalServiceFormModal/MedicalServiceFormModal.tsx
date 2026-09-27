import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormDatePicker } from '@/components/forms/FormDatePicker'
import { useInvestigationTypes } from '@/features/consultations/investigations/hooks/useInvestigations'
import { toLocalDateISO } from '@/utils/format'
import { medicalServiceSchema, type MedicalServiceFormData } from '../../schemas/tariff.schema'
import type { BillingLookupsDto, MedicalServiceDetailDto } from '../../types/tariff.types'
import styles from './MedicalServiceFormModal.module.scss'

interface MedicalServiceFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MedicalServiceFormData) => void
  isLoading: boolean
  lookups: BillingLookupsDto | undefined
  /** Serviciul existent pentru editare, null pentru creare */
  editData: MedicalServiceDetailDto | null
}

const emptyForm = (lookups: BillingLookupsDto | undefined): MedicalServiceFormData => ({
  code: '',
  name: '',
  categoryId: '',
  durationMinutes: '',
  investigationTypeCode: '',
  price: 0,
  vatRateId: lookups?.vatRates[0]?.id ?? '',
  validFrom: toLocalDateISO(new Date()),
})

export const MedicalServiceFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  lookups,
  editData,
}: MedicalServiceFormModalProps) => {
  const isEdit = !!editData
  const { data: investigationTypes } = useInvestigationTypes()

  const { control, handleSubmit, reset } = useForm<MedicalServiceFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(medicalServiceSchema) as any,
    defaultValues: emptyForm(lookups),
  })

  useEffect(() => {
    if (!isOpen) return
    if (editData) {
      reset({
        code: editData.code,
        name: editData.name,
        categoryId: editData.categoryId ?? '',
        durationMinutes: editData.durationMinutes ?? '',
        investigationTypeCode: editData.investigationTypeCode ?? '',
        // Prețul nu se editează aici — valorile doar satisfac schema
        price: editData.currentPrice ?? 0,
        vatRateId: editData.currentVatRateId ?? lookups?.vatRates[0]?.id ?? '',
        validFrom: toLocalDateISO(new Date()),
      })
    } else {
      reset(emptyForm(lookups))
    }
  }, [isOpen, editData, lookups, reset])

  const categoryOptions = useMemo(
    () => (lookups?.serviceCategories ?? []).map((c) => ({ value: c.id, label: c.name })),
    [lookups],
  )
  const vatOptions = useMemo(
    () => (lookups?.vatRates ?? []).map((v) => ({ value: v.id, label: v.name })),
    [lookups],
  )
  const investigationOptions = useMemo(
    () => (investigationTypes ?? []).map((t) => ({ value: t.typeCode, label: t.displayName })),
    [investigationTypes],
  )

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={620}
      title={isEdit ? 'Editează serviciu' : 'Serviciu nou'}
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      bodyClassName={styles.body}
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={isLoading}>Anulează</AppButton>
          <AppButton type="submit" variant="primary" isLoading={isLoading} loadingText="Se salvează…">
            {isEdit ? 'Actualizează' : 'Creează'}
          </AppButton>
        </>
      }
    >
      <div className={styles.row}>
        <FormInput<MedicalServiceFormData> name="code" control={control} label="Cod intern"
          placeholder="ex: CONS-PNEUMO" required maxLength={30} className={styles.code} />
        <FormInput<MedicalServiceFormData> name="name" control={control} label="Denumire"
          placeholder="ex: Consultație pneumologie" required maxLength={200} className={styles.grow} />
      </div>

      <div className={styles.row}>
        <FormSelect<MedicalServiceFormData> name="categoryId" control={control} label="Categorie"
          options={categoryOptions} placeholder="Selectează categoria" required className={styles.grow} />
        <FormInput<MedicalServiceFormData> name="durationMinutes" control={control} label="Durată (minute)"
          type="number" placeholder="opțional" className={styles.duration} />
      </div>

      <FormSelect<MedicalServiceFormData> name="investigationTypeCode" control={control}
        label="Investigație asociată" options={investigationOptions} allowFiltering showClearButton
        placeholder="Opțional — sugerează serviciul când investigația e efectuată" />

      {!isEdit && (
        <>
          <div className={styles.sectionTitle}>Preț inițial</div>
          <div className={styles.row}>
            <FormInput<MedicalServiceFormData> name="price" control={control} label="Preț (RON, TVA inclus)"
              type="number" required className={styles.price} />
            <FormSelect<MedicalServiceFormData> name="vatRateId" control={control} label="Regim TVA"
              options={vatOptions} required className={styles.grow} />
            <FormDatePicker<MedicalServiceFormData> name="validFrom" control={control} label="Valabil de la"
              required min={new Date(new Date().setHours(0, 0, 0, 0))} className={styles.date} />
          </div>
        </>
      )}

      {isEdit && (
        <p className={styles.hint}>
          Prețul se modifică din istoricul de prețuri: se adaugă o versiune nouă, cu data de la care se aplică.
          Consultațiile deja încasate sau facturate își păstrează prețul.
        </p>
      )}
    </AppModal>
  )
}

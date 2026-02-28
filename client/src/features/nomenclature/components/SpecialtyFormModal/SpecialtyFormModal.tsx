import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { specialtySchema, type SpecialtyFormData } from '../../schemas/specialty.schema'
import type { SpecialtyDto } from '../../types/specialty.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { AppButton } from '@/components/ui/AppButton'
import styles from './SpecialtyFormModal.module.scss'

// ===== Nivel → eticheta româna =====
const LEVEL_OPTIONS = [
  { value: 0, label: 'Categorie' },
  { value: 1, label: 'Specialitate' },
  { value: 2, label: 'Subspecialitate' },
]

interface SpecialtyFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SpecialtyFormData) => void
  isLoading: boolean
  /** Specializarea existentă pentru editare, null pentru creare */
  editData: SpecialtyDto | null
  /** Lista de categorii și specialități pentru dropdown-ul ParentId */
  parentOptions: { id: string; name: string; level: number }[]
}

export const SpecialtyFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
  parentOptions,
}: SpecialtyFormModalProps) => {
  const isEdit = !!editData

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<SpecialtyFormData>({
    resolver: zodResolver(specialtySchema),
    defaultValues: {
      parentId: null,
      name: '',
      code: '',
      description: null,
      displayOrder: 0,
      level: 1,
    },
  })

  const currentLevel = watch('level')

  // Populare formular la editare
  useEffect(() => {
    if (editData) {
      reset({
        parentId: editData.parentId,
        name: editData.name,
        code: editData.code,
        description: editData.description,
        displayOrder: editData.displayOrder,
        level: editData.level,
      })
    } else {
      reset({
        parentId: null,
        name: '',
        code: '',
        description: null,
        displayOrder: 0,
        level: 1,
      })
    }
  }, [editData, reset])

  // Dacă nivelul e 0 (categorie), nu are parent
  useEffect(() => {
    if (currentLevel === 0) {
      setValue('parentId', null)
    }
  }, [currentLevel, setValue])

  // Filtrează opțiunile parent în funcție de nivel selectat
  const filteredParents = parentOptions.filter((p) => {
    if (currentLevel === 1) return p.level === 0 // specialitățile au parent = categorie
    if (currentLevel === 2) return p.level === 1 // subspecialitățile au parent = specialitate
    return false // categoriile nu au parent
  })

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={520}
      title={isEdit ? 'Editează Specializare' : 'Specializare Nouă'}
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      bodyClassName={styles.body}
      footer={
        <>
          <AppButton
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Anulează
          </AppButton>
          <AppButton
            type="submit"
            variant="primary"
            isLoading={isLoading}
            loadingText="Se salvează…"
          >
            {isEdit ? 'Actualizează' : 'Creează'}
          </AppButton>
        </>
      }
    >
            {/* Nivel */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Nivel <span className={styles.required}>*</span>
              </label>
              <select
                className="form-select"
                {...register('level', { valueAsNumber: true })}
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Parent — vizibil doar dacă level > 0 */}
            {currentLevel > 0 && (
              <FormSelect<SpecialtyFormData>
                name="parentId"
                control={control}
                label={currentLevel === 1 ? 'Categorie părinte' : 'Specialitate părinte'}
                options={filteredParents.map(p => ({ value: p.id, label: p.name }))}
                required
                showClearButton
              />
            )}

            {/* Denumire */}
            <FormInput<SpecialtyFormData>
              name="name"
              control={control}
              label="Denumire"
              placeholder="ex: Cardiologie"
              required
            />

            {/* Cod */}
            <FormInput<SpecialtyFormData>
              name="code"
              control={control}
              label="Cod"
              placeholder="ex: CARDIOLOGY"
              required
            />

            {/* Descriere */}
            <FormInput<SpecialtyFormData>
              name="description"
              control={control}
              label="Descriere"
              placeholder="Descriere opțională"
              multiline
              multilineRows={2}
            />

            {/* Ordine afișare */}
            <FormInput<SpecialtyFormData>
              name="displayOrder"
              control={control}
              label="Ordine afișare"
              type="number"
            />
    </AppModal>
  )
}

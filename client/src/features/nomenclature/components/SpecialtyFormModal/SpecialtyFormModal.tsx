import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { specialtySchema, type SpecialtyFormData } from '../../schemas/specialty.schema'
import type { SpecialtyDto } from '../../types/specialty.types'
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
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
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

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5 className={styles.modalTitle}>
            {isEdit ? 'Editează Specializare' : 'Specializare Nouă'}
          </h5>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Închide">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.modalBody}>
            {/* Nivel */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Nivel <span className={styles.required}>*</span>
              </label>
              <select
                className={`form-select${errors.level ? ' is-invalid' : ''}`}
                {...register('level', { valueAsNumber: true })}
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.level && <span className={styles.error}>{errors.level.message}</span>}
            </div>

            {/* Parent — vizibil doar dacă level > 0 */}
            {currentLevel > 0 && (
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {currentLevel === 1 ? 'Categorie părinte' : 'Specialitate părinte'}
                  <span className={styles.required}> *</span>
                </label>
                <select
                  className={`form-select${errors.parentId ? ' is-invalid' : ''}`}
                  {...register('parentId')}
                  defaultValue=""
                >
                  <option value="" disabled>— Selectează —</option>
                  {filteredParents.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.parentId && <span className={styles.error}>{errors.parentId.message}</span>}
              </div>
            )}

            {/* Denumire */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Denumire <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`form-control${errors.name ? ' is-invalid' : ''}`}
                placeholder="ex: Cardiologie"
                {...register('name')}
              />
              {errors.name && <span className={styles.error}>{errors.name.message}</span>}
            </div>

            {/* Cod */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Cod <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`form-control${errors.code ? ' is-invalid' : ''}`}
                placeholder="ex: CARDIOLOGY"
                {...register('code')}
              />
              {errors.code && <span className={styles.error}>{errors.code.message}</span>}
            </div>

            {/* Descriere */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Descriere</label>
              <textarea
                className={`form-control${errors.description ? ' is-invalid' : ''}`}
                rows={2}
                placeholder="Descriere opțională"
                {...register('description')}
              />
              {errors.description && <span className={styles.error}>{errors.description.message}</span>}
            </div>

            {/* Ordine afișare */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Ordine afișare</label>
              <input
                type="number"
                className={`form-control${errors.displayOrder ? ' is-invalid' : ''}`}
                {...register('displayOrder', { valueAsNumber: true })}
              />
              {errors.displayOrder && <span className={styles.error}>{errors.displayOrder.message}</span>}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
              Anulează
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Se salvează…
                </>
              ) : (
                isEdit ? 'Actualizează' : 'Creează'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

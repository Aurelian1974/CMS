import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { departmentSchema, type DepartmentFormData } from '../../schemas/department.schema'
import type { DepartmentDto } from '../../types/department.types'
import type { ClinicLocationDto } from '@/features/clinic/types/clinic.types'
import styles from './DepartmentFormModal.module.scss'

interface DepartmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: DepartmentFormData) => void
  isLoading: boolean
  /** Departamentul existent pentru editare, null pentru creare */
  editData: DepartmentDto | null
  /** Lista locațiilor disponibile */
  locations: ClinicLocationDto[]
}

export const DepartmentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
  locations,
}: DepartmentFormModalProps) => {
  const isEdit = !!editData

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      locationId: '',
      name: '',
      code: '',
      description: '',
      isActive: true,
    },
  })

  // Populare formular la editare
  useEffect(() => {
    if (editData) {
      reset({
        locationId: editData.locationId,
        name: editData.name,
        code: editData.code,
        description: editData.description ?? '',
        isActive: editData.isActive,
      })
    } else {
      reset({
        locationId: '',
        name: '',
        code: '',
        description: '',
        isActive: true,
      })
    }
  }, [editData, reset])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5 className={styles.modalTitle}>
            {isEdit ? 'Editează Departament' : 'Departament Nou'}
          </h5>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Închide">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.modalBody}>
            {/* Denumire departament */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Denumire departament <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`form-control${errors.name ? ' is-invalid' : ''}`}
                placeholder="ex: Cardiologie"
                {...register('name')}
              />
              {errors.name && <span className={styles.error}>{errors.name.message}</span>}
            </div>

            {/* Cod + Locație */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Cod <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control${errors.code ? ' is-invalid' : ''}`}
                    placeholder="ex: CARDIO"
                    {...register('code')}
                  />
                  {errors.code && <span className={styles.error}>{errors.code.message}</span>}
                </div>
              </div>
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Locație <span className={styles.required}>*</span>
                  </label>
                  <select
                    className={`form-select${errors.locationId ? ' is-invalid' : ''}`}
                    {...register('locationId')}
                  >
                    <option value="">— Selectează locația —</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  {errors.locationId && <span className={styles.error}>{errors.locationId.message}</span>}
                </div>
              </div>
            </div>

            {/* Descriere */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Descriere</label>
              <textarea
                className={`form-control${errors.description ? ' is-invalid' : ''}`}
                rows={3}
                placeholder="Descriere opțională a departamentului"
                {...register('description')}
              />
              {errors.description && <span className={styles.error}>{errors.description.message}</span>}
            </div>

            {/* Status activ (doar la editare) */}
            {isEdit && (
              <div className={styles.formGroup}>
                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="deptIsActive"
                    {...register('isActive')}
                  />
                  <label className="form-check-label" htmlFor="deptIsActive">
                    Departament activ
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Anulează
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Se salvează...' : isEdit ? 'Salvează' : 'Adaugă'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

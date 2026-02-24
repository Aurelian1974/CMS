import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clinicLocationSchema, type ClinicLocationFormData } from '../../schemas/clinic.schema'
import type { ClinicLocationDto } from '../../types/clinic.types'
import styles from './LocationFormModal.module.scss'

interface LocationFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ClinicLocationFormData) => void
  isLoading: boolean
  /** Locația existentă pentru editare, null pentru creare */
  editData: ClinicLocationDto | null
}

export const LocationFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
}: LocationFormModalProps) => {
  const isEdit = !!editData

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClinicLocationFormData>({
    resolver: zodResolver(clinicLocationSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      county: '',
      postalCode: '',
      phoneNumber: '',
      email: '',
      isPrimary: false,
    },
  })

  // Populare formular la editare
  useEffect(() => {
    if (editData) {
      reset({
        name: editData.name,
        address: editData.address,
        city: editData.city,
        county: editData.county,
        postalCode: editData.postalCode ?? '',
        phoneNumber: editData.phoneNumber ?? '',
        email: editData.email ?? '',
        isPrimary: editData.isPrimary,
      })
    } else {
      reset({
        name: '',
        address: '',
        city: '',
        county: '',
        postalCode: '',
        phoneNumber: '',
        email: '',
        isPrimary: false,
      })
    }
  }, [editData, reset])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5 className={styles.modalTitle}>
            {isEdit ? 'Editează Locație' : 'Locație Nouă'}
          </h5>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Închide">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.modalBody}>
            {/* Denumire locație */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Denumire locație <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`form-control${errors.name ? ' is-invalid' : ''}`}
                placeholder="ex: Sediu Central"
                {...register('name')}
              />
              {errors.name && <span className={styles.error}>{errors.name.message}</span>}
            </div>

            {/* Adresă */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Adresă <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`form-control${errors.address ? ' is-invalid' : ''}`}
                placeholder="ex: Str. Sănătății nr. 10"
                {...register('address')}
              />
              {errors.address && <span className={styles.error}>{errors.address.message}</span>}
            </div>

            {/* Oraș + Județ */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Oraș <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control${errors.city ? ' is-invalid' : ''}`}
                    placeholder="ex: București"
                    {...register('city')}
                  />
                  {errors.city && <span className={styles.error}>{errors.city.message}</span>}
                </div>
              </div>
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Județ <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control${errors.county ? ' is-invalid' : ''}`}
                    placeholder="ex: București"
                    {...register('county')}
                  />
                  {errors.county && <span className={styles.error}>{errors.county.message}</span>}
                </div>
              </div>
            </div>

            {/* Cod poștal + Telefon */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cod poștal</label>
                  <input
                    type="text"
                    className={`form-control${errors.postalCode ? ' is-invalid' : ''}`}
                    placeholder="ex: 010100"
                    {...register('postalCode')}
                  />
                  {errors.postalCode && <span className={styles.error}>{errors.postalCode.message}</span>}
                </div>
              </div>
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Telefon</label>
                  <input
                    type="text"
                    className={`form-control${errors.phoneNumber ? ' is-invalid' : ''}`}
                    placeholder="ex: 021 123 4567"
                    {...register('phoneNumber')}
                  />
                  {errors.phoneNumber && <span className={styles.error}>{errors.phoneNumber.message}</span>}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                className={`form-control${errors.email ? ' is-invalid' : ''}`}
                placeholder="ex: locatie@clinica.ro"
                {...register('email')}
              />
              {errors.email && <span className={styles.error}>{errors.email.message}</span>}
            </div>

            {/* Locație principală */}
            <div className={styles.checkGroup}>
              <input
                type="checkbox"
                className="form-check-input"
                id="isPrimary"
                {...register('isPrimary')}
              />
              <label className={styles.label} htmlFor="isPrimary">
                Locație principală (sediu social)
              </label>
            </div>
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
              {isLoading ? 'Se salvează...' : isEdit ? 'Salvează' : 'Adaugă locație'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

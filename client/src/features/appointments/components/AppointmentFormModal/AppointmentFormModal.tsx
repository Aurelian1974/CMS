import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { appointmentSchema, type AppointmentFormData } from '../../schemas/appointment.schema'
import type { AppointmentDto, CreateAppointmentPayload, UpdateAppointmentPayload, PatientLookupDto } from '../../types/appointment.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormDatePicker } from '@/components/forms/FormDatePicker'
import { AppButton } from '@/components/ui/AppButton'
import styles from './AppointmentFormModal.module.scss'

// ── Constante status programare ───────────────────────────────────────────────
const APPOINTMENT_STATUS_OPTIONS = [
  { value: 'a1000000-0000-0000-0000-000000000001', label: 'Programat' },
  { value: 'a1000000-0000-0000-0000-000000000002', label: 'Confirmat' },
  { value: 'a1000000-0000-0000-0000-000000000003', label: 'Finalizat' },
  { value: 'a1000000-0000-0000-0000-000000000004', label: 'Anulat' },
  { value: 'a1000000-0000-0000-0000-000000000005', label: 'Neprezentare' },
]

const DEFAULT_STATUS_ID = 'a1000000-0000-0000-0000-000000000001' // Programat

interface AppointmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateAppointmentPayload | UpdateAppointmentPayload) => void
  isLoading: boolean
  editData: AppointmentDto | null
  patientLookup: PatientLookupDto[]
  doctorLookup: DoctorLookupDto[]
  serverError?: string | null
}

export const AppointmentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
  patientLookup,
  doctorLookup,
  serverError,
}: AppointmentFormModalProps) => {
  const isEdit = !!editData

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(appointmentSchema) as any,
    defaultValues: {
      patientId: '', doctorId: '', date: '', startTime: '', endTime: '',
      statusId: DEFAULT_STATUS_ID, notes: '',
    },
  })

  // Populare la editare / reset la creare
  useEffect(() => {
    if (!isOpen) return

    if (editData) {
      const startDate = new Date(editData.startTime)
      const endDate = new Date(editData.endTime)
      reset({
        patientId: editData.patientId,
        doctorId:  editData.doctorId,
        date:      editData.startTime.slice(0, 10),
        startTime: startDate.toTimeString().slice(0, 5),
        endTime:   endDate.toTimeString().slice(0, 5),
        statusId:  editData.statusId ?? '',
        notes:     editData.notes ?? '',
      })
    } else {
      reset({
        patientId: '', doctorId: '',
        date: new Date().toISOString().slice(0, 10),
        startTime: '', endTime: '',
        statusId: DEFAULT_STATUS_ID, notes: '',
      })
    }
  }, [isOpen, editData, reset])

  const handleFormSubmit = (data: AppointmentFormData) => {
    const payload: CreateAppointmentPayload = {
      patientId: data.patientId,
      doctorId:  data.doctorId,
      startTime: `${data.date}T${data.startTime}:00`,
      endTime:   `${data.date}T${data.endTime}:00`,
      statusId:  data.statusId || null,
      notes:     data.notes || null,
    }
    onSubmit(isEdit ? { ...payload, id: editData!.id } : payload)
  }

  if (!isOpen) return null

  const footerContent = (
    <>
      <AppButton variant="outline-secondary" onClick={onClose} disabled={isLoading}>
        Anulează
      </AppButton>
      <AppButton type="submit" variant="primary" isLoading={isLoading} loadingText="Se salvează...">
        {isEdit ? 'Salvează' : 'Adaugă'}
      </AppButton>
    </>
  )

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={620}
      title={isEdit ? 'Editează Programare' : 'Programare Nouă'}
      as="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      footer={footerContent}
      bodyClassName={styles.modalBody}
    >
      {serverError && (
        <div className="alert alert-danger py-2 mb-0" role="alert">{serverError}</div>
      )}

      {/* Pacient */}
      <div className="row g-3">
        <div className="col-12">
          <FormSelect<AppointmentFormData>
            name="patientId"
            control={control}
            label="Pacient"
            required
            options={patientLookup.map(p => ({
              value: p.id,
              label: `${p.fullName}${p.cnp ? ` (${p.cnp})` : ''}`,
            }))}
            allowFiltering
            showClearButton
            placeholder="Selectează pacient..."
          />
        </div>
      </div>

      {/* Doctor */}
      <div className="row g-3">
        <div className="col-12">
          <FormSelect<AppointmentFormData>
            name="doctorId"
            control={control}
            label="Doctor"
            required
            options={doctorLookup.map(d => ({
              value: d.id,
              label: `${d.fullName}${d.specialtyName ? ` (${d.specialtyName})` : ''}`,
            }))}
            allowFiltering
            showClearButton
            placeholder="Selectează doctor..."
          />
        </div>
      </div>

      {/* Data + Ore */}
      <div className="row g-3">
        <div className="col-md-4">
          <FormDatePicker<AppointmentFormData>
            name="date"
            control={control}
            label="Data"
            required
          />
        </div>
        <div className="col-md-4">
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Ora început <span className={styles.required}>*</span>
            </label>
            <input
              type="time"
              className={`${styles.timeInput}${errors.startTime ? ` ${styles.hasError}` : ''}`}
              {...register('startTime')}
            />
            {errors.startTime && <span className={styles.error}>{errors.startTime.message}</span>}
          </div>
        </div>
        <div className="col-md-4">
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Ora sfârșit <span className={styles.required}>*</span>
            </label>
            <input
              type="time"
              className={`${styles.timeInput}${errors.endTime ? ` ${styles.hasError}` : ''}`}
              {...register('endTime')}
            />
            {errors.endTime && <span className={styles.error}>{errors.endTime.message}</span>}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="row g-3">
        <div className="col-12">
          <FormSelect<AppointmentFormData>
            name="statusId"
            control={control}
            label="Status"
            options={APPOINTMENT_STATUS_OPTIONS}
            showClearButton
          />
        </div>
      </div>

      {/* Observații */}
      <div className="row g-3">
        <div className="col-12">
          <FormInput<AppointmentFormData>
            name="notes"
            control={control}
            label="Observații"
            placeholder="Observații (opțional)"
            multiline
            rows={3}
          />
        </div>
      </div>
    </AppModal>
  )
}

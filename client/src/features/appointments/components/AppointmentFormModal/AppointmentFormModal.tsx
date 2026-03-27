import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { appointmentSchema, type AppointmentFormData } from '../../schemas/appointment.schema'
import type { AppointmentDto, CreateAppointmentPayload, UpdateAppointmentPayload, PatientLookupDto } from '../../types/appointment.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormDatePicker } from '@/components/forms/FormDatePicker'
import { AppButton } from '@/components/ui/AppButton'
import { toLocalDateISO } from '@/utils/format'
// ── Time picker inline ────────────────────────────────────────────────────────
const TIME_HOURS    = Array.from({ length: 14 }, (_, i) => i + 7)   // 07–20
const TIME_MINUTES  = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

interface TimeSelectProps {
  value: string                  // "HH:mm"
  onChange: (v: string) => void
  hasError?: boolean
}

const TimeSelect = ({ value, onChange, hasError }: TimeSelectProps) => {
  const parts   = value ? value.split(':') : ['07', '00']
  const hVal    = parseInt(parts[0], 10)
  const mVal    = parseInt(parts[1], 10)

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className={`${styles.timeSelectGroup}${hasError ? ` ${styles['timeSelectGroup--error']}` : ''}`}>
      <select
        className={styles.timeSelectPart}
        value={hVal}
        onChange={e => onChange(`${pad(Number(e.target.value))}:${pad(mVal)}`)}
      >
        {TIME_HOURS.map(h => (
          <option key={h} value={h}>{pad(h)}</option>
        ))}
      </select>
      <span className={styles.timeSelectSep}>:</span>
      <select
        className={styles.timeSelectPart}
        value={mVal}
        onChange={e => onChange(`${pad(hVal)}:${pad(Number(e.target.value))}`)}
      >
        {TIME_MINUTES.map(m => (
          <option key={m} value={m}>{pad(m)}</option>
        ))}
      </select>
    </div>
  )
}
const APPOINTMENT_STATUS_OPTIONS = [
  { value: 'a1000000-0000-0000-0000-000000000001', label: 'Programat' },
  { value: 'a1000000-0000-0000-0000-000000000002', label: 'Confirmat' },
  { value: 'a1000000-0000-0000-0000-000000000003', label: 'Finalizat' },
  { value: 'a1000000-0000-0000-0000-000000000004', label: 'Anulat' },
  { value: 'a1000000-0000-0000-0000-000000000005', label: 'Neprezentare' },
]

const DEFAULT_STATUS_ID = 'a1000000-0000-0000-0000-000000000001' // Programat

interface CreateDefaults {
  doctorId?: string
  date?: string
  startTime?: string
  endTime?: string
}

interface AppointmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateAppointmentPayload | UpdateAppointmentPayload) => void
  isLoading: boolean
  editData: AppointmentDto | null
  patientLookup: PatientLookupDto[]
  doctorLookup: DoctorLookupDto[]
  serverError?: string | null
  createDefaults?: CreateDefaults
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
  createDefaults,
}: AppointmentFormModalProps) => {
  const isEdit = !!editData

  const {
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
        patientId: '',
        doctorId:  createDefaults?.doctorId ?? '',
        date:      createDefaults?.date ?? toLocalDateISO(new Date()),
        startTime: createDefaults?.startTime ?? '',
        endTime:   createDefaults?.endTime ?? '',
        statusId:  DEFAULT_STATUS_ID,
        notes:     '',
      })
    }
  }, [isOpen, editData, createDefaults, reset])

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
            <Controller
              name="startTime"
              control={control}
              render={({ field }) => (
                <TimeSelect
                  value={field.value}
                  onChange={field.onChange}
                  hasError={!!errors.startTime}
                />
              )}
            />
            {errors.startTime && <span className={styles.error}>{errors.startTime.message}</span>}
          </div>
        </div>
        <div className="col-md-4">
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Ora sfârșit <span className={styles.required}>*</span>
            </label>
            <Controller
              name="endTime"
              control={control}
              render={({ field }) => (
                <TimeSelect
                  value={field.value}
                  onChange={field.onChange}
                  hasError={!!errors.endTime}
                />
              )}
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

import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { appointmentSchema, toMinutes, type AppointmentFormData } from '../../schemas/appointment.schema'
import type { AppointmentDto, CreateAppointmentPayload, UpdateAppointmentPayload } from '../../types/appointment.types'
import type { PatientLookupDto } from '@/features/patients/types/patient.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import type { ClinicScheduleDto, DoctorScheduleDto } from '@/features/clinic/types/schedule.types'
import { useAppointmentConflicts, useAppointmentStatuses, type ConflictCheckParams } from '../../hooks/useAppointments'
import { useClinicSchedule, useDoctorSchedules } from '@/features/clinic/hooks/useSchedule'
import { useDebounce } from '@/hooks/useDebounce'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormDatePicker } from '@/components/forms/FormDatePicker'
import { AppButton } from '@/components/ui/AppButton'
import { minutesOfLocal, toLocalDateISO } from '@/utils/format'
import styles from './AppointmentFormModal.module.scss'

// ── Time picker inline ────────────────────────────────────────────────────────
/** Fereastra implicită când programul nu e configurat */
const FALLBACK_FROM_MIN = 7 * 60
const FALLBACK_TO_MIN   = 20 * 60
const MINUTE_STEP       = 5
const DEFAULT_DURATION  = 30

const pad = (n: number) => String(n).padStart(2, '0')
const minutesToTime = (total: number) => `${pad(Math.floor(total / 60))}:${pad(total % 60)}`

const addMinutesToTime = (time: string, minutes: number): string =>
  minutesToTime(toMinutes(time) + minutes)

interface TimeSelectProps {
  value: string                  // "HH:mm"
  onChange: (v: string) => void
  hasError?: boolean
  /** Fereastra permisă, în minute de la miezul nopții */
  minMinutes: number
  maxMinutes: number
  ariaLabel: string
}

const TimeSelect = ({ value, onChange, hasError, minMinutes, maxMinutes, ariaLabel }: TimeSelectProps) => {
  const [hStr, mStr] = (value || '').split(':')
  const hVal = hStr !== undefined && hStr !== '' && Number.isFinite(Number(hStr)) ? Number(hStr) : Math.floor(minMinutes / 60)
  const mVal = mStr !== undefined && Number.isFinite(Number(mStr)) ? Number(mStr) : 0

  // Orele din fereastră + valoarea curentă chiar dacă e în afara ei (date istorice)
  const hours = useMemo(() => {
    const from = Math.floor(minMinutes / 60)
    const to   = Math.max(from, Math.floor(maxMinutes / 60))
    const base = Array.from({ length: to - from + 1 }, (_, i) => from + i)
    return base.includes(hVal) ? base : [...base, hVal].sort((a, b) => a - b)
  }, [minMinutes, maxMinutes, hVal])

  const minutes = useMemo(() => {
    const base = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => i * MINUTE_STEP)
    return base.includes(mVal) ? base : [...base, mVal].sort((a, b) => a - b)
  }, [mVal])

  return (
    <div className={`${styles.timeSelectGroup}${hasError ? ` ${styles['timeSelectGroup--error']}` : ''}`}>
      <select
        className={styles.timeSelectPart}
        aria-label={`${ariaLabel} — ora`}
        value={hVal}
        onChange={e => onChange(`${pad(Number(e.target.value))}:${pad(mVal)}`)}
      >
        {hours.map(h => (
          <option key={h} value={h}>{pad(h)}</option>
        ))}
      </select>
      <span className={styles.timeSelectSep}>:</span>
      <select
        className={styles.timeSelectPart}
        aria-label={`${ariaLabel} — minutul`}
        value={mVal}
        onChange={e => onChange(`${pad(hVal)}:${pad(Number(e.target.value))}`)}
      >
        {minutes.map(m => (
          <option key={m} value={m}>{pad(m)}</option>
        ))}
      </select>
    </div>
  )
}

// ── Program de lucru ──────────────────────────────────────────────────────────
interface ScheduleWindow {
  fromMin: number
  toMin: number
  /** Motivul pentru care ziua nu e lucrătoare (clinică închisă / doctorul nu lucrează) */
  closedReason?: string
}

/**
 * Fereastra efectivă = program clinică ∩ program doctor pentru ziua aleasă.
 * Aceeași regulă ca în SP: programul se aplică doar dacă este configurat.
 */
const computeScheduleWindow = (
  date: string,
  doctorId: string,
  clinicSchedule: ClinicScheduleDto[],
  doctorSchedules: DoctorScheduleDto[],
): ScheduleWindow => {
  let fromMin = FALLBACK_FROM_MIN
  let toMin = FALLBACK_TO_MIN
  if (!date) return { fromMin, toMin }

  const jsDow = new Date(`${date}T00:00:00`).getDay()
  const dow = jsDow === 0 ? 7 : jsDow

  if (clinicSchedule.length > 0) {
    const entry = clinicSchedule.find(e => e.dayOfWeek === dow)
    if (!entry?.isOpen || !entry.openTime || !entry.closeTime) {
      return { fromMin, toMin, closedReason: 'Clinica este închisă în ziua selectată.' }
    }
    fromMin = toMinutes(entry.openTime.slice(0, 5))
    toMin = toMinutes(entry.closeTime.slice(0, 5))
  }

  const doctorDays = doctorSchedules.filter(e => e.doctorId === doctorId && e.dayOfWeek != null)
  if (doctorId && doctorDays.length > 0) {
    const day = doctorDays.find(e => e.dayOfWeek === dow)
    if (!day?.startTime || !day.endTime) {
      return { fromMin, toMin, closedReason: 'Doctorul nu lucrează în ziua selectată.' }
    }
    fromMin = Math.max(fromMin, toMinutes(day.startTime.slice(0, 5)))
    toMin = Math.min(toMin, toMinutes(day.endTime.slice(0, 5)))
  }

  return { fromMin, toMin }
}

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
  /** Acces Full — poate programa în afara programului de lucru (urgențe) */
  canOverrideSchedule?: boolean
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
  canOverrideSchedule = false,
}: AppointmentFormModalProps) => {
  const isEdit = !!editData

  const { data: statusesResp } = useAppointmentStatuses()
  const { data: clinicScheduleResp } = useClinicSchedule()
  const { data: doctorSchedulesResp } = useDoctorSchedules()

  const statuses = useMemo(() => statusesResp?.data ?? [], [statusesResp])
  // La editare se oferă doar statusul curent + tranzițiile permise din el
  const statusOptions = useMemo(() => {
    const current = editData ? statuses.find(s => s.id === editData.statusId) : undefined
    const allowed = current ? new Set((current.allowedNextCodes ?? '').split(',').filter(Boolean)) : null
    return statuses
      .filter(s => !allowed || s.id === current!.id || allowed.has(s.code))
      .map(s => ({ value: s.id, label: s.name }))
  }, [statuses, editData])
  // Status implicit la creare = primul din nomenclator (SortOrder minim)
  const defaultStatusId = statuses[0]?.id ?? ''

  const {
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    register,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(appointmentSchema) as any,
    defaultValues: {
      patientId: '', doctorId: '', date: '', startTime: '', endTime: '',
      statusId: '', notes: '', overrideSchedule: false,
    },
  })

  // Pentru programări noi, ora de sfârșit urmărește mereu ora de început (+30 min)
  const startTimeValue = watch('startTime')
  useEffect(() => {
    if (!isEdit && startTimeValue) {
      setValue('endTime', addMinutesToTime(startTimeValue, DEFAULT_DURATION), { shouldValidate: true })
    }
  }, [isEdit, setValue, startTimeValue])

  // Populare la editare / reset la creare
  useEffect(() => {
    if (!isOpen) return

    if (editData) {
      reset({
        patientId: editData.patientId,
        doctorId:  editData.doctorId,
        date:      toLocalDateISO(new Date(editData.startTime)),
        startTime: minutesToTime(minutesOfLocal(editData.startTime)),
        endTime:   minutesToTime(minutesOfLocal(editData.endTime)),
        statusId:  editData.statusId ?? '',
        notes:     editData.notes ?? '',
        overrideSchedule: false,
      })
    } else {
      reset({
        patientId: '',
        doctorId:  createDefaults?.doctorId ?? '',
        date:      createDefaults?.date ?? toLocalDateISO(new Date()),
        startTime: createDefaults?.startTime ?? '',
        endTime:   createDefaults?.endTime ?? '',
        statusId:  '',
        notes:     '',
        overrideSchedule: false,
      })
    }
  }, [isOpen, editData, createDefaults, reset])

  // Nomenclatorul poate sosi după deschidere — se completează doar statusul, fără reset
  const statusIdValue = watch('statusId')
  useEffect(() => {
    if (isOpen && !isEdit && !statusIdValue && defaultStatusId) {
      setValue('statusId', defaultStatusId)
    }
  }, [isOpen, isEdit, statusIdValue, defaultStatusId, setValue])

  // ── Program de lucru + conflicte (avertizări non-blocante) ─────────────────
  const dateValue = watch('date')
  const doctorIdValue = watch('doctorId')
  const endTimeValue = watch('endTime')

  const scheduleWindow = useMemo(
    () => computeScheduleWindow(
      dateValue, doctorIdValue, clinicScheduleResp?.data ?? [], doctorSchedulesResp?.data ?? []),
    [dateValue, doctorIdValue, clinicScheduleResp, doctorSchedulesResp],
  )

  const hasValidInterval = /^\d{2}:\d{2}$/.test(startTimeValue ?? '') && /^\d{2}:\d{2}$/.test(endTimeValue ?? '')
    && toMinutes(endTimeValue) > toMinutes(startTimeValue)

  const scheduleWarning = useMemo(() => {
    if (!dateValue || !hasValidInterval) return null
    if (scheduleWindow.closedReason) return scheduleWindow.closedReason
    const start = toMinutes(startTimeValue)
    const end = toMinutes(endTimeValue)
    if (start < scheduleWindow.fromMin || end > scheduleWindow.toMin) {
      return `Intervalul este în afara programului de lucru (${minutesToTime(scheduleWindow.fromMin)}–${minutesToTime(scheduleWindow.toMin)}).`
    }
    return null
  }, [dateValue, hasValidInterval, scheduleWindow, startTimeValue, endTimeValue])

  const conflictParams = useMemo<ConflictCheckParams | null>(() => {
    if (!isOpen || !doctorIdValue || !dateValue || !hasValidInterval) return null
    return {
      doctorId:  doctorIdValue,
      startTime: `${dateValue}T${startTimeValue}:00`,
      endTime:   `${dateValue}T${endTimeValue}:00`,
      excludeId: editData?.id,
    }
  }, [isOpen, doctorIdValue, dateValue, hasValidInterval, startTimeValue, endTimeValue, editData])
  const debouncedConflictParams = useDebounce(conflictParams, 400)
  const { data: conflictsResp } = useAppointmentConflicts(debouncedConflictParams)
  const conflicts = conflictParams ? conflictsResp?.data ?? [] : []

  const handleFormSubmit = (data: AppointmentFormData) => {
    const payload: CreateAppointmentPayload = {
      patientId: data.patientId,
      doctorId:  data.doctorId,
      startTime: `${data.date}T${data.startTime}:00`,
      endTime:   `${data.date}T${data.endTime}:00`,
      statusId:  data.statusId || null,
      notes:     data.notes || null,
      overrideSchedule: canOverrideSchedule && !!scheduleWarning && !!data.overrideSchedule,
    }
    onSubmit(isEdit ? { ...payload, id: editData!.id, rowVersion: editData!.rowVersion } : payload)
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
                  minMinutes={scheduleWindow.fromMin}
                  maxMinutes={scheduleWindow.toMin}
                  ariaLabel="Ora început"
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
                  minMinutes={scheduleWindow.fromMin}
                  maxMinutes={scheduleWindow.toMin}
                  ariaLabel="Ora sfârșit"
                />
              )}
            />
            {errors.endTime && <span className={styles.error}>{errors.endTime.message}</span>}
          </div>
        </div>
      </div>

      {scheduleWarning && (
        <div className="alert alert-warning py-2 mb-0" role="alert">
          {scheduleWarning}
          {canOverrideSchedule && (
            <div className="form-check mt-2 mb-0">
              <input
                id="appointmentOverrideSchedule"
                type="checkbox"
                className="form-check-input"
                {...register('overrideSchedule')}
              />
              <label htmlFor="appointmentOverrideSchedule" className="form-check-label">
                Programare în afara programului (urgență)
              </label>
            </div>
          )}
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="alert alert-warning py-2 mb-0" role="alert">
          Intervalul se suprapune cu:
          <ul className="mb-0 ps-3">
            {conflicts.map(c => (
              <li key={c.id}>
                {c.patientName} ({minutesToTime(minutesOfLocal(c.startTime))}–{minutesToTime(minutesOfLocal(c.endTime))}, {c.statusName})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Status */}
      <div className="row g-3">
        <div className="col-12">
          <FormSelect<AppointmentFormData>
            name="statusId"
            control={control}
            label="Status"
            options={statusOptions}
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

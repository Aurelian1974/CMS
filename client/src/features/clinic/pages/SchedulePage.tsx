import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppButton } from '@/components/ui/AppButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  useClinicSchedule,
  useUpsertClinicDay,
  useDoctorSchedules,
  useUpsertDoctorDay,
  useDeleteDoctorDay,
} from '../hooks/useSchedule'
import type { ClinicScheduleDto, DoctorScheduleDto, UpsertClinicDayPayload, UpsertDoctorDayPayload } from '../types/schedule.types'
import styles from './SchedulePage.module.scss'

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS: Record<number, string> = {
  1: 'Luni',
  2: 'Marți',
  3: 'Miercuri',
  4: 'Joi',
  5: 'Vineri',
  6: 'Sâmbătă',
  7: 'Duminică',
}

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7]

const TIME_HOURS   = Array.from({ length: 24 }, (_, i) => i)
const TIME_MINUTES = [0, 15, 30, 45]

// ── TimeSelect component ──────────────────────────────────────────────────────

interface TimeSelectProps {
  value: string   // "HH:mm"
  onChange: (v: string) => void
}

const TimeSelect = ({ value, onChange }: TimeSelectProps) => {
  const parts = value ? value.split(':') : ['08', '00']
  const hVal  = parseInt(parts[0], 10)
  const mVal  = parseInt(parts[1], 10)
  const pad   = (n: number) => String(n).padStart(2, '0')

  return (
    <div className={styles.timeSelect}>
      <select
        value={hVal}
        onChange={e => onChange(`${pad(Number(e.target.value))}:${pad(mVal)}`)}
      >
        {TIME_HOURS.map(h => <option key={h} value={h}>{pad(h)}</option>)}
      </select>
      <span>:</span>
      <select
        value={mVal}
        onChange={e => onChange(`${pad(hVal)}:${pad(Number(e.target.value))}`)}
      >
        {TIME_MINUTES.map(m => <option key={m} value={m}>{pad(m)}</option>)}
      </select>
    </div>
  )
}

// ── ClinicScheduleRow ─────────────────────────────────────────────────────────

interface ClinicRowProps {
  day: number
  entry: ClinicScheduleDto | undefined
  saving: boolean
  onSave: (payload: UpsertClinicDayPayload) => void
}

const ClinicScheduleRow = ({ day, entry, saving, onSave }: ClinicRowProps) => {
  const [isOpen, setIsOpen]     = useState(entry?.isOpen ?? false)
  const [openTime, setOpenTime] = useState(entry?.openTime ?? '08:00')
  const [closeTime, setCloseTime] = useState(entry?.closeTime ?? '17:00')

  // Sync when entry changes from server
  useState(() => {
    if (entry) {
      setIsOpen(entry.isOpen)
      setOpenTime(entry.openTime ?? '08:00')
      setCloseTime(entry.closeTime ?? '17:00')
    }
  })

  const handleSave = () => {
    onSave({
      dayOfWeek: day,
      isOpen,
      openTime: isOpen ? openTime : null,
      closeTime: isOpen ? closeTime : null,
    })
  }

  return (
    <div className={`${styles.clinicRow} ${!isOpen ? styles.clinicRowClosed : ''}`}>
      <div className={styles.clinicDayName}>{DAYS[day]}</div>

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={isOpen}
          onChange={e => setIsOpen(e.target.checked)}
        />
        <span className={styles.toggleSlider} />
        <span className={styles.toggleLabel}>{isOpen ? 'Deschis' : 'Închis'}</span>
      </label>

      {isOpen ? (
        <div className={styles.clinicTimes}>
          <span className={styles.timeLabel}>De la</span>
          <TimeSelect value={openTime} onChange={setOpenTime} />
          <span className={styles.timeLabel}>până la</span>
          <TimeSelect value={closeTime} onChange={setCloseTime} />
        </div>
      ) : (
        <div className={styles.closedPlaceholder}>Clinic închis</div>
      )}

      <AppButton
        variant="primary"
        size="sm"
        onClick={handleSave}
        isLoading={saving}
      >
        Salvează
      </AppButton>
    </div>
  )
}

// ── DoctorCard ────────────────────────────────────────────────────────────────

interface DoctorCardProps {
  doctorId: string
  doctorName: string
  specialtyName: string | null
  days: DoctorScheduleDto[]
  onAddDay: (doctorId: string) => void
  onEditDay: (entry: DoctorScheduleDto) => void
  onDeleteDay: (doctorId: string, dayOfWeek: number) => void
}

const DoctorCard = ({
  doctorId, doctorName, specialtyName, days, onAddDay, onEditDay, onDeleteDay
}: DoctorCardProps) => {
  const sortedDays = [...days].sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0))

  return (
    <div className={styles.doctorCard}>
      <div className={styles.doctorCardHeader}>
        <div className={styles.doctorInfo}>
          <div className={styles.doctorAvatar}>{doctorName.charAt(0)}</div>
          <div>
            <div className={styles.doctorName}>{doctorName}</div>
            {specialtyName && <div className={styles.doctorSpecialty}>{specialtyName}</div>}
          </div>
        </div>
        <button
          className={styles.addDayBtn}
          onClick={() => onAddDay(doctorId)}
          title="Adaugă zi"
        >
          +
        </button>
      </div>

      {sortedDays.length === 0 ? (
        <div className={styles.noDays}>Nicio zi configurată</div>
      ) : (
        <div className={styles.doctorDays}>
          {sortedDays.map(d => (
            <div key={d.dayOfWeek} className={styles.doctorDayRow}>
              <span className={styles.doctorDayName}>{DAYS[d.dayOfWeek!]}</span>
              <span className={styles.doctorDayTime}>{d.startTime} – {d.endTime}</span>
              <div className={styles.doctorDayActions}>
                <button
                  className={styles.editBtn}
                  onClick={() => onEditDay(d)}
                  title="Editează"
                >
                  <EditIcon />
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => onDeleteDay(doctorId, d.dayOfWeek!)}
                  title="Șterge"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── DoctorDayModal ────────────────────────────────────────────────────────────

interface DoctorDayModalProps {
  doctorId: string
  usedDays: number[]
  entry: DoctorScheduleDto | null   // null = create
  onClose: () => void
  onSave: (payload: UpsertDoctorDayPayload) => void
  saving: boolean
}

const DoctorDayModal = ({ doctorId: _doctorId, usedDays, entry, onClose, onSave, saving }: DoctorDayModalProps) => {
  const availableDays = entry
    ? ALL_DAYS  // editing existing — can keep same day
    : ALL_DAYS.filter(d => !usedDays.includes(d))

  const [dayOfWeek, setDayOfWeek] = useState<number>(entry?.dayOfWeek ?? availableDays[0] ?? 1)
  const [startTime, setStartTime] = useState(entry?.startTime ?? '08:00')
  const [endTime, setEndTime]     = useState(entry?.endTime   ?? '17:00')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ dayOfWeek, startTime, endTime })
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{entry ? 'Editare zi' : 'Adaugă zi'}</h3>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formField}>
            <label>Zi</label>
            <select
              value={dayOfWeek}
              onChange={e => setDayOfWeek(Number(e.target.value))}
              disabled={!!entry}
              className={styles.daySelect}
            >
              {availableDays.map(d => <option key={d} value={d}>{DAYS[d]}</option>)}
            </select>
          </div>
          <div className={styles.formField}>
            <label>Oră start</label>
            <TimeSelect value={startTime} onChange={setStartTime} />
          </div>
          <div className={styles.formField}>
            <label>Oră final</label>
            <TimeSelect value={endTime} onChange={setEndTime} />
          </div>
          <div className={styles.modalActions}>
            <AppButton variant="secondary" size="sm" onClick={onClose} type="button">
              Anulează
            </AppButton>
            <AppButton variant="primary" size="sm" type="submit" isLoading={saving}>
              Salvează
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Inline icons ──────────────────────────────────────────────────────────────

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)

// ── Main page ─────────────────────────────────────────────────────────────────

const SchedulePage = () => {
  const { data: clinicResp, isLoading: loadingClinic } = useClinicSchedule()
  const { data: doctorsResp, isLoading: loadingDoctors } = useDoctorSchedules()

  const upsertClinicDay = useUpsertClinicDay()
  const upsertDoctorDay = useUpsertDoctorDay()
  const deleteDoctorDay = useDeleteDoctorDay()

  const [doctorModal, setDoctorModal] = useState<{
    doctorId: string
    entry: DoctorScheduleDto | null
  } | null>(null)

  // Group doctor schedule entries by doctorId
  const doctorMap = useMemo(() => {
    const entries = doctorsResp?.data ?? []
    const map = new Map<string, { name: string; specialty: string | null; days: DoctorScheduleDto[] }>()
    for (const e of entries) {
      if (!map.has(e.doctorId)) {
        map.set(e.doctorId, { name: e.doctorName, specialty: e.specialtyName, days: [] })
      }
      // Skip rows where dayOfWeek is null (doctor without schedule entries)
      if (e.dayOfWeek != null) {
        map.get(e.doctorId)!.days.push(e)
      }
    }
    return map
  }, [doctorsResp])

  const clinicSchedule = clinicResp?.data ?? []

  const handleClinicSave = (payload: UpsertClinicDayPayload) => {
    upsertClinicDay.mutate(payload)
  }

  const handleDoctorDaySave = (payload: UpsertDoctorDayPayload) => {
    if (!doctorModal) return
    upsertDoctorDay.mutate(
      { doctorId: doctorModal.doctorId, payload },
      { onSuccess: () => setDoctorModal(null) }
    )
  }

  const handleDeleteDay = (doctorId: string, dayOfWeek: number) => {
    if (!confirm(`Ștergi ziua ${DAYS[dayOfWeek]} pentru acest doctor?`)) return
    deleteDoctorDay.mutate({ doctorId, dayOfWeek })
  }

  if (loadingClinic || loadingDoctors) return <LoadingSpinner />

  return (
    <div className={styles.page}>
      <PageHeader title="Program" subtitle="Gestionare program clinică și medici" />

      {/* ── Program clinică ──────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Program Clinică</h2>
        <p className={styles.sectionSubtitle}>Configurați orele de funcționare în fiecare zi a săptămânii.</p>
        <div className={styles.clinicTable}>
          {ALL_DAYS.map(day => (
            <ClinicScheduleRow
              key={day}
              day={day}
              entry={clinicSchedule.find(e => e.dayOfWeek === day)}
              saving={upsertClinicDay.isPending}
              onSave={handleClinicSave}
            />
          ))}
        </div>
      </section>

      {/* ── Program medici ───────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Program Medici</h2>
        <p className={styles.sectionSubtitle}>Configurați programul individual al fiecărui medic.</p>

        {doctorMap.size === 0 ? (
          <div className={styles.emptyState}>Niciun medic înregistrat.</div>
        ) : (
          <div className={styles.doctorGrid}>
            {Array.from(doctorMap.entries()).map(([doctorId, { name, specialty, days }]) => (
              <DoctorCard
                key={doctorId}
                doctorId={doctorId}
                doctorName={name}
                specialtyName={specialty}
                days={days}
                onAddDay={id => setDoctorModal({ doctorId: id, entry: null })}
                onEditDay={entry => setDoctorModal({ doctorId: entry.doctorId, entry })}
                onDeleteDay={handleDeleteDay}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Modal adaugă/editează zi medic ──────────────────────────────── */}
      {doctorModal && (
        <DoctorDayModal
          doctorId={doctorModal.doctorId}
          usedDays={
            (doctorMap.get(doctorModal.doctorId)?.days ?? [])
              .filter(d => doctorModal.entry == null || d.dayOfWeek !== doctorModal.entry.dayOfWeek)
              .map(d => d.dayOfWeek)
              .filter((d): d is number => d != null)
          }
          entry={doctorModal.entry}
          onClose={() => setDoctorModal(null)}
          onSave={handleDoctorDaySave}
          saving={upsertDoctorDay.isPending}
        />
      )}
    </div>
  )
}

export default SchedulePage

import { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppointmentsForScheduler, useCreateAppointment, useUpdateAppointment } from '../hooks/useAppointments'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { usePatientLookup } from '@/features/patients/hooks/usePatients'
import { useClinicSchedule, useDoctorSchedules } from '@/features/clinic/hooks/useSchedule'
import type { AppointmentDto, AppointmentSchedulerDto, CreateAppointmentPayload, UpdateAppointmentPayload } from '../types/appointment.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import type { ClinicScheduleDto } from '@/features/clinic/types/schedule.types'
import { AppointmentFormModal } from '../components/AppointmentFormModal/AppointmentFormModal'
import styles from './AppointmentsSchedulerPage.module.scss'

// ── Icoane SVG inline ─────────────────────────────────────────────────────────
const IconChevronLeft  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
const IconChevronRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 6 15 12 9 18"/></svg>
const IconList         = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const IconPlus         = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconUser         = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IconClock        = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IconCalendar     = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IconNote         = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
const IconTag          = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
const IconCheck        = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>

// ── Constante scheduler ───────────────────────────────────────────────────────
const HOUR_START = 7    // 07:00
const HOUR_END   = 20   // 20:00
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)
const SLOT_WIDTH_PX = 156 // pixel width per hour

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDateISO = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const formatDateDisplay = (d: Date): string =>
  d.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const addDays = (d: Date, n: number): Date => {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

const getEventModifier = (code: string | null): string => {
  if (!code) return ''
  switch (code.toUpperCase()) {
    case 'CONFIRMAT':    return styles['eventBar--confirmed']
    case 'FINALIZAT':    return styles['eventBar--completed']
    case 'ANULAT':       return styles['eventBar--cancelled']
    case 'NEPREZENTARE': return styles['eventBar--noshow']
    default:             return ''
  }
}

const formatHour = (h: number): string =>
  `${String(h).padStart(2, '0')}:00`

// ── Schedule helpers ──────────────────────────────────────────────────────────

/** Converteste string 'HH:MM' în minute de la miezul nopții */
const parseTime = (t: string | null | undefined): number | null => {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Converteste minute absolute în pixeli pe timeline */
const minutesToLeft = (min: number): number =>
  ((min - HOUR_START * 60) / 60) * SLOT_WIDTH_PX

interface BlockedRange { fromMin: number; toMin: number }

/**
 * Calculează zonele blocate din timeline pentru un doctor într-o zi.
 * Zona efectivă de lucru = intersecția programului clinicii cu cel al doctorului.
 */
const getBlockedRanges = (
  clinicEntry: ClinicScheduleDto | undefined,
  doctorDay: { startTime: string; endTime: string } | undefined,
): BlockedRange[] => {
  const tlStart = HOUR_START * 60
  const tlEnd   = HOUR_END   * 60

  if (!clinicEntry || !clinicEntry.isOpen) {
    return [{ fromMin: tlStart, toMin: tlEnd }]
  }

  const clinicFrom = parseTime(clinicEntry.openTime)  ?? tlStart
  const clinicTo   = parseTime(clinicEntry.closeTime) ?? tlEnd

  if (!doctorDay) {
    return [{ fromMin: tlStart, toMin: tlEnd }]
  }

  const docFrom = parseTime(doctorDay.startTime) ?? clinicFrom
  const docTo   = parseTime(doctorDay.endTime)   ?? clinicTo

  // Fereastra efectivă = intersecția
  const effFrom = Math.max(clinicFrom, docFrom)
  const effTo   = Math.min(clinicTo,   docTo)

  const ranges: BlockedRange[] = []
  if (effFrom > tlStart) ranges.push({ fromMin: tlStart, toMin: effFrom })
  if (effTo   < tlEnd)   ranges.push({ fromMin: effTo,   toMin: tlEnd })
  return ranges
}

const formatTimeShort = (dateStr: string): string => {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
}

/** Calculeaza pozitia si latime event in pixeli relativ la timeline */
const getEventPosition = (startTime: string, endTime: string): { left: number, width: number } => {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const startMinutes = start.getHours() * 60 + start.getMinutes()
  const endMinutes = end.getHours() * 60 + end.getMinutes()

  const offsetMinutes = startMinutes - HOUR_START * 60
  const durationMinutes = endMinutes - startMinutes

  const left = (offsetMinutes / 60) * SLOT_WIDTH_PX
  const width = Math.max((durationMinutes / 60) * SLOT_WIDTH_PX, 40) // minim 40px

  return { left, width }
}

/** Grupează programări pe doctorId */
const groupByDoctor = (appointments: AppointmentSchedulerDto[]): Map<string, AppointmentSchedulerDto[]> => {
  const map = new Map<string, AppointmentSchedulerDto[]>()
  for (const apt of appointments) {
    const list = map.get(apt.doctorId) ?? []
    list.push(apt)
    map.set(apt.doctorId, list)
  }
  return map
}

/** Adaptează AppointmentSchedulerDto pentru AppointmentFormModal (editare) */
const schedulerDtoToFormEditData = (apt: AppointmentSchedulerDto): AppointmentDto => ({
  ...apt,
  clinicId: '',
  patientPhone: null,
  specialtyName: null,
  isDeleted: false,
  createdAt: '',
  createdByName: null,
})

/** Rotunjește minutele la cel mai apropiat multiplu de 15 */
const roundToNearest15 = (totalMinutes: number): number => Math.round(totalMinutes / 15) * 15

const pad2 = (n: number) => String(n).padStart(2, '0')

// ── Tooltip ───────────────────────────────────────────────────────────────────
interface TooltipState {
  x: number
  y: number
  appointment: AppointmentSchedulerDto
}

// ── Componenta principală ─────────────────────────────────────────────────────
export const AppointmentsSchedulerPage = () => {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [doctorFilter, setDoctorFilter] = useState<string | undefined>(undefined)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Form modal state
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingSchedulerApt, setEditingSchedulerApt] = useState<AppointmentSchedulerDto | null>(null)
  const [formCreateDefaults, setFormCreateDefaults] = useState<{ doctorId?: string; date?: string; startTime?: string; endTime?: string } | undefined>()
  const [serverError, setServerError] = useState<string | null>(null)

  // Drag & drop state
  const dragInfoRef = useRef<{ apt: AppointmentSchedulerDto; offsetMinutes: number } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Date din API
  const dateFrom = formatDateISO(currentDate)
  const dateTo = formatDateISO(currentDate)
  const { data: schedulerResp, isLoading } = useAppointmentsForScheduler(dateFrom, dateTo, doctorFilter)
  const { data: doctorLookupResp } = useDoctorLookup()
  const { data: patientLookupResp } = usePatientLookup()
  const { data: clinicScheduleResp }  = useClinicSchedule()
  const { data: doctorSchedulesResp } = useDoctorSchedules()

  const appointments       = useMemo(() => schedulerResp?.data      ?? [], [schedulerResp])
  const doctorLookup       = useMemo(() => doctorLookupResp?.data   ?? [], [doctorLookupResp])
  const patientLookup      = useMemo(() => patientLookupResp?.data  ?? [], [patientLookupResp])
  const clinicSchedule     = useMemo(() => clinicScheduleResp?.data ?? [], [clinicScheduleResp])
  const allDoctorSchedules = useMemo(() => doctorSchedulesResp?.data ?? [], [doctorSchedulesResp])

  // Ziua săptămânii curentă (1=Luni … 7=Duminică)
  const jsDow    = currentDate.getDay()
  const currentDow = jsDow === 0 ? 7 : jsDow

  const clinicEntry = useMemo(
    () => clinicSchedule.find(e => e.dayOfWeek === currentDow),
    [clinicSchedule, currentDow],
  )

  /** Map doctorId → orele de lucru ale doctorului în ziua curentă */
  const doctorTodayMap = useMemo(() => {
    const map = new Map<string, { startTime: string; endTime: string }>()
    for (const e of allDoctorSchedules) {
      if (e.dayOfWeek === currentDow && e.startTime && e.endTime) {
        map.set(e.doctorId, { startTime: e.startTime, endTime: e.endTime })
      }
    }
    return map
  }, [allDoctorSchedules, currentDow])

  // Mutații
  const createAppointment = useCreateAppointment()
  const updateAppointment = useUpdateAppointment()

  // Grupare programări pe doctor
  const groupedByDoctor = useMemo(() => groupByDoctor(appointments), [appointments])

  // Lista doctorilor care au programări (sau toți dacă nu sunt programări)
  const displayDoctors = useMemo<DoctorLookupDto[]>(() => {
    if (doctorFilter) {
      return doctorLookup.filter(d => d.id === doctorFilter)
    }
    // Afișăm doctori care au programări + restul
    const withAppointments = new Set(groupedByDoctor.keys())
    const sorted = [...doctorLookup].sort((a, b) => {
      const aHas = withAppointments.has(a.id) ? 0 : 1
      const bHas = withAppointments.has(b.id) ? 0 : 1
      return aHas - bHas || a.fullName.localeCompare(b.fullName)
    })
    return sorted
  }, [doctorLookup, groupedByDoctor, doctorFilter])

  // Navigare dată
  const goToday = useCallback(() => setCurrentDate(new Date()), [])
  const goPrev = useCallback(() => setCurrentDate(d => addDays(d, -1)), [])
  const goNext = useCallback(() => setCurrentDate(d => addDays(d, 1)), [])

  // ── Form modal handlers ──────────────────────────────────────────────────────
  const handleOpenCreate = useCallback(() => {
    setEditingSchedulerApt(null)
    setFormCreateDefaults(undefined)
    setServerError(null)
    setFormModalOpen(true)
  }, [])

  /** Click pe un slot gol din timeline — deschide formularul de creare pre-completat */
  const handleSlotClick = useCallback((e: React.MouseEvent<HTMLDivElement>, doctorId: string) => {
    // Ignoră click-urile pe event bars (propagate din copil)
    if ((e.target as HTMLElement).closest('[data-event-bar]')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const totalMinutes = HOUR_START * 60 + (relX / SLOT_WIDTH_PX) * 60
    const startMin = Math.max(HOUR_START * 60, Math.min(roundToNearest15(totalMinutes), HOUR_END * 60 - 15))
    const endMin = Math.min(startMin + 60, HOUR_END * 60)
    setEditingSchedulerApt(null)
    setFormCreateDefaults({
      doctorId,
      date:      formatDateISO(currentDate),
      startTime: `${pad2(Math.floor(startMin / 60))}:${pad2(startMin % 60)}`,
      endTime:   `${pad2(Math.floor(endMin / 60))}:${pad2(endMin % 60)}`,
    })
    setServerError(null)
    setFormModalOpen(true)
  }, [currentDate])

  /** Click pe o programare existentă — deschide formularul de editare */
  const handleEventClick = useCallback((e: React.MouseEvent, apt: AppointmentSchedulerDto) => {
    e.stopPropagation()
    setTooltip(null)
    setEditingSchedulerApt(apt)
    setFormCreateDefaults(undefined)
    setServerError(null)
    setFormModalOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormModalOpen(false)
    setEditingSchedulerApt(null)
  }, [])

  const handleFormSubmit = useCallback((data: CreateAppointmentPayload | UpdateAppointmentPayload) => {
    const isEdit = 'id' in data
    const mutation = isEdit ? updateAppointment : createAppointment
    mutation.mutate(data as never, {
      onSuccess: () => {
        setFormModalOpen(false)
        setEditingSchedulerApt(null)
        setServerError(null)
      },
      onError: () => {
        setServerError('A apărut o eroare. Te rugăm să încerci din nou.')
      },
    })
  }, [createAppointment, updateAppointment])

  // ── Drag & Drop handlers ─────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, apt: AppointmentSchedulerDto) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const offsetMinutes = ((e.clientX - rect.left) / SLOT_WIDTH_PX) * 60
    dragInfoRef.current = { apt, offsetMinutes }
    setDraggingId(apt.id)
    e.dataTransfer.effectAllowed = 'move'
    // Vizibil drag image (browser default)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    dragInfoRef.current = null
  }, [])

  const handleTimelineDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleTimelineDrop = useCallback((e: React.DragEvent<HTMLDivElement>, doctorId: string) => {
    e.preventDefault()
    if (!dragInfoRef.current) return
    const { apt, offsetMinutes } = dragInfoRef.current
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const droppedMin = HOUR_START * 60 + (relX / SLOT_WIDTH_PX) * 60
    const durationMin = (new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / 60000
    const newStart = Math.max(HOUR_START * 60, Math.min(
      roundToNearest15(droppedMin - offsetMinutes),
      HOUR_END * 60 - Math.ceil(durationMin / 15) * 15,
    ))
    const newEnd = newStart + durationMin
    const dateStr = formatDateISO(currentDate)
    updateAppointment.mutate({
      id:        apt.id,
      patientId: apt.patientId,
      doctorId,
      startTime: `${dateStr}T${pad2(Math.floor(newStart / 60))}:${pad2(newStart % 60)}:00`,
      endTime:   `${dateStr}T${pad2(Math.floor(newEnd / 60))}:${pad2(newEnd % 60)}:00`,
      statusId:  apt.statusId,
      notes:     apt.notes,
    })
    dragInfoRef.current = null
    setDraggingId(null)
  }, [currentDate, updateAppointment])

  // Tooltip handlers
  const handleEventMouseEnter = useCallback((e: React.MouseEvent, apt: AppointmentSchedulerDto) => {
    clearTimeout(tooltipTimer.current)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      appointment: apt,
    })
  }, [])

  const handleEventMouseLeave = useCallback(() => {
    tooltipTimer.current = setTimeout(() => setTooltip(null), 150)
  }, [])

  // Now indicator position
  const now = new Date()
  const isToday = now.toDateString() === currentDate.toDateString()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowOffset = ((nowMinutes - HOUR_START * 60) / 60) * SLOT_WIDTH_PX
  const showNow = isToday && nowMinutes >= HOUR_START * 60 && nowMinutes <= HOUR_END * 60

  const timelineWidth = HOURS.length * SLOT_WIDTH_PX

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Scheduler Programări</h1>
          <p className={styles.pageSubtitle}>Vizualizare calendar programări pe doctori</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={() => navigate('/appointments')}>
            <IconList /> Vizualizare tabel
          </button>
          <button className={styles.btnPrimary} onClick={handleOpenCreate}>
            <IconPlus /> Programare nouă
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.dateNav}>
          <button className={styles.navBtn} onClick={goPrev}><IconChevronLeft /></button>
          <span className={styles.currentDate}>{formatDateDisplay(currentDate)}</span>
          <button className={styles.navBtn} onClick={goNext}><IconChevronRight /></button>
        </div>

        <button className={styles.todayBtn} onClick={goToday}>Astăzi</button>

        <div className={styles.toolbarDivider} />

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Doctor:</span>
          <select
            className={styles.filterSelect}
            value={doctorFilter ?? ''}
            onChange={e => setDoctorFilter(e.target.value || undefined)}
          >
            <option value="">Toți doctorii</option>
            {doctorLookup.map(d => (
              <option key={d.id} value={d.id}>{d.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scheduler Grid */}
      <div className={styles.schedulerWrapper}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Se încarcă...</span>
            </div>
          </div>
        ) : displayDoctors.length === 0 ? (
          <div className={styles.emptyState}>
            <IconCalendar />
            <span className={styles.emptyText}>Nu există doctori disponibili</span>
          </div>
        ) : (
          <div className={styles.schedulerGrid}>
            {/* Time header */}
            <div className={styles.timeHeader}>
              <div className={styles.timeHeaderLabel}>Doctor</div>
              <div style={{ display: 'flex', width: timelineWidth, minWidth: timelineWidth }}>
                {HOURS.map(h => (
                  <div key={h} className={styles.timeSlot} style={{ width: SLOT_WIDTH_PX, minWidth: SLOT_WIDTH_PX }}>
                    {formatHour(h)}
                  </div>
                ))}
              </div>
            </div>

            {/* Resource rows */}
            {displayDoctors.map(doctor => {
              const doctorAppointments = groupedByDoctor.get(doctor.id) ?? []

              return (
                <div key={doctor.id} className={styles.resourceRow}>
                  {/* Doctor label */}
                  <div className={styles.resourceLabel}>
                    <div className={styles.resourceAvatar}>{getInitials(doctor.fullName)}</div>
                    <div className={styles.resourceInfo}>
                      <span className={styles.resourceName}>{doctor.fullName}</span>
                      {doctor.specialtyName && (
                        <span className={styles.resourceSpecialty}>{doctor.specialtyName}</span>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div
                    className={styles.timelineCells}
                    style={{ width: timelineWidth, minWidth: timelineWidth, position: 'relative' }}
                    onClick={e => handleSlotClick(e, doctor.id)}
                    onDragOver={handleTimelineDragOver}
                    onDrop={e => handleTimelineDrop(e, doctor.id)}
                  >
                    {/* Hour grid lines */}
                    {HOURS.map(h => (
                      <div
                        key={h}
                        className={styles.timelineCell}
                        style={{ width: SLOT_WIDTH_PX, minWidth: SLOT_WIDTH_PX }}
                      />
                    ))}

                    {/* Half-hour grid marks */}
                    {HOURS.map(h => (
                      <div
                        key={`half-${h}`}
                        className={styles.timelineHalfMark}
                        style={{ left: (h - HOUR_START) * SLOT_WIDTH_PX + SLOT_WIDTH_PX / 2 }}
                      />
                    ))}

                    {/* Blocked zones — outside clinic / doctor schedule */}
                    {getBlockedRanges(clinicEntry, doctorTodayMap.get(doctor.id)).map((r, i) => (
                      <div
                        key={`blocked-${i}`}
                        className={styles.blockedZone}
                        style={{
                          left:  minutesToLeft(r.fromMin),
                          width: minutesToLeft(r.toMin) - minutesToLeft(r.fromMin),
                        }}
                      />
                    ))}

                    {/* Event bars */}
                    {doctorAppointments.map(apt => {
                      const { left, width } = getEventPosition(apt.startTime, apt.endTime)
                      const modifier = getEventModifier(apt.statusCode)

                      return (
                        <div
                          key={apt.id}
                          data-event-bar="true"
                          className={`${styles.eventBar} ${modifier}${draggingId === apt.id ? ` ${styles['eventBar--dragging']}` : ''}`}
                          style={{ left, width }}
                          draggable
                          onDragStart={e => handleDragStart(e, apt)}
                          onDragEnd={handleDragEnd}
                          onClick={e => handleEventClick(e, apt)}
                          onMouseEnter={(e) => handleEventMouseEnter(e, apt)}
                          onMouseLeave={handleEventMouseLeave}
                        >
                          {apt.statusCode?.toUpperCase() === 'CONFIRMAT' && (
                            <span className={styles.eventCheck}><IconCheck /></span>
                          )}
                          <span className={styles.eventName}>{apt.patientName}</span>
                          <span className={styles.eventTime}>
                            {formatTimeShort(apt.startTime)} — {formatTimeShort(apt.endTime)}
                          </span>
                        </div>
                      )
                    })}

                    {/* Now indicator */}
                    {showNow && (
                      <div className={styles.nowIndicator} style={{ left: nowOffset }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className={styles.tooltipTitle}>{tooltip.appointment.patientName}</div>
          <dl className={styles.tooltipDl}>
            <div className={styles.tooltipRow}>
              <dt><IconClock /></dt>
              <dd>{formatTimeShort(tooltip.appointment.startTime)} — {formatTimeShort(tooltip.appointment.endTime)}</dd>
            </div>
            <div className={styles.tooltipRow}>
              <dt><IconUser /></dt>
              <dd>Dr. {tooltip.appointment.doctorName}</dd>
            </div>
            {tooltip.appointment.notes && (
              <div className={styles.tooltipRow}>
                <dt><IconNote /></dt>
                <dd>{tooltip.appointment.notes}</dd>
              </div>
            )}
            <div className={styles.tooltipRow}>
              <dt><IconTag /></dt>
              <dd>{tooltip.appointment.statusName}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Form modal creare / editare */}
      <AppointmentFormModal
        isOpen={formModalOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={createAppointment.isPending || updateAppointment.isPending}
        editData={editingSchedulerApt ? schedulerDtoToFormEditData(editingSchedulerApt) : null}
        createDefaults={formCreateDefaults}
        patientLookup={patientLookup}
        doctorLookup={doctorLookup}
        serverError={serverError}
      />
    </div>
  )
}

export default AppointmentsSchedulerPage
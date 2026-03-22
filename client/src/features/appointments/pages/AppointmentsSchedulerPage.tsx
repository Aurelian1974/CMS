import { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppointmentsForScheduler } from '../hooks/useAppointments'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import type { AppointmentSchedulerDto } from '../types/appointment.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import styles from './AppointmentsSchedulerPage.module.scss'

// ── Icoane SVG inline ─────────────────────────────────────────────────────────
const IconChevronLeft  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
const IconChevronRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 6 15 12 9 18"/></svg>
const IconList         = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const IconPlus         = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconUser         = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IconClock        = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IconCalendar     = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>

// ── Constante scheduler ───────────────────────────────────────────────────────
const HOUR_START = 7    // 07:00
const HOUR_END   = 20   // 20:00
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)
const SLOT_WIDTH_PX = 120 // pixel width per hour

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

  // Date din API
  const dateFrom = formatDateISO(currentDate)
  const dateTo = formatDateISO(currentDate)
  const { data: schedulerResp, isLoading } = useAppointmentsForScheduler(dateFrom, dateTo, doctorFilter)
  const { data: doctorLookupResp } = useDoctorLookup()

  const appointments = useMemo(() => schedulerResp?.data ?? [], [schedulerResp])
  const doctorLookup = doctorLookupResp?.data ?? []

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
          <button className={styles.btnPrimary} onClick={() => {/* TODO: create appointment */}}>
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
                  <div className={styles.timelineCells} style={{ width: timelineWidth, minWidth: timelineWidth, position: 'relative' }}>
                    {/* Hour grid lines */}
                    {HOURS.map(h => (
                      <div
                        key={h}
                        className={styles.timelineCell}
                        style={{ width: SLOT_WIDTH_PX, minWidth: SLOT_WIDTH_PX }}
                      />
                    ))}

                    {/* Event bars */}
                    {doctorAppointments.map(apt => {
                      const { left, width } = getEventPosition(apt.startTime, apt.endTime)
                      const modifier = getEventModifier(apt.statusCode)

                      return (
                        <div
                          key={apt.id}
                          className={`${styles.eventBar} ${modifier}`}
                          style={{ left, width }}
                          onMouseEnter={(e) => handleEventMouseEnter(e, apt)}
                          onMouseLeave={handleEventMouseLeave}
                        >
                          <span className={styles.eventName}>{apt.patientName}</span>
                          <span className={styles.eventTime}>
                            {formatTimeShort(apt.startTime)} — {formatTimeShort(apt.endTime)}
                          </span>
                          {apt.statusName && (
                            <span className={styles.eventPatient}>{apt.statusName}</span>
                          )}
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
          <div className={styles.tooltipRow}>
            <IconClock />
            <span>{formatTimeShort(tooltip.appointment.startTime)} — {formatTimeShort(tooltip.appointment.endTime)}</span>
          </div>
          <div className={styles.tooltipRow}>
            <IconUser />
            <span>Dr. {tooltip.appointment.doctorName}</span>
          </div>
          {tooltip.appointment.notes && (
            <div className={styles.tooltipRow}>
              <span style={{ fontStyle: 'italic' }}>{tooltip.appointment.notes}</span>
            </div>
          )}
          <div className={styles.tooltipRow}>
            <span>Status: {tooltip.appointment.statusName}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentsSchedulerPage
import { useMemo } from 'react'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { useAppointments } from '@/features/appointments/hooks/useAppointments'
import type { AppointmentDto } from '@/features/appointments/types/appointment.types'
import type { ConsultationListDto } from '../../types/consultation.types'
import { formatTimeRange, getAppointmentStatusVariant } from '../../utils/consultationDisplay'
import { HistoryList } from './HistoryList'
import styles from '../../pages/ConsultationsListPage.module.scss'

const IconPlus = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>

interface ConsultationsSidebarProps {
  isAdmin: boolean
  todayISO: string
  doctors: { id: string; fullName: string }[]
  /** Filtrul de medic ales de admin; ignorat pentru medici (văd doar propriile date) */
  doctorFilter: string | undefined
  onDoctorFilterChange: (doctorId: string | undefined) => void
  /** Medicul efectiv: filtrul adminului sau medicul logat */
  effectiveDoctorId: string | undefined
  activeAppointmentId: string | null
  activeConsultationId: string | null
  onNew: () => void
  onSelectAppointment: (appointment: AppointmentDto) => void
  onSelectConsultation: (consultation: ConsultationListDto) => void
}

export const ConsultationsSidebar = ({
  isAdmin, todayISO, doctors, doctorFilter, onDoctorFilterChange, effectiveDoctorId,
  activeAppointmentId, activeConsultationId, onNew, onSelectAppointment, onSelectConsultation,
}: ConsultationsSidebarProps) => {
  const { data: appointmentsResp, isError: isAppointmentsError } = useAppointments({
    page: 1, pageSize: 100, dateFrom: todayISO, dateTo: todayISO,
    doctorId: effectiveDoctorId,
    sortBy: 'startTime', sortDir: 'asc',
  })
  const todayAppointments = useMemo(() => appointmentsResp?.data?.pagedResult?.items ?? [], [appointmentsResp])
  const stats = appointmentsResp?.data?.stats

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h1 className={styles.pageTitle}>Consultații</h1>
        <AppButton variant="primary" size="sm" onClick={onNew}>
          <IconPlus /> Nouă
        </AppButton>
      </div>

      {isAdmin && (
        <div className={styles.doctorFilter}>
          <select
            className={styles.filterSelect}
            aria-label="Filtru medic"
            value={doctorFilter ?? ''}
            onChange={e => onDoctorFilterChange(e.target.value || undefined)}
          >
            <option value="">Toți medicii</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.fullName}</option>
            ))}
          </select>
        </div>
      )}

      {stats && (
        <div className={styles.statsCompact}>
          <div className={styles.statMini}><span className={styles.statMiniValue}>{stats.totalAppointments}</span><span className={styles.statMiniLabel}>Total</span></div>
          <div className={styles.statMini}><span className={`${styles.statMiniValue} ${styles['statMiniValue--orange']}`}>{stats.scheduledCount}</span><span className={styles.statMiniLabel}>Programate</span></div>
          <div className={styles.statMini}><span className={`${styles.statMiniValue} ${styles['statMiniValue--green']}`}>{stats.confirmedCount}</span><span className={styles.statMiniLabel}>Confirmate</span></div>
          <div className={styles.statMini}><span className={`${styles.statMiniValue} ${styles['statMiniValue--gray']}`}>{stats.completedCount}</span><span className={styles.statMiniLabel}>Finalizate</span></div>
        </div>
      )}

      <div className={styles.dateGroupLabel}>Programări azi</div>

      <div className={styles.sidebarScroll}>
        <div className={styles.cardList}>
          {isAppointmentsError && <div className={styles.listError}>Eroare la încărcarea programărilor.</div>}

          {todayAppointments.map(apt => (
            <button
              key={apt.id}
              type="button"
              className={`${styles.card} ${activeAppointmentId === apt.id ? styles.cardActive : ''}`}
              onClick={() => onSelectAppointment(apt)}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardPatient}>{apt.patientName}</span>
                <span className={styles.cardTime}>{formatTimeRange(apt.startTime, apt.endTime)}</span>
              </div>
              <div className={styles.cardMiddle}>
                {apt.doctorName}{apt.specialtyName ? ` · ${apt.specialtyName}` : ''}
              </div>
              <div className={styles.cardBottom}>
                <AppBadge variant={getAppointmentStatusVariant(apt.statusCode)} withDot>{apt.statusName}</AppBadge>
              </div>
            </button>
          ))}

          {!isAppointmentsError && todayAppointments.length === 0 && (
            <div className={styles.listEmpty}>Nicio programare pentru azi.</div>
          )}
        </div>

        <div className={styles.historySeparator} />
        <HistoryList
          isAdmin={isAdmin}
          groupByDoctor={isAdmin && !doctorFilter}
          doctorId={effectiveDoctorId}
          activeConsultationId={activeConsultationId}
          onSelect={onSelectConsultation}
        />
      </div>
    </aside>
  )
}

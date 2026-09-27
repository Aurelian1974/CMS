import { formatNumber } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

export const DoctorWorkloadWidget = ({ data }: DashboardWidgetProps) => {
  const rows = data.trends?.doctorWorkload
  if (!rows) return null

  return (
    <WidgetCard title="Încărcare pe medic" isEmpty={rows.length === 0} emptyText="Niciun medic activ.">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Medic</th>
            <th className={styles.num}>Programări</th>
            <th className={styles.num}>Finalizate</th>
            <th className={styles.num}>Neprezentări</th>
            <th className={styles.num}>Ore</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.doctorId}>
              <td>
                {r.doctorName}
                {r.specialtyName && <div className={styles.secondary}>{r.specialtyName}</div>}
              </td>
              <td className={styles.num}>{r.appointmentCount}</td>
              <td className={styles.num}>{r.completedCount}</td>
              <td className={styles.num}>{r.noShowCount}</td>
              <td className={styles.num}>{formatNumber((r.scheduledMinutes ?? 0) / 60, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </WidgetCard>
  )
}

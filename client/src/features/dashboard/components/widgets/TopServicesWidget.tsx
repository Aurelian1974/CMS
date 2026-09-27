import { formatCurrency, formatNumber } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

export const TopServicesWidget = ({ data }: DashboardWidgetProps) => {
  const rows = data.trends?.topServices
  if (!rows) return null

  return (
    <WidgetCard
      title="Top servicii (lună)"
      linkTo="/tariffs"
      linkLabel="Tarife"
      isEmpty={rows.length === 0}
      emptyText="Niciun serviciu facturabil luna aceasta."
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Serviciu</th>
            <th className={styles.num}>Cantitate</th>
            <th className={styles.num}>Valoare</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.serviceName}>
              <td>{r.serviceName}</td>
              <td className={styles.num}>{formatNumber(r.quantity ?? 0, 0)}</td>
              <td className={styles.num}>{formatCurrency(r.totalValue ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </WidgetCard>
  )
}

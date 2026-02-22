import styles from './StatCard.module.scss';
import { clsx } from 'clsx';

type IconColor = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal';
type TrendDir = 'up' | 'down' | 'neutral';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: IconColor;
  trend?: number;       // ex: 12 înseamnă +12%, -5 înseamnă -5%
  trendLabel?: string;  // ex: "față de luna trecută"
}

const IconArrowUp = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const IconArrowDown = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const StatCard = ({
  label,
  value,
  icon,
  color = 'blue',
  trend,
  trendLabel,
}: StatCardProps) => {
  const trendDir: TrendDir =
    trend === undefined ? 'neutral'
    : trend > 0 ? 'up'
    : trend < 0 ? 'down'
    : 'neutral';

  return (
    <div className={styles.card}>
      <div className={styles.info}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
        {trend !== undefined && (
          <div className={styles.trendRow}>
            <span className={clsx(styles.trend, styles[trendDir])}>
              {trendDir === 'up' ? <IconArrowUp /> : trendDir === 'down' ? <IconArrowDown /> : null}
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
            {trendLabel && <span className={styles.trendLabel}>{trendLabel}</span>}
          </div>
        )}
      </div>
      <div className={clsx(styles.iconBox, styles[color])}>
        {icon}
      </div>
    </div>
  );
};

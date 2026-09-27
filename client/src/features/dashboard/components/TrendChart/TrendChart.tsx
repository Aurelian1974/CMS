import styles from './TrendChart.module.scss'

export interface TrendPoint {
  label: string
  value: number
}

interface TrendChartProps {
  points: TrendPoint[]
  variant?: 'line' | 'bar'
  ariaLabel: string
  formatValue?: (v: number) => string
}

const W = 600
const H = 180
const PAD = { top: 12, right: 8, bottom: 22, left: 8 }

/** Serie temporală SVG simplă (fără dependențe) — punct unic de înlocuire dacă se adoptă o bibliotecă. */
export const TrendChart = ({ points, variant = 'line', ariaLabel, formatValue = String }: TrendChartProps) => {
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const max = Math.max(1, ...points.map((p) => p.value))
  const n = points.length
  const step = n > 1 ? innerW / (n - 1) : 0
  const slot = n > 0 ? innerW / n : innerW
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH
  const xLine = (i: number) => PAD.left + (n > 1 ? i * step : innerW / 2)
  const xBar = (i: number) => PAD.left + i * slot
  const baseY = PAD.top + innerH
  // Etichete de axă doar pe câteva poziții, altfel se suprapun la 30 de zile
  const labelIdx = n <= 7 ? points.map((_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1]

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xLine(i)},${y(p.value)}`).join(' ')
  const areaPath = n > 0 ? `${linePath} L${xLine(n - 1)},${baseY} L${xLine(0)},${baseY} Z` : ''

  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      <line className={styles.grid} x1={PAD.left} x2={W - PAD.right} y1={PAD.top} y2={PAD.top} />
      <line className={styles.axis} x1={PAD.left} x2={W - PAD.right} y1={baseY} y2={baseY} />

      {variant === 'line' && n > 0 && (
        <>
          <path className={styles.area} d={areaPath} />
          <path className={styles.line} d={linePath} />
          {points.map((p, i) => (
            <circle key={p.label} className={styles.point} cx={xLine(i)} cy={y(p.value)} r={n > 14 ? 2 : 3}>
              <title>{`${p.label}: ${formatValue(p.value)}`}</title>
            </circle>
          ))}
        </>
      )}

      {variant === 'bar' && points.map((p, i) => {
        const barW = Math.max(4, slot * 0.6)
        return (
          <rect
            key={p.label}
            className={styles.bar}
            x={xBar(i) + (slot - barW) / 2}
            y={y(p.value)}
            width={barW}
            height={baseY - y(p.value)}
            rx={3}
          >
            <title>{`${p.label}: ${formatValue(p.value)}`}</title>
          </rect>
        )
      })}

      {labelIdx.map((i) => (
        <text
          key={`l-${i}`}
          className={styles.label}
          x={variant === 'bar' ? xBar(i) + slot / 2 : xLine(i)}
          y={H - 6}
          textAnchor={variant === 'bar' ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
        >
          {points[i].label}
        </text>
      ))}
      <text className={styles.label} x={PAD.left} y={PAD.top - 2}>{formatValue(max)}</text>
    </svg>
  )
}

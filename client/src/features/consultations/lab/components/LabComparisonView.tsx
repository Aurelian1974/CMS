import { useMemo } from 'react'
import type { LabBulletinPayload, LabResultRowDto } from '../types/lab.types'
import styles from '../AnalizeMedicaleStep.module.scss'

interface Props {
  bulletinA: { date: string | null; data: LabBulletinPayload }
  bulletinB: { date: string | null; data: LabBulletinPayload }
}

interface CompareRow {
  testName: string
  unit: string | null
  valueA: string | null
  valueB: string | null
  numA: number | null
  numB: number | null
  delta: number | null
  deltaPct: number | null
  flagA: string | null
  flagB: string | null
}

const toNum = (s: string | null | undefined): number | null => {
  if (!s) return null
  const v = parseFloat(String(s).replace(',', '.'))
  return isNaN(v) ? null : v
}

export const LabComparisonView = ({ bulletinA, bulletinB }: Props) => {
  const rows: CompareRow[] = useMemo(() => {
    const map = new Map<string, CompareRow>()
    const indexFor = (r: LabResultRowDto) => r.testName.trim().toLowerCase()

    const init = (r: LabResultRowDto): CompareRow => ({
      testName: r.testName,
      unit: r.unit,
      valueA: null, valueB: null,
      numA: null, numB: null,
      delta: null, deltaPct: null,
      flagA: null, flagB: null,
    })

    bulletinA.data.results.forEach((r) => {
      const k = indexFor(r)
      const cur = map.get(k) ?? init(r)
      cur.valueA = r.value
      cur.numA = toNum(r.value)
      cur.flagA = r.flag
      cur.unit = cur.unit ?? r.unit
      map.set(k, cur)
    })
    bulletinB.data.results.forEach((r) => {
      const k = indexFor(r)
      const cur = map.get(k) ?? init(r)
      cur.valueB = r.value
      cur.numB = toNum(r.value)
      cur.flagB = r.flag
      cur.unit = cur.unit ?? r.unit
      cur.testName = cur.testName || r.testName
      map.set(k, cur)
    })

    map.forEach((row) => {
      if (row.numA !== null && row.numB !== null) {
        row.delta = row.numB - row.numA
        if (row.numA !== 0) row.deltaPct = (row.delta / row.numA) * 100
      }
    })

    return Array.from(map.values()).sort((a, b) => a.testName.localeCompare(b.testName, 'ro'))
  }, [bulletinA, bulletinB])

  const labelA = bulletinA.date ? new Date(bulletinA.date).toLocaleDateString('ro-RO') : 'A'
  const labelB = bulletinB.date ? new Date(bulletinB.date).toLocaleDateString('ro-RO') : 'B'

  return (
    <div className={styles.compareView}>
      <h4 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>
        Comparație: {labelA} → {labelB}
      </h4>
      <table className={styles.compareTable}>
        <thead>
          <tr>
            <th>Test</th>
            <th>UM</th>
            <th>{labelA}</th>
            <th>{labelB}</th>
            <th>Δ (delta)</th>
            <th>Δ %</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8' }}>Nu există date comune.</td></tr>
          )}
          {rows.map((r) => {
            const cls = r.delta === null ? styles['delta-same']
              : r.delta > 0 ? styles['delta-up']
              : r.delta < 0 ? styles['delta-down']
              : styles['delta-same']
            return (
              <tr key={r.testName}>
                <td>{r.testName}</td>
                <td>{r.unit ?? '—'}</td>
                <td>
                  {r.valueA ?? '—'}
                  {r.flagA && <span style={{ marginLeft: 4, fontSize: '0.7rem', color: r.flagA === 'HIGH' ? '#b91c1c' : '#1d4ed8' }}>({r.flagA})</span>}
                </td>
                <td>
                  {r.valueB ?? '—'}
                  {r.flagB && <span style={{ marginLeft: 4, fontSize: '0.7rem', color: r.flagB === 'HIGH' ? '#b91c1c' : '#1d4ed8' }}>({r.flagB})</span>}
                </td>
                <td className={cls}>{r.delta !== null ? r.delta.toFixed(2) : '—'}</td>
                <td className={cls}>{r.deltaPct !== null ? `${r.deltaPct.toFixed(1)}%` : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

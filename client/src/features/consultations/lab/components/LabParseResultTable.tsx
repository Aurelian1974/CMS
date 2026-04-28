import { useMemo } from 'react'
import { Trash2, Plus } from 'lucide-react'
import type { LabResultRowDto } from '../types/lab.types'
import styles from '../AnalizeMedicaleStep.module.scss'

interface Props {
  rows: LabResultRowDto[]
  onChange: (rows: LabResultRowDto[]) => void
  readOnly?: boolean
}

/**
 * Tabel editabil cu rezultatele parsate.
 * Grupează rândurile după secțiune (HEMATOLOGIE, BIOCHIMIE etc.) cu rânduri-header.
 */
export const LabParseResultTable = ({ rows, onChange, readOnly }: Props) => {
  const grouped = useMemo(() => {
    const map = new Map<string, { row: LabResultRowDto; idx: number }[]>()
    rows.forEach((row, idx) => {
      const key = row.section || 'GENERAL'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({ row, idx })
    })
    return Array.from(map.entries())
  }, [rows])

  const updateRow = (idx: number, patch: Partial<LabResultRowDto>) => {
    const next = rows.slice()
    next[idx] = { ...next[idx], ...patch }
    // Recalculate flag if numeric value or refs changed
    if ('value' in patch || 'refMin' in patch || 'refMax' in patch) {
      const v = parseFloat(next[idx].value.replace(',', '.'))
      const min = next[idx].refMin
      const max = next[idx].refMax
      let flag: string | null = null
      if (!isNaN(v)) {
        if (min !== null && v < min) flag = 'LOW'
        else if (max !== null && v > max) flag = 'HIGH'
      }
      next[idx].flag = flag
    }
    onChange(next)
  }

  const removeRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx))

  const addRow = (section: string) => {
    onChange([
      ...rows,
      {
        section,
        testName: '',
        value: '',
        unit: null,
        referenceRange: null,
        refMin: null,
        refMax: null,
        flag: null,
        method: null,
        notes: null,
      },
    ])
  }

  if (rows.length === 0) {
    return (
      <div className={styles.empty}>
        Nu există rezultate. Încarcă un buletin PDF sau adaugă manual.
      </div>
    )
  }

  return (
    <table className={styles.parseTable}>
      <thead>
        <tr>
          <th style={{ width: '30%' }}>Test</th>
          <th style={{ width: '12%' }}>Valoare</th>
          <th style={{ width: '10%' }}>UM</th>
          <th style={{ width: '14%' }}>Referință</th>
          <th style={{ width: '7%' }}>Flag</th>
          <th style={{ width: '20%' }}>Note</th>
          {!readOnly && <th style={{ width: '7%' }}>Acțiuni</th>}
        </tr>
      </thead>
      <tbody>
        {grouped.map(([section, items]) => (
          <>
            <tr key={`h-${section}`} className={styles.sectionRow}>
              <td colSpan={readOnly ? 6 : 7}>
                {section}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => addRow(section)}
                    style={{ marginLeft: 8, background: 'transparent', border: 0, cursor: 'pointer', color: '#92400e' }}
                    title="Adaugă rând"
                  >
                    <Plus size={12} />
                  </button>
                )}
              </td>
            </tr>
            {items.map(({ row, idx }) => (
              <tr key={`r-${idx}`}>
                <td>
                  <input
                    type="text"
                    value={row.testName}
                    onChange={(e) => updateRow(idx, { testName: e.target.value })}
                    disabled={readOnly}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => updateRow(idx, { value: e.target.value })}
                    disabled={readOnly}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.unit ?? ''}
                    onChange={(e) => updateRow(idx, { unit: e.target.value || null })}
                    disabled={readOnly}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.referenceRange ?? ''}
                    onChange={(e) => updateRow(idx, { referenceRange: e.target.value || null })}
                    disabled={readOnly}
                    placeholder="ex: 12.0 - 16.0"
                  />
                </td>
                <td>
                  <span
                    className={
                      row.flag === 'HIGH' ? styles.flagHigh :
                      row.flag === 'LOW' ? styles.flagLow : undefined
                    }
                  >
                    {row.flag ?? '—'}
                  </span>
                </td>
                <td>
                  <input
                    type="text"
                    value={row.notes ?? ''}
                    onChange={(e) => updateRow(idx, { notes: e.target.value || null })}
                    disabled={readOnly}
                  />
                </td>
                {!readOnly && (
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      style={{ background: 'transparent', border: 0, cursor: 'pointer', color: '#b91c1c' }}
                      title="Șterge"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </>
        ))}
      </tbody>
    </table>
  )
}

import React, { useCallback, useMemo, useState } from 'react'
import { Search, Trash2, Plus, X } from 'lucide-react'
import type { LabResultRowDto } from '../types/lab.types'
import { AnalysisPicker } from './AnalysisPicker'
import styles from '../AnalizeMedicaleStep.module.scss'

interface Props {
  rows: LabResultRowDto[]
  onChange: (rows: LabResultRowDto[]) => void
  readOnly?: boolean
}

// ── Trigger cell + AnalysisPicker pentru coloana Test ───────────────────────

interface LabTestNameCellProps {
  value: string
  onChange: (name: string) => void
  onPickUnit: (unit: string | null) => void
  /** Callback combinat pentru selecție din picker — face un singur updateRow cu name+unit */
  onSelectAnalysis: (name: string, unit: string | null) => void
  disabled: boolean
}

const LabTestNameCell = ({ value, onChange, onPickUnit, onSelectAnalysis, disabled }: LabTestNameCellProps) => {
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleSelect = useCallback(
    (item: { name: string; unit: string | null }) => {
      // Un singur update combinat evită problema de React batching
      // (două setState separate cu valori ar duce la suprascrierea primului)
      onSelectAnalysis(item.name, item.unit ?? null)
    },
    [onSelectAnalysis],
  )

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange('')
      onPickUnit(null)
    },
    [onChange, onPickUnit],
  )

  if (disabled) {
    return <span>{value}</span>
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.pickerTrigger} ${value ? styles.hasValue : ''}`}
        onClick={() => setPickerOpen(true)}
        title={value || 'Caută sau selectează o analiză din catalog'}
      >
        {!value && <Search size={13} aria-hidden="true" style={{ flexShrink: 0 }} />}
        <span className={styles.pickerTriggerText}>
          {value || 'Caută sau tastează o analiză…'}
        </span>
        {value && (
          <button
            type="button"
            className={styles.pickerTriggerClear}
            onClick={handleClear}
            title="Șterge"
          >
            <X size={11} aria-hidden="true" />
          </button>
        )}
      </button>
      <AnalysisPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
      />
    </>
  )
}

// ── Radio buttons pentru Flag ────────────────────────────────────────────────

type FlagValue = string | null

interface FlagRadioProps {
  idx: number
  flag: FlagValue
  onChange: (flag: FlagValue) => void
}

const FLAG_OPTIONS: { value: FlagValue; label: string }[] = [
  { value: null,   label: 'Normal' },
  { value: 'HIGH', label: 'Crescut ▲' },
  { value: 'LOW',  label: 'Scăzut ▼' },
]

const FlagRadio = ({ idx, flag, onChange }: FlagRadioProps) => (
  <div style={{ display: 'flex', flexDirection: 'row', gap: 3, flexWrap: 'nowrap' }}>
    {FLAG_OPTIONS.map((opt) => {
      const isSelected = flag === opt.value
      const color =
        opt.value === 'HIGH' ? { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', activeBg: '#fee2e2', activeBorder: '#ef4444' }
      : opt.value === 'LOW'  ? { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', activeBg: '#dbeafe', activeBorder: '#3b82f6' }
      :                        { bg: '#f8fafc', border: '#cbd5e1', text: '#64748b', activeBg: '#e2e8f0', activeBorder: '#94a3b8' }
      return (
        <button
          key={opt.value ?? 'null'}
          type="button"
          title={opt.label}
          onClick={() => onChange(isSelected && opt.value !== null ? null : opt.value)}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '2px 6px',
            fontSize: '0.72rem', fontWeight: isSelected ? 600 : 400,
            whiteSpace: 'nowrap', cursor: 'pointer',
            borderRadius: 4,
            border: `1px solid ${isSelected ? color.activeBorder : color.border}`,
            background: isSelected ? color.activeBg : color.bg,
            color: isSelected ? color.text : '#94a3b8',
            transition: 'all 0.15s ease',
            outline: 'none',
            boxShadow: isSelected ? `0 0 0 2px ${color.border}` : 'none',
          }}
        >
          {opt.label}
        </button>
      )
    })}
  </div>
)

// ── Tabelul principal ────────────────────────────────────────────────────────

/**
 * Tabel editabil cu rezultatele analizelor medicale.
 * Grupează rândurile după secțiune (HEMATOLOGIE, BIOCHIMIE etc.).
 * - Coloana Test: autocomplete din dicționarul de analize (DB); la selectare se
 *   completează automat și UM dacă există în dicționar.
 * - Coloana Flag: radio buttons — normal (—) / Crescut ▲ / Scăzut ▼.
 */
export const LabParseResultTable = ({ rows, onChange, readOnly }: Props) => {
  const [newSection, setNewSection] = useState('')

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

  const handleAddSection = () => {
    const s = newSection.trim().toUpperCase() || 'GENERAL'
    addRow(s)
    setNewSection('')
  }

  if (rows.length === 0) {
    return (
      <div className={styles.empty}>
        Nu există rezultate. Încarcă un buletin PDF sau adaugă manual.
        {!readOnly && (
          <button
            type="button"
            onClick={() => addRow('GENERAL')}
            style={{
              marginLeft: 8, background: 'transparent', border: '1px solid #cbd5e1',
              borderRadius: 4, cursor: 'pointer', color: '#1d4ed8',
              padding: '0.15rem 0.5rem', fontSize: '0.8rem',
            }}
          >
            <Plus size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
            Adaugă rând
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <table className={styles.parseTable}>
        <thead>
          <tr>
            <th style={{ width: '28%' }}>Test</th>
            <th style={{ width: '12%' }}>Valoare</th>
            <th style={{ width: '9%' }}>UM</th>
            <th style={{ width: '14%' }}>Referință</th>
            <th style={{ width: '10%' }}>Flag</th>
            <th style={{ width: '20%' }}>Note</th>
            {!readOnly && <th style={{ width: '7%' }}>Acțiuni</th>}
          </tr>
        </thead>
        <tbody>
          {grouped.map(([section, items]) => (
            <React.Fragment key={section}>
              <tr className={styles.sectionRow}>
                <td colSpan={readOnly ? 6 : 7}>
                  {section}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => addRow(section)}
                      style={{
                        marginLeft: 8, background: 'transparent', border: 0,
                        cursor: 'pointer', color: '#92400e',
                      }}
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
                    {readOnly ? (
                      <span>{row.testName}</span>
                    ) : (
                      <LabTestNameCell
                        value={row.testName}
                        onChange={(name) => updateRow(idx, { testName: name })}
                        onPickUnit={(unit) => updateRow(idx, { unit })}
                        onSelectAnalysis={(name, unit) => updateRow(idx, { testName: name, unit })}
                        disabled={false}
                      />
                    )}
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
                    {readOnly ? (
                      <span
                        className={
                          row.flag === 'HIGH' ? styles.flagHigh :
                          row.flag === 'LOW'  ? styles.flagLow : undefined
                        }
                      >
                        {row.flag === 'HIGH' ? 'Crescut ▲' : row.flag === 'LOW' ? 'Scăzut ▼' : 'Normal'}
                      </span>
                    ) : (
                      <FlagRadio
                        idx={idx}
                        flag={row.flag}
                        onChange={(flag) => updateRow(idx, { flag })}
                      />
                    )}
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
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {/* ── Adaugă secțiune nouă ────────────────────────────────── */}
      {!readOnly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <input
            type="text"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            placeholder="Secțiune nouă (ex: HEMATOLOGIE)"
            style={{
              padding: '0.25rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: 4,
              fontSize: '0.8rem', flex: 1, maxWidth: 260,
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSection() } }}
          />
          <button
            type="button"
            onClick={handleAddSection}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '0.25rem 0.6rem', background: '#f1f5f9',
              border: '1px solid #cbd5e1', borderRadius: 4,
              cursor: 'pointer', fontSize: '0.8rem', color: '#334155',
            }}
          >
            <Plus size={13} /> Adaugă secțiune
          </button>
        </div>
      )}
    </>
  )
}

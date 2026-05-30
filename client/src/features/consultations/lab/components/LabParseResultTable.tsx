import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { Trash2, Plus } from 'lucide-react'
import type { LabResultRowDto } from '../types/lab.types'
import { useSearchAnalyses } from '../hooks/useLab'
import styles from '../AnalizeMedicaleStep.module.scss'

interface Props {
  rows: LabResultRowDto[]
  onChange: (rows: LabResultRowDto[]) => void
  readOnly?: boolean
}

// ── Autocomplete pentru coloana Test ────────────────────────────────────────

interface LabTestNameCellProps {
  value: string
  onChange: (name: string) => void
  onPickUnit: (unit: string | null) => void
  disabled: boolean
}

const LabTestNameCell = ({ value, onChange, onPickUnit, disabled }: LabTestNameCellProps) => {
  const [searchQ, setSearchQ] = useState(value)
  const [showDropdown, setShowDropdown] = useState(false)
  const [debouncedQ, setDebouncedQ] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Sincronizează valoarea locală dacă se schimbă din exterior (reset)
  useEffect(() => { setSearchQ(value) }, [value])

  // Debounce 250ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQ), 250)
    return () => clearTimeout(t)
  }, [searchQ])

  const { data: suggestions = [], isFetching } = useSearchAnalyses(
    debouncedQ,
    showDropdown && !disabled,
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setSearchQ(v)
    onChange(v)
    setShowDropdown(true)
  }

  const handlePick = useCallback(
    (name: string, unit: string | null) => {
      setSearchQ(name)
      onChange(name)
      onPickUnit(unit)
      setShowDropdown(false)
    },
    [onChange, onPickUnit],
  )

  // Închide dropdown la click în afară
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={searchQ}
        onChange={handleChange}
        onFocus={() => { if (searchQ.trim().length >= 2) setShowDropdown(true) }}
        disabled={disabled}
        placeholder="Caută sau tastează..."
        style={{ width: '100%' }}
      />
      {showDropdown && !disabled && (
        <>
          {isFetching && debouncedQ.trim().length >= 2 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4,
              padding: '4px 8px', fontSize: '0.78rem', color: '#64748b',
            }}>
              Se caută...
            </div>
          )}
          {!isFetching && suggestions.length > 0 && (
            <ul style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              listStyle: 'none', margin: 0, padding: 0,
              maxHeight: 220, overflowY: 'auto',
              background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              {suggestions.map((s) => (
                <li
                  key={s.id}
                  onMouseDown={(e) => { e.preventDefault(); handlePick(s.name, s.unit) }}
                  style={{
                    padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.82rem',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <span style={{ fontWeight: 500 }}>{s.name}</span>
                  {s.unit && (
                    <span style={{ color: '#475569', marginLeft: 6 }}>{s.unit}</span>
                  )}
                  {s.category && (
                    <span style={{ color: '#94a3b8', marginLeft: 6, fontSize: '0.75rem' }}>
                      {s.category}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
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
  { value: null,   label: '—' },
  { value: 'HIGH', label: 'Crescut ▲' },
  { value: 'LOW',  label: 'Scăzut ▼' },
]

const FlagRadio = ({ idx, flag, onChange }: FlagRadioProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {FLAG_OPTIONS.map((opt) => (
      <label
        key={opt.value ?? 'null'}
        style={{
          display: 'flex', alignItems: 'center', gap: 3,
          fontSize: '0.73rem', cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <input
          type="radio"
          name={`flag-${idx}`}
          checked={flag === opt.value}
          onChange={() => onChange(opt.value)}
          style={{ cursor: 'pointer' }}
        />
        <span
          style={{
            color: opt.value === 'HIGH' ? '#b91c1c'
                 : opt.value === 'LOW'  ? '#1d4ed8'
                 : '#64748b',
            fontWeight: opt.value !== null ? 500 : undefined,
          }}
        >
          {opt.label}
        </span>
      </label>
    ))}
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
            <>
              <tr key={`h-${section}`} className={styles.sectionRow}>
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
                        {row.flag ?? '—'}
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
            </>
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

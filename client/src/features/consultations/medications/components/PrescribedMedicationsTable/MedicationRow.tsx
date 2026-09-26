import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  computeTotalQuantity, DEFAULT_DOSE, DOSE_MAX, DOSE_STEP, medicationRowSchema, type MedicationRowData,
} from '../../schemas/medication.schema'
import { parseCopaymentLists, type ConsultationMedicationDto } from '../../types/medication.types'
import { formatQuantity } from '../../utils/medicationFormat'
import styles from './PrescribedMedicationsTable.module.scss'

interface MedicationRowProps {
  index: number
  row: ConsultationMedicationDto
  isEditable: boolean
  onSave: (id: string, data: MedicationRowData) => void
  onDelete: (row: ConsultationMedicationDto) => void
}

const toRowData = (row: ConsultationMedicationDto): MedicationRowData => ({
  copaymentListType: row.copaymentListType,
  doseMorning: row.doseMorning,
  doseAfternoon: row.doseAfternoon,
  doseEvening: row.doseEvening,
  durationDays: row.durationDays,
  notes: row.notes,
})

type DoseField = 'doseMorning' | 'doseAfternoon' | 'doseEvening'

const DOSE_SLOTS: { field: DoseField; label: string }[] = [
  { field: 'doseMorning', label: 'Dimineață' },
  { field: 'doseAfternoon', label: 'După-amiază' },
  { field: 'doseEvening', label: 'Seara' },
]

const toNullableText = (value: string) => (value.trim() === '' ? null : value.trim())
const toNullableNumber = (value: string) => (value.trim() === '' ? null : Number(value))

// Rândul stă în formularul consultației: Enter salvează câmpul (blur), nu trimite formularul
const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    e.currentTarget.blur()
  }
}

export const MedicationRow = ({ index, row, isEditable, onSave, onDelete }: MedicationRowProps) => {
  // Draft-ul nu se resincronizează la refetch: ar șterge ce tastează medicul în alt câmp al rândului
  const [draft, setDraft] = useState(() => toRowData(row))
  const [error, setError] = useState<string | null>(null)

  const availableLists = parseCopaymentLists(row.availableCopaymentLists)
  // Lista salvată poate fi ieșit din nomenclator după o sincronizare CNAS — rămâne selectabilă
  const listOptions = row.copaymentListType && !availableLists.includes(row.copaymentListType)
    ? [row.copaymentListType, ...availableLists]
    : availableLists

  const commit = (raw: MedicationRowData) => {
    const next: MedicationRowData = {
      ...raw,
      notes: raw.notes === null ? null : toNullableText(raw.notes),
    }
    setDraft(next)
    const parsed = medicationRowSchema.safeParse(next)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Valoare invalidă')
      return
    }
    setError(null)
    const current = toRowData(row)
    const changed = (Object.keys(next) as (keyof MedicationRowData)[]).some((k) => next[k] !== current[k])
    if (changed) onSave(row.id, parsed.data)
  }

  const compensated = !!draft.copaymentListType
  const quantity = computeTotalQuantity(draft)

  return (
    <tr className={compensated ? styles.rowCompensated : undefined}>
      <td className={styles.colIndex}>{index + 1}</td>
      <td>
        <div className={styles.drugName}>{row.drugName}</div>
        <div className={styles.drugMeta}>
          {[row.concentration, row.pharmaceuticalForm, row.activeSubstance].filter(Boolean).join(' · ')}
        </div>
        <div className={styles.drugCode}>{row.drugCode}{row.prescriptionMode ? ` · ${row.prescriptionMode}` : ''}</div>
      </td>
      <td>
        {isEditable && listOptions.length > 0 ? (
          <select
            className={`form-select form-select-sm ${compensated ? styles.selectCompensated : ''}`}
            value={draft.copaymentListType ?? ''}
            onChange={(e) => {
              const next = { ...draft, copaymentListType: e.target.value || null }
              setDraft(next)
              commit(next)
            }}
            aria-label="Listă de compensare"
          >
            <option value="">Necompensat</option>
            {listOptions.map((l) => <option key={l} value={l}>Compensat · {l}</option>)}
          </select>
        ) : compensated ? (
          <span className={styles.badgeCompensated}>Compensat · {draft.copaymentListType}</span>
        ) : (
          <span className={styles.badgeNotCompensated}>Necompensat</span>
        )}
      </td>
      {DOSE_SLOTS.map(({ field, label }) => {
        const dose = draft[field]
        const checked = dose !== null
        return (
          <td key={field} className={`${styles.colDose} ${checked ? styles.doseActive : ''}`}>
            {isEditable ? (
              <div className={styles.doseCell}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={checked}
                  onChange={(e) => commit({ ...draft, [field]: e.target.checked ? DEFAULT_DOSE : null })}
                  aria-label={`${label}: se administrează`}
                />
                <input
                  type="number"
                  className={`form-control form-control-sm ${styles.doseInput}`}
                  value={dose ?? ''}
                  min={DOSE_STEP}
                  max={DOSE_MAX}
                  step={DOSE_STEP}
                  disabled={!checked}
                  onChange={(e) => setDraft({ ...draft, [field]: toNullableNumber(e.target.value) })}
                  onBlur={() => commit(draft)}
                  onKeyDown={blurOnEnter}
                  aria-label={`${label}: cantitate per priză`}
                />
              </div>
            ) : (checked ? formatQuantity(dose) : '—')}
          </td>
        )
      })}
      <td className={styles.colNumber}>
        {isEditable ? (
          <input
            type="number"
            className="form-control form-control-sm"
            value={draft.durationDays ?? ''}
            min={1}
            max={365}
            onChange={(e) => setDraft({ ...draft, durationDays: toNullableNumber(e.target.value) })}
            onBlur={() => commit(draft)}
            onKeyDown={blurOnEnter}
            aria-label="Durată (zile)"
          />
        ) : (row.durationDays ?? '—')}
      </td>
      <td className={styles.colQuantity}>
        {quantity ? (
          <>
            <div className={styles.quantityValue}>{formatQuantity(quantity.total)}</div>
            <div className={styles.quantityHint}>
              {formatQuantity(quantity.daily)}/zi × {draft.durationDays}
            </div>
          </>
        ) : (
          <span className={styles.quantityEmpty}>—</span>
        )}
      </td>
      <td>
        {isEditable ? (
          <input
            type="text"
            className="form-control form-control-sm"
            value={draft.notes ?? ''}
            maxLength={1000}
            placeholder="Opțional"
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            onBlur={() => commit(draft)}
            onKeyDown={blurOnEnter}
            aria-label="Observații"
          />
        ) : (row.notes ?? '—')}
        {error && <div className={styles.rowError}>{error}</div>}
      </td>
      {isEditable && (
        <td className={styles.colAction}>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={() => onDelete(row)}
            title="Șterge din tratament"
            aria-label={`Șterge ${row.drugName}`}
          >
            <Trash2 size={15} />
          </button>
        </td>
      )}
    </tr>
  )
}

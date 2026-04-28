import { useEffect } from 'react'
import {
  type FieldSpec,
  type InvestigationFormSchema,
  getNested,
  setNested,
  isAbnormal,
} from '@/features/consultations/investigations/config/investigationSchemas'
import { AbnormalIndicator } from './AbnormalIndicator'
import styles from './StructuredFormRenderer.module.scss'

interface Props {
  schema: InvestigationFormSchema
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  disabled?: boolean
}

/**
 * Auto-calcule cunoscute (FE-side, pe baza câmpurilor din schemă).
 * Spec §11.
 */
function applyAutoCalc(typeCode: string, data: Record<string, unknown>): Record<string, unknown> {
  if (typeCode === 'Spirometry') {
    const fev1 = Number(data.fev1)
    const fvc = Number(data.fvc)
    if (!Number.isNaN(fev1) && !Number.isNaN(fvc) && fvc > 0) {
      const ratio = Math.round((fev1 / fvc) * 1000) / 10
      if (data.fev1_FVC_Ratio !== ratio) {
        return { ...data, fev1_FVC_Ratio: ratio }
      }
    }
  }
  return data
}

export const StructuredFormRenderer = ({ schema, value, onChange, disabled }: Props) => {
  // Aplică auto-calculele când valorile sursă se modifică.
  useEffect(() => {
    const next = applyAutoCalc(schema.typeCode, value)
    if (next !== value) onChange(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const renderField = (field: FieldSpec) => {
    const raw = getNested(value, field.name)
    const setVal = (v: unknown) => onChange(setNested(value, field.name, v))

    const cols = field.cols === 3 ? styles.span3 : field.cols === 2 ? styles.span2 : ''
    const labelEl = (
      <label htmlFor={field.name}>
        {field.label}
        {field.unit && <span className={styles.unit}>({field.unit})</span>}
        {(field.type === 'number' || field.type === 'integer') &&
          <AbnormalIndicator show={isAbnormal(typeof raw === 'number' ? raw : Number(raw), field)} />}
      </label>
    )

    let input: React.ReactElement
    switch (field.type) {
      case 'number':
      case 'integer':
        input = (
          <input
            id={field.name}
            type="number"
            step={field.type === 'integer' ? 1 : 'any'}
            min={field.min}
            max={field.max}
            value={raw === undefined || raw === null ? '' : String(raw)}
            onChange={(e) => setVal(e.target.value === '' ? undefined : Number(e.target.value))}
            disabled={disabled || field.computed}
            className={field.computed ? styles.computed : undefined}
            readOnly={field.computed}
          />
        )
        break
      case 'boolean':
        input = (
          <input
            id={field.name}
            type="checkbox"
            checked={Boolean(raw)}
            onChange={(e) => setVal(e.target.checked)}
            disabled={disabled}
          />
        )
        break
      case 'select':
        input = (
          <select
            id={field.name}
            value={(raw as string | undefined) ?? ''}
            onChange={(e) => setVal(e.target.value || undefined)}
            disabled={disabled}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )
        break
      case 'string':
      default:
        input = field.cols === 3 ? (
          <textarea
            id={field.name}
            value={(raw as string | undefined) ?? ''}
            onChange={(e) => setVal(e.target.value || undefined)}
            disabled={disabled}
            placeholder={field.placeholder}
          />
        ) : (
          <input
            id={field.name}
            type="text"
            value={(raw as string | undefined) ?? ''}
            onChange={(e) => setVal(e.target.value || undefined)}
            disabled={disabled}
            placeholder={field.placeholder}
          />
        )
    }

    return (
      <div key={field.name} className={`${styles.field} ${cols}`}>
        {labelEl}
        {input}
      </div>
    )
  }

  if (schema.sections?.length) {
    return (
      <>
        {schema.sections.map((section) => (
          <div key={section.title} className={styles.section}>
            <h4>{section.title}</h4>
            <div className={styles.grid}>
              {section.fields.map(renderField)}
            </div>
          </div>
        ))}
      </>
    )
  }

  return (
    <div className={styles.grid}>
      {schema.fields?.map(renderField)}
    </div>
  )
}

import { DatePickerComponent } from '@syncfusion/ej2-react-calendars'
import type { LabBulletinPayload } from '../types/lab.types'
import { toLocalDateISO } from '@/utils/format'
import styles from '../AnalizeMedicaleStep.module.scss'

interface Props {
  data: Partial<LabBulletinPayload>
  onChange: (patch: Partial<LabBulletinPayload>) => void
  readOnly?: boolean
}

export const LabBulletinHeader = ({ data, onChange, readOnly }: Props) => {
  const inputProps = (k: keyof LabBulletinPayload) => ({
    value: (data[k] as string) ?? '',
    disabled: readOnly,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ [k]: e.target.value || null } as Partial<LabBulletinPayload>),
    style: {
      padding: '0.2rem 0.4rem',
      border: '1px solid #cbd5e1',
      borderRadius: 3,
      fontSize: '0.82rem',
      background: '#fff',
      width: '100%',
    } as React.CSSProperties,
  })

  return (
    <div className={styles.bulletinHeader}>
      {/* Randul 1: campuri text */}
      <div>
        <strong>Laborator:</strong>
        <input type="text" {...inputProps('laboratory')} placeholder="Synevo, MedLife..." />
      </div>
      <div>
        <strong>Nr. buletin:</strong>
        <input type="text" {...inputProps('bulletinNumber')} />
      </div>
      <div>
        <strong>Pacient:</strong>
        <input type="text" {...inputProps('patientName')} />
      </div>
      <div>
        <strong>Medic:</strong>
        <input type="text" {...inputProps('doctor')} />
      </div>

      {/* Randul 2: date — span full width */}
      <div className={styles.bulletinDateRow}>
        <div className={styles.bulletinDateField}>
          <strong>Data recoltare:</strong>
          <DatePickerComponent
            value={data.collectionDate ? new Date(data.collectionDate) : undefined}
            change={(args) => onChange({ collectionDate: args.value ? toLocalDateISO(args.value) : null })}
            format="dd.MM.yyyy"
            locale="ro"
            placeholder="zz.ll.aaaa"
            enabled={!readOnly}
            showClearButton={!readOnly}
            showTodayButton
            firstDayOfWeek={1}
          />
        </div>
        <div className={styles.bulletinDateField}>
          <strong>Data rezultat:</strong>
          <DatePickerComponent
            value={data.resultDate ? new Date(data.resultDate) : undefined}
            change={(args) => onChange({ resultDate: args.value ? toLocalDateISO(args.value) : null })}
            format="dd.MM.yyyy"
            locale="ro"
            placeholder="zz.ll.aaaa"
            enabled={!readOnly}
            showClearButton={!readOnly}
            showTodayButton
            firstDayOfWeek={1}
          />
        </div>
      </div>
    </div>
  )
}

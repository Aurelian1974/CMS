import type { LabBulletinPayload } from '../types/lab.types'
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
      <div>
        <strong>Laborator:</strong>
        <input type="text" {...inputProps('laboratory')} placeholder="Synevo, MedLife..." />
      </div>
      <div>
        <strong>Nr. buletin:</strong>
        <input type="text" {...inputProps('bulletinNumber')} />
      </div>
      <div>
        <strong>Data recoltare:</strong>
        <input
          type="date"
          value={(data.collectionDate as string)?.substring(0, 10) ?? ''}
          disabled={readOnly}
          onChange={(e) => onChange({ collectionDate: e.target.value || null })}
          style={{ padding: '0.2rem 0.4rem', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: '0.82rem', background: '#fff', width: '100%' }}
        />
      </div>
      <div>
        <strong>Data rezultat:</strong>
        <input
          type="date"
          value={(data.resultDate as string)?.substring(0, 10) ?? ''}
          disabled={readOnly}
          onChange={(e) => onChange({ resultDate: e.target.value || null })}
          style={{ padding: '0.2rem 0.4rem', border: '1px solid #cbd5e1', borderRadius: 3, fontSize: '0.82rem', background: '#fff', width: '100%' }}
        />
      </div>
      <div>
        <strong>Pacient:</strong>
        <input type="text" {...inputProps('patientName')} />
      </div>
      <div>
        <strong>Medic:</strong>
        <input type="text" {...inputProps('doctor')} />
      </div>
    </div>
  )
}

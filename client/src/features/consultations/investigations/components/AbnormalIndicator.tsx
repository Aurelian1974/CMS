import styles from './AbnormalIndicator.module.scss'

interface Props {
  show?: boolean
  label?: string
}

export const AbnormalIndicator = ({ show, label = 'Anormal' }: Props) => {
  if (!show) return null
  return <span className={styles.abnormal} title="Valoare în afara intervalului fiziologic">⚠ {label}</span>
}

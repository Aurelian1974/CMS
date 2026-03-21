import { parsePhoneNumber } from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'
import styles from './PhoneCell.module.scss'

interface PhoneCellProps {
  /** Valoarea câmpului — string E.164 (ex: +40721234567) sau simplu (ex: 0721234567) */
  value?: string | null
}

/**
 * Celulă grid pentru număr de telefon — afișează steag SVG + prefix + număr formatat.
 * Dacă valoarea nu poate fi parsată ca număr internațional, o afișează ca atare.
 */
export const PhoneCell = ({ value }: PhoneCellProps) => {
  if (!value || value === '—') {
    return <span className={styles.empty}>—</span>
  }

  // Parsăm numărul — funcționează atât cu format E.164 cât și cu numere simple
  const parsed = parsePhoneNumber(value)

  if (!parsed?.country) {
    // Nu am putut determina țara — afișăm numărul simplu
    return <span className={styles.plain}>{value}</span>
  }

  const FlagComponent = flags[parsed.country]
  const formatted = parsed.formatInternational()

  return (
    <span className={styles.phoneCell}>
      <span className={styles.flagIcon} aria-hidden="true">
        {FlagComponent && <FlagComponent title={parsed.country} />}
      </span>
      <span className={styles.number}>{formatted}</span>
    </span>
  )
}

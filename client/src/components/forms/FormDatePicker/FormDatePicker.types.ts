import type { FieldValues, Control, Path } from 'react-hook-form'

export interface FormDatePickerProps<T extends FieldValues> {
  /** Numele câmpului din schema RHF */
  name: Path<T>
  /** Control object din useForm() */
  control: Control<T>
  /** Textul label-ului */
  label: string
  /** Placeholder (ex: "zz.ll.aaaa") */
  placeholder?: string
  /** Marchează câmpul ca obligatoriu */
  required?: boolean
  /** Dezactivează date picker-ul */
  disabled?: boolean
  /** Readonly */
  readOnly?: boolean
  /** Clasă CSS suplimentară pe container */
  className?: string
  /** Formatul de afișare al datei (default: dd.MM.yyyy — format românesc) */
  format?: string
  /** Data minimă selectabilă */
  min?: Date
  /** Data maximă selectabilă */
  max?: Date
  /** Prima zi a săptămânii: 0 = duminică, 1 = luni */
  firstDayOfWeek?: number
  /** Permite ștergerea valorii */
  showClearButton?: boolean
  /** Callback la schimbarea valorii */
  onValueChange?: (value: Date | null) => void
  /** Afișează un buton „Azi" în calendar */
  showTodayButton?: boolean
  /** Strict mode — nu permite introducere text liber */
  strictMode?: boolean
}

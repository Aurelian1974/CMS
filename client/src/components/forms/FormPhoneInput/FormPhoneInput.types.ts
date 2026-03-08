import type { FieldValues, Control, Path } from 'react-hook-form'
import type { Country } from 'react-phone-number-input'

export interface FormPhoneInputProps<T extends FieldValues> {
  /** Numele câmpului din schema RHF */
  name: Path<T>
  /** Control object din useForm() */
  control: Control<T>
  /** Textul label-ului (opțional — dacă lipsește, label-ul nu se afișează) */
  label?: string
  /** Marchează câmpul ca obligatoriu (afișează *) */
  required?: boolean
  /** Dezactivează inputul */
  disabled?: boolean
  /** Clasă CSS suplimentară pe container */
  className?: string
  /** Țara implicită la inițializare (default: RO) */
  defaultCountry?: Country
  /** Funcție apelată la schimbarea valorii */
  onValueChange?: (value: string) => void
}

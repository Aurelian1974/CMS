import type { FieldValues, Control, Path } from 'react-hook-form'

export interface FormInputProps<T extends FieldValues> {
  /** Numele câmpului din schema RHF — folosit pentru binding */
  name: Path<T>
  /** Control object din useForm() */
  control: Control<T>
  /** Textul label-ului */
  label: string
  /** Placeholder input */
  placeholder?: string
  /** Tipul inputului HTML */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  /** Marchează câmpul ca obligatoriu (afișează *) */
  required?: boolean
  /** Dezactivează inputul */
  disabled?: boolean
  /** Input readonly */
  readOnly?: boolean
  /** Lungime maximă (maxlength HTML) */
  maxLength?: number
  /** Clasă CSS suplimentară pe container */
  className?: string
  /** Proprietăți suplimentare Syncfusion TextBox */
  floatLabelType?: 'Auto' | 'Always' | 'Never'
  /** Activează mod multiline (textarea) */
  multiline?: boolean
  /** Număr rânduri textarea (relevant doar cu multiline) */
  rows?: number
  /** Funcție apelată la schimbarea valorii (pe lângă RHF onChange) */
  onValueChange?: (value: string) => void
}

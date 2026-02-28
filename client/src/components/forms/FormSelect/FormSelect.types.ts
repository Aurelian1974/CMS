import type { ReactNode } from 'react'
import type { FieldValues, Control, Path } from 'react-hook-form'

export interface SelectOption {
  /** Valoarea trimisă la submit (id-ul) */
  value: string
  /** Textul afișat în dropdown */
  label: string
}

export interface FormSelectProps<T extends FieldValues> {
  /** Numele câmpului din schema RHF */
  name: Path<T>
  /** Control object din useForm() */
  control: Control<T>
  /** Textul label-ului */
  label: string
  /** Lista de opțiuni */
  options: SelectOption[]
  /** Placeholder (text afișat când nu e selectat nimic) */
  placeholder?: string
  /** Marchează câmpul ca obligatoriu */
  required?: boolean
  /** Dezactivează dropdown-ul */
  disabled?: boolean
  /** Clasă CSS suplimentară pe container */
  className?: string
  /** Activează căutare/filtrare în dropdown */
  allowFiltering?: boolean
  /** Permite ștergerea selecției (X button) */
  showClearButton?: boolean
  /** Callback la schimbarea valorii (pe lângă RHF onChange) */
  onValueChange?: (value: string | null) => void
  /** Conținut custom în dropdown item */
  itemTemplate?: (data: SelectOption) => ReactNode
  /** Sortare alfanumerică pe label */
  sortOrder?: 'None' | 'Ascending' | 'Descending'
}

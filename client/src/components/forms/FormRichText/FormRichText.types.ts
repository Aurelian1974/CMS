import type { FieldValues, Control, Path } from 'react-hook-form'

export interface FormRichTextProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  height?: number | string
}

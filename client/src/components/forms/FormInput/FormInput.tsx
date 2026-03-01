import type React from 'react'
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs'
import { useController, type FieldValues } from 'react-hook-form'
import type { FormInputProps } from './FormInput.types'
import styles from './FormInput.module.scss'

/**
 * Wrapper reutilizabil pentru Syncfusion TextBoxComponent integrat cu React Hook Form.
 * Gestionează: label, required indicator, input Syncfusion, mesaj eroare.
 * Folosește useController pentru two-way binding cu RHF.
 */
export const FormInput = <T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  readOnly = false,
  maxLength,
  className,
  floatLabelType = 'Never',
  multiline = false,
  rows,
  onValueChange,
  labelSuffix,
}: FormInputProps<T>) => {
  const {
    field: { value, onChange, onBlur, ref },
    fieldState: { error },
  } = useController({ name, control })

  const handleInput = (args: { value?: string }) => {
    const newValue = args.value ?? ''
    onChange(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div className={`${styles.formGroup}${className ? ` ${className}` : ''}`}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
        {labelSuffix}
      </label>

      <TextBoxComponent
        ref={ref}
        value={value ?? ''}
        input={handleInput}
        blur={onBlur}
        placeholder={placeholder}
        type={type}
        enabled={!disabled}
        readonly={readOnly}
        htmlAttributes={{
          ...(maxLength ? { maxLength: String(maxLength) } : {}),
          ...(multiline && rows ? { rows: String(rows) } : {}),
        }}
        floatLabelType={floatLabelType}
        multiline={multiline}
        cssClass={error ? 'e-error' : ''}
      />

      {error && <span className={styles.error}>{error.message}</span>}
    </div>
  )
}

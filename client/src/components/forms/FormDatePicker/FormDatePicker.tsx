import { DatePickerComponent } from '@syncfusion/ej2-react-calendars'
import { useController, type FieldValues } from 'react-hook-form'
import type { FormDatePickerProps } from './FormDatePicker.types'
import styles from './FormDatePicker.module.scss'

/**
 * Wrapper reutilizabil pentru Syncfusion DatePickerComponent integrat cu React Hook Form.
 * Format implicit românesc: dd.MM.yyyy, prima zi = luni.
 */
export const FormDatePicker = <T extends FieldValues>({
  name,
  control,
  label,
  placeholder = 'zz.ll.aaaa',
  required = false,
  disabled = false,
  readOnly = false,
  className,
  format = 'dd.MM.yyyy',
  min,
  max,
  firstDayOfWeek = 1,
  showClearButton = true,
  onValueChange,
  showTodayButton = true,
  strictMode = false,
}: FormDatePickerProps<T>) => {
  const {
    field: { value, onChange, onBlur, ref },
    fieldState: { error },
  } = useController({ name, control })

  const handleChange = (args: { value?: Date | null }) => {
    const newValue = args.value ?? null
    onChange(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div className={`${styles.formGroup}${className ? ` ${className}` : ''}`}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>

      <DatePickerComponent
        ref={ref}
        value={value ? new Date(value) : undefined}
        change={handleChange}
        blur={onBlur}
        placeholder={placeholder}
        format={format}
        enabled={!disabled}
        readonly={readOnly}
        min={min}
        max={max}
        firstDayOfWeek={firstDayOfWeek}
        showClearButton={showClearButton}
        showTodayButton={showTodayButton}
        strictMode={strictMode}
        cssClass={error ? 'e-error' : ''}
      />

      {error && <span className={styles.error}>{error.message}</span>}
    </div>
  )
}

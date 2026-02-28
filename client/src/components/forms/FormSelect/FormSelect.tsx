import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns'
import { useController, type FieldValues } from 'react-hook-form'
import type { FormSelectProps } from './FormSelect.types'
import styles from './FormSelect.module.scss'

/**
 * Wrapper reutilizabil pentru Syncfusion DropDownListComponent integrat cu React Hook Form.
 * Gestionează: label, required indicator, dropdown cu opțiuni, mesaj eroare.
 * Suportă filtrare, clear button, sort order.
 */
export const FormSelect = <T extends FieldValues>({
  name,
  control,
  label,
  options,
  placeholder = 'Selectează...',
  required = false,
  disabled = false,
  className,
  allowFiltering = false,
  showClearButton = false,
  onValueChange,
  sortOrder = 'None',
}: FormSelectProps<T>) => {
  const {
    field: { value, onChange, onBlur, ref },
    fieldState: { error },
  } = useController({ name, control })

  const handleChange = (args: { value?: string | null }) => {
    const newValue = args.value ?? null
    onChange(newValue ?? '')
    onValueChange?.(newValue)
  }

  return (
    <div className={`${styles.formGroup}${className ? ` ${className}` : ''}`}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>

      <DropDownListComponent
        ref={ref}
        dataSource={options as any}
        fields={{ text: 'label', value: 'value' }}
        value={value ?? null}
        change={handleChange}
        blur={onBlur}
        placeholder={placeholder}
        enabled={!disabled}
        allowFiltering={allowFiltering}
        showClearButton={showClearButton}
        sortOrder={sortOrder}
        cssClass={error ? 'e-error' : ''}
        filterBarPlaceholder="Caută..."
        noRecordsTemplate="Nicio opțiune găsită"
        popupHeight="220px"
      />

      {error && <span className={styles.error}>{error.message}</span>}
    </div>
  )
}

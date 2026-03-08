import { useController, type FieldValues } from 'react-hook-form'
import PhoneInput, {
  getCountryCallingCode,
  getCountries,
} from 'react-phone-number-input'
import type { Country } from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'
import en from 'react-phone-number-input/locale/en.json'
// Nu importăm style.css din pachet — controluăm complet stilizarea prin SCSS
import type { FormPhoneInputProps } from './FormPhoneInput.types'
import styles from './FormPhoneInput.module.scss'

// ===== Selector țară personalizat cu steag SVG și prefix =====
interface CountrySelectProps {
  value: Country | undefined
  onChange: (country: Country | undefined) => void
  disabled?: boolean
}

const CountrySelect = ({ value, onChange, disabled }: CountrySelectProps) => {
  const countries = getCountries()
  const FlagComponent = value ? flags[value] : null

  return (
    <div className={styles.countryWrapper}>
      {/* Vizualizare steag SVG + prefix — overlay peste select-ul invizibil */}
      <span className={styles.flagDisplay} aria-hidden="true">
        <span className={styles.flagIcon}>
          {FlagComponent
            ? <FlagComponent title={value ?? ''} />
            : <span className={styles.flagPlaceholder}>🏳</span>
          }
        </span>
        <span className={styles.callingCode}>
          {value ? `+${getCountryCallingCode(value)}` : ''}
        </span>
        <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>

      {/* Select invizibil — acoperă întreaga zonă, asigură funcționalitate și accesibilitate */}
      <select
        className={styles.countrySelect}
        value={value ?? ''}
        onChange={(e) => onChange((e.target.value as Country) || undefined)}
        disabled={disabled}
        aria-label="Selectează țara"
      >
        {countries.map((country) => (
          <option key={country} value={country}>
            {(en as Record<string, string>)[country] ?? country} (+{getCountryCallingCode(country)})
          </option>
        ))}
      </select>
    </div>
  )
}

// ===== Componenta principală =====
export const FormPhoneInput = <T extends FieldValues>({
  name,
  control,
  label,
  required = false,
  disabled = false,
  className,
  defaultCountry = 'RO',
  onValueChange,
}: FormPhoneInputProps<T>) => {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({ name, control })

  const handleChange = (val: string | undefined) => {
    const newVal = val ?? ''
    onChange(newVal)
    onValueChange?.(newVal)
  }

  return (
    <div className={`${styles.formGroup}${className ? ` ${className}` : ''}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={`${styles.inputWrapper}${error ? ` ${styles.hasError}` : ''}`}>
        <PhoneInput
          value={value ?? ''}
          onChange={handleChange}
          onBlur={onBlur}
          defaultCountry={defaultCountry}
          disabled={disabled}
          countrySelectComponent={CountrySelect}
          inputClassName={styles.phoneInput}
          labels={en}
          international
          withCountryCallingCode
        />
      </div>

      {error && <span className={styles.error}>{error.message}</span>}
    </div>
  )
}

export default FormPhoneInput

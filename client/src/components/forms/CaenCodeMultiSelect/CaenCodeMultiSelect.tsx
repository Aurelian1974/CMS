import { useState } from 'react'
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { useCaenCodes } from '@/features/nomenclature/hooks/useCaenCodes'
import type { CaenCodeDto } from '@/features/nomenclature/types/caenCode.types'
import styles from './CaenCodeMultiSelect.module.scss'

interface CaenCodeMultiSelectProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label: string
  required?: boolean
  disabled?: boolean
}

export const CaenCodeMultiSelect = <T extends FieldValues>({
  name,
  control,
  label,
  required,
  disabled,
}: CaenCodeMultiSelectProps<T>) => {
  const {
    field,
    fieldState: { error },
  } = useController({ name, control })

  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Caută coduri CAEN — doar clasele (nivel 4) pentru că acestea se folosesc în CAEN firmă
  const { data: caenResp, isLoading } = useCaenCodes({
    search,
    classesOnly: true,
    topN: 20,
  })

  const searchResults: CaenCodeDto[] = caenResp?.data ?? []
  const selectedItems: CaenCodeDto[] = field.value ?? []

  // Filtrează din rezultate codurile deja selectate
  const availableResults = searchResults.filter(
    (cc) => !selectedItems.some((s) => s.id === cc.id),
  )

  const handleSelect = (item: CaenCodeDto) => {
    field.onChange([...selectedItems, item])
    setSearch('')
    setDropdownOpen(false)
  }

  const handleRemove = (id: string) => {
    field.onChange(selectedItems.filter((s) => s.id !== id))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setDropdownOpen(true)
  }

  const handleInputFocus = () => {
    if (search.length >= 1) setDropdownOpen(true)
  }

  // Delay la închidere pentru a permite click pe opțiunile din dropdown
  const handleInputBlur = () => {
    setTimeout(() => setDropdownOpen(false), 150)
  }

  const showDropdown =
    dropdownOpen &&
    search.length >= 1 &&
    (isLoading || availableResults.length > 0)

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>

      {/* Chips — coduri CAEN selectate */}
      {selectedItems.length > 0 && (
        <div className={styles.chips}>
          {selectedItems.map((item, idx) => (
            <span
              key={item.id}
              className={`${styles.chip} ${idx === 0 ? styles.chipPrimary : ''}`}
              title={idx === 0 ? 'Cod CAEN principal' : undefined}
            >
              <span className={styles.chipCode}>{item.code}</span>
              <span className={styles.chipName}>{item.name}</span>
              {!disabled && (
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={() => handleRemove(item.id)}
                  aria-label={`Șterge ${item.code}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Input căutare + dropdown */}
      {!disabled && (
        <div className={styles.inputWrap}>
          <input
            type="text"
            className={`${styles.searchInput} ${error ? styles.searchInputError : ''}`}
            value={search}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={
              selectedItems.length === 0
                ? 'Caută cod CAEN (ex: 862 sau farmaceutic)...'
                : 'Adaugă alt cod CAEN...'
            }
          />

          {showDropdown && (
            <div className={styles.dropdown}>
              {isLoading && (
                <div className={styles.dropdownLoading}>Se caută...</div>
              )}
              {!isLoading && availableResults.length === 0 && (
                <div className={styles.dropdownEmpty}>
                  Niciun rezultat pentru „{search}"
                </div>
              )}
              {!isLoading &&
                availableResults.map((cc) => (
                  <button
                    key={cc.id}
                    type="button"
                    className={styles.dropdownItem}
                    onMouseDown={(e) => e.preventDefault()} // previne blur înainte de click
                    onClick={() => handleSelect(cc)}
                  >
                    <span className={styles.dropdownCode}>{cc.code}</span>
                    <span className={styles.dropdownName}>{cc.name}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {error && <span className={styles.errorMsg}>{error.message}</span>}
    </div>
  )
}

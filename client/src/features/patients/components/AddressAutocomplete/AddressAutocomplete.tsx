import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useController, type FieldValues, type Control, type Path } from 'react-hook-form'
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs'
import axios from 'axios'
import { useDebounce } from '@/hooks/useDebounce'
import styles from './AddressAutocomplete.module.scss'

// ── Tipuri ────────────────────────────────────────────────────────────────────

export interface AddressSuggestion {
  /** Textul adresei (stradă + număr) — se pune în câmpul Adresă */
  address: string
  /** Text afișat în dropdown: stradă, localitate */
  displayText: string
  /** Text secundar în dropdown: județ, România */
  detailText: string
  city: string | null
  county: string | null
  postcode: string | null
}

export interface AddressAutocompleteProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  /** Callback la selectarea unei sugestii — primești adresă, localitate, județ, cod poștal */
  onSuggestionSelect?: (suggestion: Omit<AddressSuggestion, 'displayText' | 'detailText'>) => void
}

// ── Photon API ────────────────────────────────────────────────────────────────

const photon = axios.create({ baseURL: 'https://photon.komoot.io' })
// Bounding box România
const RO_BBOX = '20.26,43.62,29.76,48.27'

async function searchPhoton(query: string): Promise<AddressSuggestion[]> {
  const { data } = await photon.get('/api', {
    params: { q: query, limit: 10, bbox: RO_BBOX },
  })

  return (data.features as any[])
    .filter((f) => {
      const p = f.properties
      // Filtrare după countrycode (robust față de diacritice în "România")
      return (
        p.countrycode === 'RO' &&
        (p.street || p.name) &&
        p.city
      )
    })
    .map((f) => {
      const p = f.properties
      // Pentru tip "street" → numele strazii e în p.name
      // Pentru tip "house" → strada e în p.street, numărul în p.housenumber
      const streetPart = p.street
        ? [p.street, p.housenumber].filter(Boolean).join(' ')
        : p.name ?? ''
      const address = streetPart
      const city = p.city || p.town || p.village || null
      const displayText = [address, city].filter(Boolean).join(', ')
      const detailText = [p.county, p.country].filter(Boolean).join(', ')
      return {
        address,
        displayText,
        detailText,
        city,
        county: p.county ?? null,
        postcode: p.postcode ?? null,
      }
    })
    .filter((s) => s.address)
    // Elimină duplicate după displayText
    .filter((s, i, arr) => arr.findIndex((x) => x.displayText === s.displayText) === i)
    .slice(0, 7)
}

// ── Componentă ────────────────────────────────────────────────────────────────

export const AddressAutocomplete = <T extends FieldValues>({
  name,
  control,
  label = 'Adresă',
  placeholder = 'Str. Exemplu, Nr. 1',
  required = false,
  disabled = false,
  onSuggestionSelect,
}: AddressAutocompleteProps<T>) => {
  const {
    field: { value, onChange, onBlur, ref },
    fieldState: { error },
  } = useController({ name, control })

  const [inputValue, setInputValue]         = useState<string>(String(value ?? ''))
  const [suggestions, setSuggestions]       = useState<AddressSuggestion[]>([])
  const [isOpen, setIsOpen]                 = useState(false)
  const [isLoading, setIsLoading]           = useState(false)
  const [activeIndex, setActiveIndex]       = useState(-1)
  const [dropdownPos, setDropdownPos]       = useState({ top: 0, left: 0, width: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedValue = useDebounce(inputValue, 400)

  // Sincronizare valoare form → input (ex: reset la deschidere modal)
  useEffect(() => {
    setInputValue(String(value ?? ''))
  }, [value])

  // Calculează poziția dropdown-ului (portal la body → fixed)
  const updateDropdownPos = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }, [])

  // Repoziționează la scroll/resize cât dropdown-ul e deschis
  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('scroll', updateDropdownPos, true)
    window.addEventListener('resize', updateDropdownPos)
    return () => {
      window.removeEventListener('scroll', updateDropdownPos, true)
      window.removeEventListener('resize', updateDropdownPos)
    }
  }, [isOpen, updateDropdownPos])

  // Apel Photon după debounce
  useEffect(() => {
    if (debouncedValue.length < 3) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    searchPhoton(debouncedValue)
      .then((results) => {
        if (cancelled) return
        setSuggestions(results)
        setIsOpen(results.length > 0)
        setActiveIndex(-1)
        setIsLoading(false)
        updateDropdownPos()
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [debouncedValue, updateDropdownPos])

  // Click în afara componentei → închide dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Selectare sugestie
  const handleSelect = useCallback((suggestion: AddressSuggestion) => {
    setInputValue(suggestion.address)
    onChange(suggestion.address)
    setIsOpen(false)
    setSuggestions([])
    onSuggestionSelect?.({
      address: suggestion.address,
      city: suggestion.city,
      county: suggestion.county,
      postcode: suggestion.postcode,
    })
  }, [onChange, onSuggestionSelect])

  // Navigare cu tastele
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, -1))
        break
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault()
          handleSelect(suggestions[activeIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div className={styles.formGroup} ref={containerRef}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div
        className={`${styles.inputWrapper}${error ? ` ${styles.hasError}` : ''}`}
        onKeyDown={handleKeyDown}
      >
        <TextBoxComponent
          ref={ref}
          value={inputValue}
          input={(args) => {
            const v = args.value ?? ''
            setInputValue(v)
            onChange(v)
          }}
          blur={() => {
            onBlur()
            // Timeout mic — lasă onMouseDown pe sugestie să se execute primul
            setTimeout(() => setIsOpen(false), 200)
          }}
          placeholder={placeholder}
          enabled={!disabled}
          cssClass={error ? 'e-error' : ''}
        />
        {isLoading && <span className={styles.spinner} />}
      </div>

      {error && <span className={styles.error}>{error.message}</span>}

      {/* Dropdown portal — nu e afectat de overflow:hidden al modalului */}
      {isOpen &&
        createPortal(
          <div
            className={styles.dropdown}
            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
          >
            {suggestions.map((s, i) => (
              <div
                key={i}
                className={`${styles.item}${i === activeIndex ? ` ${styles.itemActive}` : ''}`}
                onMouseDown={() => handleSelect(s)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <span className={styles.itemMain}>{s.displayText}</span>
                <span className={styles.itemSub}>{s.detailText}</span>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}

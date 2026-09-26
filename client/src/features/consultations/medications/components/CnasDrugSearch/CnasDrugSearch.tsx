import { useEffect, useRef, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { DRUG_SEARCH_MIN_LENGTH, useCnasDrugSearch } from '../../hooks/useConsultationMedications'
import { parseCopaymentLists, type CnasDrugLookupDto } from '../../types/medication.types'
import styles from './CnasDrugSearch.module.scss'

const SEARCH_DEBOUNCE_MS = 300

interface CnasDrugSearchProps {
  onSelect: (drug: CnasDrugLookupDto) => void
  disabled?: boolean
}

export const CnasDrugSearch = ({ onSelect, disabled = false }: CnasDrugSearchProps) => {
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const debounced = useDebounce(term, SEARCH_DEBOUNCE_MS)
  const { data: results = [], isFetching } = useCnasDrugSearch(debounced)
  const hasTerm = debounced.trim().length >= DRUG_SEARCH_MIN_LENGTH

  useEffect(() => setActiveIndex(0), [results])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const select = (drug: CnasDrugLookupDto) => {
    onSelect(drug)
    setTerm('')
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Componenta stă în formularul consultației: Enter nu trebuie să-l trimită
    if (e.key === 'Enter') e.preventDefault()
    // Cu dropdown-ul deschis, Escape îl închide doar pe el (Sidebar ascultă Escape pe window)
    if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setOpen(false)
      return
    }
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      select(results[activeIndex])
    }
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrap}>
        <Search size={15} className={styles.inputIcon} aria-hidden="true" />
        <input
          type="text"
          className={`form-control ${styles.input}`}
          placeholder="Caută medicament CNAS după denumire, substanță activă sau cod…"
          value={term}
          disabled={disabled}
          onChange={(e) => { setTerm(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={open && hasTerm}
          aria-controls="cnas-drug-search-list"
          aria-autocomplete="list"
        />
        {isFetching && <Loader2 size={15} className={styles.spinner} aria-label="Se caută" />}
      </div>

      {open && hasTerm && (
        <ul className={styles.dropdown} id="cnas-drug-search-list" role="listbox">
          {!isFetching && results.length === 0 && (
            <li className={styles.empty}>Niciun medicament găsit.</li>
          )}
          {results.map((drug, idx) => {
            const lists = parseCopaymentLists(drug.copaymentLists)
            return (
              <li
                key={drug.code}
                role="option"
                aria-selected={idx === activeIndex}
                className={`${styles.option} ${idx === activeIndex ? styles.optionActive : ''} ${drug.isCompensated ? styles.optionCompensated : ''}`}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => { e.preventDefault(); select(drug) }}
              >
                <div className={styles.optionMain}>
                  <span className={styles.drugName}>{drug.name}</span>
                  <span className={styles.drugMeta}>
                    {[drug.concentration, drug.pharmaceuticalForm, drug.activeSubstanceCode].filter(Boolean).join(' · ')}
                  </span>
                  {drug.presentationMode && <span className={styles.drugPresentation}>{drug.presentationMode}</span>}
                </div>
                <div className={styles.optionSide}>
                  {drug.isCompensated ? (
                    <span className={styles.badgeCompensated}>
                      Compensat
                      {lists.map((l) => <span key={l} className={styles.listChip}>{l}</span>)}
                    </span>
                  ) : (
                    <span className={styles.badgeNotCompensated}>Necompensat</span>
                  )}
                  <span className={styles.drugCode}>{drug.code}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

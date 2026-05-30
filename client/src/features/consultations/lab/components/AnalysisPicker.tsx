import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import type { AnalysisDictionaryDto } from '../types/lab.types'
import { useAnalysesAll } from '../hooks/useLab'
import styles from '../AnalizeMedicaleStep.module.scss'

// ── Normalizare text pentru căutare fără diacritice ──────────────────────────

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
}

// ── Highlight căutare ─────────────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const nq = norm(query)
  const nt = norm(text)
  const idx = nt.indexOf(nq)
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.pickerHighlight}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

// ── Structura grupată ─────────────────────────────────────────────────────────

interface SubGroup {
  subcategory: string
  tests: AnalysisDictionaryDto[]
}

interface CategoryGroup {
  category: string
  count: number
  subgroups: SubGroup[]
}

function buildCategoryGroups(items: AnalysisDictionaryDto[]): CategoryGroup[] {
  const catMap = new Map<string, Map<string, AnalysisDictionaryDto[]>>()

  for (const item of items) {
    const cat = item.category ?? 'Altele'
    const sub = item.subcategory ?? cat

    if (!catMap.has(cat)) catMap.set(cat, new Map())
    const subMap = catMap.get(cat)!
    if (!subMap.has(sub)) subMap.set(sub, [])
    subMap.get(sub)!.push(item)
  }

  return Array.from(catMap.entries()).map(([cat, subMap]) => {
    const subgroups: SubGroup[] = Array.from(subMap.entries()).map(([sub, tests]) => ({
      subcategory: sub,
      tests,
    }))
    const count = subgroups.reduce((s, g) => s + g.tests.length, 0)
    return { category: cat, count, subgroups }
  })
}

// ── Props picker ──────────────────────────────────────────────────────────────

export interface AnalysisPickerProps {
  open: boolean
  onClose: () => void
  /** Callback cu itemul selectat. Pentru text liber, id = '' și restul câmpurilor sunt null. */
  onSelect: (item: AnalysisDictionaryDto) => void
}

// ── Componenta ─────────────────────────────────────────────────────────────────

export const AnalysisPicker = ({ open, onClose, onSelect }: AnalysisPickerProps) => {
  const { data: allAnalyses = [], isLoading } = useAnalysesAll()

  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selected, setSelected] = useState<AnalysisDictionaryDto | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)

  const categoryGroups = useMemo(() => buildCategoryGroups(allAnalyses), [allAnalyses])

  // Setează prima categorie activă la încărcare date
  useEffect(() => {
    if (categoryGroups.length > 0 && activeCategory === null) {
      setActiveCategory(categoryGroups[0].category)
    }
  }, [categoryGroups, activeCategory])

  // Resetare la deschidere + focus search
  useEffect(() => {
    if (open) {
      setSearchTerm('')
      setSelected(null)
      if (categoryGroups.length > 0) setActiveCategory(categoryGroups[0].category)
      setTimeout(() => searchRef.current?.focus(), 60)
    }
  }, [open, categoryGroups])

  // Keyboard: Escape = închide
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Rezultatele din căutare (normalizate)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return null
    const q = norm(searchTerm)
    const results: AnalysisDictionaryDto[] = []
    for (const item of allAnalyses) {
      if (norm(item.name).includes(q) || (item.slug && norm(item.slug).includes(q))) {
        results.push(item)
      }
    }
    return results
  }, [searchTerm, allAnalyses])

  const handleSelect = useCallback(
    (item: AnalysisDictionaryDto) => {
      setSelected(item)
    },
    [],
  )

  const handleConfirm = useCallback(() => {
    if (!selected) return
    onSelect(selected)
    onClose()
  }, [selected, onSelect, onClose])

  // Permite adăugarea textului liber (din câmpul de căutare) fără match în catalog
  const handleAddFreeText = useCallback(() => {
    if (!searchTerm.trim()) return
    onSelect({ id: '', name: searchTerm.trim(), unit: null, category: null, subcategory: null, slug: null })
    onClose()
  }, [searchTerm, onSelect, onClose])

  if (!open) return null

  const activeGroup = categoryGroups.find((g) => g.category === activeCategory)

  return createPortal(
    <div className={styles.pickerOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Selectează analiză">
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>

        {/* Header — câmp căutare */}
        <div className={styles.pickerHeader}>
          <div className={styles.pickerSearchWrap}>
            <Search size={16} className={styles.pickerSearchIcon} aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              className={styles.pickerSearchInput}
              placeholder="Caută după nume sau slug… (ex: hemogramă, VSH, glucoză)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.pickerSearchClear}
                onClick={() => setSearchTerm('')}
                aria-label="Șterge căutarea"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          <button type="button" className={styles.pickerCancelBtn} onClick={onClose}>
            Anulează
          </button>
        </div>

        {/* Body — 2 coloane */}
        <div className={styles.pickerBody}>

          {/* Left panel — categorii (vizibil doar fără search) */}
          {!searchTerm && (
            <div className={styles.pickerLeftPanel}>
              {isLoading ? (
                <div className={styles.pickerLoading}>Se încarcă…</div>
              ) : (
                categoryGroups.map((g) => (
                  <button
                    key={g.category}
                    type="button"
                    className={`${styles.pickerCatItem} ${g.category === activeCategory ? styles.pickerCatActive : ''}`}
                    onClick={() => {
                      setActiveCategory(g.category)
                      rightPanelRef.current?.scrollTo({ top: 0, behavior: 'instant' })
                    }}
                  >
                    <span>{g.category}</span>
                    <span className={styles.pickerCatBadge}>{g.count}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Right panel — teste */}
          <div
            ref={rightPanelRef}
            className={`${styles.pickerRightPanel} ${searchTerm ? styles.pickerRightFull : ''}`}
          >
            {isLoading ? (
              <div className={styles.pickerEmpty}>Se încarcă dicționarul…</div>
            ) : searchResults !== null ? (
              // Mod căutare
              searchResults.length === 0 ? (
                <div className={styles.pickerEmpty}>
                  <Search size={28} className={styles.pickerEmptyIcon} aria-hidden="true" />
                  <div>Nicio analiză găsită pentru „{searchTerm}"</div>
                  <button
                    type="button"
                    className={styles.pickerFreeTextBtn}
                    onClick={handleAddFreeText}
                  >
                    Adaugă „{searchTerm}" ca text liber
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.pickerResultCount}>
                    {searchResults.length} rezultate pentru „{searchTerm}"
                  </div>
                  {searchResults.map((item) => (
                    <PickerTestRow
                      key={item.id}
                      item={item}
                      query={searchTerm}
                      isSelected={selected?.id === item.id}
                      onSelect={handleSelect}
                      onDblClick={handleConfirm}
                    />
                  ))}
                </>
              )
            ) : activeGroup ? (
              // Mod categorie
              activeGroup.subgroups.map((sg) => (
                <div key={sg.subcategory}>
                  {sg.subcategory !== activeGroup.category && (
                    <div className={styles.pickerSubcatHeader}>{sg.subcategory}</div>
                  )}
                  {sg.tests.map((item) => (
                    <PickerTestRow
                      key={item.id}
                      item={item}
                      query=""
                      isSelected={selected?.id === item.id}
                      onSelect={handleSelect}
                      onDblClick={handleConfirm}
                    />
                  ))}
                </div>
              ))
            ) : null}
          </div>
        </div>

        {/* Footer — preview + confirmare */}
        <div className={styles.pickerFooter}>
          <div className={styles.pickerFooterPreview}>
            {selected ? (
              <>
                <strong>{selected.name}</strong>
                {selected.category && (
                  <span className={styles.pickerFooterCat}> — {selected.category}</span>
                )}
                {selected.unit && (
                  <span className={styles.pickerFooterUnit}>{selected.unit}</span>
                )}
              </>
            ) : (
              <span className={styles.pickerFooterPlaceholder}>Nicio analiză selectată</span>
            )}
          </div>
          <div className={styles.pickerFooterActions}>
            <span className={styles.pickerKeyHint}>esc = închide · dublu-click = selectează</span>
            <button
              type="button"
              className={styles.pickerConfirmBtn}
              disabled={!selected}
              onClick={handleConfirm}
            >
              Adaugă analiză
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── Rând de test ──────────────────────────────────────────────────────────────

interface PickerTestRowProps {
  item: AnalysisDictionaryDto
  query: string
  isSelected: boolean
  onSelect: (item: AnalysisDictionaryDto) => void
  onDblClick: () => void
}

const PickerTestRow = ({ item, query, isSelected, onSelect, onDblClick }: PickerTestRowProps) => (
  <div
    className={`${styles.pickerTestRow} ${isSelected ? styles.pickerTestSelected : ''}`}
    onClick={() => onSelect(item)}
    onDoubleClick={onDblClick}
    role="option"
    aria-selected={isSelected}
  >
    <span className={styles.pickerTestName}>
      <Highlight text={item.name} query={query} />
      {query && item.category && (
        <span className={styles.pickerTestCatHint}>{item.category}</span>
      )}
    </span>
    {item.unit && <span className={styles.pickerTestUnit}>{item.unit}</span>}
  </div>
)

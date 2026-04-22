import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useDebounce } from '@/hooks/useDebounce'
import { icd10Api } from '@/api/endpoints/icd10.api'
import type { ICD10SearchResult } from '@/features/consultations/types/icd10.types'
import styles from './ICD10SearchBox.module.scss'

// ── Tipuri ────────────────────────────────────────────────────────────────────

export interface ICD10SearchBoxProps {
  placeholder?: string
  minSearchLength?: number
  maxResults?: number
  disabled?: boolean
  onCodeSelected: (code: ICD10SearchResult) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'Cardiovascular': return '❤️'
    case 'Endocrin':       return '🔬'
    case 'Respirator':     return '🫁'
    case 'Digestiv':       return '🍽️'
    case 'Nervos':         return '🧠'
    case 'Simptome':       return '⚕️'
    default:               return '📋'
  }
}

type SortCol = 'code' | 'description'

// ── Componentă ────────────────────────────────────────────────────────────────

export const ICD10SearchBox = ({
  placeholder = 'Căutați după cod sau denumire (ex: I10, Hipertensiune)...',
  minSearchLength = 2,
  maxResults = 20,
  disabled = false,
  onCodeSelected,
}: ICD10SearchBoxProps) => {
  // ── State: Search ──
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<ICD10SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // ── State: Favorites panel ──
  const [isFavPanelOpen, setIsFavPanelOpen] = useState(false)
  const [favoritesList, setFavoritesList] = useState<ICD10SearchResult[]>([])
  const [favSearchTerm, setFavSearchTerm] = useState('')
  const [favSortCol, setFavSortCol] = useState<SortCol>('code')
  const [favSortAsc, setFavSortAsc] = useState(true)
  const [isFavLoading, setIsFavLoading] = useState(false)

  // ── State: Favorite IDs (for marking in search results) ──
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  // ── State: Dropdown position ──
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })

  // ── Refs ──
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Debounce search ──
  const debouncedSearch = useDebounce(searchTerm, 300)

  // ── Load initial favorite IDs ──
  useEffect(() => {
    loadFavoriteIds()
  }, [])

  const loadFavoriteIds = async () => {
    try {
      const resp = await icd10Api.getFavorites()
      if (resp.success && resp.data) {
        setFavoriteIds(new Set(resp.data.map(f => f.icD10_ID)))
      }
    } catch { /* silent */ }
  }

  // ── Calculate dropdown position ──
  const updateDropdownPos = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }, [])

  // ── Reposition on scroll/resize when open ──
  useEffect(() => {
    if (!showResults && !isFavPanelOpen) return
    window.addEventListener('scroll', updateDropdownPos, true)
    window.addEventListener('resize', updateDropdownPos)
    return () => {
      window.removeEventListener('scroll', updateDropdownPos, true)
      window.removeEventListener('resize', updateDropdownPos)
    }
  }, [showResults, isFavPanelOpen, updateDropdownPos])

  // ── Search API call after debounce ──
  useEffect(() => {
    if (debouncedSearch.length < minSearchLength) {
      setResults([])
      setShowResults(false)
      return
    }

    let cancelled = false
    setIsSearching(true)

    icd10Api.search(debouncedSearch, maxResults)
      .then(resp => {
        if (cancelled) return
        if (resp.success && resp.data) {
          const data = resp.data.map(r => ({
            ...r,
            isFavorite: favoriteIds.has(r.icD10_ID),
          }))
          setResults(data)
          setShowResults(data.length > 0)
          setSelectedIndex(-1)
          updateDropdownPos()
        } else {
          setResults([])
          setShowResults(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults([])
          setShowResults(false)
        }
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false)
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, maxResults, minSearchLength])

  // ── Click outside → close dropdowns ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
        setIsFavPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Select a result ──
  const handleSelect = useCallback((result: ICD10SearchResult) => {
    onCodeSelected(result)
    setSearchTerm('')
    setResults([])
    setShowResults(false)
    setSelectedIndex(-1)
  }, [onCodeSelected])

  // ── Toggle favorite on result ──
  const handleToggleFavorite = useCallback(async (result: ICD10SearchResult, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      if (result.isFavorite) {
        await icd10Api.removeFavorite(result.icD10_ID)
        setFavoriteIds(prev => { const next = new Set(prev); next.delete(result.icD10_ID); return next })
      } else {
        await icd10Api.addFavorite(result.icD10_ID)
        setFavoriteIds(prev => new Set(prev).add(result.icD10_ID))
      }
      // Update result in-place
      setResults(prev => prev.map(r =>
        r.icD10_ID === result.icD10_ID ? { ...r, isFavorite: !r.isFavorite } : r
      ))
    } catch { /* silent */ }
  }, [])

  // ── Keyboard navigation ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault()
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        break
    }
  }

  // ── Clear search ──
  const clearSearch = () => {
    setSearchTerm('')
    setResults([])
    setShowResults(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // ── Focus / Blur ──
  const handleFocus = () => {
    if (searchTerm.length >= minSearchLength && results.length > 0) {
      setShowResults(true)
      updateDropdownPos()
    }
  }

  const handleBlur = () => {
    setTimeout(() => setShowResults(false), 200)
  }

  // ════════════════════════════════════════════════════════════════════
  // FAVORITES PANEL
  // ════════════════════════════════════════════════════════════════════

  const toggleFavPanel = async () => {
    if (isFavPanelOpen) {
      setIsFavPanelOpen(false)
      setFavSearchTerm('')
      return
    }
    setShowResults(false)
    setIsFavPanelOpen(true)
    setFavSearchTerm('')
    await loadFavoritesList()
    updateDropdownPos()
  }

  const loadFavoritesList = async () => {
    setIsFavLoading(true)
    try {
      const resp = await icd10Api.getFavorites()
      if (resp.success && resp.data) {
        const favs = resp.data.map(f => ({ ...f, isFavorite: true }))
        setFavoritesList(favs)
        setFavoriteIds(new Set(favs.map(f => f.icD10_ID)))
      }
    } catch { /* silent */ }
    finally { setIsFavLoading(false) }
  }

  const selectFavorite = (fav: ICD10SearchResult) => {
    onCodeSelected(fav)
    setIsFavPanelOpen(false)
    setSearchTerm('')
    setResults([])
    setShowResults(false)
    setSelectedIndex(-1)
  }

  const sortFavoritesBy = (col: SortCol) => {
    if (favSortCol === col) {
      setFavSortAsc(prev => !prev)
    } else {
      setFavSortCol(col)
      setFavSortAsc(true)
    }
  }

  const getSortIcon = (col: SortCol) => {
    if (favSortCol !== col) return ''
    return favSortAsc ? ' ▲' : ' ▼'
  }

  // Filtered + sorted favorites
  const filteredFavorites = useMemo(() => {
    let list = [...favoritesList]
    if (favSearchTerm.trim()) {
      const q = favSearchTerm.toLowerCase()
      list = list.filter(f =>
        f.code.toLowerCase().includes(q) ||
        f.shortDescriptionRo.toLowerCase().includes(q) ||
        (f.longDescriptionRo?.toLowerCase().includes(q)) ||
        (f.category?.toLowerCase().includes(q))
      )
    }
    list.sort((a, b) => {
      const valA = favSortCol === 'code' ? a.code : a.shortDescriptionRo
      const valB = favSortCol === 'code' ? b.code : b.shortDescriptionRo
      const cmp = valA.localeCompare(valB, 'ro')
      return favSortAsc ? cmp : -cmp
    })
    return list
  }, [favoritesList, favSearchTerm, favSortCol, favSortAsc])

  // ════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════

  return (
    <div className={styles.searchBox} ref={containerRef}>
      {/* ── Search Input Row ── */}
      <div className={styles.inputWrapper}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder={placeholder}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        {searchTerm && (
          <button className={styles.btnClear} onClick={clearSearch} title="Șterge căutare" type="button">✕</button>
        )}
        <button
          type="button"
          className={`${styles.btnFavToggle}${isFavPanelOpen ? ` ${styles.active}` : ''}`}
          onClick={toggleFavPanel}
          title={isFavPanelOpen ? 'Închide favoritele' : 'Vezi codurile favorite'}
        >
          <span>⭐</span>
          <span>Favorite</span>
          {favoriteIds.size > 0 && <span className={styles.favCount}>{favoriteIds.size}</span>}
          <span className={styles.chevron}>{isFavPanelOpen ? '▲' : '▼'}</span>
        </button>
        {isSearching && <span className={styles.spinner} />}
      </div>

      {/* ── Inline Favorites Panel ── */}
      {isFavPanelOpen && createPortal(
        <div className={styles.favPanel} style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}>
          {/* Panel Header */}
          <div className={styles.favPanelHeader}>
            <div className={styles.favHeaderTitle}>
              <span>⭐</span>
              <span>Coduri ICD-10 Favorite</span>
            </div>
            <div className={styles.favSearch}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Filtrează favorite..."
                value={favSearchTerm}
                onChange={e => setFavSearchTerm(e.target.value)}
              />
              {favSearchTerm && (
                <button type="button" className={styles.btnClearSmall} onClick={() => setFavSearchTerm('')}>✕</button>
              )}
            </div>
            <button type="button" className={styles.btnClosePanel} onClick={() => { setIsFavPanelOpen(false); setFavSearchTerm('') }} title="Închide">✕</button>
          </div>

          {/* Panel Body */}
          <div className={styles.favPanelBody}>
            {isFavLoading ? (
              <div className={styles.favLoading}>
                <span className={styles.spinnerInline} />
                <span>Se încarcă favoritele...</span>
              </div>
            ) : favoritesList.length === 0 ? (
              <div className={styles.favEmpty}>
                <span>☆</span>
                <p>Nu aveți coduri ICD-10 favorite</p>
                <small>Adăugați coduri la favorite din rezultatele căutării</small>
              </div>
            ) : filteredFavorites.length === 0 ? (
              <div className={styles.favNoResults}>
                <span>🔍</span>
                <p>Nu s-au găsit rezultate pentru &quot;<strong>{favSearchTerm}</strong>&quot;</p>
              </div>
            ) : (
              <>
                <div className={styles.favTableWrap}>
                  <table className={styles.favTable}>
                    <thead>
                      <tr>
                        <th className={styles.colCode} onClick={() => sortFavoritesBy('code')}>
                          Cod{getSortIcon('code')}
                        </th>
                        <th className={styles.colDesc} onClick={() => sortFavoritesBy('description')}>
                          Denumire{getSortIcon('description')}
                        </th>
                        <th className={styles.colCat}>Categorie</th>
                        <th className={styles.colAction}>Acțiune</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFavorites.map(fav => (
                        <tr key={fav.icD10_ID} className={styles.favRow} onClick={() => selectFavorite(fav)}>
                          <td><span className={styles.codeBadge}>{fav.code}</span></td>
                          <td>{fav.shortDescriptionRo}</td>
                          <td>
                            {fav.category && (
                              <span className={styles.categoryTag}>
                                {getCategoryIcon(fav.category)} {fav.category}
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.btnSelectFav}
                              onClick={(e) => { e.stopPropagation(); selectFavorite(fav) }}
                              title="Selectează"
                            >✓</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={styles.favFooter}>
                  <span>ℹ️ Afișate: <strong>{filteredFavorites.length}</strong> din <strong>{favoritesList.length}</strong></span>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── Search Results Dropdown ── */}
      {showResults && results.length > 0 && createPortal(
        <div className={styles.resultsDropdown} style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}>
          {/* Results Header */}
          <div className={styles.resultsHeader}>
            <span className={styles.resultsCount}>📋 {results.length} rezultate</span>
            <span className={styles.resultsHint}>
              <kbd>↑</kbd><kbd>↓</kbd> navigare &bull; <kbd>Enter</kbd> selectare
            </span>
          </div>

          {/* Results List */}
          <div className={styles.resultsList}>
            {results.map((result, index) => (
              <div
                key={result.icD10_ID}
                className={`${styles.resultItem}${index === selectedIndex ? ` ${styles.resultItemSelected}` : ''}`}
                onMouseDown={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {/* Favorite Star */}
                <button
                  type="button"
                  className={`${styles.btnFav}${result.isFavorite ? ` ${styles.btnFavActive}` : ''}`}
                  onMouseDown={e => handleToggleFavorite(result, e)}
                  title={result.isFavorite ? 'Elimină din favorite' : 'Adaugă la favorite'}
                >
                  {result.isFavorite ? '★' : '☆'}
                </button>

                {/* Code Badge */}
                <div className={styles.resultCodeWrap}>
                  <span className={styles.codeBadge}>{result.code}</span>
                </div>

                {/* Description & Meta */}
                <div className={styles.resultContent}>
                  <div className={styles.resultDesc}>{result.shortDescriptionRo}</div>
                  <div className={styles.resultMeta}>
                    {result.category && (
                      <span className={styles.metaCategory}>
                        <span>{getCategoryIcon(result.category)}</span>
                        {result.category}
                      </span>
                    )}
                    {result.isCommon && (
                      <span className={`${styles.metaBadge} ${styles.metaCommon}`}>⭐ Frecvent</span>
                    )}
                    {!result.isTranslated && (
                      <span className={`${styles.metaBadge} ${styles.metaEnglish}`}>🌐 EN</span>
                    )}
                  </div>
                </div>

                {/* Select Button */}
                <button type="button" className={styles.btnSelectResult} title="Selectează">✓</button>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* No results message */}
      {showResults && results.length === 0 && !isSearching && searchTerm.length >= minSearchLength && createPortal(
        <div className={styles.resultsDropdown} style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}>
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>🔍</div>
            <div className={styles.noResultsText}>
              <p>Nu s-au găsit rezultate pentru</p>
              <span className={styles.searchTermDisplay}>&quot;{searchTerm}&quot;</span>
            </div>
            <div className={styles.noResultsHint}>Încercați alt termen sau verificați ortografia</div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

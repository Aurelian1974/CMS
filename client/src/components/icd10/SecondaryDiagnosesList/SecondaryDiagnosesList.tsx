import { useState, useRef, useCallback } from 'react'
import { RichTextEditorComponent, Inject, Toolbar, Link, HtmlEditor, Count, QuickToolbar, Resize, ToolbarType } from '@syncfusion/ej2-react-richtexteditor'
import { ICD10SearchBox } from '@/components/icd10/ICD10SearchBox'
import type { ICD10SearchResult } from '@/features/consultations/types/icd10.types'
import styles from './SecondaryDiagnosesList.module.scss'

// ── Tipuri ────────────────────────────────────────────────────────────────────

export interface SecondaryDiagnosis {
  id: string
  description: string
  icd10Codes: ICD10SearchResult[]
}

export interface SecondaryDiagnosesListProps {
  diagnoses: SecondaryDiagnosis[]
  onChange: (diagnoses: SecondaryDiagnosis[]) => void
  showValidation?: boolean
  disabled?: boolean
}

// ── RTE Toolbar compact ──────────────────────────────────────────────────────

const RTE_TOOLS = [
  'Bold', 'Italic', 'Underline', '|',
  'OrderedList', 'UnorderedList', '|',
  'Undo', 'Redo',
]

const MAX_DIAGNOSES = 10
const MAX_CODES_PER = 10

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent ?? ''
}

function truncate(text: string | undefined | null, max: number): string {
  if (!text) return ''
  const plain = stripHtml(text)
  return plain.length <= max ? plain : plain.substring(0, max) + '...'
}

// ── Componentă ────────────────────────────────────────────────────────────────

export const SecondaryDiagnosesList = ({
  diagnoses,
  onChange,
  showValidation = false,
  disabled = false,
}: SecondaryDiagnosesListProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const rteRefs = useRef<Map<string, RichTextEditorComponent>>(new Map())

  const isMaxReached = diagnoses.length >= MAX_DIAGNOSES

  // ── Handlers ──

  const addDiagnosis = useCallback(() => {
    if (isMaxReached) return
    const next: SecondaryDiagnosis = {
      id: crypto.randomUUID(),
      description: '',
      icd10Codes: [],
    }
    const updated = [...diagnoses, next]
    onChange(updated)
    setExpandedIndex(updated.length - 1)
  }, [diagnoses, isMaxReached, onChange])

  const removeDiagnosis = useCallback((index: number) => {
    const updated = diagnoses.filter((_, i) => i !== index)
    onChange(updated)
    if (expandedIndex === index) setExpandedIndex(null)
    else if (expandedIndex !== null && expandedIndex > index) setExpandedIndex(expandedIndex - 1)
  }, [diagnoses, expandedIndex, onChange])

  const addCode = useCallback((diagIndex: number, code: ICD10SearchResult) => {
    const diag = diagnoses[diagIndex]
    if (diag.icd10Codes.length >= MAX_CODES_PER) return
    if (diag.icd10Codes.some(c => c.code === code.code)) return
    const updated = [...diagnoses]
    updated[diagIndex] = { ...diag, icd10Codes: [...diag.icd10Codes, code] }
    onChange(updated)
  }, [diagnoses, onChange])

  const removeCode = useCallback((diagIndex: number, codeIndex: number) => {
    const diag = diagnoses[diagIndex]
    const updated = [...diagnoses]
    updated[diagIndex] = {
      ...diag,
      icd10Codes: diag.icd10Codes.filter((_, i) => i !== codeIndex),
    }
    onChange(updated)
  }, [diagnoses, onChange])

  const handleDescChange = useCallback((diagId: string) => {
    const rte = rteRefs.current.get(diagId)
    if (!rte) return
    const val = rte.value ?? ''
    const updated = diagnoses.map(d => d.id === diagId ? { ...d, description: val } : d)
    onChange(updated)
  }, [diagnoses, onChange])

  const toggleExpand = (index: number) => {
    setExpandedIndex(prev => prev === index ? null : index)
  }

  const isDiagValid = (diag: SecondaryDiagnosis) => !!diag.description.trim()

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span>📋</span>
          <span className={styles.headerTitle}>Diagnostic Secundar</span>
          <span className={styles.headerCounter}>{diagnoses.length}/{MAX_DIAGNOSES}</span>
        </div>
        {!isMaxReached && !disabled && (
          <button type="button" className={styles.btnAdd} onClick={addDiagnosis} title="Adaugă diagnostic secundar">
            + Adaugă
          </button>
        )}
      </div>

      {/* List */}
      <div className={styles.list}>
        {diagnoses.length === 0 ? (
          <div className={styles.emptyState}>
            <span>➕</span>
            <span>Click &quot;Adaugă&quot; pentru a adăuga diagnostice secundare</span>
          </div>
        ) : (
          diagnoses.map((diag, index) => (
            <div
              key={diag.id}
              className={`${styles.entry}${expandedIndex === index ? ` ${styles.expanded}` : ''}${showValidation && !isDiagValid(diag) ? ` ${styles.invalid}` : ''}`}
            >
              {/* Compact Row (always visible) */}
              <div className={styles.row} onClick={() => toggleExpand(index)}>
                <div className={styles.rowNumber}>#{index + 1}</div>
                <div className={styles.rowContent}>
                  {diag.icd10Codes.length > 0 && (
                    <div className={styles.codesPreview}>
                      {diag.icd10Codes.slice(0, 3).map(c => (
                        <span key={c.code} className={styles.codeMini}>{c.code}</span>
                      ))}
                      {diag.icd10Codes.length > 3 && (
                        <span className={styles.codeMore}>+{diag.icd10Codes.length - 3}</span>
                      )}
                    </div>
                  )}
                  <span className={`${styles.rowDesc}${!diag.description ? ` ${styles.placeholder}` : ''}`}>
                    {diag.description ? truncate(diag.description, 60) : 'Click pentru a edita...'}
                  </span>
                </div>
                <div className={styles.rowActions}>
                  <button type="button" className={styles.btnExpand} title={expandedIndex === index ? 'Restrânge' : 'Extinde'}>
                    {expandedIndex === index ? '▲' : '▼'}
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      className={styles.btnDelete}
                      onClick={e => { e.stopPropagation(); removeDiagnosis(index) }}
                      title="Șterge"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedIndex === index && (
                <div className={styles.detailsPanel}>
                  {/* ICD-10 Codes */}
                  <div className={styles.detailSection}>
                    <label className={styles.detailLabel}>
                      🏷️ Coduri ICD-10
                      <span className={styles.codesCount}>({diag.icd10Codes.length}/{MAX_CODES_PER})</span>
                    </label>
                    {diag.icd10Codes.length < MAX_CODES_PER && !disabled && (
                      <div className={styles.searchCompact}>
                        <ICD10SearchBox
                          placeholder="Caută și adaugă cod ICD-10..."
                          onCodeSelected={code => addCode(index, code)}
                          minSearchLength={2}
                          maxResults={8}
                          disabled={disabled}
                        />
                      </div>
                    )}
                    {diag.icd10Codes.length > 0 && (
                      <div className={styles.codeTags}>
                        {diag.icd10Codes.map((c, ci) => (
                          <div key={c.code} className={styles.codeTag}>
                            <span className={styles.tagCode}>{c.code}</span>
                            <span className={styles.tagName}>{truncate(c.shortDescriptionRo, 35)}</span>
                            {!disabled && (
                              <button
                                type="button"
                                className={styles.btnRemoveTag}
                                onClick={() => removeCode(index, ci)}
                                title="Elimină"
                              >✕</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description RTE */}
                  <div className={styles.detailSection}>
                    <label className={styles.detailLabel}>
                      📝 Descriere
                      {showValidation && !diag.description.trim() && (
                        <span className={styles.requiredInd}>* obligatoriu</span>
                      )}
                    </label>
                    <div className={styles.rteContainer}>
                      <RichTextEditorComponent
                        ref={(el: RichTextEditorComponent | null) => { if (el) rteRefs.current.set(diag.id, el) }}
                        value={diag.description}
                        change={() => handleDescChange(diag.id)}
                        placeholder="Descrieți diagnosticul secundar..."
                        enabled={!disabled}
                        showCharCount={true}
                        enableResize={true}
                        height={130}
                        toolbarSettings={{ items: RTE_TOOLS, enableFloating: false, type: ToolbarType.Expand }}
                      >
                        <Inject services={[Toolbar, Link, HtmlEditor, Count, QuickToolbar, Resize]} />
                      </RichTextEditorComponent>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Limit indicator */}
      {isMaxReached && (
        <div className={styles.limitIndicator}>
          ✅ Ați atins limita maximă de {MAX_DIAGNOSES} diagnostice secundare
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useCallback } from 'react'
import { RichTextEditorComponent, Inject, Toolbar, Link, HtmlEditor, Count, QuickToolbar, Resize, ToolbarType } from '@syncfusion/ej2-react-richtexteditor'
import { ICD10SearchBox } from '@/components/icd10/ICD10SearchBox'
import type { ICD10SearchResult } from '@/features/consultations/types/icd10.types'
import styles from './PrimaryDiagnosisSelector.module.scss'

// ── Tipuri ────────────────────────────────────────────────────────────────────

export interface PrimaryDiagnosisSelectorProps {
  selectedCode: ICD10SearchResult | null
  onCodeChange: (code: ICD10SearchResult | null) => void
  details?: string
  onDetailsChange?: (value: string) => void
  showValidation?: boolean
  disabled?: boolean
}

// ── RTE Toolbar compact ──────────────────────────────────────────────────────

const RTE_TOOLS = [
  'Bold', 'Italic', 'Underline', '|',
  'OrderedList', 'UnorderedList', '|',
  'Undo', 'Redo',
]

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Componentă ────────────────────────────────────────────────────────────────

export const PrimaryDiagnosisSelector = ({
  selectedCode,
  onCodeChange,
  details = '',
  onDetailsChange,
  showValidation = false,
  disabled = false,
}: PrimaryDiagnosisSelectorProps) => {
  const [isChanging, setIsChanging] = useState(false)
  const rteRef = useRef<RichTextEditorComponent | null>(null)

  const handleCodeSelected = useCallback((code: ICD10SearchResult) => {
    onCodeChange(code)
    setIsChanging(false)
  }, [onCodeChange])

  const handleClear = useCallback(() => {
    onCodeChange(null)
    onDetailsChange?.('')
    setIsChanging(false)
  }, [onCodeChange, onDetailsChange])

  const handleRteChange = useCallback(() => {
    if (rteRef.current) {
      onDetailsChange?.(rteRef.current.value ?? '')
    }
  }, [onDetailsChange])

  return (
    <div className={styles.selector}>
      <div className={styles.header}>
        <label className={styles.label}>
          <span>⭐</span> Diagnostic Principal
          <span className={styles.required}>*</span>
        </label>
        {selectedCode && !disabled && (
          <button type="button" className={styles.btnClear} onClick={handleClear} title="Șterge diagnostic principal">
            ✕ Șterge
          </button>
        )}
      </div>

      {!selectedCode || isChanging ? (
        <>
          <ICD10SearchBox
            placeholder="Căutați codul ICD-10 pentru diagnosticul principal..."
            onCodeSelected={handleCodeSelected}
            minSearchLength={2}
            maxResults={15}
            disabled={disabled}
          />
          {showValidation && !selectedCode && (
            <div className={styles.validation}>
              ⚠️ Diagnosticul principal este obligatoriu
            </div>
          )}
        </>
      ) : (
        <>
          {/* Selected Code Display */}
          <div className={`${styles.selectedDisplay}${showValidation ? ` ${styles.validated}` : ''}`}>
            <div className={`${styles.codeBadge} ${styles.principal}`}>
              ⭐ {selectedCode.code}
            </div>
            <div className={styles.codeInfo}>
              <div className={styles.codeName}>{selectedCode.shortDescriptionRo}</div>
              {selectedCode.category && (
                <div className={styles.codeCategory}>
                  <span>{getCategoryIcon(selectedCode.category)}</span>
                  <span>{selectedCode.category}</span>
                </div>
              )}
            </div>
            {!disabled && (
              <button type="button" className={styles.btnChange} onClick={() => setIsChanging(true)} title="Schimbă codul">
                ✏️
              </button>
            )}
          </div>

          {/* RTE Description */}
          <div className={styles.detailsField}>
            <label className={styles.detailsLabel}>
              📝 Descriere diagnostic principal
            </label>
            <div className={styles.rteContainer}>
              <RichTextEditorComponent
                ref={rteRef}
                value={details}
                change={handleRteChange}
                placeholder="Descrieți detaliat diagnosticul principal..."
                enabled={!disabled}
                showCharCount={true}
                enableResize={true}
                height={150}
                toolbarSettings={{ items: RTE_TOOLS, enableFloating: false, type: ToolbarType.Expand }}
              >
                <Inject services={[Toolbar, Link, HtmlEditor, Count, QuickToolbar, Resize]} />
              </RichTextEditorComponent>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import {
  useCreateInvestigation,
  useInvestigationTypes,
  useUpdateInvestigation,
} from '@/features/consultations/investigations/hooks/useInvestigations'
import type {
  CreateInvestigationPayload,
  InvestigationDto,
  InvestigationStatus,
  InvestigationTypeDto,
  UpdateInvestigationPayload,
  DocumentDto,
} from '@/features/consultations/investigations/types/investigation.types'
import {
  STRUCTURED_SCHEMAS,
  QUESTIONNAIRE_SCHEMAS,
} from '@/features/consultations/investigations/config/investigationSchemas'
import { StructuredFormRenderer } from './StructuredFormRenderer'
import { QuestionnaireRenderer } from './QuestionnaireRenderer'
import { DocumentUpload } from './DocumentUpload'
import styles from './InvestigationFormModal.module.scss'

interface Props {
  isOpen: boolean
  onClose: () => void
  consultationId: string
  patientId: string
  doctorId: string
  /** Tip selectat anterior din AddInvestigationModal (pentru creare). */
  pickedType?: InvestigationTypeDto | null
  /** Investigație existentă (pentru editare). */
  existing?: InvestigationDto | null
  disabled?: boolean
}

const STATUS_OPTIONS: { value: InvestigationStatus; label: string }[] = [
  { value: 0, label: 'Solicitată' },
  { value: 1, label: 'În așteptare' },
  { value: 2, label: 'Finalizată' },
  { value: 3, label: 'Anulată' },
]

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface FormState {
  investigationType: string
  investigationTypeDisplayName: string
  uiPattern: 'Narrative' | 'Structured' | 'LabTable' | 'Questionnaire'
  hasStructuredFields: boolean
  defaultStructuredEntry: boolean
  investigationDate: string
  status: InvestigationStatus
  isExternal: boolean
  externalSource: string
  narrative: string
  structured: Record<string, unknown>
  /** Mod de input pentru tipuri Structured cu hasStructuredFields=true. */
  structuredMode: boolean
  attachedDocumentId: string | null
  attachedDocumentName: string | null
}

export const InvestigationFormModal = ({
  isOpen,
  onClose,
  consultationId,
  patientId,
  doctorId,
  pickedType,
  existing,
  disabled,
}: Props) => {
  const { data: types = [] } = useInvestigationTypes()
  const createMut = useCreateInvestigation(consultationId)
  const updateMut = useUpdateInvestigation(consultationId)

  const typeMeta: InvestigationTypeDto | undefined = useMemo(() => {
    const code = existing?.investigationType ?? pickedType?.typeCode
    if (!code) return undefined
    return types.find((t) => t.typeCode === code) ?? (pickedType ?? undefined)
  }, [types, existing, pickedType])

  const [state, setState] = useState<FormState | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Inițializare state când modalul se deschide.
  useEffect(() => {
    if (!isOpen) return
    if (existing) {
      let parsedStructured: Record<string, unknown> = {}
      if (existing.structuredData) {
        try { parsedStructured = JSON.parse(existing.structuredData) } catch { /* ignore */ }
      }
      setState({
        investigationType: existing.investigationType,
        investigationTypeDisplayName: existing.investigationTypeDisplayName,
        uiPattern: existing.uiPattern,
        hasStructuredFields: typeMeta?.hasStructuredFields ?? existing.hasStructuredData,
        defaultStructuredEntry: typeMeta?.defaultStructuredEntry ?? existing.hasStructuredData,
        investigationDate: existing.investigationDate.slice(0, 10),
        status: existing.status,
        isExternal: existing.isExternal,
        externalSource: existing.externalSource ?? '',
        narrative: existing.narrative ?? '',
        structured: parsedStructured,
        structuredMode: existing.hasStructuredData,
        attachedDocumentId: existing.attachedDocumentId,
        attachedDocumentName: existing.attachedDocumentName,
      })
    } else if (pickedType) {
      setState({
        investigationType: pickedType.typeCode,
        investigationTypeDisplayName: pickedType.displayName,
        uiPattern: pickedType.uiPattern,
        hasStructuredFields: pickedType.hasStructuredFields,
        defaultStructuredEntry: pickedType.defaultStructuredEntry,
        investigationDate: todayISO(),
        status: 2,
        isExternal: false,
        externalSource: '',
        narrative: '',
        structured: {},
        structuredMode: pickedType.defaultStructuredEntry,
        attachedDocumentId: null,
        attachedDocumentName: null,
      })
    }
    setError(null)
  }, [isOpen, existing, pickedType, typeMeta])

  if (!isOpen || !state) return null

  const update = (patch: Partial<FormState>) => setState((s) => (s ? { ...s, ...patch } : s))

  const handleAttachment = (doc: DocumentDto | null) => {
    update({
      attachedDocumentId: doc?.id ?? null,
      attachedDocumentName: doc?.fileName ?? null,
    })
  }

  const renderUIPattern = () => {
    // Pentru tipuri Structured cu hasStructuredFields=true, permitem toggle Structured/Narrative.
    const showStructured =
      state.uiPattern === 'Structured' && state.hasStructuredFields && state.structuredMode
    const showQuestionnaire = state.uiPattern === 'Questionnaire'
    const showNarrativeOnly = state.uiPattern === 'Narrative' || state.uiPattern === 'LabTable'
    const showNarrativeForStructured =
      state.uiPattern === 'Structured' && state.hasStructuredFields && !state.structuredMode

    if (showQuestionnaire) {
      const q = QUESTIONNAIRE_SCHEMAS[state.investigationType]
      if (!q) return <div className={styles.errorBanner}>Schemă chestionar lipsă pentru {state.investigationType}.</div>
      return (
        <QuestionnaireRenderer
          schema={q}
          value={state.structured}
          onChange={(next) => update({ structured: next })}
          disabled={disabled}
        />
      )
    }

    if (showStructured) {
      const sch = STRUCTURED_SCHEMAS[state.investigationType]
      if (!sch) {
        return (
          <div className={styles.errorBanner}>
            Schemă structurată indisponibilă pentru {state.investigationType}. Folosiți modul narativ.
          </div>
        )
      }
      return (
        <StructuredFormRenderer
          schema={sch}
          value={state.structured}
          onChange={(next) => update({ structured: next })}
          disabled={disabled}
        />
      )
    }

    if (showNarrativeOnly || showNarrativeForStructured) {
      return (
        <div className={styles.narrative}>
          <textarea
            value={state.narrative}
            onChange={(e) => update({ narrative: e.target.value })}
            disabled={disabled}
            placeholder="Descriere, interpretare, concluzie..."
          />
          <DocumentUpload
            attachedDocumentId={state.attachedDocumentId}
            attachedDocumentName={state.attachedDocumentName}
            onUploaded={handleAttachment}
            disabled={disabled}
          />
        </div>
      )
    }

    return null
  }

  const handleSave = async () => {
    setError(null)
    try {
      const isStructuredEntry =
        state.uiPattern === 'Structured' && state.hasStructuredFields && state.structuredMode
      const isQuestionnaire = state.uiPattern === 'Questionnaire'
      const hasStructured = isStructuredEntry || isQuestionnaire
      const payloadStructured = hasStructured && Object.keys(state.structured).length > 0
        ? JSON.stringify(state.structured)
        : null

      if (existing) {
        const payload: UpdateInvestigationPayload = {
          id: existing.id,
          investigationType: state.investigationType,
          investigationDate: state.investigationDate,
          structuredData: payloadStructured,
          narrative: hasStructured ? null : (state.narrative || null),
          isExternal: state.isExternal,
          externalSource: state.externalSource || null,
          status: state.status,
          attachedDocumentId: state.attachedDocumentId,
          hasStructuredData: hasStructured,
        }
        await updateMut.mutateAsync(payload)
      } else {
        const payload: CreateInvestigationPayload = {
          consultationId,
          patientId,
          doctorId,
          investigationType: state.investigationType,
          investigationDate: state.investigationDate,
          structuredData: payloadStructured,
          narrative: hasStructured ? null : (state.narrative || null),
          isExternal: state.isExternal,
          externalSource: state.externalSource || null,
          status: state.status,
          attachedDocumentId: state.attachedDocumentId,
          hasStructuredData: hasStructured,
        }
        await createMut.mutateAsync(payload)
      }
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Eroare la salvare.'
      setError(msg)
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${existing ? 'Editează' : 'Adaugă'} — ${state.investigationTypeDisplayName}`}
      maxWidth={960}
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={isSaving}>Anulează</AppButton>
          <AppButton variant="primary" onClick={handleSave} isLoading={isSaving} disabled={disabled}>
            Salvează
          </AppButton>
        </>
      }
    >
      <div className={styles.formBody}>
        <div className={styles.commonFields}>
          <label>
            Data
            <input
              type="date"
              value={state.investigationDate}
              onChange={(e) => update({ investigationDate: e.target.value })}
              disabled={disabled}
            />
          </label>
          <label>
            Status
            <select
              value={state.status}
              onChange={(e) => update({ status: Number(e.target.value) as InvestigationStatus })}
              disabled={disabled}
            >
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label className={styles.inline}>
            <input
              type="checkbox"
              checked={state.isExternal}
              onChange={(e) => update({ isExternal: e.target.checked })}
              disabled={disabled}
            />
            Investigație externă
          </label>
          {state.isExternal && (
            <label style={{ gridColumn: '1 / -1' }}>
              Sursă (instituție externă)
              <input
                type="text"
                value={state.externalSource}
                onChange={(e) => update({ externalSource: e.target.value })}
                disabled={disabled}
                placeholder="ex. Spital Județean X"
              />
            </label>
          )}
        </div>

        {/* Toggle Structured ↔ Narrative pentru tipuri cu HasStructuredFields */}
        {state.uiPattern === 'Structured' && state.hasStructuredFields && (
          <div className={styles.toggle}>
            <button
              type="button"
              className={state.structuredMode ? styles.active : undefined}
              onClick={() => update({ structuredMode: true })}
              disabled={disabled}
            >Date structurate</button>
            <button
              type="button"
              className={!state.structuredMode ? styles.active : undefined}
              onClick={() => update({ structuredMode: false })}
              disabled={disabled}
            >Text liber + atașament</button>
          </div>
        )}

        {renderUIPattern()}

        {error && <div className={styles.errorBanner}>{error}</div>}
      </div>
    </AppModal>
  )
}

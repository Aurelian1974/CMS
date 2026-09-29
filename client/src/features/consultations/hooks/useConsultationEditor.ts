import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { consultationsApi } from '@/api/endpoints/consultations.api'
import { consultationSchema, type ConsultationFormData } from '../schemas/consultation.schema'
import { ANAMNESIS_FIELDS, EXAM_FIELDS, EMPTY_CONSULTATION_FORM, detailToFormValues } from '../constants/consultationDefaults'
import {
  EMPTY_DIAGNOSIS, parseDiagnosisState, buildConsultationPayload, buildAnamnesisPayload, buildExamPayload,
  type DiagnosisState,
} from '../utils/consultationPayload'
import type { ConsultationDetailDto } from '../types/consultation.types'
import { consultationKeys, useCreateConsultation, useFinalizeConsultation, useUpdateConsultation } from './useConsultations'
import { useConsultationAutosave } from './useConsultationAutosave'
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard'

const AUTOSAVE_DELAY_MS = 30_000
export const MISSING_PRIMARY_DIAGNOSIS = 'Diagnosticul principal este obligatoriu la finalizare.'

const FIELD_LABELS: Partial<Record<keyof ConsultationFormData, string>> = {
  patientId: 'Pacient', doctorId: 'Medic', date: 'Data consultației',
  greutate: 'Greutate', inaltime: 'Înălțime', tensiuneSistolica: 'Tensiune sistolică',
  tensiuneDiastolica: 'Tensiune diastolică', puls: 'Frecvență cardiacă',
  frecventaRespiratorie: 'Frecvență respiratorie', temperatura: 'Temperatură', spO2: 'SpO₂', glicemie: 'Glicemie',
}

export type FinalizeCheck = 'ok' | 'missing-diagnosis' | 'invalid'

interface UseConsultationEditorOptions {
  selectedId: string | null
  detail: ConsultationDetailDto | null
  isCreating: boolean
  /** Apelat după POST-ul reușit, cu id-ul consultației nou create */
  onCreated: (id: string) => void
}

/**
 * Starea editabilă a fișei de consultație: formular + selector ICD-10, urmărirea
 * modificărilor nesalvate, salvare automată și coada de scrieri către server.
 * Toate scrierile (tab, ciornă, autosave, finalizare) sunt serializate: două
 * scrieri pe același agregat nu rulează niciodată în paralel.
 */
export const useConsultationEditor = ({ selectedId, detail, isCreating, onCreated }: UseConsultationEditorOptions) => {
  const qc = useQueryClient()
  const createConsultation = useCreateConsultation()
  const updateConsultation = useUpdateConsultation()
  const finalizeConsultation = useFinalizeConsultation()

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: EMPTY_CONSULTATION_FORM,
  })

  const [diagnosis, setDiagnosis] = useState<DiagnosisState>(EMPTY_DIAGNOSIS)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Serverul acceptă modificări clinice doar pe INLUCRU (Consultation_Update / Upsert* → 50021)
  const isEditable = isCreating || !detail || detail.statusCode?.toUpperCase() === 'INLUCRU'

  useEffect(() => {
    if (!successMsg) return
    const timer = setTimeout(() => setSuccessMsg(null), 4000)
    return () => clearTimeout(timer)
  }, [successMsg])

  // Callback-urile async citesc starea curentă, nu pe cea de la ultimul render
  const isEditableRef = useRef(isEditable)
  isEditableRef.current = isEditable
  const isCreatingRef = useRef(isCreating)
  isCreatingRef.current = isCreating
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId
  const diagnosisRef = useRef(diagnosis)
  diagnosisRef.current = diagnosis
  const onCreatedRef = useRef(onCreated)
  onCreatedRef.current = onCreated

  // ── Modificări nesalvate ────────────────────────────────────────────────────
  // Versiune per câmp: o salvare curăță doar câmpurile nemodificate de la începutul
  // ei, deci ce tastează utilizatorul în timpul request-ului rămâne marcat nesalvat.
  const dirtyVersionsRef = useRef(new Map<string, number>())
  const dirtyCounterRef = useRef(0)

  const autosave = useConsultationAutosave(() => { void runAutosave() }, isEditable && !!selectedId && !isCreating, AUTOSAVE_DELAY_MS)
  const { schedule: scheduleAutosave, cancel: cancelAutosave } = autosave

  const markDirty = useCallback((field: string) => {
    dirtyVersionsRef.current.set(field, ++dirtyCounterRef.current)
    setIsDirty(true)
    scheduleAutosave()
  }, [scheduleAutosave])

  const clearDirty = useCallback((snapshot?: Map<string, number>) => {
    const versions = dirtyVersionsRef.current
    if (!snapshot) versions.clear()
    else snapshot.forEach((version, field) => { if (versions.get(field) === version) versions.delete(field) })
    setIsDirty(versions.size > 0)
    if (versions.size === 0) cancelAutosave()
  }, [cancelAutosave])

  const hasUnsaved = useCallback(() => isEditableRef.current && dirtyVersionsRef.current.size > 0, [])

  useEffect(() => {
    // `reset` nu are `name` → nu marchează formularul ca modificat
    const sub = form.watch((_values, { name }) => { if (name) markDirty(name) })
    return () => sub.unsubscribe()
  }, [form, markDirty])

  const updateDiagnosis = useCallback((patch: Partial<DiagnosisState>) => {
    setDiagnosis(prev => ({ ...prev, ...patch }))
    markDirty('diagnostic')
  }, [markDirty])

  const resetEditor = useCallback((values: ConsultationFormData, diag: DiagnosisState) => {
    form.reset(values)
    setDiagnosis(diag)
    clearDirty()
    setLastSavedAt(null)
  }, [form, clearDirty])

  // Refetch-urile după salvări nu trebuie să suprascrie ce tastează utilizatorul:
  // formularul se inițializează din server o singură dată per consultație.
  const syncedDetailIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (isCreating) {
      syncedDetailIdRef.current = null
      return
    }
    if (detail && syncedDetailIdRef.current !== detail.id) {
      syncedDetailIdRef.current = detail.id
      resetEditor(detailToFormValues(detail), parseDiagnosisState(detail))
    }
  }, [detail, isCreating, resetEditor])

  // ── Salvare ─────────────────────────────────────────────────────────────────
  const saveChainRef = useRef<Promise<unknown>>(Promise.resolve())
  const serialize = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const run = saveChainRef.current.then(fn, fn)
    saveChainRef.current = run.catch(() => undefined)
    return run
  }, [])

  const validationMessage = (fields: readonly (keyof ConsultationFormData)[]) => {
    const errors = form.formState.errors
    const parts = fields
      .filter(f => errors[f]?.message)
      .map(f => `${FIELD_LABELS[f] ?? f}: ${errors[f]?.message}`)
    return parts.length > 0
      ? `Verificați câmpurile: ${parts.join('; ')}`
      : 'Verificați câmpurile obligatorii.'
  }

  const onSaved = (message?: string) => {
    setServerError(null)
    setLastSavedAt(new Date())
    if (message) setSuccessMsg(message)
  }

  const onError = (err: unknown, fallback: string) => {
    setServerError(err instanceof Error ? err.message : fallback)
    return false
  }

  /** Salvare completă: POST în modul creare, altfel anamneză → examen → header. */
  const persistAll = async (successMessage?: string): Promise<boolean> => {
    const creating = isCreatingRef.current
    const requiredFields = creating ? (['patientId', 'doctorId', 'date'] as const) : ([] as const)
    const checked = [...requiredFields, ...EXAM_FIELDS] as (keyof ConsultationFormData)[]
    if (!(await form.trigger(checked))) {
      setServerError(validationMessage(checked))
      return false
    }

    const snapshot = new Map(dirtyVersionsRef.current)
    const payload = buildConsultationPayload(form.getValues(), diagnosisRef.current)
    try {
      if (creating) {
        const resp = await createConsultation.mutateAsync(payload)
        clearDirty(snapshot)
        const newId = resp?.data
        if (newId) {
          // Formularul conține deja datele salvate: nu-l reinițializa din server
          syncedDetailIdRef.current = newId
          onCreatedRef.current(newId)
        }
      } else {
        const id = selectedIdRef.current
        if (!id) return false
        await updateConsultation.mutateAsync({ id, ...payload })
        clearDirty(snapshot)
      }
      onSaved(successMessage)
      return true
    } catch (err: unknown) {
      return onError(err, 'Eroare la salvare.')
    }
  }

  /**
   * Salvează doar ce e modificat: dacă toate câmpurile modificate țin de anamneză
   * sau de examen, folosește endpoint-ul dedicat; altfel salvarea completă.
   */
  const persistDirty = async (): Promise<boolean> => {
    if (!hasUnsaved()) return true
    const id = selectedIdRef.current
    if (isCreatingRef.current || !id) return persistAll()

    const dirty = [...dirtyVersionsRef.current.keys()]
    const onlyIn = (fields: readonly string[]) => dirty.every(f => fields.includes(f))
    const snapshot = new Map(dirtyVersionsRef.current)
    try {
      if (onlyIn(ANAMNESIS_FIELDS)) {
        await consultationsApi.updateAnamnesis(id, buildAnamnesisPayload(form.getValues()))
      } else if (onlyIn(EXAM_FIELDS)) {
        if (!(await form.trigger([...EXAM_FIELDS]))) {
          setServerError(validationMessage(EXAM_FIELDS))
          return false
        }
        await consultationsApi.updateExam(id, buildExamPayload(form.getValues()))
      } else {
        return persistAll()
      }
      clearDirty(snapshot)
      qc.invalidateQueries({ queryKey: consultationKeys.detail(id) })
      onSaved()
      return true
    } catch (err: unknown) {
      return onError(err, 'Eroare la salvare automată.')
    }
  }

  const flushSave = () => serialize(persistDirty)

  const runAutosave = async () => {
    if (!hasUnsaved() || isCreatingRef.current) return
    await flushSave()
  }

  const saveDraft = () => serialize(() => persistAll(
    isCreatingRef.current ? 'Consultație creată cu succes.' : 'Consultație salvată cu succes.',
  ))

  /** Verificări client înainte de dialogul de confirmare; serverul le reface la finalizare. */
  const checkFinalize = async (): Promise<FinalizeCheck> => {
    if (!diagnosisRef.current.primaryCode) {
      setServerError(MISSING_PRIMARY_DIAGNOSIS)
      return 'missing-diagnosis'
    }
    if (!(await form.trigger())) {
      setServerError(validationMessage(Object.keys(form.formState.errors) as (keyof ConsultationFormData)[]))
      return 'invalid'
    }
    return 'ok'
  }

  /** Salvează tot, apoi tranziția INLUCRU → FINALIZATA, în aceeași coadă de scrieri. */
  const finalize = async (id: string): Promise<boolean> => {
    try {
      const done = await serialize(async () => {
        if (!(await persistAll())) return false
        await finalizeConsultation.mutateAsync(id)
        return true
      })
      if (done) setSuccessMsg('Consultație finalizată cu succes.')
      return done
    } catch (err: unknown) {
      return onError(err, 'Eroare la finalizare.')
    }
  }

  const leaveGuard = useUnsavedChangesGuard(hasUnsaved, isDirty && isEditable, flushSave)

  return {
    form,
    diagnosis,
    updateDiagnosis,
    isEditable,
    isDirty,
    lastSavedAt,
    isSaving: createConsultation.isPending || updateConsultation.isPending,
    serverError,
    setServerError,
    successMsg,
    setSuccessMsg,
    resetEditor,
    clearDirty,
    flushSave,
    saveDraft,
    checkFinalize,
    finalize,
    leaveGuard,
  }
}

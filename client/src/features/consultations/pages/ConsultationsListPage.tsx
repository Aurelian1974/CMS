import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ConsultationListDto, ConsultationDetailDto } from '../types/consultation.types'
import { useConsultationDetail, useDeleteConsultation, useCreateConsultation, useUpdateConsultation, useFinalizeConsultation, consultationKeys } from '../hooks/useConsultations'
import { useConsultationAutosave } from '../hooks/useConsultationAutosave'
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard'
import { consultationsApi } from '@/api/endpoints/consultations.api'
import type { AppointmentDto } from '@/features/appointments/types/appointment.types'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { usePatientLookup, usePatientDetail } from '@/features/patients/hooks/usePatients'
import { useAuthStore } from '@/store/authStore'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormSelect } from '@/components/forms/FormSelect/FormSelect'
import { FormDatePicker } from '@/components/forms/FormDatePicker/FormDatePicker'
import { formatDate } from '@/utils/format'
import { consultationSchema, type ConsultationFormData } from '../schemas/consultation.schema'
import { ANAMNESIS_FIELDS, EXAM_FIELDS, EMPTY_CONSULTATION_FORM, detailToFormValues } from '../constants/consultationDefaults'
import {
  EMPTY_DIAGNOSIS, parseDiagnosisState, buildConsultationPayload, buildAnamnesisPayload, buildExamPayload,
  type DiagnosisState,
} from '../utils/consultationPayload'
import { useQueryClient } from '@tanstack/react-query'
import { InvestigationsStep } from '../investigations/InvestigationsStep'
import { AnalizeMedicaleStep } from '../lab/AnalizeMedicaleStep'
import { AnamnezaTab, ExamenClinicTab, DiagnosticTab, ConcluziiTab } from '../components/ConsultationTabs'
import { ConsultationsSidebar } from '../components/ConsultationsSidebar'
import { getConsultationStatusVariant } from '../utils/consultationDisplay'
import {
  MessageSquareText, Stethoscope, Microscope, FlaskConical, ClipboardList, CheckCircle2,
  Lock, User, Cake, Phone, Mail, Calendar, MapPin, Receipt,
} from 'lucide-react'
import { ConsultationServicesTab } from '../services/ConsultationServicesTab'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { ScrisoareMedicalaModal } from '../components/ScrisoareMedicalaModal/ScrisoareMedicalaModal'
import styles from './ConsultationsListPage.module.scss'

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IconLetter  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const IconPrint   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
const IconTrash   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
const IconEmpty   = () => <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
const IconSave    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const IconCheck   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>

// ── Helpers ───────────────────────────────────────────────────────────────────


const AUTOSAVE_DELAY_MS = 30_000
const MISSING_PRIMARY_DIAGNOSIS = 'Diagnosticul principal este obligatoriu la finalizare.'

const FIELD_LABELS: Partial<Record<keyof ConsultationFormData, string>> = {
  patientId: 'Pacient', doctorId: 'Medic', date: 'Data consultației',
  greutate: 'Greutate', inaltime: 'Înălțime', tensiuneSistolica: 'Tensiune sistolică',
  tensiuneDiastolica: 'Tensiune diastolică', puls: 'Frecvență cardiacă',
  frecventaRespiratorie: 'Frecvență respiratorie', temperatura: 'Temperatură', spO2: 'SpO₂', glicemie: 'Glicemie',
}

const formatSavedAt = (d: Date) => d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })

type Tab = 'anamneza' | 'examen' | 'investigatii' | 'analize' | 'diagnostic' | 'concluzii' | 'servicii'

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  anamneza:     <MessageSquareText size={16} />,
  examen:       <Stethoscope size={16} />,
  investigatii: <Microscope size={16} />,
  analize:      <FlaskConical size={16} />,
  diagnostic:   <ClipboardList size={16} />,
  concluzii:    <CheckCircle2 size={16} />,
  servicii:     <Receipt size={16} />,
}

const TABS: { key: Tab; label: string; num: number }[] = [
  { key: 'anamneza',     label: 'Anamneză',              num: 1 },
  { key: 'examen',       label: 'Examen Clinic',         num: 2 },
  { key: 'investigatii', label: 'Investigații',           num: 3 },
  { key: 'analize',      label: 'Analize Medicale',      num: 4 },
  { key: 'diagnostic',   label: 'Diagnostic & Tratament', num: 5 },
  { key: 'concluzii',    label: 'Concluzii',             num: 6 },
  { key: 'servicii',     label: 'Servicii',              num: 7 },
]

function getTodayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Check if a tab has content based on detail data */
function tabHasContent(tab: Tab, detail: ConsultationDetailDto | null): boolean {
  if (!detail) return false
  switch (tab) {
    case 'anamneza':     return !!detail.motiv || !!detail.istoricMedicalPersonal || !!detail.istoricBoalaActuala
    case 'examen':       return !!detail.examenClinic || !!detail.stareGenerala || !!detail.puls
    case 'investigatii': return !!detail.investigatii
    case 'analize':      return !!detail.analizeMedicale
    case 'diagnostic':   return !!detail.diagnostic || !!detail.diagnosticCodes || !!detail.recomandari
    case 'concluzii':    return !!detail.concluzii || detail.esteAfectiuneOncologica || detail.saEliberatPrescriptie
    default:             return false
  }
}

/** Compute age from birth date */
function computeAge(birthDateStr: string | null): number | null {
  if (!birthDateStr) return null
  const birth = new Date(birthDateStr)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// ── Main Component ────────────────────────────────────────────────────────────
export const ConsultationsListPage = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  // Consultația selectată trăiește în URL: deep-link, back/forward, refresh fără pierdere de context
  const { id: routeId } = useParams<{ id?: string }>()
  const selectedId = routeId ?? null
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.role === 'admin' || user?.role === 'clinic_manager'

  // ── Appointment sidebar state ───────────────────────────────────────────────
  const [appointmentDoctorFilter, setAppointmentDoctorFilter] = useState<string | undefined>(undefined)
  const todayISO = useMemo(() => getTodayISO(), [])

  // For doctor users, auto-set the doctorId filter
  const effectiveDoctorId = isAdmin ? appointmentDoctorFilter : (user?.doctorId ?? undefined)

  // ── Detail state ────────────────────────────────────────────────────────────
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('anamneza')
  const [diagnosis, setDiagnosis] = useState<DiagnosisState>(EMPTY_DIAGNOSIS)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; patientName: string; date: string } | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [showScrisoareMedicala, setShowScrisoareMedicala] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (!successMsg) return
    const timer = setTimeout(() => setSuccessMsg(null), 4000)
    return () => clearTimeout(timer)
  }, [successMsg])

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: detailResp, isLoading: isDetailLoading } = useConsultationDetail(selectedId ?? '', !!selectedId && !isCreating)
  const detail: ConsultationDetailDto | null = detailResp?.data ?? null

  // Fetch patient details when an appointment is selected (for create-mode card)
  const { data: selectedPatientResp } = usePatientDetail(
    selectedAppointment?.patientId ?? '',
    !!selectedAppointment?.patientId && isCreating,
  )
  const selectedPatient = selectedPatientResp?.data?.patient ?? null

  const { data: doctorLookupResp } = useDoctorLookup()
  const { data: patientLookupResp } = usePatientLookup()

  const createConsultation = useCreateConsultation()
  const updateConsultation = useUpdateConsultation()
  const finalizeConsultation = useFinalizeConsultation()
  const deleteConsultation = useDeleteConsultation()

  const doctorLookup  = useMemo(() => (doctorLookupResp?.data ?? []).map(d => ({ value: d.id, label: d.fullName })), [doctorLookupResp])
  const patientLookup = useMemo(() => (patientLookupResp?.data ?? []).map(p => ({ value: p.id, label: `${p.fullName} (${p.cnp})` })), [patientLookupResp])

  // ── Form ────────────────────────────────────────────────────────────────────
  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: EMPTY_CONSULTATION_FORM,
  })

  const statusCode  = detail?.statusCode?.toUpperCase()
  const isLocked    = statusCode === 'BLOCATA'
  const isBilled    = statusCode === 'FACTURATA'
  const isFinalized = statusCode === 'FINALIZATA'
  // Serverul acceptă modificări clinice doar pe INLUCRU (Consultation_Update / Upsert* → 50021)
  const isEditable = isCreating || !detail || statusCode === 'INLUCRU'
  const { canWrite } = useHasAccess()

  // Refetch-urile după salvările la schimbarea tab-ului nu trebuie să suprascrie ce tastează
  // utilizatorul între timp: formularul se inițializează din server o singură dată per consultație.
  const syncedDetailIdRef = useRef<string | null>(null)

  // ── Urmărire modificări nesalvate ───────────────────────────────────────────
  // Versiune per câmp: o salvare curăță doar câmpurile nemodificate de la începutul
  // ei, deci ce tastează utilizatorul în timpul request-ului rămâne marcat nesalvat.
  const dirtyVersionsRef = useRef(new Map<string, number>())
  const dirtyCounterRef = useRef(0)
  const [isDirty, setIsDirty] = useState(false)
  const isEditableRef = useRef(isEditable)
  isEditableRef.current = isEditable
  const isCreatingRef = useRef(isCreating)
  isCreatingRef.current = isCreating
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId
  const diagnosisRef = useRef(diagnosis)
  diagnosisRef.current = diagnosis

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

  // Navigare prin istoric (back/forward) către o consultație existentă
  useEffect(() => {
    if (routeId) setIsCreating(false)
  }, [routeId])

  // ── Salvare ─────────────────────────────────────────────────────────────────
  // Toate scrierile (tab, ciornă, autosave, finalizare) trec printr-o coadă: două
  // scrieri pe același agregat nu rulează niciodată în paralel.
  const saveChainRef = useRef<Promise<unknown>>(Promise.resolve())
  const serialize = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    const run = saveChainRef.current.then(fn, fn)
    saveChainRef.current = run.catch(() => undefined)
    return run
  }, [])

  /** Rezumat lizibil al erorilor de validare pentru câmpurile date. */
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

  const onSaveError = (err: unknown, fallback: string) => {
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
        const newId = resp?.data
        clearDirty(snapshot)
        setIsCreating(false)
        if (newId) {
          // Formularul conține deja datele salvate: nu-l reinițializa din server
          syncedDetailIdRef.current = newId
          navigate(`/consultations/${newId}`, { replace: true })
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
      return onSaveError(err, 'Eroare la salvare.')
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
      return onSaveError(err, 'Eroare la salvare automată.')
    }
  }

  const flushSave = () => serialize(persistDirty)

  const runAutosave = async () => {
    if (!hasUnsaved() || isCreatingRef.current) return
    await flushSave()
  }

  const { confirmLeave, stay, leave } = useUnsavedChangesGuard(hasUnsaved, isDirty && isEditable, flushSave)

  /** Rulează o schimbare de context (altă consultație / programare) doar după salvare reușită. */
  const afterFlush = async (action: () => void | Promise<void>) => {
    if (!(await flushSave())) return
    await action()
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelectHistoryConsultation = (consultation: ConsultationListDto) => afterFlush(() => {
    setIsCreating(false)
    setSelectedAppointment(null)
    setServerError(null)
    setActiveTab('anamneza')
    navigate(`/consultations/${consultation.id}`)
  })

  const handleSelectAppointment = (appointment: AppointmentDto) => afterFlush(async () => {
    setSelectedAppointment(appointment)
    setServerError(null)
    setActiveTab('anamneza')

    // Check if a consultation already exists for this appointment
    try {
      const resp = await consultationsApi.getByAppointmentId(appointment.id)
      const existing = resp?.data ?? null
      if (existing) {
        setIsCreating(false)
        navigate(`/consultations/${existing.id}`)
        return
      }
    } catch {
      // If the check fails, fall through to create mode
    }

    // No existing consultation — start creating a new one pre-filled with appointment data
    navigate('/consultations')
    setIsCreating(true)
    resetEditor({
      ...EMPTY_CONSULTATION_FORM,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: todayISO,
      appointmentId: appointment.id,
    }, EMPTY_DIAGNOSIS)
  })

  const handleNewConsultation = () => afterFlush(() => {
    navigate('/consultations')
    setIsCreating(true)
    setServerError(null)
    setSelectedAppointment(null)
    resetEditor(EMPTY_CONSULTATION_FORM, EMPTY_DIAGNOSIS)
    setActiveTab('anamneza')
  })

  const handleCancelCreate = () => {
    setIsCreating(false)
    setServerError(null)
    clearDirty()
  }

  const handleSaveDraft = () => serialize(() => persistAll(
    isCreatingRef.current ? 'Consultație creată cu succes.' : 'Consultație salvată cu succes.',
  ))

  /** Un eșec de salvare pe fișa medicală blochează schimbarea tabului. */
  const handleTabChange = async (newTab: Tab) => {
    if (newTab === activeTab) return
    if (isEditable && !(await flushSave())) return
    setActiveTab(newTab)
  }

  const requestFinalize = async () => {
    if (!selectedId) return
    if (!diagnosis.primaryCode) {
      setServerError(MISSING_PRIMARY_DIAGNOSIS)
      if (activeTab !== 'diagnostic') await handleTabChange('diagnostic')
      return
    }
    if (!(await form.trigger())) {
      setServerError(validationMessage(Object.keys(form.formState.errors) as (keyof ConsultationFormData)[]))
      return
    }
    setShowFinalizeConfirm(true)
  }

  const handleFinalize = async () => {
    const id = selectedId
    if (!id) return
    setIsFinalizing(true)
    try {
      const done = await serialize(async () => {
        if (!(await persistAll())) return false
        await finalizeConsultation.mutateAsync(id)
        return true
      })
      if (done) setSuccessMsg('Consultație finalizată cu succes.')
    } catch (err: unknown) {
      onSaveError(err, 'Eroare la finalizare.')
    } finally {
      setIsFinalizing(false)
      setShowFinalizeConfirm(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteConsultation.mutateAsync(deleteTarget.id)
      if (selectedId === deleteTarget.id) {
        clearDirty()
        setIsCreating(false)
        navigate('/consultations', { replace: true })
      }
      setSuccessMsg('Consultație ștearsă cu succes.')
    } catch (err: unknown) {
      onSaveError(err, 'Eroare la ștergere.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const showDetail = isCreating || !!selectedId

  return (
    <div className={styles.page}>
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <ConsultationsSidebar
        isAdmin={isAdmin}
        todayISO={todayISO}
        doctors={doctorLookupResp?.data ?? []}
        doctorFilter={appointmentDoctorFilter}
        onDoctorFilterChange={setAppointmentDoctorFilter}
        effectiveDoctorId={effectiveDoctorId}
        activeAppointmentId={selectedAppointment?.id ?? null}
        activeConsultationId={isCreating ? null : selectedId}
        onNew={handleNewConsultation}
        onSelectAppointment={handleSelectAppointment}
        onSelectConsultation={handleSelectHistoryConsultation}
      />

      {/* ── Detail panel ─────────────────────────────────────────────────────── */}
      <main className={styles.detail}>
        {!showDetail && (
          <div className={styles.emptyState}>
            <IconEmpty />
            <h3>Nicio consultație selectată</h3>
            <p>Selectați o consultație din lista din stânga sau creați una nouă.</p>
          </div>
        )}

        {showDetail && (
          <>
            {/* Success / Error alerts */}
            <div aria-live="polite">
              {successMsg && <div className={styles.successAlert} role="status">✓ {successMsg}</div>}
              {serverError && <div className={styles.errorAlert} role="alert">✕ {serverError}</div>}
            </div>

            {/* Locked banner */}
            {isLocked && (
              <div className={styles.lockedBanner}><Lock size={14} /> Consultație blocată — doar citire</div>
            )}
            {isBilled && (
              <div className={styles.lockedBanner}><Lock size={14} /> Consultație facturată — doar citire. Corecțiile se fac prin stornarea documentului fiscal.</div>
            )}

            {/* Page header — matching Razor template */}
            {!isCreating && detail && (
              <header className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h2 className={styles.pageHeaderTitle}>
                    {isEditable ? 'Editare Consultație' : 'Consultație'}
                  </h2>
                  <p className={styles.pageHeaderSub}>{detail.patientName}</p>
                </div>
                <div className={styles.pageHeaderActions}>
                  <AppBadge variant={getConsultationStatusVariant(detail.statusCode)} withDot>
                    {detail.statusName}
                  </AppBadge>
                </div>
              </header>
            )}

            {isCreating && (
              <header className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h2 className={styles.pageHeaderTitle}>Consultație Nouă</h2>
                  <p className={styles.pageHeaderSub}>Completează fișa de consultație pentru pacient</p>
                </div>
              </header>
            )}

            {/* Patient card — view mode (Razor-style horizontal card) */}
            {!isCreating && detail && (
              <section className={styles.patientCard}>
                <div className={styles.patientAvatar}>
                  <User size={22} />
                </div>
                <div className={styles.patientDetails}>
                  <h3 className={styles.patientName}>{detail.patientName}</h3>
                  <div className={styles.patientMeta}>
                    <span className={styles.patientMetaItem}>
                      <span className={styles.metaIcon}><MapPin size={13} /></span>
                      CNP: {detail.patientCnp ?? '—'}
                    </span>
                    <span className={styles.patientMetaItem}>
                      <span className={styles.metaIcon}><Cake size={13} /></span>
                      {computeAge(detail.patientBirthDate) !== null ? `${computeAge(detail.patientBirthDate)} ani` : '—'}
                    </span>
                    <span className={styles.patientMetaItem}>
                      <span className={styles.metaIcon}><User size={13} /></span>
                      {detail.patientGender === 'M' ? 'Masculin' : detail.patientGender === 'F' ? 'Feminin' : '—'}
                    </span>
                    <span className={styles.patientMetaItem}>
                      <span className={styles.metaIcon}><Phone size={13} /></span>
                      {detail.patientPhone ?? '—'}
                    </span>
                    <span className={styles.patientMetaItem}>
                      <span className={styles.metaIcon}><Mail size={13} /></span>
                      {detail.patientEmail ?? '—'}
                    </span>
                    <span className={styles.patientMetaItem}>
                      <span className={styles.metaIcon}><Calendar size={13} /></span>
                      {formatDate(detail.date)}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Patient card — create mode (from appointment) */}
            {isCreating && selectedAppointment && (
              <section className={styles.patientCard}>
                <div className={styles.patientAvatar}>
                  <User size={22} />
                </div>
                <div className={styles.patientDetails}>
                  <h3 className={styles.patientName}>{selectedPatient?.fullName ?? selectedAppointment.patientName}</h3>
                  <div className={styles.patientMeta}>
                    <span className={styles.patientMetaItem}>
                      <span className={styles.metaIcon}><MapPin size={13} /></span>
                      CNP: {selectedPatient?.cnp ?? '—'}
                    </span>
                    <span className={styles.patientMetaItem}>
                      <span className={styles.metaIcon}><Cake size={13} /></span>
                      {selectedPatient?.age !== null && selectedPatient?.age !== undefined ? `${selectedPatient.age} ani` : '—'}
                    </span>
                    <span className={styles.patientMetaItem}>
                      <span className={styles.metaIcon}><User size={13} /></span>
                      {selectedPatient?.genderName ?? '—'}
                    </span>
                    <span className={styles.patientMetaItem}>
                      <span className={styles.metaIcon}><Calendar size={13} /></span>
                      {formatDate(todayISO)}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Patient data card — create mode (manual, no appointment) */}
            {isCreating && !selectedAppointment && (
              <section className={styles.patientCardCreate}>
                <div className={styles.patientCardCreateTitle}>
                  <User size={16} /> DATE PACIENT
                </div>
                <div className={styles.formGrid}>
                  <FormSelect
                    name="patientId"
                    control={form.control}
                    label="Pacient"
                    options={patientLookup}
                    required
                    disabled={!isEditable}
                    allowFiltering
                    placeholder="Selectați pacientul..."
                  />
                  <FormSelect
                    name="doctorId"
                    control={form.control}
                    label="Medic"
                    options={doctorLookup}
                    required
                    disabled={!isEditable}
                    allowFiltering
                    placeholder="Selectați medicul..."
                  />
                  <FormDatePicker
                    name="date"
                    control={form.control}
                    label="Data consultației"
                    required
                    disabled={!isEditable}
                    format="dd.MM.yyyy"
                    placeholder="Selectați data..."
                  />
                </div>
              </section>
            )}

            {/* Loading */}
            {isDetailLoading && !isCreating && (
              <div className={styles.detailLoading}>Se încarcă...</div>
            )}

            {/* Tab bar */}
            {(isCreating || detail) && (
              <>
                <div className={styles.tabBar} role="tablist" aria-label="Secțiuni consultație">
                  {TABS.map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      id={`consultation-tab-${tab.key}`}
                      aria-selected={activeTab === tab.key}
                      aria-controls="consultation-tabpanel"
                      className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''} ${tabHasContent(tab.key, detail) && !isCreating ? styles.tabCompleted : ''}`}
                      onClick={() => handleTabChange(tab.key)}
                    >
                      <span className={styles.tabIcon}>{TAB_ICONS[tab.key]}</span>
                      <span>{tab.label}</span>
                      <span className={styles.tabNumber}>{tab.num}</span>
                      {tabHasContent(tab.key, detail) && !isCreating && (
                        <span className={styles.tabCheck}><IconCheck /></span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div
                  className={styles.tabContent}
                  role="tabpanel"
                  id="consultation-tabpanel"
                  aria-labelledby={`consultation-tab-${activeTab}`}
                >

                  {activeTab === 'anamneza' && <AnamnezaTab control={form.control} isEditable={isEditable} />}
                  {activeTab === 'examen' && <ExamenClinicTab form={form} isEditable={isEditable} />}

                  {/* ── Investigații (modul nou — Faza 2) ── */}
                  {activeTab === 'investigatii' && (
                    <div className={styles.formSection}>
                      <h3 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><Microscope size={18} /></span>
                        Investigații Paraclinice
                      </h3>
                      {(selectedId || isCreating) && detail ? (
                        <InvestigationsStep
                          consultationId={selectedId ?? ''}
                          patientId={detail.patientId}
                          doctorId={detail.doctorId}
                          isEditable={isEditable && !!selectedId && !isCreating}
                        />
                      ) : isCreating ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                          Salvează consultația ca draft pentru a putea adăuga investigații.
                        </p>
                      ) : (
                        <p style={{ color: '#94a3b8' }}>Selectează o consultație.</p>
                      )}
                    </div>
                  )}

                  {/* ── Analize Medicale ── */}
                  {activeTab === 'analize' && (
                    <div className={styles.formSection}>
                      <h3 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><FlaskConical size={18} /></span>
                        Analize Medicale
                      </h3>
                      {(selectedId || isCreating) && detail ? (
                        <AnalizeMedicaleStep
                          consultationId={selectedId ?? ''}
                          patientId={detail.patientId}
                          doctorId={detail.doctorId}
                          isEditable={isEditable && !!selectedId && !isCreating}
                        />
                      ) : isCreating ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                          Salvează consultația ca draft pentru a putea adăuga analize medicale.
                        </p>
                      ) : (
                        <p style={{ color: '#94a3b8' }}>Selectează o consultație.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'diagnostic' && (
                    <DiagnosticTab
                      form={form}
                      isEditable={isEditable}
                      consultationId={isCreating ? null : selectedId}
                      diagnosis={diagnosis}
                      onDiagnosisChange={updateDiagnosis}
                    />
                  )}
                  {activeTab === 'concluzii' && <ConcluziiTab form={form} isEditable={isEditable} />}

                  {/* ── Servicii efectuate (baza bonului / facturii) ── */}
                  {activeTab === 'servicii' && (
                    <div className={styles.formSection}>
                      <h3 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><Receipt size={18} /></span>
                        Servicii efectuate
                      </h3>
                      {selectedId && detail && !isCreating ? (
                        <ConsultationServicesTab
                          consultationId={selectedId}
                          statusCode={detail.statusCode ?? null}
                          canWrite={canWrite(MODULE.Consultations)}
                          onError={setServerError}
                        />
                      ) : (
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                          Salvează consultația ca draft pentru a putea adăuga servicii.
                        </p>
                      )}
                    </div>
                  )}

                </div>

                {/* Footer — matching Razor consultation-footer */}
                <div className={styles.actionBar}>
                  {isCreating && (
                    <>
                      <div className={styles.footerInfo} />
                      <div className={styles.footerActions}>
                        <AppButton variant="outline-secondary" size="sm" onClick={handleCancelCreate}>Anulează</AppButton>
                        <AppButton
                          variant="primary"
                          size="sm"
                          onClick={handleSaveDraft}
                          isLoading={createConsultation.isPending}
                          loadingText="Se salvează..."
                          leftIcon={<IconSave />}
                        >
                          Salvează Ciornă
                        </AppButton>
                      </div>
                    </>
                  )}

                  {!isCreating && isEditable && (
                    <>
                      <div className={styles.footerInfo}>
                        <AppButton
                          variant="ghost"
                          size="sm"
                          onClick={() => detail && setDeleteTarget({ id: detail.id, patientName: detail.patientName, date: detail.date })}
                          leftIcon={<IconTrash />}
                        >
                          Șterge
                        </AppButton>
                        <span className={styles.saveStatus} aria-live="polite">
                          {isDirty ? 'Modificări nesalvate' : lastSavedAt ? `Salvat la ${formatSavedAt(lastSavedAt)}` : ''}
                        </span>
                      </div>
                      <div className={styles.footerActions}>
                        <AppButton
                          variant="outline-primary"
                          size="sm"
                          onClick={handleSaveDraft}
                          isLoading={updateConsultation.isPending}
                          loadingText="Se salvează..."
                          leftIcon={<IconSave />}
                        >
                          Salvează Ciornă
                        </AppButton>
                        <AppButton
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setShowScrisoareMedicala(true)}
                          leftIcon={<IconLetter />}
                        >
                          Scrisoare Medicală
                        </AppButton>
                        <AppButton
                          variant="primary"
                          size="sm"
                          onClick={requestFinalize}
                          leftIcon={<IconCheck />}
                        >
                          Finalizează Consultație
                        </AppButton>
                      </div>
                    </>
                  )}

                  {!isCreating && (isFinalized || isBilled) && (
                    <>
                      <div className={styles.footerInfo} />
                      <div className={styles.footerActions}>
                        <AppButton
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setShowScrisoareMedicala(true)}
                          leftIcon={<IconLetter />}
                        >
                          Scrisoare Medicală
                        </AppButton>
                        <AppButton variant="outline-primary" size="sm" leftIcon={<IconPrint />}>
                          Tipărește
                        </AppButton>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Finalize confirmation modal */}
      <ConfirmDialog
        isOpen={showFinalizeConfirm}
        title="Confirmare finalizare"
        message="Sigur doriți să finalizați această consultație? După finalizare, consultația nu va mai putea fi modificată."
        confirmLabel="Finalizează"
        onConfirm={handleFinalize}
        onCancel={() => setShowFinalizeConfirm(false)}
        isLoading={isFinalizing}
        loadingText="Se finalizează..."
      />

      {/* Scrisoare Medicală modal */}
      {showScrisoareMedicala && detail && (
        <ScrisoareMedicalaModal
          detail={detail}
          onClose={() => setShowScrisoareMedicala(false)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Confirmare ștergere"
        message={deleteTarget && (
          <>Sigur doriți să ștergeți consultația pacientului <strong>{deleteTarget.patientName}</strong> din {formatDate(deleteTarget.date)}?</>
        )}
        confirmLabel="Șterge"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteConsultation.isPending}
        loadingText="Se șterge..."
      />

      <ConfirmDialog
        isOpen={confirmLeave}
        title="Modificări nesalvate"
        message={<>Modificările nu au putut fi salvate{serverError ? `: ${serverError}` : '.'} Părăsiți pagina fără a le salva?</>}
        confirmLabel="Părăsește fără salvare"
        cancelLabel="Rămân pe pagină"
        confirmVariant="danger"
        onConfirm={leave}
        onCancel={stay}
      />
    </div>
  )
}

export default ConsultationsListPage

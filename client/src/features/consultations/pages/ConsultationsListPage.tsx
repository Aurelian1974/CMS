import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ConsultationListDto, ConsultationStatusFilter, ConsultationDetailDto, CreateConsultationPayload, UpdateConsultationPayload } from '../types/consultation.types'
import { useConsultations, useConsultationDetail, useDeleteConsultation, useCreateConsultation, useUpdateConsultation, consultationKeys } from '../hooks/useConsultations'
import { consultationsApi } from '@/api/endpoints/consultations.api'
import { useAppointments } from '@/features/appointments/hooks/useAppointments'
import type { AppointmentDto } from '@/features/appointments/types/appointment.types'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { usePatientLookup, usePatientDetail } from '@/features/patients/hooks/usePatients'
import { useAuthStore } from '@/store/authStore'
import { AppBadge, type BadgeVariant } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { FormInput } from '@/components/forms/FormInput/FormInput'
import { FormRichText } from '@/components/forms/FormRichText/FormRichText'
import { FormSelect } from '@/components/forms/FormSelect/FormSelect'
import { PrimaryDiagnosisSelector } from '@/components/icd10/PrimaryDiagnosisSelector'
import { SecondaryDiagnosesList } from '@/components/icd10/SecondaryDiagnosesList'
import type { SecondaryDiagnosis } from '@/components/icd10/SecondaryDiagnosesList'
import type { ICD10SearchResult } from '@/features/consultations/types/icd10.types'
import { FormDatePicker } from '@/components/forms/FormDatePicker/FormDatePicker'
import { formatDate } from '@/utils/format'
import { consultationSchema, type ConsultationFormData } from '../schemas/consultation.schema'
import { useQueryClient } from '@tanstack/react-query'
import { InvestigationsStep } from '../investigations/InvestigationsStep'
import { AnalizeMedicaleStep } from '../lab/AnalizeMedicaleStep'
import {
  MessageSquareText, Stethoscope, Microscope, FlaskConical, ClipboardList, CheckCircle2,
  FileText, ClipboardPlus, Pill, PenLine, FileCheck, CalendarClock,
  ShieldCheck, Hand, Eye, Scale, Ruler, Hash,
  Heart, HeartPulse, Wind, Thermometer, Activity, Droplets, Droplet, CircleDot,
  Ribbon, Hospital, ClipboardCheck, BedDouble, Home, Accessibility,
  NotebookPen, Users, AlertTriangle, ShieldAlert,
  Lock, User, Cake, Phone, Mail, Calendar, MapPin,
} from 'lucide-react'
import styles from './ConsultationsListPage.module.scss'

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IconPlus    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
const IconPrint   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
const IconTrash   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
const IconEmpty   = () => <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
const IconSave    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const IconCheck   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>

// ── Helpers ───────────────────────────────────────────────────────────────────
const getAppointmentStatusVariant = (code: string | null): BadgeVariant => {
  if (!code) return 'neutral'
  switch (code.toUpperCase()) {
    case 'PROGRAMAT':  return 'info'
    case 'CONFIRMAT':  return 'primary'
    case 'FINALIZAT':  return 'success'
    case 'ANULAT':     return 'danger'
    default:           return 'neutral'
  }
}

const CONSULTATION_STATUS_IDS: Record<Exclude<ConsultationStatusFilter, 'all'>, string> = {
  draft:     'c2000000-0000-0000-0000-000000000001',
  completed: 'c2000000-0000-0000-0000-000000000002',
  locked:    'c2000000-0000-0000-0000-000000000003',
}

type Tab = 'anamneza' | 'examen' | 'investigatii' | 'analize' | 'diagnostic' | 'concluzii'

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  anamneza:     <MessageSquareText size={16} />,
  examen:       <Stethoscope size={16} />,
  investigatii: <Microscope size={16} />,
  analize:      <FlaskConical size={16} />,
  diagnostic:   <ClipboardList size={16} />,
  concluzii:    <CheckCircle2 size={16} />,
}

const TABS: { key: Tab; label: string; num: number }[] = [
  { key: 'anamneza',     label: 'Anamneză',              num: 1 },
  { key: 'examen',       label: 'Examen Clinic',         num: 2 },
  { key: 'investigatii', label: 'Investigații',           num: 3 },
  { key: 'analize',      label: 'Analize Medicale',      num: 4 },
  { key: 'diagnostic',   label: 'Diagnostic & Tratament', num: 5 },
  { key: 'concluzii',    label: 'Concluzii',             num: 6 },
]

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`
}

function getTodayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDiagnosticTags(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return raw ? [raw] : [] }
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
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.role === 'admin' || user?.role === 'clinic_manager'

  // ── List state ──────────────────────────────────────────────────────────────
  const [search] = useState('')
  const [page] = useState(1)

  // ── Appointment sidebar state ───────────────────────────────────────────────
  const [appointmentDoctorFilter, setAppointmentDoctorFilter] = useState<string | undefined>(undefined)
  const todayISO = useMemo(() => getTodayISO(), [])

  // For doctor users, auto-set the doctorId filter
  const effectiveDoctorId = isAdmin ? appointmentDoctorFilter : (user?.doctorId ?? undefined)

  const { data: appointmentsResp, isError: isAppointmentsError } = useAppointments({
    page: 1, pageSize: 100, dateFrom: todayISO, dateTo: todayISO,
    doctorId: effectiveDoctorId,
    sortBy: 'startTime', sortDir: 'asc',
  })

  const todayAppointments = useMemo(() => appointmentsResp?.data?.pagedResult?.items ?? [], [appointmentsResp])
  const appointmentStats = appointmentsResp?.data?.stats

  // ── Detail state ────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('anamneza')
  const [diagnosticTags, setDiagnosticTags] = useState<string[]>([])
  const [primaryDiagCode, setPrimaryDiagCode] = useState<ICD10SearchResult | null>(null)
  const [primaryDiagDetails, setPrimaryDiagDetails] = useState('')
  const [secondaryDiagnoses, setSecondaryDiagnoses] = useState<SecondaryDiagnosis[]>([])
  const [deleteTarget, setDeleteTarget] = useState<ConsultationListDto | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null)

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: consultationsResp } = useConsultations({
    page, pageSize: 50, search: search || undefined,
    sortBy: 'date', sortDir: 'desc',
  })

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
  const deleteConsultation = useDeleteConsultation()

  const consultations = useMemo(() => consultationsResp?.data?.pagedResult?.items ?? [], [consultationsResp])

  const doctorLookup  = useMemo(() => (doctorLookupResp?.data ?? []).map(d => ({ value: d.id, label: d.fullName })), [doctorLookupResp])
  const patientLookup = useMemo(() => (patientLookupResp?.data ?? []).map(p => ({ value: p.id, label: `${p.fullName} (${p.cnp})` })), [patientLookupResp])

  // ── Form ────────────────────────────────────────────────────────────────────
  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      patientId: '', doctorId: '', date: '', appointmentId: '', statusId: '',
      motiv: '', istoricMedicalPersonal: '', tratamentAnterior: '', istoricBoalaActuala: '', istoricFamilial: '', factoriDeRisc: '', alergiiConsultatie: '',
      stareGenerala: '', tegumente: '', mucoase: '', greutate: null, inaltime: null,
      tensiuneSistolica: null, tensiuneDiastolica: null, puls: null, frecventaRespiratorie: null,
      temperatura: null, spO2: null, edeme: '', glicemie: null, ganglioniLimfatici: '', examenClinic: '', alteObservatiiClinice: '',
      investigatii: '', analizeMedicale: '',
      diagnostic: '', diagnosticCodes: '', recomandari: '', observatii: '',
      concluzii: '', esteAfectiuneOncologica: false, areIndicatieInternare: false,
      saEliberatPrescriptie: false, seriePrescriptie: '', saEliberatConcediuMedical: false, serieConcediuMedical: '',
      saEliberatIngrijiriDomiciliu: false, saEliberatDispozitiveMedicale: false,
      dataUrmatoareiVizite: '', noteUrmatoareaVizita: '',
    },
  })

  const isLocked   = detail?.statusCode?.toUpperCase() === 'BLOCATA'
  const isFinalized = detail?.statusCode?.toUpperCase() === 'FINALIZATA'
  const isEditable = isCreating || (!isLocked && !isFinalized)

  // Sync detail → form when selection changes
  useEffect(() => {
    if (detail && !isCreating) {
      form.reset({
        patientId:      detail.patientId,
        doctorId:       detail.doctorId,
        date:           detail.date ? detail.date.split('T')[0] : '',
        appointmentId:  detail.appointmentId ?? '',
        statusId:       detail.statusId ?? '',
        motiv:          detail.motiv ?? '',
        istoricMedicalPersonal: detail.istoricMedicalPersonal ?? '',
        tratamentAnterior:      detail.tratamentAnterior ?? '',
        istoricBoalaActuala:    detail.istoricBoalaActuala ?? '',
        istoricFamilial:        detail.istoricFamilial ?? '',
        factoriDeRisc:          detail.factoriDeRisc ?? '',
        alergiiConsultatie:     detail.alergiiConsultatie ?? '',
        stareGenerala:          detail.stareGenerala ?? '',
        tegumente:              detail.tegumente ?? '',
        mucoase:                detail.mucoase ?? '',
        greutate:               detail.greutate ?? null,
        inaltime:               detail.inaltime ?? null,
        tensiuneSistolica:      detail.tensiuneSistolica ?? null,
        tensiuneDiastolica:     detail.tensiuneDiastolica ?? null,
        puls:                   detail.puls ?? null,
        frecventaRespiratorie:  detail.frecventaRespiratorie ?? null,
        temperatura:            detail.temperatura ?? null,
        spO2:                   detail.spO2 ?? null,
        edeme:                  detail.edeme ?? '',
        glicemie:               detail.glicemie ?? null,
        ganglioniLimfatici:     detail.ganglioniLimfatici ?? '',
        examenClinic:           detail.examenClinic ?? '',
        alteObservatiiClinice:  detail.alteObservatiiClinice ?? '',
        investigatii:           detail.investigatii ?? '',
        analizeMedicale:        detail.analizeMedicale ?? '',
        diagnostic:             detail.diagnostic ?? '',
        diagnosticCodes:        detail.diagnosticCodes ?? '',
        recomandari:            detail.recomandari ?? '',
        observatii:             detail.observatii ?? '',
        concluzii:              detail.concluzii ?? '',
        esteAfectiuneOncologica:    detail.esteAfectiuneOncologica,
        areIndicatieInternare:      detail.areIndicatieInternare,
        saEliberatPrescriptie:      detail.saEliberatPrescriptie,
        seriePrescriptie:           detail.seriePrescriptie ?? '',
        saEliberatConcediuMedical:  detail.saEliberatConcediuMedical,
        serieConcediuMedical:       detail.serieConcediuMedical ?? '',
        saEliberatIngrijiriDomiciliu:  detail.saEliberatIngrijiriDomiciliu,
        saEliberatDispozitiveMedicale: detail.saEliberatDispozitiveMedicale,
        dataUrmatoareiVizite:   detail.dataUrmatoareiVizite ? detail.dataUrmatoareiVizite.split('T')[0] : '',
        noteUrmatoareaVizita:   detail.noteUrmatoareaVizita ?? '',
      })
      setDiagnosticTags(parseDiagnosticTags(detail.diagnosticCodes))
      // Restore ICD10 primary/secondary from diagnostic field (JSON encoded)
      try {
        const diagData = detail.diagnostic ? JSON.parse(detail.diagnostic) : null
        if (diagData?.primaryCode) {
          setPrimaryDiagCode(diagData.primaryCode)
          setPrimaryDiagDetails(diagData.primaryDetails ?? '')
          setSecondaryDiagnoses(diagData.secondaryDiagnoses ?? [])
        } else {
          setPrimaryDiagCode(null)
          setPrimaryDiagDetails('')
          setSecondaryDiagnoses([])
        }
      } catch {
        setPrimaryDiagCode(null)
        setPrimaryDiagDetails('')
        setSecondaryDiagnoses([])
      }
    }
  }, [detail, isCreating]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelectAppointment = async (appointment: AppointmentDto) => {
    setSelectedAppointment(appointment)
    setServerError(null)
    setActiveTab('anamneza')

    // Check if a consultation already exists for this appointment
    try {
      const resp = await consultationsApi.getByAppointmentId(appointment.id)
      const existing = resp?.data ?? null
      if (existing) {
        // Load existing consultation (edit mode)
        setIsCreating(false)
        setSelectedId(existing.id)
        return
      }
    } catch {
      // If the check fails, fall through to create mode
    }

    // No existing consultation — start creating a new one pre-filled with appointment data
    setSelectedId(null)
    setIsCreating(true)
    form.reset({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: todayISO,
      appointmentId: appointment.id,
      statusId: '',
      motiv: '', istoricMedicalPersonal: '', tratamentAnterior: '', istoricBoalaActuala: '', istoricFamilial: '', factoriDeRisc: '', alergiiConsultatie: '',
      stareGenerala: '', tegumente: '', mucoase: '', greutate: null, inaltime: null,
      tensiuneSistolica: null, tensiuneDiastolica: null, puls: null, frecventaRespiratorie: null,
      temperatura: null, spO2: null, edeme: '', glicemie: null, ganglioniLimfatici: '', examenClinic: '', alteObservatiiClinice: '',
      investigatii: '', analizeMedicale: '',
      diagnostic: '', diagnosticCodes: '', recomandari: '', observatii: '',
      concluzii: '', esteAfectiuneOncologica: false, areIndicatieInternare: false,
      saEliberatPrescriptie: false, seriePrescriptie: '', saEliberatConcediuMedical: false, serieConcediuMedical: '',
      saEliberatIngrijiriDomiciliu: false, saEliberatDispozitiveMedicale: false,
      dataUrmatoareiVizite: '', noteUrmatoareaVizita: '',
    })
    setDiagnosticTags([])
    setPrimaryDiagCode(null)
    setPrimaryDiagDetails('')
    setSecondaryDiagnoses([])
  }

  const handleNewConsultation = () => {
    setSelectedId(null)
    setIsCreating(true)
    setServerError(null)
    setSelectedAppointment(null)
    form.reset({
      patientId: '', doctorId: '', date: '', appointmentId: '', statusId: '',
      motiv: '', istoricMedicalPersonal: '', tratamentAnterior: '', istoricBoalaActuala: '', istoricFamilial: '', factoriDeRisc: '', alergiiConsultatie: '',
      stareGenerala: '', tegumente: '', mucoase: '', greutate: null, inaltime: null,
      tensiuneSistolica: null, tensiuneDiastolica: null, puls: null, frecventaRespiratorie: null,
      temperatura: null, spO2: null, edeme: '', glicemie: null, ganglioniLimfatici: '', examenClinic: '', alteObservatiiClinice: '',
      investigatii: '', analizeMedicale: '',
      diagnostic: '', diagnosticCodes: '', recomandari: '', observatii: '',
      concluzii: '', esteAfectiuneOncologica: false, areIndicatieInternare: false,
      saEliberatPrescriptie: false, seriePrescriptie: '', saEliberatConcediuMedical: false, serieConcediuMedical: '',
      saEliberatIngrijiriDomiciliu: false, saEliberatDispozitiveMedicale: false,
      dataUrmatoareiVizite: '', noteUrmatoareaVizita: '',
    })
    setDiagnosticTags([])
    setPrimaryDiagCode(null)
    setPrimaryDiagDetails('')
    setSecondaryDiagnoses([])
    setActiveTab('anamneza')
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
    setServerError(null)
  }

  const handleSaveDraft = async () => {
    // Ciorna se salvează fără validare strictă
    const values = form.getValues()
    // Build diagnosticCodes from ICD-10 components (primary + secondary codes)
    const icd10Codes: string[] = []
    if (primaryDiagCode) icd10Codes.push(primaryDiagCode.code)
    secondaryDiagnoses.forEach(sd => sd.icd10Codes.forEach(c => icd10Codes.push(c.code)))
    const codes = icd10Codes.length > 0 ? JSON.stringify(icd10Codes) : (diagnosticTags.length > 0 ? JSON.stringify(diagnosticTags) : '')
    // Encode ICD10 structured data into diagnostic field
    const diagnosticData = primaryDiagCode
      ? JSON.stringify({ primaryCode: primaryDiagCode, primaryDetails: primaryDiagDetails, secondaryDiagnoses })
      : values.diagnostic || null
    const commonFields = {
      motiv: values.motiv || null,
      istoricMedicalPersonal: values.istoricMedicalPersonal || null,
      tratamentAnterior: values.tratamentAnterior || null,
      istoricBoalaActuala: values.istoricBoalaActuala || null,
      istoricFamilial: values.istoricFamilial || null,
      factoriDeRisc: values.factoriDeRisc || null,
      alergiiConsultatie: values.alergiiConsultatie || null,
      stareGenerala: values.stareGenerala || null,
      tegumente: values.tegumente || null,
      mucoase: values.mucoase || null,
      greutate: values.greutate ?? null,
      inaltime: values.inaltime ?? null,
      tensiuneSistolica: values.tensiuneSistolica ?? null,
      tensiuneDiastolica: values.tensiuneDiastolica ?? null,
      puls: values.puls ?? null,
      frecventaRespiratorie: values.frecventaRespiratorie ?? null,
      temperatura: values.temperatura ?? null,
      spO2: values.spO2 ?? null,
      edeme: values.edeme || null,
      glicemie: values.glicemie ?? null,
      ganglioniLimfatici: values.ganglioniLimfatici || null,
      examenClinic: values.examenClinic || null,
      alteObservatiiClinice: values.alteObservatiiClinice || null,
      investigatii: values.investigatii || null,
      analizeMedicale: values.analizeMedicale || null,
      diagnostic: diagnosticData,
      diagnosticCodes: codes || null,
      recomandari: values.recomandari || null,
      observatii: values.observatii || null,
      concluzii: values.concluzii || null,
      esteAfectiuneOncologica: values.esteAfectiuneOncologica,
      areIndicatieInternare: values.areIndicatieInternare,
      saEliberatPrescriptie: values.saEliberatPrescriptie,
      seriePrescriptie: values.seriePrescriptie || null,
      saEliberatConcediuMedical: values.saEliberatConcediuMedical,
      serieConcediuMedical: values.serieConcediuMedical || null,
      saEliberatIngrijiriDomiciliu: values.saEliberatIngrijiriDomiciliu,
      saEliberatDispozitiveMedicale: values.saEliberatDispozitiveMedicale,
      dataUrmatoareiVizite: values.dataUrmatoareiVizite || null,
      noteUrmatoareaVizita: values.noteUrmatoareaVizita || null,
    }

    try {
      if (isCreating) {
        const payload: CreateConsultationPayload = {
          patientId: values.patientId,
          doctorId: values.doctorId,
          date: values.date,
          appointmentId: values.appointmentId || null,
          statusId: CONSULTATION_STATUS_IDS.draft,
          ...commonFields,
        }
        const resp = await createConsultation.mutateAsync(payload)
        const newId = resp?.data
        setIsCreating(false)
        if (newId) setSelectedId(newId)
        setSuccessMsg('Consultație creată cu succes.')
      } else if (selectedId) {
        const payload: UpdateConsultationPayload = {
          id: selectedId,
          patientId: values.patientId,
          doctorId: values.doctorId,
          date: values.date,
          appointmentId: values.appointmentId || null,
          ...commonFields,
        }
        await updateConsultation.mutateAsync(payload)
        qc.invalidateQueries({ queryKey: consultationKeys.detail(selectedId) })
        setSuccessMsg('Consultație salvată cu succes.')
      }
      setServerError(null)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Eroare la salvare.')
    }
  }

  /**
   * La trecerea pe alt tab: salvează DOAR datele tabului de pe care plecăm,
   * apelând endpoint-ul dedicat (anamnesis / exam) sau update-ul de header
   * (pentru tab-urile 3-6). În modul "creare" delegăm către handleSaveDraft
   * care face POST complet. Eșuarea NU blochează navigarea.
   */
  const handleTabChange = async (newTab: Tab) => {
    if (newTab === activeTab) return
    const previousTab = activeTab

    // În modul "creare" sau dacă încă nu există ID → POST complet prin handleSaveDraft
    if (isCreating) {
      try { await handleSaveDraft() } catch { /* setat în handleSaveDraft */ }
      setActiveTab(newTab)
      return
    }

    // Pentru consultație existentă, salvăm doar dacă e editabilă și avem ID
    if (selectedId && !isLocked && !isFinalized
        && !createConsultation.isPending && !updateConsultation.isPending) {
      const v = form.getValues()
      try {
        if (previousTab === 'anamneza') {
          await consultationsApi.updateAnamnesis(selectedId, {
            motiv: v.motiv || null,
            istoricMedicalPersonal: v.istoricMedicalPersonal || null,
            tratamentAnterior: v.tratamentAnterior || null,
            istoricBoalaActuala: v.istoricBoalaActuala || null,
            istoricFamilial: v.istoricFamilial || null,
            factoriDeRisc: v.factoriDeRisc || null,
            alergiiConsultatie: v.alergiiConsultatie || null,
          })
          qc.invalidateQueries({ queryKey: consultationKeys.detail(selectedId) })
        } else if (previousTab === 'examen') {
          await consultationsApi.updateExam(selectedId, {
            stareGenerala: v.stareGenerala || null,
            tegumente: v.tegumente || null,
            mucoase: v.mucoase || null,
            greutate: v.greutate ?? null,
            inaltime: v.inaltime ?? null,
            tensiuneSistolica: v.tensiuneSistolica ?? null,
            tensiuneDiastolica: v.tensiuneDiastolica ?? null,
            puls: v.puls ?? null,
            frecventaRespiratorie: v.frecventaRespiratorie ?? null,
            temperatura: v.temperatura ?? null,
            spO2: v.spO2 ?? null,
            edeme: v.edeme || null,
            glicemie: v.glicemie ?? null,
            ganglioniLimfatici: v.ganglioniLimfatici || null,
            examenClinic: v.examenClinic || null,
            alteObservatiiClinice: v.alteObservatiiClinice || null,
          })
          qc.invalidateQueries({ queryKey: consultationKeys.detail(selectedId) })
        } else {
          // Tab-urile 3-6 ţin de Consultations (header) → folosim handleSaveDraft
          await handleSaveDraft()
        }
      } catch (err: unknown) {
        setServerError(err instanceof Error ? err.message : 'Eroare la salvare automată.')
      }
    }

    setActiveTab(newTab)
  }

  const handleFinalize = async () => {
    if (!selectedId) return

    // Validare completă la finalizare — cu feedback vizual pe câmpuri
    const valid = await form.trigger()
    if (!valid) {
      const errors = form.formState.errors
      const fieldLabels: Record<string, string> = {
        patientId: 'Pacient', doctorId: 'Medic', date: 'Data consultației',
        motiv: 'Motiv prezentare', diagnostic: 'Diagnostic', recomandari: 'Recomandări',
      }
      const msgs: string[] = []
      Object.entries(errors).forEach(([key, err]) => {
        if (err?.message) {
          msgs.push(fieldLabels[key] ?? err.message)
        }
      })
      setServerError(
        msgs.length > 0
          ? `Nu se poate finaliza. Câmpuri cu probleme: ${msgs.join(', ')}`
          : 'Verificați câmpurile obligatorii înainte de finalizare.'
      )
      setShowFinalizeConfirm(false)
      return
    }

    const values = form.getValues()
    // Build diagnosticCodes from ICD-10 components (primary + secondary codes)
    const icd10Codes: string[] = []
    if (primaryDiagCode) icd10Codes.push(primaryDiagCode.code)
    secondaryDiagnoses.forEach(sd => sd.icd10Codes.forEach(c => icd10Codes.push(c.code)))
    const codes = icd10Codes.length > 0 ? JSON.stringify(icd10Codes) : (diagnosticTags.length > 0 ? JSON.stringify(diagnosticTags) : '')
    const finalizeDiagnosticData = primaryDiagCode
      ? JSON.stringify({ primaryCode: primaryDiagCode, primaryDetails: primaryDiagDetails, secondaryDiagnoses })
      : values.diagnostic || null
    try {
      await updateConsultation.mutateAsync({
        id: selectedId,
        patientId: values.patientId,
        doctorId: values.doctorId,
        date: values.date,
        appointmentId: values.appointmentId || null,
        statusId: CONSULTATION_STATUS_IDS.completed,
        motiv: values.motiv || null,
        istoricMedicalPersonal: values.istoricMedicalPersonal || null,
        tratamentAnterior: values.tratamentAnterior || null,
        istoricBoalaActuala: values.istoricBoalaActuala || null,
        istoricFamilial: values.istoricFamilial || null,
        factoriDeRisc: values.factoriDeRisc || null,
        alergiiConsultatie: values.alergiiConsultatie || null,
        stareGenerala: values.stareGenerala || null,
        tegumente: values.tegumente || null,
        mucoase: values.mucoase || null,
        greutate: values.greutate ?? null,
        inaltime: values.inaltime ?? null,
        tensiuneSistolica: values.tensiuneSistolica ?? null,
        tensiuneDiastolica: values.tensiuneDiastolica ?? null,
        puls: values.puls ?? null,
        frecventaRespiratorie: values.frecventaRespiratorie ?? null,
        temperatura: values.temperatura ?? null,
        spO2: values.spO2 ?? null,
        edeme: values.edeme || null,
        glicemie: values.glicemie ?? null,
        ganglioniLimfatici: values.ganglioniLimfatici || null,
        examenClinic: values.examenClinic || null,
        alteObservatiiClinice: values.alteObservatiiClinice || null,
        investigatii: values.investigatii || null,
        analizeMedicale: values.analizeMedicale || null,
        diagnostic: finalizeDiagnosticData,
        diagnosticCodes: codes || null,
        recomandari: values.recomandari || null,
        observatii: values.observatii || null,
        concluzii: values.concluzii || null,
        esteAfectiuneOncologica: values.esteAfectiuneOncologica,
        areIndicatieInternare: values.areIndicatieInternare,
        saEliberatPrescriptie: values.saEliberatPrescriptie,
        seriePrescriptie: values.seriePrescriptie || null,
        saEliberatConcediuMedical: values.saEliberatConcediuMedical,
        serieConcediuMedical: values.serieConcediuMedical || null,
        saEliberatIngrijiriDomiciliu: values.saEliberatIngrijiriDomiciliu,
        saEliberatDispozitiveMedicale: values.saEliberatDispozitiveMedicale,
        dataUrmatoareiVizite: values.dataUrmatoareiVizite || null,
        noteUrmatoareaVizita: values.noteUrmatoareaVizita || null,
      })
      qc.invalidateQueries({ queryKey: consultationKeys.detail(selectedId) })
      setShowFinalizeConfirm(false)
      setSuccessMsg('Consultație finalizată cu succes.')
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Eroare la finalizare.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteConsultation.mutateAsync(deleteTarget.id)
      if (selectedId === deleteTarget.id) { setSelectedId(null); setIsCreating(false) }
      setDeleteTarget(null)
      setSuccessMsg('Consultație ștearsă cu succes.')
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch { /* handled by mutation */ }
  }

  // Reactive watches for computed fields & toggle cards
  const [wGreutate, wInaltime, wEsteOnco, wInternare, wPrescriptie, wConcediu, wIngrijiri, wDispozitive] = form.watch([
    'greutate', 'inaltime',
    'esteAfectiuneOncologica', 'areIndicatieInternare',
    'saEliberatPrescriptie', 'saEliberatConcediuMedical',
    'saEliberatIngrijiriDomiciliu', 'saEliberatDispozitiveMedicale',
  ])
  const imc = wGreutate && wInaltime && wInaltime > 0
    ? (wGreutate / Math.pow(wInaltime / 100, 2)).toFixed(1)
    : null

  const showDetail = isCreating || !!selectedId

  return (
    <div className={styles.page}>
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.pageTitle}>Consultații</h1>
          <AppButton variant="primary" size="sm" onClick={handleNewConsultation}>
            <IconPlus /> Nouă
          </AppButton>
        </div>

        {/* Doctor filter — only for admin / clinic_manager */}
        {isAdmin && (
          <div className={styles.doctorFilter}>
            <select
              className={styles.filterSelect}
              value={appointmentDoctorFilter ?? ''}
              onChange={e => setAppointmentDoctorFilter(e.target.value || undefined)}
            >
              <option value="">Toți medicii</option>
              {(doctorLookupResp?.data ?? []).map(d => (
                <option key={d.id} value={d.id}>{d.fullName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Appointment stats */}
        {appointmentStats && (
          <div className={styles.statsCompact}>
            <div className={styles.statMini}><span className={styles.statMiniValue}>{appointmentStats.totalAppointments}</span><span className={styles.statMiniLabel}>Total</span></div>
            <div className={styles.statMini}><span className={`${styles.statMiniValue} ${styles['statMiniValue--orange']}`}>{appointmentStats.scheduledCount}</span><span className={styles.statMiniLabel}>Programate</span></div>
            <div className={styles.statMini}><span className={`${styles.statMiniValue} ${styles['statMiniValue--green']}`}>{appointmentStats.confirmedCount}</span><span className={styles.statMiniLabel}>Confirmate</span></div>
            <div className={styles.statMini}><span className={`${styles.statMiniValue} ${styles['statMiniValue--gray']}`}>{appointmentStats.completedCount}</span><span className={styles.statMiniLabel}>Finalizate</span></div>
          </div>
        )}

        {/* Today's appointments label */}
        <div className={styles.dateGroupLabel}>Programări azi</div>

        {/* Appointment card list */}
        <div className={styles.cardList}>
          {isAppointmentsError && <div className={styles.listError}>Eroare la încărcarea programărilor.</div>}

          {todayAppointments.map(apt => (
            <button
              key={apt.id}
              className={`${styles.card} ${selectedAppointment?.id === apt.id ? styles.cardActive : ''}`}
              onClick={() => handleSelectAppointment(apt)}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardPatient}>{apt.patientName}</span>
                <span className={styles.cardTime}>{formatTimeRange(apt.startTime, apt.endTime)}</span>
              </div>
              <div className={styles.cardMiddle}>
                {apt.doctorName}{apt.specialtyName ? ` · ${apt.specialtyName}` : ''}
              </div>
              <div className={styles.cardBottom}>
                <AppBadge variant={getAppointmentStatusVariant(apt.statusCode)} withDot>{apt.statusName}</AppBadge>
              </div>
            </button>
          ))}

          {!isAppointmentsError && todayAppointments.length === 0 && (
            <div className={styles.listEmpty}>Nicio programare pentru azi.</div>
          )}
        </div>
      </aside>

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
            {successMsg && <div className={styles.successAlert}>✓ {successMsg}</div>}
            {serverError && <div className={styles.errorAlert}>✕ {serverError}</div>}

            {/* Locked banner */}
            {isLocked && (
              <div className={styles.lockedBanner}><Lock size={14} /> Consultație blocată — doar citire</div>
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
                  <AppBadge variant={getAppointmentStatusVariant(detail.statusCode)} withDot>
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
                <div className={styles.tabBar}>
                  {TABS.map(tab => (
                    <button
                      key={tab.key}
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
                <div className={styles.tabContent}>

                  {/* ── Anamneză ── */}
                  {activeTab === 'anamneza' && (
                    <div className={styles.anamnezaGrid}>
                      <div className={styles.anamnezaCol}>
                        <div className={styles.formSectionCompact}>
                          <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><MessageSquareText size={15} /></span> Motiv Prezentare</h4>
                          <FormRichText name="motiv" control={form.control} placeholder="Descrieți motivul prezentării pacientului la consultație..." disabled={!isEditable} height={180} />
                        </div>
                        <div className={styles.formSectionCompact}>
                          <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><NotebookPen size={15} /></span> Istoric Medical Personal</h4>
                          <FormRichText name="istoricMedicalPersonal" control={form.control} placeholder="Boli anterioare, intervenții chirurgicale, alergii, tratamente cronice..." disabled={!isEditable} height={180} />
                        </div>
                        <div className={styles.formSectionCompact}>
                          <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><Pill size={15} /></span> Tratament Anterior</h4>
                          <FormRichText name="tratamentAnterior" control={form.control} placeholder="Tratamente urmate anterior (medicație, proceduri, intervenții)..." disabled={!isEditable} height={180} />
                        </div>
                      </div>
                      <div className={styles.anamnezaCol}>
                        <div className={styles.formSectionCompact}>
                          <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><FileText size={15} /></span> Istoricul Bolii Prezente</h4>
                          <FormRichText name="istoricBoalaActuala" control={form.control} placeholder="Evoluția simptomelor, când au apărut, factori agravanți/amelioranți..." disabled={!isEditable} height={180} />
                        </div>
                        <div className={styles.formSectionCompact}>
                          <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><Users size={15} /></span> Istoric Familial</h4>
                          <FormRichText name="istoricFamilial" control={form.control} placeholder="Boli ereditare în familie (diabet, HTA, boli cardiace, cancer, etc.)..." disabled={!isEditable} height={180} />
                        </div>
                        <div className={styles.formSectionCompact}>
                          <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><AlertTriangle size={15} /></span> Factori de Risc</h4>
                          <FormRichText name="factoriDeRisc" control={form.control} placeholder="Factori de risc identificați (HTA, diabet, fumat, sedentarism, obezitate, etc.)..." disabled={!isEditable} height={180} />
                        </div>
                        <div className={styles.formSectionCompact}>
                          <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><ShieldAlert size={15} /></span> Alergii</h4>
                          <FormRichText name="alergiiConsultatie" control={form.control} placeholder="Alergii cunoscute (medicamente, alimente, substanțe, etc.)..." disabled={!isEditable} height={150} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Examen Clinic ── */}
                  {activeTab === 'examen' && (
                    <div className={styles.examenSection}>
                      <h3 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><Stethoscope size={18} /></span>
                        Examen Clinic General
                      </h3>
                      <div className={styles.examGrid}>
                        {/* Stare Generală */}
                        <div className={styles.examCard}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><ShieldCheck size={14} /></span>
                            <span className={styles.examCardLabel}>Stare Generală</span>
                          </div>
                          <select disabled={!isEditable} className={styles.examSelectInput} {...form.register('stareGenerala')}>
                            <option value="">Selectează...</option>
                            {['Bună','Relativ bună','Satisfăcătoare','Medie','Alterată','Rea','Gravă'].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        {/* Tegumente */}
                        <div className={styles.examCard}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><Hand size={14} /></span>
                            <span className={styles.examCardLabel}>Tegumente</span>
                          </div>
                          <select disabled={!isEditable} className={styles.examSelectInput} {...form.register('tegumente')}>
                            <option value="">Selectează...</option>
                            {['Normale','Normal colorate','Palide','Subicterice','Cianotice','Icterice','Eritematoase'].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        {/* Mucoase */}
                        <div className={styles.examCard}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><Eye size={14} /></span>
                            <span className={styles.examCardLabel}>Mucoase</span>
                          </div>
                          <select disabled={!isEditable} className={styles.examSelectInput} {...form.register('mucoase')}>
                            <option value="">Selectează...</option>
                            {['Roz','Normal colorate','Palide','Icterice','Uscate'].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        {/* Greutate */}
                        <div className={styles.examCard}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><Scale size={14} /></span>
                            <span className={styles.examCardLabel}>Greutate</span>
                          </div>
                          <div className={styles.examCardInput}>
                            <input type="number" step="0.1" disabled={!isEditable} className={styles.examNumInput} placeholder="70.5" {...form.register('greutate', { setValueAs: v => v === '' ? null : parseFloat(v) })} />
                            <span className={styles.examUnit}>kg</span>
                          </div>
                        </div>
                        {/* Înălțime */}
                        <div className={styles.examCard}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><Ruler size={14} /></span>
                            <span className={styles.examCardLabel}>Înălțime</span>
                          </div>
                          <div className={styles.examCardInput}>
                            <input type="number" step="0.1" disabled={!isEditable} className={styles.examNumInput} placeholder="175" {...form.register('inaltime', { setValueAs: v => v === '' ? null : parseFloat(v) })} />
                            <span className={styles.examUnit}>cm</span>
                          </div>
                        </div>
                        {/* IMC (computed) */}
                        <div className={`${styles.examCard} ${imc ? styles.examCardHasValue : ''}`}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><Hash size={14} /></span>
                            <span className={styles.examCardLabel}>IMC</span>
                          </div>
                          {imc ? (
                            <div className={styles.imcResult}>
                              <span className={styles.imcValue}>{imc}</span>
                              <span className={styles.examUnit}>kg/m²</span>
                            </div>
                          ) : (
                            <span className={styles.examPlaceholder}>Completați G + Î</span>
                          )}
                        </div>
                        {/* TA */}
                        <div className={styles.examCard}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><Heart size={14} /></span>
                            <span className={styles.examCardLabel}>Tensiune Arterială</span>
                          </div>
                          <div className={styles.examCardInput}>
                            <input type="number" step="1" disabled={!isEditable} className={styles.examNumInput} placeholder="120" {...form.register('tensiuneSistolica', { setValueAs: v => v === '' ? null : parseInt(v) })} />
                            <span className={styles.examUnit}>/</span>
                            <input type="number" step="1" disabled={!isEditable} className={styles.examNumInput} placeholder="80" {...form.register('tensiuneDiastolica', { setValueAs: v => v === '' ? null : parseInt(v) })} />
                            <span className={styles.examUnit}>mmHg</span>
                          </div>
                        </div>
                        {/* FC */}
                        <div className={styles.examCard}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><HeartPulse size={14} /></span>
                            <span className={styles.examCardLabel}>Frecvență Cardiacă</span>
                          </div>
                          <div className={styles.examCardInput}>
                            <input type="number" step="1" disabled={!isEditable} className={styles.examNumInput} placeholder="75" {...form.register('puls', { setValueAs: v => v === '' ? null : parseInt(v) })} />
                            <span className={styles.examUnit}>bpm</span>
                          </div>
                        </div>
                        {/* FR */}
                        <div className={styles.examCard}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><Wind size={14} /></span>
                            <span className={styles.examCardLabel}>Frecvență Respiratorie</span>
                          </div>
                          <div className={styles.examCardInput}>
                            <input type="number" step="1" disabled={!isEditable} className={styles.examNumInput} placeholder="16" {...form.register('frecventaRespiratorie', { setValueAs: v => v === '' ? null : parseInt(v) })} />
                            <span className={styles.examUnit}>resp/min</span>
                          </div>
                        </div>
                        {/* Temperatură */}
                        <div className={styles.examCard}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><Thermometer size={14} /></span>
                            <span className={styles.examCardLabel}>Temperatură</span>
                          </div>
                          <div className={styles.examCardInput}>
                            <input type="number" step="0.1" disabled={!isEditable} className={styles.examNumInput} placeholder="36.5" {...form.register('temperatura', { setValueAs: v => v === '' ? null : parseFloat(v) })} />
                            <span className={styles.examUnit}>°C</span>
                          </div>
                        </div>
                        {/* SpO₂ */}
                        <div className={styles.examCard}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><Activity size={14} /></span>
                            <span className={styles.examCardLabel}>SpO₂</span>
                          </div>
                          <div className={styles.examCardInput}>
                            <input type="number" step="0.1" disabled={!isEditable} className={styles.examNumInput} placeholder="98" {...form.register('spO2', { setValueAs: v => v === '' ? null : parseFloat(v) })} />
                            <span className={styles.examUnit}>%</span>
                          </div>
                        </div>
                        {/* Edeme */}
                        <div className={styles.examCard}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><Droplets size={14} /></span>
                            <span className={styles.examCardLabel}>Edeme</span>
                          </div>
                          <select disabled={!isEditable} className={styles.examSelectInput} {...form.register('edeme')}>
                            <option value="">Selectează...</option>
                            {['Absente','Ușoare','Moderate','Severe','Prezente membre inferioare','Generalizate','Periferice'].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        {/* Glicemie */}
                        <div className={styles.examCard}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><Droplet size={14} /></span>
                            <span className={styles.examCardLabel}>Glicemie</span>
                          </div>
                          <div className={styles.examCardInput}>
                            <input type="number" step="0.1" disabled={!isEditable} className={styles.examNumInput} placeholder="95" {...form.register('glicemie', { setValueAs: v => v === '' ? null : parseFloat(v) })} />
                            <span className={styles.examUnit}>mg/dL</span>
                          </div>
                        </div>
                        {/* Ganglioni */}
                        <div className={styles.examCard}>
                          <div className={styles.examCardHeader}>
                            <span className={styles.examIcon}><CircleDot size={14} /></span>
                            <span className={styles.examCardLabel}>Ganglioni Limfatici</span>
                          </div>
                          <select disabled={!isEditable} className={styles.examSelectInput} {...form.register('ganglioniLimfatici')}>
                            <option value="">Selectează...</option>
                            {['Nepalpabili','Palpabili, nedureroși','Palpabili, dureroși','Adenopatii','Normali','Măriți regional','Măriți generalizat'].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>

                      <h3 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><PenLine size={18} /></span>
                        Examen Obiectiv Detaliat
                      </h3>
                      <FormInput name="examenClinic" control={form.control} label="Examen clinic general" placeholder="Aspect general, examen pe aparate și sisteme..." multiline rows={5} disabled={!isEditable} maxLength={4000} />

                      <h3 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><ClipboardPlus size={18} /></span>
                        Alte Observații Clinice
                      </h3>
                      <FormInput name="alteObservatiiClinice" control={form.control} label="Alte observații clinice" placeholder="Alte observații relevante din examenul clinic..." multiline rows={3} disabled={!isEditable} maxLength={2000} />
                    </div>
                  )}

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

                  {/* ── Diagnostic & Tratament ── */}
                  {activeTab === 'diagnostic' && (
                    <div className={styles.diagnosticSection}>
                      {/* ══ 2-Column: Primary + Secondary ══ */}
                      <div className={styles.diagnosticColumns}>
                        {/* Left: Primary Diagnosis */}
                        <div className={styles.diagnosticColumnPrimary}>
                          <PrimaryDiagnosisSelector
                            selectedCode={primaryDiagCode}
                            onCodeChange={setPrimaryDiagCode}
                            details={primaryDiagDetails}
                            onDetailsChange={setPrimaryDiagDetails}
                            showValidation={false}
                            disabled={!isEditable}
                          />
                        </div>
                        {/* Right: Secondary Diagnoses */}
                        <div className={styles.diagnosticColumnSecondary}>
                          <SecondaryDiagnosesList
                            diagnoses={secondaryDiagnoses}
                            onChange={setSecondaryDiagnoses}
                            showValidation={false}
                            disabled={!isEditable}
                          />
                        </div>
                      </div>

                      <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>
                          <span className={styles.sectionIcon}><Pill size={18} /></span>
                          Recomandări / Tratament
                        </h3>
                        <FormInput name="recomandari" control={form.control} placeholder="Descrieți tratamentul și recomandările..." multiline rows={5} disabled={!isEditable} maxLength={4000} />
                      </div>
                      <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>
                          <span className={styles.sectionIcon}><PenLine size={18} /></span>
                          Observații
                        </h3>
                        <FormInput name="observatii" control={form.control} placeholder="Observații suplimentare..." multiline rows={3} disabled={!isEditable} maxLength={4000} />
                      </div>
                    </div>
                  )}

                  {/* ── Concluzii ── */}
                  {activeTab === 'concluzii' && (
                    <div className={styles.concluziiSection}>
                      <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>
                          <span className={styles.sectionIcon}><FileCheck size={18} /></span>
                          Concluzii
                        </h3>
                        <FormInput name="concluzii" control={form.control} label="Rezumat consultație" placeholder="Rezumat general al consultației..." multiline rows={5} disabled={!isEditable} maxLength={4000} />
                      </div>

                      <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>
                          <span className={styles.sectionIcon}><ClipboardCheck size={18} /></span>
                          Informații Scrisoare Medicală
                          <span className={styles.sectionSubtitle}>Anexa 43 - Ordin MS nr. 1411/2016</span>
                        </h3>

                        <div className={styles.optionCardsGrid}>
                          <div className={`${styles.optionCard} ${wEsteOnco ? `${styles.optionCardActive} ${styles.optionCardWarning}` : ''}`}>
                            <label className={styles.optionCardContent}>
                              <div className={`${styles.optionCardIconWrap} ${styles.optionIconWarning}`}><Ribbon size={20} /></div>
                              <div className={styles.optionCardDetails}>
                                <span className={styles.optionCardLabel}>Afecțiune Oncologică</span>
                                <span className={styles.optionCardDesc}>Pacientul prezintă afecțiune oncologică</span>
                              </div>
                              <div className={styles.toggleWrap}>
                                <input type="checkbox" className={styles.toggleInput} disabled={!isEditable} checked={!!wEsteOnco} onChange={e => form.setValue('esteAfectiuneOncologica', e.target.checked, { shouldDirty: true })} />
                                <span className={styles.toggleSlider} />
                              </div>
                            </label>
                          </div>

                          <div className={`${styles.optionCard} ${wInternare ? `${styles.optionCardActive} ${styles.optionCardInfo}` : ''}`}>
                            <label className={styles.optionCardContent}>
                              <div className={`${styles.optionCardIconWrap} ${styles.optionIconInfo}`}><Hospital size={20} /></div>
                              <div className={styles.optionCardDetails}>
                                <span className={styles.optionCardLabel}>Indicație Internare</span>
                                <span className={styles.optionCardDesc}>Recomandare pentru internare în spital</span>
                              </div>
                              <div className={styles.toggleWrap}>
                                <input type="checkbox" className={styles.toggleInput} disabled={!isEditable} checked={!!wInternare} onChange={e => form.setValue('areIndicatieInternare', e.target.checked, { shouldDirty: true })} />
                                <span className={styles.toggleSlider} />
                              </div>
                            </label>
                          </div>

                          <div className={`${styles.optionCard} ${wPrescriptie ? `${styles.optionCardActive} ${styles.optionCardPrimary}` : ''}`}>
                            <label className={styles.optionCardContent}>
                              <div className={`${styles.optionCardIconWrap} ${styles.optionIconPrimary}`}><ClipboardCheck size={20} /></div>
                              <div className={styles.optionCardDetails}>
                                <span className={styles.optionCardLabel}>Prescripție Medicală</span>
                                <span className={styles.optionCardDesc}>S-a eliberat rețetă medicală</span>
                              </div>
                              <div className={styles.toggleWrap}>
                                <input type="checkbox" className={styles.toggleInput} disabled={!isEditable} checked={!!wPrescriptie} onChange={e => form.setValue('saEliberatPrescriptie', e.target.checked, { shouldDirty: true })} />
                                <span className={styles.toggleSlider} />
                              </div>
                            </label>
                            {wPrescriptie && (
                              <div className={styles.optionExpanded}>
                                <FormInput name="seriePrescriptie" control={form.control} label="Serie / Număr prescripție" placeholder="Serie / Număr prescripție..." disabled={!isEditable} maxLength={50} />
                              </div>
                            )}
                          </div>

                          <div className={`${styles.optionCard} ${wConcediu ? `${styles.optionCardActive} ${styles.optionCardSecondary}` : ''}`}>
                            <label className={styles.optionCardContent}>
                              <div className={`${styles.optionCardIconWrap} ${styles.optionIconSecondary}`}><BedDouble size={20} /></div>
                              <div className={styles.optionCardDetails}>
                                <span className={styles.optionCardLabel}>Concediu Medical</span>
                                <span className={styles.optionCardDesc}>S-a eliberat certificat de concediu medical</span>
                              </div>
                              <div className={styles.toggleWrap}>
                                <input type="checkbox" className={styles.toggleInput} disabled={!isEditable} checked={!!wConcediu} onChange={e => form.setValue('saEliberatConcediuMedical', e.target.checked, { shouldDirty: true })} />
                                <span className={styles.toggleSlider} />
                              </div>
                            </label>
                            {wConcediu && (
                              <div className={styles.optionExpanded}>
                                <FormInput name="serieConcediuMedical" control={form.control} label="Serie / Număr concediu medical" placeholder="Serie / Număr concediu medical..." disabled={!isEditable} maxLength={50} />
                              </div>
                            )}
                          </div>

                          <div className={`${styles.optionCard} ${wIngrijiri ? `${styles.optionCardActive} ${styles.optionCardSuccess}` : ''}`}>
                            <label className={styles.optionCardContent}>
                              <div className={`${styles.optionCardIconWrap} ${styles.optionIconSuccess}`}><Home size={20} /></div>
                              <div className={styles.optionCardDetails}>
                                <span className={styles.optionCardLabel}>Îngrijiri la Domiciliu</span>
                                <span className={styles.optionCardDesc}>Recomandare pentru îngrijiri medicale la domiciliu</span>
                              </div>
                              <div className={styles.toggleWrap}>
                                <input type="checkbox" className={styles.toggleInput} disabled={!isEditable} checked={!!wIngrijiri} onChange={e => form.setValue('saEliberatIngrijiriDomiciliu', e.target.checked, { shouldDirty: true })} />
                                <span className={styles.toggleSlider} />
                              </div>
                            </label>
                          </div>

                          <div className={`${styles.optionCard} ${wDispozitive ? `${styles.optionCardActive} ${styles.optionCardInfo}` : ''}`}>
                            <label className={styles.optionCardContent}>
                              <div className={`${styles.optionCardIconWrap} ${styles.optionIconInfo}`}><Accessibility size={20} /></div>
                              <div className={styles.optionCardDetails}>
                                <span className={styles.optionCardLabel}>Dispozitive Medicale</span>
                                <span className={styles.optionCardDesc}>Recomandare pentru dispozitive medicale</span>
                              </div>
                              <div className={styles.toggleWrap}>
                                <input type="checkbox" className={styles.toggleInput} disabled={!isEditable} checked={!!wDispozitive} onChange={e => form.setValue('saEliberatDispozitiveMedicale', e.target.checked, { shouldDirty: true })} />
                                <span className={styles.toggleSlider} />
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className={styles.formSection}>
                        <h3 className={styles.sectionTitle}>
                          <span className={styles.sectionIcon}><CalendarClock size={18} /></span>
                          Planificare Următoare
                        </h3>
                        <div className={styles.nextVisitSection}>
                          <FormDatePicker name="dataUrmatoareiVizite" control={form.control} label="Data următoarei vizite" disabled={!isEditable} />
                          <FormInput name="noteUrmatoareaVizita" control={form.control} label="Note pentru vizita următoare" placeholder="Investigații suplimentare, controale..." multiline rows={3} disabled={!isEditable} maxLength={2000} />
                        </div>
                      </div>
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
                          onClick={() => { const c = consultations.find(x => x.id === selectedId); if (c) setDeleteTarget(c) }}
                          leftIcon={<IconTrash />}
                        >
                          Șterge
                        </AppButton>
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
                          variant="primary"
                          size="sm"
                          onClick={() => setShowFinalizeConfirm(true)}
                          leftIcon={<IconCheck />}
                        >
                          Finalizează Consultație
                        </AppButton>
                      </div>
                    </>
                  )}

                  {!isCreating && isFinalized && (
                    <>
                      <div className={styles.footerInfo} />
                      <div className={styles.footerActions}>
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
      {showFinalizeConfirm && (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmare finalizare</h5>
                <button type="button" className="btn-close" onClick={() => setShowFinalizeConfirm(false)} />
              </div>
              <div className="modal-body">
                <p>Sigur doriți să finalizați această consultație? După finalizare, consultația nu va mai putea fi modificată.</p>
              </div>
              <div className="modal-footer">
                <AppButton variant="outline-secondary" size="sm" onClick={() => setShowFinalizeConfirm(false)}>Anulează</AppButton>
                <AppButton variant="primary" size="sm" onClick={handleFinalize} isLoading={updateConsultation.isPending} loadingText="Se finalizează...">Finalizează</AppButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmare ștergere</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} />
              </div>
              <div className="modal-body">
                <p>Sigur doriți să ștergeți consultația pacientului <strong>{deleteTarget.patientName}</strong> din {formatDate(deleteTarget.date)}?</p>
              </div>
              <div className="modal-footer">
                <AppButton variant="outline-secondary" size="sm" onClick={() => setDeleteTarget(null)}>Anulează</AppButton>
                <AppButton variant="danger" size="sm" onClick={handleDelete} isLoading={deleteConsultation.isPending} loadingText="Se șterge...">Șterge</AppButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConsultationsListPage

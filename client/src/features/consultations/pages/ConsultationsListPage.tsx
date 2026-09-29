import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Lock, User, Microscope, FlaskConical, Receipt } from 'lucide-react'
import type { ConsultationListDto, ConsultationDetailDto } from '../types/consultation.types'
import { useConsultationDetail, useDeleteConsultation } from '../hooks/useConsultations'
import { useConsultationEditor } from '../hooks/useConsultationEditor'
import { consultationsApi } from '@/api/endpoints/consultations.api'
import type { AppointmentDto } from '@/features/appointments/types/appointment.types'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { usePatientLookup, usePatientDetail } from '@/features/patients/hooks/usePatients'
import { useAuthStore } from '@/store/authStore'
import { usePageHistoryStore } from '@/store/pageHistoryStore'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { AppBadge } from '@/components/ui/AppBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormSelect } from '@/components/forms/FormSelect/FormSelect'
import { FormDatePicker } from '@/components/forms/FormDatePicker/FormDatePicker'
import { formatDate } from '@/utils/format'
import { EMPTY_CONSULTATION_FORM } from '../constants/consultationDefaults'
import { EMPTY_DIAGNOSIS } from '../utils/consultationPayload'
import { ageFromBirthDate, genderLabel, getConsultationStatusVariant } from '../utils/consultationDisplay'
import { InvestigationsStep } from '../investigations/InvestigationsStep'
import { AnalizeMedicaleStep } from '../lab/AnalizeMedicaleStep'
import { ConsultationServicesTab } from '../services/ConsultationServicesTab'
import { AnamnezaTab, ExamenClinicTab, DiagnosticTab, ConcluziiTab } from '../components/ConsultationTabs'
import { ConsultationsSidebar } from '../components/ConsultationsSidebar'
import {
  ConsultationActionBar, ConsultationTabBar, PatientCard, SectionPanel, type ConsultationTab,
} from '../components/ConsultationDetail'
import { ScrisoareMedicalaModal } from '../components/ScrisoareMedicalaModal/ScrisoareMedicalaModal'
import styles from './ConsultationsListPage.module.scss'

const IconEmpty = () => <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>

const CONFIRMED_APPOINTMENT_CODE = 'CONFIRMAT'
const APPOINTMENT_NOT_CONFIRMED = 'Consultația poate fi începută doar pentru o programare confirmată. Confirmați programarea întâi.'

const getTodayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Workbench consultații: programările zilei + istoric (stânga), fișa consultației (dreapta). */
export const ConsultationsListPage = () => {
  const navigate = useNavigate()
  // Consultația selectată trăiește în URL: deep-link, back/forward, refresh fără pierdere de context
  const { id: routeId } = useParams<{ id?: string }>()
  const selectedId = routeId ?? null
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.role === 'admin' || user?.role === 'clinic_manager'
  const { canWrite } = useHasAccess()
  const todayISO = useMemo(() => getTodayISO(), [])

  const [doctorFilter, setDoctorFilter] = useState<string | undefined>(undefined)
  // Medicii văd doar propriile programări și consultații
  const effectiveDoctorId = isAdmin ? doctorFilter : (user?.doctorId ?? undefined)

  const [isCreatingState, setIsCreating] = useState(false)
  const [trackedRouteId, setTrackedRouteId] = useState(routeId)
  // Navigarea (inclusiv back/forward) către o consultație existentă iese din modul creare
  if (trackedRouteId !== routeId) {
    setTrackedRouteId(routeId)
    if (routeId && isCreatingState) setIsCreating(false)
  }
  const isCreating = isCreatingState && !routeId

  const [activeTab, setActiveTab] = useState<ConsultationTab>('anamneza')
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; patientName: string; date: string } | null>(null)
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [showLetter, setShowLetter] = useState(false)

  const { data: detailResp, isLoading: isDetailLoading } = useConsultationDetail(selectedId ?? '', !!selectedId && !isCreating)
  const detail: ConsultationDetailDto | null = detailResp?.data ?? null

  const setPageLabel = usePageHistoryStore((s) => s.setLabel)
  useEffect(() => {
    if (routeId && detail?.id.toLowerCase() === routeId.toLowerCase()) {
      setPageLabel(`/consultations/${routeId}`, `Consultație - ${detail.patientName}`)
    }
  }, [routeId, detail?.id, detail?.patientName, setPageLabel])

  const { data: selectedPatientResp } = usePatientDetail(
    selectedAppointment?.patientId ?? '',
    !!selectedAppointment?.patientId && isCreating,
  )
  const selectedPatient = selectedPatientResp?.data?.patient ?? null

  const { data: doctorLookupResp } = useDoctorLookup()
  const { data: patientLookupResp } = usePatientLookup()
  const doctorLookup  = useMemo(() => (doctorLookupResp?.data ?? []).map(d => ({ value: d.id, label: d.fullName })), [doctorLookupResp])
  const patientLookup = useMemo(() => (patientLookupResp?.data ?? []).map(p => ({ value: p.id, label: `${p.fullName} (${p.cnp})` })), [patientLookupResp])

  const deleteConsultation = useDeleteConsultation()

  const editor = useConsultationEditor({
    selectedId,
    detail,
    isCreating,
    onCreated: id => {
      setIsCreating(false)
      navigate(`/consultations/${id}`, { replace: true })
    },
  })
  const { form, isEditable, serverError, setServerError, successMsg, setSuccessMsg } = editor

  const statusCode = detail?.statusCode?.toUpperCase()
  const isLocked = statusCode === 'BLOCATA'
  const isBilled = statusCode === 'FACTURATA'
  const isFinalized = statusCode === 'FINALIZATA'

  /** Schimbă contextul (altă consultație / programare) doar după salvare reușită. */
  const afterFlush = async (action: () => void | Promise<void>) => {
    if (!(await editor.flushSave())) return
    await action()
  }

  const startCreating = (values: typeof EMPTY_CONSULTATION_FORM) => {
    navigate('/consultations')
    setIsCreating(true)
    setServerError(null)
    setActiveTab('anamneza')
    editor.resetEditor(values, EMPTY_DIAGNOSIS)
  }

  const handleSelectConsultation = (consultation: ConsultationListDto) => afterFlush(() => {
    setIsCreating(false)
    setSelectedAppointment(null)
    setServerError(null)
    setActiveTab('anamneza')
    navigate(`/consultations/${consultation.id}`)
  })

  const handleSelectAppointment = (appointment: AppointmentDto) => afterFlush(async () => {
    setSelectedAppointment(appointment)
    try {
      const existing = (await consultationsApi.getByAppointmentId(appointment.id))?.data ?? null
      if (existing) {
        setIsCreating(false)
        setServerError(null)
        setActiveTab('anamneza')
        navigate(`/consultations/${existing.id}`)
        return
      }
    } catch {
      // Verificarea a eșuat → se deschide o consultație nouă pe programare
    }
    // Aceeași regulă ca în Consultation_Create — verificată aici ca să nu se completeze o fișă respinsă la salvare
    if (appointment.statusCode?.toUpperCase() !== CONFIRMED_APPOINTMENT_CODE) {
      setSelectedAppointment(null)
      setServerError(APPOINTMENT_NOT_CONFIRMED)
      return
    }
    startCreating({
      ...EMPTY_CONSULTATION_FORM,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: todayISO,
      appointmentId: appointment.id,
    })
  })

  const handleNewConsultation = () => afterFlush(() => {
    setSelectedAppointment(null)
    startCreating(EMPTY_CONSULTATION_FORM)
  })

  const handleCancelCreate = () => {
    setIsCreating(false)
    setServerError(null)
    editor.clearDirty()
  }

  /** Un eșec de salvare pe fișa medicală blochează schimbarea tabului. */
  const handleTabChange = async (tab: ConsultationTab) => {
    if (tab === activeTab) return
    if (isEditable && !(await editor.flushSave())) return
    setActiveTab(tab)
  }

  const requestFinalize = async () => {
    if (!selectedId) return
    const check = await editor.checkFinalize()
    if (check === 'missing-diagnosis' && activeTab !== 'diagnostic') await handleTabChange('diagnostic')
    if (check === 'ok') setShowFinalizeConfirm(true)
  }

  const handleFinalize = async () => {
    if (!selectedId) return
    setIsFinalizing(true)
    await editor.finalize(selectedId)
    setIsFinalizing(false)
    setShowFinalizeConfirm(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteConsultation.mutateAsync(deleteTarget.id)
      if (selectedId === deleteTarget.id) {
        editor.clearDirty()
        setIsCreating(false)
        navigate('/consultations', { replace: true })
      }
      setSuccessMsg('Consultație ștearsă cu succes.')
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Eroare la ștergere.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const showDetail = isCreating || !!selectedId
  const savedDetail = !isCreating ? detail : null
  const actionMode = isCreating ? 'create' : !detail ? 'none' : isEditable ? 'edit' : (isFinalized || isBilled) ? 'readonly' : 'none'

  return (
    <div className={styles.page}>
      <ConsultationsSidebar
        isAdmin={isAdmin}
        todayISO={todayISO}
        doctors={doctorLookupResp?.data ?? []}
        doctorFilter={doctorFilter}
        onDoctorFilterChange={setDoctorFilter}
        effectiveDoctorId={effectiveDoctorId}
        activeAppointmentId={selectedAppointment?.id ?? null}
        activeConsultationId={isCreating ? null : selectedId}
        onNew={handleNewConsultation}
        onSelectAppointment={handleSelectAppointment}
        onSelectConsultation={handleSelectConsultation}
      />

      <main className={styles.detail}>
        {!showDetail && (
          <div className={styles.emptyState}>
            {serverError && <div className={styles.errorAlert} role="alert">✕ {serverError}</div>}
            <IconEmpty />
            <h3>Nicio consultație selectată</h3>
            <p>Selectați o consultație din lista din stânga sau creați una nouă.</p>
          </div>
        )}

        {showDetail && (
          <>
            <div aria-live="polite">
              {successMsg && <div className={styles.successAlert} role="status">✓ {successMsg}</div>}
              {serverError && <div className={styles.errorAlert} role="alert">✕ {serverError}</div>}
            </div>

            {isLocked && (
              <div className={styles.lockedBanner}><Lock size={14} /> Consultație blocată — doar citire</div>
            )}
            {isBilled && (
              <div className={styles.lockedBanner}><Lock size={14} /> Consultație facturată — doar citire. Corecțiile se fac prin stornarea documentului fiscal.</div>
            )}

            {savedDetail && (
              <>
                <header className={styles.pageHeader}>
                  <div className={styles.pageHeaderLeft}>
                    <h2 className={styles.pageHeaderTitle}>{isEditable ? 'Editare Consultație' : 'Consultație'}</h2>
                    <p className={styles.pageHeaderSub}>{savedDetail.patientName}</p>
                  </div>
                  <div className={styles.pageHeaderActions}>
                    <AppBadge variant={getConsultationStatusVariant(savedDetail.statusCode)} withDot>
                      {savedDetail.statusName}
                    </AppBadge>
                  </div>
                </header>
                <PatientCard
                  name={savedDetail.patientName}
                  cnp={savedDetail.patientCnp}
                  age={ageFromBirthDate(savedDetail.patientBirthDate)}
                  gender={genderLabel(savedDetail.patientGender)}
                  phone={savedDetail.patientPhone}
                  email={savedDetail.patientEmail}
                  date={savedDetail.date}
                />
              </>
            )}

            {isCreating && (
              <header className={styles.pageHeader}>
                <div className={styles.pageHeaderLeft}>
                  <h2 className={styles.pageHeaderTitle}>Consultație Nouă</h2>
                  <p className={styles.pageHeaderSub}>Completează fișa de consultație pentru pacient</p>
                </div>
              </header>
            )}

            {isCreating && selectedAppointment && (
              <PatientCard
                name={selectedPatient?.fullName ?? selectedAppointment.patientName}
                cnp={selectedPatient?.cnp ?? null}
                age={selectedPatient?.age ?? null}
                gender={selectedPatient?.genderName ?? null}
                date={todayISO}
              />
            )}

            {isCreating && !selectedAppointment && (
              <section className={styles.patientCardCreate}>
                <div className={styles.patientCardCreateTitle}>
                  <User size={16} /> DATE PACIENT
                </div>
                <div className={styles.formGrid}>
                  <FormSelect name="patientId" control={form.control} label="Pacient" options={patientLookup} required disabled={!isEditable} allowFiltering placeholder="Selectați pacientul..." />
                  <FormSelect name="doctorId" control={form.control} label="Medic" options={doctorLookup} required disabled={!isEditable} allowFiltering placeholder="Selectați medicul..." />
                  <FormDatePicker name="date" control={form.control} label="Data consultației" required disabled={!isEditable} format="dd.MM.yyyy" placeholder="Selectați data..." />
                </div>
              </section>
            )}

            {isDetailLoading && !isCreating && (
              <div className={styles.detailLoading}>Se încarcă...</div>
            )}

            {(isCreating || detail) && (
              <>
                <ConsultationTabBar activeTab={activeTab} detail={savedDetail} onChange={handleTabChange} />

                <div
                  className={styles.tabContent}
                  role="tabpanel"
                  id="consultation-tabpanel"
                  aria-labelledby={`consultation-tab-${activeTab}`}
                >
                  {activeTab === 'anamneza' && <AnamnezaTab control={form.control} isEditable={isEditable} />}
                  {activeTab === 'examen' && <ExamenClinicTab form={form} isEditable={isEditable} />}
                  {activeTab === 'investigatii' && (
                    <SectionPanel icon={<Microscope size={18} />} title="Investigații Paraclinice" unavailableMessage="Salvează consultația ca draft pentru a putea adăuga investigații.">
                      {savedDetail && selectedId ? (
                        <InvestigationsStep consultationId={selectedId} patientId={savedDetail.patientId} doctorId={savedDetail.doctorId} isEditable={isEditable} />
                      ) : null}
                    </SectionPanel>
                  )}
                  {activeTab === 'analize' && (
                    <SectionPanel icon={<FlaskConical size={18} />} title="Analize Medicale" unavailableMessage="Salvează consultația ca draft pentru a putea adăuga analize medicale.">
                      {savedDetail && selectedId ? (
                        <AnalizeMedicaleStep consultationId={selectedId} patientId={savedDetail.patientId} doctorId={savedDetail.doctorId} isEditable={isEditable} />
                      ) : null}
                    </SectionPanel>
                  )}
                  {activeTab === 'diagnostic' && (
                    <DiagnosticTab
                      form={form}
                      isEditable={isEditable}
                      consultationId={isCreating ? null : selectedId}
                      diagnosis={editor.diagnosis}
                      onDiagnosisChange={editor.updateDiagnosis}
                    />
                  )}
                  {activeTab === 'concluzii' && <ConcluziiTab form={form} isEditable={isEditable} />}
                  {activeTab === 'servicii' && (
                    <SectionPanel icon={<Receipt size={18} />} title="Servicii efectuate" unavailableMessage="Salvează consultația ca draft pentru a putea adăuga servicii.">
                      {savedDetail && selectedId ? (
                        <ConsultationServicesTab
                          consultationId={selectedId}
                          statusCode={savedDetail.statusCode ?? null}
                          canWrite={canWrite(MODULE.Consultations)}
                          onError={setServerError}
                        />
                      ) : null}
                    </SectionPanel>
                  )}
                </div>

                <ConsultationActionBar
                  mode={actionMode}
                  isSaving={editor.isSaving}
                  isDirty={editor.isDirty}
                  lastSavedAt={editor.lastSavedAt}
                  onCancelCreate={handleCancelCreate}
                  onSaveDraft={editor.saveDraft}
                  onDelete={() => detail && setDeleteTarget({ id: detail.id, patientName: detail.patientName, date: detail.date })}
                  onLetter={() => setShowLetter(true)}
                  onFinalize={requestFinalize}
                />
              </>
            )}
          </>
        )}
      </main>

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

      {showLetter && detail && (
        <ScrisoareMedicalaModal detail={detail} onClose={() => setShowLetter(false)} />
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
        isOpen={editor.leaveGuard.confirmLeave}
        title="Modificări nesalvate"
        message={<>Modificările nu au putut fi salvate{serverError ? `: ${serverError}` : '.'} Părăsiți pagina fără a le salva?</>}
        confirmLabel="Părăsește fără salvare"
        cancelLabel="Rămân pe pagină"
        confirmVariant="danger"
        onConfirm={editor.leaveGuard.leave}
        onCancel={editor.leaveGuard.stay}
      />
    </div>
  )
}

export default ConsultationsListPage

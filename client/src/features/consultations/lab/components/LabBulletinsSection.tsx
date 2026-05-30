import { useMemo, useState } from 'react'
import { useFeedback } from '@/hooks/useFeedback'
import { Save, History as HistoryIcon, GitCompare, X } from 'lucide-react'
import { AppButton } from '@/components/ui/AppButton'
import {
  useAnalysesResultsByConsultation,
  useAnalysesResultDetail,
  useCreateAnalysesResult,
  useUpdateAnalysesResult,
  useDeleteAnalysesResult,
} from '../hooks/useAnalysesResults'
import { useParseLabPdf } from '../hooks/useLab'
import { LabUploadButton } from './LabUploadButton'
import { LabParseResultTable } from './LabParseResultTable'
import { LabBulletinHeader } from './LabBulletinHeader'
import { LabComparisonView } from './LabComparisonView'
import type { LabBulletinPayload, LabResultRowDto } from '../types/lab.types'
import type { AnalysesResultDetailDto } from '../types/analysesResults.types'
import styles from '../AnalizeMedicaleStep.module.scss'
import { usePatientLookup } from '@/features/patients/hooks/usePatients'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'

interface Props {
  consultationId: string
  patientId: string
  doctorId: string
  isEditable: boolean
}

const todayISO = () => new Date().toISOString().substring(0, 10)

const emptyBulletin = (): LabBulletinPayload => ({
  laboratory: null,
  bulletinNumber: null,
  collectionDate: todayISO(),
  resultDate: null,
  patientName: null,
  doctor: null,
  results: [],
})

export const LabBulletinsSection = ({ consultationId, patientId, doctorId, isEditable }: Props) => {
  const { data: savedBulletins = [], isLoading } = useAnalysesResultsByConsultation(consultationId)
  const createMut = useCreateAnalysesResult(consultationId)
  const updateMut = useUpdateAnalysesResult(consultationId)
  const deleteMut = useDeleteAnalysesResult(consultationId)
  const parseMut = useParseLabPdf()
  const { errorMsg, showError, clearMessages } = useFeedback()

  // Rezolvare nume pacient si medic din lookup-uri (staleTime=Infinity, date deja incarcate)
  const { data: patientLookupResp } = usePatientLookup()
  const { data: doctorLookupResp } = useDoctorLookup()
  const defaultPatientName = useMemo(
    () => (patientLookupResp?.data ?? []).find((p) => p.id === patientId)?.fullName ?? null,
    [patientLookupResp, patientId],
  )
  const defaultDoctorName = useMemo(
    () => (doctorLookupResp?.data ?? []).find((d) => d.id === doctorId)?.fullName ?? null,
    [doctorLookupResp, doctorId],
  )

  // Buletin în lucru (din parsare PDF, adăugare manuală sau editare buletin existent)
  const [draft, setDraft] = useState<LabBulletinPayload | null>(null)
  // ID-ul buletinului existent care se editează (null = creare nouă)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Selecție pentru istoric & comparație
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(true)

  // Detail loader pentru bulletin selectat / comparație
  const { data: selectedDetail } = useAnalysesResultDetail(selectedHistoryId)
  const { data: compareA } = useAnalysesResultDetail(compareIds[0] ?? null)
  const { data: compareB } = useAnalysesResultDetail(compareIds[1] ?? null)

  const draftFromDetail = (detail: AnalysesResultDetailDto): LabBulletinPayload => ({
    laboratory: detail.laboratory,
    bulletinNumber: detail.bulletinNumber,
    collectionDate: detail.collectionDate,
    resultDate: detail.resultDate !== detail.collectionDate ? detail.resultDate : null,
    patientName: detail.patientName,
    doctor: detail.doctorName,
    results: detail.details.map((d) => ({
      section: d.section,
      testName: d.testName,
      value: d.value,
      unit: d.unit,
      referenceRange: d.referenceRange,
      refMin: d.refMin,
      refMax: d.refMax,
      flag: d.flag,
      method: d.method,
      notes: d.notes,
      category: d.category,
      subcategory: d.subcategory,
    })),
  })

  const handleParse = async (file: File) => {
    try {
      const result = await parseMut.mutateAsync(file)
      // Daca OCR a esuat fara rezultate, fallback la draft gol
      if (result.isScannedPdf && result.results.length === 0) {
        alert(result.parseWarning ?? 'PDF-ul pare scanat și OCR nu a putut extrage date. Introdu manual rezultatele.')
        setDraft(emptyBulletin())
        return
      }
      // Atentionare daca OCR a fost folosit (verificare obligatorie)
      if (result.isScannedPdf && result.parseWarning) {
        alert(result.parseWarning)
      }
      setDraft({
        laboratory: result.laboratory,
        bulletinNumber: result.bulletinNumber,
        collectionDate: result.collectionDate?.substring(0, 10) ?? todayISO(),
        resultDate: result.resultDate?.substring(0, 10) ?? null,
        patientName: result.patientName ?? defaultPatientName,
        doctor: result.doctor ?? defaultDoctorName,
        results: result.results,
      })
    } catch (err) {
      alert(`Eroare la parsare: ${(err as Error).message}`)
    }
  }

  const handleEditSaved = () => {
    if (!selectedDetail) return
    setDraft(draftFromDetail(selectedDetail))
    setEditingId(selectedDetail.id)
    setSelectedHistoryId(null)
  }

  const handleSave = async () => {
    if (!draft) return
    clearMessages()
    const details = draft.results.map((r) => ({
      section: r.section ?? 'GENERAL',
      testName: r.testName,
      value: r.value,
      unit: r.unit ?? null,
      referenceRange: r.referenceRange ?? null,
      refMin: r.refMin ?? null,
      refMax: r.refMax ?? null,
      flag: r.flag ?? null,
      method: r.method ?? null,
      notes: r.notes ?? null,
      category: r.category ?? null,
      subcategory: r.subcategory ?? null,
    }))
    try {
      if (editingId) {
        await updateMut.mutateAsync({
          id: editingId,
          payload: {
            laboratory: draft.laboratory,
            bulletinNumber: draft.bulletinNumber,
            collectionDate: draft.collectionDate ?? todayISO(),
            resultDate: draft.resultDate ?? null,
            doctorName: draft.doctor,
            details,
          },
        })
        setEditingId(null)
      } else {
        await createMut.mutateAsync({
          patientId,
          consultationId,
          laboratory: draft.laboratory,
          bulletinNumber: draft.bulletinNumber,
          collectionDate: draft.collectionDate ?? todayISO(),
          resultDate: draft.resultDate ?? null,
          doctorName: draft.doctor,
          details,
        })
      }
      setDraft(null)
    } catch (err) {
      showError(err)
    }
  }

  const handleDeleteSaved = async (id: string) => {
    if (!confirm('Ștergi acest buletin?')) return
    await deleteMut.mutateAsync(id)
    if (selectedHistoryId === id) setSelectedHistoryId(null)
    setCompareIds((p) => p.filter((x) => x !== id))
  }

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id]
      return [...prev, id]
    })
  }

  const isComparing = compareIds.length === 2 && compareA && compareB

  return (
    <div>
      {/* ── Bara upload + draft ──────────────────────────────────────── */}
      <div className={styles.uploadBar}>
        <LabUploadButton onPick={handleParse} isLoading={parseMut.isPending} disabled={!isEditable} />
        {!draft && isEditable && (
          <AppButton
            size="sm"
            variant="secondary"
            onClick={() => setDraft({ ...emptyBulletin(), patientName: defaultPatientName, doctor: defaultDoctorName })}
          >
            + Adaugă manual
          </AppButton>
        )}
        {draft && (
          <AppButton size="sm" variant="ghost" leftIcon={<X size={14} />} onClick={() => { setDraft(null); setEditingId(null) }}>
            Renunță la draft
          </AppButton>
        )}
      </div>

      {/* ── Draft (parsat sau manual) ───────────────────────────────── */}
      {draft && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fff', border: '1px solid #2563eb', borderRadius: 6 }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#1e40af' }}>
            {editingId ? 'Editare buletin salvat — modifică datele, apoi actualizează' : 'Buletin în lucru — verifică/editează apoi salvează'}
          </div>
          <LabBulletinHeader
            data={draft}
            onChange={(patch) => setDraft({ ...draft, ...patch } as LabBulletinPayload)}
            readOnly={!isEditable}
          />
          <LabParseResultTable
            rows={draft.results}
            onChange={(results: LabResultRowDto[]) => setDraft({ ...draft, results })}
            readOnly={!isEditable}
          />
          {isEditable && (
            <div style={{ marginTop: '0.75rem' }}>
              {errorMsg && (
                <div className="alert alert-danger py-2 mb-2" role="alert" style={{ fontSize: '0.85rem' }}>
                  {errorMsg}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <AppButton variant="ghost" size="sm" onClick={() => { setDraft(null); setEditingId(null) }}>Anulează</AppButton>
                <AppButton
                  variant="primary"
                  size="sm"
                  leftIcon={<Save size={14} />}
                  onClick={handleSave}
                  isLoading={editingId ? updateMut.isPending : createMut.isPending}
                  disabled={draft.results.length === 0}
                  title={draft.results.length === 0 ? 'Adaugă cel puțin un rezultat înainte de salvare' : undefined}
                >
                  {editingId ? 'Actualizează buletin' : 'Salvează buletin'}
                </AppButton>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Istoric ─────────────────────────────────────────────────── */}
      <div style={{ marginTop: '1.25rem' }}>
        <div className={styles.header}>
          <h4>
            <HistoryIcon size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Istoric buletine ({savedBulletins.length})
          </h4>
          <div style={{ display: 'flex', gap: 8 }}>
            {compareIds.length > 0 && (
              <AppButton size="sm" variant="ghost" onClick={() => setCompareIds([])}>
                Resetează comparație
              </AppButton>
            )}
            <AppButton size="sm" variant="ghost" onClick={() => setShowHistory((s) => !s)}>
              {showHistory ? 'Ascunde' : 'Afișează'}
            </AppButton>
          </div>
        </div>

        {showHistory && (
          <>
            {isLoading && <p>Se încarcă istoricul...</p>}
            {!isLoading && savedBulletins.length === 0 && (
              <div className={styles.empty}>Nu există buletine salvate pentru această consultație.</div>
            )}
            <div className={styles.history}>
              {savedBulletins.map((inv) => {
                const isSelected = inv.id === selectedHistoryId
                const isInCompare = compareIds.includes(inv.id)
                return (
                  <div
                    key={inv.id}
                    className={`${styles.historyCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => setSelectedHistoryId(isSelected ? null : inv.id)}
                  >
                    <div>
                      <strong>{new Date(inv.collectionDate).toLocaleDateString('ro-RO')}</strong>
                      {inv.laboratory && <span style={{ marginLeft: 8, color: '#64748b' }}>· {inv.laboratory}</span>}
                      <span style={{ marginLeft: 8, fontSize: '0.78rem', color: '#64748b' }}>· {inv.doctorName}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleCompare(inv.id)}
                        title={isInCompare ? 'Scoate din comparație' : 'Adaugă la comparație'}
                        style={{
                          background: isInCompare ? '#dbeafe' : 'transparent',
                          color: isInCompare ? '#1d4ed8' : '#64748b',
                          border: '1px solid #cbd5e1', borderRadius: 4,
                          padding: '0.2rem 0.4rem', cursor: 'pointer', fontSize: '0.75rem',
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        <GitCompare size={12} /> {isInCompare ? 'Selectat' : 'Compară'}
                      </button>
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSaved(inv.id)}
                          style={{ background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 4, padding: '0.2rem 0.5rem', cursor: 'pointer', color: '#b91c1c', fontSize: '0.75rem' }}
                        >
                          Șterge
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Vizualizare buletin selectat (read-only) */}
            {selectedHistoryId && selectedDetail && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9rem' }}>
                    Detalii buletin · {new Date(selectedDetail.collectionDate).toLocaleDateString('ro-RO')}
                  </strong>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {isEditable && (
                      <AppButton size="sm" variant="secondary" onClick={handleEditSaved}>
                        Editează
                      </AppButton>
                    )}
                    <AppButton size="sm" variant="ghost" leftIcon={<X size={12} />} onClick={() => setSelectedHistoryId(null)}>
                      Închide
                    </AppButton>
                  </div>
                </div>
                {(() => {
                  const data = draftFromDetail(selectedDetail)
                  return (
                    <>
                      <LabBulletinHeader data={data} onChange={() => {}} readOnly />
                      <LabParseResultTable rows={data.results} onChange={() => {}} readOnly />
                    </>
                  )
                })()}
              </div>
            )}

            {/* Comparație 2 buletine */}
            {isComparing && (
              <LabComparisonView
                bulletinA={{
                  date: compareA!.collectionDate,
                  data: draftFromDetail(compareA!),
                }}
                bulletinB={{
                  date: compareB!.collectionDate,
                  data: draftFromDetail(compareB!),
                }}
              />
            )}
            {compareIds.length === 1 && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#64748b' }}>
                Selectează încă un buletin pentru comparație.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

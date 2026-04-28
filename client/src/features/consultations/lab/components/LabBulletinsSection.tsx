import { useMemo, useState } from 'react'
import { Save, History as HistoryIcon, GitCompare, X } from 'lucide-react'
import { AppButton } from '@/components/ui/AppButton'
import {
  useInvestigationsByConsultation,
  useCreateInvestigation,
  useDeleteInvestigation,
} from '@/features/consultations/investigations/hooks/useInvestigations'
import { investigationsApi } from '@/api/endpoints/investigations.api'
import { useQuery } from '@tanstack/react-query'
import { useParseLabPdf } from '../hooks/useLab'
import { LabUploadButton } from './LabUploadButton'
import { LabParseResultTable } from './LabParseResultTable'
import { LabBulletinHeader } from './LabBulletinHeader'
import { LabComparisonView } from './LabComparisonView'
import type { LabBulletinPayload, LabResultRowDto } from '../types/lab.types'
import styles from '../AnalizeMedicaleStep.module.scss'

interface Props {
  consultationId: string
  patientId: string
  doctorId: string
  isEditable: boolean
}

const LAB_TYPE = 'LabResults'

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
  const { data: investigations = [], isLoading } = useInvestigationsByConsultation(consultationId)
  const createMut = useCreateInvestigation(consultationId)
  const deleteMut = useDeleteInvestigation(consultationId)
  const parseMut = useParseLabPdf()

  // Buletinele salvate (toate cu type=LabResults)
  const savedBulletins = useMemo(
    () => investigations.filter((i) => i.investigationType === LAB_TYPE),
    [investigations],
  )

  // Buletin în lucru (din parsare PDF sau adăugare manuală)
  const [draft, setDraft] = useState<LabBulletinPayload | null>(null)

  // Selecție pentru istoric & comparație
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(true)

  // Detail loader pentru bulletin selectat / comparație
  const { data: selectedDetail } = useQuery({
    queryKey: ['investigation-detail', selectedHistoryId],
    queryFn: () => investigationsApi.getById(selectedHistoryId!),
    enabled: !!selectedHistoryId,
  })

  const { data: compareA } = useQuery({
    queryKey: ['investigation-detail', compareIds[0]],
    queryFn: () => investigationsApi.getById(compareIds[0]!),
    enabled: compareIds.length === 2,
  })

  const { data: compareB } = useQuery({
    queryKey: ['investigation-detail', compareIds[1]],
    queryFn: () => investigationsApi.getById(compareIds[1]!),
    enabled: compareIds.length === 2,
  })

  const parseDraftFromInvestigation = (sd: string | null): LabBulletinPayload => {
    if (!sd) return emptyBulletin()
    try {
      const parsed = JSON.parse(sd) as Partial<LabBulletinPayload>
      return { ...emptyBulletin(), ...parsed, results: parsed.results ?? [] }
    } catch {
      return emptyBulletin()
    }
  }

  const handleParse = async (file: File) => {
    try {
      const result = await parseMut.mutateAsync(file)
      if (result.isScannedPdf) {
        alert(result.parseWarning ?? 'PDF-ul pare scanat. Introdu manual rezultatele.')
        setDraft(emptyBulletin())
        return
      }
      setDraft({
        laboratory: result.laboratory,
        bulletinNumber: result.bulletinNumber,
        collectionDate: result.collectionDate?.substring(0, 10) ?? todayISO(),
        resultDate: result.resultDate?.substring(0, 10) ?? null,
        patientName: result.patientName,
        doctor: result.doctor,
        results: result.results,
      })
    } catch (err) {
      alert(`Eroare la parsare: ${(err as Error).message}`)
    }
  }

  const handleSave = async () => {
    if (!draft) return
    if (draft.results.length === 0) {
      alert('Adaugă cel puțin un rezultat înainte de salvare.')
      return
    }
    const payload = {
      consultationId,
      patientId,
      doctorId,
      investigationType: LAB_TYPE,
      investigationDate: draft.collectionDate ?? todayISO(),
      structuredData: JSON.stringify(draft),
      narrative: null,
      isExternal: !!draft.laboratory,
      externalSource: draft.laboratory,
      status: 2 as const,    // Completed
      attachedDocumentId: null,
      hasStructuredData: true,
    }
    await createMut.mutateAsync(payload)
    setDraft(null)
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
          <AppButton size="sm" variant="secondary" onClick={() => setDraft(emptyBulletin())}>
            + Adaugă manual
          </AppButton>
        )}
        {draft && (
          <AppButton size="sm" variant="ghost" leftIcon={<X size={14} />} onClick={() => setDraft(null)}>
            Renunță la draft
          </AppButton>
        )}
      </div>

      {/* ── Draft (parsat sau manual) ───────────────────────────────── */}
      {draft && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fff', border: '1px solid #2563eb', borderRadius: 6 }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#1e40af' }}>
            Buletin în lucru — verifică/editează apoi salvează
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
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <AppButton variant="ghost" size="sm" onClick={() => setDraft(null)}>Anulează</AppButton>
              <AppButton variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSave} isLoading={createMut.isPending}>
                Salvează buletin
              </AppButton>
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
                      <strong>{new Date(inv.investigationDate).toLocaleDateString('ro-RO')}</strong>
                      {inv.externalSource && <span style={{ marginLeft: 8, color: '#64748b' }}>· {inv.externalSource}</span>}
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
                    Detalii buletin · {new Date(selectedDetail.investigationDate).toLocaleDateString('ro-RO')}
                  </strong>
                  <AppButton size="sm" variant="ghost" leftIcon={<X size={12} />} onClick={() => setSelectedHistoryId(null)}>
                    Închide
                  </AppButton>
                </div>
                {(() => {
                  const data = parseDraftFromInvestigation(selectedDetail.structuredData)
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
                  date: compareA!.investigationDate,
                  data: parseDraftFromInvestigation(compareA!.structuredData),
                }}
                bulletinB={{
                  date: compareB!.investigationDate,
                  data: parseDraftFromInvestigation(compareB!.structuredData),
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

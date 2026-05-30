import { useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { AppButton } from '@/components/ui/AppButton'
import {
  useCreateRecommendedAnalysis,
  useDeleteRecommendedAnalysis,
  useRecommendedAnalyses,
  useUpdateRecommendedAnalysis,
} from '../hooks/useLab'
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type AnalysisDictionaryDto,
  type AnalysisPriority,
  type RecommendedAnalysisStatus,
} from '../types/lab.types'
import { AnalysisPicker } from './AnalysisPicker'
import styles from '../AnalizeMedicaleStep.module.scss'

interface Props {
  consultationId: string
  patientId: string
  isEditable: boolean
}

export const RecommendedAnalysesSection = ({ consultationId, patientId, isEditable }: Props) => {
  const { data: rows = [], isLoading } = useRecommendedAnalyses(consultationId)
  const createMut = useCreateRecommendedAnalysis(consultationId)
  const updateMut = useUpdateRecommendedAnalysis(consultationId)
  const deleteMut = useDeleteRecommendedAnalysis(consultationId)

  // Stare formular adăugare
  const [showAdd, setShowAdd] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [picked, setPicked] = useState<AnalysisDictionaryDto | null>(null)
  const [priority, setPriority] = useState<AnalysisPriority>(1)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<RecommendedAnalysisStatus>(0)

  const reset = () => {
    setShowAdd(false)
    setPickerOpen(false)
    setPicked(null)
    setPriority(1)
    setNotes('')
    setStatus(0)
  }

  const handlePick = (item: AnalysisDictionaryDto) => {
    setPicked(item)
    setPickerOpen(false)
  }

  const handleSave = async () => {
    if (!picked) return
    await createMut.mutateAsync({
      consultationId,
      patientId,
      analysisId: picked.id,
      priority,
      notes: notes || null,
      status,
    })
    reset()
  }

  return (
    <div>
      <div className={styles.header}>
        <h4>Analize recomandate ({rows.length})</h4>
        {isEditable && !showAdd && (
          <AppButton size="sm" variant="primary" leftIcon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
            Adaugă
          </AppButton>
        )}
      </div>

      {showAdd && isEditable && (
        <div style={{ padding: '0.75rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, marginBottom: '0.5rem' }}>
          {!picked ? (
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#075985' }}>
                Selectează analiză din catalog:
              </label>
              <div style={{ marginTop: 6 }}>
                <button
                  type="button"
                  className={styles.pickerTrigger}
                  onClick={() => setPickerOpen(true)}
                >
                  <Search size={13} aria-hidden="true" style={{ flexShrink: 0 }} />
                  <span className={styles.pickerTriggerText}>Caută sau tastează o analiză…</span>
                </button>
              </div>
              <div style={{ marginTop: 8 }}>
                <AppButton size="sm" variant="secondary" onClick={reset}>Anulează</AppButton>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: '0.88rem' }}>{picked.name}</strong>
                {picked.category && <span style={{ color: '#64748b', fontSize: '0.78rem' }}>· {picked.category}</span>}
                <button
                  type="button"
                  style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: '0.78rem', padding: '2px 8px', color: '#475569' }}
                  onClick={() => setPicked(null)}
                >
                  Schimbă
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Prioritate</label>
                  <select value={priority} onChange={(e) => setPriority(Number(e.target.value) as AnalysisPriority)}
                          style={{ width: '100%', padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: 3 }}>
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Status inițial</label>
                  <select value={status} onChange={(e) => setStatus(Number(e.target.value) as RecommendedAnalysisStatus)}
                          style={{ width: '100%', padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: 3 }}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Observații</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                          style={{ width: '100%', padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: 3, fontFamily: 'inherit' }}
                          maxLength={1000} placeholder="Opțional..." />
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <AppButton size="sm" variant="primary" onClick={handleSave} isLoading={createMut.isPending}>Salvează</AppButton>
                <AppButton size="sm" variant="ghost" onClick={reset}>Anulează</AppButton>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AnalysisPicker — folosit pentru selectarea analizei în formularul de adăugare */}
      <AnalysisPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePick}
      />

      {isLoading && <p>Se încarcă...</p>}

      {!isLoading && rows.length === 0 && (
        <div className={styles.empty}>Nicio analiză recomandată.</div>
      )}

      {rows.length > 0 && (
        <table className={styles.recommendedTable}>
          <thead>
            <tr>
              <th>Analiza</th>
              <th>Categorie</th>
              <th style={{ width: 130 }}>Prioritate</th>
              <th>Observații</th>
              <th style={{ width: 130 }}>Status</th>
              {isEditable && <th style={{ width: 60 }}></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.analysisName}</td>
                <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {r.analysisCategory ?? '—'}
                </td>
                <td>
                  {isEditable ? (
                    <select
                      value={r.priority}
                      onChange={(e) => updateMut.mutate({
                        id: r.id, priority: Number(e.target.value) as AnalysisPriority,
                        notes: r.notes, status: r.status,
                      })}
                    >
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`${styles.priorityBadge} ${
                      r.priority === 3 ? styles.urgent : r.priority === 2 ? styles.high : r.priority === 1 ? styles.normal : styles.low
                    }`}>
                      {PRIORITY_LABELS[r.priority]}
                    </span>
                  )}
                </td>
                <td>
                  {isEditable ? (
                    <input
                      type="text"
                      defaultValue={r.notes ?? ''}
                      onBlur={(e) => {
                        if ((e.target.value || null) !== r.notes) {
                          updateMut.mutate({ id: r.id, priority: r.priority, notes: e.target.value || null, status: r.status })
                        }
                      }}
                    />
                  ) : (r.notes ?? '—')}
                </td>
                <td>
                  {isEditable ? (
                    <select
                      value={r.status}
                      onChange={(e) => updateMut.mutate({
                        id: r.id, priority: r.priority, notes: r.notes,
                        status: Number(e.target.value) as RecommendedAnalysisStatus,
                      })}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  ) : STATUS_LABELS[r.status]}
                </td>
                {isEditable && (
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Ștergi recomandarea pentru "${r.analysisName}"?`)) {
                          deleteMut.mutate(r.id)
                        }
                      }}
                      style={{ background: 'transparent', border: 0, cursor: 'pointer', color: '#b91c1c' }}
                      title="Șterge"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

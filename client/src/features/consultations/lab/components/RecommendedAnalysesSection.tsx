import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { AppButton } from '@/components/ui/AppButton'
import {
  useCreateRecommendedAnalysis,
  useDeleteRecommendedAnalysis,
  useRecommendedAnalyses,
  useSearchAnalyses,
  useUpdateRecommendedAnalysis,
} from '../hooks/useLab'
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type AnalysisDictionaryDto,
  type AnalysisPriority,
  type RecommendedAnalysisStatus,
} from '../types/lab.types'
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

  // Add row state
  const [showAdd, setShowAdd] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [picked, setPicked] = useState<AnalysisDictionaryDto | null>(null)
  const [priority, setPriority] = useState<AnalysisPriority>(1)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<RecommendedAnalysisStatus>(0)
  const [debouncedQ, setDebouncedQ] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQ), 250)
    return () => clearTimeout(t)
  }, [searchQ])

  const { data: suggestions = [], isFetching } = useSearchAnalyses(debouncedQ, showAdd && !picked)

  const reset = () => {
    setShowAdd(false)
    setSearchQ('')
    setPicked(null)
    setPriority(1)
    setNotes('')
    setStatus(0)
    setDebouncedQ('')
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
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#075985' }}>Caută analiză din dicționar:</label>
              <input
                type="text"
                autoFocus
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="ex: hemogramă, glicemie, TSH..."
                style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #cbd5e1', borderRadius: 4, marginTop: 4 }}
              />
              {isFetching && <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>Se caută...</div>}
              {suggestions.length > 0 && (
                <ul style={{
                  listStyle: 'none', margin: '4px 0 0', padding: 0, maxHeight: 240, overflowY: 'auto',
                  border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff',
                }}>
                  {suggestions.map((s) => (
                    <li
                      key={s.id}
                      onClick={() => setPicked(s)}
                      style={{ padding: '0.4rem 0.6rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}
                    >
                      <strong>{s.name}</strong>
                      {s.category && <span style={{ marginLeft: 6, color: '#64748b', fontSize: '0.75rem' }}>· {s.category}</span>}
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ marginTop: 8 }}>
                <AppButton size="sm" variant="secondary" onClick={reset}>Anulează</AppButton>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 8, fontSize: '0.88rem' }}>
                <strong>{picked.name}</strong>
                {picked.category && <span style={{ color: '#64748b' }}> · {picked.category}</span>}
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
                <AppButton size="sm" variant="secondary" onClick={() => setPicked(null)}>Schimbă analiza</AppButton>
                <AppButton size="sm" variant="ghost" onClick={reset}>Anulează</AppButton>
              </div>
            </div>
          )}
        </div>
      )}

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

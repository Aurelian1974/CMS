import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCnasStats, useCnasSyncHistory, useTriggerCnasSync, useCnasSyncStatus, cnasKeys } from '@/features/cnas/hooks/useCnas'
import { AppButton } from '@/components/ui/AppButton'
import type { CnasSyncHistoryDto } from '@/features/cnas/types/cnas.types'

const fmt = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('ro-RO'))
const fmtDate = (s: string | null | undefined) => {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; label: string }> = {
    Running: { bg: '#0d6efd', label: 'În curs…' },
    Success: { bg: '#198754', label: 'Succes' },
    Failed:  { bg: '#dc3545', label: 'Eșuat' },
  }
  const s = map[status] ?? { bg: '#6c757d', label: status }
  return (
    <span style={{
      display: 'inline-block', padding: '0.15rem 0.55rem',
      borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
      background: s.bg, color: '#fff', letterSpacing: '0.02em',
    }}>
      {s.label}
    </span>
  )
}

export const CnasSyncCard = () => {
  const queryClient  = useQueryClient()
  const { data: statsResp, isLoading: statsLoading } = useCnasStats()
  const { data: historyResp } = useCnasSyncHistory(10)
  const triggerSync  = useTriggerCnasSync()

  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const { data: jobStatus } = useCnasSyncStatus(activeJobId)

  // Oprire polling când jobul se termină + refresh stats
  useEffect(() => {
    if (!activeJobId) return
    const status = jobStatus?.data?.status
    if (status === 'Success' || status === 'Failed') {
      setActiveJobId(null)
      queryClient.invalidateQueries({ queryKey: cnasKeys.stats() })
      queryClient.invalidateQueries({ queryKey: cnasKeys.history() })
    }
  }, [jobStatus, activeJobId, queryClient])

  const stats   = statsResp?.data
  const history = historyResp?.data ?? []
  const isRunning = activeJobId !== null && jobStatus?.data?.status === 'Running'

  const handleSync = () => {
    triggerSync.mutate(undefined, {
      onSuccess: (resp) => {
        if (resp.data) setActiveJobId(resp.data)
      },
    })
  }

  return (
    <div style={{
      background: '#fff', borderRadius: '0.75rem',
      boxShadow: '0 1px 3px rgba(0,0,0,.08)', padding: '1.5rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e9ecef' }}>
        <h5 style={{ margin: 0, fontWeight: 600, color: '#495057', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IconCnas />
          Nomenclator CNAS — Farmacii
        </h5>
        <AppButton
          variant="primary"
          onClick={handleSync}
          isLoading={isRunning || triggerSync.isPending}
          loadingText="Sincronizare în curs…"
          disabled={isRunning || triggerSync.isPending}
        >
          Sincronizează CNAS
        </AppButton>
      </div>

      {/* Status job activ */}
      {activeJobId && jobStatus?.data && (
        <div style={{
          marginBottom: '1rem', padding: '0.75rem 1rem',
          background: '#e8f4fd', borderRadius: '0.5rem',
          border: '1px solid #bee3f8', fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          {isRunning && (
            <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #0d6efd', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          )}
          <span>
            {isRunning
              ? 'Sincronizare în desfășurare… polling activ.'
              : jobStatus.data.status === 'Success'
                ? `Sincronizare completă ✓ — Medicamente: +${fmt(jobStatus.data.drugsInserted)} / actualizate ${fmt(jobStatus.data.drugsUpdated)}`
                : `Eșec: ${jobStatus.data.errorMessage ?? 'Eroare necunoscută'}`}
          </span>
        </div>
      )}

      {/* Stats grid */}
      {statsLoading ? (
        <p style={{ color: '#6c757d', fontSize: '0.875rem' }}>Se încarcă statisticile…</p>
      ) : stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <StatBox label="Total medicamente" value={fmt(stats.totalDrugs)} />
          <StatBox label="Medicamente active" value={fmt(stats.activeDrugs)} />
          <StatBox label="Medicamente compensate" value={fmt(stats.compensatedDrugs)} />
          <StatBox label="Ultima sincronizare" value={fmtDate(stats.lastSyncAt)} span />
          <StatBox label="Versiune nomenclator" value={stats.lastSyncVersion ?? '—'} />
          <StatBox label="Status ultima sync" value={stats.lastSyncStatus ?? '—'} />
        </div>
      ) : null}

      {/* Istoric */}
      {history.length > 0 && (
        <>
          <h6 style={{ fontWeight: 600, color: '#495057', marginBottom: '0.75rem' }}>Istoric sincronizări</h6>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                  {['Data', 'Status', 'Versiune', 'Med. +', 'Med. ~', 'Comp. +', 'Subst. +', 'Durata', 'Declanșat de'].map(h => (
                    <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: '#6c757d', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row: CnasSyncHistoryDto) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.4rem 0.6rem', whiteSpace: 'nowrap' }}>{fmtDate(row.startedAt)}</td>
                    <td style={{ padding: '0.4rem 0.6rem' }}>{statusBadge(row.status)}</td>
                    <td style={{ padding: '0.4rem 0.6rem' }}>{row.nomenclatorVersion ?? '—'}</td>
                    <td style={{ padding: '0.4rem 0.6rem' }}>{fmt(row.drugsInserted)}</td>
                    <td style={{ padding: '0.4rem 0.6rem' }}>{fmt(row.drugsUpdated)}</td>
                    <td style={{ padding: '0.4rem 0.6rem' }}>{fmt(row.compensatedInserted)}</td>
                    <td style={{ padding: '0.4rem 0.6rem' }}>{fmt(row.activeSubstsInserted)}</td>
                    <td style={{ padding: '0.4rem 0.6rem' }}>{row.durationSeconds != null ? `${row.durationSeconds}s` : '—'}</td>
                    <td style={{ padding: '0.4rem 0.6rem', color: '#6c757d' }}>{row.triggeredBy ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {history.some(r => r.status === 'Failed') && (
            <div style={{ marginTop: '0.5rem' }}>
              {history.filter(r => r.status === 'Failed').slice(0, 1).map(r => (
                <p key={r.id} style={{ fontSize: '0.78rem', color: '#dc3545', margin: 0 }}>
                  Ultima eroare: {r.errorMessage ?? 'Detalii indisponibile'}
                </p>
              ))}
            </div>
          )}
        </>
      )}

      {/* CSS pentru animație spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const StatBox = ({ label, value, span }: { label: string; value: string; span?: boolean }) => (
  <div style={{
    background: '#f8f9fa', borderRadius: '0.5rem', padding: '0.75rem 1rem',
    ...(span ? { gridColumn: 'span 1' } : {}),
  }}>
    <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '0.25rem' }}>{label}</div>
    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#212529' }}>{value}</div>
  </div>
)

const IconCnas = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d6efd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
  </svg>
)

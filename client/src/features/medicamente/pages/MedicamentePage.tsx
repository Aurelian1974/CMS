import { useState, useCallback } from 'react'
import { Pill, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAnmStats, useTriggerAnmSync, useAnmSyncStatus, anmKeys } from '../../anm/hooks/useAnm'
import { useCnasDrugs, useCnasStats, useTriggerCnasSync, useCnasSyncStatus, cnasKeys } from '../../cnas/hooks/useCnas'
import { CnasPagination } from '../../cnas/components/CnasPagination'
import styles from '../../cnas/pages/CnasPage.module.scss'

const PAGE_SIZE = 20

export default function MedicamentePage() {
  const qc = useQueryClient()

  // ── State ────────────────────────────────────────────────────────────────
  const [search, setSearch]               = useState('')
  const [isActive, setIsActive]           = useState<boolean | undefined>(true)
  const [isCompensated, setIsCompensated] = useState<boolean | undefined>(undefined)
  const [page, setPage]                   = useState(1)

  // ── State sync jobs ───────────────────────────────────────────────────────
  const [anmJobId, setAnmJobId]   = useState<string | null>(null)
  const [cnasJobId, setCnasJobId] = useState<string | null>(null)

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: cnasData, isLoading, isError } = useCnasDrugs({
    search: search || undefined,
    isActive,
    isCompensated,
    page,
    pageSize: PAGE_SIZE,
  })

  // ── Stats & sync ─────────────────────────────────────────────────────────
  const { data: anmStatsData }  = useAnmStats()
  const { data: cnasStatsData } = useCnasStats()
  const anmStats  = anmStatsData?.data
  const cnasStats = cnasStatsData?.data

  const triggerAnmSync  = useTriggerAnmSync()
  const triggerCnasSync = useTriggerCnasSync()

  const { data: anmSyncStatus }  = useAnmSyncStatus(anmJobId)
  const { data: cnasSyncStatus } = useCnasSyncStatus(cnasJobId)

  const anmSyncRunning  = anmSyncStatus?.data?.status === 'Running' || triggerAnmSync.isPending
  const cnasSyncRunning = cnasSyncStatus?.data?.status === 'Running' || triggerCnasSync.isPending

  const handleAnmSync = async () => {
    const res = await triggerAnmSync.mutateAsync()
    if (res?.data) setAnmJobId(res.data)
  }

  const handleCnasSync = async () => {
    const res = await triggerCnasSync.mutateAsync()
    if (res?.data) setCnasJobId(res.data)
  }

  if (cnasSyncStatus?.data?.status === 'Success' && cnasJobId) {
    qc.invalidateQueries({ queryKey: cnasKeys.drugs() })
    qc.invalidateQueries({ queryKey: cnasKeys.stats() })
    qc.invalidateQueries({ queryKey: anmKeys.stats() })
  }
  if (anmSyncStatus?.data?.status === 'Success' && anmJobId) {
    qc.invalidateQueries({ queryKey: cnasKeys.drugs() })
    qc.invalidateQueries({ queryKey: anmKeys.stats() })
  }

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }, [])

  const result = cnasData?.data
  const items  = result?.items ?? []

  const formatDate = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleDateString('ro-RO', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      : null

  const SyncAlertAnm = () => {
    if (!anmJobId || !anmSyncStatus?.data) return null
    const s = anmSyncStatus.data
    const cls = s.status === 'Success' ? 'alert-success' : s.status === 'Failed' ? 'alert-danger' : 'alert-info'
    return (
      <div className={`alert d-flex align-items-center gap-2 py-2 ${cls}`} style={{ fontSize: '0.85rem' }}>
        {s.status === 'Success' && <CheckCircle size={16} />}
        {s.status === 'Failed'  && <XCircle size={16} />}
        {s.status === 'Running' && <Loader2 size={16} className="spin" />}
        <strong>ANM:</strong>&nbsp;
        {s.status === 'Running' && 'Sincronizare în curs…'}
        {s.status === 'Failed'  && `Eroare: ${s.errorMessage ?? 'necunoscută'}`}
        {s.status === 'Success' && `Reușit — ${s.totalInserted ?? 0} inserate, ${s.totalUpdated ?? 0} actualizate (${s.durationSeconds ?? 0}s)`}
      </div>
    )
  }

  const SyncAlertCnas = () => {
    if (!cnasJobId || !cnasSyncStatus?.data) return null
    const s = cnasSyncStatus.data
    const cls = s.status === 'Success' ? 'alert-success' : s.status === 'Failed' ? 'alert-danger' : 'alert-info'
    return (
      <div className={`alert d-flex align-items-center gap-2 py-2 ${cls}`} style={{ fontSize: '0.85rem' }}>
        {s.status === 'Success' && <CheckCircle size={16} />}
        {s.status === 'Failed'  && <XCircle size={16} />}
        {s.status === 'Running' && <Loader2 size={16} className="spin" />}
        <strong>CNAS:</strong>&nbsp;
        {s.status === 'Running' && 'Sincronizare în curs…'}
        {s.status === 'Failed'  && `Eroare: ${s.errorMessage ?? 'necunoscută'}`}
        {s.status === 'Success' && `Reușit — ${s.drugsInserted ?? 0} medicamente inserate, ${s.drugsUpdated ?? 0} actualizate (${s.durationSeconds ?? 0}s)`}
      </div>
    )
  }

  return (
    <div className={styles.pageWrapper}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <Pill size={20} strokeWidth={1.75} />
        <h1>Medicamente</h1>

        <div className="d-flex flex-column ms-auto" style={{ fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--bs-secondary)' }}>
          {anmStats && (
            <span>ANM omologate: {anmStats.totalDrugs.toLocaleString()}
              {anmStats.lastSyncAt ? ` · ${formatDate(anmStats.lastSyncAt)}` : ' · nesincronizat'}
            </span>
          )}
          {cnasStats && (
            <span>CNAS compensate: {cnasStats.compensatedDrugs.toLocaleString()}
              {cnasStats.lastSyncAt ? ` · sincronizat ${formatDate(cnasStats.lastSyncAt)}` : ' · nesincronizat'}
            </span>
          )}
        </div>

        <button
          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 ms-3"
          onClick={handleAnmSync}
          disabled={anmSyncRunning}
          title="Descarcă și importă nomenclatorul ANM"
        >
          {anmSyncRunning ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
          {anmSyncRunning ? 'Sincronizează ANM…' : 'Sincronizează ANM'}
        </button>

        <button
          className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
          onClick={handleCnasSync}
          disabled={cnasSyncRunning}
          title="Descarcă și importă nomenclatorul CNAS"
        >
          {cnasSyncRunning ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
          {cnasSyncRunning ? 'Sincronizează CNAS…' : 'Sincronizează CNAS'}
        </button>
      </div>

      <SyncAlertAnm />
      <SyncAlertCnas />

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <input
          type="text"
          className="form-control"
          placeholder="Caută după denumire, cod sau substanță activă…"
          value={search}
          onChange={handleSearch}
          style={{ maxWidth: 380 }}
        />
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={isActive === undefined ? '' : String(isActive)}
          onChange={(e) => { setIsActive(e.target.value === '' ? undefined : e.target.value === 'true'); setPage(1) }}
        >
          <option value="true">Doar active</option>
          <option value="">Toate stările</option>
          <option value="false">Inactive</option>
        </select>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={isCompensated === undefined ? '' : String(isCompensated)}
          onChange={(e) => { setIsCompensated(e.target.value === '' ? undefined : e.target.value === 'true'); setPage(1) }}
        >
          <option value="">Toate (CNAS)</option>
          <option value="true">Compensate</option>
          <option value="false">Necompensate</option>
        </select>
        {result && (
          <span className="badge bg-secondary ms-auto" style={{ fontSize: '0.72rem', alignSelf: 'center' }}>
            {result.totalCount.toLocaleString()} medicamente
          </span>
        )}
      </div>

      {isLoading && <div className="d-flex justify-content-center py-4"><div className="spinner-border text-primary" role="status" /></div>}
      {isError   && <div className="alert alert-danger">Eroare la încărcarea medicamentelor.</div>}

      {!isLoading && !isError && (
        <>
          <div className={styles.tableWrapper}>
            {items.length === 0 ? (
              <div className={styles.emptyState}>
                Niciun medicament găsit.
              </div>
            ) : (
              <table className={styles.cnasTable}>
                <thead>
                  <tr>
                    <th>Cod CNAS</th>
                    <th>Denumire CNAS</th>
                    <th>Den. comercială ANM</th>
                    <th>Substanță activă</th>
                    <th>Formă farm.</th>
                    <th>Mod prezentare</th>
                    <th>Regim pres.</th>
                    <th>Concentrație</th>
                    <th>ATC</th>
                    <th>Preț (RON)</th>
                    <th>Liste CNAS</th>
                    <th>Producător</th>
                    <th>Țară ANM</th>
                    <th>Stare</th>
                    <th>În ANM</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d.code}>
                      <td><code>{d.code}</code></td>
                      <td title={d.name}>{d.name}</td>
                      <td title={d.anmCommercialName ?? ''}>{d.anmCommercialName ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.activeSubstanceCode ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.pharmaceuticalForm ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.presentationMode ?? <span className={styles.noData}>—</span>}</td>
                      <td>
                        {d.prescriptionMode
                          ? <span className={styles.tagCompensated}>{d.prescriptionMode}</span>
                          : <span className={styles.noData}>—</span>}
                      </td>
                      <td>{d.concentration ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.atcCode ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.pricePerPackage != null ? d.pricePerPackage.toFixed(2) : <span className={styles.noData}>—</span>}</td>
                      <td>
                        {d.copaymentLists
                          ? <span className={styles.tagActive}>{d.copaymentLists}</span>
                          : <span className={styles.noData}>—</span>}
                      </td>
                      <td title={d.company ?? ''}>{d.company ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.anmCountry ?? <span className={styles.noData}>—</span>}</td>
                      <td>
                        <span className={d.isActive ? styles.tagActive : styles.tagInactive}>
                          {d.isActive ? 'Activ' : 'Inactiv'}
                        </span>
                      </td>
                      <td>
                        {d.isInAnm
                          ? <span className={styles.tagActive}>Da</span>
                          : <span className={styles.noData}>Nu</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <CnasPagination
            page={page}
            totalPages={result?.totalPages ?? 0}
            totalCount={result?.totalCount ?? 0}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  )
}

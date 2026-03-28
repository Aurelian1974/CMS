import { useState, useCallback } from 'react'
import { Pill, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useAnmDrugs, useAnmStats, useTriggerAnmSync, useAnmSyncStatus } from '../hooks/useAnm'
import styles from '../../cnas/pages/CnasPage.module.scss'

const PAGE_SIZE = 20

export default function AnmDrugsPage() {
  const [search, setSearch]     = useState('')
  const [isActive, setIsActive] = useState<boolean | undefined>(true)
  const [page, setPage]         = useState(1)
  const [syncJobId, setSyncJobId] = useState<string | null>(null)

  const { data, isLoading, isError } = useAnmDrugs({
    search: search || undefined,
    isActive,
    page,
    pageSize: PAGE_SIZE,
  })

  const { data: statsData } = useAnmStats()
  const stats = statsData?.data

  const triggerSync = useTriggerAnmSync()
  const { data: syncStatus } = useAnmSyncStatus(syncJobId)
  const syncRunning = syncStatus?.data?.status === 'Running' || triggerSync.isPending

  const handleSync = async () => {
    const res = await triggerSync.mutateAsync()
    if (res?.data) setSyncJobId(res.data)
  }

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }, [])

  const result     = data?.data
  const items      = result?.items ?? []
  const totalPages = result?.totalPages ?? 0

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <Pill size={20} strokeWidth={1.75} />
        <h1>Medicamente ANM</h1>
        {result && (
          <span className="badge bg-secondary">{result.totalCount.toLocaleString()}</span>
        )}
        {stats && (
          <span className="text-muted ms-auto" style={{ fontSize: '0.8rem' }}>
            {stats.lastSyncAt
              ? `Ultima sincronizare: ${new Date(stats.lastSyncAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              : 'Nicio sincronizare efectuată'}
          </span>
        )}
        <button
          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
          onClick={handleSync}
          disabled={syncRunning}
          title="Descarcă și importă nomenclatorul de pe nomenclator.anm.ro"
        >
          {syncRunning
            ? <Loader2 size={14} className="spin" />
            : <RefreshCw size={14} />}
          {syncRunning ? 'Se sincronizează…' : 'Sincronizează ANM'}
        </button>
      </div>

      {/* Status sync job */}
      {syncJobId && syncStatus?.data && (
        <div className={`alert d-flex align-items-center gap-2 py-2 ${
          syncStatus.data.status === 'Success' ? 'alert-success' :
          syncStatus.data.status === 'Failed'  ? 'alert-danger'  :
          'alert-info'
        }`} style={{ fontSize: '0.85rem' }}>
          {syncStatus.data.status === 'Success' && <CheckCircle size={16} />}
          {syncStatus.data.status === 'Failed'  && <XCircle size={16} />}
          {syncStatus.data.status === 'Running' && <Loader2 size={16} className="spin" />}
          {syncStatus.data.status === 'Running' && 'Sincronizare în curs…'}
          {syncStatus.data.status === 'Success' && (
            `Sincronizare reușită — ${syncStatus.data.totalInserted ?? 0} inserate, ${syncStatus.data.totalUpdated ?? 0} actualizate (${syncStatus.data.durationSeconds ?? 0}s)`
          )}
          {syncStatus.data.status === 'Failed' && (
            `Eroare: ${syncStatus.data.errorMessage ?? 'necunoscută'}`
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          type="text"
          className="form-control"
          placeholder="Caută după denumire comercială, DCI/INN sau cod autorizare…"
          value={search}
          onChange={handleSearch}
          style={{ maxWidth: 380 }}
        />
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={isActive === undefined ? '' : String(isActive)}
          onChange={(e) => {
            setIsActive(e.target.value === '' ? undefined : e.target.value === 'true')
            setPage(1)
          }}
        >
          <option value="true">Doar active</option>
          <option value="">Toate</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      )}
      {isError && (
        <div className="alert alert-danger">Eroare la încărcarea medicamentelor ANM.</div>
      )}

      {/* Tabel */}
      {!isLoading && !isError && (
        <>
          <div className={styles.tableWrapper}>
            {items.length === 0 ? (
              <div className={styles.emptyState}>
                {stats?.totalDrugs === 0
                  ? 'Nomenclatorul ANM nu a fost importat încă. Apăsați "Sincronizează ANM".'
                  : 'Niciun medicament găsit.'}
              </div>
            ) : (
              <table className={styles.cnasTable}>
                <thead>
                  <tr>
                    <th>Cod autorizare</th>
                    <th>Denumire comercială</th>
                    <th>DCI / INN</th>
                    <th>Formă farmaceutică</th>
                    <th>Cod ATC</th>
                    <th>Mod eliberare</th>
                    <th>Producător</th>
                    <th>Țară</th>
                    <th>Stare</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d.authorizationCode}>
                      <td><code>{d.authorizationCode}</code></td>
                      <td title={d.commercialName}>{d.commercialName}</td>
                      <td title={d.innName ?? ''}>{d.innName ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.pharmaceuticalForm ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.atcCode ?? <span className={styles.noData}>—</span>}</td>
                      <td>
                        {d.dispenseMode
                          ? <span className={styles.tagCompensated}>{d.dispenseMode}</span>
                          : <span className={styles.noData}>—</span>}
                      </td>
                      <td title={d.company ?? ''}>{d.company ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.country ?? <span className={styles.noData}>—</span>}</td>
                      <td>
                        <span className={d.isActive ? styles.tagActive : styles.tagInactive}>
                          {d.isActive ? 'Activ' : 'Inactiv'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginare */}
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>{result?.totalCount.toLocaleString() ?? 0} înregistrări</span>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >‹</button>
            <span className={styles.pageInfo}>{page} / {totalPages || 1}</span>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >›</button>
          </div>
        </>
      )}
    </div>
  )
}

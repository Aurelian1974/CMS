import { useState, useCallback } from 'react'
import { Pill } from 'lucide-react'
import { useCnasDrugs } from '../hooks/useCnas'
import { CnasPagination } from '../components/CnasPagination'
import styles from './CnasPage.module.scss'

const PAGE_SIZE = 20

export default function CnasDrugsPage() {
  const [search, setSearch]           = useState('')
  const [isActive, setIsActive]       = useState<boolean | undefined>(true)
  const [isCompensated, setIsCompensated] = useState<boolean | undefined>(undefined)
  const [page, setPage]               = useState(1)

  const { data, isLoading, isError } = useCnasDrugs({
    search: search || undefined,
    isActive,
    isCompensated,
    page,
    pageSize: PAGE_SIZE,
  })

  const result    = data?.data
  const items     = result?.items ?? []
  const totalPages = result?.totalPages ?? 0

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }, [])

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <Pill size={20} strokeWidth={1.75} />
        <h1>Medicamente CNAS</h1>
        {result && (
          <span className="badge bg-secondary">{result.totalCount.toLocaleString()}</span>
        )}
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          className="form-control"
          placeholder="Caută după nume, cod, substanță activă…"
          value={search}
          onChange={handleSearch}
          style={{ maxWidth: 360 }}
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
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={isCompensated === undefined ? '' : String(isCompensated)}
          onChange={(e) => {
            setIsCompensated(e.target.value === '' ? undefined : e.target.value === 'true')
            setPage(1)
          }}
        >
          <option value="">Toate</option>
          <option value="true">Compensate</option>
          <option value="false">Necompensate</option>
        </select>
      </div>

      {isLoading && (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      )}

      {isError && (
        <div className="alert alert-danger">Eroare la încărcarea medicamentelor.</div>
      )}

      {!isLoading && !isError && (
        <>
          <div className={styles.tableWrapper}>
            {items.length === 0 ? (
              <div className={styles.emptyState}>Niciun medicament găsit.</div>
            ) : (
              <table className={styles.cnasTable}>
                <thead>
                  <tr>
                    <th>Cod</th>
                    <th>Denumire</th>
                    <th>Substanță activă</th>
                    <th>Formă farm.</th>
                    <th>Mod prezentare</th>
                    <th>Regim pres.</th>
                    <th>Concentrație</th>
                    <th>ATC</th>
                    <th style={{ textAlign: 'right' }}>Preț (RON)</th>
                    <th>Stare</th>
                    <th>Comp.</th>
                    <th>Producător</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d.code}>
                      <td><code>{d.code}</code></td>
                      <td title={d.name}>{d.name}</td>
                      <td title={d.activeSubstanceCode ?? ''}>{d.activeSubstanceCode ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.pharmaceuticalForm ?? <span className={styles.noData}>—</span>}</td>
                      <td title={d.presentationMode ?? ''}>{d.presentationMode ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.prescriptionMode ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.concentration ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.atcCode ?? <span className={styles.noData}>—</span>}</td>
                      <td style={{ textAlign: 'right' }}>
                        {d.pricePerPackage != null ? d.pricePerPackage.toFixed(2) : <span className={styles.noData}>—</span>}
                      </td>
                      <td>
                        <span className={d.isActive ? styles.tagActive : styles.tagInactive}>
                          {d.isActive ? 'Activ' : 'Inactiv'}
                        </span>
                      </td>
                      <td>
                        {d.isCompensated && (
                          <span className={styles.tagCompensated}>Compensat</span>
                        )}
                      </td>
                      <td>{d.company ?? <span className={styles.noData}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <CnasPagination
            page={page}
            totalPages={totalPages}
            totalCount={result?.totalCount ?? 0}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  )
}

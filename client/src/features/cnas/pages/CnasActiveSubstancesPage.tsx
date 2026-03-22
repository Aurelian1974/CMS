import { useState, useCallback } from 'react'
import { FlaskConical } from 'lucide-react'
import { useCnasActiveSubstances } from '../hooks/useCnas'
import { CnasPagination } from '../components/CnasPagination'
import { formatDate } from '../../../utils/format'
import styles from './CnasPage.module.scss'

const PAGE_SIZE = 20

export default function CnasActiveSubstancesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading, isError } = useCnasActiveSubstances({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const result     = data?.data
  const items      = result?.items ?? []
  const totalPages = result?.totalPages ?? 0

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }, [])

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <FlaskConical size={20} strokeWidth={1.75} />
        <h1>Substanțe Active CNAS</h1>
        {result && (
          <span className="badge bg-secondary">{result.totalCount.toLocaleString()}</span>
        )}
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          className="form-control"
          placeholder="Caută substanță activă…"
          value={search}
          onChange={handleSearch}
          style={{ maxWidth: 360 }}
        />
      </div>

      {isLoading && (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      )}

      {isError && (
        <div className="alert alert-danger">Eroare la încărcarea substanțelor active.</div>
      )}

      {!isLoading && !isError && (
        <>
          <div className={styles.tableWrapper}>
            {items.length === 0 ? (
              <div className={styles.emptyState}>Nicio substanță activă găsită.</div>
            ) : (
              <table className={styles.cnasTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cod substanță activă</th>
                    <th>Valabil de la</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d, i) => (
                    <tr key={d.code}>
                      <td className={styles.noData}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td>{d.code}</td>
                      <td>{d.validFrom ? formatDate(d.validFrom) : <span className={styles.noData}>—</span>}</td>
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

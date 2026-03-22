import { useState, useCallback } from 'react'
import { GitBranch } from 'lucide-react'
import { useCnasAtcCodes } from '../hooks/useCnas'
import { CnasPagination } from '../components/CnasPagination'
import styles from './CnasPage.module.scss'

const PAGE_SIZE = 20

export default function CnasAtcPage() {
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading, isError } = useCnasAtcCodes({
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
        <GitBranch size={20} strokeWidth={1.75} />
        <h1>Clasificare ATC</h1>
        {result && (
          <span className="badge bg-secondary">{result.totalCount.toLocaleString()}</span>
        )}
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          className="form-control"
          placeholder="Caută cod sau descriere ATC…"
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
        <div className="alert alert-danger">Eroare la încărcarea codurilor ATC.</div>
      )}

      {!isLoading && !isError && (
        <>
          <div className={styles.tableWrapper}>
            {items.length === 0 ? (
              <div className={styles.emptyState}>Niciun cod ATC găsit.</div>
            ) : (
              <table className={styles.cnasTable}>
                <thead>
                  <tr>
                    <th>Cod ATC</th>
                    <th>Descriere</th>
                    <th>Cod părinte</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d.code}>
                      <td><code>{d.code}</code></td>
                      <td title={d.description ?? ''}>{d.description ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.parentATC ? <code>{d.parentATC}</code> : <span className={styles.noData}>—</span>}</td>
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

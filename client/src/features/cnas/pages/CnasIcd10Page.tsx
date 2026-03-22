import { useState, useCallback } from 'react'
import { Stethoscope } from 'lucide-react'
import { useCnasIcd10Codes } from '../hooks/useCnas'
import { CnasPagination } from '../components/CnasPagination'
import { formatDate } from '../../../utils/format'
import styles from './CnasPage.module.scss'

const PAGE_SIZE = 20

export default function CnasIcd10Page() {
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading, isError } = useCnasIcd10Codes({
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
        <Stethoscope size={20} strokeWidth={1.75} />
        <h1>Diagnostice ICD-10 CNAS</h1>
        {result && (
          <span className="badge bg-secondary">{result.totalCount.toLocaleString()}</span>
        )}
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          className="form-control"
          placeholder="Caută după cod sau denumire diagnostic…"
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
        <div className="alert alert-danger">Eroare la încărcarea diagnosticelor ICD-10.</div>
      )}

      {!isLoading && !isError && (
        <>
          <div className={styles.tableWrapper}>
            {items.length === 0 ? (
              <div className={styles.emptyState}>Niciun diagnostic găsit.</div>
            ) : (
              <table className={styles.cnasTable}>
                <thead>
                  <tr>
                    <th>Cod ICD-10</th>
                    <th>Denumire</th>
                    <th>Categorie boală</th>
                    <th>Valabil de la</th>
                    <th>Valabil până la</th>
                    <th>Stare</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d.code}>
                      <td><code>{d.code}</code></td>
                      <td title={d.name}>{d.name}</td>
                      <td>{d.diseaseCategoryCode ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.validFrom ? formatDate(d.validFrom) : <span className={styles.noData}>—</span>}</td>
                      <td>{d.validTo ? formatDate(d.validTo) : <span className={styles.noData}>—</span>}</td>
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

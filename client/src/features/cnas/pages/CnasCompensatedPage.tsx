import { useState, useCallback } from 'react'
import { ListFilter } from 'lucide-react'
import { useCnasCompensated } from '../hooks/useCnas'
import { CnasPagination } from '../components/CnasPagination'
import { formatDate } from '../../../utils/format'
import styles from './CnasPage.module.scss'

const PAGE_SIZE = 20

const LIST_TYPES = ['A', 'B', 'C', 'C1', 'D', 'D1']

export default function CnasCompensatedPage() {
  const [search, setSearch]     = useState('')
  const [listType, setListType] = useState<string | undefined>(undefined)
  const [page, setPage]         = useState(1)

  const { data, isLoading, isError } = useCnasCompensated({
    search: search || undefined,
    listType,
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
        <ListFilter size={20} strokeWidth={1.75} />
        <h1>Liste Compensate CNAS</h1>
        {result && (
          <span className="badge bg-secondary">{result.totalCount.toLocaleString()}</span>
        )}
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          className="form-control"
          placeholder="Caută după denumire medicament sau cod…"
          value={search}
          onChange={handleSearch}
          style={{ maxWidth: 360 }}
        />
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={listType ?? ''}
          onChange={(e) => {
            setListType(e.target.value || undefined)
            setPage(1)
          }}
        >
          <option value="">Toate listele</option>
          {LIST_TYPES.map((lt) => (
            <option key={lt} value={lt}>Lista {lt}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      )}

      {isError && (
        <div className="alert alert-danger">Eroare la încărcarea listelor compensate.</div>
      )}

      {!isLoading && !isError && (
        <>
          <div className={styles.tableWrapper}>
            {items.length === 0 ? (
              <div className={styles.emptyState}>Nicio înregistrare găsită.</div>
            ) : (
              <table className={styles.cnasTable}>
                <thead>
                  <tr>
                    <th>Cod medicament</th>
                    <th>Denumire</th>
                    <th>Tip listă</th>
                    <th>PNS</th>
                    <th>Cod boală</th>
                    <th style={{ textAlign: 'right' }}>Preț max.</th>
                    <th style={{ textAlign: 'right' }}>Copayment</th>
                    <th>Valabil de la</th>
                    <th>Valabil până la</th>
                    <th>Stare</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d.id}>
                      <td><code>{d.drugCode}</code></td>
                      <td title={d.drugName}>{d.drugName}</td>
                      <td>
                        <span className={styles.tagCompensated}>{d.copaymentListType}</span>
                      </td>
                      <td>{d.nhpCode ?? <span className={styles.noData}>—</span>}</td>
                      <td>{d.diseaseCode ?? <span className={styles.noData}>—</span>}</td>
                      <td style={{ textAlign: 'right' }}>
                        {d.maxPrice != null ? d.maxPrice.toFixed(2) : <span className={styles.noData}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {d.copaymentValue != null ? d.copaymentValue.toFixed(2) : <span className={styles.noData}>—</span>}
                      </td>
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

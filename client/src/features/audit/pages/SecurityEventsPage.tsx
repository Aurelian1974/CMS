import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/data-display/Pagination'
import { useSecurityEvents } from '../hooks/useSecurityEvents'
import {
  EVENT_TYPES, EVENT_LABELS, CRITICAL_EVENTS,
  type SecurityEventFilters, type SecurityEvent,
} from '../types/audit.types'
import styles from './SecurityEventsPage.module.scss'

const INITIAL: SecurityEventFilters = { page: 1, pageSize: 25 }

/** Data și ora, în formatul local — jurnalul se citește cronologic. */
const formatMoment = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('ro-RO')
}

/**
 * Cine a produs evenimentul.
 *
 * Pentru un login eșuat cu email necunoscut nu există utilizator — afișăm adresa
 * încercată, care e singura informație disponibilă și exact cea care contează
 * într-o investigație de credential stuffing.
 */
const Actor = ({ e }: { e: SecurityEvent }) => {
  if (e.userName?.trim()) return <>{e.userName}</>
  if (e.emailAttempted) return <span className={styles.attempted}>{e.emailAttempted}</span>
  return <span className={styles.unknown}>neidentificat</span>
}

/**
 * Jurnalul evenimentelor de autentificare.
 *
 * Endpoint-ul există din PR 5, dar fără interfață jurnalul nu putea fi produs la o
 * cerere GDPR sau folosit într-o investigație.
 */
export const SecurityEventsPage = () => {
  const [filters, setFilters] = useState<SecurityEventFilters>(INITIAL)
  const { data, isLoading, isError, error } = useSecurityEvents(filters)

  /** Orice schimbare de filtru readuce la prima pagină. */
  const setFilter = <K extends keyof SecurityEventFilters>(
    key: K, value: SecurityEventFilters[K],
  ) => setFilters((f) => ({ ...f, [key]: value, page: 1 }))

  return (
    <div className={styles.page}>
      <PageHeader title="Jurnal de securitate" />

      <div className={styles.filters}>
        <label className={styles.field}>
          <span>Tip eveniment</span>
          <select
            className="form-select"
            value={filters.eventType ?? ''}
            onChange={(e) => setFilter('eventType', e.target.value || undefined)}
          >
            <option value="">Toate</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{EVENT_LABELS[t] ?? t}</option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Rezultat</span>
          <select
            className="form-select"
            value={filters.succeeded === undefined ? '' : String(filters.succeeded)}
            onChange={(e) =>
              setFilter('succeeded', e.target.value === '' ? undefined : e.target.value === 'true')
            }
          >
            <option value="">Toate</option>
            <option value="true">Reușite</option>
            <option value="false">Eșuate</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Email încercat</span>
          <input
            type="text"
            className="form-control"
            placeholder="căutare parțială"
            value={filters.emailAttempted ?? ''}
            onChange={(e) => setFilter('emailAttempted', e.target.value || undefined)}
          />
        </label>

        <label className={styles.field}>
          <span>Adresă IP</span>
          <input
            type="text"
            className="form-control"
            value={filters.ipAddress ?? ''}
            onChange={(e) => setFilter('ipAddress', e.target.value || undefined)}
          />
        </label>

        <label className={styles.field}>
          <span>De la</span>
          <input
            type="date"
            className="form-control"
            value={filters.dateFrom?.slice(0, 10) ?? ''}
            onChange={(e) => setFilter('dateFrom', e.target.value || undefined)}
          />
        </label>

        <label className={styles.field}>
          <span>Până la</span>
          <input
            type="date"
            className="form-control"
            value={filters.dateTo?.slice(0, 10) ?? ''}
            onChange={(e) => setFilter('dateTo', e.target.value || undefined)}
          />
        </label>

        <button
          type="button"
          className="btn btn-outline-secondary align-self-end"
          onClick={() => setFilters(INITIAL)}
        >
          Resetează
        </button>
      </div>

      {isError && <div className="alert alert-danger">{(error as Error).message}</div>}

      <div className={styles.tableWrap}>
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>Moment</th>
              <th>Eveniment</th>
              <th>Utilizator</th>
              <th>Adresă IP</th>
              <th>Detalii</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="text-center py-4">Se încarcă...</td></tr>
            )}

            {!isLoading && data?.items.length === 0 && (
              <tr><td colSpan={5} className="text-center py-4 text-muted">
                Niciun eveniment pentru filtrele selectate.
              </td></tr>
            )}

            {data?.items.map((e) => (
              <tr
                key={e.id}
                className={CRITICAL_EVENTS.has(e.eventType) ? styles.critical : undefined}
              >
                <td className={styles.nowrap}>{formatMoment(e.occurredAt)}</td>
                <td>
                  <span className={e.succeeded ? styles.ok : styles.failed}>
                    {EVENT_LABELS[e.eventType] ?? e.eventType}
                  </span>
                </td>
                <td><Actor e={e} /></td>
                <td className={styles.nowrap}>{e.ipAddress ?? '—'}</td>
                <td className={styles.details} title={e.userAgent ?? undefined}>
                  {e.details ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalCount > 0 && (
        <Pagination
          currentPage={data.page}
          totalRecords={data.totalCount}
          pageSize={data.pageSize}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          onPageSizeChange={(pageSize) => setFilters((f) => ({ ...f, pageSize, page: 1 }))}
        />
      )}
    </div>
  )
}

export default SecurityEventsPage

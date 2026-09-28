import { useEffect, useMemo, useState } from 'react'
import { AppBadge } from '@/components/ui/AppBadge'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/utils/format'
import { useConsultations } from '../../hooks/useConsultations'
import type { ConsultationListDto } from '../../types/consultation.types'
import { getConsultationStatusVariant, parseDiagnosticLabel } from '../../utils/consultationDisplay'
import styles from '../../pages/ConsultationsListPage.module.scss'

const PAGE_SIZE = 20
// Plafonul serverului pe o pagină (Consultation_GetPaged)
const MAX_PAGE_SIZE = 200

interface HistoryListProps {
  isAdmin: boolean
  /** Admin fără filtru de medic → istoric grupat pe medic */
  groupByDoctor: boolean
  doctorId: string | undefined
  activeConsultationId: string | null
  onSelect: (consultation: ConsultationListDto) => void
}

export const HistoryList = ({ isAdmin, groupByDoctor, doctorId, activeConsultationId, onSelect }: HistoryListProps) => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search.trim(), 300)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setPageSize(PAGE_SIZE)
  }, [debouncedSearch, doctorId])

  const { data: resp, isFetching } = useConsultations({
    page: 1, pageSize,
    doctorId,
    search: debouncedSearch || undefined,
    sortBy: 'Date', sortDir: 'desc',
  })
  const items = useMemo(() => resp?.data?.pagedResult?.items ?? [], [resp])
  const canLoadMore = (resp?.data?.pagedResult?.hasNextPage ?? false) && pageSize < MAX_PAGE_SIZE

  const grouped = useMemo(() => {
    if (!groupByDoctor) return null
    const groups: Record<string, ConsultationListDto[]> = {}
    items.forEach(c => {
      const key = c.doctorName || 'Necunoscut'
      if (!groups[key]) groups[key] = []
      groups[key].push(c)
    })
    return groups
  }, [groupByDoctor, items])

  const toggleGroup = (name: string) =>
    setOpenGroups(prev => ({ ...prev, [name]: prev[name] === false ? true : false }))

  const renderCard = (c: ConsultationListDto, middle: string) => (
    <button
      key={c.id}
      type="button"
      className={`${styles.card} ${styles.cardHistory} ${activeConsultationId === c.id ? styles.cardActive : ''}`}
      onClick={() => onSelect(c)}
    >
      <div className={styles.cardTop}>
        <span className={styles.cardPatient}>{c.patientName}</span>
        <span className={styles.cardTime}>{formatDate(c.date)}</span>
      </div>
      <div className={styles.cardMiddle}>{middle}</div>
      <div className={styles.cardBottom}>
        <AppBadge variant={getConsultationStatusVariant(c.statusCode)} withDot>{c.statusName}</AppBadge>
      </div>
    </button>
  )

  return (
    <>
      <div className={styles.dateGroupLabel}>
        {groupByDoctor ? 'Consultații anterioare' : 'Consultații recente'}
      </div>
      <div className={styles.historySearch}>
        <input
          type="search"
          className="form-control form-control-sm"
          placeholder="Caută pacient, medic sau cod ICD-10..."
          aria-label="Caută în consultații"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {items.length === 0 && (
        <div className={styles.listEmpty}>
          {debouncedSearch ? 'Nicio consultație găsită.' : 'Nicio consultație anterioară.'}
        </div>
      )}

      {grouped && Object.entries(grouped).map(([doctorName, cons]) => {
        const isOpen = openGroups[doctorName] !== false
        return (
          <div key={doctorName} className={styles.historyDoctorGroup}>
            <button
              type="button"
              className={styles.historyDoctorHeader}
              aria-expanded={isOpen}
              onClick={() => toggleGroup(doctorName)}
            >
              <span className={styles.historyDoctorName}>Dr. {doctorName}</span>
              <span className={styles.historyDoctorCount}>{cons.length}</span>
              <span className={styles.historyChevron}>{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className={styles.historyDoctorItems}>
                {cons.map(c => renderCard(c, parseDiagnosticLabel(c.diagnostic)))}
              </div>
            )}
          </div>
        )
      })}

      {!grouped && items.map(c => renderCard(c, isAdmin ? c.doctorName : parseDiagnosticLabel(c.diagnostic)))}

      {canLoadMore && (
        <button
          type="button"
          className={styles.loadMore}
          disabled={isFetching}
          onClick={() => setPageSize(s => Math.min(s + PAGE_SIZE, MAX_PAGE_SIZE))}
        >
          {isFetching ? 'Se încarcă...' : 'Încarcă mai multe'}
        </button>
      )}
    </>
  )
}

import { Pencil, Trash2, Paperclip } from 'lucide-react'
import type { InvestigationDto, InvestigationStatus } from '@/features/consultations/investigations/types/investigation.types'
import styles from './InvestigationCard.module.scss'

interface Props {
  investigation: InvestigationDto
  onEdit: (inv: InvestigationDto) => void
  onDelete: (inv: InvestigationDto) => void
  disabled?: boolean
}

const STATUS_LABELS: Record<InvestigationStatus, { label: string; cls: string }> = {
  0: { label: 'Solicitată', cls: 'requested' },
  1: { label: 'În așteptare', cls: 'pending' },
  2: { label: 'Finalizată', cls: 'completed' },
  3: { label: 'Anulată', cls: 'cancelled' },
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return iso }
}

function stripHtml(html: string | null): string {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export const InvestigationCard = ({ investigation: inv, onEdit, onDelete, disabled }: Props) => {
  const status = STATUS_LABELS[inv.status]
  const preview = inv.hasStructuredData
    ? '📊 Date structurate completate'
    : stripHtml(inv.narrative)

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div>
          <div className={styles.title}>{inv.investigationTypeDisplayName}</div>
          <div className={styles.date}>{formatDate(inv.investigationDate)} · {inv.doctorName}</div>
        </div>
        {!disabled && (
          <div className={styles.actions}>
            <button type="button" title="Editează" onClick={() => onEdit(inv)}>
              <Pencil size={14} />
            </button>
            <button type="button" title="Șterge" className={styles.danger} onClick={() => onDelete(inv)}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <div className={styles.meta}>
        <span className={`${styles.badge} ${styles[status.cls]}`}>{status.label}</span>
        {inv.isExternal && (
          <span className={`${styles.badge} ${styles.external}`}>
            Extern{inv.externalSource ? ` · ${inv.externalSource}` : ''}
          </span>
        )}
        {inv.attachedDocumentId && (
          <span className={`${styles.badge} ${styles.attached}`}>
            <Paperclip size={11} style={{ verticalAlign: 'middle' }} /> {inv.attachedDocumentName ?? 'Atașament'}
          </span>
        )}
      </div>
      {preview && <div className={styles.preview}>{preview}</div>}
    </div>
  )
}

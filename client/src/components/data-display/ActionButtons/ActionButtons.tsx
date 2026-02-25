import { IconEdit, IconTrash } from '@/components/ui/Icons'
import styles from './ActionButtons.module.scss'

interface ActionButtonsProps {
  /** Callback la click pe Editează */
  onEdit: () => void
  /** Callback la click pe Șterge */
  onDelete: () => void
}

/**
 * Butoane de acțiuni (Editează / Șterge) — reutilizabile în orice tabel sau grid.
 * Stilul e identic pe toate paginile (consistență UI obligatorie).
 */
export const ActionButtons = ({ onEdit, onDelete }: ActionButtonsProps) => (
  <div className={styles.actionBtns}>
    <button className={styles.iconBtn} title="Editează" onClick={onEdit}>
      <IconEdit />
    </button>
    <button className={styles.iconBtnDanger} title="Șterge" onClick={onDelete}>
      <IconTrash />
    </button>
  </div>
)

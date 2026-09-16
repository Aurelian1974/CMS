import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { NavLink } from 'react-router-dom';
import { GripVertical, Star } from 'lucide-react';
import type { GuardedRoute } from '@/routes/moduleAccess';
import styles from '@/components/layout/Sidebar.module.scss';

interface SortableFavoriteItemProps {
  to: GuardedRoute;
  label: string;
  icon: React.ReactNode;
  sidebarCollapsed: boolean;
  onRemove: () => void;
  onActiveRef: (node: HTMLAnchorElement | null) => void;
}

/// Item favorit sortabil prin drag-and-drop. Reordonarea vizează DOAR lista de
/// favorite — restul meniului nu e afectat. Butonul de grip funcționează și cu
/// tastatura (`@dnd-kit` KeyboardSensor), nu doar cu mouse-ul.
export const SortableFavoriteItem = ({
  to,
  label,
  icon,
  sidebarCollapsed,
  onRemove,
  onActiveRef,
}: SortableFavoriteItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: to });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.navItemRow}>
      {!sidebarCollapsed && (
        <button
          type="button"
          className={styles.dragHandle}
          aria-label={`Reordonează ${label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
      )}
      <NavLink
        to={to}
        ref={onActiveRef}
        className={({ isActive }) => `${styles.navItem}${isActive ? ` ${styles.active}` : ''}`}
        title={sidebarCollapsed ? label : undefined}
      >
        <span className={styles.navIcon}>{icon}</span>
        <span className={styles.navLabel}>{label}</span>
      </NavLink>
      {!sidebarCollapsed && (
        <button
          type="button"
          className={`${styles.favoriteBtn} ${styles.favorited}`}
          onClick={onRemove}
          aria-label={`Elimină ${label} din favorite`}
          title="Elimină din favorite"
        >
          <Star size={14} strokeWidth={2} fill="currentColor" />
        </button>
      )}
    </div>
  );
};

import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/utils/format';
import { useDashboard } from '../hooks/useDashboard';
import { WIDGET_REGISTRY } from '../widgets/widgetRegistry';
import styles from './DashboardPage.module.scss';

/**
 * Dashboard pe roluri: serverul decide ce widget-uri (preset rol ∩ permisiuni efective)
 * și în ce ordine; pagina doar le mapează pe componente.
 */
export const DashboardPage = () => {
  const { data, isLoading, isError, refetch } = useDashboard();
  const fullName = useAuthStore((s) => s.user?.fullName);
  const dashboard = data?.data;
  const widgetIds = dashboard?.widgetIds ?? [];
  const today = formatDate(dashboard?.today ?? new Date());

  const header = (
    <PageHeader
      title="Dashboard"
      subtitle={fullName ? `Bună, ${fullName} — ${today}` : `Rezumatul zilei — ${today}`}
    />
  );

  if (isLoading) {
    return <div className={styles.page}>{header}<LoadingSpinner /></div>;
  }

  if (isError || !dashboard) {
    return (
      <div className={styles.page}>
        {header}
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          Dashboard-ul nu a putut fi încărcat.
          <button type="button" className={`btn btn-sm btn-outline-danger ${styles.retry}`} onClick={() => refetch()}>
            Reîncearcă
          </button>
        </div>
      </div>
    );
  }

  if (widgetIds.length === 0) {
    return (
      <div className={styles.page}>
        {header}
        <div className={styles.empty} role="status">
          <h5>Niciun widget disponibil</h5>
          <p>Contul tău nu are acces la modulele afișate pe dashboard. Folosește meniul din stânga
            sau cere unui administrator permisiunile necesare.</p>
        </div>
      </div>
    );
  }

  const known = widgetIds.filter((id) => WIDGET_REGISTRY[id]);
  const renderGroup = (group: 'kpi' | 'card') =>
    known
      .filter((id) => WIDGET_REGISTRY[id].group === group)
      .map((id) => {
        const { component: Widget, colClass } = WIDGET_REGISTRY[id];
        return (
          <div key={id} className={colClass} data-widget-id={id}>
            <Widget data={dashboard} />
          </div>
        );
      });

  return (
    <div className={styles.page}>
      {header}
      <div className="row g-3 mb-3">{renderGroup('kpi')}</div>
      <div className="row g-3">{renderGroup('card')}</div>
    </div>
  );
};

export default DashboardPage;


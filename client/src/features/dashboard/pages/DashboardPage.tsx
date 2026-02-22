import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { formatDate } from '@/utils/format';
import styles from './DashboardPage.module.scss';

// --------------- Icoane SVG inline ---------------

const IconCalendar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconUsers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconStethoscope = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 2h-1A1.5 1.5 0 0 0 2 3.5v5A6.5 6.5 0 0 0 8.5 15h1A6.5 6.5 0 0 0 16 8.5v-5A1.5 1.5 0 0 0 14.5 2h-1" />
    <path d="M16 9a4 4 0 0 1 4 4 4 4 0 0 1-4 4m0 0v3" />
    <circle cx="16" cy="20" r="1" />
  </svg>
);

const IconMoney = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// --------------- Tipuri mock ---------------

interface MockAppointment {
  id: string;
  time: string;
  patientName: string;
  type: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
}

interface MockActivity {
  id: string;
  text: string;
  time: string;
  type: 'appointment' | 'patient' | 'invoice' | 'consultation';
}

// --------------- Date mock ---------------

const MOCK_APPOINTMENTS: MockAppointment[] = [
  { id: '1', time: '08:30', patientName: 'Andrei Popescu', type: 'Consultație generală', status: 'completed' },
  { id: '2', time: '09:00', patientName: 'Maria Ionescu', type: 'Control cardiologic', status: 'completed' },
  { id: '3', time: '09:30', patientName: 'Ion Dumitrescu', type: 'Consultație generală', status: 'confirmed' },
  { id: '4', time: '10:00', patientName: 'Elena Constantin', type: 'Ecografie abdominală', status: 'confirmed' },
  { id: '5', time: '10:30', patientName: 'George Marin', type: 'EKG + consultație', status: 'pending' },
  { id: '6', time: '11:00', patientName: 'Diana Florea', type: 'Control periodic', status: 'pending' },
  { id: '7', time: '11:30', patientName: 'Alexandru Popa', type: 'Consultație generală', status: 'cancelled' },
  { id: '8', time: '12:00', patientName: 'Ioana Stancu', type: 'Rețetă compensată', status: 'pending' },
];

const MOCK_ACTIVITY: MockActivity[] = [
  { id: '1', text: 'Programare confirmată — Maria Ionescu', time: 'Acum 5 min', type: 'appointment' },
  { id: '2', text: 'Pacient nou înregistrat — Tudor Șerban', time: 'Acum 18 min', type: 'patient' },
  { id: '3', text: 'Factură emisă — #INV-2024-0147', time: 'Acum 32 min', type: 'invoice' },
  { id: '4', text: 'Consultație finalizată — Elena Constantin', time: 'Acum 45 min', type: 'consultation' },
  { id: '5', text: 'Rețetă generată — Ion Dumitrescu', time: 'Acum 1 oră', type: 'consultation' },
  { id: '6', text: 'Programare anulată — Alexandru Popa', time: 'Acum 1 oră 20 min', type: 'appointment' },
];

// --------------- Utilitare ---------------

const STATUS_LABEL: Record<MockAppointment['status'], string> = {
  confirmed: 'Confirmat',
  pending: 'În așteptare',
  completed: 'Finalizat',
  cancelled: 'Anulat',
};

const ACTIVITY_COLOR: Record<MockActivity['type'], string> = {
  appointment:   '#5B8DB8',
  patient:       '#7BC8A4',
  invoice:       '#E8A87C',
  consultation:  '#9B8DC8',
};

// --------------- Componenta ---------------

export const DashboardPage = () => {
  const today = formatDate(new Date());

  return (
    <div className={styles.page}>
      <PageHeader
        title="Dashboard"
        subtitle={`Rezumatul zilei — ${today}`}
      />

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <StatCard
            label="Programări azi"
            value={8}
            icon={<IconCalendar />}
            color="blue"
            trend={12}
            trendLabel="față de ieri"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            label="Pacienți noi (lună)"
            value={34}
            icon={<IconUsers />}
            color="green"
            trend={8}
            trendLabel="față de luna trecută"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            label="Consultații azi"
            value={5}
            icon={<IconStethoscope />}
            color="purple"
            trend={0}
            trendLabel="față de ieri"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            label="Încasări (lună)"
            value="12.480 RON"
            icon={<IconMoney />}
            color="orange"
            trend={-4}
            trendLabel="față de luna trecută"
          />
        </div>
      </div>

      {/* Conținut principal */}
      <div className="row g-3">
        {/* Programări azi */}
        <div className="col-lg-7">
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h5 className={styles.cardTitle}>Programări azi</h5>
              <span className={styles.cardBadge}>{MOCK_APPOINTMENTS.length} total</span>
            </div>
            <div className={styles.appointmentList}>
              {MOCK_APPOINTMENTS.map((a) => (
                <div key={a.id} className={styles.appointmentRow}>
                  <div className={styles.aptTime}>
                    <IconClock />
                    <span>{a.time}</span>
                  </div>
                  <div className={styles.aptInfo}>
                    <span className={styles.aptPatient}>{a.patientName}</span>
                    <span className={styles.aptType}>{a.type}</span>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[a.status]}`}>
                    {a.status === 'completed' && <IconCheck />}
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activitate recentă */}
        <div className="col-lg-5">
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h5 className={styles.cardTitle}>Activitate recentă</h5>
            </div>
            <div className={styles.activityList}>
              {MOCK_ACTIVITY.map((item) => (
                <div key={item.id} className={styles.activityRow}>
                  <div
                    className={styles.activityDot}
                    style={{ background: ACTIVITY_COLOR[item.type] }}
                  />
                  <div className={styles.activityInfo}>
                    <span className={styles.activityText}>{item.text}</span>
                    <span className={styles.activityTime}>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

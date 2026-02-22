import { useState, useRef, useCallback } from 'react';
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Sort,
  Filter,
  Group,
  Reorder,
  Resize,
  ExcelExport,
  PdfExport,
  ColumnChooser,
  type FilterSettingsModel,
  type GroupSettingsModel,
  type PageSettingsModel,
  type SortSettingsModel,
  type ExcelExportProperties,
  type PdfExportProperties,
} from '@syncfusion/ej2-react-grids';
import type { DoctorDto, DoctorStatusFilter } from '../types/doctor.types';
import { formatDate, formatDateTime } from '@/utils/format';
import styles from './DoctorsListPage.module.scss';

// ── Icoane SVG inline ─────────────────────────────────────────────────────────
const IconPlus    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconExcel   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IconPdf     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5-.7 1.5-1.5 1.5H10v2"/></svg>;
const IconColumns = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg>;
const IconSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconEdit    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconLock    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const IconMedic   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 2h-1A1.5 1.5 0 002 3.5v5A6.5 6.5 0 008.5 15h1A6.5 6.5 0 0016 8.5v-5A1.5 1.5 0 0014.5 2h-1"/><path d="M16 9a4 4 0 014 4 4 4 0 01-4 4m0 0v3"/><circle cx="16" cy="20" r="1"/></svg>;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

const getLicenseClass = (expiresAt: string | null): string => {
  if (!expiresAt) return '';
  const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (days < 0)   return styles['licenseExpiry--expired'];
  if (days < 60)  return styles['licenseExpiry--warning'];
  return styles['licenseExpiry--ok'];
};

// ── Date mock ─────────────────────────────────────────────────────────────────
const MOCK_DOCTORS: DoctorDto[] = [
  { id: '1', clinicId: 'c1', firstName: 'Andrei',   lastName: 'Ionescu',    fullName: 'Dr. Andrei Ionescu',    email: 'a.ionescu@clinica.ro',   phoneNumber: '0722111222', specialtyId: 's1', specialtyName: 'Cardiologie',   medicalCode: 'AI-4821', licenseNumber: 'CMR-00142', licenseExpiresAt: '2025-06-15', isActive: true,  lastLoginAt: '2026-02-22T08:30:00', createdAt: '2023-03-10' },
  { id: '2', clinicId: 'c1', firstName: 'Maria',    lastName: 'Popa',       fullName: 'Dr. Maria Popa',        email: 'm.popa@clinica.ro',       phoneNumber: '0733222333', specialtyId: 's2', specialtyName: 'Pneumologie',   medicalCode: 'MP-3310', licenseNumber: 'CMR-00289', licenseExpiresAt: '2026-03-20', isActive: true,  lastLoginAt: '2026-02-22T09:15:00', createdAt: '2023-01-15' },
  { id: '3', clinicId: 'c1', firstName: 'Cristina', lastName: 'Marin',      fullName: 'Dr. Cristina Marin',    email: 'c.marin@clinica.ro',      phoneNumber: '0766555666', specialtyId: 's3', specialtyName: 'Neurologie',    medicalCode: 'CM-9921', licenseNumber: 'CMR-00401', licenseExpiresAt: '2024-12-01', isActive: false, lastLoginAt: '2026-01-10T11:00:00', createdAt: '2022-11-05' },
  { id: '4', clinicId: 'c1', firstName: 'Mihai',    lastName: 'Rusu',       fullName: 'Dr. Mihai Rusu',        email: 'm.rusu@clinica.ro',       phoneNumber: '0799888999', specialtyId: 's4', specialtyName: 'Pediatrie',     medicalCode: 'MR-7744', licenseNumber: 'CMR-00518', licenseExpiresAt: '2027-08-30', isActive: true,  lastLoginAt: '2026-02-22T08:00:00', createdAt: '2023-09-15' },
  { id: '5', clinicId: 'c1', firstName: 'Florin',   lastName: 'Toma',       fullName: 'Dr. Florin Toma',       email: 'f.toma@clinica.ro',       phoneNumber: '0722100200', specialtyId: 's5', specialtyName: 'Ortopedie',     medicalCode: 'FT-2288', licenseNumber: 'CMR-00633', licenseExpiresAt: '2025-11-15', isActive: false, lastLoginAt: '2025-12-05T10:30:00', createdAt: '2023-04-12' },
  { id: '6', clinicId: 'c1', firstName: 'Elena',    lastName: 'Constantin', fullName: 'Dr. Elena Constantin',  email: 'e.constantin@clinica.ro', phoneNumber: '0744333444', specialtyId: 's6', specialtyName: 'Dermatologie',  medicalCode: 'EC-1155', licenseNumber: 'CMR-00712', licenseExpiresAt: '2026-09-01', isActive: true,  lastLoginAt: '2026-02-21T14:00:00', createdAt: '2024-02-01' },
  { id: '7', clinicId: 'c1', firstName: 'George',   lastName: 'Dumitru',    fullName: 'Dr. George Dumitru',    email: 'g.dumitru@clinica.ro',    phoneNumber: '0711777888', specialtyId: 's7', specialtyName: 'Ginecologie',   medicalCode: 'GD-5544', licenseNumber: 'CMR-00834', licenseExpiresAt: '2028-01-10', isActive: true,  lastLoginAt: '2026-02-20T10:30:00', createdAt: '2024-05-15' },
  { id: '8', clinicId: 'c1', firstName: 'Ioana',    lastName: 'Niculescu',  fullName: 'Dr. Ioana Niculescu',   email: 'i.niculescu@clinica.ro',  phoneNumber: '0755666777', specialtyId: 's1', specialtyName: 'Cardiologie',   medicalCode: 'IN-3367', licenseNumber: 'CMR-00945', licenseExpiresAt: '2026-05-20', isActive: true,  lastLoginAt: '2026-02-22T11:00:00', createdAt: '2024-08-20' },
];

// ── Configurare grid ──────────────────────────────────────────────────────────
const filterSettings: FilterSettingsModel = { type: 'Menu', showFilterBarStatus: true };

const groupSettings: GroupSettingsModel = {
  showDropArea: true,
  showGroupedColumn: false,
  showToggleButton: true,
  showUngroupButton: true,
};

const pageSettings: PageSettingsModel = { pageSize: 10, pageSizes: [5, 10, 20, 50] };

const sortSettings: SortSettingsModel = {
  columns: [{ field: 'lastName', direction: 'Ascending' }],
};

// Specializări unice din mock — în producție vin din API nomenclator
const SPECIALTIES = [...new Set(MOCK_DOCTORS.map(d => d.specialtyName).filter(Boolean))].sort() as string[];

// ── Componenta principală ─────────────────────────────────────────────────────
export const DoctorsListPage = () => {
  const gridRef = useRef<GridComponent>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DoctorStatusFilter>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  // Filtrare locală pe mock — în producție: useDoctors({ page, pageSize, search, ... })
  const filteredData = MOCK_DOCTORS.filter(d => {
    const matchSearch = !search ||
      [d.fullName, d.email, d.medicalCode ?? '', d.specialtyName ?? '']
        .some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? d.isActive : !d.isActive;
    const matchSpecialty = !specialtyFilter || d.specialtyName === specialtyFilter;
    return matchSearch && matchStatus && matchSpecialty;
  });

  const totalActive   = MOCK_DOCTORS.filter(d => d.isActive).length;
  const totalInactive = MOCK_DOCTORS.filter(d => !d.isActive).length;
  const specialties   = [...new Set(MOCK_DOCTORS.map(d => d.specialtyName).filter(Boolean))];

  // Date transformate pentru export — plain objects, fără template JSX
  const buildExportData = useCallback(() =>
    filteredData.map(d => ({
      fullName:         d.fullName,
      specialtyName:    d.specialtyName ?? '—',
      medicalCode:      d.medicalCode   ?? '—',
      licenseNumber:    d.licenseNumber ?? '—',
      licenseExpiresAt: d.licenseExpiresAt ? formatDate(d.licenseExpiresAt) : '—',
      phoneNumber:      d.phoneNumber   ?? '—',
      isActive:         d.isActive ? 'Activ' : 'Inactiv',
      lastLoginAt:      d.lastLoginAt ? formatDateTime(d.lastLoginAt) : '—',
      createdAt:        d.createdAt ? formatDate(d.createdAt) : '—',
    }))
  , [filteredData]);

  // ── Export handlers ────────────────────────────────────────────────────────
  const handleExcelExport = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    grid.hideColumns(['id'], 'field');
    const props: ExcelExportProperties = {
      fileName: `doctori_${new Date().toISOString().slice(0, 10)}.xlsx`,
      dataSource: buildExportData(),
    };
    (grid.excelExport(props) as unknown as Promise<void>)
      ?.finally?.(() => grid.showColumns(['id'], 'field'));
  }, [buildExportData]);

  const handlePdfExport = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    grid.hideColumns(['id'], 'field');
    const props: PdfExportProperties = {
      fileName: `doctori_${new Date().toISOString().slice(0, 10)}.pdf`,
      pageOrientation: 'Landscape',
      dataSource: buildExportData(),
    };
    (grid.pdfExport(props) as unknown as Promise<void>)
      ?.finally?.(() => grid.showColumns(['id'], 'field'));
  }, [buildExportData]);

  // ── Cell templates ─────────────────────────────────────────────────────────
  const nameTemplate = useCallback((row: DoctorDto) => (
    <div className={styles.avatarCell}>
      <div className={styles.avatar}>{getInitials(row.firstName, row.lastName)}</div>
      <div>
        <div className={styles.doctorName}>{row.fullName}</div>
        <div className={styles.doctorEmail}>{row.email}</div>
      </div>
    </div>
  ), []);

  const specialtyTemplate = useCallback((row: DoctorDto) =>
    row.specialtyName
      ? <span className={styles.specialtyBadge}>{row.specialtyName}</span>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , []);

  const medicalCodeTemplate = useCallback((row: DoctorDto) =>
    row.medicalCode
      ? <span className={styles.medicalCode}>{row.medicalCode}</span>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , []);

  const licenseTemplate = useCallback((row: DoctorDto) => {
    if (!row.licenseExpiresAt) return <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>;
    return (
      <span className={`${styles.licenseExpiry} ${getLicenseClass(row.licenseExpiresAt)}`}>
        {formatDate(row.licenseExpiresAt)}
      </span>
    );
  }, []);

  const statusTemplate = useCallback((row: DoctorDto) => (
    <span className={`${styles.statusBadge} ${styles[row.isActive ? 'statusBadge--active' : 'statusBadge--inactive']}`}>
      {row.isActive ? 'Activ' : 'Inactiv'}
    </span>
  ), []);

  const lastLoginTemplate = useCallback((row: DoctorDto) =>
    row.lastLoginAt
      ? <span style={{ fontSize: '0.8rem', color: '#6E8090' }}>{formatDateTime(row.lastLoginAt)}</span>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , []);

  const actionsTemplate = useCallback((row: DoctorDto) => (
    <div className={styles.actionCell}>
      <button
        className={styles.actionBtn}
        title="Editare"
        onClick={() => console.log('edit', row.id)}
      >
        <IconEdit />
      </button>
      <button
        className={`${styles.actionBtn} ${row.isActive ? styles['actionBtn--danger'] : ''}`}
        title={row.isActive ? 'Dezactivare' : 'Activare'}
        onClick={() => console.log('toggle', row.id)}
      >
        <IconLock />
      </button>
    </div>
  ), []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Doctori</h1>
          <p className={styles.pageSubtitle}>Gestionare medici, specialități și avize CMR</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={handlePdfExport}>
            <IconPdf /> Export PDF
          </button>
          <button className={styles.btnSecondary} onClick={handleExcelExport}>
            <IconExcel /> Export Excel
          </button>
          <button className={styles.btnPrimary} onClick={() => console.log('add doctor')}>
            <IconPlus /> Doctor nou
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--blue']}`}><IconMedic /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{MOCK_DOCTORS.length}</span>
            <span className={styles.statLabel}>Total doctori</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--green']}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalActive}</span>
            <span className={styles.statLabel}>Activi</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--orange']}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{specialties.length}</span>
            <span className={styles.statLabel}>Specialități</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--gray']}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalInactive}</span>
            <span className={styles.statLabel}>Inactivi</span>
          </div>
        </div>
      </div>

      {/* Toolbar filtrare */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}><IconSearch /></span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Caută după nume, email, parafă, specialitate..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Specialitate:</span>
          <select
            className={styles.filterSelect}
            value={specialtyFilter}
            onChange={e => setSpecialtyFilter(e.target.value)}
          >
            <option value="">Toate</option>
            {SPECIALTIES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.statusPills}>
          {(['all', 'active', 'inactive'] as DoctorStatusFilter[]).map(s => (
            <button
              key={s}
              className={`${styles.pill} ${statusFilter === s ? styles.active : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'Toți' : s === 'active' ? 'Activi' : 'Inactivi'}
            </button>
          ))}
        </div>

        <div className={styles.toolbarRight}>
          <button
            className={styles.btnSecondary}
            onClick={() => gridRef.current?.showColumnChooser()}
          >
            <IconColumns /> Coloane
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className={styles.gridContainer}>
        <GridComponent
          ref={gridRef}
          dataSource={filteredData}
          allowSorting
          allowFiltering
          allowGrouping
          allowReordering
          allowResizing
          allowPaging
          allowExcelExport
          allowPdfExport
          showColumnChooser
          enableStickyHeader
          enableHover
          filterSettings={filterSettings}
          groupSettings={groupSettings}
          pageSettings={pageSettings}
          sortSettings={sortSettings}
          height="auto"
          gridLines="Horizontal"
          rowHeight={52}
          excelExportComplete={handleExcelExportComplete}
          pdfExportComplete={handlePdfExportComplete}
        >
          <ColumnsDirective>

            <ColumnDirective
              field="fullName"
              headerText="DOCTOR"
              width="230"
              minWidth="180"
              template={nameTemplate}
              allowGrouping={false}
            />

            <ColumnDirective
              field="specialtyName"
              headerText="SPECIALITATE"
              width="150"
              minWidth="120"
              template={specialtyTemplate}
            />

            <ColumnDirective
              field="medicalCode"
              headerText="PARAFĂ"
              width="110"
              minWidth="90"
              template={medicalCodeTemplate}
            />

            <ColumnDirective
              field="licenseNumber"
              headerText="NR. CMR"
              width="120"
              minWidth="100"
              defaultValue="—"
            />

            <ColumnDirective
              field="licenseExpiresAt"
              headerText="AVIZ EXPIRĂ"
              width="130"
              minWidth="110"
              template={licenseTemplate}
            />

            <ColumnDirective
              field="phoneNumber"
              headerText="TELEFON"
              width="130"
              minWidth="100"
              defaultValue="—"
            />

            <ColumnDirective
              field="isActive"
              headerText="STATUS"
              width="110"
              minWidth="90"
              template={statusTemplate}
            />

            <ColumnDirective
              field="lastLoginAt"
              headerText="ULTIMA AUTENTIFICARE"
              width="175"
              minWidth="140"
              template={lastLoginTemplate}
            />

            <ColumnDirective
              field="createdAt"
              headerText="ÎNREGISTRAT"
              width="120"
              minWidth="100"
              format="dd.MM.yyyy"
              type="date"
            />

            <ColumnDirective
              field="id"
              headerText=""
              width="80"
              minWidth="70"
              template={actionsTemplate}
              allowSorting={false}
              allowFiltering={false}
              allowGrouping={false}
              allowReordering={false}
              allowResizing={false}
              freeze="Right"
            />

          </ColumnsDirective>

          <Inject services={[
            Page, Sort, Filter, Group,
            Reorder, Resize,
            ExcelExport, PdfExport, ColumnChooser,
          ]} />
        </GridComponent>
      </div>

    </div>
  );
};

export default DoctorsListPage;

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

// ===== Lazy loading pentru pagini — code splitting per rută =====
const LoginPage      = lazy(() => import('../features/auth/pages/LoginPage'))
const MainLayout     = lazy(() => import('../components/layout/MainLayout'))
const DashboardPage  = lazy(() => import('../features/dashboard/pages/DashboardPage'))
const PatientsListPage   = lazy(() => import('../features/patients/pages/PatientsListPage'))
const PatientFormPage    = lazy(() => import('../features/patients/pages/PatientFormPage'))
const AppointmentsPage       = lazy(() => import('../features/appointments/pages/AppointmentsListPage'))
const AppointmentsScheduler  = lazy(() => import('../features/appointments/pages/AppointmentsSchedulerPage'))
const AppointmentDetailPage  = lazy(() => import('../features/appointments/pages/AppointmentDetailPage'))
const ConsultationsPage  = lazy(() => import('../features/consultations/pages/ConsultationsListPage'))
const PrescriptionsPage  = lazy(() => import('../features/prescriptions/pages/PrescriptionsListPage'))
const InvoicesPage       = lazy(() => import('../features/invoices/pages/InvoicesListPage'))
const DoctorsPage        = lazy(() => import('../features/doctors/pages/DoctorsListPage'))
const DoctorDetailPage   = lazy(() => import('../features/doctors/pages/DoctorDetailPage'))
const UsersPage          = lazy(() => import('../features/users/pages/UsersListPage'))
const SpecialtiesPage    = lazy(() => import('../features/nomenclature/pages/SpecialtiesListPage'))
const MedicalTitlesPage  = lazy(() => import('../features/nomenclature/pages/MedicalTitlesPage'))
const ClinicPage         = lazy(() => import('../features/clinic/pages/ClinicPage'))
const DepartmentsPage    = lazy(() => import('../features/departments/pages/DepartmentsPage'))
const MedicalStaffPage       = lazy(() => import('../features/medicalStaff/pages/MedicalStaffListPage'))
const MedicalStaffDetailPage = lazy(() => import('../features/medicalStaff/pages/MedicalStaffDetailPage'))
const RolePermissionsPage = lazy(() => import('../features/permissions/pages/RolePermissionsPage'))
const UserOverridesPage   = lazy(() => import('../features/permissions/pages/UserOverridesPage'))
const SchedulePage              = lazy(() => import('../features/clinic/pages/SchedulePage'))
const AnmDrugsPage              = lazy(() => import('../features/anm/pages/AnmDrugsPage'))
const MedicamentePage           = lazy(() => import('../features/medicamente/pages/MedicamentePage'))
const CnasDrugsPage             = lazy(() => import('../features/cnas/pages/CnasDrugsPage'))
const CnasCompensatedPage       = lazy(() => import('../features/cnas/pages/CnasCompensatedPage'))
const CnasActiveSubstancesPage  = lazy(() => import('../features/cnas/pages/CnasActiveSubstancesPage'))
const CnasAtcPage               = lazy(() => import('../features/cnas/pages/CnasAtcPage'))
const CnasIcd10Page             = lazy(() => import('../features/cnas/pages/CnasIcd10Page'))

const LoadingFallback = () => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Se încarcă...</span>
    </div>
  </div>
)

export const AppRoutes = () => (
  <Suspense fallback={<LoadingFallback />}>
    <Routes>
      {/* Rute publice */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rute protejate */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"       element={<DashboardPage />} />
          <Route path="/patients"        element={<PatientsListPage />} />
          <Route path="/patients/new"    element={<PatientFormPage />} />
          <Route path="/patients/:id/edit" element={<PatientFormPage />} />
          <Route path="/appointments"           element={<AppointmentsPage />} />
          <Route path="/appointments/scheduler" element={<AppointmentsScheduler />} />
          <Route path="/appointments/:id"       element={<AppointmentDetailPage />} />
          <Route path="/consultations"   element={<ConsultationsPage />} />
          <Route path="/prescriptions"   element={<PrescriptionsPage />} />
          <Route path="/invoices"        element={<InvoicesPage />} />
          <Route path="/doctors"         element={<DoctorsPage />} />
          <Route path="/doctors/:id"      element={<DoctorDetailPage />} />
          <Route path="/users"           element={<UsersPage />} />
          <Route path="/specialties"     element={<SpecialtiesPage />} />
          <Route path="/medical-titles"  element={<MedicalTitlesPage />} />
          <Route path="/clinic"          element={<ClinicPage />} />
          <Route path="/departments"    element={<DepartmentsPage />} />
          <Route path="/medical-staff"     element={<MedicalStaffPage />} />
          <Route path="/medical-staff/:id"  element={<MedicalStaffDetailPage />} />
          <Route path="/permissions/roles" element={<RolePermissionsPage />} />
          <Route path="/permissions/users" element={<UserOverridesPage />} />
          <Route path="/schedule"          element={<SchedulePage />} />
          <Route path="/medicamente"             element={<MedicamentePage />} />
          <Route path="/cnas/drugs"              element={<CnasDrugsPage />} />
          <Route path="/cnas/compensated"        element={<CnasCompensatedPage />} />
          <Route path="/cnas/active-substances"  element={<CnasActiveSubstancesPage />} />
          <Route path="/cnas/atc"                element={<CnasAtcPage />} />
          <Route path="/cnas/icd10"              element={<CnasIcd10Page />} />
          <Route path="/anm/drugs"               element={<AnmDrugsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
)

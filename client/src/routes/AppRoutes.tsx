import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

// ===== Lazy loading pentru pagini — code splitting per rută =====
const LoginPage      = lazy(() => import('../features/auth/pages/LoginPage'))
const MainLayout     = lazy(() => import('../components/layout/MainLayout'))
const DashboardPage  = lazy(() => import('../features/dashboard/pages/DashboardPage'))
const PatientsListPage   = lazy(() => import('../features/patients/pages/PatientsListPage'))
const PatientDetailPage  = lazy(() => import('../features/patients/pages/PatientDetailPage'))
const PatientFormPage    = lazy(() => import('../features/patients/pages/PatientFormPage'))
const AppointmentsPage   = lazy(() => import('../features/appointments/pages/AppointmentsListPage'))
const ConsultationsPage  = lazy(() => import('../features/consultations/pages/ConsultationsListPage'))
const PrescriptionsPage  = lazy(() => import('../features/prescriptions/pages/PrescriptionsListPage'))
const InvoicesPage       = lazy(() => import('../features/invoices/pages/InvoicesListPage'))
const DoctorsPage        = lazy(() => import('../features/doctors/pages/DoctorsListPage'))
const UsersPage          = lazy(() => import('../features/users/pages/UsersListPage'))
const SpecialtiesPage    = lazy(() => import('../features/nomenclature/pages/SpecialtiesListPage'))
const MedicalTitlesPage  = lazy(() => import('../features/nomenclature/pages/MedicalTitlesPage'))
const ClinicPage         = lazy(() => import('../features/clinic/pages/ClinicPage'))
const DepartmentsPage    = lazy(() => import('../features/departments/pages/DepartmentsPage'))
const MedicalStaffPage   = lazy(() => import('../features/medicalStaff/pages/MedicalStaffListPage'))
const RolePermissionsPage = lazy(() => import('../features/permissions/pages/RolePermissionsPage'))
const UserOverridesPage   = lazy(() => import('../features/permissions/pages/UserOverridesPage'))

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
          <Route path="/patients/:id"    element={<PatientDetailPage />} />
          <Route path="/patients/:id/edit" element={<PatientFormPage />} />
          <Route path="/appointments"    element={<AppointmentsPage />} />
          <Route path="/consultations"   element={<ConsultationsPage />} />
          <Route path="/prescriptions"   element={<PrescriptionsPage />} />
          <Route path="/invoices"        element={<InvoicesPage />} />
          <Route path="/doctors"         element={<DoctorsPage />} />
          <Route path="/users"           element={<UsersPage />} />
          <Route path="/specialties"     element={<SpecialtiesPage />} />
          <Route path="/medical-titles"  element={<MedicalTitlesPage />} />
          <Route path="/clinic"          element={<ClinicPage />} />
          <Route path="/departments"    element={<DepartmentsPage />} />
          <Route path="/medical-staff"  element={<MedicalStaffPage />} />
          <Route path="/permissions/roles" element={<RolePermissionsPage />} />
          <Route path="/permissions/users" element={<UserOverridesPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
)

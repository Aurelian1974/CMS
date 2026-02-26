import { Navigate } from 'react-router-dom'

/**
 * Formularul pacient e implementat ca modal în PatientsListPage.
 * Acest placeholder redirecționează înapoi la lista de pacienți.
 */
export const PatientFormPage = () => <Navigate to="/patients" replace />

export default PatientFormPage

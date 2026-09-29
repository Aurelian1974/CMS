import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { useAuthStore } from '@/store/authStore'

/** Oglinda regulii din AppointmentsController.UpdateStatus: Write pe programări sau asistentă cu Read. */
export const useCanChangeAppointmentStatus = (): boolean => {
  const role = useAuthStore((s) => s.user?.role)
  const { canRead, canWrite } = useHasAccess()
  return canWrite(MODULE.Appointments) || (role === 'nurse' && canRead(MODULE.Appointments))
}

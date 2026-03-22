import { z } from 'zod'

/// Schema principală programare (date și ora sunt câmpuri separate în formular)
export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Pacientul este obligatoriu'),
  doctorId:  z.string().min(1, 'Doctorul este obligatoriu'),
  date:      z.string().min(1, 'Data este obligatorie'),
  startTime: z.string().min(1, 'Ora de început este obligatorie'),
  endTime:   z.string().min(1, 'Ora de sfârșit este obligatorie'),
  statusId:  z.string().optional().or(z.literal('')),
  notes:     z.string().max(2000, 'Maxim 2000 caractere').optional().or(z.literal('')),
}).refine(data => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime
  }
  return true
}, {
  message: 'Ora de sfârșit trebuie să fie după ora de început',
  path: ['endTime'],
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>

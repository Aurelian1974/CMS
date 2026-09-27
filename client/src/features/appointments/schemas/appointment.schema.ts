import { z } from 'zod'

const TIME_REGEX = /^\d{2}:\d{2}$/
export const MIN_APPOINTMENT_MINUTES = 5

/** "HH:mm" → minute de la miezul nopții (comparație numerică, nu lexicografică) */
export const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/// Schema principală programare (data și orele sunt câmpuri separate în formular)
export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Pacientul este obligatoriu'),
  doctorId:  z.string().min(1, 'Doctorul este obligatoriu'),
  date:      z.string().min(1, 'Data este obligatorie'),
  startTime: z.string().min(1, 'Ora de început este obligatorie').regex(TIME_REGEX, 'Oră invalidă'),
  endTime:   z.string().min(1, 'Ora de sfârșit este obligatorie').regex(TIME_REGEX, 'Oră invalidă'),
  statusId:  z.string().optional().or(z.literal('')),
  notes:     z.string().trim().max(2000, 'Maxim 2000 caractere').optional().or(z.literal('')),
  overrideSchedule: z.boolean().optional(),
})
  .refine(d => !TIME_REGEX.test(d.startTime) || !TIME_REGEX.test(d.endTime) || toMinutes(d.endTime) > toMinutes(d.startTime), {
    message: 'Ora de sfârșit trebuie să fie după ora de început',
    path: ['endTime'],
  })
  .refine(d => !TIME_REGEX.test(d.startTime) || !TIME_REGEX.test(d.endTime)
    || toMinutes(d.endTime) <= toMinutes(d.startTime)
    || toMinutes(d.endTime) - toMinutes(d.startTime) >= MIN_APPOINTMENT_MINUTES, {
    message: `Programarea trebuie să dureze cel puțin ${MIN_APPOINTMENT_MINUTES} minute`,
    path: ['endTime'],
  })

export type AppointmentFormData = z.infer<typeof appointmentSchema>

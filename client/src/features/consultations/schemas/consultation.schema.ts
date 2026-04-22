import { z } from 'zod'

export const consultationSchema = z.object({
  patientId: z.string().min(1, 'Pacientul este obligatoriu'),
  doctorId: z.string().min(1, 'Doctorul este obligatoriu'),
  appointmentId: z.string().optional().or(z.literal('')),
  date: z.string().min(1, 'Data consultației este obligatorie'),
  // Tab 1: Anamneză
  motiv: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  istoricMedicalPersonal: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  tratamentAnterior: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  istoricBoalaActuala: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  istoricFamilial: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  factoriDeRisc: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  alergiiConsultatie: z.string().max(2000, 'Maxim 2000 caractere').optional().or(z.literal('')),
  // Tab 2: Examen Clinic
  stareGenerala: z.string().optional().or(z.literal('')),
  tegumente: z.string().optional().or(z.literal('')),
  mucoase: z.string().optional().or(z.literal('')),
  greutate: z.number().nullable().optional(),
  inaltime: z.number().int().nullable().optional(),
  tensiuneSistolica: z.number().int().nullable().optional(),
  tensiuneDiastolica: z.number().int().nullable().optional(),
  puls: z.number().int().nullable().optional(),
  frecventaRespiratorie: z.number().int().nullable().optional(),
  temperatura: z.number().nullable().optional(),
  spO2: z.number().int().nullable().optional(),
  edeme: z.string().optional().or(z.literal('')),
  glicemie: z.number().nullable().optional(),
  ganglioniLimfatici: z.string().optional().or(z.literal('')),
  examenClinic: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  alteObservatiiClinice: z.string().max(2000, 'Maxim 2000 caractere').optional().or(z.literal('')),
  // Tab 3: Investigații
  investigatii: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  // Tab 4: Analize Medicale
  analizeMedicale: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  // Tab 5: Diagnostic & Tratament
  diagnostic: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  diagnosticCodes: z.string().max(2000, 'Maxim 2000 caractere').optional().or(z.literal('')),
  recomandari: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  observatii: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  // Tab 6: Concluzii
  concluzii: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  esteAfectiuneOncologica: z.boolean().optional(),
  areIndicatieInternare: z.boolean().optional(),
  saEliberatPrescriptie: z.boolean().optional(),
  seriePrescriptie: z.string().max(100).optional().or(z.literal('')),
  saEliberatConcediuMedical: z.boolean().optional(),
  serieConcediuMedical: z.string().max(100).optional().or(z.literal('')),
  saEliberatIngrijiriDomiciliu: z.boolean().optional(),
  saEliberatDispozitiveMedicale: z.boolean().optional(),
  dataUrmatoareiVizite: z.string().optional().or(z.literal('')),
  noteUrmatoareaVizita: z.string().optional().or(z.literal('')),
  statusId: z.string().optional().or(z.literal('')),
})

export type ConsultationFormData = z.infer<typeof consultationSchema>

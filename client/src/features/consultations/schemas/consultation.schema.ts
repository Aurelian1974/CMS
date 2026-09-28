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
  greutate: z.number().min(0.5, 'Minim 0,5 kg').max(500, 'Maxim 500 kg').nullable().optional(),
  inaltime: z.number().int().min(20, 'Minim 20 cm').max(250, 'Maxim 250 cm').nullable().optional(),
  tensiuneSistolica: z.number().int().min(40, 'Minim 40 mmHg').max(300, 'Maxim 300 mmHg').nullable().optional(),
  tensiuneDiastolica: z.number().int().min(20, 'Minim 20 mmHg').max(200, 'Maxim 200 mmHg').nullable().optional(),
  puls: z.number().int().min(20, 'Minim 20 bpm').max(300, 'Maxim 300 bpm').nullable().optional(),
  frecventaRespiratorie: z.number().int().min(5, 'Minim 5 resp/min').max(100, 'Maxim 100 resp/min').nullable().optional(),
  temperatura: z.number().min(30, 'Minim 30 °C').max(45, 'Maxim 45 °C').nullable().optional(),
  spO2: z.number().int().min(50, 'Minim 50%').max(100, 'Maxim 100%').nullable().optional(),
  edeme: z.string().optional().or(z.literal('')),
  glicemie: z.number().min(10, 'Minim 10 mg/dL').max(1000, 'Maxim 1000 mg/dL').nullable().optional(),
  ganglioniLimfatici: z.string().optional().or(z.literal('')),
  examenClinic: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  alteObservatiiClinice: z.string().max(2000, 'Maxim 2000 caractere').optional().or(z.literal('')),
  // Tab 3: Investigații
  investigatii: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  // Tab 4: Analize Medicale
  analizeMedicale: z.string().max(4000, 'Maxim 4000 caractere').optional().or(z.literal('')),
  // Tab 5: Diagnostic & Tratament
  // JSON-ul ICD-10 (cu rich-text) e serializat în acest câmp; limita e doar anti-abuz
  diagnostic: z.string().max(100_000, 'Maxim 100000 caractere').optional().or(z.literal('')),
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
}).superRefine((v, ctx) => {
  if (v.tensiuneSistolica != null && v.tensiuneDiastolica != null && v.tensiuneSistolica <= v.tensiuneDiastolica) {
    ctx.addIssue({
      code: 'custom',
      path: ['tensiuneSistolica'],
      message: 'Tensiunea sistolică trebuie să fie mai mare decât cea diastolică',
    })
  }
})

export type ConsultationFormData = z.infer<typeof consultationSchema>

import { z } from 'zod'

/// Schema Zod — creare / editare personal medical
export const medicalStaffSchema = z.object({
  departmentId:       z.string().optional().or(z.literal('')),
  supervisorDoctorId: z.string().optional().or(z.literal('')),
  medicalTitleId:     z.string().optional().or(z.literal('')),

  firstName:   z.string().min(1, 'Prenumele este obligatoriu').max(100, 'Maxim 100 caractere'),
  lastName:    z.string().min(1, 'Numele este obligatoriu').max(100, 'Maxim 100 caractere'),
  email:       z.string().min(1, 'Email-ul este obligatoriu').email('Email invalid'),
  phoneNumber: z.string().max(20, 'Maxim 20 caractere').optional().or(z.literal('')),

  isActive: z.boolean(),
})

export type MedicalStaffFormData = z.infer<typeof medicalStaffSchema>

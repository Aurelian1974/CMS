import { z } from 'zod'
import { isValidPhoneNumber } from 'react-phone-number-input'

/// Schema Zod — creare / editare doctor
export const doctorSchema = z.object({
  departmentId:       z.string().optional().or(z.literal('')),
  supervisorDoctorId: z.string().optional().or(z.literal('')),
  specialtyId:        z.string().optional().or(z.literal('')),
  subspecialtyId:     z.string().optional().or(z.literal('')),
  medicalTitleId:     z.string().optional().or(z.literal('')),

  firstName:  z.string().min(1, 'Prenumele este obligatoriu').max(100, 'Maxim 100 caractere'),
  lastName:   z.string().min(1, 'Numele este obligatoriu').max(100, 'Maxim 100 caractere'),
  email:      z.string().min(1, 'Email-ul este obligatoriu').email('Email invalid'),
  phoneNumber:  z.string().refine(v => !v || isValidPhoneNumber(v), 'Număr de telefon invalid').optional().or(z.literal('')),
  medicalCode:  z.string().max(20, 'Maxim 20 caractere').optional().or(z.literal('')),
  licenseNumber: z.string().max(50, 'Maxim 50 caractere').optional().or(z.literal('')),
  licenseExpiresAt: z.string().optional().or(z.literal('')),

  isActive: z.boolean(),
})

export type DoctorFormData = z.infer<typeof doctorSchema>

import { z } from 'zod'

/// Regex CNP — 13 cifre, prima cifră 1-9
const cnpRegex = /^[1-9]\d{12}$/

/// Schema alergie
export const allergySchema = z.object({
  allergyTypeId:     z.string().min(1, 'Tipul alergiei este obligatoriu'),
  allergySeverityId: z.string().min(1, 'Severitatea este obligatorie'),
  allergenName:      z.string().min(1, 'Alergenul este obligatoriu').max(200, 'Maxim 200 caractere'),
  notes:             z.string().max(500, 'Maxim 500 caractere').optional().or(z.literal('')),
})

/// Schema doctor asignat
export const patientDoctorSchema = z.object({
  doctorId:  z.string().min(1, 'Doctorul este obligatoriu'),
  isPrimary: z.boolean(),
})

/// Schema contact urgență
export const emergencyContactSchema = z.object({
  fullName:     z.string().min(1, 'Numele este obligatoriu').max(200, 'Maxim 200 caractere'),
  relationship: z.string().max(100, 'Maxim 100 caractere').optional().or(z.literal('')),
  phoneNumber:  z.string().min(1, 'Telefonul este obligatoriu').max(20, 'Maxim 20 caractere'),
  isDefault:    z.boolean(),
})

/// Schema principală pacient
export const patientSchema = z.object({
  firstName:  z.string().min(1, 'Prenumele este obligatoriu').max(100, 'Maxim 100 caractere'),
  lastName:   z.string().min(1, 'Numele este obligatoriu').max(100, 'Maxim 100 caractere'),
  cnp:        z.string().regex(cnpRegex, 'CNP-ul trebuie să aibă 13 cifre valide'),

  birthDate:          z.string().optional().or(z.literal('')),
  genderId:           z.string().optional().or(z.literal('')),
  bloodTypeId:        z.string().optional().or(z.literal('')),
  phoneNumber:        z.string().max(20, 'Maxim 20 caractere').optional().or(z.literal('')),
  secondaryPhone:     z.string().max(20, 'Maxim 20 caractere').optional().or(z.literal('')),
  email:              z.string().email('Email invalid').optional().or(z.literal('')),
  address:            z.string().max(500, 'Maxim 500 caractere').optional().or(z.literal('')),
  city:               z.string().max(100, 'Maxim 100 caractere').optional().or(z.literal('')),
  county:             z.string().max(100, 'Maxim 100 caractere').optional().or(z.literal('')),
  postalCode:         z.string().max(10, 'Maxim 10 caractere').optional().or(z.literal('')),
  insuranceNumber:    z.string().max(20, 'Maxim 20 caractere').optional().or(z.literal('')),
  insuranceExpiry:    z.string().optional().or(z.literal('')),
  isInsured:          z.boolean(),
  chronicDiseases:    z.string().max(2000, 'Maxim 2000 caractere').optional().or(z.literal('')),
  familyDoctorName:   z.string().max(200, 'Maxim 200 caractere').optional().or(z.literal('')),
  notes:              z.string().max(2000, 'Maxim 2000 caractere').optional().or(z.literal('')),

  isActive: z.boolean(),

  allergies:         z.array(allergySchema).optional(),
  doctors:           z.array(patientDoctorSchema).optional(),
  emergencyContacts: z.array(emergencyContactSchema).optional(),
})

export type PatientFormData = z.infer<typeof patientSchema>

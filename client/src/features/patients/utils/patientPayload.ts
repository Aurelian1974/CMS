import type { PatientFormData } from '../schemas/patient.schema'
import type { CreatePatientPayload } from '../types/patient.types'

/// String gol → null (backend-ul așteaptă null, nu '')
const toNull = (v: string | undefined): string | null => v || null

/**
 * Transformă datele formularului în payload-ul API.
 *
 * Folosit atât la creare cât și la editare (unde se adaugă `id` + `isActive`),
 * din pagina de listă și din pagina de detalii — o singură implementare, ca să
 * nu se piardă câmpuri pe una din rute.
 *
 * ATENȚIE: sub-colecțiile (alergii, medici, contacte) sunt sincronizate integral
 * de backend — ce nu e trimis aici este dezactivat în baza de date. Nu trimite
 * niciodată array-uri goale dacă formularul nu a fost populat cu datele reale.
 */
export const buildPatientPayload = (formData: PatientFormData): CreatePatientPayload => ({
  firstName:        formData.firstName,
  lastName:         formData.lastName,
  cnp:              formData.cnp,
  birthDate:        toNull(formData.birthDate),
  genderId:         toNull(formData.genderId),
  bloodTypeId:      toNull(formData.bloodTypeId),
  phoneNumber:      toNull(formData.phoneNumber),
  secondaryPhone:   toNull(formData.secondaryPhone),
  email:            toNull(formData.email),
  address:          toNull(formData.address),
  city:             toNull(formData.city),
  county:           toNull(formData.county),
  postalCode:       toNull(formData.postalCode),
  insuranceNumber:  toNull(formData.insuranceNumber),
  insuranceExpiry:  toNull(formData.insuranceExpiry),
  isInsured:        formData.isInsured,
  chronicDiseases:  toNull(formData.chronicDiseases),
  familyDoctorName: toNull(formData.familyDoctorName),
  notes:            toNull(formData.notes),
  allergies: formData.allergies?.map(a => ({
    allergyTypeId:     a.allergyTypeId,
    allergySeverityId: a.allergySeverityId,
    allergenName:      a.allergenName,
    reaction:          toNull(a.reaction),
    onsetDate:         toNull(a.onsetDate),
    notes:             toNull(a.notes),
  })),
  doctors: formData.doctors?.map(d => ({
    doctorId:  d.doctorId,
    isPrimary: d.isPrimary,
    notes:     toNull(d.notes),
  })),
  emergencyContacts: formData.emergencyContacts?.map(ec => ({
    fullName:     ec.fullName,
    relationship: toNull(ec.relationship),
    phoneNumber:  ec.phoneNumber ?? '',
    isDefault:    ec.isDefault,
    notes:        toNull(ec.notes),
  })),
})

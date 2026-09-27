/**
 * Teste unitare pentru features/patients/utils/patientPayload.ts
 *
 * Contract critic: backend-ul sincronizează INTEGRAL sub-colecțiile (alergii,
 * medici, contacte de urgență) — orice câmp pierdut aici se pierde și în baza
 * de date. Testele blochează exact regresiile de tipul "am uitat să trimit
 * reaction / onsetDate / notes".
 */
import { describe, it, expect } from 'vitest';
import { buildPatientPayload } from '@/features/patients/utils/patientPayload';
import type { PatientFormData } from '@/features/patients/schemas/patient.schema';

const baseForm: PatientFormData = {
  firstName: 'Ion',
  lastName: 'Popescu',
  cnp: '1900101123457',
  birthDate: '1990-01-01',
  genderId: 'gender-1',
  bloodTypeId: 'blood-1',
  phoneNumber: '+40721234567',
  secondaryPhone: '+40722345678',
  email: 'ion@test.ro',
  address: 'Str. Principală 1',
  city: 'Cluj-Napoca',
  county: 'Cluj',
  postalCode: '400000',
  insuranceNumber: 'AS123',
  insuranceExpiry: '2027-01-01',
  isInsured: true,
  chronicDiseases: 'Diabet',
  familyDoctorName: 'Dr. Ionescu',
  notes: 'Observații',
  isActive: true,
  allergies: [],
  doctors: [],
  emergencyContacts: [],
};

describe('buildPatientPayload', () => {
  it('trimite toate câmpurile scalare completate', () => {
    const payload = buildPatientPayload(baseForm);

    expect(payload).toMatchObject({
      firstName: 'Ion',
      lastName: 'Popescu',
      cnp: '1900101123457',
      birthDate: '1990-01-01',
      genderId: 'gender-1',
      bloodTypeId: 'blood-1',
      phoneNumber: '+40721234567',
      secondaryPhone: '+40722345678',
      email: 'ion@test.ro',
      city: 'Cluj-Napoca',
      county: 'Cluj',
      postalCode: '400000',
      insuranceNumber: 'AS123',
      insuranceExpiry: '2027-01-01',
      isInsured: true,
      chronicDiseases: 'Diabet',
      familyDoctorName: 'Dr. Ionescu',
      notes: 'Observații',
    });
  });

  it('convertește string-urile goale în null', () => {
    const payload = buildPatientPayload({
      ...baseForm,
      birthDate: '',
      email: '',
      secondaryPhone: '',
      postalCode: '',
      chronicDiseases: '',
      notes: '',
    });

    expect(payload.birthDate).toBeNull();
    expect(payload.email).toBeNull();
    expect(payload.secondaryPhone).toBeNull();
    expect(payload.postalCode).toBeNull();
    expect(payload.chronicDiseases).toBeNull();
    expect(payload.notes).toBeNull();
  });

  it('păstrează toate câmpurile alergiei, inclusiv reaction și onsetDate', () => {
    const payload = buildPatientPayload({
      ...baseForm,
      allergies: [
        {
          allergyTypeId: 'type-1',
          allergySeverityId: 'sev-1',
          allergenName: 'Penicilină',
          reaction: 'Urticarie',
          onsetDate: '2020-05-01',
          notes: 'Evitare strictă',
        },
      ],
    });

    expect(payload.allergies).toEqual([
      {
        allergyTypeId: 'type-1',
        allergySeverityId: 'sev-1',
        allergenName: 'Penicilină',
        reaction: 'Urticarie',
        onsetDate: '2020-05-01',
        notes: 'Evitare strictă',
      },
    ]);
  });

  it('păstrează medicii asociați cu flagul de medic primar', () => {
    const payload = buildPatientPayload({
      ...baseForm,
      doctors: [
        { doctorId: 'doc-1', isPrimary: true, notes: 'Medic curant' },
        { doctorId: 'doc-2', isPrimary: false, notes: '' },
      ],
    });

    expect(payload.doctors).toEqual([
      { doctorId: 'doc-1', isPrimary: true, notes: 'Medic curant' },
      { doctorId: 'doc-2', isPrimary: false, notes: null },
    ]);
  });

  it('păstrează contactele de urgență, inclusiv notes', () => {
    const payload = buildPatientPayload({
      ...baseForm,
      emergencyContacts: [
        {
          fullName: 'Maria Popescu',
          relationship: 'Soție',
          phoneNumber: '+40733456789',
          isDefault: true,
          notes: 'Apel prioritar',
        },
      ],
    });

    expect(payload.emergencyContacts).toEqual([
      {
        fullName: 'Maria Popescu',
        relationship: 'Soție',
        phoneNumber: '+40733456789',
        isDefault: true,
        notes: 'Apel prioritar',
      },
    ]);
  });
});

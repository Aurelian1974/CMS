/**
 * Teste unitare pentru features/patients/schemas/patient.schema.ts
 * Verifică validarea Zod pentru:
 * - patientSchema: câmpuri obligatorii, CNP, email, lungimi maxime
 * - allergySchema: câmpuri obligatorii și maxime
 * - emergencyContactSchema: câmpuri obligatorii
 */
import { describe, it, expect } from 'vitest';
import {
  patientSchema,
  allergySchema,
  emergencyContactSchema,
  patientDoctorSchema,
} from '@/features/patients/schemas/patient.schema';

// ── Date valide de bază ───────────────────────────────────────────────────────

const validPatient = {
  firstName: 'Ion',
  lastName: 'Popescu',
  cnp: '1900101123456',
  isInsured: false,
  isActive: true,
};

// ── patientSchema ─────────────────────────────────────────────────────────────

describe('patientSchema', () => {
  describe('pacient valid minim', () => {
    it('acceptă câmpurile obligatorii fără cele opționale', () => {
      const result = patientSchema.safeParse(validPatient);
      expect(result.success).toBe(true);
    });

    it('acceptă pacient complet cu toate câmpurile opționale', () => {
      const full = {
        ...validPatient,
        birthDate: '1990-01-15',
        genderId: 'some-guid',
        bloodTypeId: 'some-guid',
        email: 'ion@test.ro',
        address: 'Str. Principală 1',
        city: 'Cluj-Napoca',
        county: 'Cluj',
        postalCode: '400000',
        chronicDiseases: 'Diabet',
        familyDoctorName: 'Dr. Ionescu',
        notes: 'Fără note speciale.',
        allergies: [],
        doctors: [],
        emergencyContacts: [],
      };
      expect(patientSchema.safeParse(full).success).toBe(true);
    });
  });

  // ── firstName ──────────────────────────────────────────────────────────────

  describe('firstName', () => {
    it('eșuează când este gol', () => {
      const result = patientSchema.safeParse({ ...validPatient, firstName: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('obligatoriu');
      }
    });

    it('eșuează când depășește 100 caractere', () => {
      const result = patientSchema.safeParse({
        ...validPatient,
        firstName: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('acceptă exact 100 caractere', () => {
      const result = patientSchema.safeParse({
        ...validPatient,
        firstName: 'a'.repeat(100),
      });
      expect(result.success).toBe(true);
    });
  });

  // ── lastName ───────────────────────────────────────────────────────────────

  describe('lastName', () => {
    it('eșuează când este gol', () => {
      const result = patientSchema.safeParse({ ...validPatient, lastName: '' });
      expect(result.success).toBe(false);
    });

    it('eșuează când depășește 100 caractere', () => {
      const result = patientSchema.safeParse({
        ...validPatient,
        lastName: 'z'.repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  // ── cnp ────────────────────────────────────────────────────────────────────

  describe('cnp', () => {
    it('acceptă CNP valid cu prima cifră 1', () => {
      expect(patientSchema.safeParse({ ...validPatient, cnp: '1900101123456' }).success).toBe(true);
    });

    it('acceptă CNP valid cu prima cifră 2 (feminin)', () => {
      expect(patientSchema.safeParse({ ...validPatient, cnp: '2850202234567' }).success).toBe(true);
    });

    it('acceptă CNP valid cu prima cifră 9', () => {
      expect(patientSchema.safeParse({ ...validPatient, cnp: '9010101999999' }).success).toBe(true);
    });

    it('eșuează când CNP-ul începe cu 0', () => {
      const result = patientSchema.safeParse({ ...validPatient, cnp: '0900101123456' });
      expect(result.success).toBe(false);
    });

    it('eșuează când CNP-ul are 12 cifre (prea scurt)', () => {
      const result = patientSchema.safeParse({ ...validPatient, cnp: '190010112345' });
      expect(result.success).toBe(false);
    });

    it('eșuează când CNP-ul are 14 cifre (prea lung)', () => {
      const result = patientSchema.safeParse({ ...validPatient, cnp: '19001011234567' });
      expect(result.success).toBe(false);
    });

    it('eșuează când CNP-ul conține o literă', () => {
      const result = patientSchema.safeParse({ ...validPatient, cnp: '1900101A23456' });
      expect(result.success).toBe(false);
    });

    it('eșuează când este gol', () => {
      const result = patientSchema.safeParse({ ...validPatient, cnp: '' });
      expect(result.success).toBe(false);
    });
  });

  // ── email (opțional) ───────────────────────────────────────────────────────

  describe('email (opțional)', () => {
    it('acceptă string gol (câmp opțional)', () => {
      expect(patientSchema.safeParse({ ...validPatient, email: '' }).success).toBe(true);
    });

    it('acceptă undefined', () => {
      const { email: _, ...withoutEmail } = { ...validPatient, email: undefined };
      expect(patientSchema.safeParse(withoutEmail).success).toBe(true);
    });

    it('acceptă email valid', () => {
      expect(
        patientSchema.safeParse({ ...validPatient, email: 'test@example.com' }).success
      ).toBe(true);
    });

    it('eșuează pentru email invalid', () => {
      const result = patientSchema.safeParse({ ...validPatient, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('acceptă email valid lung (schema Zod nu restricționează lungimea)', () => {
      // Nota: restricția MaxLength 200 există în backend (FluentValidation),
      // dar schema Zod frontendului validează doar formatul email-ului.
      const result = patientSchema.safeParse({
        ...validPatient,
        email: 'a'.repeat(192) + '@test.ro',
      });
      expect(result.success).toBe(true);
    });
  });

  // ── câmpuri cu lungime maximă ──────────────────────────────────────────────

  describe('câmpuri opționale cu MaxLength', () => {
    it('address — eșuează peste 500 caractere', () => {
      const result = patientSchema.safeParse({
        ...validPatient,
        address: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('city — eșuează peste 100 caractere', () => {
      const result = patientSchema.safeParse({
        ...validPatient,
        city: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('postalCode — eșuează peste 10 caractere', () => {
      const result = patientSchema.safeParse({
        ...validPatient,
        postalCode: '12345678901',
      });
      expect(result.success).toBe(false);
    });

    it('notes — eșuează peste 2000 caractere', () => {
      const result = patientSchema.safeParse({
        ...validPatient,
        notes: 'n'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it('chronicDiseases — eșuează peste 2000 caractere', () => {
      const result = patientSchema.safeParse({
        ...validPatient,
        chronicDiseases: 'x'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });
  });
});

// ── allergySchema ─────────────────────────────────────────────────────────────

describe('allergySchema', () => {
  const validAllergy = {
    allergyTypeId: 'type-guid-1234',
    allergySeverityId: 'severity-guid-1234',
    allergenName: 'Penicillin',
  };

  it('acceptă alergie validă', () => {
    expect(allergySchema.safeParse(validAllergy).success).toBe(true);
  });

  it('acceptă alergie cu câmpuri opționale completate', () => {
    const full = {
      ...validAllergy,
      reaction: 'Urticarie',
      onsetDate: '2024-01-01',
      notes: 'Evitare strictă',
    };
    expect(allergySchema.safeParse(full).success).toBe(true);
  });

  it('eșuează când allergyTypeId este gol', () => {
    const result = allergySchema.safeParse({ ...validAllergy, allergyTypeId: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('obligatoriu');
    }
  });

  it('eșuează când allergySeverityId este gol', () => {
    const result = allergySchema.safeParse({ ...validAllergy, allergySeverityId: '' });
    expect(result.success).toBe(false);
  });

  it('eșuează când allergenName este gol', () => {
    const result = allergySchema.safeParse({ ...validAllergy, allergenName: '' });
    expect(result.success).toBe(false);
  });

  it('eșuează când allergenName depășește 200 caractere', () => {
    const result = allergySchema.safeParse({
      ...validAllergy,
      allergenName: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('acceptă allergenName de exact 200 caractere', () => {
    const result = allergySchema.safeParse({
      ...validAllergy,
      allergenName: 'a'.repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it('notes — eșuează peste 500 caractere', () => {
    const result = allergySchema.safeParse({
      ...validAllergy,
      notes: 'n'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// ── emergencyContactSchema ────────────────────────────────────────────────────

describe('emergencyContactSchema', () => {
  const validContact = {
    fullName: 'Maria Ionescu',
    isDefault: false,
  };

  it('acceptă contact valid cu câmpuri obligatorii', () => {
    expect(emergencyContactSchema.safeParse(validContact).success).toBe(true);
  });

  it('acceptă contact cu câmpuri opționale completate', () => {
    const full = {
      ...validContact,
      relationship: 'Soție',
      phoneNumber: '',
      notes: 'Cu prioritate',
    };
    expect(emergencyContactSchema.safeParse(full).success).toBe(true);
  });

  it('eșuează când fullName este gol', () => {
    const result = emergencyContactSchema.safeParse({ ...validContact, fullName: '' });
    expect(result.success).toBe(false);
  });

  it('eșuează când fullName depășește 200 caractere', () => {
    const result = emergencyContactSchema.safeParse({
      ...validContact,
      fullName: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('acceptă fullName de exact 200 caractere', () => {
    const result = emergencyContactSchema.safeParse({
      ...validContact,
      fullName: 'a'.repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it('relationship — eșuează peste 100 caractere', () => {
    const result = emergencyContactSchema.safeParse({
      ...validContact,
      relationship: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

// ── patientDoctorSchema ───────────────────────────────────────────────────────

describe('patientDoctorSchema', () => {
  it('acceptă schema validă', () => {
    expect(
      patientDoctorSchema.safeParse({ doctorId: 'some-guid', isPrimary: true }).success
    ).toBe(true);
  });

  it('eșuează când doctorId este gol', () => {
    const result = patientDoctorSchema.safeParse({ doctorId: '', isPrimary: false });
    expect(result.success).toBe(false);
  });

  it('acceptă notes opțional', () => {
    expect(
      patientDoctorSchema.safeParse({
        doctorId: 'some-guid',
        isPrimary: false,
        notes: 'Medic de familie',
      }).success
    ).toBe(true);
  });
});

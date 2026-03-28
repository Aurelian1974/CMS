/**
 * Contract Tests: Backend ↔ Frontend Type Compatibility
 *
 * These tests are entirely type-level — they are verified at TypeScript compile
 * time, not at runtime. If the backend renames or removes a DTO field, the
 * generated schema.d.ts will no longer have that property, and the corresponding
 * `expectTypeOf(...).toHaveProperty(key)` call will fail to compile with:
 *   "Argument of type 'string' is not assignable to parameter of type 'never'"
 *
 * This catches backend ↔ frontend desynchronisations BEFORE runtime.
 *
 * Developer workflow after changing a backend DTO:
 *   1. Run `.\generate-openapi.ps1` from the solution root
 *   2. Run `npm run check:api` in the client folder
 *      (regenerates schema.d.ts and type-checks the whole project)
 */
import { describe, it } from 'vitest'
import { expectTypeOf } from 'vitest'
import type { components } from '../api/generated/schema'

// ── Shorthand aliases for backend-generated schema types ───────────────────────
type S = components['schemas']

type ApiUserList     = S['UserListDto']
type ApiUserDetail   = S['UserDetailDto']
type ApiRole         = S['RoleDto']

type ApiAppointmentList          = S['AppointmentListDto']
type ApiAppointmentDetail        = S['AppointmentDetailDto']
type ApiAppointmentScheduler     = S['AppointmentSchedulerDto']
type ApiAppointmentsPagedResponse = S['AppointmentsPagedResponse']
type ApiAppointmentStats         = S['AppointmentStatsDto']

type ApiPatientList             = S['PatientListDto']
type ApiPatientFull             = S['PatientFullDetailDto']
type ApiPatientAllergy          = S['PatientAllergyDto']
type ApiPatientDoctor           = S['PatientDoctorDto']
type ApiPatientEmergencyContact = S['PatientEmergencyContactDto']

type ApiDoctorList   = S['DoctorListDto']
type ApiDoctorDetail = S['DoctorDetailDto']
type ApiDoctorLookup = S['DoctorLookupDto']

type ApiMedicalStaffList   = S['MedicalStaffListDto']
type ApiMedicalStaffDetail = S['MedicalStaffDetailDto']
type ApiMedicalStaffLookup = S['MedicalStaffLookupDto']

type ApiCnasSyncStatus  = S['CnasSyncStatusDto']
type ApiCnasSyncHistory = S['CnasSyncHistoryDto']
type ApiCnasSyncStats   = S['CnasSyncStatsDto']

// ── Contract assertions ────────────────────────────────────────────────────────

describe('Contract: Backend ↔ Frontend DTO shape compatibility', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // USERS
  // ──────────────────────────────────────────────────────────────────────────
  describe('Users', () => {
    it('UserListDto exposes all fields consumed by the frontend UserDto', () => {
      expectTypeOf<ApiUserList>().toHaveProperty('id')
      expectTypeOf<ApiUserList>().toHaveProperty('clinicId')
      expectTypeOf<ApiUserList>().toHaveProperty('roleId')
      expectTypeOf<ApiUserList>().toHaveProperty('roleName')
      expectTypeOf<ApiUserList>().toHaveProperty('roleCode')
      expectTypeOf<ApiUserList>().toHaveProperty('doctorId')
      expectTypeOf<ApiUserList>().toHaveProperty('doctorName')
      expectTypeOf<ApiUserList>().toHaveProperty('medicalStaffId')
      expectTypeOf<ApiUserList>().toHaveProperty('medicalStaffName')
      expectTypeOf<ApiUserList>().toHaveProperty('username')
      expectTypeOf<ApiUserList>().toHaveProperty('email')
      expectTypeOf<ApiUserList>().toHaveProperty('firstName')
      expectTypeOf<ApiUserList>().toHaveProperty('lastName')
      expectTypeOf<ApiUserList>().toHaveProperty('isActive')
      expectTypeOf<ApiUserList>().toHaveProperty('lastLoginAt')
      expectTypeOf<ApiUserList>().toHaveProperty('createdAt')
    })

    it('UserDetailDto exposes additional audit/lockout fields', () => {
      expectTypeOf<ApiUserDetail>().toHaveProperty('failedLoginAttempts')
      expectTypeOf<ApiUserDetail>().toHaveProperty('lockoutEnd')
      expectTypeOf<ApiUserDetail>().toHaveProperty('updatedAt')
    })

    it('RoleDto exposes id, name, and code', () => {
      expectTypeOf<ApiRole>().toHaveProperty('id')
      expectTypeOf<ApiRole>().toHaveProperty('name')
      expectTypeOf<ApiRole>().toHaveProperty('code')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // APPOINTMENTS
  // ──────────────────────────────────────────────────────────────────────────
  describe('Appointments', () => {
    it('AppointmentListDto exposes all fields consumed by the frontend AppointmentDto', () => {
      expectTypeOf<ApiAppointmentList>().toHaveProperty('id')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('clinicId')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('patientId')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('patientName')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('patientPhone')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('doctorId')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('doctorName')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('specialtyName')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('startTime')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('endTime')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('statusId')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('statusName')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('statusCode')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('notes')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('isDeleted')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('createdAt')
      expectTypeOf<ApiAppointmentList>().toHaveProperty('createdByName')
    })

    it('AppointmentDetailDto exposes additional detail and audit fields', () => {
      expectTypeOf<ApiAppointmentDetail>().toHaveProperty('patientCnp')
      expectTypeOf<ApiAppointmentDetail>().toHaveProperty('patientEmail')
      expectTypeOf<ApiAppointmentDetail>().toHaveProperty('doctorMedicalCode')
      expectTypeOf<ApiAppointmentDetail>().toHaveProperty('updatedAt')
      expectTypeOf<ApiAppointmentDetail>().toHaveProperty('updatedBy')
      expectTypeOf<ApiAppointmentDetail>().toHaveProperty('updatedByName')
    })

    it('AppointmentSchedulerDto exposes fields used by the calendar/scheduler view', () => {
      expectTypeOf<ApiAppointmentScheduler>().toHaveProperty('id')
      expectTypeOf<ApiAppointmentScheduler>().toHaveProperty('patientId')
      expectTypeOf<ApiAppointmentScheduler>().toHaveProperty('patientName')
      expectTypeOf<ApiAppointmentScheduler>().toHaveProperty('doctorId')
      expectTypeOf<ApiAppointmentScheduler>().toHaveProperty('doctorName')
      expectTypeOf<ApiAppointmentScheduler>().toHaveProperty('startTime')
      expectTypeOf<ApiAppointmentScheduler>().toHaveProperty('endTime')
      expectTypeOf<ApiAppointmentScheduler>().toHaveProperty('statusId')
      expectTypeOf<ApiAppointmentScheduler>().toHaveProperty('statusName')
      expectTypeOf<ApiAppointmentScheduler>().toHaveProperty('statusCode')
      expectTypeOf<ApiAppointmentScheduler>().toHaveProperty('notes')
    })

    it('AppointmentsPagedResponse has pagedResult and stats top-level keys', () => {
      expectTypeOf<ApiAppointmentsPagedResponse>().toHaveProperty('pagedResult')
      expectTypeOf<ApiAppointmentsPagedResponse>().toHaveProperty('stats')
    })

    it('AppointmentStatsDto exposes all status count fields', () => {
      expectTypeOf<ApiAppointmentStats>().toHaveProperty('totalAppointments')
      expectTypeOf<ApiAppointmentStats>().toHaveProperty('scheduledCount')
      expectTypeOf<ApiAppointmentStats>().toHaveProperty('confirmedCount')
      expectTypeOf<ApiAppointmentStats>().toHaveProperty('completedCount')
      expectTypeOf<ApiAppointmentStats>().toHaveProperty('cancelledCount')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // PATIENTS
  // ──────────────────────────────────────────────────────────────────────────
  describe('Patients', () => {
    it('PatientListDto exposes all fields consumed by the frontend PatientDto', () => {
      expectTypeOf<ApiPatientList>().toHaveProperty('id')
      expectTypeOf<ApiPatientList>().toHaveProperty('clinicId')
      expectTypeOf<ApiPatientList>().toHaveProperty('patientCode')
      expectTypeOf<ApiPatientList>().toHaveProperty('firstName')
      expectTypeOf<ApiPatientList>().toHaveProperty('lastName')
      expectTypeOf<ApiPatientList>().toHaveProperty('fullName')
      expectTypeOf<ApiPatientList>().toHaveProperty('cnp')
      expectTypeOf<ApiPatientList>().toHaveProperty('birthDate')
      expectTypeOf<ApiPatientList>().toHaveProperty('age')
      expectTypeOf<ApiPatientList>().toHaveProperty('genderId')
      expectTypeOf<ApiPatientList>().toHaveProperty('genderName')
      expectTypeOf<ApiPatientList>().toHaveProperty('bloodTypeId')
      expectTypeOf<ApiPatientList>().toHaveProperty('bloodTypeName')
      expectTypeOf<ApiPatientList>().toHaveProperty('phoneNumber')
      expectTypeOf<ApiPatientList>().toHaveProperty('email')
      expectTypeOf<ApiPatientList>().toHaveProperty('address')
      expectTypeOf<ApiPatientList>().toHaveProperty('insuranceNumber')
      expectTypeOf<ApiPatientList>().toHaveProperty('insuranceExpiry')
      expectTypeOf<ApiPatientList>().toHaveProperty('isActive')
      expectTypeOf<ApiPatientList>().toHaveProperty('createdAt')
    })

    it('PatientFullDetailDto exposes patient and all sub-collections', () => {
      expectTypeOf<ApiPatientFull>().toHaveProperty('patient')
      expectTypeOf<ApiPatientFull>().toHaveProperty('allergies')
      expectTypeOf<ApiPatientFull>().toHaveProperty('doctors')
      expectTypeOf<ApiPatientFull>().toHaveProperty('emergencyContacts')
    })

    it('PatientAllergyDto exposes all allergy fields consumed by the frontend', () => {
      expectTypeOf<ApiPatientAllergy>().toHaveProperty('id')
      expectTypeOf<ApiPatientAllergy>().toHaveProperty('allergyTypeId')
      expectTypeOf<ApiPatientAllergy>().toHaveProperty('allergyTypeName')
      expectTypeOf<ApiPatientAllergy>().toHaveProperty('allergyTypeCode')
      expectTypeOf<ApiPatientAllergy>().toHaveProperty('allergySeverityId')
      expectTypeOf<ApiPatientAllergy>().toHaveProperty('allergySeverityName')
      expectTypeOf<ApiPatientAllergy>().toHaveProperty('allergySeverityCode')
      expectTypeOf<ApiPatientAllergy>().toHaveProperty('allergenName')
      expectTypeOf<ApiPatientAllergy>().toHaveProperty('reaction')
      expectTypeOf<ApiPatientAllergy>().toHaveProperty('onsetDate')
      expectTypeOf<ApiPatientAllergy>().toHaveProperty('notes')
      expectTypeOf<ApiPatientAllergy>().toHaveProperty('isActive')
      expectTypeOf<ApiPatientAllergy>().toHaveProperty('createdAt')
    })

    it('PatientDoctorDto exposes all assigned-doctor fields consumed by the frontend', () => {
      expectTypeOf<ApiPatientDoctor>().toHaveProperty('id')
      expectTypeOf<ApiPatientDoctor>().toHaveProperty('doctorId')
      expectTypeOf<ApiPatientDoctor>().toHaveProperty('doctorName')
      expectTypeOf<ApiPatientDoctor>().toHaveProperty('doctorEmail')
      expectTypeOf<ApiPatientDoctor>().toHaveProperty('doctorPhone')
      expectTypeOf<ApiPatientDoctor>().toHaveProperty('doctorMedicalCode')
      expectTypeOf<ApiPatientDoctor>().toHaveProperty('doctorSpecialtyName')
      expectTypeOf<ApiPatientDoctor>().toHaveProperty('isPrimary')
      expectTypeOf<ApiPatientDoctor>().toHaveProperty('assignedAt')
      expectTypeOf<ApiPatientDoctor>().toHaveProperty('notes')
      expectTypeOf<ApiPatientDoctor>().toHaveProperty('isActive')
    })

    it('PatientEmergencyContactDto exposes all contact fields consumed by the frontend', () => {
      expectTypeOf<ApiPatientEmergencyContact>().toHaveProperty('id')
      expectTypeOf<ApiPatientEmergencyContact>().toHaveProperty('fullName')
      expectTypeOf<ApiPatientEmergencyContact>().toHaveProperty('relationship')
      expectTypeOf<ApiPatientEmergencyContact>().toHaveProperty('phoneNumber')
      expectTypeOf<ApiPatientEmergencyContact>().toHaveProperty('isDefault')
      expectTypeOf<ApiPatientEmergencyContact>().toHaveProperty('notes')
      expectTypeOf<ApiPatientEmergencyContact>().toHaveProperty('isActive')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // DOCTORS
  // ──────────────────────────────────────────────────────────────────────────
  describe('Doctors', () => {
    it('DoctorListDto exposes all fields consumed by the frontend DoctorDto', () => {
      expectTypeOf<ApiDoctorList>().toHaveProperty('id')
      expectTypeOf<ApiDoctorList>().toHaveProperty('clinicId')
      expectTypeOf<ApiDoctorList>().toHaveProperty('departmentId')
      expectTypeOf<ApiDoctorList>().toHaveProperty('departmentName')
      expectTypeOf<ApiDoctorList>().toHaveProperty('supervisorDoctorId')
      expectTypeOf<ApiDoctorList>().toHaveProperty('supervisorName')
      expectTypeOf<ApiDoctorList>().toHaveProperty('specialtyId')
      expectTypeOf<ApiDoctorList>().toHaveProperty('specialtyName')
      expectTypeOf<ApiDoctorList>().toHaveProperty('subspecialtyId')
      expectTypeOf<ApiDoctorList>().toHaveProperty('subspecialtyName')
      expectTypeOf<ApiDoctorList>().toHaveProperty('medicalTitleId')
      expectTypeOf<ApiDoctorList>().toHaveProperty('medicalTitleName')
      expectTypeOf<ApiDoctorList>().toHaveProperty('firstName')
      expectTypeOf<ApiDoctorList>().toHaveProperty('lastName')
      expectTypeOf<ApiDoctorList>().toHaveProperty('fullName')
      expectTypeOf<ApiDoctorList>().toHaveProperty('email')
      expectTypeOf<ApiDoctorList>().toHaveProperty('phoneNumber')
      expectTypeOf<ApiDoctorList>().toHaveProperty('medicalCode')
      expectTypeOf<ApiDoctorList>().toHaveProperty('licenseNumber')
      expectTypeOf<ApiDoctorList>().toHaveProperty('licenseExpiresAt')
      expectTypeOf<ApiDoctorList>().toHaveProperty('isActive')
      expectTypeOf<ApiDoctorList>().toHaveProperty('createdAt')
    })

    it('DoctorDetailDto exposes additional updatedAt audit field', () => {
      expectTypeOf<ApiDoctorDetail>().toHaveProperty('updatedAt')
    })

    it('DoctorLookupDto exposes all fields consumed by dropdown components', () => {
      expectTypeOf<ApiDoctorLookup>().toHaveProperty('id')
      expectTypeOf<ApiDoctorLookup>().toHaveProperty('fullName')
      expectTypeOf<ApiDoctorLookup>().toHaveProperty('firstName')
      expectTypeOf<ApiDoctorLookup>().toHaveProperty('lastName')
      expectTypeOf<ApiDoctorLookup>().toHaveProperty('email')
      expectTypeOf<ApiDoctorLookup>().toHaveProperty('medicalCode')
      expectTypeOf<ApiDoctorLookup>().toHaveProperty('specialtyId')
      expectTypeOf<ApiDoctorLookup>().toHaveProperty('specialtyName')
      expectTypeOf<ApiDoctorLookup>().toHaveProperty('departmentId')
      expectTypeOf<ApiDoctorLookup>().toHaveProperty('departmentName')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // MEDICAL STAFF
  // ──────────────────────────────────────────────────────────────────────────
  describe('Medical Staff', () => {
    it('MedicalStaffListDto exposes all fields consumed by the frontend MedicalStaffDto', () => {
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('id')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('clinicId')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('departmentId')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('departmentName')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('supervisorDoctorId')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('supervisorName')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('medicalTitleId')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('medicalTitleName')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('firstName')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('lastName')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('fullName')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('email')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('phoneNumber')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('isActive')
      expectTypeOf<ApiMedicalStaffList>().toHaveProperty('createdAt')
    })

    it('MedicalStaffDetailDto exposes additional updatedAt audit field', () => {
      expectTypeOf<ApiMedicalStaffDetail>().toHaveProperty('updatedAt')
    })

    it('MedicalStaffLookupDto exposes all fields consumed by dropdown components', () => {
      expectTypeOf<ApiMedicalStaffLookup>().toHaveProperty('id')
      expectTypeOf<ApiMedicalStaffLookup>().toHaveProperty('fullName')
      expectTypeOf<ApiMedicalStaffLookup>().toHaveProperty('firstName')
      expectTypeOf<ApiMedicalStaffLookup>().toHaveProperty('lastName')
      expectTypeOf<ApiMedicalStaffLookup>().toHaveProperty('email')
      expectTypeOf<ApiMedicalStaffLookup>().toHaveProperty('departmentId')
      expectTypeOf<ApiMedicalStaffLookup>().toHaveProperty('departmentName')
      expectTypeOf<ApiMedicalStaffLookup>().toHaveProperty('medicalTitleId')
      expectTypeOf<ApiMedicalStaffLookup>().toHaveProperty('medicalTitleName')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // CNAS
  // ──────────────────────────────────────────────────────────────────────────
  describe('CNAS', () => {
    it('CnasSyncStatusDto exposes all fields consumed by the frontend', () => {
      expectTypeOf<ApiCnasSyncStatus>().toHaveProperty('id')
      expectTypeOf<ApiCnasSyncStatus>().toHaveProperty('status')
      expectTypeOf<ApiCnasSyncStatus>().toHaveProperty('startedAt')
      expectTypeOf<ApiCnasSyncStatus>().toHaveProperty('finishedAt')
      expectTypeOf<ApiCnasSyncStatus>().toHaveProperty('nomenclatorVersion')
      expectTypeOf<ApiCnasSyncStatus>().toHaveProperty('errorMessage')
      expectTypeOf<ApiCnasSyncStatus>().toHaveProperty('drugsInserted')
      expectTypeOf<ApiCnasSyncStatus>().toHaveProperty('drugsUpdated')
      expectTypeOf<ApiCnasSyncStatus>().toHaveProperty('compensatedInserted')
      expectTypeOf<ApiCnasSyncStatus>().toHaveProperty('compensatedUpdated')
      expectTypeOf<ApiCnasSyncStatus>().toHaveProperty('activeSubstsInserted')
      expectTypeOf<ApiCnasSyncStatus>().toHaveProperty('durationSeconds')
    })

    it('CnasSyncHistoryDto exposes all fields consumed by the frontend', () => {
      expectTypeOf<ApiCnasSyncHistory>().toHaveProperty('id')
      expectTypeOf<ApiCnasSyncHistory>().toHaveProperty('startedAt')
      expectTypeOf<ApiCnasSyncHistory>().toHaveProperty('finishedAt')
      expectTypeOf<ApiCnasSyncHistory>().toHaveProperty('status')
      expectTypeOf<ApiCnasSyncHistory>().toHaveProperty('nomenclatorVersion')
      expectTypeOf<ApiCnasSyncHistory>().toHaveProperty('drugsInserted')
      expectTypeOf<ApiCnasSyncHistory>().toHaveProperty('drugsUpdated')
      expectTypeOf<ApiCnasSyncHistory>().toHaveProperty('compensatedInserted')
      expectTypeOf<ApiCnasSyncHistory>().toHaveProperty('compensatedUpdated')
      expectTypeOf<ApiCnasSyncHistory>().toHaveProperty('activeSubstsInserted')
      expectTypeOf<ApiCnasSyncHistory>().toHaveProperty('durationSeconds')
      expectTypeOf<ApiCnasSyncHistory>().toHaveProperty('triggeredBy')
      expectTypeOf<ApiCnasSyncHistory>().toHaveProperty('errorMessage')
    })

    it('CnasSyncStatsDto exposes all fields consumed by the frontend', () => {
      expectTypeOf<ApiCnasSyncStats>().toHaveProperty('lastSyncAt')
      expectTypeOf<ApiCnasSyncStats>().toHaveProperty('lastSyncVersion')
      expectTypeOf<ApiCnasSyncStats>().toHaveProperty('lastSyncStatus')
      expectTypeOf<ApiCnasSyncStats>().toHaveProperty('totalDrugs')
      expectTypeOf<ApiCnasSyncStats>().toHaveProperty('activeDrugs')
      expectTypeOf<ApiCnasSyncStats>().toHaveProperty('compensatedDrugs')
    })
  })
})

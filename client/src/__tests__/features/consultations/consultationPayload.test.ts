/**
 * Transformarea formular + selector ICD-10 → payload API (o singură sursă pentru create/update).
 */
import { describe, it, expect } from 'vitest'
import {
  EMPTY_DIAGNOSIS, buildConsultationPayload, buildDiagnosisFields, parseDiagnosisState, type DiagnosisState,
} from '@/features/consultations/utils/consultationPayload'
import { EMPTY_CONSULTATION_FORM } from '@/features/consultations/constants/consultationDefaults'
import type { ICD10SearchResult } from '@/features/consultations/types/icd10.types'

const icd = (code: string): ICD10SearchResult => ({
  icD10_ID: code, code, fullCode: code, shortDescriptionRo: `Descriere ${code}`,
  isCommon: false, isLeafNode: true, isBillable: true, isTranslated: true, relevanceScore: 100, isFavorite: false,
})

const withDiagnosis: DiagnosisState = {
  primaryCode: icd('J44.0'),
  primaryDetails: '<p>BPOC</p>',
  secondary: [{ id: 's1', description: '<p>HTA</p>', icd10Codes: [icd('I10'), icd('J41.0')] }],
  legacyTags: [],
}

describe('buildDiagnosisFields', () => {
  it('serializează selectorul și listează codurile principal + secundare', () => {
    const { diagnostic, diagnosticCodes } = buildDiagnosisFields(withDiagnosis, '')
    expect(JSON.parse(diagnostic!)).toMatchObject({ primaryCode: { code: 'J44.0' }, primaryDetails: '<p>BPOC</p>' })
    expect(JSON.parse(diagnosticCodes!)).toEqual(['J44.0', 'I10', 'J41.0'])
  })

  it('fără diagnostic principal păstrează textul liber și codurile vechi', () => {
    const result = buildDiagnosisFields({ ...EMPTY_DIAGNOSIS, legacyTags: ['G43.9'] }, 'Migrenă')
    expect(result).toEqual({ diagnostic: 'Migrenă', diagnosticCodes: '["G43.9"]' })
  })

  it('fără nimic completat trimite null', () => {
    expect(buildDiagnosisFields(EMPTY_DIAGNOSIS, '')).toEqual({ diagnostic: null, diagnosticCodes: null })
  })
})

describe('parseDiagnosisState', () => {
  it('reconstruiește starea salvată (round-trip)', () => {
    const fields = buildDiagnosisFields(withDiagnosis, '')
    expect(parseDiagnosisState(fields)).toEqual(withDiagnosis)
  })

  it('pe un rând cu selector ICD-10 nu reține codurile derivate ca etichete vechi', () => {
    const state = parseDiagnosisState(buildDiagnosisFields(withDiagnosis, ''))
    const afterRemovingDiagnosis = buildDiagnosisFields({ ...state, primaryCode: null, secondary: [] }, '')
    expect(afterRemovingDiagnosis.diagnosticCodes).toBeNull()
  })

  it('text liber + coduri simple → etichete vechi', () => {
    expect(parseDiagnosisState({ diagnostic: 'Migrenă', diagnosticCodes: 'G43.9' }).legacyTags).toEqual(['G43.9'])
  })
})

describe('buildConsultationPayload', () => {
  it('convertește stringurile goale în null și păstrează numerele', () => {
    const payload = buildConsultationPayload(
      { ...EMPTY_CONSULTATION_FORM, patientId: 'p', doctorId: 'd', date: '2026-01-01', puls: 72, motiv: '' },
      EMPTY_DIAGNOSIS,
    )
    expect(payload).toMatchObject({ patientId: 'p', appointmentId: null, motiv: null, puls: 72, greutate: null })
    expect(payload).not.toHaveProperty('statusId')
  })
})

import type { ConsultationFormData } from '../schemas/consultation.schema'
import type { ConsultationDetailDto } from '../types/consultation.types'

/** Câmpurile trimise prin PUT /{id}/anamnesis (tabel ConsultationAnamnesis). */
export const ANAMNESIS_FIELDS = [
  'motiv', 'istoricMedicalPersonal', 'tratamentAnterior',
  'istoricBoalaActuala', 'istoricFamilial', 'factoriDeRisc', 'alergiiConsultatie',
] as const

/** Câmpurile trimise prin PUT /{id}/exam (tabel ConsultationExam). */
export const EXAM_FIELDS = [
  'stareGenerala', 'tegumente', 'mucoase',
  'greutate', 'inaltime',
  'tensiuneSistolica', 'tensiuneDiastolica', 'puls', 'frecventaRespiratorie',
  'temperatura', 'spO2', 'edeme', 'glicemie', 'ganglioniLimfatici',
  'examenClinic', 'alteObservatiiClinice',
] as const

export type AnamnesisField = typeof ANAMNESIS_FIELDS[number]
export type ExamField = typeof EXAM_FIELDS[number]

export const EMPTY_CONSULTATION_FORM: ConsultationFormData = {
  patientId: '', doctorId: '', date: '', appointmentId: '',
  motiv: '', istoricMedicalPersonal: '', tratamentAnterior: '', istoricBoalaActuala: '',
  istoricFamilial: '', factoriDeRisc: '', alergiiConsultatie: '',
  stareGenerala: '', tegumente: '', mucoase: '', greutate: null, inaltime: null,
  tensiuneSistolica: null, tensiuneDiastolica: null, puls: null, frecventaRespiratorie: null,
  temperatura: null, spO2: null, edeme: '', glicemie: null, ganglioniLimfatici: '',
  examenClinic: '', alteObservatiiClinice: '',
  investigatii: '', analizeMedicale: '',
  diagnostic: '', diagnosticCodes: '', recomandari: '', observatii: '',
  concluzii: '', esteAfectiuneOncologica: false, areIndicatieInternare: false,
  saEliberatPrescriptie: false, seriePrescriptie: '', saEliberatConcediuMedical: false, serieConcediuMedical: '',
  saEliberatIngrijiriDomiciliu: false, saEliberatDispozitiveMedicale: false,
  dataUrmatoareiVizite: '', noteUrmatoareaVizita: '',
}

export const detailToFormValues = (d: ConsultationDetailDto): ConsultationFormData => ({
  patientId:     d.patientId,
  doctorId:      d.doctorId,
  date:          d.date ? d.date.split('T')[0] : '',
  appointmentId: d.appointmentId ?? '',
  motiv:                  d.motiv ?? '',
  istoricMedicalPersonal: d.istoricMedicalPersonal ?? '',
  tratamentAnterior:      d.tratamentAnterior ?? '',
  istoricBoalaActuala:    d.istoricBoalaActuala ?? '',
  istoricFamilial:        d.istoricFamilial ?? '',
  factoriDeRisc:          d.factoriDeRisc ?? '',
  alergiiConsultatie:     d.alergiiConsultatie ?? '',
  stareGenerala:          d.stareGenerala ?? '',
  tegumente:              d.tegumente ?? '',
  mucoase:                d.mucoase ?? '',
  greutate:               d.greutate ?? null,
  inaltime:               d.inaltime ?? null,
  tensiuneSistolica:      d.tensiuneSistolica ?? null,
  tensiuneDiastolica:     d.tensiuneDiastolica ?? null,
  puls:                   d.puls ?? null,
  frecventaRespiratorie:  d.frecventaRespiratorie ?? null,
  temperatura:            d.temperatura ?? null,
  spO2:                   d.spO2 ?? null,
  edeme:                  d.edeme ?? '',
  glicemie:               d.glicemie ?? null,
  ganglioniLimfatici:     d.ganglioniLimfatici ?? '',
  examenClinic:           d.examenClinic ?? '',
  alteObservatiiClinice:  d.alteObservatiiClinice ?? '',
  investigatii:           d.investigatii ?? '',
  analizeMedicale:        d.analizeMedicale ?? '',
  diagnostic:             d.diagnostic ?? '',
  diagnosticCodes:        d.diagnosticCodes ?? '',
  recomandari:            d.recomandari ?? '',
  observatii:             d.observatii ?? '',
  concluzii:              d.concluzii ?? '',
  esteAfectiuneOncologica:       d.esteAfectiuneOncologica,
  areIndicatieInternare:         d.areIndicatieInternare,
  saEliberatPrescriptie:         d.saEliberatPrescriptie,
  seriePrescriptie:              d.seriePrescriptie ?? '',
  saEliberatConcediuMedical:     d.saEliberatConcediuMedical,
  serieConcediuMedical:          d.serieConcediuMedical ?? '',
  saEliberatIngrijiriDomiciliu:  d.saEliberatIngrijiriDomiciliu,
  saEliberatDispozitiveMedicale: d.saEliberatDispozitiveMedicale,
  dataUrmatoareiVizite: d.dataUrmatoareiVizite ? d.dataUrmatoareiVizite.split('T')[0] : '',
  noteUrmatoareaVizita: d.noteUrmatoareaVizita ?? '',
})

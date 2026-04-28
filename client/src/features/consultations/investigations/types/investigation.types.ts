// Auto-aliniat cu DTOs din ValyanClinic.Application.Features.Investigations

export type InvestigationStatus = 0 | 1 | 2 | 3 // Requested / Pending / Completed / Cancelled

export interface InvestigationDto {
  id: string
  clinicId: string
  consultationId: string
  patientId: string
  doctorId: string
  doctorName: string
  investigationType: string
  investigationTypeDisplayName: string
  uiPattern: 'Narrative' | 'Structured' | 'LabTable' | 'Questionnaire'
  parentTab: 'Lab' | 'Imaging' | 'Functional' | 'Procedures'
  category: string
  investigationDate: string
  structuredData: string | null  // JSON sub formă de string
  narrative: string | null       // HTML
  isExternal: boolean
  externalSource: string | null
  status: InvestigationStatus
  attachedDocumentId: string | null
  attachedDocumentName: string | null
  hasStructuredData: boolean
  createdAt: string
  createdBy: string
  updatedAt: string | null
  updatedBy: string | null
}

export interface InvestigationTypeDto {
  typeCode: string
  displayName: string
  displayNameEn: string | null
  category: string
  parentTab: 'Lab' | 'Imaging' | 'Functional' | 'Procedures'
  uiPattern: 'Narrative' | 'Structured' | 'LabTable' | 'Questionnaire'
  specialties: string
  hasStructuredFields: boolean
  defaultStructuredEntry: boolean
  jsonSchemaVersion: string
  isActive: boolean
  sortOrder: number
}

export interface InvestigationTrendingPointDto {
  investigationDate: string
  parameterPath: string
  value: number | null
  investigationId: string
}

export interface CreateInvestigationPayload {
  consultationId: string
  patientId: string
  doctorId: string
  investigationType: string
  investigationDate: string
  structuredData: string | null
  narrative: string | null
  isExternal: boolean
  externalSource: string | null
  status: InvestigationStatus
  attachedDocumentId: string | null
  hasStructuredData: boolean
}

export interface UpdateInvestigationPayload {
  id: string
  investigationType: string
  investigationDate: string
  structuredData: string | null
  narrative: string | null
  isExternal: boolean
  externalSource: string | null
  status: InvestigationStatus
  attachedDocumentId: string | null
  hasStructuredData: boolean
}

export interface DocumentDto {
  id: string
  fileName: string
  contentType: string
  fileSize: number
}

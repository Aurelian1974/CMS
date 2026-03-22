/// DTO listare programare — include câmpuri compute din SP
export interface AppointmentDto {
  id: string
  clinicId: string
  patientId: string
  patientName: string
  patientPhone: string | null
  doctorId: string
  doctorName: string
  specialtyName: string | null
  startTime: string
  endTime: string
  statusId: string
  statusName: string
  statusCode: string
  notes: string | null
  isDeleted: boolean
  createdAt: string
  createdByName: string | null
}

/// DTO detalii programare
export interface AppointmentDetailDto extends AppointmentDto {
  patientCnp: string | null
  patientEmail: string | null
  doctorMedicalCode: string | null
  updatedAt: string | null
  updatedBy: string | null
  updatedByName: string | null
}

/// Statistici programări
export interface AppointmentStatsDto {
  totalAppointments: number
  scheduledCount: number
  confirmedCount: number
  completedCount: number
  cancelledCount: number
}

/// Răspuns listare paginată cu statistici
export interface AppointmentsPagedResponse {
  pagedResult: {
    items: AppointmentDto[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  stats: AppointmentStatsDto
}

/// Parametri query listare programări
export interface GetAppointmentsParams {
  page: number
  pageSize: number
  search?: string
  doctorId?: string
  statusId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

/// Payload creare programare
export interface CreateAppointmentPayload {
  patientId: string
  doctorId: string
  startTime: string
  endTime: string
  statusId?: string | null
  notes?: string | null
}

/// Payload actualizare programare
export interface UpdateAppointmentPayload extends CreateAppointmentPayload {
  id: string
}

/// Payload actualizare status programare
export interface UpdateAppointmentStatusPayload {
  id: string
  statusId: string
}

/// Filtru status
export type AppointmentStatusFilter = 'all' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled'

/// DTO pentru vizualizarea scheduler
export interface AppointmentSchedulerDto {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  startTime: string
  endTime: string
  statusId: string
  statusName: string
  statusCode: string
  notes: string | null
}

/// Patient lookup (pentru selectare pacient în formular)
export interface PatientLookupDto {
  id: string
  fullName: string
  cnp: string
  phoneNumber: string | null
}

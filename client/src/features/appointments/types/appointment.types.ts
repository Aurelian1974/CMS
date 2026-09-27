import type { components } from '@/api/generated/schema'

type Schemas = components['schemas']

// OpenAPI marchează toate câmpurile ca opționale și string-urile ca nullable;
// API-ul le returnează mereu, iar cele de mai jos nu sunt niciodată null (NOT NULL în BD)
type WithRequired<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> }
type NameKeys = 'patientName' | 'doctorName' | 'statusName' | 'statusCode'

export type AppointmentDto          = WithRequired<Required<Schemas['AppointmentListDto']>, NameKeys>
export type AppointmentDetailDto    = WithRequired<Required<Schemas['AppointmentDetailDto']>, NameKeys>
export type AppointmentSchedulerDto = WithRequired<Required<Schemas['AppointmentSchedulerDto']>, NameKeys>
export type AppointmentStatsDto     = Required<Schemas['AppointmentStatsDto']>
export type AppointmentStatusDto    = WithRequired<Required<Schemas['AppointmentStatusDto']>, 'name' | 'code'>
export type AppointmentConflictDto  = WithRequired<Required<Schemas['AppointmentConflictDto']>, 'patientName' | 'statusName'>

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

export type CreateAppointmentPayload = Schemas['CreateAppointmentCommand']
export type UpdateAppointmentPayload = { id: string } & Schemas['UpdateAppointmentRequest']
export type UpdateAppointmentStatusPayload = { id: string } & Required<Schemas['UpdateAppointmentStatusRequest']>

/// Parametri query listare — nu fac parte din contract (query string)
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

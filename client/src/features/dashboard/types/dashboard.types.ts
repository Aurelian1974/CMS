import type { components } from '@/api/generated/schema'

type Schemas = components['schemas']

export type DashboardDto                  = Schemas['DashboardDto']
export type DashboardClinicalKpisDto      = Schemas['DashboardClinicalKpisDto']
export type DashboardAgendaItemDto        = Schemas['DashboardAgendaItemDto']
export type DashboardOpenConsultationDto  = Schemas['DashboardOpenConsultationDto']
export type DashboardLabResultDto         = Schemas['DashboardLabResultDto']
export type DashboardFinancialKpisDto     = Schemas['DashboardFinancialKpisDto']
export type DashboardUnpaidItemDto        = Schemas['DashboardUnpaidItemDto']
export type DashboardReceiptIssueDto      = Schemas['DashboardReceiptIssueDto']
export type DashboardRevenuePointDto      = Schemas['DashboardRevenuePointDto']
export type DashboardAppointmentPointDto  = Schemas['DashboardAppointmentPointDto']
export type DashboardNoShowDto            = Schemas['DashboardNoShowDto']
export type DashboardDoctorWorkloadDto    = Schemas['DashboardDoctorWorkloadDto']
export type DashboardTopServiceDto        = Schemas['DashboardTopServiceDto']
export type DashboardSecurityEventDto     = Schemas['DashboardSecurityEventDto']
export type DashboardLockedUserDto        = Schemas['DashboardLockedUserDto']
export type DashboardExpiringLicenseDto   = Schemas['DashboardExpiringLicenseDto']
export type DashboardExpiringInsuranceDto = Schemas['DashboardExpiringInsuranceDto']
export type DashboardSyncFreshnessDto     = Schemas['DashboardSyncFreshnessDto']
export type DashboardActivityDto          = Schemas['DashboardActivityDto']
export type DashboardFlowItemDto          = Schemas['DashboardFlowItemDto']
export type DashboardAttentionItemDto     = Schemas['DashboardAttentionItemDto']

export interface GetDashboardParams {
  trendDays?: number
}

/** Fiecare widget primește tot răspunsul și își extrage singur secțiunea. */
export interface DashboardWidgetProps {
  data: DashboardDto
}

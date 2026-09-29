import type { BadgeVariant } from '@/components/ui/AppBadge/AppBadge.types'

/** Sincron cu DashboardFlowStages.cs (verificat de patientFlow.test.ts). */
export const FLOW_STAGES = {
  ToConfirm:      'TO_CONFIRM',
  Waiting:        'WAITING',
  InConsultation: 'IN_CONSULTATION',
  ToPay:          'TO_PAY',
  Done:           'DONE',
  Cancelled:      'CANCELLED',
} as const

export type FlowStage = (typeof FLOW_STAGES)[keyof typeof FLOW_STAGES]

export type FlowTone = 'info' | 'primary' | 'warning' | 'accent' | 'success' | 'neutral'

/** Etapele în ordinea parcursului pacientului prin clinică. */
export const FLOW_STAGE_ORDER: readonly { stage: FlowStage; label: string; tone: FlowTone }[] = [
  { stage: FLOW_STAGES.ToConfirm,      label: 'Neconfirmați',     tone: 'info' },
  { stage: FLOW_STAGES.Waiting,        label: 'Așteaptă',         tone: 'primary' },
  { stage: FLOW_STAGES.InConsultation, label: 'În consultație',   tone: 'warning' },
  { stage: FLOW_STAGES.ToPay,          label: 'De încasat',       tone: 'accent' },
  { stage: FLOW_STAGES.Done,           label: 'Încheiate',        tone: 'success' },
  { stage: FLOW_STAGES.Cancelled,      label: 'Anulați / absenți', tone: 'neutral' },
]

/** Etapa deschisă implicit: prima cu pacienți, în ordinea urgenței pentru recepție. */
export const FLOW_DEFAULT_PRIORITY: readonly FlowStage[] = [
  FLOW_STAGES.Waiting, FLOW_STAGES.InConsultation, FLOW_STAGES.ToPay,
  FLOW_STAGES.ToConfirm, FLOW_STAGES.Done, FLOW_STAGES.Cancelled,
]

/** Sincron cu DashboardAttentionTypes.cs (verificat de patientFlow.test.ts). */
export const ATTENTION_TYPES = {
  StaleConsultation:     'STALE_CONSULTATION',
  UnresolvedAppointment: 'UNRESOLVED_APPOINTMENT',
  LateAppointment:       'LATE_APPOINTMENT',
} as const

export type AttentionType = (typeof ATTENTION_TYPES)[keyof typeof ATTENTION_TYPES]

export const ATTENTION_TYPE_META: Record<AttentionType, { label: string; variant: BadgeVariant }> = {
  [ATTENTION_TYPES.StaleConsultation]:     { label: 'Consultație nefinalizată', variant: 'warning' },
  [ATTENTION_TYPES.UnresolvedAppointment]: { label: 'Programare nerezolvată',   variant: 'danger' },
  [ATTENTION_TYPES.LateAppointment]:       { label: 'Întârziat',                variant: 'accent' },
}

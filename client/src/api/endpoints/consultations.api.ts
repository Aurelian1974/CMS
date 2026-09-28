import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  ConsultationDetailDto,
  ConsultationsPagedResponse,
  GetConsultationsParams,
  CreateConsultationPayload,
  UpdateConsultationPayload,
} from '@/features/consultations/types/consultation.types'
import {
  ANAMNESIS_FIELDS,
  EXAM_FIELDS,
  type AnamnesisField as AnamnesisKey,
  type ExamField as ExamKey,
} from '@/features/consultations/constants/consultationDefaults'

interface HierarchicalDetail {
  anamnesis?: Partial<Record<AnamnesisKey, unknown>> | null
  exam?:      Partial<Record<ExamKey, unknown>>      | null
  [k: string]: unknown
}

/**
 * Aplatizează `{anamnesis: {...}, exam: {...}, ...rest}` → flat
 * pentru a păstra compatibilitatea cu UI-ul existent.
 */
const flattenDetail = (raw: HierarchicalDetail): ConsultationDetailDto => {
  const { anamnesis, exam, ...rest } = raw
  return {
    ...(rest as object),
    ...((anamnesis ?? {}) as object),
    ...((exam ?? {}) as object),
  } as ConsultationDetailDto
}

/** Extrage câmpurile date din `payload` (filtrând `undefined`). */
const pick = <T extends object, K extends string>(payload: T, keys: readonly K[]) => {
  const out: Record<string, unknown> = {}
  for (const k of keys) {
    const v = (payload as Record<string, unknown>)[k]
    if (v !== undefined) out[k] = v
  }
  return out
}

const omit = <T extends object, K extends string>(payload: T, keys: readonly K[]) => {
  const out: Record<string, unknown> = { ...(payload as Record<string, unknown>) }
  for (const k of keys) delete out[k]
  return out
}

export const consultationsApi = {
  getAll: (params: GetConsultationsParams): Promise<ApiResponse<ConsultationsPagedResponse>> =>
    api.get('/api/v1/Consultations', { params }),

  getById: async (id: string): Promise<ApiResponse<ConsultationDetailDto>> => {
    const resp = await (api.get(`/api/v1/Consultations/${id}`) as Promise<ApiResponse<HierarchicalDetail>>)
    return { ...resp, data: resp.data ? flattenDetail(resp.data) : resp.data } as ApiResponse<ConsultationDetailDto>
  },

  getByAppointmentId: async (
    appointmentId: string,
  ): Promise<ApiResponse<ConsultationDetailDto | null>> => {
    const resp = await (api.get(
      `/api/v1/Consultations/by-appointment/${appointmentId}`,
    ) as Promise<ApiResponse<HierarchicalDetail | null>>)
    return {
      ...resp,
      data: resp.data ? flattenDetail(resp.data) : resp.data,
    } as ApiResponse<ConsultationDetailDto | null>
  },

  /**
   * Creare consultație: POST pentru header + tab-uri vechi, urmat de
   * upsert-uri pentru Anamneza / Examen Clinic dacă userul a completat ceva.
   * Scrierile pe același agregat sunt secvențiale (fără curse / deadlock-uri).
   */
  create: async (payload: CreateConsultationPayload): Promise<ApiResponse<string>> => {
    const headerPayload = omit(payload, [...ANAMNESIS_FIELDS, ...EXAM_FIELDS])
    const resp = await (api.post('/api/v1/Consultations', headerPayload) as Promise<ApiResponse<string>>)
    const newId = resp?.data
    if (newId) {
      const anamnesisPayload = pick(payload, ANAMNESIS_FIELDS)
      const examPayload      = pick(payload, EXAM_FIELDS)
      if (Object.values(anamnesisPayload).some(v => v != null && v !== ''))
        await api.put(`/api/v1/Consultations/${newId}/anamnesis`, anamnesisPayload)
      if (Object.values(examPayload).some(v => v != null && v !== ''))
        await api.put(`/api/v1/Consultations/${newId}/exam`, examPayload)
    }
    return resp
  },

  /**
   * Update consultație: sub-secțiunile se scriu ÎNAINTE de header, secvențial —
   * serverul refuză orice scriere pe o consultație care nu mai e în lucru (409).
   */
  update: async ({ id, ...data }: UpdateConsultationPayload): Promise<ApiResponse<boolean>> => {
    const headerPayload    = omit(data, [...ANAMNESIS_FIELDS, ...EXAM_FIELDS])
    const anamnesisPayload = pick(data, ANAMNESIS_FIELDS)
    const examPayload      = pick(data, EXAM_FIELDS)

    await api.put(`/api/v1/Consultations/${id}/anamnesis`, anamnesisPayload)
    await api.put(`/api/v1/Consultations/${id}/exam`, examPayload)
    return api.put(`/api/v1/Consultations/${id}`, headerPayload) as Promise<ApiResponse<boolean>>
  },

  /** Tranziția INLUCRU → FINALIZATA; cere diagnostic principal ICD-10. */
  finalize: (id: string): Promise<ApiResponse<boolean>> =>
    api.post(`/api/v1/Consultations/${id}/finalize`),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Consultations/${id}`),

  /** Upsert dedicat pentru tabul Anamneza. */
  updateAnamnesis: (id: string, payload: Partial<Record<AnamnesisKey, unknown>>): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Consultations/${id}/anamnesis`, payload) as unknown as Promise<ApiResponse<boolean>>,

  /** Upsert dedicat pentru tabul Examen Clinic. */
  updateExam: (id: string, payload: Partial<Record<ExamKey, unknown>>): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Consultations/${id}/exam`, payload) as unknown as Promise<ApiResponse<boolean>>,
}

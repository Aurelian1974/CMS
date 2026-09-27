import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  AddMedicalServicePricePayload,
  BillingLookupsDto,
  CreateMedicalServicePayload,
  CreateVatRatePayload,
  GetMedicalServicesParams,
  MedicalServiceDetailDto,
  MedicalServicesPagedResponse,
  UpdateMedicalServicePayload,
  UpdateVatRatePayload,
  VatRateDto,
} from '@/features/tariffs/types/tariff.types'

const BASE = '/api/v1/Tariffs'

export const tariffsApi = {
  getAll: (params: GetMedicalServicesParams): Promise<ApiResponse<MedicalServicesPagedResponse>> =>
    api.get(BASE, { params }),

  getById: (id: string): Promise<ApiResponse<MedicalServiceDetailDto>> =>
    api.get(`${BASE}/${id}`),

  getLookups: (): Promise<ApiResponse<BillingLookupsDto>> =>
    api.get(`${BASE}/lookups`),

  create: (payload: CreateMedicalServicePayload): Promise<ApiResponse<string>> =>
    api.post(BASE, payload),

  update: ({ id, ...body }: UpdateMedicalServicePayload): Promise<ApiResponse<boolean>> =>
    api.put(`${BASE}/${id}`, body),

  setActive: (id: string, isActive: boolean): Promise<ApiResponse<boolean>> =>
    api.patch(`${BASE}/${id}/active`, { isActive }),

  addPrice: ({ id, ...body }: AddMedicalServicePricePayload): Promise<ApiResponse<string>> =>
    api.post(`${BASE}/${id}/prices`, body),

  getVatRates: (): Promise<ApiResponse<VatRateDto[]>> =>
    api.get(`${BASE}/vat-rates`),

  createVatRate: (payload: CreateVatRatePayload): Promise<ApiResponse<string>> =>
    api.post(`${BASE}/vat-rates`, payload),

  updateVatRate: ({ id, ...body }: UpdateVatRatePayload): Promise<ApiResponse<boolean>> =>
    api.put(`${BASE}/vat-rates/${id}`, body),
}

import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  ClinicDto,
  ClinicLocationDto,
  UpdateClinicPayload,
  SyncClinicCaenCodesPayload,
  CreateClinicLocationPayload,
  UpdateClinicLocationPayload,
  CreateClinicBankAccountPayload,
  UpdateClinicBankAccountPayload,
  CreateClinicAddressPayload,
  UpdateClinicAddressPayload,
  CreateClinicContactPayload,
  UpdateClinicContactPayload,
  CreateClinicContactPersonPayload,
  UpdateClinicContactPersonPayload,
} from '@/features/clinic/types/clinic.types'

export const clinicApi = {
  // ===== Clinica curentă =====

  getCurrentClinic: (): Promise<ApiResponse<ClinicDto>> =>
    api.get('/api/v1/Clinics/current'),

  updateCurrentClinic: (payload: UpdateClinicPayload): Promise<ApiResponse<boolean>> =>
    api.put('/api/v1/Clinics/current', payload),

  syncCaenCodes: (payload: SyncClinicCaenCodesPayload): Promise<ApiResponse<boolean>> =>
    api.put('/api/v1/Clinics/current/caen-codes', payload),

  // ===== Conturi bancare =====

  createBankAccount: (payload: CreateClinicBankAccountPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Clinics/current/bank-accounts', payload),

  updateBankAccount: ({ id, ...data }: UpdateClinicBankAccountPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Clinics/current/bank-accounts/${id}`, data),

  deleteBankAccount: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Clinics/current/bank-accounts/${id}`),

  // ===== Adrese =====

  createAddress: (payload: CreateClinicAddressPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Clinics/current/addresses', payload),

  updateAddress: ({ id, ...data }: UpdateClinicAddressPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Clinics/current/addresses/${id}`, data),

  deleteAddress: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Clinics/current/addresses/${id}`),

  // ===== Date de contact =====

  createContact: (payload: CreateClinicContactPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Clinics/current/contacts', payload),

  updateContact: ({ id, ...data }: UpdateClinicContactPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Clinics/current/contacts/${id}`, data),

  deleteContact: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Clinics/current/contacts/${id}`),

  // ===== Persoane de contact =====

  createContactPerson: (payload: CreateClinicContactPersonPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Clinics/current/contact-persons', payload),

  updateContactPerson: ({ id, ...data }: UpdateClinicContactPersonPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Clinics/current/contact-persons/${id}`, data),

  deleteContactPerson: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Clinics/current/contact-persons/${id}`),

  // ===== Locații =====

  getLocations: (isActive?: boolean): Promise<ApiResponse<ClinicLocationDto[]>> =>
    api.get('/api/v1/Clinics/current/locations', { params: { isActive } }),

  createLocation: (payload: CreateClinicLocationPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Clinics/current/locations', payload),

  updateLocation: ({ id, ...data }: UpdateClinicLocationPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Clinics/current/locations/${id}`, data),

  deleteLocation: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Clinics/current/locations/${id}`),
}


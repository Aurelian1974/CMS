import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  DepartmentDto,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from '@/features/departments/types/department.types'

export const departmentsApi = {
  getAll: (isActive?: boolean, locationId?: string): Promise<ApiResponse<DepartmentDto[]>> =>
    api.get('/api/departments', { params: { isActive, locationId } }),

  getById: (id: string): Promise<ApiResponse<DepartmentDto>> =>
    api.get(`/api/departments/${id}`),

  create: (payload: CreateDepartmentPayload): Promise<ApiResponse<string>> =>
    api.post('/api/departments', payload),

  update: ({ id, ...data }: UpdateDepartmentPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/departments/${id}`, data),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/departments/${id}`),
}

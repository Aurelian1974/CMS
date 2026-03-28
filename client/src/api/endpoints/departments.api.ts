import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  DepartmentDto,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from '@/features/departments/types/department.types'

export const departmentsApi = {
  getAll: (isActive?: boolean, locationId?: string): Promise<ApiResponse<DepartmentDto[]>> =>
    api.get('/api/v1/Departments', { params: { isActive, locationId } }),

  getById: (id: string): Promise<ApiResponse<DepartmentDto>> =>
    api.get(`/api/v1/Departments/${id}`),

  create: (payload: CreateDepartmentPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Departments', payload),

  update: ({ id, ...data }: UpdateDepartmentPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Departments/${id}`, data),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Departments/${id}`),
}

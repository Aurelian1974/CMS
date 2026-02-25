import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  UserDto,
  UserDetailDto,
  UsersPagedResult,
  GetUsersParams,
  CreateUserPayload,
  UpdateUserPayload,
  ChangePasswordPayload,
  RoleDto,
} from '@/features/users/types/user.types'

export const usersApi = {
  getRoles: (): Promise<ApiResponse<RoleDto[]>> =>
    api.get('/api/users/roles'),

  getAll: (params: GetUsersParams): Promise<ApiResponse<UsersPagedResult>> =>
    api.get('/api/users', { params }),

  getById: (id: string): Promise<ApiResponse<UserDetailDto>> =>
    api.get(`/api/users/${id}`),

  create: (payload: CreateUserPayload): Promise<ApiResponse<string>> =>
    api.post('/api/users', payload),

  update: ({ id, ...data }: UpdateUserPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/users/${id}`, data),

  changePassword: (id: string, payload: ChangePasswordPayload): Promise<ApiResponse<boolean>> =>
    api.patch(`/api/users/${id}/password`, payload),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/users/${id}`),
}

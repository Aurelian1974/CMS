import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  UserDetailDto,
  UsersPagedResult,
  GetUsersParams,
  CreateUserPayload,
  UpdateUserPayload,
  ResetPasswordPayload,
  ChangeOwnPasswordPayload,
  RoleDto,
} from '@/features/users/types/user.types'

export const usersApi = {
  getRoles: (): Promise<ApiResponse<RoleDto[]>> =>
    api.get('/api/v1/Users/roles'),

  getAll: (params: GetUsersParams): Promise<ApiResponse<UsersPagedResult>> =>
    api.get('/api/v1/Users', { params }),

  getById: (id: string): Promise<ApiResponse<UserDetailDto>> =>
    api.get(`/api/v1/Users/${id}`),

  create: (payload: CreateUserPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Users', payload),

  update: ({ id, ...data }: UpdateUserPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Users/${id}`, data),

  /// Reset administrativ — restrâns la rolul Admin pe backend.
  /// Contul vizat primește MustChangePassword și își pierde sesiunile.
  resetPassword: (id: string, payload: ResetPasswordPayload): Promise<ApiResponse<boolean>> =>
    api.post(`/api/v1/Users/${id}/password-reset`, payload),

  /// Schimbarea propriei parole — contul vine din token, nu din rută.
  changeOwnPassword: (payload: ChangeOwnPasswordPayload): Promise<ApiResponse<boolean>> =>
    api.patch('/api/v1/Users/me/password', payload),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Users/${id}`),
}

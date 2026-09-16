import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type { components } from '@/api/generated/schema'

export type UserMenuPreferencesDto = components['schemas']['UserMenuPreferencesDto']
export type UpsertUserMenuPreferencesPayload = components['schemas']['UpsertUserMenuPreferencesCommand']

export const userMenuPreferencesApi = {
  get: async (): Promise<UserMenuPreferencesDto> => {
    const response = await api.get<unknown, ApiResponse<UserMenuPreferencesDto>>('/api/v1/UserMenuPreferences')
    return response.data ?? { favoriteRoutes: [] }
  },

  upsert: async (payload: UpsertUserMenuPreferencesPayload): Promise<void> => {
    await api.put('/api/v1/UserMenuPreferences', payload)
  },
}

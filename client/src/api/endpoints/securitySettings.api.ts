import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  SecuritySettingsView,
  GlobalSecuritySettings,
} from '@/features/settings/types/settings.types'

/// Câmpurile trimise la salvare — `passwordBlocklistEnabled` lipsește intenționat:
/// lista de blocare nu poate fi dezactivată, iar serverul o forțează oricum la 1.
export type SaveGlobalPayload = Omit<
  GlobalSecuritySettings,
  'passwordBlocklistEnabled' | 'updatedAt' | 'updatedBy'
>

export const securitySettingsApi = {
  get: (): Promise<ApiResponse<SecuritySettingsView>> =>
    api.get('/api/v1/SecuritySettings'),

  saveGlobal: (payload: SaveGlobalPayload): Promise<ApiResponse<boolean>> =>
    api.put('/api/v1/SecuritySettings', payload),

  saveRole: (
    roleId: string,
    payload: { idleTimeoutMinutes: number; refreshTokenDays: number },
  ): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/SecuritySettings/roles/${roleId}`, payload),
}

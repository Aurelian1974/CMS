import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { securitySettingsApi, type SaveGlobalPayload } from '@/api/endpoints/securitySettings.api'

const settingsKey = ['security-settings'] as const

export const useSecuritySettings = () =>
  useQuery({
    queryKey: settingsKey,
    queryFn: async () => (await securitySettingsApi.get()).data!,
    // Setările se schimbă rar, dar când se schimbă vrem să vedem imediat efectul.
    staleTime: 0,
  })

export const useSaveGlobalSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveGlobalPayload) => securitySettingsApi.saveGlobal(payload),
    // Reîncărcăm: serverul poate ridica valorile sub prag, deci ce am trimis nu e
    // neapărat ce s-a salvat.
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKey }),
  })
}

export const useSaveRoleSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      roleId, idleTimeoutMinutes, refreshTokenDays,
    }: { roleId: string; idleTimeoutMinutes: number; refreshTokenDays: number }) =>
      securitySettingsApi.saveRole(roleId, { idleTimeoutMinutes, refreshTokenDays }),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKey }),
  })
}

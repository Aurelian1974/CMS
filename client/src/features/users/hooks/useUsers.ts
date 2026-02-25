import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { usersApi } from '@/api/endpoints/users.api'
import type {
  GetUsersParams,
  CreateUserPayload,
  UpdateUserPayload,
  ChangePasswordPayload,
} from '../types/user.types'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const userKeys = {
  all:     ['users'] as const,
  lists:   () => [...userKeys.all, 'list'] as const,
  list:    (params: GetUsersParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail:  (id: string) => [...userKeys.details(), id] as const,
  roles:   () => [...userKeys.all, 'roles'] as const,
}

// ── Roluri (nomenclator) ─────────────────────────────────────────────────────
export const useRoles = () =>
  useQuery({
    queryKey: userKeys.roles(),
    queryFn: () => usersApi.getRoles(),
    staleTime: 10 * 60 * 1000,
  })

// ── Listare paginată ──────────────────────────────────────────────────────────
export const useUsersList = (params: GetUsersParams) =>
  useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000,
  })

// ── Detaliu utilizator ───────────────────────────────────────────────────────
export const useUserDetail = (id: string) =>
  useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  })

// ── Creare utilizator ────────────────────────────────────────────────────────
export const useCreateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

// ── Actualizare utilizator ───────────────────────────────────────────────────
export const useUpdateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => usersApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

// ── Schimbare parolă ─────────────────────────────────────────────────────────
export const useChangePassword = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: ChangePasswordPayload }) =>
      usersApi.changePassword(userId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

// ── Ștergere utilizator (soft delete) ────────────────────────────────────────
export const useDeleteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

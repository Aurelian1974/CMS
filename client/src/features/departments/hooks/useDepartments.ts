import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentsApi } from '@/api/endpoints/departments.api'
import type {
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from '@/features/departments/types/department.types'

// ===== Query keys ierarhice =====
export const departmentKeys = {
  all:  ['departments'] as const,
  list: (params?: { isActive?: boolean; locationId?: string }) =>
    [...departmentKeys.all, 'list', params] as const,
  detail: (id: string) => [...departmentKeys.all, 'detail', id] as const,
}

/// Listare departamente
export const useDepartments = (isActive?: boolean, locationId?: string) =>
  useQuery({
    queryKey: departmentKeys.list({ isActive, locationId }),
    queryFn: () => departmentsApi.getAll(isActive, locationId),
    staleTime: Infinity,
  })

/// Detaliu departament
export const useDepartment = (id: string) =>
  useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => departmentsApi.getById(id),
    enabled: !!id,
  })

/// Creare departament
export const useCreateDepartment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) =>
      departmentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}

/// Actualizare departament
export const useUpdateDepartment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateDepartmentPayload) =>
      departmentsApi.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}

/// Ștergere departament (soft delete)
export const useDeleteDepartment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      departmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}

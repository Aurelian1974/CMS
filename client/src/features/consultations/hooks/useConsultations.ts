import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { consultationsApi } from '@/api/endpoints/consultations.api'
import type {
  GetConsultationsParams,
  CreateConsultationPayload,
  UpdateConsultationPayload,
} from '../types/consultation.types'

export const consultationKeys = {
  all:     ['consultations'] as const,
  lists:   () => [...consultationKeys.all, 'list'] as const,
  list:    (params: GetConsultationsParams) => [...consultationKeys.lists(), params] as const,
  details: () => [...consultationKeys.all, 'detail'] as const,
  detail:  (id: string) => [...consultationKeys.details(), id] as const,
  byAppointment: (appointmentId: string) => [...consultationKeys.all, 'by-appointment', appointmentId] as const,
}

export const useConsultations = (params: GetConsultationsParams) =>
  useQuery({
    queryKey: consultationKeys.list(params),
    queryFn: () => consultationsApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 1 * 60 * 1000,
  })

export const useConsultationDetail = (id: string, enabled = true) =>
  useQuery({
    queryKey: consultationKeys.detail(id),
    queryFn: () => consultationsApi.getById(id),
    enabled: !!id && enabled,
  })

export const useConsultationByAppointment = (appointmentId: string, enabled = true) =>
  useQuery({
    queryKey: consultationKeys.byAppointment(appointmentId),
    queryFn: () => consultationsApi.getByAppointmentId(appointmentId),
    enabled: !!appointmentId && enabled,
  })

export const useCreateConsultation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateConsultationPayload) => consultationsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationKeys.lists() })
    },
  })
}

export const useUpdateConsultation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateConsultationPayload) => consultationsApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationKeys.lists() })
    },
  })
}

export const useDeleteConsultation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => consultationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultationKeys.lists() })
    },
  })
}

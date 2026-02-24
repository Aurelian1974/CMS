import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '@/api/axiosInstance';
import type { GetDoctorsParams, DoctorDto, DoctorsPagedResult } from '../types/doctor.types';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const doctorKeys = {
  all:     ['doctors'] as const,
  lists:   () => [...doctorKeys.all, 'list'] as const,
  list:    (params: GetDoctorsParams) => [...doctorKeys.lists(), params] as const,
  details: () => [...doctorKeys.all, 'detail'] as const,
  detail:  (id: string) => [...doctorKeys.details(), id] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────
export const useDoctors = (params: GetDoctorsParams) =>
  useQuery({
    queryKey: doctorKeys.list(params),
    queryFn: () =>
      api.get<DoctorsPagedResult>('/api/doctors', { params }).then((r: any) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000,
  });

export const useDoctorDetail = (id: string) =>
  useQuery({
    queryKey: doctorKeys.detail(id),
    queryFn: () => api.get<DoctorDto>(`/api/doctors/${id}`).then((r: any) => r.data),
    enabled: !!id,
  });

export const useDeactivateDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/doctors/${id}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: doctorKeys.lists() }),
  });
};

export const useActivateDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/doctors/${id}/activate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: doctorKeys.lists() }),
  });
};

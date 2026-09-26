import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { prescriptionsApi } from '@/api/endpoints/prescriptions.api'
import type {
  CancelPrescriptionPayload,
  CreatePrescriptionsPayload,
  GenerateConsultationPrescriptionsPayload,
  GetPrescriptionsParams,
  UpdatePrescriptionPayload,
} from '../types/prescription.types'

export const prescriptionKeys = {
  all:            ['prescriptions'] as const,
  lists:          () => [...prescriptionKeys.all, 'list'] as const,
  list:           (params: GetPrescriptionsParams) => [...prescriptionKeys.lists(), params] as const,
  details:        () => [...prescriptionKeys.all, 'detail'] as const,
  detail:         (id: string) => [...prescriptionKeys.details(), id] as const,
  pdf:            (id: string) => [...prescriptionKeys.all, 'pdf', id] as const,
  lookups:        () => [...prescriptionKeys.all, 'lookups'] as const,
  byConsultation: (consultationId: string) => [...prescriptionKeys.all, 'by-consultation', consultationId] as const,
}

// ── Queries ──────────────────────────────────────────────────────────────────
export const usePrescriptions = (params: GetPrescriptionsParams) =>
  useQuery({
    queryKey: prescriptionKeys.list(params),
    queryFn: () => prescriptionsApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

export const usePrescription = (id: string | null) =>
  useQuery({
    queryKey: prescriptionKeys.detail(id ?? ''),
    queryFn: () => prescriptionsApi.getById(id!),
    enabled: !!id,
  })

export const usePrescriptionPdf = (id: string | null, updatedAt: string | null, enabled: boolean) =>
  useQuery({
    // updatedAt în cheie: după orice modificare PDF-ul se regenerează
    queryKey: [...prescriptionKeys.pdf(id ?? ''), updatedAt],
    queryFn: () => prescriptionsApi.getPdf(id!),
    enabled: !!id && enabled,
    staleTime: 5 * 60_000,
  })

export const usePrescriptionLookups = () =>
  useQuery({
    queryKey: prescriptionKeys.lookups(),
    queryFn: () => prescriptionsApi.getLookups(),
    staleTime: Infinity,
  })

export const useConsultationPrescriptions = (consultationId: string) =>
  useQuery({
    queryKey: prescriptionKeys.byConsultation(consultationId),
    queryFn: () => prescriptionsApi.getByConsultation(consultationId),
    enabled: !!consultationId,
  })

// ── Mutations ────────────────────────────────────────────────────────────────
// Orice modificare poate schimba lista, detaliul, PDF-ul și panoul din consultație
const useInvalidatingMutation = <TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: prescriptionKeys.all }),
  })
}

export const useCreatePrescriptions = () =>
  useInvalidatingMutation((payload: CreatePrescriptionsPayload) => prescriptionsApi.create(payload))

export const useGenerateConsultationPrescriptions = () =>
  useInvalidatingMutation((payload: GenerateConsultationPrescriptionsPayload) =>
    prescriptionsApi.generateFromConsultation(payload))

export const useUpdatePrescription = () =>
  useInvalidatingMutation((payload: UpdatePrescriptionPayload) => prescriptionsApi.update(payload))

export const useIssuePrescription = () =>
  useInvalidatingMutation((id: string) => prescriptionsApi.issue(id))

export const useTransmitPrescription = () =>
  useInvalidatingMutation((id: string) => prescriptionsApi.transmit(id))

export const useCancelPrescription = () =>
  useInvalidatingMutation((payload: CancelPrescriptionPayload) => prescriptionsApi.cancel(payload))

export const useDeletePrescription = () =>
  useInvalidatingMutation((id: string) => prescriptionsApi.delete(id))

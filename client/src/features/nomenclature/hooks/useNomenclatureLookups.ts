import { useQuery } from '@tanstack/react-query'
import { nomenclatureApi } from '@/api/endpoints/nomenclature.api'

/// Hook-uri pentru nomenclatoare simple (lookups) — Genders, BloodTypes, AllergyTypes, AllergySeverities.
/// Datele se schimbă rar → staleTime mare (10 min).

// ── Query keys ────────────────────────────────────────────────────────────────
export const lookupKeys = {
  genders:           (isActive?: boolean) => ['nomenclature', 'genders', { isActive }] as const,
  bloodTypes:        (isActive?: boolean) => ['nomenclature', 'blood-types', { isActive }] as const,
  allergyTypes:      (isActive?: boolean) => ['nomenclature', 'allergy-types', { isActive }] as const,
  allergySeverities: (isActive?: boolean) => ['nomenclature', 'allergy-severities', { isActive }] as const,
}

// ── Genuri ────────────────────────────────────────────────────────────────────
export const useGenders = (isActive?: boolean) =>
  useQuery({
    queryKey: lookupKeys.genders(isActive),
    queryFn: () => nomenclatureApi.getGenders(isActive),
    staleTime: 10 * 60 * 1000,
  })

// ── Grupe sanguine ────────────────────────────────────────────────────────────
export const useBloodTypes = (isActive?: boolean) =>
  useQuery({
    queryKey: lookupKeys.bloodTypes(isActive),
    queryFn: () => nomenclatureApi.getBloodTypes(isActive),
    staleTime: 10 * 60 * 1000,
  })

// ── Tipuri alergii ────────────────────────────────────────────────────────────
export const useAllergyTypes = (isActive?: boolean) =>
  useQuery({
    queryKey: lookupKeys.allergyTypes(isActive),
    queryFn: () => nomenclatureApi.getAllergyTypes(isActive),
    staleTime: 10 * 60 * 1000,
  })

// ── Severități alergii ────────────────────────────────────────────────────────
export const useAllergySeverities = (isActive?: boolean) =>
  useQuery({
    queryKey: lookupKeys.allergySeverities(isActive),
    queryFn: () => nomenclatureApi.getAllergySeverities(isActive),
    staleTime: 10 * 60 * 1000,
  })

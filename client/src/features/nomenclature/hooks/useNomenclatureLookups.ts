import { useQuery } from '@tanstack/react-query'
import { nomenclatureApi } from '@/api/endpoints/nomenclature.api'

/// Hook-uri pentru nomenclatoare simple (lookups) — Genders, BloodTypes, AllergyTypes, AllergySeverities.
/// Datele sunt statice → staleTime: Infinity. Se re-fetch-uiesc doar la invalidare explicită (mutații admin).

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
    staleTime: Infinity,
  })

// ── Grupe sanguine ────────────────────────────────────────────────────────────
export const useBloodTypes = (isActive?: boolean) =>
  useQuery({
    queryKey: lookupKeys.bloodTypes(isActive),
    queryFn: () => nomenclatureApi.getBloodTypes(isActive),
    staleTime: Infinity,
  })

// ── Tipuri alergii ────────────────────────────────────────────────────────────
export const useAllergyTypes = (isActive?: boolean) =>
  useQuery({
    queryKey: lookupKeys.allergyTypes(isActive),
    queryFn: () => nomenclatureApi.getAllergyTypes(isActive),
    staleTime: Infinity,
  })

// ── Severități alergii ────────────────────────────────────────────────────────
export const useAllergySeverities = (isActive?: boolean) =>
  useQuery({
    queryKey: lookupKeys.allergySeverities(isActive),
    queryFn: () => nomenclatureApi.getAllergySeverities(isActive),
    staleTime: Infinity,
  })

// ── Județe ───────────────────────────────────────────────────────────────────
/// Lista completă de județe — se schimbă extrem de rar, cache infinit.
export const useCounties = () =>
  useQuery({
    queryKey: ['nomenclature', 'counties'] as const,
    queryFn: () => nomenclatureApi.getCounties(),
    staleTime: Infinity,
  })

// ── Localități per județ ──────────────────────────────────────────────────────
/// Localitățile unui județ, filtrate server-side. Activat doar când countyId e valid.
export const useLocalities = (countyId: string) =>
  useQuery({
    queryKey: ['nomenclature', 'localities', countyId] as const,
    queryFn: () => nomenclatureApi.getLocalities(countyId),
    enabled: !!countyId,
    staleTime: Infinity,
  })

import { useQuery } from '@tanstack/react-query'
import { nomenclatureApi } from '@/api/endpoints/nomenclature.api'
import type { CaenCodeSearchParams } from '@/features/nomenclature/types/caenCode.types'

export const caenCodeKeys = {
  all:    ['caenCodes'] as const,
  search: (params: CaenCodeSearchParams) => [...caenCodeKeys.all, 'search', params] as const,
}

/**
 * Cauta coduri CAEN dupa text liber (cod sau denumire).
 * Implicit returneaza toate clasele (nivel 4) — codurile efectiv folosite la inregistrare.
 *
 * @example
 * // Autocomplete la tastare
 * const { data } = useCaenCodes({ search: inputValue, classesOnly: true })
 */
export const useCaenCodes = (params: CaenCodeSearchParams = {}) =>
  useQuery({
    queryKey: caenCodeKeys.search(params),
    queryFn: () => nomenclatureApi.searchCaenCodes(params),
    // Stale dupa 30 min — nomenclatorul CAEN se schimba rar
    staleTime: 30 * 60 * 1000,
    // Nu face request daca nu avem minim 2 caractere (pentru autocomplete)
    enabled: params.search === undefined || params.search.length === 0 || params.search.length >= 2,
  })

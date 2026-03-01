import { useCallback, useEffect, useMemo, useState } from 'react'
import { useWatch, type Control, type FieldValues, type Path } from 'react-hook-form'
import { AddressAutocomplete, type AddressSuggestion } from '@/components/forms/AddressAutocomplete'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { useCounties, useLocalities } from '@/features/nomenclature/hooks/useNomenclatureLookups'

// ── Constrângere tip — formularul gazdă trebuie să aibă aceste câmpuri ────────
export type WithAddressFields = {
  address: string
  city: string
  county: string
  postalCode: string
}

export interface AddressFieldsProps<T extends FieldValues> {
  control: Control<T>
  /** setValue din useForm al formularului gazdă */
  setValue: (name: string, value: string) => void
}

// ── Iconiță ⓘ pentru câmpul Cod poștal ───────────────────────────────────────
const PostalCodeHint = () => (
  <span
    title="Codul poștal este completat automat din adresă. Îl puteți edita manual dacă este necesar."
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: '6px',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      backgroundColor: '#5B8DB8',
      color: '#fff',
      fontSize: '10px',
      fontWeight: 700,
      cursor: 'help',
      lineHeight: 1,
      flexShrink: 0,
    }}
  >
    i
  </span>
)

// ── Normalizare diacritice pentru matching flexibil ───────────────────────────
const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

// ── Componentă ────────────────────────────────────────────────────────────────

/**
 * Bloc reutilizabil cu câmpurile: Adresă (autocomplete Photon), Județ, Localitate, Cod poștal.
 * Gestionează intern starea județ selectat + fetch localități dependente.
 * Se integrează cu orice formular RHF care are câmpurile: address, city, county, postalCode.
 */
export const AddressFields = <T extends FieldValues>({
  control,
  setValue,
}: AddressFieldsProps<T>) => {
  const [selectedCountyId, setSelectedCountyId] = useState<string>('')

  const { data: countiesResp } = useCounties()
  const { data: localitiesResp } = useLocalities(selectedCountyId)

  const counties   = useMemo(() => countiesResp?.data ?? [], [countiesResp])
  const localities = useMemo(() => localitiesResp?.data ?? [], [localitiesResp])

  const countyOptions   = useMemo(() => counties.map(c => ({ value: c.name, label: c.name })), [counties])
  const localityOptions = useMemo(() => localities.map(l => ({ value: l.name, label: l.name })), [localities])

  // Urmărește câmpul county din formular — sincronizează selectedCountyId când formularul e resetat
  const watchedCounty = useWatch({ control, name: 'county' as Path<T> }) as string
  const watchedCity   = useWatch({ control, name: 'city' as Path<T> }) as string

  useEffect(() => {
    if (!watchedCounty) {
      setSelectedCountyId('')
      return
    }
    if (counties.length === 0) return
    const found = counties.find(c => c.name === watchedCounty)
    setSelectedCountyId(found?.id ?? '')
  }, [watchedCounty, counties])

  // La selectarea unei sugestii Photon: completează județ, localitate, cod poștal
  const handleAddressSelect = useCallback(
    (suggestion: Omit<AddressSuggestion, 'displayText' | 'detailText'>) => {
      if (suggestion.postcode) setValue('postalCode', suggestion.postcode)

      if (suggestion.county) {
        const target  = normalize(suggestion.county)
        const matched = counties.find(c => normalize(c.name) === target)
        if (matched) {
          setValue('county', matched.name)
          setSelectedCountyId(matched.id)
        }
      }

      if (suggestion.city) setValue('city', suggestion.city)
    },
    [setValue, counties],
  )

  const locationHint = watchedCounty || watchedCity || undefined

  return (
    <>
      {/* ── Adresă + Județ + Localitate ──────────────────────────────────── */}
      <div className="row g-3">
        <div className="col-md-6">
          <AddressAutocomplete<T>
            name={'address' as Path<T>}
            control={control}
            label="Adresă"
            placeholder="Str. Exemplu, Nr. 1"
            locationHint={locationHint}
            onSuggestionSelect={handleAddressSelect}
          />
        </div>
        <div className="col-md-3">
          <FormSelect<T>
            name={'county' as Path<T>}
            control={control}
            label="Județ"
            options={countyOptions}
            placeholder="Selectează județul..."
            allowFiltering={true}
            showClearButton={true}
            onValueChange={(countyName) => {
              const county = counties.find(c => c.name === countyName)
              setSelectedCountyId(county?.id ?? '')
              setValue('city', '')
            }}
          />
        </div>
        <div className="col-md-3">
          <FormSelect<T>
            name={'city' as Path<T>}
            control={control}
            label="Localitate"
            options={localityOptions}
            placeholder={selectedCountyId ? 'Selectează localitatea...' : 'Selectați mai întâi județul'}
            allowFiltering={true}
            showClearButton={true}
            disabled={!selectedCountyId}
          />
        </div>
      </div>

      {/* ── Cod poștal ───────────────────────────────────────────────────── */}
      <div className="row g-3">
        <div className="col-md-3">
          <FormInput<T>
            name={'postalCode' as Path<T>}
            control={control}
            label="Cod poștal"
            placeholder="010101"
            labelSuffix={<PostalCodeHint />}
          />
        </div>
      </div>
    </>
  )
}

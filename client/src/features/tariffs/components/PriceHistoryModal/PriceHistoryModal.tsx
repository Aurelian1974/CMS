import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { AppBadge } from '@/components/ui/AppBadge'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormDatePicker } from '@/components/forms/FormDatePicker'
import { formatCurrency, formatDate, formatDateTime, toLocalDateISO } from '@/utils/format'
import { useAddMedicalServicePrice, useMedicalService } from '../../hooks/useTariffs'
import { medicalServicePriceSchema, type MedicalServicePriceFormData } from '../../schemas/tariff.schema'
import type { BillingLookupsDto } from '../../types/tariff.types'
import styles from './PriceHistoryModal.module.scss'

interface PriceHistoryModalProps {
  serviceId: string | null
  onClose: () => void
  lookups: BillingLookupsDto | undefined
  canEdit: boolean
  onSaved: () => void
  onError: (err: unknown) => void
}

// ValidTo e exclusiv în BD; afișăm ultima zi în care prețul a fost valabil
const lastValidDay = (validTo: string) => {
  const d = new Date(validTo)
  d.setDate(d.getDate() - 1)
  return formatDate(d)
}

export const PriceHistoryModal = ({ serviceId, onClose, lookups, canEdit, onSaved, onError }: PriceHistoryModalProps) => {
  const { data: resp, isLoading } = useMedicalService(serviceId)
  const service = resp?.data
  const addPrice = useAddMedicalServicePrice()

  const { control, handleSubmit, reset } = useForm<MedicalServicePriceFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(medicalServicePriceSchema) as any,
    defaultValues: { price: 0, vatRateId: '', validFrom: toLocalDateISO(new Date()) },
  })

  useEffect(() => {
    if (!service) return
    reset({
      price: service.currentPrice ?? 0,
      vatRateId: service.currentVatRateId ?? lookups?.vatRates[0]?.id ?? '',
      validFrom: toLocalDateISO(new Date()),
    })
  }, [service, lookups, reset])

  const vatOptions = useMemo(
    () => (lookups?.vatRates ?? []).map((v) => ({ value: v.id, label: v.name })),
    [lookups],
  )

  const handleAdd = (data: MedicalServicePriceFormData) => {
    if (!serviceId) return
    addPrice.mutate(
      { id: serviceId, price: data.price, vatRateId: data.vatRateId, validFrom: data.validFrom },
      { onSuccess: onSaved, onError },
    )
  }

  return (
    <AppModal
      isOpen={!!serviceId}
      onClose={onClose}
      maxWidth={760}
      title={service ? `Istoric prețuri — ${service.name}` : 'Istoric prețuri'}
      bodyClassName={styles.body}
      footer={<AppButton variant="secondary" onClick={onClose}>Închide</AppButton>}
    >
      {isLoading || !service ? (
        <div className={styles.muted}>Se încarcă…</div>
      ) : (
        <>
          <div className={styles.summary}>
            <div>
              <div className={styles.label}>Cod</div>
              <div className={styles.value}>{service.code}</div>
            </div>
            <div>
              <div className={styles.label}>Categorie</div>
              <div className={styles.value}>{service.categoryName}</div>
            </div>
            <div>
              <div className={styles.label}>Preț în vigoare</div>
              <div className={styles.valueStrong}>
                {service.currentPrice != null ? formatCurrency(service.currentPrice) : '—'}
              </div>
            </div>
            <div>
              <div className={styles.label}>Regim TVA</div>
              <div className={styles.value}>{service.currentVatRateName ?? '—'}</div>
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Valabil de la</th>
                <th>Până la</th>
                <th className={styles.right}>Preț</th>
                <th>Regim TVA</th>
                <th>Introdus de</th>
              </tr>
            </thead>
            <tbody>
              {service.prices.map((p) => (
                <tr key={p.id} className={p.isCurrent ? styles.currentRow : undefined}>
                  <td>
                    {formatDate(p.validFrom)}
                    {p.isCurrent && <AppBadge variant="success" className="ms-2">În vigoare</AppBadge>}
                  </td>
                  <td>{p.validTo ? lastValidDay(p.validTo) : <span className={styles.muted}>—</span>}</td>
                  <td className={styles.right}>{formatCurrency(p.price)}</td>
                  <td>{p.vatRateName}</td>
                  <td className={styles.muted}>
                    {p.createdByName ?? '—'} · {formatDateTime(p.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {canEdit && (
            // Formular separat de restul modalului — submit-ul lui nu trebuie să închidă nimic
            <form className={styles.addForm} onSubmit={(e) => { e.stopPropagation(); void handleSubmit(handleAdd)(e) }}>
              <div className={styles.sectionTitle}>Preț nou</div>
              <div className={styles.row}>
                <FormInput<MedicalServicePriceFormData> name="price" control={control}
                  label="Preț (RON, TVA inclus)" type="number" required className={styles.price} />
                <FormSelect<MedicalServicePriceFormData> name="vatRateId" control={control}
                  label="Regim TVA" options={vatOptions} required className={styles.grow} />
                <FormDatePicker<MedicalServicePriceFormData> name="validFrom" control={control}
                  label="Valabil de la" required min={new Date(new Date().setHours(0, 0, 0, 0))} className={styles.date} />
                <AppButton type="submit" variant="primary" isLoading={addPrice.isPending}
                  loadingText="Se salvează…" className={styles.addBtn}>
                  Adaugă
                </AppButton>
              </div>
              <p className={styles.hint}>
                Versiunea curentă se închide automat la data aleasă. Aceeași dată cu ultima versiune o corectează.
                Liniile deja adăugate pe consultații păstrează prețul de la momentul adăugării.
              </p>
            </form>
          )}
        </>
      )}
    </AppModal>
  )
}

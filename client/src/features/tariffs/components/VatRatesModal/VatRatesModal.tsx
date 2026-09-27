import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { AppBadge } from '@/components/ui/AppBadge'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { useCreateVatRate, useUpdateVatRate, useVatRates } from '../../hooks/useTariffs'
import { vatRateSchema, type VatRateFormData } from '../../schemas/tariff.schema'
import type { VatRateDto } from '../../types/tariff.types'
import styles from './VatRatesModal.module.scss'

// Coduri de categorie TVA din standardul UBL / CIUS-RO (e-Factura)
const UBL_CATEGORY_OPTIONS = [
  { value: 'S', label: 'S — cotă standard / redusă' },
  { value: 'E', label: 'E — scutit' },
  { value: 'O', label: 'O — în afara sferei TVA' },
  { value: 'Z', label: 'Z — cotă zero' },
]

interface VatRatesModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (msg: string) => void
  onError: (err: unknown) => void
}

const emptyForm: VatRateFormData = {
  code: '', name: '', percent: 0, ublCategoryCode: 'E', exemptionReasonCode: '', exemptionReasonText: '', isActive: true,
}

export const VatRatesModal = ({ isOpen, onClose, onSaved, onError }: VatRatesModalProps) => {
  const { data: resp } = useVatRates()
  const vatRates = resp?.data ?? []
  const createMut = useCreateVatRate()
  const updateMut = useUpdateVatRate()
  const [editing, setEditing] = useState<VatRateDto | 'new' | null>(null)

  const { control, handleSubmit, reset, register } = useForm<VatRateFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(vatRateSchema) as any,
    defaultValues: emptyForm,
  })

  useEffect(() => {
    if (editing === 'new') reset(emptyForm)
    else if (editing) reset({
      code: editing.code,
      name: editing.name,
      percent: editing.percent ?? 0,
      ublCategoryCode: editing.ublCategoryCode,
      exemptionReasonCode: editing.exemptionReasonCode ?? '',
      exemptionReasonText: editing.exemptionReasonText ?? '',
      isActive: editing.isActive ?? true,
    })
  }, [editing, reset])

  const onSubmit = (data: VatRateFormData) => {
    const common = {
      name: data.name,
      percent: data.percent,
      ublCategoryCode: data.ublCategoryCode,
      exemptionReasonCode: data.exemptionReasonCode || null,
      exemptionReasonText: data.exemptionReasonText || null,
    }
    const done = { onSuccess: () => { setEditing(null); onSaved('Regimul TVA a fost salvat.') }, onError }
    if (editing === 'new') createMut.mutate({ code: data.code, ...common }, done)
    else if (editing) updateMut.mutate({ id: editing.id!, ...common, isActive: data.isActive }, done)
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={() => { setEditing(null); onClose() }}
      maxWidth={820}
      title="Regimuri TVA"
      bodyClassName={styles.body}
      footer={<AppButton variant="secondary" onClick={() => { setEditing(null); onClose() }}>Închide</AppButton>}
    >
      <p className={styles.hint}>
        Regimul de scutire se validează cu contabilul (temei legal și cod VATEX pentru e-Factura).
        Modificarea unui regim nu afectează liniile deja adăugate pe consultații sau facturi.
      </p>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Cod</th><th>Denumire</th><th className={styles.right}>Cotă</th><th>Categorie</th>
            <th>Mențiune pe factură</th><th>Grupă casă</th><th>Status</th><th />
          </tr>
        </thead>
        <tbody>
          {vatRates.map((v) => (
            <tr key={v.id}>
              <td className={styles.code}>{v.code}</td>
              <td>{v.name}</td>
              <td className={styles.right}>{v.percent}%</td>
              <td>{v.ublCategoryCode}</td>
              <td className={styles.muted}>{v.exemptionReasonText ?? '—'}</td>
              <td>{v.fiscalTaxGroup ?? <span className={styles.warn}>nemapat</span>}</td>
              <td>
                <AppBadge variant={v.isActive ? 'success' : 'neutral'} withDot>{v.isActive ? 'Activ' : 'Inactiv'}</AppBadge>
              </td>
              <td className={styles.right}>
                <AppButton size="sm" variant="ghost" onClick={() => setEditing(v)}>Editează</AppButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing === null ? (
        <div>
          <AppButton size="sm" variant="outline-primary" onClick={() => setEditing('new')}>Regim TVA nou</AppButton>
        </div>
      ) : (
        <form className={styles.form} onSubmit={(e) => { e.stopPropagation(); void handleSubmit(onSubmit)(e) }}>
          <div className={styles.sectionTitle}>{editing === 'new' ? 'Regim TVA nou' : `Editează ${editing.code}`}</div>
          <div className={styles.row}>
            <FormInput<VatRateFormData> name="code" control={control} label="Cod" required
              disabled={editing !== 'new'} className={styles.small} />
            <FormInput<VatRateFormData> name="name" control={control} label="Denumire" required className={styles.grow} />
            <FormInput<VatRateFormData> name="percent" control={control} label="Cotă (%)" type="number"
              required className={styles.small} />
            <FormSelect<VatRateFormData> name="ublCategoryCode" control={control} label="Categorie e-Factura"
              options={UBL_CATEGORY_OPTIONS} required className={styles.grow} />
          </div>
          <div className={styles.row}>
            <FormInput<VatRateFormData> name="exemptionReasonCode" control={control} label="Cod motiv scutire (VATEX)"
              className={styles.medium} />
            <FormInput<VatRateFormData> name="exemptionReasonText" control={control} label="Mențiune pe factură"
              className={styles.grow} />
          </div>
          {editing !== 'new' && (
            <label className={styles.checkbox}>
              <input type="checkbox" {...register('isActive')} /> Activ
            </label>
          )}
          <div className="d-flex justify-content-end gap-2">
            <AppButton variant="secondary" onClick={() => setEditing(null)}>Renunță</AppButton>
            <AppButton type="submit" variant="primary" isLoading={createMut.isPending || updateMut.isPending}
              loadingText="Se salvează…">Salvează</AppButton>
          </div>
        </form>
      )}
    </AppModal>
  )
}

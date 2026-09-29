import { useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { AppBadge } from '@/components/ui/AppBadge'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormDatePicker } from '@/components/forms/FormDatePicker'
import { toLocalDateISO } from '@/utils/format'
import { useImportableInvestigationTypes, useImportInvestigationServices } from '../../hooks/useTariffs'
import { importInvestigationsSchema, type ImportInvestigationsFormData } from '../../schemas/tariff.schema'
import type { BillingLookupsDto, ImportableInvestigationTypeDto } from '../../types/tariff.types'
import styles from './ImportInvestigationsModal.module.scss'

interface ImportInvestigationsModalProps {
  isOpen: boolean
  onClose: () => void
  lookups: BillingLookupsDto | undefined
  onImported: (count: number) => void
  onError: (err: unknown) => void
}

const TAB_ORDER = ['Imaging', 'Functional', 'Procedures']
const TAB_LABELS: Record<string, string> = {
  Imaging: 'Imagistică',
  Functional: 'Funcțional',
  Procedures: 'Proceduri',
}

interface TypeGroup {
  tab: string
  items: { type: ImportableInvestigationTypeDto; index: number }[]
}

const groupByTab = (types: ImportableInvestigationTypeDto[]): TypeGroup[] => {
  const map = new Map<string, TypeGroup>()
  types.forEach((type, index) => {
    const group = map.get(type.parentTab) ?? { tab: type.parentTab, items: [] }
    group.items.push({ type, index })
    map.set(type.parentTab, group)
  })
  const rank = (tab: string) => (TAB_ORDER.includes(tab) ? TAB_ORDER.indexOf(tab) : TAB_ORDER.length)
  return [...map.values()].sort((a, b) => rank(a.tab) - rank(b.tab))
}

export const ImportInvestigationsModal = ({
  isOpen,
  onClose,
  lookups,
  onImported,
  onError,
}: ImportInvestigationsModalProps) => {
  const { data: resp, isLoading } = useImportableInvestigationTypes(isOpen)
  const types = useMemo(() => resp?.data ?? [], [resp])
  const importMut = useImportInvestigationServices()

  const { control, register, handleSubmit, reset, formState: { errors } } =
    useForm<ImportInvestigationsFormData>({
      resolver: zodResolver(importInvestigationsSchema),
      defaultValues: { vatRateId: '', validFrom: toLocalDateISO(new Date()), rows: [] },
    })

  // Formularul se inițializează o singură dată per deschidere — un refetch nu șterge ce s-a completat
  const initialized = useRef(false)
  useEffect(() => {
    if (!isOpen) {
      initialized.current = false
      return
    }
    if (initialized.current || !resp) return
    initialized.current = true
    reset({
      vatRateId: lookups?.vatRates[0]?.id ?? '',
      validFrom: toLocalDateISO(new Date()),
      rows: types.map((t) => ({ typeId: t.investigationTypeId, isNew: !t.existingServiceCode, price: '' })),
    })
  }, [isOpen, resp, types, lookups, reset])

  const missingCount = useMemo(() => types.filter((t) => !t.existingServiceCode).length, [types])

  const groups = useMemo(() => groupByTab(types), [types])
  const vatOptions = useMemo(
    () => (lookups?.vatRates ?? []).map((v) => ({ value: v.id, label: v.name })),
    [lookups],
  )

  const onSubmit = (data: ImportInvestigationsFormData) => {
    const items = data.rows
      .filter((r) => r.isNew && r.price.trim() !== '')
      .map((r) => ({ investigationTypeId: r.typeId, price: Number(r.price) }))

    importMut.mutate(
      {
        items,
        vatRateId: items.length > 0 ? data.vatRateId : null,
        validFrom: items.length > 0 ? data.validFrom : null,
      },
      { onSuccess: (r) => onImported(r.data ?? missingCount), onError },
    )
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={820}
      title="Importă investigații paraclinice"
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      bodyClassName={styles.body}
      footer={
        <>
          <span className={styles.counter}>{missingCount} investigații fără serviciu</span>
          <AppButton variant="secondary" onClick={onClose} disabled={importMut.isPending}>Anulează</AppButton>
          <AppButton type="submit" variant="primary" isLoading={importMut.isPending} loadingText="Se importă…"
            disabled={missingCount === 0}>
            Importă {missingCount > 0 ? missingCount : ''}
          </AppButton>
        </>
      }
    >
      {isLoading ? (
        <div className={styles.muted}>Se încarcă…</div>
      ) : types.length === 0 ? (
        <div className={styles.empty}>Nu există investigații facturabile active în nomenclator.</div>
      ) : (
        <>
          <p className={styles.hint}>
            Tarifele sunt 1:1 cu investigațiile din consultație (Imagistică, Funcțional, Proceduri): fiecare investigație
            are exact un serviciu, cu aceeași denumire, în categoria „Investigații paraclinice”. Importul creează
            serviciile lipsă (cod INV-001, INV-002, …). Prețul e opțional — fără preț, investigația nu intră la plată
            până nu i se adaugă unul din istoricul de prețuri.
          </p>
          {missingCount === 0 && (
            <div className={styles.empty}>Toate investigațiile facturabile au deja un serviciu în tarife.</div>
          )}

          {missingCount > 0 && (
            <>
              <div className={styles.row}>
                <FormSelect<ImportInvestigationsFormData> name="vatRateId" control={control} label="Regim TVA"
                  options={vatOptions} className={styles.grow} />
                <FormDatePicker<ImportInvestigationsFormData> name="validFrom" control={control} label="Preț valabil de la"
                  required min={new Date(new Date().setHours(0, 0, 0, 0))} className={styles.date} />
              </div>
              <p className={styles.hint}>Regimul TVA și data se aplică doar serviciilor cu preț completat.</p>
            </>
          )}

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Investigație = serviciu</th>
                  <th>Serviciu în tarife</th>
                  <th className={styles.priceCol}>Preț inițial (RON, TVA inclus)</th>
                </tr>
              </thead>
              {groups.map((g) => (
                <tbody key={g.tab}>
                  <tr className={styles.groupRow}>
                    <td colSpan={3}>{TAB_LABELS[g.tab] ?? g.tab}</td>
                  </tr>
                  {g.items.map(({ type, index }) => {
                    if (type.existingServiceCode) {
                      return (
                        <tr key={type.typeCode} className={styles.linkedRow}>
                          <td>{type.displayName}</td>
                          <td colSpan={2}>
                            <span className={styles.existingCode}>{type.existingServiceCode}</span>
                            <AppBadge variant={type.existingServiceIsActive ? 'success' : 'neutral'} withDot>
                              {type.existingServiceIsActive ? 'Serviciu activ' : 'Serviciu inactiv'}
                            </AppBadge>
                          </td>
                        </tr>
                      )
                    }
                    const priceError = errors.rows?.[index]?.price?.message
                    return (
                      <tr key={type.typeCode} className={styles.selectedRow}>
                        <td>{type.displayName}</td>
                        <td><AppBadge variant="warning">se creează</AppBadge></td>
                        <td className={styles.priceCol}>
                          <input type="number" step="0.01" min={0} className="form-control form-control-sm"
                            placeholder="fără preț" aria-label={`Preț ${type.displayName}`}
                            {...register(`rows.${index}.price`)} />
                          {priceError && <div className={styles.error}>{priceError}</div>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              ))}
            </table>
          </div>
        </>
      )}
    </AppModal>
  )
}

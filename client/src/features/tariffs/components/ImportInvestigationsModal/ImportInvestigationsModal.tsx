import { useEffect, useMemo, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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

  const { control, register, handleSubmit, reset, setValue, formState: { errors } } =
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
      rows: types.map((t) => ({ typeCode: t.typeCode, selected: false, name: t.displayName, price: '' })),
    })
  }, [isOpen, resp, types, lookups, reset])

  const rows = useWatch({ control, name: 'rows' })
  const importableIndexes = useMemo(
    () => types.flatMap((t, i) => (t.existingServiceCode ? [] : [i])),
    [types],
  )
  const selectedCount = rows.filter((r) => r.selected).length
  const allSelected = importableIndexes.length > 0 && selectedCount === importableIndexes.length

  const groups = useMemo(() => groupByTab(types), [types])
  const vatOptions = useMemo(
    () => (lookups?.vatRates ?? []).map((v) => ({ value: v.id, label: v.name })),
    [lookups],
  )

  const toggleAll = () => {
    importableIndexes.forEach((i) => setValue(`rows.${i}.selected`, !allSelected))
  }

  // Editarea denumirii sau a prețului bifează automat rândul
  const selectRow = (index: number) => {
    if (!rows[index]?.selected) setValue(`rows.${index}.selected`, true)
  }

  const onSubmit = (data: ImportInvestigationsFormData) => {
    const items = data.rows
      .filter((r) => r.selected)
      .map((r) => ({
        investigationTypeCode: r.typeCode,
        name: r.name.trim(),
        price: r.price.trim() === '' ? null : Number(r.price),
      }))
    const anyPrice = items.some((i) => i.price != null)

    importMut.mutate(
      {
        items,
        vatRateId: anyPrice ? data.vatRateId : null,
        validFrom: anyPrice ? data.validFrom : null,
      },
      { onSuccess: (r) => onImported(r.data ?? items.length), onError },
    )
  }

  const listError = errors.rows?.message ?? errors.rows?.root?.message

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
          <span className={styles.counter}>{selectedCount} selectate</span>
          <AppButton variant="secondary" onClick={onClose} disabled={importMut.isPending}>Anulează</AppButton>
          <AppButton type="submit" variant="primary" isLoading={importMut.isPending} loadingText="Se importă…"
            disabled={importableIndexes.length === 0}>
            Importă
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
            Lista vine din nomenclatorul de investigații paraclinice. Fiecare investigație bifată devine un serviciu
            în categoria „Investigații paraclinice”, cu cod generat automat (INV-001, INV-002, …). Serviciile fără
            preț apar ca „fără preț în vigoare” și nu pot fi adăugate pe consultații până nu primesc un preț.
            Investigațiile care au deja serviciu (inclusiv inactiv) nu se reimportă — serviciul se reactivează din listă.
          </p>
          {importableIndexes.length === 0 && (
            <div className={styles.empty}>Toate investigațiile facturabile au deja un serviciu în tarife.</div>
          )}

          <div className={styles.row}>
            <FormSelect<ImportInvestigationsFormData> name="vatRateId" control={control} label="Regim TVA"
              options={vatOptions} className={styles.grow} />
            <FormDatePicker<ImportInvestigationsFormData> name="validFrom" control={control} label="Preț valabil de la"
              required min={new Date(new Date().setHours(0, 0, 0, 0))} className={styles.date} />
          </div>
          <p className={styles.hint}>Regimul TVA și data se aplică doar serviciilor cu preț completat.</p>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkCol}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      aria-label="Selectează toate investigațiile" />
                  </th>
                  <th>Investigație</th>
                  <th>Denumire serviciu</th>
                  <th className={styles.priceCol}>Preț (RON, TVA inclus)</th>
                </tr>
              </thead>
              {groups.map((g) => (
                <tbody key={g.tab}>
                  <tr className={styles.groupRow}>
                    <td colSpan={4}>{TAB_LABELS[g.tab] ?? g.tab}</td>
                  </tr>
                  {g.items.map(({ type, index }) => {
                    if (type.existingServiceCode) {
                      return (
                        <tr key={type.typeCode} className={styles.linkedRow}>
                          <td className={styles.checkCol}>
                            <input type="checkbox" checked disabled aria-label={`${type.displayName} — are deja serviciu`} />
                          </td>
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
                    const selected = rows[index]?.selected ?? false
                    const rowErrors = errors.rows?.[index]
                    return (
                      <tr key={type.typeCode} className={selected ? styles.selectedRow : undefined}>
                        <td className={styles.checkCol}>
                          <input type="checkbox" {...register(`rows.${index}.selected`)}
                            aria-label={`Selectează ${type.displayName}`} />
                        </td>
                        <td>{type.displayName}</td>
                        <td>
                          <input type="text" className="form-control form-control-sm" maxLength={200}
                            {...register(`rows.${index}.name`, { onChange: () => selectRow(index) })} />
                          {rowErrors?.name?.message && <div className={styles.error}>{rowErrors.name.message}</div>}
                        </td>
                        <td className={styles.priceCol}>
                          <input type="number" step="0.01" min={0} className="form-control form-control-sm"
                            placeholder="fără preț" {...register(`rows.${index}.price`, { onChange: () => selectRow(index) })} />
                          {rowErrors?.price?.message && <div className={styles.error}>{rowErrors.price.message}</div>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              ))}
            </table>
          </div>

          {listError && <div className={styles.error}>{listError}</div>}
        </>
      )}
    </AppModal>
  )
}

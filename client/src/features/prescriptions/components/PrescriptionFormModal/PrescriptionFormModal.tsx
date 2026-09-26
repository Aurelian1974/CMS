import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { AppBadge } from '@/components/ui/AppBadge'
import { FormSelect } from '@/components/forms/FormSelect'
import { usePatientLookup } from '@/features/patients/hooks/usePatients'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { CnasDrugSearch } from '@/features/consultations/medications/components/CnasDrugSearch'
import { parseCopaymentLists, type CnasDrugLookupDto } from '@/features/consultations/medications/types/medication.types'
import { DOSE_MAX, DOSE_STEP } from '@/features/consultations/medications/schemas/medication.schema'
import { useCreatePrescriptions, usePrescriptionLookups, useUpdatePrescription } from '../../hooks/usePrescriptions'
import {
  prescriptionFormSchema,
  type PrescriptionFormData,
  type PrescriptionItemFormData,
} from '../../schemas/prescription.schema'
import type { PrescriptionDetailDto, PrescriptionItemData } from '../../types/prescription.types'
import { computeQuantity, formatDose, formatSeriesNumber } from '../../utils/prescriptionFormat'
import styles from './PrescriptionFormModal.module.scss'

interface PrescriptionFormModalProps {
  isOpen: boolean
  onClose: () => void
  /** null = creare (medicamentele se separă automat pe rețete compensate / simple) */
  editData: PrescriptionDetailDto | null
  onSaved: (message: string) => void
}

const newKey = () => crypto.randomUUID()

const toNullableNumber = (v: unknown) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v))
const toNullableText = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null)

// Formularul poate sta în portal deasupra consultației: Enter nu trimite nimic
const preventEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') e.preventDefault()
}

const drugDetails = (parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ') || null

const EMPTY_FORM: PrescriptionFormData = {
  patientId: '', doctorId: '', careTypeId: '', insuredCategoryId: '', treatmentDays: null,
  diagnostic: '', diagnosticCodes: '', registryNumber: '', isContinuation: false,
  referralLetterNumber: '', notes: '', items: [],
}

const fromDetail = (d: PrescriptionDetailDto): PrescriptionFormData => ({
  patientId: d.patientId,
  doctorId: d.doctorId,
  careTypeId: d.careTypeId ?? '',
  insuredCategoryId: d.insuredCategoryId ?? '',
  treatmentDays: d.treatmentDays,
  diagnostic: d.diagnostic ?? '',
  diagnosticCodes: d.diagnosticCodes ?? '',
  registryNumber: d.registryNumber ?? '',
  isContinuation: d.isContinuation,
  referralLetterNumber: d.referralLetterNumber ?? '',
  notes: d.notes ?? '',
  items: d.items.map((i) => ({
    key: newKey(),
    consultationMedicationId: i.consultationMedicationId,
    drugCode: i.drugCode,
    drugName: i.drugName,
    details: drugDetails([i.activeSubstance, i.pharmaceuticalForm, i.concentration, i.prescriptionMode]),
    availableLists: parseCopaymentLists(i.availableCopaymentLists),
    copaymentListType: i.copaymentListType,
    diagnosisCode: i.diagnosisCode,
    doseMorning: i.doseMorning,
    doseAfternoon: i.doseAfternoon,
    doseEvening: i.doseEvening,
    durationDays: i.durationDays,
    quantity: i.quantity,
    instructions: i.instructions,
  })),
})

export const PrescriptionFormModal = (props: PrescriptionFormModalProps) =>
  props.isOpen ? createPortal(<FormContent {...props} />, document.body) : null

const FormContent = ({ onClose, editData, onSaved }: PrescriptionFormModalProps) => {
  const isEdit = !!editData
  // În editare tipul rețetei e fix: compensată = doar medicamente compensate, simplă = doar necompensate
  const fixedCompensated = editData ? editData.isCnas : null
  const [serverError, setServerError] = useState<string | null>(null)
  const [itemError, setItemError] = useState<string | null>(null)

  const { data: lookupsResp } = usePrescriptionLookups()
  const { data: patientsResp } = usePatientLookup()
  const { data: doctorsResp } = useDoctorLookup()
  const lookups = lookupsResp?.data
  const careTypes = useMemo(() => lookups?.careTypes ?? [], [lookups])

  const createMut = useCreatePrescriptions()
  const updateMut = useUpdatePrescription()
  const isSaving = createMut.isPending || updateMut.isPending

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: EMPTY_FORM,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items', keyName: 'fieldId' })

  useEffect(() => {
    reset(editData ? fromDetail(editData) : EMPTY_FORM)
  }, [editData, reset])

  const items = useWatch({ control, name: 'items' }) ?? []
  const careTypeId = useWatch({ control, name: 'careTypeId' })
  const isContinuation = useWatch({ control, name: 'isContinuation' })
  const selectedCareType = careTypes.find((c) => c.id === careTypeId)

  const compensatedCount = items.filter((i) => !!i.copaymentListType).length
  const simpleCount = items.length - compensatedCount
  const showCnasFields = fixedCompensated ?? compensatedCount > 0

  const handleAddDrug = (drug: CnasDrugLookupDto) => {
    setItemError(null)
    const lists = parseCopaymentLists(drug.copaymentLists)
    if (fixedCompensated === true && lists.length === 0) {
      setItemError(`„${drug.name}" nu este compensat și nu poate fi adăugat pe rețeta compensată.`)
      return
    }
    append({
      key: newKey(),
      consultationMedicationId: null,
      drugCode: drug.code,
      drugName: drug.name ?? drug.code ?? '',
      details: drugDetails([drug.activeSubstanceCode, drug.pharmaceuticalForm, drug.concentration, drug.prescriptionMode]),
      availableLists: lists,
      // Implicit prima listă disponibilă (ca în consultație); pe rețeta simplă rămâne necompensat
      copaymentListType: fixedCompensated === false ? null : lists[0] ?? null,
      diagnosisCode: null,
      doseMorning: 1,
      doseAfternoon: null,
      doseEvening: null,
      durationDays: null,
      quantity: null,
      instructions: null,
    })
  }

  const handleAddFreeText = () => {
    setItemError(null)
    append({
      key: newKey(), consultationMedicationId: null, drugCode: null, drugName: '', details: null,
      availableLists: [], copaymentListType: null, diagnosisCode: null, doseMorning: null,
      doseAfternoon: null, doseEvening: null, durationDays: null, quantity: null, instructions: null,
    })
  }

  const onSubmit = (v: PrescriptionFormData) => {
    setServerError(null)
    // CNAS cere codul de diagnostic pe fiecare medicament compensat: implicit primul cod al rețetei
    const defaultCode = toNullableText(v.diagnosticCodes.split(/[,;\s]+/)[0])
    const toItem = (i: PrescriptionItemFormData): PrescriptionItemData => ({
      consultationMedicationId: i.consultationMedicationId,
      drugCode: i.drugCode,
      drugName: i.drugName.trim(),
      copaymentListType: i.copaymentListType,
      diagnosisCode: toNullableText(i.diagnosisCode) ?? (i.copaymentListType ? defaultCode : null),
      doseMorning: i.doseMorning,
      doseAfternoon: i.doseAfternoon,
      doseEvening: i.doseEvening,
      durationDays: i.durationDays,
      quantity: i.quantity,
      instructions: toNullableText(i.instructions),
    })

    const header = {
      careTypeId: v.careTypeId || null,
      insuredCategoryId: v.insuredCategoryId || null,
      treatmentDays: v.treatmentDays,
      diagnostic: toNullableText(v.diagnostic),
      diagnosticCodes: toNullableText(v.diagnosticCodes),
      registryNumber: toNullableText(v.registryNumber),
      isContinuation: v.isContinuation,
      referralLetterNumber: v.isContinuation ? toNullableText(v.referralLetterNumber) : null,
      notes: toNullableText(v.notes),
      items: v.items.map(toItem),
    }
    const onError = (err: unknown) => setServerError(err instanceof Error ? err.message : 'A apărut o eroare neașteptată.')

    if (editData) {
      updateMut.mutate({ id: editData.id, ...header }, {
        onSuccess: () => { onSaved('Rețeta a fost actualizată.'); onClose() },
        onError,
      })
    } else {
      createMut.mutate({ patientId: v.patientId, doctorId: v.doctorId, consultationId: null, ...header }, {
        onSuccess: (resp) => {
          const count = resp.data?.length ?? 0
          onSaved(count === 1
            ? 'A fost creată 1 rețetă (ciornă). Deschide-o pentru a o emite.'
            : `Au fost create ${count} rețete (ciornă): medicamentele compensate și necompensate au fost separate.`)
          onClose()
        },
        onError,
      })
    }
  }

  const title = editData
    ? `Editează ${editData.isCnas ? 'rețeta compensată' : 'rețeta simplă'} — ${formatSeriesNumber(editData.series, editData.number)}`
    : 'Rețetă nouă'

  const footer = (
    <>
      <AppButton variant="outline-secondary" onClick={onClose} disabled={isSaving}>Anulează</AppButton>
      <AppButton type="submit" variant="primary" isLoading={isSaving} loadingText="Se salvează...">
        {isEdit ? 'Salvează' : 'Creează rețetele'}
      </AppButton>
    </>
  )

  const numberField = (name: 'treatmentDays') => register(name, { setValueAs: toNullableNumber })

  return (
    <AppModal
      isOpen
      onClose={onClose}
      maxWidth={1120}
      title={title}
      as="form"
      onSubmit={(e) => {
        // Formularul e în portal, dar evenimentele React urcă totuși spre formularul consultației
        e.stopPropagation()
        void handleSubmit(onSubmit)(e)
      }}
      footer={footer}
      bodyClassName={styles.body}
    >
      {serverError && <div className="alert alert-danger py-2 mb-0">{serverError}</div>}

      <div className="row g-3">
        <div className="col-md-6">
          <FormSelect<PrescriptionFormData>
            name="patientId" control={control} label="Pacient" required disabled={isEdit}
            options={(patientsResp?.data ?? []).map((p) => ({ value: p.id, label: `${p.fullName}${p.cnp ? ` (${p.cnp})` : ''}` }))}
            allowFiltering showClearButton placeholder="Selectează pacient..."
          />
        </div>
        <div className="col-md-6">
          <FormSelect<PrescriptionFormData>
            name="doctorId" control={control} label="Medic prescriptor" required disabled={isEdit}
            options={(doctorsResp?.data ?? []).map((d) => ({
              value: d.id,
              label: `${d.fullName}${d.medicalCode ? ` · parafă ${d.medicalCode}` : ''}`,
            }))}
            allowFiltering showClearButton placeholder="Selectează medic..."
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <FormSelect<PrescriptionFormData>
            name="careTypeId" control={control} label="Tip afecțiune"
            options={careTypes.map((c) => ({ value: c.id, label: c.name }))}
            showClearButton placeholder="Acut / subacut / cronic"
          />
          {showCnasFields && <div className={styles.hint}>Obligatoriu pentru emiterea rețetei compensate.</div>}
        </div>
        <div className="col-md-2">
          <label className={styles.fieldLabel} htmlFor="rx-treatment-days">Zile tratament</label>
          <input id="rx-treatment-days" type="number" min={1} max={365} className="form-control"
            onKeyDown={preventEnter} {...numberField('treatmentDays')} />
          {selectedCareType && <div className={styles.hint}>Maxim {selectedCareType.maxDays} zile</div>}
          {errors.treatmentDays && <div className={styles.fieldError}>{errors.treatmentDays.message}</div>}
        </div>
        {showCnasFields && (
          <div className="col-md-6">
            <FormSelect<PrescriptionFormData>
              name="insuredCategoryId" control={control} label="Categoria de asigurat (rețeta compensată)"
              options={(lookups?.insuredCategories ?? []).map((c) => ({ value: c.id, label: c.name }))}
              showClearButton placeholder="Selectează categoria..."
            />
          </div>
        )}
      </div>

      <div className="row g-3">
        <div className="col-md-8">
          <label className={styles.fieldLabel} htmlFor="rx-diagnostic">Diagnostic</label>
          <input id="rx-diagnostic" className="form-control" maxLength={1000} onKeyDown={preventEnter} {...register('diagnostic')} />
        </div>
        <div className="col-md-4">
          <label className={styles.fieldLabel} htmlFor="rx-codes">Cod(uri) ICD-10</label>
          <input id="rx-codes" className="form-control" maxLength={500} placeholder="ex: I10, E11"
            onKeyDown={preventEnter} {...register('diagnosticCodes')} />
          {showCnasFields && <div className={styles.hint}>Primul cod se trece implicit pe medicamentele compensate.</div>}
        </div>
      </div>

      <div className="row g-3 align-items-end">
        {(fixedCompensated !== true) && (
          <div className="col-md-3">
            <label className={styles.fieldLabel} htmlFor="rx-registry">Nr. registru consultații</label>
            <input id="rx-registry" className="form-control" maxLength={50} onKeyDown={preventEnter} {...register('registryNumber')} />
          </div>
        )}
        {showCnasFields && (
          <>
            <div className="col-md-3">
              <div className="form-check mb-2">
                <input id="rx-continuation" type="checkbox" className="form-check-input" {...register('isContinuation')} />
                <label className="form-check-label" htmlFor="rx-continuation">Continuare tratament</label>
              </div>
            </div>
            {isContinuation && (
              <div className="col-md-3">
                <label className={styles.fieldLabel} htmlFor="rx-letter">Nr. scrisoare medicală</label>
                <input id="rx-letter" className="form-control" maxLength={50} onKeyDown={preventEnter} {...register('referralLetterNumber')} />
              </div>
            )}
          </>
        )}
        <div className="col">
          <label className={styles.fieldLabel} htmlFor="rx-notes">Observații</label>
          <input id="rx-notes" className="form-control" maxLength={1000} onKeyDown={preventEnter} {...register('notes')} />
        </div>
      </div>

      <h6 className={styles.sectionTitle}>Medicamente</h6>

      {!isEdit && items.length > 0 && (
        <div className={styles.splitInfo}>
          <span>Se vor crea automat:</span>
          {compensatedCount > 0 && <AppBadge variant="primary">rețetă compensată · {compensatedCount} med.</AppBadge>}
          {simpleCount > 0 && <AppBadge variant="neutral">rețetă simplă · {simpleCount} med.</AppBadge>}
          <span>Medicamentele din programe naționale diferite ajung pe rețete separate.</span>
        </div>
      )}

      <div className={styles.itemsToolbar}>
        <CnasDrugSearch onSelect={handleAddDrug} disabled={isSaving} />
        {fixedCompensated !== true && (
          <AppButton variant="outline-secondary" size="sm" onClick={handleAddFreeText}>
            + Medicament în text liber
          </AppButton>
        )}
      </div>
      {itemError && <div className="alert alert-warning py-2 mb-0">{itemError}</div>}
      {errors.items?.message && <div className={styles.fieldError}>{errors.items.message}</div>}
      {errors.items?.root?.message && <div className={styles.fieldError}>{errors.items.root.message}</div>}

      {fields.length === 0 ? (
        <div className={styles.empty}>Caută în nomenclatorul CNAS pentru a adăuga medicamente.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th className={styles.colDrug}>Medicament</th>
                {fixedCompensated !== false && <th className={styles.colList}>Compensare</th>}
                <th className={styles.colSmall}>Dim.</th>
                <th className={styles.colSmall}>Prânz</th>
                <th className={styles.colSmall}>Seara</th>
                <th className={styles.colSmall}>Zile</th>
                <th className={styles.colSmall} title="Implicit: doze pe zi × zile">Cant.</th>
                {showCnasFields && <th className={styles.colCode}>Cod diag.</th>}
                <th>Indicații (D.S.)</th>
                <th aria-label="Acțiuni" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, idx) => {
                const row = items[idx] ?? field
                const rowErrors = errors.items?.[idx]
                const firstError = rowErrors && Object.values(rowErrors).find((e) => e && typeof e === 'object' && 'message' in e)
                const autoQuantity = computeQuantity(row)
                const listOptions = row.copaymentListType && !row.availableLists.includes(row.copaymentListType)
                  ? [row.copaymentListType, ...row.availableLists]
                  : row.availableLists
                return (
                  <tr key={field.fieldId} className={row.copaymentListType ? styles.rowCompensated : undefined}>
                    <td>{idx + 1}</td>
                    <td>
                      {row.drugCode ? (
                        <>
                          <div className={styles.drugName}>{row.drugName}</div>
                          {row.details && <div className={styles.drugMeta}>{row.details}</div>}
                        </>
                      ) : (
                        <input className="form-control form-control-sm" placeholder="Denumire, formă, concentrație"
                          maxLength={500} onKeyDown={preventEnter} {...register(`items.${idx}.drugName`)} />
                      )}
                    </td>
                    {fixedCompensated !== false && (
                      <td>
                        {listOptions.length > 0 ? (
                          <select className="form-select form-select-sm" aria-label="Listă de compensare"
                            {...register(`items.${idx}.copaymentListType`, { setValueAs: (v: string) => v || null })}>
                            {fixedCompensated !== true && <option value="">Necompensat</option>}
                            {listOptions.map((l) => <option key={l} value={l}>Compensat · {l}</option>)}
                          </select>
                        ) : <span className={styles.drugMeta}>Necompensat</span>}
                      </td>
                    )}
                    {(['doseMorning', 'doseAfternoon', 'doseEvening'] as const).map((dose) => (
                      <td key={dose}>
                        <input type="number" className="form-control form-control-sm" min={DOSE_STEP} max={DOSE_MAX}
                          step={DOSE_STEP} onKeyDown={preventEnter} aria-label={dose}
                          {...register(`items.${idx}.${dose}`, { setValueAs: toNullableNumber })} />
                      </td>
                    ))}
                    <td>
                      <input type="number" className="form-control form-control-sm" min={1} max={365}
                        onKeyDown={preventEnter} aria-label="Zile"
                        {...register(`items.${idx}.durationDays`, { setValueAs: toNullableNumber })} />
                    </td>
                    <td>
                      <input type="number" className="form-control form-control-sm" min={0} step="any"
                        placeholder={autoQuantity != null ? formatDose(autoQuantity) : ''} onKeyDown={preventEnter}
                        aria-label="Cantitate"
                        {...register(`items.${idx}.quantity`, { setValueAs: toNullableNumber })} />
                    </td>
                    {showCnasFields && (
                      <td>
                        {row.copaymentListType ? (
                          <input className="form-control form-control-sm" maxLength={20} onKeyDown={preventEnter}
                            aria-label="Cod diagnostic" {...register(`items.${idx}.diagnosisCode`)} />
                        ) : <span className={styles.drugMeta}>—</span>}
                      </td>
                    )}
                    <td>
                      <input className="form-control form-control-sm" maxLength={1000} placeholder="ex: după masă"
                        onKeyDown={preventEnter} aria-label="Indicații" {...register(`items.${idx}.instructions`)} />
                      {firstError && <div className={styles.fieldError}>{(firstError as { message?: string }).message}</div>}
                    </td>
                    <td>
                      <button type="button" className={styles.deleteBtn} onClick={() => remove(idx)}
                        aria-label={`Elimină ${row.drugName || 'medicamentul'}`} title="Elimină">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppModal>
  )
}

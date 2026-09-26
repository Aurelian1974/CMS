import { useConsultationMedications, useCreateConsultationMedication, useDeleteConsultationMedication, useUpdateConsultationMedication } from '../../hooks/useConsultationMedications'
import { parseCopaymentLists, type CnasDrugLookupDto, type ConsultationMedicationDto } from '../../types/medication.types'
import type { MedicationRowData } from '../../schemas/medication.schema'
import { CnasDrugSearch } from '../CnasDrugSearch'
import { MedicationRow } from './MedicationRow'
import styles from './PrescribedMedicationsTable.module.scss'

interface PrescribedMedicationsTableProps {
  consultationId: string
  isEditable: boolean
}

export const PrescribedMedicationsTable = ({ consultationId, isEditable }: PrescribedMedicationsTableProps) => {
  const { data: rows = [], isLoading } = useConsultationMedications(consultationId)
  const createMut = useCreateConsultationMedication(consultationId)
  const updateMut = useUpdateConsultationMedication(consultationId)
  const deleteMut = useDeleteConsultationMedication(consultationId)

  const compensatedCount = rows.filter((r) => r.isCompensated).length
  const mutationError = createMut.error ?? updateMut.error ?? deleteMut.error

  const handleAdd = (drug: CnasDrugLookupDto) => {
    createMut.mutate({
      consultationId,
      drugCode: drug.code,
      // Implicit se alege prima listă de compensare disponibilă; medicul o poate schimba
      copaymentListType: parseCopaymentLists(drug.copaymentLists)[0] ?? null,
      doseMorning: null,
      doseAfternoon: null,
      doseEvening: null,
      durationDays: null,
      notes: null,
    })
  }

  const handleSave = (id: string, data: MedicationRowData) => {
    updateMut.mutate({ id, ...data })
  }

  const handleDelete = (row: ConsultationMedicationDto) => {
    if (confirm(`Ștergi „${row.drugName}" din tratament?`)) deleteMut.mutate(row.id)
  }

  return (
    <div>
      <div className={styles.summary}>
        <span>{rows.length} {rows.length === 1 ? 'medicament' : 'medicamente'}</span>
        {compensatedCount > 0 && (
          <span className={styles.badgeCompensated}>{compensatedCount} compensat{compensatedCount === 1 ? '' : 'e'}</span>
        )}
      </div>

      {isEditable && (
        <div className="mb-3">
          <CnasDrugSearch onSelect={handleAdd} disabled={createMut.isPending} />
        </div>
      )}

      {mutationError && (
        <div className="alert alert-danger py-2 small">{mutationError.message}</div>
      )}

      {isLoading ? (
        <p className={styles.empty}>Se încarcă…</p>
      ) : rows.length === 0 ? (
        <div className={styles.empty}>
          {isEditable ? 'Niciun medicament adăugat. Caută în nomenclatorul CNAS pentru a adăuga.' : 'Niciun medicament în tratament.'}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th rowSpan={2} className={styles.colIndex}>#</th>
                <th rowSpan={2} className={styles.colDrug}>Medicament</th>
                <th rowSpan={2} className={styles.colCompensation}>Compensare</th>
                <th colSpan={3} className={styles.groupHeader}>Posologie (cantitate / priză)</th>
                <th rowSpan={2} className={styles.colNumber}>Zile</th>
                <th rowSpan={2} className={styles.colQuantity} title="Doze pe zi × zile">Cantitate</th>
                <th rowSpan={2} className={styles.colNotes}>Observații</th>
                {isEditable && <th rowSpan={2} className={styles.colAction} aria-label="Acțiuni" />}
              </tr>
              <tr>
                <th className={styles.colDose}>Dimineață</th>
                <th className={styles.colDose}>După-amiază</th>
                <th className={styles.colDose}>Seara</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <MedicationRow
                  key={row.id}
                  index={idx}
                  row={row}
                  isEditable={isEditable}
                  onSave={handleSave}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

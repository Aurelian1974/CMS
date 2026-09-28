import type { UseFormReturn } from 'react-hook-form'
import { Pill, NotebookPen, PenLine } from 'lucide-react'
import { FormInput } from '@/components/forms/FormInput/FormInput'
import { PrimaryDiagnosisSelector } from '@/components/icd10/PrimaryDiagnosisSelector'
import { SecondaryDiagnosesList } from '@/components/icd10/SecondaryDiagnosesList'
import { ConsultationPrescriptionsPanel } from '@/features/prescriptions/components/ConsultationPrescriptionsPanel'
import { PrescribedMedicationsTable } from '../../medications/components/PrescribedMedicationsTable'
import type { ConsultationFormData } from '../../schemas/consultation.schema'
import type { DiagnosisState } from '../../utils/consultationPayload'
import styles from '../../pages/ConsultationsListPage.module.scss'

interface DiagnosticTabProps {
  form: UseFormReturn<ConsultationFormData>
  isEditable: boolean
  /** Id-ul consultației salvate; null în modul creare (medicația cere o consultație existentă) */
  consultationId: string | null
  diagnosis: DiagnosisState
  onDiagnosisChange: (patch: Partial<DiagnosisState>) => void
}

export const DiagnosticTab = ({ form, isEditable, consultationId, diagnosis, onDiagnosisChange }: DiagnosticTabProps) => (
  <div className={styles.diagnosticSection}>
    {/* ══ 2-Column: Primary + Secondary ══ */}
    <div className={styles.diagnosticColumns}>
      <div className={styles.diagnosticColumnPrimary}>
        <PrimaryDiagnosisSelector
          selectedCode={diagnosis.primaryCode}
          onCodeChange={code => onDiagnosisChange({ primaryCode: code })}
          details={diagnosis.primaryDetails}
          onDetailsChange={value => onDiagnosisChange({ primaryDetails: value })}
          showValidation={false}
          disabled={!isEditable}
        />
      </div>
      <div className={styles.diagnosticColumnSecondary}>
        <SecondaryDiagnosesList
          diagnoses={diagnosis.secondary}
          onChange={secondary => onDiagnosisChange({ secondary })}
          showValidation={false}
          disabled={!isEditable}
        />
      </div>
    </div>

    <div className={styles.formSection}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}><Pill size={18} /></span>
        Tratament recomandat
      </h3>
      {consultationId ? (
        <>
          <PrescribedMedicationsTable consultationId={consultationId} isEditable={isEditable} />
          <ConsultationPrescriptionsPanel
            consultationId={consultationId}
            isEditable={isEditable}
            onIssuedSeriesChange={(series) => {
              // SP-ul a actualizat deja consultația; formularul se aliniază ca autosave-ul să nu suprascrie
              form.setValue('saEliberatPrescriptie', !!series)
              form.setValue('seriePrescriptie', series ?? '')
            }}
          />
        </>
      ) : (
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          Salvează consultația ca draft pentru a putea adăuga medicamente.
        </p>
      )}
    </div>
    <div className={styles.formSection}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}><NotebookPen size={18} /></span>
        Recomandări
      </h3>
      <FormInput name="recomandari" control={form.control} placeholder="Regim alimentar, stil de viață, indicații suplimentare..." multiline rows={4} disabled={!isEditable} maxLength={4000} />
    </div>
    <div className={styles.formSection}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}><PenLine size={18} /></span>
        Observații
      </h3>
      <FormInput name="observatii" control={form.control} placeholder="Observații suplimentare..." multiline rows={3} disabled={!isEditable} maxLength={4000} />
    </div>
  </div>
)

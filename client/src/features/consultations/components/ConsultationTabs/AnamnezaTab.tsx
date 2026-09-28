import type { Control } from 'react-hook-form'
import { MessageSquareText, NotebookPen, Pill, FileText, Users, AlertTriangle, ShieldAlert } from 'lucide-react'
import { FormRichText } from '@/components/forms/FormRichText/FormRichText'
import type { ConsultationFormData } from '../../schemas/consultation.schema'
// Tab-urile fișei partajează layout-ul (grid-uri, secțiuni) definit la nivelul paginii
import styles from '../../pages/ConsultationsListPage.module.scss'

interface AnamnezaTabProps {
  control: Control<ConsultationFormData>
  isEditable: boolean
}

export const AnamnezaTab = ({ control, isEditable }: AnamnezaTabProps) => (
  <div className={styles.anamnezaGrid}>
    <div className={styles.anamnezaCol}>
      <div className={styles.formSectionCompact}>
        <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><MessageSquareText size={15} /></span> Motiv Prezentare</h4>
        <FormRichText name="motiv" control={control} placeholder="Descrieți motivul prezentării pacientului la consultație..." disabled={!isEditable} height={180} />
      </div>
      <div className={styles.formSectionCompact}>
        <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><NotebookPen size={15} /></span> Istoric Medical Personal</h4>
        <FormRichText name="istoricMedicalPersonal" control={control} placeholder="Boli anterioare, intervenții chirurgicale, alergii, tratamente cronice..." disabled={!isEditable} height={180} />
      </div>
      <div className={styles.formSectionCompact}>
        <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><Pill size={15} /></span> Tratament Anterior</h4>
        <FormRichText name="tratamentAnterior" control={control} placeholder="Tratamente urmate anterior (medicație, proceduri, intervenții)..." disabled={!isEditable} height={180} />
      </div>
    </div>
    <div className={styles.anamnezaCol}>
      <div className={styles.formSectionCompact}>
        <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><FileText size={15} /></span> Istoricul Bolii Prezente</h4>
        <FormRichText name="istoricBoalaActuala" control={control} placeholder="Evoluția simptomelor, când au apărut, factori agravanți/amelioranți..." disabled={!isEditable} height={180} />
      </div>
      <div className={styles.formSectionCompact}>
        <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><Users size={15} /></span> Istoric Familial</h4>
        <FormRichText name="istoricFamilial" control={control} placeholder="Boli ereditare în familie (diabet, HTA, boli cardiace, cancer, etc.)..." disabled={!isEditable} height={180} />
      </div>
      <div className={styles.formSectionCompact}>
        <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><AlertTriangle size={15} /></span> Factori de Risc</h4>
        <FormRichText name="factoriDeRisc" control={control} placeholder="Factori de risc identificați (HTA, diabet, fumat, sedentarism, obezitate, etc.)..." disabled={!isEditable} height={180} />
      </div>
      <div className={styles.formSectionCompact}>
        <h4 className={styles.sectionTitleSm}><span className={styles.sectionIcon}><ShieldAlert size={15} /></span> Alergii</h4>
        <FormRichText name="alergiiConsultatie" control={control} placeholder="Alergii cunoscute (medicamente, alimente, substanțe, etc.)..." disabled={!isEditable} height={150} />
      </div>
    </div>
  </div>
)

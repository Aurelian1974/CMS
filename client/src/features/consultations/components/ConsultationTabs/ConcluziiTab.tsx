import { useWatch, type UseFormReturn } from 'react-hook-form'
import type { LucideIcon } from 'lucide-react'
import {
  FileCheck, ClipboardCheck, CalendarClock, Ribbon, Hospital, BedDouble, Home, Accessibility,
} from 'lucide-react'
import { FormInput } from '@/components/forms/FormInput/FormInput'
import { FormDatePicker } from '@/components/forms/FormDatePicker/FormDatePicker'
import type { ConsultationFormData } from '../../schemas/consultation.schema'
import styles from '../../pages/ConsultationsListPage.module.scss'

type Tone = 'Warning' | 'Info' | 'Primary' | 'Secondary' | 'Success'

type ToggleField =
  | 'esteAfectiuneOncologica' | 'areIndicatieInternare' | 'saEliberatPrescriptie'
  | 'saEliberatConcediuMedical' | 'saEliberatIngrijiriDomiciliu' | 'saEliberatDispozitiveMedicale'

interface OptionCard {
  field: ToggleField
  label: string
  description: string
  Icon: LucideIcon
  tone: Tone
  /** Câmpul cu seria documentului, afișat când opțiunea e activă */
  series?: { field: 'seriePrescriptie' | 'serieConcediuMedical'; label: string }
}

// Anexa 43 — Ordin MS nr. 1411/2016
const OPTION_CARDS: OptionCard[] = [
  { field: 'esteAfectiuneOncologica', label: 'Afecțiune Oncologică', description: 'Pacientul prezintă afecțiune oncologică', Icon: Ribbon, tone: 'Warning' },
  { field: 'areIndicatieInternare', label: 'Indicație Internare', description: 'Recomandare pentru internare în spital', Icon: Hospital, tone: 'Info' },
  { field: 'saEliberatPrescriptie', label: 'Prescripție Medicală', description: 'S-a eliberat rețetă medicală', Icon: ClipboardCheck, tone: 'Primary',
    series: { field: 'seriePrescriptie', label: 'Serie / Număr prescripție' } },
  { field: 'saEliberatConcediuMedical', label: 'Concediu Medical', description: 'S-a eliberat certificat de concediu medical', Icon: BedDouble, tone: 'Secondary',
    series: { field: 'serieConcediuMedical', label: 'Serie / Număr concediu medical' } },
  { field: 'saEliberatIngrijiriDomiciliu', label: 'Îngrijiri la Domiciliu', description: 'Recomandare pentru îngrijiri medicale la domiciliu', Icon: Home, tone: 'Success' },
  { field: 'saEliberatDispozitiveMedicale', label: 'Dispozitive Medicale', description: 'Recomandare pentru dispozitive medicale', Icon: Accessibility, tone: 'Info' },
]

interface ConcluziiTabProps {
  form: UseFormReturn<ConsultationFormData>
  isEditable: boolean
}

export const ConcluziiTab = ({ form, isEditable }: ConcluziiTabProps) => {
  const toggles = useWatch({ control: form.control, name: OPTION_CARDS.map(c => c.field) })

  return (
    <div className={styles.concluziiSection}>
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><FileCheck size={18} /></span>
          Concluzii
        </h3>
        <FormInput name="concluzii" control={form.control} label="Rezumat consultație" placeholder="Rezumat general al consultației..." multiline rows={5} disabled={!isEditable} maxLength={4000} />
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><ClipboardCheck size={18} /></span>
          Informații Scrisoare Medicală
          <span className={styles.sectionSubtitle}>Anexa 43 - Ordin MS nr. 1411/2016</span>
        </h3>

        <div className={styles.optionCardsGrid}>
          {OPTION_CARDS.map(({ field, label, description, Icon, tone, series }, i) => {
            const checked = !!toggles[i]
            return (
              <div key={field} className={`${styles.optionCard} ${checked ? `${styles.optionCardActive} ${styles[`optionCard${tone}`]}` : ''}`}>
                <label className={styles.optionCardContent}>
                  <div className={`${styles.optionCardIconWrap} ${styles[`optionIcon${tone}`]}`}><Icon size={20} /></div>
                  <div className={styles.optionCardDetails}>
                    <span className={styles.optionCardLabel}>{label}</span>
                    <span className={styles.optionCardDesc}>{description}</span>
                  </div>
                  <div className={styles.toggleWrap}>
                    <input type="checkbox" className={styles.toggleInput} disabled={!isEditable} checked={checked} onChange={e => form.setValue(field, e.target.checked, { shouldDirty: true })} />
                    <span className={styles.toggleSlider} />
                  </div>
                </label>
                {series && checked && (
                  <div className={styles.optionExpanded}>
                    <FormInput name={series.field} control={form.control} label={series.label} placeholder={`${series.label}...`} disabled={!isEditable} maxLength={50} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}><CalendarClock size={18} /></span>
          Planificare Următoare
        </h3>
        <div className={styles.nextVisitSection}>
          <FormDatePicker name="dataUrmatoareiVizite" control={form.control} label="Data următoarei vizite" disabled={!isEditable} />
          <FormInput name="noteUrmatoareaVizita" control={form.control} label="Note pentru vizita următoare" placeholder="Investigații suplimentare, controale..." multiline rows={3} disabled={!isEditable} maxLength={2000} />
        </div>
      </div>
    </div>
  )
}

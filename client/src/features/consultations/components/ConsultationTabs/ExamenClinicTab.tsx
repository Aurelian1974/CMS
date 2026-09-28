import { useWatch, type UseFormReturn } from 'react-hook-form'
import {
  Stethoscope, ShieldCheck, Hand, Eye, Scale, Ruler, Hash, Heart, HeartPulse, Wind,
  Thermometer, Activity, Droplets, Droplet, CircleDot, PenLine, ClipboardPlus,
} from 'lucide-react'
import { FormInput } from '@/components/forms/FormInput/FormInput'
import type { ConsultationFormData } from '../../schemas/consultation.schema'
import { STARE_GENERALA_OPTIONS, TEGUMENTE_OPTIONS, MUCOASE_OPTIONS, EDEME_OPTIONS, GANGLIONI_OPTIONS } from '../../constants/clinicalVocabularies'
import styles from '../../pages/ConsultationsListPage.module.scss'

// RHF aplică setValueAs și pe valoarea inițială (null), nu doar pe textul din input
const parseOrNull = (v: unknown, parse: (s: string) => number): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : parse(String(v))
  return Number.isNaN(n) ? null : n
}
const toDecimalOrNull = (v: unknown) => parseOrNull(v, parseFloat)
const toIntOrNull = (v: unknown) => parseOrNull(v, s => parseInt(s, 10))

interface ExamenClinicTabProps {
  form: UseFormReturn<ConsultationFormData>
  isEditable: boolean
}

export const ExamenClinicTab = ({ form, isEditable }: ExamenClinicTabProps) => {
  const [greutate, inaltime] = useWatch({ control: form.control, name: ['greutate', 'inaltime'] })
  const imc = greutate && inaltime && inaltime > 0
    ? (greutate / Math.pow(inaltime / 100, 2)).toFixed(1)
    : null

  return (
    <div className={styles.examenSection}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}><Stethoscope size={18} /></span>
        Examen Clinic General
      </h3>
      <div className={styles.examGrid}>
        {/* Stare Generală */}
        <div className={styles.examCard}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><ShieldCheck size={14} /></span>
            <span className={styles.examCardLabel}>Stare Generală</span>
          </div>
          <select disabled={!isEditable} className={styles.examSelectInput} {...form.register('stareGenerala')}>
            <option value="">Selectează...</option>
            {STARE_GENERALA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {/* Tegumente */}
        <div className={styles.examCard}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><Hand size={14} /></span>
            <span className={styles.examCardLabel}>Tegumente</span>
          </div>
          <select disabled={!isEditable} className={styles.examSelectInput} {...form.register('tegumente')}>
            <option value="">Selectează...</option>
            {TEGUMENTE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {/* Mucoase */}
        <div className={styles.examCard}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><Eye size={14} /></span>
            <span className={styles.examCardLabel}>Mucoase</span>
          </div>
          <select disabled={!isEditable} className={styles.examSelectInput} {...form.register('mucoase')}>
            <option value="">Selectează...</option>
            {MUCOASE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {/* Greutate */}
        <div className={styles.examCard}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><Scale size={14} /></span>
            <span className={styles.examCardLabel}>Greutate</span>
          </div>
          <div className={styles.examCardInput}>
            <input type="number" step="0.1" disabled={!isEditable} className={styles.examNumInput} placeholder="70.5" {...form.register('greutate', { setValueAs: toDecimalOrNull })} />
            <span className={styles.examUnit}>kg</span>
          </div>
        </div>
        {/* Înălțime */}
        <div className={styles.examCard}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><Ruler size={14} /></span>
            <span className={styles.examCardLabel}>Înălțime</span>
          </div>
          <div className={styles.examCardInput}>
            <input type="number" step="1" disabled={!isEditable} className={styles.examNumInput} placeholder="175" {...form.register('inaltime', { setValueAs: toIntOrNull })} />
            <span className={styles.examUnit}>cm</span>
          </div>
        </div>
        {/* IMC (computed) */}
        <div className={`${styles.examCard} ${imc ? styles.examCardHasValue : ''}`}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><Hash size={14} /></span>
            <span className={styles.examCardLabel}>IMC</span>
          </div>
          {imc ? (
            <div className={styles.imcResult}>
              <span className={styles.imcValue}>{imc}</span>
              <span className={styles.examUnit}>kg/m²</span>
            </div>
          ) : (
            <span className={styles.examPlaceholder}>Completați G + Î</span>
          )}
        </div>
        {/* TA */}
        <div className={styles.examCard}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><Heart size={14} /></span>
            <span className={styles.examCardLabel}>Tensiune Arterială</span>
          </div>
          <div className={styles.examCardInput}>
            <input type="number" step="1" disabled={!isEditable} className={styles.examNumInput} placeholder="120" {...form.register('tensiuneSistolica', { setValueAs: toIntOrNull })} />
            <span className={styles.examUnit}>/</span>
            <input type="number" step="1" disabled={!isEditable} className={styles.examNumInput} placeholder="80" {...form.register('tensiuneDiastolica', { setValueAs: toIntOrNull })} />
            <span className={styles.examUnit}>mmHg</span>
          </div>
        </div>
        {/* FC */}
        <div className={styles.examCard}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><HeartPulse size={14} /></span>
            <span className={styles.examCardLabel}>Frecvență Cardiacă</span>
          </div>
          <div className={styles.examCardInput}>
            <input type="number" step="1" disabled={!isEditable} className={styles.examNumInput} placeholder="75" {...form.register('puls', { setValueAs: toIntOrNull })} />
            <span className={styles.examUnit}>bpm</span>
          </div>
        </div>
        {/* FR */}
        <div className={styles.examCard}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><Wind size={14} /></span>
            <span className={styles.examCardLabel}>Frecvență Respiratorie</span>
          </div>
          <div className={styles.examCardInput}>
            <input type="number" step="1" disabled={!isEditable} className={styles.examNumInput} placeholder="16" {...form.register('frecventaRespiratorie', { setValueAs: toIntOrNull })} />
            <span className={styles.examUnit}>resp/min</span>
          </div>
        </div>
        {/* Temperatură */}
        <div className={styles.examCard}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><Thermometer size={14} /></span>
            <span className={styles.examCardLabel}>Temperatură</span>
          </div>
          <div className={styles.examCardInput}>
            <input type="number" step="0.1" disabled={!isEditable} className={styles.examNumInput} placeholder="36.5" {...form.register('temperatura', { setValueAs: toDecimalOrNull })} />
            <span className={styles.examUnit}>°C</span>
          </div>
        </div>
        {/* SpO₂ */}
        <div className={styles.examCard}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><Activity size={14} /></span>
            <span className={styles.examCardLabel}>SpO₂</span>
          </div>
          <div className={styles.examCardInput}>
            <input type="number" step="1" disabled={!isEditable} className={styles.examNumInput} placeholder="98" {...form.register('spO2', { setValueAs: toIntOrNull })} />
            <span className={styles.examUnit}>%</span>
          </div>
        </div>
        {/* Edeme */}
        <div className={styles.examCard}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><Droplets size={14} /></span>
            <span className={styles.examCardLabel}>Edeme</span>
          </div>
          <select disabled={!isEditable} className={styles.examSelectInput} {...form.register('edeme')}>
            <option value="">Selectează...</option>
            {EDEME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {/* Glicemie */}
        <div className={styles.examCard}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><Droplet size={14} /></span>
            <span className={styles.examCardLabel}>Glicemie</span>
          </div>
          <div className={styles.examCardInput}>
            <input type="number" step="0.1" disabled={!isEditable} className={styles.examNumInput} placeholder="95" {...form.register('glicemie', { setValueAs: toDecimalOrNull })} />
            <span className={styles.examUnit}>mg/dL</span>
          </div>
        </div>
        {/* Ganglioni */}
        <div className={styles.examCard}>
          <div className={styles.examCardHeader}>
            <span className={styles.examIcon}><CircleDot size={14} /></span>
            <span className={styles.examCardLabel}>Ganglioni Limfatici</span>
          </div>
          <select disabled={!isEditable} className={styles.examSelectInput} {...form.register('ganglioniLimfatici')}>
            <option value="">Selectează...</option>
            {GANGLIONI_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}><PenLine size={18} /></span>
        Examen Obiectiv Detaliat
      </h3>
      <FormInput name="examenClinic" control={form.control} label="Examen clinic general" placeholder="Aspect general, examen pe aparate și sisteme..." multiline rows={5} disabled={!isEditable} maxLength={4000} />

      <h3 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}><ClipboardPlus size={18} /></span>
        Alte Observații Clinice
      </h3>
      <FormInput name="alteObservatiiClinice" control={form.control} label="Alte observații clinice" placeholder="Alte observații relevante din examenul clinic..." multiline rows={3} disabled={!isEditable} maxLength={2000} />
    </div>
  )
}

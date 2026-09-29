import type { ReactNode } from 'react'
import {
  MessageSquareText, Stethoscope, Microscope, FlaskConical, ClipboardList, CheckCircle2, Receipt,
} from 'lucide-react'
import type { ConsultationDetailDto } from '../../types/consultation.types'
import styles from '../../pages/ConsultationsListPage.module.scss'

export type ConsultationTab = 'anamneza' | 'examen' | 'investigatii' | 'analize' | 'diagnostic' | 'concluzii' | 'servicii'

const TABS: { key: ConsultationTab; label: string; icon: ReactNode }[] = [
  { key: 'anamneza',     label: 'Anamneză',               icon: <MessageSquareText size={16} /> },
  { key: 'examen',       label: 'Examen Clinic',          icon: <Stethoscope size={16} /> },
  { key: 'investigatii', label: 'Investigații',           icon: <Microscope size={16} /> },
  { key: 'analize',      label: 'Analize Medicale',       icon: <FlaskConical size={16} /> },
  { key: 'diagnostic',   label: 'Diagnostic & Tratament', icon: <ClipboardList size={16} /> },
  { key: 'concluzii',    label: 'Concluzii',              icon: <CheckCircle2 size={16} /> },
  { key: 'servicii',     label: 'Servicii',               icon: <Receipt size={16} /> },
]

const IconCheck = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>

const tabHasContent = (tab: ConsultationTab, d: ConsultationDetailDto): boolean => {
  switch (tab) {
    case 'anamneza':     return !!d.motiv || !!d.istoricMedicalPersonal || !!d.istoricBoalaActuala
    case 'examen':       return !!d.examenClinic || !!d.stareGenerala || !!d.puls
    case 'investigatii': return !!d.investigatii
    case 'analize':      return !!d.analizeMedicale
    case 'diagnostic':   return !!d.diagnostic || !!d.diagnosticCodes || !!d.recomandari
    case 'concluzii':    return !!d.concluzii || d.esteAfectiuneOncologica || d.saEliberatPrescriptie
    default:             return false
  }
}

interface ConsultationTabBarProps {
  activeTab: ConsultationTab
  /** Consultația salvată — bifa „completat" nu se afișează în modul creare */
  detail: ConsultationDetailDto | null
  onChange: (tab: ConsultationTab) => void
}

export const ConsultationTabBar = ({ activeTab, detail, onChange }: ConsultationTabBarProps) => (
  <div className={styles.tabBar} role="tablist" aria-label="Secțiuni consultație">
    {TABS.map((tab, i) => {
      const completed = !!detail && tabHasContent(tab.key, detail)
      return (
        <button
          key={tab.key}
          type="button"
          role="tab"
          id={`consultation-tab-${tab.key}`}
          aria-selected={activeTab === tab.key}
          aria-controls="consultation-tabpanel"
          className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''} ${completed ? styles.tabCompleted : ''}`}
          onClick={() => onChange(tab.key)}
        >
          <span className={styles.tabIcon}>{tab.icon}</span>
          <span>{tab.label}</span>
          <span className={styles.tabNumber}>{i + 1}</span>
          {completed && <span className={styles.tabCheck}><IconCheck /></span>}
        </button>
      )
    })}
  </div>
)

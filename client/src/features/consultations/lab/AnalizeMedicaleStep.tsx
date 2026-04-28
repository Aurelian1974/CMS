import { useState } from 'react'
import { FlaskConical, ListChecks } from 'lucide-react'
import { LabBulletinsSection } from './components/LabBulletinsSection'
import { RecommendedAnalysesSection } from './components/RecommendedAnalysesSection'
import styles from './AnalizeMedicaleStep.module.scss'

interface Props {
  consultationId: string
  patientId: string
  doctorId: string
  isEditable: boolean
}

type SubTab = 'efectuate' | 'recomandate'

const SUB_TABS: { key: SubTab; label: string; icon: React.ReactNode }[] = [
  { key: 'efectuate',   label: 'Analize efectuate',  icon: <FlaskConical size={14} /> },
  { key: 'recomandate', label: 'Analize recomandate', icon: <ListChecks size={14} /> },
]

export const AnalizeMedicaleStep = ({ consultationId, patientId, doctorId, isEditable }: Props) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('efectuate')

  return (
    <div className={styles.tab}>
      <div className={styles.subTabs}>
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={activeSubTab === t.key ? styles.active : undefined}
            onClick={() => setActiveSubTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'efectuate' && (
        <LabBulletinsSection
          consultationId={consultationId}
          patientId={patientId}
          doctorId={doctorId}
          isEditable={isEditable}
        />
      )}

      {activeSubTab === 'recomandate' && (
        <RecommendedAnalysesSection
          consultationId={consultationId}
          patientId={patientId}
          isEditable={isEditable}
        />
      )}
    </div>
  )
}

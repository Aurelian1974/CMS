import { useMemo, useState } from 'react'
import { Image as ImageIcon, Activity, Syringe, Plus } from 'lucide-react'
import { AppButton } from '@/components/ui/AppButton'
import {
  useInvestigationsByConsultation,
  useDeleteInvestigation,
} from './hooks/useInvestigations'
import { InvestigationCard } from './components/InvestigationCard'
import { AddInvestigationModal } from './components/AddInvestigationModal'
import { InvestigationFormModal } from './components/InvestigationFormModal'
import type {
  InvestigationDto,
  InvestigationTypeDto,
} from './types/investigation.types'
import styles from './InvestigationsStep.module.scss'

interface Props {
  consultationId: string
  patientId: string
  doctorId: string
  isEditable: boolean
}

type SubTab = 'Imaging' | 'Functional' | 'Procedures'

const SUB_TABS: { key: SubTab; label: string; icon: React.ReactNode }[] = [
  { key: 'Imaging',     label: 'Imagistică',  icon: <ImageIcon size={14} /> },
  { key: 'Functional',  label: 'Funcțional',  icon: <Activity size={14} /> },
  { key: 'Procedures',  label: 'Proceduri',   icon: <Syringe size={14} /> },
]

export const InvestigationsStep = ({ consultationId, patientId, doctorId, isEditable }: Props) => {
  const { data: investigations = [], isLoading } = useInvestigationsByConsultation(consultationId)
  const deleteMut = useDeleteInvestigation(consultationId)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('Imaging')
  const [showAdd, setShowAdd] = useState(false)
  const [pickedType, setPickedType] = useState<InvestigationTypeDto | null>(null)
  const [editing, setEditing] = useState<InvestigationDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InvestigationDto | null>(null)

  const filtered = useMemo(
    () => investigations.filter((i) => i.parentTab === activeSubTab),
    [investigations, activeSubTab],
  )

  const handlePickType = (type: InvestigationTypeDto) => {
    setShowAdd(false)
    setPickedType(type)
  }

  const closeFormModal = () => {
    setPickedType(null)
    setEditing(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteMut.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className={styles.tab}>
      {/* Sub-tabs Imaging / Functional / Procedures */}
      <div className={styles.subTabs}>
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={activeSubTab === t.key ? styles.active : undefined}
            onClick={() => setActiveSubTab(t.key)}
          >
            {t.icon} {t.label}
            {investigations.filter(i => i.parentTab === t.key).length > 0 && (
              <span style={{ background: '#e0f2fe', color: '#075985', borderRadius: 999, padding: '0 6px', fontSize: '0.7rem', marginLeft: 4 }}>
                {investigations.filter(i => i.parentTab === t.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.header}>
        <h4>{SUB_TABS.find(t => t.key === activeSubTab)?.label}</h4>
        {isEditable && (
          <AppButton size="sm" variant="primary" leftIcon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
            Adaugă
          </AppButton>
        )}
      </div>

      {isLoading && <p>Se încarcă investigațiile...</p>}

      {!isLoading && filtered.length === 0 && (
        <div className={styles.empty}>
          Nicio investigație înregistrată în {SUB_TABS.find(t => t.key === activeSubTab)?.label.toLowerCase()}.
        </div>
      )}

      {filtered.length > 0 && (
        <div className={styles.grid}>
          {filtered.map((inv) => (
            <InvestigationCard
              key={inv.id}
              investigation={inv}
              onEdit={setEditing}
              onDelete={setDeleteTarget}
              disabled={!isEditable}
            />
          ))}
        </div>
      )}

      <AddInvestigationModal
        isOpen={showAdd}
        parentTab={activeSubTab}
        onClose={() => setShowAdd(false)}
        onPick={handlePickType}
      />

      <InvestigationFormModal
        isOpen={!!pickedType || !!editing}
        onClose={closeFormModal}
        consultationId={consultationId}
        patientId={patientId}
        doctorId={doctorId}
        pickedType={pickedType}
        existing={editing}
        disabled={!isEditable}
      />

      {/* Confirmare ștergere */}
      {deleteTarget && (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmare ștergere</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setDeleteTarget(null)} />
              </div>
              <div className="modal-body">
                Sigur ștergeți investigația <strong>{deleteTarget.investigationTypeDisplayName}</strong>?
              </div>
              <div className="modal-footer">
                <AppButton variant="secondary" onClick={() => setDeleteTarget(null)}>Anulează</AppButton>
                <AppButton variant="danger" onClick={confirmDelete} isLoading={deleteMut.isPending}>Șterge</AppButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

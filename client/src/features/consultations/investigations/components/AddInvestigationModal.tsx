import { useMemo, useState } from 'react'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { useInvestigationTypes } from '@/features/consultations/investigations/hooks/useInvestigations'
import type { InvestigationTypeDto } from '@/features/consultations/investigations/types/investigation.types'

interface Props {
  isOpen: boolean
  parentTab: 'Imaging' | 'Functional' | 'Procedures'
  onClose: () => void
  onPick: (type: InvestigationTypeDto) => void
}

const TAB_LABELS: Record<Props['parentTab'], string> = {
  Imaging: 'Imagistică',
  Functional: 'Funcțional',
  Procedures: 'Proceduri',
}

export const AddInvestigationModal = ({ isOpen, parentTab, onClose, onPick }: Props) => {
  const { data: allTypes = [], isLoading } = useInvestigationTypes()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return allTypes
      .filter((t) => t.parentTab === parentTab && t.isActive)
      .filter((t) =>
        s === '' ||
        t.displayName.toLowerCase().includes(s) ||
        (t.displayNameEn?.toLowerCase().includes(s) ?? false) ||
        t.typeCode.toLowerCase().includes(s),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName))
  }, [allTypes, parentTab, search])

  const grouped = useMemo(() => {
    const m = new Map<string, InvestigationTypeDto[]>()
    for (const t of filtered) {
      const arr = m.get(t.category) ?? []
      arr.push(t)
      m.set(t.category, arr)
    }
    return Array.from(m.entries())
  }, [filtered])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adaugă investigație — ${TAB_LABELS[parentTab]}`}
      maxWidth={680}
      footer={<AppButton variant="secondary" onClick={onClose}>Anulează</AppButton>}
    >
      <div style={{ marginBottom: '0.75rem' }}>
        <input
          type="search"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Caută după nume sau cod..."
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
      </div>

      {isLoading && <p>Se încarcă tipurile...</p>}
      {!isLoading && grouped.length === 0 && (
        <p style={{ color: '#64748b' }}>Niciun tip de investigație disponibil pentru acest tab.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {grouped.map(([category, types]) => (
          <div key={category}>
            <h5 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', margin: '0 0 0.5rem 0' }}>{category}</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem' }}>
              {types.map((t) => (
                <button
                  key={t.typeCode}
                  type="button"
                  onClick={() => onPick(t)}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{t.displayName}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {t.uiPattern} {t.hasStructuredFields ? '· structurat' : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppModal>
  )
}

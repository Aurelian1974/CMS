import { AppButton } from '@/components/ui/AppButton'
import styles from '../../pages/ConsultationsListPage.module.scss'

const IconLetter = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const IconPrint  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
const IconTrash  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
const IconSave   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const IconCheck  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>

const formatSavedAt = (d: Date) => d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })

type Mode = 'create' | 'edit' | 'readonly' | 'none'

interface ConsultationActionBarProps {
  mode: Mode
  isSaving: boolean
  isDirty: boolean
  lastSavedAt: Date | null
  onCancelCreate: () => void
  onSaveDraft: () => void
  onDelete: () => void
  onLetter: () => void
  onFinalize: () => void
}

export const ConsultationActionBar = ({
  mode, isSaving, isDirty, lastSavedAt, onCancelCreate, onSaveDraft, onDelete, onLetter, onFinalize,
}: ConsultationActionBarProps) => (
  <div className={styles.actionBar}>
    {mode === 'create' && (
      <>
        <div className={styles.footerInfo} />
        <div className={styles.footerActions}>
          <AppButton variant="outline-secondary" size="sm" onClick={onCancelCreate}>Anulează</AppButton>
          <AppButton variant="primary" size="sm" onClick={onSaveDraft} isLoading={isSaving} loadingText="Se salvează..." leftIcon={<IconSave />}>
            Salvează Ciornă
          </AppButton>
        </div>
      </>
    )}

    {mode === 'edit' && (
      <>
        <div className={styles.footerInfo}>
          <AppButton variant="ghost" size="sm" onClick={onDelete} leftIcon={<IconTrash />}>Șterge</AppButton>
          <span className={styles.saveStatus} aria-live="polite">
            {isDirty ? 'Modificări nesalvate' : lastSavedAt ? `Salvat la ${formatSavedAt(lastSavedAt)}` : ''}
          </span>
        </div>
        <div className={styles.footerActions}>
          <AppButton variant="outline-primary" size="sm" onClick={onSaveDraft} isLoading={isSaving} loadingText="Se salvează..." leftIcon={<IconSave />}>
            Salvează Ciornă
          </AppButton>
          <AppButton variant="outline-secondary" size="sm" onClick={onLetter} leftIcon={<IconLetter />}>
            Scrisoare Medicală
          </AppButton>
          <AppButton variant="primary" size="sm" onClick={onFinalize} leftIcon={<IconCheck />}>
            Finalizează Consultație
          </AppButton>
        </div>
      </>
    )}

    {mode === 'readonly' && (
      <>
        <div className={styles.footerInfo} />
        <div className={styles.footerActions}>
          <AppButton variant="outline-secondary" size="sm" onClick={onLetter} leftIcon={<IconLetter />}>
            Scrisoare Medicală
          </AppButton>
          <AppButton variant="outline-primary" size="sm" leftIcon={<IconPrint />}>
            Tipărește
          </AppButton>
        </div>
      </>
    )}
  </div>
)

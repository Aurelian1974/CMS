import { useState } from 'react'
import { documentsApi } from '@/api/endpoints/investigations.api'
import type { DocumentDto } from '@/features/consultations/investigations/types/investigation.types'
import styles from './DocumentUpload.module.scss'

interface Props {
  attachedDocumentId?: string | null
  attachedDocumentName?: string | null
  onUploaded: (doc: DocumentDto | null) => void
  disabled?: boolean
}

export const DocumentUpload = ({
  attachedDocumentId,
  attachedDocumentName,
  onUploaded,
  disabled,
}: Props) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Fișierul depășește 10 MB.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const dto = await documentsApi.upload(file)
      onUploaded(dto)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la upload.')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div className={styles.upload}>
      <input
        type="file"
        onChange={handleChange}
        disabled={disabled || busy}
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
      />
      {attachedDocumentId && (
        <span className={styles.meta}>
          📎 <a href={documentsApi.downloadUrl(attachedDocumentId)} target="_blank" rel="noreferrer">
            {attachedDocumentName || 'Document atașat'}
          </a>
          <button
            type="button"
            onClick={() => onUploaded(null)}
            style={{ marginLeft: 8, background: 'transparent', border: 0, color: '#b91c1c', cursor: 'pointer' }}
            disabled={disabled}
          >×</button>
        </span>
      )}
      {busy && <span className={styles.meta}>Încărcare...</span>}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}

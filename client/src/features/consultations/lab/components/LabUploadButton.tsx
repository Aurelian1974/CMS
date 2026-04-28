import { useRef } from 'react'
import { Upload, FileText } from 'lucide-react'
import { AppButton } from '@/components/ui/AppButton'

interface Props {
  onPick: (file: File) => void
  isLoading: boolean
  disabled?: boolean
}

export const LabUploadButton = ({ onPick, isLoading, disabled }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => inputRef.current?.click()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onPick(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <AppButton
        size="sm"
        variant="primary"
        leftIcon={<Upload size={14} />}
        onClick={handleClick}
        isLoading={isLoading}
        loadingText="Se parsează..."
        disabled={disabled}
      >
        Încarcă buletin PDF
      </AppButton>
      <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <FileText size={12} /> Doar PDF digital (text nativ). PDF-urile scanate necesită introducere manuală.
      </span>
    </>
  )
}

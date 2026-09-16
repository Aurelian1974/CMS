import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'

interface IdleWarningModalProps {
  /** Secunde rămase până la deconectare; null înseamnă că nu avertizăm. */
  secondsLeft: number | null
  /** Prelungește sesiunea. */
  onStay: () => void
}

/**
 * Avertisment înainte de deconectarea pentru inactivitate.
 *
 * Nu se poate închide din X sau din fundal: o închidere accidentală ar părea că
 * prelungește sesiunea, iar utilizatorul s-ar trezi deconectat câteva secunde mai
 * târziu fără explicație. Singura ieșire e butonul explicit.
 */
export const IdleWarningModal = ({ secondsLeft, onStay }: IdleWarningModalProps) => {
  if (secondsLeft === null) return null

  return (
    <AppModal
      isOpen
      onClose={() => {}}
      maxWidth={420}
      // `header`, nu `title`: varianta cu titlu randează automat un buton × care
      // aici nu ar face nimic. Un control vizibil care nu răspunde e mai rău decât
      // lipsa lui — pare că prelungește sesiunea.
      header={<h5 className="mb-0">Sesiunea urmează să expire</h5>}
      footer={
        <AppButton variant="primary" onClick={onStay}>
          Rămân conectat
        </AppButton>
      }
    >
      <p className="mb-0">
        Din lipsă de activitate, veți fi deconectat în{' '}
        <strong>{secondsLeft}</strong>{' '}
        {secondsLeft === 1 ? 'secundă' : 'secunde'}.
      </p>
      <p className="text-muted small mb-0 mt-2">
        Apăsați butonul pentru a continua lucrul.
      </p>
    </AppModal>
  )
}

import { useCallback, useEffect, useRef } from 'react'

/**
 * Salvare automată cu debounce: fiecare `schedule()` reia numărătoarea, iar
 * `save` rulează după `delayMs` de inactivitate. Se oprește când `enabled` devine false.
 */
export const useConsultationAutosave = (save: () => void, enabled: boolean, delayMs = 30_000) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveRef = useRef(save)
  saveRef.current = save
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const schedule = useCallback(() => {
    cancel()
    if (!enabledRef.current) return
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      if (enabledRef.current) saveRef.current()
    }, delayMs)
  }, [cancel, delayMs])

  useEffect(() => {
    if (!enabled) cancel()
  }, [enabled, cancel])

  useEffect(() => cancel, [cancel])

  return { schedule, cancel }
}

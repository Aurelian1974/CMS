import { useState, useCallback } from 'react'

const TIMEOUT_MS = 3000

/**
 * Hook reutilizabil pentru mesaje feedback (succes/eroare) în paginile cu operații CRUD.
 * Înlocuiește pattern-ul manual: successMsg/errorMsg state + showSuccess/showError functions.
 */
export const useFeedback = () => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const showSuccess = useCallback((msg: string) => {
    setErrorMsg(null)
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), TIMEOUT_MS)
  }, [])

  const showError = useCallback((err: unknown) => {
    setSuccessMsg(null)
    setErrorMsg(err instanceof Error ? err.message : 'A apărut o eroare neașteptată.')
  }, [])

  const clearMessages = useCallback(() => {
    setSuccessMsg(null)
    setErrorMsg(null)
  }, [])

  return { successMsg, errorMsg, showSuccess, showError, clearMessages, setSuccessMsg, setErrorMsg }
}

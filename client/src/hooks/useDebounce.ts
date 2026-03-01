import { useState, useEffect } from 'react'

/**
 * Returnează valoarea debounced — actualizată doar după `delay` ms de inactivitate.
 * Util pentru search-as-you-type, evitând requesturi excesive.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

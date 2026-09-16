import { useEffect } from 'react'
import { authApi } from '@/api/endpoints/auth.api'
import { useAuthStore } from '@/store/authStore'
import type { LoginResponse } from '../types/auth.types'

/**
 * Apel de refresh partajat la nivel de modul.
 *
 * Rotația refresh token-ului e atomică pe server: din două cereri concurente cu
 * același token, una reușește și cealaltă primește 401 (vezi RefreshToken_Rotate).
 * Fără deduplicare, React StrictMode — care invocă efectele de două ori în
 * development — declanșa exact această cursă și deconecta utilizatorul la fiecare
 * reîncărcare de pagină.
 */
let inFlight: Promise<LoginResponse> | null = null

const refreshOnce = (): Promise<LoginResponse> => {
  inFlight ??= authApi.refresh().finally(() => {
    inFlight = null
  })
  return inFlight
}

/**
 * Reconstruiește sesiunea la încărcarea paginii.
 *
 * Access token-ul trăiește doar în memorie, deci după un reload nu mai există.
 * Dacă starea persistată spune că utilizatorul era autentificat, cerem un token
 * nou pe baza cookie-ului HttpOnly de refresh. Dacă acesta lipsește sau e expirat,
 * curățăm sesiunea și utilizatorul ajunge la /login — comportamentul corect.
 */
export const useSessionBootstrap = () => {
  useEffect(() => {
    const { isAuthenticated, accessToken, setAuth, clearAuth, finishBootstrap } =
      useAuthStore.getState()

    // Nimic de restaurat, sau token-ul e deja în memorie (navigare internă).
    if (!isAuthenticated || accessToken) {
      finishBootstrap()
      return
    }

    let cancelled = false

    const apply = (data: LoginResponse) => {
      if (!cancelled) setAuth(data.user, data.accessToken, data.permissions ?? [], data.idleTimeoutMinutes)
    }

    refreshOnce()
      .then(apply)
      .catch(() =>
        // Un eșec poate însemna și o cursă pierdută cu alt tab care tocmai a rotit
        // token-ul: cookie-ul din browser e deja cel nou, deci o a doua încercare
        // reușește. Dacă token-ul chiar e invalid, al doilea apel eșuează la fel.
        refreshOnce()
          .then(apply)
          .catch(() => {
            if (!cancelled) clearAuth()
          }),
      )
      .finally(() => {
        if (!cancelled) finishBootstrap()
      })

    return () => {
      cancelled = true
    }
  }, [])
}

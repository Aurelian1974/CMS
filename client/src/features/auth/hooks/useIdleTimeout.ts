import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/endpoints/auth.api'
import { useAuthStore } from '@/store/authStore'

/**
 * Cu cât timp înainte de expirare apare avertismentul.
 *
 * Pentru ferestre scurte se reduce la jumătate: cu o fereastră de un minut, un prag
 * fix de 60 de secunde ar face avertismentul să apară imediat după autentificare,
 * ceea ce l-ar transforma în zgomot.
 */
const warningSecondsFor = (windowSeconds: number) =>
  Math.max(5, Math.min(60, Math.floor(windowSeconds / 2)))

/** Cât de des verificăm dacă fereastra s-a scurs. */
const TICK_MS = 1_000

/**
 * Canal de sincronizare între tab-uri. Fără el, un tab activ ar ține sesiunea vie
 * pe server în timp ce altul, lăsat deschis, ar afișa avertismentul și ar deconecta.
 */
const CHANNEL_NAME = 'valyan-activity'

/**
 * Ce înseamnă activitate: **schimbarea ecranului**.
 *
 * Navigarea între rute e detectată automat. Schimbările de ecran care nu produc
 * navigare — deschiderea unui modal, comutarea unui tab, trecerea la altă pagină
 * de grilă — trebuie marcate explicit prin `reportActivity()`.
 *
 * NU sunt activitate, deliberat: mișcarea mouse-ului, scroll-ul, click-urile
 * oarecare în pagină și reîmprospătările automate din fundal. O stație
 * nesupravegheată al cărei mouse e atins accidental trebuie să se blocheze.
 */
let channel: BroadcastChannel | null = null

const getChannel = () => {
  if (channel) return channel
  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
  } catch {
    // Browser fără BroadcastChannel: sincronizarea între tab-uri lipsește,
    // dar fiecare tab își aplică oricum propria fereastră.
    channel = null
  }
  return channel
}

/** Marchează o schimbare de ecran care nu produce navigare. */
export const reportActivity = () => {
  window.dispatchEvent(new Event('valyan:activity'))
  getChannel()?.postMessage('activity')
}

interface IdleState {
  /** Secunde rămase până la deconectare; null cât timp nu e cazul să avertizăm. */
  secondsLeft: number | null
  /**
   * Secunde rămase până la invalidarea sesiunii, actualizat continuu (nu doar în
   * fereastra de avertizare) — folosit pentru contorul permanent din sidebar.
   * `null` când fereastra de inactivitate nu se aplică (`idleTimeoutMinutes <= 0`).
   */
  sessionSecondsLeft: number | null
  /** Prelungește sesiunea la cererea utilizatorului. */
  staySignedIn: () => void
}

/**
 * Deconectează utilizatorul după fereastra de inactivitate a rolului său.
 *
 * Fereastra vine de la server (`idleTimeoutMinutes`), care impune același prag cu o
 * marjă, ca plasă de siguranță pentru un apelant direct de API. Aici se aplică
 * semantica exactă, pe care serverul nu o poate distinge: el vede doar cereri, nu
 * știe care e o navigare a utilizatorului și care o reîmprospătare automată.
 */
export const useIdleTimeout = (): IdleState => {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const idleMinutes = useAuthStore((s) => s.idleTimeoutMinutes)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  // 0 la initializare, nu Date.now(): apelul ar fi impur in corpul componentei.
  // Se aseaza la montare, in efectul de mai jos.
  const lastActivity = useRef<number>(0)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState<number | null>(null)

  const markActive = () => {
    lastActivity.current = Date.now()
    setSecondsLeft(null)
    setSessionSecondsLeft(idleMinutes > 0 ? idleMinutes * 60 : null)
  }

  // Navigarea e cel mai clar semnal de schimbare a ecranului. Efectul ruleaza si
  // la montare, deci aseaza si valoarea initiala a cronometrului.
  useEffect(() => {
    if (!isAuthenticated) return
    markActive()
    getChannel()?.postMessage('activity')
  }, [location.pathname, isAuthenticated])

  // Schimbările de ecran fără navigare, marcate explicit, și cele din alte tab-uri.
  useEffect(() => {
    if (!isAuthenticated) return

    const onLocal = () => markActive()
    window.addEventListener('valyan:activity', onLocal)

    const ch = getChannel()
    const onRemote = () => markActive()
    ch?.addEventListener('message', onRemote)

    return () => {
      window.removeEventListener('valyan:activity', onLocal)
      ch?.removeEventListener('message', onRemote)
    }
  }, [isAuthenticated])

  // Cronometrul propriu-zis.
  useEffect(() => {
    if (!isAuthenticated || idleMinutes <= 0) {
      setSecondsLeft(null)
      setSessionSecondsLeft(null)
      return
    }

    const limitMs = idleMinutes * 60_000
    const warningSec = warningSecondsFor(idleMinutes * 60)

    const tick = async () => {
      const idleMs = Date.now() - lastActivity.current
      const remainingSec = Math.ceil((limitMs - idleMs) / 1000)

      if (remainingSec <= 0) {
        // Încercăm un logout curat, dar sesiunea locală se curăță oricum.
        // Motivul ajunge în jurnal: altfel o deconectare pentru inactivitate ar
        // fi indistinctă de una deliberată.
        try {
          await authApi.logout('idle')
        } catch {
          // Serverul poate fi deja de partea cealaltă a ferestrei; nu contează.
        }
        setSessionSecondsLeft(0)
        clearAuth()
        navigate('/login', { replace: true })
        return
      }

      setSessionSecondsLeft(remainingSec)
      setSecondsLeft(remainingSec <= warningSec ? remainingSec : null)
    }

    const id = window.setInterval(tick, TICK_MS)
    return () => window.clearInterval(id)
  }, [isAuthenticated, idleMinutes, clearAuth, navigate])

  return { secondsLeft, sessionSecondsLeft, staySignedIn: markActive }
}

/**
 * Semnalul de activitate pentru deconectarea din inactivitate — un singur loc,
 * instalat o dată de `useIdleTimeout`, valabil automat pe toate paginile.
 *
 * Contează ca activitate doar interacțiunile deliberate:
 * - click pe un control (buton, link, tab, rând de grilă, câmp, opțiune de listă);
 * - orice tastă apăsată;
 * - modificarea unui câmp (filtre, select-uri, checkbox-uri) și trimiterea unui formular.
 *
 * NU contează: mișcarea mouse-ului, scroll-ul, click-urile pe zone neinteractive și
 * reîmprospătările automate din fundal. O stație nesupravegheată al cărei mouse e
 * atins accidental trebuie să se blocheze.
 */

export const ACTIVITY_EVENT = 'valyan:activity'

/**
 * Canal de sincronizare între tab-uri. Fără el, un tab activ ar ține sesiunea vie
 * pe server în timp ce altul, lăsat deschis, ar afișa avertismentul și ar deconecta.
 */
const CHANNEL_NAME = 'valyan-activity'

let channel: BroadcastChannel | null = null

export const getActivityChannel = () => {
  if (channel) return channel
  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
  } catch {
    // Browser fără BroadcastChannel: fiecare tab își aplică oricum propria fereastră.
    channel = null
  }
  return channel
}

/** Marchează explicit activitate, pentru cazurile pe care urmărirea automată nu le vede. */
export const reportActivity = () => {
  window.dispatchEvent(new Event(ACTIVITY_EVENT))
  getActivityChannel()?.postMessage('activity')
}

const INTERACTIVE_SELECTOR = [
  'button', 'a[href]', 'input', 'select', 'textarea', 'label', 'summary',
  '[contenteditable="true"]',
  '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]',
  '[role="option"]', '[role="checkbox"]', '[role="radio"]', '[role="switch"]',
  '[role="combobox"]', '[role="row"]', '[role="columnheader"]',
  // Syncfusion: wrapper-ele de input și elementele din popup-urile de listă
  '.e-input-group', '.e-list-item',
].join(',')

/** O tastare continuă nu trebuie să re-randeze layout-ul la fiecare caracter. */
const THROTTLE_MS = 1_000

/** Instalează ascultătorii globali; întoarce funcția de dezinstalare. */
export const trackUserActivity = (): (() => void) => {
  let last = 0

  const report = () => {
    const now = Date.now()
    if (now - last < THROTTLE_MS) return
    last = now
    reportActivity()
  }

  const onClick = (e: Event) => {
    if (e.target instanceof Element && e.target.closest(INTERACTIVE_SELECTOR)) report()
  }

  // Capture: unele componente opresc propagarea evenimentelor.
  const opts = { capture: true, passive: true } as const
  document.addEventListener('click', onClick, opts)
  document.addEventListener('keydown', report, opts)
  document.addEventListener('change', report, opts)
  document.addEventListener('submit', report, opts)

  return () => {
    document.removeEventListener('click', onClick, opts)
    document.removeEventListener('keydown', report, opts)
    document.removeEventListener('change', report, opts)
    document.removeEventListener('submit', report, opts)
  }
}

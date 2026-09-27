/** Text simplu din HTML-ul editorului (anamneză), pentru previzualizări pe o linie. */
export const htmlToText = (html: string | null | undefined): string => {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** Ora locală HH:mm dintr-un ISO. */
export const formatTime = (iso: string | null | undefined): string =>
  iso
    ? new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
    : ''

/** dd.MM dintr-o dată calendaristică YYYY-MM-DD (fără conversie de fus). */
export const formatDayMonth = (isoDate: string | null | undefined): string => {
  if (!isoDate) return ''
  const [, m, d] = isoDate.slice(0, 10).split('-')
  return `${d}.${m}`
}

/** „expirat de N zile” / „azi” / „în N zile”. */
export const formatDaysLeft = (days: number): string =>
  days < 0 ? `expirat de ${-days} zile` : days === 0 ? 'expiră azi' : `în ${days} zile`

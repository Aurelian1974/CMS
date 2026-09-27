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

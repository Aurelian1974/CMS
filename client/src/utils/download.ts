/** Descarcă un Blob sub numele dat (PDF-uri generate de server). */
export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revocarea imediată poate anula descărcarea în unele browsere
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

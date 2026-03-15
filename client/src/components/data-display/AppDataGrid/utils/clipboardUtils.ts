/** Copiază text în clipboard. */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }
  // Fallback
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

/** Citește text din clipboard. */
export async function readFromClipboard(): Promise<string> {
  if (navigator.clipboard) {
    return navigator.clipboard.readText()
  }
  return ''
}

/** Convertește un array de rânduri + câmpuri selectate într-un string tab-separated. */
export function rowsToTsv(
  rows: Record<string, unknown>[],
  fields: string[],
  headers?: string[],
): string {
  const lines: string[] = []

  // Header
  if (headers) {
    lines.push(headers.join('\t'))
  } else {
    lines.push(fields.join('\t'))
  }

  // Rows
  for (const row of rows) {
    const cells = fields.map(f => {
      const val = row[f]
      if (val === null || val === undefined) return ''
      const str = String(val)
      // Escape tabs, newlines
      return str.replace(/[\t\n\r]/g, ' ')
    })
    lines.push(cells.join('\t'))
  }

  return lines.join('\n')
}

/** Parsează text tab-separated într-un array 2D. */
export function parseTsv(text: string): string[][] {
  return text.split('\n').map(line => line.split('\t'))
}

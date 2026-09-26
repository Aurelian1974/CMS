// Documentul de previzualizare tipărire: foi A4 reale, aceleași la ecran și la imprimantă.

const PAGE_CSS = `
@page { size: A4 portrait; margin: 0; }
/* CSS-ul global al aplicației fixează body la 100% cu overflow: hidden (layout-ul shell-ului) */
html, body { margin: 0; padding: 0; height: auto; overflow: visible; }
html { overflow-y: auto; }
body { background: #e5e7eb; padding: 16px 0; }
#pv-source { display: none; }
.pv-sheet {
  position: relative;
  width: 210mm;
  height: 297mm;
  padding: 12mm 14mm;
  box-sizing: border-box;
  margin: 0 auto 16px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}
.pv-sheet--overflow { height: auto; min-height: 297mm; overflow: visible; }
.pv-page-number {
  position: absolute;
  right: 14mm;
  bottom: 5mm;
  font-size: 9px;
  color: #9ca3af;
}
@media print {
  body { background: #fff; padding: 0; }
  .pv-sheet { margin: 0; box-shadow: none; break-after: page; page-break-after: always; }
  .pv-sheet:last-child { break-after: auto; page-break-after: auto; }
}`

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function collectPageCss(): string {
  return Array.from(document.styleSheets)
    .flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((r) => r.cssText)
      } catch {
        // Foaie cross-origin — nu i se pot citi regulile, se include prin URL
        return sheet.href ? [`@import url("${sheet.href}");`] : []
      }
    })
    .join('\n')
    // Stilurile de tipărire se aplică și pe ecran, ca previzualizarea să fie identică cu hârtia
    .replace(/@media print\b/g, '@media all')
}

export function buildPrintDocument(letterMarkup: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>${collectPageCss()}</style>
  <style>${PAGE_CSS}</style>
</head>
<body>
  <div id="pv-source">${letterMarkup}</div>
  <div id="pv-pages"></div>
</body>
</html>`
}

interface Block {
  node: Element
  /** Containerul original din care provine blocul, când secțiunea e marcată `data-print-split`. */
  shell: Element | null
}

/** Distribuie secțiunile scrisorii pe foi A4; secțiunile atomice nu se rup între pagini. */
export function paginate(doc: Document): number {
  const source = doc.getElementById('pv-source')
  const pagesRoot = doc.getElementById('pv-pages')
  const letter = source?.firstElementChild
  if (!source || !pagesRoot || !letter) return 0

  const blocks = Array.from(letter.children).flatMap<Block>((child) =>
    child.hasAttribute('data-print-split')
      ? Array.from(child.children).map((node) => ({ node, shell: child }))
      : [{ node: child, shell: null }],
  )

  let sheet!: HTMLElement
  let content!: HTMLElement
  let shellClone = null as { original: Element; clone: Element } | null
  let blocksOnPage = 0

  const newPage = () => {
    sheet = doc.createElement('div')
    sheet.className = 'pv-sheet'
    content = doc.createElement('div')
    content.className = letter.className
    sheet.appendChild(content)
    pagesRoot.appendChild(sheet)
    shellClone = null
    blocksOnPage = 0
  }

  const place = ({ node, shell }: Block) => {
    if (!shell) {
      content.appendChild(node)
    } else {
      if (shellClone?.original !== shell) {
        shellClone = { original: shell, clone: shell.cloneNode(false) as Element }
        content.appendChild(shellClone.clone)
      }
      shellClone.clone.appendChild(node)
    }
    blocksOnPage++
  }

  const overflows = () => sheet.scrollHeight > sheet.clientHeight + 1

  newPage()
  for (const block of blocks) {
    place(block)
    if (overflows() && blocksOnPage > 1) {
      const emptiedShell = shellClone?.clone
      newPage()
      place(block)
      if (emptiedShell && emptiedShell.childElementCount === 0) emptiedShell.remove()
    }
    // Un singur bloc mai înalt decât o pagină: foaia crește, browserul îl rupe la tipărire
    if (overflows()) sheet.classList.add('pv-sheet--overflow')
  }

  source.remove()

  const sheets = Array.from(pagesRoot.children)
  sheets.forEach((s, i) => {
    const pageNumber = doc.createElement('div')
    pageNumber.className = 'pv-page-number'
    pageNumber.textContent = `Pagina ${i + 1} din ${sheets.length}`
    s.appendChild(pageNumber)
  })
  return sheets.length
}

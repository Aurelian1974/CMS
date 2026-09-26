import { useLayoutEffect, useRef, useState } from 'react'
import { AppButton } from '@/components/ui/AppButton'
import { MedicalLetter, type MedicalLetterProps } from '../MedicalLetter'
import { buildPrintDocument, paginate } from './printDocument'
import styles from './PrintPreview.module.scss'

interface PrintPreviewProps {
  letterProps: MedicalLetterProps
  isLoading: boolean
  title: string
}

export const PrintPreview = ({ letterProps, isLoading, title }: PrintPreviewProps) => {
  const sourceRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const lastKeyRef = useRef('')
  const [srcDoc, setSrcDoc] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(0)

  // Documentul se reconstruiește doar când se schimbă efectiv conținutul scrisorii
  useLayoutEffect(() => {
    if (isLoading || !sourceRef.current) return
    const markup = sourceRef.current.innerHTML
    const key = `${title}\u0000${markup}`
    if (key === lastKeyRef.current) return
    lastKeyRef.current = key
    setPageCount(0)
    setSrcDoc(buildPrintDocument(markup, title))
  }, [isLoading, title, letterProps])

  const handleLoad = async () => {
    const doc = frameRef.current?.contentDocument
    if (!doc) return
    // Fonturile schimbă înălțimile — paginarea se face după ce s-au încărcat
    await doc.fonts.ready
    setPageCount(paginate(doc))
  }

  const handlePrint = () => {
    const win = frameRef.current?.contentWindow
    win?.focus()
    win?.print()
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <span className={styles.info}>
          {isLoading || !srcDoc
            ? 'Se pregătește documentul…'
            : pageCount > 0
              ? `A4 · ${pageCount} ${pageCount === 1 ? 'pagină' : 'pagini'}`
              : 'Se paginează…'}
        </span>
        <AppButton variant="primary" size="sm" onClick={handlePrint} disabled={pageCount === 0}>
          🖨 Tipărește / Salvează PDF
        </AppButton>
      </div>

      <div ref={sourceRef} hidden>
        <MedicalLetter {...letterProps} />
      </div>

      {srcDoc && (
        <iframe
          ref={frameRef}
          className={styles.frame}
          srcDoc={srcDoc}
          onLoad={handleLoad}
          title="Previzualizare tipărire scrisoare medicală"
        />
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { AppButton } from '@/components/ui/AppButton'
import { formatCurrency, formatNumber } from '@/utils/format'
import { useMedicalServices } from '@/features/tariffs/hooks/useTariffs'
import type { ConsultationServiceDto } from '../../types/billing.types'
import styles from './ServiceLinesEditor.module.scss'

const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>

// Limitele din AddConsultationServiceCommandValidator
const MAX_QUANTITY = 1000
const QUANTITY_DECIMALS = 3

// Serviciile active încap într-o singură pagină pentru un cabinet; picker-ul nu paginează
const PICKER_PARAMS = { isActive: true, page: 1, pageSize: 500, sortBy: 'Name', sortDir: 'asc' as const }

const isValidQuantity = (q: number) => {
  if (!Number.isFinite(q) || q <= 0 || q > MAX_QUANTITY) return false
  const scaled = q * 10 ** QUANTITY_DECIMALS
  return Math.abs(Math.round(scaled) - scaled) < 1e-6
}

export interface ServiceLinesEditorProps {
  lines: ConsultationServiceDto[]
  total: number
  canEdit: boolean
  busy?: boolean
  /** Mesaj afișat când liniile nu mai pot fi modificate (ex: consultație facturată). */
  readOnlyHint?: string
  onAdd: (medicalServiceId: string, quantity: number) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onDelete: (id: string) => void
}

/**
 * Liniile de servicii ale unei consultații. Prețul unitar e un snapshot din momentul
 * adăugării (serverul îl copiază din tariful în vigoare) — nu se editează aici.
 */
export const ServiceLinesEditor = ({
  lines, total, canEdit, busy = false, readOnlyHint, onAdd, onUpdateQuantity, onDelete,
}: ServiceLinesEditorProps) => {
  const { data: servicesResp } = useMedicalServices(PICKER_PARAMS, canEdit)
  const [serviceId, setServiceId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  // Doar serviciile cu preț în vigoare pot fi adăugate (altfel serverul refuză cu 50612)
  const options = useMemo(
    () => (servicesResp?.data?.pagedResult?.items ?? []).filter((s) => s.currentPrice != null),
    [servicesResp],
  )
  const selected = options.find((s) => s.id === serviceId)
  const newQty = Number(quantity.replace(',', '.'))
  const canAdd = !!selected && isValidQuantity(newQty) && !busy

  const handleAdd = () => {
    if (!canAdd) return
    onAdd(serviceId, newQty)
    setServiceId('')
    setQuantity('1')
  }

  const commitQuantity = (line: ConsultationServiceDto) => {
    const raw = drafts[line.id]
    if (raw === undefined) return
    setDrafts((d) => {
      const next = { ...d }
      delete next[line.id]
      return next
    })
    const q = Number(raw.replace(',', '.'))
    if (isValidQuantity(q) && q !== line.quantity) onUpdateQuantity(line.id, q)
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Cod</th>
            <th>Serviciu</th>
            <th className={styles.right}>Preț unitar</th>
            <th className={styles.qtyCol}>Cantitate</th>
            <th className={styles.right}>Valoare</th>
            {canEdit && <th className={styles.actionCol} />}
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 && (
            <tr>
              <td colSpan={canEdit ? 6 : 5} className={styles.empty}>Nu există servicii adăugate.</td>
            </tr>
          )}
          {lines.map((line) => (
            <tr key={line.id}>
              <td className={styles.code}>{line.serviceCode}</td>
              <td>
                <div>{line.serviceName}</div>
                <div className={styles.muted}>{line.categoryName}</div>
              </td>
              <td className={styles.right}>{formatCurrency(line.unitPrice)}</td>
              <td className={styles.qtyCol}>
                {canEdit ? (
                  <input
                    type="number"
                    min={0.001}
                    max={MAX_QUANTITY}
                    step={1}
                    aria-label={`Cantitate ${line.serviceName}`}
                    className={styles.qtyInput}
                    value={drafts[line.id] ?? String(line.quantity)}
                    disabled={busy}
                    onChange={(e) => setDrafts((d) => ({ ...d, [line.id]: e.target.value }))}
                    onBlur={() => commitQuantity(line)}
                    onKeyDown={(e) => {
                      // Editorul stă și în formularul consultației — Enter nu trebuie să-l trimită
                      if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
                    }}
                  />
                ) : formatNumber(line.quantity, line.quantity % 1 === 0 ? 0 : 3)}
              </td>
              <td className={`${styles.right} ${styles.strong}`}>{formatCurrency(line.lineTotal)}</td>
              {canEdit && (
                <td className={styles.actionCol}>
                  <button type="button" className={styles.deleteBtn} title="Elimină linia"
                    aria-label={`Elimină ${line.serviceName}`} disabled={busy} onClick={() => onDelete(line.id)}>
                    <IconTrash />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className={styles.right}>Total</td>
            <td className={`${styles.right} ${styles.total}`}>{formatCurrency(total)}</td>
            {canEdit && <td />}
          </tr>
        </tfoot>
      </table>

      {canEdit ? (
        <div className={styles.addRow}>
          <select className={styles.select} value={serviceId} aria-label="Serviciu de adăugat"
            onChange={(e) => setServiceId(e.target.value)} disabled={busy}>
            <option value="">Alege serviciul din nomenclator…</option>
            {options.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name} ({formatCurrency(s.currentPrice!)})
              </option>
            ))}
          </select>
          <input type="number" className={styles.qtyInput} min={0.001} max={MAX_QUANTITY} step={1}
            aria-label="Cantitate" value={quantity} disabled={busy}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            onChange={(e) => setQuantity(e.target.value)} />
          <AppButton type="button" variant="primary" size="sm" disabled={!canAdd} onClick={handleAdd}>
            Adaugă
          </AppButton>
        </div>
      ) : readOnlyHint ? (
        <p className={styles.hint}>{readOnlyHint}</p>
      ) : null}
    </div>
  )
}

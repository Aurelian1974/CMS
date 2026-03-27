/// Utilitare globale de formatare — locale ro-RO

/// Formatare dată locală ca YYYY-MM-DD (fără conversie UTC)
/// Folosiți în loc de new Date().toISOString().slice(0, 10) care poate schimba ziua
export const toLocalDateISO = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/// Formatare dată: dd.MM.yyyy
export const formatDate = (date: string | Date): string =>
  new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))

/// Formatare dată + oră: dd.MM.yyyy HH:mm
export const formatDateTime = (date: string | Date): string =>
  new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))

/// Formatare monedă RON: 1.234,56 RON
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
  }).format(amount)

/// Formatare număr cu zecimale: 1.234,56
export const formatNumber = (value: number, decimals = 2): string =>
  new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)

/// Formatare dată doar luna și anul: Ianuarie 2025
export const formatMonthYear = (date: string | Date): string =>
  new Intl.DateTimeFormat('ro-RO', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))

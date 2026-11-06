export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function uid(prefix = 'id') {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${rand}`
}

export function hashPassword(password: string) {
  const value = `casa-viva::${password}`
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function toISO(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function addMonths(date: Date, months: number) {
  const copy = new Date(date)
  copy.setDate(1)
  copy.setMonth(copy.getMonth() + months)
  return copy
}

export function todayISO() {
  return toISO(new Date())
}

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(fromISO(iso))
}

export function formatShortDate(iso: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
  })
    .format(fromISO(iso))
    .replace('.', '')
}

export function formatMonthShort(iso: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(fromISO(iso)).replace('.', '')
}

export function formatDateLong(iso: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(fromISO(iso))
}

export function formatMoney(amount: number, compact = false) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: compact ? 0 : 2,
    minimumFractionDigits: compact ? 0 : 2,
    notation: compact ? 'compact' : 'standard',
  }).format(amount)
}

export function monthKey(iso: string) {
  return iso.slice(0, 7)
}

export function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('es-MX', { month: 'short', year: '2-digit' })
    .format(new Date(year, month - 1, 1))
    .replace('.', '')
}

export function monthLabelLong(key: string) {
  const [year, month] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  )
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function toCSV(rows: Array<Array<string | number>>) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '')
          return /[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
        })
        .join(','),
    )
    .join('\r\n')
}

export function downloadCSV(filename: string, rows: Array<Array<string | number>>) {
  downloadFile(`${filename}.csv`, `\uFEFF${toCSV(rows)}`, 'text/csv;charset=utf-8;')
}

export function downloadExcel(
  filename: string,
  title: string,
  headers: string[],
  rows: Array<Array<string | number>>,
) {
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')
  const body = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${escapeHtml(String(cell ?? ''))}</td>`)
          .join('')}</tr>`,
    )
    .join('')
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><style>table{border-collapse:collapse;font-family:Arial,sans-serif}th{background:#16211B;color:#fff;padding:8px;text-align:left}td{border:1px solid #ddd;padding:6px}h1{font-family:Georgia,serif}</style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`
  downloadFile(`${filename}.xls`, html, 'application/vnd.ms-excel;charset=utf-8;')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function percent(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7 // Monday first
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<{ date: Date; iso: string; inMonth: boolean }> = []
  for (let i = 0; i < startOffset; i += 1) {
    const date = addDays(first, i - startOffset)
    cells.push({ date, iso: toISO(date), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(year, month, d)
    cells.push({ date, iso: toISO(date), inMonth: true })
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1].date
    const date = addDays(last, 1)
    cells.push({ date, iso: toISO(date), inMonth: false })
    if (cells.length >= 42) break
  }
  return cells
}

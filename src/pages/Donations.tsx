import { useMemo, useState, type FormEvent } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  HandCoins,
  Lock,
  Pencil,
  Plus,
  TrendingUp,
  TrendingDown,
  UserRound,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStore } from '../store/AppStore'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { PageHeader, SearchField, StatTile } from '../components/ui'
import type { Donation, DonationMethod } from '../types'
import {
  downloadCSV,
  downloadExcel,
  formatDate,
  formatMoney,
  formatShortDate,
  monthKey,
  monthLabel,
  monthLabelLong,
  percent,
  todayISO,
  uid,
} from '../lib/utils'

const METHODS: Array<{ value: DonationMethod; label: string; color: string }> = [
  { value: 'efectivo', label: 'Efectivo', color: '#64714A' },
  { value: 'transferencia', label: 'Transferencia', color: '#44557C' },
  { value: 'tarjeta', label: 'Tarjeta', color: '#B4553B' },
  { value: 'deposito', label: 'Depósito', color: '#C99A4B' },
]

const METHOD_LABELS: Record<DonationMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  deposito: 'Depósito',
}

type Period = 'month' | 'prev' | 'quarter' | 'year' | 'all'

type DonationForm = {
  date: string
  amount: string
  concept: string
  method: DonationMethod
  anonymous: boolean
  memberId: string
  note: string
}

export default function Donations() {
  const { db, user, church, currentChurchId, can, mutate } = useStore()
  const { notify } = useToast()
  const manage = can('finance.manage')
  const today = todayISO()
  const currentMonth = monthKey(today)

  const [period, setPeriod] = useState<Period>('month')
  const [methodFilter, setMethodFilter] = useState<'all' | DonationMethod>('all')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Donation | null>(null)
  const [form, setForm] = useState<DonationForm | null>(null)
  const [error, setError] = useState('')

  const members = db.members.filter((member) => member.churchId === currentChurchId)
  const donations = db.donations
    .filter((donation) => donation.churchId === currentChurchId)
    .sort((a, b) => b.date.localeCompare(a.date))

  const prevDate = new Date()
  prevDate.setDate(1)
  prevDate.setMonth(prevDate.getMonth() - 1)
  const prevMonth = monthKey(
    `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`,
  )

  const monthDonations = donations.filter((donation) => monthKey(donation.date) === currentMonth)
  const prevMonthDonations = donations.filter((donation) => monthKey(donation.date) === prevMonth)
  const yearDonations = donations.filter((donation) => donation.date.startsWith(today.slice(0, 4)))
  const monthTotal = monthDonations.reduce((sum, donation) => sum + donation.amount, 0)
  const prevTotal = prevMonthDonations.reduce((sum, donation) => sum + donation.amount, 0)
  const yearTotal = yearDonations.reduce((sum, donation) => sum + donation.amount, 0)
  const average = monthDonations.length ? monthTotal / monthDonations.length : 0
  const variation = prevTotal ? Math.round(((monthTotal - prevTotal) / prevTotal) * 100) : 0
  const anonymousTotal = monthDonations
    .filter((donation) => donation.anonymous)
    .reduce((sum, donation) => sum + donation.amount, 0)

  const chartData = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - index))
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return {
      key,
      label: monthLabel(key),
      ingresos: donations
        .filter((donation) => monthKey(donation.date) === key)
        .reduce((sum, donation) => sum + donation.amount, 0),
      aportaciones: donations.filter((donation) => monthKey(donation.date) === key).length,
    }
  })

  const methodData = METHODS.map((method) => {
    const items = donations.filter((donation) => donation.method === method.value)
    return {
      ...method,
      total: items.reduce((sum, donation) => sum + donation.amount, 0),
      count: items.length,
    }
  })
  const methodTotal = methodData.reduce((sum, item) => sum + item.total, 0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return donations.filter((donation) => {
      if (methodFilter !== 'all' && donation.method !== methodFilter) return false
      if (period === 'month' && monthKey(donation.date) !== currentMonth) return false
      if (period === 'prev' && monthKey(donation.date) !== prevMonth) return false
      if (period === 'year' && !donation.date.startsWith(today.slice(0, 4))) return false
      if (period === 'quarter') {
        const start = new Date()
        start.setMonth(start.getMonth() - 3)
        const startISO = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`
        if (donation.date < startISO) return false
      }
      if (q) {
        const donor = members.find((member) => member.id === donation.memberId)
        const haystack = `${donation.concept} ${donation.note ?? ''} ${
          donation.anonymous ? 'anónimo' : donor ? `${donor.firstName} ${donor.lastName}` : ''
        } ${METHOD_LABELS[donation.method]}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [donations, methodFilter, period, query, currentMonth, prevMonth, today, members])

  const filteredTotal = filtered.reduce((sum, donation) => sum + donation.amount, 0)

  const openNew = () => {
    setEditing(null)
    setError('')
    setForm({
      date: today,
      amount: '',
      concept: '',
      method: 'efectivo',
      anonymous: false,
      memberId: members[0]?.id ?? '',
      note: '',
    })
    setModalOpen(true)
  }

  const openEdit = (donation: Donation) => {
    setEditing(donation)
    setError('')
    setForm({
      date: donation.date,
      amount: String(donation.amount),
      concept: donation.concept,
      method: donation.method,
      anonymous: donation.anonymous,
      memberId: donation.memberId ?? members[0]?.id ?? '',
      note: donation.note ?? '',
    })
    setModalOpen(true)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form) return
    const amount = Number(form.amount)
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      setError('Ingresa un monto mayor a cero.')
      return
    }
    if (!form.concept.trim()) {
      setError('Escribe el concepto de la aportación.')
      return
    }
    const donation: Donation = {
      id: editing?.id ?? uid('d'),
      churchId: currentChurchId,
      date: form.date,
      amount,
      concept: form.concept.trim(),
      method: form.method,
      anonymous: form.anonymous,
      memberId: form.anonymous ? undefined : form.memberId || undefined,
      note: form.note.trim() || undefined,
    }
    mutate((current) => ({
      ...current,
      donations: editing
        ? current.donations.map((item) => (item.id === donation.id ? donation : item))
        : [...current.donations, donation],
    }))
    setModalOpen(false)
    notify(editing ? 'Aportación actualizada.' : 'Aportación registrada correctamente.')
  }

  const exportData = (kind: 'csv' | 'xls') => {
    const rows = filtered.map((donation) => {
      const donor = members.find((member) => member.id === donation.memberId)
      return [
        donation.date,
        donation.concept,
        donation.anonymous
          ? 'Anónima'
          : donor
            ? `${donor.firstName} ${donor.lastName}`
            : 'Sin asociar',
        METHOD_LABELS[donation.method],
        donation.amount,
        donation.note ?? '',
      ]
    })
    if (rows.length === 0) {
      notify('No hay aportaciones en el periodo seleccionado.', 'info')
      return
    }
    const headers = ['Fecha', 'Concepto', 'Donante', 'Método', 'Monto MXN', 'Nota']
    if (kind === 'csv') {
      downloadCSV(`donaciones-${church.shortName.toLowerCase().replace(/\s+/g, '-')}`, [
        headers,
        ...rows,
      ])
    } else {
      downloadExcel(
        `donaciones-${church.shortName.toLowerCase().replace(/\s+/g, '-')}`,
        `Donaciones · ${church.name}`,
        headers,
        rows,
      )
    }
    notify(`Reporte de donaciones exportado en ${kind.toUpperCase()}.`)
  }

  if (!user) return null

  const periodLabel =
    period === 'month'
      ? monthLabelLong(currentMonth)
      : period === 'prev'
        ? monthLabelLong(prevMonth)
        : period === 'year'
          ? `Año ${today.slice(0, 4)}`
          : period === 'quarter'
            ? 'Últimos 3 meses'
            : 'Todo el historial'

  return (
    <>
      <PageHeader
        eyebrow="RF-06 · Donaciones y aportaciones"
        title="Generosidad con transparencia."
        description={`Registro financiero de ${church.shortName}. La información solo está disponible para pastorado, tesorería y administración.`}
        actions={
          <>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => exportData('csv')}>
              <Download size={14} /> CSV
            </button>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => exportData('xls')}>
              <FileSpreadsheet size={14} /> Excel
            </button>
            {manage && (
              <button type="button" className="btn btn--primary btn--sm" onClick={openNew}>
                <Plus size={15} /> Registrar aportación
              </button>
            )}
          </>
        }
      />

      <div className="finance-kpis">
        <StatTile
          label="Ingresos de este mes"
          value={formatMoney(monthTotal, true)}
          hint={
            <span className={variation >= 0 ? 'trend trend--up' : 'trend trend--down'}>
              {variation >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(variation)}%
            </span>
          }
          icon={<HandCoins size={19} />}
          tone="dark"
        />
        <StatTile
          label="Acumulado del año"
          value={formatMoney(yearTotal, true)}
          hint={`${yearDonations.length} aportaciones`}
          icon={<TrendingUp size={19} />}
        />
        <StatTile
          label="Promedio por aportación"
          value={formatMoney(average, true)}
          hint={`${monthDonations.length} este mes`}
          icon={<HandCoins size={19} />}
        />
        <StatTile
          label="Aportaciones anónimas"
          value={formatMoney(anonymousTotal, true)}
          hint={`${percent(anonymousTotal, monthTotal)}% del mes`}
          icon={<UserRound size={19} />}
          tone="accent"
        />
      </div>

      <div className="finance-layout">
        <section className="panel finance-chart">
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Ingresos por mes</h2>
              <p className="panel__subtitle">Últimos 6 meses · montos en MXN</p>
            </div>
            <span className="chip chip--gold">
              <Lock size={11} /> Acceso restringido
            </span>
          </div>
          <div className="finance-chart__body">
            <ResponsiveContainer width="100%" height={238}>
              <BarChart data={chartData} margin={{ top: 10, right: 6, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#ece7dc" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#8b8f83', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#8b8f83', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(23,32,26,.035)' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e4dfd2',
                    background: '#fffdf8',
                    fontSize: 11,
                  }}
                  formatter={(value: number, name) => [
                    name === 'ingresos' ? formatMoney(value) : value,
                    name === 'ingresos' ? 'Ingresos' : 'Aportaciones',
                  ]}
                />
                <Bar dataKey="ingresos" radius={[6, 6, 2, 2]} maxBarSize={44}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={entry.key === currentMonth ? church.theme.primary : church.theme.tint}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel finance-methods">
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Métodos de recepción</h2>
              <p className="panel__subtitle">Distribución histórica</p>
            </div>
          </div>
          <div className="finance-methods__donut">
            <ResponsiveContainer width="100%" height={158}>
              <PieChart>
                <Pie
                  data={methodData}
                  dataKey="total"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {methodData.map((entry) => (
                    <Cell key={entry.value} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e4dfd2',
                    background: '#fffdf8',
                    fontSize: 11,
                  }}
                  formatter={(value: number) => [formatMoney(value), 'Total']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="finance-methods__center">
              <strong>{formatMoney(methodTotal, true)}</strong>
              <span>histórico</span>
            </div>
          </div>
          <div className="finance-methods__list">
            {methodData.map((method) => (
              <div key={method.value}>
                <span className="finance-methods__dot" style={{ background: method.color }} />
                <span>{method.label}</span>
                <strong>{percent(method.total, methodTotal)}%</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel finance-table">
        <div className="table-toolbar">
          <div>
            <h2 className="panel__title">Aportaciones registradas</h2>
            <p className="panel__subtitle">
              {periodLabel} · {filtered.length} registros · <strong>{formatMoney(filteredTotal)}</strong>
            </p>
          </div>
          <div className="toolbar__group">
            <select
              className="select select--compact"
              value={period}
              onChange={(event) => setPeriod(event.target.value as Period)}
              aria-label="Filtrar por periodo"
            >
              <option value="month">Este mes</option>
              <option value="prev">Mes anterior</option>
              <option value="quarter">Últimos 3 meses</option>
              <option value="year">Este año</option>
              <option value="all">Todo el historial</option>
            </select>
            <select
              className="select select--compact"
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value as 'all' | DonationMethod)}
              aria-label="Filtrar por método"
            >
              <option value="all">Todos los métodos</option>
              {METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            <SearchField value={query} onChange={setQuery} placeholder="Buscar concepto o donante…" />
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Donante</th>
                <th>Método</th>
                <th>Monto</th>
                {manage && <th aria-label="Acciones" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((donation) => {
                const donor = members.find((member) => member.id === donation.memberId)
                return (
                  <tr key={donation.id}>
                    <td>
                      <span className="date-cell">{formatDate(donation.date, { month: 'short' })}</span>
                    </td>
                    <td>
                      <div className="cell-main">
                        <span className="donation-icon">
                          <HandCoins size={14} />
                        </span>
                        <span>
                          <strong>{donation.concept}</strong>
                          <span>{donation.note || 'Sin nota'}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      {donation.anonymous ? (
                        <span className="chip">
                          <UserRound size={11} /> Anónima
                        </span>
                      ) : (
                        <span>
                          {donor ? `${donor.firstName} ${donor.lastName}` : 'Sin asociar'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`method-chip method-chip--${donation.method}`}>
                        {METHOD_LABELS[donation.method]}
                      </span>
                    </td>
                    <td>
                      <strong className="amount-cell">{formatMoney(donation.amount)}</strong>
                    </td>
                    {manage && (
                      <td>
                        <div className="cell-actions">
                          <button
                            type="button"
                            className="row-action"
                            title="Editar aportación"
                            onClick={() => openEdit(donation)}
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="table-empty">No hay aportaciones que coincidan con los filtros.</p>
          )}
        </div>
      </section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar aportación' : 'Registrar aportación'}
        subtitle="La información financiera queda protegida según el rol."
        size="md"
        footer={
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="donation-form" className="btn btn--primary btn--sm">
              {editing ? 'Guardar cambios' : 'Registrar aportación'}
            </button>
          </>
        }
      >
        {form && (
          <form id="donation-form" className="form-grid" onSubmit={submit}>
            {error && (
              <div className="form-alert field--full" role="alert">
                {error}
              </div>
            )}
            <label className="field">
              <span>Fecha <em>*</em></span>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Monto (MXN) <em>*</em></span>
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                placeholder="500.00"
                required
              />
            </label>
            <label className="field field--full">
              <span>Concepto <em>*</em></span>
              <input
                className="input"
                value={form.concept}
                onChange={(event) => setForm({ ...form, concept: event.target.value })}
                placeholder="Ofrenda dominical, diezmo, proyecto…"
                required
              />
            </label>
            <label className="field">
              <span>Método de recepción</span>
              <select
                className="select"
                value={form.method}
                onChange={(event) =>
                  setForm({ ...form, method: event.target.value as DonationMethod })
                }
              >
                {METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>Privacidad del registro</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={form.anonymous}
                  onChange={(event) => setForm({ ...form, anonymous: event.target.checked })}
                />
                <span className="switch__track" />
                Registrar como anónima
              </label>
            </div>
            {!form.anonymous && (
              <label className="field field--full">
                <span>Donante (opcional)</span>
                <select
                  className="select"
                  value={form.memberId}
                  onChange={(event) => setForm({ ...form, memberId: event.target.value })}
                >
                  <option value="">Sin asociar a una persona</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="field field--full">
              <span>Nota interna</span>
              <textarea
                className="textarea"
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                placeholder="Detalle del comprobante o destino de la aportación…"
              />
            </label>
            <p className="field__hint field--full">
              <Lock size={11} /> Las aportaciones anónimas no se vinculan a ningún miembro y
              mantienen la privacidad del donante.
            </p>
          </form>
        )}
      </Modal>
    </>
  )
}

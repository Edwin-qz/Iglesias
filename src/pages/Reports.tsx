import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  HandCoins,
  HeartHandshake,
  Printer,
  Users,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useToast } from '../components/Toast'
import { SearchField } from '../components/ui'
import { ChurchMark } from '../components/Brand'
import {
  downloadCSV,
  downloadExcel,
  formatDate,
  formatMoney,
  formatShortDate,
  monthKey,
  percent,
  todayISO,
} from '../lib/utils'
import { cn } from '../lib/utils'

type ReportTab = 'miembros' | 'asistencia' | 'ministerios' | 'ingresos'
type Period = 'week' | 'month' | 'quarter' | 'year' | 'all'

const TABS: Array<{ id: ReportTab; label: string; icon: typeof Users; permission?: string }> = [
  { id: 'miembros', label: 'Miembros', icon: Users },
  { id: 'asistencia', label: 'Asistencia', icon: ClipboardCheck },
  { id: 'ministerios', label: 'Ministerios', icon: HeartHandshake },
  { id: 'ingresos', label: 'Ingresos', icon: HandCoins, permission: 'reports.finance' },
]

function startOfWeekISO() {
  const base = new Date()
  const offset = (base.getDay() + 6) % 7
  const start = new Date(base)
  start.setDate(start.getDate() - offset)
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
}

export default function Reports() {
  const { db, user, church, currentChurchId, can } = useStore()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()
  const today = todayISO()

  const allowedTabs = TABS.filter((tab) => !tab.permission || can(tab.permission as never))
  const requested = params.get('tab') as ReportTab | null
  const initialTab = allowedTabs.some((tab) => tab.id === requested)
    ? (requested as ReportTab)
    : 'miembros'
  const [tab, setTab] = useState<ReportTab>(initialTab)
  const [period, setPeriod] = useState<Period>('month')
  const [memberStatus, setMemberStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [query, setQuery] = useState('')

  const members = db.members.filter((member) => member.churchId === currentChurchId)
  const ministries = db.ministries.filter((ministry) => ministry.churchId === currentChurchId)
  const events = db.events.filter((event) => event.churchId === currentChurchId)
  const donations = db.donations
    .filter((donation) => donation.churchId === currentChurchId)
    .sort((a, b) => b.date.localeCompare(a.date))
  const attendance = db.attendance
    .filter((record) => record.churchId === currentChurchId)
    .sort((a, b) => b.date.localeCompare(a.date))

  const startDate = (() => {
    if (period === 'all') return '0000-01-01'
    if (period === 'week') return startOfWeekISO()
    if (period === 'year') return `${today.slice(0, 4)}-01-01`
    const date = new Date()
    date.setDate(1)
    if (period === 'quarter') date.setMonth(date.getMonth() - 2)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
  })()

  const periodLabel =
    period === 'all'
      ? 'Historial completo'
      : period === 'week'
        ? 'Esta semana'
        : period === 'month'
          ? 'Este mes'
          : period === 'quarter'
            ? 'Últimos 3 meses'
            : `Año ${today.slice(0, 4)}`

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members
      .filter((member) => {
        if (memberStatus === 'active' && !member.active) return false
        if (memberStatus === 'inactive' && member.active) return false
        if (!q) return true
        return `${member.firstName} ${member.lastName} ${member.email} ${member.phone}`
          .toLowerCase()
          .includes(q)
      })
      .sort((a, b) => a.firstName.localeCompare(b.firstName))
  }, [members, memberStatus, query])

  const filteredAttendance = attendance.filter((record) => record.date >= startDate)
  const filteredDonations = donations.filter((donation) => donation.date >= startDate)

  const attendancePresent = filteredAttendance.reduce(
    (sum, record) => sum + record.presentIds.length,
    0,
  )
  const attendanceExpected = filteredAttendance.reduce(
    (sum, record) => sum + record.presentIds.length + record.absentIds.length,
    0,
  )

  const financeTotal = filteredDonations.reduce((sum, donation) => sum + donation.amount, 0)
  const anonymousTotal = filteredDonations
    .filter((donation) => donation.anonymous)
    .reduce((sum, donation) => sum + donation.amount, 0)

  const currentTab = allowedTabs.find((item) => item.id === tab) ?? allowedTabs[0]

  const switchTab = (next: ReportTab) => {
    setTab(next)
    setParams({ tab: next })
    setQuery('')
  }

  const getReportData = () => {
    if (tab === 'miembros') {
      const headers = ['Nombre', 'Teléfono', 'Correo', 'Ingreso', 'Ministerios', 'Estado']
      const rows = filteredMembers.map((member) => [
        `${member.firstName} ${member.lastName}`,
        member.phone,
        member.email,
        member.joinedAt,
        ministries
          .filter((ministry) => member.ministryIds.includes(ministry.id))
          .map((ministry) => ministry.name)
          .join(', ') || 'Sin asignar',
        member.active ? 'Activo' : 'Inactivo',
      ])
      return { title: 'Reporte general de miembros', headers, rows }
    }
    if (tab === 'asistencia') {
      const headers = ['Fecha', 'Evento', 'Presentes', 'Ausentes', 'Participación']
      const rows = filteredAttendance.map((record) => {
        const event = events.find((item) => item.id === record.eventId)
        const total = record.presentIds.length + record.absentIds.length
        return [
          record.date,
          event?.title ?? 'Evento no disponible',
          record.presentIds.length,
          record.absentIds.length,
          `${percent(record.presentIds.length, total)}%`,
        ]
      })
      return { title: `Reporte de asistencia · ${periodLabel}`, headers, rows }
    }
    if (tab === 'ministerios') {
      const headers = ['Ministerio', 'Coordinador', 'Integrantes', 'Activos', 'Próxima actividad']
      const rows = ministries.map((ministry) => {
        const coordinator = members.find((member) => member.id === ministry.coordinatorId)
        const nextEvent = events
          .filter(
            (event) =>
              event.ministryId === ministry.id &&
              event.status === 'programado' &&
              event.date >= today,
          )
          .sort((a, b) => a.date.localeCompare(b.date))[0]
        return [
          ministry.name,
          coordinator ? `${coordinator.firstName} ${coordinator.lastName}` : 'Sin asignar',
          ministry.memberIds.length,
          members.filter((member) => ministry.memberIds.includes(member.id) && member.active)
            .length,
          nextEvent ? `${formatShortDate(nextEvent.date)} · ${nextEvent.title}` : 'Sin programar',
        ]
      })
      return { title: 'Reporte de participación por ministerio', headers, rows }
    }
    const headers = ['Fecha', 'Concepto', 'Donante', 'Método', 'Monto MXN']
    const rows = filteredDonations.map((donation) => {
      const donor = members.find((member) => member.id === donation.memberId)
      return [
        donation.date,
        donation.concept,
        donation.anonymous
          ? 'Anónima'
          : donor
            ? `${donor.firstName} ${donor.lastName}`
            : 'Sin asociar',
        donation.method,
        donation.amount,
      ]
    })
    return { title: `Reporte de ingresos · ${periodLabel}`, headers, rows }
  }

  const exportReport = (kind: 'csv' | 'xls') => {
    const { title, headers, rows } = getReportData()
    if (rows.length === 0) {
      notify('El reporte no tiene datos para exportar.', 'info')
      return
    }
    const base = `reporte-${tab}-${church.shortName.toLowerCase().replace(/\s+/g, '-')}`
    if (kind === 'csv') {
      downloadCSV(base, [headers, ...rows])
    } else {
      downloadExcel(base, `${title} · ${church.name}`, headers, rows)
    }
    notify(`Reporte exportado en ${kind.toUpperCase()}.`)
  }

  const printReport = () => {
    notify('En el diálogo de impresión elige «Guardar como PDF».', 'info')
    window.setTimeout(() => window.print(), 150)
  }

  if (!user) return null

  const renderTable = () => {
    if (tab === 'miembros') {
      return (
        <table className="data-table">
          <thead>
            <tr>
              <th>Miembro</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Ingreso</th>
              <th>Ministerios</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id}>
                <td>
                  <strong>
                    {member.firstName} {member.lastName}
                  </strong>
                </td>
                <td>{member.phone}</td>
                <td>{member.email}</td>
                <td>{formatDate(member.joinedAt, { month: 'short' })}</td>
                <td>
                  {ministries
                    .filter((ministry) => member.ministryIds.includes(ministry.id))
                    .map((ministry) => ministry.name)
                    .join(', ') || 'Sin asignar'}
                </td>
                <td>{member.active ? 'Activo' : 'Inactivo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    if (tab === 'asistencia') {
      return (
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Evento</th>
              <th>Presentes</th>
              <th>Ausentes</th>
              <th>Participación</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.map((record) => {
              const event = events.find((item) => item.id === record.eventId)
              const total = record.presentIds.length + record.absentIds.length
              return (
                <tr key={record.id}>
                  <td>{formatDate(record.date, { month: 'short' })}</td>
                  <td>{event?.title ?? 'Evento no disponible'}</td>
                  <td>{record.presentIds.length}</td>
                  <td>{record.absentIds.length}</td>
                  <td>
                    <strong>{percent(record.presentIds.length, total)}%</strong>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )
    }
    if (tab === 'ministerios') {
      return (
        <table className="data-table">
          <thead>
            <tr>
              <th>Ministerio</th>
              <th>Coordinador</th>
              <th>Integrantes</th>
              <th>Activos</th>
              <th>Próxima actividad</th>
            </tr>
          </thead>
          <tbody>
            {ministries.map((ministry) => {
              const coordinator = members.find((member) => member.id === ministry.coordinatorId)
              const nextEvent = events
                .filter(
                  (event) =>
                    event.ministryId === ministry.id &&
                    event.status === 'programado' &&
                    event.date >= today,
                )
                .sort((a, b) => a.date.localeCompare(b.date))[0]
              return (
                <tr key={ministry.id}>
                  <td>
                    <strong>{ministry.name}</strong>
                  </td>
                  <td>
                    {coordinator
                      ? `${coordinator.firstName} ${coordinator.lastName}`
                      : 'Sin asignar'}
                  </td>
                  <td>{ministry.memberIds.length}</td>
                  <td>
                    {
                      members.filter(
                        (member) => ministry.memberIds.includes(member.id) && member.active,
                      ).length
                    }
                  </td>
                  <td>
                    {nextEvent
                      ? `${formatShortDate(nextEvent.date)} · ${nextEvent.title}`
                      : 'Sin programar'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )
    }
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th>Donante</th>
            <th>Método</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          {filteredDonations.map((donation) => {
            const donor = members.find((member) => member.id === donation.memberId)
            return (
              <tr key={donation.id}>
                <td>{formatDate(donation.date, { month: 'short' })}</td>
                <td>{donation.concept}</td>
                <td>
                  {donation.anonymous
                    ? 'Anónima'
                    : donor
                      ? `${donor.firstName} ${donor.lastName}`
                      : 'Sin asociar'}
                </td>
                <td className="capitalize">{donation.method}</td>
                <td>
                  <strong>{formatMoney(donation.amount)}</strong>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">RF-09 · Reportes</p>
          <h1 className="page-header__title">Lo que los números cuentan.</h1>
          <p className="page-header__description">
            Consulta y exporta la información de {church.shortName}. Los reportes respetan los
            permisos de tu rol.
          </p>
        </div>
        <div className="page-header__actions">
          <button type="button" className="btn btn--outline btn--sm" onClick={printReport}>
            <Printer size={14} /> PDF
          </button>
          <button type="button" className="btn btn--outline btn--sm" onClick={() => exportReport('xls')}>
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => exportReport('csv')}>
            <Download size={14} /> CSV
          </button>
        </div>
      </header>

      <div className="report-tabs" role="tablist" aria-label="Tipos de reporte">
        {allowedTabs.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={cn('report-tab', tab === item.id && 'is-active')}
              onClick={() => switchTab(item.id)}
            >
              <span>
                <Icon size={16} />
              </span>
              <span>
                <strong>{item.label}</strong>
                <em>
                  {item.id === 'miembros'
                    ? `${members.length} registros`
                    : item.id === 'asistencia'
                      ? `${attendance.length} listas`
                      : item.id === 'ministerios'
                        ? `${ministries.length} equipos`
                        : `${donations.length} aportaciones`}
                </em>
              </span>
            </button>
          )
        })}
      </div>

      <section className="panel report-print-area">
        <div className="report-print-head">
          <div className="report-print-brand">
            <ChurchMark size={30} />
            <span>
              <strong>{church.name}</strong>
              <em>{church.address} · {church.colonia}, Mérida</em>
            </span>
          </div>
          <div>
            <strong>{currentTab?.label}</strong>
            <span>{periodLabel}</span>
            <em>Generado el {formatDate(today)} por {user.name}</em>
          </div>
        </div>

        <div className="table-toolbar report-toolbar">
          <div>
            <h2 className="panel__title">{currentTab?.label}</h2>
            <p className="panel__subtitle">
              {tab === 'miembros' && `${filteredMembers.length} miembros en la vista`}
              {tab === 'asistencia' && `${filteredAttendance.length} listas · ${periodLabel}`}
              {tab === 'ministerios' && `${ministries.length} ministerios registrados`}
              {tab === 'ingresos' && `${filteredDonations.length} aportaciones · ${periodLabel}`}
            </p>
          </div>
          <div className="toolbar__group">
            {tab === 'miembros' ? (
              <>
                <select
                  className="select select--compact"
                  value={memberStatus}
                  onChange={(event) =>
                    setMemberStatus(event.target.value as 'all' | 'active' | 'inactive')
                  }
                  aria-label="Estado"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Solo activos</option>
                  <option value="inactive">Solo inactivos</option>
                </select>
                <SearchField value={query} onChange={setQuery} placeholder="Buscar miembro…" />
              </>
            ) : tab === 'ministerios' ? null : (
              <select
                className="select select--compact"
                value={period}
                onChange={(event) => setPeriod(event.target.value as Period)}
                aria-label="Periodo del reporte"
              >
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="quarter">Últimos 3 meses</option>
                <option value="year">Este año</option>
                <option value="all">Historial completo</option>
              </select>
            )}
          </div>
        </div>

        <div className="report-stats">
          {tab === 'miembros' && (
            <>
              <div>
                <span>Total</span>
                <strong>{members.length}</strong>
              </div>
              <div>
                <span>Activos</span>
                <strong>{members.filter((member) => member.active).length}</strong>
              </div>
              <div>
                <span>Inactivos</span>
                <strong>{members.filter((member) => !member.active).length}</strong>
              </div>
              <div>
                <span>Nuevos este año</span>
                <strong>{members.filter((member) => member.joinedAt.startsWith(today.slice(0, 4))).length}</strong>
              </div>
            </>
          )}
          {tab === 'asistencia' && (
            <>
              <div>
                <span>Listas registradas</span>
                <strong>{filteredAttendance.length}</strong>
              </div>
              <div>
                <span>Presencias</span>
                <strong>{attendancePresent}</strong>
              </div>
              <div>
                <span>Ausencias</span>
                <strong>{attendanceExpected - attendancePresent}</strong>
              </div>
              <div>
                <span>Promedio</span>
                <strong>{percent(attendancePresent, attendanceExpected)}%</strong>
              </div>
            </>
          )}
          {tab === 'ministerios' && (
            <>
              <div>
                <span>Ministerios</span>
                <strong>{ministries.length}</strong>
              </div>
              <div>
                <span>Participaciones</span>
                <strong>{ministries.reduce((sum, ministry) => sum + ministry.memberIds.length, 0)}</strong>
              </div>
              <div>
                <span>Actividades</span>
                <strong>
                  {events.filter((event) => event.ministryId && event.status === 'programado').length}
                </strong>
              </div>
              <div>
                <span>Coordinadores</span>
                <strong>{new Set(ministries.map((ministry) => ministry.coordinatorId)).size}</strong>
              </div>
            </>
          )}
          {tab === 'ingresos' && (
            <>
              <div>
                <span>Total del periodo</span>
                <strong>{formatMoney(financeTotal)}</strong>
              </div>
              <div>
                <span>Aportaciones</span>
                <strong>{filteredDonations.length}</strong>
              </div>
              <div>
                <span>Promedio</span>
                <strong>
                  {formatMoney(filteredDonations.length ? financeTotal / filteredDonations.length : 0)}
                </strong>
              </div>
              <div>
                <span>Anónimas</span>
                <strong>{formatMoney(anonymousTotal)}</strong>
              </div>
            </>
          )}
        </div>

        <div className="data-table-wrap report-table">
          {renderTable()}
          {((tab === 'miembros' && filteredMembers.length === 0) ||
            (tab === 'asistencia' && filteredAttendance.length === 0) ||
            (tab === 'ministerios' && ministries.length === 0) ||
            (tab === 'ingresos' && filteredDonations.length === 0)) && (
            <p className="table-empty">No hay datos para este reporte en el periodo seleccionado.</p>
          )}
        </div>

        <div className="report-print-foot">
          <span>Casa Viva · Sistema de gestión para iglesias de Mérida</span>
          <span>{church.email} · {church.phone}</span>
        </div>
      </section>

      <p className="report-note">
        <FileText size={13} /> Para PDF se usa el diálogo de impresión del navegador. Excel descarga
        un archivo compatible con Microsoft Excel; CSV es ideal para análisis de datos.
      </p>
    </>
  )
}

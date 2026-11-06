import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  Clock,
  HandCoins,
  HeartHandshake,
  Lock,
  MapPin,
  Megaphone,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStore } from '../store/AppStore'
import { PageHeader, ProgressBar, StatTile } from '../components/ui'
import { ChurchImage } from '../components/ChurchImage'
import {
  addDays,
  formatDate,
  formatDateLong,
  formatMonthShort,
  formatMoney,
  formatShortDate,
  monthKey,
  monthLabel,
  percent,
  todayISO,
} from '../lib/utils'

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - day)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const TYPE_LABELS: Record<string, string> = {
  culto: 'Culto',
  reunion: 'Reunión',
  actividad: 'Actividad',
  administrativo: 'Administrativo',
}

export default function Dashboard() {
  const { db, user, church, currentChurchId, can } = useStore()
  if (!user) return null

  const today = todayISO()
  const churchMembers = db.members.filter((member) => member.churchId === currentChurchId)
  const activeMembers = churchMembers.filter((member) => member.active)
  const churchEvents = db.events.filter((event) => event.churchId === currentChurchId)
  const upcoming = churchEvents
    .filter((event) => event.status === 'programado' && event.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const attendanceRecords = db.attendance
    .filter((record) => record.churchId === currentChurchId)
    .sort((a, b) => b.date.localeCompare(a.date))
  const ministries = db.ministries.filter((ministry) => ministry.churchId === currentChurchId)
  const announcements = db.announcements
    .filter((announcement) => announcement.churchId === currentChurchId)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt))
  const totalPresent = attendanceRecords.reduce((sum, record) => sum + record.presentIds.length, 0)
  const totalExpected = attendanceRecords.reduce(
    (sum, record) => sum + record.presentIds.length + record.absentIds.length,
    0,
  )
  const averageAttendance = percent(totalPresent, totalExpected)
  const month = monthKey(today)
  const monthDonations = db.donations.filter(
    (donation) => donation.churchId === currentChurchId && monthKey(donation.date) === month,
  )
  const monthIncome = monthDonations.reduce((sum, donation) => sum + donation.amount, 0)
  const yearIncome = db.donations
    .filter(
      (donation) =>
        donation.churchId === currentChurchId && donation.date.startsWith(today.slice(0, 4)),
    )
    .reduce((sum, donation) => sum + donation.amount, 0)

  const weekToday = startOfWeek(new Date())
  const attendanceChart = Array.from({ length: 6 }).map((_, index) => {
    const start = addDays(weekToday, -7 * (5 - index))
    const end = addDays(start, 6)
    const startISO = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    const endISO = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
    const records = attendanceRecords.filter(
      (record) => record.date >= startISO && record.date <= endISO,
    )
    const present = records.reduce((sum, record) => sum + record.presentIds.length, 0)
    const expected = records.reduce(
      (sum, record) => sum + record.presentIds.length + record.absentIds.length,
      0,
    )
    return {
      label: formatShortDate(startISO),
      asistencia: percent(present, expected),
      presentes: present,
    }
  })

  const financeChart = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - index))
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const total = db.donations
      .filter((donation) => donation.churchId === currentChurchId && monthKey(donation.date) === key)
      .reduce((sum, donation) => sum + donation.amount, 0)
    return { label: monthLabel(key), ingresos: total }
  })

  const nextEvent = upcoming[0]
  const ministryData = ministries
    .map((ministry) => ({
      ...ministry,
      count: ministry.memberIds.length,
      coordinator: churchMembers.find((member) => member.id === ministry.coordinatorId),
    }))
    .sort((a, b) => b.count - a.count)
  const maxMinistry = Math.max(1, ...ministryData.map((item) => item.count))
  const chartTone = church.theme.primary

  const isFinanceAllowed = can('finance.view')

  return (
    <>
      <PageHeader
        eyebrow={`${formatDateLong(today)} · ${church.shortName}`}
        title={`Hola, ${user.name.split(' ')[0]}.`}
        description={`Este es el pulso de ${church.shortName} hoy. Un vistazo tranquilo a tu comunidad, tus próximos encuentros y lo que necesita atención.`}
        actions={
          <>
            {can('attendance.manage') && (
              <Link to="/app/asistencia" className="btn btn--outline btn--sm">
                <ClipboardCheck size={15} /> Pasar lista
              </Link>
            )}
            {can('events.manage') && (
              <Link to="/app/eventos" className="btn btn--primary btn--sm">
                <Plus size={15} /> Nuevo evento
              </Link>
            )}
          </>
        }
      />

      <div className="dash-bento">
        <section className="dash-lead">
          <div className="dash-lead__art">
            <ChurchImage church={church} variant={3} className="dash-lead__svg" />
            {church.photo && (
              <a
                className="dash-lead__credit"
                href={church.photo.source}
                target="_blank"
                rel="noreferrer"
              >
                Foto: {church.photo.credit} · {church.photo.license}
              </a>
            )}
          </div>
          <div className="dash-lead__content">
            <span className="dash-lead__eyebrow">
              <Sparkles size={12} /> Comunidad activa
            </span>
            <h2>{church.name}</h2>
            <p>{church.mission}</p>
            {nextEvent ? (
              <div className="dash-lead__next">
                <span className="dash-lead__date">
                  <em>{formatDate(nextEvent.date, { weekday: 'short' }).slice(0, 3)}</em>
                  <strong>{nextEvent.date.slice(8, 10)}</strong>
                  <span>{nextEvent.time}</span>
                </span>
                <span className="dash-lead__next-info">
                  <em>Próximo encuentro</em>
                  <strong>{nextEvent.title}</strong>
                  <span>
                    <MapPin size={11} /> {nextEvent.place}
                  </span>
                </span>
              </div>
            ) : (
              <div className="dash-lead__empty">No hay eventos programados por ahora.</div>
            )}
            <div className="dash-lead__actions">
              <Link to="/app/eventos" className="btn btn--light btn--sm">
                Ver agenda <ArrowRight size={14} />
              </Link>
              <Link to="/app/ministerios" className="dash-lead__link">
                Explorar ministerios <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        <StatTile
          label="Miembros activos"
          value={activeMembers.length}
          hint={`${churchMembers.length} registrados`}
          icon={<Users size={19} />}
        />
        <StatTile
          label="Asistencias registradas"
          value={totalPresent}
          hint={`${attendanceRecords.length} listas`}
          icon={<ClipboardCheck size={19} />}
        />
        <StatTile
          label="Eventos próximos"
          value={upcoming.length}
          hint={nextEvent ? formatShortDate(nextEvent.date) : 'Sin agenda'}
          icon={<CalendarDays size={19} />}
          tone="accent"
        />
        <StatTile
          label="Ministerios"
          value={ministries.length}
          hint="Equipos en servicio"
          icon={<HeartHandshake size={19} />}
        />

        <section className="panel dash-chart">
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Asistencia de las últimas 6 semanas</h2>
              <p className="panel__subtitle">Porcentaje de participación sobre miembros activos</p>
            </div>
            <span className="dash-chart__badge">
              Promedio <strong>{averageAttendance}%</strong>
            </span>
          </div>
          <div className="dash-chart__body">
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={attendanceChart} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartTone} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={chartTone} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ece7dc" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#8b8f83', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  dy={6}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fill: '#8b8f83', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e4dfd2',
                    background: '#fffdf8',
                    fontSize: 11,
                    boxShadow: '0 8px 20px rgba(23,32,26,.08)',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Asistencia']}
                  labelStyle={{ fontWeight: 700, color: '#17201a' }}
                />
                <Area
                  type="monotone"
                  dataKey="asistencia"
                  stroke={chartTone}
                  strokeWidth={2.2}
                  fill="url(#attendanceFill)"
                  dot={{ r: 3, strokeWidth: 2, fill: '#fffdf8', stroke: chartTone }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel dash-upcoming">
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Próximos encuentros</h2>
              <p className="panel__subtitle">Agenda de la comunidad</p>
            </div>
            <Link to="/app/eventos" className="link-btn">
              Ver todos <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mini-event-list">
            {upcoming.slice(0, 4).map((event) => (
              <Link to="/app/eventos" className="mini-event" key={event.id}>
                <span className="mini-event__date">
                  <strong>{event.date.slice(8, 10)}</strong>
                  <em>{formatMonthShort(event.date)}</em>
                </span>
                <span className="mini-event__info">
                  <strong>{event.title}</strong>
                  <span>
                    <Clock size={11} /> {event.time} · {event.place}
                  </span>
                </span>
                <ArrowRight size={14} className="mini-event__arrow" />
              </Link>
            ))}
            {upcoming.length === 0 && (
              <p className="table-empty">No hay eventos próximos en el calendario.</p>
            )}
          </div>
        </section>

        <section className="panel dash-announcements">
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Avisos recientes</h2>
              <p className="panel__subtitle">Lo que la comunidad necesita saber</p>
            </div>
            <Link to="/app/anuncios" className="link-btn">
              Ver todos <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mini-announce-list">
            {announcements.slice(0, 3).map((announcement) => (
              <Link to="/app/anuncios" className="mini-announce" key={announcement.id}>
                <span className="mini-announce__icon">
                  <Megaphone size={14} />
                </span>
                <span>
                  <strong>{announcement.title}</strong>
                  <em>{formatDate(announcement.publishedAt, { day: '2-digit', month: 'short' })}</em>
                </span>
                {announcement.pinned && <span className="chip chip--gold">Fijado</span>}
              </Link>
            ))}
          </div>
        </section>

        {isFinanceAllowed ? (
          <section className="panel dash-finance">
            <div className="panel__head">
              <div>
                <h2 className="panel__title">Ingresos de los últimos 6 meses</h2>
                <p className="panel__subtitle">Solo visible para pastorado y tesorería</p>
              </div>
              <Link to="/app/donaciones" className="link-btn">
                Ver finanzas <ArrowRight size={13} />
              </Link>
            </div>
            <div className="dash-finance__summary">
              <span>
                <em>Este mes</em>
                <strong>{formatMoney(monthIncome, true)}</strong>
              </span>
              <span>
                <em>Acumulado anual</em>
                <strong>{formatMoney(yearIncome, true)}</strong>
              </span>
              <span>
                <em>Aportaciones</em>
                <strong>{monthDonations.length}</strong>
              </span>
              <span className="dash-finance__lock">
                <Lock size={12} /> Datos protegidos
              </span>
            </div>
            <div className="dash-chart__body dash-chart__body--bars">
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={financeChart} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
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
                    formatter={(value: number) => [formatMoney(value), 'Ingresos']}
                  />
                  <Bar dataKey="ingresos" radius={[5, 5, 2, 2]} maxBarSize={38}>
                    {financeChart.map((entry) => (
                      <Cell key={entry.label} fill={chartTone} opacity={0.82} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        ) : (
          <section className="panel dash-finance dash-finance--locked">
            <div className="dash-locked">
              <span>
                <Lock size={22} />
              </span>
              <div>
                <h2>Información financiera protegida</h2>
                <p>
                  Tu rol no tiene acceso al resumen de ingresos. Si necesitas consultarlo, pide al
                  administrador que revise tus permisos.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="panel dash-ministries">
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Vida de los ministerios</h2>
              <p className="panel__subtitle">Integrantes por equipo</p>
            </div>
            <Link to="/app/ministerios" className="link-btn">
              Gestionar <ArrowRight size={13} />
            </Link>
          </div>
          <div className="ministry-bars">
            {ministryData.slice(0, 4).map((ministry) => (
              <div className="ministry-bar" key={ministry.id}>
                <span className="ministry-bar__dot" style={{ background: ministry.color }} />
                <span className="ministry-bar__name">{ministry.name}</span>
                <span className="ministry-bar__track">
                  <ProgressBar
                    value={(ministry.count / maxMinistry) * 100}
                    tone={ministry.color}
                  />
                </span>
                <strong>{ministry.count}</strong>
              </div>
            ))}
          </div>
          <div className="dash-ministries__foot">
            <span>
              <Users size={13} /> {activeMembers.length} miembros activos
            </span>
            <span>
              <HandCoins size={13} /> {db.donations.filter((d) => d.churchId === currentChurchId).length} aportaciones
            </span>
          </div>
        </section>
      </div>
    </>
  )
}

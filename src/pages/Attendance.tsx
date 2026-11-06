import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarCheck2,
  Check,
  CheckCheck,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  History,
  UserRound,
  X,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { Avatar, EmptyState, PageHeader, Segmented } from '../components/ui'
import type { Attendance } from '../types'
import {
  addDays,
  downloadCSV,
  formatDate,
  formatShortDate,
  percent,
  todayISO,
  toISO,
  uid,
} from '../lib/utils'
import { cn } from '../lib/utils'

type HistoryFilter = 'all' | 'month' | 'week'

export default function AttendancePage() {
  const { db, user, church, currentChurchId, can, mutate } = useStore()
  const { notify } = useToast()
  const manage = can('attendance.manage')
  const today = todayISO()

  const members = db.members.filter(
    (member) => member.churchId === currentChurchId && member.active,
  )
  const events = db.events
    .filter((event) => event.churchId === currentChurchId && event.status !== 'cancelado')
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
  const records = db.attendance
    .filter((record) => record.churchId === currentChurchId)
    .sort((a, b) => b.date.localeCompare(a.date))

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [date, setDate] = useState(events[0]?.date ?? today)
  const [presentIds, setPresentIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')
  const [detail, setDetail] = useState<Attendance | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  const selectedEvent = events.find((event) => event.id === selectedEventId)
  const existing = useMemo(
    () =>
      db.attendance.find(
        (record) =>
          record.churchId === currentChurchId &&
          record.eventId === selectedEventId &&
          record.date === date,
      ),
    [db.attendance, currentChurchId, selectedEventId, date],
  )

  useEffect(() => {
    setPresentIds(existing?.presentIds ?? [])
    setNotes(existing?.notes ?? '')
    setSavedId(existing?.id ?? null)
  }, [existing, selectedEventId, date])

  // Al cambiar de iglesia activa, selecciona un evento válido de la nueva iglesia.
  useEffect(() => {
    setDetail(null)
    if (!events.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(events[0]?.id ?? '')
      setDate(events[0]?.date ?? today)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChurchId])

  const absentIds = members.filter((member) => !presentIds.includes(member.id)).map((m) => m.id)
  const attendanceRate = percent(presentIds.length, members.length)

  const toggle = (memberId: string) => {
    if (!manage) return
    setPresentIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    )
  }

  const save = () => {
    if (!selectedEvent) return
    const record: Attendance = {
      id: existing?.id ?? uid('a'),
      churchId: currentChurchId,
      eventId: selectedEvent.id,
      date,
      presentIds,
      absentIds,
      notes: notes.trim(),
      recordedBy: user?.id ?? '',
      recordedAt: new Date().toISOString(),
    }
    mutate((current) => ({
      ...current,
      attendance: existing
        ? current.attendance.map((item) => (item.id === record.id ? record : item))
        : [...current.attendance, record],
    }))
    setSavedId(record.id)
    notify(existing ? 'Lista de asistencia actualizada.' : 'Asistencia registrada correctamente.')
  }

  const weekStart = (() => {
    const base = new Date()
    const offset = (base.getDay() + 6) % 7
    return toISO(addDays(base, -offset))
  })()
  const monthStart = `${today.slice(0, 8)}01`

  const filteredRecords = records.filter((record) => {
    if (historyFilter === 'week') return record.date >= weekStart
    if (historyFilter === 'month') return record.date >= monthStart
    return true
  })

  const exportPeriod = (period: 'semana' | 'mes') => {
    const from = period === 'semana' ? weekStart : monthStart
    const rows = records
      .filter((record) => record.date >= from)
      .map((record) => {
        const event = db.events.find((item) => item.id === record.eventId)
        return [
          record.date,
          event?.title ?? 'Evento eliminado',
          record.presentIds.length,
          record.absentIds.length,
          `${percent(record.presentIds.length, record.presentIds.length + record.absentIds.length)}%`,
        ]
      })
    if (rows.length === 0) {
      notify('No hay asistencias registradas en ese periodo.', 'info')
      return
    }
    downloadCSV(
      `asistencia-${period}-${church.shortName.toLowerCase().replace(/\s+/g, '-')}`,
      [['Fecha', 'Evento', 'Presentes', 'Ausentes', 'Porcentaje'], ...rows],
    )
    notify(`Reporte ${period} exportado.`)
  }

  const filteredSummary = filteredRecords.reduce(
    (acc, record) => {
      acc.present += record.presentIds.length
      acc.absent += record.absentIds.length
      acc.records += 1
      return acc
    },
    { present: 0, absent: 0, records: 0 },
  )

  if (!user) return null

  return (
    <>
      <PageHeader
        eyebrow="RF-03 · Control de asistencia"
        title="Cada presencia cuenta."
        description={`Pasa lista de cultos, reuniones y actividades de ${church.shortName}. Consulta el historial y genera reportes semanales o mensuales.`}
        actions={
          <Link to="/app/reportes?tab=asistencia" className="btn btn--outline btn--sm">
            <FileText size={15} /> Ver reportes
          </Link>
        }
      />

      <div className="attendance-layout">
        <section className="panel attendance-panel">
          <div className="panel__head attendance-panel__head">
            <div>
              <h2 className="panel__title">Pasar lista</h2>
              <p className="panel__subtitle">
                {formatDate(selectedEvent?.date ?? date, { weekday: 'long' })} · Selecciona el
                evento y marca a las personas presentes.
              </p>
            </div>
            {existing && (
              <span className="chip chip--soft">
                <Check size={12} /> Lista guardada
              </span>
            )}
          </div>

          <div className="attendance-controls">
            <label className="field">
              <span>Evento</span>
              <select
                className="select"
                value={selectedEventId}
                onChange={(event) => {
                  setSelectedEventId(event.target.value)
                  const next = events.find((item) => item.id === event.target.value)
                  if (next) setDate(next.date)
                }}
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {formatShortDate(event.date)} · {event.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Fecha</span>
              <input
                className="input"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
          </div>

          <div className="attendance-actions">
            <span className="attendance-actions__count">
              <UserRound size={13} /> {members.length} miembros activos
            </span>
            <div className="toolbar__group">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setPresentIds([])}
                disabled={!manage}
              >
                Limpiar
              </button>
              <button
                type="button"
                className="btn btn--soft btn--sm"
                onClick={() => setPresentIds(members.map((member) => member.id))}
                disabled={!manage}
              >
                <CheckCheck size={14} /> Todos presentes
              </button>
            </div>
          </div>

          <div className="attendance-list">
            {members.map((member) => {
              const isPresent = presentIds.includes(member.id)
              return (
                <button
                  type="button"
                  key={member.id}
                  className={cn('attendance-person', isPresent && 'is-present')}
                  onClick={() => toggle(member.id)}
                  aria-pressed={isPresent}
                  disabled={!manage}
                >
                  <span className={cn('attendance-person__check', isPresent && 'is-checked')}>
                    {isPresent ? <Check size={12} /> : <X size={11} />}
                  </span>
                  <Avatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                  <span className="attendance-person__info">
                    <strong>
                      {member.firstName} {member.lastName}
                    </strong>
                    <span>{member.phone}</span>
                  </span>
                  <span className="attendance-person__state">
                    {isPresent ? 'Presente' : 'Ausente'}
                  </span>
                </button>
              )
            })}
          </div>

          <label className="field attendance-notes">
            <span>Notas de la reunión (opcional)</span>
            <input
              className="input"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observaciones, visitantes o incidencias…"
              disabled={!manage}
            />
          </label>

          <div className="attendance-save">
            <span>
              <strong>{presentIds.length}</strong> presentes · <strong>{absentIds.length}</strong>{' '}
              ausentes
            </span>
            {manage && (
              <button type="button" className="btn btn--primary btn--sm" onClick={save}>
                <ClipboardCheck size={15} /> {existing ? 'Actualizar lista' : 'Guardar asistencia'}
              </button>
            )}
          </div>
        </section>

        <aside className="attendance-aside">
          <section className="attendance-summary">
            <p className="eyebrow">Resumen de la lista</p>
            <div
              className="attendance-ring"
              style={{
                background: `conic-gradient(var(--church-primary) ${attendanceRate}%, var(--cream-2) 0)`,
              }}
            >
              <span>
                <strong>{attendanceRate}%</strong>
                <em>asistencia</em>
              </span>
            </div>
            <div className="attendance-legend">
              <span>
                <i style={{ background: 'var(--church-primary)' }} /> Presentes
                <strong>{presentIds.length}</strong>
              </span>
              <span>
                <i style={{ background: 'var(--cream-2)' }} /> Ausentes
                <strong>{absentIds.length}</strong>
              </span>
            </div>
            <div className="attendance-event-info">
              <span>
                <CalendarCheck2 size={14} />
                {selectedEvent?.title}
              </span>
              <span>
                <Clock size={14} /> {selectedEvent?.time} · {selectedEvent?.place}
              </span>
            </div>
            {savedId && (
              <p className="attendance-summary__note">
                <Check size={12} /> Esta lista ya tiene un registro guardado.
              </p>
            )}
          </section>

          <section className="panel attendance-export">
            <h3>Reportes del periodo</h3>
            <p>Descarga el resumen de asistencias de la semana o del mes en curso.</p>
            <div className="attendance-export__buttons">
              <button type="button" className="btn btn--outline btn--sm" onClick={() => exportPeriod('semana')}>
                <Download size={13} /> Semana
              </button>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => exportPeriod('mes')}>
                <Download size={13} /> Mes
              </button>
            </div>
          </section>
        </aside>
      </div>

      <section className="panel attendance-history">
        <div className="table-toolbar">
          <div>
            <h2 className="panel__title">
              <History size={16} /> Historial de asistencia
            </h2>
            <p className="panel__subtitle">
              {filteredSummary.records} listas · {filteredSummary.present} presencias ·{' '}
              {percent(filteredSummary.present, filteredSummary.present + filteredSummary.absent)}%
              promedio
            </p>
          </div>
          <Segmented
            label="Filtrar historial"
            value={historyFilter}
            onChange={setHistoryFilter}
            options={[
              { value: 'all', label: 'Todo' },
              { value: 'month', label: 'Este mes' },
              { value: 'week', label: 'Esta semana' },
            ]}
          />
        </div>

        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={24} />}
            title="Aún no hay listas en este periodo"
            description="Selecciona un evento, marca a los presentes y guarda la asistencia para comenzar el historial."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Fecha</th>
                  <th>Presentes</th>
                  <th>Ausentes</th>
                  <th>Participación</th>
                  <th>Registró</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const event = db.events.find((item) => item.id === record.eventId)
                  const recordedBy = db.users.find((item) => item.id === record.recordedBy)
                  const rate = percent(
                    record.presentIds.length,
                    record.presentIds.length + record.absentIds.length,
                  )
                  return (
                    <tr key={record.id}>
                      <td>
                        <div className="cell-main">
                          <span className="history-icon">
                            <CalendarCheck2 size={15} />
                          </span>
                          <span>
                            <strong>{event?.title ?? 'Evento no disponible'}</strong>
                            <span>{event?.place ?? '—'}</span>
                          </span>
                        </div>
                      </td>
                      <td>{formatDate(record.date, { day: '2-digit', month: 'short' })}</td>
                      <td>
                        <span className="count-pill count-pill--green">{record.presentIds.length}</span>
                      </td>
                      <td>
                        <span className="count-pill">{record.absentIds.length}</span>
                      </td>
                      <td>
                        <div className="rate-cell">
                          <span className="rate-cell__bar">
                            <span style={{ width: `${rate}%` }} />
                          </span>
                          <strong>{rate}%</strong>
                        </div>
                      </td>
                      <td>{recordedBy?.name.split(' ')[0] ?? 'Sistema'}</td>
                      <td>
                        <div className="cell-actions">
                          <button
                            type="button"
                            className="row-action"
                            title="Ver detalle"
                            onClick={() => setDetail(record)}
                          >
                            <History size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Detalle de asistencia"
        subtitle={
          detail
            ? `${formatDate(detail.date)} · ${detail.presentIds.length} presentes de ${
                detail.presentIds.length + detail.absentIds.length
              }`
            : undefined
        }
        size="lg"
        footer={
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setDetail(null)}>
            Cerrar
          </button>
        }
      >
        {detail && (
          <div className="attendance-detail">
            <div>
              <h3 className="attendance-detail__title">
                <Check size={14} /> Presentes ({detail.presentIds.length})
              </h3>
              <div className="attendance-detail__list">
                {detail.presentIds.map((id) => {
                  const member = db.members.find((item) => item.id === id)
                  if (!member) return null
                  return (
                    <div key={id} className="attendance-detail__person">
                      <Avatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                      <span>
                        {member.firstName} {member.lastName}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 className="attendance-detail__title attendance-detail__title--muted">
                <X size={14} /> Ausentes ({detail.absentIds.length})
              </h3>
              <div className="attendance-detail__list">
                {detail.absentIds.map((id) => {
                  const member = db.members.find((item) => item.id === id)
                  if (!member) return null
                  return (
                    <div key={id} className="attendance-detail__person attendance-detail__person--muted">
                      <Avatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                      <span>
                        {member.firstName} {member.lastName}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            {detail.notes && (
              <div className="attendance-detail__notes">
                <strong>Notas</strong>
                <p>{detail.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarX2,
  Clock,
  MapPin,
  Pencil,
  Plus,
  UserRound,
  XCircle,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { Avatar, PageHeader } from '../components/ui'
import type { ChurchEvent, EventType } from '../types'
import {
  addMonths,
  cn,
  formatDate,
  formatDateLong,
  getMonthGrid,
  todayISO,
  toISO,
  uid,
} from '../lib/utils'

const TYPE_CONFIG: Record<EventType, { label: string; className: string }> = {
  culto: { label: 'Culto', className: 'is-culto' },
  reunion: { label: 'Reunión', className: 'is-reunion' },
  actividad: { label: 'Actividad', className: 'is-actividad' },
  administrativo: { label: 'Administrativo', className: 'is-administrativo' },
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

type EventForm = {
  title: string
  type: EventType
  date: string
  time: string
  place: string
  description: string
  responsibleId: string
  ministryId: string
}

export default function Events() {
  const { db, user, church, currentChurchId, can, mutate } = useStore()
  const { notify } = useToast()
  const manage = can('events.manage')
  const today = todayISO()

  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(today)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ChurchEvent | null>(null)
  const [form, setForm] = useState<EventForm | null>(null)
  const [error, setError] = useState('')
  const [cancelTarget, setCancelTarget] = useState<ChurchEvent | null>(null)

  const members = db.members.filter(
    (member) => member.churchId === currentChurchId && member.active,
  )
  const ministries = db.ministries.filter((ministry) => ministry.churchId === currentChurchId)
  const events = db.events
    .filter((event) => event.churchId === currentChurchId)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const monthEvents = events.filter((event) => {
    const [year, month] = event.date.split('-').map(Number)
    return event.status !== 'cancelado' && year === cursor.getFullYear() && month === cursor.getMonth() + 1
  })

  const cells = getMonthGrid(cursor.getFullYear(), cursor.getMonth())
  const selectedEvents = events
    .filter((event) => event.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time))
  const upcoming = events.filter(
    (event) => event.status === 'programado' && event.date >= today,
  ).length
  const cancelled = events.filter((event) => event.status === 'cancelado').length

  const openNew = (date = selectedDate) => {
    setEditing(null)
    setError('')
    setForm({
      title: '',
      type: 'culto',
      date,
      time: '10:00',
      place: 'Templo principal',
      description: '',
      responsibleId: members[0]?.id ?? '',
      ministryId: '',
    })
    setModalOpen(true)
  }

  const openEdit = (event: ChurchEvent) => {
    setEditing(event)
    setError('')
    setForm({
      title: event.title,
      type: event.type,
      date: event.date,
      time: event.time,
      place: event.place,
      description: event.description,
      responsibleId: event.responsibleId,
      ministryId: event.ministryId ?? '',
    })
    setModalOpen(true)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form) return
    if (!form.title.trim() || !form.date || !form.time || !form.place.trim()) {
      setError('Completa el título, la fecha, la hora y el lugar del evento.')
      return
    }
    const item: ChurchEvent = {
      id: editing?.id ?? uid('e'),
      churchId: currentChurchId,
      title: form.title.trim(),
      type: form.type,
      date: form.date,
      time: form.time,
      place: form.place.trim(),
      description: form.description.trim(),
      responsibleId: form.responsibleId || members[0]?.id || '',
      ministryId: form.ministryId || undefined,
      status: editing?.status ?? 'programado',
    }
    mutate((current) => ({
      ...current,
      events: editing
        ? current.events.map((existing) => (existing.id === item.id ? item : existing))
        : [...current.events, item],
    }))
    setSelectedDate(item.date)
    const [year, month] = item.date.split('-').map(Number)
    setCursor(new Date(year, month - 1, 1))
    setModalOpen(false)
    notify(editing ? 'Evento actualizado correctamente.' : 'Evento creado y agregado al calendario.')
  }

  const cancelEvent = () => {
    if (!cancelTarget) return
    mutate((current) => ({
      ...current,
      events: current.events.map((event) =>
        event.id === cancelTarget.id ? { ...event, status: 'cancelado' } : event,
      ),
    }))
    notify(`«${cancelTarget.title}» fue cancelado. El registro se conserva.`, 'info')
    setCancelTarget(null)
  }

  if (!user) return null

  const monthLabel =
    new Intl.DateTimeFormat('es-MX', {
      month: 'long',
      year: 'numeric',
    }).format(cursor).replace(/^./, (letter) => letter.toUpperCase())

  return (
    <>
      <PageHeader
        eyebrow="RF-04 · Gestión de eventos"
        title="El calendario de la comunidad."
        description={`Organiza cultos, reuniones y actividades de ${church.shortName}. Asigna responsables, modifica horarios y cancela sin perder el registro.`}
        actions={
          manage ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={() => openNew(today)}>
              <Plus size={15} /> Nuevo evento
            </button>
          ) : undefined
        }
      />

      <div className="events-summary">
        <span>
          <CalendarDays size={14} /> <strong>{upcoming}</strong> próximos
        </span>
        <span>
          <Clock size={14} /> <strong>{monthEvents.length}</strong> este mes
        </span>
        <span>
          <CalendarX2 size={14} /> <strong>{cancelled}</strong> cancelados
        </span>
        <span className="events-summary__date">
          Hoy es {formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      <div className="events-layout">
        <section className="panel calendar-panel">
          <div className="calendar-head">
            <div>
              <p className="eyebrow">Calendario mensual</p>
              <h2 className="calendar-title">{monthLabel}</h2>
            </div>
            <div className="calendar-nav">
              <button
                type="button"
                className="round-btn"
                onClick={() => setCursor(addMonths(cursor, -1))}
                aria-label="Mes anterior"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => {
                  const now = new Date()
                  setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
                  setSelectedDate(toISO(now))
                }}
              >
                Hoy
              </button>
              <button
                type="button"
                className="round-btn"
                onClick={() => setCursor(addMonths(cursor, 1))}
                aria-label="Mes siguiente"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="calendar-weekdays">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {cells.map((cell) => {
              const dayEvents = events
                .filter((event) => event.date === cell.iso && event.status !== 'cancelado')
                .sort((a, b) => a.time.localeCompare(b.time))
              return (
                <button
                  type="button"
                  key={cell.iso}
                  className={cn(
                    'calendar-day',
                    !cell.inMonth && 'is-outside',
                    cell.iso === today && 'is-today',
                    cell.iso === selectedDate && 'is-selected',
                  )}
                  onClick={() => setSelectedDate(cell.iso)}
                >
                  <span className="calendar-day__number">{cell.date.getDate()}</span>
                  <span className="calendar-day__events">
                    {dayEvents.slice(0, 2).map((event) => (
                      <span
                        key={event.id}
                        className={cn('calendar-event', TYPE_CONFIG[event.type].className)}
                      >
                        <em>{event.time}</em> {event.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="calendar-more">+{dayEvents.length - 2} más</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <aside className="panel events-agenda">
          <div className="events-agenda__head">
            <div>
              <p className="eyebrow">Agenda del día</p>
              <h2>{formatDateLong(selectedDate)}</h2>
            </div>
            {manage && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => openNew(selectedDate)}
                aria-label="Agregar evento en este día"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          <div className="events-agenda__list">
            {selectedEvents.map((event) => {
              const responsible = db.members.find((member) => member.id === event.responsibleId)
              const ministry = db.ministries.find((item) => item.id === event.ministryId)
              return (
                <article
                  key={event.id}
                  className={cn('agenda-event', event.status === 'cancelado' && 'is-cancelled')}
                >
                  <div className="agenda-event__top">
                    <span className={cn('event-type', TYPE_CONFIG[event.type].className)}>
                      {TYPE_CONFIG[event.type].label}
                    </span>
                    <span className="agenda-event__time">
                      <Clock size={12} /> {event.time}
                    </span>
                    {event.status === 'cancelado' && <span className="chip chip--outline">Cancelado</span>}
                  </div>
                  <h3>{event.title}</h3>
                  <p className="agenda-event__place">
                    <MapPin size={12} /> {event.place}
                  </p>
                  {event.description && <p className="agenda-event__desc">{event.description}</p>}
                  <div className="agenda-event__foot">
                    <span className="agenda-event__responsible">
                      <Avatar
                        name={responsible ? `${responsible.firstName} ${responsible.lastName}` : 'Sin responsable'}
                        size="sm"
                      />
                      <span>
                        <em>Responsable</em>
                        <strong>
                          {responsible
                            ? `${responsible.firstName} ${responsible.lastName}`
                            : 'Sin asignar'}
                        </strong>
                      </span>
                    </span>
                    {ministry && <span className="chip chip--outline">{ministry.name}</span>}
                  </div>
                  {manage && event.status !== 'cancelado' && (
                    <div className="agenda-event__actions">
                      <button type="button" className="link-btn" onClick={() => openEdit(event)}>
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        type="button"
                        className="link-btn link-btn--danger"
                        onClick={() => setCancelTarget(event)}
                      >
                        <XCircle size={12} /> Cancelar
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
            {selectedEvents.length === 0 && (
              <div className="agenda-empty">
                <CalendarDays size={26} />
                <h3>Día sin eventos</h3>
                <p>No hay actividades programadas para esta fecha.</p>
                {manage && (
                  <button type="button" className="btn btn--soft btn--sm" onClick={() => openNew(selectedDate)}>
                    <Plus size={14} /> Agregar evento
                  </button>
                )}
              </div>
            )}
          </div>

          {selectedEvents.length > 0 && (
            <div className="agenda-footer">
              <span>
                <UserRound size={13} /> {selectedEvents.length} evento
                {selectedEvents.length === 1 ? '' : 's'} este día
              </span>
              <button type="button" className="link-btn" onClick={() => openNew(selectedDate)} disabled={!manage}>
                <Plus size={12} /> Agregar
              </button>
            </div>
          )}
        </aside>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar evento' : 'Nuevo evento'}
        subtitle={
          editing
            ? 'Los cambios se reflejan de inmediato en el calendario.'
            : 'Registra un evento religioso o administrativo.'
        }
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="event-form" className="btn btn--primary btn--sm">
              {editing ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </>
        }
      >
        {form && (
          <form id="event-form" className="form-grid" onSubmit={submit}>
            {error && (
              <div className="form-alert field--full" role="alert">
                {error}
              </div>
            )}
            <label className="field field--full">
              <span>Título del evento <em>*</em></span>
              <input
                className="input"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Culto de celebración"
                required
              />
            </label>

            <div className="field field--full">
              <span>Tipo de evento</span>
              <div className="radio-row">
                {(Object.keys(TYPE_CONFIG) as EventType[]).map((type) => (
                  <label className="radio-pill" key={type}>
                    <input
                      type="radio"
                      name="event-type"
                      checked={form.type === type}
                      onChange={() => setForm({ ...form, type })}
                    />
                    <span>{TYPE_CONFIG[type].label}</span>
                  </label>
                ))}
              </div>
            </div>

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
              <span>Hora <em>*</em></span>
              <input
                className="input"
                type="time"
                value={form.time}
                onChange={(event) => setForm({ ...form, time: event.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Lugar <em>*</em></span>
              <input
                className="input"
                value={form.place}
                onChange={(event) => setForm({ ...form, place: event.target.value })}
                placeholder="Templo principal"
                required
              />
            </label>
            <label className="field">
              <span>Ministerio organizador</span>
              <select
                className="select"
                value={form.ministryId}
                onChange={(event) => setForm({ ...form, ministryId: event.target.value })}
              >
                <option value="">Sin ministerio específico</option>
                {ministries.map((ministry) => (
                  <option key={ministry.id} value={ministry.id}>
                    {ministry.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Responsable <em>*</em></span>
              <select
                className="select"
                value={form.responsibleId}
                onChange={(event) => setForm({ ...form, responsibleId: event.target.value })}
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field--full">
              <span>Descripción</span>
              <textarea
                className="textarea"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Propósito, indicaciones o información para la comunidad…"
              />
            </label>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancelar evento"
        subtitle="El evento dejará de mostrarse como activo, pero conservará su historial."
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCancelTarget(null)}>
              Conservar evento
            </button>
            <button type="button" className="btn btn--danger btn--sm" onClick={cancelEvent}>
              <XCircle size={14} /> Sí, cancelar
            </button>
          </>
        }
      >
        <p className="confirm-text">
          ¿Deseas cancelar <strong>«{cancelTarget?.title}»</strong> del{' '}
          {cancelTarget ? formatDate(cancelTarget.date, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}?
        </p>
      </Modal>
    </>
  )
}

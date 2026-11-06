import { useState, type CSSProperties, type FormEvent } from 'react'
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  HeartHandshake,
  MapPin,
  Pencil,
  Plus,
  UserPlus,
  Users,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import {
  Avatar,
  EmptyState,
  PageHeader,
  SearchField,
  StatusPill,
} from '../components/ui'
import type { Ministry } from '../types'
import { cn, formatDate, formatMonthShort, formatShortDate, normalize, todayISO, uid } from '../lib/utils'

const PALETTE = [
  '#B4553B',
  '#64714A',
  '#C99A4B',
  '#44557C',
  '#7B3C48',
  '#3F7A5B',
  '#8A5A2B',
  '#5C4B7A',
]

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

type MinistryForm = {
  name: string
  description: string
  color: string
  coordinatorId: string
  meetingDay: string
  meetingTime: string
}

export default function Ministries() {
  const { db, user, church, currentChurchId, can, mutate } = useStore()
  const { notify } = useToast()
  const manage = can('ministries.manage')
  const today = todayISO()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ministry | null>(null)
  const [form, setForm] = useState<MinistryForm | null>(null)
  const [error, setError] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [linkId, setLinkId] = useState<string | null>(null)
  const [linkSelected, setLinkSelected] = useState<string[]>([])
  const [linkQuery, setLinkQuery] = useState('')

  const members = db.members.filter((member) => member.churchId === currentChurchId)
  const activeMembers = members.filter((member) => member.active)
  const ministries = db.ministries.filter((ministry) => ministry.churchId === currentChurchId)
  const events = db.events.filter(
    (event) => event.churchId === currentChurchId && event.status === 'programado' && event.date >= today,
  )

  const detail = ministries.find((ministry) => ministry.id === detailId) ?? null
  const linkTarget = ministries.find((ministry) => ministry.id === linkId) ?? null
  const totalLinks = ministries.reduce((sum, ministry) => sum + ministry.memberIds.length, 0)

  const openNew = () => {
    setEditing(null)
    setError('')
    setForm({
      name: '',
      description: '',
      color: PALETTE[ministries.length % PALETTE.length],
      coordinatorId: activeMembers[0]?.id ?? '',
      meetingDay: 'Domingo',
      meetingTime: '10:00',
    })
    setFormOpen(true)
  }

  const openEdit = (ministry: Ministry) => {
    setEditing(ministry)
    setError('')
    setForm({
      name: ministry.name,
      description: ministry.description,
      color: ministry.color,
      coordinatorId: ministry.coordinatorId,
      meetingDay: ministry.meetingDay,
      meetingTime: ministry.meetingTime,
    })
    setDetailId(null)
    setFormOpen(true)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form) return
    if (!form.name.trim()) return setError('Escribe el nombre del ministerio.')
    if (!form.coordinatorId) return setError('Selecciona un coordinador.')
    const id = editing?.id ?? uid('min')
    const ministry: Ministry = {
      id,
      churchId: currentChurchId,
      name: form.name.trim(),
      description: form.description.trim(),
      color: form.color,
      coordinatorId: form.coordinatorId,
      memberIds: editing
        ? Array.from(new Set([...editing.memberIds, form.coordinatorId]))
        : [form.coordinatorId],
      meetingDay: form.meetingDay,
      meetingTime: form.meetingTime,
    }
    mutate((current) => ({
      ...current,
      ministries: editing
        ? current.ministries.map((item) => (item.id === ministry.id ? ministry : item))
        : [...current.ministries, ministry],
      members: current.members.map((member) =>
        member.id === ministry.coordinatorId && !member.ministryIds.includes(ministry.id)
          ? { ...member, ministryIds: [...member.ministryIds, ministry.id] }
          : member,
      ),
    }))
    setFormOpen(false)
    notify(editing ? 'Ministerio actualizado.' : 'Ministerio registrado correctamente.')
  }

  const openLink = (ministry: Ministry) => {
    setLinkId(ministry.id)
    setLinkSelected(ministry.memberIds)
    setLinkQuery('')
    setDetailId(null)
  }

  const saveLinks = () => {
    if (!linkTarget) return
    const coordinatorId = linkTarget.coordinatorId
    const selected = Array.from(new Set([...linkSelected, coordinatorId]))
    mutate((current) => ({
      ...current,
      ministries: current.ministries.map((ministry) =>
        ministry.id === linkTarget.id ? { ...ministry, memberIds: selected } : ministry,
      ),
      members: current.members.map((member) => {
        const shouldBelong = selected.includes(member.id)
        const belongs = member.ministryIds.includes(linkTarget.id)
        if (shouldBelong && !belongs) {
          return { ...member, ministryIds: [...member.ministryIds, linkTarget.id] }
        }
        if (!shouldBelong && belongs) {
          return {
            ...member,
            ministryIds: member.ministryIds.filter((id) => id !== linkTarget.id),
          }
        }
        return member
      }),
    }))
    notify(`${selected.length} integrantes vinculados a ${linkTarget.name}.`)
    setLinkId(null)
  }

  const toggleLink = (memberId: string) => {
    setLinkSelected((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    )
  }

  const linkMembers = members
    .filter((member) => {
      const q = normalize(linkQuery.trim())
      if (!q) return true
      return normalize(`${member.firstName} ${member.lastName} ${member.email}`).includes(q)
    })
    .sort((a, b) => Number(b.active) - Number(a.active) || a.firstName.localeCompare(b.firstName))

  if (!user) return null

  return (
    <>
      <PageHeader
        eyebrow="RF-05 · Administración de ministerios"
        title="Equipos que sostienen la vida."
        description={`Música, jóvenes, niños, enseñanza y servicio. Organiza los equipos de ${church.shortName}, asigna coordinadores y consulta sus integrantes y actividades.`}
        actions={
          manage ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={openNew}>
              <Plus size={15} /> Nuevo ministerio
            </button>
          ) : undefined
        }
      />

      <div className="ministries-summary">
        <span>
          <HeartHandshake size={15} /> <strong>{ministries.length}</strong> ministerios
        </span>
        <span>
          <Users size={15} /> <strong>{totalLinks}</strong> participaciones
        </span>
        <span>
          <CalendarDays size={15} /> <strong>{events.filter((event) => event.ministryId).length}</strong>{' '}
          actividades próximas
        </span>
        <span className="ministries-summary__verse">
          «Cada uno ponga al servicio de los demás el don que haya recibido.» 1 P 4,10
        </span>
      </div>

      {ministries.length === 0 ? (
        <section className="panel">
          <EmptyState
            icon={<HeartHandshake size={24} />}
            title="Aún no hay ministerios"
            description="Crea el primer equipo de servicio y comienza a vincular a los miembros de tu comunidad."
            action={
              manage ? (
                <button type="button" className="btn btn--primary btn--sm" onClick={openNew}>
                  <Plus size={15} /> Crear ministerio
                </button>
              ) : undefined
            }
          />
        </section>
      ) : (
        <div className="ministry-grid">
          {ministries.map((ministry) => {
            const coordinator = members.find((member) => member.id === ministry.coordinatorId)
            const ministryMembers = members.filter((member) =>
              ministry.memberIds.includes(member.id),
            )
            const nextEvent = events
              .filter((event) => event.ministryId === ministry.id)
              .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]
            return (
              <article
                key={ministry.id}
                className="ministry-card"
                style={{ '--ministry-color': ministry.color } as CSSProperties}
              >
                <div className="ministry-card__top">
                  <span className="ministry-card__icon">
                    <HeartHandshake size={19} />
                  </span>
                  <span className="ministry-card__count">
                    <Users size={12} /> {ministry.memberIds.length} integrantes
                  </span>
                </div>
                <div className="ministry-card__body">
                  <h2>{ministry.name}</h2>
                  <p>{ministry.description}</p>
                </div>
                <div className="ministry-card__coordinator">
                  <Avatar
                    name={coordinator ? `${coordinator.firstName} ${coordinator.lastName}` : 'Sin coordinador'}
                    size="sm"
                  />
                  <span>
                    <em>Coordina</em>
                    <strong>
                      {coordinator
                        ? `${coordinator.firstName} ${coordinator.lastName}`
                        : 'Sin asignar'}
                    </strong>
                  </span>
                </div>
                <div className="ministry-card__meta">
                  <span>
                    <Clock size={12} /> {ministry.meetingDay} · {ministry.meetingTime}
                  </span>
                  <span className="ministry-card__avatars">
                    <span className="avatar-row">
                      {ministryMembers.slice(0, 3).map((member) => (
                        <Avatar
                          key={member.id}
                          name={`${member.firstName} ${member.lastName}`}
                          size="sm"
                        />
                      ))}
                    </span>
                    {ministryMembers.length > 3 && (
                      <em>+{ministryMembers.length - 3}</em>
                    )}
                  </span>
                </div>
                {nextEvent ? (
                  <div className="ministry-card__next">
                    <CalendarDays size={13} />
                    <span>
                      <strong>{nextEvent.title}</strong>
                      <em>
                        {formatShortDate(nextEvent.date)} · {nextEvent.time}
                      </em>
                    </span>
                  </div>
                ) : (
                  <div className="ministry-card__next ministry-card__next--empty">
                    <CalendarDays size={13} /> Sin actividades próximas
                  </div>
                )}
                <div className="ministry-card__actions">
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={() => setDetailId(ministry.id)}
                  >
                    Ver equipo <ArrowUpRight size={13} />
                  </button>
                  {manage && (
                    <div className="ministry-card__tools">
                      <button
                        type="button"
                        className="row-action"
                        title="Editar ministerio"
                        onClick={() => openEdit(ministry)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="row-action"
                        title="Vincular integrantes"
                        onClick={() => openLink(ministry)}
                      >
                        <UserPlus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Editar ministerio' : 'Nuevo ministerio'}
        subtitle="Define el equipo, su coordinador y su ritmo de encuentro."
        size="md"
        footer={
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="ministry-form" className="btn btn--primary btn--sm">
              {editing ? 'Guardar cambios' : 'Crear ministerio'}
            </button>
          </>
        }
      >
        {form && (
          <form id="ministry-form" className="form-grid" onSubmit={submit}>
            {error && (
              <div className="form-alert field--full" role="alert">
                {error}
              </div>
            )}
            <label className="field field--full">
              <span>Nombre del ministerio <em>*</em></span>
              <input
                className="input"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Alabanza y adoración"
                required
              />
            </label>
            <label className="field field--full">
              <span>Descripción</span>
              <textarea
                className="textarea"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="¿Qué hace este equipo y a quién sirve?"
              />
            </label>
            <label className="field">
              <span>Coordinador <em>*</em></span>
              <select
                className="select"
                value={form.coordinatorId}
                onChange={(event) => setForm({ ...form, coordinatorId: event.target.value })}
              >
                {activeMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>Color del ministerio</span>
              <div className="color-picker">
                {PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn('color-swatch', form.color === color && 'is-active')}
                    style={{ background: color }}
                    onClick={() => setForm({ ...form, color })}
                    aria-label={`Color ${color}`}
                    aria-pressed={form.color === color}
                  />
                ))}
              </div>
            </div>
            <label className="field">
              <span>Día habitual de reunión</span>
              <select
                className="select"
                value={form.meetingDay}
                onChange={(event) => setForm({ ...form, meetingDay: event.target.value })}
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Hora de reunión</span>
              <input
                className="input"
                type="time"
                value={form.meetingTime}
                onChange={(event) => setForm({ ...form, meetingTime: event.target.value })}
              />
            </label>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title={detail?.name ?? 'Ministerio'}
        subtitle={detail?.description}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDetailId(null)}>
              Cerrar
            </button>
            {manage && detail && (
              <>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => openEdit(detail)}>
                  <Pencil size={13} /> Editar
                </button>
                <button type="button" className="btn btn--primary btn--sm" onClick={() => openLink(detail)}>
                  <UserPlus size={13} /> Gestionar integrantes
                </button>
              </>
            )}
          </>
        }
      >
        {detail && (
          <div className="ministry-detail">
            <div className="ministry-detail__meta">
              <span>
                <Clock size={14} /> {detail.meetingDay} · {detail.meetingTime}
              </span>
              <span>
                <Users size={14} /> {detail.memberIds.length} integrantes
              </span>
              <span>
                <MapPin size={14} /> {church.shortName}
              </span>
            </div>
            <div className="ministry-detail__grid">
              <div>
                <h3 className="ministry-detail__title">Integrantes</h3>
                <div className="ministry-detail__members">
                  {members
                    .filter((member) => detail.memberIds.includes(member.id))
                    .sort((a, b) => Number(b.active) - Number(a.active))
                    .map((member) => (
                      <div className="ministry-detail__member" key={member.id}>
                        <Avatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                        <span>
                          <strong>
                            {member.firstName} {member.lastName}
                          </strong>
                          <em>{member.email}</em>
                        </span>
                        {member.id === detail.coordinatorId && <span className="chip chip--gold">Coordina</span>}
                        <StatusPill active={member.active} />
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="ministry-detail__title">Actividades próximas</h3>
                <div className="ministry-detail__events">
                  {events
                    .filter((event) => event.ministryId === detail.id)
                    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                    .map((event) => (
                      <div className="ministry-detail__event" key={event.id}>
                        <span className="mini-event__date">
                          <strong>{event.date.slice(8, 10)}</strong>
                          <em>{formatMonthShort(event.date)}</em>
                        </span>
                        <span>
                          <strong>{event.title}</strong>
                          <em>
                            {event.time} · {event.place}
                          </em>
                        </span>
                      </div>
                    ))}
                  {events.filter((event) => event.ministryId === detail.id).length === 0 && (
                    <p className="table-empty">No hay actividades programadas.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(linkTarget)}
        onClose={() => setLinkId(null)}
        title="Vincular integrantes"
        subtitle={
          linkTarget
            ? `Selecciona quiénes forman parte de ${linkTarget.name}. El coordinador siempre se incluye.`
            : undefined
        }
        size="lg"
        footer={
          <>
            <span className="modal__footer-count">{linkSelected.length} seleccionados</span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setLinkId(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn--primary btn--sm" onClick={saveLinks}>
              Guardar integrantes
            </button>
          </>
        }
      >
        <div className="link-members">
          <SearchField value={linkQuery} onChange={setLinkQuery} placeholder="Buscar miembro…" />
          <div className="link-members__list">
            {linkMembers.map((member) => {
              const checked = linkSelected.includes(member.id)
              const isCoordinator = member.id === linkTarget?.coordinatorId
              return (
                <button
                  type="button"
                  key={member.id}
                  className={cn('link-member', checked && 'is-checked')}
                  onClick={() => toggleLink(member.id)}
                  aria-pressed={checked}
                >
                  <span className={cn('link-member__check', checked && 'is-checked')}>
                    {checked && <span className="link-member__tick" />}
                  </span>
                  <Avatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                  <span className="link-member__info">
                    <strong>
                      {member.firstName} {member.lastName}
                    </strong>
                    <em>{member.email}</em>
                  </span>
                  {!member.active && <span className="chip chip--outline">Inactivo</span>}
                  {isCoordinator && <span className="chip chip--gold">Coordinador</span>}
                </button>
              )
            })}
          </div>
        </div>
      </Modal>
    </>
  )
}

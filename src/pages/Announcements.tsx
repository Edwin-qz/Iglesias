import { useMemo, useState, type FormEvent } from 'react'
import {
  CalendarDays,
  Clock,
  MapPin,
  Megaphone,
  Pencil,
  Pin,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { Avatar, EmptyState, PageHeader } from '../components/ui'
import type { Announcement } from '../types'
import {
  cn,
  formatDate,
  formatMonthShort,
  formatShortDate,
  todayISO,
  uid,
} from '../lib/utils'

const CATEGORY_LABELS: Record<Announcement['category'], string> = {
  general: 'General',
  evento: 'Evento',
  servicio: 'Servicio',
  urgente: 'Urgente',
}

type AnnouncementForm = {
  title: string
  body: string
  category: Announcement['category']
  publishedAt: string
  pinned: boolean
}

export default function Announcements() {
  const { db, user, church, currentChurchId, can, mutate } = useStore()
  const { notify } = useToast()
  const manage = can('announcements.manage')
  const today = todayISO()

  const [filter, setFilter] = useState<'all' | Announcement['category']>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState<AnnouncementForm | null>(null)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)

  const announcements = db.announcements
    .filter((announcement) => announcement.churchId === currentChurchId)
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt),
    )
  const filtered = useMemo(
    () =>
      filter === 'all'
        ? announcements
        : announcements.filter((announcement) => announcement.category === filter),
    [announcements, filter],
  )

  const upcoming = db.events
    .filter(
      (event) =>
        event.churchId === currentChurchId && event.status === 'programado' && event.date >= today,
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 5)

  const counts = {
    all: announcements.length,
    general: announcements.filter((item) => item.category === 'general').length,
    evento: announcements.filter((item) => item.category === 'evento').length,
    servicio: announcements.filter((item) => item.category === 'servicio').length,
    urgente: announcements.filter((item) => item.category === 'urgente').length,
  }

  const openNew = () => {
    setEditing(null)
    setError('')
    setForm({
      title: '',
      body: '',
      category: 'general',
      publishedAt: today,
      pinned: false,
    })
    setModalOpen(true)
  }

  const openEdit = (announcement: Announcement) => {
    setEditing(announcement)
    setError('')
    setForm({
      title: announcement.title,
      body: announcement.body,
      category: announcement.category,
      publishedAt: announcement.publishedAt,
      pinned: announcement.pinned,
    })
    setModalOpen(true)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form) return
    if (!form.title.trim() || !form.body.trim()) {
      setError('El título y el contenido del anuncio son obligatorios.')
      return
    }
    const announcement: Announcement = {
      id: editing?.id ?? uid('n'),
      churchId: currentChurchId,
      title: form.title.trim(),
      body: form.body.trim(),
      category: form.category,
      publishedAt: form.publishedAt || today,
      pinned: form.pinned,
      authorId: editing?.authorId ?? user?.id ?? '',
    }
    mutate((current) => ({
      ...current,
      announcements: editing
        ? current.announcements.map((item) =>
            item.id === announcement.id ? announcement : item,
          )
        : [...current.announcements, announcement],
    }))
    setModalOpen(false)
    notify(editing ? 'Anuncio actualizado.' : 'Anuncio publicado para la comunidad.')
  }

  const remove = () => {
    if (!deleteTarget) return
    mutate((current) => ({
      ...current,
      announcements: current.announcements.filter((item) => item.id !== deleteTarget.id),
    }))
    notify('Anuncio eliminado.', 'info')
    setDeleteTarget(null)
  }

  const togglePin = (announcement: Announcement) => {
    mutate((current) => ({
      ...current,
      announcements: current.announcements.map((item) =>
        item.id === announcement.id ? { ...item, pinned: !item.pinned } : item,
      ),
    }))
    notify(announcement.pinned ? 'Anuncio desafijado.' : 'Anuncio fijado en la parte superior.')
  }

  if (!user) return null

  return (
    <>
      <PageHeader
        eyebrow="RF-07 · Comunicados y anuncios"
        title="Lo que la comunidad necesita saber."
        description={`Publica avisos, edita comunicados y mantén visible lo importante para ${church.shortName}. Los anuncios fijados aparecen primero.`}
        actions={
          manage ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={openNew}>
              <Plus size={15} /> Publicar anuncio
            </button>
          ) : undefined
        }
      />

      <div className="announcements-layout">
        <div className="announcements-main">
          <div className="filter-chips">
            <button
              type="button"
              className={cn('filter-chip', filter === 'all' && 'is-active')}
              onClick={() => setFilter('all')}
            >
              Todos <span>{counts.all}</span>
            </button>
            {(Object.keys(CATEGORY_LABELS) as Announcement['category'][]).map((category) => (
              <button
                key={category}
                type="button"
                className={cn(
                  'filter-chip',
                  `filter-chip--${category}`,
                  filter === category && 'is-active',
                )}
                onClick={() => setFilter(category)}
              >
                {CATEGORY_LABELS[category]} <span>{counts[category]}</span>
              </button>
            ))}
          </div>

          <div className="announcement-feed">
            {filtered.map((announcement) => {
              const author = db.users.find((item) => item.id === announcement.authorId)
              return (
                <article
                  key={announcement.id}
                  className={cn('announcement-card', announcement.pinned && 'is-pinned')}
                >
                  <div className="announcement-card__head">
                    <div className="announcement-card__tags">
                      <span className={`announcement-tag announcement-tag--${announcement.category}`}>
                        {CATEGORY_LABELS[announcement.category]}
                      </span>
                      {announcement.pinned && (
                        <span className="chip chip--gold">
                          <Pin size={10} /> Fijado
                        </span>
                      )}
                    </div>
                    <time dateTime={announcement.publishedAt}>
                      {formatDate(announcement.publishedAt, { month: 'short' })}
                    </time>
                  </div>
                  <h2>{announcement.title}</h2>
                  <p className="announcement-card__body">{announcement.body}</p>
                  <div className="announcement-card__foot">
                    <span className="announcement-card__author">
                      <Avatar name={author?.name ?? 'Casa Viva'} size="sm" />
                      <span>
                        <strong>{author?.name ?? 'Casa Viva'}</strong>
                        <em>Publicado · {formatShortDate(announcement.publishedAt)}</em>
                      </span>
                    </span>
                    {manage && (
                      <div className="announcement-card__actions">
                        <button
                          type="button"
                          className={cn('row-action', announcement.pinned && 'is-pinned')}
                          title={announcement.pinned ? 'Desfijar anuncio' : 'Fijar anuncio'}
                          onClick={() => togglePin(announcement)}
                        >
                          <Pin size={14} />
                        </button>
                        <button
                          type="button"
                          className="row-action"
                          title="Editar anuncio"
                          onClick={() => openEdit(announcement)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="row-action row-action--danger"
                          title="Eliminar anuncio"
                          onClick={() => setDeleteTarget(announcement)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
            {filtered.length === 0 && (
              <section className="panel">
                <EmptyState
                  icon={<Megaphone size={24} />}
                  title={filter === 'all' ? 'Aún no hay anuncios' : 'No hay anuncios en esta categoría'}
                  description="Publica el primer comunicado para mantener informada a tu comunidad."
                  action={
                    manage ? (
                      <button type="button" className="btn btn--primary btn--sm" onClick={openNew}>
                        <Plus size={15} /> Publicar anuncio
                      </button>
                    ) : undefined
                  }
                />
              </section>
            )}
          </div>
        </div>

        <aside className="announcements-aside">
          <section className="panel upcoming-mini">
            <div className="panel__head">
              <div>
                <h2 className="panel__title">Próximos eventos</h2>
                <p className="panel__subtitle">Para compartir con la comunidad</p>
              </div>
              <CalendarDays size={17} className="muted" />
            </div>
            <div className="upcoming-mini__list">
              {upcoming.map((event) => (
                <div className="upcoming-mini__item" key={event.id}>
                  <span className="mini-event__date">
                    <strong>{event.date.slice(8, 10)}</strong>
                    <em>{formatMonthShort(event.date)}</em>
                  </span>
                  <span>
                    <strong>{event.title}</strong>
                    <em>
                      <Clock size={10} /> {event.time} · {event.place}
                    </em>
                  </span>
                </div>
              ))}
              {upcoming.length === 0 && (
                <p className="table-empty">No hay eventos próximos.</p>
              )}
            </div>
          </section>

          <section className="announce-tip">
            <span className="announce-tip__icon">
              <Megaphone size={18} />
            </span>
            <h3>Un buen anuncio cuida a quien lo lee.</h3>
            <p>
              Escribe claro, incluye fechas y lugares, y evita publicar información sensible. Fija
              solo lo verdaderamente importante.
            </p>
            <div className="announce-tip__meta">
              <span>
                <UserRound size={12} /> {announcements.length} anuncios publicados
              </span>
              <span>
                <MapPin size={12} /> {church.shortName}
              </span>
            </div>
          </section>
        </aside>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar anuncio' : 'Publicar anuncio'}
        subtitle="Los miembros verán este comunicado en su panel."
        size="md"
        footer={
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="announcement-form" className="btn btn--primary btn--sm">
              {editing ? 'Guardar cambios' : 'Publicar anuncio'}
            </button>
          </>
        }
      >
        {form && (
          <form id="announcement-form" className="form-grid" onSubmit={submit}>
            {error && (
              <div className="form-alert field--full" role="alert">
                {error}
              </div>
            )}
            <label className="field field--full">
              <span>Título <em>*</em></span>
              <input
                className="input"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Retiro de comunidad: inscripciones abiertas"
                required
              />
            </label>
            <label className="field field--full">
              <span>Contenido <em>*</em></span>
              <textarea
                className="textarea announcement-textarea"
                value={form.body}
                onChange={(event) => setForm({ ...form, body: event.target.value })}
                placeholder="Explica el anuncio con claridad: qué, cuándo, dónde y a quién contactar…"
                required
              />
            </label>
            <label className="field">
              <span>Categoría</span>
              <select
                className="select"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value as Announcement['category'] })
                }
              >
                {(Object.keys(CATEGORY_LABELS) as Announcement['category'][]).map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Fecha de publicación</span>
              <input
                className="input"
                type="date"
                value={form.publishedAt}
                onChange={(event) => setForm({ ...form, publishedAt: event.target.value })}
              />
            </label>
            <div className="field field--full">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(event) => setForm({ ...form, pinned: event.target.checked })}
                />
                <span className="switch__track" />
                Fijar en la parte superior del tablón
              </label>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar anuncio"
        subtitle="Esta acción no se puede deshacer."
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDeleteTarget(null)}>
              Conservar
            </button>
            <button type="button" className="btn btn--danger btn--sm" onClick={remove}>
              <Trash2 size={14} /> Eliminar
            </button>
          </>
        }
      >
        <p className="confirm-text">
          ¿Deseas eliminar <strong>«{deleteTarget?.title}»</strong>? El comunicado dejará de estar
          visible para la comunidad.
        </p>
      </Modal>
    </>
  )
}

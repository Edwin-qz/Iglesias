import { useMemo, useState, type FormEvent } from 'react'
import {
  CalendarDays,
  Mail,
  Pencil,
  Phone,
  Plus,
  UserCheck,
  UserRound,
  UserX,
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
  Segmented,
  StatusPill,
} from '../components/ui'
import type { Member } from '../types'
import { formatDate, normalize, todayISO, uid } from '../lib/utils'

type Filter = 'all' | 'active' | 'inactive'

type MemberForm = {
  firstName: string
  lastName: string
  phone: string
  email: string
  birthDate: string
  joinedAt: string
  address: string
  notes: string
}

const EMPTY_FORM: MemberForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  birthDate: '',
  joinedAt: todayISO(),
  address: '',
  notes: '',
}

export default function Members() {
  const { db, user, church, currentChurchId, can, mutate } = useStore()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('active')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [confirmMember, setConfirmMember] = useState<Member | null>(null)

  const manage = can('members.manage')
  const members = db.members.filter((member) => member.churchId === currentChurchId)
  const ministries = db.ministries.filter((ministry) => ministry.churchId === currentChurchId)
  const activeCount = members.filter((member) => member.active).length
  const inactiveCount = members.length - activeCount

  const visibleMembers = useMemo(() => {
    const q = normalize(query.trim())
    return members
      .filter((member) => {
        if (filter === 'active' && !member.active) return false
        if (filter === 'inactive' && member.active) return false
        if (!q) return true
        const haystack = normalize(
          `${member.firstName} ${member.lastName} ${member.email} ${member.phone}`,
        )
        return haystack.includes(q)
      })
      .sort((a, b) => a.firstName.localeCompare(b.firstName))
  }, [members, query, filter])

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, joinedAt: todayISO() })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (member: Member) => {
    setEditing(member)
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone,
      email: member.email,
      birthDate: member.birthDate,
      joinedAt: member.joinedAt,
      address: member.address ?? '',
      notes: member.notes ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('El nombre y los apellidos son obligatorios.')
      return
    }
    if (!form.phone.trim()) {
      setError('Registra un teléfono de contacto.')
      return
    }
    if (!form.email.trim()) {
      setError('Registra un correo electrónico.')
      return
    }
    const member: Member = {
      id: editing?.id ?? uid('m'),
      churchId: currentChurchId,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      birthDate: form.birthDate,
      joinedAt: form.joinedAt || todayISO(),
      active: editing?.active ?? true,
      ministryIds: editing?.ministryIds ?? [],
      address: form.address.trim(),
      notes: form.notes.trim(),
    }
    mutate((current) => ({
      ...current,
      members: editing
        ? current.members.map((item) => (item.id === member.id ? member : item))
        : [...current.members, member],
    }))
    notify(editing ? 'Miembro actualizado correctamente.' : 'Miembro registrado correctamente.')
    setModalOpen(false)
  }

  const setActive = (member: Member, active: boolean) => {
    mutate((current) => ({
      ...current,
      members: current.members.map((item) =>
        item.id === member.id ? { ...item, active } : item,
      ),
    }))
    notify(
      active
        ? `${member.firstName} ${member.lastName} fue reactivado.`
        : `${member.firstName} ${member.lastName} fue desactivado sin eliminar su historial.`,
      active ? 'success' : 'info',
    )
    setConfirmMember(null)
  }

  if (!user) return null

  return (
    <>
      <PageHeader
        eyebrow="RF-02 · Gestión de miembros"
        title="Personas que hacen comunidad."
        description={`Directorio de ${church.shortName}. Registra, busca y acompaña a cada persona; desactivar un registro conserva su historial de asistencia y aportaciones.`}
        actions={
          manage ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={openNew}>
              <Plus size={15} /> Nuevo miembro
            </button>
          ) : undefined
        }
      />

      <div className="members-summary">
        <div className="members-summary__item">
          <span className="members-summary__icon">
            <Users size={18} />
          </span>
          <span>
            <strong>{members.length}</strong>
            <em>miembros registrados</em>
          </span>
        </div>
        <div className="members-summary__item">
          <span className="members-summary__icon members-summary__icon--green">
            <UserCheck size={18} />
          </span>
          <span>
            <strong>{activeCount}</strong>
            <em>activos</em>
          </span>
        </div>
        <div className="members-summary__item">
          <span className="members-summary__icon members-summary__icon--grey">
            <UserX size={18} />
          </span>
          <span>
            <strong>{inactiveCount}</strong>
            <em>inactivos</em>
          </span>
        </div>
        <div className="members-summary__item members-summary__item--last">
          <span>
            <em>Nuevos este año</em>
            <strong>
              {members.filter((member) => member.joinedAt.startsWith(todayISO().slice(0, 4))).length}
            </strong>
          </span>
        </div>
      </div>

      <section className="panel">
        <div className="table-toolbar">
          <div className="toolbar__group">
            <Segmented
              label="Filtrar miembros"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'Todos', count: members.length },
                { value: 'active', label: 'Activos', count: activeCount },
                { value: 'inactive', label: 'Inactivos', count: inactiveCount },
              ]}
            />
          </div>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nombre, correo o teléfono…"
          />
        </div>

        {visibleMembers.length === 0 ? (
          <EmptyState
            icon={<UserRound size={24} />}
            title={query ? 'No encontramos coincidencias' : 'Aún no hay miembros en esta vista'}
            description={
              query
                ? 'Prueba con otro nombre, correo o teléfono. También puedes revisar otros filtros.'
                : 'Registra a la primera persona de tu comunidad para comenzar a construir su historial.'
            }
            action={
              manage && !query ? (
                <button type="button" className="btn btn--primary btn--sm" onClick={openNew}>
                  <Plus size={15} /> Registrar miembro
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table members-table">
              <thead>
                <tr>
                  <th>Miembro</th>
                  <th>Contacto</th>
                  <th>Ingreso</th>
                  <th>Ministerios</th>
                  <th>Estado</th>
                  {manage && <th aria-label="Acciones" />}
                </tr>
              </thead>
              <tbody>
                {visibleMembers.map((member) => {
                  const memberMinistries = ministries.filter((ministry) =>
                    member.ministryIds.includes(ministry.id),
                  )
                  return (
                    <tr key={member.id}>
                      <td>
                        <div className="cell-main">
                          <Avatar name={`${member.firstName} ${member.lastName}`} size="md" />
                          <span>
                            <strong>
                              {member.firstName} {member.lastName}
                            </strong>
                            <span>{member.address || 'Sin dirección registrada'}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <a href={`tel:${member.phone.replace(/\s/g, '')}`}>
                            <Phone size={11} /> {member.phone}
                          </a>
                          <a href={`mailto:${member.email}`}>
                            <Mail size={11} /> {member.email}
                          </a>
                        </div>
                      </td>
                      <td>
                        <span className="date-cell">
                          <CalendarDays size={12} /> {formatDate(member.joinedAt, { month: 'short' })}
                        </span>
                      </td>
                      <td>
                        <div className="tag-list">
                          {memberMinistries.slice(0, 2).map((ministry) => (
                            <span className="tag" key={ministry.id}>
                              {ministry.name}
                            </span>
                          ))}
                          {memberMinistries.length > 2 && (
                            <span className="tag">+{memberMinistries.length - 2}</span>
                          )}
                          {memberMinistries.length === 0 && (
                            <span className="muted-cell">Sin asignar</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusPill active={member.active} />
                      </td>
                      {manage && (
                        <td>
                          <div className="cell-actions">
                            <button
                              type="button"
                              className="row-action"
                              title="Editar miembro"
                              onClick={() => openEdit(member)}
                            >
                              <Pencil size={14} />
                            </button>
                            {member.active ? (
                              <button
                                type="button"
                                className="row-action row-action--danger"
                                title="Desactivar miembro"
                                onClick={() => setConfirmMember(member)}
                              >
                                <UserX size={14} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="row-action"
                                title="Reactivar miembro"
                                onClick={() => setActive(member, true)}
                              >
                                <UserCheck size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar miembro' : 'Nuevo miembro'}
        subtitle={
          editing
            ? 'Actualiza la información personal sin perder el historial.'
            : `Se registrará en ${church.shortName}.`
        }
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="member-form" className="btn btn--primary btn--sm">
              {editing ? 'Guardar cambios' : 'Registrar miembro'}
            </button>
          </>
        }
      >
        <form id="member-form" className="form-grid" onSubmit={submit}>
          {error && (
            <div className="form-alert field--full" role="alert">
              {error}
            </div>
          )}
          <label className="field">
            <span>Nombre(s) <em>*</em></span>
            <input
              className="input"
              value={form.firstName}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
              placeholder="María José"
              required
            />
          </label>
          <label className="field">
            <span>Apellidos <em>*</em></span>
            <input
              className="input"
              value={form.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
              placeholder="Pech Canul"
              required
            />
          </label>
          <label className="field">
            <span>Teléfono <em>*</em></span>
            <input
              className="input"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+52 999 123 4567"
              required
            />
          </label>
          <label className="field">
            <span>Correo electrónico <em>*</em></span>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="correo@ejemplo.mx"
              required
            />
          </label>
          <label className="field">
            <span>Fecha de nacimiento</span>
            <input
              className="input"
              type="date"
              value={form.birthDate}
              onChange={(event) => setForm({ ...form, birthDate: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Fecha de ingreso <em>*</em></span>
            <input
              className="input"
              type="date"
              value={form.joinedAt}
              onChange={(event) => setForm({ ...form, joinedAt: event.target.value })}
              required
            />
          </label>
          <label className="field field--full">
            <span>Dirección</span>
            <input
              className="input"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder="Calle, número, colonia"
            />
          </label>
          <label className="field field--full">
            <span>Notas de acompañamiento</span>
            <textarea
              className="textarea"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Información pastoral o familiar relevante…"
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmMember)}
        onClose={() => setConfirmMember(null)}
        title="Desactivar miembro"
        subtitle="El registro se conserva, solo deja de aparecer como activo."
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmMember(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => confirmMember && setActive(confirmMember, false)}
            >
              <UserX size={14} /> Desactivar
            </button>
          </>
        }
      >
        <p className="confirm-text">
          ¿Deseas desactivar a{' '}
          <strong>
            {confirmMember?.firstName} {confirmMember?.lastName}
          </strong>
          ? Su historial de asistencia, aportaciones y ministerios se mantendrá intacto y podrás
          reactivarlo cuando quieras.
        </p>
      </Modal>
    </>
  )
}

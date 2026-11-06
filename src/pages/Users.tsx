import { useMemo, useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  Mail,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  UserX,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'
import { Avatar, EmptyState, PageHeader, RoleBadge, SearchField, Segmented, StatusPill } from '../components/ui'
import { ROLE_LABELS, type Role, type User } from '../types'
import { formatDate, hashPassword, normalize, uid } from '../lib/utils'

const ROLES: Role[] = ['administrador', 'pastor', 'secretario', 'tesorero', 'coordinador']

type UserForm = {
  name: string
  email: string
  role: Role
  password: string
  active: boolean
}

const EMPTY_FORM: UserForm = {
  name: '',
  email: '',
  role: 'coordinador',
  password: '',
  active: true,
}

export default function Users() {
  const { db, user, church, currentChurchId, mutate } = useStore()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [confirmUser, setConfirmUser] = useState<User | null>(null)

  const churchUsers = db.users.filter((item) => item.churchId === currentChurchId)
  const activeCount = churchUsers.filter((item) => item.active).length

  const visibleUsers = useMemo(() => {
    const q = normalize(query.trim())
    return churchUsers
      .filter((item) => {
        if (roleFilter !== 'all' && item.role !== roleFilter) return false
        if (!q) return true
        return normalize(`${item.name} ${item.email} ${ROLE_LABELS[item.role]}`).includes(q)
      })
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name))
  }, [churchUsers, query, roleFilter])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (target: User) => {
    setEditing(target)
    setForm({
      name: target.name,
      email: target.email,
      role: target.role,
      password: '',
      active: target.active,
    })
    setError('')
    setModalOpen(true)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) return setError('Escribe el nombre completo.')
    if (!form.email.trim()) return setError('Escribe un correo electrónico.')
    const email = form.email.trim().toLowerCase()
    const duplicated = db.users.some(
      (item) => normalize(item.email) === normalize(email) && item.id !== editing?.id,
    )
    if (duplicated) return setError('Ya existe una cuenta con ese correo.')
    if (!editing && form.password.length < 8) {
      return setError('La contraseña inicial debe tener al menos 8 caracteres.')
    }
    if (editing && form.password && form.password.length < 8) {
      return setError('La nueva contraseña debe tener al menos 8 caracteres.')
    }

    if (editing) {
      const updated: User = {
        ...editing,
        name: form.name.trim(),
        email,
        role: form.role,
        active: form.active,
        passwordHash: form.password ? hashPassword(form.password) : editing.passwordHash,
      }
      mutate((current) => ({
        ...current,
        users: current.users.map((item) => (item.id === updated.id ? updated : item)),
      }))
      notify('Cuenta actualizada correctamente.')
    } else {
      const created: User = {
        id: uid('u'),
        name: form.name.trim(),
        email,
        role: form.role,
        churchId: currentChurchId,
        active: form.active,
        passwordHash: hashPassword(form.password),
        createdAt: new Date().toISOString(),
      }
      mutate((current) => ({ ...current, users: [...current.users, created] }))
      notify('Usuario registrado. Ya puede iniciar sesión.')
    }
    setModalOpen(false)
  }

  const toggleActive = () => {
    if (!confirmUser) return
    if (confirmUser.id === user?.id) {
      notify('No puedes desactivar tu propia cuenta.', 'error')
      setConfirmUser(null)
      return
    }
    mutate((current) => ({
      ...current,
      users: current.users.map((item) =>
        item.id === confirmUser.id ? { ...item, active: !item.active } : item,
      ),
    }))
    notify(
      confirmUser.active
        ? `${confirmUser.name} fue desactivado.`
        : `${confirmUser.name} fue reactivado.`,
      confirmUser.active ? 'info' : 'success',
    )
    setConfirmUser(null)
  }

  const counts = ROLES.reduce<Record<Role, number>>(
    (acc, role) => {
      acc[role] = churchUsers.filter((item) => item.role === role).length
      return acc
    },
    { administrador: 0, pastor: 0, secretario: 0, tesorero: 0, coordinador: 0 },
  )

  if (!user) return null

  return (
    <>
      <PageHeader
        eyebrow="RF-01 · Usuarios y roles"
        title="Cada persona, el acceso que necesita."
        description={`Administra las cuentas de ${church.shortName}. Solo el rol de administrador puede crear usuarios, cambiar roles o desactivar accesos.`}
        actions={
          <button type="button" className="btn btn--primary btn--sm" onClick={openNew}>
            <Plus size={15} /> Nuevo usuario
          </button>
        }
      />

      <div className="users-summary">
        <span>
          <ShieldCheck size={15} /> <strong>{churchUsers.length}</strong> cuentas
        </span>
        <span>
          <UserCheck size={15} /> <strong>{activeCount}</strong> activas
        </span>
        <span>
          <UserRound size={15} /> <strong>{counts.pastor}</strong> pastorado
        </span>
        <span>
          <UserRound size={15} /> <strong>{counts.coordinador}</strong> coordinadores
        </span>
      </div>

      <section className="panel">
        <div className="table-toolbar">
          <Segmented
            label="Filtrar por rol"
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: 'all', label: 'Todos', count: churchUsers.length },
              ...ROLES.map((role) => ({
                value: role,
                label: ROLE_LABELS[role],
                count: counts[role],
              })),
            ]}
          />
          <SearchField value={query} onChange={setQuery} placeholder="Buscar usuario o correo…" />
        </div>

        {visibleUsers.length === 0 ? (
          <EmptyState
            icon={<Search size={24} />}
            title="No encontramos usuarios"
            description="Prueba con otro nombre, correo o filtro de rol."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Creado</th>
                  <th>Estado</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="cell-main">
                        <Avatar name={item.name} size="md" />
                        <span>
                          <strong>{item.name}</strong>
                          <span>{item.id === user.id ? 'Tu cuenta' : 'Cuenta de la iglesia'}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="inline muted">
                        <Mail size={12} /> {item.email}
                      </span>
                    </td>
                    <td>
                      <RoleBadge role={item.role} />
                    </td>
                    <td>{formatDate(item.createdAt.slice(0, 10), { month: 'short' })}</td>
                    <td>
                      <StatusPill active={item.active} labels={['Activo', 'Inactivo']} />
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button
                          type="button"
                          className="row-action"
                          title="Editar cuenta"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className={item.active ? 'row-action row-action--danger' : 'row-action'}
                          title={item.active ? 'Desactivar cuenta' : 'Reactivar cuenta'}
                          onClick={() => setConfirmUser(item)}
                          disabled={item.id === user.id}
                        >
                          {item.active ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel role-matrix">
        <div className="panel__head">
          <div>
            <h2 className="panel__title">Matriz de permisos</h2>
            <p className="panel__subtitle">Resumen de lo que puede hacer cada rol</p>
          </div>
          <span className="chip chip--soft">
            <ShieldCheck size={12} /> Configuración del sistema
          </span>
        </div>
        <div className="role-matrix__grid">
          {ROLES.map((role) => (
            <div className="role-matrix__card" key={role}>
              <RoleBadge role={role} />
              <strong>{counts[role]} cuenta{counts[role] === 1 ? '' : 's'}</strong>
              <p>{ROLE_DESCRIPTIONS[role]}</p>
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar cuenta' : 'Nuevo usuario'}
        subtitle={
          editing
            ? 'Los cambios de rol se aplican al siguiente inicio de sesión.'
            : 'La cuenta se creará en la iglesia activa.'
        }
        size="md"
        footer={
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="user-form" className="btn btn--primary btn--sm">
              {editing ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </>
        }
      >
        <form id="user-form" className="form-grid" onSubmit={submit}>
          {error && (
            <div className="form-alert field--full" role="alert">
              {error}
            </div>
          )}
          <label className="field field--full">
            <span>Nombre completo <em>*</em></span>
            <input
              className="input"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="María José Pech"
              required
            />
          </label>
          <label className="field field--full">
            <span>Correo electrónico <em>*</em></span>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="usuario@iglesia.mx"
              required
            />
          </label>
          <label className="field">
            <span>Rol</span>
            <select
              className="select"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as Role })}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>
          <div className="field">
            <span>Estado de la cuenta</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
              />
              <span className="switch__track" />
              {form.active ? 'Activa' : 'Inactiva'}
            </label>
          </div>
          <label className="field field--full">
            <span>{editing ? 'Nueva contraseña (opcional)' : 'Contraseña inicial *'}</span>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder={editing ? 'Dejar vacío para conservar la actual' : 'Mínimo 8 caracteres'}
              autoComplete="new-password"
            />
            <span className="field__hint">
              <CheckCircle2 size={11} /> Las contraseñas se almacenan con hash local en esta
              demostración.
            </span>
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmUser)}
        onClose={() => setConfirmUser(null)}
        title={confirmUser?.active ? 'Desactivar cuenta' : 'Reactivar cuenta'}
        subtitle="La cuenta conserva su historial y puede reactivarse después."
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmUser(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className={confirmUser?.active ? 'btn btn--danger btn--sm' : 'btn btn--primary btn--sm'}
              onClick={toggleActive}
            >
              {confirmUser?.active ? <UserX size={14} /> : <UserCheck size={14} />}
              {confirmUser?.active ? 'Desactivar' : 'Reactivar'}
            </button>
          </>
        }
      >
        <p className="confirm-text">
          ¿Deseas {confirmUser?.active ? 'desactivar' : 'reactivar'} la cuenta de{' '}
          <strong>{confirmUser?.name}</strong> ({confirmUser?.email})?
        </p>
      </Modal>
    </>
  )
}

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  administrador: 'Acceso completo: usuarios, configuración, finanzas y todos los módulos.',
  pastor: 'Visión pastoral de la comunidad, finanzas, reportes y configuración.',
  secretario: 'Miembros, asistencia, eventos, ministerios y comunicados.',
  tesorero: 'Donaciones, ingresos y reportes financieros autorizados.',
  coordinador: 'Miembros, asistencia, eventos y ministerios en modo consulta.',
}

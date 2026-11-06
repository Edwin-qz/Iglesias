import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Check,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useToast } from '../components/Toast'
import { Avatar, PageHeader, RoleBadge } from '../components/ui'
import { ROLE_LABELS, ROLE_PERMISSIONS, type Permission, type Role } from '../types'
import { useNavigate } from 'react-router-dom'
import { cn, formatDate } from '../lib/utils'

const PERMISSION_LABELS: Record<Permission, string> = {
  dashboard: 'Panel principal',
  'members.view': 'Ver miembros',
  'members.manage': 'Gestionar miembros',
  'attendance.view': 'Ver asistencia',
  'attendance.manage': 'Registrar asistencia',
  'events.view': 'Ver eventos',
  'events.manage': 'Gestionar eventos',
  'ministries.view': 'Ver ministerios',
  'ministries.manage': 'Gestionar ministerios',
  'finance.view': 'Ver finanzas',
  'finance.manage': 'Registrar aportaciones',
  'announcements.view': 'Ver anuncios',
  'announcements.manage': 'Publicar anuncios',
  'reports.view': 'Ver reportes',
  'reports.finance': 'Reportes financieros',
  'users.manage': 'Administrar usuarios',
  'settings.view': 'Ver configuración',
  'settings.manage': 'Editar configuración',
}

const ROLE_BLURB: Record<Role, string> = {
  administrador: 'Tienes control completo del sistema, las cuentas y la configuración de la iglesia.',
  pastor: 'Acompañas la vida de la comunidad con acceso a finanzas, reportes y configuración.',
  secretario: 'Sostienes el día a día: miembros, asistencia, eventos, ministerios y comunicados.',
  tesorero: 'Cuidas la transparencia financiera: aportaciones, ingresos y reportes autorizados.',
  coordinador: 'Acompañas a tu ministerio y participas en la asistencia y la vida de la comunidad.',
}

export default function Profile() {
  const { user, church, logout, updateProfile, changePassword } = useStore()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  if (!user) return null

  const submitProfile = (event: FormEvent) => {
    event.preventDefault()
    setProfileError('')
    const result = updateProfile(name)
    if (!result.ok) return setProfileError(result.message)
    notify(result.message ?? 'Perfil actualizado.')
  }

  const submitPassword = (event: FormEvent) => {
    event.preventDefault()
    setPasswordError('')
    if (newPassword !== confirmPassword) {
      return setPasswordError('Las contraseñas nuevas no coinciden.')
    }
    const result = changePassword(currentPassword, newPassword)
    if (!result.ok) return setPasswordError(result.message)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    notify(result.message ?? 'Contraseña actualizada.')
  }

  const permissions = ROLE_PERMISSIONS[user.role]

  return (
    <>
      <PageHeader
        eyebrow="Mi perfil"
        title="Tu lugar en Casa Viva."
        description="Actualiza tus datos de acceso y consulta los permisos que tu rol tiene en la iglesia."
      />

      <div className="profile-layout">
        <aside className="profile-aside">
          <section className="profile-card">
            <div className="profile-card__top">
              <span className="profile-card__glow" aria-hidden="true" />
              <Avatar name={user.name} size="xl" />
              <RoleBadge role={user.role} />
            </div>
            <h2>{user.name}</h2>
            <p className="profile-card__email">
              <Mail size={13} /> {user.email}
            </p>
            <p className="profile-card__church">
              <Building2 size={13} /> {church.name}
              <em>{church.colonia}, Mérida</em>
            </p>
            <div className="profile-card__meta">
              <span>
                <em>Cuenta creada</em>
                <strong>{formatDate(user.createdAt.slice(0, 10), { month: 'short' })}</strong>
              </span>
              <span>
                <em>Estado</em>
                <strong className={user.active ? 'is-active' : 'is-inactive'}>
                  {user.active ? 'Activa' : 'Inactiva'}
                </strong>
              </span>
            </div>
            <button
              type="button"
              className="btn btn--outline btn--sm btn--block"
              onClick={() => {
                logout()
                navigate('/')
              }}
            >
              <LogOut size={14} /> Cerrar sesión
            </button>
          </section>

          <section className="profile-roles">
            <p className="eyebrow">Tu rol</p>
            <h3>{ROLE_LABELS[user.role]}</h3>
            <p>{ROLE_BLURB[user.role]}</p>
            <div className="profile-roles__chips">
              {permissions.slice(0, 6).map((permission) => (
                <span key={permission}>
                  <Check size={11} /> {PERMISSION_LABELS[permission]}
                </span>
              ))}
              {permissions.length > 6 && <span>+{permissions.length - 6} más</span>}
            </div>
          </section>
        </aside>

        <div className="profile-main">
          <section className="panel profile-section">
            <div className="panel__head">
              <div>
                <h2 className="panel__title">Datos personales</h2>
                <p className="panel__subtitle">El nombre que aparece en el panel y en los registros</p>
              </div>
              <UserRound size={18} className="muted" />
            </div>
            <form className="profile-form" onSubmit={submitProfile}>
              {profileError && (
                <div className="form-alert" role="alert">
                  {profileError}
                </div>
              )}
              <label className="field">
                <span>Nombre completo</span>
                <input
                  className="input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </label>
              <label className="field">
                <span>Correo electrónico</span>
                <input className="input" value={user.email} disabled readOnly />
                <span className="field__hint">
                  El correo identifica tu cuenta y no puede cambiarse desde aquí.
                </span>
              </label>
              <label className="field">
                <span>Rol asignado</span>
                <div className="profile-role-field">
                  <RoleBadge role={user.role} />
                  <span>Solo un administrador puede modificar tu rol.</span>
                </div>
              </label>
              <div className="profile-form__actions">
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={!name.trim() || name.trim() === user.name}
                >
                  Guardar datos
                </button>
              </div>
            </form>
          </section>

          <section className="panel profile-section">
            <div className="panel__head">
              <div>
                <h2 className="panel__title">Seguridad</h2>
                <p className="panel__subtitle">Cambia tu contraseña de acceso</p>
              </div>
              <KeyRound size={18} className="muted" />
            </div>
            <form className="profile-form" onSubmit={submitPassword}>
              {passwordError && (
                <div className="form-alert" role="alert">
                  {passwordError}
                </div>
              )}
              <label className="field">
                <span>Contraseña actual</span>
                <input
                  className="input"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              <div className="form-grid">
                <label className="field">
                  <span>Nueva contraseña</span>
                  <input
                    className="input"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </label>
                <label className="field">
                  <span>Confirmar contraseña</span>
                  <input
                    className="input"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </label>
              </div>
              <div className="profile-form__actions">
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={!currentPassword || newPassword.length < 8}
                >
                  Actualizar contraseña
                </button>
              </div>
            </form>
          </section>

          <section className="panel profile-section">
            <div className="panel__head">
              <div>
                <h2 className="panel__title">Permisos de tu rol</h2>
                <p className="panel__subtitle">Acciones habilitadas para {ROLE_LABELS[user.role]}</p>
              </div>
              <ShieldCheck size={18} className="muted" />
            </div>
            <div className="permission-grid">
              {Object.keys(PERMISSION_LABELS).map((key) => {
                const permission = key as Permission
                const enabled = permissions.includes(permission)
                return (
                  <div
                    key={permission}
                    className={cn('permission-item', enabled && 'is-enabled')}
                  >
                    <span className="permission-item__check">
                      {enabled ? <Check size={11} /> : '—'}
                    </span>
                    {PERMISSION_LABELS[permission]}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="profile-help">
            <div>
              <h3>¿Necesitas otro nivel de acceso?</h3>
              <p>
                Contacta al administrador de {church.shortName} para solicitar un cambio de rol. Los
                ajustes de permisos se aplican en tu siguiente inicio de sesión.
              </p>
            </div>
            <Link to="/app" className="btn btn--dark btn--sm">
              Volver al panel <ArrowRight size={14} />
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}

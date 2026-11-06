import { useEffect, useState, type CSSProperties } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpenText,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  HandCoins,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
  ChevronDown,
  Bell,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { can, ROLE_LABELS, type Permission } from '../types'
import { ChurchMark } from './Brand'
import { Avatar, RoleBadge } from './ui'
import { cn, todayISO, formatDate } from '../lib/utils'
import { googleMapsDirectionsUrl } from '../lib/maps'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  permission: Permission
  end?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Vida de la iglesia',
    items: [
      { to: '/app', label: 'Panel', icon: LayoutDashboard, permission: 'dashboard', end: true },
      { to: '/app/miembros', label: 'Miembros', icon: Users, permission: 'members.view' },
      {
        to: '/app/asistencia',
        label: 'Asistencia',
        icon: ClipboardCheck,
        permission: 'attendance.view',
      },
      { to: '/app/eventos', label: 'Eventos', icon: CalendarDays, permission: 'events.view' },
      {
        to: '/app/ministerios',
        label: 'Ministerios',
        icon: HeartHandshake,
        permission: 'ministries.view',
      },
    ],
  },
  {
    label: 'Administración',
    items: [
      { to: '/app/donaciones', label: 'Donaciones', icon: HandCoins, permission: 'finance.view' },
      { to: '/app/anuncios', label: 'Anuncios', icon: Megaphone, permission: 'announcements.view' },
      { to: '/app/reportes', label: 'Reportes', icon: FileText, permission: 'reports.view' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/app/usuarios', label: 'Usuarios', icon: ShieldCheck, permission: 'users.manage' },
      { to: '/app/configuracion', label: 'Configuración', icon: Settings, permission: 'settings.view' },
    ],
  },
]

const PAGE_META: Record<string, { title: string; section: string }> = {
  '/app': { title: 'Panel principal', section: 'Vida de la iglesia' },
  '/app/miembros': { title: 'Miembros', section: 'Vida de la iglesia' },
  '/app/asistencia': { title: 'Asistencia', section: 'Vida de la iglesia' },
  '/app/eventos': { title: 'Eventos', section: 'Vida de la iglesia' },
  '/app/ministerios': { title: 'Ministerios', section: 'Vida de la iglesia' },
  '/app/donaciones': { title: 'Donaciones', section: 'Administración' },
  '/app/anuncios': { title: 'Anuncios', section: 'Administración' },
  '/app/reportes': { title: 'Reportes', section: 'Administración' },
  '/app/usuarios': { title: 'Usuarios y roles', section: 'Sistema' },
  '/app/configuracion': { title: 'Configuración de la iglesia', section: 'Sistema' },
  '/app/perfil': { title: 'Mi perfil', section: 'Sistema' },
}

export function AppLayout() {
  const { user, church, db, currentChurchId, switchChurch, logout } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const meta = PAGE_META[location.pathname] ?? { title: 'Casa Viva', section: 'Panel' }
  const announcements = db.announcements.filter((item) => item.churchId === currentChurchId)
  const pinned = announcements.filter((item) => item.pinned).length

  useEffect(() => {
    document.title = `${meta.title} · Casa Viva`
  }, [meta.title])

  if (!user) return null

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(user.role, item.permission)),
  })).filter((group) => group.items.length > 0)

  const themeStyle = {
    '--church-primary': church.theme.primary,
    '--church-deep': church.theme.deep,
    '--church-accent': church.theme.accent,
    '--church-soft': church.theme.soft,
    '--church-tint': church.theme.tint,
  } as CSSProperties

  return (
    <div className="app-shell" style={themeStyle}>
      <button
        type="button"
        className={cn('sidebar-scrim', menuOpen && 'is-visible')}
        onClick={() => setMenuOpen(false)}
        aria-label="Cerrar menú"
        tabIndex={menuOpen ? 0 : -1}
      />
      <aside className={cn('sidebar', menuOpen && 'is-open')}>
        <div className="sidebar__head">
          <Link to="/" className="brand brand--sidebar" aria-label="Casa Viva, ir al inicio">
            <span className="brand__mark">
              <ChurchMark size={28} />
            </span>
            <span className="brand__text">
              <span className="brand__name">Casa Viva</span>
              <span className="brand__tag">Mérida · Yucatán</span>
            </span>
          </Link>
          <button
            type="button"
            className="sidebar__close"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <div className="church-switcher">
          <span className="church-switcher__label">
            <Building2 size={13} /> Iglesia activa
          </span>
          {user.role === 'administrador' ? (
            <label className="church-switcher__select">
              <span>{church.shortName}</span>
              <select
                value={currentChurchId}
                onChange={(event) => switchChurch(event.target.value)}
                aria-label="Cambiar iglesia activa"
              >
                {db.churches.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.shortName}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </label>
          ) : (
            <div className="church-switcher__static">
              <strong>{church.shortName}</strong>
              <span>{church.colonia}</span>
            </div>
          )}
          <a
            className="church-switcher__map"
            href={googleMapsDirectionsUrl(church)}
            target="_blank"
            rel="noreferrer"
          >
            <MapPin size={12} /> Cómo llegar
          </a>
        </div>

        <nav className="sidebar__nav" aria-label="Navegación principal">
          {visibleGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-group__label">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => cn('nav-link', isActive && 'is-active')}
                  >
                    <Icon size={19} strokeWidth={1.9} />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar__foot">
          <Link to="/app/perfil" className="sidebar-user">
            <Avatar name={user.name} size="sm" />
            <span className="sidebar-user__info">
              <strong>{user.name}</strong>
              <span>{ROLE_LABELS[user.role]}</span>
            </span>
          </Link>
          <button
            type="button"
            className="sidebar-logout"
            onClick={() => {
              logout()
              navigate('/')
            }}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar__left">
            <button
              type="button"
              className="icon-btn topbar__menu"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <div className="topbar__crumb">
              <span>{meta.section}</span>
              <span className="topbar__sep">/</span>
              <strong>{meta.title}</strong>
            </div>
          </div>
          <div className="topbar__right">
            <span className="topbar__date">{formatDate(todayISO(), { weekday: 'long', day: 'numeric', month: 'short' })}</span>
            <Link
              to="/app/anuncios"
              className="icon-btn topbar__bell"
              aria-label={`Anuncios${pinned ? `, ${pinned} fijados` : ''}`}
            >
              <Bell size={18} />
              {pinned > 0 && <span className="topbar__bell-dot" />}
            </Link>
            <Link to="/app/perfil" className="topbar__user" aria-label="Ver mi perfil">
              <Avatar name={user.name} size="sm" />
              <span>{user.name.split(' ')[0]}</span>
            </Link>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>© {new Date().getFullYear()} Casa Viva · Hecho para las iglesias de Mérida</span>
          <span className="app-footer__links">
            <Link to="/" target="_blank">
              Sitio público <ExternalLink size={12} />
            </Link>
            <span className="app-footer__demo">Entorno de demostración</span>
          </span>
        </footer>
      </div>
    </div>
  )
}

export function AccessDenied({ module }: { module: string }) {
  const { user } = useStore()
  return (
    <div className="access-denied">
      <span className="access-denied__icon">
        <ShieldCheck size={30} />
      </span>
      <p className="eyebrow">Acceso restringido</p>
      <h1>Este módulo no está disponible para tu rol</h1>
      <p>
        Iniciaste sesión como <strong>{user ? ROLE_LABELS[user.role] : 'invitado'}</strong>. El módulo
        de <strong>{module}</strong> requiere permisos adicionales. Si necesitas acceso, contacta al
        administrador de la iglesia.
      </p>
      <Link to="/app" className="btn btn--primary">
        Volver al panel
      </Link>
    </div>
  )
}

export { BookOpenText }

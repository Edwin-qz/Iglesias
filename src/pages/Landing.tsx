import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  CalendarDays,
  Calculator,
  Check,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Download,
  FileText,
  HandCoins,
  HeartHandshake,
  Lock,
  MapPin,
  Megaphone,
  Menu,
  Quote,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { ChurchCarousel } from '../components/ChurchCarousel'
import { MeridaMap } from '../components/MeridaMap'
import { ChurchImage } from '../components/ChurchImage'
import { ChurchMark } from '../components/Brand'
import { Avatar } from '../components/ui'
import { cn, formatMoney, monthKey, percent, todayISO } from '../lib/utils'
import { googleMapsPlaceUrl } from '../lib/maps'

const ROLES: Array<{ name: string; icon: LucideIcon; description: string; tags: string[] }> = [
  {
    name: 'Administrador',
    icon: ShieldCheck,
    description: 'Control total del sistema, cuentas y configuración institucional.',
    tags: ['Usuarios', 'Permisos', 'Ajustes'],
  },
  {
    name: 'Pastor',
    icon: BookOpenText,
    description: 'Visión general de la comunidad, finanzas y acompañamiento pastoral.',
    tags: ['Panel', 'Finanzas', 'Reportes'],
  },
  {
    name: 'Secretario',
    icon: ClipboardList,
    description: 'El día a día: miembros, asistencia, eventos y comunicados.',
    tags: ['Miembros', 'Agenda', 'Avisos'],
  },
  {
    name: 'Tesorero',
    icon: Calculator,
    description: 'Aportaciones, resumen mensual y reportes de ingresos protegidos.',
    tags: ['Donaciones', 'Ingresos', 'Exportar'],
  },
  {
    name: 'Coordinador',
    icon: HeartHandshake,
    description: 'El pulso de su ministerio: integrantes, asistencia y actividades.',
    tags: ['Asistencia', 'Ministerio', 'Equipo'],
  },
]

export default function Landing() {
  const { db, user } = useStore()
  const [index, setIndex] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const church = db.churches[index]
  const churchCount = db.churches.length
  const selectedPlaceUrl = googleMapsPlaceUrl(church)

  useEffect(() => {
    document.title = 'Casa Viva · Una casa digital para cada iglesia de Mérida'
    window.scrollTo(0, 0)
  }, [])

  const activeMembers = db.members.filter((member) => member.active)
  const attendanceRecords = db.attendance
  const totalPresent = attendanceRecords.reduce((sum, item) => sum + item.presentIds.length, 0)
  const totalAttendance = attendanceRecords.reduce(
    (sum, item) => sum + item.presentIds.length + item.absentIds.length,
    0,
  )
  const averageAttendance = percent(totalPresent, totalAttendance)
  const upcomingEvents = db.events
    .filter((event) => event.status === 'programado' && event.date >= todayISO())
    .sort((a, b) => a.date.localeCompare(b.date))
  const currentMonth = monthKey(todayISO())
  const monthIncome = db.donations
    .filter((donation) => donation.churchId === church.id && monthKey(donation.date) === currentMonth)
    .reduce((sum, donation) => sum + donation.amount, 0)
  const churchMemberCount = activeMembers.filter((member) => member.churchId === church.id).length
  const churchMinistryCount = db.ministries.filter(
    (ministry) => ministry.churchId === church.id,
  ).length
  const churchEventCount = upcomingEvents.filter((event) => event.churchId === church.id).length

  const style = {
    '--church-primary': church.theme.primary,
    '--church-deep': church.theme.deep,
    '--church-accent': church.theme.accent,
    '--church-soft': church.theme.soft,
    '--church-tint': church.theme.tint,
  } as CSSProperties

  return (
    <div className="landing" style={style} id="inicio">
      <div className="landing__aura" aria-hidden="true" />

      <header className="site-header">
        <div className="site-header__inner">
          <a className="brand" href="#inicio" aria-label="Casa Viva, inicio">
            <span className="brand__mark">
              <ChurchMark size={30} />
            </span>
            <span className="brand__text">
              <span className="brand__name">Casa Viva</span>
              <span className="brand__tag">Iglesias de Mérida</span>
            </span>
          </a>

          <nav className={cn('site-nav', menuOpen && 'is-open')} aria-label="Navegación del sitio">
            <a href="#iglesias" onClick={() => setMenuOpen(false)}>
              Iglesias
            </a>
            <a href="#plataforma" onClick={() => setMenuOpen(false)}>
              Plataforma
            </a>
            <a href="#roles" onClick={() => setMenuOpen(false)}>
              Roles
            </a>
            <a href="#comenzar" onClick={() => setMenuOpen(false)}>
              Comenzar
            </a>
            {!user && (
              <Link to="/login" className="site-nav__mobile-login" onClick={() => setMenuOpen(false)}>
                Iniciar sesión
              </Link>
            )}
          </nav>

          <div className="site-header__actions">
            {user ? (
              <Link to="/app" className="btn btn--dark btn--sm">
                Ir al panel <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost btn--sm site-header__login">
                  Iniciar sesión
                </Link>
                <Link to="/registro" className="btn btn--dark btn--sm">
                  Crear cuenta <ArrowRight size={15} />
                </Link>
              </>
            )}
            <button
              type="button"
              className="site-header__menu"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__copy">
            <span className="hero-badge">
              <Sparkles size={14} /> Plataforma de gestión · Mérida, Yucatán
            </span>
            <h1>
              Una casa digital para <em>cada iglesia</em> de Mérida.
            </h1>
            <p>
              Miembros, asistencia, eventos, ministerios, donaciones y comunicados en un solo lugar.
              Una herramienta serena para que tu comunidad dedique menos tiempo al papeleo y más a
              cuidarse.
            </p>
            <div className="hero__actions">
              <Link to={user ? '/app' : '/login'} className="btn btn--dark btn--lg">
                {user ? 'Entrar a mi panel' : 'Explorar el sistema'} <ArrowRight size={18} />
              </Link>
              <a href="#iglesias" className="btn btn--outline btn--lg">
                Conocer las iglesias
              </a>
            </div>
            <div className="hero__proof">
              <div className="avatar-row">
                {['Ana Sofía', 'María José', 'David', 'Jorge'].map((name) => (
                  <Avatar key={name} name={name} size="sm" />
                ))}
                <span className="avatar avatar--sm avatar--more">+</span>
              </div>
              <div>
                <strong>{churchCount} comunidades de Mérida</strong>
                <span>{activeMembers.length} miembros y {db.ministries.length} ministerios activos</span>
              </div>
            </div>
          </div>

          <div className="hero__visual">
            <ChurchCarousel churches={db.churches} index={index} onIndexChange={setIndex} />
            <a
              className="hero__note"
              href={selectedPlaceUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Ver ${church.name} en Google Maps`}
            >
              <span className="hero__note-icon">
                <MapPin size={14} />
              </span>
              <span>
                <strong>{church.shortName}</strong>
                <em>{church.address} · {church.colonia}</em>
              </span>
              <ArrowUpRight size={16} />
            </a>
          </div>
        </section>

        <section className="metrics" aria-label="La plataforma en números">
          <div className="metric">
            <span className="metric__value">{db.churches.length}</span>
            <span className="metric__label">iglesias acompañadas</span>
          </div>
          <div className="metric">
            <span className="metric__value">{activeMembers.length}</span>
            <span className="metric__label">miembros activos</span>
          </div>
          <div className="metric">
            <span className="metric__value">{averageAttendance}%</span>
            <span className="metric__label">asistencia promedio</span>
          </div>
          <div className="metric">
            <span className="metric__value">{upcomingEvents.length}</span>
            <span className="metric__label">próximos encuentros</span>
          </div>
          <div className="metric metric--accent">
            <span className="metric__value">10</span>
            <span className="metric__label">módulos integrados</span>
          </div>
        </section>

        <section className="section section--churches" id="iglesias">
          <div className="section-head">
            <div>
              <p className="eyebrow">Directorio de ubicaciones</p>
              <h2>{churchCount} casas, una misma ciudad.</h2>
            </div>
            <p className="section-head__aside">
              Recorre las comunidades que forman parte de Casa Viva. Cada una tiene su propio color,
              su ritmo y su manera de habitar Mérida.
            </p>
          </div>

          <MeridaMap
            churches={db.churches}
            selectedId={church.id}
            onSelect={(selected) => {
              const selectedIndex = db.churches.findIndex((item) => item.id === selected.id)
              if (selectedIndex >= 0) setIndex(selectedIndex)
            }}
          />

          <div className="church-strip">
            {db.churches.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                className={cn('church-strip__card', itemIndex === index && 'is-active')}
                onClick={() => setIndex(itemIndex)}
                title={`${item.name} · ${item.address}${
                  item.photo ? ` · Foto: ${item.photo.credit} (${item.photo.license})` : ''
                }`}
              >
                <span className="church-strip__thumb">
                  <ChurchImage
                    church={item}
                    variant={itemIndex}
                    className="church-strip__thumb-img"
                  />
                </span>
                <span className="church-strip__body">
                  <strong>{item.shortName}</strong>
                  <span>{item.colonia}</span>
                  <em>
                    <Clock size={12} /> {item.schedules[0]?.day} {item.schedules[0]?.time}
                  </em>
                </span>
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
        </section>

        <section className="section section--platform" id="plataforma">
          <div className="section-head">
            <div>
              <p className="eyebrow">Todo en un solo lugar</p>
              <h2>La vida de tu iglesia, con la calma de una casa ordenada.</h2>
            </div>
            <p className="section-head__aside">
              Diez módulos que se hablan entre sí. La información correcta, para la persona correcta,
              en el momento correcto.
            </p>
          </div>

          <div className="bento">
            <article className="bento-card bento-card--roles">
              <div className="bento-card__head">
                <span className="bento-tag">RF-01 · RF-07</span>
                <span className="bento-icon bento-icon--light">
                  <ShieldCheck size={20} />
                </span>
              </div>
              <div className="bento-card__body">
                <h3>Permisos que respetan el rol de cada persona.</h3>
                <p>
                  Autenticación por correo, recuperación de contraseña y cinco roles con accesos
                  delimitados. La información financiera solo la ve quien debe verla.
                </p>
              </div>
              <div className="role-chips">
                {['Administrador', 'Pastor', 'Secretario', 'Tesorero', 'Coordinador'].map((role) => (
                  <span key={role} className="role-chip">
                    <Check size={12} /> {role}
                  </span>
                ))}
              </div>
              <div className="bento-glow" style={{ background: church.theme.primary }} aria-hidden="true" />
            </article>

            <article className="bento-card bento-card--members">
              <div className="bento-card__head">
                <span className="bento-tag">RF-02</span>
                <span className="bento-icon">
                  <Users size={19} />
                </span>
              </div>
              <div className="bento-card__body">
                <span className="bento-number">{activeMembers.length}</span>
                <h3>Miembros acompañados</h3>
                <p>Búsqueda, filtros, edición y desactivación sin perder historial.</p>
              </div>
              <div className="avatar-row">
                {activeMembers.slice(0, 5).map((member) => (
                  <Avatar key={member.id} name={`${member.firstName} ${member.lastName}`} size="sm" />
                ))}
                <span className="avatar avatar--sm avatar--more">+{activeMembers.length - 5}</span>
              </div>
            </article>

            <article className="bento-card bento-card--attendance">
              <div className="bento-card__head">
                <span className="bento-tag">RF-03</span>
                <span className="bento-icon">
                  <ClipboardCheck size={19} />
                </span>
              </div>
              <div className="bento-card__body">
                <span className="bento-number">{averageAttendance}%</span>
                <h3>Asistencia promedio</h3>
                <p>Pase de lista por evento, historial y reportes semanales.</p>
              </div>
              <div className="mini-bars" aria-hidden="true">
                {[52, 64, 48, 78, 71, 86, 74, 92].map((height, barIndex) => (
                  <span
                    key={barIndex}
                    style={{
                      height: `${height}%`,
                      background: barIndex === 7 ? church.theme.primary : church.theme.tint,
                    }}
                  />
                ))}
              </div>
            </article>

            <article className="bento-card bento-card--event">
              <div className="bento-card__head">
                <span className="bento-tag">RF-04</span>
                <CalendarDays size={19} />
              </div>
              <div className="event-mini">
                <span className="event-mini__date">
                  <em>DOM</em>
                  <strong>10</strong>
                  <span>10:00</span>
                </span>
                <div>
                  <span className="event-mini__tag">Culto de celebración</span>
                  <h3>{church.shortName}</h3>
                  <p>
                    <MapPin size={12} /> Templo principal
                  </p>
                </div>
              </div>
              <div className="event-mini__people">
                <Avatar name="David Ceballos" size="sm" />
                <Avatar name="Lucía Canul" size="sm" />
                <span>Responsables asignados</span>
              </div>
            </article>

            <article className="bento-card bento-card--finance">
              <div className="bento-card__head">
                <span className="bento-tag">RF-06</span>
                <span className="bento-icon">
                  <HandCoins size={19} />
                </span>
              </div>
              <div className="bento-card__body">
                <span className="bento-kicker">Resumen del mes</span>
                <span className="bento-number bento-number--money">
                  {user && user.role === 'administrador' ? formatMoney(monthIncome, true) : '$ •••••'}
                </span>
                <h3>Ingresos protegidos</h3>
                <p>Resumen mensual, aportaciones anónimas y exportación contable.</p>
              </div>
              <span className="finance-lock">
                <Lock size={13} /> Solo pastorado y tesorería
              </span>
            </article>

            <article className="bento-card bento-card--announce">
              <div className="bento-card__head">
                <span className="bento-tag">RF-07</span>
                <span className="bento-icon">
                  <Megaphone size={19} />
                </span>
              </div>
              <div className="bento-card__body">
                <h3>Comunicados que sí llegan.</h3>
                <p>Publica, fija y edita anuncios para toda la comunidad.</p>
              </div>
              <div className="announce-mini">
                <span className="announce-mini__dot" />
                <span>
                  <strong>Retiro de comunidad</strong>
                  <em>Inscripciones abiertas · hace 2 días</em>
                </span>
              </div>
              <div className="announce-mini">
                <span className="announce-mini__dot announce-mini__dot--soft" />
                <span>
                  <strong>Nuevo horario de secretaría</strong>
                  <em>Información general · hace 6 días</em>
                </span>
              </div>
            </article>

            <article className="bento-card bento-card--reports">
              <div className="bento-card__head">
                <span className="bento-tag">RF-09</span>
                <span className="bento-icon">
                  <FileText size={19} />
                </span>
              </div>
              <div className="bento-card__body">
                <h3>Reportes listos para compartir.</h3>
                <p>Miembros, asistencia, participación e ingresos por periodo.</p>
              </div>
              <div className="report-files">
                <span>
                  <FileText size={16} /> Miembros.pdf
                </span>
                <span>
                  <Download size={16} /> Asistencia.xls
                </span>
              </div>
            </article>

            <article className="bento-card bento-card--settings">
              <div className="bento-card__head">
                <span className="bento-tag">RF-10</span>
                <span className="bento-icon">
                  <Settings size={19} />
                </span>
              </div>
              <div className="bento-card__body">
                <h3>La identidad de tu iglesia.</h3>
                <p>Logo, dirección, contacto y horarios habituales en un solo panel.</p>
              </div>
              <div className="settings-mini">
                <span className="settings-mini__logo">
                  <ChurchMark size={24} />
                </span>
                <div>
                  <strong>{church.shortName}</strong>
                  <span>{church.colonia}</span>
                </div>
                <div className="settings-mini__swatches">
                  {[church.theme.primary, church.theme.accent, church.theme.deep].map((color) => (
                    <span key={color} style={{ background: color }} />
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="section section--roles" id="roles">
          <div className="section-head">
            <div>
              <p className="eyebrow">Cada persona, su lugar</p>
              <h2>Accesos claros, confianza real.</h2>
            </div>
            <p className="section-head__aside">
              El sistema muestra únicamente lo que cada rol necesita para servir. Sin ruido, sin
              exposiciones innecesarias.
            </p>
          </div>
          <div className="role-grid">
            {ROLES.map((role, roleIndex) => {
              const Icon = role.icon
              return (
                <article className="role-card" key={role.name}>
                  <span className="role-card__index">0{roleIndex + 1}</span>
                  <span className="role-card__icon">
                    <Icon size={20} />
                  </span>
                  <h3>{role.name}</h3>
                  <p>{role.description}</p>
                  <div className="role-card__tags">
                    {role.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="quote-band">
          <Quote size={26} className="quote-band__mark" />
          <blockquote>
            «Cuidar a las personas es un trabajo de todos los días. La herramienta solo debería
            ayudarnos a hacerlo mejor.»
          </blockquote>
          <div className="quote-band__author">
            <Avatar name="David Ceballos" size="md" />
            <span>
              <strong>Pbro. David Ceballos</strong>
              <em>Catedral de San Ildefonso, Centro</em>
            </span>
          </div>
        </section>

        <section className="cta-band" id="comenzar">
          <div className="cta-band__copy">
            <p className="eyebrow">Empieza hoy</p>
            <h2>Tu iglesia ya tiene historia. Dale un lugar donde seguir creciendo.</h2>
            <p>
              Crea tu cuenta y explora el panel completo con datos de demostración de {churchCount}{' '}
              iglesias de Mérida.
            </p>
            <div className="cta-band__actions">
              <Link to={user ? '/app' : '/registro'} className="btn btn--light btn--lg">
                {user ? 'Abrir mi panel' : 'Crear mi cuenta'} <ArrowRight size={17} />
              </Link>
              <Link to="/login" className="btn btn--outline-light btn--lg">
                Ver cuentas de demostración
              </Link>
            </div>
            <p className="cta-band__hint">
              <Check size={14} /> Sin tarjeta · Datos demo incluidos · Listo para personalizar
            </p>
          </div>
          <div className="cta-band__visual">
            <div className="cta-card">
              <div className="cta-card__art">
                <ChurchImage
                  church={church}
                  variant={index + 2}
                  className="cta-card__photo"
                  loading="eager"
                />
                {church.photo && (
                  <a
                    className="cta-card__credit"
                    href={church.photo.source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Foto: {church.photo.credit} · {church.photo.license}
                  </a>
                )}
              </div>
              <div className="cta-card__info">
                <span className="brand__mark brand__mark--dark">
                  <ChurchMark size={22} />
                </span>
                <div>
                  <strong>{church.shortName}</strong>
                  <span>{church.colonia} · Mérida</span>
                </div>
                <span className="cta-card__dot" />
              </div>
              <div className="cta-card__stats">
                <span>
                  <strong>{churchMemberCount}</strong>
                  <em>miembros</em>
                </span>
                <span>
                  <strong>{churchMinistryCount}</strong>
                  <em>ministerios</em>
                </span>
                <span>
                  <strong>{churchEventCount}</strong>
                  <em>eventos</em>
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__top">
          <div>
            <a className="brand" href="#inicio">
              <span className="brand__mark">
                <ChurchMark size={28} />
              </span>
              <span className="brand__text">
                <span className="brand__name">Casa Viva</span>
                <span className="brand__tag">Iglesias de Mérida</span>
              </span>
            </a>
            <p>Una casa digital para las comunidades de Mérida, Yucatán.</p>
          </div>
          <div className="site-footer__cols">
            <div>
              <strong>Plataforma</strong>
              <a href="#iglesias">Iglesias</a>
              <a href="#plataforma">Módulos</a>
              <a href="#roles">Roles y permisos</a>
            </div>
            <div>
              <strong>Acceso</strong>
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/registro">Crear cuenta</Link>
              <Link to="/recuperar">Recuperar contraseña</Link>
            </div>
            <div>
              <strong>Contacto</strong>
              <span>Mérida, Yucatán, México</span>
              <span>hola@casaviva.mx</span>
              <span>+52 999 000 0000</span>
            </div>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Casa Viva. Hecho con cuidado en Mérida.</span>
          <span>Proyecto de demostración · Datos ficticios</span>
        </div>
      </footer>
    </div>
  )
}

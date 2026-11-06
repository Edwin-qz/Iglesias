import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { ChurchImage } from '../components/ChurchImage'
import { ChurchMark } from '../components/Brand'
import { RoleBadge } from '../components/ui'
import { DEMO_ACCOUNTS, DEMO_PASSWORD_VALUE } from '../data/seed'
import { cn } from '../lib/utils'
import { useToast } from '../components/Toast'

/* ------------------------------------------------------------
   Shared shell
------------------------------------------------------------ */
function AuthShell({ children }: { children: ReactNode }) {
  const { db } = useStore()
  const [churchIndex, setChurchIndex] = useState(0)
  const church = db.churches[churchIndex]

  useEffect(() => {
    const timer = window.setInterval(() => {
      setChurchIndex((current) => (current + 1) % db.churches.length)
    }, 7000)
    return () => window.clearInterval(timer)
  }, [db.churches.length])

  return (
    <div className="auth">
      <aside className="auth__visual">
        <div className="auth__art" key={church.id}>
          <ChurchImage
            church={church}
            variant={churchIndex + 1}
            className="auth__art-photo"
            loading="eager"
          />
        </div>
        <div className="auth__overlay" />
        <div className="auth__visual-top">
          <Link to="/" className="brand brand--on-dark">
            <span className="brand__mark">
              <ChurchMark size={28} />
            </span>
            <span className="brand__text">
              <span className="brand__name">Casa Viva</span>
              <span className="brand__tag">Iglesias de Mérida</span>
            </span>
          </Link>
          <span className="auth__demo-badge">
            <Sparkles size={12} /> Demo
          </span>
        </div>

        <div className="auth__panel">
          <p className="auth__panel-eyebrow">Comunidad anfitriona</p>
          <h2>{church.name}</h2>
          <p className="auth__panel-address">
            <MapPin size={13} /> {church.address} · {church.colonia}
          </p>
          <p className="auth__panel-schedule">
            {church.schedules[0]?.day} · {church.schedules[0]?.time} — {church.schedules[0]?.label}
          </p>
          {church.photo && (
            <a
              className="auth__panel-credit"
              href={church.photo.source}
              target="_blank"
              rel="noreferrer"
            >
              Foto: {church.photo.credit} · {church.photo.license}
            </a>
          )}
          <div className="auth__panel-dots" role="tablist" aria-label="Iglesias">
            {db.churches.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={cn('auth__panel-dot', index === churchIndex && 'is-active')}
                onClick={() => setChurchIndex(index)}
                aria-label={item.name}
                aria-selected={index === churchIndex}
                role="tab"
              />
            ))}
          </div>
        </div>
      </aside>

      <main className="auth__main">
        <div className="auth__main-top">
          <Link to="/" className="auth__back">
            <ArrowLeft size={15} /> Volver al inicio
          </Link>
          <span className="auth__secure">
            <ShieldCheck size={13} /> Acceso seguro
          </span>
        </div>
        <div className="auth__content">{children}</div>
        <p className="auth__legal">
          © {new Date().getFullYear()} Casa Viva · Proyecto de demostración. Los datos de las
          iglesias y personas son ficticios.
        </p>
      </main>
    </div>
  )
}

function PasswordField({
  value,
  onChange,
  label = 'Contraseña',
  placeholder = 'Tu contraseña',
  autoComplete = 'current-password',
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  autoComplete?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="field">
      <span>{label}</span>
      <span className="password-wrap">
        <input
          className="input"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
           spellCheck={false}
          required
        />
        <button
          type="button"
          className="password-wrap__toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  )
}

function PasswordStrength({ value }: { value: string }) {
  const score =
    (value.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(value) ? 1 : 0) +
    (/[0-9]/.test(value) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(value) ? 1 : 0)
  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte']
  return (
    <div className="strength">
      <div className="strength__bars">
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={index < score ? 'is-on' : ''} />
        ))}
      </div>
      <span>{value ? labels[score] : 'Mínimo 8 caracteres'}</span>
    </div>
  )
}

function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div className="form-alert" role="alert">
      {children}
    </div>
  )
}

/* ------------------------------------------------------------
   Login
------------------------------------------------------------ */
export function Login() {
  const { user, login } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { notify } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/app'

  if (user) return <Navigate to="/app" replace />

  const doLogin = (loginEmail: string, loginPassword: string) => {
    const result = login(loginEmail, loginPassword)
    if (!result.ok) {
      setError(result.message)
      return
    }
    notify(result.message ?? 'Bienvenido')
    navigate(from, { replace: true })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    window.setTimeout(() => {
      doLogin(email, password)
      setSubmitting(false)
    }, 250)
  }

  return (
    <AuthShell>
      <div className="auth-form">
        <p className="eyebrow">Bienvenido de nuevo</p>
        <h1>Entra a tu casa.</h1>
        <p className="auth-form__intro">
          Gestiona la vida de tu iglesia con calma: miembros, asistencia, finanzas y comunicación en
          un solo lugar.
        </p>

        <form onSubmit={handleSubmit} className="auth-form__body" noValidate>
          {error && <FormAlert>{error}</FormAlert>}
          <label className="field">
            <span>Correo electrónico</span>
            <span className="input-icon">
              <Mail size={16} />
              <input
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@iglesia.mx"
                autoComplete="email"
                spellCheck={false}
                required
              />
            </span>
          </label>

          <PasswordField
            value={password}
            onChange={setPassword}
            placeholder="Tu contraseña"
            autoComplete="current-password"
          />

          <div className="auth-form__row">
            <label className="checkbox">
              <input type="checkbox" defaultChecked />
              Mantener sesión iniciada
            </label>
            <Link to="/recuperar" className="auth-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Iniciar sesión'} <ArrowRight size={17} />
          </button>
        </form>

        <div className="auth-divider">
          <span>Acceso rápido de demostración</span>
        </div>
        <p className="auth-form__demo-note">
          Elige un rol para entrar al panel con su nivel de permisos. Todas las cuentas usan la
          contraseña <code>{DEMO_PASSWORD_VALUE}</code>.
        </p>
        <div className="demo-logins">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className="demo-login"
              onClick={() => doLogin(account.email, account.password)}
            >
              <span className="demo-login__top">
                <RoleBadge role={account.role} />
                <ArrowRight size={13} />
              </span>
              <strong>{account.name}</strong>
              <span>{account.email}</span>
            </button>
          ))}
        </div>

        <p className="auth-form__switch">
          ¿Aún no tienes cuenta? <Link to="/registro">Crear una cuenta</Link>
        </p>
      </div>
    </AuthShell>
  )
}

/* ------------------------------------------------------------
   Register
------------------------------------------------------------ */
export function Register() {
  const { user, register, db } = useStore()
  const navigate = useNavigate()
  const { notify } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [churchId, setChurchId] = useState(db.churches[0].id)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to="/app" replace />

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!name.trim()) return setError('Escribe tu nombre completo.')
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirm) return setError('Las contraseñas no coinciden.')
    if (!accepted) return setError('Confirma que aceptas usar los datos de demostración.')
    const result = register({ name, email, password, churchId })
    if (!result.ok) return setError(result.message)
    notify(result.message ?? 'Cuenta creada')
    navigate('/app', { replace: true })
  }

  return (
    <AuthShell>
      <div className="auth-form">
        <p className="eyebrow">Nueva cuenta</p>
        <h1>Haz espacio en Casa Viva.</h1>
        <p className="auth-form__intro">
          Crea tu cuenta para acompañar a tu comunidad. Un administrador podrá ajustar tu rol dentro
          de la iglesia.
        </p>

        <form onSubmit={handleSubmit} className="auth-form__body" noValidate>
          {error && <FormAlert>{error}</FormAlert>}
          <label className="field">
            <span>Nombre completo</span>
            <span className="input-icon">
              <UserRound size={16} />
              <input
                className="input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="María José Pech"
                autoComplete="name"
                required
              />
            </span>
          </label>

          <label className="field">
            <span>Correo electrónico</span>
            <span className="input-icon">
              <Mail size={16} />
              <input
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@iglesia.mx"
                autoComplete="email"
                spellCheck={false}
                required
              />
            </span>
          </label>

          <label className="field">
            <span>Iglesia</span>
            <select
              className="select"
              value={churchId}
              onChange={(event) => setChurchId(event.target.value)}
            >
              {db.churches.map((church) => (
                <option key={church.id} value={church.id}>
                  {church.name} · {church.colonia}
                </option>
              ))}
            </select>
          </label>

          <PasswordField
            value={password}
            onChange={setPassword}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />
          <PasswordStrength value={password} />

          <PasswordField
            value={confirm}
            onChange={setConfirm}
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
          />

          <label className="checkbox">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            <span>
              Entiendo que esta es una demostración con datos ficticios y acepto que mi cuenta se
              cree con rol de <strong>coordinador</strong> hasta que un administrador lo cambie.
            </span>
          </label>

          <button type="submit" className="btn btn--primary btn--lg btn--block">
            Crear mi cuenta <ArrowRight size={17} />
          </button>
        </form>

        <p className="auth-form__switch">
          ¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </AuthShell>
  )
}

/* ------------------------------------------------------------
   Recover / reset password
------------------------------------------------------------ */
export function Recover() {
  const { user, requestReset, resetPassword } = useStore()
  const navigate = useNavigate()
  const { notify } = useToast()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [demoCode, setDemoCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request')
  const [error, setError] = useState('')

  if (user) return <Navigate to="/app" replace />

  const handleRequest = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    const result = requestReset(email)
    if (!result.ok) return setError(result.message)
    setDemoCode(result.code ?? '')
    setStep('reset')
    notify('Código de recuperación generado')
  }

  const handleReset = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirm) return setError('Las contraseñas no coinciden.')
    const result = resetPassword(email, code, password)
    if (!result.ok) return setError(result.message)
    setStep('done')
    notify(result.message ?? 'Contraseña actualizada')
  }

  return (
    <AuthShell>
      <div className="auth-form">
        <p className="eyebrow">
          <KeyRound size={13} /> Recuperar acceso
        </p>
        <h1>
          {step === 'done' ? 'Todo listo.' : step === 'reset' ? 'Crea una nueva contraseña.' : 'Volvamos a entrar.'}
        </h1>
        <p className="auth-form__intro">
          {step === 'done'
            ? 'Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión con tus nuevas credenciales.'
            : step === 'reset'
              ? 'Ingresa el código de verificación y define una nueva contraseña para tu cuenta.'
              : 'Escribe el correo asociado a tu cuenta. En esta demostración el código se mostrará en pantalla, sin enviar correos reales.'}
        </p>

        {step === 'request' && (
          <form onSubmit={handleRequest} className="auth-form__body" noValidate>
            {error && <FormAlert>{error}</FormAlert>}
            <label className="field">
              <span>Correo electrónico</span>
              <span className="input-icon">
                <Mail size={16} />
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@iglesia.mx"
                  autoComplete="email"
                  spellCheck={false}
                  required
                />
              </span>
            </label>
            <button type="submit" className="btn btn--primary btn--lg btn--block">
              Enviar código <ArrowRight size={17} />
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleReset} className="auth-form__body" noValidate>
            {error && <FormAlert>{error}</FormAlert>}
            <div className="demo-code">
              <span>
                <Sparkles size={13} /> Código de demostración
              </span>
              <strong>{demoCode}</strong>
              <p>Válido por 15 minutos. En producción llegaría a tu correo.</p>
            </div>
            <label className="field">
              <span>Código de verificación</span>
              <span className="input-icon">
                <Lock size={16} />
                <input
                  className="input"
                  inputMode="numeric"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </span>
            </label>
            <PasswordField
              value={password}
              onChange={setPassword}
              label="Nueva contraseña"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
            <PasswordStrength value={password} />
            <PasswordField
              value={confirm}
              onChange={setConfirm}
              label="Confirmar contraseña"
              placeholder="Repite la contraseña"
              autoComplete="new-password"
            />
            <button type="submit" className="btn btn--primary btn--lg btn--block">
              Actualizar contraseña <Check size={17} />
            </button>
            <button
              type="button"
              className="link-btn auth-form__resend"
              onClick={() => {
                setStep('request')
                setError('')
              }}
            >
              Usar otro correo
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="auth-form__body">
            <div className="auth-success">
              <span>
                <Check size={22} />
              </span>
              <p>La contraseña de <strong>{email}</strong> fue actualizada.</p>
            </div>
            <Link to="/login" className="btn btn--primary btn--lg btn--block">
              Iniciar sesión <ArrowRight size={17} />
            </Link>
          </div>
        )}

        <p className="auth-form__switch">
          <Link to="/login">Volver a iniciar sesión</Link>
        </p>
      </div>
    </AuthShell>
  )
}

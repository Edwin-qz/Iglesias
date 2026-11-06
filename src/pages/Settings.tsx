import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  ArrowUpRight,
  Building2,
  Check,
  Clock,
  ImagePlus,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useToast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/ui'
import { ChurchMark } from '../components/Brand'
import { ChurchImage } from '../components/ChurchImage'
import type { Church, Schedule } from '../types'
import { cn, formatDate, toISO } from '../lib/utils'
import { googleMapsPlaceUrl } from '../lib/maps'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

type ChurchForm = Pick<
  Church,
  'name' | 'shortName' | 'address' | 'colonia' | 'phone' | 'email' | 'pastor' | 'description' | 'mission' | 'founded'
>

export default function Settings() {
  const { db, user, church, currentChurchId, can, mutate, resetDemo } = useStore()
  const { notify } = useToast()
  const manage = can('settings.manage')
  const churchIndex = Math.max(
    0,
    db.churches.findIndex((item) => item.id === church.id),
  )
  const [form, setForm] = useState<ChurchForm>({
    name: church.name,
    shortName: church.shortName,
    address: church.address,
    colonia: church.colonia,
    phone: church.phone,
    email: church.email,
    pastor: church.pastor,
    description: church.description,
    mission: church.mission,
    founded: church.founded,
  })
  const [schedules, setSchedules] = useState<Schedule[]>(church.schedules)
  const [logo, setLogo] = useState(church.logo ?? '')
  const [error, setError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setForm({
      name: church.name,
      shortName: church.shortName,
      address: church.address,
      colonia: church.colonia,
      phone: church.phone,
      email: church.email,
      pastor: church.pastor,
      description: church.description,
      mission: church.mission,
      founded: church.founded,
    })
    setSchedules(church.schedules)
    setLogo(church.logo ?? '')
    setError('')
    setDirty(false)
  }, [church])

  const update = (patch: Partial<ChurchForm>) => {
    setForm((current) => ({ ...current, ...patch }))
    setDirty(true)
  }

  const handleLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      notify('Selecciona un archivo de imagen válido.', 'error')
      return
    }
    if (file.size > 1024 * 1024) {
      notify('El logotipo debe pesar menos de 1 MB.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setLogo(String(reader.result ?? ''))
      setDirty(true)
    }
    reader.readAsDataURL(file)
  }

  const updateSchedule = (index: number, patch: Partial<Schedule>) => {
    setSchedules((current) =>
      current.map((schedule, scheduleIndex) =>
        scheduleIndex === index ? { ...schedule, ...patch } : schedule,
      ),
    )
    setDirty(true)
  }

  const addSchedule = () => {
    setSchedules((current) => [...current, { day: 'Domingo', time: '10:00', label: 'Nuevo encuentro' }])
    setDirty(true)
  }

  const removeSchedule = (index: number) => {
    setSchedules((current) => current.filter((_, scheduleIndex) => scheduleIndex !== index))
    setDirty(true)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!form.name.trim() || !form.shortName.trim()) {
      return setError('El nombre y el nombre corto de la iglesia son obligatorios.')
    }
    if (!form.address.trim() || !form.colonia.trim()) {
      return setError('Registra la dirección y la colonia.')
    }
    if (schedules.length === 0) {
      return setError('Agrega al menos un horario habitual de reunión.')
    }
    const updated: Church = {
      ...church,
      ...form,
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      logo: logo || undefined,
      schedules: schedules.filter((schedule) => schedule.label.trim()),
    }
    mutate((current) => ({
      ...current,
      churches: current.churches.map((item) => (item.id === updated.id ? updated : item)),
    }))
    setDirty(false)
    notify('Configuración de la iglesia actualizada.')
  }

  const handleReset = () => {
    resetDemo()
    setConfirmReset(false)
    notify('Datos de demostración restaurados.', 'info')
  }

  if (!user) return null

  return (
    <>
      <PageHeader
        eyebrow="RF-10 · Configuración de la iglesia"
        title="La identidad de tu comunidad."
        description={`Nombre, logotipo, contacto, horarios e información institucional de ${church.shortName}.`}
        actions={
          manage ? (
            <button
              type="submit"
              form="church-form"
              className="btn btn--primary btn--sm"
              disabled={!dirty}
            >
              <Save size={15} /> Guardar cambios
            </button>
          ) : (
            <span className="chip chip--outline">
              <Lock size={12} /> Solo lectura
            </span>
          )
        }
      />

      <form id="church-form" className="settings-layout" onSubmit={submit} noValidate>
        <div className="settings-main">
          <section className="panel settings-card">
            <div className="panel__head">
              <div>
                <h2 className="panel__title">Identidad institucional</h2>
                <p className="panel__subtitle">Así aparece tu iglesia en el sistema y el sitio público</p>
              </div>
              <Building2 size={18} className="muted" />
            </div>

            {error && (
              <div className="form-alert settings-alert" role="alert">
                {error}
              </div>
            )}

            <div className="settings-identity">
              <div className="settings-logo">
                <div className="settings-logo__preview">
                  {logo ? (
                    <img src={logo} alt={`Logotipo de ${form.shortName}`} />
                  ) : (
                    <ChurchMark size={46} />
                  )}
                </div>
                <div className="settings-logo__actions">
                  <label className={cn('btn btn--outline btn--sm', !manage && 'is-disabled')}>
                    <Upload size={14} /> Subir logotipo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogo}
                      hidden
                      disabled={!manage}
                    />
                  </label>
                  {logo && manage && (
                    <button
                      type="button"
                      className="link-btn link-btn--danger"
                      onClick={() => {
                        setLogo('')
                        setDirty(true)
                      }}
                    >
                      <Trash2 size={12} /> Quitar
                    </button>
                  )}
                </div>
                <p className="settings-logo__hint">
                  PNG, JPG o SVG · máximo 1 MB. Se guarda localmente en esta demostración.
                </p>
              </div>

              <div className="settings-fields">
                <label className="field field--full">
                  <span>Nombre oficial de la iglesia <em>*</em></span>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(event) => update({ name: event.target.value })}
                    disabled={!manage}
                    required
                  />
                </label>
                <label className="field">
                  <span>Nombre corto <em>*</em></span>
                  <input
                    className="input"
                    value={form.shortName}
                    onChange={(event) => update({ shortName: event.target.value })}
                    disabled={!manage}
                    required
                  />
                </label>
                <label className="field">
                  <span>Año de fundación</span>
                  <input
                    className="input"
                    value={form.founded}
                    onChange={(event) => update({ founded: event.target.value })}
                    disabled={!manage}
                  />
                </label>
                <label className="field field--full">
                  <span>Pastor / responsable</span>
                  <input
                    className="input"
                    value={form.pastor}
                    onChange={(event) => update({ pastor: event.target.value })}
                    disabled={!manage}
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="panel settings-card">
            <div className="panel__head">
              <div>
                <h2 className="panel__title">Fotografía y ubicación</h2>
                <p className="panel__subtitle">
                  Imagen de referencia de la iglesia y acceso directo a su ficha en Google Maps
                </p>
              </div>
              <MapPin size={18} className="muted" />
            </div>

            <div className="settings-photo">
              <div className="settings-photo__frame">
                <ChurchImage
                  church={church}
                  variant={churchIndex}
                  className="settings-photo__img"
                />
              </div>
              <div className="settings-photo__meta">
                <p>{church.photo?.alt ?? 'Ilustración de la fachada de la iglesia.'}</p>
                {church.photo && (
                  <span>
                    Foto:{' '}
                    <a href={church.photo.source} target="_blank" rel="noreferrer">
                      {church.photo.credit}
                    </a>{' '}
                    · {church.photo.license}
                  </span>
                )}
                <a
                  className="btn btn--outline btn--sm"
                  href={googleMapsPlaceUrl(church)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ArrowUpRight size={14} /> Ver fotos en Google Maps
                </a>
                <span className="settings-photo__coords">
                  {church.lat.toFixed(5)}, {church.lng.toFixed(5)}
                </span>
              </div>
            </div>
          </section>

          <section className="panel settings-card">
            <div className="panel__head">
              <div>
                <h2 className="panel__title">Dirección y contacto</h2>
                <p className="panel__subtitle">Datos visibles para la comunidad y en el directorio</p>
              </div>
              <MapPin size={18} className="muted" />
            </div>
            <div className="form-grid settings-contact">
              <label className="field field--full">
                <span>Calle y número <em>*</em></span>
                <input
                  className="input"
                  value={form.address}
                  onChange={(event) => update({ address: event.target.value })}
                  disabled={!manage}
                  required
                />
              </label>
              <label className="field">
                <span>Colonia <em>*</em></span>
                <input
                  className="input"
                  value={form.colonia}
                  onChange={(event) => update({ colonia: event.target.value })}
                  disabled={!manage}
                  required
                />
              </label>
              <label className="field">
                <span>Ciudad</span>
                <input className="input" value="Mérida, Yucatán" disabled readOnly />
              </label>
              <label className="field">
                <span>
                  <Phone size={11} /> Teléfono
                </span>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(event) => update({ phone: event.target.value })}
                  disabled={!manage}
                />
              </label>
              <label className="field">
                <span>
                  <Mail size={11} /> Correo de contacto
                </span>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(event) => update({ email: event.target.value })}
                  disabled={!manage}
                />
              </label>
            </div>
          </section>

          <section className="panel settings-card">
            <div className="panel__head">
              <div>
                <h2 className="panel__title">Horarios habituales de reuniones</h2>
                <p className="panel__subtitle">Cultos, misas y encuentros regulares de la comunidad</p>
              </div>
              <Clock size={18} className="muted" />
            </div>
            <div className="schedule-list">
              {schedules.map((schedule, index) => (
                <div className="schedule-row" key={`${schedule.day}-${index}`}>
                  <label className="field">
                    <span>Día</span>
                    <select
                      className="select"
                      value={schedule.day}
                      onChange={(event) => updateSchedule(index, { day: event.target.value })}
                      disabled={!manage}
                    >
                      {DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Hora</span>
                    <input
                      className="input"
                      type="time"
                      value={schedule.time}
                      onChange={(event) => updateSchedule(index, { time: event.target.value })}
                      disabled={!manage}
                    />
                  </label>
                  <label className="field schedule-row__label">
                    <span>Nombre del encuentro</span>
                    <input
                      className="input"
                      value={schedule.label}
                      onChange={(event) => updateSchedule(index, { label: event.target.value })}
                      disabled={!manage}
                    />
                  </label>
                  {manage && (
                    <button
                      type="button"
                      className="row-action row-action--danger schedule-row__remove"
                      onClick={() => removeSchedule(index)}
                      aria-label="Eliminar horario"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {manage && (
              <button type="button" className="btn btn--outline btn--sm settings-add" onClick={addSchedule}>
                <Plus size={14} /> Agregar horario
              </button>
            )}
          </section>

          <section className="panel settings-card">
            <div className="panel__head">
              <div>
                <h2 className="panel__title">Información institucional</h2>
                <p className="panel__subtitle">Texto que presenta a la iglesia en el sitio público</p>
              </div>
              <Sparkles size={18} className="muted" />
            </div>
            <div className="form-grid">
              <label className="field field--full">
                <span>Descripción breve</span>
                <textarea
                  className="textarea"
                  value={form.description}
                  onChange={(event) => update({ description: event.target.value })}
                  disabled={!manage}
                  maxLength={320}
                />
                <span className="field__hint">{form.description.length}/320 caracteres</span>
              </label>
              <label className="field field--full">
                <span>Misión de la comunidad</span>
                <textarea
                  className="textarea"
                  value={form.mission}
                  onChange={(event) => update({ mission: event.target.value })}
                  disabled={!manage}
                  maxLength={240}
                />
                <span className="field__hint">{form.mission.length}/240 caracteres</span>
              </label>
            </div>
          </section>

          {manage && (
            <div className="settings-actions">
              <button type="submit" className="btn btn--primary" disabled={!dirty}>
                <Save size={15} /> Guardar configuración
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setForm({
                    name: church.name,
                    shortName: church.shortName,
                    address: church.address,
                    colonia: church.colonia,
                    phone: church.phone,
                    email: church.email,
                    pastor: church.pastor,
                    description: church.description,
                    mission: church.mission,
                    founded: church.founded,
                  })
                  setSchedules(church.schedules)
                  setLogo(church.logo ?? '')
                  setDirty(false)
                }}
                disabled={!dirty}
              >
                Descartar cambios
              </button>
              {dirty && <span className="settings-actions__note">Tienes cambios sin guardar.</span>}
            </div>
          )}
        </div>

        <aside className="settings-aside">
          <section className="settings-preview">
            <p className="eyebrow">Vista previa pública</p>
            <div className="settings-preview__card">
              <div
                className="settings-preview__top"
                style={{ background: church.theme.primary }}
              >
                <span className="settings-preview__logo">
                  {logo ? <img src={logo} alt="" /> : <ChurchMark size={26} />}
                </span>
                <span className="settings-preview__swatches">
                  {[church.theme.primary, church.theme.accent, church.theme.soft].map((color) => (
                    <span key={color} style={{ background: color }} />
                  ))}
                </span>
              </div>
              <div className="settings-preview__body">
                <strong>{form.name || 'Nombre de la iglesia'}</strong>
                <span>
                  <MapPin size={11} /> {form.address || 'Dirección'}
                </span>
                <span>{form.colonia || 'Colonia'}, Mérida, Yucatán</span>
                <em>{form.description || 'Descripción breve de la comunidad.'}</em>
              </div>
              <div className="settings-preview__schedules">
                {schedules.slice(0, 3).map((schedule, index) => (
                  <span key={`${schedule.day}-${index}`}>
                    <strong>{schedule.day.slice(0, 3)}</strong>
                    {schedule.time} · {schedule.label}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="panel settings-meta">
            <h3>Ficha de la iglesia</h3>
            <dl>
              <div>
                <dt>Identificador</dt>
                <dd>{church.id}</dd>
              </div>
              <div>
                <dt>Miembros</dt>
                <dd>{db.members.filter((member) => member.churchId === currentChurchId).length}</dd>
              </div>
              <div>
                <dt>Ministerios</dt>
                <dd>{db.ministries.filter((ministry) => ministry.churchId === currentChurchId).length}</dd>
              </div>
              <div>
                <dt>Última actualización</dt>
                <dd>{formatDate(toISO(new Date()), { day: '2-digit', month: 'short', year: 'numeric' })}</dd>
              </div>
            </dl>
          </section>

          <section className="panel settings-danger">
            <h3>
              <RotateCcw size={15} /> Datos de demostración
            </h3>
            <p>
              Restaura las iglesias, usuarios y registros de ejemplo. Se cerrará tu sesión y se
              perderán los cambios locales.
            </p>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw size={14} /> Restaurar demostración
            </button>
          </section>

          <section className="settings-note">
            <Check size={14} />
            <p>
              Los cambios se guardan en el navegador con <code>localStorage</code>. En producción se
              conectarían a la base de datos de la iglesia.
            </p>
          </section>
        </aside>
      </form>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Restaurar datos de demostración"
        subtitle="Esta acción reemplaza todos los datos locales."
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmReset(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn--danger btn--sm" onClick={handleReset}>
              <RotateCcw size={14} /> Restaurar
            </button>
          </>
        }
      >
        <p className="confirm-text">
          Se eliminarán los miembros, eventos, asistencias y aportaciones que hayas creado en esta
          demostración. ¿Deseas continuar?
        </p>
      </Modal>
    </>
  )
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Church, Database, Role, User } from '../types'
import { can } from '../types'
import { createSeedDatabase } from '../data/seed'
import { hashPassword, normalize, uid } from '../lib/utils'

const DB_KEY = 'casaviva.db.v5'
const SESSION_KEY = 'casaviva.session.v5'

export type ActionResult =
  | { ok: true; message?: string; code?: string }
  | { ok: false; message: string }

interface RegisterInput {
  name: string
  email: string
  password: string
  churchId: string
}

interface StoreValue {
  db: Database
  user: User | null
  church: Church
  currentChurchId: string
  can: (permission: Parameters<typeof can>[1]) => boolean
  login: (email: string, password: string) => ActionResult
  logout: () => void
  register: (input: RegisterInput) => ActionResult
  requestReset: (email: string) => ActionResult
  resetPassword: (email: string, code: string, password: string) => ActionResult
  switchChurch: (churchId: string) => ActionResult
  updateProfile: (name: string) => ActionResult
  changePassword: (currentPassword: string, newPassword: string) => ActionResult
  mutate: (recipe: (db: Database) => Database) => void
  resetDemo: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

function loadDatabase(): Database {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Database
      if (
        parsed &&
        parsed.version === 4 &&
        Array.isArray(parsed.churches) &&
        parsed.churches.length > 0 &&
        Array.isArray(parsed.members) &&
        Array.isArray(parsed.users)
      ) {
        const referenceChurches = createSeedDatabase().churches
        return {
          ...parsed,
          churches: parsed.churches.map((church) => {
            const reference = referenceChurches.find((item) => item.id === church.id)
            if (!reference) return church
            return {
              ...church,
              photo: reference.photo ?? church.photo,
              history: reference.history,
              founded: church.id === 'iglesia-fatima' ? reference.founded : church.founded,
            }
          }),
        }
      }
    }
  } catch {
    // Corrupt or unavailable storage falls back to a fresh demo.
  }
  const seeded = createSeedDatabase()
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(seeded))
  } catch {
    // Storage can be unavailable in private contexts; the app still runs in memory.
  }
  return seeded
}

function loadSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(loadDatabase)
  const [sessionUserId, setSessionUserId] = useState<string | null>(loadSession)
  const isInitialLoad = useRef(true)

  // Cargar datos reales desde MySQL al montar la aplicación
  useEffect(() => {
    let active = true
    fetch('/api/database')
      .then((res) => {
        if (!res.ok) throw new Error('Error al conectar con la API de MySQL')
        return res.json()
      })
      .then((remoteDb: Database) => {
        if (active && remoteDb && Array.isArray(remoteDb.churches) && remoteDb.churches.length > 0) {
          setDb(remoteDb)
          // Marcamos que ya se completó la carga inicial tras el render
          setTimeout(() => {
            isInitialLoad.current = false
          }, 100)
        }
      })
      .catch((err) => {
        console.warn('MySQL no disponible de inmediato, usando almacenamiento local:', err.message)
        isInitialLoad.current = false
      })

    return () => {
      active = false
    }
  }, [])

  const user = useMemo(
    () => db.users.find((candidate) => candidate.id === sessionUserId) ?? null,
    [db.users, sessionUserId],
  )

  useEffect(() => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db))
    } catch {
      // Ignore quota or privacy-mode failures.
    }

    // Si ya pasó la carga inicial, sincronizar cambios a MySQL con debounce
    if (!isInitialLoad.current) {
      const timer = setTimeout(() => {
        fetch('/api/database/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db),
        }).catch((err) => {
          console.error('Error guardando cambios en MySQL:', err)
        })
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [db])

  useEffect(() => {
    try {
      if (sessionUserId) localStorage.setItem(SESSION_KEY, sessionUserId)
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      // Ignore storage failures.
    }
  }, [sessionUserId])

  const currentChurchId = user?.churchId ?? db.churches[0].id
  const church = useMemo(
    () => db.churches.find((item) => item.id === currentChurchId) ?? db.churches[0],
    [db.churches, currentChurchId],
  )

  const mutate = useCallback((recipe: (database: Database) => Database) => {
    setDb((current) => recipe(current))
  }, [])

  const login = useCallback(
    (email: string, password: string): ActionResult => {
      const normalizedEmail = normalize(email.trim())
      const found = db.users.find((candidate) => normalize(candidate.email) === normalizedEmail)
      if (!found) return { ok: false, message: 'No encontramos una cuenta con ese correo.' }
      if (!found.active) {
        return { ok: false, message: 'Esta cuenta está desactivada. Contacta al administrador.' }
      }
      if (found.passwordHash !== hashPassword(password)) {
        return { ok: false, message: 'La contraseña no coincide. Intenta de nuevo.' }
      }
      setSessionUserId(found.id)
      return { ok: true, message: `Bienvenido, ${found.name.split(' ')[0]}.` }
    },
    [db.users],
  )

  const logout = useCallback(() => {
    setSessionUserId(null)
  }, [])

  const register = useCallback(
    (input: RegisterInput): ActionResult => {
      const email = input.email.trim().toLowerCase()
      if (db.users.some((candidate) => normalize(candidate.email) === normalize(email))) {
        return { ok: false, message: 'Ya existe una cuenta registrada con este correo.' }
      }
      if (!db.churches.some((item) => item.id === input.churchId)) {
        return { ok: false, message: 'Selecciona una iglesia válida.' }
      }
      if (input.password.length < 8) {
        return { ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' }
      }
      const newUser: User = {
        id: uid('u'),
        name: input.name.trim(),
        email,
        passwordHash: hashPassword(input.password),
        role: 'coordinador' as Role,
        churchId: input.churchId,
        active: true,
        createdAt: new Date().toISOString(),
      }
      setDb((current) => ({ ...current, users: [...current.users, newUser] }))
      setSessionUserId(newUser.id)
      return {
        ok: true,
        message: 'Cuenta creada. Un administrador puede ajustar tu rol.',
      }
    },
    [db.users, db.churches],
  )

  const requestReset = useCallback(
    (email: string): ActionResult => {
      const normalizedEmail = normalize(email.trim())
      const found = db.users.find((candidate) => normalize(candidate.email) === normalizedEmail)
      if (!found) {
        return { ok: false, message: 'No existe una cuenta asociada a ese correo.' }
      }
      const code = String(Math.floor(100000 + Math.random() * 900000))
      const reset = {
        email: found.email,
        code,
        expiresAt: Date.now() + 1000 * 60 * 15,
      }
      setDb((current) => ({
        ...current,
        passwordResets: [
          ...current.passwordResets.filter(
            (item) => normalize(item.email) !== normalize(found.email),
          ),
          reset,
        ],
      }))
      return { ok: true, code, message: 'Código de recuperación generado.' }
    },
    [db.users],
  )

  const resetPassword = useCallback(
    (email: string, code: string, password: string): ActionResult => {
      const normalizedEmail = normalize(email.trim())
      const reset = db.passwordResets.find(
        (item) => normalize(item.email) === normalizedEmail && item.code === code.trim(),
      )
      if (!reset) return { ok: false, message: 'El código no es válido.' }
      if (reset.expiresAt < Date.now()) {
        return { ok: false, message: 'El código expiró. Solicita uno nuevo.' }
      }
      if (password.length < 8) {
        return { ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' }
      }
      setDb((current) => ({
        ...current,
        users: current.users.map((candidate) =>
          normalize(candidate.email) === normalizedEmail
            ? { ...candidate, passwordHash: hashPassword(password) }
            : candidate,
        ),
        passwordResets: current.passwordResets.filter(
          (item) => normalize(item.email) !== normalizedEmail,
        ),
      }))
      return { ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' }
    },
    [db.passwordResets],
  )

  const switchChurch = useCallback(
    (churchId: string): ActionResult => {
      if (!user) return { ok: false, message: 'Inicia sesión para cambiar de iglesia.' }
      if (user.role !== 'administrador') {
        return { ok: false, message: 'Solo un administrador puede cambiar de iglesia.' }
      }
      if (!db.churches.some((item) => item.id === churchId)) {
        return { ok: false, message: 'Iglesia no encontrada.' }
      }
      setDb((current) => ({
        ...current,
        users: current.users.map((item) =>
          item.id === user.id ? { ...item, churchId } : item,
        ),
      }))
      return { ok: true }
    },
    [db.churches, user],
  )

  const updateProfile = useCallback(
    (name: string): ActionResult => {
      if (!user) return { ok: false, message: 'Sesión no válida.' }
      if (!name.trim()) return { ok: false, message: 'El nombre no puede estar vacío.' }
      setDb((current) => ({
        ...current,
        users: current.users.map((item) =>
          item.id === user.id ? { ...item, name: name.trim() } : item,
        ),
      }))
      return { ok: true, message: 'Perfil actualizado.' }
    },
    [user],
  )

  const changePassword = useCallback(
    (currentPassword: string, newPassword: string): ActionResult => {
      if (!user) return { ok: false, message: 'Sesión no válida.' }
      if (user.passwordHash !== hashPassword(currentPassword)) {
        return { ok: false, message: 'La contraseña actual no coincide.' }
      }
      if (newPassword.length < 8) {
        return { ok: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' }
      }
      setDb((current) => ({
        ...current,
        users: current.users.map((item) =>
          item.id === user.id ? { ...item, passwordHash: hashPassword(newPassword) } : item,
        ),
      }))
      return { ok: true, message: 'Contraseña actualizada correctamente.' }
    },
    [user],
  )

  const resetDemo = useCallback(() => {
    const fresh = createSeedDatabase()
    setDb(fresh)
    setSessionUserId(null)
    fetch('/api/database/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fresh),
    }).catch((err) => console.error('Error al restaurar demo en MySQL:', err))
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      // Ignore.
    }
  }, [])

  const value: StoreValue = {
    db,
    user,
    church,
    currentChurchId,
    can: (permission) => can(user?.role, permission),
    login,
    logout,
    register,
    requestReset,
    resetPassword,
    switchChurch,
    updateProfile,
    changePassword,
    mutate,
    resetDemo,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore debe usarse dentro de AppStoreProvider')
  return context
}

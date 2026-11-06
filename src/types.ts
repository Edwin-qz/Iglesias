export type Role =
  | 'administrador'
  | 'pastor'
  | 'secretario'
  | 'tesorero'
  | 'coordinador'

export type Permission =
  | 'dashboard'
  | 'members.view'
  | 'members.manage'
  | 'attendance.view'
  | 'attendance.manage'
  | 'events.view'
  | 'events.manage'
  | 'ministries.view'
  | 'ministries.manage'
  | 'finance.view'
  | 'finance.manage'
  | 'announcements.view'
  | 'announcements.manage'
  | 'reports.view'
  | 'reports.finance'
  | 'users.manage'
  | 'settings.view'
  | 'settings.manage'

export interface ChurchTheme {
  primary: string
  deep: string
  accent: string
  soft: string
  tint: string
}

export interface Schedule {
  day: string
  time: string
  label: string
}

export interface ChurchPhoto {
  src: string
  alt: string
  credit: string
  license: string
  source: string
  /** CSS object-position for tight crops, e.g. "50% 20%" on portrait photos. */
  position?: string
}

export interface ChurchHistory {
  summary: string
  architecture: string
  timeline: Array<{ year: string; event: string }>
  sources: Array<{ label: string; url: string }>
}

export interface Church {
  id: string
  name: string
  shortName: string
  address: string
  colonia: string
  lat: number
  lng: number
  phone: string
  email: string
  pastor: string
  description: string
  mission: string
  founded: string
  logo?: string
  photo?: ChurchPhoto
  history?: ChurchHistory
  schedules: Schedule[]
  theme: ChurchTheme
}

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: Role
  churchId: string
  active: boolean
  createdAt: string
}

export interface PasswordReset {
  email: string
  code: string
  expiresAt: number
}

export interface Member {
  id: string
  churchId: string
  firstName: string
  lastName: string
  phone: string
  email: string
  birthDate: string
  joinedAt: string
  active: boolean
  ministryIds: string[]
  address?: string
  notes?: string
}

export interface Ministry {
  id: string
  churchId: string
  name: string
  description: string
  color: string
  coordinatorId: string
  memberIds: string[]
  meetingDay: string
  meetingTime: string
}

export type EventType = 'culto' | 'reunion' | 'actividad' | 'administrativo'
export type EventStatus = 'programado' | 'finalizado' | 'cancelado'

export interface ChurchEvent {
  id: string
  churchId: string
  title: string
  type: EventType
  date: string
  time: string
  place: string
  description: string
  responsibleId: string
  ministryId?: string
  status: EventStatus
}

export interface Attendance {
  id: string
  churchId: string
  eventId: string
  date: string
  presentIds: string[]
  absentIds: string[]
  notes?: string
  recordedBy: string
  recordedAt: string
}

export type DonationMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'deposito'

export interface Donation {
  id: string
  churchId: string
  date: string
  amount: number
  concept: string
  method: DonationMethod
  anonymous: boolean
  memberId?: string
  note?: string
}

export interface Announcement {
  id: string
  churchId: string
  title: string
  body: string
  category: 'general' | 'evento' | 'servicio' | 'urgente'
  publishedAt: string
  pinned: boolean
  authorId: string
}

export interface Database {
  version: number
  churches: Church[]
  users: User[]
  members: Member[]
  ministries: Ministry[]
  events: ChurchEvent[]
  attendance: Attendance[]
  donations: Donation[]
  announcements: Announcement[]
  passwordResets: PasswordReset[]
}

export const ROLE_LABELS: Record<Role, string> = {
  administrador: 'Administrador',
  pastor: 'Pastor',
  secretario: 'Secretario',
  tesorero: 'Tesorero',
  coordinador: 'Coordinador',
}

const ALL_PERMISSIONS: Permission[] = [
  'dashboard',
  'members.view',
  'members.manage',
  'attendance.view',
  'attendance.manage',
  'events.view',
  'events.manage',
  'ministries.view',
  'ministries.manage',
  'finance.view',
  'finance.manage',
  'announcements.view',
  'announcements.manage',
  'reports.view',
  'reports.finance',
  'users.manage',
  'settings.view',
  'settings.manage',
]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  administrador: ALL_PERMISSIONS,
  pastor: ALL_PERMISSIONS.filter((p) => p !== 'users.manage'),
  secretario: [
    'dashboard',
    'members.view',
    'members.manage',
    'attendance.view',
    'attendance.manage',
    'events.view',
    'events.manage',
    'ministries.view',
    'ministries.manage',
    'announcements.view',
    'announcements.manage',
    'reports.view',
    'settings.view',
  ],
  tesorero: [
    'dashboard',
    'members.view',
    'events.view',
    'finance.view',
    'finance.manage',
    'announcements.view',
    'reports.view',
    'reports.finance',
  ],
  coordinador: [
    'dashboard',
    'members.view',
    'attendance.view',
    'attendance.manage',
    'events.view',
    'ministries.view',
    'announcements.view',
  ],
}

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

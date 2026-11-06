import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { ROLE_LABELS, type Role } from '../types'
import { cn, initials } from '../lib/utils'

export function Avatar({
  name,
  size = 'md',
  tone,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  tone?: string
}) {
  return (
    <span
      className={`avatar avatar--${size}`}
      style={tone ? { background: tone, color: '#fff' } : undefined}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

export function RoleBadge({ role }: { role: Role }) {
  return <span className={`role-badge role-badge--${role}`}>{ROLE_LABELS[role]}</span>
}

export function StatusPill({ active, labels }: { active: boolean; labels?: [string, string] }) {
  return (
    <span className={cn('status-pill', active ? 'status-pill--active' : 'status-pill--inactive')}>
      <span className="status-pill__dot" />
      {labels ? (active ? labels[0] : labels[1]) : active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-header__title">{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string; count?: number }>
  value: T
  onChange: (value: T) => void
  label?: string
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn('segmented__item', value === option.value && 'is-active')}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          {option.label}
          {option.count !== undefined && <span className="segmented__count">{option.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Buscar…',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="search-field">
      <Search size={17} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  )
}

export function ProgressBar({ value, tone }: { value: number; tone?: string }) {
  return (
    <div className="progress" aria-hidden="true">
      <span
        className="progress__fill"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: tone }}
      />
    </div>
  )
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: ReactNode
  tone?: 'default' | 'dark' | 'accent' | 'outline'
}) {
  return (
    <article className={cn('stat-tile', `stat-tile--${tone}`)}>
      <div className="stat-tile__top">
        <span className="stat-tile__icon">{icon}</span>
        {hint && <span className="stat-tile__hint">{hint}</span>}
      </div>
      <div>
        <strong className="stat-tile__value">{value}</strong>
        <span className="stat-tile__label">{label}</span>
      </div>
    </article>
  )
}

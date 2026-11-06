import { useState } from 'react'
import type { Church } from '../types'
import { ChurchArt } from './Brand'
import { cn } from '../lib/utils'

/**
 * Renders the real church photo when it is available and falls back to the
 * hand-drawn ChurchArt illustration if the image cannot be loaded.
 */
export function ChurchImage({
  church,
  variant = 0,
  className,
  loading = 'lazy',
}: {
  church: Church
  variant?: number
  className?: string
  loading?: 'eager' | 'lazy'
}) {
  const [failedId, setFailedId] = useState<string | null>(null)
  const failed = failedId === church.id

  if (!church.photo || failed) {
    return <ChurchArt theme={church.theme} variant={variant} className={cn('church-image', className)} />
  }

  return (
    <img
      key={church.id}
      className={cn('church-image', className)}
      src={church.photo.src}
      alt={church.photo.alt}
      loading={loading}
      decoding="async"
      style={church.photo.position ? { objectPosition: church.photo.position } : undefined}
      onError={() => setFailedId(church.id)}
    />
  )
}

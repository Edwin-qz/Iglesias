import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, Clock, MapPin, Navigation } from 'lucide-react'
import type { Church } from '../types'
import { ChurchImage } from './ChurchImage'
import { cn } from '../lib/utils'
import { googleMapsDirectionsUrl, googleMapsPlaceUrl } from '../lib/maps'

export function ChurchCarousel({
  churches,
  index,
  onIndexChange,
  interval = 6500,
}: {
  churches: Church[]
  index: number
  onIndexChange: (index: number) => void
  interval?: number
}) {
  const [paused, setPaused] = useState(false)
  const regionRef = useRef<HTMLDivElement>(null)
  const church = churches[index]

  useEffect(() => {
    if (paused || churches.length < 2) return
    const timer = window.setTimeout(() => {
      onIndexChange((index + 1) % churches.length)
    }, interval)
    return () => window.clearTimeout(timer)
  }, [index, paused, churches.length, onIndexChange, interval])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) setPaused(true)
  }, [])

  useEffect(() => {
    const next = churches[(index + 1) % churches.length]
    if (!next?.photo) return
    const preload = new Image()
    preload.src = next.photo.src
  }, [index, churches])

  const go = (direction: number) => {
    onIndexChange((index + direction + churches.length) % churches.length)
  }

  const mapsUrl = googleMapsDirectionsUrl(church)
  const placeUrl = googleMapsPlaceUrl(church)

  const style = {
    '--church-primary': church.theme.primary,
    '--church-deep': church.theme.deep,
    '--church-accent': church.theme.accent,
    '--church-soft': church.theme.soft,
    '--church-tint': church.theme.tint,
  } as CSSProperties

  return (
    <div
      className="carousel"
      style={style}
      ref={regionRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false)
      }}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Iglesias de Mérida"
    >
      <div className="carousel__head">
        <span className="carousel__counter">
          <strong>{String(index + 1).padStart(2, '0')}</strong>
          <span>/ {String(churches.length).padStart(2, '0')}</span>
        </span>
        <span className="carousel__location">
          <MapPin size={13} /> Mérida · {church.colonia}
        </span>
        <span className={cn('carousel__live', !paused && 'is-running')}>
          <span /> {paused ? 'En pausa' : 'Recorrido automático'}
        </span>
      </div>

      <div className="carousel__body" key={church.id}>
        <div className="carousel__art">
          <ChurchImage
            church={church}
            variant={index}
            className="carousel__art-photo"
            loading="eager"
          />
          <span className="carousel__art-label">
            <span className="carousel__art-dot" />
            {church.photo ? (
              <a href={church.photo.source} target="_blank" rel="noreferrer">
                Foto: {church.photo.credit} · {church.photo.license}
              </a>
            ) : church.founded !== '—' ? (
              `Desde ${church.founded}`
            ) : (
              'Comunidad viva'
            )}
          </span>
          <a
            className="carousel__art-map"
            href={placeUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Ver fotos de ${church.name} en Google Maps`}
          >
            <MapPin size={11} /> Fotos en Google Maps
          </a>
          <span className="carousel__coat">
            <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M24 5v16M18 11h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 43V25c0-8 6-13 14-13s14 5 14 13v18" stroke="currentColor" strokeWidth="2" />
              <path d="M19 43V34c0-3 2-5 5-5s5 2 5 5v9" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
        </div>

        <div className="carousel__info">
          <div>
            <p className="carousel__eyebrow">Comunidad anfitriona</p>
            <h2 className="carousel__name">{church.name}</h2>
            <p className="carousel__desc">{church.description}</p>
            {church.history && (
              <details className="carousel__history">
                <summary>Historia, arte y línea del tiempo</summary>
                <p>{church.history.summary}</p>
                <p><strong>Arte y arquitectura.</strong> {church.history.architecture}</p>
                <ol>
                  {church.history.timeline.map((item) => (
                    <li key={`${item.year}-${item.event}`}><b>{item.year}</b> {item.event}</li>
                  ))}
                </ol>
                <span className="carousel__history-sources">
                  Fuentes: {church.history.sources.map((source, sourceIndex) => (
                    <span key={source.url}>
                      {sourceIndex > 0 && ' · '}
                      <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
                    </span>
                  ))}
                </span>
              </details>
            )}
          </div>

          <div className="carousel__meta">
            <span>
              <MapPin size={15} />
              <span>
                {church.address}
                <em>{church.colonia}, Mérida</em>
              </span>
            </span>
            <span>
              <Clock size={15} />
              <span>
                {church.schedules[0]?.day} · {church.schedules[0]?.time}
                <em>{church.schedules[0]?.label}</em>
              </span>
            </span>
          </div>

          <div className="carousel__actions">
            <a className="btn btn--dark btn--sm" href={mapsUrl} target="_blank" rel="noreferrer">
              <Navigation size={15} /> Cómo llegar
            </a>
            <a className="btn btn--ghost btn--sm" href="#iglesias">
              Ver todas las iglesias
            </a>
          </div>
        </div>
      </div>

      <div className="carousel__foot">
        <div className="carousel__dots" role="tablist" aria-label="Seleccionar iglesia">
          {churches.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={itemIndex === index}
              className={cn('carousel__dot', itemIndex === index && 'is-active')}
              onClick={() => onIndexChange(itemIndex)}
            >
              <span>{item.shortName}</span>
              <span className="carousel__dot-line" />
            </button>
          ))}
        </div>
        <div className="carousel__arrows">
          <button type="button" className="round-btn" onClick={() => go(-1)} aria-label="Iglesia anterior">
            <ArrowLeft size={17} />
          </button>
          <button type="button" className="round-btn" onClick={() => go(1)} aria-label="Iglesia siguiente">
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
      <div className="carousel__progress" key={`${church.id}-progress`}>
        <span style={{ animationDuration: `${interval}ms`, animationPlayState: paused ? 'paused' : 'running' }} />
      </div>
    </div>
  )
}

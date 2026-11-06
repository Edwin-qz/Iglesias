import { ArrowUpRight, Clock, MapPin, Navigation, Phone } from 'lucide-react'
import type { Church } from '../types'
import { cn } from '../lib/utils'
import {
  googleMapsDirectionsUrl,
  googleMapsEmbedUrl,
  googleMapsPlaceUrl,
} from '../lib/maps'
import { ChurchImage } from './ChurchImage'

export function MeridaMap({
  churches,
  selectedId,
  onSelect,
}: {
  churches: Church[]
  selectedId: string
  onSelect: (church: Church) => void
}) {
  const selected = churches.find((church) => church.id === selectedId) ?? churches[0]
  const selectedIndex = Math.max(
    0,
    churches.findIndex((church) => church.id === selected.id),
  )
  const directionsUrl = googleMapsDirectionsUrl(selected)
  const placeUrl = googleMapsPlaceUrl(selected)

  return (
    <div className="map-bento">
      <div className="map-canvas" aria-label="Mapa de Google Maps de las iglesias en Mérida">
        <iframe
          key={selected.id}
          className="map-canvas__frame"
          title={`Mapa de ${selected.name}`}
          src={googleMapsEmbedUrl(selected)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />

        <div className="map-canvas__badge">
          <MapPin size={13} /> Mérida, Yucatán
        </div>
      </div>

      <aside className="map-detail">
        <div className="map-detail__photo">
          <ChurchImage
            church={selected}
            variant={selectedIndex}
            className="map-detail__photo-img"
          />
          <span className="map-detail__photo-tag">
            <MapPin size={11} /> {selected.colonia}
          </span>
          <span className="map-detail__photo-credit">
            {selected.photo ? (
              <a href={selected.photo.source} target="_blank" rel="noreferrer">
                Foto: {selected.photo.credit} · {selected.photo.license}
              </a>
            ) : (
              'Ilustración Casa Viva'
            )}
          </span>
        </div>

        <p className="eyebrow">Ubicación seleccionada</p>
        <h3>{selected.shortName}</h3>
        <p className="map-detail__address">{selected.address}</p>
        <p className="map-detail__colonia">{selected.colonia}, Mérida, Yucatán</p>

        <div className="map-detail__rows">
          <span>
            <Clock size={15} />
            <span>
              {selected.schedules[0]?.day} · {selected.schedules[0]?.time}
              <em>{selected.schedules[0]?.label}</em>
            </span>
          </span>
          <span>
            <Phone size={15} />
            <span>{selected.phone}</span>
          </span>
        </div>

        <div className="map-detail__actions">
          <a
            className="btn btn--primary btn--sm"
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation size={14} /> Cómo llegar
          </a>
          <a
            className="btn btn--outline btn--sm"
            href={placeUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ArrowUpRight size={14} /> Fotos en Google Maps
          </a>
        </div>

        <div className="map-detail__switcher" aria-label="Cambiar iglesia en el mapa">
          {churches.map((church) => (
            <button
              key={church.id}
              type="button"
              className={cn('map-detail__chip', selected.id === church.id && 'is-active')}
              onClick={() => onSelect(church)}
            >
              {church.shortName}
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}

import type { Church } from '../types'

function coordinates(church: Pick<Church, 'lat' | 'lng'>) {
  return `${church.lat},${church.lng}`
}

/** Opens the exact church pin in Google Maps. */
export function googleMapsPlaceUrl(church: Pick<Church, 'lat' | 'lng'>) {
  return `https://www.google.com/maps/search/?api=1&query=${coordinates(church)}`
}

/** Opens Google Maps directions using the visitor's current location as origin. */
export function googleMapsDirectionsUrl(church: Pick<Church, 'lat' | 'lng'>) {
  return `https://www.google.com/maps/dir/?api=1&destination=${coordinates(church)}&travelmode=driving`
}

/** Embeddable Google map for the selected church (no API key required). */
export function googleMapsEmbedUrl(church: Pick<Church, 'lat' | 'lng'>) {
  return `https://maps.google.com/maps?q=${coordinates(church)}&z=16&hl=es&output=embed`
}

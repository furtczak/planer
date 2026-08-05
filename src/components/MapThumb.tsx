import { relativeTime } from '../lib/date'
import { branchCount } from '../store/appReducer'
import type { MindMap } from '../types'
import { MapCanvas } from './MapCanvas'

type Props = {
  map: MindMap
  onOpen: () => void
  compact?: boolean
}

/** Kafelek dokumentu: podgląd prawdziwej mapy, pod spodem tytuł i data. */
export function MapThumb({ map, onOpen, compact = false }: Props) {
  const branches = branchCount(map)

  return (
    <button type="button" className={`map-thumb${compact ? ' is-compact' : ''}`} onClick={onOpen}>
      <span className="map-thumb-preview">
        <MapCanvas nodes={map.nodes} padding={34} />
      </span>
      <span className="map-thumb-title">
        {map.emoji ? `${map.emoji} ` : ''}{map.title || 'Bez tytułu'}
      </span>
      <span className="map-thumb-meta">
        {relativeTime(map.updatedAt)} · {branches} {branches === 1 ? 'gałąź' : 'gałęzi'}
      </span>
    </button>
  )
}

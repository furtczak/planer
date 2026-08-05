import { MapThumb } from '../components/MapThumb'
import {
  IconChevron,
  IconClock,
  IconCompose,
  IconMaps,
  IconMoon,
  IconMore,
  IconNote,
  IconPlus,
  IconSearch,
  IconSun,
  IconTrash,
} from '../components/Icons'
import { liveMaps, liveNotes, trashCount } from '../store/appReducer'
import type { AppData, Screen } from '../types'
import type { Theme } from '../hooks/useTheme'

type Props = {
  data: AppData
  theme: Theme
  onToggleTheme: () => void
  onGo: (screen: Screen) => void
  onNewMap: () => void
  onOpenSearch: () => void
  onOpenMenu: () => void
}

export function HomeScreen({
  data,
  theme,
  onToggleTheme,
  onGo,
  onNewMap,
  onOpenSearch,
  onOpenMenu,
}: Props) {
  const maps = liveMaps(data)
  const notes = liveNotes(data)
  const recent = [...maps].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6)

  const row = (
    key: string,
    icon: React.ReactNode,
    tone: string,
    label: string,
    count: number,
    screen: Screen,
  ) => (
    <button key={key} type="button" className="list-row" onClick={() => onGo(screen)}>
      <span className={`row-icon tone-${tone}`}>{icon}</span>
      <span className="row-label">{label}</span>
      <span className="row-count">{count}</span>
      <IconChevron size={17} className="row-chevron" />
    </button>
  )

  return (
    <div className="screen home">
      <div className="float-top">
        <button type="button" className="pill-btn" onClick={onNewMap} aria-label="Nowa mapa">
          <IconCompose />
        </button>
        <span className="pill-sep" />
        <button
          type="button"
          className="pill-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Jasny motyw' : 'Ciemny motyw'}
        >
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
        <span className="pill-sep" />
        <button type="button" className="pill-btn" onClick={onOpenMenu} aria-label="Więcej">
          <IconMore />
        </button>
      </div>

      <h1 className="big-title">Mind Notes</h1>

      <div className="card-list">
        {row('all', <IconMaps size={18} />, 'indigo', 'Wszystkie mapy', maps.length, {
          name: 'maps',
          scope: 'all',
        })}
        {row('notes', <IconNote size={18} />, 'teal', 'Notatki', notes.length, { name: 'notes' })}
        {row('recent', <IconClock size={18} />, 'orange', 'Ostatnie', recent.length, {
          name: 'maps',
          scope: 'recent',
        })}
        {row('trash', <IconTrash size={18} />, 'grey', 'Kosz', trashCount(data), {
          name: 'maps',
          scope: 'trash',
        })}
      </div>

      {recent.length > 0 && (
        <section className="strip">
          <h2 className="section-title">Ostatnio otwierane</h2>
          <div className="strip-scroll">
            {recent.map((map) => (
              <MapThumb key={map.id} map={map} compact onOpen={() => onGo({ name: 'map', id: map.id })} />
            ))}
          </div>
        </section>
      )}

      {maps.length === 0 && (
        <div className="empty">
          <p className="empty-icon">🧠</p>
          <h2>Zacznij od mapy</h2>
          <p className="muted">Wpisz temat w środku i rozgałęziaj myśli.</p>
          <button type="button" className="primary-btn" onClick={onNewMap}>
            Nowa mapa
          </button>
        </div>
      )}

      <div className="float-bottom">
        <button type="button" className="pill-btn" onClick={onOpenSearch} aria-label="Szukaj">
          <IconSearch />
        </button>
        <span className="pill-sep" />
        <button type="button" className="pill-btn" onClick={onNewMap} aria-label="Nowa mapa">
          <IconPlus />
        </button>
      </div>
    </div>
  )
}

import { IconGrid, IconList, IconMap, IconMenu, IconMoon, IconPlus, IconSearch, IconSun } from './Icons'
import type { SortMode, ViewMode } from '../types'
import type { Theme } from '../hooks/useTheme'

type Props = {
  title: string
  count: number
  query: string
  onQuery: (value: string) => void
  view: ViewMode
  onView: (view: ViewMode) => void
  sort: SortMode
  onSort: (sort: SortMode) => void
  theme: Theme
  onToggleTheme: () => void
  onNewNote: () => void
  onOpenMenu: () => void
}

export function Topbar({
  title,
  count,
  query,
  onQuery,
  view,
  onView,
  sort,
  onSort,
  theme,
  onToggleTheme,
  onNewNote,
  onOpenMenu,
}: Props) {
  return (
    <header className="topbar">
      <div className="topbar-row">
        <button type="button" className="icon-btn only-mobile" onClick={onOpenMenu} aria-label="Menu">
          <IconMenu />
        </button>

        <div className="topbar-title">
          <h1>{title}</h1>
          <span className="muted">
            {count} {count === 1 ? 'notatka' : count > 1 && count < 5 ? 'notatki' : 'notatek'}
          </span>
        </div>

        <label className="search">
          <IconSearch size={16} />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Szukaj w notatkach…  (/)"
            aria-label="Szukaj w notatkach"
            data-search-input
          />
        </label>

        <div className="topbar-actions">
          <div className="segmented" role="group" aria-label="Widok">
            <button
              type="button"
              className={view === 'grid' ? 'is-active' : ''}
              onClick={() => onView('grid')}
              aria-label="Kafelki"
              title="Kafelki"
            >
              <IconGrid size={16} />
            </button>
            <button
              type="button"
              className={view === 'list' ? 'is-active' : ''}
              onClick={() => onView('list')}
              aria-label="Lista"
              title="Lista"
            >
              <IconList size={16} />
            </button>
            <button
              type="button"
              className={view === 'map' ? 'is-active' : ''}
              onClick={() => onView('map')}
              aria-label="Mapa myśli"
              title="Mapa myśli"
            >
              <IconMap size={16} />
            </button>
          </div>

          <select
            className="select"
            value={sort}
            onChange={(e) => onSort(e.target.value as SortMode)}
            aria-label="Sortowanie"
          >
            <option value="updated">Ostatnio zmienione</option>
            <option value="created">Ostatnio dodane</option>
            <option value="title">Alfabetycznie</option>
          </select>

          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Jasny motyw' : 'Ciemny motyw'}
            title={theme === 'dark' ? 'Jasny motyw' : 'Ciemny motyw'}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>

          <button type="button" className="primary-btn" onClick={onNewNote}>
            <IconPlus size={16} /> Nowa notatka
          </button>
        </div>
      </div>
    </header>
  )
}

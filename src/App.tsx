import { useCallback, useRef, useState } from 'react'
import { HomeScreen } from './screens/HomeScreen'
import { MapEditorScreen } from './screens/MapEditorScreen'
import { MapsScreen } from './screens/MapsScreen'
import { NoteEditorScreen } from './screens/NoteEditorScreen'
import { NotesScreen } from './screens/NotesScreen'
import { MapThumb } from './components/MapThumb'
import { IconClose, IconDownload, IconSearch, IconUpload } from './components/Icons'
import { useAppData } from './hooks/useAppData'
import { useTheme } from './hooks/useTheme'
import { sampleData } from './lib/sample'
import { exportData, normalizeData } from './lib/storage'
import { liveMaps, liveNotes, searchMaps, searchNotes } from './store/appReducer'
import type { Screen } from './types'

function freshId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export default function App() {
  const { data, dispatch } = useAppData()
  const { theme, toggleTheme } = useTheme()

  const [stack, setStack] = useState<Screen[]>([{ name: 'home' }])
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const screen = stack[stack.length - 1]
  const go = useCallback((next: Screen) => setStack((s) => [...s, next]), [])
  const back = useCallback(
    () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    [],
  )

  const newMap = () => {
    const id = freshId('m-')
    dispatch({ type: 'createMap', id })
    go({ name: 'map', id })
  }

  const newNote = () => {
    const id = freshId('n-')
    dispatch({ type: 'createNote', id })
    go({ name: 'note', id })
  }

  const handleExport = () => {
    const blob = new Blob([exportData(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mind-notes-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMenuOpen(false)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const parsed = normalizeData(JSON.parse(await file.text()))
      if (!parsed) {
        window.alert('Nie rozpoznaję tego pliku - oczekuję eksportu z Mind Notes.')
        return
      }
      if (window.confirm(`Zaimportować ${parsed.maps.length} map i ${parsed.notes.length} notatek? Bieżące dane zostaną zastąpione.`)) {
        dispatch({ type: 'load', data: parsed })
        setStack([{ name: 'home' }])
        setMenuOpen(false)
      }
    } catch {
      window.alert('Nie udało się odczytać pliku JSON.')
    }
  }

  const openMap = data.maps.find((m) => m.id === (screen.name === 'map' ? screen.id : ''))
  const openNote = data.notes.find((n) => n.id === (screen.name === 'note' ? screen.id : ''))

  const foundMaps = searchMaps(liveMaps(data), query)
  const foundNotes = searchNotes(liveNotes(data), query)

  return (
    <div className="app">
      {screen.name === 'home' && (
        <HomeScreen
          data={data}
          theme={theme}
          onToggleTheme={toggleTheme}
          onGo={go}
          onNewMap={newMap}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenMenu={() => setMenuOpen(true)}
        />
      )}

      {screen.name === 'maps' && (
        <MapsScreen
          data={data}
          scope={screen.scope}
          onBack={back}
          onOpenMap={(id) => go({ name: 'map', id })}
          onNewMap={newMap}
          onRestoreMap={(id) => dispatch({ type: 'restoreMap', id })}
          onDeleteMap={(id) => dispatch({ type: 'deleteMap', id })}
          onRestoreNote={(id) => dispatch({ type: 'restoreNote', id })}
          onDeleteNote={(id) => dispatch({ type: 'deleteNote', id })}
        />
      )}

      {screen.name === 'notes' && (
        <NotesScreen
          data={data}
          onBack={back}
          onOpenNote={(id) => go({ name: 'note', id })}
          onNewNote={newNote}
        />
      )}

      {screen.name === 'map' &&
        (openMap ? (
          <MapEditorScreen
            map={openMap}
            onBack={back}
            onAddNode={(parentId, nodeId, text) =>
              dispatch({ type: 'addNode', mapId: openMap.id, parentId, nodeId, text })
            }
            onUpdateNode={(nodeId, patch) =>
              dispatch({ type: 'updateNode', mapId: openMap.id, nodeId, patch })
            }
            onRemoveNode={(nodeId) => dispatch({ type: 'removeNode', mapId: openMap.id, nodeId })}
            onToggleCollapse={(nodeId) =>
              dispatch({ type: 'toggleCollapse', mapId: openMap.id, nodeId })
            }
            onSetColor={(nodeId, color) =>
              dispatch({ type: 'setBranchColor', mapId: openMap.id, nodeId, color })
            }
            onTogglePin={() => dispatch({ type: 'togglePinMap', id: openMap.id })}
            onTrash={() => dispatch({ type: 'trashMap', id: openMap.id })}
          />
        ) : (
          <MissingScreen onBack={back} />
        ))}

      {screen.name === 'note' &&
        (openNote ? (
          <NoteEditorScreen
            note={openNote}
            onBack={back}
            onPatch={(patch) => dispatch({ type: 'updateNote', id: openNote.id, patch })}
            onTrash={() => dispatch({ type: 'trashNote', id: openNote.id })}
            onAddChecklistItem={(text) =>
              dispatch({ type: 'addChecklistItem', noteId: openNote.id, text })
            }
            onToggleChecklistItem={(itemId) =>
              dispatch({ type: 'toggleChecklistItem', noteId: openNote.id, itemId })
            }
            onRemoveChecklistItem={(itemId) =>
              dispatch({ type: 'removeChecklistItem', noteId: openNote.id, itemId })
            }
          />
        ) : (
          <MissingScreen onBack={back} />
        ))}

      {searchOpen && (
        <div className="overlay" onClick={() => setSearchOpen(false)}>
          <div className="search-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-row">
              <IconSearch size={18} className="search-icon" />
              <input
                autoFocus
                className="sheet-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj w mapach i notatkach"
                aria-label="Szukaj"
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setSearchOpen(false)}
                aria-label="Zamknij"
              >
                <IconClose size={18} />
              </button>
            </div>

            <div className="search-results">
              {query.trim() === '' && <p className="muted small">Wpisz frazę, żeby zobaczyć wyniki.</p>}
              {query.trim() !== '' && foundMaps.length === 0 && foundNotes.length === 0 && (
                <p className="muted small">Nic nie znalazłem.</p>
              )}
              {foundMaps.length > 0 && query.trim() !== '' && (
                <div className="strip-scroll">
                  {foundMaps.map((map) => (
                    <MapThumb
                      key={map.id}
                      map={map}
                      compact
                      onOpen={() => {
                        setSearchOpen(false)
                        go({ name: 'map', id: map.id })
                      }}
                    />
                  ))}
                </div>
              )}
              {query.trim() !== '' &&
                foundNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    className="list-row"
                    onClick={() => {
                      setSearchOpen(false)
                      go({ name: 'note', id: note.id })
                    }}
                  >
                    <span className="row-emoji">📝</span>
                    <span className="row-label">{note.title || 'Bez tytułu'}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="overlay" onClick={() => setMenuOpen(false)}>
          <div className="menu-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grip" />
            <button type="button" className="list-row" onClick={handleExport}>
              <span className="row-icon tone-indigo">
                <IconDownload size={18} />
              </span>
              <span className="row-label">Eksport do pliku</span>
            </button>
            <button type="button" className="list-row" onClick={() => fileInput.current?.click()}>
              <span className="row-icon tone-teal">
                <IconUpload size={18} />
              </span>
              <span className="row-label">Import z pliku</span>
            </button>
            <button
              type="button"
              className="list-row"
              onClick={() => {
                if (window.confirm('Wczytać przykładowe dane? Bieżące zostaną zastąpione.')) {
                  dispatch({ type: 'load', data: sampleData() })
                  setStack([{ name: 'home' }])
                  setMenuOpen(false)
                }
              }}
            >
              <span className="row-icon tone-orange">🧠</span>
              <span className="row-label">Wczytaj przykłady</span>
            </button>
            <button
              type="button"
              className="list-row"
              onClick={() => {
                if (window.confirm('Opróżnić kosz? Tej operacji nie da się cofnąć.')) {
                  dispatch({ type: 'emptyTrash' })
                  setMenuOpen(false)
                }
              }}
            >
              <span className="row-icon tone-grey">🗑️</span>
              <span className="row-label">Opróżnij kosz</span>
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden-input"
        onChange={handleImport}
      />
    </div>
  )
}

function MissingScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="screen">
      <div className="empty">
        <p className="empty-icon">🤷</p>
        <h2>Nie ma takiego dokumentu</h2>
        <button type="button" className="primary-btn" onClick={onBack}>
          Wróć
        </button>
      </div>
    </div>
  )
}

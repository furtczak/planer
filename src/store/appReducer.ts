import { uid } from '../lib/id'
import { childrenOf, findRoot, nextBranchColor, subtreeIds } from '../lib/mapLayout'
import type { AppData, BranchColor, MapNode, MindMap, Note } from '../types'

export type Action =
  | { type: 'load'; data: AppData }
  | { type: 'createMap'; id: string; title?: string }
  | { type: 'renameMap'; id: string; title: string; emoji?: string }
  | { type: 'trashMap'; id: string }
  | { type: 'restoreMap'; id: string }
  | { type: 'deleteMap'; id: string }
  | { type: 'togglePinMap'; id: string }
  | { type: 'addNode'; mapId: string; parentId: string; nodeId: string; text?: string }
  | { type: 'updateNode'; mapId: string; nodeId: string; patch: Partial<MapNode> }
  | { type: 'removeNode'; mapId: string; nodeId: string }
  | { type: 'toggleCollapse'; mapId: string; nodeId: string }
  | { type: 'setBranchColor'; mapId: string; nodeId: string; color: BranchColor }
  | { type: 'createNote'; id: string }
  | { type: 'updateNote'; id: string; patch: Partial<Note> }
  | { type: 'trashNote'; id: string }
  | { type: 'restoreNote'; id: string }
  | { type: 'deleteNote'; id: string }
  | { type: 'addChecklistItem'; noteId: string; text: string }
  | { type: 'toggleChecklistItem'; noteId: string; itemId: string }
  | { type: 'removeChecklistItem'; noteId: string; itemId: string }
  | { type: 'emptyTrash' }

export function emptyMap(id: string, title = 'Nowa mapa'): MindMap {
  const now = Date.now()
  return {
    id,
    title,
    emoji: '',
    nodes: [{ id: uid('r-'), text: title, parentId: null }],
    pinned: false,
    trashed: false,
    createdAt: now,
    updatedAt: now,
  }
}

export function emptyNote(id: string): Note {
  const now = Date.now()
  return {
    id,
    title: '',
    body: '',
    tags: [],
    checklist: [],
    pinned: false,
    trashed: false,
    createdAt: now,
    updatedAt: now,
  }
}

function mapById(state: AppData, id: string, fn: (map: MindMap) => MindMap): AppData {
  return {
    ...state,
    maps: state.maps.map((m) => (m.id === id ? { ...fn(m), updatedAt: Date.now() } : m)),
  }
}

function noteById(state: AppData, id: string, fn: (note: Note) => Note): AppData {
  return {
    ...state,
    notes: state.notes.map((n) => (n.id === id ? { ...fn(n), updatedAt: Date.now() } : n)),
  }
}

export function appReducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'load':
      return action.data

    case 'createMap':
      return { ...state, maps: [emptyMap(action.id, action.title), ...state.maps] }

    case 'renameMap':
      return mapById(state, action.id, (m) => {
        const root = findRoot(m.nodes)
        return {
          ...m,
          title: action.title,
          emoji: action.emoji ?? m.emoji,
          // tytuł mapy i tekst korzenia to ta sama rzecz - trzymamy je zsynchronizowane
          nodes: root
            ? m.nodes.map((n) => (n.id === root.id ? { ...n, text: action.title } : n))
            : m.nodes,
        }
      })

    case 'trashMap':
      return mapById(state, action.id, (m) => ({ ...m, trashed: true, pinned: false }))

    case 'restoreMap':
      return mapById(state, action.id, (m) => ({ ...m, trashed: false }))

    case 'deleteMap':
      return { ...state, maps: state.maps.filter((m) => m.id !== action.id) }

    case 'togglePinMap':
      return mapById(state, action.id, (m) => ({ ...m, pinned: !m.pinned }))

    case 'addNode':
      return mapById(state, action.mapId, (m) => {
        const root = findRoot(m.nodes)
        const isTopLevel = root?.id === action.parentId
        const node: MapNode = {
          id: action.nodeId,
          text: action.text ?? '',
          parentId: action.parentId,
          color: isTopLevel ? nextBranchColor(m.nodes, action.parentId) : undefined,
        }
        // dodanie dziecka do zwiniętego węzła rozwija go, inaczej nowy węzeł byłby niewidoczny
        const nodes = m.nodes.map((n) =>
          n.id === action.parentId && n.collapsed ? { ...n, collapsed: false } : n,
        )
        return { ...m, nodes: [...nodes, node] }
      })

    case 'updateNode':
      return mapById(state, action.mapId, (m) => {
        const root = findRoot(m.nodes)
        const nodes = m.nodes.map((n) =>
          n.id === action.nodeId ? { ...n, ...action.patch } : n,
        )
        const isRoot = root?.id === action.nodeId
        return {
          ...m,
          nodes,
          title: isRoot && typeof action.patch.text === 'string' ? action.patch.text : m.title,
        }
      })

    case 'removeNode':
      return mapById(state, action.mapId, (m) => {
        const root = findRoot(m.nodes)
        if (root?.id === action.nodeId) return m // korzenia nie usuwamy
        const doomed = new Set(subtreeIds(m.nodes, action.nodeId))
        return { ...m, nodes: m.nodes.filter((n) => !doomed.has(n.id)) }
      })

    case 'toggleCollapse':
      return mapById(state, action.mapId, (m) => ({
        ...m,
        nodes: m.nodes.map((n) =>
          n.id === action.nodeId ? { ...n, collapsed: !n.collapsed } : n,
        ),
      }))

    case 'setBranchColor':
      return mapById(state, action.mapId, (m) => {
        const root = findRoot(m.nodes)
        // kolor trzymamy na węźle pierwszego poziomu, żeby cała gałąź była spójna
        let target = m.nodes.find((n) => n.id === action.nodeId)
        while (target && target.parentId && target.parentId !== root?.id) {
          target = m.nodes.find((n) => n.id === target?.parentId)
        }
        if (!target || target.parentId === null) return m
        const id = target.id
        return {
          ...m,
          nodes: m.nodes.map((n) => (n.id === id ? { ...n, color: action.color } : n)),
        }
      })

    case 'createNote':
      return { ...state, notes: [emptyNote(action.id), ...state.notes] }

    case 'updateNote':
      return noteById(state, action.id, (n) => ({ ...n, ...action.patch }))

    case 'trashNote':
      return noteById(state, action.id, (n) => ({ ...n, trashed: true, pinned: false }))

    case 'restoreNote':
      return noteById(state, action.id, (n) => ({ ...n, trashed: false }))

    case 'deleteNote':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) }

    case 'addChecklistItem': {
      const text = action.text.trim()
      if (!text) return state
      return noteById(state, action.noteId, (n) => ({
        ...n,
        checklist: [...n.checklist, { id: uid('c-'), text, done: false }],
      }))
    }

    case 'toggleChecklistItem':
      return noteById(state, action.noteId, (n) => ({
        ...n,
        checklist: n.checklist.map((i) =>
          i.id === action.itemId ? { ...i, done: !i.done } : i,
        ),
      }))

    case 'removeChecklistItem':
      return noteById(state, action.noteId, (n) => ({
        ...n,
        checklist: n.checklist.filter((i) => i.id !== action.itemId),
      }))

    case 'emptyTrash':
      return {
        ...state,
        maps: state.maps.filter((m) => !m.trashed),
        notes: state.notes.filter((n) => !n.trashed),
      }

    default:
      return state
  }
}

export function liveMaps(data: AppData): MindMap[] {
  return data.maps
    .filter((m) => !m.trashed)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
}

export function liveNotes(data: AppData): Note[] {
  return data.notes
    .filter((n) => !n.trashed)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt)
}

export function trashCount(data: AppData): number {
  return data.maps.filter((m) => m.trashed).length + data.notes.filter((n) => n.trashed).length
}

/** Liczba węzłów bez korzenia - pokazywana pod miniaturą mapy. */
export function branchCount(map: MindMap): number {
  const root = findRoot(map.nodes)
  return root ? childrenOf(map.nodes, root.id).length : 0
}

export function searchMaps(maps: MindMap[], query: string): MindMap[] {
  const q = query.trim().toLowerCase()
  if (!q) return maps
  return maps.filter((m) =>
    [m.title, ...m.nodes.map((n) => `${n.text} ${n.note ?? ''}`)]
      .join(' ')
      .toLowerCase()
      .includes(q),
  )
}

export function searchNotes(notes: Note[], query: string): Note[] {
  const q = query.trim().toLowerCase()
  if (!q) return notes
  return notes.filter((n) =>
    [n.title, n.body, n.tags.join(' '), n.checklist.map((i) => i.text).join(' ')]
      .join(' ')
      .toLowerCase()
      .includes(q),
  )
}

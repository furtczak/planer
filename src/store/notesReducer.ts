import { uid } from '../lib/id'
import { extractInlineTags, plainText } from '../lib/markdown'
import type { AppData, Filter, Folder, Note, SortMode } from '../types'

export type Action =
  | { type: 'load'; data: AppData }
  | { type: 'createNote'; draft?: Partial<Note> }
  | { type: 'updateNote'; id: string; patch: Partial<Note> }
  | { type: 'toggleFlag'; id: string; flag: 'pinned' | 'archived' }
  | { type: 'trashNote'; id: string }
  | { type: 'restoreNote'; id: string }
  | { type: 'deleteNote'; id: string }
  | { type: 'emptyTrash' }
  | { type: 'addChecklistItem'; noteId: string; text: string }
  | { type: 'updateChecklistItem'; noteId: string; itemId: string; text: string }
  | { type: 'toggleChecklistItem'; noteId: string; itemId: string }
  | { type: 'removeChecklistItem'; noteId: string; itemId: string }
  | { type: 'addFolder'; name: string; emoji?: string }
  | { type: 'renameFolder'; id: string; name: string }
  | { type: 'removeFolder'; id: string }

export function emptyNote(draft: Partial<Note> = {}): Note {
  const now = Date.now()
  return {
    id: uid('n-'),
    title: '',
    body: '',
    folderId: null,
    tags: [],
    color: 'default',
    pinned: false,
    archived: false,
    trashed: false,
    checklist: [],
    createdAt: now,
    updatedAt: now,
    ...draft,
  }
}

function mapNote(state: AppData, id: string, fn: (note: Note) => Note): AppData {
  return {
    ...state,
    notes: state.notes.map((n) => (n.id === id ? fn(n) : n)),
  }
}

function touch(note: Note, patch: Partial<Note>): Note {
  return { ...note, ...patch, updatedAt: Date.now() }
}

export function notesReducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'load':
      return action.data

    case 'createNote':
      return { ...state, notes: [emptyNote(action.draft), ...state.notes] }

    case 'updateNote':
      return mapNote(state, action.id, (n) => touch(n, action.patch))

    case 'toggleFlag':
      return mapNote(state, action.id, (n) => {
        const next = touch(n, { [action.flag]: !n[action.flag] } as Partial<Note>)
        // przypięta notatka nie ma sensu w archiwum - zdejmujemy pinezkę
        return action.flag === 'archived' && next.archived ? { ...next, pinned: false } : next
      })

    case 'trashNote':
      return mapNote(state, action.id, (n) =>
        touch(n, { trashed: true, pinned: false, archived: false }),
      )

    case 'restoreNote':
      return mapNote(state, action.id, (n) => touch(n, { trashed: false }))

    case 'deleteNote':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) }

    case 'emptyTrash':
      return { ...state, notes: state.notes.filter((n) => !n.trashed) }

    case 'addChecklistItem': {
      const text = action.text.trim()
      if (!text) return state
      return mapNote(state, action.noteId, (n) =>
        touch(n, { checklist: [...n.checklist, { id: uid('c-'), text, done: false }] }),
      )
    }

    case 'updateChecklistItem':
      return mapNote(state, action.noteId, (n) =>
        touch(n, {
          checklist: n.checklist.map((i) =>
            i.id === action.itemId ? { ...i, text: action.text } : i,
          ),
        }),
      )

    case 'toggleChecklistItem':
      return mapNote(state, action.noteId, (n) =>
        touch(n, {
          checklist: n.checklist.map((i) =>
            i.id === action.itemId ? { ...i, done: !i.done } : i,
          ),
        }),
      )

    case 'removeChecklistItem':
      return mapNote(state, action.noteId, (n) =>
        touch(n, { checklist: n.checklist.filter((i) => i.id !== action.itemId) }),
      )

    case 'addFolder': {
      const name = action.name.trim()
      if (!name) return state
      const folder: Folder = {
        id: uid('f-'),
        name,
        emoji: action.emoji || '📁',
        createdAt: Date.now(),
      }
      return { ...state, folders: [...state.folders, folder] }
    }

    case 'renameFolder': {
      const name = action.name.trim()
      if (!name) return state
      return {
        ...state,
        folders: state.folders.map((f) => (f.id === action.id ? { ...f, name } : f)),
      }
    }

    case 'removeFolder':
      return {
        ...state,
        folders: state.folders.filter((f) => f.id !== action.id),
        notes: state.notes.map((n) =>
          n.folderId === action.id ? { ...n, folderId: null } : n,
        ),
      }

    default:
      return state
  }
}

/** Wszystkie tagi (własne + wpisane w treści jako #tag) wraz z liczbą wystąpień. */
export function collectTags(notes: Note[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const note of notes) {
    if (note.trashed) continue
    for (const tag of noteTags(note)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'pl'))
}

export function noteTags(note: Note): string[] {
  return [...new Set([...note.tags, ...extractInlineTags(note.body)])]
}

function matchesFilter(note: Note, filter: Filter): boolean {
  switch (filter.kind) {
    case 'trash':
      return note.trashed
    case 'archive':
      return !note.trashed && note.archived
    case 'pinned':
      return !note.trashed && !note.archived && note.pinned
    case 'folder':
      return !note.trashed && !note.archived && note.folderId === filter.folderId
    case 'tag':
      return !note.trashed && !note.archived && noteTags(note).includes(filter.tag)
    case 'all':
    default:
      return !note.trashed && !note.archived
  }
}

function matchesQuery(note: Note, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    note.title,
    plainText(note.body),
    noteTags(note).join(' '),
    note.checklist.map((i) => i.text).join(' '),
  ]
    .join(' ')
    .toLowerCase()
  return q.split(/\s+/).every((word) => haystack.includes(word))
}

export function selectNotes(
  notes: Note[],
  filter: Filter,
  query: string,
  sort: SortMode,
): Note[] {
  const result = notes.filter((n) => matchesFilter(n, filter) && matchesQuery(n, query))

  result.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    switch (sort) {
      case 'created':
        return b.createdAt - a.createdAt
      case 'title':
        return (a.title || 'Bez tytułu').localeCompare(b.title || 'Bez tytułu', 'pl')
      case 'updated':
      default:
        return b.updatedAt - a.updatedAt
    }
  })

  return result
}

export function countsByFilter(notes: Note[]) {
  const live = notes.filter((n) => !n.trashed && !n.archived)
  return {
    all: live.length,
    pinned: live.filter((n) => n.pinned).length,
    archive: notes.filter((n) => n.archived && !n.trashed).length,
    trash: notes.filter((n) => n.trashed).length,
    byFolder: (folderId: string) => live.filter((n) => n.folderId === folderId).length,
  }
}

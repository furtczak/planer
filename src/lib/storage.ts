import type { AppData, Folder, Note } from '../types'

export const STORAGE_KEY = 'mind-notes:data:v1'
export const DATA_VERSION = 1

const COLORS = new Set([
  'default',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'orange',
])

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asBool(value: unknown): boolean {
  return value === true
}

/**
 * Dane z localStorage / importu mogą być dowolnego kształtu (stara wersja,
 * ręcznie edytowany plik), więc każdą notatkę doprowadzamy do pełnego typu.
 */
export function normalizeNote(raw: unknown, index = 0): Note | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const now = Date.now()
  const id = asString(r.id) || `note-${now}-${index}`
  const color = asString(r.color, 'default')

  return {
    id,
    title: asString(r.title),
    body: asString(r.body),
    folderId: typeof r.folderId === 'string' ? r.folderId : null,
    tags: Array.isArray(r.tags)
      ? [...new Set(r.tags.filter((t): t is string => typeof t === 'string').map((t) => t.toLowerCase()))]
      : [],
    color: (COLORS.has(color) ? color : 'default') as Note['color'],
    pinned: asBool(r.pinned),
    archived: asBool(r.archived),
    trashed: asBool(r.trashed),
    checklist: Array.isArray(r.checklist)
      ? r.checklist
          .filter((i): i is Record<string, unknown> => typeof i === 'object' && i !== null)
          .map((i, n) => ({
            id: asString(i.id) || `item-${now}-${n}`,
            text: asString(i.text),
            done: asBool(i.done),
          }))
      : [],
    createdAt: asNumber(r.createdAt, now),
    updatedAt: asNumber(r.updatedAt, asNumber(r.createdAt, now)),
  }
}

export function normalizeFolder(raw: unknown, index = 0): Folder | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const now = Date.now()
  const name = asString(r.name).trim()
  if (!name) return null
  return {
    id: asString(r.id) || `folder-${now}-${index}`,
    name,
    emoji: asString(r.emoji, '📁').slice(0, 4) || '📁',
    createdAt: asNumber(r.createdAt, now),
  }
}

export function normalizeData(raw: unknown): AppData | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.notes)) return null

  const folders = Array.isArray(r.folders)
    ? r.folders.map(normalizeFolder).filter((f): f is Folder => f !== null)
    : []
  const folderIds = new Set(folders.map((f) => f.id))
  const notes = r.notes
    .map(normalizeNote)
    .filter((n): n is Note => n !== null)
    // notatka wskazująca na nieistniejący folder trafia do "bez folderu"
    .map((n) => (n.folderId && !folderIds.has(n.folderId) ? { ...n, folderId: null } : n))

  return { version: DATA_VERSION, notes, folders }
}

export function loadData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizeData(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // brak miejsca albo tryb prywatny - aplikacja działa dalej w pamięci
  }
}

export function exportData(data: AppData): string {
  return JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)
}

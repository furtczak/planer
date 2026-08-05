import type { AppData, BranchColor, MapNode, MindMap, Note } from '../types'
import { BRANCH_COLORS } from '../types'
import { isImageDataUrl } from './image'

export const STORAGE_KEY = 'mind-notes:data:v2'
export const LEGACY_KEY = 'mind-notes:data:v1'
export const DATA_VERSION = 2

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asBool(value: unknown): boolean {
  return value === true
}

function normalizeMapNode(raw: unknown, index: number): MapNode | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const id = asString(r.id) || `n-${index}`
  const color = asString(r.color)
  return {
    id,
    text: asString(r.text),
    parentId: typeof r.parentId === 'string' ? r.parentId : null,
    color: BRANCH_COLORS.includes(color as BranchColor) ? (color as BranchColor) : undefined,
    collapsed: asBool(r.collapsed) || undefined,
    note: typeof r.note === 'string' && r.note ? r.note : undefined,
    // dopuszczamy wyłącznie osadzony obraz - żaden zewnętrzny adres nie trafi do <image>
    image: isImageDataUrl(r.image) ? r.image : undefined,
  }
}

/**
 * Mapa bez dokładnie jednego korzenia byłaby nie do wyrenderowania, więc
 * naprawiamy strukturę: pierwszy korzeń zostaje, sieroty trafiają pod niego.
 */
function normalizeMap(raw: unknown, index: number): MindMap | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const now = Date.now()
  const id = asString(r.id) || `m-${now}-${index}`
  const title = asString(r.title, 'Mapa') || 'Mapa'

  const parsed = Array.isArray(r.nodes)
    ? r.nodes.map(normalizeMapNode).filter((n): n is MapNode => n !== null)
    : []

  const roots = parsed.filter((n) => n.parentId === null)
  let nodes: MapNode[]

  if (roots.length === 0) {
    const root: MapNode = { id: `root-${id}`, text: title, parentId: null }
    nodes = [root, ...parsed.map((n) => ({ ...n, parentId: n.parentId ?? root.id }))]
  } else {
    const rootId = roots[0].id
    nodes = parsed.map((n) => (n.parentId === null && n.id !== rootId ? { ...n, parentId: rootId } : n))
  }

  const known = new Set(nodes.map((n) => n.id))
  const rootId = nodes.find((n) => n.parentId === null)?.id ?? nodes[0].id
  nodes = nodes.map((n) =>
    n.parentId !== null && !known.has(n.parentId) ? { ...n, parentId: rootId } : n,
  )

  return {
    id,
    title,
    emoji: asString(r.emoji, '🧠').slice(0, 4) || '🧠',
    nodes,
    pinned: asBool(r.pinned),
    trashed: asBool(r.trashed),
    createdAt: asNumber(r.createdAt, now),
    updatedAt: asNumber(r.updatedAt, asNumber(r.createdAt, now)),
  }
}

function normalizeNote(raw: unknown, index: number): Note | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const now = Date.now()
  return {
    id: asString(r.id) || `note-${now}-${index}`,
    title: asString(r.title),
    body: asString(r.body),
    tags: Array.isArray(r.tags)
      ? [...new Set(r.tags.filter((t): t is string => typeof t === 'string').map((t) => t.toLowerCase()))]
      : [],
    checklist: Array.isArray(r.checklist)
      ? r.checklist
          .filter((i): i is Record<string, unknown> => typeof i === 'object' && i !== null)
          .map((i, n) => ({
            id: asString(i.id) || `item-${now}-${n}`,
            text: asString(i.text),
            done: asBool(i.done),
          }))
      : [],
    pinned: asBool(r.pinned),
    trashed: asBool(r.trashed),
    createdAt: asNumber(r.createdAt, now),
    updatedAt: asNumber(r.updatedAt, asNumber(r.createdAt, now)),
  }
}

export function normalizeData(raw: unknown): AppData | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.maps) && !Array.isArray(r.notes)) return null

  return {
    version: DATA_VERSION,
    maps: Array.isArray(r.maps)
      ? r.maps.map(normalizeMap).filter((m): m is MindMap => m !== null)
      : [],
    notes: Array.isArray(r.notes)
      ? r.notes.map(normalizeNote).filter((n): n is Note => n !== null)
      : [],
  }
}

export function loadData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeData(JSON.parse(raw))
    // dane z poprzedniej wersji aplikacji: same notatki, bez map
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const parsed = normalizeData(JSON.parse(legacy))
      if (parsed) return parsed
    }
    return null
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

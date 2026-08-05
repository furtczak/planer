export type BranchColor = 'coral' | 'sky' | 'violet' | 'amber' | 'mint' | 'rose'

export const BRANCH_COLORS: BranchColor[] = ['coral', 'sky', 'violet', 'amber', 'mint', 'rose']

/** Pojedynczy węzeł mapy. Korzeń ma parentId === null. */
export type MapNode = {
  id: string
  text: string
  parentId: string | null
  /** Kolor gałęzi - ustawiany na węzłach pierwszego poziomu, potomkowie dziedziczą. */
  color?: BranchColor
  collapsed?: boolean
  /** Notatka doczepiona do węzła (Markdown). */
  note?: string
  /** Zdjęcie węzła jako data URI - już zmniejszone, patrz lib/image.ts. */
  image?: string
}

export type MindMap = {
  id: string
  title: string
  emoji: string
  nodes: MapNode[]
  pinned: boolean
  trashed: boolean
  createdAt: number
  updatedAt: number
}

export type ChecklistItem = {
  id: string
  text: string
  done: boolean
}

/** Klasyczna notatka - dodatek obok map. */
export type Note = {
  id: string
  title: string
  body: string
  tags: string[]
  checklist: ChecklistItem[]
  pinned: boolean
  trashed: boolean
  createdAt: number
  updatedAt: number
}

export type AppData = {
  version: number
  maps: MindMap[]
  notes: Note[]
}

/** Ekran widoczny w aplikacji - nawigacja jest jednopoziomowa, jak w aplikacji mobilnej. */
export type Screen =
  | { name: 'home' }
  | { name: 'maps'; scope: 'all' | 'recent' | 'trash' }
  | { name: 'notes' }
  | { name: 'map'; id: string }
  | { name: 'note'; id: string }

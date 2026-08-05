export type ChecklistItem = {
  id: string
  text: string
  done: boolean
}

export type NoteColor =
  | 'default'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'orange'

export type Note = {
  id: string
  title: string
  body: string
  folderId: string | null
  tags: string[]
  color: NoteColor
  pinned: boolean
  archived: boolean
  trashed: boolean
  checklist: ChecklistItem[]
  createdAt: number
  updatedAt: number
}

export type Folder = {
  id: string
  name: string
  emoji: string
  createdAt: number
}

export type AppData = {
  version: number
  notes: Note[]
  folders: Folder[]
}

/** Aktywny filtr listy notatek w lewym panelu. */
export type Filter =
  | { kind: 'all' }
  | { kind: 'pinned' }
  | { kind: 'archive' }
  | { kind: 'trash' }
  | { kind: 'folder'; folderId: string }
  | { kind: 'tag'; tag: string }

export type ViewMode = 'grid' | 'list' | 'map'

export type SortMode = 'updated' | 'created' | 'title'

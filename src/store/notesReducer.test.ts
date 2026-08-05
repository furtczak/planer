import { describe, expect, it } from 'vitest'
import { collectTags, countsByFilter, emptyNote, notesReducer, selectNotes } from './notesReducer'
import type { AppData, Note } from '../types'

function note(patch: Partial<Note> = {}): Note {
  return emptyNote(patch)
}

function state(notes: Note[] = []): AppData {
  return { version: 1, notes, folders: [] }
}

describe('notesReducer', () => {
  it('dodaje nową notatkę na początek listy', () => {
    const next = notesReducer(state([note({ id: 'a' })]), { type: 'createNote' })
    expect(next.notes).toHaveLength(2)
    expect(next.notes[1].id).toBe('a')
  })

  it('aktualizuje notatkę i podbija updatedAt', () => {
    const old = note({ id: 'a', updatedAt: 0 })
    const next = notesReducer(state([old]), {
      type: 'updateNote',
      id: 'a',
      patch: { title: 'Nowy' },
    })
    expect(next.notes[0].title).toBe('Nowy')
    expect(next.notes[0].updatedAt).toBeGreaterThan(0)
  })

  it('zdejmuje pinezkę przy archiwizacji', () => {
    const next = notesReducer(state([note({ id: 'a', pinned: true })]), {
      type: 'toggleFlag',
      id: 'a',
      flag: 'archived',
    })
    expect(next.notes[0].archived).toBe(true)
    expect(next.notes[0].pinned).toBe(false)
  })

  it('przenosi do kosza bez usuwania danych', () => {
    const next = notesReducer(state([note({ id: 'a', title: 'X' })]), { type: 'trashNote', id: 'a' })
    expect(next.notes[0].trashed).toBe(true)
    expect(next.notes[0].title).toBe('X')
  })

  it('opróżnia kosz tylko z notatek oznaczonych jako usunięte', () => {
    const next = notesReducer(state([note({ id: 'a', trashed: true }), note({ id: 'b' })]), {
      type: 'emptyTrash',
    })
    expect(next.notes.map((n) => n.id)).toEqual(['b'])
  })

  it('dodaje i przełącza pozycje listy zadań', () => {
    let s = notesReducer(state([note({ id: 'a' })]), {
      type: 'addChecklistItem',
      noteId: 'a',
      text: 'Kupić mleko',
    })
    expect(s.notes[0].checklist).toHaveLength(1)

    const itemId = s.notes[0].checklist[0].id
    s = notesReducer(s, { type: 'toggleChecklistItem', noteId: 'a', itemId })
    expect(s.notes[0].checklist[0].done).toBe(true)

    s = notesReducer(s, { type: 'removeChecklistItem', noteId: 'a', itemId })
    expect(s.notes[0].checklist).toHaveLength(0)
  })

  it('pomija puste pozycje listy zadań', () => {
    const next = notesReducer(state([note({ id: 'a' })]), {
      type: 'addChecklistItem',
      noteId: 'a',
      text: '   ',
    })
    expect(next.notes[0].checklist).toHaveLength(0)
  })

  it('po usunięciu folderu notatki zostają bez folderu', () => {
    const base: AppData = {
      version: 1,
      notes: [note({ id: 'a', folderId: 'f1' })],
      folders: [{ id: 'f1', name: 'Praca', emoji: '💼', createdAt: 0 }],
    }
    const next = notesReducer(base, { type: 'removeFolder', id: 'f1' })
    expect(next.folders).toHaveLength(0)
    expect(next.notes[0].folderId).toBeNull()
  })
})

describe('selectNotes', () => {
  const notes = [
    note({ id: 'a', title: 'Zakupy', body: 'mleko', pinned: false, updatedAt: 100 }),
    note({ id: 'b', title: 'Praca', body: 'raport #pilne', pinned: true, updatedAt: 50 }),
    note({ id: 'c', title: 'Archiwum', archived: true }),
    note({ id: 'd', title: 'Kosz', trashed: true }),
  ]

  it('domyślnie pomija archiwum i kosz', () => {
    expect(selectNotes(notes, { kind: 'all' }, '', 'updated').map((n) => n.id)).toEqual(['b', 'a'])
  })

  it('przypięte zawsze na górze', () => {
    const result = selectNotes(notes, { kind: 'all' }, '', 'updated')
    expect(result[0].id).toBe('b')
  })

  it('filtruje po tagu z treści', () => {
    expect(selectNotes(notes, { kind: 'tag', tag: 'pilne' }, '', 'updated').map((n) => n.id)).toEqual([
      'b',
    ])
  })

  it('szuka we wszystkich słowach zapytania', () => {
    expect(selectNotes(notes, { kind: 'all' }, 'zakupy mleko', 'updated')).toHaveLength(1)
    expect(selectNotes(notes, { kind: 'all' }, 'zakupy raport', 'updated')).toHaveLength(0)
  })

  it('pokazuje kosz tylko w widoku kosza', () => {
    expect(selectNotes(notes, { kind: 'trash' }, '', 'updated').map((n) => n.id)).toEqual(['d'])
  })

  it('sortuje alfabetycznie', () => {
    const result = selectNotes(
      [note({ id: 'x', title: 'Żaba' }), note({ id: 'y', title: 'Arbuz' })],
      { kind: 'all' },
      '',
      'title',
    )
    expect(result.map((n) => n.id)).toEqual(['y', 'x'])
  })
})

describe('collectTags / countsByFilter', () => {
  const notes = [
    note({ tags: ['praca'], body: '#pilne' }),
    note({ tags: ['praca'] }),
    note({ tags: ['x'], trashed: true }),
    note({ archived: true }),
  ]

  it('liczy tagi pomijając kosz', () => {
    expect(collectTags(notes)).toEqual([
      { tag: 'praca', count: 2 },
      { tag: 'pilne', count: 1 },
    ])
  })

  it('liczy notatki per widok', () => {
    const counts = countsByFilter(notes)
    expect(counts.all).toBe(2)
    expect(counts.archive).toBe(1)
    expect(counts.trash).toBe(1)
  })
})

import { describe, expect, it } from 'vitest'
import { normalizeData, normalizeFolder, normalizeNote } from './storage'

describe('normalizeNote', () => {
  it('uzupełnia brakujące pola', () => {
    const note = normalizeNote({ title: 'X' })
    expect(note).not.toBeNull()
    expect(note?.body).toBe('')
    expect(note?.tags).toEqual([])
    expect(note?.checklist).toEqual([])
    expect(note?.color).toBe('default')
    expect(note?.trashed).toBe(false)
  })

  it('odrzuca nieznany kolor', () => {
    expect(normalizeNote({ color: 'radioaktywny' })?.color).toBe('default')
  })

  it('normalizuje tagi do małych liter bez duplikatów', () => {
    expect(normalizeNote({ tags: ['Praca', 'praca', 1, 'Dom'] })?.tags).toEqual(['praca', 'dom'])
  })

  it('odrzuca wartości, które nie są obiektem', () => {
    expect(normalizeNote('nope')).toBeNull()
    expect(normalizeNote(null)).toBeNull()
  })
})

describe('normalizeFolder', () => {
  it('wymaga nazwy', () => {
    expect(normalizeFolder({ name: '  ' })).toBeNull()
    expect(normalizeFolder({ name: 'Dom' })?.emoji).toBe('📁')
  })
})

describe('normalizeData', () => {
  it('odrzuca dane bez tablicy notatek', () => {
    expect(normalizeData({})).toBeNull()
    expect(normalizeData(null)).toBeNull()
  })

  it('czyści wskazanie na nieistniejący folder', () => {
    const data = normalizeData({
      notes: [{ id: 'a', folderId: 'brak' }],
      folders: [{ id: 'f1', name: 'Praca' }],
    })
    expect(data?.notes[0].folderId).toBeNull()
  })

  it('zachowuje poprawne powiązanie z folderem', () => {
    const data = normalizeData({
      notes: [{ id: 'a', folderId: 'f1' }],
      folders: [{ id: 'f1', name: 'Praca' }],
    })
    expect(data?.notes[0].folderId).toBe('f1')
    expect(data?.folders).toHaveLength(1)
  })
})

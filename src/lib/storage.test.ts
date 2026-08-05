import { describe, expect, it } from 'vitest'
import { normalizeData } from './storage'
import { findRoot } from './mapLayout'

describe('normalizeData', () => {
  it('odrzuca dane bez map i bez notatek', () => {
    expect(normalizeData({})).toBeNull()
    expect(normalizeData(null)).toBeNull()
    expect(normalizeData('nope')).toBeNull()
  })

  it('przyjmuje same notatki (dane ze starszej wersji aplikacji)', () => {
    const data = normalizeData({ notes: [{ id: 'a', title: 'Stara notatka' }] })
    expect(data?.maps).toEqual([])
    expect(data?.notes[0].title).toBe('Stara notatka')
    expect(data?.notes[0].checklist).toEqual([])
  })

  it('uzupełnia brakujące pola mapy', () => {
    const data = normalizeData({
      maps: [{ id: 'm1', title: 'Plan', nodes: [{ id: 'r', text: 'Plan', parentId: null }] }],
    })
    const map = data?.maps[0]
    expect(map?.emoji).toBe('🧠')
    expect(map?.pinned).toBe(false)
    expect(map?.nodes).toHaveLength(1)
  })

  it('dorabia korzeń, gdy mapa go nie ma', () => {
    const data = normalizeData({
      maps: [{ id: 'm1', title: 'Bez korzenia', nodes: [{ id: 'a', text: 'A', parentId: 'ghost' }] }],
    })
    const nodes = data?.maps[0].nodes ?? []
    const root = findRoot(nodes)
    expect(root).toBeDefined()
    expect(nodes).toHaveLength(2)
    expect(nodes.find((n) => n.id === 'a')?.parentId).toBe(root?.id)
  })

  it('zostawia jeden korzeń, gdy w danych jest ich kilka', () => {
    const data = normalizeData({
      maps: [
        {
          id: 'm1',
          title: 'Dwa korzenie',
          nodes: [
            { id: 'r1', text: 'A', parentId: null },
            { id: 'r2', text: 'B', parentId: null },
          ],
        },
      ],
    })
    const nodes = data?.maps[0].nodes ?? []
    expect(nodes.filter((n) => n.parentId === null)).toHaveLength(1)
    expect(nodes.find((n) => n.id === 'r2')?.parentId).toBe('r1')
  })

  it('podpina węzły wskazujące na nieistniejącego rodzica pod korzeń', () => {
    const data = normalizeData({
      maps: [
        {
          id: 'm1',
          title: 'Sierota',
          nodes: [
            { id: 'r', text: 'Root', parentId: null },
            { id: 'x', text: 'X', parentId: 'nie-ma-mnie' },
          ],
        },
      ],
    })
    expect(data?.maps[0].nodes.find((n) => n.id === 'x')?.parentId).toBe('r')
  })

  it('odrzuca nieznany kolor gałęzi', () => {
    const data = normalizeData({
      maps: [
        {
          id: 'm1',
          title: 'Kolory',
          nodes: [
            { id: 'r', text: 'Root', parentId: null },
            { id: 'a', text: 'A', parentId: 'r', color: 'neonowy' },
            { id: 'b', text: 'B', parentId: 'r', color: 'mint' },
          ],
        },
      ],
    })
    const nodes = data?.maps[0].nodes ?? []
    expect(nodes.find((n) => n.id === 'a')?.color).toBeUndefined()
    expect(nodes.find((n) => n.id === 'b')?.color).toBe('mint')
  })

  it('normalizuje tagi notatki do małych liter bez duplikatów', () => {
    const data = normalizeData({ notes: [{ id: 'a', tags: ['Dom', 'dom', 7, 'Praca'] }] })
    expect(data?.notes[0].tags).toEqual(['dom', 'praca'])
  })
})

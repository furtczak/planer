import { describe, expect, it } from 'vitest'
import { appReducer, branchCount, emptyMap, liveMaps, searchMaps, trashCount } from './appReducer'
import { findRoot } from '../lib/mapLayout'
import type { AppData } from '../types'

function state(): AppData {
  const map = emptyMap('m1', 'Plan')
  return { version: 2, maps: [map], notes: [] }
}

function rootId(data: AppData) {
  return findRoot(data.maps[0].nodes)!.id
}

describe('mapy', () => {
  it('nowa mapa ma dokładnie jeden korzeń', () => {
    const next = appReducer({ version: 2, maps: [], notes: [] }, { type: 'createMap', id: 'm9' })
    const nodes = next.maps[0].nodes
    expect(nodes.filter((n) => n.parentId === null)).toHaveLength(1)
  })

  it('zmiana nazwy mapy przepisuje tekst korzenia', () => {
    const base = state()
    const next = appReducer(base, { type: 'renameMap', id: 'm1', title: 'Budżet' })
    expect(next.maps[0].title).toBe('Budżet')
    expect(findRoot(next.maps[0].nodes)?.text).toBe('Budżet')
  })

  it('edycja korzenia aktualizuje tytuł mapy', () => {
    const base = state()
    const next = appReducer(base, {
      type: 'updateNode',
      mapId: 'm1',
      nodeId: rootId(base),
      patch: { text: 'Nowy temat' },
    })
    expect(next.maps[0].title).toBe('Nowy temat')
  })

  it('kosz nie kasuje danych, dopiero usunięcie trwałe', () => {
    let s = appReducer(state(), { type: 'trashMap', id: 'm1' })
    expect(s.maps[0].trashed).toBe(true)
    expect(liveMaps(s)).toHaveLength(0)
    expect(trashCount(s)).toBe(1)

    s = appReducer(s, { type: 'restoreMap', id: 'm1' })
    expect(liveMaps(s)).toHaveLength(1)

    s = appReducer(s, { type: 'deleteMap', id: 'm1' })
    expect(s.maps).toHaveLength(0)
  })
})

describe('węzły', () => {
  it('pierwsza gałąź dostaje własny kolor, kolejna inny', () => {
    const base = state()
    const root = rootId(base)
    let s = appReducer(base, { type: 'addNode', mapId: 'm1', parentId: root, nodeId: 'a' })
    s = appReducer(s, { type: 'addNode', mapId: 'm1', parentId: root, nodeId: 'b' })
    const colors = s.maps[0].nodes.filter((n) => n.parentId === root).map((n) => n.color)
    expect(colors[0]).toBeDefined()
    expect(colors[0]).not.toBe(colors[1])
  })

  it('głębszy węzeł nie dostaje własnego koloru - dziedziczy po gałęzi', () => {
    const base = state()
    const root = rootId(base)
    let s = appReducer(base, { type: 'addNode', mapId: 'm1', parentId: root, nodeId: 'a' })
    s = appReducer(s, { type: 'addNode', mapId: 'm1', parentId: 'a', nodeId: 'a1' })
    expect(s.maps[0].nodes.find((n) => n.id === 'a1')?.color).toBeUndefined()
  })

  it('usunięcie węzła zabiera całe poddrzewo', () => {
    const base = state()
    const root = rootId(base)
    let s = appReducer(base, { type: 'addNode', mapId: 'm1', parentId: root, nodeId: 'a' })
    s = appReducer(s, { type: 'addNode', mapId: 'm1', parentId: 'a', nodeId: 'a1' })
    s = appReducer(s, { type: 'addNode', mapId: 'm1', parentId: 'a1', nodeId: 'a2' })
    s = appReducer(s, { type: 'removeNode', mapId: 'm1', nodeId: 'a' })
    expect(s.maps[0].nodes.map((n) => n.id)).toEqual([root])
  })

  it('korzenia nie da się usunąć', () => {
    const base = state()
    const next = appReducer(base, { type: 'removeNode', mapId: 'm1', nodeId: rootId(base) })
    expect(next.maps[0].nodes).toHaveLength(1)
  })

  it('dodanie dziecka rozwija zwinięty węzeł', () => {
    const base = state()
    const root = rootId(base)
    let s = appReducer(base, { type: 'addNode', mapId: 'm1', parentId: root, nodeId: 'a' })
    s = appReducer(s, { type: 'toggleCollapse', mapId: 'm1', nodeId: 'a' })
    expect(s.maps[0].nodes.find((n) => n.id === 'a')?.collapsed).toBe(true)

    s = appReducer(s, { type: 'addNode', mapId: 'm1', parentId: 'a', nodeId: 'a1' })
    expect(s.maps[0].nodes.find((n) => n.id === 'a')?.collapsed).toBe(false)
  })

  it('kolor ustawiony na głębokim węźle trafia na całą gałąź', () => {
    const base = state()
    const root = rootId(base)
    let s = appReducer(base, { type: 'addNode', mapId: 'm1', parentId: root, nodeId: 'a' })
    s = appReducer(s, { type: 'addNode', mapId: 'm1', parentId: 'a', nodeId: 'a1' })
    s = appReducer(s, { type: 'setBranchColor', mapId: 'm1', nodeId: 'a1', color: 'rose' })
    expect(s.maps[0].nodes.find((n) => n.id === 'a')?.color).toBe('rose')
    expect(s.maps[0].nodes.find((n) => n.id === 'a1')?.color).toBeUndefined()
  })

  it('liczy gałęzie pierwszego poziomu', () => {
    const base = state()
    const root = rootId(base)
    let s = appReducer(base, { type: 'addNode', mapId: 'm1', parentId: root, nodeId: 'a' })
    s = appReducer(s, { type: 'addNode', mapId: 'm1', parentId: 'a', nodeId: 'a1' })
    expect(branchCount(s.maps[0])).toBe(1)
  })
})

describe('notatki i wyszukiwanie', () => {
  it('pusta pozycja listy zadań jest pomijana', () => {
    let s: AppData = { version: 2, maps: [], notes: [] }
    s = appReducer(s, { type: 'createNote', id: 'n1' })
    s = appReducer(s, { type: 'addChecklistItem', noteId: 'n1', text: '  ' })
    expect(s.notes[0].checklist).toHaveLength(0)

    s = appReducer(s, { type: 'addChecklistItem', noteId: 'n1', text: 'Kupić mleko' })
    expect(s.notes[0].checklist).toHaveLength(1)
  })

  it('opróżnienie kosza usuwa mapy i notatki oznaczone jako usunięte', () => {
    let s: AppData = {
      version: 2,
      maps: [{ ...emptyMap('m1'), trashed: true }, emptyMap('m2')],
      notes: [],
    }
    s = appReducer(s, { type: 'emptyTrash' })
    expect(s.maps.map((m) => m.id)).toEqual(['m2'])
  })

  it('wyszukiwanie sięga do treści węzłów, nie tylko tytułu', () => {
    const base = state()
    const root = rootId(base)
    const s = appReducer(base, {
      type: 'addNode',
      mapId: 'm1',
      parentId: root,
      nodeId: 'a',
      text: 'Filament PLA',
    })
    expect(searchMaps(s.maps, 'filament')).toHaveLength(1)
    expect(searchMaps(s.maps, 'rower')).toHaveLength(0)
  })
})

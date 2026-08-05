import { describe, expect, it } from 'vitest'
import {
  IMAGE_GAP,
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
  NODE_HEIGHT,
  UNDERLINE_OFFSET,
  branchColor,
  fitViewBox,
  layoutMap,
  nextBranchColor,
  subtreeIds,
} from './mapLayout'
import type { MapNode } from '../types'

const tree: MapNode[] = [
  { id: 'r', text: 'Pieniądze', parentId: null },
  { id: 'a', text: 'Druk 3d', parentId: 'r', color: 'coral' },
  { id: 'a1', text: 'Filament', parentId: 'a' },
  { id: 'a2', text: 'Zlecenia', parentId: 'a' },
  { id: 'b', text: 'Inwestowanie', parentId: 'r', color: 'sky' },
]

describe('layoutMap', () => {
  it('zwraca pusty układ, gdy nie ma korzenia', () => {
    const layout = layoutMap([{ id: 'x', text: 'X', parentId: 'brak' }])
    expect(layout.nodes).toEqual([])
    expect(layout.connectors).toEqual([])
  })

  it('umieszcza wszystkie widoczne węzły', () => {
    expect(layoutMap(tree).nodes).toHaveLength(5)
  })

  it('rysuje po jednym łączniku na krawędź', () => {
    const layout = layoutMap(tree)
    expect(layout.connectors.map((c) => c.id).sort()).toEqual(
      ['r->a', 'r->b', 'a->a1', 'a->a2'].sort(),
    )
  })

  it('każde dziecko leży na prawo od rodzica', () => {
    const layout = layoutMap(tree)
    const at = (id: string) => layout.nodes.find((n) => n.node.id === id)
    expect(at('a')!.x).toBeGreaterThan(at('r')!.x + at('r')!.width)
    expect(at('a1')!.x).toBeGreaterThan(at('a')!.x + at('a')!.width)
  })

  it('rodzeństwo nie nachodzi na siebie w pionie', () => {
    const layout = layoutMap(tree)
    const a1 = layout.nodes.find((n) => n.node.id === 'a1')!
    const a2 = layout.nodes.find((n) => n.node.id === 'a2')!
    expect(Math.abs(a1.y - a2.y)).toBeGreaterThanOrEqual(a1.height)
  })

  it('rodzic jest wyśrodkowany względem swoich dzieci', () => {
    const layout = layoutMap(tree)
    const a = layout.nodes.find((n) => n.node.id === 'a')!
    const a1 = layout.nodes.find((n) => n.node.id === 'a1')!
    const a2 = layout.nodes.find((n) => n.node.id === 'a2')!
    expect(a.y).toBeCloseTo((a1.y + a2.y) / 2, 5)
  })

  it('łącznik kończy się poziomą kreską pod tekstem dziecka', () => {
    const layout = layoutMap(tree)
    const link = layout.connectors.find((c) => c.id === 'r->a')!
    const child = layout.nodes.find((n) => n.node.id === 'a')!
    const end = link.path.match(/L ([\d.-]+) ([\d.-]+)$/)
    expect(end).not.toBeNull()
    expect(Number(end![1])).toBeCloseTo(child.x + child.width, 5)
    expect(Number(end![2])).toBeCloseTo(child.y + UNDERLINE_OFFSET, 5)
  })

  it('zwinięty węzeł ukrywa poddrzewo, ale zapamiętuje liczbę dzieci', () => {
    const collapsed = tree.map((n) => (n.id === 'a' ? { ...n, collapsed: true } : n))
    const layout = layoutMap(collapsed)
    expect(layout.nodes.map((n) => n.node.id)).not.toContain('a1')
    const a = layout.nodes.find((n) => n.node.id === 'a')!
    expect(a.hasHiddenChildren).toBe(true)
    expect(a.childCount).toBe(2)
  })

  it('obszar rysunku obejmuje wszystkie węzły', () => {
    const layout = layoutMap(tree)
    for (const n of layout.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(layout.bounds.minX)
      expect(n.x + n.width).toBeLessThanOrEqual(layout.bounds.maxX)
    }
  })
})

describe('węzeł ze zdjęciem', () => {
  const PIXEL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  const withImage: MapNode[] = [
    { id: 'r', text: 'Temat', parentId: null },
    { id: 'a', text: 'Bez zdjęcia', parentId: 'r', color: 'coral' },
    { id: 'b', text: 'Ze zdjęciem', parentId: 'r', color: 'sky', image: PIXEL },
  ]

  it('rezerwuje pas na obraz nad tekstem', () => {
    const layout = layoutMap(withImage)
    const plain = layout.nodes.find((n) => n.node.id === 'a')!
    const photo = layout.nodes.find((n) => n.node.id === 'b')!
    expect(plain.imageBlock).toBe(0)
    expect(photo.imageBlock).toBe(IMAGE_HEIGHT + IMAGE_GAP)
    expect(photo.height).toBe(NODE_HEIGHT + IMAGE_HEIGHT + IMAGE_GAP)
  })

  it('tekst schodzi w dół o połowę pasa ze zdjęciem', () => {
    const layout = layoutMap(withImage)
    const photo = layout.nodes.find((n) => n.node.id === 'b')!
    expect(photo.textY).toBeCloseTo(photo.y + photo.imageBlock / 2, 5)
  })

  it('węzeł jest co najmniej tak szeroki jak kadr', () => {
    const layout = layoutMap([
      { id: 'r', text: 'R', parentId: null },
      { id: 'x', text: 'a', parentId: 'r', image: PIXEL },
    ])
    expect(layout.nodes.find((n) => n.node.id === 'x')!.width).toBeGreaterThanOrEqual(IMAGE_WIDTH)
  })

  it('podkreślenie trzyma się tekstu, nie środka węzła', () => {
    const layout = layoutMap(withImage)
    const photo = layout.nodes.find((n) => n.node.id === 'b')!
    const link = layout.connectors.find((c) => c.id === 'r->b')!
    const end = link.path.match(/L ([\d.-]+) ([\d.-]+)$/)!
    expect(Number(end[2])).toBeCloseTo(photo.textY + UNDERLINE_OFFSET, 5)
  })

  it('wyższy węzeł nie wchodzi na sąsiada', () => {
    const layout = layoutMap(withImage)
    const plain = layout.nodes.find((n) => n.node.id === 'a')!
    const photo = layout.nodes.find((n) => n.node.id === 'b')!
    const gap = Math.abs(plain.y - photo.y) - (plain.height + photo.height) / 2
    expect(gap).toBeGreaterThanOrEqual(0)
  })
})

describe('fitViewBox', () => {
  it('dokłada margines z obu stron', () => {
    const box = fitViewBox({ minX: 0, minY: 0, maxX: 100, maxY: 50 }, 10)
    expect(box).toBe('-10 -10 120 70')
  })
})

describe('branchColor', () => {
  it('dziedziczy kolor po gałęzi pierwszego poziomu', () => {
    expect(branchColor(tree, tree.find((n) => n.id === 'a1')!)).toBe('coral')
  })

  it('daje kolor domyślny, gdy nikt w łańcuchu go nie ma', () => {
    const plain: MapNode[] = [
      { id: 'r', text: 'R', parentId: null },
      { id: 'x', text: 'X', parentId: 'r' },
    ]
    expect(branchColor(plain, plain[1])).toBe('sky')
  })
})

describe('nextBranchColor', () => {
  it('wybiera kolor nieużywany przez sąsiednie gałęzie', () => {
    expect(nextBranchColor(tree, 'r')).toBe('violet')
  })
})

describe('subtreeIds', () => {
  it('zbiera węzeł razem z potomkami', () => {
    expect(subtreeIds(tree, 'a').sort()).toEqual(['a', 'a1', 'a2'])
  })

  it('dla liścia zwraca tylko jego', () => {
    expect(subtreeIds(tree, 'b')).toEqual(['b'])
  })
})

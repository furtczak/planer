import type { BranchColor, MapNode } from '../types'
import { BRANCH_COLORS } from '../types'

/**
 * Układ mapy w stylu MindNode: korzeń jako zaokrąglony kafelek, a gałęzie
 * rozchodzą się w prawo. Dziecko nie ma ramki - jest podkreślone kolorową
 * krzywą, która płynnie wraca do rodzica.
 */

export const ROOT_PADDING_X = 18
export const ROOT_HEIGHT = 46
export const NODE_HEIGHT = 34
/** Odstęp w pionie między sąsiednimi gałęziami. */
export const SIBLING_GAP = 14
/** Odległość w poziomie od końca rodzica do początku dziecka. */
export const LEVEL_GAP = 62
/** Podkreślenie dziecka leży tyle pikseli pod środkiem jego tekstu. */
export const UNDERLINE_OFFSET = 13
export const FONT_SIZE = 15
export const ROOT_FONT_SIZE = 17
/** Zdjęcie węzła: stały kadr nad tekstem. */
export const IMAGE_WIDTH = 104
export const IMAGE_HEIGHT = 78
export const IMAGE_GAP = 7

export type LaidOutNode = {
  node: MapNode
  /** Lewa krawędź tekstu (dla korzenia: lewa krawędź kafelka). */
  x: number
  /** Środek węzła w pionie. */
  y: number
  width: number
  height: number
  depth: number
  color: BranchColor
  isRoot: boolean
  childCount: number
  hasHiddenChildren: boolean
  /** Wysokość pasa ze zdjęciem nad tekstem (0, gdy węzeł nie ma zdjęcia). */
  imageBlock: number
  /** Środek wiersza z tekstem - przesunięty w dół, gdy nad nim wisi zdjęcie. */
  textY: number
}

export type Connector = {
  id: string
  color: BranchColor
  path: string
}

export type Layout = {
  nodes: LaidOutNode[]
  connectors: Connector[]
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}

let measureCanvas: { measure: (text: string, size: number, bold: boolean) => number } | null = null

function measurer() {
  if (measureCanvas) return measureCanvas

  let ctx: CanvasRenderingContext2D | null = null
  try {
    ctx = document.createElement('canvas').getContext('2d')
  } catch {
    ctx = null
  }

  measureCanvas = {
    measure(text, size, bold) {
      if (ctx) {
        ctx.font = `${bold ? 600 : 400} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        const width = ctx.measureText(text).width
        if (width > 0) return width
      }
      // środowisko bez canvasu (testy) - przybliżenie wystarczy do sprawdzenia struktury
      return text.length * size * 0.56
    },
  }
  return measureCanvas
}

export function textWidth(text: string, size = FONT_SIZE, bold = false): number {
  const clean = text.trim() || 'Nowy węzeł'
  return Math.max(28, measurer().measure(clean, size, bold))
}

export function childrenOf(nodes: MapNode[], parentId: string | null): MapNode[] {
  return nodes.filter((n) => n.parentId === parentId)
}

export function findRoot(nodes: MapNode[]): MapNode | undefined {
  return nodes.find((n) => n.parentId === null)
}

/** Węzeł wraz z całym poddrzewem - używane przy usuwaniu i przy zwijaniu. */
export function subtreeIds(nodes: MapNode[], id: string): string[] {
  const result = [id]
  const queue = [id]
  while (queue.length > 0) {
    const current = queue.shift() as string
    for (const child of nodes) {
      if (child.parentId === current) {
        result.push(child.id)
        queue.push(child.id)
      }
    }
  }
  return result
}

/** Kolor gałęzi: węzeł pierwszego poziomu ma własny, głębsze dziedziczą po przodku. */
export function branchColor(nodes: MapNode[], node: MapNode): BranchColor {
  let current: MapNode | undefined = node
  const seen = new Set<string>()
  while (current && current.parentId !== null) {
    if (seen.has(current.id)) break
    seen.add(current.id)
    if (current.color) return current.color
    const parentId: string | null = current.parentId
    current = nodes.find((n) => n.id === parentId)
  }
  return 'sky'
}

/** Kolor dla nowej gałęzi - kolejny z palety, żeby sąsiednie się nie powtarzały. */
export function nextBranchColor(nodes: MapNode[], rootId: string): BranchColor {
  const used = childrenOf(nodes, rootId)
    .map((n) => n.color)
    .filter((c): c is BranchColor => Boolean(c))
  const free = BRANCH_COLORS.find((c) => !used.includes(c))
  return free ?? BRANCH_COLORS[used.length % BRANCH_COLORS.length]
}

type Measured = {
  node: MapNode
  width: number
  height: number
  imageBlock: number
  children: Measured[]
  /** Wysokość całego poddrzewa - na jej podstawie ustawiamy pozycje w pionie. */
  span: number
  depth: number
}

function measureTree(nodes: MapNode[], node: MapNode, depth: number): Measured {
  const isRoot = node.parentId === null
  const textOnlyWidth = isRoot
    ? textWidth(node.text, ROOT_FONT_SIZE, true) + ROOT_PADDING_X * 2
    : textWidth(node.text)
  const imageBlock = node.image ? IMAGE_HEIGHT + IMAGE_GAP : 0
  const width = node.image ? Math.max(textOnlyWidth, IMAGE_WIDTH) : textOnlyWidth
  const height = (isRoot ? ROOT_HEIGHT : NODE_HEIGHT) + imageBlock

  const kids = node.collapsed ? [] : childrenOf(nodes, node.id)
  const children = kids.map((child) => measureTree(nodes, child, depth + 1))

  const childrenSpan =
    children.length > 0
      ? children.reduce((sum, c) => sum + c.span, 0) + SIBLING_GAP * (children.length - 1)
      : 0

  return {
    node,
    width,
    height,
    imageBlock,
    children,
    span: Math.max(height, childrenSpan),
    depth,
  }
}

export function layoutMap(nodes: MapNode[]): Layout {
  const root = findRoot(nodes)
  if (!root) {
    return { nodes: [], connectors: [], bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } }
  }

  const measured = measureTree(nodes, root, 0)
  const laidOut: LaidOutNode[] = []
  const connectors: Connector[] = []

  const place = (item: Measured, x: number, centerY: number) => {
    const isRoot = item.depth === 0
    const allChildren = childrenOf(nodes, item.node.id)
    // zdjęcie wisi nad tekstem, więc sam tekst schodzi o połowę tego pasa w dół
    const textY = centerY + item.imageBlock / 2
    laidOut.push({
      node: item.node,
      x,
      y: centerY,
      width: item.width,
      height: item.height,
      depth: item.depth,
      color: isRoot ? 'sky' : branchColor(nodes, item.node),
      isRoot,
      childCount: allChildren.length,
      hasHiddenChildren: Boolean(item.node.collapsed) && allChildren.length > 0,
      imageBlock: item.imageBlock,
      textY,
    })

    if (item.children.length === 0) return

    // punkt startowy gałęzi: prawa krawędź kafelka korzenia albo koniec podkreślenia
    const anchorX = x + item.width
    const anchorY = isRoot ? textY : textY + UNDERLINE_OFFSET
    const childX = anchorX + LEVEL_GAP

    let cursor = centerY - item.children.reduce((s, c) => s + c.span, 0) / 2
    cursor -= (SIBLING_GAP * (item.children.length - 1)) / 2

    for (const child of item.children) {
      const childCenter = cursor + child.span / 2
      cursor += child.span + SIBLING_GAP

      const underlineY = childCenter + child.imageBlock / 2 + UNDERLINE_OFFSET
      const color = branchColor(nodes, child.node)
      const curve = Math.max(24, LEVEL_GAP * 0.62)

      connectors.push({
        id: `${item.node.id}->${child.node.id}`,
        color,
        path:
          `M ${anchorX} ${anchorY} ` +
          `C ${anchorX + curve} ${anchorY} ${childX - curve} ${underlineY} ${childX} ${underlineY} ` +
          `L ${childX + child.width} ${underlineY}`,
      })

      place(child, childX, childCenter)
    }
  }

  place(measured, 0, 0)

  const bounds = laidOut.reduce(
    (acc, n) => ({
      minX: Math.min(acc.minX, n.x),
      maxX: Math.max(acc.maxX, n.x + n.width),
      minY: Math.min(acc.minY, n.y - n.height / 2),
      maxY: Math.max(acc.maxY, n.y + n.height / 2 + (n.isRoot ? 0 : UNDERLINE_OFFSET)),
    }),
    { minX: 0, maxX: 0, minY: 0, maxY: 0 },
  )

  return { nodes: laidOut, connectors, bounds }
}

/** viewBox dopasowany do zawartości - używany i w edytorze, i w miniaturach. */
export function fitViewBox(bounds: Layout['bounds'], padding = 40): string {
  const width = Math.max(bounds.maxX - bounds.minX, 1) + padding * 2
  const height = Math.max(bounds.maxY - bounds.minY, 1) + padding * 2
  return `${bounds.minX - padding} ${bounds.minY - padding} ${width} ${height}`
}

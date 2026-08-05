import type { AppData } from '../types'

const day = 24 * 60 * 60 * 1000
const now = Date.now()

/** Dane startowe - dwie mapy i jedna notatka, żeby od razu było co klikać. */
export function sampleData(): AppData {
  return {
    version: 2,
    maps: [
      {
        id: 'm-pieniadze',
        title: 'Pieniądze',
        emoji: '💸',
        pinned: true,
        trashed: false,
        createdAt: now - 4 * day,
        updatedAt: now - 2 * 60 * 60 * 1000,
        nodes: [
          { id: 'p-root', text: 'Pieniądze', parentId: null },
          { id: 'p-1', text: 'Druk 3d', parentId: 'p-root', color: 'coral' },
          { id: 'p-1-1', text: 'Filament', parentId: 'p-1' },
          { id: 'p-1-2', text: 'Zlecenia lokalnie', parentId: 'p-1' },
          { id: 'p-2', text: 'Inwestowanie', parentId: 'p-root', color: 'sky' },
          { id: 'p-2-1', text: 'ETF co miesiąc', parentId: 'p-2' },
          { id: 'p-2-2', text: 'Poduszka na 6 mies.', parentId: 'p-2' },
          { id: 'p-3', text: 'Projektowanie', parentId: 'p-root', color: 'violet' },
          { id: 'p-3-1', text: 'Portfolio', parentId: 'p-3' },
          { id: 'p-4', text: 'Praca elektryka', parentId: 'p-root', color: 'amber' },
          { id: 'p-4-1', text: 'Uprawnienia SEP', parentId: 'p-4' },
          { id: 'p-4-2', text: 'Stawka godzinowa', parentId: 'p-4', note: 'Sprawdzić stawki w okolicy.' },
        ],
      },
      {
        id: 'm-remont',
        title: 'Remont kuchni',
        emoji: '🔨',
        pinned: false,
        trashed: false,
        createdAt: now - 12 * day,
        updatedAt: now - 3 * day,
        nodes: [
          { id: 'r-root', text: 'Remont kuchni', parentId: null },
          { id: 'r-1', text: 'Budżet', parentId: 'r-root', color: 'mint' },
          { id: 'r-1-1', text: 'Sprzęt AGD', parentId: 'r-1' },
          { id: 'r-1-2', text: 'Blat', parentId: 'r-1' },
          { id: 'r-2', text: 'Terminy', parentId: 'r-root', color: 'rose' },
          { id: 'r-2-1', text: 'Hydraulik', parentId: 'r-2' },
          { id: 'r-3', text: 'Inspiracje', parentId: 'r-root', color: 'sky' },
        ],
      },
    ],
    notes: [
      {
        id: 'n-zakupy',
        title: 'Zakupy',
        body: 'Sobotni wypad do sklepu. Sprawdzić promocje na **kawę**.',
        tags: ['dom'],
        checklist: [
          { id: 'c-1', text: 'Chleb', done: false },
          { id: 'c-2', text: 'Kawa ziarnista', done: false },
          { id: 'c-3', text: 'Mleko owsiane', done: true },
        ],
        pinned: false,
        trashed: false,
        createdAt: now - 2 * day,
        updatedAt: now - 30 * 60 * 1000,
      },
    ],
  }
}

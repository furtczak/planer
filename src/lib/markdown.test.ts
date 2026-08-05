import { describe, expect, it } from 'vitest'
import { escapeHtml, extractInlineTags, plainText, renderMarkdown } from './markdown'

describe('escapeHtml', () => {
  it('escapuje znaki mogące zamknąć tag', () => {
    expect(escapeHtml('<b>"x"</b>')).toBe('&lt;b&gt;&quot;x&quot;&lt;/b&gt;')
  })
})

describe('renderMarkdown', () => {
  it('renderuje nagłówki i akapity', () => {
    expect(renderMarkdown('# Tytuł\n\ntekst')).toBe('<h1>Tytuł</h1>\n<p>tekst</p>')
  })

  it('renderuje listy punktowane i numerowane', () => {
    expect(renderMarkdown('- a\n- b')).toBe('<ul>\n<li>a</li>\n<li>b</li>\n</ul>')
    expect(renderMarkdown('1. a\n2. b')).toBe('<ol>\n<li>a</li>\n<li>b</li>\n</ol>')
  })

  it('renderuje listę zadań z zaznaczeniem', () => {
    const html = renderMarkdown('- [x] zrobione\n- [ ] do zrobienia')
    expect(html).toContain('md-task is-done')
    expect(html).toContain('do zrobienia')
  })

  it('obsługuje pogrubienie, kursywę i kod', () => {
    expect(renderMarkdown('**a** *b* `c`')).toBe(
      '<p><strong>a</strong> <em>b</em> <code>c</code></p>',
    )
  })

  it('nie interpretuje formatowania wewnątrz kodu inline', () => {
    expect(renderMarkdown('`**nie pogrubiaj**`')).toBe('<p><code>**nie pogrubiaj**</code></p>')
  })

  it('zachowuje blok kodu bez zmian', () => {
    expect(renderMarkdown('```\nlet x = 1 < 2\n```')).toBe(
      '<pre><code>let x = 1 &lt; 2</code></pre>',
    )
  })

  it('nie przepuszcza HTML-a z treści notatki', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })

  it('odrzuca linki z niebezpiecznym schematem', () => {
    const html = renderMarkdown('[klik](javascript:alert(1))')
    expect(html).not.toContain('<a')
  })

  it('robi link z adresu http', () => {
    expect(renderMarkdown('[dokumentacja](https://example.com)')).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">dokumentacja</a>',
    )
  })

  it('podświetla tagi w treści', () => {
    expect(renderMarkdown('notatka #praca')).toContain('<span class="md-tag">#praca</span>')
  })
})

describe('plainText', () => {
  it('usuwa znaczniki i skleja białe znaki', () => {
    expect(plainText('# Tytuł\n\n**ważne** [link](https://x.pl)')).toBe('Tytuł ważne link')
  })
})

describe('extractInlineTags', () => {
  it('zbiera unikalne tagi zapisane w treści', () => {
    expect(extractInlineTags('#Praca i #dom oraz znowu #praca')).toEqual(['praca', 'dom'])
  })

  it('pomija zbyt krótkie ciągi', () => {
    expect(extractInlineTags('#a')).toEqual([])
  })
})

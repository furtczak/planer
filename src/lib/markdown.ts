/**
 * Minimalny renderer Markdown -> HTML.
 *
 * Wejście jest najpierw w całości escapowane, więc do wyniku nie trafi żaden
 * tag HTML pochodzący od użytkownika. Dopiero potem dokładamy własne znaczniki.
 */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch])
}

/** Przepuszczamy wyłącznie bezpieczne schematy - inaczej link staje się zwykłym tekstem. */
function safeUrl(url: string): string | null {
  const trimmed = url.trim()
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed
  if (/^[a-z0-9._~\-/#?]/i.test(trimmed) && !trimmed.includes(':')) return trimmed
  return null
}

function inline(text: string): string {
  let out = escapeHtml(text)

  // kod inline - najpierw, żeby nie interpretować formatowania w środku
  const codes: string[] = []
  out = out.replace(/`([^`]+)`/g, (_m, code: string) => {
    codes.push(code)
    return `\uE000CODE${codes.length - 1}\uE000`
  })

  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, url: string) => {
    const href = safeUrl(url)
    if (!href) return match
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
  })

  out = out.replace(
    /(^|[\s(])((?:https?:\/\/)[^\s<)]+)/g,
    (_m, prefix: string, url: string) =>
      `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
  )

  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  out = out.replace(/(^|\s)#([\p{L}\p{N}_-]+)/gu, '$1<span class="md-tag">#$2</span>')

  out = out.replace(/\uE000CODE(\d+)\uE000/g, (_m, i: string) => `<code>${codes[Number(i)]}</code>`)

  return out
}

export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []

  let paragraph: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let inCode = false
  let codeBuffer: string[] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    html.push(`<p>${inline(paragraph.join('\n')).replace(/\n/g, '<br />')}</p>`)
    paragraph = []
  }

  const flushList = () => {
    if (!listType) return
    html.push(`</${listType}>`)
    listType = null
  }

  const openList = (type: 'ul' | 'ol') => {
    if (listType === type) return
    flushList()
    html.push(`<${type}>`)
    listType = type
  }

  for (const line of lines) {
    if (/^```/.test(line)) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`)
        codeBuffer = []
        inCode = false
      } else {
        flushParagraph()
        flushList()
        inCode = true
      }
      continue
    }

    if (inCode) {
      codeBuffer.push(line)
      continue
    }

    if (line.trim() === '') {
      flushParagraph()
      flushList()
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`)
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushParagraph()
      flushList()
      html.push('<hr />')
      continue
    }

    const quote = line.match(/^>\s?(.*)$/)
    if (quote) {
      flushParagraph()
      flushList()
      html.push(`<blockquote>${inline(quote[1])}</blockquote>`)
      continue
    }

    const task = line.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/)
    if (task) {
      flushParagraph()
      openList('ul')
      const checked = task[1].toLowerCase() === 'x'
      html.push(
        `<li class="md-task${checked ? ' is-done' : ''}">` +
          `<span class="md-box">${checked ? '✓' : ''}</span>${inline(task[2])}</li>`,
      )
      continue
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) {
      flushParagraph()
      openList('ul')
      html.push(`<li>${inline(bullet[1])}</li>`)
      continue
    }

    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/)
    if (ordered) {
      flushParagraph()
      openList('ol')
      html.push(`<li>${inline(ordered[1])}</li>`)
      continue
    }

    flushList()
    paragraph.push(line)
  }

  if (inCode && codeBuffer.length > 0) {
    html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`)
  }
  flushParagraph()
  flushList()

  return html.join('\n')
}

/** Tekst bez znaczników - do podglądu na kafelku i do wyszukiwarki. */
export function plainText(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_~`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tagi zapisane w treści jako #tag. */
export function extractInlineTags(source: string): string[] {
  const matches = source.matchAll(/(?:^|\s)#([\p{L}\p{N}_-]{2,})/gu)
  const tags = new Set<string>()
  for (const m of matches) tags.add(m[1].toLowerCase())
  return [...tags]
}

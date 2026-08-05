const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Krótki, względny opis czasu po polsku ("5 min temu", "wczoraj"). */
export function relativeTime(timestamp: number, now = Date.now()): string {
  const diff = now - timestamp
  if (diff < MINUTE) return 'przed chwilą'
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE)
    return `${m} min temu`
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR)
    return `${h} ${h === 1 ? 'godzinę' : h < 5 ? 'godziny' : 'godzin'} temu`
  }
  if (diff < 2 * DAY) return 'wczoraj'
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} dni temu`

  return new Date(timestamp).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: new Date(timestamp).getFullYear() === new Date(now).getFullYear() ? undefined : 'numeric',
  })
}

export function fullDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

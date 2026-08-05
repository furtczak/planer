/**
 * Zdjęcia trzymamy w localStorage jako data URI, a limit to kilka megabajtów
 * na całą aplikację. Dlatego każdy plik przed zapisem skalujemy i kompresujemy.
 */

export const MAX_IMAGE_SIZE = 720
export const IMAGE_QUALITY = 0.72
/** Powyżej tego progu odmawiamy zapisu - jeden kadr nie może zjeść całego magazynu. */
export const MAX_DATA_URL_BYTES = 700_000

export function isImageDataUrl(value: unknown): value is string {
  return typeof value === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)
}

/** Przybliżony rozmiar w bajtach po zdekodowaniu base64. */
export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.floor((base64.length * 3) / 4)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Nie udało się wczytać obrazu'))
    img.src = src
  })
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Nie udało się odczytać pliku'))
    reader.readAsDataURL(file)
  })
}

export type ImageResult = { ok: true; dataUrl: string } | { ok: false; error: string }

/** Wczytuje plik, zmniejsza dłuższy bok do MAX_IMAGE_SIZE i zwraca JPEG jako data URI. */
export async function fileToScaledDataUrl(file: File): Promise<ImageResult> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'To nie jest plik graficzny.' }
  }

  try {
    const original = await readFile(file)
    const img = await loadImage(original)

    const longest = Math.max(img.naturalWidth, img.naturalHeight) || 1
    const scale = Math.min(1, MAX_IMAGE_SIZE / longest)
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return { ok: false, error: 'Przeglądarka nie pozwoliła przetworzyć obrazu.' }

    // JPEG nie ma przezroczystości, więc tło malujemy na biało zamiast zostawiać czerń
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY)
    if (dataUrlBytes(dataUrl) > MAX_DATA_URL_BYTES) {
      return { ok: false, error: 'Zdjęcie jest za duże nawet po zmniejszeniu. Wybierz mniejsze.' }
    }

    return { ok: true, dataUrl }
  } catch {
    return { ok: false, error: 'Nie udało się przetworzyć zdjęcia.' }
  }
}

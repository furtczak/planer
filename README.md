# 🧠 Mind Notes

Notatnik w przeglądarce: kafelki jak w Google Keep, checklisty, tagi, foldery
i dodatkowo **widok mapy myśli**, który pokazuje wszystkie notatki jako
promienisty graf wokół bieżącego widoku.

Wszystko działa lokalnie - dane siedzą w `localStorage`, nie ma backendu,
konta ani wysyłania czegokolwiek na zewnątrz.

## Funkcje

- **Notatki** - tytuł, treść w Markdownie, 7 kolorów, przypinanie, archiwum, kosz z przywracaniem
- **Checklisty** - zadania w notatce, odhaczanie także bezpośrednio z kafelka, pasek postępu
- **Foldery** - dodawanie, zmiana nazwy (dwuklik), usuwanie bez utraty notatek
- **Tagi** - własne oraz wyłapywane z treści (`#praca`), chmura tagów z licznikami
- **Wyszukiwarka** - po tytule, treści, tagach i zadaniach; wiele słów naraz
- **Widoki** - kafelki, lista i mapa myśli (przeciąganie, zoom, klik w węzeł otwiera notatkę)
- **Sortowanie** - ostatnio zmienione / ostatnio dodane / alfabetycznie
- **Motyw jasny i ciemny** - domyślnie zgodny z ustawieniem systemu
- **Eksport i import JSON** - kopia zapasowa i przenoszenie danych między przeglądarkami
- **Skróty klawiszowe** - `n` nowa notatka, `/` wyszukiwarka, `Esc` zamknięcie edytora
- **Responsywność** - na wąskim ekranie panel boczny chowa się pod przyciskiem menu

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:5173
```

Pozostałe polecenia:

```bash
npm run build      # produkcyjny build do dist/
npm run preview    # podgląd builda
npm test           # testy jednostkowe (vitest)
npm run typecheck  # sprawdzenie typów
```

## Obsługiwany Markdown

Nagłówki `#`/`##`/`###`, **pogrubienie**, *kursywa*, ~~przekreślenie~~, `kod`,
bloki kodu ` ``` `, listy punktowane i numerowane, listy zadań `- [x]`,
cytaty `>`, linia `---`, linki `[tekst](url)` oraz tagi `#tag`.

Renderer jest własny i minimalny: treść notatki jest najpierw escapowana,
więc HTML wpisany w notatkę nie trafia do dokumentu, a linki przepuszczamy
tylko dla schematów `http`, `https` i `mailto`.

## Struktura

```
src/
├── components/     # Sidebar, Topbar, NoteCard, NoteEditor, MindMap, ikony
├── hooks/          # useAppData (stan + zapis), useTheme
├── lib/            # markdown, storage, daty, id, dane przykładowe
├── store/          # reducer notatek, filtrowanie, liczniki
├── types.ts
├── styles.css
└── main.tsx
```

Stan trzyma jeden reducer (`src/store/notesReducer.ts`) - jest czysty i pokryty
testami razem z rendererem Markdown i normalizacją danych z `localStorage`
(38 testów, `npm test`).

## Dane

Klucz w `localStorage`: `mind-notes:data:v1` (motyw osobno: `mind-notes:theme`).
Zapis jest odroczony o 300 ms, więc pisanie w edytorze nie zapisuje przy każdym
znaku. Dane wczytywane z dysku lub importu są normalizowane - uszkodzony wpis
nie wywraca aplikacji, a notatka wskazująca na nieistniejący folder ląduje
w "Bez folderu".

# 🧠 Mind Notes

Mobilna aplikacja do map myśli, z klasycznymi notatkami jako dodatkiem.
Wygląd i sposób obsługi wzorowane na MindNode: dokumenty w kartach z podglądem
mapy, pływające pigułki zamiast pasków narzędzi, gałęzie rysowane kolorową
krzywą, która przechodzi w podkreślenie tekstu.

Wszystko działa lokalnie - dane siedzą w `localStorage`, bez backendu i konta.

Na żywo: **https://furtczak.github.io/planer/**

## Co potrafi

**Mapy myśli**
- automatyczny układ gałęzi - nie trzeba niczego przesuwać ręcznie
- dodawanie gałęzi i rodzeństwa, usuwanie z całym poddrzewem
- zwijanie gałęzi z licznikiem ukrytych dzieci
- 6 kolorów gałęzi, potomkowie dziedziczą kolor po swojej gałęzi
- notatka doczepiona do węzła (kropka przy tekście oznacza, że coś tam jest)
- przeciąganie i zoom płótna, tytuł mapy zsynchronizowany z korzeniem
- podgląd prawdziwej mapy na kafelku dokumentu i w wynikach wyszukiwania

**Notatki**
- Markdown z podglądem, lista zadań, tagi

**Reszta**
- ekran główny z kartami: mapy, notatki, ostatnie, kosz
- wyszukiwarka sięgająca do treści węzłów, nie tylko tytułów
- kosz z przywracaniem, eksport i import JSON
- motyw jasny i ciemny, domyślnie zgodny z ustawieniem systemu
- na klawiaturze: `Tab` nowa gałąź, `Enter` gałąź obok, `Esc` wstecz

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build      # produkcyjny build do dist/
npm test           # testy jednostkowe (vitest)
npm run typecheck  # sprawdzenie typów
```

## Jak zbudowany jest układ mapy

`src/lib/mapLayout.ts` liczy pozycje węzłów i ścieżki gałęzi. Każdy węzeł zna
wysokość swojego poddrzewa, więc rodzeństwo nigdy na siebie nie nachodzi,
a rodzic siedzi dokładnie na środku swoich dzieci. Gałąź to jedna ścieżka SVG:
krzywa Béziera od rodzica do dziecka, zakończona poziomą kreską pod tekstem -
stąd charakterystyczne podkreślenie.

Szerokość tekstu mierzymy przez `canvas.measureText`, a w środowisku bez canvasu
(testy) schodzimy na przybliżenie. Ten sam moduł rysuje edytor i miniatury,
więc kafelek dokumentu pokazuje dokładnie tę mapę, która jest w środku.

## Struktura

```
src/
├── components/   # MapCanvas (płótno mapy), MapThumb, ikony
├── screens/      # Home, Maps, Notes, MapEditor, NoteEditor
├── hooks/        # useAppData (stan + zapis), useTheme
├── lib/          # mapLayout, markdown, storage, daty, dane przykładowe
├── store/        # appReducer - cała logika map i notatek
└── styles.css
```

Stan trzyma jeden czysty reducer (`src/store/appReducer.ts`), a układ mapy jest
osobnym modułem bez Reacta - oba są pokryte testami (`npm test`).

## Dane

Klucz w `localStorage`: `mind-notes:data:v2`, motyw osobno pod
`mind-notes:theme`. Dane z wersji z samymi notatkami (`:v1`) wczytują się bez
migracji ręcznej. Zapis jest odroczony o 300 ms, ale wymuszany przy zamykaniu
karty, więc zmiana tuż przed odświeżeniem nie ginie.

Wczytane dane są normalizowane: mapa bez korzenia dostaje go automatycznie,
drugi korzeń ląduje pod pierwszym, a węzeł wskazujący nieistniejącego rodzica
trafia pod korzeń - uszkodzony plik nie wywraca aplikacji.

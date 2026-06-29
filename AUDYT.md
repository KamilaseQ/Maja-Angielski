# Audyt aplikacji „English MVP”

**Data:** 2026-06-29
**Zakres:** pełny kod źródłowy (`src/`, `public/`, konfiguracja)
**Cel:** wykrycie błędów, sprzeczności logicznych i użytkowych, braków funkcjonalnych oraz rzeczy nadmiarowych do usunięcia.

---

## 1. Streszczenie dla zarządzającego

English MVP to PWA do nauki słownictwa angielskiego dla jednej uczennicy (Maja). Aplikacja jest offline-first (postęp w IndexedDB), ma ~79 lekcji × 10 słów (~790 haseł) i 4 moduły: **Pamięć**, **Pisanie**, **Wymowa**, **Powtórki**.

Aplikacja działa i ma spójną estetycznie warstwę wizualną, ale pod spodem ma **kilka poważnych wad logicznych, które podważają sens nauki**:

- **Ocena wymowy jest fałszywa** — „wynik wymowy” jest wyliczany z długości słowa i czasu nagrania, a nie z tego, co uczeń powiedział. Dziecko dostaje wymyślone „84%” nawet po ciszy.
- **System „słabych słów” i powtórek nigdy się nie regeneruje** — raz popełniony błąd zostaje na zawsze, więc im więcej dziecko ćwiczy, tym gorszy ma wynik „Powtórek”.
- **Nauka bez nauczania** — aplikacja od razu odpytuje z produkcji słowa (PL → EN), zanim w ogóle pokazała, jak to słowo wygląda. Nie ma etapu „poznaj słowo”.
- **Import własnej lekcji nie działa tak, jak sugeruje** — po imporcie aplikacja i tak wraca do pierwszej lekcji seed.
- **Ryzyko utraty całego postępu** — „tryb awaryjny” po 2,5 s może nadpisać miesiące postępów pustymi danymi.

Do tego dochodzi spora ilość **martwego kodu** (dwie równoległe implementacje kolejek ćwiczeń, nieużywane typy ćwiczeń, nieużywany scheduling powtórek) oraz **nadmiarowych funkcji** (limit sekund wymowy, fałszywy przełącznik kierunku).

**Ocena ogólna:** dobry szkielet UI, ale rdzeń dydaktyczny (ocena, powtórki, nauka nowych słów) wymaga przeprojektowania, zanim aplikacja będzie realnie ucząca.

| Obszar | Stan |
|---|---|
| Wygląd / nawigacja | 🟢 Dobry |
| Model danych | 🟡 Przerośnięty, dużo pól nieużywanych |
| Logika nauki (oceny, powtórki) | 🔴 Wadliwa |
| Ocena wymowy | 🔴 Pozorowana |
| Trwałość danych (offline/zapis) | 🔴 Ryzyko utraty danych |
| Treść (słownictwo) | 🟡 Dobra baza, psuje ją sprawdzarka odpowiedzi |
| Bezpieczeństwo / prywatność | 🟡 OK dla użytku prywatnego, słabe dla publicznego |

---

## 2. Błędy krytyczne (do naprawy w pierwszej kolejności)

### K1. Ocena wymowy jest fabrykowana 🔴
Plik: [route.ts:123-142](src/app/api/pronunciation/assess/route.ts#L123-L142)

Gdy nie ma kluczy Azure (a domyślnie ich nie ma), backend zwraca „demo”:

```ts
const accuracyScore = Math.round(66 + lengthBonus + (durationMs % 9));
const fluencyScore  = Math.round(70 + Math.min(12, durationMs / 900));
```

Wynik nie zależy **w żaden sposób** od nagrania — wyłącznie od długości słowa i czasu trwania. Dziecko może milczeć albo powiedzieć cokolwiek i dostać „Wymowa 84%, płynność 78%”, a moduł zaliczy się jako „passed”. To jest funkcja, która **udaje** ocenę i uczy złych nawyków (utrwala błędną wymowę z pozytywnym feedbackiem).

Dodatkowo ścieżka Azure (gdy klucze są) wysyła `audio/webm`/`audio/mp4` do REST endpointu STT ([route.ts:83-96](src/app/api/pronunciation/assess/route.ts#L83-L96)), który zwykle nie przyjmuje tych formatów — więc w praktyce i tak wpada w `catch` i zwraca demo. Czyli realnej oceny nie ma nigdy.

**Rekomendacja:** albo zintegrować prawdziwą ocenę (Azure Pronunciation Assessment z poprawnym formatem audio / Web Speech API jako rozpoznawanie), albo **uczciwie** zamienić moduł na „self-check”: odsłuchaj wzorzec → nagraj się → porównaj samodzielnie, bez wymyślonej liczby procent.

---

### K2. „Słabe słowa” nigdy nie zdrowieją — powtórki i wynik degenerują się w czasie 🔴
Pliki: [learning.ts:159](src/lib/learning.ts#L159), [learning.ts:225](src/lib/learning.ts#L225), [learning.ts:359](src/lib/learning.ts#L359)

`mistakes` jest **monotoniczne** — rośnie przy błędzie, ale nigdy nie maleje przy późniejszym sukcesie:

```ts
mistakes: existing.mistakes + (correct ? 0 : 1),
```

A słowo jest „słabe”, jeśli `mistakes > 0`:

```ts
const weakCount = states.filter((s) => s.mistakes > 0 || averageScore(s) < 72).length;
```

Skutki:
- Każde słowo raz pomylone jest **na zawsze** liczone jako słabe.
- `weakCount` rośnie monotonicznie wraz z ćwiczeniem.
- Wynik „Powtórek” = `100 - weakCount × 5` ([EnglishMvpApp.tsx:1522](src/components/EnglishMvpApp.tsx#L1522)) **spada** im więcej dziecko ćwiczy. Im pilniejsza nauka, tym gorszy „wynik”. To odwrotna motywacja.
- Kolejka powtórek zapełnia się słowami, które dawno opanowano.

**Rekomendacja:** wprowadzić odzysk — np. licznik serii poprawnych odpowiedzi, „mistakes” jako okno ostatnich N prób, albo wyłącznie próg na bieżącym wyniku (a nie historyczny licznik).

---

### K3. Martwe umiejętności (`listening`, `usage`) zaniżają średnią i blokują słowa jako „słabe” 🔴
Pliki: [learning.ts:300-307](src/lib/learning.ts#L300-L307), [learning.ts:370-373](src/lib/learning.ts#L370-L373)

Każde słowo startuje z 6 wynikami po 45 pkt. W UI istnieją tylko ćwiczenia ruszające `meaning`, `recall`, `spelling`, `pronunciation`. `listening` i `usage` **nigdy się nie zmieniają** (brak modułów dyktanda i zdań), więc na stałe tkwią na 45.

`averageScore` liczy średnią ze **wszystkich 6**:

```ts
return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
```

Żeby słowo przestało być „słabe” (`averageScore ≥ 72`), cztery realnie ćwiczone umiejętności muszą uśrednić **≥ 85,5 pkt** — bo dwie zamrożone 45-tki ciągną średnią w dół. To praktycznie nieosiągalne i sprawia, że niemal wszystko jest „słabe”.

**Rekomendacja:** liczyć średnią tylko z umiejętności faktycznie ćwiczonych albo usunąć `listening`/`usage` z modelu (patrz sekcja „martwy kod”).

---

### K4. Import lekcji CSV nie przełącza na zaimportowaną lekcję 🔴
Pliki: [EnglishMvpApp.tsx:585-589](src/components/EnglishMvpApp.tsx#L585-L589), [learning.ts:375-380](src/lib/learning.ts#L375-L380)

Import ustawia `activeLessonId: lesson.id` i pokazuje „Dodano lekcję …”. Ale **`activeLessonId` nie jest nigdzie czytane** do wyboru aktywnej lekcji. Aktywna lekcja to:

```ts
lessons.find((l) => !progress.completedLessonIds.includes(l.id)) ?? lessons[0];
```

`findNextLesson` zwraca **pierwszą nieukończoną lekcję seed** (custom lekcje są doklejone na końcu listy). Efekt: rodzic importuje własną lekcję, dostaje komunikat sukcesu, a aplikacja dalej każe ćwiczyć „01. Daily routine”. Intencja użytkownika cicho zawodzi.

`activeLessonId` to w praktyce **martwy stan** — zapisywany, ale nieużywany do tego, co sugeruje nazwa.

**Rekomendacja:** albo `findNextLesson` ma honorować `activeLessonId`, albo dodać prawdziwy wybór lekcji (patrz „braki”).

---

### K5. Ryzyko utraty całego postępu przez „tryb awaryjny” 🔴
Plik: [EnglishMvpApp.tsx:203-253](src/components/EnglishMvpApp.tsx#L203-L253)

Przy starcie jest timeout 2,5 s. Jeśli odczyt z IndexedDB nie zdąży (wolny telefon, duży log prób, tryb prywatny, zablokowane IDB), aplikacja ładuje **pusty** postęp i pokazuje „tryb awaryjny”. Późniejsze (prawdziwe) dane z `loadProgress()` są **ignorowane** (`if (cancelled || finished) return;`).

Gdy potem dziecko ukończy moduł, efekt zapisu nadpisze IndexedDB pustym postępem + nową aktywnością → **realna utrata miesięcy nauki**. Tekst w UI wprost mówi „tryb awaryjny”, więc autor wiedział o ryzyku, ale nie zabezpieczył przed nadpisaniem.

**Rekomendacja:** nie nadpisywać magazynu, dopóki nie potwierdzono, że odczyt naprawdę się nie powiódł (a nie tylko „był wolny”); zrobić backup-before-write; ewentualnie wydłużyć/usunąć timeout i pokazać spinner zamiast czyścić dane.

---

## 3. Sprzeczności logiczne i błędy średnie

### S1. „Powtórki” liczone dwoma różnymi wzorami
- Panel/Moduły: `100 - weakCount × 5` ([EnglishMvpApp.tsx:1522](src/components/EnglishMvpApp.tsx#L1522))
- Postępy: `100 - weakCount × 4` ([EnglishMvpApp.tsx:1129](src/components/EnglishMvpApp.tsx#L1129))

Ten sam wskaźnik pokazuje **inny procent** na różnych ekranach.

### S2. „Słabe słowa” mają trzy różne definicje
- `weakCount` w `summarizeProgress`: `mistakes > 0 || averageScore < 72` ([learning.ts:359](src/lib/learning.ts#L359))
- `getWeakWords` w komponencie: `mistakes > 0 || któryś score < 70` ([EnglishMvpApp.tsx:1511-1516](src/components/EnglishMvpApp.tsx#L1511-L1516))
- `buildReviewQueue` (martwy): `mistakes > 0 || averageScore < 72` ([learning.ts:125-128](src/lib/learning.ts#L125-L128))

Trzy różne progi → liczba „słabych” na liczniku nie zgadza się z listą i z kolejką.

### S3. Moduł zalicza się niezależnie od poprawności
Plik: [EnglishMvpApp.tsx:359-406](src/components/EnglishMvpApp.tsx#L359-L406)

`finishModule` zawsze woła `completeModule(...)` i pokazuje ekran „Dobra robota!”, nawet przy 0% poprawnych. Zielony „✓ Zaliczone” i nabijanie streaka nie mają związku z tym, czy dziecko cokolwiek umie. Zaliczenie ≠ kompetencja, a UI sugeruje sukces.

### S4. `completedToday` potrafi pokazać „3/2”, „4/2”
Pliki: [learning.ts:263](src/lib/learning.ts#L263), [EnglishMvpApp.tsx:774-776](src/components/EnglishMvpApp.tsx#L774-L776)

`completedToday = completedModuleKeysToday.length` zlicza **wszystkie** ukończone moduły dnia (Pamięć+Pisanie+Wymowa+Powtórki = 4), a UI sztywno dopisuje „/2”. Wynik „Dzisiaj 4/2” jest bez sensu. Dwa różne cele („2 moduły dla streaka” vs „3 moduły, by ukończyć lekcję” — [EnglishMvpApp.tsx:1259](src/components/EnglishMvpApp.tsx#L1259)) dodatkowo mylą.

### S5. `completedToday` nie zeruje się na nowy dzień
Plik: [learning.ts:382-396](src/lib/learning.ts#L382-L396)

`normalizeProgress` zeruje `completedModuleKeysToday`, ale **nie** `completedToday`. Po otwarciu aplikacji następnego dnia (przed pierwszym ukończonym modułem) Panel pokazuje wczorajszą liczbę „Dzisiaj X/2”. Samo się naprawia dopiero po pierwszym ukończeniu.

### S6. Przycisk „Posłuchaj” zdradza odpowiedź w kierunku PL → EN
Pliki: [EnglishMvpApp.tsx:968-974](src/components/EnglishMvpApp.tsx#L968-L974), [EnglishMvpApp.tsx:416-426](src/components/EnglishMvpApp.tsx#L416-L426)

Głośnik zawsze wymawia `item.word.word` (angielskie słowo). W ćwiczeniu PL → EN (prompt to polskie słowo, dziecko ma wpisać angielskie) naciśnięcie głośnika **podaje poprawną odpowiedź na głos** przed wpisaniem. Sabotuje ćwiczenie aktywnego przypominania.

### S7. Sprawdzarka odpowiedzi nie rozumie „lub” / „albo”
Pliki: [learning.ts:82-91](src/lib/learning.ts#L82-L91), dane w [seed.ts](src/lib/seed.ts)

`isAnswerCorrect` dzieli oczekiwaną odpowiedź po `, ; /`, ale **nie** po polskich „lub”/„albo”. Tymczasem dane zawierają mnóstwo wpisów typu:
- `rent → czynsz lub wynajmować`
- `taste → smak lub smakować`
- `defeat → porażka lub pokonać`
- `get on → wsiąść albo dogadywać się`

Żeby zaliczyć EN → PL, dziecko musi wpisać **całą frazę** „czynsz lub wynajmować”. Wpisanie poprawnego „czynsz” jest oznaczane jako błąd (a `mistakes` rośnie na zawsze — patrz K2). To realnie psuje cały kierunek EN → PL i „Pisanie po polsku”.

### S8. Etykieta „20 kroków” dla modułu Wymowa jest błędna
Plik: [EnglishMvpApp.tsx:887](src/components/EnglishMvpApp.tsx#L887)

Pamięć i Pisanie mają 20 kart (10 słów × 2 kierunki), ale Wymowa ma 10 kart. Ekran szczegółów modułu pokazuje sztywno „20 kroków” także dla Wymowy.

### S9. „Kierunek ćwiczenia” to atrapa
Plik: [EnglishMvpApp.tsx:857-870](src/components/EnglishMvpApp.tsx#L857-L870)

Przełącznik „PL → EN / EN → PL” wygląda jak interaktywny segment, ale to dwa statyczne `<div>`. Nic nie przełącza — kolejka i tak zawsze łączy oba kierunki. Mylące UI.

### S10. Odmowa dostępu do mikrofonu = cicha awaria
Plik: [EnglishMvpApp.tsx:428-461](src/components/EnglishMvpApp.tsx#L428-L461)

`await navigator.mediaDevices.getUserMedia(...)` nie jest w `try/catch`. Gdy użytkownik odmówi mikrofonu (lub brak HTTPS), funkcja rzuca, `setRecording(true)` nie wykonuje się, **żaden komunikat się nie pokazuje**. Dziecko klika „Nagraj” i nic się nie dzieje.

### S11. Brak walidacji odpowiedzi API wymowy
Plik: [EnglishMvpApp.tsx:521](src/components/EnglishMvpApp.tsx#L521)

`const assessment = (await response.json()) as AssessmentDraft;` — bez sprawdzenia `response.ok` ani kształtu. Gdy API zwróci błąd (np. 400 `{error}`), zostanie zrzutowane na ocenę i policzone jako `NaN%`.

### S12. Ujawnienie poprawnej odpowiedzi pozwala „wyzerować” błąd
Plik: [EnglishMvpApp.tsx:323-347](src/components/EnglishMvpApp.tsx#L323-L347)

Po błędnej odpowiedzi UI pokazuje poprawną („Poprawna odpowiedź: X”) i pozwala kliknąć „Sprawdź” ponownie, nadpisując wpis na poprawny. Łatwo oszukać statystyki; realne „mistakes” są zaniżone (a jednocześnie raz zapisany błąd jest wieczny — niespójność z K2).

### S13. Daty liczone w UTC (`toISOString`)
Plik: [learning.ts:64-70](src/lib/learning.ts#L64-L70)

`todayKey`/`monthKey` biorą datę w UTC. W Polsce (UTC+1/+2) granica „dnia” wypada o 01:00–02:00 lokalnie. Nauka tuż po północy potrafi liczyć się jako poprzedni dzień → niesprawiedliwy streak.

---

## 4. Rzeczy „bez sensu” / nielogiczne dla użytkownika

1. **Testowanie bez uczenia.** Pierwsza karta nowej lekcji to PL → EN — dziecko ma wyprodukować angielskie słowo, którego nigdy nie widziało. Brak etapu „poznaj słowo” (mimo że typ `intro` istnieje w kodzie, ale jest nieużywany — [learning.ts:327-328](src/lib/learning.ts#L327-L328)). Jedyny sposób „nauki” to pomylić się i zobaczyć odpowiedź. To uczy przez karę, nie przez ekspozycję.
2. **Fałszywy procent wymowy** (K1) — liczba, która nic nie znaczy, ale wygląda autorytatywnie.
3. **„Powtórki” pogarszają się od ćwiczenia** (K2/S1) — sprzeczność z intuicją postępu.
4. **Bogate dane słów są niewidoczne.** `ipa` (zawsze puste), `example` i `collocations` (auto-generowane wypełniacze typu „I want to use ‘routine’ correctly when I talk about home.”), `partOfSpeech`, `tags` — **nic z tego nie jest pokazywane** uczniowi ([seed.ts:608-643](src/lib/seed.ts#L608-L643)). Dużo danych bez wartości dla użytkownika.
5. **Scheduling powtórek (SRS) jest liczony, ale nieużywany.** `nextReviewAt` i `dueCount` są wyliczane ([learning.ts:160-161](src/lib/learning.ts#L160-L161), [learning.ts:358](src/lib/learning.ts#L358)), ale `dueCount` nigdzie się nie wyświetla, a moduł Powtórki bierze „słabe”, nie „zaplanowane na dziś”. Aplikacja **udaje** spaced repetition, którego nie realizuje.
6. **Limit sekund wymowy ~250 min/mies.** ([EnglishMvpApp.tsx:100-102](src/components/EnglishMvpApp.tsx#L100-L102)) — przy maks. 8 s/słowo to ~1875 słów, więc realnie nieosiągalny. Cała maszyneria limitu i miesięcznego licznika to przerost na potrzeby jednego dziecka.
7. **Zakładka „Admin” na głównym pasku ucznia** ([EnglishMvpApp.tsx:156-161](src/components/EnglishMvpApp.tsx#L156-L161)) — dziecko ma stały dostęp do importu CSV i analityki „Uczeń: Maja”. Narzędzia rodzica/nauczyciela wmieszane w UI ucznia, bez żadnej bariery.
8. **„Panel” i „Moduły” to w dużej części to samo** — oba listują 4 moduły. Przycisk „Kontynuuj” na Panelu nie „kontynuuje” sesji, tylko przenosi na listę Modułów ([EnglishMvpApp.tsx:622](src/components/EnglishMvpApp.tsx#L622)). Nadmiarowa nawigacja i myląca etykieta.
9. **Karta Powtórek mówi „10 słów do powtórki”, gdy słabych jest 0** ([EnglishMvpApp.tsx:748](src/components/EnglishMvpApp.tsx#L748)) — `weakCount || 10` pokazuje 10, choć nie ma żadnego słowa do powtórki; a moduł wtedy i tak ćwiczy lekcję 1 ([EnglishMvpApp.tsx:1508](src/components/EnglishMvpApp.tsx#L1508)).

---

## 5. Martwy kod i stan do usunięcia

| Element | Lokalizacja | Uwaga |
|---|---|---|
| `buildLessonQueue`, `buildReviewQueue` | [learning.ts:107-143](src/lib/learning.ts#L107-L143) | Druga, równoległa implementacja kolejek. UI używa własnych `buildModuleQueue`/`reviewWords`. Nieużywane. |
| `completeLesson` | [learning.ts:277-291](src/lib/learning.ts#L277-L291) | Nieużywane; ma własną, inną (buggy) logikę streaka. |
| Typy ćwiczeń `intro`, `spelling`, `dictation`, `sentence` | [types.ts:9-18](src/lib/types.ts#L9-L18) | Nieosiągalne w UI. `promptForExercise` ma dla nich martwe gałęzie ([learning.ts:325-346](src/lib/learning.ts#L325-L346)). |
| Umiejętności `listening`, `usage` | [types.ts:1-7](src/lib/types.ts#L1-L7), [learning.ts:300-307](src/lib/learning.ts#L300-L307) | Nigdy nie aktualizowane; zaniżają średnią (K3). |
| `StatSummary.listening`, `StatSummary.dueCount` | [types.ts:137-144](src/lib/types.ts#L137-L144) | Liczone, nigdzie nie wyświetlane. |
| `activeLessonId` | [types.ts:119](src/lib/types.ts#L119) | Zapisywane, nieczytane do wyboru lekcji (K4). |
| Pola `WordEntry`: `ipa`, `example`, `collocations`, `tags`, `partOfSpeech` | [seed.ts:624-643](src/lib/seed.ts#L624-L643) | Generowane/puste i niewyświetlane. |
| Niespójność źródeł: `sourceNotes` (3) vs `sourceUrlByName` (6) | [seed.ts:11-27](src/lib/seed.ts#L11-L27), [seed.ts:592-599](src/lib/seed.ts#L592-L599) | Atrybucja pokazuje 3 z 6 źródeł. |

**Wniosek:** istnieją dwie warstwy logiki (jedna w `learning.ts`, druga zaszyta w komponencie). To główne źródło rozjazdów (S1, S2). Warto wybrać **jedną** i usunąć drugą.

---

## 6. Braki funkcjonalne (czego brakuje)

1. **Etap nauki nowego słowa** (flashcard/„poznaj słowo” z tłumaczeniem, przykładem, IPA, audio) przed odpytywaniem. Dziś dane na to są, ale ekranu nie ma.
2. **Realna ocena wymowy** lub uczciwy self-check zamiast wymyślonego procentu (K1).
3. **Działający system powtórek oparty o `nextReviewAt`** (spaced repetition), z regeneracją „słabych” (K2) i licznikiem „do powtórki dziś”.
4. **Wybór lekcji / przeglądarka 79 lekcji** — dziś przejście jest wymuszone liniowo (Daily routine → Home → …), nie można wrócić do konkretnego tematu (powiązane z K4).
5. **Ekran szczegółów słowa** wykorzystujący już istniejące dane (przykład, kolokacje, część mowy, IPA).
6. **Ustawienia:** reset/eksport postępu, wybór głosu lektora, cel dzienny, wyciszenie audio. Dziś jedyny „reset” ([reset-sw](src/app/reset-sw/page.tsx)) czyści **cache PWA**, a nie postęp nauki.
7. **Enter = zatwierdź.** Pole odpowiedzi to wieloliniowy `<textarea>` ([EnglishMvpApp.tsx:984-989](src/components/EnglishMvpApp.tsx#L984-L989)) — Enter robi nową linię zamiast sprawdzać. Uciążliwe, zwłaszcza na telefonie.
8. **Akceptacja synonimów PL** (rozbijanie „lub/albo”) — patrz S7.
9. **Działanie offline** — patrz sekcja PWA (P1); mimo deklaracji „PWA offline” aplikacja offline się nie ładuje.
10. **Obsługa błędów / komunikaty:** brak `ErrorBoundary`, brak informacji o stanie sieci, cicha awaria mikrofonu (S10).
11. **Testy** — brak jakichkolwiek testów logiki nauki (oceny, streak, powtórki). Dla aplikacji trzymającej miesiące postępów dziecka to istotny brak.

---

## 7. Funkcjonalności do usunięcia lub uproszczenia

- **Fałszywa ocena „demo”** wymowy (K1) — usunąć albo zastąpić uczciwym self-check.
- **Limit sekund wymowy + miesięczny licznik** (`monthlyPronunciationSeconds`, `pronunciationMonthlyLimitSeconds`) — przerost; usunąć lub mocno uprościć.
- **Atrapowy przełącznik kierunku** (S9) — albo zrobić działającym, albo usunąć.
- **Zakładka „Admin” z paska ucznia** — przenieść za prosty PIN/długie przyciśnięcie lub osobną ścieżkę.
- **Redundancja „Panel” vs „Moduły”** — scalić; „Kontynuuj” powinno realnie wznawiać naukę aktywnej lekcji.
- **Martwy kod** z sekcji 5 — usunąć w całości.
- **Nieużywane pola `WordEntry`** — albo zacząć je pokazywać (ekran słowa), albo usunąć z modelu i generatora.

---

## 8. Jakość treści i język

- **Polszczyzna bez znaków diakrytycznych** w całym UI i danych („Pamiec”, „Cwicz wymowe”, „postepy”, „przygotowac”). Dla polskiego dziecka jako odbiorcy docelowego wygląda to nieprofesjonalnie. Sprawdzarka i tak normalizuje diakrytyki ([learning.ts:72-80](src/lib/learning.ts#L72-L80)), więc **wpisywanie** „wyzdrowieć” = „wyzdrowiec”, ale **wyświetlanie** powinno być poprawne.
- **Niespójność:** większość tłumaczeń bez diakrytyków, ale pojedyncze mają (np. `view → pogląd` z „ą” w [seed.ts:182](src/lib/seed.ts#L182)).
- **Wpisy „X lub Y”** w danych psują sprawdzarkę (S7) — to jednocześnie problem treści i logiki.
- **Treść merytoryczna jest mocna** (NGSL/NAWL/B2 First/idiomy/false friends) — baza ~790 haseł to realna wartość. Problem nie w doborze słów, tylko w warstwie sprawdzania i prezentacji.

---

## 9. PWA, wydajność, bezpieczeństwo

### P1. Offline realnie nie działa 🔴
Plik: [public/sw.js:50-53](public/sw.js#L50-L53)

Service Worker cache’uje tylko „powłokę” (HTML „/”, ikony). Dla `/_next/` robi network-first, ale **nie zapisuje** chunków do cache (`fetch(request).catch(() => caches.match(request))` — `caches.match` prawie zawsze chybi, bo nic tam nie trafia). Offline pliki JS się nie załadują → biały ekran. Dodatkowo zcache’owany HTML „/” odwołuje się do zahashowanych chunków, których w cache nie ma. Główna obietnica „PWA do nauki offline” nie jest spełniona. Istnienie strony [/reset-sw](src/app/reset-sw/page.tsx) to plaster na problemy z tym cache’owaniem.

### P2. `maximumScale: 1` blokuje powiększanie 🟡
Plik: [layout.tsx:36-42](src/app/layout.tsx#L36-L42)

Wyłączenie pinch-zoom to problem dostępności (WCAG). Dla dziecka uczącego się czytać — szczególnie.

### P3. Endpoint wymowy bez ochrony 🟡
Plik: [route.ts:18-39](src/app/api/pronunciation/assess/route.ts#L18-L39)

Brak auth, rate-limitu i sprawdzenia originu. Przy publicznym wdrożeniu każdy może wołać `/api/pronunciation/assess` i palić limit Azure (gdyby był podłączony). Dla użytku prywatnego mało istotne, dla publicznego — realne.

### P4. Redundantny zapis przy starcie 🟢
Plik: [EnglishMvpApp.tsx:244-253](src/components/EnglishMvpApp.tsx#L244-L253)

Na normalnej ścieżce ładowania `skipNextSaveRef` jest `false`, więc tuż po wczytaniu następuje zapis tego, co właśnie wczytano. Drobny, ale zbędny zapis na każdym uruchomieniu.

---

## 10. Priorytetyzacja (co naprawić najpierw)

| # | Problem | Waga | Wysiłek | Priorytet |
|---|---|---|---|---|
| K5 | Ryzyko utraty postępu (tryb awaryjny) | Krytyczna | Niski | **1** |
| K1 | Fałszywa ocena wymowy | Krytyczna | Śr. | **2** |
| K2 | „Słabe słowa” nie zdrowieją | Krytyczna | Śr. | **3** |
| S7 | Sprawdzarka nie rozumie „lub/albo” | Wysoka | Niski | **4** |
| K3 | Martwe skille zaniżają średnią | Wysoka | Niski | **5** |
| „bez sensu” #1 | Brak etapu nauki słowa | Wysoka | Śr./Wys. | **6** |
| K4 | Import lekcji nie przełącza | Wysoka | Niski | **7** |
| P1 | Offline nie działa | Wysoka | Śr. | **8** |
| S6 | Głośnik zdradza odpowiedź (PL→EN) | Średnia | Niski | 9 |
| S10/S11 | Cicha awaria mikrofonu / brak walidacji API | Średnia | Niski | 10 |
| S1/S2/S4/S5 | Niespójne liczniki i procenty | Średnia | Niski | 11 |
| Sek. 5 | Usunięcie martwego kodu | Średnia | Niski | 12 |
| S3/S9/„bez sensu” #7 | Atrapy i zaliczanie 0% | Niska/Śr. | Niski | 13 |
| Język/diakrytyki | Polszczyzna bez znaków | Niska | Śr. | 14 |

---

## 11. Szybkie wygrane (małe zmiany, duży efekt)

1. **Zabezpieczyć zapis** w trybie awaryjnym — nie nadpisywać IndexedDB, dopóki nie potwierdzono realnej awarii odczytu (K5).
2. **Rozbijać „lub”/„albo”** w `isAnswerCorrect` — natychmiast odblokuje kierunek EN → PL (S7).
3. **Liczyć średnią tylko z ćwiczonych umiejętności** (K3) — jedna zmiana w `averageScore`/`summarizeProgress`.
4. **Ujednolicić wzór „Powtórek”** (×5 vs ×4) i definicję „słabych” (S1, S2).
5. **Nie wymawiać angielskiego słowa w PL → EN** (S6) — warunek na `directionForItem(item)`.
6. **`try/catch` wokół `getUserMedia` + sprawdzanie `response.ok`** (S10, S11).
7. **Poprawić „20 kroków”** na liczbę realną z `session.queue.length` (S8).
8. **Ukryć zakładkę Admin** z paska ucznia (sek. 4 #7).
9. **Usunąć martwy kod** z sekcji 5 — mniej rozjazdów, czytelniejszy projekt.

---

## 12. Wniosek

Fundamenty są dobre: estetyczny, mobilny interfejs, solidna baza ~790 słów z wiarygodnych źródeł, offline-first w założeniu. Problem leży w **rdzeniu dydaktycznym i trwałości danych**: ocena wymowy jest pozorowana, system powtórek degeneruje się zamiast pomagać, brakuje etapu nauki słowa, a w skrajnym przypadku można stracić cały postęp. Do tego sporo równoległego, rozjeżdżającego się kodu.

Rekomendowana kolejność: **najpierw zabezpieczyć dane (K5), potem naprawić rdzeń oceny i powtórek (K1–K3, S7), następnie dodać brakujący etap nauki słowa i uporządkować kod**. Po tych zmianach aplikacja przejdzie z „ładnie wyglądającego MVP” w „realnie uczące narzędzie”.

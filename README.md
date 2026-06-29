# English MVP

Next.js PWA for daily English vocabulary learning on iOS.

## What Is Implemented

- Student dashboard with separate modules: Memory, Writing, Pronunciation and Reviews.
- Drill-down navigation: Main panel -> Module -> Exercise -> Module result.
- Memory and Writing modules always include both directions: PL -> EN and EN -> PL.
- Progress is buffered during a module and saved only after the module is completed.
- Back from an exercise returns to the main panel and discards the unfinished module session.
- Streak is awarded only after completing 2 modules in one day.
- Full exercise coverage: EN -> PL, PL -> EN, spelling, listening support, pronunciation recording and pronunciation assessment.
- Pronunciation recording in the browser with an Azure Speech assessment endpoint.
- Safe pronunciation fallback when Azure keys are missing.
- Offline-first student progress stored in IndexedDB.
- Admin dashboard with student progress, weak words, common errors and CSV lesson import.
- 80 seed lessons x 10 items based on NGSL/NAWL/B2 First/C1/repair-topic structure.
- PWA manifest, service worker and iOS app icons.

## Run Locally

```bash
npm install
npm run dev -- --port 3000
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
```

## Azure Speech

Automatic pronunciation assessment uses Azure only when these variables are set:

```bash
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=...
NEXT_PUBLIC_PRONUNCIATION_MONTHLY_SECONDS_LIMIT=15000
```

Without Azure keys, the app returns a deterministic demo assessment so the MVP flow remains usable. The UI still records audio locally and lets the student compare their recording with the model audio.

## CSV Import

Required columns:

```csv
course,unit,lesson,word,translation_pl,part_of_speech,cefr,example,collocations,ipa,tags,source
```

The MVP imports the first 10 valid rows as one lesson.

## Sources

- NGSL 1.2: https://www.newgeneralservicelist.com/new-general-service-list
- NAWL 1.2: https://www.newgeneralservicelist.com/new-academic-word-list
- Cambridge English Profile: https://englishprofile.org/?menu=evp-online
- B2 First handbook: https://www.cambridgeenglish.org/Images/167791-b2-first-handbook.pdf
- In the Loop idioms: https://americanenglish.state.gov/resources/loop

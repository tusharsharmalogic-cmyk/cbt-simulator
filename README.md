# JEE Main CBT Simulator

A fully offline, single-file **Computer-Based Test (CBT) simulator** for JEE Main practice. Runs entirely in the browser — no server, no login, no internet needed after first load.

Built as a **10,000+ line single HTML file** with vanilla JavaScript — no build step, no framework, no npm.

---

## Features

### Test interface

- Three subject tabs — Physics, Maths, Chemistry (configurable)
- Full CBT layout — question view on left, color-coded question palette on right
- MCQ questions — select/deselect options, keyboard and touch friendly
- Numeric questions — on-screen keypad with decimal, minus, backspace
- Mark for Review — flag any question for later review
- Prev / Next navigation — or jump anywhere via the palette
- Question palette color states — answered, unanswered, marked, visited, not-visited (classic JEE/NTA palette)
- Fullscreen image overlay — tap any question image to zoom to fullscreen
- Timer — overall countdown plus optional per-subject timer
- Auto-advance — optionally jump to next question after answering
- Behaviour tracker — tracks time spent per question, answer changes, question switching (toggleable)

### Question sources — 3 input modes

1. **JSON / TXT questions** — structured question files with MathJax rendering (formulas, equations, symbols render beautifully)
2. **Image files** — upload photos/screenshots of questions, one per question (Physics / Maths / Chemistry separately)
3. **Folder batch system** — the killer feature: add multiple folders, each containing numbered question images plus an `ans.txt` answer key. Filename `12.jpg` automatically maps to the 12th answer. Mix multiple folders in one test.

### Answer key support

- TXT answer key files — one answer per line, supports ranges (`1-10.txt`, `11-25.txt`)
- Answer key images — for photographed answer keys
- Filename-based auto-mapping — `q12.jpg` maps to 12th answer
- Auto-detect question type — MCQ vs numeric per question, or forced by filename pattern

### Results and analysis

- Detailed result table — per-question status, your answer, correct answer, time spent, image reference
- Summary stats — score, accuracy, attempted, unattempted, time used
- Result graph — per-subject breakdown chart (canvas-drawn)
- Behaviour table — time per question, answer changes, review-flagged questions
- Wrong images tracker — highlights exactly which question images you got wrong (great for revision)
- Notes per test — attach personal notes to any test result
- PDF export — full analysis as PDF (jsPDF)
- DOCX export — full analysis as editable document

### Test history and analytics

- Local history — every submitted test saved to `localStorage`
- History view — browse, view details, delete, clear all
- History import/export — JSON export and merge-import (backup / transfer between devices)
- Test comparison — pick any two historical tests and compare side-by-side
- Trend graph — score/accuracy trend across last 10 tests
- Analytics view — combined subject-wise trends
- Full history PDF — download all tests as one PDF report

### Auto-save and resume

- Every answer, mark, and timer state auto-saved to `localStorage`
- Resume banner on reload — pick up exactly where you left off
- Image re-select dialog — if browser cannot re-access uploaded images, prompts you to re-upload them
- Discard resume — start fresh if you want

### UX

- Dark mode — light/dark toggle, persisted
- Mobile-first — works great on phones (built for Termux-on-Android workflows)
- Drag-and-drop upload zone
- MathJax rendering for JSON questions
- Fully offline — MathJax loaded from IndexedDB cache, jsPDF bundled locally

---

## How it works (folder batch system)

The clever part: prepare your question bank as folders of numbered images and answer key files.

Example folder layout on your device:

    Physics/
      1.jpg
      2.jpg
      3.jpg
      ...
      ans.txt       one answer per line
    Maths/
      1.jpg
      2.jpg
      ...
      ans.txt
    Chemistry/
      1.jpg
      ...
      ans.txt

Then in the app:

1. Login screen — click "Add Folder" for each subject
2. Select the question images for that folder
3. Select that folder's `ans.txt`
4. Click "Add Batch"
5. Repeat for other subjects
6. Click Start Test

The app matches `1.jpg` to 1st answer, `12.jpg` to 12th answer, automatically. No toggles, no manual mapping.

You can also do standalone images (no folder batching) if you prefer one-off tests.

---

## JSON question format

If you prefer text-based questions with MathJax formulas:

    [
      {
        "type": "mcq",
        "question": "What is integral of x squared from 0 to 1?",
        "options": ["1/2", "1/3", "1/4", "1/5"],
        "answer": "B"
      },
      {
        "type": "numeric",
        "question": "Find the value of square root of 144.",
        "answer": "12"
      }
    ]

Drop it as a `.json` file — questions render with MathJax, correct answers auto-detect.

---

## Getting Started

### Run locally

Since it is a single HTML file:

    # Any static server
    python -m http.server 8080

    # Or just open the file
    xdg-open imu.html      # Linux
    termux-open imu.html   # Termux (Android)

> Note: `file://` works for most features, but MathJax loading and jsPDF may need a local server. For full functionality, use `python -m http.server 8080` and open `http://localhost:8080/imu.html`.

### First test in 60 seconds

1. Open the app
2. Enter any name (or leave blank)
3. Upload a few question images (or a JSON file)
4. Upload or type the answer key
5. Set time limit
6. Start Test
7. Submit — see results, analysis, graphs, PDF export

---

## Project Structure

    cbt-simulator/
    ├── imu.html              Main app — 10,296 lines, fully self-contained
    ├── jspdf.umd.min.js      jsPDF — PDF export
    ├── tex-svg.js            MathJax 3 SVG renderer
    └── README.md             This file

Every file except the two libraries is in `imu.html` — CSS, HTML, JS, and all app logic. Deliberate design choice: **one file to copy, one file to run**. Trivially portable to any device.

Inside `imu.html` there's a **master file map at the top** (lines 1–270) listing every CSS section, HTML section, and JS function with line numbers. If you're editing or extending the app, start there.

---

## Editing the app

The file starts with a MASTER FILE MAP comment showing exactly which line each function lives on:

- CSS sections — lines ~8 to ~2060
- HTML sections — lines ~2065 to ~3010
- JS functions — lines ~3115 onwards

Common edits and where to find them (from the built-in map):

| I want to...                | Go to line |
|-----------------------------|------------|
| Change CSS colors           | ~8         |
| Add a login-screen toggle   | ~2406      |
| Change question navigation  | ~5834      |
| Change option select logic  | ~6371      |
| Add a results column        | ~7017      |
| Change timer logic          | ~6667      |
| Add a result button         | ~2832      |
| Modify history              | ~3843      |

The master map also documents the function call graph so you can navigate 10,000 lines easily.

---

## Storage and privacy

- All test data lives in your browser — `localStorage` for history, answers, draft test state
- `IndexedDB` used for MathJax caching (offline rendering)
- No uploads to any server — fully client-side
- No telemetry, no analytics, no accounts
- Exported PDFs / history JSONs stay on your device

Safe to use on shared devices (each browser profile has isolated data).

---

## Tech Stack

- Vanilla HTML + CSS + JavaScript — no framework, no build
- MathJax 3 (tex-svg) — LaTeX rendering for JSON questions
- jsPDF — PDF export
- Canvas API — custom graphs (trend, comparison, per-subject breakdown)
- localStorage + IndexedDB — persistence
- FileReader API + drag-and-drop — image / file upload

---

## Credits

Made by [@tusharsharmalogic-cmyk](https://github.com/tusharsharmalogic-cmyk)

Other projects:
- [COREX](https://github.com/tusharsharmalogic-cmyk/COREX) — 2D Phaser game
- [my-journal](https://github.com/tusharsharmalogic-cmyk/my-journal) — Self-hosted journaling app
- [termuxBR](https://github.com/tusharsharmalogic-cmyk/termuxBR) — Termux storage manager
- [ytdl](https://github.com/tusharsharmalogic-cmyk/ytdl) — YouTube downloader
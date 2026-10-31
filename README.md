# JEE Main CBT Simulator

A modular, offline-ready **JEE Main Computer Based Test (CBT) Simulator** featuring multi-question image support, JSON/TXT question rendering with MathJax, automated answer-key matching, behavioral analytics, and PDF/DOCX report generation.

---

## Project Structure

The project is organized into modular HTML, CSS, and JavaScript files served via a lightweight Flask server:

    cbt-simulator-repo/
    ├── index.html                  # Main application entry point
    ├── server.py                   # Local Flask server script
    ├── jspdf.umd.min.js            # Offline PDF generation library
    ├── tex-svg.js                  # Offline MathJax SVG renderer
    ├── css/
    │   ├── base-login.css          # Theme variables, reset & login screen styles
    │   ├── test-interface.css      # CBT header, question area, options, keypad & palette
    │   ├── modals-results-history.css # Submission, results, graphs & history modals
    │   └── responsive-autosave.css # Mobile responsiveness & auto-save toast/dialogs
    └── js/
        ├── state.js                # Global state variables & subject memory
        ├── mathjax-config.js       # MathJax configuration & safe typesetting
        ├── init-theme.js           # Dark/Light mode & fullscreen image viewer
        ├── setup-uploads.js        # Event listeners, drag-drop, image & TXT answer loading
        ├── folder-batch.js         # Multi-folder batch management & filename mapping
        ├── json-questions.js       # JSON/TXT question mode & notes handling
        ├── navigation-Engine.js    # Question navigation, option selection & palette updates
        ├── timer.js                # Full-test & subject-wise countdown timers
        ├── results.js              # Score calculation, behavioral tracker & detailed tables
        ├── graphs.js               # Canvas analytics, trend charts & wrong-image tracker
        ├── history.js              # LocalStorage test history, import/export & comparison
        ├── autosave-resume.js      # Auto-save engine & incomplete test resume workflow
        ├── settings.js             # UI toggles & helper utilities
        └── export-reports.js       # Detailed PDF & DOCX analysis report exporters

---

## Key Features

- **Multi-Mode Question Support:** Load questions via image folders (.jpg, .png, etc.) or structured .json / .txt files with full LaTeX/MathJax rendering.
- **Smart Answer Keys:** Supports manual post-test entry, answer key images, .txt string keys, filename-based answer mapping, and multi-folder batch keys.
- **Realistic CBT Interface:** Subject tabs (Physics, Mathematics, Chemistry), color-coded question palette, Mark for Review, MCQ selection, and an on-screen numeric keypad for integer-type questions.
- **Flexible Timers:** Standard 180-minute full test timer or customizable **Subject-wise Timer** with automatic subject locking.
- **Auto-Save & Resume:** Automatically saves test progress in localStorage so interrupted sessions can be resumed seamlessly.
- **Deep Analytics & Behaviour Tracker:** Tracks time spent per question, answer changes, visit counts, subject-wise accuracy, and interactive performance graphs.
- **Offline Export:** Download complete test analysis and historical trends as **PDF** or **DOCX** reports.
- **Dark Mode:** Built-in dark/light theme toggle for comfortable long practice sessions.

---

## Getting Started (Termux / Python)

### 1. Prerequisites
Make sure Python 3 and Flask are installed:

    pip install flask

### 2. Run the Server
Start the server on the default port (8080):

    python /sdcard/cbt-simulator-repo/server.py

Or specify a custom port (e.g., 3000):

    python /sdcard/cbt-simulator-repo/server.py 3000

### 3. Open in Browser
Navigate to:

    http://localhost:8080/
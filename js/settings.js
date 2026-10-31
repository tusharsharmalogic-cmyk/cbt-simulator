// Extracted from imu.html lines 9067-9155
       // ===== PERSISTENT LOGIN SETTINGS =====
const SETTINGS_KEY = 'jeeSettings';

// Gather all settings from login form
function gatherSettings() {
    return {
        userName: document.getElementById('user-name').value,
        testName: document.getElementById('test-name').value,
        physicsCount: document.getElementById('physics-count').value,
        mathsCount: document.getElementById('maths-count').value,
        chemistryCount: document.getElementById('chemistry-count').value,
        testTime: document.getElementById('test-time').value,
        autoAdvance: document.getElementById('auto-advance-toggle').checked,
        filenameAns: document.getElementById('filename-ans-toggle').checked,
        subjectTimer: document.getElementById('subject-timer-toggle').checked,
        physicsTime: document.getElementById('physics-time').value,
        mathsTime: document.getElementById('maths-time').value,
        chemistryTime: document.getElementById('chemistry-time').value,
        jsonMode: document.getElementById('json-mode-toggle').checked,
    };
}

// Apply settings to form
function applySettings(settings) {
    if (!settings) return;
    document.getElementById('user-name').value = settings.userName || '';
    document.getElementById('test-name').value = settings.testName || '';
    document.getElementById('physics-count').value = settings.physicsCount || 10;
    document.getElementById('maths-count').value = settings.mathsCount || 10;
    document.getElementById('chemistry-count').value = settings.chemistryCount || 10;
    document.getElementById('test-time').value = settings.testTime || 180;
    document.getElementById('auto-advance-toggle').checked = !!settings.autoAdvance;
    document.getElementById('filename-ans-toggle').checked = !!settings.filenameAns;
    document.getElementById('subject-timer-toggle').checked = !!settings.subjectTimer;
    document.getElementById('physics-time').value = settings.physicsTime ?? 60;
    document.getElementById('maths-time').value = settings.mathsTime ?? 60;
    document.getElementById('chemistry-time').value = settings.chemistryTime ?? 60;
    document.getElementById('json-mode-toggle').checked = !!settings.jsonMode;

    // Update dependent UI
    if (typeof toggleSubjectTimerUI === 'function') toggleSubjectTimerUI();
    if (typeof toggleJsonMode === 'function') toggleJsonMode();
}

// Save settings on any change
function saveSettings() {
    const settings = gatherSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Attach listeners to all inputs
function attachSettingsListeners() {
    const inputs = [
        'user-name', 'test-name',
        'physics-count', 'maths-count', 'chemistry-count',
        'test-time',
        'auto-advance-toggle', 'filename-ans-toggle', 'subject-timer-toggle',
        'physics-time', 'maths-time', 'chemistry-time',
        'json-mode-toggle'
    ];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', saveSettings);
            el.addEventListener('change', saveSettings);
        }
    });
}

// Load settings on page start
function loadSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            applySettings(settings);
        } catch (e) {}
    }
}

// Pehle se maujood DOMContentLoaded ke andar yeh line add karo
// Agar DOMContentLoaded already hai toh uske andar loadSettings() aur attachSettingsListeners() call karo
// Lekin agar nahi hai toh neeche wala code use karo:

document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    attachSettingsListeners();
});



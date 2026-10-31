// Extracted from imu.html lines 9156-10271
// ===== MATHJAX LOCAL LOADER (offline support) =====
const MATHJAX_DB = 'jeeSimulatorLibs';
const MATHJAX_STORE = 'scripts';
const MATHJAX_KEY = 'tex-svg-mathjax.js';

function openMathJaxDB() {
    return new Promise((res, rej) => {
        const req = indexedDB.open(MATHJAX_DB, 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore(MATHJAX_STORE);
        req.onsuccess = e => res(e.target.result);
        req.onerror   = e => rej(e.target.error);
    });
}

async function saveMathJaxToIDB(text) {
    const db = await openMathJaxDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(MATHJAX_STORE, 'readwrite');
        tx.objectStore(MATHJAX_STORE).put(text, MATHJAX_KEY);
        tx.oncomplete = res;
        tx.onerror = e => rej(e.target.error);
    });
}

async function loadMathJaxFromIDB() {
    const db = await openMathJaxDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(MATHJAX_STORE, 'readonly');
        const req = tx.objectStore(MATHJAX_STORE).get(MATHJAX_KEY);
        req.onsuccess = e => res(e.target.result || null);
        req.onerror   = e => rej(e.target.error);
    });
}

function injectMathJaxScript(text, force = false) {
    if (!force && document.querySelector('script[data-lib="mathjax"]')) return;
    const s = document.createElement('script');
    s.setAttribute('data-lib', 'mathjax');
    s.textContent = text;
    document.head.appendChild(s);
}

let _mathjaxLoading = false;
let _mathjaxLoaded = false;

async function loadMathJax(askOnFail = true) {
    if (_mathjaxLoaded) return true;
    if (_mathjaxLoading) {
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (_mathjaxLoaded || !_mathjaxLoading) {
                    clearInterval(interval);
                    resolve();
                }
            }, 200);
        });
        return _mathjaxLoaded;
    }
    _mathjaxLoading = true;
    try {
        // 1. Try IndexedDB
        const cached = await loadMathJaxFromIDB();
        if (cached) {
            injectMathJaxScript(cached);
            _mathjaxLoaded = true;
            console.log('MathJax loaded from IndexedDB');
            _mathjaxLoading = false;
            return true;
        }
        // 2. Try CDN
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
            s.setAttribute('data-lib', 'mathjax-cdn');
            s.onload = resolve;
            s.onerror = () => { s.remove(); reject(new Error('cdn_fail')); };
            document.head.appendChild(s);
        });
        _mathjaxLoaded = true;
        console.log('MathJax loaded from CDN');
        _mathjaxLoading = false;
        return true;
    } catch(e) {
        if (askOnFail) {
            const proceed = confirm('📴 MathJax load nahi hua! Offline mode mein "Load MathJax File" button se file select karein?');
            if (proceed) {
                try { await pickAndSaveMathJax(); await loadMathJax(false); return true; }
                catch(err) { console.error(err); alert('MathJax load failed!'); }
            }
        }
        _mathjaxLoading = false;
        return false;
    }
}

async function pickAndSaveMathJax() {
    return new Promise((res, rej) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.js';
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) { rej(new Error('No file selected')); return; }
            const text = await file.text();
            if (!text.includes('MathJax') && !text.includes('tex-svg')) {
                rej(new Error('Yeh tex-svg.js nahi lagti — sahi file choose karo'));
                return;
            }
            await saveMathJaxToIDB(text);
            injectMathJaxScript(text, true);
            _mathjaxLoaded = true;
            alert('✅ MathJax saved locally! Page reloading...');
            location.reload();
            res();
        };
        input.oncancel = () => rej(new Error('cancelled'));
        input.click();
    });
}


// ===== PDF REPORT DOWNLOAD FEATURE =====
async function downloadAnalysisPDF() {
    const btn = document.getElementById('download-pdf-btn');
    btn.textContent = '⏳ Generating PDF...';
    btn.disabled = true;

    try {
        // Load jsPDF — local file pehle, CDN fallback
        if (!window.jspdf) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf.umd.min.js');
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 14;
        const contentW = pageW - margin * 2;
        let y = 14;

        // ---- HELPER FUNCTIONS ----
        function checkPage(needed) {
            if (y + needed > pageH - 16) {
                doc.addPage();
                y = 14;
            }
        }

        function sectionTitle(text) {
            checkPage(14);
            doc.setFillColor(26, 35, 126);
            doc.rect(margin, y, contentW, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(text, margin + 3, y + 5.5);
            doc.setTextColor(30, 30, 30);
            y += 11;
        }

        function drawHLine() {
            checkPage(4);
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, y, margin + contentW, y);
            y += 3;
        }

        // ---- PAGE 1: HEADER ----
        doc.setFillColor(26, 35, 126);
        doc.rect(0, 0, pageW, 32, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('JEE Main CBT Simulator', pageW / 2, 14, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Test Analysis Report', pageW / 2, 22, { align: 'center' });
        doc.setFontSize(9);
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageW / 2, 29, { align: 'center' });

        y = 38;
        doc.setTextColor(30, 30, 30);

        // Candidate info
        const candidateName = document.getElementById('results-user-name')?.textContent || 'Student';
        const testNameVal = document.getElementById('results-test-name')?.textContent || 'Test';
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Candidate: ${candidateName}`, margin, y);
        doc.text(`Test: ${testNameVal}`, pageW - margin, y, { align: 'right' });
        y += 8;
        drawHLine();

        // ---- OVERALL STATS ----
        sectionTitle('📊 Overall Performance');
        const statsIds = [
            ['total-score', 'Total Score'],
            ['total-correct', 'Correct'],
            ['total-incorrect', 'Incorrect'],
            ['total-unattempted', 'Unattempted'],
            ['total-marked', 'Marked'],
            ['accuracy', 'Accuracy'],
            ['time-taken', 'Time Taken'],
        ];
        const cols = 4;
        const boxW = contentW / cols;
        const boxH = 18;
        statsIds.forEach(([id, label], idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            if (col === 0) checkPage(boxH + 2);
            const bx = margin + col * boxW;
            const by = y + row * (boxH + 3);
            const val = document.getElementById(id)?.textContent || '-';

            doc.setFillColor(240, 242, 255);
            doc.roundedRect(bx + 1, by, boxW - 2, boxH, 2, 2, 'F');
            doc.setDrawColor(180, 190, 230);
            doc.roundedRect(bx + 1, by, boxW - 2, boxH, 2, 2, 'S');

            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(26, 35, 126);
            doc.text(val, bx + boxW / 2, by + 9, { align: 'center' });
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(90, 90, 90);
            doc.text(label, bx + boxW / 2, by + 15, { align: 'center' });
        });
        const statRows = Math.ceil(statsIds.length / cols);
        y += statRows * (boxH + 3) + 4;
        doc.setTextColor(30, 30, 30);

        // ---- SUBJECT WISE TABLE ----
        sectionTitle('📚 Subject-wise Performance');
        const subjHeaders = ['Subject', 'Questions', 'Score', 'Correct', 'Incorrect', 'Marked', 'Accuracy'];
        const subjRows = [
            ['Physics',
             document.getElementById('physics-total')?.textContent || '0',
             document.getElementById('physics-score')?.textContent || '0',
             document.getElementById('physics-correct')?.textContent || '0',
             document.getElementById('physics-incorrect')?.textContent || '0',
             document.getElementById('physics-marked')?.textContent || '0',
             document.getElementById('physics-accuracy')?.textContent || '0%'],
            ['Mathematics',
             document.getElementById('maths-total')?.textContent || '0',
             document.getElementById('maths-score')?.textContent || '0',
             document.getElementById('maths-correct')?.textContent || '0',
             document.getElementById('maths-incorrect')?.textContent || '0',
             document.getElementById('maths-marked')?.textContent || '0',
             document.getElementById('maths-accuracy')?.textContent || '0%'],
            ['Chemistry',
             document.getElementById('chemistry-total')?.textContent || '0',
             document.getElementById('chemistry-score')?.textContent || '0',
             document.getElementById('chemistry-correct')?.textContent || '0',
             document.getElementById('chemistry-incorrect')?.textContent || '0',
             document.getElementById('chemistry-marked')?.textContent || '0',
             document.getElementById('chemistry-accuracy')?.textContent || '0%'],
        ];

        checkPage(10 + (subjRows.length + 1) * 9);
        const colWs = [32, 22, 20, 20, 22, 20, 22];
        // header
        let tx2 = margin;
        doc.setFillColor(63, 81, 181);
        doc.rect(margin, y, contentW, 8, 'F');
        subjHeaders.forEach((h, i) => {
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(h, tx2 + colWs[i] / 2, y + 5.5, { align: 'center' });
            tx2 += colWs[i];
        });
        y += 8;
        subjRows.forEach((row, ri) => {
            checkPage(9);
            doc.setFillColor(ri % 2 === 0 ? 248 : 255, ri % 2 === 0 ? 249 : 255, ri % 2 === 0 ? 255 : 255);
            doc.rect(margin, y, contentW, 8, 'F');
            let txr = margin;
            row.forEach((cell, ci) => {
                doc.setFontSize(8.5);
                doc.setFont('helvetica', ci === 0 ? 'bold' : 'normal');
                doc.setTextColor(30, 30, 30);
                doc.text(cell, txr + colWs[ci] / 2, y + 5.5, { align: 'center' });
                txr += colWs[ci];
            });
            y += 8;
        });
        y += 5;

        // ---- QUESTION-WISE TABLE ----
        sectionTitle('📋 Detailed Question-wise Analysis');
        const detTable = document.getElementById('detailed-results');
        if (detTable && detTable.rows.length > 0) {
            const detHeaders = ['Subject', 'Q.No', 'Image', 'Your Ans', 'Correct Ans', 'Status', 'Score', 'Marked'];
            const dColWs = [28, 14, 30, 20, 24, 22, 16, 18];
            checkPage(10);
            let dtx = margin;
            doc.setFillColor(63, 81, 181);
            doc.rect(margin, y, contentW, 8, 'F');
            detHeaders.forEach((h, i) => {
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(h, dtx + dColWs[i] / 2, y + 5.5, { align: 'center' });
                dtx += dColWs[i];
            });
            y += 8;

            Array.from(detTable.rows).forEach((row, ri) => {
                checkPage(7);
                const cells = Array.from(row.cells).map(c => c.textContent.trim());
                const status = cells[5] || '';
                const bg = status === 'Correct' ? [232, 245, 232] : status === 'Incorrect' ? [255, 235, 235] : [ri%2===0?248:255, ri%2===0?248:255, ri%2===0?248:255];
                doc.setFillColor(...bg);
                doc.rect(margin, y, contentW, 7, 'F');
                let drx = margin;
                cells.forEach((cell, ci) => {
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(30, 30, 30);
                    const txt = cell.length > 16 ? cell.substring(0, 15) + '…' : cell;
                    doc.text(txt, drx + dColWs[ci] / 2, y + 4.8, { align: 'center' });
                    drx += dColWs[ci];
                });
                y += 7;
            });
        } else {
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('No detailed data available.', margin + 5, y + 5);
            y += 10;
        }
        y += 6;

        // ---- TIME SPENT TABLE ----
        sectionTitle('⏱️ Time Spent per Question');
        const timeTable = document.getElementById('time-spent-results');
        if (timeTable && timeTable.rows.length > 0) {
            const tHeaders = ['Q.No', 'Subject', 'Time Spent', 'Status'];
            const tColWs = [20, 50, 40, 42]; // fits ~152mm (< contentW ~182)
            const tTotalW = tColWs.reduce((a,b)=>a+b,0);
            checkPage(10);
            let ttx = margin;
            doc.setFillColor(63, 81, 181);
            doc.rect(margin, y, tTotalW, 8, 'F');
            tHeaders.forEach((h, i) => {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(h, ttx + tColWs[i] / 2, y + 5.5, { align: 'center' });
                ttx += tColWs[i];
            });
            y += 8;
            Array.from(timeTable.rows).forEach((row, ri) => {
                checkPage(7);
                // cells: Q.No, Subject, Time Spent, (bar - skip), Status
                const c0 = row.cells[0]?.textContent.trim() || '';
                const c1 = row.cells[1]?.textContent.trim() || '';
                const c2 = row.cells[2]?.textContent.trim() || '';
                const c4 = row.cells[4]?.textContent.trim() || '';
                const rowCells = [c0, c1, c2, c4];
                const bg = ri%2===0 ? [248,249,255] : [255,255,255];
                doc.setFillColor(...bg);
                doc.rect(margin, y, tTotalW, 6.5, 'F');
                let trx = margin;
                rowCells.forEach((cell, ci) => {
                    doc.setFontSize(7.5);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(30, 30, 30);
                    doc.text(cell, trx + tColWs[ci] / 2, y + 4.5, { align: 'center' });
                    trx += tColWs[ci];
                });
                y += 6.5;
            });
        } else {
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('No time data available.', margin + 5, y + 5);
            y += 10;
        }
        y += 6;

        // ---- THREE GRAPHS ----
        const graphTabs = [
            { tab: 'timeline', label: '📈 Score Timeline Graph' },
            { tab: 'subjects', label: '🔬 Subject Breakdown Graph' },
            { tab: 'time',     label: '⏱️ Time Analysis Graph' },
        ];

        const canvas = document.getElementById('result-graph-canvas');

        for (const { tab, label } of graphTabs) {
            // Draw this graph tab
            await new Promise(resolve => {
                const drawFn = window._drawResultGraph;
                if (typeof drawFn === 'function') {
                    window._currentResultTab = tab;
                    drawFn(tab);
                    setTimeout(resolve, 120);
                } else {
                    resolve();
                }
            });

            if (canvas) {
                let imgData;
                try { imgData = canvas.toDataURL('image/png'); } catch(e) { imgData = null; }

                if (imgData && imgData.length > 200) {
                    checkPage(80);
                    sectionTitle(label);
                    const imgH = 65;
                    doc.addImage(imgData, 'PNG', margin, y, contentW, imgH);
                    y += imgH + 5;
                }
            }
        }

        // Restore to first tab
        if (typeof window._drawResultGraph === 'function') {
            window._drawResultGraph('timeline');
        }

        // ---- FOOTER on each page ----
        const totalPages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`JEE Main CBT Simulator | Page ${p} of ${totalPages} | ${candidateName} | ${testNameVal}`,
                pageW / 2, pageH - 6, { align: 'center' });
        }

        // Save
        const safeName = (candidateName + '_' + testNameVal).replace(/[^a-zA-Z0-9_\-]/g, '_');
        doc.save(`JEE_Analysis_${safeName}_${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}.pdf`);

    } catch (err) {
        alert('❌ PDF generation failed: ' + err.message + '\n\nNote: Internet connection required for PDF library.');
        console.error(err);
    } finally {
        btn.innerHTML = '📥 Download PDF Report';
        btn.disabled = false;
    }
}

// ===== INDEXEDDB-BASED jsPDF LOADER =====
const JSPDF_DB = 'jeeSimulatorLibs';
const JSPDF_STORE = 'scripts';
const JSPDF_KEY = 'jspdf.umd.min.js';

function openLibDB() {
    return new Promise((res, rej) => {
        const req = indexedDB.open(JSPDF_DB, 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore(JSPDF_STORE);
        req.onsuccess = e => res(e.target.result);
        req.onerror   = e => rej(e.target.error);
    });
}

async function saveScriptToIDB(key, text) {
    const db = await openLibDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(JSPDF_STORE, 'readwrite');
        tx.objectStore(JSPDF_STORE).put(text, key);
        tx.oncomplete = res; tx.onerror = e => rej(e.target.error);
    });
}

async function loadScriptFromIDB(key) {
    const db = await openLibDB();
    return new Promise((res, rej) => {
        const tx = db.transaction(JSPDF_STORE, 'readonly');
        const req = tx.objectStore(JSPDF_STORE).get(key);
        req.onsuccess = e => res(e.target.result || null);
        req.onerror   = e => rej(e.target.error);
    });
}

function injectScriptText(text, dataLib) {
    if (document.querySelector(`script[data-lib="${dataLib}"]`)) return;
    const s = document.createElement('script');
    s.setAttribute('data-lib', dataLib);
    s.textContent = text;
    document.head.appendChild(s);
}

// Called by the "Load jsPDF" button in result screen
async function pickAndSaveJsPDF() {
    return new Promise((res, rej) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.js';
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) { rej(new Error('No file selected')); return; }
            const text = await file.text();
            if (!text.includes('jsPDF') && !text.includes('jspdf')) {
                rej(new Error('Yeh jspdf.umd.min.js nahi lagti — sahi file choose karo'));
                return;
            }
            await saveScriptToIDB(JSPDF_KEY, text);
            injectScriptText(text, JSPDF_KEY);
            res();
        };
        input.oncancel = () => rej(new Error('cancelled'));
        input.click();
    });
}

// Smart loader: IDB → CDN → ask user
const _scriptCache = {};
function loadScript(cdnUrl, localFile) {
    const key = localFile || cdnUrl;
    if (_scriptCache[key]) return _scriptCache[key];
    _scriptCache[key] = (async () => {
        if (document.querySelector(`script[data-lib="${key}"]`)) return;
        // 1. Try IndexedDB cache
        try {
            const cached = await loadScriptFromIDB(key);
            if (cached) { injectScriptText(cached, key); return; }
        } catch(e) {}
        // 2. Try CDN
        try {
            await new Promise((res, rej) => {
                const s = document.createElement('script');
                s.src = cdnUrl;
                s.setAttribute('data-lib', key);
                s.onload = res;
                s.onerror = () => { s.remove(); rej(new Error('cdn_fail')); };
                document.head.appendChild(s);
            });
            return;
        } catch(e) {}
        // 3. Ask user to pick file → save to IDB
        throw new Error(
            '📵 Offline mode — jsPDF load nahi hua!\n\n' +
            'Result screen pe "📂 Load jsPDF File" button click karo,\n' +
            'aur jspdf.umd.min.js select karo.\n' +
            'Ek baar select karne ke baad hamesha kaam karega ✅'
        );
    })();
    return _scriptCache[key];
}
// ===== DOCX REPORT — ZERO DEPENDENCY (Pure JS, fully offline) =====
async function downloadAnalysisDOCX() {
    const btn = document.getElementById('download-docx-btn');
    btn.textContent = '⏳ Generating Word Doc...';
    btn.disabled = true;

    try {
        function g(id) { return (document.getElementById(id)?.textContent?.trim() || '-').replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
        const candidateName = g('results-user-name');
        const testNameVal   = g('results-test-name');
        const dateStr       = new Date().toLocaleString('en-IN').replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));

        // ── XML helpers ──
        function esc(s) {
            return String(s).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
        }

        // Heading paragraph
        function wHeading(text) {
            return `<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:before="240" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="1A237E"/><w:sz w:val="28"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`;
        }

        // Normal paragraph
        function wPara(text, opts={}) {
            const bold  = opts.bold  ? '<w:b/>' : '';
            const color = opts.color ? `<w:color w:val="${opts.color}"/>` : '';
            const sz    = `<w:sz w:val="${(opts.size||11)*2}"/>`;
            const jc    = opts.center ? '<w:jc w:val="center"/>' : '';
            return `<w:p><w:pPr>${jc}<w:spacing w:before="${opts.before||0}" w:after="${opts.after||80}"/></w:pPr><w:r><w:rPr>${bold}${color}${sz}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
        }

        // Table cell
        function wCell(text, opts={}) {
            const bg    = opts.bg    ? `<w:shd w:val="clear" w:color="auto" w:fill="${opts.bg}"/>` : '';
            const bold  = opts.bold  ? '<w:b/>' : '';
            const color = opts.color ? `<w:color w:val="${opts.color}"/>` : '';
            const sz    = `<w:sz w:val="${(opts.size||10)*2}"/>`;
            const w     = opts.w     ? `<w:tcW w:w="${opts.w}" w:type="dxa"/>` : '';
            return `<w:tc><w:tcPr>${w}${bg}<w:tcMar><w:top w:w="60" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr>${bold}${color}${sz}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p></w:tc>`;
        }
        function wHCell(text, w) { return wCell(text, {bg:'1A237E', bold:true, color:'FFFFFF', size:10, w}); }
        function wRow(cells) { return `<w:tr>${cells.join('')}</w:tr>`; }
        function wTable(rows, totalW=8640) { return `<w:tbl><w:tblPr><w:tblW w:w="${totalW}" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="CCCCCC"/><w:left w:val="single" w:sz="4" w:color="CCCCCC"/><w:bottom w:val="single" w:sz="4" w:color="CCCCCC"/><w:right w:val="single" w:sz="4" w:color="CCCCCC"/><w:insideH w:val="single" w:sz="4" w:color="CCCCCC"/><w:insideV w:val="single" w:sz="4" w:color="CCCCCC"/></w:tblBorders></w:tblPr>${rows.join('')}</w:tbl>`; }

        // ── Build content ──
        let body = '';

        // Title
        body += wPara('JEE Main CBT Simulator', {bold:true, size:20, color:'1A237E', center:true, before:0, after:40});
        body += wPara('Test Analysis Report',   {size:14, color:'3F51B5', center:true, after:40});
        body += wPara(`Candidate: ${candidateName}  |  Test: ${testNameVal}  |  ${dateStr}`, {size:9, color:'555555', center:true, after:200});

        // Overall Stats
        body += wHeading('Overall Performance');
        const stats = [
            ['Total Score', g('total-score')],
            ['Correct', g('total-correct')],
            ['Incorrect', g('total-incorrect')],
            ['Unattempted', g('total-unattempted')],
            ['Marked', g('total-marked')],
            ['Accuracy', g('accuracy')],
            ['Time Taken', g('time-taken')],
        ];
        const statW = 2160; // 4 cols × 2160 = 8640
        const statRows = [];
        for (let i = 0; i < stats.length; i += 2) {
            const r = [];
            r.push(wHCell(stats[i][0], statW));
            r.push(wCell(stats[i][1], {bold:true, size:11, w:statW}));
            if (stats[i+1]) {
                r.push(wHCell(stats[i+1][0], statW));
                r.push(wCell(stats[i+1][1], {bold:true, size:11, w:statW}));
            } else {
                r.push(wCell('', {w:statW})); r.push(wCell('', {w:statW}));
            }
            statRows.push(wRow(r));
        }
        body += wTable(statRows);
        body += wPara('', {after:160});

        // Subject-wise
        body += wHeading('Subject-wise Performance');
        const sHdrs = ['Subject','Questions','Score','Correct','Incorrect','Marked','Accuracy'];
        const sWs   = [1440, 1200, 1080, 1200, 1320, 1200, 1200]; // sum=8640
        const sData = [
            ['Physics',    g('physics-total'),   g('physics-score'),   g('physics-correct'),   g('physics-incorrect'),   g('physics-marked'),   g('physics-accuracy')],
            ['Mathematics',g('maths-total'),     g('maths-score'),     g('maths-correct'),     g('maths-incorrect'),     g('maths-marked'),     g('maths-accuracy')],
            ['Chemistry',  g('chemistry-total'), g('chemistry-score'), g('chemistry-correct'), g('chemistry-incorrect'), g('chemistry-marked'), g('chemistry-accuracy')],
        ];
        body += wTable([
            wRow(sHdrs.map((h,i) => wHCell(h, sWs[i]))),
            ...sData.map((row, ri) => wRow(row.map((v,ci) => wCell(v, {bold:ci===0, bg: ri%2===0?'F0F2FF':'FFFFFF', w:sWs[ci]}))))
        ]);
        body += wPara('', {after:160});

        // Detailed Q-wise
        body += wHeading('Detailed Question-wise Analysis');
        const detEl = document.getElementById('detailed-results');
        if (detEl && detEl.rows.length > 0) {
            const dHdrs = ['Subject','Q.No','Image','Your Ans','Correct Ans','Status','Score','Marked'];
            const dWs   = [1200, 680, 1400, 880, 1100, 980, 680, 720]; // sum=7640
            const dRows = Array.from(detEl.rows).map(row => Array.from(row.cells).map(c=>c.textContent.trim()));
            body += wTable([
                wRow(dHdrs.map((h,i) => wHCell(h, dWs[i]))),
                ...dRows.map((row, ri) => {
                    const st = row[5]||'';
                    const bg = st==='Correct'?'E8F5E9': st==='Incorrect'?'FFEBEE': ri%2===0?'F8F8FF':'FFFFFF';
                    return wRow(row.map((v,ci) => wCell(v, {bg, w:dWs[ci], size:9})));
                })
            ], 7640);
        } else {
            body += wPara('No detailed data available.', {color:'999999'});
        }
        body += wPara('', {after:160});

        // Time Spent
        body += wHeading('Time Spent per Question');
        const timeEl = document.getElementById('time-spent-results');
        if (timeEl && timeEl.rows.length > 0) {
            const tHdrs = ['Q.No','Subject','Time Spent','Status'];
            const tWs   = [900, 1800, 1500, 1500]; // sum=5700
            const tRows = Array.from(timeEl.rows).map(row =>
                [row.cells[0],row.cells[1],row.cells[2],row.cells[4]].map(c=>c?c.textContent.trim():'-')
            );
            body += wTable([
                wRow(tHdrs.map((h,i) => wHCell(h, tWs[i]))),
                ...tRows.map((row, ri) => wRow(row.map((v,ci) => wCell(v, {bg: ri%2===0?'F8F8FF':'FFFFFF', w:tWs[ci], size:9}))))
            ], 5700);
        } else {
            body += wPara('No time data available.', {color:'999999'});
        }
        body += wPara('', {after:120});
        body += wPara('Note: Graphs PDF export mein available hain (teeno charts ke saath).', {size:9, color:'777777'});

        // ── Assemble DOCX XML ──
        const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
 xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
 xmlns:v="urn:schemas-microsoft-com:vml"
 xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
 xmlns:w10="urn:schemas-microsoft-com:office:word"
 xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
 xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
 xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
 xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
 xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
 mc:Ignorable="w14 wp14">
<w:body>
${body}
<w:sectPr>
  <w:pgSz w:w="12240" w:h="15840"/>
  <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
</w:sectPr>
</w:body>
</w:document>`;

        const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

        const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="240" w:after="80"/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="3F51B5"/></w:pBdr></w:pPr><w:rPr><w:b/><w:color w:val="1A237E"/><w:sz w:val="28"/></w:rPr></w:style>
</w:styles>`;

        const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml"  ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml"   ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

        const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

        // ── Build ZIP (DOCX = ZIP) using JSZip if available, else manual base64 ──
        // Try to use JSZip from CDN (small ~100KB), fallback to manual method
        async function buildDocxBlob() {
            // Try JSZip
            if (!window.JSZip) {
                try {
                    await new Promise((res, rej) => {
                        const s = document.createElement('script');
                        s.src = 'jszip.min.js'; // local first
                        s.onload = res;
                        s.onerror = () => {
                            const s2 = document.createElement('script');
                            s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                            s2.onload = res;
                            s2.onerror = rej;
                            document.head.appendChild(s2);
                        };
                        document.head.appendChild(s);
                    });
                } catch(e) { /* will use fallback */ }
            }

            if (window.JSZip) {
                const zip = new JSZip();
                zip.file('[Content_Types].xml', contentTypesXml);
                zip.file('_rels/.rels', rootRelsXml);
                zip.file('word/document.xml', documentXml);
                zip.file('word/styles.xml', stylesXml);
                zip.file('word/_rels/document.xml.rels', relsXml);
                return await zip.generateAsync({type:'blob', mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
            }

            // Fallback: manual ZIP builder (pure JS, no deps)
            return buildZipManually({
                '[Content_Types].xml': contentTypesXml,
                '_rels/.rels': rootRelsXml,
                'word/document.xml': documentXml,
                'word/styles.xml': stylesXml,
                'word/_rels/document.xml.rels': relsXml,
            });
        }

        const blob = await buildDocxBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = (candidateName + '_' + testNameVal).replace(/[^a-zA-Z0-9_\-]/g, '_');
        a.href = url;
        a.download = `JEE_Analysis_${safeName}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);

    } catch (err) {
        alert('❌ DOCX generation failed:\n' + err.message);
        console.error(err);
    } finally {
        btn.innerHTML = '📄 Download Word (.docx)';
        btn.disabled = false;
    }
}

// Pure JS ZIP builder — no external library needed
function buildZipManually(files) {
    // Simple ZIP implementation
    function strToBytes(str) {
        const enc = new TextEncoder();
        return enc.encode(str);
    }
    function crc32(buf) {
        let c = 0xFFFFFFFF;
        const table = buildCrcTable();
        for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xFF];
        return (c ^ 0xFFFFFFFF) >>> 0;
    }
    function buildCrcTable() {
        const t = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            t[i] = c;
        }
        return t;
    }
    function u16le(n) { return [n & 0xFF, (n >> 8) & 0xFF]; }
    function u32le(n) { return [n & 0xFF, (n >> 8) & 0xFF, (n >> 16) & 0xFF, (n >> 24) & 0xFF]; }

    const localHeaders = [];
    const centralDir   = [];
    let offset = 0;
    const entries = Object.entries(files);

    for (const [name, content] of entries) {
        const nameBytes = strToBytes(name);
        const dataBytes = strToBytes(content);
        const crc       = crc32(dataBytes);
        const size      = dataBytes.length;

        const localHeader = [
            0x50,0x4B,0x03,0x04, // signature
            0x14,0x00,            // version needed
            0x00,0x00,            // flags
            0x00,0x00,            // compression (stored)
            0x00,0x00,            // mod time
            0x00,0x00,            // mod date
            ...u32le(crc),
            ...u32le(size),
            ...u32le(size),
            ...u16le(nameBytes.length),
            0x00,0x00,            // extra field length
            ...nameBytes,
        ];

        const centralEntry = [
            0x50,0x4B,0x01,0x02, // signature
            0x14,0x00,0x14,0x00, // versions
            0x00,0x00,0x00,0x00, // flags + compression
            0x00,0x00,0x00,0x00, // mod time/date
            ...u32le(crc),
            ...u32le(size),
            ...u32le(size),
            ...u16le(nameBytes.length),
            0x00,0x00,0x00,0x00, // extra, comment
            0x00,0x00,0x00,0x00, // disk start, int attr
            0x00,0x00,0x00,0x00, // ext attr
            ...u32le(offset),
            ...nameBytes,
        ];

        localHeaders.push(...localHeader, ...dataBytes);
        centralDir.push(...centralEntry);
        offset += localHeader.length + size;
    }

    const cdSize  = centralDir.length;
    const cdStart = offset;
    const eocd = [
        0x50,0x4B,0x05,0x06,
        0x00,0x00,0x00,0x00,
        ...u16le(entries.length),
        ...u16le(entries.length),
        ...u32le(cdSize),
        ...u32le(cdStart),
        0x00,0x00,
    ];

    const all = new Uint8Array([...localHeaders, ...centralDir, ...eocd]);
    return new Blob([all], {type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
// ===== END DOCX FEATURE =====

// ===== DOWNLOAD ALL HISTORY PDF =====
async function downloadAllHistoryPDF() {
    if (!testHistory || testHistory.length === 0) {
        alert('Koi history nahi hai abhi!');
        return;
    }
    const btn = document.getElementById('history-pdf-btn');
    btn.textContent = '⏳ Generating...';
    btn.disabled = true;

    try {
        if (!window.jspdf) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf.umd.min.js');
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const M = 14; // margin
        const CW = pageW - M * 2; // content width
        let y = 14;

        // ── helpers ──
        function checkY(need) {
            if (y + need > pageH - 14) { doc.addPage(); y = 14; }
        }
        function secBar(text) {
            checkY(10);
            doc.setFillColor(26, 35, 126);
            doc.rect(M, y, CW, 7.5, 'F');
            doc.setTextColor(255,255,255);
            doc.setFontSize(10); doc.setFont('helvetica','bold');
            doc.text(text, M+3, y+5.3);
            doc.setTextColor(30,30,30);
            y += 10;
        }
        function hLine() {
            doc.setDrawColor(200,200,200);
            doc.line(M, y, M+CW, y); y += 3;
        }

        // ── Cover Page ──
        doc.setFillColor(26,35,126);
        doc.rect(0,0,pageW,38,'F');
        doc.setTextColor(255,255,255);
        doc.setFontSize(20); doc.setFont('helvetica','bold');
        doc.text('JEE Main CBT Simulator', pageW/2, 15, {align:'center'});
        doc.setFontSize(13); doc.setFont('helvetica','normal');
        doc.text('Complete Test History Report', pageW/2, 24, {align:'center'});
        doc.setFontSize(9);
        doc.text(`Total Tests: ${testHistory.length}  |  Generated: ${new Date().toLocaleString('en-IN')}`, pageW/2, 32, {align:'center'});
        y = 44;
        doc.setTextColor(30,30,30);

        // ── Summary Table of all tests ──
        secBar('📋 All Tests Summary');

        // Table header
        const sumCols = [38, 28, 20, 20, 20, 20, 20, 22]; // sum=188 => fits in ~190mm
        const sumHdrs = ['Test Name','Date','Score','Correct','Wrong','Unatt.','Acc%','Time'];
        checkY(8);
        doc.setFillColor(63,81,181);
        let tx = M;
        sumHdrs.forEach((h,i) => {
            doc.rect(tx, y, sumCols[i], 7, 'F');
            doc.setTextColor(255,255,255); doc.setFontSize(7.5); doc.setFont('helvetica','bold');
            doc.text(h, tx + sumCols[i]/2, y+4.8, {align:'center'});
            tx += sumCols[i];
        });
        y += 7;

        // Sort history: latest first (index 0 = latest)
        const sortedHistory = [...testHistory];
        sortedHistory.forEach((t, ri) => {
            checkY(7);
            const bg = ri%2===0 ? [245,246,255] : [255,255,255];
            doc.setFillColor(...bg);
            doc.rect(M, y, CW, 6.5, 'F');
            const mm = t.maxMarks || (t.totalQuestions*4) || 300;
            const rowData = [
                (t.testName||'Test').substring(0,18),
                formatDate(t.date).substring(0,14),
                `${t.totalScore||0}/${mm}`,
                String(t.totalCorrect||0),
                String(t.totalIncorrect||0),
                String(t.totalUnattempted||0),
                (t.accuracy||0)+'%',
                t.timeTaken||'-'
            ];
            let rx = M;
            rowData.forEach((val,ci) => {
                doc.setTextColor(30,30,30); doc.setFontSize(7); doc.setFont('helvetica', ci===0?'bold':'normal');
                doc.text(String(val), rx + sumCols[ci]/2, y+4.5, {align:'center'});
                rx += sumCols[ci];
            });
            y += 6.5;
        });
        y += 5;

        // ── Trend chart from existing canvas ──
        const trendCanvas = document.getElementById('graph-combined');
        if (trendCanvas && document.getElementById('trend-section').style.display !== 'none') {
            try {
                const trendImg = trendCanvas.toDataURL('image/png');
                if (trendImg && trendImg.length > 200) {
                    checkY(75);
                    secBar('📈 Performance Trend (Last 10 Tests)');
                    doc.addImage(trendImg, 'PNG', M, y, CW, 60);
                    y += 63;
                }
            } catch(e) {}
        }

        // ── Individual Test Details ──
        sortedHistory.forEach((t, idx) => {
            doc.addPage(); y = 14;

            // Test header
            doc.setFillColor(40,53,147);
            doc.rect(0, 0, pageW, 28, 'F');
            doc.setTextColor(255,255,255);
            doc.setFontSize(14); doc.setFont('helvetica','bold');
            doc.text(`Test ${idx+1}: ${(t.testName||'Test').substring(0,35)}`, pageW/2, 11, {align:'center'});
            doc.setFontSize(9); doc.setFont('helvetica','normal');
            doc.text(`${t.userName||'Student'}  |  ${formatDate(t.date)}  |  Time: ${t.timeTaken||'-'}`, pageW/2, 19, {align:'center'});
            doc.setFontSize(8);
            const mm2 = t.maxMarks || (t.totalQuestions*4) || 300;
            doc.text(`Score: ${t.totalScore||0}/${mm2}  |  Correct: ${t.totalCorrect||0}  |  Wrong: ${t.totalIncorrect||0}  |  Accuracy: ${t.accuracy||0}%`, pageW/2, 25, {align:'center'});
            y = 33; doc.setTextColor(30,30,30);

            // Subject-wise
            secBar('Subject-wise Performance');
            const sCols = [42,22,20,20,22,20,22]; // 168
            const sHdrs = ['Subject','Total','Score','Correct','Incorrect','Marked','Accuracy'];
            checkY(8);
            doc.setFillColor(63,81,181);
            let sx = M;
            sHdrs.forEach((h,i) => {
                doc.rect(sx,y,sCols[i],7,'F');
                doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
                doc.text(h, sx+sCols[i]/2, y+4.8, {align:'center'});
                sx += sCols[i];
            });
            y += 7;
            [
                ['Physics',    t.physicsCount||0,   t.subjectScores?.physics||0,   t.physicsCorrect||0,   t.physicsIncorrect||0,   t.physicsMarked||0,   (t.physicsAccuracy||0)+'%'],
                ['Mathematics',t.mathsCount||0,     t.subjectScores?.maths||0,     t.mathsCorrect||0,     t.mathsIncorrect||0,     t.mathsMarked||0,     (t.mathsAccuracy||0)+'%'],
                ['Chemistry',  t.chemistryCount||0, t.subjectScores?.chemistry||0, t.chemistryCorrect||0, t.chemistryIncorrect||0, t.chemistryMarked||0, (t.chemistryAccuracy||0)+'%'],
            ].forEach((row, ri) => {
                checkY(7);
                doc.setFillColor(ri%2===0?240:255, ri%2===0?242:255, ri%2===0?255:255);
                doc.rect(M,y,CW,6.5,'F');
                let srx = M;
                row.forEach((val,ci) => {
                    doc.setTextColor(30,30,30); doc.setFontSize(8); doc.setFont('helvetica',ci===0?'bold':'normal');
                    doc.text(String(val), srx+sCols[ci]/2, y+4.5, {align:'center'});
                    srx += sCols[ci];
                });
                y += 6.5;
            });
            y += 4;

            // Q-wise analysis (if key data exists)
            if (t.physicsKey && t.physicsKey.length > 0) {
                secBar('Question-wise Analysis');
                const qCols = [16, 26, 22, 22, 20, 18, 14]; // 138
                const qHdrs = ['Q.No','Subject','Your Ans','Correct','Status','Score','Marked'];
                checkY(8);
                doc.setFillColor(63,81,181);
                let qhx = M;
                qHdrs.forEach((h,i) => {
                    doc.rect(qhx,y,qCols[i],6.5,'F');
                    doc.setTextColor(255,255,255); doc.setFontSize(7); doc.setFont('helvetica','bold');
                    doc.text(h, qhx+qCols[i]/2, y+4.3, {align:'center'});
                    qhx += qCols[i];
                });
                y += 6.5;

                const allAnswers = [
                    ...(t.physicsAnswers||[]).map((a,i) => ({subj:'Physics', ua:a, key:(t.physicsKey||[])[i]||'', marked:(t.physicsMarkedArray||[])[i]})),
                    ...(t.mathsAnswers||[]).map((a,i)   => ({subj:'Maths',   ua:a, key:(t.mathsKey||[])[i]||'',   marked:(t.mathsMarkedArray||[])[i]})),
                    ...(t.chemistryAnswers||[]).map((a,i)=> ({subj:'Chem',   ua:a, key:(t.chemistryKey||[])[i]||'', marked:(t.chemistryMarkedArray||[])[i]})),
                ];

                allAnswers.forEach((q, qi) => {
                    checkY(6);
                    const ca = typeof q.key==='object' ? (q.key.answer||'') : q.key;
                    const isNum = typeof q.key==='object' && q.key.type==='numeric';
                    let status='Unatt', score=0;
                    if (q.ua) {
                        const correct = isNum ? parseInt(q.ua)===parseInt(ca) : q.ua===ca;
                        status = correct ? 'Correct' : 'Wrong';
                        score  = correct ? 4 : -1;
                    }
                    const bg = status==='Correct'?[232,245,232]: status==='Wrong'?[255,235,235]: qi%2===0?[248,248,255]:[255,255,255];
                    doc.setFillColor(...bg);
                    doc.rect(M,y,CW,5.8,'F');
                    const rowD = [String(qi+1), q.subj, q.ua||'-', ca||'-', status, score>0?'+'+score:String(score), q.marked?'Yes':'No'];
                    let qrx = M;
                    rowD.forEach((val,ci) => {
                        doc.setTextColor(30,30,30); doc.setFontSize(6.5); doc.setFont('helvetica','normal');
                        doc.text(val, qrx+qCols[ci]/2, y+4, {align:'center'});
                        qrx += qCols[ci];
                    });
                    y += 5.8;
                });
            }

            y += 4;
            hLine();
        });

        // Footer on all pages
        const total = doc.internal.getNumberOfPages();
        for (let p=1; p<=total; p++) {
            doc.setPage(p);
            doc.setFontSize(7.5); doc.setTextColor(160,160,160);
            doc.text(`JEE Main CBT Simulator | History Report | Page ${p} of ${total}`, pageW/2, pageH-5, {align:'center'});
        }

        doc.save(`JEE_History_Report_${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}.pdf`);

    } catch(err) {
        alert('❌ PDF generation failed: ' + err.message);
        console.error(err);
    } finally {
        btn.textContent = '📥 History PDF';
        btn.disabled = false;
    }
}
// ===== END HISTORY PDF =====




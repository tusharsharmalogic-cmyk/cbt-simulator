// Extracted from imu.html lines 3582-3946
        // ===== CURRENT GRAPH TAB =====
        let currentGraphTab = 'overall';
        function switchGraphTab(tab) {
            currentGraphTab = tab;
            document.querySelectorAll('.gtab').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            drawTrendGraph();
        }

        // Global switchResultTab — delegates to the per-test instance set by calculateAndDisplayResults
        function switchResultTab(tab, e) {
            if (window._switchResultTabFn) {
                window._switchResultTabFn(tab, e);
            }
        }

        // ===== DRAW COMBINED ANALYTICS GRAPH (UPGRADED) =====
        function drawTrendGraph() {
            if (testHistory.length === 0) return;
            document.getElementById('trend-section').style.display = 'block';

            const isDark = document.body.classList.contains('dark-mode');
            const tab = currentGraphTab;

            // Chronological order: oldest → newest, last 10
            const last10 = [...testHistory].reverse().slice(-10);
            const n = last10.length;

            const fullLabels = last10.map((t, i) => t.testName || ('Test ' + (i + 1)));
            const labels = last10.map((t, i) => {
                const name = t.testName || ('T' + (i + 1));
                return name.length > 7 ? name.substring(0, 6) + '…' : name;
            });

            // ---- Helper: compute subject accuracy ----
            function subjectAccuracy(t, subj) {
                const correct = t[subj + 'Correct'] || 0;
                const incorrect = t[subj + 'Incorrect'] || 0;
                const total = correct + incorrect;
                return total > 0 ? Math.round((correct / total) * 100) : 0;
            }
            function subjectScorePerc(t, subj) {
                const score = (t.subjectScores && t.subjectScores[subj]) || 0;
                const count = t[subj + 'Count'] || 0;
                const max = count * 4 || 1;
                return Math.max(0, Math.round((score / max) * 100));
            }
            function subjectAttemptPerc(t, subj) {
                const correct = t[subj + 'Correct'] || 0;
                const incorrect = t[subj + 'Incorrect'] || 0;
                const count = t[subj + 'Count'] || (t.totalQuestions / 3) || 25;
                return Math.round(((correct + incorrect) / count) * 100);
            }

            // ---- Build datasets based on tab ----
            let scorePerc, attemptPerc, accuracyPerc, avgTimeSec;

            if (tab === 'overall') {
                scorePerc = last10.map(t => {
                    const mm = t.maxMarks || (t.totalQuestions * 4) || 300;
                    return Math.max(0, Math.round(((t.totalScore || 0) / mm) * 100));
                });
                attemptPerc = last10.map(t => {
                    const tq = t.totalQuestions || 75;
                    return Math.round(((t.totalCorrect || 0) + (t.totalIncorrect || 0)) / tq * 100);
                });
                accuracyPerc = last10.map(t => Math.round(t.accuracy || 0));
            } else {
                scorePerc   = last10.map(t => subjectScorePerc(t, tab));
                attemptPerc = last10.map(t => subjectAttemptPerc(t, tab));
                accuracyPerc = last10.map(t => subjectAccuracy(t, tab));
            }

            // Avg time per Q (always overall — subject-wise time not separately stored)
            avgTimeSec = last10.map(t => {
                const tq = t.totalQuestions || 75;
                let totalSec = 0;
                if (t.timeTaken) {
                    const parts = t.timeTaken.split(':').map(Number);
                    if (parts.length === 3) totalSec = parts[0]*3600 + parts[1]*60 + parts[2];
                    else if (parts.length === 2) totalSec = parts[0]*60 + parts[1];
                }
                if (t.questionTimeSpent && Array.isArray(t.questionTimeSpent)) {
                    const sum = t.questionTimeSpent.reduce((a,b) => a+(b||0), 0);
                    if (sum > 0) totalSec = sum;
                }
                return tq > 0 ? totalSec / tq : 0;
            });
            const avgTimeMin = avgTimeSec.map(s => s / 60);
            const speedRaw = avgTimeMin.map(m => m > 0 ? 1/m : 0);
            const maxSpeed = Math.max(...speedRaw) || 1;
            const speedPerc = speedRaw.map(s => Math.round((s / maxSpeed) * 100));

            // ---- Find best test index (by score%) ----
            const bestIdx = scorePerc.indexOf(Math.max(...scorePerc));

            // ---- Legend badges ----
            function setBadge(id, data, isSpeed) {
                const el = document.getElementById(id);
                if (!el || data.length < 2) { if(el) el.textContent = ''; return; }
                const diff = data[data.length-1] - data[data.length-2];
                if (isSpeed) {
                    const secDiff = Math.round(avgTimeSec[avgTimeSec.length-1] - avgTimeSec[avgTimeSec.length-2]);
                    if (secDiff < 0) { el.textContent = '▲ ' + Math.abs(secDiff) + 's faster'; el.className = 'cleg-badge up'; }
                    else if (secDiff > 0) { el.textContent = '▼ ' + secDiff + 's slower'; el.className = 'cleg-badge down'; }
                    else { el.textContent = '→ Same'; el.className = 'cleg-badge same'; }
                } else {
                    if (diff > 0) { el.textContent = '▲ +' + diff + '%'; el.className = 'cleg-badge up'; }
                    else if (diff < 0) { el.textContent = '▼ ' + diff + '%'; el.className = 'cleg-badge down'; }
                    else { el.textContent = '→ Same'; el.className = 'cleg-badge same'; }
                }
            }
            setBadge('badge-score', scorePerc, false);
            setBadge('badge-attempt', attemptPerc, false);
            setBadge('badge-accuracy', accuracyPerc, false);
            setBadge('badge-time', speedPerc, true);

            // ---- Datasets config ----
            const datasets = [
                { data: scorePerc,    color: '#3f51b5', label: 'Score',    unit: '%' },
                { data: attemptPerc,  color: '#ff9800', label: 'Attempt',  unit: '%' },
                { data: accuracyPerc, color: '#4caf50', label: 'Accuracy', unit: '%' },
                { data: speedPerc,    color: '#e91e63', label: 'Speed',    unit: '' },
            ];
            // Averages
            const avgs = datasets.map(ds => Math.round(ds.data.reduce((a,b)=>a+b,0) / (ds.data.length||1)));

            // ---- Draw ----
            setTimeout(() => {
                const canvas = document.getElementById('graph-combined');
                if (!canvas) return;
                const dpr2 = window.devicePixelRatio || 1;
                const cssW2 = canvas.offsetWidth || 500;
                const cssH2 = 400;
                canvas.width  = Math.round(cssW2 * dpr2);
                canvas.height = Math.round(cssH2 * dpr2);
                canvas.style.width  = cssW2 + 'px';
                canvas.style.height = cssH2 + 'px';
                const ctx = canvas.getContext('2d');
                ctx.setTransform(1,0,0,1,0,0);
                ctx.scale(dpr2, dpr2);
                ctx.clearRect(0, 0, cssW2, cssH2);
                const W = cssW2, H = cssH2;

                const padL = 42, padR = 18, padT = 28, padB = 42;
                const gW = W - padL - padR;
                const gH = H - padT - padB;

                // Background gradient
                const bgGrad = ctx.createLinearGradient(0, padT, 0, padT+gH);
                bgGrad.addColorStop(0, isDark ? '#12122a' : '#f0f2ff');
                bgGrad.addColorStop(1, isDark ? '#1a1a2e' : '#f8f9ff');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(padL, padT, gW, gH);

                function xPos(i) { return padL + (n===1 ? gW/2 : (i/(n-1))*gW); }
                function yPos(v) { return padT + gH - (v/100)*gH; }

                // Horizontal grid lines
                for (let i = 0; i <= 4; i++) {
                    const v = 100 - i*25;
                    const y = padT + (gH/4)*i;
                    ctx.strokeStyle = isDark ? '#252540' : '#e4e6f8';
                    ctx.lineWidth = i===0||i===4 ? 1.5 : 1;
                    ctx.setLineDash(i===2 ? [4,4] : []);
                    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL+gW, y); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = isDark ? '#777' : '#aaa';
                    ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
                    ctx.fillText(v + '%', padL - 5, y + 3);
                }

                // Vertical grid lines
                for (let i = 0; i < n; i++) {
                    ctx.strokeStyle = isDark ? '#1e1e30' : '#eaecf8';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3, 4]);
                    ctx.beginPath(); ctx.moveTo(xPos(i), padT); ctx.lineTo(xPos(i), padT+gH); ctx.stroke();
                    ctx.setLineDash([]);
                }

                // ---- Average dashed lines ----
                datasets.forEach((ds, di) => {
                    const ay = yPos(avgs[di]);
                    ctx.strokeStyle = ds.color + '88';
                    ctx.lineWidth = 1.2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath(); ctx.moveTo(padL, ay); ctx.lineTo(padL+gW, ay); ctx.stroke();
                    ctx.setLineDash([]);
                    // avg label on right
                    ctx.fillStyle = ds.color + 'cc';
                    ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'left';
                    ctx.fillText('avg ' + avgs[di] + '%', padL + gW + 2, ay + 3);
                });

                // ---- Draw lines ----
                datasets.forEach(ds => {
                    ctx.strokeStyle = ds.color;
                    ctx.lineWidth = 2.5;
                    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ds.data.forEach((v, i) => {
                        const x = xPos(i), y = yPos(v);
                        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
                    });
                    ctx.stroke();
                });

                // ---- Draw dots + best crown ----
                datasets.forEach((ds, di) => {
                    ds.data.forEach((v, i) => {
                        const x = xPos(i), y = yPos(v);
                        // Outer glow for best
                        if (i === bestIdx && di === 0) {
                            ctx.beginPath();
                            ctx.arc(x, y, 9, 0, Math.PI*2);
                            ctx.fillStyle = '#ffd700' + '55';
                            ctx.fill();
                        }
                        ctx.beginPath();
                        ctx.arc(x, y, 5, 0, Math.PI*2);
                        ctx.fillStyle = isDark ? '#12122a' : '#fff';
                        ctx.fill();
                        ctx.strokeStyle = ds.color;
                        ctx.lineWidth = 2.2;
                        ctx.stroke();
                    });
                });

                // ---- Crown/star on best test (all datasets) ----
                if (n > 0) {
                    const bx = xPos(bestIdx);
                    // Draw ⭐ above top dataset point
                    const topY = Math.min(...datasets.map(ds => yPos(ds.data[bestIdx])));
                    ctx.font = '16px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('⭐', bx, topY - 10);
                }

                // ---- X-axis labels ----
                ctx.fillStyle = isDark ? '#aaa' : '#555';
                ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
                for (let i = 0; i < n; i++) {
                    ctx.fillStyle = i === bestIdx ? '#ffd700' : (isDark ? '#aaa' : '#555');
                    ctx.font = i === bestIdx ? 'bold 10px sans-serif' : '10px sans-serif';
                    ctx.fillText(labels[i], xPos(i), padT + gH + 16);
                }

                // ---- Border ----
                ctx.strokeStyle = isDark ? '#333' : '#c8ccea';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([]);
                ctx.strokeRect(padL, padT, gW, gH);

                // ---- TOOLTIP: mouse/touch events ----
                const tooltip = document.getElementById('graph-tooltip');
                const wrapper = canvas.parentElement;

                function getHoveredIndex(clientX) {
                    const rect = canvas.getBoundingClientRect();
                    const mx = clientX - rect.left;
                    let closest = 0, minDist = Infinity;
                    for (let i = 0; i < n; i++) {
                        const d = Math.abs(xPos(i) - mx);
                        if (d < minDist) { minDist = d; closest = i; }
                    }
                    return minDist < 40 ? closest : -1;
                }

                function showTooltip(clientX, clientY, idx) {
                    if (idx < 0) { tooltip.style.display = 'none'; return; }
                    const t = last10[idx];
                    const isBest = idx === bestIdx;
                    let html = `<div class="tt-title">${isBest ? '⭐ ' : ''}${fullLabels[idx]}</div>`;
                    datasets.forEach((ds, di) => {
                        let val;
                        if (di === 3) {
                            val = avgTimeMin[idx] > 0 ? avgTimeMin[idx].toFixed(2) + ' min/Q' : '-';
                        } else {
                            val = ds.data[idx] + '%';
                        }
                        html += `<div class="tt-row"><span class="tt-dot" style="background:${ds.color}"></span><b>${ds.label}:</b> ${val}</div>`;
                    });
                    // Add raw score for overall
                    if (tab === 'overall') {
                        const mm = t.maxMarks || (t.totalQuestions*4) || 300;
                        html += `<div class="tt-row" style="margin-top:4px; border-top:1px solid rgba(255,255,255,0.1); padding-top:4px; font-size:11px; color:#ccc;">Score: ${t.totalScore||0}/${mm}</div>`;
                    }

                    const rect = canvas.getBoundingClientRect();
                    const wRect = wrapper.getBoundingClientRect();
                    let tx = (clientX - wRect.left) + 14;
                    let ty = (clientY - wRect.top) - 20;
                    tooltip.innerHTML = html;
                    tooltip.style.display = 'block';
                    // Clamp horizontally
                    const tw = tooltip.offsetWidth || 170;
                    if (tx + tw > wRect.width - 10) tx = (clientX - wRect.left) - tw - 14;
                    tooltip.style.left = tx + 'px';
                    tooltip.style.top = Math.max(0, ty) + 'px';
                }

                canvas.onmousemove = function(e) {
                    showTooltip(e.clientX, e.clientY, getHoveredIndex(e.clientX));
                };
                canvas.onmouseleave = function() {
                    tooltip.style.display = 'none';
                };
                // Touch support
                canvas.ontouchmove = function(e) {
                    e.preventDefault();
                    const t = e.touches[0];
                    showTooltip(t.clientX, t.clientY, getHoveredIndex(t.clientX));
                };
                canvas.ontouchend = function() {
                    setTimeout(() => { tooltip.style.display = 'none'; }, 1500);
                };

            }, 30);
        }

        // ===== WRONG IMAGES TRACKER =====
        function buildWrongImagesTracker() {
            if (testHistory.length === 0) return;
            document.getElementById('wrong-images-section').style.display = 'block';

            const wrongMap = { physics: {}, maths: {}, chemistry: {} };

            testHistory.forEach(test => {
                function processSubject(subj, answers, key, imageNames) {
                    if (!answers || !key) return;
                    for (let i = 0; i < key.length; i++) {
                        const ke = key[i] || '';
                        const correctAns = (typeof ke === 'object') ? (ke.answer || '') : ke;
                        const isNumeric = (typeof ke === 'object') && ke.type === 'numeric';
                        const userAns = answers[i] || '';
                        if (!userAns) continue; // skip unattempted
                        const isWrong = isNumeric ? parseInt(userAns) !== parseInt(correctAns) : userAns !== correctAns;
                        if (isWrong) {
                            const imgName = (imageNames && imageNames[i]) ? imageNames[i] : null;
                            if (imgName) {
                                wrongMap[subj][imgName] = (wrongMap[subj][imgName] || 0) + 1;
                            }
                        }
                    }
                }
                processSubject('physics', test.physicsAnswers, test.physicsKey, test.physicsImageNames);
                processSubject('maths', test.mathsAnswers, test.mathsKey, test.mathsImageNames);
                processSubject('chemistry', test.chemistryAnswers, test.chemistryKey, test.chemistryImageNames);
            });

            ['physics', 'maths', 'chemistry'].forEach(subj => {
                const container = document.getElementById(`wrong-${subj}-imgs`);
                const sorted = Object.entries(wrongMap[subj]).sort((a, b) => b[1] - a[1]);
                if (sorted.length === 0) {
                    container.innerHTML = '<span class="wrong-img-empty">No wrong answers tracked yet</span>';
                } else {
                    container.innerHTML = sorted.map(([name, count]) =>
                        `<span class="wrong-img-badge">${name}<span class="wrong-img-count">${count}x</span></span>`
                    ).join('');
                }
            });
        }



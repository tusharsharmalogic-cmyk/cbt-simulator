// Extracted from imu.html lines 8410-9066
        // ========================================================
        // ===== AUTO-SAVE & RESUME SYSTEM =====
        // ========================================================

        const AUTO_SAVE_KEY = 'jeeSimAutoSave_v2';
        let _autoSaveInterval = null;
        let _resumeData = null;  // holds loaded resume data during re-select flow

        // ---- SAVE current test state (no image dataURLs, only names) ----
        function autoSaveState() {
            if (!testStarted || testSubmitted) return;

            // Collect batch info (names only, no dataURLs)
            const batchMeta = {};
            ['physics', 'maths', 'chemistry'].forEach(s => {
                batchMeta[s] = (folderBatches[s] || []).map(b => ({
                    label: b.label,
                    imageNames: (b.images || []).map(img => img.name),
                    answerKey: b.answerKey || ''
                }));
            });

            const state = {
                // Identity
                userName,
                testName,
                testType,
                // Counts & timing
                physicsCount,
                mathsCount,
                chemistryCount,
                totalQuestions,
                customTime,
                totalSeconds,
                // Navigation state
                currentQuestion,
                currentSubject,
                currentImageIndex,
                subjectMemory: JSON.parse(JSON.stringify(subjectMemory)),
                // Answers
                physicsAnswers: [...physicsAnswers],
                mathsAnswers: [...mathsAnswers],
                chemistryAnswers: [...chemistryAnswers],
                physicsMarked: [...physicsMarked],
                mathsMarked: [...mathsMarked],
                chemistryMarked: [...chemistryMarked],
                // Time tracking
                timeSpent: [...timeSpent],
                // Remaining timer
                remainingSeconds: totalSeconds,
                // Toggles
                autoAdvanceImage,
                filenameAnsMode,
                subjectTimerMode,
                subjectTimerSeconds: JSON.parse(JSON.stringify(subjectTimerSeconds)),
                subjectTimerLocked: JSON.parse(JSON.stringify(subjectTimerLocked)),
                // Answer keys (txt)
                physicsTxtAnswerKey,
                mathsTxtAnswerKey,
                chemistryTxtAnswerKey,
                // Question types
                physicsQuestionTypes: JSON.parse(JSON.stringify(physicsQuestionTypes)),
                mathsQuestionTypes: JSON.parse(JSON.stringify(mathsQuestionTypes)),
                chemistryQuestionTypes: JSON.parse(JSON.stringify(chemistryQuestionTypes)),
                // Image names only (per subject)
                physicsImageNames: loadedPhysicsImages.map(i => i.name),
                mathsImageNames: loadedMathsImages.map(i => i.name),
                chemistryImageNames: loadedChemistryImages.map(i => i.name),
                physicsAnswerImageNames: loadedPhysicsAnswers.map(i => i.name),
                mathsAnswerImageNames: loadedMathsAnswers.map(i => i.name),
                chemistryAnswerImageNames: loadedChemistryAnswers.map(i => i.name),
                // Batch metadata (names only, no dataURLs)
                batchMeta,
                // JSON mode
                jsonModeEnabled,
                jsonQuestions: jsonModeEnabled ? JSON.parse(JSON.stringify(jsonQuestions)) : null,
                // Timestamp
                savedAt: Date.now()
            };

            try {
                localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(state));
                // (indicator hidden — silent save)
            } catch(e) {
                console.warn('Auto-save failed (storage full?):', e);
            }
        }

        // ---- Start auto-save interval after test begins ----
        function startAutoSave() {
            if (_autoSaveInterval) clearInterval(_autoSaveInterval);
            _autoSaveInterval = setInterval(autoSaveState, 5000);
        }

        // ---- Clear auto-save on submit or new test ----
        function clearAutoSave() {
            localStorage.removeItem(AUTO_SAVE_KEY);
            if (_autoSaveInterval) { clearInterval(_autoSaveInterval); _autoSaveInterval = null; }
        }

        // ---- Check on page load if a saved test exists ----
        function checkAutoSave() {
            const raw = localStorage.getItem(AUTO_SAVE_KEY);
            if (!raw) return;
            try {
                const state = JSON.parse(raw);
                if (!state || !state.savedAt) return;
                // Show resume banner
                const age = Math.floor((Date.now() - state.savedAt) / 60000);
                const ageText = age < 1 ? 'abhi abhi' : (age < 60 ? `${age} minute pehle` : `${Math.floor(age/60)} ghante pehle`);
                const hasBatches = Object.values(state.batchMeta || {}).some(arr => arr.length > 0);
                const imgInfo = `Physics: ${state.physicsImageNames?.length || 0}, Maths: ${state.mathsImageNames?.length || 0}, Chemistry: ${state.chemistryImageNames?.length || 0}`;
                const bannerInfo = document.getElementById('resume-banner-info');
                bannerInfo.innerHTML = `
                    <strong>👤 Name:</strong> ${state.userName || '?'} &nbsp;|&nbsp; 
                    <strong>📋 Test:</strong> ${state.testName || '?'}<br>
                    <strong>❓ Questions:</strong> P:${state.physicsCount} M:${state.mathsCount} C:${state.chemistryCount} &nbsp;|&nbsp;
                    <strong>📍 Last Position:</strong> Q${state.currentQuestion}<br>
                    <strong>🕐 Save hua:</strong> ${ageText} &nbsp;|&nbsp;
                    <strong>🖼️ Images:</strong> ${imgInfo}
                    ${hasBatches ? '<br><strong>📂 Batch Mode:</strong> ' + Object.entries(state.batchMeta).map(([s,arr]) => arr.length > 0 ? `${s.charAt(0).toUpperCase()+s.slice(1)}(${arr.length} folders)` : '').filter(Boolean).join(', ') : ''}
                `;
                document.getElementById('resume-banner').style.display = 'block';
            } catch(e) {
                console.warn('Could not parse auto-save:', e);
                localStorage.removeItem(AUTO_SAVE_KEY);
            }
        }

        // ---- Discard saved test ----
        function discardResume() {
            if (!confirm('Saved test discard kar dein? Yeh undo nahi hoga.')) return;
            clearAutoSave();
            document.getElementById('resume-banner').style.display = 'none';
        }

        // ---- Initiate Resume flow ----
        function initiateResume() {
            const raw = localStorage.getItem(AUTO_SAVE_KEY);
            if (!raw) { alert('Saved data nahi mila!'); return; }
            try {
                _resumeData = JSON.parse(raw);
            } catch(e) {
                alert('Saved data corrupt hai. Discard karke naya test shuru karo.');
                clearAutoSave();
                return;
            }

            const state = _resumeData;
            const hasBatches = Object.values(state.batchMeta || {}).some(arr => arr.length > 0);
            const hasRegularImages = (state.physicsImageNames?.length > 0) || 
                                     (state.mathsImageNames?.length > 0) || 
                                     (state.chemistryImageNames?.length > 0);
            const hasAnswerImages = (state.physicsAnswerImageNames?.length > 0) ||
                                    (state.mathsAnswerImageNames?.length > 0) ||
                                    (state.chemistryAnswerImageNames?.length > 0);

            // JSON mode — no images needed, just resume directly
            if (state.jsonModeEnabled) {
                applyResumeState(state, {}, {}, {});
                return;
            }

            if (!hasRegularImages && !hasBatches) {
                // No images were loaded originally, can resume without image selection
                applyResumeState(state, {}, {}, {});
                return;
            }

            // Build image re-select dialog
            buildReselDialog(state);
            document.getElementById('img-reselect-dialog').classList.add('active');
        }

        // ---- Build the re-select dialog ----
        function buildReselDialog(state) {
            const container = document.getElementById('resel-subjects-container');
            container.innerHTML = '';

            const hasBatches = Object.values(state.batchMeta || {}).some(arr => arr.length > 0);

            const subjects = [
                { key: 'physics', icon: '⚛️', color: '#1565c0', bg: '#e3f2fd' },
                { key: 'maths',   icon: '📐', color: '#2e7d32', bg: '#e8f5e9' },
                { key: 'chemistry', icon: '🧪', color: '#880e4f', bg: '#fce4ec' }
            ];

            subjects.forEach(({ key, icon, color, bg }) => {
                const batchArr = state.batchMeta?.[key] || [];
                const isBatchMode = batchArr.length > 0;
                const imageNames = state[key + 'ImageNames'] || [];
                const ansImageNames = state[key + 'AnswerImageNames'] || [];

                if (imageNames.length === 0 && !isBatchMode) return; // nothing to show

                const block = document.createElement('div');
                block.className = 'resel-subject-block';
                block.style.background = bg;
                block.style.borderColor = color;
                block.dataset.subject = key;
                block.dataset.loaded = '0';

                let namesHtml = '';
                let selectBtnHtml = '';
                let statusText = '';

                if (isBatchMode) {
                    // Show batch names
                    namesHtml = batchArr.map((b, bi) => 
                        `<div style="margin-bottom:4px;"><strong style="color:${color}">📂 ${b.label}</strong> — ${b.imageNames.length} images: ${b.imageNames.slice(0,5).join(', ')}${b.imageNames.length > 5 ? '...' : ''}</div>`
                    ).join('');
                    selectBtnHtml = batchArr.map((b, bi) => `
                        <div style="margin-bottom:8px; padding:8px; background:rgba(255,255,255,0.7); border-radius:6px;">
                            <div style="font-weight:600; font-size:13px; color:${color}; margin-bottom:4px;">📂 ${b.label} (${b.imageNames.length} images)</div>
                            <div style="font-size:11px; color:#666; margin-bottom:6px; font-family:monospace;">${b.imageNames.slice(0,8).join(', ')}${b.imageNames.length > 8 ? '...' : ''}</div>
                            <button class="resel-file-btn" style="background:${color}; font-size:12px;" 
                                onclick="reselSelectBatchImages('${key}', ${bi}, this)">
                                🖼️ Select ${b.imageNames.length} images for "${b.label}"
                            </button>
                            <span id="resel-batch-status-${key}-${bi}" class="resel-status warn" style="display:block;margin-top:4px;">⏳ Images select nahi hain</span>
                        </div>
                    `).join('');
                    statusText = `📂 Batch mode: ${batchArr.length} folder(s). Har folder ke images alag-alag select karo.`;
                } else {
                    namesHtml = imageNames.slice(0, 10).join(', ') + (imageNames.length > 10 ? `... (${imageNames.length} total)` : '');
                    selectBtnHtml = `<button class="resel-file-btn" style="background:${color}" 
                        onclick="reselSelectImages('${key}', this)">
                        🖼️ ${imageNames.length} Question Images Select Karo
                    </button>`;
                    if (ansImageNames.length > 0) {
                        selectBtnHtml += `<button class="resel-file-btn" style="background:#f57c00; margin-left:8px; font-size:12px;" 
                            onclick="reselSelectAnswerImages('${key}', this)">
                            🔑 ${ansImageNames.length} Answer Images Select Karo (optional)
                        </button>`;
                    }
                    statusText = `⏳ ${imageNames.length} images select karo (jaise pehle thi — order same hona chahiye)`;
                }

                block.innerHTML = `
                    <h4 style="color:${color}; margin:0 0 8px 0;">${icon} ${key.charAt(0).toUpperCase()+key.slice(1)} Images</h4>
                    <div class="resel-names">${namesHtml}</div>
                    ${selectBtnHtml}
                    <div class="resel-status warn" id="resel-status-${key}">${statusText}</div>
                `;
                container.appendChild(block);
            });

            // If container is empty (no images at all), just proceed
            if (container.children.length === 0) {
                applyResumeState(state, {}, {}, {});
                return;
            }

            updateReselProceedBtn();
        }

        // Track loaded images per subject for re-select
        const _reselLoaded = { physics: null, maths: null, chemistry: null };
        const _reselAnswerLoaded = { physics: null, maths: null, chemistry: null };
        const _reselBatchLoaded = { physics: {}, maths: {}, chemistry: {} };

        function reselSelectImages(subject, btn) {
            const input = document.createElement('input');
            input.type = 'file'; input.multiple = true; input.accept = 'image/*';
            input.onchange = function() {
                const files = Array.from(input.files);
                const savedNames = _resumeData[subject + 'ImageNames'] || [];
                // Filter only files whose name is in saved names
                const matchMap = {};
                savedNames.forEach(n => matchMap[n.toLowerCase()] = n);
                const filtered = files.filter(f => matchMap[f.name.toLowerCase()]);
                // Sort by saved order
                const ordered = savedNames.map(n => filtered.find(f => f.name.toLowerCase() === n.toLowerCase())).filter(Boolean);

                btn.textContent = `⏳ Loading ${ordered.length}/${savedNames.length} images...`;
                loadFilesAsDataURL(ordered).then(imgs => {
                    _reselLoaded[subject] = imgs;
                    const statusEl = document.getElementById('resel-status-' + subject);
                    if (ordered.length === savedNames.length) {
                        statusEl.className = 'resel-status ok';
                        statusEl.textContent = `✅ ${imgs.length} images loaded (${imgs.length}/${savedNames.length} matched)`;
                        btn.textContent = `✅ ${imgs.length} images loaded`;
                    } else {
                        statusEl.className = 'resel-status warn';
                        statusEl.textContent = `⚠️ ${imgs.length}/${savedNames.length} images match hui. Kuch images nahi mili — extra images ignore hongi.`;
                        btn.textContent = `⚠️ ${imgs.length}/${savedNames.length} loaded`;
                    }
                    updateReselProceedBtn();
                });
            };
            input.click();
        }

        function reselSelectAnswerImages(subject, btn) {
            const input = document.createElement('input');
            input.type = 'file'; input.multiple = true; input.accept = 'image/*';
            input.onchange = function() {
                const files = Array.from(input.files);
                const savedNames = _resumeData[subject + 'AnswerImageNames'] || [];
                const matchMap = {};
                savedNames.forEach(n => matchMap[n.toLowerCase()] = n);
                const filtered = files.filter(f => matchMap[f.name.toLowerCase()]);
                const ordered = savedNames.map(n => filtered.find(f => f.name.toLowerCase() === n.toLowerCase())).filter(Boolean);
                loadFilesAsDataURL(ordered).then(imgs => {
                    _reselAnswerLoaded[subject] = imgs;
                    btn.textContent = `✅ ${imgs.length} answer images`;
                    updateReselProceedBtn();
                });
            };
            input.click();
        }

        function reselSelectBatchImages(subject, batchIndex, btn) {
            const input = document.createElement('input');
            input.type = 'file'; input.multiple = true; input.accept = 'image/*';
            input.onchange = function() {
                const files = Array.from(input.files);
                const batchMeta = _resumeData.batchMeta[subject][batchIndex];
                const savedNames = batchMeta.imageNames;
                const matchMap = {};
                savedNames.forEach(n => matchMap[n.toLowerCase()] = n);
                const filtered = files.filter(f => matchMap[f.name.toLowerCase()]);
                const ordered = savedNames.map(n => filtered.find(f => f.name.toLowerCase() === n.toLowerCase())).filter(Boolean);
                
                btn.textContent = `⏳ Loading...`;
                loadFilesAsDataURL(ordered).then(imgs => {
                    if (!_reselBatchLoaded[subject]) _reselBatchLoaded[subject] = {};
                    _reselBatchLoaded[subject][batchIndex] = imgs;
                    
                    const statusEl = document.getElementById(`resel-batch-status-${subject}-${batchIndex}`);
                    if (imgs.length === savedNames.length) {
                        statusEl.className = 'resel-status ok';
                        statusEl.textContent = `✅ ${imgs.length}/${savedNames.length} images loaded`;
                        btn.textContent = `✅ ${imgs.length} images loaded`;
                    } else {
                        statusEl.className = 'resel-status warn';
                        statusEl.textContent = `⚠️ ${imgs.length}/${savedNames.length} match hui`;
                        btn.textContent = `⚠️ ${imgs.length}/${savedNames.length}`;
                    }
                    updateReselProceedBtn();
                });
            };
            input.click();
        }

        function loadFilesAsDataURL(files) {
            return Promise.all(files.map(file => new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onload = e => res({ name: file.name, dataURL: e.target.result, size: file.size });
                reader.onerror = rej;
                reader.readAsDataURL(file);
            })));
        }

        function updateReselProceedBtn() {
            const btn = document.getElementById('resel-proceed-btn');
            const state = _resumeData;
            const hasBatches = Object.values(state.batchMeta || {}).some(arr => arr.length > 0);
            
            let allReady = true;
            ['physics', 'maths', 'chemistry'].forEach(s => {
                const batchArr = state.batchMeta?.[s] || [];
                const isBatch = batchArr.length > 0;
                const imageNames = state[s + 'ImageNames'] || [];
                
                if (isBatch) {
                    // Check each batch has some images loaded
                    batchArr.forEach((b, bi) => {
                        if (b.imageNames.length > 0 && !(_reselBatchLoaded[s]?.[bi]?.length > 0)) {
                            allReady = false;
                        }
                    });
                } else if (imageNames.length > 0) {
                    if (!(_reselLoaded[s]?.length > 0)) allReady = false;
                }
            });
            
            btn.disabled = !allReady;
            btn.textContent = allReady ? '▶️ Resume Test' : '⏳ Pehle sab images select karo';
        }

        function cancelResume() {
            document.getElementById('img-reselect-dialog').classList.remove('active');
            _resumeData = null;
        }

        // ---- Apply saved state and start test ----
        function proceedWithResume() {
            if (!_resumeData) return;
            document.getElementById('img-reselect-dialog').classList.remove('active');
            applyResumeState(_resumeData, _reselLoaded, _reselAnswerLoaded, _reselBatchLoaded);
        }

        function applyResumeState(state, reselLoaded, reselAnswerLoaded, reselBatchLoaded) {
            // 1. Restore all non-image variables
            userName = state.userName || '';
            testName = state.testName || 'Test';
            testType = state.testType || 'custom';
            physicsCount = state.physicsCount || 0;
            mathsCount = state.mathsCount || 0;
            chemistryCount = state.chemistryCount || 0;
            totalQuestions = state.totalQuestions || 75;
            customTime = state.customTime || 180;
            // Timer restore: saved totalSeconds minus time elapsed since save
            const savedTotalSeconds = state.remainingSeconds || state.totalSeconds || customTime * 60;
            const elapsedSinceSave = Math.floor((Date.now() - (state.savedAt || Date.now())) / 1000);
            totalSeconds = Math.max(30, savedTotalSeconds - elapsedSinceSave);
            autoAdvanceImage = state.autoAdvanceImage || false;
            filenameAnsMode = state.filenameAnsMode || false;
            subjectTimerMode = state.subjectTimerMode || false;
            subjectTimerSeconds = state.subjectTimerSeconds || { physics: 0, maths: 0, chemistry: 0 };
            subjectTimerLocked = state.subjectTimerLocked || { physics: false, maths: false, chemistry: false };
            physicsTxtAnswerKey = state.physicsTxtAnswerKey || '';
            mathsTxtAnswerKey = state.mathsTxtAnswerKey || '';
            chemistryTxtAnswerKey = state.chemistryTxtAnswerKey || '';
            physicsQuestionTypes = state.physicsQuestionTypes || [];
            mathsQuestionTypes = state.mathsQuestionTypes || [];
            chemistryQuestionTypes = state.chemistryQuestionTypes || [];
            jsonModeEnabled = state.jsonModeEnabled || false;
            if (jsonModeEnabled && state.jsonQuestions) {
                jsonQuestions = state.jsonQuestions;
            }

            // Restore answers, marks, time
            physicsAnswers = [...(state.physicsAnswers || new Array(physicsCount).fill(''))];
            mathsAnswers = [...(state.mathsAnswers || new Array(mathsCount).fill(''))];
            chemistryAnswers = [...(state.chemistryAnswers || new Array(chemistryCount).fill(''))];
            physicsMarked = [...(state.physicsMarked || new Array(physicsCount).fill(false))];
            mathsMarked = [...(state.mathsMarked || new Array(mathsCount).fill(false))];
            chemistryMarked = [...(state.chemistryMarked || new Array(chemistryCount).fill(false))];
            timeSpent = [...(state.timeSpent || new Array(totalQuestions).fill(0))];

            // Navigation state
            currentQuestion = state.currentQuestion || 1;
            currentSubject = state.currentSubject || 'physics';
            currentImageIndex = state.currentImageIndex || 0;
            subjectMemory = JSON.parse(JSON.stringify(state.subjectMemory || {
                physics: { lastQuestion: 1, lastImageIndex: 0 },
                maths: { lastQuestion: null, lastImageIndex: 0 },
                chemistry: { lastQuestion: null, lastImageIndex: 0 }
            }));
                        
                        // ------------------------------------------------------------
            // Timer aur subject zero-question handling
            // ------------------------------------------------------------
            // Zero-question subjects ko force lock karo aur unka time zero rakho
            if (physicsCount === 0) {
                subjectTimerLocked.physics = true;
                subjectTimerSeconds.physics = 0;
            }
            if (mathsCount === 0) {
                subjectTimerLocked.maths = true;
                subjectTimerSeconds.maths = 0;
            }
            if (chemistryCount === 0) {
                subjectTimerLocked.chemistry = true;
                subjectTimerSeconds.chemistry = 0;
            }
            
            // Agar subject timer mode on hai to totalSeconds ko subject times ke sum se set karo
            if (subjectTimerMode) {
                totalSeconds = subjectTimerSeconds.physics + subjectTimerSeconds.maths + subjectTimerSeconds.chemistry;
            } else {
                // Agar overall timer mode hai to savedTotalSeconds use karo, lekin kam se kam 30 seconds rakho agar koi question ho
                if (totalQuestions > 0 && totalSeconds < 30) {
                    totalSeconds = 30; // prevent immediate expiry
                }
            }
            
            // Current subject ko validate karo: agar current subject zero questions ka hai ya locked hai to doosra subject chuno
            const subjectsOrder = ['physics', 'maths', 'chemistry'];
            let validSubject = null;
            for (let s of subjectsOrder) {
                const count = s === 'physics' ? physicsCount : s === 'maths' ? mathsCount : chemistryCount;
                if (count > 0 && !subjectTimerLocked[s]) {
                    validSubject = s;
                    break;
                }
            }
            // Agar koi unlocked subject nahi mila to pehla non-zero subject le lo (locked ho sakta hai, par timer expire ho chuka hai)
            if (!validSubject) {
                for (let s of subjectsOrder) {
                    const count = s === 'physics' ? physicsCount : s === 'maths' ? mathsCount : chemistryCount;
                    if (count > 0) {
                        validSubject = s;
                        break;
                    }
                }
            }
            // Agar koi bhi subject non-zero nahi hai to test resume hi mat karo
            if (!validSubject) {
                alert('Saved test mein koi question nahi hai. Resume cancel kiya ja raha hai.');
                clearAutoSave();
                startNewTest();
                return;
            }
            
            // Current subject ko set karo
            currentSubject = validSubject;
            
            // Subject timer mode mein currentSubjectSeconds set karo
            if (subjectTimerMode) {
                currentSubjectSeconds = subjectTimerSeconds[currentSubject];
            }
            
            // Current question number ko validate karo
            if (currentSubject === 'physics') {
                if (currentQuestion < 1 || currentQuestion > physicsCount) currentQuestion = 1;
            } else if (currentSubject === 'maths') {
                const startMaths = physicsCount + 1;
                const endMaths = physicsCount + mathsCount;
                if (currentQuestion < startMaths || currentQuestion > endMaths) currentQuestion = startMaths;
            } else if (currentSubject === 'chemistry') {
                const startChem = physicsCount + mathsCount + 1;
                if (currentQuestion < startChem || currentQuestion > totalQuestions) currentQuestion = startChem;
            }
            
            // Subject memory update karo taaki zero-question subjects ka lastQuestion null ho
            if (physicsCount === 0 && subjectMemory.physics) subjectMemory.physics.lastQuestion = null;
            if (mathsCount === 0 && subjectMemory.maths) subjectMemory.maths.lastQuestion = null;
            if (chemistryCount === 0 && subjectMemory.chemistry) subjectMemory.chemistry.lastQuestion = null;
            
            // 2. Restore images from re-select
            const hasBatches = Object.values(state.batchMeta || {}).some(arr => arr.length > 0);

            if (hasBatches) {
                // Rebuild folderBatches from saved metadata + newly selected images
                ['physics', 'maths', 'chemistry'].forEach(s => {
                    const savedBatches = state.batchMeta[s] || [];
                    folderBatches[s] = savedBatches.map((bMeta, bi) => {
                        const imgs = (reselBatchLoaded[s]?.[bi] || []).map(img => ({
                            name: img.name, dataURL: img.dataURL
                        }));
                        return {
                            label: bMeta.label,
                            images: imgs,
                            answerKey: bMeta.answerKey || ''
                        };
                    });
                    syncBatchesToLoadedImages(s);
                    if (typeof updateBatchUI === 'function') updateBatchUI(s);
                });
            } else {
                // Regular images
                ['physics', 'maths', 'chemistry'].forEach(s => {
                    const imgs = reselLoaded[s] || [];
                    if (s === 'physics') loadedPhysicsImages = imgs.map(i => ({ name: i.name, dataURL: i.dataURL }));
                    else if (s === 'maths') loadedMathsImages = imgs.map(i => ({ name: i.name, dataURL: i.dataURL }));
                    else loadedChemistryImages = imgs.map(i => ({ name: i.name, dataURL: i.dataURL }));

                    // Answer images
                    const ansImgs = reselAnswerLoaded[s] || [];
                    if (s === 'physics') loadedPhysicsAnswers = ansImgs.map(i => ({ name: i.name, dataURL: i.dataURL }));
                    else if (s === 'maths') loadedMathsAnswers = ansImgs.map(i => ({ name: i.name, dataURL: i.dataURL }));
                    else loadedChemistryAnswers = ansImgs.map(i => ({ name: i.name, dataURL: i.dataURL }));
                });
            }

            // 3. Re-detect images
            detectAvailableImages();

            // 4. Restore UI
            document.getElementById('resume-banner').style.display = 'none';
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('test-container').style.display = 'block';

            // UI labels
            document.getElementById('display-user-name').textContent = userName;
            document.getElementById('display-user-name-instructions').textContent = userName;
            document.getElementById('results-user-name').textContent = userName;
            document.getElementById('results-test-name').textContent = testName;

            const timeText = customTime >= 60 ?
                `${Math.floor(customTime/60)} hour${customTime >= 120 ? 's' : ''} ${customTime%60} min` :
                `${customTime} minutes`;
            document.getElementById('test-config-summary').textContent =
                `Custom Test (Resumed) | ${totalQuestions} Questions | ${timeText}`;
            document.getElementById('test-config-summary-instructions').textContent =
                `Custom Test (Resumed) | ${totalQuestions} Questions | ${timeText}`;
            document.getElementById('test-stats').textContent =
                `Physics: ${physicsCount} | Maths: ${mathsCount} | Chemistry: ${chemistryCount}`;
            document.getElementById('test-stats-instructions').textContent =
                `Physics: ${physicsCount} | Maths: ${mathsCount} | Chemistry: ${chemistryCount}`;
            document.getElementById('total-time-minutes').textContent = customTime;
            document.getElementById('physics-max').textContent = physicsCount;
            document.getElementById('maths-start').textContent = physicsCount + 1;
            document.getElementById('maths-max').textContent = physicsCount + mathsCount;
            document.getElementById('chemistry-start').textContent = physicsCount + mathsCount + 1;
            document.getElementById('chemistry-max').textContent = totalQuestions;
            document.getElementById('palette-physics-max').textContent = physicsCount;
            document.getElementById('palette-maths-start').textContent = physicsCount + 1;
            document.getElementById('palette-maths-max').textContent = physicsCount + mathsCount;
            document.getElementById('palette-chemistry-start').textContent = physicsCount + mathsCount + 1;
            document.getElementById('palette-chemistry-max').textContent = totalQuestions;
            document.getElementById('physics-key-count').textContent = physicsCount;
            document.getElementById('maths-key-count').textContent = mathsCount;
            document.getElementById('chemistry-key-count').textContent = chemistryCount;
            document.getElementById('physics-answers-input').maxLength = physicsCount;
            document.getElementById('maths-answers-input').maxLength = mathsCount;
            document.getElementById('chemistry-answers-input').maxLength = chemistryCount;
            document.getElementById('physics-answers-input').placeholder = 'A'.repeat(physicsCount);
            document.getElementById('maths-answers-input').placeholder = 'A'.repeat(mathsCount);
            document.getElementById('chemistry-answers-input').placeholder = 'A'.repeat(chemistryCount);

            // 5. Init palette
            initQuestionPalette();
            updatePalette();

            // 6. Load current question
            loadQuestion(currentQuestion);

            // 7. Restore timer with remaining seconds
            updateTimerDisplay();
            timerInterval = setInterval(updateTimer, 1000);
            testStarted = true;
            testSubmitted = false;
            startTime = new Date(Date.now() - ((customTime * 60 - totalSeconds) * 1000));

            // 8. Start auto-save again
            startAutoSave();

            alert(`✅ Test resume ho gaya! Q${currentQuestion} se shuru kar rahe hain.`);
        }

        // ========================================================
        // ===== HOOK INTO EXISTING FUNCTIONS =====
        // ========================================================

        // Patch startTest to begin auto-save
        const _origStartTest = startTest;
        startTest = function() {
            clearAutoSave(); // clear any old save before new test
            _origStartTest.apply(this, arguments);
            startAutoSave();
            autoSaveState(); // immediate save on start
        };

        // Patch startNewTest to clear auto-save
        const _origStartNewTest = startNewTest;
        startNewTest = function() {
            clearAutoSave();
            _origStartNewTest.apply(this, arguments);
        };

        // Patch submitTest to clear auto-save when test is submitted
        const _origSubmitTest = submitTest;
        submitTest = function() {
            clearAutoSave();
            _origSubmitTest.apply(this, arguments);
        };

        // Check on load
        document.addEventListener('DOMContentLoaded', function() {
            // Small delay to let other DOMContentLoaded handlers run first
            setTimeout(checkAutoSave, 300);
        });
        


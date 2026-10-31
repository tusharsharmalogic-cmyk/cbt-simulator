// Extracted from imu.html lines 3401-3459
        // Export test history to JSON file
function exportHistory() {
    if (testHistory.length === 0) {
        alert('Koi history available nahi hai export karne ke liye.');
        return;
    }
    const dataStr = JSON.stringify(testHistory, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jee_test_history_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Import history from JSON file and merge
function importHistory() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const imported = JSON.parse(ev.target.result);
                if (!Array.isArray(imported)) {
                    alert('Invalid history file: JSON array expected.');
                    return;
                }
                // Merge with existing history (avoid duplicates based on date string)
                const merged = [...testHistory];
                imported.forEach(item => {
                    // Check if same test already exists (by date + totalScore)
                    const exists = merged.some(ex => 
                        ex.date === item.date && 
                        ex.totalScore === item.totalScore && 
                        ex.testName === item.testName
                    );
                    if (!exists) merged.push(item);
                });
                // Sort by date descending (latest first)
                merged.sort((a, b) => new Date(b.date) - new Date(a.date));
                testHistory = merged;
                saveTestHistory();
                // Refresh history display
                showTestHistory(); 
                alert(`History successfully merged! Total tests: ${testHistory.length}`);
            } catch (err) {
                alert('Error parsing file: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}


// Extracted from imu.html lines 3563-3581
        // Load Test History from localStorage
        function loadTestHistory() {
            const savedHistory = localStorage.getItem('jeeTestHistory');
            if (savedHistory) {
                try {
                    testHistory = JSON.parse(savedHistory);
                    console.log('Loaded test history from localStorage:', testHistory);
                } catch (e) {
                    console.error('Error loading test history:', e);
                    testHistory = [];
                }
            }
        }
        
        // Save Test History to localStorage
        function saveTestHistory() {
            localStorage.setItem('jeeTestHistory', JSON.stringify(testHistory));
        }


// Extracted from imu.html lines 4108-5017
        // ===== SAVE/LOAD NOTES =====
        function saveNote(index) {
            const ta = document.getElementById('note-input-' + index);
            if (!ta || !testHistory[index]) return;
            testHistory[index].notes = ta.value.trim();
            saveTestHistory();
            const display = document.getElementById('note-display-' + index);
            if (display) {
                display.style.display = testHistory[index].notes ? 'block' : 'none';
                display.textContent = '📝 ' + testHistory[index].notes;
            }
            ta.style.display = 'none';
            document.getElementById('note-save-btn-' + index).style.display = 'none';
            document.getElementById('note-edit-btn-' + index).style.display = 'inline-block';
        }

        function editNote(index) {
            const ta = document.getElementById('note-input-' + index);
            const saveBtn = document.getElementById('note-save-btn-' + index);
            const editBtn = document.getElementById('note-edit-btn-' + index);
            if (ta) { ta.style.display = 'block'; ta.focus(); }
            if (saveBtn) saveBtn.style.display = 'inline-block';
            if (editBtn) editBtn.style.display = 'none';
        }
        
        // Add current test to history
        function addTestToHistory(testData) {
            testHistory.unshift(testData); // Add to beginning (latest first)
            
            // Keep only last 20 tests to avoid localStorage overflow
            if (testHistory.length > 20) {
                testHistory = testHistory.slice(0, 20);
            }
            
            saveTestHistory();
        }
        
        // Format date for display
        function formatDate(date) {
            const d = new Date(date);
            return d.toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
        
        // Format time from seconds to MM:SS
        function formatTimeFromSeconds(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        
        // Display Test History Modal
        function showTestHistory() {
            const historyList = document.getElementById('history-list');
            historyList.innerHTML = '';
            
            if (testHistory.length === 0) {
                historyList.innerHTML = '<div class="history-empty">📭 No test history found. Complete a test to see it here!</div>';
                document.getElementById('trend-section').style.display = 'none';
                document.getElementById('wrong-images-section').style.display = 'none';
                document.getElementById('history-modal').style.display = 'flex';
                return;
            }

            // Draw trend graph and wrong image tracker
            setTimeout(() => {
                drawTrendGraph();
                buildWrongImagesTracker();
            }, 50);
            
            testHistory.forEach((test, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.setAttribute('data-index', index);
                
                const dateStr = formatDate(test.date);
                const totalScore = test.totalScore || 0;
                const maxMarks = test.maxMarks || (test.totalQuestions * 4) || 300;
                const totalQuestions = test.totalQuestions || 75;
                
                let subjectsHtml = '';
                if (test.subjectScores) {
                    const physicsTime = test.subjectTimeSpent ? formatTimeFromSeconds(test.subjectTimeSpent.physics) : '--';
                    const mathsTime = test.subjectTimeSpent ? formatTimeFromSeconds(test.subjectTimeSpent.maths) : '--';
                    const chemistryTime = test.subjectTimeSpent ? formatTimeFromSeconds(test.subjectTimeSpent.chemistry) : '--';
                    
                    subjectsHtml = `
                        <div class="history-subjects">
                            <div class="history-subject-item">
                                <span>Physics</span>
                                <span class="history-subject-score">${test.subjectScores.physics || 0} (⏱️ ${physicsTime})</span>
                            </div>
                            <div class="history-subject-item">
                                <span>Maths</span>
                                <span class="history-subject-score">${test.subjectScores.maths || 0} (⏱️ ${mathsTime})</span>
                            </div>
                            <div class="history-subject-item">
                                <span>Chemistry</span>
                                <span class="history-subject-score">${test.subjectScores.chemistry || 0} (⏱️ ${chemistryTime})</span>
                            </div>
                        </div>
                    `;
                }

                // Notes section
                const savedNote = test.notes || '';
                const notesHtml = `
                    <div class="test-notes-section">
                        <div class="note-label">📝 Notes:</div>
                        <div class="saved-note-display" id="note-display-${index}" style="display:${savedNote ? 'block' : 'none'};">${savedNote ? '📝 ' + savedNote : ''}</div>
                        <textarea id="note-input-${index}" style="display:${savedNote ? 'none' : 'block'};" placeholder="Is test ke baare mein kuch likho... (mood, mistakes, tips)">${savedNote}</textarea>
                        <button class="save-note-btn" id="note-save-btn-${index}" style="display:${savedNote ? 'none' : 'inline-block'};" onclick="saveNote(${index})">💾 Save Note</button>
                        <button class="save-note-btn" id="note-edit-btn-${index}" style="display:${savedNote ? 'inline-block' : 'none'}; background:#ff9800;" onclick="editNote(${index})">✏️ Edit Note</button>
                    </div>
                `;
                
                historyItem.innerHTML = `
                    <div style="flex: 1; width:100%;">
                        <div class="history-date">📅 ${dateStr}${test.testName ? ` | 📝 ${test.testName}` : ''}</div>
                        <div style="display: flex; gap: 20px; margin-top: 5px; flex-wrap: wrap;">
                            <div><strong>Score:</strong> <span class="history-score">${totalScore}/${maxMarks}</span></div>
                            <div><strong>Accuracy:</strong> ${test.accuracy || 0}%</div>
                            <div><strong>Time:</strong> ${test.timeTaken || '00:00'}</div>
                        </div>
                        ${subjectsHtml}
                        ${notesHtml}
                    </div>
                    <div class="history-actions" style="align-self:flex-start; margin-top:8px;">
                        <button class="history-action-btn history-view-btn" onclick="viewTestFromHistory(${index})">View</button>
                        <button class="history-action-btn history-compare-btn" onclick="selectForComparison(${index})">Compare</button>
                        <button class="history-action-btn history-delete-btn" onclick="deleteFromHistory(${index})">Delete</button>
                    </div>
                `;
                
                historyList.appendChild(historyItem);
            });
            
            document.getElementById('history-modal').style.display = 'flex';
        }
        
        // View test from history
        function viewTestFromHistory(index) {
            const test = testHistory[index];
            if (!test) return;
            
            // Extract counts at function scope so all blocks can use them
            const histPhysicsCount = test.physicsCount || 0;
            const histMathsCount = test.mathsCount || 0;
            const histChemistryCount = test.chemistryCount || 0;
            
            // Populate results with test data
            document.getElementById('results-user-name').textContent = test.userName || 'Student';
            document.getElementById('results-test-name').textContent = test.testName || 'Test';
            const displayMaxMarks = test.maxMarks || (test.totalQuestions * 4) || 300;
            document.getElementById('total-score').textContent = `${test.totalScore || 0}/${displayMaxMarks}`;
            document.getElementById('total-correct').textContent = test.totalCorrect || 0;
            document.getElementById('total-incorrect').textContent = test.totalIncorrect || 0;
            document.getElementById('total-unattempted').textContent = test.totalUnattempted || 0;
            document.getElementById('total-marked').textContent = test.totalMarked || 0;
            document.getElementById('accuracy').textContent = (test.accuracy || 0) + '%';
            document.getElementById('time-taken').textContent = test.timeTaken || '00:00';
            
            // Subject wise
            if (test.subjectScores) {
                document.getElementById('physics-total').textContent = test.physicsCount || 0;
                document.getElementById('physics-score').textContent = test.subjectScores.physics || 0;
                document.getElementById('physics-correct').textContent = test.physicsCorrect || 0;
                document.getElementById('physics-incorrect').textContent = test.physicsIncorrect || 0;
                document.getElementById('physics-marked').textContent = test.physicsMarked || 0;
                document.getElementById('physics-accuracy').textContent = (test.physicsAccuracy || 0) + '%';
                
                document.getElementById('maths-total').textContent = test.mathsCount || 0;
                document.getElementById('maths-score').textContent = test.subjectScores.maths || 0;
                document.getElementById('maths-correct').textContent = test.mathsCorrect || 0;
                document.getElementById('maths-incorrect').textContent = test.mathsIncorrect || 0;
                document.getElementById('maths-marked').textContent = test.mathsMarked || 0;
                document.getElementById('maths-accuracy').textContent = (test.mathsAccuracy || 0) + '%';
                
                document.getElementById('chemistry-total').textContent = test.chemistryCount || 0;
                document.getElementById('chemistry-score').textContent = test.subjectScores.chemistry || 0;
                document.getElementById('chemistry-correct').textContent = test.chemistryCorrect || 0;
                document.getElementById('chemistry-incorrect').textContent = test.chemistryIncorrect || 0;
                document.getElementById('chemistry-marked').textContent = test.chemistryMarked || 0;
                document.getElementById('chemistry-accuracy').textContent = (test.chemistryAccuracy || 0) + '%';
            }
            
            // Populate Time Spent Analysis if data exists
            const timeSpentResults = document.getElementById('time-spent-results');
            timeSpentResults.innerHTML = '';
            
            if (test.questionTimeSpent && test.questionTimeSpent.length > 0) {
                const maxTimeSpent = Math.max(...test.questionTimeSpent);
                const totalQuestions = test.totalQuestions || test.questionTimeSpent.length;
                
                // Answer arrays for status display
                const hPhysicsAnswers = test.physicsAnswers || [];
                const hMathsAnswers = test.mathsAnswers || [];
                const hChemistryAnswers = test.chemistryAnswers || [];
                const hPhysicsMarked = test.physicsMarkedArray || [];
                const hMathsMarked = test.mathsMarkedArray || [];
                const hChemistryMarked = test.chemistryMarkedArray || [];
                
                for (let i = 0; i < totalQuestions; i++) {
                    const row = document.createElement('tr');
                    const timeValue = test.questionTimeSpent[i] || 0;
                    const percentage = maxTimeSpent > 0 ? (timeValue / maxTimeSpent) * 100 : 0;
                    
                    let subject = '';
                    let status = 'Unattempted';
                    let rowIsMarked = false;
                    
                    if (i < histPhysicsCount) {
                        subject = 'Physics';
                        rowIsMarked = hPhysicsMarked[i] || false;
                        status = rowIsMarked ? 'Marked' : (hPhysicsAnswers[i] ? 'Answered' : 'Unattempted');
                    } else if (i < histPhysicsCount + histMathsCount) {
                        subject = 'Mathematics';
                        const mi = i - histPhysicsCount;
                        rowIsMarked = hMathsMarked[mi] || false;
                        status = rowIsMarked ? 'Marked' : (hMathsAnswers[mi] ? 'Answered' : 'Unattempted');
                    } else {
                        subject = 'Chemistry';
                        const ci = i - histPhysicsCount - histMathsCount;
                        rowIsMarked = hChemistryMarked[ci] || false;
                        status = rowIsMarked ? 'Marked' : (hChemistryAnswers[ci] ? 'Answered' : 'Unattempted');
                    }
                    
                    const minutes = Math.floor(timeValue / 60);
                    const seconds = timeValue % 60;
                    const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    
                    row.innerHTML = `
                        <td>${i + 1}</td>
                        <td>${subject}</td>
                        <td>${timeFormatted}</td>
                        <td>
                            <div class="time-bar-container">
                                <div class="time-bar" style="width: ${percentage}%"></div>
                            </div>
                        </td>
                        <td class="${rowIsMarked ? 'warning' : ''}">${status}</td>
                    `;
                    
                    timeSpentResults.appendChild(row);
                }
            }
            
            // Populate Detailed Question-wise Analysis if data exists
            const detailedResults = document.getElementById('detailed-results');
            detailedResults.innerHTML = '';
            
            if (test.physicsAnswers && test.physicsKey) {
                const physicsAnswers = test.physicsAnswers || [];
                const mathsAnswers = test.mathsAnswers || [];
                const chemistryAnswers = test.chemistryAnswers || [];
                const physicsKey = test.physicsKey || [];
                const mathsKey = test.mathsKey || [];
                const chemistryKey = test.chemistryKey || [];
                const physicsMarked = test.physicsMarkedArray || [];
                const mathsMarked = test.mathsMarkedArray || [];
                const chemistryMarked = test.chemistryMarkedArray || [];
                
                // Physics questions — use histPhysicsCount (from test data)
                function histImgBadge(imgName, status, isMarked) {
                    let color = '#888';
                    if (isMarked && status !== 'Correct' && status !== 'Incorrect') color = '#e65100';
                    if (status === 'Correct') color = '#2e7d32';
                    if (status === 'Incorrect') color = '#c62828';
                    return `<span style="font-size:12px;font-family:monospace;font-weight:600;color:${color};background:${color}18;padding:2px 7px;border-radius:4px;border:1px solid ${color}44;">${imgName || '-'}</span>`;
                }

                for (let i = 0; i < histPhysicsCount; i++) {
                    const row = document.createElement('tr');
                    const userAnswer = physicsAnswers[i] || '';
                    const keyEntry = physicsKey[i] || '';
                    const correctAnswer = (typeof keyEntry === 'object') ? (keyEntry.answer || '') : keyEntry;
                    const isNumeric = (typeof keyEntry === 'object') && keyEntry.type === 'numeric';
                    let status = '', score = 0;
                    const isMarked = physicsMarked[i];
                    const imgName = (test.physicsImageNames && test.physicsImageNames[i]) ? test.physicsImageNames[i] : '-';
                    
                    if (userAnswer === '') {
                        status = 'Unattempted'; score = 0;
                    } else if (isNumeric ? parseInt(userAnswer) === parseInt(correctAnswer) : userAnswer === correctAnswer) {
                        status = 'Correct'; score = 4;
                    } else {
                        status = 'Incorrect'; score = -1;
                    }
                    
                    row.innerHTML = `
                        <td>Physics</td>
                        <td>${i + 1}${isNumeric ? ' <span style="font-size:10px;background:#e91e63;color:white;padding:1px 4px;border-radius:3px;">INT</span>' : ''}</td>
                        <td>${histImgBadge(imgName, status, isMarked)}</td>
                        <td>${userAnswer || '-'}</td>
                        <td>${correctAnswer || '-'}</td>
                        <td class="${status === 'Correct' ? 'success' : status === 'Incorrect' ? 'highlight' : ''}">${status}</td>
                        <td class="${score > 0 ? 'success' : score < 0 ? 'highlight' : ''}">${score > 0 ? '+' : ''}${score}</td>
                        <td class="${isMarked ? 'warning' : ''}">${isMarked ? 'Yes' : 'No'}</td>
                    `;
                    detailedResults.appendChild(row);
                }
                
                // Maths questions
                for (let i = 0; i < histMathsCount; i++) {
                    const row = document.createElement('tr');
                    const userAnswer = mathsAnswers[i] || '';
                    const keyEntry = mathsKey[i] || '';
                    const correctAnswer = (typeof keyEntry === 'object') ? (keyEntry.answer || '') : keyEntry;
                    const isNumeric = (typeof keyEntry === 'object') && keyEntry.type === 'numeric';
                    let status = '', score = 0;
                    const isMarked = mathsMarked[i];
                    const imgName = (test.mathsImageNames && test.mathsImageNames[i]) ? test.mathsImageNames[i] : '-';
                    
                    if (userAnswer === '') {
                        status = 'Unattempted'; score = 0;
                    } else if (isNumeric ? parseInt(userAnswer) === parseInt(correctAnswer) : userAnswer === correctAnswer) {
                        status = 'Correct'; score = 4;
                    } else {
                        status = 'Incorrect'; score = -1;
                    }
                    
                    row.innerHTML = `
                        <td>Mathematics</td>
                        <td>${i + 1}${isNumeric ? ' <span style="font-size:10px;background:#e91e63;color:white;padding:1px 4px;border-radius:3px;">INT</span>' : ''}</td>
                        <td>${histImgBadge(imgName, status, isMarked)}</td>
                        <td>${userAnswer || '-'}</td>
                        <td>${correctAnswer || '-'}</td>
                        <td class="${status === 'Correct' ? 'success' : status === 'Incorrect' ? 'highlight' : ''}">${status}</td>
                        <td class="${score > 0 ? 'success' : score < 0 ? 'highlight' : ''}">${score > 0 ? '+' : ''}${score}</td>
                        <td class="${isMarked ? 'warning' : ''}">${isMarked ? 'Yes' : 'No'}</td>
                    `;
                    detailedResults.appendChild(row);
                }
                
                // Chemistry questions
                for (let i = 0; i < histChemistryCount; i++) {
                    const row = document.createElement('tr');
                    const userAnswer = chemistryAnswers[i] || '';
                    const keyEntry = chemistryKey[i] || '';
                    const correctAnswer = (typeof keyEntry === 'object') ? (keyEntry.answer || '') : keyEntry;
                    const isNumeric = (typeof keyEntry === 'object') && keyEntry.type === 'numeric';
                    let status = '', score = 0;
                    const isMarked = chemistryMarked[i];
                    const imgName = (test.chemistryImageNames && test.chemistryImageNames[i]) ? test.chemistryImageNames[i] : '-';
                    
                    if (userAnswer === '') {
                        status = 'Unattempted'; score = 0;
                    } else if (isNumeric ? parseInt(userAnswer) === parseInt(correctAnswer) : userAnswer === correctAnswer) {
                        status = 'Correct'; score = 4;
                    } else {
                        status = 'Incorrect'; score = -1;
                    }
                    
                    row.innerHTML = `
                        <td>Chemistry</td>
                        <td>${i + 1}${isNumeric ? ' <span style="font-size:10px;background:#e91e63;color:white;padding:1px 4px;border-radius:3px;">INT</span>' : ''}</td>
                        <td>${histImgBadge(imgName, status, isMarked)}</td>
                        <td>${userAnswer || '-'}</td>
                        <td>${correctAnswer || '-'}</td>
                        <td class="${status === 'Correct' ? 'success' : status === 'Incorrect' ? 'highlight' : ''}">${status}</td>
                        <td class="${score > 0 ? 'success' : score < 0 ? 'highlight' : ''}">${score > 0 ? '+' : ''}${score}</td>
                        <td class="${isMarked ? 'warning' : ''}">${isMarked ? 'Yes' : 'No'}</td>
                    `;
                    detailedResults.appendChild(row);
                }
            }

            // Hide history modal and show results
            document.getElementById('history-modal').style.display = 'none';
            document.getElementById('results-modal').style.display = 'flex';

            // ===== REBUILD GRAPH DATA FROM HISTORY =====
            const hPhysicsCount2 = test.physicsCount || 0;
            const hMathsCount2   = test.mathsCount   || 0;
            const hChemistryCount2 = test.chemistryCount || 0;

            const hPhysicsAnswers2  = test.physicsAnswers  || [];
            const hMathsAnswers2    = test.mathsAnswers    || [];
            const hChemistryAnswers2= test.chemistryAnswers|| [];
            const hPhysicsKey2  = test.physicsKey  || [];
            const hMathsKey2    = test.mathsKey    || [];
            const hChemistryKey2= test.chemistryKey|| [];
            const hTimeSpent2   = test.questionTimeSpent || [];

            let hCumScore2 = 0;
            const hTimelineScore2   = [];
            const hTimelineCorrect2 = [];
            const hQuestionLabels2  = [];

            for (let i = 0; i < hPhysicsCount2; i++) {
                const ua = hPhysicsAnswers2[i] || '';
                const ke = hPhysicsKey2[i] || '';
                const ca = typeof ke === 'object' ? ke.answer : ke;
                const isNum = typeof ke === 'object' && ke.type === 'numeric';
                let s = 0;
                if (ua !== '') s = (isNum ? parseInt(ua)===parseInt(ca) : ua===ca) ? 4 : -1;
                hCumScore2 += s;
                hTimelineScore2.push(hCumScore2);
                hTimelineCorrect2.push(s > 0 ? 1 : s < 0 ? -1 : 0);
                hQuestionLabels2.push('P' + (i+1));
            }
            for (let i = 0; i < hMathsCount2; i++) {
                const ua = hMathsAnswers2[i] || '';
                const ke = hMathsKey2[i] || '';
                const ca = typeof ke === 'object' ? ke.answer : ke;
                const isNum = typeof ke === 'object' && ke.type === 'numeric';
                let s = 0;
                if (ua !== '') s = (isNum ? parseInt(ua)===parseInt(ca) : ua===ca) ? 4 : -1;
                hCumScore2 += s;
                hTimelineScore2.push(hCumScore2);
                hTimelineCorrect2.push(s > 0 ? 1 : s < 0 ? -1 : 0);
                hQuestionLabels2.push('M' + (i+1));
            }
            for (let i = 0; i < hChemistryCount2; i++) {
                const ua = hChemistryAnswers2[i] || '';
                const ke = hChemistryKey2[i] || '';
                const ca = typeof ke === 'object' ? ke.answer : ke;
                const isNum = typeof ke === 'object' && ke.type === 'numeric';
                let s = 0;
                if (ua !== '') s = (isNum ? parseInt(ua)===parseInt(ca) : ua===ca) ? 4 : -1;
                hCumScore2 += s;
                hTimelineScore2.push(hCumScore2);
                hTimelineCorrect2.push(s > 0 ? 1 : s < 0 ? -1 : 0);
                hQuestionLabels2.push('C' + (i+1));
            }

            const hPhysicsCorrect2    = test.physicsCorrect    || 0;
            const hPhysicsIncorrect2  = test.physicsIncorrect  || 0;
            const hMathsCorrect2      = test.mathsCorrect      || 0;
            const hMathsIncorrect2    = test.mathsIncorrect    || 0;
            const hChemistryCorrect2  = test.chemistryCorrect  || 0;
            const hChemistryIncorrect2= test.chemistryIncorrect|| 0;
            const hPhysicsAccuracy2   = test.physicsAccuracy   || 0;
            const hMathsAccuracy2     = test.mathsAccuracy     || 0;
            const hChemistryAccuracy2 = test.chemistryAccuracy || 0;
            const hSubjectTime2       = test.subjectTimeSpent  || {physics:0, maths:0, chemistry:0};

            const hSubjData2 = {
                labels: ['Physics','Maths','Chemistry'],
                correct:     [hPhysicsCorrect2,   hMathsCorrect2,   hChemistryCorrect2],
                incorrect:   [hPhysicsIncorrect2, hMathsIncorrect2, hChemistryIncorrect2],
                unattempted: [
                    hPhysicsCount2   - hPhysicsCorrect2   - hPhysicsIncorrect2,
                    hMathsCount2     - hMathsCorrect2     - hMathsIncorrect2,
                    hChemistryCount2 - hChemistryCorrect2 - hChemistryIncorrect2
                ],
                accuracy: [hPhysicsAccuracy2, hMathsAccuracy2, hChemistryAccuracy2],
                avgTime: [
                    (hPhysicsCorrect2+hPhysicsIncorrect2) > 0 ? +((hSubjectTime2.physics||0)/(hPhysicsCorrect2+hPhysicsIncorrect2)/60).toFixed(2) : 0,
                    (hMathsCorrect2+hMathsIncorrect2)     > 0 ? +((hSubjectTime2.maths||0)/(hMathsCorrect2+hMathsIncorrect2)/60).toFixed(2) : 0,
                    (hChemistryCorrect2+hChemistryIncorrect2) > 0 ? +((hSubjectTime2.chemistry||0)/(hChemistryCorrect2+hChemistryIncorrect2)/60).toFixed(2) : 0
                ]
            };

            const hTimeData2 = hTimeSpent2.map((t, i) => ({ sec: t, label: hQuestionLabels2[i] || ('Q'+(i+1)) }));

            function drawHistoryGraph2(tab) {
                const canvas = document.getElementById('result-graph-canvas');
                const legendEl = document.getElementById('result-graph-legend');
                if (!canvas) return;
                const isDark = document.body.classList.contains('dark-mode');
                const dpr = window.devicePixelRatio || 1;
                const cssW = canvas.parentElement ? (canvas.parentElement.clientWidth - 28) : (canvas.offsetWidth || 500);
                const cssH = 300;
                canvas.width  = Math.round(cssW * dpr);
                canvas.height = Math.round(cssH * dpr);
                canvas.style.width  = cssW + 'px';
                canvas.style.height = cssH + 'px';
                const ctx = canvas.getContext('2d');
                ctx.setTransform(1,0,0,1,0,0);
                ctx.scale(dpr, dpr);
                ctx.clearRect(0, 0, cssW, cssH);
                // All drawing uses CSS pixel dimensions
                const W = cssW, H = cssH;

                const padL=48, padR=20, padT=28, padB=40;
                const gW=W-padL-padR, gH=H-padT-padB;

                const bg = ctx.createLinearGradient(0,padT,0,padT+gH);
                bg.addColorStop(0, isDark?'#12122a':'#f0f2ff');
                bg.addColorStop(1, isDark?'#1a1a2e':'#f8f9ff');
                ctx.fillStyle=bg; ctx.fillRect(padL,padT,gW,gH);

                const tooltip = document.getElementById('result-graph-tooltip');

                if (tab === 'timeline') {
                    legendEl.innerHTML = `
                        <div class="cleg-item"><span class="cleg-dot" style="background:#3f51b5"></span>Cumulative Score</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#4caf50"></span>Correct +4</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#f44336"></span>Incorrect -1</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#9e9e9e"></span>Skipped 0</div>`;

                    const nQ = hTimelineScore2.length;
                    if (nQ === 0) return;
                    const minS = Math.min(0, ...hTimelineScore2);
                    const maxS = Math.max(...hTimelineScore2, 4);
                    const range = maxS - minS || 1;

                    function xQ(i) { return padL + (nQ===1 ? gW/2 : (i/(nQ-1))*gW); }
                    function yS(v) { return padT + gH - ((v-minS)/range)*gH; }

                    if (minS < 0) {
                        const yz = yS(0);
                        ctx.strokeStyle = isDark?'#555':'#ccc'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
                        ctx.beginPath(); ctx.moveTo(padL,yz); ctx.lineTo(padL+gW,yz); ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.fillStyle='#999'; ctx.font='9px sans-serif'; ctx.textAlign='right';
                        ctx.fillText('0', padL-4, yz+3);
                    }

                    const yTicks = 5;
                    for (let i=0;i<=yTicks;i++) {
                        const v = minS + (range/yTicks)*i;
                        const y = yS(v);
                        ctx.strokeStyle=isDark?'#252540':'#e4e6f8'; ctx.lineWidth=1; ctx.setLineDash([]);
                        ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+gW,y); ctx.stroke();
                        ctx.fillStyle=isDark?'#888':'#aaa'; ctx.font='9px sans-serif'; ctx.textAlign='right';
                        ctx.fillText(Math.round(v), padL-4, y+3);
                    }

                    const subjColors = ['#3f51b520','#ff980020','#4caf5020'];
                    const subjNames  = ['Physics','Maths','Chemistry'];
                    const starts     = [0, hPhysicsCount2, hPhysicsCount2+hMathsCount2];
                    starts.forEach((s,si) => {
                        const end = si===0?hPhysicsCount2 : si===1?hPhysicsCount2+hMathsCount2 : nQ;
                        if (s >= end) return;
                        const x1 = xQ(s), x2 = xQ(end-1);
                        ctx.fillStyle = subjColors[si];
                        ctx.fillRect(x1, padT, x2-x1, gH);
                        ctx.fillStyle = isDark?'#aaa':'#777';
                        ctx.font='bold 9px sans-serif'; ctx.textAlign='center';
                        ctx.fillText(subjNames[si], (x1+x2)/2, padT+10);
                    });

                    [hPhysicsCount2, hPhysicsCount2+hMathsCount2].forEach(d => {
                        if (d >= nQ || d <= 0) return;
                        const x = xQ(d);
                        ctx.strokeStyle=isDark?'#444':'#ccc'; ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
                        ctx.beginPath(); ctx.moveTo(x,padT); ctx.lineTo(x,padT+gH); ctx.stroke();
                        ctx.setLineDash([]);
                    });

                    hTimelineCorrect2.forEach((c,i) => {
                        const x=xQ(i), y=yS(hTimelineScore2[i]);
                        if (c===1) { ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fillStyle='#4caf5066'; ctx.fill(); }
                        else if (c===-1) { ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fillStyle='#f4433666'; ctx.fill(); }
                    });

                    ctx.strokeStyle='#3f51b5'; ctx.lineWidth=2.5;
                    ctx.lineJoin='round'; ctx.lineCap='round'; ctx.setLineDash([]);
                    ctx.beginPath();
                    hTimelineScore2.forEach((v,i) => {
                        const x=xQ(i), y=yS(v);
                        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
                    });
                    ctx.stroke();

                    ctx.fillStyle=isDark?'#aaa':'#555'; ctx.font='8px sans-serif'; ctx.textAlign='center';
                    const step = Math.max(1, Math.floor(nQ/10));
                    for (let i=0;i<nQ;i+=step) ctx.fillText(hQuestionLabels2[i], xQ(i), padT+gH+14);

                    const maxIdx = hTimelineScore2.indexOf(Math.max(...hTimelineScore2));
                    const mx2=xQ(maxIdx), my2=yS(hTimelineScore2[maxIdx]);
                    ctx.fillStyle='#ffd700'; ctx.font='14px sans-serif'; ctx.textAlign='center';
                    ctx.fillText('⭐', mx2, my2-12);

                    ctx.strokeStyle=isDark?'#333':'#c8ccea'; ctx.lineWidth=1.5; ctx.setLineDash([]);
                    ctx.strokeRect(padL,padT,gW,gH);

                    canvas.onmousemove = function(e) {
                        const rect=canvas.getBoundingClientRect();
                        const mx=e.clientX-rect.left;
                        let ci=0, md=Infinity;
                        for(let i=0;i<nQ;i++){const d=Math.abs(xQ(i)-mx);if(d<md){md=d;ci=i;}}
                        if(md>30){tooltip.style.display='none';return;}
                        const sc=hTimelineScore2[ci], cor=hTimelineCorrect2[ci];
                        const status=cor===1?'✅ Correct +4':cor===-1?'❌ Incorrect -1':'⏭️ Skipped';
                        const wRect=canvas.parentElement.getBoundingClientRect();
                        let tx=(e.clientX-wRect.left)+14, ty=(e.clientY-wRect.top)-20;
                        const tw=tooltip.offsetWidth||160;
                        if(tx+tw>wRect.width-10) tx=(e.clientX-wRect.left)-tw-14;
                        tooltip.innerHTML=`<div class="tt-title">${hQuestionLabels2[ci]}</div><div class="tt-row">${status}</div><div class="tt-row">Cumulative: <b>${sc}</b></div>`;
                        tooltip.style.left=tx+'px'; tooltip.style.top=Math.max(0,ty)+'px'; tooltip.style.display='block';
                    };
                    canvas.onmouseleave=()=>{tooltip.style.display='none';};
                    canvas.ontouchmove=function(e){e.preventDefault();const t=e.touches[0];canvas.onmousemove({clientX:t.clientX,clientY:t.clientY});};
                    canvas.ontouchend=()=>{setTimeout(()=>{tooltip.style.display='none';},1500);};
                }

                else if (tab === 'subjects') {
                    legendEl.innerHTML = `
                        <div class="cleg-item"><span class="cleg-dot" style="background:#4caf50"></span>Correct</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#f44336"></span>Incorrect</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#9e9e9e"></span>Unattempted</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#3f51b5"></span>Accuracy %</div>`;

                    const maxQ = Math.max(hPhysicsCount2, hMathsCount2, hChemistryCount2) || 1;
                    const bw = (gW / 3) * 0.6;
                    function xSub(i) { return padL + (gW/3)*(i+0.5); }

                    for (let i=0;i<=5;i++) {
                        const v = Math.round((maxQ/5)*i);
                        const y = padT + gH - (v/maxQ)*gH;
                        ctx.strokeStyle=isDark?'#252540':'#e4e6f8'; ctx.lineWidth=1; ctx.setLineDash([]);
                        ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+gW,y); ctx.stroke();
                        ctx.fillStyle=isDark?'#888':'#aaa'; ctx.font='9px sans-serif'; ctx.textAlign='right';
                        ctx.fillText(v, padL-4, y+3);
                    }

                    hSubjData2.labels.forEach((name,si) => {
                        const cx = xSub(si);
                        const cor = hSubjData2.correct[si];
                        const inc = hSubjData2.incorrect[si];
                        const una = hSubjData2.unattempted[si];

                        let yTop = padT+gH;
                        [[cor,'#4caf50'],[inc,'#f44336'],[una,'#9e9e9e']].forEach(([v,col]) => {
                            const bh = (v/maxQ)*gH;
                            ctx.fillStyle = col;
                            ctx.fillRect(cx-bw/2, yTop-bh, bw, bh);
                            if (bh > 14) {
                                ctx.fillStyle='#fff'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
                                ctx.fillText(v, cx, yTop-bh/2+4);
                            }
                            yTop -= bh;
                        });

                        const accY = padT + gH - (hSubjData2.accuracy[si]/100)*gH;
                        ctx.beginPath(); ctx.arc(cx, accY, 7, 0, Math.PI*2);
                        ctx.fillStyle='#3f51b5'; ctx.fill();
                        ctx.fillStyle='#fff'; ctx.font='bold 8px sans-serif'; ctx.textAlign='center';
                        ctx.fillText(hSubjData2.accuracy[si]+'%', cx, accY+3);

                        ctx.fillStyle=isDark?'#ddd':'#333'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
                        ctx.fillText(name, cx, padT+gH+18);
                    });

                    ctx.strokeStyle='#3f51b5'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
                    ctx.beginPath();
                    hSubjData2.labels.forEach((_,si) => {
                        const cx=xSub(si), ay=padT+gH-(hSubjData2.accuracy[si]/100)*gH;
                        if(si===0) ctx.moveTo(cx,ay); else ctx.lineTo(cx,ay);
                    });
                    ctx.stroke(); ctx.setLineDash([]);

                    ctx.strokeStyle=isDark?'#333':'#c8ccea'; ctx.lineWidth=1.5;
                    ctx.strokeRect(padL,padT,gW,gH);

                    canvas.onmousemove = function(e) {
                        const rect=canvas.getBoundingClientRect();
                        const mx=e.clientX-rect.left;
                        let ci=-1, md=Infinity;
                        for(let i=0;i<3;i++){const d=Math.abs(xSub(i)-mx);if(d<md){md=d;ci=i;}}
                        if(md>gW/3){tooltip.style.display='none';return;}
                        const wRect=canvas.parentElement.getBoundingClientRect();
                        let tx=(e.clientX-wRect.left)+14, ty=(e.clientY-wRect.top)-20;
                        const tw=tooltip.offsetWidth||160;
                        if(tx+tw>wRect.width-10) tx=(e.clientX-wRect.left)-tw-14;
                        tooltip.innerHTML=`<div class="tt-title">${hSubjData2.labels[ci]}</div>
                            <div class="tt-row"><span class="tt-dot" style="background:#4caf50"></span>Correct: <b>${hSubjData2.correct[ci]}</b></div>
                            <div class="tt-row"><span class="tt-dot" style="background:#f44336"></span>Incorrect: <b>${hSubjData2.incorrect[ci]}</b></div>
                            <div class="tt-row"><span class="tt-dot" style="background:#9e9e9e"></span>Skipped: <b>${hSubjData2.unattempted[ci]}</b></div>
                            <div class="tt-row"><span class="tt-dot" style="background:#3f51b5"></span>Accuracy: <b>${hSubjData2.accuracy[ci]}%</b></div>
                            <div class="tt-row">⏱️ Avg: <b>${hSubjData2.avgTime[ci].toFixed(2)} min/Q</b></div>`;
                        tooltip.style.left=tx+'px'; tooltip.style.top=Math.max(0,ty)+'px'; tooltip.style.display='block';
                    };
                    canvas.onmouseleave=()=>{tooltip.style.display='none';};
                    canvas.ontouchmove=function(e){e.preventDefault();const t=e.touches[0];canvas.onmousemove({clientX:t.clientX,clientY:t.clientY});};
                    canvas.ontouchend=()=>{setTimeout(()=>{tooltip.style.display='none';},1500);};
                }

                else if (tab === 'time') {
                    legendEl.innerHTML = `
                        <div class="cleg-item"><span class="cleg-dot" style="background:#3f51b5"></span>Time spent (sec)</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#e91e63"></span>Avg time line</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#4caf50"></span>Correct</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#f44336"></span>Incorrect</div>`;

                    const nQ = hTimeData2.length;
                    if(nQ===0) return;
                    const maxT = Math.max(...hTimeData2.map(d=>d.sec), 1);
                    const avgT = hTimeData2.reduce((a,d)=>a+d.sec,0)/nQ;

                    // Bar width + gap based layout — each bar gets equal slot
                    const slotW = gW / nQ;
                    const bw2 = Math.max(2, slotW * 0.65);
                    function xT(i) { return padL + slotW * i + slotW / 2; }
                    function yT(v) { return padT + gH - (v/maxT)*gH; }

                    // Y gridlines
                    for (let i=0;i<=4;i++) {
                        const v = Math.round((maxT/4)*i);
                        const y = padT+gH-(v/maxT)*gH;
                        ctx.strokeStyle=isDark?'#252540':'#e4e6f8'; ctx.lineWidth=1; ctx.setLineDash([]);
                        ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+gW,y); ctx.stroke();
                        ctx.fillStyle=isDark?'#888':'#aaa'; ctx.font='9px sans-serif'; ctx.textAlign='right';
                        ctx.fillText(v+'s', padL-4, y+3);
                    }

                    // Avg line
                    const ay = yT(avgT);
                    ctx.strokeStyle='#e91e63aa'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
                    ctx.beginPath(); ctx.moveTo(padL,ay); ctx.lineTo(padL+gW,ay); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle='#e91e63'; ctx.font='bold 9px sans-serif'; ctx.textAlign='left';
                    ctx.fillText('avg '+Math.round(avgT)+'s', padL+4, ay-4);

                    // Draw bars — one per question
                    hTimeData2.forEach((d,i) => {
                        const x=xT(i), bh=Math.max(1,(d.sec/maxT)*gH);
                        const c = hTimelineCorrect2[i];
                        ctx.fillStyle = c===1?'#4caf5099':c===-1?'#f4433699':'#9e9e9e66';
                        ctx.fillRect(x - bw2/2, padT+gH-bh, bw2, bh);
                    });

                    // Line over bars
                    ctx.strokeStyle='#3f51b5'; ctx.lineWidth=1.8; ctx.lineJoin='round'; ctx.lineCap='round'; ctx.setLineDash([]);
                    ctx.beginPath();
                    hTimeData2.forEach((d,i) => {
                        const x=xT(i), y=yT(d.sec);
                        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
                    });
                    ctx.stroke();

                    // Dots on line
                    hTimeData2.forEach((d,i) => {
                        const x=xT(i), y=yT(d.sec);
                        ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2);
                        ctx.fillStyle='#3f51b5'; ctx.fill();
                    });

                    // X labels — show every nth to avoid overlap
                    const step2 = Math.max(1, Math.floor(nQ/12));
                    ctx.fillStyle=isDark?'#aaa':'#555'; ctx.font='8px sans-serif'; ctx.textAlign='center';
                    for(let i=0;i<nQ;i+=step2) ctx.fillText(hTimeData2[i].label, xT(i), padT+gH+14);

                    ctx.strokeStyle=isDark?'#333':'#c8ccea'; ctx.lineWidth=1.5; ctx.setLineDash([]);
                    ctx.strokeRect(padL,padT,gW,gH);

                    canvas.onmousemove=function(e){
                        const rect=canvas.getBoundingClientRect();
                        const mx=e.clientX-rect.left;
                        let ci=0, md=Infinity;
                        for(let i=0;i<nQ;i++){const d=Math.abs(xT(i)-mx);if(d<md){md=d;ci=i;}}
                        if(md>30){tooltip.style.display='none';return;}
                        const c=hTimelineCorrect2[ci];
                        const status=c===1?'✅ Correct':c===-1?'❌ Incorrect':'⏭️ Skipped';
                        const wRect=canvas.parentElement.getBoundingClientRect();
                        let tx=(e.clientX-wRect.left)+14, ty=(e.clientY-wRect.top)-20;
                        const tw=tooltip.offsetWidth||160;
                        if(tx+tw>wRect.width-10) tx=(e.clientX-wRect.left)-tw-14;
                        tooltip.innerHTML=`<div class="tt-title">${hTimeData2[ci].label}</div><div class="tt-row">${status}</div><div class="tt-row">⏱️ Time: <b>${hTimeData2[ci].sec}s</b></div><div class="tt-row">vs avg: <b>${hTimeData2[ci].sec>avgT?'+':''}${Math.round(hTimeData2[ci].sec-avgT)}s</b></div>`;
                        tooltip.style.left=tx+'px'; tooltip.style.top=Math.max(0,ty)+'px'; tooltip.style.display='block';
                    };
                    canvas.onmouseleave=()=>{tooltip.style.display='none';};
                    canvas.ontouchmove=function(e){e.preventDefault();const t=e.touches[0];canvas.onmousemove({clientX:t.clientX,clientY:t.clientY});};
                    canvas.ontouchend=()=>{setTimeout(()=>{tooltip.style.display='none';},1500);};
                }

                ctx.strokeStyle=isDark?'#333':'#c8ccea'; ctx.lineWidth=1.5; ctx.setLineDash([]);
                ctx.strokeRect(padL,padT,gW,gH);
            }

            // Override global graph tab functions to use history draw
            window._drawResultGraph = drawHistoryGraph2;
            window._currentResultTab = 'timeline';
            window._switchResultTabFn = function(tab, e) {
                window._currentResultTab = tab;
                document.querySelectorAll('#result-graph-tabs .gtab').forEach(b => b.classList.remove('active'));
                if (e && e.target) e.target.classList.add('active');
                setTimeout(() => drawHistoryGraph2(tab), 20);
            };
            window.switchResultTab = window._switchResultTabFn;

            // Reset tab buttons
            document.querySelectorAll('#result-graph-tabs .gtab').forEach(b => b.classList.remove('active'));
            const firstTab2 = document.querySelector('#result-graph-tabs .gtab');
            if (firstTab2) firstTab2.classList.add('active');

            // Draw after modal is visible
            setTimeout(() => drawHistoryGraph2('timeline'), 100);
        }
        
        // Variables for comparison
        let comparisonTests = [];
        
        // Select test for comparison
        function selectForComparison(index) {
            const test = testHistory[index];
            if (!test) return;
            
            if (comparisonTests.length >= 2) {
                alert('You can only compare two tests at a time. Please clear selection first.');
                return;
            }
            
            comparisonTests.push(test);
            
            // Highlight selected test
            const items = document.querySelectorAll('.history-item');
            items.forEach(item => {
                if (parseInt(item.getAttribute('data-index')) === index) {
                    item.classList.add('selected');
                }
            });
            
            if (comparisonTests.length === 2) {
                showComparison();
            }
        }
        
        // Show comparison of two tests
        function showComparison() {
            if (comparisonTests.length !== 2) return;
            
            const test1 = comparisonTests[0];
            const test2 = comparisonTests[1];
            
            const comparisonContent = document.getElementById('comparison-content');
            comparisonContent.innerHTML = `
                <div class="comparison-card">
                    <h4>Test 1 - ${formatDate(test1.date)}</h4>
                    <div class="comparison-stat">
                        <span class="comparison-label">Total Score:</span>
                        <span class="comparison-value ${test1.totalScore > test2.totalScore ? 'winner-badge' : ''}">${test1.totalScore || 0}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-label">Physics:</span>
                        <span class="comparison-value ${(test1.subjectScores?.physics || 0) > (test2.subjectScores?.physics || 0) ? 'winner-badge' : ''}">${test1.subjectScores?.physics || 0}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-label">Mathematics:</span>
                        <span class="comparison-value ${(test1.subjectScores?.maths || 0) > (test2.subjectScores?.maths || 0) ? 'winner-badge' : ''}">${test1.subjectScores?.maths || 0}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-label">Chemistry:</span>
                        <span class="comparison-value ${(test1.subjectScores?.chemistry || 0) > (test2.subjectScores?.chemistry || 0) ? 'winner-badge' : ''}">${test1.subjectScores?.chemistry || 0}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-label">Accuracy:</span>
                        <span class="comparison-value ${(test1.accuracy || 0) > (test2.accuracy || 0) ? 'winner-badge' : ''}">${test1.accuracy || 0}%</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-label">Time Taken:</span>
                        <span class="comparison-value">${test1.timeTaken || '00:00'}</span>
                    </div>
                </div>
                <div class="comparison-card">
                    <h4>Test 2 - ${formatDate(test2.date)}</h4>
                    <div class="comparison-stat">
                        <span class="comparison-label">Total Score:</span>
                        <span class="comparison-value ${test2.totalScore > test1.totalScore ? 'winner-badge' : ''}">${test2.totalScore || 0}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-label">Physics:</span>
                        <span class="comparison-value ${(test2.subjectScores?.physics || 0) > (test1.subjectScores?.physics || 0) ? 'winner-badge' : ''}">${test2.subjectScores?.physics || 0}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-label">Mathematics:</span>
                        <span class="comparison-value ${(test2.subjectScores?.maths || 0) > (test1.subjectScores?.maths || 0) ? 'winner-badge' : ''}">${test2.subjectScores?.maths || 0}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-label">Chemistry:</span>
                        <span class="comparison-value ${(test2.subjectScores?.chemistry || 0) > (test1.subjectScores?.chemistry || 0) ? 'winner-badge' : ''}">${test2.subjectScores?.chemistry || 0}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-label">Accuracy:</span>
                        <span class="comparison-value ${(test2.accuracy || 0) > (test1.accuracy || 0) ? 'winner-badge' : ''}">${test2.accuracy || 0}%</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-label">Time Taken:</span>
                        <span class="comparison-value">${test2.timeTaken || '00:00'}</span>
                    </div>
                </div>
            `;
            
            // Show comparison modal
            document.getElementById('comparison-modal').style.display = 'flex';
            
            // Clear selection
            document.querySelectorAll('.history-item').forEach(item => {
                item.classList.remove('selected');
            });
            comparisonTests = [];
        }
        
        // Delete test from history
        function deleteFromHistory(index) {
            if (confirm('Are you sure you want to delete this test from history?')) {
                testHistory.splice(index, 1);
                saveTestHistory();
                showTestHistory(); // Refresh the history list
            }
        }
        
        // Clear all history
        function clearAllHistory() {
            if (confirm('Are you sure you want to delete ALL test history? This cannot be undone!')) {
                testHistory = [];
                saveTestHistory();
                showTestHistory();
            }
        }
        


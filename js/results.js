// Extracted from imu.html lines 7051-8409
        function submitTest(autoSubmit = false) {
            if (testSubmitted) return;
            
            if (!autoSubmit && !confirm("Are you sure you want to submit the test? You cannot return to the test after submission.")) {
                return;
            }
            
            // Stop timer
            clearInterval(timerInterval);
            
            // Record time spent on current question
            const now = new Date();
            const timeElapsed = Math.floor((now - questionStartTime) / 1000);
            timeSpent[currentQuestion - 1] += timeElapsed;
            
            // Mark test as submitted
            testSubmitted = true;
            
            // Lock all UI elements
            document.querySelectorAll('.option').forEach(option => {
                option.style.pointerEvents = 'none';
            });
            
            document.querySelectorAll('.palette-btn').forEach(btn => {
                btn.style.pointerEvents = 'none';
            });
            
            document.getElementById('prev-btn').disabled = true;
            document.getElementById('next-btn').disabled = true;
            document.getElementById('mark-review-btn').disabled = true;
            document.getElementById('submit-btn').disabled = true;
            document.getElementById('prev-image-btn').disabled = true;
            document.getElementById('next-image-btn').disabled = true;

            // JSON MODE: skip submission modal, auto-compute keys and show results
            if (jsonModeEnabled) {
                function buildJsonKey(subject) {
                    return (jsonQuestions[subject] || []).map(q => ({
                        type: q.type || 'mcq',
                        answer: String(q.answer || '').toUpperCase()
                    }));
                }
                if (jsonQuestions.physics.length > 0) physicsKey = buildJsonKey('physics');
                if (jsonQuestions.maths.length > 0)   mathsKey   = buildJsonKey('maths');
                if (jsonQuestions.chemistry.length > 0) chemistryKey = buildJsonKey('chemistry');
                calculateAndDisplayResults();
                document.getElementById('results-modal').style.display = 'flex';
                setTimeout(() => { if(window._drawResultGraph) window._drawResultGraph('timeline'); }, 80);
                return;
            }
            
            // Load answer key images and inputs
            loadAnswerKeyInputs();
            
            // Show submission modal
            document.getElementById('submission-modal').style.display = 'flex';
        }
        
        // Load answer key images and inputs
        function loadAnswerKeyInputs() {
            // Clear previous images
            document.getElementById('physics-answer-images').innerHTML = '';
            document.getElementById('maths-answer-images').innerHTML = '';
            document.getElementById('chemistry-answer-images').innerHTML = '';
            
            // Load answer key images for Physics
            physicsAnswerImages.forEach((img, index) => {
                const imgElement = document.createElement('img');
                imgElement.src = img.path;
                imgElement.alt = `Physics Answer Key ${index + 1}`;
                imgElement.className = 'answer-key-image';
                document.getElementById('physics-answer-images').appendChild(imgElement);
            });
            
            // Load answer key images for Maths
            mathsAnswerImages.forEach((img, index) => {
                const imgElement = document.createElement('img');
                imgElement.src = img.path;
                imgElement.alt = `Maths Answer Key ${index + 1}`;
                imgElement.className = 'answer-key-image';
                document.getElementById('maths-answer-images').appendChild(imgElement);
            });
            
            // Load answer key images for Chemistry
            chemistryAnswerImages.forEach((img, index) => {
                const imgElement = document.createElement('img');
                imgElement.src = img.path;
                imgElement.alt = `Chemistry Answer Key ${index + 1}`;
                imgElement.className = 'answer-key-image';
                document.getElementById('chemistry-answer-images').appendChild(imgElement);
            });
            
            // Parse question types from txt keys
            applyParsedQuestionTypes();

            // Helper: setup submission modal for a subject
            function setupSubjectAnswerKey(subject, count, types, txtKey) {
                const mcqCount = types.filter(t => t.type === 'mcq').length;
                const numCount = types.filter(t => t.type === 'numeric').length;

                document.getElementById(`${subject}-key-count`).textContent = count;
                document.getElementById(`${subject}-mcq-key-count`).textContent = mcqCount;
                document.getElementById(`${subject}-mcq-key-count2`).textContent = mcqCount;

                // Auto-fill MCQ answers (only A/B/C/D chars from parsed)
                const mcqAnswerStr = types.filter(t => t.type === 'mcq').map(t => t.answer).join('');
                const inputEl = document.getElementById(`${subject}-answers-input`);
                inputEl.maxLength = mcqCount;
                inputEl.placeholder = Array(mcqCount + 1).join('A');
                
                // Auto-fill if: txt key exists OR folder batches exist OR filename mode is on
                const hasFolderBatches = folderBatches[subject] && folderBatches[subject].length > 0;
                const shouldAutoFill = txtKey || hasFolderBatches || filenameAnsMode;
                if (shouldAutoFill && mcqAnswerStr.length > 0) {
                    inputEl.value = mcqAnswerStr;
                    document.getElementById(`${subject}-answers-length`).textContent = mcqAnswerStr.length;
                }

                // Setup numeric inputs if any
                const numSection = document.getElementById(`${subject}-numeric-section`);
                const numInputsContainer = document.getElementById(`${subject}-numeric-inputs`);
                numInputsContainer.innerHTML = '';
                if (numCount > 0) {
                    numSection.style.display = 'block';
                    let numIdx = 0;
                    types.forEach((qt, idx) => {
                        if (qt.type === 'numeric') {
                            numIdx++;
                            const item = document.createElement('div');
                            item.className = 'numeric-answer-item';
                            const lbl = document.createElement('label');
                            lbl.textContent = `Q${idx + 1} (N${numIdx})`;
                            const inp = document.createElement('input');
                            inp.type = 'text';
                            inp.id = `${subject}-numeric-ans-${idx}`;
                            inp.placeholder = '0';
                            if (shouldAutoFill && qt.answer) inp.value = qt.answer;
                            item.appendChild(lbl);
                            item.appendChild(inp);
                            numInputsContainer.appendChild(item);
                        }
                    });
                } else {
                    numSection.style.display = 'none';
                }
            }

            setupSubjectAnswerKey('physics', physicsCount, physicsQuestionTypes, physicsTxtAnswerKey);
            setupSubjectAnswerKey('maths', mathsCount, mathsQuestionTypes, mathsTxtAnswerKey);
            setupSubjectAnswerKey('chemistry', chemistryCount, chemistryQuestionTypes, chemistryTxtAnswerKey);
        }
        
        // Cancel submit (go back to test)
        function cancelSubmit() {
            // Only allow cancel if test is not submitted
            if (!testSubmitted) {
                // Hide modal
                document.getElementById('submission-modal').style.display = 'none';
                
                // Re-enable UI
                document.querySelectorAll('.option').forEach(option => {
                    option.style.pointerEvents = 'auto';
                });
                
                document.querySelectorAll('.palette-btn').forEach(btn => {
                    btn.style.pointerEvents = 'auto';
                });
                
                document.getElementById('prev-btn').disabled = false;
                document.getElementById('next-btn').disabled = false;
                document.getElementById('mark-review-btn').disabled = false;
                // Reset checkbox and keep submit locked
                const confirmCheck = document.getElementById('submit-confirm-check');
                if (confirmCheck) { confirmCheck.checked = false; }
                document.getElementById('submit-btn').disabled = true;
                document.getElementById('submit-btn').style.opacity = '0.4';
                document.getElementById('submit-btn').style.cursor = 'not-allowed';
                document.getElementById('prev-image-btn').disabled = false;
                document.getElementById('next-image-btn').disabled = false;
                
                // Restart timer
                startTimer();
            }
        }
        
        // Calculate results
        function calculateResults() {
            // Get MCQ answer keys from inputs
            const physicsAnswerStr = document.getElementById('physics-answers-input').value.trim().toUpperCase();
            const mathsAnswerStr = document.getElementById('maths-answers-input').value.trim().toUpperCase();
            const chemistryAnswerStr = document.getElementById('chemistry-answers-input').value.trim().toUpperCase();
            
            // Count MCQ questions in each subject
            const physicsMCQCount = physicsQuestionTypes.filter(t => t.type === 'mcq').length;
            const mathsMCQCount = mathsQuestionTypes.filter(t => t.type === 'mcq').length;
            const chemistryMCQCount = chemistryQuestionTypes.filter(t => t.type === 'mcq').length;
            
            // Validate MCQ inputs
            if (physicsAnswerStr.length !== physicsMCQCount) {
                alert(`Physics: Please enter exactly ${physicsMCQCount} MCQ answers (A/B/C/D). You entered ${physicsAnswerStr.length}.`);
                return;
            }
            if (mathsAnswerStr.length !== mathsMCQCount) {
                alert(`Maths: Please enter exactly ${mathsMCQCount} MCQ answers (A/B/C/D). You entered ${mathsAnswerStr.length}.`);
                return;
            }
            if (chemistryAnswerStr.length !== chemistryMCQCount) {
                alert(`Chemistry: Please enter exactly ${chemistryMCQCount} MCQ answers (A/B/C/D). You entered ${chemistryAnswerStr.length}.`);
                return;
            }
            
            // Build full key arrays (MCQ + Numeric merged back by position)
            function buildFullKey(types, mcqStr, subject) {
                const fullKey = [];
                let mcqIdx = 0;
                types.forEach((qt, i) => {
                    if (qt.type === 'mcq') {
                        fullKey.push({ type: 'mcq', answer: mcqStr[mcqIdx] || '' });
                        mcqIdx++;
                    } else {
                        // Get numeric answer from input
                        const numInput = document.getElementById(`${subject}-numeric-ans-${i}`);
                        const numVal = numInput ? numInput.value.trim() : qt.answer || '';
                        fullKey.push({ type: 'numeric', answer: numVal });
                    }
                });
                return fullKey;
            }

            physicsKey = buildFullKey(physicsQuestionTypes, physicsAnswerStr, 'physics');
            mathsKey = buildFullKey(mathsQuestionTypes, mathsAnswerStr, 'maths');
            chemistryKey = buildFullKey(chemistryQuestionTypes, chemistryAnswerStr, 'chemistry');

            // JSON MODE: override keys from loaded question data
            if (jsonModeEnabled) {
                function buildJsonKey(subject) {
                    return (jsonQuestions[subject] || []).map(q => ({
                        type: q.type || 'mcq',
                        answer: String(q.answer || '').toUpperCase()
                    }));
                }
                if (jsonQuestions.physics.length > 0) physicsKey = buildJsonKey('physics');
                if (jsonQuestions.maths.length > 0)   mathsKey   = buildJsonKey('maths');
                if (jsonQuestions.chemistry.length > 0) chemistryKey = buildJsonKey('chemistry');
            }
            
            // Calculate and display results
            calculateAndDisplayResults();
            
            // Hide submission modal, show results modal
            document.getElementById('submission-modal').style.display = 'none';
            document.getElementById('results-modal').style.display = 'flex';
            // Draw result graphs now that modal is visible
            setTimeout(() => { if(window._drawResultGraph) window._drawResultGraph('timeline'); }, 80);
        }
        
        // Calculate and display results
        function calculateAndDisplayResults() {
            // Calculate results
            let totalCorrect = 0;
            let totalIncorrect = 0;
            let totalUnattempted = 0;
            let totalMarked = 0;
            
            let physicsCorrect = 0, physicsIncorrect = 0, physicsUnattempted = 0, physicsMarkedCount = 0;
            let mathsCorrect = 0, mathsIncorrect = 0, mathsUnattempted = 0, mathsMarkedCount = 0;
            let chemistryCorrect = 0, chemistryIncorrect = 0, chemistryUnattempted = 0, chemistryMarkedCount = 0;
            
            // Scoring helper: integer comparison, -1 for wrong (MCQ & Numeric both)
            function scoreQuestion(userAnswer, keyEntry, isMarked) {
                if (!userAnswer || userAnswer === '') return 'unattempted';
                if (keyEntry.type === 'numeric') {
                    const ua = userAnswer.trim();
                    const ca = (keyEntry.answer || '').trim();
                    if (ua === ca) return 'correct';
                    if (parseInt(ua, 10) === parseInt(ca, 10)) return 'correct';
                    return 'incorrect'; // -1 for wrong numeric too
                } else {
                    if (userAnswer === keyEntry.answer) return 'correct';
                    return 'incorrect';
                }
            }

            // Calculate physics results
            for (let i = 0; i < physicsCount; i++) {
                const userAnswer = physicsAnswers[i] || '';
                const keyEntry = physicsKey[i] || { type: 'mcq', answer: '' };
                if (physicsMarked[i]) physicsMarkedCount++;
                const result = scoreQuestion(userAnswer, keyEntry, physicsMarked[i]);
                if (result === 'correct') physicsCorrect++;
                else if (result === 'incorrect') physicsIncorrect++;
                else physicsUnattempted++;
            }
            
            // Calculate maths results
            for (let i = 0; i < mathsCount; i++) {
                const userAnswer = mathsAnswers[i] || '';
                const keyEntry = mathsKey[i] || { type: 'mcq', answer: '' };
                if (mathsMarked[i]) mathsMarkedCount++;
                const result = scoreQuestion(userAnswer, keyEntry, mathsMarked[i]);
                if (result === 'correct') mathsCorrect++;
                else if (result === 'incorrect') mathsIncorrect++;
                else mathsUnattempted++;
            }
            
            // Calculate chemistry results
            for (let i = 0; i < chemistryCount; i++) {
                const userAnswer = chemistryAnswers[i] || '';
                const keyEntry = chemistryKey[i] || { type: 'mcq', answer: '' };
                if (chemistryMarked[i]) chemistryMarkedCount++;
                const result = scoreQuestion(userAnswer, keyEntry, chemistryMarked[i]);
                if (result === 'correct') chemistryCorrect++;
                else if (result === 'incorrect') chemistryIncorrect++;
                else chemistryUnattempted++;
            }

            // More accurate scoring: compute per question with correct deduction logic
            let physicsScore = 0, mathsScore = 0, chemistryScore = 0;

            function calcSubjectScore(answers, keyArr, markedArr, count) {
                let score = 0;
                for (let i = 0; i < count; i++) {
                    const ua = answers[i] || '';
                    const ke = keyArr[i] || { type: 'mcq', answer: '' };
                    if (!ua) continue;
                    if (ke.type === 'numeric') {
                        const uNum = parseInt(ua.trim(), 10);
                        const cNum = parseInt((ke.answer || '').trim(), 10);
                        if (!isNaN(uNum) && !isNaN(cNum) && uNum === cNum) score += 4;
                        else score -= 1; // JEE Main: numeric wrong = -1
                    } else {
                        if (ua === ke.answer) score += 4;
                        else score -= 1;
                    }
                }
                return score;
            }

            physicsScore = calcSubjectScore(physicsAnswers, physicsKey, physicsMarked, physicsCount);
            mathsScore = calcSubjectScore(mathsAnswers, mathsKey, mathsMarked, mathsCount);
            chemistryScore = calcSubjectScore(chemistryAnswers, chemistryKey, chemistryMarked, chemistryCount);

            // Totals
            totalCorrect = physicsCorrect + mathsCorrect + chemistryCorrect;
            totalIncorrect = physicsIncorrect + mathsIncorrect + chemistryIncorrect;
            totalUnattempted = physicsUnattempted + mathsUnattempted + chemistryUnattempted;
            totalMarked = physicsMarkedCount + mathsMarkedCount + chemistryMarkedCount;
            
            const totalScore = physicsScore + mathsScore + chemistryScore;
            
            // Max marks: MCQ = 4 each, Numeric = 4 each
            const maxMarks = totalQuestions * 4;
            
            // Accuracy
            const physicsAnswered = physicsCorrect + physicsIncorrect;
            const physicsAccuracy = physicsAnswered > 0 ? Math.round((physicsCorrect / physicsAnswered) * 100) : 0;
            const mathsAnswered = mathsCorrect + mathsIncorrect;
            const mathsAccuracy = mathsAnswered > 0 ? Math.round((mathsCorrect / mathsAnswered) * 100) : 0;
            const chemistryAnswered = chemistryCorrect + chemistryIncorrect;
            const chemistryAccuracy = chemistryAnswered > 0 ? Math.round((chemistryCorrect / chemistryAnswered) * 100) : 0;
            const totalAnswered = totalCorrect + totalIncorrect;
            const totalAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
            
            // Calculate total time taken
            const now = new Date();
            const timeTakenSeconds = Math.floor((now - startTime) / 1000);
            const timeTakenMinutes = Math.floor(timeTakenSeconds / 60);
            const timeTakenHours = Math.floor(timeTakenMinutes / 60);
            const timeTakenFormatted = 
                `${timeTakenHours.toString().padStart(2, '0')}:${(timeTakenMinutes % 60).toString().padStart(2, '0')}:${(timeTakenSeconds % 60).toString().padStart(2, '0')}`;
            
            // Find max time spent for scaling
            const maxTimeSpent = Math.max(...timeSpent);
            
            // Display results
            document.getElementById('total-score').textContent = `${totalScore}/${maxMarks}`;
            document.getElementById('total-correct').textContent = totalCorrect;
            document.getElementById('total-incorrect').textContent = totalIncorrect;
            document.getElementById('total-unattempted').textContent = totalUnattempted;
            document.getElementById('total-marked').textContent = totalMarked;
            document.getElementById('accuracy').textContent = `${totalAccuracy}%`;
            document.getElementById('time-taken').textContent = timeTakenFormatted;
            
            // Display subject-wise results
            document.getElementById('physics-total').textContent = physicsCount;
            document.getElementById('physics-score').textContent = physicsScore;
            document.getElementById('physics-correct').textContent = physicsCorrect;
            document.getElementById('physics-incorrect').textContent = physicsIncorrect;
            document.getElementById('physics-marked').textContent = physicsMarkedCount;
            document.getElementById('physics-accuracy').textContent = `${physicsAccuracy}%`;
            
            document.getElementById('maths-total').textContent = mathsCount;
            document.getElementById('maths-score').textContent = mathsScore;
            document.getElementById('maths-correct').textContent = mathsCorrect;
            document.getElementById('maths-incorrect').textContent = mathsIncorrect;
            document.getElementById('maths-marked').textContent = mathsMarkedCount;
            document.getElementById('maths-accuracy').textContent = `${mathsAccuracy}%`;
            
            document.getElementById('chemistry-total').textContent = chemistryCount;
            document.getElementById('chemistry-score').textContent = chemistryScore;
            document.getElementById('chemistry-correct').textContent = chemistryCorrect;
            document.getElementById('chemistry-incorrect').textContent = chemistryIncorrect;
            document.getElementById('chemistry-marked').textContent = chemistryMarkedCount;
            document.getElementById('chemistry-accuracy').textContent = `${chemistryAccuracy}%`;
            
            // Generate time spent analysis
            const timeSpentResults = document.getElementById('time-spent-results');
            timeSpentResults.innerHTML = '';
            
            for (let i = 0; i < totalQuestions; i++) {
                const row = document.createElement('tr');
                const timeValue = timeSpent[i];
                const percentage = maxTimeSpent > 0 ? (timeValue / maxTimeSpent) * 100 : 0;
                
                let subject = '';
                let qNo = i + 1;
                let isMarked = false;
                let status = '';
                
                if (i < physicsCount) {
                    subject = 'Physics';
                    qNo = i + 1;
                    isMarked = physicsMarked[i];
                    status = physicsAnswers[i] ? 'Answered' : 'Unattempted';
                    if (isMarked) status = 'Marked';
                } else if (i < physicsCount + mathsCount) {
                    subject = 'Mathematics';
                    qNo = i - physicsCount + 1;
                    isMarked = mathsMarked[i - physicsCount];
                    status = mathsAnswers[i - physicsCount] ? 'Answered' : 'Unattempted';
                    if (isMarked) status = 'Marked';
                } else {
                    subject = 'Chemistry';
                    qNo = i - physicsCount - mathsCount + 1;
                    isMarked = chemistryMarked[i - physicsCount - mathsCount];
                    status = chemistryAnswers[i - physicsCount - mathsCount] ? 'Answered' : 'Unattempted';
                    if (isMarked) status = 'Marked';
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
                    <td class="${isMarked ? 'warning' : ''}">${status}</td>
                `;
                
                timeSpentResults.appendChild(row);
            }

            // ===== BEHAVIOUR TRACKER TABLE POPULATION =====
            const behaviourSection = document.getElementById('behaviour-tracker-section');
            const behaviourTbody = document.getElementById('behaviour-log-results');
            behaviourTbody.innerHTML = '';
            if (behaviourTrackerEnabled && behaviourLog.length > 0) {
                behaviourSection.style.display = 'block';

                // Helper: seconds -> MM:SS
                function fmtSec(s) {
                    const m = Math.floor(s / 60);
                    const sec = s % 60;
                    return `${m}:${sec.toString().padStart(2,'0')}`;
                }

                // Build a lookup: for each question, what was the final answer?
                function getFinalStatus(qNo) {
                    let ans = '', subj = '';
                    if (qNo <= physicsCount) {
                        ans = physicsAnswers[qNo - 1] || '';
                        subj = 'Phy';
                    } else if (qNo <= physicsCount + mathsCount) {
                        ans = mathsAnswers[qNo - physicsCount - 1] || '';
                        subj = 'Math';
                    } else {
                        ans = chemistryAnswers[qNo - physicsCount - mathsCount - 1] || '';
                        subj = 'Chem';
                    }
                    return { ans, subj };
                }

                // Determine correct answer for scoring badge
                function getCorrectAns(qNo) {
                    let keyEntry = '';
                    if (qNo <= physicsCount) keyEntry = physicsKey[qNo - 1] || '';
                    else if (qNo <= physicsCount + mathsCount) keyEntry = mathsKey[qNo - physicsCount - 1] || '';
                    else keyEntry = chemistryKey[qNo - physicsCount - mathsCount - 1] || '';
                    return (typeof keyEntry === 'object') ? (keyEntry.answer || '') : keyEntry;
                }

                let navCount = 0, selectCount = 0, deselectCount = 0;

                behaviourLog.forEach((ev, idx) => {
                    const tr = document.createElement('tr');

                    // Event badge
                    let eventBadge = '';
                    if (ev.eventType === 'navigate') {
                        navCount++;
                        eventBadge = `<span style="background:#3f51b5;color:white;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:700;">↕ Gaye</span>`;
                    } else if (ev.eventType === 'select') {
                        selectCount++;
                        eventBadge = `<span style="background:#2e7d32;color:white;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:700;">✔ Chuna</span>`;
                    } else {
                        deselectCount++;
                        eventBadge = `<span style="background:#c62828;color:white;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:700;">✖ Hataya</span>`;
                    }

                    // Direction arrow color
                    let dirStyle = 'color:#555;';
                    if (ev.direction === 'Aage (↓)') dirStyle = 'color:#2196f3;font-weight:700;';
                    else if (ev.direction === 'Peeche (↑)') dirStyle = 'color:#ff5722;font-weight:700;';

                    // Q Pe time coloring
                    const tSec = ev.timeOnQ || 0;
                    let timeColor = '#333';
                    if (tSec > 180) timeColor = '#c62828';
                    else if (tSec > 90) timeColor = '#e65100';
                    else if (tSec < 10 && ev.eventType === 'navigate') timeColor = '#9e9e9e';

                    // Final answer badge for fromQ
                    const fqInfo = getFinalStatus(ev.fromQ);
                    const correctAns = getCorrectAns(ev.fromQ);
                    let finalBadge = '';
                    if (fqInfo.ans) {
                        const isCorrect = correctAns && fqInfo.ans === correctAns;
                        const badgeColor = correctAns ? (isCorrect ? '#2e7d32' : '#c62828') : '#888';
                        finalBadge = `<span style="font-size:10px;background:${badgeColor}22;color:${badgeColor};border:1px solid ${badgeColor}55;padding:1px 5px;border-radius:3px;margin-left:4px;">${fqInfo.ans}${correctAns ? (isCorrect?' ✓':' ✗') : ''}</span>`;
                    } else {
                        finalBadge = `<span style="font-size:10px;color:#aaa;">—</span>`;
                    }

                    tr.style.background = idx % 2 === 0 ? 'white' : '#fce4ec22';
                    tr.innerHTML = `
                        <td style="text-align:center;font-weight:700;color:#888;">${idx + 1}</td>
                        <td>${eventBadge}</td>
                        <td style="font-weight:600;">Q${ev.fromQ} <span style="font-size:10px;color:#888;">(${fqInfo.subj})</span></td>
                        <td style="font-weight:600;">${ev.eventType === 'navigate' ? 'Q' + ev.toQ : '—'}</td>
                        <td style="${dirStyle}">${ev.direction}</td>
                        <td style="color:${timeColor};font-weight:700;">${fmtSec(tSec)}</td>
                        <td style="color:#555;">${fmtSec(ev.sinceStart)}</td>
                        <td>${ev.answerAtLeave} ${ev.eventType === 'navigate' ? finalBadge : ''}</td>
                    `;
                    behaviourTbody.appendChild(tr);
                });

                // Summary line
                const backCount = behaviourLog.filter(e => e.eventType === 'navigate' && e.direction === 'Peeche (↑)').length;
                const skipCount = behaviourLog.filter(e => e.eventType === 'navigate' && e.timeOnQ < 5).length;
                document.getElementById('behaviour-summary-text').textContent =
                    `📊 Kul ${navCount} navigation, ${selectCount} option select, ${deselectCount} option hataye | ` +
                    `Peeche gaye: ${backCount} baar | Bahut jaldi chhoda (<5s): ${skipCount} questions`;
            } else if (behaviourTrackerEnabled) {
                behaviourSection.style.display = 'block';
                behaviourTbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">Koi event record nahi hua.</td></tr>';
            } else {
                behaviourSection.style.display = 'none';
            }
            // ===== END BEHAVIOUR TRACKER =====
            
            // Generate detailed results table
            const detailedResults = document.getElementById('detailed-results');
            detailedResults.innerHTML = '';

            function imgBadge(imgName, status, isMarked) {
                let color = '#888';
                if (isMarked && status !== 'Correct' && status !== 'Incorrect') color = '#e65100';
                if (status === 'Correct') color = '#2e7d32';
                if (status === 'Incorrect') color = '#c62828';
                return `<span style="font-size:12px;font-family:monospace;font-weight:600;color:${color};background:${color}18;padding:2px 7px;border-radius:4px;border:1px solid ${color}44;">${imgName || '-'}</span>`;
            }
            
            // Physics questions
            for (let i = 0; i < physicsCount; i++) {
                const row = document.createElement('tr');
                const userAnswer = physicsAnswers[i] || '';
                const keyEntry = physicsKey[i] || '';
                const correctAnswer = (typeof keyEntry === 'object') ? (keyEntry.answer || '') : keyEntry;
                const isNumeric = (typeof keyEntry === 'object') && keyEntry.type === 'numeric';
                let status = '', score = 0;
                const isMarked = physicsMarked[i];
                const imgName = (physicsImages[i] && physicsImages[i].name) ? physicsImages[i].name : '-';
                
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
                    <td>${imgBadge(imgName, status, isMarked)}</td>
                    <td>${userAnswer || '-'}</td>
                    <td>${correctAnswer || '-'}</td>
                    <td class="${status === 'Correct' ? 'success' : status === 'Incorrect' ? 'highlight' : ''}">${status}</td>
                    <td class="${score > 0 ? 'success' : score < 0 ? 'highlight' : ''}">${score > 0 ? '+' : ''}${score}</td>
                    <td class="${isMarked ? 'warning' : ''}">${isMarked ? 'Yes' : 'No'}</td>
                `;
                detailedResults.appendChild(row);
            }
            
            // Maths questions
            for (let i = 0; i < mathsCount; i++) {
                const row = document.createElement('tr');
                const userAnswer = mathsAnswers[i] || '';
                const keyEntry = mathsKey[i] || '';
                const correctAnswer = (typeof keyEntry === 'object') ? (keyEntry.answer || '') : keyEntry;
                const isNumeric = (typeof keyEntry === 'object') && keyEntry.type === 'numeric';
                let status = '', score = 0;
                const isMarked = mathsMarked[i];
                const imgName = (mathsImages[i] && mathsImages[i].name) ? mathsImages[i].name : '-';
                
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
                    <td>${imgBadge(imgName, status, isMarked)}</td>
                    <td>${userAnswer || '-'}</td>
                    <td>${correctAnswer || '-'}</td>
                    <td class="${status === 'Correct' ? 'success' : status === 'Incorrect' ? 'highlight' : ''}">${status}</td>
                    <td class="${score > 0 ? 'success' : score < 0 ? 'highlight' : ''}">${score > 0 ? '+' : ''}${score}</td>
                    <td class="${isMarked ? 'warning' : ''}">${isMarked ? 'Yes' : 'No'}</td>
                `;
                detailedResults.appendChild(row);
            }
            
            // Chemistry questions
            for (let i = 0; i < chemistryCount; i++) {
                const row = document.createElement('tr');
                const userAnswer = chemistryAnswers[i] || '';
                const keyEntry = chemistryKey[i] || '';
                const correctAnswer = (typeof keyEntry === 'object') ? (keyEntry.answer || '') : keyEntry;
                const isNumeric = (typeof keyEntry === 'object') && keyEntry.type === 'numeric';
                let status = '', score = 0;
                const isMarked = chemistryMarked[i];
                const imgName = (chemistryImages[i] && chemistryImages[i].name) ? chemistryImages[i].name : '-';
                
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
                    <td>${imgBadge(imgName, status, isMarked)}</td>
                    <td>${userAnswer || '-'}</td>
                    <td>${correctAnswer || '-'}</td>
                    <td class="${status === 'Correct' ? 'success' : status === 'Incorrect' ? 'highlight' : ''}">${status}</td>
                    <td class="${score > 0 ? 'success' : score < 0 ? 'highlight' : ''}">${score > 0 ? '+' : ''}${score}</td>
                    <td class="${isMarked ? 'warning' : ''}">${isMarked ? 'Yes' : 'No'}</td>
                `;
                detailedResults.appendChild(row);
            }
            
            // === RESULT ANALYSIS GRAPHS ===

            // Quick-compute all the numbers we need
            const attemptedQuestions = totalAnswered;
            const totalTimeInSeconds = timeTakenSeconds;
            const avgTimePerQuestion = attemptedQuestions > 0 ? Math.floor(totalTimeInSeconds / attemptedQuestions) : 0;
            const avgMinutes = Math.floor(avgTimePerQuestion / 60);
            const avgSeconds = avgTimePerQuestion % 60;
            const avgTimeFormatted = `${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`;
            const efficiencyRate = attemptedQuestions > 0 ? Math.round((totalCorrect / attemptedQuestions) * 100) : 0;

            const physicsTimeSpent = timeSpent.slice(0, physicsCount).reduce((a,b)=>a+b,0);
            const mathsTimeSpent   = timeSpent.slice(physicsCount, physicsCount+mathsCount).reduce((a,b)=>a+b,0);
            const chemistryTimeSpent = timeSpent.slice(physicsCount+mathsCount).reduce((a,b)=>a+b,0);

            // ---- Stat Pills ----
            const pillsEl = document.getElementById('result-stat-pills');
            if (pillsEl) {
                const pills = [
                    { icon:'🏆', label:'Score',    val: totalScore + '/' + maxMarks,   cls:'blue'   },
                    { icon:'✅', label:'Correct',  val: totalCorrect,                   cls:'green'  },
                    { icon:'❌', label:'Wrong',    val: totalIncorrect,                 cls:'red'    },
                    { icon:'⏭️', label:'Skipped',  val: totalUnattempted,               cls:'orange' },
                    { icon:'🎯', label:'Accuracy', val: efficiencyRate + '%',           cls:'pink'   },
                    { icon:'⏱️', label:'Avg/Q',    val: avgTimeFormatted,               cls:'blue'   },
                ];
                pillsEl.innerHTML = pills.map(p =>
                    `<div class="stat-pill ${p.cls}"><span class="pill-icon">${p.icon}</span><span>${p.label}:</span><span class="pill-val">${p.val}</span></div>`
                ).join('');
            }

            // ---- Build per-question timeline data ----
            // cumulative score over questions 1..N
            let cumulativeScore = 0;
            const timelineScore = [];
            const timelineCorrect = [];   // 1/0/-1
            const questionLabels = [];

            // Physics
            for (let i = 0; i < physicsCount; i++) {
                const ua = physicsAnswers[i] || '';
                const ke = physicsKey[i] || '';
                const ca = typeof ke === 'object' ? ke.answer : ke;
                const isNum = typeof ke === 'object' && ke.type === 'numeric';
                let s = 0;
                if (ua !== '') s = (isNum ? parseInt(ua)===parseInt(ca) : ua===ca) ? 4 : -1;
                cumulativeScore += s;
                timelineScore.push(cumulativeScore);
                timelineCorrect.push(s > 0 ? 1 : s < 0 ? -1 : 0);
                questionLabels.push('P' + (i+1));
            }
            // Maths
            for (let i = 0; i < mathsCount; i++) {
                const ua = mathsAnswers[i] || '';
                const ke = mathsKey[i] || '';
                const ca = typeof ke === 'object' ? ke.answer : ke;
                const isNum = typeof ke === 'object' && ke.type === 'numeric';
                let s = 0;
                if (ua !== '') s = (isNum ? parseInt(ua)===parseInt(ca) : ua===ca) ? 4 : -1;
                cumulativeScore += s;
                timelineScore.push(cumulativeScore);
                timelineCorrect.push(s > 0 ? 1 : s < 0 ? -1 : 0);
                questionLabels.push('M' + (i+1));
            }
            // Chemistry
            for (let i = 0; i < chemistryCount; i++) {
                const ua = chemistryAnswers[i] || '';
                const ke = chemistryKey[i] || '';
                const ca = typeof ke === 'object' ? ke.answer : ke;
                const isNum = typeof ke === 'object' && ke.type === 'numeric';
                let s = 0;
                if (ua !== '') s = (isNum ? parseInt(ua)===parseInt(ca) : ua===ca) ? 4 : -1;
                cumulativeScore += s;
                timelineScore.push(cumulativeScore);
                timelineCorrect.push(s > 0 ? 1 : s < 0 ? -1 : 0);
                questionLabels.push('C' + (i+1));
            }

            // Subject breakdown data
            const subjData = {
                labels: ['Physics','Maths','Chemistry'],
                correct:     [physicsCorrect,    mathsCorrect,    chemistryCorrect],
                incorrect:   [physicsIncorrect,  mathsIncorrect,  chemistryIncorrect],
                unattempted: [physicsCount - physicsCorrect - physicsIncorrect,
                              mathsCount - mathsCorrect - mathsIncorrect,
                              chemistryCount - chemistryCorrect - chemistryIncorrect],
                accuracy:    [physicsAccuracy,   mathsAccuracy,   chemistryAccuracy],
                avgTime:     [
                    physicsAnswered  > 0 ? +(physicsTimeSpent/physicsAnswered/60).toFixed(2) : 0,
                    mathsAnswered    > 0 ? +(mathsTimeSpent/mathsAnswered/60).toFixed(2) : 0,
                    chemistryAnswered > 0 ? +(chemistryTimeSpent/chemistryAnswered/60).toFixed(2) : 0
                ]
            };

            // Time per Q data (per-question, in seconds)
            const timeData = timeSpent.map((t,i) => ({ sec: t, label: questionLabels[i] || ('Q'+(i+1)) }));

            // ---- Store data on canvas for redraw ----
            let currentResultTab = 'timeline';

            function drawResultGraph(tab) {
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
                const W = cssW, H = cssH;

                const padL=48, padR=20, padT=28, padB=40;
                const gW=W-padL-padR, gH=H-padT-padB;

                // Bg
                const bg = ctx.createLinearGradient(0,padT,0,padT+gH);
                bg.addColorStop(0, isDark?'#12122a':'#f0f2ff');
                bg.addColorStop(1, isDark?'#1a1a2e':'#f8f9ff');
                ctx.fillStyle=bg; ctx.fillRect(padL,padT,gW,gH);

                const tooltip = document.getElementById('result-graph-tooltip');

                // ========== TAB: SCORE TIMELINE ==========
                if (tab === 'timeline') {
                    legendEl.innerHTML = `
                        <div class="cleg-item"><span class="cleg-dot" style="background:#3f51b5"></span>Cumulative Score</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#4caf50"></span>Correct +4</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#f44336"></span>Incorrect -1</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#9e9e9e"></span>Skipped 0</div>`;

                    const nQ = timelineScore.length;
                    if (nQ === 0) return;
                    const minS = Math.min(0, ...timelineScore);
                    const maxS = Math.max(...timelineScore, 4);
                    const range = maxS - minS || 1;

                    function xQ(i) { return padL + (nQ===1 ? gW/2 : (i/(nQ-1))*gW); }
                    function yS(v) { return padT + gH - ((v-minS)/range)*gH; }

                    // Zero line
                    if (minS < 0) {
                        const yz = yS(0);
                        ctx.strokeStyle = isDark?'#555':'#ccc'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
                        ctx.beginPath(); ctx.moveTo(padL,yz); ctx.lineTo(padL+gW,yz); ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.fillStyle='#999'; ctx.font='9px sans-serif'; ctx.textAlign='right';
                        ctx.fillText('0', padL-4, yz+3);
                    }

                    // Y grid
                    const yTicks = 5;
                    for (let i=0;i<=yTicks;i++) {
                        const v = minS + (range/yTicks)*i;
                        const y = yS(v);
                        ctx.strokeStyle=isDark?'#252540':'#e4e6f8'; ctx.lineWidth=1; ctx.setLineDash([]);
                        ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+gW,y); ctx.stroke();
                        ctx.fillStyle=isDark?'#888':'#aaa'; ctx.font='9px sans-serif'; ctx.textAlign='right';
                        ctx.fillText(Math.round(v), padL-4, y+3);
                    }

                    // Subject dividers
                    const dividers = [physicsCount, physicsCount+mathsCount];
                    const subjColors = ['#3f51b520','#ff980020','#4caf5020'];
                    const subjNames = ['Physics','Maths','Chemistry'];
                    const starts = [0, physicsCount, physicsCount+mathsCount];
                    starts.forEach((s,si) => {
                        const end = si===0?physicsCount:si===1?physicsCount+mathsCount:nQ;
                        const x1 = xQ(s), x2 = xQ(end-1);
                        ctx.fillStyle = subjColors[si];
                        ctx.fillRect(x1, padT, x2-x1, gH);
                        ctx.fillStyle = isDark?'#aaa':'#777';
                        ctx.font='bold 9px sans-serif'; ctx.textAlign='center';
                        ctx.fillText(subjNames[si], (x1+x2)/2, padT+10);
                    });

                    // Vertical dividers
                    dividers.forEach(d => {
                        if (d >= nQ) return;
                        const x = xQ(d);
                        ctx.strokeStyle=isDark?'#444':'#ccc'; ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
                        ctx.beginPath(); ctx.moveTo(x,padT); ctx.lineTo(x,padT+gH); ctx.stroke();
                        ctx.setLineDash([]);
                    });

                    // Dot colors under the line
                    timelineCorrect.forEach((c,i) => {
                        const x=xQ(i), y=yS(timelineScore[i]);
                        if (c===1) {
                            ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2);
                            ctx.fillStyle='#4caf5066'; ctx.fill();
                        } else if (c===-1) {
                            ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2);
                            ctx.fillStyle='#f4433666'; ctx.fill();
                        }
                    });

                    // Line
                    ctx.strokeStyle='#3f51b5'; ctx.lineWidth=2.5;
                    ctx.lineJoin='round'; ctx.lineCap='round'; ctx.setLineDash([]);
                    ctx.beginPath();
                    timelineScore.forEach((v,i) => {
                        const x=xQ(i), y=yS(v);
                        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
                    });
                    ctx.stroke();

                    // X labels — show every ~10th or subject boundaries
                    ctx.fillStyle=isDark?'#aaa':'#555'; ctx.font='8px sans-serif'; ctx.textAlign='center';
                    const step = Math.max(1, Math.floor(nQ/10));
                    for (let i=0;i<nQ;i+=step) {
                        ctx.fillText(questionLabels[i], xQ(i), padT+gH+14);
                    }

                    // Max score label
                    const maxIdx = timelineScore.indexOf(Math.max(...timelineScore));
                    const mx=xQ(maxIdx), my=yS(timelineScore[maxIdx]);
                    ctx.fillStyle='#ffd700'; ctx.font='14px sans-serif'; ctx.textAlign='center';
                    ctx.fillText('⭐', mx, my-12);

                    // Border
                    ctx.strokeStyle=isDark?'#333':'#c8ccea'; ctx.lineWidth=1.5; ctx.setLineDash([]);
                    ctx.strokeRect(padL,padT,gW,gH);

                    // Tooltip
                    canvas.onmousemove = function(e) {
                        const rect=canvas.getBoundingClientRect();
                        const mx=e.clientX-rect.left;
                        let ci=0, md=Infinity;
                        for(let i=0;i<nQ;i++){const d=Math.abs(xQ(i)-mx);if(d<md){md=d;ci=i;}}
                        if(md>30){tooltip.style.display='none';return;}
                        const sc=timelineScore[ci], cor=timelineCorrect[ci];
                        const status = cor===1?'✅ Correct +4':cor===-1?'❌ Incorrect -1':'⏭️ Skipped';
                        const wRect=canvas.parentElement.getBoundingClientRect();
                        let tx=(e.clientX-wRect.left)+14, ty=(e.clientY-wRect.top)-20;
                        const tw=tooltip.offsetWidth||160;
                        if(tx+tw>wRect.width-10) tx=(e.clientX-wRect.left)-tw-14;
                        tooltip.innerHTML=`<div class="tt-title">${questionLabels[ci]}</div><div class="tt-row">${status}</div><div class="tt-row">Cumulative: <b>${sc}</b></div>`;
                        tooltip.style.left=tx+'px'; tooltip.style.top=Math.max(0,ty)+'px'; tooltip.style.display='block';
                    };
                    canvas.onmouseleave=()=>{tooltip.style.display='none';};
                    canvas.ontouchmove=function(e){e.preventDefault();const t=e.touches[0];canvas.onmousemove({clientX:t.clientX,clientY:t.clientY});};
                    canvas.ontouchend=()=>{setTimeout(()=>{tooltip.style.display='none';},1500);};
                }

                // ========== TAB: SUBJECT BREAKDOWN ==========
                else if (tab === 'subjects') {
                    legendEl.innerHTML = `
                        <div class="cleg-item"><span class="cleg-dot" style="background:#4caf50"></span>Correct</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#f44336"></span>Incorrect</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#9e9e9e"></span>Unattempted</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#3f51b5"></span>Accuracy %</div>`;

                    const nS = 3;
                    const bw = (gW / nS) * 0.6;
                    const maxQ = Math.max(physicsCount, mathsCount, chemistryCount);
                    function xSub(i) { return padL + (gW/nS)*(i+0.5); }
                    function yBar(v) { return padT + gH - (v/maxQ)*gH; }

                    // Grid
                    for (let i=0;i<=5;i++) {
                        const v = Math.round((maxQ/5)*i);
                        const y = padT + gH - (v/maxQ)*gH;
                        ctx.strokeStyle=isDark?'#252540':'#e4e6f8'; ctx.lineWidth=1; ctx.setLineDash([]);
                        ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+gW,y); ctx.stroke();
                        ctx.fillStyle=isDark?'#888':'#aaa'; ctx.font='9px sans-serif'; ctx.textAlign='right';
                        ctx.fillText(v, padL-4, y+3);
                    }

                    subjData.labels.forEach((name,si) => {
                        const cx = xSub(si);
                        const cor = subjData.correct[si];
                        const inc = subjData.incorrect[si];
                        const una = subjData.unattempted[si];
                        const total = cor+inc+una;

                        // Stacked bar
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

                        // Accuracy line dot
                        const accY = padT + gH - (subjData.accuracy[si]/100)*gH;
                        ctx.beginPath(); ctx.arc(cx, accY, 7, 0, Math.PI*2);
                        ctx.fillStyle='#3f51b5'; ctx.fill();
                        ctx.fillStyle='#fff'; ctx.font='bold 8px sans-serif'; ctx.textAlign='center';
                        ctx.fillText(subjData.accuracy[si]+'%', cx, accY+3);

                        // Subject label
                        ctx.fillStyle=isDark?'#ddd':'#333'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
                        ctx.fillText(name, cx, padT+gH+18);
                    });

                    // Connect accuracy dots
                    ctx.strokeStyle='#3f51b5'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
                    ctx.beginPath();
                    subjData.labels.forEach((_,si) => {
                        const cx=xSub(si), ay=padT+gH-(subjData.accuracy[si]/100)*gH;
                        if(si===0) ctx.moveTo(cx,ay); else ctx.lineTo(cx,ay);
                    });
                    ctx.stroke(); ctx.setLineDash([]);

                    // Border
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
                        tooltip.innerHTML=`<div class="tt-title">${subjData.labels[ci]}</div>
                            <div class="tt-row"><span class="tt-dot" style="background:#4caf50"></span>Correct: <b>${subjData.correct[ci]}</b></div>
                            <div class="tt-row"><span class="tt-dot" style="background:#f44336"></span>Incorrect: <b>${subjData.incorrect[ci]}</b></div>
                            <div class="tt-row"><span class="tt-dot" style="background:#9e9e9e"></span>Skipped: <b>${subjData.unattempted[ci]}</b></div>
                            <div class="tt-row"><span class="tt-dot" style="background:#3f51b5"></span>Accuracy: <b>${subjData.accuracy[ci]}%</b></div>
                            <div class="tt-row">⏱️ Avg: <b>${subjData.avgTime[ci].toFixed(2)} min/Q</b></div>`;
                        tooltip.style.left=tx+'px'; tooltip.style.top=Math.max(0,ty)+'px'; tooltip.style.display='block';
                    };
                    canvas.onmouseleave=()=>{tooltip.style.display='none';};
                    canvas.ontouchmove=function(e){e.preventDefault();const t=e.touches[0];canvas.onmousemove({clientX:t.clientX,clientY:t.clientY});};
                    canvas.ontouchend=()=>{setTimeout(()=>{tooltip.style.display='none';},1500);};
                }

                // ========== TAB: TIME ANALYSIS ==========
                else if (tab === 'time') {
                    legendEl.innerHTML = `
                        <div class="cleg-item"><span class="cleg-dot" style="background:#3f51b5"></span>Time spent (sec)</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#e91e63"></span>Avg time line</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#4caf50"></span>Correct</div>
                        <div class="cleg-item"><span class="cleg-dot" style="background:#f44336"></span>Incorrect</div>`;

                    const nQ = timeData.length;
                    if(nQ===0) return;
                    const maxT = Math.max(...timeData.map(d=>d.sec), 1);
                    const avgT = timeData.reduce((a,d)=>a+d.sec,0)/nQ;

                    // Bar-slot based layout — 1 slot per question
                    const slotW = gW / nQ;
                    const bw = Math.max(2, slotW * 0.65);
                    function xT(i) { return padL + slotW * i + slotW / 2; }
                    function yT(v) { return padT + gH - (v/maxT)*gH; }

                    // Grid
                    for (let i=0;i<=4;i++) {
                        const v = Math.round((maxT/4)*i);
                        const y = padT+gH-(v/maxT)*gH;
                        ctx.strokeStyle=isDark?'#252540':'#e4e6f8'; ctx.lineWidth=1; ctx.setLineDash([]);
                        ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+gW,y); ctx.stroke();
                        ctx.fillStyle=isDark?'#888':'#aaa'; ctx.font='9px sans-serif'; ctx.textAlign='right';
                        ctx.fillText(v+'s', padL-4, y+3);
                    }

                    // Avg line (dashed, pink)
                    const ay = yT(avgT);
                    ctx.strokeStyle='#e91e63aa'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
                    ctx.beginPath(); ctx.moveTo(padL,ay); ctx.lineTo(padL+gW,ay); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle='#e91e63'; ctx.font='bold 9px sans-serif'; ctx.textAlign='left';
                    ctx.fillText('avg '+Math.round(avgT)+'s', padL+4, ay-4);

                    // Bars — one per question, centered in slot
                    timeData.forEach((d,i) => {
                        const x=xT(i), bh=Math.max(1,(d.sec/maxT)*gH);
                        const c = timelineCorrect[i];
                        ctx.fillStyle = c===1?'#4caf5099':c===-1?'#f4433699':'#9e9e9e66';
                        ctx.fillRect(x - bw/2, padT+gH-bh, bw, bh);
                    });

                    // Line on top
                    ctx.strokeStyle='#3f51b5'; ctx.lineWidth=1.8; ctx.lineJoin='round'; ctx.lineCap='round'; ctx.setLineDash([]);
                    ctx.beginPath();
                    timeData.forEach((d,i) => {
                        const x=xT(i), y=yT(d.sec);
                        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
                    });
                    ctx.stroke();

                    // Dots on line
                    timeData.forEach((d,i) => {
                        const x=xT(i), y=yT(d.sec);
                        ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2);
                        ctx.fillStyle='#3f51b5'; ctx.fill();
                    });

                    // X labels
                    const step = Math.max(1, Math.floor(nQ/12));
                    ctx.fillStyle=isDark?'#aaa':'#555'; ctx.font='8px sans-serif'; ctx.textAlign='center';
                    for(let i=0;i<nQ;i+=step) ctx.fillText(timeData[i].label, xT(i), padT+gH+14);

                    // Border
                    ctx.strokeStyle=isDark?'#333':'#c8ccea'; ctx.lineWidth=1.5; ctx.setLineDash([]);
                    ctx.strokeRect(padL,padT,gW,gH);

                    canvas.onmousemove=function(e){
                        const rect=canvas.getBoundingClientRect();
                        const mx=e.clientX-rect.left;
                        let ci=0, md=Infinity;
                        for(let i=0;i<nQ;i++){const d=Math.abs(xT(i)-mx);if(d<md){md=d;ci=i;}}
                        if(md>30){tooltip.style.display='none';return;}
                        const c=timelineCorrect[ci];
                        const status=c===1?'✅ Correct':c===-1?'❌ Incorrect':'⏭️ Skipped';
                        const wRect=canvas.parentElement.getBoundingClientRect();
                        let tx=(e.clientX-wRect.left)+14, ty=(e.clientY-wRect.top)-20;
                        const tw=tooltip.offsetWidth||160;
                        if(tx+tw>wRect.width-10) tx=(e.clientX-wRect.left)-tw-14;
                        tooltip.innerHTML=`<div class="tt-title">${timeData[ci].label}</div><div class="tt-row">${status}</div><div class="tt-row">⏱️ Time: <b>${timeData[ci].sec}s</b></div><div class="tt-row">vs avg: <b>${timeData[ci].sec>avgT?'+':''}${Math.round(timeData[ci].sec-avgT)}s</b></div>`;
                        tooltip.style.left=tx+'px'; tooltip.style.top=Math.max(0,ty)+'px'; tooltip.style.display='block';
                    };
                    canvas.onmouseleave=()=>{tooltip.style.display='none';};
                    canvas.ontouchmove=function(e){e.preventDefault();const t=e.touches[0];canvas.onmousemove({clientX:t.clientX,clientY:t.clientY});};
                    canvas.ontouchend=()=>{setTimeout(()=>{tooltip.style.display='none';},1500);};
                }

                // Border
                ctx.strokeStyle=isDark?'#333':'#c8ccea'; ctx.lineWidth=1.5; ctx.setLineDash([]);
                ctx.strokeRect(padL,padT,gW,gH);
            }

            // Tab switch for result graph
            window._switchResultTabFn = function(tab, e) {
                currentResultTab = tab;
                window._currentResultTab = tab;
                document.querySelectorAll('#result-graph-tabs .gtab').forEach(b=>b.classList.remove('active'));
                if(e && e.target) e.target.classList.add('active');
                setTimeout(()=>drawResultGraph(tab), 20);
            };
            window.switchResultTab = window._switchResultTabFn;

            // Store draw function globally so modal-show can call it
            window._drawResultGraph = drawResultGraph;
            window._currentResultTab = 'timeline';

            // Initial draw — will be triggered after modal is shown (see below)
            
            // 4. Save test to history
            const testData = {
                date: new Date().toISOString(),
                userName: userName,
                testName: testName,
                totalScore: totalScore,
                maxMarks: maxMarks,
                totalCorrect: totalCorrect,
                totalIncorrect: totalIncorrect,
                totalUnattempted: totalUnattempted,
                totalMarked: totalMarked,
                accuracy: totalAccuracy,
                timeTaken: timeTakenFormatted,
                totalQuestions: totalQuestions,
                physicsCount: physicsCount,
                mathsCount: mathsCount,
                chemistryCount: chemistryCount,
                physicsCorrect: physicsCorrect,
                physicsIncorrect: physicsIncorrect,
                physicsMarked: physicsMarkedCount,
                physicsAccuracy: physicsAccuracy,
                mathsCorrect: mathsCorrect,
                mathsIncorrect: mathsIncorrect,
                mathsMarked: mathsMarkedCount,
                mathsAccuracy: mathsAccuracy,
                chemistryCorrect: chemistryCorrect,
                chemistryIncorrect: chemistryIncorrect,
                chemistryMarked: chemistryMarkedCount,
                chemistryAccuracy: chemistryAccuracy,
                subjectScores: {
                    physics: physicsScore,
                    maths: mathsScore,
                    chemistry: chemistryScore
                },
                subjectTimeSpent: {
                    physics: physicsTimeSpent,
                    maths: mathsTimeSpent,
                    chemistry: chemistryTimeSpent
                },
                questionTimeSpent: timeSpent,  // Per-question time array
                // Detailed question-wise data
                physicsAnswers: physicsAnswers,
                mathsAnswers: mathsAnswers,
                chemistryAnswers: chemistryAnswers,
                physicsKey: physicsKey,
                mathsKey: mathsKey,
                chemistryKey: chemistryKey,
                physicsMarkedArray: physicsMarked,
                mathsMarkedArray: mathsMarked,
                chemistryMarkedArray: chemistryMarked,
                physicsImageNames: physicsImages.map(img => img.name || ''),
                mathsImageNames: mathsImages.map(img => img.name || ''),
                chemistryImageNames: chemistryImages.map(img => img.name || ''),
                notes: ''
            };
            
            console.log('Saving test data:', testData);
            console.log('Subject Time Spent - Physics:', physicsTimeSpent, 'Maths:', mathsTimeSpent, 'Chemistry:', chemistryTimeSpent);
            
            addTestToHistory(testData);
            
            // Hide test container, show final screen
            document.getElementById('test-container').style.display = 'none';
            document.getElementById('final-screen').style.display = 'block';
        }
        
        // Close results modal
        function closeResults() {
            document.getElementById('results-modal').style.display = 'none';
        }
        
        // View results again
        function viewResultsAgain() {
            document.getElementById('final-screen').style.display = 'none';
            document.getElementById('results-modal').style.display = 'flex';
            setTimeout(() => { if(window._drawResultGraph) window._drawResultGraph(window._currentResultTab || 'timeline'); }, 80);
        }
        
        // Start new test
        function startNewTest() {
            // Reset all variables
            currentQuestion = 1;
            currentSubject = 'physics';
            currentImageIndex = 0;
            manualImageChange = false;
            isSubjectSwitching = false;
            totalSeconds = customTime * 60;
            subjectTimerLocked = { physics: false, maths: false, chemistry: false };
            currentSubjectSeconds = 0;
            startTime = new Date();
            questionStartTime = new Date();
            testStarted = false;
            testSubmitted = false;
            
            // Reset subject memory
            subjectMemory = {
                physics: { lastQuestion: 1, lastImageIndex: 0 },
                maths: { lastQuestion: null, lastImageIndex: 0 },
                chemistry: { lastQuestion: null, lastImageIndex: 0 }
            };
            
            // Reset folder batches
            folderBatches = { physics: [], maths: [], chemistry: [] };
            ['physics', 'maths', 'chemistry'].forEach(s => { if(typeof updateBatchUI === 'function') updateBatchUI(s); });
            
            // Reset loaded images (BUG FIX: ye reset nahi ho rahe the)
            loadedPhysicsImages = [];
            loadedMathsImages = [];
            loadedChemistryImages = [];
            loadedPhysicsAnswers = [];
            loadedMathsAnswers = [];
            loadedChemistryAnswers = [];
            
            // Reset txt answer keys
            physicsTxtAnswerKey = '';
            mathsTxtAnswerKey = '';
            chemistryTxtAnswerKey = '';
            
            // Reset toggle states visually
            document.getElementById('auto-advance-toggle').checked = false;
            document.getElementById('filename-ans-toggle').checked = false;
            document.getElementById('subject-timer-toggle').checked = false;
            autoAdvanceImage = false;
            filenameAnsMode = false;
            subjectTimerMode = false;
            if(typeof toggleSubjectTimerUI === 'function') toggleSubjectTimerUI();
            
            // Reset image selection UI info labels
            document.getElementById('physics-count-info').textContent = '0 images selected';
            document.getElementById('physics-count-info').style.color = '#666';
            document.getElementById('maths-count-info').textContent = '0 images selected';
            document.getElementById('maths-count-info').style.color = '#666';
            document.getElementById('chemistry-count-info').textContent = '0 images selected';
            document.getElementById('chemistry-count-info').style.color = '#666';
            document.getElementById('physics-ans-info').textContent = '0 images selected';
            document.getElementById('physics-ans-info').style.color = '#666';
            document.getElementById('maths-ans-info').textContent = '0 images selected';
            document.getElementById('maths-ans-info').style.color = '#666';
            document.getElementById('chemistry-ans-info').textContent = '0 images selected';
            document.getElementById('chemistry-ans-info').style.color = '#666';
            document.getElementById('physics-txt-info').textContent = '0 txt files selected';
            document.getElementById('physics-txt-info').style.color = '#666';
            document.getElementById('maths-txt-info').textContent = '0 txt files selected';
            document.getElementById('maths-txt-info').style.color = '#666';
            document.getElementById('chemistry-txt-info').textContent = '0 txt files selected';
            document.getElementById('chemistry-txt-info').style.color = '#666';
            
            // Reset txt range containers
            ['physics', 'maths', 'chemistry'].forEach(s => {
                const rangeEl = document.getElementById(s + '-txt-ranges');
                if(rangeEl) { rangeEl.innerHTML = ''; rangeEl.style.display = 'none'; }
                window['_txtFiles_' + s] = [];
                const inp = document.getElementById(s + '-answers-txt');
                if(inp) inp.value = '';
                const imgInp = document.getElementById(s + '-images');
                if(imgInp) imgInp.value = '';
                const ansInp = document.getElementById(s + '-answers');
                if(ansInp) ansInp.value = '';
            });

            physicsAnswers = new Array(physicsCount).fill('');
            mathsAnswers = new Array(mathsCount).fill('');
            chemistryAnswers = new Array(chemistryCount).fill('');
            
            physicsMarked = new Array(physicsCount).fill(false);
            mathsMarked = new Array(mathsCount).fill(false);
            chemistryMarked = new Array(chemistryCount).fill(false);
            
            timeSpent = new Array(totalQuestions).fill(0);
            
            // Reset UI
            document.getElementById('timer').textContent = '180:00';
            document.querySelectorAll('.option').forEach(option => {
                option.classList.remove('selected');
                option.style.pointerEvents = 'auto';
            });
            
            document.querySelectorAll('.palette-btn').forEach(btn => {
                btn.style.pointerEvents = 'auto';
            });
            
            document.getElementById('prev-btn').disabled = false;
            document.getElementById('next-btn').disabled = false;
            document.getElementById('mark-review-btn').disabled = false;
            document.getElementById('submit-btn').disabled = true;
            document.getElementById('submit-btn').style.opacity = '0.4';
            document.getElementById('submit-btn').style.cursor = 'not-allowed';
            const confirmCheck = document.getElementById('submit-confirm-check');
            if (confirmCheck) { confirmCheck.checked = false; }
            document.getElementById('prev-image-btn').disabled = false;
            document.getElementById('next-image-btn').disabled = false;
            
            // Reset answer inputs
            document.getElementById('physics-answers-input').value = '';
            document.getElementById('maths-answers-input').value = '';
            document.getElementById('chemistry-answers-input').value = '';
            document.getElementById('physics-answers-length').textContent = '0';
            document.getElementById('maths-answers-length').textContent = '0';
            document.getElementById('chemistry-answers-length').textContent = '0';
            
            // Hide all modals and final screen
            document.getElementById('submission-modal').style.display = 'none';
            document.getElementById('results-modal').style.display = 'none';
            document.getElementById('final-screen').style.display = 'none';
            
            // Show login screen
            document.getElementById('login-screen').style.display = 'flex';
            document.getElementById('test-container').style.display = 'none';
        }
        
        // Toggle Question Palette visibility
        function togglePalette() {
            const palette = document.getElementById('question-palette');
            const btn = document.getElementById('palette-toggle-btn');
            
            if (palette.classList.contains('show')) {
                palette.classList.remove('show');
                btn.innerHTML = '📋 Show Question Palette';
            } else {
                palette.classList.add('show');
                btn.innerHTML = '✖️ Hide Question Palette';
            }
        }
        
        // View test history from login screen
        function viewTestHistory() {
            showTestHistory();
            document.getElementById('history-modal').style.display = 'flex';
        }



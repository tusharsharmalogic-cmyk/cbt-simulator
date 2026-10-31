// Extracted from imu.html lines 3947-4107
        // ===== JSON / TXT QUESTION MODE =====

        function toggleJsonMode() {
            jsonModeEnabled = document.getElementById('json-mode-toggle').checked;
            document.getElementById('json-upload-area').style.display = jsonModeEnabled ? 'block' : 'none';
            document.getElementById('image-mode-section').style.display = jsonModeEnabled ? 'none' : 'block';
        }

        function loadSubjectFile(subject, input) {
            const file = input.files[0];
            if (!file) return;
            const infoEl = document.getElementById(
                subject === 'physics' ? 'phy-json-info' :
                subject === 'maths'   ? 'maths-json-info' : 'chem-json-info'
            );
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result.trim();
                try {
                    let questions = [];
                    if (file.name.endsWith('.json')) {
                        questions = parseJsonQuestions(content);
                    } else {
                        questions = parseTxtQuestions(content);
                    }
                    if (questions.length === 0) {
                        infoEl.style.color = '#c62828';
                        infoEl.textContent = '❌ No questions found! Check format.';
                        return;
                    }
                    jsonQuestions[subject] = questions;
                    // Auto-set question count
                    const countId = subject === 'physics' ? 'physics-count' : subject === 'maths' ? 'maths-count' : 'chemistry-count';
                    document.getElementById(countId).value = questions.length;
                    infoEl.style.color = '#2e7d32';
                    infoEl.textContent = `✅ ${questions.length} questions loaded from "${file.name}"`;
                } catch(err) {
                    infoEl.style.color = '#c62828';
                    infoEl.textContent = '❌ Error parsing file: ' + err.message;
                }
            };
            reader.readAsText(file);
        }

        function parseJsonQuestions(content) {
            const arr = JSON.parse(content);
            return arr.map(item => ({
                q: item.q || item.question || '',
                options: item.options || null,
                answer: String(item.answer || '').trim(),
                type: (item.type || 'mcq').toLowerCase()
            }));
        }

        function parseTxtQuestions(content) {
            const questions = [];
            // Split by blank lines or Q\d+ pattern
            const blocks = content.split(/\n\s*\n/).filter(b => b.trim());
            for (const block of blocks) {
                const lines = block.split('\n').map(l => l.trim()).filter(l => l);
                if (lines.length === 0) continue;
                let q = '', options = [], answer = '', type = 'mcq';
                for (const line of lines) {
                    const ansMatch = line.match(/^ANS\s*:\s*(.+)$/i);
                    const typeMatch = line.match(/^TYPE\s*:\s*(.+)$/i);
                    const optMatch = line.match(/^([A-D])\s*[\)\.]\s*(.+)$/i);
                    const qMatch = line.match(/^Q\d*[\.\)]\s*(.+)$/i);
                    if (ansMatch) { answer = ansMatch[1].trim(); }
                    else if (typeMatch) { type = typeMatch[1].trim().toLowerCase(); }
                    else if (optMatch) { options.push(optMatch[1].toUpperCase() + ') ' + optMatch[2]); }
                    else if (qMatch) { q = qMatch[1]; }
                    else if (!q) { q = line; } // First unmatched line = question
                }
                if (q && answer) {
                    questions.push({ q, options: options.length ? options : null, answer, type });
                }
            }
            return questions;
        }

        // Get current question object in json mode
        function getCurrentJsonQuestion() {
            if (!jsonModeEnabled) return null;
            const qArr = jsonQuestions[currentSubject] || [];
            const idx = currentSubject === 'physics' ? currentQuestion - 1
                      : currentSubject === 'maths'   ? currentQuestion - 1
                      : currentQuestion - 1;
            return qArr[idx] || null;
        }

        // Render text question on screen
        function renderJsonQuestion() {
            const qObj = getCurrentJsonQuestion();
            const imgEl = document.getElementById('question-image');
            const imgNav = document.querySelector('.image-navigation');
            const mcqOpts = document.getElementById('mcq-options-container');
            const numOpts = document.getElementById('numeric-options-container');
            let textBox = document.getElementById('json-question-box');

            if (!qObj) {
                // Fallback if no question data
                if (textBox) textBox.remove();
                if (imgEl) imgEl.style.display = 'block';
                if (imgNav) imgNav.style.display = '';
                return;
            }

            // Hide image, show text box
            if (imgEl) imgEl.style.display = 'none';
            if (imgNav) imgNav.style.display = 'none';

            // Create or reuse text box
            if (!textBox) {
                textBox = document.createElement('div');
                textBox.id = 'json-question-box';
                textBox.style.cssText = 'background:#fff; border:2px solid #3f51b5; border-radius:10px; padding:16px; margin:12px 0; font-size:15px; line-height:1.7; min-height:80px; white-space:pre-wrap; word-break:break-word;';
                const qContainer = document.querySelector('.question-container');
                if (qContainer) qContainer.appendChild(textBox);
            }
            // Set question HTML (newlines -> <br>, LaTeX stays for MathJax)
            textBox.innerHTML = qObj.q.replace(/\n/g, '<br>');

            // MCQ or Numeric
            if (qObj.type === 'numeric') {
                if (mcqOpts) mcqOpts.style.display = 'none';
                if (numOpts) numOpts.style.display = 'block';
            } else {
                if (numOpts) numOpts.style.display = 'none';
                if (mcqOpts) mcqOpts.style.display = 'grid';
                // Update option text if provided in file
                if (qObj.options && qObj.options.length >= 4) {
                    const optEls = mcqOpts.querySelectorAll('.option');
                    optEls.forEach((el, i) => {
                        const label = ['A','B','C','D'][i];
                        const sp = document.createElement('span');
                        sp.style.cssText = 'display:inline-block;background:#3f51b5;color:white;border-radius:50%;width:26px;height:26px;line-height:26px;text-align:center;margin-right:8px;font-size:13px;flex-shrink:0;vertical-align:middle;';
                        sp.textContent = label;
                        // Use innerHTML so LaTeX inside options also renders
                        const optText = (qObj.options[i] || label).replace(/^[A-D][\)\.]\s*/i, '');
                        const textSpan = document.createElement('span');
                        textSpan.innerHTML = optText;
                        el.innerHTML = '';
                        el.appendChild(sp);
                        el.appendChild(textSpan);
                    });
                }
            }

            // Trigger MathJax to render LaTeX formulas
            const targets = [textBox];
            if (mcqOpts && qObj.type !== 'numeric') targets.push(mcqOpts);
            window.safeTypeset(targets);
        }

        // Override question type detection for JSON mode
        function getJsonQuestionType(subject, idx) {
            if (!jsonModeEnabled) return null;
            const q = (jsonQuestions[subject] || [])[idx];
            return q ? q.type : 'mcq';
        }



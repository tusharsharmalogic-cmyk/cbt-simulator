// Extracted from imu.html lines 6124-6945
        // Load a specific question
        function loadQuestion(questionNumber) {
            // Record time spent on previous question
            if (testStarted && !testSubmitted) {
                const now = new Date();
                const timeElapsed = Math.floor((now - questionStartTime) / 1000);
                timeSpent[currentQuestion - 1] += timeElapsed;

                // ===== BEHAVIOUR TRACKER: log navigation =====
                if (behaviourTrackerEnabled && testStarted) {
                    // Get current answer before leaving
                    const sqnLeave = getSubjectQuestionNumber ? getSubjectQuestionNumber(currentQuestion) : currentQuestion;
                    let ansAtLeave = '';
                    if (currentSubject === 'physics') ansAtLeave = physicsAnswers[sqnLeave - 1] || '';
                    else if (currentSubject === 'maths') ansAtLeave = mathsAnswers[sqnLeave - 1] || '';
                    else ansAtLeave = chemistryAnswers[sqnLeave - 1] || '';

                    const dir = questionNumber > currentQuestion ? 'Aage (↓)' : questionNumber < currentQuestion ? 'Peeche (↑)' : 'Same';
                    const sinceStart = Math.floor((now - startTime) / 1000);
                    behaviourLog.push({
                        eventType: 'navigate',
                        sinceStart,
                        timeOnQ: timeElapsed,
                        fromQ: currentQuestion,
                        toQ: questionNumber,
                        direction: dir,
                        fromSubject: currentSubject,
                        answerAtLeave: ansAtLeave || '—',
                    });
                }

                questionStartTime = now;
            }
            
            // Store previous subject to detect subject change
            const previousSubject = currentSubject;
            
            // Update current question
            currentQuestion = questionNumber;
            
            // Determine subject based on question number
            if (questionNumber <= physicsCount) {
                currentSubject = 'physics';
            } else if (questionNumber <= physicsCount + mathsCount) {
                currentSubject = 'maths';
            } else {
                currentSubject = 'chemistry';
            }
            
            // Update subject tabs
            updateSubjectTabs();
            
            // Calculate question number within subject (1-25)
            const subjectQuestionNumber = getSubjectQuestionNumber(questionNumber);
            
            // Only recalculate image index if:
            // 1. NOT switching subjects via tabs (preserve restored image), AND
            // 2. Either subject changed OR user did not manually change image OR auto-advance is ON
            if (!isSubjectSwitching) {
                // When auto-advance is ON, always recalculate image from question
                // When OFF, only recalculate if subject changed or no manual override
                if (autoAdvanceImage || previousSubject !== currentSubject || !manualImageChange) {
                    let imageInfo = getImageForQuestion(currentSubject, subjectQuestionNumber);
                    currentImageIndex = imageInfo.imageIndex;
                }
            }
            
            // Reset manualImageChange after each question navigation
            // (manual override only lasts for ONE question, then resets)
            if (!autoAdvanceImage) {
                manualImageChange = false;
            }
            // If isSubjectSwitching is true, currentImageIndex is already set by switchSubject()
            
            // Reset the subject switching flag
            isSubjectSwitching = false;
            
            // Update image navigation
            updateImageNavigation();
            
            // Load current image
            loadCurrentImage();
            
            // Update question number display
            const subjectName = currentSubject.charAt(0).toUpperCase() + currentSubject.slice(1);
            document.getElementById('question-number').textContent = 
                `Question ${questionNumber} of ${totalQuestions} (${subjectName} Q${subjectQuestionNumber})`;
            
            // Update current question badge in right panel
            document.getElementById('current-q-number').textContent = questionNumber;
            
            // Load saved answer for this question
            loadAnswerForQuestion();
            
            // Update palette to highlight current question
            updatePalette();
            
            // Update mark for review button
            updateMarkForReviewButton();
            
            // Save current state to subject memory
            subjectMemory[currentSubject].lastQuestion = currentQuestion;
            subjectMemory[currentSubject].lastImageIndex = currentImageIndex;
        }
        
        // Get which image a question belongs to
        function getImageForQuestion(subject, questionNumber) {
            let images = [];
            if (subject === 'physics') images = physicsImages;
            else if (subject === 'maths') images = mathsImages;
            else images = chemistryImages;
            
            if (!images || images.length === 0) {
                return { imageIndex: 0, image: null, questionInImage: 0 };
            }
            
            let cumulativeQuestions = 0;
            for (let i = 0; i < images.length; i++) {
                cumulativeQuestions += images[i].questions;
                if (questionNumber <= cumulativeQuestions) {
                    return {
                        imageIndex: i,
                        image: images[i],
                        questionInImage: questionNumber - (cumulativeQuestions - images[i].questions) - 1
                    };
                }
            }
            
            // Question exceeds all defined ranges → return LAST image (not first)
            return {
                imageIndex: images.length - 1,
                image: images[images.length - 1],
                questionInImage: 0
            };
        }
        
        // Load current image
        function loadCurrentImage() {
            // JSON MODE: show text question instead of image
            if (jsonModeEnabled) {
                renderJsonQuestion();
                return;
            }

            let images = [];
            if (currentSubject === 'physics') images = physicsImages;
            else if (currentSubject === 'maths') images = mathsImages;
            else images = chemistryImages;
            
            if (images.length > 0 && currentImageIndex < images.length) {
                const image = images[currentImageIndex];
                const imgElement = document.getElementById('question-image');
                
                // Check if this is a loaded image (has dataURL) or a path-based image
                if (image.path && image.path.startsWith('data:')) {
                    // This is a loaded image from folder - just display it directly
                    imgElement.src = image.path;
                    console.log(`✓ Displaying loaded image: ${image.name || 'Image ' + (currentImageIndex + 1)}`);
                } else {
                    // This is a path-based image - try flexible loading
                    console.log(`Loading image: ${image.path} for ${currentSubject} image ${currentImageIndex + 1}`);
                    
                    const basePath = image.path;
                    const pathParts = basePath.split('/');
                    const folder = pathParts.slice(0, -1).join('/');
                    const imageNumber = image.id;
                    
                    // All possible naming patterns
                    const patterns = [
                        `q${imageNumber}`,
                        `Q${imageNumber}`,
                        `question${imageNumber}`,
                        `Question${imageNumber}`,
                        `${imageNumber}`,
                        `img${imageNumber}`,
                        `image${imageNumber}`,
                        `${String(imageNumber).padStart(2, '0')}`,
                        `0${imageNumber}`,
                    ];
                    
                    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'JPG', 'JPEG', 'PNG', 'GIF', 'WEBP'];
                    
                    let loaded = false;
                    let attemptCount = 0;
                    const totalAttempts = patterns.length * extensions.length;
                    
                    // Try all combinations
                    for (let pattern of patterns) {
                        for (let ext of extensions) {
                            if (!loaded) {
                                const testSrc = `${folder}/${pattern}.${ext}`;
                                const testImg = new Image();
                                
                                testImg.onload = function() {
                                    if (!loaded) {
                                        loaded = true;
                                        imgElement.src = testSrc;
                                        console.log(`✓ Successfully loaded: ${testSrc}`);
                                    }
                                };
                                
                                testImg.onerror = function() {
                                    attemptCount++;
                                    if (attemptCount >= totalAttempts && !loaded) {
                                        console.error(`✗ Failed to load image after trying all combinations for image #${imageNumber}`);
                                        imgElement.src = 'https://via.placeholder.com/800x600/ff0000/ffffff?text=Image+Not+Found';
                                    }
                                };
                                
                                testImg.src = testSrc;
                            }
                        }
                    }
                }
            }
        }
        
        // Update image navigation UI
        function updateImageNavigation() {
            let images = [];
            if (currentSubject === 'physics') images = physicsImages;
            else if (currentSubject === 'maths') images = mathsImages;
            else images = chemistryImages;
            
            const prevBtn = document.getElementById('prev-image-btn');
            const nextBtn = document.getElementById('next-image-btn');
            const counter = document.getElementById('image-counter');
            
            if (autoAdvanceImage) {
                // Disable manual nav when auto-advance is on
                prevBtn.disabled = true;
                nextBtn.disabled = true;
                prevBtn.title = 'Disabled: Auto-advance is ON';
                nextBtn.title = 'Disabled: Auto-advance is ON';
            } else {
                prevBtn.disabled = currentImageIndex === 0;
                nextBtn.disabled = currentImageIndex === images.length - 1;
                prevBtn.title = '';
                nextBtn.title = '';
            }
            
            counter.textContent = `Image ${currentImageIndex + 1} of ${images.length}`;
        }
        
        // Generate question selector for current image
        // Get absolute question number (1-75)
        function getAbsoluteQuestionNumber(subject, subjectQuestionNumber) {
            if (subject === 'physics') {
                return subjectQuestionNumber;
            } else if (subject === 'maths') {
                return physicsCount + subjectQuestionNumber;
            } else {
                return physicsCount + mathsCount + subjectQuestionNumber;
            }
        }
        
        // Navigate to previous image
        function prevImage() {
            if (autoAdvanceImage) return; // Disabled when auto-advance is on
            let images = [];
            if (currentSubject === 'physics') images = physicsImages;
            else if (currentSubject === 'maths') images = mathsImages;
            else images = chemistryImages;
            
            if (currentImageIndex > 0) {
                currentImageIndex--;
                manualImageChange = true; // User manually changed image
                loadCurrentImage();
                updateImageNavigation();
            }
        }
        
        // Navigate to next image
        function nextImage() {
            if (autoAdvanceImage) return; // Disabled when auto-advance is on
            let images = [];
            if (currentSubject === 'physics') images = physicsImages;
            else if (currentSubject === 'maths') images = mathsImages;
            else images = chemistryImages;
            
            if (currentImageIndex < images.length - 1) {
                currentImageIndex++;
                manualImageChange = true; // User manually changed image
                loadCurrentImage();
                updateImageNavigation();
            }
        }
        
        // Get question number within subject (1-25)
        function getSubjectQuestionNumber(questionNumber) {
            if (questionNumber <= physicsCount) {
                return questionNumber;
            } else if (questionNumber <= physicsCount + mathsCount) {
                return questionNumber - physicsCount;
            } else {
                return questionNumber - physicsCount - mathsCount;
            }
        }
        
        // Load saved answer for current question
        // ===== ANSWER KEY PARSER =====
        // Parse answer key string like "A33BBCCDD" or "AB12,33CCB"
        // Returns array of {type:'mcq'|'numeric', answer:'A'|'33'}
        function parseAnswerKeyString(keyStr) {
            const parsed = [];
            let i = 0;
            const s = keyStr.trim();
            while (i < s.length) {
                const ch = s[i];
                if (ch === ',') {
                    // Comma is separator between consecutive numerics - skip
                    i++;
                    continue;
                }
                // Check if it's A/B/C/D (MCQ)
                if (/^[A-D]$/i.test(ch)) {
                    parsed.push({ type: 'mcq', answer: ch.toUpperCase() });
                    i++;
                }
                // Check if it's a digit - collect full number
                else if (/\d/.test(ch)) {
                    let numStr = '';
                    while (i < s.length && /\d/.test(s[i])) {
                        numStr += s[i];
                        i++;
                    }
                    parsed.push({ type: 'numeric', answer: numStr });
                }
                // Decimal point for numbers like 12.5
                else if (ch === '.' && parsed.length > 0 && parsed[parsed.length-1].type === 'numeric') {
                    // Append decimal to previous numeric
                    let numStr = parsed[parsed.length-1].answer + '.';
                    i++;
                    while (i < s.length && /\d/.test(s[i])) {
                        numStr += s[i];
                        i++;
                    }
                    parsed[parsed.length-1].answer = numStr;
                }
                // Negative sign
                else if (ch === '-' && /\d/.test(s[i+1] || '')) {
                    let numStr = '-';
                    i++;
                    while (i < s.length && /[\d.]/.test(s[i])) {
                        numStr += s[i];
                        i++;
                    }
                    parsed.push({ type: 'numeric', answer: numStr });
                }
                else {
                    i++; // Skip unknown chars
                }
            }
            return parsed;
        }

        // Apply parsed question types from txt key
        function applyParsedQuestionTypes() {
            if (filenameAnsMode || folderBatches.physics.length > 0 || folderBatches.maths.length > 0 || folderBatches.chemistry.length > 0) {
                // Use enhanced function that checks folder batches first
                physicsQuestionTypes = buildFilenameBasedTypesEnhanced('physics');
                mathsQuestionTypes = buildFilenameBasedTypesEnhanced('maths');
                chemistryQuestionTypes = buildFilenameBasedTypesEnhanced('chemistry');
            } else {
                if (physicsTxtAnswerKey) {
                    physicsQuestionTypes = parseAnswerKeyString(physicsTxtAnswerKey);
                } else {
                    physicsQuestionTypes = Array(physicsCount).fill(null).map(() => ({ type: 'mcq', answer: '' }));
                }
                if (mathsTxtAnswerKey) {
                    mathsQuestionTypes = parseAnswerKeyString(mathsTxtAnswerKey);
                } else {
                    mathsQuestionTypes = Array(mathsCount).fill(null).map(() => ({ type: 'mcq', answer: '' }));
                }
                if (chemistryTxtAnswerKey) {
                    chemistryQuestionTypes = parseAnswerKeyString(chemistryTxtAnswerKey);
                } else {
                    chemistryQuestionTypes = Array(chemistryCount).fill(null).map(() => ({ type: 'mcq', answer: '' }));
                }
            }
            console.log('Physics types:', physicsQuestionTypes);
            console.log('Maths types:', mathsQuestionTypes);
            console.log('Chemistry types:', chemistryQuestionTypes);
        }
        
        // Build question types based on image filename numbers
        function buildFilenameBasedTypes(subject) {
            const images = subject === 'physics' ? loadedPhysicsImages :
                           subject === 'maths' ? loadedMathsImages : loadedChemistryImages;
            const txtKey = subject === 'physics' ? physicsTxtAnswerKey :
                           subject === 'maths' ? mathsTxtAnswerKey : chemistryTxtAnswerKey;
            const count = subject === 'physics' ? physicsCount :
                          subject === 'maths' ? mathsCount : chemistryCount;
            
            // Parse txt key into array (1-indexed)
            const parsedTxt = txtKey ? parseAnswerKeyString(txtKey) : [];
            
            // Build per-question types: one image = one question in auto-advance mode
            const types = [];
            for (let q = 0; q < count; q++) {
                // Get the image for this question
                const img = images[q]; // 1 image per question
                if (img) {
                    // Extract number from filename (e.g. "12.jpg" -> 12, "q5.png" -> 5)
                    const match = img.name.match(/(\d+)/);
                    const imgNum = match ? parseInt(match[1]) : null;
                    
                    if (imgNum !== null && imgNum >= 1 && imgNum <= parsedTxt.length) {
                        // Use answer at 1-based index imgNum
                        types.push({ type: parsedTxt[imgNum - 1].type, answer: parsedTxt[imgNum - 1].answer });
                    } else {
                        // No matching answer - blank
                        types.push({ type: 'mcq', answer: '' });
                    }
                } else {
                    types.push({ type: 'mcq', answer: '' });
                }
            }
            return types;
        }

        // Get question type for current question
        function getCurrentQuestionType() {
            const sqn = getSubjectQuestionNumber(currentQuestion) - 1;
            // JSON mode: get type from loaded question data
            if (jsonModeEnabled) {
                const q = (jsonQuestions[currentSubject] || [])[sqn];
                return q ? q.type : 'mcq';
            }
            let types = [];
            if (currentSubject === 'physics') types = physicsQuestionTypes;
            else if (currentSubject === 'maths') types = mathsQuestionTypes;
            else types = chemistryQuestionTypes;
            if (types[sqn]) return types[sqn].type;
            return 'mcq'; // default
        }

        // Toggle between MCQ options and Numeric keypad
        function updateQuestionTypeUI() {
            const qType = getCurrentQuestionType();
            const mcqContainer = document.getElementById('mcq-options-container');
            const numContainer = document.getElementById('numeric-options-container');
            if (qType === 'numeric') {
                mcqContainer.style.display = 'none';
                numContainer.style.display = 'block';
            } else {
                mcqContainer.style.display = 'block';
                numContainer.style.display = 'none';
            }
        }

        // Handle numeric keypad input - integers only
        function numericInput(key) {
            if (testSubmitted) return;
            const sqn = getSubjectQuestionNumber(currentQuestion) - 1;
            let answers = currentSubject === 'physics' ? physicsAnswers : 
                          currentSubject === 'maths' ? mathsAnswers : chemistryAnswers;

            let current = answers[sqn] || '';

            if (key === 'clear') {
                current = '';
            } else if (key === 'back') {
                current = current.slice(0, -1);
            } else if (key === '00') {
                if (current !== '' && current !== '0') current += '00';
            } else {
                // Digit input
                if (current === '0') current = key; // replace leading zero
                else current += key;
                // Limit to 9 digits
                if (current.length > 9) return;
            }

            // Save back
            if (currentSubject === 'physics') physicsAnswers[sqn] = current;
            else if (currentSubject === 'maths') mathsAnswers[sqn] = current;
            else chemistryAnswers[sqn] = current;

            // Update display
            const display = document.getElementById('numeric-display');
            if (current === '') {
                display.textContent = 'Enter your answer';
                display.className = 'numeric-display empty';
            } else {
                display.textContent = current;
                display.className = 'numeric-display has-value';
            }

            updatePalette();
            updateMarkForReviewButton();
        }

        function loadAnswerForQuestion() {
            // Clear all option selections
            document.querySelectorAll('.option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Update UI for question type (MCQ vs Numeric)
            updateQuestionTypeUI();

            // Get the answer for current question
            const subjectQuestionNumber = getSubjectQuestionNumber(currentQuestion);
            let answer = '';
            
            if (currentSubject === 'physics') {
                answer = physicsAnswers[subjectQuestionNumber - 1];
            } else if (currentSubject === 'maths') {
                answer = mathsAnswers[subjectQuestionNumber - 1];
            } else if (currentSubject === 'chemistry') {
                answer = chemistryAnswers[subjectQuestionNumber - 1];
            }
            
            const qType = getCurrentQuestionType();

            if (qType === 'numeric') {
                // Update numeric display
                const display = document.getElementById('numeric-display');
                if (answer && answer !== '') {
                    display.textContent = answer;
                    display.className = 'numeric-display has-value';
                } else {
                    display.textContent = 'Enter your answer';
                    display.className = 'numeric-display empty';
                }
            } else {
                // Select the MCQ option if answered
                if (answer && ['A', 'B', 'C', 'D'].includes(answer)) {
                    const optionElement = document.querySelector(`.option[data-option="${answer}"]`);
                    if (optionElement) {
                        optionElement.classList.add('selected');
                    }
                }
            }
        }
        
        // Select an option
        function selectOption(option) {
            if (testSubmitted) return;
            
            const subjectQuestionNumber = getSubjectQuestionNumber(currentQuestion);
            let currentAnswer = '';
            if (currentSubject === 'physics') currentAnswer = physicsAnswers[subjectQuestionNumber - 1];
            else if (currentSubject === 'maths') currentAnswer = mathsAnswers[subjectQuestionNumber - 1];
            else if (currentSubject === 'chemistry') currentAnswer = chemistryAnswers[subjectQuestionNumber - 1];
            
            // Agar same option dobara click kiya toh clear karo
            if (currentAnswer === option) {
                document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                if (currentSubject === 'physics') physicsAnswers[subjectQuestionNumber - 1] = '';
                else if (currentSubject === 'maths') mathsAnswers[subjectQuestionNumber - 1] = '';
                else if (currentSubject === 'chemistry') chemistryAnswers[subjectQuestionNumber - 1] = '';

                // BEHAVIOUR LOG: deselect
                if (behaviourTrackerEnabled) {
                    behaviourLog.push({
                        eventType: 'deselect',
                        sinceStart: Math.floor((new Date() - startTime) / 1000),
                        timeOnQ: Math.floor((new Date() - questionStartTime) / 1000),
                        fromQ: currentQuestion,
                        toQ: currentQuestion,
                        direction: '—',
                        fromSubject: currentSubject,
                        answerAtLeave: option + ' hataya',
                    });
                }

                updatePalette();
                updateMarkForReviewButton();
                return;
            }
            
            // Clear previous selection
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Select new option
            const optionElement = document.querySelector(`.option[data-option="${option}"]`);
            optionElement.classList.add('selected');
            
            // Save answer
            if (currentSubject === 'physics') {
                physicsAnswers[subjectQuestionNumber - 1] = option;
                physicsMarked[subjectQuestionNumber - 1] = false;
            } else if (currentSubject === 'maths') {
                mathsAnswers[subjectQuestionNumber - 1] = option;
                mathsMarked[subjectQuestionNumber - 1] = false;
            } else if (currentSubject === 'chemistry') {
                chemistryAnswers[subjectQuestionNumber - 1] = option;
                chemistryMarked[subjectQuestionNumber - 1] = false;
            }

            // BEHAVIOUR LOG: select
            if (behaviourTrackerEnabled) {
                behaviourLog.push({
                    eventType: 'select',
                    sinceStart: Math.floor((new Date() - startTime) / 1000),
                    timeOnQ: Math.floor((new Date() - questionStartTime) / 1000),
                    fromQ: currentQuestion,
                    toQ: currentQuestion,
                    direction: '—',
                    fromSubject: currentSubject,
                    answerAtLeave: option + ' chuna',
                });
            }
            
            // Update UI
            updatePalette();
            updateMarkForReviewButton();
        }
        
        // Mark for review
        function markForReview() {
            if (testSubmitted) return;
            
            const subjectQuestionNumber = getSubjectQuestionNumber(currentQuestion);
            let isMarked = false;
            
            if (currentSubject === 'physics') {
                physicsMarked[subjectQuestionNumber - 1] = !physicsMarked[subjectQuestionNumber - 1];
                isMarked = physicsMarked[subjectQuestionNumber - 1];
            } else if (currentSubject === 'maths') {
                mathsMarked[subjectQuestionNumber - 1] = !mathsMarked[subjectQuestionNumber - 1];
                isMarked = mathsMarked[subjectQuestionNumber - 1];
            } else if (currentSubject === 'chemistry') {
                chemistryMarked[subjectQuestionNumber - 1] = !chemistryMarked[subjectQuestionNumber - 1];
                isMarked = chemistryMarked[subjectQuestionNumber - 1];
            }
            
            // Update button text
            const btn = document.getElementById('mark-review-btn');
            btn.textContent = isMarked ? 'Unmark Review' : 'Mark for Review';
            btn.classList.toggle('btn-warning', !isMarked);
            btn.classList.toggle('btn-success', isMarked);
            
            // Update UI
            updatePalette();
        }
        
        // Update mark for review button
        function updateMarkForReviewButton() {
            const subjectQuestionNumber = getSubjectQuestionNumber(currentQuestion);
            let isMarked = false;
            
            if (currentSubject === 'physics') {
                isMarked = physicsMarked[subjectQuestionNumber - 1];
            } else if (currentSubject === 'maths') {
                isMarked = mathsMarked[subjectQuestionNumber - 1];
            } else if (currentSubject === 'chemistry') {
                isMarked = chemistryMarked[subjectQuestionNumber - 1];
            }
            
            const btn = document.getElementById('mark-review-btn');
            btn.textContent = isMarked ? 'Unmark Review' : 'Mark for Review';
            btn.classList.toggle('btn-warning', !isMarked);
            btn.classList.toggle('btn-success', isMarked);
        }
        
        // Navigate to previous question
        function prevQuestion() {
            if (currentQuestion > 1) {
                const targetQ = currentQuestion - 1;
                // In subject timer mode, check if target question belongs to a locked subject
                if (subjectTimerMode) {
                    let targetSubject = targetQ <= physicsCount ? 'physics' :
                                       targetQ <= physicsCount + mathsCount ? 'maths' : 'chemistry';
                    if (subjectTimerLocked[targetSubject] && targetSubject !== currentSubject) {
                        alert(`⛔ ${targetSubject.charAt(0).toUpperCase() + targetSubject.slice(1)} ka time khatam ho gaya hai!`);
                        return;
                    }
                }
                loadQuestion(targetQ);
            }
        }
        
        // Navigate to next question
        function nextQuestion() {
            if (currentQuestion < totalQuestions) {
                const targetQ = currentQuestion + 1;
                // In subject timer mode, check if target question belongs to a locked subject
                if (subjectTimerMode) {
                    let targetSubject = targetQ <= physicsCount ? 'physics' :
                                       targetQ <= physicsCount + mathsCount ? 'maths' : 'chemistry';
                    if (subjectTimerLocked[targetSubject] && targetSubject !== currentSubject) {
                        alert(`⛔ ${targetSubject.charAt(0).toUpperCase() + targetSubject.slice(1)} ka time khatam ho gaya hai! Aap us subject mein wapas nahi ja sakte.`);
                        return;
                    }
                }
                loadQuestion(targetQ);
            }
        }
        
        // Navigate to specific question
        function navigateToQuestion(questionNumber) {
            if (questionNumber >= 1 && questionNumber <= totalQuestions) {
                // In subject timer mode, check if target belongs to locked subject
                if (subjectTimerMode) {
                    let targetSubject = questionNumber <= physicsCount ? 'physics' :
                                       questionNumber <= physicsCount + mathsCount ? 'maths' : 'chemistry';
                    if (subjectTimerLocked[targetSubject] && targetSubject !== currentSubject) {
                        alert(`⛔ ${targetSubject.charAt(0).toUpperCase() + targetSubject.slice(1)} ka time khatam ho gaya hai!`);
                        return;
                    }
                }
                loadQuestion(questionNumber);
            }
        }
        
        // Switch subject via tabs
        function switchSubject(subject) {
            // In subject timer mode, cannot switch to locked subject
            if (subjectTimerMode && subjectTimerLocked[subject] && currentSubject !== subject) {
                alert(`⛔ ${subject.charAt(0).toUpperCase() + subject.slice(1)} ka time khatam ho gaya hai! Ab is subject mein nahi ja sakte.`);
                return;
            }
            
            // If switching via subject timer auto-advance, update currentSubjectSeconds
            if (subjectTimerMode && subject !== currentSubject) {
                currentSubjectSeconds = subjectTimerSeconds[subject];
            }
            // Save current subject's state before switching
            subjectMemory[currentSubject].lastQuestion = currentQuestion;
            subjectMemory[currentSubject].lastImageIndex = currentImageIndex;
            
            let questionNumber = 1;
            
            // Check if we have a saved position for this subject
            if (subjectMemory[subject].lastQuestion !== null) {
                // Restore to last visited question in this subject
                questionNumber = subjectMemory[subject].lastQuestion;
                currentImageIndex = subjectMemory[subject].lastImageIndex;
            } else {
                // First time visiting this subject - go to first question
                if (subject === 'physics') {
                    questionNumber = 1;
                } else if (subject === 'maths') {
                    questionNumber = physicsCount + 1;
                } else if (subject === 'chemistry') {
                    questionNumber = physicsCount + mathsCount + 1;
                }
                currentImageIndex = 0;
            }
            
            isSubjectSwitching = true; // Mark that we're switching subjects
            loadQuestion(questionNumber);
        }
        
        // Update subject tabs UI
        function updateSubjectTabs() {
            document.querySelectorAll('.subject-tab').forEach(tab => {
                const tabSubject = tab.getAttribute('data-subject');
                
                if (tabSubject === currentSubject) {
                    tab.classList.remove('inactive');
                    tab.classList.add('active');
                    tab.style.opacity = '';
                    tab.style.cursor = '';
                } else {
                    tab.classList.remove('active');
                    tab.classList.add('inactive');
                    
                    // In subject timer mode, show locked subjects
                    if (subjectTimerMode && subjectTimerLocked[tabSubject]) {
                        tab.style.opacity = '0.4';
                        tab.style.cursor = 'not-allowed';
                        tab.title = 'Time khatam — locked';
                    } else {
                        tab.style.opacity = '';
                        tab.style.cursor = '';
                        tab.title = '';
                    }
                }
            });
        }
        
        // Update question palette UI
        function updatePalette() {
            // Update all palette buttons
            for (let i = 1; i <= totalQuestions; i++) {
                const paletteBtn = document.querySelector(`.palette-btn[data-question="${i}"]`);
                
                if (paletteBtn) {
                    // Remove all state classes
                    paletteBtn.classList.remove('not-visited', 'not-answered', 'answered', 'marked', 'current');
                    
                    // Determine which subject this question belongs to
                    let answer = '';
                    let isMarked = false;
                    let subjectQuestionNumber = 0;
                    
                    if (i <= physicsCount) {
                        subjectQuestionNumber = i;
                        answer = physicsAnswers[subjectQuestionNumber - 1];
                        isMarked = physicsMarked[subjectQuestionNumber - 1];
                    } else if (i <= physicsCount + mathsCount) {
                        subjectQuestionNumber = i - physicsCount;
                        answer = mathsAnswers[subjectQuestionNumber - 1];
                        isMarked = mathsMarked[subjectQuestionNumber - 1];
                    } else {
                        subjectQuestionNumber = i - physicsCount - mathsCount;
                        answer = chemistryAnswers[subjectQuestionNumber - 1];
                        isMarked = chemistryMarked[subjectQuestionNumber - 1];
                    }
                    
                    // Set state class
                    if (i === currentQuestion) {
                        paletteBtn.classList.add('current');
                    }
                    
                    if (isMarked) {
                        paletteBtn.classList.add('marked');
                    } else if (answer === '') {
                        paletteBtn.classList.add('not-answered');
                    } else {
                        paletteBtn.classList.add('answered');
                    }
                }
            }
        }
        


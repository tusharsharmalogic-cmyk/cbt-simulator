// Extracted from imu.html lines 5268-6123
        // Setup all event listeners
        function setupEventListeners() {
            // Start test button
            document.getElementById('start-test-btn').addEventListener('click', startTest);
            
            // Image navigation
            document.getElementById('prev-image-btn').addEventListener('click', prevImage);
            document.getElementById('next-image-btn').addEventListener('click', nextImage);
            
            // Option selection
            document.querySelectorAll('.option').forEach(option => {
                option.addEventListener('click', function() {
                    selectOption(this.getAttribute('data-option'));
                });
            });
            
            // Navigation buttons
            document.getElementById('prev-btn').addEventListener('click', prevQuestion);
            document.getElementById('next-btn').addEventListener('click', nextQuestion);
            document.getElementById('mark-review-btn').addEventListener('click', markForReview);
            document.getElementById('submit-btn').addEventListener('click', submitTest);
            
            // Subject tabs
            document.querySelectorAll('.subject-tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    switchSubject(this.getAttribute('data-subject'));
                });
            });
            
            // Answer input tracking
            document.getElementById('physics-answers-input').addEventListener('input', function() {
                document.getElementById('physics-answers-length').textContent = this.value.length;
                this.value = this.value.toUpperCase().replace(/[^ABCD]/g, '');
            });
            
            document.getElementById('maths-answers-input').addEventListener('input', function() {
                document.getElementById('maths-answers-length').textContent = this.value.length;
                this.value = this.value.toUpperCase().replace(/[^ABCD]/g, '');
            });
            
            document.getElementById('chemistry-answers-input').addEventListener('input', function() {
                document.getElementById('chemistry-answers-length').textContent = this.value.length;
                this.value = this.value.toUpperCase().replace(/[^ABCD]/g, '');
            });
            
            // Modal buttons
            document.getElementById('cancel-submit-btn').addEventListener('click', cancelSubmit);
            document.getElementById('calculate-results-btn').addEventListener('click', calculateResults);
            document.getElementById('close-results-btn').addEventListener('click', closeResults);
            document.getElementById('new-test-btn').addEventListener('click', startNewTest);
            document.getElementById('view-results-btn').addEventListener('click', viewResultsAgain);
            document.getElementById('final-new-test-btn').addEventListener('click', startNewTest);
            
            // History buttons
            document.getElementById('view-history-btn').addEventListener('click', showTestHistory);
            document.getElementById('close-history-btn').addEventListener('click', function() {
                document.getElementById('history-modal').style.display = 'none';
            });
            document.getElementById('clear-history-btn').addEventListener('click', clearAllHistory);
            document.getElementById('close-comparison-btn').addEventListener('click', function() {
                document.getElementById('comparison-modal').style.display = 'none';
            });
            
            // Multiple file selection for images (Question Images)
            document.getElementById('physics-images').addEventListener('change', function(e) {
                loadMultipleImages(e.target.files, 'physics', 100);
            });
            
            document.getElementById('maths-images').addEventListener('change', function(e) {
                loadMultipleImages(e.target.files, 'maths', 100);
            });
            
            document.getElementById('chemistry-images').addEventListener('change', function(e) {
                loadMultipleImages(e.target.files, 'chemistry', 100);
            });
            
            // Multiple file selection for answer images (Max 3 each)
            document.getElementById('physics-answers').addEventListener('change', function(e) {
                loadAnswerImages(e.target.files, 'physics', 3);
            });
            
            document.getElementById('maths-answers').addEventListener('change', function(e) {
                loadAnswerImages(e.target.files, 'maths', 3);
            });
            
            document.getElementById('chemistry-answers').addEventListener('change', function(e) {
                loadAnswerImages(e.target.files, 'chemistry', 3);
            });
            
            // Txt answer file inputs
            document.getElementById('physics-answers-txt').addEventListener('change', function(e) {
                loadAnswerTxtFiles(e.target.files, 'physics');
            });
            document.getElementById('maths-answers-txt').addEventListener('change', function(e) {
                loadAnswerTxtFiles(e.target.files, 'maths');
            });
            document.getElementById('chemistry-answers-txt').addEventListener('change', function(e) {
                loadAnswerTxtFiles(e.target.files, 'chemistry');
            });
            
            // Txt drop zones click handlers (reset value so multi-select always works)
            document.getElementById('physics-txt-drop-zone').addEventListener('click', function() {
                const inp = document.getElementById('physics-answers-txt');
                inp.value = '';
                inp.click();
            });
            document.getElementById('maths-txt-drop-zone').addEventListener('click', function() {
                const inp = document.getElementById('maths-answers-txt');
                inp.value = '';
                inp.click();
            });
            document.getElementById('chemistry-txt-drop-zone').addEventListener('click', function() {
                const inp = document.getElementById('chemistry-answers-txt');
                inp.value = '';
                inp.click();
            });
            
            // Auto-advance toggle
            document.getElementById('auto-advance-toggle').addEventListener('change', function() {
                autoAdvanceImage = this.checked;
            });
            
            // Setup drag-drop zones and click handlers
            setupDropZone('physics-drop-zone', 'physics-images', 'physics', 100, false);
            setupDropZone('maths-drop-zone', 'maths-images', 'maths', 100, false);
            setupDropZone('chemistry-drop-zone', 'chemistry-images', 'chemistry', 100, false);
            setupDropZone('physics-ans-drop-zone', 'physics-answers', 'physics', 3, true);
            setupDropZone('maths-ans-drop-zone', 'maths-answers', 'maths', 3, true);
            setupDropZone('chemistry-ans-drop-zone', 'chemistry-answers', 'chemistry', 3, true);
        }
        
        // Setup drag-drop zone functionality
        function setupDropZone(dropZoneId, inputId, subject, maxLimit, isAnswer) {
            const dropZone = document.getElementById(dropZoneId);
            const fileInput = document.getElementById(inputId);
            
            // Click to open file dialog
            dropZone.addEventListener('click', function() {
                fileInput.click();
            });
            
            // Drag over
            dropZone.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.style.borderColor = '#2196f3';
                this.style.background = '#e3f2fd';
            });
            
            // Drag leave
            dropZone.addEventListener('dragleave', function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.style.borderColor = isAnswer ? '#ff9800' : '#3f51b5';
                this.style.background = isAnswer ? '#fff3e0' : '#f5f5f5';
            });
            
            // Drop
            dropZone.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.style.borderColor = isAnswer ? '#ff9800' : '#3f51b5';
                this.style.background = isAnswer ? '#fff3e0' : '#f5f5f5';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    if (isAnswer) {
                        loadAnswerImages(files, subject, maxLimit);
                    } else {
                        loadMultipleImages(files, subject, maxLimit);
                    }
                }
            });
        }
        
        // Load multiple question images with limit
        function loadMultipleImages(files, subject, maxLimit) {
            console.log(`=== Loading ${subject} images ===`);
            console.log(`Total files received:`, files.length);
            console.log(`Files:`, files);
            
            const imageFiles = Array.from(files).filter(file => {
                const isImage = file.type.startsWith('image/');
                console.log(`File: ${file.name}, Type: ${file.type}, Is Image: ${isImage}`);
                return isImage;
            }); // Keep selection order - do NOT sort
            
            console.log(`Image files after filtering:`, imageFiles.length);
            
            if (imageFiles.length === 0) {
                alert('No image files found in the selection!');
                return;
            }
            
            // Get existing images for this subject
            let existingImages = [];
            if (subject === 'physics') {
                existingImages = loadedPhysicsImages;
            } else if (subject === 'maths') {
                existingImages = loadedMathsImages;
            } else if (subject === 'chemistry') {
                existingImages = loadedChemistryImages;
            }
            
            // Check if adding these would exceed limit
            const totalAfterAdding = existingImages.length + imageFiles.length;
            if (totalAfterAdding > maxLimit) {
                const remaining = maxLimit - existingImages.length;
                if (remaining <= 0) {
                    alert(`⚠️ Maximum limit (${maxLimit}) already reached! Cannot add more images.`);
                    return;
                }
                alert(`⚠️ You selected ${imageFiles.length} images, but only ${remaining} more can be added (limit: ${maxLimit}).\nOnly the first ${remaining} images will be loaded.`);
            }
            
            // Calculate how many we can actually add
            const availableSlots = maxLimit - existingImages.length;
            const limitedFiles = imageFiles.slice(0, availableSlots);
            console.log(`Loading ${limitedFiles.length} images (${existingImages.length} already loaded)`);
            
            // Store the loaded images with their data URLs
            const imagePromises = limitedFiles.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        resolve({
                            name: file.name,
                            dataURL: e.target.result,
                            size: file.size
                        });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });
            
            Promise.all(imagePromises).then(newImages => {
                console.log(`✓ Successfully loaded ${newImages.length} new images`);
                
                // APPEND new images to existing ones
                const allImages = [...existingImages, ...newImages];
                
                if (subject === 'physics') {
                    loadedPhysicsImages = allImages;
                    document.getElementById('physics-count-info').textContent = `✓ ${allImages.length} images selected`;
                    document.getElementById('physics-count-info').style.color = '#2e7d32';
                    document.getElementById('physics-count-info').style.fontWeight = 'bold';
                } else if (subject === 'maths') {
                    loadedMathsImages = allImages;
                    document.getElementById('maths-count-info').textContent = `✓ ${allImages.length} images selected`;
                    document.getElementById('maths-count-info').style.color = '#2e7d32';
                    document.getElementById('maths-count-info').style.fontWeight = 'bold';
                } else if (subject === 'chemistry') {
                    loadedChemistryImages = allImages;
                    document.getElementById('chemistry-count-info').textContent = `✓ ${allImages.length} images selected`;
                    document.getElementById('chemistry-count-info').style.color = '#2e7d32';
                    document.getElementById('chemistry-count-info').style.fontWeight = 'bold';
                }
                
                console.log(`✓ Total ${subject} images now: ${allImages.length}`, allImages.map(img => img.name));
            }).catch(error => {
                console.error('Error loading images:', error);
                alert('Error loading images. Please try again.');
            });
        }
        
        // Load answer key images with limit
        function loadAnswerImages(files, subject, maxLimit) {
            const imageFiles = Array.from(files).filter(file => {
                return file.type.startsWith('image/');
            }); // Keep selection order - do NOT sort
            
            if (imageFiles.length === 0) {
                alert('No image files found in the selection!');
                return;
            }
            
            // Get existing answer images
            let existingImages = [];
            if (subject === 'physics') {
                existingImages = loadedPhysicsAnswers;
            } else if (subject === 'maths') {
                existingImages = loadedMathsAnswers;
            } else if (subject === 'chemistry') {
                existingImages = loadedChemistryAnswers;
            }
            
            // Check if adding these would exceed limit
            const totalAfterAdding = existingImages.length + imageFiles.length;
            if (totalAfterAdding > maxLimit) {
                const remaining = maxLimit - existingImages.length;
                if (remaining <= 0) {
                    alert(`⚠️ Maximum limit (${maxLimit}) already reached for answer images! Cannot add more.`);
                    return;
                }
                alert(`⚠️ You selected ${imageFiles.length} answer images, but only ${remaining} more can be added (limit: ${maxLimit}).\nOnly the first ${remaining} images will be loaded.`);
            }
            
            // Take only up to available slots
            const availableSlots = maxLimit - existingImages.length;
            const limitedFiles = imageFiles.slice(0, availableSlots);
            
            // Store the loaded images with their data URLs
            const imagePromises = limitedFiles.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        resolve({
                            name: file.name,
                            dataURL: e.target.result,
                            size: file.size
                        });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });
            
            Promise.all(imagePromises).then(newImages => {
                // APPEND new images to existing ones
                const allImages = [...existingImages, ...newImages];
                
                if (subject === 'physics') {
                    loadedPhysicsAnswers = allImages;
                    document.getElementById('physics-ans-info').textContent = `✓ ${allImages.length} answer images selected`;
                    document.getElementById('physics-ans-info').style.color = '#2e7d32';
                    document.getElementById('physics-ans-info').style.fontWeight = 'bold';
                } else if (subject === 'maths') {
                    loadedMathsAnswers = allImages;
                    document.getElementById('maths-ans-info').textContent = `✓ ${allImages.length} answer images selected`;
                    document.getElementById('maths-ans-info').style.color = '#2e7d32';
                    document.getElementById('maths-ans-info').style.fontWeight = 'bold';
                } else if (subject === 'chemistry') {
                    loadedChemistryAnswers = allImages;
                    document.getElementById('chemistry-ans-info').textContent = `✓ ${allImages.length} answer images selected`;
                    document.getElementById('chemistry-ans-info').style.color = '#2e7d32';
                    document.getElementById('chemistry-ans-info').style.fontWeight = 'bold';
                }
                
                console.log(`✓ Total ${subject} answer images now: ${allImages.length}`, allImages.map(img => img.name));
            }).catch(error => {
                console.error('Error loading answer images:', error);
                alert('Error loading answer images. Please try again.');
            });
        }
        
        // Show per-file range inputs after files are selected
        function showTxtRangeInputs(files, subject) {
            const container = document.getElementById(subject + '-txt-ranges');
            container.innerHTML = '';
            container.style.display = 'block';
            
            files.forEach((file, i) => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex; align-items:center; gap:7px; flex-wrap:wrap; margin-bottom:5px; padding:6px 8px; background:#f1f8e9; border-radius:5px; border:1px solid #c8e6c9;';
                row.innerHTML = `
                    <span style="font-size:12px; color:#2e7d32; font-weight:bold; flex:1; min-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${file.name}">📄 ${file.name}</span>
                    <span style="font-size:12px; color:#555;">From:</span>
                    <input type="number" id="${subject}-txt-from-${i}" placeholder="1" min="1" style="width:70px; padding:2px 5px; border:1px solid #a5d6a7; border-radius:4px; font-size:12px;">
                    <span style="font-size:12px; color:#555;">To:</span>
                    <input type="number" id="${subject}-txt-to-${i}" placeholder="all" min="1" style="width:70px; padding:2px 5px; border:1px solid #a5d6a7; border-radius:4px; font-size:12px;">
                    <span style="font-size:11px; color:#999;">(blank=all)</span>
                    <button onclick="removeTxtFile('${subject}', ${i})" style="padding:2px 8px; background:#ef5350; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">✕</button>
                `;
                container.appendChild(row);
            });

            // Buttons row
            const btnRow = document.createElement('div');
            btnRow.style.cssText = 'display:flex; gap:8px; margin-top:6px;';

            const applyBtn = document.createElement('button');
            applyBtn.textContent = '✅ Apply Ranges & Load';
            applyBtn.style.cssText = 'padding:5px 14px; background:#4caf50; color:white; border:none; border-radius:5px; font-size:13px; cursor:pointer; font-weight:bold;';
            applyBtn.onclick = () => applyTxtRangesAndLoad(subject);

            const clearBtn = document.createElement('button');
            clearBtn.textContent = '🗑️ Clear All';
            clearBtn.style.cssText = 'padding:5px 12px; background:#ef5350; color:white; border:none; border-radius:5px; font-size:13px; cursor:pointer; font-weight:bold;';
            clearBtn.onclick = () => clearAllTxtFiles(subject);

            btnRow.appendChild(applyBtn);
            btnRow.appendChild(clearBtn);
            container.appendChild(btnRow);
        }

        // Remove a single txt file from the list
        function removeTxtFile(subject, indexToRemove) {
            const existing = window['_txtFiles_' + subject] || [];
            window['_txtFiles_' + subject] = existing.filter((_, i) => i !== indexToRemove);
            const remaining = window['_txtFiles_' + subject];
            if (remaining.length === 0) {
                clearAllTxtFiles(subject);
            } else {
                showTxtRangeInputs(remaining, subject);
                const infoEl = document.getElementById(subject + '-txt-info');
                infoEl.textContent = `${remaining.length} file(s) selected — set ranges then click Apply`;
                infoEl.style.color = '#f57c00';
            }
        }

        // Clear all txt files for a subject
        function clearAllTxtFiles(subject) {
            window['_txtFiles_' + subject] = [];
            if (subject === 'physics') physicsTxtAnswerKey = '';
            else if (subject === 'maths') mathsTxtAnswerKey = '';
            else if (subject === 'chemistry') chemistryTxtAnswerKey = '';
            const container = document.getElementById(subject + '-txt-ranges');
            container.innerHTML = '';
            container.style.display = 'none';
            const infoEl = document.getElementById(subject + '-txt-info');
            infoEl.textContent = '0 txt files selected';
            infoEl.style.color = '#666';
            infoEl.style.fontWeight = 'bold';
            const inp = document.getElementById(subject + '-answers-txt');
            if (inp) inp.value = '';
        }

        // Apply per-file ranges and load answer key
        function applyTxtRangesAndLoad(subject) {
            const stored = window['_txtFiles_' + subject];
            if (!stored || stored.length === 0) return;

            const promises = stored.map((file, i) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve({ content: e.target.result.trim(), index: i });
                reader.onerror = reject;
                reader.readAsText(file);
            }));

            Promise.all(promises).then(results => {
                let combined = '';
                let rangeDetails = [];

                results.forEach(({ content, index: i }) => {
                    // Keep A/B/C/D, digits (0-9), comma, minus, dot — strip everything else (spaces, newlines etc.)
                    // Then parse into question tokens to apply range slicing
                    const cleaned = content.toUpperCase().replace(/[^ABCD0-9,.\-]/g, '');
                    
                    // Parse tokens (each token = one question answer)
                    const tokens = parseAnswerKeyString(cleaned);

                    const fromEl = document.getElementById(subject + '-txt-from-' + i);
                    const toEl = document.getElementById(subject + '-txt-to-' + i);
                    const fromVal = fromEl ? parseInt(fromEl.value) : NaN;
                    const toVal = toEl ? parseInt(toEl.value) : NaN;

                    // Apply range slicing on tokens
                    const startIdx = (!isNaN(fromVal) && fromVal >= 1) ? fromVal - 1 : 0;
                    const endIdx = (!isNaN(toVal) && toVal >= 1) ? toVal : tokens.length;
                    const slicedTokens = tokens.slice(startIdx, endIdx);

                    // Reconstruct string from sliced tokens (preserving numeric values)
                    // Format: MCQ = single letter, Numeric = number, consecutive numerics separated by comma
                    let sliceStr = '';
                    slicedTokens.forEach((tok, ti) => {
                        if (tok.type === 'mcq') {
                            sliceStr += tok.answer;
                        } else {
                            // Add comma separator if previous was also numeric
                            if (ti > 0 && slicedTokens[ti-1].type === 'numeric') sliceStr += ',';
                            sliceStr += tok.answer;
                        }
                    });

                    combined += sliceStr;
                    const label = (isNaN(fromVal) && isNaN(toVal)) ? 'all' : `${startIdx+1}–${startIdx + slicedTokens.length}`;
                    rangeDetails.push(`File${i+1}(${label}:${slicedTokens.length}Q)`);
                });

                const infoEl = document.getElementById(subject + '-txt-info');
                // Count total questions in combined
                const totalParsed = parseAnswerKeyString(combined);
                const numericCount = totalParsed.filter(t => t.type === 'numeric').length;
                const mcqCount = totalParsed.filter(t => t.type === 'mcq').length;
                infoEl.textContent = `✓ ${stored.length} file(s) → ${totalParsed.length} questions (${mcqCount} MCQ + ${numericCount} Numeric) | ${rangeDetails.join(' + ')}`;
                infoEl.style.color = '#2e7d32';
                infoEl.style.fontWeight = 'bold';

                if (subject === 'physics') physicsTxtAnswerKey = combined;
                else if (subject === 'maths') mathsTxtAnswerKey = combined;
                else if (subject === 'chemistry') chemistryTxtAnswerKey = combined;

                console.log(`✓ ${subject} txt answer key loaded: ${combined}`);
                console.log(`✓ ${subject} parsed:`, totalParsed);
            }).catch(err => {
                console.error('Error reading txt files:', err);
                alert('Error reading txt files. Please try again.');
            });
        }

        // Load answer key from txt files — append mode (purani files replace nahi hongi)
        function loadAnswerTxtFiles(files, subject) {
            const txtFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.txt'));
            if (txtFiles.length === 0) {
                alert('Please select .txt files only!');
                return;
            }

            // Nayi files purani ke saath JODO, replace mat karo
            const existingFiles = window['_txtFiles_' + subject] || [];
            const mergedFiles = [...existingFiles, ...txtFiles];

            if (mergedFiles.length > 10) {
                alert('Maximum 10 txt files allowed! Pehle kuch hatao.');
                return;
            }

            window['_txtFiles_' + subject] = mergedFiles;
            showTxtRangeInputs(mergedFiles, subject);

            const infoEl = document.getElementById(subject + '-txt-info');
            infoEl.textContent = `${mergedFiles.length} file(s) selected — set ranges above then click Apply`;
            infoEl.style.color = '#f57c00';
            infoEl.style.fontWeight = 'bold';
        }
        
        // Detect available images from folders - Uses loaded images from File API
        function detectAvailableImages() {
            // If images are loaded from folders, use them
            if (loadedPhysicsImages.length > 0) {
                physicsImages = loadedPhysicsImages.map((img, index) => ({
                    id: index + 1,
                    questions: 1, // 1 question per image
                    path: img.dataURL,
                    name: img.name
                }));
            } else {
                // Fallback: Try to load from default paths with flexible naming
                physicsImages = [];
                for (let i = 1; i <= 100; i++) {
                    physicsImages.push({
                        id: i,
                        questions: i === 3 ? 5 : 10,
                        path: `images/physics/q${i}.jpg`
                    });
                }
            }
            
            if (loadedMathsImages.length > 0) {
                mathsImages = loadedMathsImages.map((img, index) => ({
                    id: index + 1,
                    questions: 1,
                    path: img.dataURL,
                    name: img.name
                }));
            } else {
                mathsImages = [];
                for (let i = 1; i <= 100; i++) {
                    mathsImages.push({
                        id: i,
                        questions: i === 3 ? 5 : 10,
                        path: `images/maths/q${i}.jpg`
                    });
                }
            }
            
            if (loadedChemistryImages.length > 0) {
                chemistryImages = loadedChemistryImages.map((img, index) => ({
                    id: index + 1,
                    questions: 1,
                    path: img.dataURL,
                    name: img.name
                }));
            } else {
                chemistryImages = [];
                for (let i = 1; i <= 100; i++) {
                    chemistryImages.push({
                        id: i,
                        questions: i === 3 ? 5 : 10,
                        path: `images/chemistry/q${i}.jpg`
                    });
                }
            }
            
            // Answer key images - Use loaded answer images if available
            if (loadedPhysicsAnswers.length > 0) {
                physicsAnswerImages = loadedPhysicsAnswers.map((img, index) => ({
                    id: index + 1,
                    path: img.dataURL,
                    name: img.name
                }));
            } else {
                physicsAnswerImages = [];
                for (let i = 1; i <= 3; i++) {
                    physicsAnswerImages.push({
                        id: i,
                        path: `images/answer/physics/a${i}.jpg`
                    });
                }
            }
            
            if (loadedMathsAnswers.length > 0) {
                mathsAnswerImages = loadedMathsAnswers.map((img, index) => ({
                    id: index + 1,
                    path: img.dataURL,
                    name: img.name
                }));
            } else {
                mathsAnswerImages = [];
                for (let i = 1; i <= 3; i++) {
                    mathsAnswerImages.push({
                        id: i,
                        path: `images/answer/maths/a${i}.jpg`
                    });
                }
            }
            
            if (loadedChemistryAnswers.length > 0) {
                chemistryAnswerImages = loadedChemistryAnswers.map((img, index) => ({
                    id: index + 1,
                    path: img.dataURL,
                    name: img.name
                }));
            } else {
                chemistryAnswerImages = [];
                for (let i = 1; i <= 3; i++) {
                    chemistryAnswerImages.push({
                        id: i,
                        path: `images/answer/chemistry/a${i}.jpg`
                    });
                }
            }
            
            const loadSource = loadedPhysicsImages.length > 0 || loadedMathsImages.length > 0 || loadedChemistryImages.length > 0 ? 'from selected files' : 'from default paths';
            console.log(`Images detected ${loadSource}: Physics=${physicsImages.length}, Maths=${mathsImages.length}, Chemistry=${chemistryImages.length}`);
            console.log(`Answer images: Physics=${physicsAnswerImages.length}, Maths=${mathsAnswerImages.length}, Chemistry=${chemistryAnswerImages.length}`);
        }
        
        // Start the test
        function startTest() {
            // Get user inputs
            userName = document.getElementById('user-name').value.trim();
            testName = document.getElementById('test-name').value.trim() || 'Test';
            if (userName === "") {
                alert("Please enter your name");
                return;
            }
            
            // Re-detect images to include any newly loaded folder images
            detectAvailableImages();
            
            // Check if images are loaded
            const hasPhysicsImages = loadedPhysicsImages.length > 0 || physicsImages.length > 0;
            const hasMathsImages = loadedMathsImages.length > 0 || mathsImages.length > 0;
            const hasChemistryImages = loadedChemistryImages.length > 0 || chemistryImages.length > 0;

            if (jsonModeEnabled) {
                // In JSON mode: check at least one subject has questions
                const hasJsonQ = jsonQuestions.physics.length > 0 || jsonQuestions.maths.length > 0 || jsonQuestions.chemistry.length > 0;
                if (!hasJsonQ) {
                    alert('⚠️ JSON Mode enabled but no question files loaded!\n\nPlease upload at least one subject question file (JSON or TXT).');
                    return;
                }
            } else if (!hasPhysicsImages && !hasMathsImages && !hasChemistryImages) {
                alert("⚠️ No images loaded!\n\nPlease select image folders using the buttons above, or make sure images are placed in the default folders:\n- images/physics/\n- images/maths/\n- images/chemistry/");
                return;
            }
            
            testType = "custom"; // Always custom now
            
            {
                physicsCount = parseInt(document.getElementById('physics-count').value) || 0;
                mathsCount = parseInt(document.getElementById('maths-count').value) || 0;
                chemistryCount = parseInt(document.getElementById('chemistry-count').value) || 0;
                customTime = parseInt(document.getElementById('test-time').value) || 180;

                // JSON mode: cap counts to loaded question count
                if (jsonModeEnabled) {
                    if (jsonQuestions.physics.length > 0) physicsCount = Math.min(physicsCount, jsonQuestions.physics.length) || jsonQuestions.physics.length;
                    if (jsonQuestions.maths.length > 0)   mathsCount   = Math.min(mathsCount,   jsonQuestions.maths.length)   || jsonQuestions.maths.length;
                    if (jsonQuestions.chemistry.length > 0) chemistryCount = Math.min(chemistryCount, jsonQuestions.chemistry.length) || jsonQuestions.chemistry.length;
                }

                totalQuestions = physicsCount + mathsCount + chemistryCount;
                if (totalQuestions === 0) {
                    alert("Please select at least one question");
                    return;
                }
            }
            
            // Set timer
            totalSeconds = customTime * 60;
            
            // Read toggle states
            autoAdvanceImage = document.getElementById('auto-advance-toggle').checked;
            filenameAnsMode = document.getElementById('filename-ans-toggle').checked;
            subjectTimerMode = document.getElementById('subject-timer-toggle').checked;
            behaviourTrackerEnabled = document.getElementById('behaviour-tracker-toggle').checked;
            behaviourLog = [];
            
            if (subjectTimerMode) {
                const pTime = parseInt(document.getElementById('physics-time').value) || 60;
                const mTime = parseInt(document.getElementById('maths-time').value) || 60;
                const cTime = parseInt(document.getElementById('chemistry-time').value) || 60;
                subjectTimerSeconds = {
                    physics: physicsCount > 0 ? pTime * 60 : 0,
                    maths: mathsCount > 0 ? mTime * 60 : 0,
                    chemistry: chemistryCount > 0 ? cTime * 60 : 0
                };
                subjectTimerLocked = { physics: physicsCount === 0, maths: mathsCount === 0, chemistry: chemistryCount === 0 };
                // Set total timer = sum of all subject times
                totalSeconds = subjectTimerSeconds.physics + subjectTimerSeconds.maths + subjectTimerSeconds.chemistry;
                customTime = Math.floor(totalSeconds / 60);
                // Current subject timer starts at physics time
                const firstSubject = physicsCount > 0 ? 'physics' : (mathsCount > 0 ? 'maths' : 'chemistry');
                currentSubjectSeconds = subjectTimerSeconds[firstSubject];
            } else {
                subjectTimerLocked = { physics: false, maths: false, chemistry: false };
            }
            
            // Set initial timer display in MM:SS format
            document.getElementById('timer').textContent = `${customTime}:00`;
            
            // Initialize arrays
            physicsAnswers = new Array(physicsCount).fill('');
            mathsAnswers = new Array(mathsCount).fill('');
            chemistryAnswers = new Array(chemistryCount).fill('');
            
            physicsMarked = new Array(physicsCount).fill(false);
            mathsMarked = new Array(mathsCount).fill(false);
            chemistryMarked = new Array(chemistryCount).fill(false);
            
            timeSpent = new Array(totalQuestions).fill(0);
            
            // Parse question types from txt answer key (if available)
            applyParsedQuestionTypes();
            
            // Initialize subject memory
            subjectMemory = {
                physics: { lastQuestion: 1, lastImageIndex: 0 },
                maths: { lastQuestion: null, lastImageIndex: 0 },
                chemistry: { lastQuestion: null, lastImageIndex: 0 }
            };
            
            // Update UI with configuration
            document.getElementById('display-user-name').textContent = userName;
            document.getElementById('display-user-name-instructions').textContent = userName;
            document.getElementById('results-user-name').textContent = userName;
            document.getElementById('results-test-name').textContent = testName;
            
            const timeText = customTime >= 60 ? 
                `${Math.floor(customTime/60)} hour${customTime >= 120 ? 's' : ''} ${customTime%60} min` : 
                `${customTime} minutes`;
            
            document.getElementById('test-config-summary').textContent = 
                `${testType === 'full' ? 'Full Mock Test' : 'Custom Test'} | ${totalQuestions} Questions | ${timeText}`;
            document.getElementById('test-config-summary-instructions').textContent = 
                `${testType === 'full' ? 'Full Mock Test' : 'Custom Test'} | ${totalQuestions} Questions | ${timeText}`;
            
            document.getElementById('test-stats').textContent = 
                `Physics: ${physicsCount} | Maths: ${mathsCount} | Chemistry: ${chemistryCount}`;
            document.getElementById('test-stats-instructions').textContent = 
                `Physics: ${physicsCount} | Maths: ${mathsCount} | Chemistry: ${chemistryCount}`;
            
            document.getElementById('total-time-minutes').textContent = customTime;
            
            // Update subject ranges
            document.getElementById('physics-max').textContent = physicsCount;
            document.getElementById('maths-start').textContent = physicsCount + 1;
            document.getElementById('maths-max').textContent = physicsCount + mathsCount;
            document.getElementById('chemistry-start').textContent = physicsCount + mathsCount + 1;
            document.getElementById('chemistry-max').textContent = totalQuestions;
            
            // Update palette ranges
            document.getElementById('palette-physics-max').textContent = physicsCount;
            document.getElementById('palette-maths-start').textContent = physicsCount + 1;
            document.getElementById('palette-maths-max').textContent = physicsCount + mathsCount;
            document.getElementById('palette-chemistry-start').textContent = physicsCount + mathsCount + 1;
            document.getElementById('palette-chemistry-max').textContent = totalQuestions;
            
            // Update answer key counts
            document.getElementById('physics-key-count').textContent = physicsCount;
            document.getElementById('maths-key-count').textContent = mathsCount;
            document.getElementById('chemistry-key-count').textContent = chemistryCount;
            
            // Set answer input max lengths
            document.getElementById('physics-answers-input').maxLength = physicsCount;
            document.getElementById('maths-answers-input').maxLength = mathsCount;
            document.getElementById('chemistry-answers-input').maxLength = chemistryCount;
            
            // Update placeholder text
            document.getElementById('physics-answers-input').placeholder = 'A'.repeat(physicsCount);
            document.getElementById('maths-answers-input').placeholder = 'A'.repeat(mathsCount);
            document.getElementById('chemistry-answers-input').placeholder = 'A'.repeat(chemistryCount);
            
            // Initialize question palette
            initQuestionPalette();
            
            // Hide login, show test
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('test-container').style.display = 'block';
            
            // Load first question
            loadQuestion(currentQuestion);
            
            // Start timer
            startTimer();
            testStarted = true;
        }
        
        // Initialize question palette buttons
        function initQuestionPalette() {
            // Clear existing palette buttons
            document.getElementById('physics-palette').innerHTML = '';
            document.getElementById('maths-palette').innerHTML = '';
            document.getElementById('chemistry-palette').innerHTML = '';
            
            // Physics palette
            const physicsPalette = document.getElementById('physics-palette');
            for (let i = 1; i <= physicsCount; i++) {
                const btn = createPaletteButton(i, 'physics');
                physicsPalette.appendChild(btn);
            }
            
            // Maths palette
            const mathsPalette = document.getElementById('maths-palette');
            for (let i = 1; i <= mathsCount; i++) {
                const btn = createPaletteButton(i + physicsCount, 'maths');
                mathsPalette.appendChild(btn);
            }
            
            // Chemistry palette
            const chemistryPalette = document.getElementById('chemistry-palette');
            for (let i = 1; i <= chemistryCount; i++) {
                const btn = createPaletteButton(i + physicsCount + mathsCount, 'chemistry');
                chemistryPalette.appendChild(btn);
            }
        }
        
        // Create palette button
        function createPaletteButton(questionNumber, subject) {
            const btn = document.createElement('button');
            btn.className = 'palette-btn not-visited';
            // Check if this is a numeric question
            const sqn = subject === 'physics' ? questionNumber - 1 :
                        subject === 'maths' ? questionNumber - physicsCount - 1 :
                        questionNumber - physicsCount - mathsCount - 1;
            const types = subject === 'physics' ? physicsQuestionTypes :
                          subject === 'maths' ? mathsQuestionTypes : chemistryQuestionTypes;
            const isNumeric = types[sqn] && types[sqn].type === 'numeric';
            if (isNumeric) {
                btn.classList.add('numeric-type');
                btn.title = `Q${questionNumber} - Integer Type`;
                btn.innerHTML = `${questionNumber}<span style="font-size:7px;display:block;color:inherit;opacity:0.8">INT</span>`;
            } else {
                btn.textContent = questionNumber;
            }
            btn.setAttribute('data-question', questionNumber);
            btn.setAttribute('data-subject', subject);
            btn.addEventListener('click', function() {
                navigateToQuestion(parseInt(this.getAttribute('data-question')));
            });
            return btn;
        }
        


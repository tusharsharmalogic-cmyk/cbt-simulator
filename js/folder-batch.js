// Extracted from imu.html lines 5018-5267
        // ===== FOLDER BATCH SYSTEM FUNCTIONS =====
        let _currentBatchSubject = null;
        let _batchTempImages = [];
        let _batchTempTxt = '';

        function openFolderBatchDialog(subject) {
            _currentBatchSubject = subject;
            _batchTempImages = [];
            _batchTempTxt = '';
            document.getElementById('batch-label-input').value = '';
            document.getElementById('batch-img-info').textContent = '0 images selected';
            document.getElementById('batch-img-info').style.color = '#666';
            document.getElementById('batch-txt-info').textContent = 'No txt file selected';
            document.getElementById('batch-txt-info').style.color = '#666';
            document.getElementById('batch-img-input').value = '';
            document.getElementById('batch-txt-input').value = '';
            const colors = { physics: '#1565c0', maths: '#2e7d32', chemistry: '#880e4f' };
            const icons = { physics: '⚛️', maths: '📐', chemistry: '🧪' };
            document.getElementById('batch-dialog-title').textContent = `${icons[subject]} Add ${subject.charAt(0).toUpperCase() + subject.slice(1)} Folder Batch`;
            document.getElementById('folder-batch-dialog').style.display = 'flex';
        }

        function closeFolderBatchDialog() {
            document.getElementById('folder-batch-dialog').style.display = 'none';
            _currentBatchSubject = null;
            _batchTempImages = [];
            _batchTempTxt = '';
        }

        function onBatchImagesSelected(files) {
            const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
            if (imageFiles.length === 0) {
                alert('Koi image file nahi mili!');
                return;
            }
            const infoEl = document.getElementById('batch-img-info');
            infoEl.textContent = `Loading ${imageFiles.length} images...`;
            infoEl.style.color = '#f57c00';

            const promises = imageFiles.map(file => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve({ name: file.name, dataURL: e.target.result });
                reader.onerror = reject;
                reader.readAsDataURL(file);
            }));

            Promise.all(promises).then(imgs => {
                _batchTempImages = imgs;
                infoEl.textContent = `✓ ${imgs.length} images selected: ${imgs.map(i => i.name).slice(0, 5).join(', ')}${imgs.length > 5 ? '...' : ''}`;
                infoEl.style.color = '#2e7d32';
            }).catch(() => {
                infoEl.textContent = 'Error loading images';
                infoEl.style.color = '#c62828';
            });
        }

        function onBatchTxtSelected(files) {
            const file = files[0];
            if (!file || !file.name.toLowerCase().endsWith('.txt')) {
                alert('Please select a .txt file!');
                return;
            }
            const infoEl = document.getElementById('batch-txt-info');
            infoEl.textContent = `Reading ${file.name}...`;
            infoEl.style.color = '#f57c00';

            const reader = new FileReader();
            reader.onload = e => {
                const content = e.target.result.trim();
                // Clean: keep A-D, 0-9, comma, minus, dot
                const cleaned = content.toUpperCase().replace(/[^ABCD0-9,.\-]/g, '');
                _batchTempTxt = cleaned;
                const parsed = parseAnswerKeyString(cleaned);
                const mcq = parsed.filter(t => t.type === 'mcq').length;
                const num = parsed.filter(t => t.type === 'numeric').length;
                infoEl.textContent = `✓ ${file.name} — ${parsed.length} answers (${mcq} MCQ + ${num} Numeric)`;
                infoEl.style.color = '#2e7d32';
            };
            reader.onerror = () => {
                infoEl.textContent = 'Error reading file';
                infoEl.style.color = '#c62828';
            };
            reader.readAsText(file);
        }

        function confirmAddBatch() {
            if (!_currentBatchSubject) return;
            if (_batchTempImages.length === 0) {
                alert('Pehle images select karo!');
                return;
            }
            
            const label = document.getElementById('batch-label-input').value.trim() || `Folder ${folderBatches[_currentBatchSubject].length + 1}`;
            const batch = {
                label: label,
                images: _batchTempImages,
                answerKey: _batchTempTxt  // cleaned txt string; can be empty
            };
            
            folderBatches[_currentBatchSubject].push(batch);
            updateBatchUI(_currentBatchSubject);
            
            // Also sync into loadedImages so existing system works
            syncBatchesToLoadedImages(_currentBatchSubject);
            
            closeFolderBatchDialog();
        }

        function removeBatch(subject, index) {
            folderBatches[subject].splice(index, 1);
            updateBatchUI(subject);
            syncBatchesToLoadedImages(subject);
        }

        function updateBatchUI(subject) {
            const listEl = document.getElementById(subject + '-batch-list');
            const summaryEl = document.getElementById(subject + '-batch-summary');
            const batches = folderBatches[subject];
            
            if (batches.length === 0) {
                listEl.innerHTML = '';
                summaryEl.textContent = '0 batches — 0 images total';
                return;
            }
            
            const totalImgs = batches.reduce((acc, b) => acc + b.images.length, 0);
            summaryEl.textContent = `${batches.length} batch${batches.length > 1 ? 'es' : ''} — ${totalImgs} images total`;
            
            listEl.innerHTML = batches.map((b, i) => {
                const hasKey = b.answerKey && b.answerKey.length > 0;
                const parsed = hasKey ? parseAnswerKeyString(b.answerKey) : [];
                const ansInfo = hasKey ? `📄 ${parsed.length} answers` : '⚠️ No ans.txt';
                const ansColor = hasKey ? '#2e7d32' : '#f57c00';
                return `
                    <div style="display:flex; align-items:center; gap:8px; padding:6px 8px; margin-bottom:5px; background:rgba(255,255,255,0.8); border-radius:6px; border:1px solid rgba(0,0,0,0.1); flex-wrap:wrap;">
                        <span style="font-size:15px;">📁</span>
                        <span style="font-weight:600; flex:1; min-width:80px;">${b.label}</span>
                        <span style="font-size:12px; color:#555; background:#f0f0f0; padding:2px 8px; border-radius:10px;">🖼️ ${b.images.length} images</span>
                        <span style="font-size:12px; color:${ansColor}; background:#f9f9f9; padding:2px 8px; border-radius:10px;">${ansInfo}</span>
                        <button onclick="removeBatch('${subject}', ${i})" style="padding:2px 8px; background:#ef5350; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px; font-weight:bold;">✕ Remove</button>
                    </div>
                `;
            }).join('');
        }

        // Sync folder batches into the existing loadedXImages arrays
        function syncBatchesToLoadedImages(subject) {
            const batches = folderBatches[subject];
            const allImages = [];
            batches.forEach(b => {
                b.images.forEach(img => {
                    // Store as "BatchLabel/filename" so result table shows folder context
                    allImages.push({
                        dataURL: img.dataURL,
                        size: img.size,
                        name: b.label + '/' + img.name,
                        originalName: img.name  // keep original for number extraction
                    });
                });
            });
            
            if (subject === 'physics') {
                loadedPhysicsImages = allImages;
                document.getElementById('physics-count-info').textContent = allImages.length > 0 ? `✓ ${allImages.length} images (from folder batches)` : '0 images selected';
                document.getElementById('physics-count-info').style.color = allImages.length > 0 ? '#2e7d32' : '#666';
            } else if (subject === 'maths') {
                loadedMathsImages = allImages;
                document.getElementById('maths-count-info').textContent = allImages.length > 0 ? `✓ ${allImages.length} images (from folder batches)` : '0 images selected';
                document.getElementById('maths-count-info').style.color = allImages.length > 0 ? '#2e7d32' : '#666';
            } else if (subject === 'chemistry') {
                loadedChemistryImages = allImages;
                document.getElementById('chemistry-count-info').textContent = allImages.length > 0 ? `✓ ${allImages.length} images (from folder batches)` : '0 images selected';
                document.getElementById('chemistry-count-info').style.color = allImages.length > 0 ? '#2e7d32' : '#666';
            }
        }

        // Build answer key lookup from folder batches (image filename number → answer)
        // Returns: Map { "BatchLabel/filename" → {type, answer} }
        function buildBatchAnswerMap(subject) {
            const batches = folderBatches[subject];
            const map = new Map();
            
            batches.forEach(batch => {
                if (!batch.answerKey) return;
                const parsed = parseAnswerKeyString(batch.answerKey);
                
                batch.images.forEach(img => {
                    // img.name here is ORIGINAL (e.g. "1.jpg") — batch.images not yet modified
                    // Extract number from original filename: "12.jpg" → 12, "q5.png" → 5
                    const match = img.name.match(/(\d+)/);
                    if (!match) return;
                    const num = parseInt(match[1]);
                    if (num >= 1 && num <= parsed.length) {
                        // Key = display name "BatchLabel/filename" (same as stored in loadedImages)
                        const displayName = batch.label + '/' + img.name;
                        map.set(displayName, parsed[num - 1]);
                        // Also store with just original name as fallback
                        map.set(img.name, parsed[num - 1]);
                    }
                });
            });
            
            return map;
        }

        // Enhanced buildFilenameBasedTypes: checks folder batches first, then falls back to single txt key
        function buildFilenameBasedTypesEnhanced(subject) {
            const images = subject === 'physics' ? loadedPhysicsImages :
                           subject === 'maths' ? loadedMathsImages : loadedChemistryImages;
            const count = subject === 'physics' ? physicsCount :
                          subject === 'maths' ? mathsCount : chemistryCount;
            
            const hasBatches = folderBatches[subject].length > 0;
            
            // Try batch answer map first
            const batchMap = hasBatches ? buildBatchAnswerMap(subject) : new Map();
            
            // Fallback: single txt key
            const txtKey = subject === 'physics' ? physicsTxtAnswerKey :
                           subject === 'maths' ? mathsTxtAnswerKey : chemistryTxtAnswerKey;
            const parsedTxt = txtKey ? parseAnswerKeyString(txtKey) : [];
            
            const types = [];
            for (let q = 0; q < count; q++) {
                const img = images[q];
                if (!img) {
                    types.push({ type: 'mcq', answer: '' });
                    continue;
                }
                
                // Check batch map by exact display name (e.g. "EMI/1.jpg")
                if (batchMap.has(img.name)) {
                    types.push(batchMap.get(img.name));
                    continue;
                }
                
                // Fallback: use filename number with single txt key
                // Use originalName if available (avoids batch label digits confusing the match)
                const nameForNum = img.originalName || img.name;
                const match = nameForNum.match(/(\d+)/);
                const imgNum = match ? parseInt(match[1]) : null;
                if (imgNum !== null && imgNum >= 1 && imgNum <= parsedTxt.length) {
                    types.push({ type: parsedTxt[imgNum - 1].type, answer: parsedTxt[imgNum - 1].answer });
                } else {
                    types.push({ type: 'mcq', answer: '' });
                }
            }
            return types;
        }



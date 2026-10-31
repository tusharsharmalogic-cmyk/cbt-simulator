// Extracted from imu.html lines 6946-7050
        // Toggle subject timer UI visibility
        function toggleSubjectTimerUI() {
            const on = document.getElementById('subject-timer-toggle').checked;
            document.getElementById('subject-timer-inputs').style.display = on ? 'block' : 'none';
        }
        
        function startTimer() {
            console.log('Starting timer with totalSeconds:', totalSeconds);
            updateTimerDisplay();
            timerInterval = setInterval(updateTimer, 1000);
        }
        
        function updateTimer() {
            if (subjectTimerMode) {
                // Decrement current subject timer
                if (currentSubjectSeconds > 0) {
                    currentSubjectSeconds--;
                    subjectTimerSeconds[currentSubject]--;
                }
                
                // If current subject timer hit zero
                if (currentSubjectSeconds <= 0 && !subjectTimerLocked[currentSubject]) {
                    subjectTimerLocked[currentSubject] = true;
                    subjectTimerSeconds[currentSubject] = 0;
                    
                    // Find next unlocked subject
                    const order = ['physics', 'maths', 'chemistry'];
                    const nextSubject = order.find(s => !subjectTimerLocked[s]);
                    
                    if (nextSubject) {
                        // Auto-move to next subject
                        currentSubjectSeconds = subjectTimerSeconds[nextSubject];
                        alert(`⏰ ${currentSubject.charAt(0).toUpperCase() + currentSubject.slice(1)} ka time khatam! Ab ${nextSubject.charAt(0).toUpperCase() + nextSubject.slice(1)} pe move ho rahe hain.`);
                        switchSubject(nextSubject);
                    } else {
                        // All subjects done
                        clearInterval(timerInterval);
                        submitTest(true);
                        return;
                    }
                }
                
                // Update total remaining
                totalSeconds = Object.values(subjectTimerSeconds).reduce((a, b) => a + b, 0);
                if (totalSeconds < 0) totalSeconds = 0;
            } else {
                if (totalSeconds <= 0) {
                    clearInterval(timerInterval);
                    submitTest(true);
                    return;
                }
                totalSeconds--;
            }
            
            updateTimerDisplay();
        }
        
        function updateTimerDisplay() {
            const timerElement = document.getElementById('timer');
            if (!timerElement) return;
            
            let displaySeconds;
            if (subjectTimerMode) {
                displaySeconds = currentSubjectSeconds;
            } else {
                displaySeconds = totalSeconds;
            }
            
            const totalMinutes = Math.floor(displaySeconds / 60);
            const seconds = displaySeconds % 60;
            
            timerElement.textContent = `${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (subjectTimerMode) {
                // Show which subject timer is running
                const subName = currentSubject.charAt(0).toUpperCase() + currentSubject.slice(1);
                timerElement.title = `${subName} time remaining`;
                const lbl = document.getElementById('subject-timer-label');
                if (lbl) { lbl.textContent = `[${subName}]`; lbl.style.display = ''; }
            } else {
                const lbl = document.getElementById('subject-timer-label');
                if (lbl) lbl.style.display = 'none';
            }
            
            if (totalMinutes < 5) {
                timerElement.style.color = '#ff5252';
            } else if (totalMinutes < 15) {
                timerElement.style.color = '#ffa726';
            } else {
                timerElement.style.color = '#ffeb3b';
            }
        }
        
        // Toggle submit button based on checkbox
        function toggleSubmitBtn() {
            const checkbox = document.getElementById('submit-confirm-check');
            const btn = document.getElementById('submit-btn');
            if (checkbox && btn) {
                btn.disabled = !checkbox.checked;
                btn.style.opacity = checkbox.checked ? '1' : '0.4';
                btn.style.cursor = checkbox.checked ? 'pointer' : 'not-allowed';
            }
        }
        
        // Submit test


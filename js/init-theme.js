// Extracted from imu.html lines 3460-3562
        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            setupEventListeners();
            detectAvailableImages();
            initializeDarkMode();
            loadTestHistory();
            
            // Redraw analytics graphs on resize
            window.addEventListener('resize', function() {
                if (document.getElementById('trend-section').style.display !== 'none') {
                    drawTrendGraph();
                }
            });
            
            // Image fullscreen on click
            document.getElementById('question-image').addEventListener('click', function() {
                if (this.src && !this.src.endsWith('#') && this.naturalWidth > 0) {
                    openFullscreen(this.src);
                }
            });
            
            // Esc key se close
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') closeFullscreen();
            });
        });
        
        function openFullscreen(src) {
            const overlay = document.getElementById('img-fullscreen-overlay');
            const img = document.getElementById('img-fullscreen-img');
            img.src = src;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        function closeFullscreen() {
            const overlay = document.getElementById('img-fullscreen-overlay');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Dark Mode Functions
        function initializeDarkMode() {
            // Check if dark mode preference is saved
            const darkMode = localStorage.getItem('darkMode');
            if (darkMode === 'enabled') {
                document.body.classList.add('dark-mode');
                updateDarkModeButtons(true);
            }
            
            // Add event listeners to both toggle buttons
            const toggleBtnLogin = document.getElementById('dark-mode-toggle-login');
            const toggleBtn = document.getElementById('dark-mode-toggle');
            
            if (toggleBtnLogin) {
                toggleBtnLogin.addEventListener('click', toggleDarkMode);
            }
            
            if (toggleBtn) {
                toggleBtn.addEventListener('click', toggleDarkMode);
            }
        }
        
        function toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            
            // Save preference
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
                updateDarkModeButtons(true);
            } else {
                localStorage.setItem('darkMode', 'disabled');
                updateDarkModeButtons(false);
            }
        }
        
        function updateDarkModeButtons(isDark) {
            const toggleBtnLogin = document.getElementById('dark-mode-toggle-login');
            const toggleBtn = document.getElementById('dark-mode-toggle');
            
            if (isDark) {
                if (toggleBtnLogin) {
                    toggleBtnLogin.innerHTML = '☀️ Light Mode';
                    toggleBtnLogin.style.background = '#404040';
                    toggleBtnLogin.style.color = '#e0e0e0';
                    toggleBtnLogin.style.borderColor = '#555';
                }
                if (toggleBtn) {
                    toggleBtn.innerHTML = '☀️ Light Mode';
                }
            } else {
                if (toggleBtnLogin) {
                    toggleBtnLogin.innerHTML = '🌙 Dark Mode';
                    toggleBtnLogin.style.background = '#f0f0f0';
                    toggleBtnLogin.style.color = '#333';
                    toggleBtnLogin.style.borderColor = '#ddd';
                }
                if (toggleBtn) {
                    toggleBtn.innerHTML = '🌙 Dark Mode';
                }
            }
        }
        


// Extracted from imu.html lines 2297-2333
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']],
                processEscapes: true
            },
            svg: {
                fontCache: 'global',
                scale: 1
            },
            options: {
                skipHtmlTags: ['script','noscript','style','textarea','pre']
            },
            startup: {
                typeset: false,
                ready() {
                    MathJax.startup.defaultReady();
                    window._mathJaxReady = true;
                    if (window._pendingMathRender) {
                        window._pendingMathRender();
                        window._pendingMathRender = null;
                    }
                }
            }
        };

        window.safeTypeset = function(targets) {
            if (window.MathJax && window.MathJax.typesetPromise && window._mathJaxReady) {
                window.MathJax.typesetPromise(targets).catch(() => {});
            } else {
                window._pendingMathRender = function() {
                    if (window.MathJax && window.MathJax.typesetPromise) {
                        window.MathJax.typesetPromise(targets).catch(() => {});
                    }
                };
            }
        };

// Extracted from imu.html lines 2336-2347
// Dynamic MathJax loader - will use IDB/CDN/File picker
(function() {
    // Ensure loadMathJax is defined (from earlier script)
    if (typeof loadMathJax === 'function') {
        loadMathJax(true);
    } else {
        // Fallback to CDN if loader not ready
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
        document.head.appendChild(s);
    }
})();


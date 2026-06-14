/**
 * PRELOADER SCRIPT
 * Timing fully dependent on actual page load speed
 */

(function() {
    'use strict';
    
    // Minimum display time to prevent flash (very short)
    const MIN_DISPLAY_TIME = 800; // 0.8 seconds - just enough to see animation start
    
    // Maximum display time (safety fallback for slow connections)
    const MAX_DISPLAY_TIME = 8000; // 8 seconds - for very slow connections
    
    // Track when script started
    const startTime = Date.now();
    
    /**
     * Hide the preloader with smooth fade out
     */
    function hidePreloader() {
        const preloader = document.getElementById('preloader');
        
        if (!preloader) return;
        
        // Calculate actual load time for debugging
        const loadTime = Date.now() - startTime;
        
        // Add hidden class to trigger CSS transition
        preloader.classList.add('hidden');
        
        // Remove from DOM after transition completes
        setTimeout(() => {
            preloader.style.display = 'none';
            // Enable scrolling on body
            document.body.style.overflow = 'auto';
            
            // Optional: Log load time (comment out in production)
            console.log(`Page loaded in ${loadTime}ms`);
        }, 600); // Match CSS transition duration
    }
    
    /**
     * Calculate remaining time to meet minimum display duration
     */
    function getRemainingTime() {
        const elapsed = Date.now() - startTime;
        const remaining = MIN_DISPLAY_TIME - elapsed;
        return Math.max(0, remaining);
    }
    
    /**
     * Handle page load completion
     */
    function onPageLoad() {
        // Only wait for minimum time if page loaded super fast
        const remainingTime = getRemainingTime();
        
        if (remainingTime > 0) {
            // Page loaded very quickly - wait minimum time to prevent flash
            setTimeout(() => {
                hidePreloader();
            }, remainingTime);
        } else {
            // Page took longer than minimum - hide immediately
            hidePreloader();
        }
    }
    
    /**
     * Prevent scrolling while preloader is visible
     */
    document.body.style.overflow = 'hidden';
    
    /**
     * Set up page load event listeners
     */
    
    // Check if page already loaded (for very fast loads)
    if (document.readyState === 'complete') {
        onPageLoad();
    } else {
        // Listen for DOM content loaded (faster - HTML parsed)
        document.addEventListener('DOMContentLoaded', () => {
            // Check if all resources also loaded
            if (document.readyState === 'complete') {
                onPageLoad();
            }
        });
        
        // Listen for full page load (all resources - images, CSS, JS)
        window.addEventListener('load', onPageLoad);
    }
    
    /**
     * Safety fallback: Force hide after maximum time
     * Only triggers if page is extremely slow or resources fail
     */
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader && !preloader.classList.contains('hidden')) {
            console.warn('Preloader auto-hidden after maximum wait time');
            hidePreloader();
        }
    }, MAX_DISPLAY_TIME);
    
    /**
     * Handle page visibility changes
     * Hide preloader if user switches tabs and comes back
     */
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && document.readyState === 'complete') {
            const preloader = document.getElementById('preloader');
            if (preloader && !preloader.classList.contains('hidden')) {
                hidePreloader();
            }
        }
    });
    
    /**
     * Performance monitoring (optional)
     * Shows detailed timing breakdown
     */
    window.addEventListener('load', () => {
        if (window.performance && window.performance.timing) {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
            
            console.log('Performance Stats:');
            console.log(`- DOM Ready: ${domReadyTime}ms`);
            console.log(`- Page Load: ${pageLoadTime}ms`);
            console.log(`- Resources: ${pageLoadTime - domReadyTime}ms`);
        }
    });
    
})();

/**
 * SESSION STORAGE OPTION
 * Uncomment to show preloader only on first visit in session
 */
/*
(function() {
    const hasSeenPreloader = sessionStorage.getItem('travixPreloaderSeen');
    
    if (hasSeenPreloader) {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    } else {
        sessionStorage.setItem('travixPreloaderSeen', 'true');
    }
})();
*/

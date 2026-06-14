// Universal Navbar Authentication Handler
// This script should be included on all pages to handle login state in navbar

(function() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('userLoggedIn');
    const navAuthButtons = document.getElementById('navAuthButtons');
    const navUserButtons = document.getElementById('navUserButtons');
    
    // Update navbar based on login state
    if (navAuthButtons && navUserButtons) {
        if (isLoggedIn === 'true') {
            navAuthButtons.style.display = 'none';
            navUserButtons.style.display = 'flex';
        } else {
            navAuthButtons.style.display = 'flex';
            navUserButtons.style.display = 'none';
        }
    }
    
    // Handle logout
    const navLogoutBtn = document.getElementById('navLogoutBtn');
    if (navLogoutBtn) {
        navLogoutBtn.addEventListener('click', function() {
            const clearAndRedirect = () => {
                localStorage.removeItem('userLoggedIn');
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userUsername');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('userRole');
                window.location.href = 'travix-landing.html';
            };

            const performLogout = () => {
                if (typeof AuthAPI !== 'undefined') {
                    AuthAPI.logout().catch(() => {}).finally(clearAndRedirect);
                } else {
                    clearAndRedirect();
                }
            };

            if (typeof showConfirm !== 'undefined') {
                showConfirm('Are you sure you want to logout?', performLogout);
            } else {
                if (confirm('Are you sure you want to logout?')) performLogout();
            }
        });
    }
})();

// Authentication check for protected pages
// Accepts EITHER the legacy userLoggedIn flag OR a Sanctum auth_token

function isAuthenticated() {
    return localStorage.getItem('auth_token') ||
           localStorage.getItem('userLoggedIn') === 'true';
}

function checkAuthAndRedirect(targetPage) {
    if (isAuthenticated()) {
        window.location.href = targetPage;
    } else {
        localStorage.setItem('redirectAfterLogin', targetPage);
        window.location.href = 'signin.html';
    }
}

// For direct page access (when someone tries to open a protected page directly)
function protectPage(currentPage) {
    if (!isAuthenticated()) {
        localStorage.setItem('redirectAfterLogin', currentPage);
        window.location.href = 'signin.html';
    }
}

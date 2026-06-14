// Authentication check for protected pages

function checkAuthAndRedirect(targetPage) {
    const isLoggedIn = localStorage.getItem('userLoggedIn');
    
    if (isLoggedIn === 'true') {
        // User is logged in, go to target page
        window.location.href = targetPage;
    } else {
        // User not logged in, save intended destination and go to signin
        localStorage.setItem('redirectAfterLogin', targetPage);
        window.location.href = 'signin.html';
    }
}

// For direct page access (when someone tries to open send-item.html or become-traveler.html directly)
function protectPage(currentPage) {
    const isLoggedIn = localStorage.getItem('userLoggedIn');
    
    if (isLoggedIn !== 'true') {
        // Save where they wanted to go and redirect to signin
        localStorage.setItem('redirectAfterLogin', currentPage);
        window.location.href = 'signin.html';
    }
}

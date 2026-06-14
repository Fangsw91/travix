// Mobile Menu Toggle for Admin Page
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle-dark');
const navMenu = document.querySelector('.nav-menu-light');
const navActions = document.querySelector('.nav-actions-light');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navActions.classList.toggle('active');
    });
}

// Admin Form Validation
const adminForm = document.getElementById('adminForm');

if (adminForm) {
    adminForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;

        // Basic validation
        if (!validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }
        
        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }
        
        const submitBtn = adminForm.querySelector('.btn-signin');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span style="display: inline-block; margin-right: 8px;">⏳</span> Verifying credentials...';
        submitBtn.disabled = true;

        AuthAPI.login({ email, password }).then(data => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            if (data.user?.role !== 'admin') {
                showError('Access denied. Admin credentials required.');
                return;
            }

            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userRole', data.user.role);

            showSuccess('Authentication successful! Redirecting to admin dashboard...');
            setTimeout(() => { window.location.href = 'admin-dashboard.html'; }, 1500);
        }).catch(err => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            showError(err.message || 'Invalid admin credentials. Please try again.');
        });
    });
}

// Email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Show error message
function showError(message) {
    // Remove any existing messages
    removeMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-message error-message';
    errorDiv.textContent = message;
    
    const form = document.querySelector('.signin-form');
    form.insertBefore(errorDiv, form.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Show success message
function showSuccess(message) {
    // Remove any existing messages
    removeMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'form-message success-message';
    successDiv.textContent = message;
    
    const form = document.querySelector('.signin-form');
    form.insertBefore(successDiv, form.firstChild);
}

// Remove all messages
function removeMessages() {
    const messages = document.querySelectorAll('.form-message');
    messages.forEach(msg => msg.remove());
}

// Floating buttons functionality
const calculatorBtn = document.querySelector('.calculator-btn');
const adminBtn = document.querySelector('.admin-btn');

if (calculatorBtn) {
    calculatorBtn.addEventListener('click', () => {
        console.log('Calculator clicked');
        window.location.href = 'calculator.html';
    });
}

if (adminBtn) {
    adminBtn.addEventListener('click', () => {
        console.log('Admin Access clicked - already on admin page');
        // Already on admin page, could scroll to top or show message
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Add input focus effects
const inputs = document.querySelectorAll('.form-group input');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar-light');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
        }
    }
});

// Add CSS for form messages dynamically
const style = document.createElement('style');
style.textContent = `
    .form-message {
        padding: 0.875rem 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-size: 0.95rem;
        font-weight: 500;
        animation: slideDown 0.3s ease;
    }
    
    .error-message {
        background: #FEE2E2;
        color: #991B1B;
        border: 1px solid #FCA5A5;
    }
    
    .success-message {
        background: #D1FAE5;
        color: #065F46;
        border: 1px solid #6EE7B7;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .form-group.focused label {
        color: #F4C542;
    }
`;
document.head.appendChild(style);

// Security warning on page load
console.log('%cAdmin Access Page', 'color: #F4C542; font-size: 20px; font-weight: bold;');
console.log('%cThis is a secure area. Unauthorized access is prohibited.', 'color: #991B1B; font-size: 14px;');
console.log('Admin Access Page Loaded Successfully');

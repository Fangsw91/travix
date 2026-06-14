// Mobile Menu Toggle for Sign In Page
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const navActions = document.querySelector('.nav-actions');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navActions.classList.toggle('active');
    });
}

// Form Validation with Real API
const signinForm = document.getElementById('signinForm');

if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Basic validation
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }
        
        // Show loading state
        const submitBtn = signinForm.querySelector('.btn-signin');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing In...';
        submitBtn.disabled = true;
        
        try {
            // Real API call to Laravel backend
            const data = await AuthAPI.login({ 
                email: email, 
                password: password 
            });
            
            if (data.success) {
                // Store user session with real data from API
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('userName', data.user.name);
                localStorage.setItem('userEmail', data.user.email);
                localStorage.setItem('userRole', data.user.role);
                
                // Show success and redirect
                showSuccess('Sign in successful! Redirecting...');
                
                // Check if there's a redirect URL
                const redirectUrl = localStorage.getItem('redirectAfterLogin');
                
                setTimeout(() => {
                    if (redirectUrl) {
                        // Clear the redirect URL
                        localStorage.removeItem('redirectAfterLogin');
                        // Redirect to intended page
                        window.location.href = redirectUrl;
                    } else {
                        // Default redirect to dashboard
                        window.location.href = 'user-dashboard.html';
                    }
                }, 1500);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            // Show appropriate error message
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.message === 'Invalid credentials') {
                errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showError(errorMessage);
        }
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

// Password visibility toggle (optional enhancement)
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
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
        console.log('Admin Access clicked');
        window.location.href = 'admin.html';
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

console.log('✅ Sign In Page Loaded - API Ready');
// Mobile Menu Toggle for Sign Up Page
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle-dark');
const navMenu = document.querySelector('.nav-menu-light');
const navActions = document.querySelector('.nav-actions-light');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navActions.classList.toggle('active');
    });
}

// Form Validation
const signupForm = document.getElementById('signupForm');

if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation checks
        if (username.length < 3) {
            showError('Username must be at least 3 characters long');
            return;
        }
        
        if (!validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }
        
        if (password.length < 8) {
            showError('Password must be at least 8 characters long');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        // Check password strength
        if (!isStrongPassword(password)) {
            showError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
            return;
        }
        
        const role = document.getElementById('role')?.value;
        if (!role) {
            showError('Please select your account type');
            return;
        }

        // Show loading state
        const submitBtn = signupForm.querySelector('.btn-signin');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating Account...';
        submitBtn.disabled = true;

        AuthAPI.register({
            name: username,
            email,
            password,
            password_confirmation: confirmPassword,
            role
        }).then(data => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            showSuccess('Account created successfully! Redirecting to sign in...');
            setTimeout(() => { window.location.href = 'signin.html'; }, 2000);
        }).catch(err => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            const firstError = err.errors ? Object.values(err.errors)[0]?.[0] : null;
            showError(firstError || err.message || 'Registration failed. Please try again.');
        });
    });
}

// Email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Password strength validation
function isStrongPassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber;
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

// Real-time password strength indicator
const passwordInput = document.getElementById('password');
if (passwordInput) {
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        let strength = 'Weak';
        let color = '#EF4444';
        
        if (password.length >= 8) {
            if (isStrongPassword(password)) {
                strength = 'Strong';
                color = '#10B981';
            } else {
                strength = 'Medium';
                color = '#F59E0B';
            }
        }
        
        // Remove existing strength indicator
        const existingIndicator = document.querySelector('.password-strength');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Add strength indicator if password is entered
        if (password.length > 0) {
            const indicator = document.createElement('div');
            indicator.className = 'password-strength';
            indicator.style.color = color;
            indicator.style.fontSize = '0.875rem';
            indicator.style.marginTop = '0.5rem';
            indicator.textContent = `Password strength: ${strength}`;
            this.parentElement.appendChild(indicator);
        }
    });
}

// Real-time password match validation
const confirmPasswordInput = document.getElementById('confirmPassword');
if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', function() {
        const password = document.getElementById('password').value;
        const confirmPassword = this.value;
        
        // Remove existing match indicator
        const existingIndicator = document.querySelector('.password-match');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Add match indicator if confirm password is entered
        if (confirmPassword.length > 0) {
            const indicator = document.createElement('div');
            indicator.className = 'password-match';
            indicator.style.fontSize = '0.875rem';
            indicator.style.marginTop = '0.5rem';
            
            if (password === confirmPassword) {
                indicator.style.color = '#10B981';
                indicator.textContent = '✓ Passwords match';
            } else {
                indicator.style.color = '#EF4444';
                indicator.textContent = '✗ Passwords do not match';
            }
            
            this.parentElement.appendChild(indicator);
        }
    });
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
    
    .password-strength,
    .password-match {
        font-weight: 500;
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);

console.log('Sign Up Page Loaded Successfully');

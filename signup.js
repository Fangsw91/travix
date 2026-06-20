// Mobile Menu Toggle for Sign Up Page
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const navActions = document.querySelector('.nav-actions');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navActions.classList.toggle('active');
    });
}

// Sign Up Form Handler with Real API
const signupForm = document.getElementById('signupForm');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.getElementById('role')?.value;
        const termsAccepted = document.getElementById('terms')?.checked;

        // Clear previous errors
        removeMessages();

        // Validation
        if (!name || !email || !phone || !password || !confirmPassword) {
            showError('Please fill in all required fields');
            return;
        }

        if (!validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        if (password.length < 8) {
            showError('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        if (!role) {
            showError('Please select your account type');
            return;
        }

        if (termsAccepted === false) {
            showError('Please accept the terms and conditions');
            return;
        }

        // Show loading state
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating Account...';
        submitBtn.disabled = true;

        try {
            const data = await AuthAPI.register({
                name: name,
                email: email,
                password: password,
                password_confirmation: confirmPassword,
                role: role,
                phone: phone || ''
            });

            if (data.success) {
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('userName', data.user.name);
                localStorage.setItem('userEmail', data.user.email);
                localStorage.setItem('userRole', data.user.role);

                showSuccess('Account created successfully! Redirecting...');
                setTimeout(() => { window.location.href = 'user-dashboard.html'; }, 1500);
            }

        } catch (error) {
            console.error('Registration error:', error);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            if (error.errors) {
                const errorMessages = Object.values(error.errors).flat();
                showError(errorMessages.join('<br>'));
            } else if (error.message) {
                showError(error.message);
            } else {
                showError('Registration failed. Please try again.');
            }
        }
    });
}

// Email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Password strength indicator
const passwordInput = document.getElementById('password');
if (passwordInput) {
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        updatePasswordStrengthUI(strength);
    });
}

function calculatePasswordStrength(password) {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return Math.min(strength, 4);
}

function updatePasswordStrengthUI(strength) {
    const strengthBar = document.querySelector('.password-strength-bar');
    const strengthText = document.querySelector('.password-strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    const levels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#059669'];
    
    strengthBar.style.width = `${(strength / 4) * 100}%`;
    strengthBar.style.backgroundColor = colors[strength - 1] || '#E5E7EB';
    strengthText.textContent = levels[strength - 1] || '';
}

// Confirm password validation
const confirmPasswordInput = document.getElementById('confirmPassword');
if (confirmPasswordInput && passwordInput) {
    confirmPasswordInput.addEventListener('input', function() {
        if (this.value && this.value !== passwordInput.value) {
            this.setCustomValidity('Passwords do not match');
        } else {
            this.setCustomValidity('');
        }
    });
    
    passwordInput.addEventListener('input', function() {
        if (confirmPasswordInput.value) {
            confirmPasswordInput.dispatchEvent(new Event('input'));
        }
    });
}

// Show error message
function showError(message) {
    removeMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-message error-message';
    errorDiv.innerHTML = message;
    
    const form = document.querySelector('.signup-form') || document.querySelector('form');
    if (form) {
        form.insertBefore(errorDiv, form.firstChild);
        
        // Scroll to error
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Remove after 8 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 8000);
}

// Show success message
function showSuccess(message) {
    removeMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'form-message success-message';
    successDiv.textContent = message;
    
    const form = document.querySelector('.signup-form') || document.querySelector('form');
    if (form) {
        form.insertBefore(successDiv, form.firstChild);
    }
}

// Remove all messages
function removeMessages() {
    const messages = document.querySelectorAll('.form-message');
    messages.forEach(msg => msg.remove());
}

// Add input focus effects
const inputs = document.querySelectorAll('.form-group input, .form-group select');
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
    
    .password-strength-bar {
        height: 4px;
        background: #E5E7EB;
        border-radius: 2px;
        margin-top: 0.5rem;
        transition: all 0.3s ease;
    }
    
    .password-strength-text {
        font-size: 0.75rem;
        margin-top: 0.25rem;
        font-weight: 500;
    }
`;
document.head.appendChild(style);

console.log('✅ Sign Up Page Loaded - API Ready');

// Admin Login Script

console.log('🔐 Admin Login Page Loaded');

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Admin Login Form Handler
const adminLoginForm = document.getElementById('adminLoginForm');

if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Validation
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        // Show loading state
        const submitBtn = adminLoginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Authenticating...';
        submitBtn.disabled = true;
        
        try {
            console.log('🔑 Attempting admin login...');
            
            // Call Laravel API
            const data = await AuthAPI.login({ 
                email: email, 
                password: password 
            });
            
            if (data.success) {
                console.log('✅ Login successful, checking role...');
                
                // CRITICAL: Check if user is admin
                if (data.user.role !== 'admin') {
                    console.log('❌ Access denied: Not an admin');
                    
                    // Reset button
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    
                    showError('Access Denied: Administrator credentials required');
                    return;
                }
                
                console.log('✅ Admin role verified');
                
                // Save admin session
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('userName', data.user.name);
                localStorage.setItem('userEmail', data.user.email);
                localStorage.setItem('userRole', 'admin');
                localStorage.setItem('isAdmin', 'true');
                
                // Show success
                showSuccess('Admin authentication successful! Redirecting...');
                
                // Redirect to admin dashboard
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1500);
            }
            
        } catch (error) {
            console.error('❌ Admin login error:', error);
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            // Show error message
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.message === 'Invalid credentials') {
                errorMessage = 'Invalid admin credentials. Please check your email and password.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showError(errorMessage);
        }
    });
}

// Show error message
function showError(message) {
    removeMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-message error-message';
    errorDiv.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        ${message}
    `;
    
    const form = document.querySelector('.signin-form');
    if (form) {
        form.insertBefore(errorDiv, form.firstChild);
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    setTimeout(() => errorDiv.remove(), 6000);
}

// Show success message
function showSuccess(message) {
    removeMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'form-message success-message';
    successDiv.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        ${message}
    `;
    
    const form = document.querySelector('.signin-form');
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
const inputs = document.querySelectorAll('.form-group input');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });
});

// Add CSS for messages
const style = document.createElement('style');
style.textContent = `
    .form-message {
        padding: 1rem 1.25rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-size: 0.95rem;
        font-weight: 500;
        animation: slideDown 0.3s ease;
        display: flex;
        align-items: center;
    }
    
    .error-message {
        background: #FEE2E2;
        color: #991B1B;
        border: 2px solid #FCA5A5;
    }
    
    .success-message {
        background: #D1FAE5;
        color: #065F46;
        border: 2px solid #6EE7B7;
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
        color: #667eea;
    }
`;
document.head.appendChild(style);

console.log('✅ Admin login ready');
console.log('📧 Default admin: admin@travix.com');
console.log('🔑 Default password: admin123');

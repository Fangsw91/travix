// Modern Reset Password functionality

const form = document.getElementById('resetForm');
const emailInput = document.getElementById('resetEmail');
const submitBtn = document.getElementById('resetSubmit');
const messageContainer = document.getElementById('resetMessage');

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        // Validate email
        if (!validateEmail(email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Sending...';
        
        // Simulate API call
        setTimeout(() => {
            // Show success
            showMessage(`✓ Reset link sent to <strong>${email}</strong>! Check your inbox and spam folder.`, 'success');
            
            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                Send Reset Link
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
            
            // Clear input
            emailInput.value = '';
            
            // Show countdown
            let countdown = 5;
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    showMessage(`✓ Reset link sent! Redirecting to sign in in ${countdown} seconds...`, 'success');
                } else {
                    clearInterval(countdownInterval);
                    window.location.href = 'signin.html';
                }
            }, 1000);
        }, 2000);
    });
    
    // Real-time email validation
    emailInput.addEventListener('blur', () => {
        const email = emailInput.value.trim();
        if (email && !validateEmail(email)) {
            emailInput.style.borderColor = '#EF4444';
        } else {
            emailInput.style.borderColor = '#E5E7EB';
        }
    });
    
    emailInput.addEventListener('input', () => {
        emailInput.style.borderColor = '#E5E7EB';
        messageContainer.innerHTML = '';
    });
}

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Show message
function showMessage(message, type) {
    const icon = type === 'success' 
        ? '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="9" stroke="#10B981" stroke-width="2"/><path d="M6 10l3 3 5-6" stroke="#10B981" stroke-width="2" stroke-linecap="round"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="9" stroke="#EF4444" stroke-width="2"/><path d="M10 6v5M10 14v.5" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/></svg>';
    
    messageContainer.innerHTML = `
        <div class="reset-message reset-${type}">
            ${icon}
            <span>${message}</span>
        </div>
    `;
}

console.log('Modern reset password page loaded');


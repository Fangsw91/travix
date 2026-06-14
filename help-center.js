// Fallback for modal functions
if (typeof showInfo === "undefined") {
    // Modal functions loaded from modal.js
}

// Check if user is logged in and update navbar
const isLoggedIn = localStorage.getItem('userLoggedIn');
const navAuthButtons = document.getElementById('navAuthButtons');
const navUserButtons = document.getElementById('navUserButtons');

if (isLoggedIn) {
    navAuthButtons.style.display = 'none';
    navUserButtons.style.display = 'flex';
} else {
    navAuthButtons.style.display = 'flex';
    navUserButtons.style.display = 'none';
}

// Logout functionality
const navLogoutBtn = document.getElementById('navLogoutBtn');
if (navLogoutBtn) {
    navLogoutBtn.addEventListener('click', () => {
        showConfirm(
            'Are you sure you want to logout?',
            () => {
                localStorage.removeItem('userLoggedIn');
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userUsername');
                window.location.href = 'travix-landing.html';
            }
        );
    });
}

// Mobile menu toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const navActions = document.querySelector('.nav-actions');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navActions.classList.toggle('active');
    });
}

// Help search functionality
const helpSearch = document.getElementById('helpSearch');
const faqItems = document.querySelectorAll('.faq-item');

if (helpSearch) {
    helpSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question span').textContent.toLowerCase();
            const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
            
            if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                item.style.display = '';
                // Highlight matching term
                if (searchTerm.length > 2) {
                    item.classList.add('highlighted');
                }
            } else {
                item.style.display = 'none';
                item.classList.remove('highlighted');
            }
        });
        
        // Show "No results" message if nothing found
        const visibleItems = Array.from(faqItems).filter(item => item.style.display !== 'none');
        if (visibleItems.length === 0 && searchTerm.length > 0) {
            console.log('No results found');
        }
    });
}

// FAQ Accordion functionality
const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        const wasActive = faqItem.classList.contains('active');
        
        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Open clicked item if it wasn't active
        if (!wasActive) {
            faqItem.classList.add('active');
        }
    });
});

// Category card smooth scroll
const categoryLinks = document.querySelectorAll('.category-link');

categoryLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Highlight the category briefly
            targetElement.classList.add('flash-highlight');
            setTimeout(() => {
                targetElement.classList.remove('flash-highlight');
            }, 2000);
        }
    });
});

// Support buttons
const liveChatBtn = document.querySelector('.btn-support-primary');
const emailSupportBtn = document.querySelector('.btn-support-secondary');

if (liveChatBtn) {
    liveChatBtn.addEventListener('click', () => {
        showInfo('Live Chat Feature Coming Soon!\n\nIn the meantime, please email us at support@travix.com');
    });
}

if (emailSupportBtn) {
    emailSupportBtn.addEventListener('click', () => {
        window.location.href = 'mailto:support@travix.com?subject=Help Request&body=Please describe your issue:';
    });
}

console.log('Help Center loaded successfully');

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle-dark');
const navMenu = document.querySelector('.nav-menu-light');
const navActions = document.querySelector('.nav-actions-light');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navActions.classList.toggle('active');
    });
}

// Calculator Functionality
const weightInput = document.getElementById('weight');
const pricePerKgInput = document.getElementById('pricePerKg');

function calculatePrices() {
    const weight = parseFloat(weightInput.value) || 0;
    const pricePerKg = parseFloat(pricePerKgInput.value) || 0;
    
    // Calculate total cost for sender
    const senderCost = weight * pricePerKg;
    
    // Platform fee is 10%
    const platformFee = senderCost * 0.10;

    // Traveler earnings is 90% of sender cost
    const travelerEarnings = senderCost * 0.90;
    
    // Traditional shipping cost (roughly 3x more expensive)
    const traditionalCost = weight * 45; // $45 per kg average for traditional shipping
    
    // Savings
    const savings = traditionalCost - senderCost;
    const savingsPercent = traditionalCost > 0 ? Math.round((savings / traditionalCost) * 100) : 0;
    
    // Update UI
    document.getElementById('senderCost').textContent = `$${senderCost.toFixed(2)}`;
    document.getElementById('senderInfo').textContent = `${weight} kg × $${pricePerKg}/kg`;
    
    document.getElementById('travelerEarnings').textContent = `$${travelerEarnings.toFixed(2)}`;
    
    document.getElementById('platformFee').textContent = `$${platformFee.toFixed(2)}`;
    
    document.getElementById('travixPrice').textContent = `$${senderCost.toFixed(2)}`;
    document.getElementById('expressPrice').textContent = `$${traditionalCost.toFixed(2)}`;
    document.getElementById('savingsAmount').textContent = `$${savings.toFixed(2)}`;
    document.getElementById('savingsPercent').textContent = `${savingsPercent}% savings!`;
}

// Add event listeners for real-time calculation
if (weightInput && pricePerKgInput) {
    weightInput.addEventListener('input', calculatePrices);
    pricePerKgInput.addEventListener('input', calculatePrices);
    
    // Initial calculation
    calculatePrices();
}

// Input validation - ensure min/max values
weightInput?.addEventListener('change', function() {
    let value = parseFloat(this.value);
    if (value < 0.5) this.value = 0.5;
    if (value > 50) this.value = 50;
    calculatePrices();
});

pricePerKgInput?.addEventListener('change', function() {
    let value = parseFloat(this.value);
    if (value < 5) this.value = 5;
    if (value > 50) this.value = 50;
    calculatePrices();
});

// CTA Button Actions
const sendItemBtn = document.querySelector('.btn-cta-primary');
const becomeTravelerBtn = document.querySelector('.btn-cta-secondary');

if (sendItemBtn) {
    sendItemBtn.addEventListener('click', () => {
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        if (isLoggedIn) {
            window.location.href = 'send-item.html';
        } else {
            window.location.href = 'signup.html';
        }
    });
}

if (becomeTravelerBtn) {
    becomeTravelerBtn.addEventListener('click', () => {
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        if (isLoggedIn) {
            window.location.href = 'become-traveler.html';
        } else {
            window.location.href = 'signup.html';
        }
    });
}

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
        }
    }
});

// Animate numbers on page load
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = progress * (end - start) + start;
        element.textContent = '$' + value.toFixed(2);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Animate on page load
window.addEventListener('load', () => {
    setTimeout(() => {
        const weight = parseFloat(weightInput.value);
        const pricePerKg = parseFloat(pricePerKgInput.value);
        const senderCost = weight * pricePerKg;
        const travelerEarnings = senderCost * 0.90;
        const platformFee = senderCost * 0.10;
        
        animateValue(document.getElementById('senderCost'), 0, senderCost, 1000);
        animateValue(document.getElementById('travelerEarnings'), 0, travelerEarnings, 1000);
        animateValue(document.getElementById('platformFee'), 0, platformFee, 1000);
    }, 300);
});

// Add tooltips for better UX
const tooltips = {
    weight: 'Enter the weight of your item in kilograms (0.5 - 50 kg)',
    pricePerKg: 'Set your price per kilogram ($5 - $50/kg)',
};

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.target === weightInput || e.target === pricePerKgInput)) {
        e.preventDefault();
        calculatePrices();
    }
});

console.log('Price Calculator Page Loaded Successfully');
console.log('Calculator is ready to estimate shipping costs and traveler earnings');

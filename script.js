// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const navActions = document.querySelector('.nav-actions');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navActions.classList.toggle('active');
    });
}

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80; // Account for fixed navbar
            const targetPosition = target.offsetTop - offset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            navMenu.classList.remove('active');
            navActions.classList.remove('active');
        }
    });
});

// Role Tabs Functionality
const tabButtons = document.querySelectorAll('.tab-btn');
const senderSteps = document.getElementById('sender-steps');
const travelerSteps = document.getElementById('traveler-steps');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Show appropriate steps
        const role = button.getAttribute('data-role');
        if (role === 'sender') {
            senderSteps.classList.remove('hidden');
            travelerSteps.classList.add('hidden');
        } else {
            senderSteps.classList.add('hidden');
            travelerSteps.classList.remove('hidden');
        }
    });
});

// Navbar Background on Scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    } else {
        navbar.style.background = 'var(--white)';
        navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    }
});

// Intersection Observer for Fade-in Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for fade-in animation
const fadeElements = document.querySelectorAll('.feature-card, .step-card, .benefit-card, .help-card, .testimonial-card');
fadeElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Counter Animation for Statistics (if you want to add stats section)
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = Math.round(target);
            clearInterval(timer);
        } else {
            element.textContent = Math.round(start);
        }
    }, 16);
}

// Form Validation (for future contact forms)
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Add hover effect to cards
const cards = document.querySelectorAll('.feature-card, .benefit-card, .help-card, .testimonial-card');
cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Lazy Loading Images (if you add real images later)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });

    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => imageObserver.observe(img));
}

// Add active state to navigation based on scroll position
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Testimonial Slider (optional enhancement)
class TestimonialSlider {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;
        
        this.testimonials = this.container.querySelectorAll('.testimonial-card');
        this.currentIndex = 0;
        
        // Add this only if you want auto-rotation
        // this.startAutoRotate();
    }
    
    startAutoRotate(interval = 5000) {
        setInterval(() => {
            this.next();
        }, interval);
    }
    
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
        this.updateDisplay();
    }
    
    updateDisplay() {
        this.testimonials.forEach((testimonial, index) => {
            if (index === this.currentIndex) {
                testimonial.style.display = 'block';
            } else {
                testimonial.style.display = 'none';
            }
        });
    }
}

// Initialize testimonial slider if needed
// const slider = new TestimonialSlider('.testimonials-grid');

// Handle CTA Button Clicks
const ctaButtons = document.querySelectorAll('.cta-section .btn-primary, .hero .btn-primary');
ctaButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Navigate to signup page or show modal
        console.log('Sign up clicked');
        // window.location.href = '/signup';
    });
});

// Parallax effect for hero section (optional)
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroImage = document.querySelector('.hero-image');
    if (heroImage) {
        heroImage.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

// Add loading state to buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function() {
        // Add loading class if needed
        if (this.classList.contains('submit-btn')) {
            this.classList.add('loading');
            this.disabled = true;
            
            // Remove loading state after action (simulated)
            setTimeout(() => {
                this.classList.remove('loading');
                this.disabled = false;
            }, 2000);
        }
    });
});

// Console log for development
console.log('Travix Landing Page Loaded Successfully');
console.log('Interactive elements initialized');

// ============================================
// PAGE LOAD ANIMATIONS
// ============================================

// Trigger animations when page loads
window.addEventListener('load', function() {
    // Animate hero section
    const heroSection = document.querySelector('.animate-on-load');
    const heroText = document.querySelector('.animate-fade-in-up');
    const heroVisual = document.querySelector('.animate-fade-in-right');
    
    if (heroSection) heroSection.classList.add('loaded');
    if (heroText) heroText.classList.add('loaded');
    if (heroVisual) heroVisual.classList.add('loaded');
});

// ============================================
// SCROLL ANIMATIONS
// ============================================

// Intersection Observer for scroll animations
const scrollObserverOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
};

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Optional: unobserve after animation to improve performance
            // scrollObserver.unobserve(entry.target);
        }
    });
}, scrollObserverOptions);

// Observe all sections with scroll-animate class
const scrollAnimateElements = document.querySelectorAll('.scroll-animate');
scrollAnimateElements.forEach(element => {
    scrollObserver.observe(element);
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateEmail,
        animateCounter,
        TestimonialSlider
    };
}

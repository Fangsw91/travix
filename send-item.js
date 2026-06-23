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

// File Upload Handlers
const photoUpload = document.getElementById('photoUpload');
const itemPhoto = document.getElementById('itemPhoto');

// ── Country rates — same data as Calculator page ───────────────────────────────
const SEND_ITEM_COUNTRY_RATES = {
    'Saudi Arabia': 8, 'UAE': 9, 'Egypt': 7, 'Kuwait': 9, 'Qatar': 10,
    'Bahrain': 9, 'Oman': 9, 'Lebanon': 8, 'Iraq': 10, 'Syria': 11,
    'Tunisia': 12, 'Morocco': 13, 'Algeria': 13, 'Libya': 14, 'Yemen': 15, 'Sudan': 14,
    'Turkey': 11, 'Germany': 18, 'France': 18, 'United Kingdom': 20, 'Italy': 17,
    'Spain': 17, 'Netherlands': 19, 'Poland': 16, 'Sweden': 20, 'Norway': 21,
    'Switzerland': 22, 'Greece': 15,
    'United States': 25, 'Canada': 24, 'Mexico': 22, 'Brazil': 26,
};

function getValueFeeRate(itemValue) {
    if (itemValue <= 100)  return 0.030;
    if (itemValue <= 500)  return 0.025;
    if (itemValue <= 1000) return 0.020;
    return 0.015;
}

// Cost Calculator — matches Calculator page formula exactly
const weightInput = document.getElementById('weight');
const valueInput   = document.getElementById('value');
const estimatedCostEl = document.getElementById('estimatedCost');
const costInfoEl      = document.getElementById('costInfo');

function calculateEstimatedCost() {
    const weight    = parseFloat(weightInput?.value) || 0;
    const itemValue = parseFloat(valueInput?.value)   || 0;
    const destEl    = document.getElementById('destination');
    const destName  = destEl?.value || '';
    const rate      = SEND_ITEM_COUNTRY_RATES[destName] || 0;

    const hasData = weight > 0 && rate > 0;

    if (!hasData) {
        if (estimatedCostEl) estimatedCostEl.textContent = '$0.00';
        if (costInfoEl) costInfoEl.textContent = destName ? 'Enter weight' : 'Select destination first';
        document.getElementById('calcBreakdown')?.style.setProperty('display', 'none');
        return;
    }

    const weightFee    = weight * rate;
    const valueFeeRate = getValueFeeRate(itemValue);
    const valueFee      = itemValue * valueFeeRate;
    const base          = Math.max(weightFee + valueFee, 5); // minimum $5
    const platformFee   = base * 0.15 * 2; // 30% — matches Calculator page (the single source of truth)
    const total          = base + platformFee;

    if (estimatedCostEl) estimatedCostEl.textContent = `$${total.toFixed(2)}`;
    if (costInfoEl) costInfoEl.textContent = `${weight}kg × $${rate}/kg to ${destName}`;

    // Breakdown box
    const breakdown = document.getElementById('calcBreakdown');
    if (breakdown) {
        breakdown.style.display = 'block';
        setBdEl('bdWeightFee', `$${weightFee.toFixed(2)}`);
        setBdEl('bdValueFee', itemValue > 0 ? `$${valueFee.toFixed(2)} (${(valueFeeRate*100)}% of $${itemValue})` : '$0.00');
        setBdEl('bdBase', `$${base.toFixed(2)}`);
        setBdEl('bdPlatform', `$${platformFee.toFixed(2)}`);
        setBdEl('bdTotal', `$${total.toFixed(2)}`);
    }
}

function setBdEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

if (weightInput) {
    weightInput.addEventListener('input', calculateEstimatedCost);
}
if (valueInput) {
    valueInput.addEventListener('input', calculateEstimatedCost);
}
// Recalculate when destination country changes (custom dropdown sets hidden input)
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'destination') calculateEstimatedCost();
});
// Also poll briefly after dropdown selections (custom dropdown doesn't always fire 'change')
const destObserverInterval = setInterval(() => {
    const destEl = document.getElementById('destination');
    if (destEl && destEl.value) calculateEstimatedCost();
}, 500);
setTimeout(() => clearInterval(destObserverInterval), 10000);

calculateEstimatedCost();

function setupUploadArea(uploadArea, fileInput) {
    if (!uploadArea || !fileInput) return;
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#F4C542';
        uploadArea.style.background = '#FEF3C7';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#E5E7EB';
        uploadArea.style.background = '#F9FAFB';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#E5E7EB';
        uploadArea.style.background = '#F9FAFB';
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect(fileInput, uploadArea);
        }
    });
    
    fileInput.addEventListener('change', () => {
        handleFileSelect(fileInput, uploadArea);
    });
}

function handleFileSelect(input, uploadArea) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const fileName = file.name;
        const fileSize = (file.size / 1024 / 1024).toFixed(2); // Convert to MB
        
        // Update upload area to show file name
        const p = uploadArea.querySelector('p');
        if (p) {
            p.textContent = `✓ ${fileName} (${fileSize} MB)`;
            p.style.color = '#10B981';
        }
        
        // Show remove button
        const inputId = input.id;
        let removeButtonId = '';
        
        if (inputId === 'itemPhoto') removeButtonId = 'removePhoto';
        
        const removeBtn = document.getElementById(removeButtonId);
        if (removeBtn) {
            removeBtn.style.display = 'flex';
        }
    }
}

// Remove file functions
function setupRemoveButton(buttonId, inputId, uploadAreaId) {
    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);
    const uploadArea = document.getElementById(uploadAreaId);
    
    if (button && input && uploadArea) {
        button.addEventListener('click', () => {
            // Clear the file input
            input.value = '';
            
            // Reset upload area
            const p = uploadArea.querySelector('p');
            if (p) {
                if (uploadAreaId === 'photoUpload') {
                    p.textContent = 'Click to upload or drag and drop';
                }
                p.style.color = '';
            }
            
            // Hide remove button
            button.style.display = 'none';
        });
    }
}

// Setup all remove buttons
setupRemoveButton('removePhoto', 'itemPhoto', 'photoUpload');

// Setup all upload areas
setupUploadArea(photoUpload, itemPhoto);

// Form Submission
const sendItemForm = document.getElementById('sendItemForm');

// Modal functions are loaded from modal.js
// No fallback needed - modal.js is always loaded

if (sendItemForm) {
    sendItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = {
            itemName: document.getElementById('itemName').value,
            category: document.querySelector('input[name="category"]:checked')?.value,
            weight: document.getElementById('weight').value,
            value: document.getElementById('value').value,
            description: document.getElementById('description').value,
            pickup: document.getElementById('pickup').value,
            pickupDate: document.getElementById('pickupDate').value,
            destination: document.getElementById('destination').value,
            deliveryDate: document.getElementById('deliveryDate').value,
            receiverName: document.getElementById('receiverName').value,
            receiverPhone: document.getElementById('receiverPhone').value,
            deliveryAddress: document.getElementById('deliveryAddress').value,
            terms: document.getElementById('terms').checked
        };
        
        // Get submit button
        const submitBtn = sendItemForm.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        
        // Validate category selection
        if (!formData.category) {
            showError('Please select a category for your item');
            return;
        }
        
        // Validate terms agreement
        if (!formData.terms) {
            showError('Please agree to the Terms of Service and Privacy Policy');
            return;
        }
        
        // Submit form directly
        submitForm(formData, submitBtn, originalText);
    });
}

// Function to handle form submission
// NOTE: Shipment is NOT created here — it's created in payment.js after successful payment.
// This keeps DB clean (no orphan shipments from unpaid orders).

function submitForm(formData, submitBtn, originalText) {
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    // Clear stale data from any previous flow
    localStorage.removeItem('selectedTraveler');
    localStorage.removeItem('selectedTripId');
    localStorage.removeItem('currentOrderId');
    localStorage.removeItem('trackingData');

    // Save item data — payment.js reads this to create the shipment after payment
    localStorage.setItem('sendItemData', JSON.stringify({
        itemName:        formData.itemName,
        category:        formData.category,
        weight:          formData.weight,
        value:           formData.value || 0,
        description:     formData.description,
        pickup:          formData.pickup,
        pickupDate:      formData.pickupDate,
        destination:     formData.destination,
        deliveryDate:    formData.deliveryDate,
        receiverName:    formData.receiverName,
        receiverPhone:   formData.receiverPhone,
        deliveryAddress: formData.deliveryAddress,
    }));

    // Also save as requestedRoute for the travelers filter
    localStorage.setItem('requestedRoute', JSON.stringify({
        pickup:      formData.pickup,
        destination: formData.destination,
        pickupDate:  formData.pickupDate,
        weight:      formData.weight,
        category:    formData.category,
        itemName:    formData.itemName,
    }));

    submitBtn.textContent = originalText;
    submitBtn.disabled    = false;
    showMatchingAnimation(); // redirects to available-travelers.html after animation
}

// Cancel button
const cancelBtn = document.querySelector('.btn-cancel');
if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        showConfirm(
            'Are you sure you want to cancel? All entered data will be lost.',
            () => {
                window.location.href = 'travix-landing.html';
            }
        );
    });
}

// Set minimum date for date inputs (today)
const today = new Date().toISOString().split('T')[0];
const pickupDateInput = document.getElementById('pickupDate');
const deliveryDateInput = document.getElementById('deliveryDate');

if (pickupDateInput) {
    pickupDateInput.setAttribute('min', today);
}

if (deliveryDateInput) {
    deliveryDateInput.setAttribute('min', today);
}

// Update delivery date minimum based on pickup date
if (pickupDateInput && deliveryDateInput) {
    pickupDateInput.addEventListener('change', () => {
        const pickupDate = pickupDateInput.value;
        if (pickupDate) {
            deliveryDateInput.setAttribute('min', pickupDate);
        }
    });
}

// Logout functionality
const logoutBtn = document.querySelector('.btn-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        showConfirm(
            'Are you sure you want to logout?',
            () => {
                // Clear any saved data
                localStorage.clear();
                sessionStorage.clear();
                // Redirect to home
                window.location.href = 'travix-landing.html';
            }
        );
    });
}

// Profile button
const profileBtn = document.querySelector('.profile-btn');
if (profileBtn) {
    profileBtn.addEventListener('click', () => {
        // Navigate to profile page
        // window.location.href = 'profile.html';
        console.log('Profile clicked');
    });
}

// Auto-format phone number
const phoneInput = document.getElementById('receiverPhone');
if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value.length <= 3) {
                e.target.value = '+' + value;
            } else if (value.length <= 6) {
                e.target.value = '+' + value.slice(0, 3) + ' ' + value.slice(3);
            } else if (value.length <= 9) {
                e.target.value = '+' + value.slice(0, 3) + ' ' + value.slice(3, 6) + ' ' + value.slice(6);
            } else {
                e.target.value = '+' + value.slice(0, 3) + ' ' + value.slice(3, 6) + ' ' + value.slice(6, 9) + ' ' + value.slice(9, 13);
            }
        }
    });
}

// Category selection visual feedback
const categoryItems = document.querySelectorAll('.category-item input[type="radio"]');
categoryItems.forEach(item => {
    item.addEventListener('change', () => {
        console.log('Category selected:', item.value);
    });
});

// Scroll to first error on form submission failure
function scrollToError() {
    const firstError = document.querySelector('.form-group input:invalid, .form-group textarea:invalid');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
    }
}

// Add this to form validation
sendItemForm?.addEventListener('invalid', scrollToError, true);

console.log('Send Item Page Loaded Successfully');

// Matching Animation Function
function showMatchingAnimation() {
    const modalHTML = `
        <div class="modal-overlay active" id="matchingModal" style="background: rgba(255, 255, 255, 0.98); z-index: 10000;">
            <div class="matching-container">
                <div class="matching-content">
                    <div class="matching-icon">
                        <img src="travix-logo.png" alt="Travix Logo" style="width: 100px; height: auto;" class="logo-spin"/>
                    </div>
                    <h2 class="matching-title">Finding Perfect Match...</h2>
                    <p class="matching-subtitle">Searching for the best travelers for your route</p>
                    
                    <div class="matching-progress">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <div class="progress-steps">
                            <div class="step" data-step="1">
                                <div class="step-icon">1</div>
                                <span>Request Received</span>
                            </div>
                            <div class="step" data-step="2">
                                <div class="step-icon">2</div>
                                <span>Matching Travelers</span>
                            </div>
                            <div class="step" data-step="3">
                                <div class="step-icon">3</div>
                                <span>Preparing Payment</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="matching-stats">
                        <div class="stat-item">
                            <div class="stat-number" id="travelersFound">0</div>
                            <div class="stat-label">Travelers Found</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number" id="routesChecked">0</div>
                            <div class="stat-label">Routes Checked</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add CSS for matching animation
    if (!document.getElementById('matchingStyles')) {
        const style = document.createElement('style');
        style.id = 'matchingStyles';
        style.textContent = `
            .matching-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                padding: 2rem;
            }
            
            .matching-content {
                text-align: center;
                max-width: 600px;
            }
            
            .matching-icon {
                margin-bottom: 2rem;
                animation: float 3s ease-in-out infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }
            
            .logo-spin {
                animation: pulse-scale 2s ease-in-out infinite;
                filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.3));
            }
            
            @keyframes pulse-scale {
                0%, 100% { 
                    transform: scale(1);
                }
                50% { 
                    transform: scale(1.1);
                }
            }
            
            .matching-title {
                font-size: 2rem;
                color: #0A1A2F;
                margin-bottom: 0.5rem;
                font-weight: 700;
            }
            
            .matching-subtitle {
                font-size: 1.1rem;
                color: #6B7280;
                margin-bottom: 3rem;
            }
            
            .matching-progress {
                margin-bottom: 3rem;
            }
            
            .progress-bar {
                width: 100%;
                height: 6px;
                background: #E5E7EB;
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 2rem;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #D4AF37 0%, #F4C542 100%);
                width: 0%;
                animation: fillProgress 3s ease-out forwards;
            }
            
            @keyframes fillProgress {
                0% { width: 0%; }
                33% { width: 33%; }
                66% { width: 66%; }
                100% { width: 100%; }
            }
            
            .progress-steps {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
            }
            
            .step {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
                opacity: 0.4;
                transition: all 0.5s ease;
            }
            
            .step-icon {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: #E5E7EB;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6B7280;
                font-weight: 700;
                font-size: 1.2rem;
                transition: all 0.5s ease;
            }
            
            .step.active {
                opacity: 1;
            }
            
            .step.active .step-icon {
                background: #D4AF37;
                color: white;
                transform: scale(1.1);
            }
            
            .step.loading .step-icon {
                background: #D4AF37;
                color: white;
                animation: pulse-step 1s ease-in-out infinite;
            }
            
            @keyframes pulse-step {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
            }
            
            .step span {
                font-size: 0.85rem;
                color: #6B7280;
                font-weight: 500;
            }
            
            .step.active span {
                color: #0A1A2F;
                font-weight: 600;
            }
            
            .matching-stats {
                display: flex;
                gap: 3rem;
                justify-content: center;
            }
            
            .stat-item {
                text-align: center;
            }
            
            .stat-number {
                font-size: 2.5rem;
                font-weight: 700;
                color: #D4AF37;
                margin-bottom: 0.25rem;
            }
            
            .stat-label {
                font-size: 0.9rem;
                color: #6B7280;
            }
            
            @media (max-width: 768px) {
                .matching-title {
                    font-size: 1.5rem;
                }
                .progress-steps {
                    gap: 0.5rem;
                }
                .step span {
                    font-size: 0.75rem;
                }
                .matching-stats {
                    flex-direction: column;
                    gap: 1.5rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Animate steps 1 -> 2 -> 3
    const steps = document.querySelectorAll('.step');
    
    // Step 1: Immediate
    steps[0].classList.add('active');
    
    // Step 2: After 1 second
    setTimeout(() => {
        steps[0].classList.remove('loading');
        steps[1].classList.add('active', 'loading');
    }, 1000);
    
    // Step 3: After 2.5 seconds
    setTimeout(() => {
        steps[1].classList.remove('loading');
        steps[2].classList.add('active');
    }, 2500);

    // Animate numbers
    animateNumbers();

    // Redirect after 3.5 seconds
    setTimeout(() => {
        window.location.href = 'available-travelers.html';
    }, 3500);
}

function animateNumbers() {
    const travelersEl = document.getElementById('travelersFound');
    const routesEl = document.getElementById('routesChecked');
    
    let travelers = 0;
    let routes = 0;
    const maxTravelers = 12;
    const maxRoutes = 47;
    
    const interval = setInterval(() => {
        if (travelers < maxTravelers) {
            travelers += Math.floor(Math.random() * 3) + 1;
            if (travelers > maxTravelers) travelers = maxTravelers;
            travelersEl.textContent = travelers;
        }
        
        if (routes < maxRoutes) {
            routes += Math.floor(Math.random() * 5) + 2;
            if (routes > maxRoutes) routes = maxRoutes;
            routesEl.textContent = routes;
        }
        
        if (travelers >= maxTravelers && routes >= maxRoutes) {
            clearInterval(interval);
        }
    }, 100);
}

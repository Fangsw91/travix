// Fallback for modal functions
if (typeof showSuccess === "undefined") {
    // Modal functions loaded from modal.js
    // Modal functions loaded from modal.js
}

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

// File Upload Handler for Travel Ticket
const ticketUpload = document.getElementById('ticketUpload');
const travelTicket = document.getElementById('travelTicket');

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
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        
        const p = uploadArea.querySelector('p');
        if (p) {
            p.textContent = `✓ ${fileName} (${fileSize} MB)`;
            p.style.color = '#10B981';
        }
        
        // Show remove button
        const removeBtn = document.getElementById('removeTicket');
        if (removeBtn) {
            removeBtn.style.display = 'flex';
        }
    }
}

// Remove ticket function
const removeTicketBtn = document.getElementById('removeTicket');
if (removeTicketBtn) {
    removeTicketBtn.addEventListener('click', () => {
        travelTicket.value = '';
        const p = ticketUpload.querySelector('p');
        if (p) {
            p.textContent = 'Click to upload your ticket';
            p.style.color = '';
        }
        removeTicketBtn.style.display = 'none';
    });
}

setupUploadArea(ticketUpload, travelTicket);

// Form Submission
const travelerForm = document.getElementById('travelerForm');

if (travelerForm) {
    let isSubmittingTrip = false; // hard guard against double-submit / double-click

    travelerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (isSubmittingTrip) return; // already in flight — ignore extra clicks

        // Check if at least one item type is selected
        const selectedItems = document.querySelectorAll('input[name="itemTypes"]:checked');
        if (selectedItems.length === 0) {
            showError('Please select at least one item type you\'re willing to carry');
            return;
        }
        
        // Check responsibility checkbox
        if (!document.getElementById('responsibility').checked) {
            showError('Please confirm you are responsible for items you accept to carry');
            return;
        }

        // Get form data
        const formData = {
            departureCity: document.getElementById('departureCity').value,
            departureDate: document.getElementById('departureDate').value,
            arrivalCity: document.getElementById('arrivalCity').value,
            arrivalDate: document.getElementById('arrivalDate').value,
            tripDetails: document.getElementById('tripDetails').value,
            itemTypes: Array.from(selectedItems).map(item => item.value),
            maxWeight: document.getElementById('maxWeight').value,
            pricePerKg: document.getElementById('pricePerKg').value,
            additionalNotes: document.getElementById('additionalNotes').value
        };

        // Validate required fields
        if (!formData.departureCity || !formData.arrivalCity || !formData.departureDate) {
            showError('Please fill in departure city, arrival city, and departure date.');
            return;
        }

        // Show loading state
        isSubmittingTrip = true;
        const submitBtn = travelerForm.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Posting...';
        submitBtn.disabled = true;

        TripAPI.create({
            from_location: formData.departureCity,
            from_country: formData.departureCity,
            from_city: formData.departureCity,
            to_location: formData.arrivalCity,
            to_country: formData.arrivalCity,
            to_city: formData.arrivalCity,
            departure_date: formData.departureDate,
            arrival_date: formData.arrivalDate,
            available_space: formData.maxWeight,
            price_per_kg: formData.pricePerKg,
            accepted_categories: formData.itemTypes,
            notes: formData.additionalNotes
        }).then(data => {
            showSuccess('Trip posted successfully! You will be notified when senders match your route.');
            // Keep the button disabled until redirect — no need to re-enable
            // since we're navigating away anyway, and this prevents any
            // chance of a second submit during the 2s redirect delay.
            setTimeout(() => { window.location.href = 'user-dashboard.html'; }, 2000);
        }).catch(err => {
            isSubmittingTrip = false;
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            const firstError = err.errors ? Object.values(err.errors)[0]?.[0] : null;
            showError(firstError || err.message || 'Failed to post trip. Please try again.');
        });
    });
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
const departureDateInput = document.getElementById('departureDate');
const arrivalDateInput = document.getElementById('arrivalDate');

if (departureDateInput) {
    departureDateInput.setAttribute('min', today);
}

if (arrivalDateInput) {
    arrivalDateInput.setAttribute('min', today);
}

// Update arrival date minimum based on departure date
if (departureDateInput && arrivalDateInput) {
    departureDateInput.addEventListener('change', () => {
        const departureDate = departureDateInput.value;
        if (departureDate) {
            arrivalDateInput.setAttribute('min', departureDate);
        }
    });
}

// Validate max weight and price per kg
const maxWeightInput = document.getElementById('maxWeight');
const pricePerKgInput = document.getElementById('pricePerKg');

maxWeightInput?.addEventListener('change', function() {
    let value = parseFloat(this.value);
    if (value < 1) this.value = 1;
    if (value > 50) this.value = 50;
});

pricePerKgInput?.addEventListener('change', function() {
    let value = parseFloat(this.value);
    if (value < 5) this.value = 5;
    if (value > 50) this.value = 50;
});

// Item type selection feedback
const itemTypeCheckboxes = document.querySelectorAll('input[name="itemTypes"]');
itemTypeCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const selectedCount = document.querySelectorAll('input[name="itemTypes"]:checked').length;
        console.log(`${selectedCount} item type(s) selected`);
    });
});

console.log('Become a Traveler Page Loaded Successfully');

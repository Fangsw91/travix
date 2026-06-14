// Track Delivery JavaScript

// Fallback for modal functions if not loaded
if (typeof showInfo === 'undefined') {
    // Modal functions loaded from modal.js
    // Modal functions loaded from modal.js
}

// Load delivery data from localStorage or URL params
function loadDeliveryData() {
    // Check if delivery ID is in URL
    const urlParams = new URLSearchParams(window.location.search);
    const deliveryId = urlParams.get('id');
    
    if (deliveryId) {
        document.getElementById('orderId').textContent = deliveryId;
    }
    
    // In a real app, this would fetch from API
    // For now, we'll use mock data or localStorage
    const selectedTraveler = localStorage.getItem('selectedTraveler');
    if (selectedTraveler) {
        const traveler = JSON.parse(selectedTraveler);
        updateTravelerInfo(traveler);
    }
    
    const requestedRoute = localStorage.getItem('requestedRoute');
    if (requestedRoute) {
        const route = JSON.parse(requestedRoute);
        updateDeliveryDetails(route);
    }
}

// Update traveler information
function updateTravelerInfo(traveler) {
    const travelerCard = document.querySelector('.traveler-info-card');
    if (travelerCard && traveler) {
        travelerCard.querySelector('h4').textContent = traveler.name || 'Michael Chen';
        travelerCard.querySelector('.traveler-rating strong').textContent = traveler.rating || '4.9';
    }
}

// Update delivery details
function updateDeliveryDetails(route) {
    if (!route) return;
    
    // Update item name
    const itemEl = document.querySelector('.detail-item:nth-child(1) .detail-value');
    if (itemEl && route.itemName) {
        itemEl.textContent = route.itemName;
    }
    
    // Update destination
    const toEl = document.querySelector('.detail-item:nth-child(2) .detail-value');
    if (toEl && route.destination) {
        const icon = toEl.querySelector('svg');
        toEl.textContent = route.destination;
        if (icon) toEl.prepend(icon);
    }
    
    // Update weight
    const weightEl = document.querySelector('.detail-item:nth-child(3) .detail-value');
    if (weightEl && route.weight) {
        weightEl.textContent = `${route.weight} kg`;
    }
    
    // Update pickup date
    const pickupEl = document.querySelector('.detail-item:nth-child(4) .detail-value');
    if (pickupEl && route.pickupDate) {
        pickupEl.textContent = route.pickupDate;
    }
    
    // Update from location
    const fromEl = document.querySelector('.detail-item:nth-child(5) .detail-value');
    if (fromEl && route.pickup) {
        const icon = fromEl.querySelector('svg');
        fromEl.textContent = route.pickup;
        if (icon) fromEl.prepend(icon);
    }
    
    // Update estimated delivery
    const estDeliveryEl = document.querySelector('.detail-item:nth-child(6) .detail-value');
    if (estDeliveryEl && route.deliveryDate) {
        estDeliveryEl.textContent = route.deliveryDate;
    }
}

// Message traveler functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load delivery data
    loadDeliveryData();
    
    // Message traveler button
    const messageBtns = document.querySelectorAll('.btn-message-traveler');
    messageBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            showInfo('Chat feature coming soon! You will be able to message your traveler in real-time.');
        });
    });
    
    // Quick action buttons
    const reportIssueBtn = document.querySelector('.quick-action-btn:nth-child(1)');
    if (reportIssueBtn) {
        reportIssueBtn.addEventListener('click', function() {
            showModal({
                title: 'Report Issue',
                message: 'Please describe the problem you\'re experiencing, and our support team will assist you immediately.',
                type: 'warning',
                confirmText: 'Contact Support',
                cancelText: 'Cancel',
                onConfirm: () => {
                    window.location.href = 'help-center.html';
                }
            });
        });
    }
    
    const updateTimeBtn = document.querySelector('.quick-action-btn:nth-child(2)');
    if (updateTimeBtn) {
        updateTimeBtn.addEventListener('click', function() {
            showInfo('Update Delivery Time: You can request a delivery time change. Your traveler will be notified and can accept or propose an alternative.');
        });
    }
    
    const viewReceiptBtn = document.querySelector('.quick-action-btn:nth-child(3)');
    if (viewReceiptBtn) {
        viewReceiptBtn.addEventListener('click', function() {
            showInfo('Receipt: This will show your payment details, traveler information, and delivery confirmation.');
        });
    }
    
    // Simulate real-time updates (in production, use WebSockets or polling)
    simulateRealTimeUpdates();
});

// Simulate real-time status updates
function simulateRealTimeUpdates() {
    // In a real app, this would use WebSockets or API polling
    // For demo purposes, we'll simulate an update after 30 seconds
    
    // Example: Update status badge after time
    // setTimeout(() => {
    //     const statusBadge = document.querySelector('.status-badge-header');
    //     if (statusBadge) {
    //         statusBadge.textContent = 'Out for Delivery';
    //         statusBadge.className = 'status-badge-header out-for-delivery';
    //     }
    // }, 30000);
}

// Generate tracking link for sharing
function getTrackingLink() {
    const orderId = document.getElementById('orderId').textContent;
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?id=${orderId}`;
}

// Copy tracking link to clipboard
function copyTrackingLink() {
    const link = getTrackingLink();
    navigator.clipboard.writeText(link).then(() => {
        showInfo('Tracking link copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

console.log('Track Delivery page loaded successfully');

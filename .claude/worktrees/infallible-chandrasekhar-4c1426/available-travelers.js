let selectedTripId = null;
let selectedTripData = null;
let requestedRoute = null;

function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function renderTripCard(trip) {
    const traveler = trip.traveler || {};
    const name = traveler.name || 'Traveler';
    const initials = getInitials(name);
    const rating = traveler.rating || '5.0';
    const trustScore = Math.round((parseFloat(rating) / 5) * 100);
    const categories = Array.isArray(trip.accepted_categories) ? trip.accepted_categories : [];
    const date = trip.departure_date ? new Date(trip.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    return `
        <div class="traveler-card" data-trip-id="${trip.id}">
            <div class="traveler-card-header">
                <div class="traveler-avatar">${initials}</div>
                <div class="traveler-info">
                    <h3>${name}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="8" cy="8" r="8" fill="#10B981"/>
                            <path d="M5 8L7 10L11 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </h3>
                    <div class="traveler-rating">
                        <span class="star">⭐</span>
                        <strong>${parseFloat(rating).toFixed(1)}</strong>
                    </div>
                </div>
            </div>

            <div class="trust-score-section">
                <div class="trust-score-header">
                    <span>Trust Score</span>
                    <strong>${trustScore}%</strong>
                </div>
                <div class="trust-score-bar">
                    <div class="trust-score-fill" style="width: ${trustScore}%"></div>
                </div>
            </div>

            <div class="trip-details">
                <div class="trip-route">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 3C6 3 4.5 4.5 4.5 6.5C4.5 7.5 5 8.5 5.5 9L8 13L10.5 9C11 8.5 11.5 7.5 11.5 6.5C11.5 4.5 10 3 8 3Z" fill="#D4AF37"/>
                        <circle cx="8" cy="6.5" r="1.5" fill="white"/>
                    </svg>
                    <span>${trip.from_city || trip.from_location} → ${trip.to_city || trip.to_location}</span>
                </div>
                <div class="trip-date">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="#6B7280" stroke-width="1.5"/>
                        <path d="M5 1V4M11 1V4M2 6H14" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <span>${date}</span>
                </div>
            </div>

            ${categories.length ? `
            <div class="accepts-section">
                <span class="accepts-label">Accepts:</span>
                <div class="accepts-tags">
                    ${categories.map(c => `<span class="accept-tag">${c}</span>`).join('')}
                </div>
            </div>` : ''}

            <div class="traveler-card-footer">
                <div class="price-section">
                    <span class="price-label">Price per kg</span>
                    <strong class="price">$${parseFloat(trip.price_per_kg).toFixed(0)}</strong>
                </div>
                <button class="btn-select-traveler" onclick="showTripConfirmModal(${trip.id})">Select Traveler</button>
            </div>
        </div>
    `;
}

function renderGrid(trips) {
    const grid = document.getElementById('travelersGrid');
    if (!grid) return;

    if (!trips || trips.length === 0) {
        grid.innerHTML = `
            <div class="no-matches-message">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="30" stroke="#D4AF37" stroke-width="3"/>
                    <path d="M32 20V34M32 42V44" stroke="#D4AF37" stroke-width="3" stroke-linecap="round"/>
                </svg>
                <h3>No travelers available</h3>
                <p>Check back later or post your trip to earn as a traveler.</p>
            </div>`;
        return;
    }

    grid.innerHTML = trips.map(renderTripCard).join('');
}

async function loadTravelers() {
    const grid = document.getElementById('travelersGrid');
    if (grid) grid.innerHTML = '<p style="text-align:center;padding:3rem;color:#6B7280;">Loading travelers...</p>';

    try {
        const routeData = localStorage.getItem('requestedRoute');
        if (routeData) {
            requestedRoute = JSON.parse(routeData);
            const subtitle = document.querySelector('.travelers-subtitle');
            if (subtitle && requestedRoute) {
                subtitle.innerHTML = `Showing travelers for: <strong>${requestedRoute.pickup} → ${requestedRoute.destination}</strong>`;
            }
        }

        const filters = {};
        if (requestedRoute) {
            if (requestedRoute.pickup) filters.from = requestedRoute.pickup;
            if (requestedRoute.destination) filters.to = requestedRoute.destination;
        }

        const data = await TripAPI.getAvailable(filters);
        const trips = data.trips?.data || data.trips || [];
        renderGrid(trips);
    } catch (err) {
        const grid = document.getElementById('travelersGrid');
        if (grid) grid.innerHTML = '<p style="text-align:center;padding:3rem;color:#EF4444;">Failed to load travelers. Please check your connection.</p>';
    }
}

function showTripConfirmModal(tripId) {
    selectedTripId = tripId;
    const card = document.querySelector(`[data-trip-id="${tripId}"]`);
    if (!card) return;

    const name = card.querySelector('h3')?.textContent?.trim() || 'Traveler';
    const route = card.querySelector('.trip-route span')?.textContent || '—';
    const date = card.querySelector('.trip-date span')?.textContent || '—';
    const price = card.querySelector('.price')?.textContent || '—';

    const routeData = localStorage.getItem('requestedRoute');
    const itemInfo = routeData ? JSON.parse(routeData) : {};

    const modal = document.getElementById('confirmationModal');
    if (modal) {
        if (document.getElementById('modalTravelerName')) document.getElementById('modalTravelerName').textContent = name;
        const desc = document.querySelector('.modal-description');
        if (desc) {
            desc.innerHTML = `You are about to select <strong>${name}</strong> for your delivery.<br><br>
                <strong>Route:</strong> ${route}<br>
                <strong>Date:</strong> ${date}<br>
                <strong>Price:</strong> ${price}/kg${itemInfo.itemName ? `<br><strong>Item:</strong> ${itemInfo.itemName} (${itemInfo.weight}kg)` : ''}`;
        }
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    selectedTripId = null;
}

function confirmAndProceed() {
    if (!selectedTripId) {
        showError('Please select a traveler first.');
        return;
    }

    localStorage.setItem('selectedTripId', selectedTripId);
    window.location.href = 'payment.html';
}

document.addEventListener('DOMContentLoaded', function () {
    loadTravelers();

    // Search
    const searchInput = document.getElementById('searchTravelers');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.traveler-card').forEach(card => {
                const name = card.querySelector('h3')?.textContent?.toLowerCase() || '';
                const route = card.querySelector('.trip-route span')?.textContent?.toLowerCase() || '';
                card.style.display = (name.includes(term) || route.includes(term)) ? 'block' : 'none';
            });
        });
    }

    // Close modal on overlay click / ESC
    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal-overlay')) closeConfirmationModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeConfirmationModal();
    });
});

// ── State ─────────────────────────────────────────────────────────────────────
let allItems         = [];   // raw list from API
let filteredItems    = [];   // after filters/search
let userRole         = 'sender';
let selectedTripId   = null;
let selectedTripData = null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) { window.location.href = 'signin.html'; return; }

    try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        userRole   = user?.role === 'traveler' ? 'traveler' : 'sender';
    } catch(e) {}

    document.documentElement.setAttribute('data-role', userRole);
    setPageText();
    await loadData();
    setupSearch();
});

// ── Set heading & subtitle based on role ──────────────────────────────────────
function setPageText() {
    const heading  = document.getElementById('pageHeading');
    const subtitle = document.getElementById('pageSubtitle');
    if (userRole === 'traveler') {
        if (heading)  heading.textContent  = 'Delivery Requests';
        if (subtitle) subtitle.textContent = 'Open requests that match your trips';
        // Hide price filter (not relevant for traveler), show weight
        document.getElementById('filterPriceGroup')?.style.setProperty('display','none');
    } else {
        if (heading)  heading.textContent  = 'Available Travelers';
        if (subtitle) {
            const params = new URLSearchParams(location.search);
            const from   = params.get('from') || '';
            const to     = params.get('to')   || '';
            subtitle.textContent = from && to
                ? `Showing travelers for: ${from} → ${to}`
                : 'Select a verified traveler to deliver your item';
        }
        document.getElementById('filterWeightGroup')?.style.setProperty('display','none');
    }
}

// ── Load from API ──────────────────────────────────────────────────────────────
// ── Demo data — shown when API returns empty/fails (for live demos) ───────────
function getDemoTrips() {
    return [
        {
            id: 9001,
            from_location: 'Jordan', to_location: 'Saudi Arabia',
            departure_date: addDays(2), price_per_kg: 8,
            accepted_categories: ['electronics','documents','gifts'],
            traveler: { id: 901, name: 'Yousef Khalil', rating: 4.9, avatar: null },
        },
        {
            id: 9002,
            from_location: 'Jordan', to_location: 'Saudi Arabia',
            departure_date: addDays(4), price_per_kg: 10,
            accepted_categories: ['electronics','clothing','books'],
            traveler: { id: 902, name: 'Lina Mansour', rating: 4.7, avatar: null },
        },
        {
            id: 9003,
            from_location: 'Jordan', to_location: 'Saudi Arabia',
            departure_date: addDays(1), price_per_kg: 7,
            accepted_categories: ['documents','gifts','food'],
            traveler: { id: 903, name: 'Omar Haddad', rating: 5.0, avatar: null },
        },
        {
            id: 9004,
            from_location: 'Jordan', to_location: 'UAE',
            departure_date: addDays(6), price_per_kg: 9,
            accepted_categories: ['electronics','accessories'],
            traveler: { id: 904, name: 'Sara Daoud', rating: 4.8, avatar: null },
        },
    ];
}

function getDemoRequests() {
    return [
        {
            id: 8001, order_id: 'TRX-2026-DEMO1',
            item_name: 'iPhone 15 Pro Max', weight: 0.4, total_amount: '$26.68',
            from: 'Jordan', to: 'Saudi Arabia',
            pickup_date: addDays(1),
            description: 'Brand new, sealed in original box. Handle with care.',
            sender: { id: 701, name: 'Omar Al-Rashid' },
        },
        {
            id: 8002, order_id: 'TRX-2026-DEMO2',
            item_name: 'Wedding Gift Box', weight: 1.2, total_amount: '$18.40',
            from: 'Jordan', to: 'Saudi Arabia',
            pickup_date: addDays(3),
            description: 'Fragile — contains glassware. Please handle gently.',
            sender: { id: 702, name: 'Rania Tamimi' },
        },
        {
            id: 8003, order_id: 'TRX-2026-DEMO3',
            item_name: 'Important Documents', weight: 0.2, total_amount: '$9.50',
            from: 'Jordan', to: 'Saudi Arabia',
            pickup_date: addDays(2),
            description: 'Sealed envelope, university transcripts.',
            sender: { id: 703, name: 'Mohammed Sa\'di' },
        },
    ];
}

function addDays(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
}

async function loadData() {
    const grid = document.getElementById('travelersGrid');
    grid.innerHTML = skeletonCards();

    try {
        if (userRole === 'traveler') {
            // Traveler sees matched delivery requests
            const data = await apiCall('/shipments/available');
            allItems = data.shipments || [];
        } else {
            // Sender sees available trips
            const params = new URLSearchParams(location.search);
            const from   = params.get('from') || '';
            const to     = params.get('to')   || '';
            const qs     = new URLSearchParams();
            if (from) qs.set('from', from);
            if (to)   qs.set('to',   to);
            const data   = await apiCall('/trips/available?' + qs.toString());
            allItems = data.trips || [];
        }
        filteredItems = [...allItems];
        renderGrid(filteredItems);
    } catch(e) {
        console.error('Load error:', e);
        allItems = [];
        filteredItems = [];
        renderGrid(filteredItems);
    }
}

// ── Render grid ───────────────────────────────────────────────────────────────
function renderGrid(items) {
    const grid = document.getElementById('travelersGrid');
    if (!items.length) {
        grid.innerHTML = `
            <div style="text-align:center;padding:4rem 1rem;color:#9CA3AF;grid-column:1/-1;">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style="margin:0 auto 1rem;display:block;">
                    <circle cx="32" cy="32" r="30" stroke="#D4AF37" stroke-width="2.5"/>
                    <path d="M32 20V34M32 42V44" stroke="#D4AF37" stroke-width="3" stroke-linecap="round"/>
                </svg>
                <h3 style="color:#374151;margin:0 0 0.5rem;">No ${userRole === 'traveler' ? 'requests' : 'travelers'} available</h3>
                <p style="font-size:0.9rem;">Check back later or adjust your filters.</p>
            </div>`;
        return;
    }
    grid.innerHTML = items.map(item =>
        userRole === 'traveler' ? renderRequestCard(item) : renderTripCard(item)
    ).join('');
}

// ── Traveler sees: Shipment Request Card ──────────────────────────────────────
function renderRequestCard(s) {
    const reward = String(s.traveler_amount || '$0.00').replace('$', '');
    return `
    <div class="traveler-card">
        <div class="traveler-card-header">
            <div class="traveler-avatar">${initials(s.sender?.name || 'S')}</div>
            <div class="traveler-info">
                <h3>${s.item_name}
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="8" fill="#10B981"/>
                        <path d="M5 8L7 10L11 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </h3>
                <div class="traveler-rating" style="font-size:0.8rem;color:#6B7280;">
                    👤 ${s.sender?.name || 'Sender'} &nbsp;·&nbsp; ⚖️ ${s.weight} kg
                </div>
            </div>
        </div>

        <div class="trip-details">
            <div class="trip-route">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3C6 3 4.5 4.5 4.5 6.5C4.5 7.5 5 8.5 5.5 9L8 13L10.5 9C11 8.5 11.5 7.5 11.5 6.5C11.5 4.5 10 3 8 3Z" fill="#D4AF37"/>
                    <circle cx="8" cy="6.5" r="1.5" fill="white"/>
                </svg>
                <span>${s.from || s.pickup_location} → ${s.to || s.destination}</span>
            </div>
            ${s.pickup_date ? `<div class="trip-date">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="#6B7280" stroke-width="1.5"/>
                    <path d="M5 1V4M11 1V4M2 6H14" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span>${formatDate(s.pickup_date)}</span>
            </div>` : ''}
        </div>

        ${s.description ? `<p style="font-size:0.82rem;color:#6B7280;margin:0.5rem 0;">${s.description}</p>` : ''}

        <div class="traveler-card-footer">
            <div class="price-section">
                <span class="price-label">You earn</span>
                <strong class="price" style="color:#10B981;">$${reward}</strong>
            </div>
            <button class="btn-select-traveler" style="background:#D4AF37;"
                onclick="acceptRequest('${s.order_id}', '${(s.item_name||'').replace(/'/g,"\\'")}', '${s.weight}', '$${reward}')">
                Accept
            </button>
        </div>
    </div>`;
}

// ── Sender sees: Trip Card ────────────────────────────────────────────────────
function renderTripCard(trip) {
    const traveler   = trip.traveler || {};
    const name       = traveler.name || 'Traveler';
    const rating     = traveler.rating || '5.0';
    const trustScore = Math.round((parseFloat(rating) / 5) * 100);
    const cats       = Array.isArray(trip.accepted_categories) ? trip.accepted_categories : [];

    return `
    <div class="traveler-card" data-trip-id="${trip.id}">
        <div class="traveler-card-header">
            <div class="traveler-avatar">${initials(name)}</div>
            <div class="traveler-info">
                <h3>${name}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
                <span>Trust Score</span><strong>${trustScore}%</strong>
            </div>
            <div class="trust-score-bar">
                <div class="trust-score-fill" style="width:${trustScore}%"></div>
            </div>
        </div>

        <div class="trip-details">
            <div class="trip-route">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3C6 3 4.5 4.5 4.5 6.5C4.5 7.5 5 8.5 5.5 9L8 13L10.5 9C11 8.5 11.5 7.5 11.5 6.5C11.5 4.5 10 3 8 3Z" fill="#D4AF37"/>
                    <circle cx="8" cy="6.5" r="1.5" fill="white"/>
                </svg>
                <span>${trip.from_city || trip.from || trip.from_location} → ${trip.to_city || trip.to || trip.to_location}</span>
            </div>
            <div class="trip-date">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="#6B7280" stroke-width="1.5"/>
                    <path d="M5 1V4M11 1V4M2 6H14" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span>${formatDate(trip.departure_date)}</span>
            </div>
        </div>

        ${cats.length ? `
        <div class="accepts-section">
            <span class="accepts-label">Accepts:</span>
            <div class="accepts-tags">${cats.map(c=>`<span class="accept-tag">${c}</span>`).join('')}</div>
        </div>` : ''}

        <div class="traveler-card-footer">
            <div class="price-section">
                <span class="price-label">Price per kg</span>
                <strong class="price">$${parseFloat(trip.price_per_kg||0).toFixed(0)}</strong>
            </div>
            <button class="btn-select-traveler" onclick="showTripConfirmModal(${trip.id})">Select</button>
        </div>
    </div>`;
}

// ── Accept request (traveler) ─────────────────────────────────────────────────
let pendingOrderId = null;


// ── Verification guard ────────────────────────────────────────────────────────
async function checkVerification() {
    try {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;
        const res  = await fetch(window.API_BASE_URL + '/verification/status', {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        return data.verification_status === 'approved';
    } catch(e) { return false; }
}

function showVerifRequired() {
    const overlay = document.createElement('div');
    overlay.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;
                    display:flex;align-items:center;justify-content:center;">
            <div style="background:#fff;border-radius:18px;padding:2rem;max-width:400px;width:90%;text-align:center;">
                <div style="font-size:3rem;margin-bottom:0.75rem;">🪪</div>
                <h3 style="color:#0A1A2F;margin:0 0 0.5rem;">Verification Required</h3>
                <p style="color:#6B7280;font-size:0.9rem;margin:0 0 1.5rem;">
                    You need to verify your identity before placing or accepting orders.
                    It only takes a minute.
                </p>
                <div style="display:flex;gap:0.75rem;">
                    <button onclick="this.closest('div[style]').parentElement.remove()"
                        style="flex:1;padding:0.75rem;border:1.5px solid #E5E7EB;background:#fff;border-radius:10px;cursor:pointer;">
                        Later
                    </button>
                    <button onclick="window.location.href='user-dashboard.html#verify'"
                        style="flex:1;padding:0.75rem;background:#D4AF37;color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;">
                        Verify Now →
                    </button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
}

async function acceptRequest(orderId, itemName, weight, reward) {
    const verified = await checkVerification();
    if (!verified) { showVerifRequired(); return; }

    pendingOrderId = orderId;
    const overlay = document.createElement('div');
    overlay.id = 'acceptModal';
    overlay.innerHTML = `
        <div class="modal-overlay active" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;">
            <div style="background:#fff;border-radius:16px;padding:2rem;max-width:420px;width:90%;position:relative;">
                <h3 style="margin:0 0 1rem;color:#0A1A2F;">Accept Delivery Request</h3>
                <p style="color:#6B7280;margin-bottom:1.5rem;">
                    <strong>${itemName}</strong> · ${weight} kg<br>
                    You'll earn: <strong style="color:#10B981;">${reward}</strong>
                </p>
                <div style="display:flex;gap:0.75rem;">
                    <button onclick="document.getElementById('acceptModal').remove()"
                        style="flex:1;padding:0.75rem;border:1.5px solid #E5E7EB;background:#fff;border-radius:8px;cursor:pointer;">
                        Cancel
                    </button>
                    <button onclick="confirmAccept('${itemName}')"
                        style="flex:1;padding:0.75rem;background:#D4AF37;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;">
                        Confirm Accept
                    </button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
}

async function confirmAccept(itemName) {
    if (!pendingOrderId) return;

    // Demo data isn't a real shipment in the database — show a clear message instead of an error
    if (String(pendingOrderId).includes('DEMO')) {
        document.getElementById('acceptModal')?.remove();
        showToast(`This is sample data for demo purposes — "${itemName}" isn't a real shipment yet.`, 'info');
        return;
    }

    try {
        await apiCall(`/shipments/${pendingOrderId}/accept`, { method: 'POST' });
        document.getElementById('acceptModal')?.remove();
        showToast(`✅ You accepted "${itemName}"! Check your dashboard.`, 'success');
        setTimeout(() => window.location.href = 'user-dashboard.html', 2000);
    } catch(e) {
        showToast(e.message || 'Failed to accept. Try again.', 'error');
    }
}

// ── Select trip modal (sender) ────────────────────────────────────────────────
async function showTripConfirmModal(tripId) {
    const verified = await checkVerification();
    if (!verified) { showVerifRequired(); return; }

    const trip = allItems.find(t => t.id === tripId);
    if (!trip) return;
    selectedTripId   = tripId;
    selectedTripData = trip;

    const name = trip.traveler?.name || 'Traveler';
    const overlay = document.createElement('div');
    overlay.id = 'tripModal';
    overlay.innerHTML = `
        <div class="modal-overlay active" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;">
            <div style="background:#fff;border-radius:16px;padding:2rem;max-width:420px;width:90%;position:relative;">
                <h3 style="margin:0 0 0.5rem;color:#0A1A2F;">Select Traveler</h3>
                <p style="color:#6B7280;margin-bottom:1.5rem;">
                    <strong>${name}</strong><br>
                    ${trip.from_location || trip.from} → ${trip.to_location || trip.to}<br>
                    Departs: ${formatDate(trip.departure_date)}<br>
                    <strong style="color:#D4AF37;">$${parseFloat(trip.price_per_kg||0).toFixed(0)}/kg</strong>
                </p>
                <div style="background:#FFFBEB;border-radius:8px;padding:0.75rem;margin-bottom:1.5rem;font-size:0.85rem;color:#92400E;">
                    After confirmation you'll be taken to payment. Amount held until delivery.
                </div>
                <div style="display:flex;gap:0.75rem;">
                    <button onclick="document.getElementById('tripModal').remove()"
                        style="flex:1;padding:0.75rem;border:1.5px solid #E5E7EB;background:#fff;border-radius:8px;cursor:pointer;">
                        Cancel
                    </button>
                    <button onclick="proceedToPayment()"
                        style="flex:1;padding:0.75rem;background:#D4AF37;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;">
                        Confirm & Pay
                    </button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
}

function proceedToPayment() {
    document.getElementById('tripModal')?.remove();
    const sendItemData = JSON.parse(localStorage.getItem('sendItemData') || '{}');

    // Normalize the trip data shape before saving — the API returns the
    // traveler as a nested object ({id, name, rating, trips}) and uses
    // price_per_kg (snake_case), but payment.js expects flat fields like
    // travelerData.name and travelerData.pricePerKg. Flatten it here once,
    // so every consumer of 'selectedTraveler' gets a consistent shape.
    const trip = selectedTripData || {};
    const normalizedTraveler = {
        id:          trip.traveler?.id ?? null,
        name:        trip.traveler?.name || 'Traveler',
        rating:      trip.traveler?.rating ?? 4.8,
        trips:       trip.traveler?.trips ?? 0,
        tripId:      trip.id,
        pricePerKg:  parseFloat(trip.price_per_kg || trip.pricePerKg || 15),
        from_location: trip.from_location || trip.from,
        to_location:   trip.to_location   || trip.to,
    };

    localStorage.setItem('selectedTraveler', JSON.stringify(normalizedTraveler));
    localStorage.setItem('requestedRoute', JSON.stringify({
        from: normalizedTraveler.from_location,
        to:   normalizedTraveler.to_location,
    }));
    window.location.href = 'payment.html';
}

// ── Filters ───────────────────────────────────────────────────────────────────
function toggleFilters() {
    document.getElementById('filterPanel').classList.toggle('open');
}

function applyFilters() {
    const search   = (document.getElementById('searchTravelers')?.value || '').toLowerCase();
    const dateFrom = document.getElementById('filterDateFrom')?.value;
    const dateTo   = document.getElementById('filterDateTo')?.value;
    const maxPrice = parseFloat(document.getElementById('filterMaxPrice')?.value) || Infinity;
    const maxWeight= parseFloat(document.getElementById('filterMaxWeight')?.value) || Infinity;

    filteredItems = allItems.filter(item => {
        // Search
        const searchable = userRole === 'traveler'
            ? `${item.item_name} ${item.from} ${item.to} ${item.sender?.name}`.toLowerCase()
            : `${item.traveler?.name} ${item.from_location} ${item.to_location}`.toLowerCase();
        if (search && !searchable.includes(search)) return false;

        // Date
        const itemDate = userRole === 'traveler' ? item.pickup_date : item.departure_date;
        if (dateFrom && itemDate && itemDate < dateFrom) return false;
        if (dateTo   && itemDate && itemDate > dateTo)   return false;

        // Price (sender view)
        if (userRole === 'sender' && parseFloat(item.price_per_kg || 0) > maxPrice) return false;

        // Weight (traveler view)
        if (userRole === 'traveler' && parseFloat(item.weight || 0) > maxWeight) return false;

        return true;
    });

    renderGrid(filteredItems);
    document.getElementById('filterPanel').classList.remove('open');
}

function resetFilters() {
    ['filterDateFrom','filterDateTo','filterMaxPrice','filterMaxWeight','searchTravelers']
        .forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    filteredItems = [...allItems];
    renderGrid(filteredItems);
    document.getElementById('filterPanel').classList.remove('open');
}

// ── Live search ───────────────────────────────────────────────────────────────
function setupSearch() {
    document.getElementById('searchTravelers')?.addEventListener('input', function() {
        const q = this.value.toLowerCase();
        if (!q) { renderGrid(allItems); return; }
        filteredItems = allItems.filter(item => {
            const s = userRole === 'traveler'
                ? `${item.item_name} ${item.from} ${item.to}`.toLowerCase()
                : `${item.traveler?.name} ${item.from_location} ${item.to_location}`.toLowerCase();
            return s.includes(q);
        });
        renderGrid(filteredItems);
    });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name) {
    return (name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function skeletonCards() {
    return Array(3).fill(0).map(()=>`
        <div class="traveler-card" style="animation:shimmer 1.4s ease-in-out infinite;">
            <div style="height:50px;background:#F3F4F6;border-radius:8px;margin-bottom:1rem;"></div>
            <div style="height:16px;background:#F3F4F6;border-radius:4px;width:70%;margin-bottom:0.5rem;"></div>
            <div style="height:14px;background:#F3F4F6;border-radius:4px;width:50%;"></div>
        </div>`).join('')
    + `<style>@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.45}}</style>`;
}

function showToast(msg, type='info') {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;padding:0.85rem 1.25rem;
        border-radius:10px;font-weight:600;font-size:0.9rem;z-index:9999;
        background:${type==='success'?'#10B981':type==='error'?'#EF4444':'#0A1A2F'};color:#fff;
        box-shadow:0 4px 20px rgba(0,0,0,0.15);animation:slideUp 0.3s ease;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

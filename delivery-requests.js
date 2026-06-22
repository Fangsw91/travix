// Delivery Requests Page JavaScript

// Accept Modal Function
function openAcceptModal(shipmentId, itemName, weight, pickupDate, reward) {
    pendingAcceptShipmentId = shipmentId;
    const modalHTML = `
        <div class="modal-overlay active" id="acceptModal">
            <div class="modal-container" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Accept Delivery Request</h3>
                    <button class="modal-close" onclick="closeModal()">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body" style="padding: 2rem;">
                    <h2 style="font-size: 1.5rem; color: #6B7280; margin-bottom: 0.5rem;">${itemName}</h2>
                    <p style="color: #6B7280; margin-bottom: 2rem;">You are about to accept this delivery request:</p>
                    
                    <div style="background: #F3F4F6; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #E5E7EB;">
                            <span style="color: #6B7280;">Item Weight</span>
                            <strong style="color: #0A1A2F;">${weight} kg</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #E5E7EB;">
                            <span style="color: #6B7280;">Pickup Date</span>
                            <strong style="color: #0A1A2F;">${pickupDate}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0;">
                            <span style="color: #6B7280;">Your Reward</span>
                            <strong style="color: #D4AF37; font-size: 1.5rem; text-decoration: underline;">${reward}</strong>
                        </div>
                    </div>
                    
                    <div style="background: #FEF3C7; padding: 1.25rem; border-radius: 12px; margin-bottom: 2rem;">
                        <p style="color: #92400E; line-height: 1.6; margin: 0;">
                            By accepting, you confirm that you can safely transport this item and deliver it on time. 
                            Payment will be released after successful delivery confirmation.
                        </p>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 1.5rem 2rem; display: flex; gap: 1rem;">
                    <button class="modal-btn modal-btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
                    <button class="modal-btn modal-btn-primary" onclick="confirmAcceptance('${itemName}')" style="flex: 1; background: #D4AF37;">Confirm Acceptance</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Close on overlay click
    const overlay = document.getElementById('acceptModal');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });

    // Close on ESC key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Confirm Acceptance via API
let pendingAcceptShipmentId = null;

function confirmAcceptance(itemName) {
    closeModal();
    if (!pendingAcceptShipmentId) {
        showError('Could not accept shipment. Please try again.');
        return;
    }

    // Demo data — simulate a real acceptance so the user can walk through the
    // full flow (pickup → transit → delivered) without needing a real sender.
    if (String(pendingAcceptShipmentId).includes('DEMO')) {
        acceptDemoShipment(pendingAcceptShipmentId, itemName);
        pendingAcceptShipmentId = null;
        return;
    }

    ShipmentAPI.accept(pendingAcceptShipmentId).then(() => {
        showSuccess(`You accepted the delivery for "${itemName}"! Check your dashboard.`);
        pendingAcceptShipmentId = null;
        setTimeout(loadDeliveryRequests, 1500);
    }).catch(err => {
        showError(err.message || 'Failed to accept shipment. Please try again.');
        pendingAcceptShipmentId = null;
    });
}

// ─── Accept a demo request — creates a locally-persisted "accepted" shipment ──
// so the rest of the flow (dashboard card, track-delivery, pickup-confirm,
// chat) all work normally without needing a real backend shipment.
function acceptDemoShipment(orderId, itemName) {
    const original = allRequests.find(s => s.order_id === orderId) || getDeliveryDemoRequests()[0];

    const acceptedShipment = {
        id: 'demo-' + orderId,
        order_id: orderId,
        item_name: original.item_name || itemName,
        category: original.category || 'General',
        weight: original.weight,
        total_amount: original.total_amount,
        // Traveler earnings = base (85% rule already baked into demo totals as the base)
        traveler_amount: original.total_amount,
        route: `${original.from || original.pickup_location} → ${original.to || original.destination}`,
        status: 'accepted',
        status_label: 'Accepted',
        status_color: '#3B82F6',
        sender: original.sender,
        pickup_date: original.pickup_date,
        created_at: 'Just now',
    };

    // Persist into the same cache the dashboard reads from instantly on load
    let cached = [];
    try { cached = JSON.parse(localStorage.getItem('cachedShipments_traveler') || '[]'); } catch(e) {}
    cached = cached.filter(s => s.order_id !== orderId); // replace if it already exists
    cached.unshift(acceptedShipment);
    localStorage.setItem('cachedShipments_traveler', JSON.stringify(cached));

    // Also create a REAL shipment in the database so it shows up in the admin
    // dashboard, MySQL, and anywhere else that reads from the backend directly
    // — not just this browser's localStorage.
    const rawAmount = parseFloat(String(original.total_amount || '0').replace('$', ''));
    apiCall('/shipments/accept-demo', {
        method: 'POST',
        body: JSON.stringify({
            order_id:        orderId,
            item_name:       acceptedShipment.item_name,
            category:        acceptedShipment.category,
            weight:          original.weight,
            total_amount:    rawAmount,
            pickup_location: original.from || original.pickup_location,
            destination:     original.to || original.destination,
            pickup_date:     original.pickup_date,
            sender_name:     original.sender?.name,
        }),
    }).catch(e => console.warn('Could not sync demo shipment to backend:', e));

    // Remove it from the available requests list so it doesn't show twice
    allRequests = allRequests.filter(s => s.order_id !== orderId);
    const container = document.getElementById('requestsGrid') ||
                      document.querySelector('.requests-grid') ||
                      document.querySelector('.requests-list');
    if (container) {
        container.innerHTML = allRequests.length
            ? allRequests.map(renderRequestCard).join('')
            : '<p style="text-align:center;padding:2rem;color:#6B7280;">No more requests right now.</p>';
    }

    showSuccess(`You accepted the delivery for "${itemName}"! Redirecting to your dashboard...`);
    setTimeout(() => { window.location.href = 'user-dashboard.html'; }, 1500);
}

// Search Functionality
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.request-card');
        
        cards.forEach(card => {
            const itemName = card.querySelector('.item-name').textContent.toLowerCase();
            const category = card.querySelector('.category-badge').textContent.toLowerCase();
            
            if (itemName.includes(searchTerm) || category.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

function renderRequestCard(shipment) {
    const sender  = shipment.sender || {};
    const reward    = String(shipment.traveler_amount || '$0.00').replace('$', '');
    const date    = shipment.pickup_date ? new Date(shipment.pickup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const isAccepted = shipment.status && shipment.status !== 'requested';

    return `
        <div class="request-card">
            <div class="request-card-header">
                <span class="item-name">${shipment.item_name}</span>
                <span class="category-badge">${shipment.category || 'General'}</span>
            </div>
            <p class="request-route">📍 ${shipment.from || shipment.pickup_location} → ${shipment.to || shipment.destination}</p>
            <p class="request-date">📅 ${date} · ⚖️ ${shipment.weight} kg · 💰 ${shipment.total_amount || '$—'}</p>
            ${sender.name ? `<p style="font-size:0.8rem;color:#6B7280;margin:0.25rem 0;">👤 ${sender.name}</p>` : ''}
            <div class="request-card-footer" style="gap:0.5rem;flex-wrap:wrap;">
                <strong class="request-reward">You earn: $${reward}</strong>
                <div style="display:flex;gap:0.5rem;">
                    ${isAccepted ? `
                        <button class="btn-accept" style="background:#3B82F6;"
                            onclick="window.location.href='chat.html?shipment=${shipment.id}&order=${shipment.order_id}'">
                            💬 Chat
                        </button>
                        <button class="btn-accept" style="background:#10B981;"
                            onclick="window.location.href='pickup-confirm.html?order=${shipment.order_id}'">
                            📸 Pickup
                        </button>
                    ` : `
                        <button class="btn-accept"
                            onclick="openAcceptModal('${shipment.order_id}', '${(shipment.item_name||'').replace(/'/g, "\\'")}', '${shipment.weight}', '${date}', '$${reward}')">
                            Accept
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

// ── Demo data — shown when API returns empty/fails (for live demos) ───────────
function getDeliveryDemoRequests() {
    return [
        {
            order_id: 'TRX-2026-DEMO1', item_name: 'iPhone 15 Pro Max',
            category: 'Electronics', weight: 0.4, total_amount: '$26.68',
            from: 'Jordan', to: 'Saudi Arabia', pickup_location: 'Jordan', destination: 'Saudi Arabia',
            pickup_date: addDeliveryDays(1),
            description: 'Brand new, sealed in original box. Handle with care.',
            sender: { id: 701, name: 'Omar Al-Rashid' },
            status: 'requested',
        },
        {
            order_id: 'TRX-2026-DEMO2', item_name: 'Wedding Gift Box',
            category: 'Gifts', weight: 1.2, total_amount: '$18.40',
            from: 'Jordan', to: 'Saudi Arabia', pickup_location: 'Jordan', destination: 'Saudi Arabia',
            pickup_date: addDeliveryDays(3),
            description: 'Fragile — contains glassware. Please handle gently.',
            sender: { id: 702, name: 'Rania Tamimi' },
            status: 'requested',
        },
        {
            order_id: 'TRX-2026-DEMO3', item_name: 'Important Documents',
            category: 'Documents', weight: 0.2, total_amount: '$9.50',
            from: 'Jordan', to: 'Saudi Arabia', pickup_location: 'Jordan', destination: 'Saudi Arabia',
            pickup_date: addDeliveryDays(2),
            description: "Sealed envelope, university transcripts.",
            sender: { id: 703, name: "Mohammed Sa'di" },
            status: 'requested',
        },
    ];
}

function addDeliveryDays(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
}

let allRequests = []; // keeps the full list around so filters can work on it

async function loadDeliveryRequests() {
    const container = document.getElementById('requestsGrid') ||
                      document.querySelector('.requests-grid') ||
                      document.querySelector('.requests-list');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center;padding:2rem;color:#6B7280;">Loading requests...</p>';

    try {
        const data = await ShipmentAPI.getAvailable();
        allRequests = data.shipments?.data || data.shipments || [];
        container.innerHTML = allRequests.length
            ? allRequests.map(renderRequestCard).join('')
            : '<p style="text-align:center;padding:2rem;color:#6B7280;">No delivery requests available right now.</p>';
    } catch (err) {
        allRequests = [];
        container.innerHTML = '<p style="text-align:center;padding:2rem;color:#EF4444;">Could not load requests. Please try again.</p>';
    }
}

// ─── Filters ────────────────────────────────────────────────────────────────
function toggleFilters() {
    document.getElementById('filterPanel')?.classList.toggle('open');
}

function applyFilters() {
    const dateFrom  = document.getElementById('filterDateFrom')?.value;
    const dateTo    = document.getElementById('filterDateTo')?.value;
    const maxWeight = parseFloat(document.getElementById('filterMaxWeight')?.value) || Infinity;
    const category  = document.getElementById('filterCategory')?.value;

    const filtered = allRequests.filter(s => {
        if (dateFrom && s.pickup_date && s.pickup_date < dateFrom) return false;
        if (dateTo   && s.pickup_date && s.pickup_date > dateTo)   return false;
        if (parseFloat(s.weight || 0) > maxWeight) return false;
        if (category && category !== 'all' && (s.category || '').toLowerCase() !== category.toLowerCase()) return false;
        return true;
    });

    const container = document.getElementById('requestsGrid') ||
                      document.querySelector('.requests-grid') ||
                      document.querySelector('.requests-list');
    if (container) {
        container.innerHTML = filtered.length
            ? filtered.map(renderRequestCard).join('')
            : '<p style="text-align:center;padding:2rem;color:#6B7280;">No requests match these filters.</p>';
    }

    document.getElementById('filterPanel')?.classList.remove('open');
}

function resetFilters() {
    ['filterDateFrom', 'filterDateTo', 'filterMaxWeight'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const catEl = document.getElementById('filterCategory');
    if (catEl) catEl.value = 'all';

    const container = document.getElementById('requestsGrid') ||
                      document.querySelector('.requests-grid') ||
                      document.querySelector('.requests-list');
    if (container) container.innerHTML = allRequests.map(renderRequestCard).join('');

    document.getElementById('filterPanel')?.classList.remove('open');
}

document.addEventListener('click', e => {
    const panel = document.getElementById('filterPanel');
    const btn   = document.getElementById('filtersToggleBtn');
    if (panel && panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn && !btn?.contains(e.target)) {
        panel.classList.remove('open');
    }
});

document.addEventListener('DOMContentLoaded', loadDeliveryRequests);

console.log('Delivery Requests page loaded');

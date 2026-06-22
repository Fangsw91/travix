// ─── Track Delivery — Live Polling ───────────────────────────────────────────

const POLL_INTERVAL = 10000; // 10 seconds
let pollTimer       = null;
let lastStatus      = null;
let currentOrderId  = null;
let currentTraveler = null;
let isTravelerView  = false;

// Canonical shipment lifecycle — used to compute done/current and to drive
// the traveler's "Update Status" action buttons in correct order.
const STATUS_SEQUENCE = ['requested', 'accepted', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = {
    requested:        'Shipment Requested',
    accepted:         'Traveler Accepted',
    picked_up:        'Item Picked Up',
    in_transit:       'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered:        'Delivered',
    cancelled:        'Cancelled',
};

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentOrderId  = urlParams.get('id') || localStorage.getItem('currentOrderId');

    // No real order to track, OR it's a known demo order — show demo data
    if (!currentOrderId || String(currentOrderId).includes('DEMO')) {
        currentOrderId = currentOrderId || 'TRX-2026-DEMO1';
        loadDemoTracking();
        bindButtons();
        return;
    }

    document.getElementById('orderId').textContent = currentOrderId;

    // Load from localStorage immediately (instant render)
    loadFromCache();

    // Then start live polling if user is logged in
    const token = localStorage.getItem('auth_token');
    if (token && currentOrderId) {
        fetchStatus(); // first call right away
        pollTimer = setInterval(fetchStatus, POLL_INTERVAL);
    }

    bindButtons();
});

// ─── Demo tracking data — shown when opening the page without a real order ────
function loadDemoTracking() {
    document.getElementById('orderId').textContent = currentOrderId;

    // Resume from wherever the demo timeline was left (e.g. just accepted from
    // delivery-requests.html), instead of always jumping straight to in_transit.
    const savedTimeline = JSON.parse(localStorage.getItem(`demoTimeline_${currentOrderId}`) || 'null');

    const timeline = savedTimeline || [
        { status: 'requested', title: 'Shipment Requested', description: 'Your shipment request has been created', time: '2026-06-21T09:00:00' },
        { status: 'accepted',  title: 'Traveler Accepted',  description: 'Yousef Khalil will carry your item', time: new Date().toISOString() },
    ];

    window.__demoTimeline = timeline;
    const lastStep = timeline[timeline.length - 1];

    const statusLabelMap = {
        requested: 'Requested', accepted: 'Accepted', picked_up: 'Picked Up',
        in_transit: 'In Transit', out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
    };

    updateStatusBadge(lastStep.status, statusLabelMap[lastStep.status] || lastStep.status);
    renderTimeline(timeline);
    updateTravelerCard({ name: 'Yousef Khalil', rating: 4.9, trips: 62 });
    updateStatusNote(lastStep.description);

    fillDeliveryDetails(
        { from: 'Jordan', to: 'Saudi Arabia' },
        { itemName: 'iPhone 15 Pro Max', weight: '0.4', category: 'Electronics' }
    );

    setupQuickActions({ shipmentId: null, orderId: currentOrderId, isDemo: true });
    setupTravelerControls(lastStep.status, { orderId: currentOrderId, isDemo: true });
}

// Stop polling when tab hidden (saves battery/requests)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(pollTimer);
    } else if (localStorage.getItem('auth_token') && currentOrderId) {
        fetchStatus();
        pollTimer = setInterval(fetchStatus, POLL_INTERVAL);
    }
});

// ─── Fetch live status from API ───────────────────────────────────────────────
async function fetchStatus() {
    try {
        const data = await apiCall(`/shipments/${currentOrderId}/status`);
        if (data.success) {
            updateUI(data);
            cacheTracking(data);
        }
    } catch (e) {
        if (e.status === 404) {
            // Order doesn't exist — stop all polling and show message
            stopAllPolling();
            showOrderNotFound();
        } else {
            // Transient network error — keep cached data showing
            console.warn('Tracking poll failed:', e.message);
        }
    }
}

// ─── Update all UI from API response ─────────────────────────────────────────
function updateUI(data) {
    const statusChanged = lastStatus && lastStatus !== data.status;
    lastStatus = data.status;

    // Header badge
    updateStatusBadge(data.status, data.status_label);

    // Timeline
    renderTimeline(data.timeline);

    // Traveler card
    if (data.traveler) updateTravelerCard(data.traveler);

    // Status note (e.g. "Departed Dubai airport")
    updateStatusNote(data.status_note);

    // Delivery Details — fill from the REAL shipment data returned by the API.
    // This was previously missing entirely, so the page only ever showed its
    // hardcoded placeholder values (iPhone 15 Pro, Paris, France, etc.) or
    // whatever stale data happened to be sitting in localStorage from before.
    fillDeliveryDetails(
        { destination: data.destination, pickup: data.pickup_location, pickupDate: data.pickup_date, deliveryDate: data.delivery_date },
        { itemName: data.item_name, weight: data.weight }
    );

    // Show toast if status changed
    if (statusChanged) showStatusToast(data.status_label);

    // Pulse the "live" indicator
    pulseLiveIndicator();

    // ── Pickup photo (visible to both roles) ──
    if (data.pickup_photo_url) showPickupPhotoCard(data.pickup_photo_url);

    // ── Switch to traveler view if this user is the traveler ──
    if (data.is_traveler) activateTravelerView(data);

    // ── Wire up Quick Action buttons (Message, Report Issue, etc.) once ──
    if (!window.__quickActionsBound) {
        window.__quickActionsBound = true;
        setupQuickActions({ shipmentId: data.shipment_id, orderId: currentOrderId, isDemo: false });
    }
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function updateStatusBadge(status, label) {
    const badge = document.querySelector('.status-badge-header');
    if (!badge) return;

    const colorMap = {
        requested:        '#6B7280',
        accepted:         '#3B82F6',
        picked_up:        '#8B5CF6',
        in_transit:       '#F59E0B',
        out_for_delivery: '#F97316',
        delivered:        '#10B981',
        cancelled:        '#EF4444',
    };

    badge.textContent   = label;
    badge.style.background = colorMap[status] || '#6B7280';
    badge.style.color      = '#fff';
    badge.style.padding    = '0.35rem 1rem';
    badge.style.borderRadius = '999px';
    badge.style.fontWeight = '600';
    badge.style.fontSize   = '0.9rem';
}

// ─── Timeline renderer ────────────────────────────────────────────────────────
function renderTimeline(rawSteps) {
    const container = document.querySelector('.status-timeline');
    if (!container || !rawSteps) return;

    // Figure out the furthest reached status from the raw events,
    // so steps before it are "done" and the matching one is "current".
    const reachedStatuses = rawSteps.map(s => s.status);
    const lastReachedIndex = Math.max(
        ...reachedStatuses.map(s => STATUS_SEQUENCE.indexOf(s)).filter(i => i >= 0),
        0
    );

    // Build a lookup of actual event data (title/description/time) per status
    const eventByStatus = {};
    rawSteps.forEach(s => { eventByStatus[s.status] = s; });

    const isCancelled = reachedStatuses.includes('cancelled');

    const steps = STATUS_SEQUENCE.map((status, i) => {
        const event   = eventByStatus[status];
        const done    = i < lastReachedIndex || (i === lastReachedIndex && i < STATUS_SEQUENCE.length - 1 && !!event);
        const current = i === lastReachedIndex && !!event;
        return {
            status,
            label:       STATUS_LABELS[status] || status,
            description: event?.description || (i <= lastReachedIndex ? '' : 'Waiting...'),
            time:        event?.time ? formatEventTime(event.time) : null,
            location:    event?.location || null,
            done:        i < lastReachedIndex,
            current:     i === lastReachedIndex,
        };
    });

    if (isCancelled) {
        container.innerHTML = `
            <div style="text-align:center;padding:2rem;color:#EF4444;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 1rem;">
                    <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6" stroke-linecap="round"/>
                </svg>
                <h3 style="margin:0;color:#0A1A2F;">Shipment Cancelled</h3>
                <p style="color:#6B7280;font-size:0.9rem;">${eventByStatus.cancelled?.description || ''}</p>
            </div>`;
        return;
    }

    container.innerHTML = steps.map((step, i) => {
        const stateClass = step.done
            ? (step.current ? 'active' : 'completed')
            : 'pending';

        const iconSVG = getStepIcon(step.status, step.done || step.current);
        const badgeHTML = step.done && !step.current
            ? `<span class="step-badge completed">Completed</span>`
            : step.current
            ? `<span class="step-badge current" style="background:#FEF3C7;color:#92400E;border:1px solid #FCD34D;">Current</span>`
            : '';

        const timeHTML = step.time
            ? `<p class="step-date" style="color:#D4AF37;font-size:0.82rem;margin-top:0.25rem;">✓ Completed on ${step.time}</p>`
            : '';

        const locationHTML = step.location
            ? `<p style="font-size:0.8rem;color:#6B7280;margin-top:0.2rem;">📍 ${step.location}</p>`
            : '';

        // Connector line (not on last step)
        const connector = i < steps.length - 1
            ? `<div class="step-connector" style="
                position:absolute;left:23px;top:52px;bottom:-28px;
                width:2px;
                background:${step.done && !step.current ? '#D4AF37' : '#E5E7EB'};
                transition:background 0.6s ease;
              "></div>`
            : '';

        return `
          <div class="timeline-step ${stateClass}" style="
              display:flex;gap:1rem;padding:0.75rem 0;
              position:relative;
              opacity:${stateClass === 'pending' ? '0.45' : '1'};
              transition:opacity 0.5s ease;
          ">
              ${connector}
              <div class="step-icon" style="
                  flex-shrink:0;width:46px;height:46px;border-radius:50%;
                  display:flex;align-items:center;justify-content:center;
                  background:${step.done ? '#D4AF37' : step.current ? '#D4AF37' : '#F3F4F6'};
                  color:${step.done || step.current ? '#fff' : '#9CA3AF'};
                  transition:all 0.5s ease;
                  box-shadow:${step.current ? '0 0 0 4px rgba(212,175,55,0.2)' : 'none'};
                  ${step.current ? 'animation:pulse-ring 2s ease-in-out infinite;' : ''}
              ">
                  ${iconSVG}
              </div>
              <div class="step-content" style="flex:1;padding-top:0.25rem;">
                  <div class="step-header" style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                      <h3 style="margin:0;font-size:1rem;font-weight:700;color:#111827;">${step.label}</h3>
                      ${badgeHTML}
                  </div>
                  <p class="step-description" style="margin:0.2rem 0 0;font-size:0.9rem;color:#6B7280;">${step.description}</p>
                  ${timeHTML}
                  ${locationHTML}
              </div>
          </div>`;
    }).join('');

    // Add pulse CSS once
    if (!document.getElementById('trackStyles')) {
        const s = document.createElement('style');
        s.id = 'trackStyles';
        s.textContent = `
          @keyframes pulse-ring {
            0%,100%{ box-shadow:0 0 0 4px rgba(212,175,55,0.2); }
            50%{ box-shadow:0 0 0 8px rgba(212,175,55,0.08); }
          }
          @keyframes slideInRight {
            from{ transform:translateX(100%);opacity:0; }
            to{ transform:translateX(0);opacity:1; }
          }
          @keyframes fadeOutRight {
            from{ transform:translateX(0);opacity:1; }
            to{ transform:translateX(100%);opacity:0; }
          }
          .live-dot { animation: livePulse 1.5s ease-in-out infinite; }
          @keyframes livePulse {
            0%,100%{ opacity:1;transform:scale(1); }
            50%{ opacity:0.4;transform:scale(0.8); }
          }
        `;
        document.head.appendChild(s);
    }
}

// ─── Step Icons ───────────────────────────────────────────────────────────────
function formatEventTime(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch(e) { return iso; }
}

function getStepIcon(status, active) {
    const icons = {
        requested:        `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6" stroke-linecap="round"/></svg>`,
        accepted:         `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>`,
        picked_up:        `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
        in_transit:       `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M12 3l9 9-9 9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        out_for_delivery: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
        delivered:        `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6" stroke-linecap="round"/></svg>`,
        cancelled:        `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6" stroke-linecap="round"/></svg>`,
    };
    return icons[status] || icons.requested;
}

// ─── Status note (e.g. location update) ──────────────────────────────────────
function updateStatusNote(note) {
    let noteEl = document.getElementById('statusNote');
    if (!noteEl) {
        noteEl = document.createElement('div');
        noteEl.id = 'statusNote';
        noteEl.style.cssText = `
            background:#FEF3C7;border-left:4px solid #D4AF37;
            padding:0.75rem 1rem;border-radius:0 8px 8px 0;
            font-size:0.875rem;color:#92400E;margin-bottom:1rem;
        `;
        const timeline = document.querySelector('.status-timeline');
        timeline?.parentElement?.insertBefore(noteEl, timeline);
    }
    noteEl.style.display = note ? 'block' : 'none';
    if (note) noteEl.innerHTML = `📦 <strong>Latest update:</strong> ${note}`;
}

// ─── Traveler card update ─────────────────────────────────────────────────────
function updateTravelerCard(traveler) {
    if (!traveler || !traveler.name) return;
    currentTraveler = traveler;

    const nameEl   = document.querySelector('.traveler-info-card h4');
    const ratingEl = document.querySelector('.traveler-info-card .traveler-rating strong');
    const tripsEl  = document.querySelector('.traveler-info-card .traveler-rating span:last-child');
    const avatarEl = document.querySelector('.traveler-info-card .traveler-avatar-large');

    if (nameEl)   nameEl.textContent   = traveler.name;
    if (ratingEl) ratingEl.textContent = traveler.rating ? parseFloat(traveler.rating).toFixed(1) : '—';
    if (tripsEl)  tripsEl.textContent  = traveler.trips ? `(${traveler.trips} trips)` : '';
    if (avatarEl) avatarEl.textContent = traveler.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Status change toast ──────────────────────────────────────────────────────
function showStatusToast(label) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position:fixed;bottom:2rem;right:2rem;z-index:9999;
        background:#111827;color:#fff;padding:0.875rem 1.5rem;
        border-radius:12px;font-weight:600;font-size:0.95rem;
        border-left:4px solid #D4AF37;
        animation:slideInRight 0.4s ease;
        max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,0.3);
    `;
    toast.innerHTML = `
        <div style="font-size:0.75rem;color:#9CA3AF;margin-bottom:0.2rem;">Status Updated</div>
        <div>📦 ${label}</div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ─── Live indicator pulse ─────────────────────────────────────────────────────
function addLiveIndicator() {
    const header = document.querySelector('.track-header');
    if (!header || document.getElementById('liveIndicator')) return;

    const ind = document.createElement('div');
    ind.id = 'liveIndicator';
    ind.style.cssText = `
        display:inline-flex;align-items:center;gap:0.4rem;
        font-size:0.8rem;color:#10B981;font-weight:600;margin-top:0.5rem;
    `;
    ind.innerHTML = `
        <span class="live-dot" style="width:8px;height:8px;border-radius:50%;background:#10B981;display:inline-block;"></span>
        Live tracking active
    `;
    header.appendChild(ind);
}

function pulseLiveIndicator() {
    addLiveIndicator();
    const dot = document.querySelector('.live-dot');
    if (dot) {
        dot.style.background = '#D4AF37';
        setTimeout(() => { dot.style.background = '#10B981'; }, 500);
    }
}

// ─── Load from localStorage cache ────────────────────────────────────────────
function loadFromCache() {
    const raw = localStorage.getItem(`trackingData_${currentOrderId}`);
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        if (data.timeline) renderTimeline(data.timeline);
        if (data.status)   updateStatusBadge(data.status, data.status_label || data.status);
        if (data.traveler) updateTravelerCard({ name: data.traveler, rating: data.rating });

        // Fill delivery details
        const routeData    = JSON.parse(localStorage.getItem('requestedRoute')  || '{}');
        const sendItemData = JSON.parse(localStorage.getItem('sendItemData')     || '{}');
        fillDeliveryDetails(routeData, sendItemData);

        // Apply traveler/sender view INSTANTLY from cache — avoids the delayed
        // "page changes after a few seconds" switch that happens while waiting
        // for the first live poll to come back.
        if (data.is_traveler) {
            activateTravelerView(data);
        }
        if (data.total_amount) {
            renderEarnings(data);
        }
    } catch (e) {}
}

function cacheTracking(data) {
    const key = `trackingData_${currentOrderId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({ ...existing, ...data }));
}

// ─── Fill delivery detail cards ───────────────────────────────────────────────
function fillDeliveryDetails(route, sendItem) {
    const set = (nth, val) => {
        const el = document.querySelector(`.detail-item:nth-child(${nth}) .detail-value`);
        if (el && val) {
            const icon = el.querySelector('svg');
            el.textContent = val;
            if (icon) el.prepend(icon);
        }
    };

    set(1, sendItem.itemName     || route.itemName);
    set(2, sendItem.destination  || route.destination);
    const w = sendItem.weight || route.weight;
    if (w) set(3, `${w} kg`);
    set(4, sendItem.pickupDate   || route.pickupDate);
    set(5, sendItem.pickup       || route.pickup);
    set(6, sendItem.deliveryDate || route.deliveryDate);
}

// ─── Buttons ──────────────────────────────────────────────────────────────────
function bindButtons() {
    document.querySelectorAll('.btn-message-traveler').forEach(btn =>
        btn.addEventListener('click', () =>
            showInfo('Chat feature coming soon!')
        )
    );

    const reportBtn = document.querySelector('.quick-action-btn:nth-child(1)');
    if (reportBtn) {
        reportBtn.addEventListener('click', () =>
            showModal({
                title: 'Report Issue',
                message: 'Our support team will assist you immediately.',
                type: 'warning',
                confirmText: 'Contact Support',
                cancelText: 'Cancel',
                onConfirm: () => { window.location.href = 'help-center.html'; }
            })
        );
    }

    const receiptBtn = document.querySelector('.quick-action-btn:nth-child(3)');
    if (receiptBtn) {
        receiptBtn.addEventListener('click', () => {
            const t = JSON.parse(localStorage.getItem('trackingData') || '{}');
            showInfo(`
                <strong>Receipt</strong><br><br>
                Order: ${t.orderId || t.order_id || 'N/A'}<br>
                Amount: ${t.total  || t.total_amount || 'N/A'}<br>
                Paid at: ${t.paidAt ? new Date(t.paidAt).toLocaleString() : 'N/A'}<br>
                Traveler: ${t.traveler || 'N/A'}
            `);
        });
    }
}

// ─── Cleanup on leave ─────────────────────────────────────────────────────────
window.addEventListener('beforeunload', () => clearInterval(pollTimer));

console.log('✅ Live tracker ready — polling every 10s');

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE MAP — Leaflet + OpenStreetMap (free, no API key)
// ═══════════════════════════════════════════════════════════════════════════════

let map            = null;
let travelerMarker = null;
let routeLine      = null;
let mapInitialized = false;

// Custom gold pin icon for traveler
const travelerIcon = () => L.divIcon({
    className: '',
    html: `
        <div style="
            width:44px;height:44px;border-radius:50% 50% 50% 0;
            background:linear-gradient(135deg,#D4AF37,#F4C542);
            transform:rotate(-45deg);
            box-shadow:0 4px 16px rgba(212,175,55,0.5);
            border:3px solid #fff;
            position:relative;
        ">
            <div style="
                position:absolute;inset:0;display:flex;align-items:center;
                justify-content:center;transform:rotate(45deg);
                font-size:20px;
            ">✈️</div>
        </div>
        <div style="
            position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);
            width:0;height:0;
            border-left:6px solid transparent;
            border-right:6px solid transparent;
            border-top:8px solid #D4AF37;
        "></div>
    `,
    iconSize:   [44, 52],
    iconAnchor: [22, 52],
    popupAnchor:[0, -54],
});

// ─── Initialize map ───────────────────────────────────────────────────────────
function initMap(lat, lng) {
    if (mapInitialized) return;

    if (typeof L === 'undefined') {
        console.warn('Leaflet not loaded yet — retrying in 1s');
        setTimeout(() => initMap(lat, lng), 1000);
        return;
    }

    mapInitialized = true;

    map = L.map('liveMap', {
        zoomControl:       true,
        scrollWheelZoom:   true,
        attributionControl: true,
    }).setView([lat, lng], 8);

    // OpenStreetMap tile layer — 100% free
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
    }).addTo(map);

    // Traveler marker
    travelerMarker = L.marker([lat, lng], { icon: travelerIcon() })
        .addTo(map)
        .bindPopup('<strong>Traveler Location</strong><br>Last updated just now');

    // Pulse ring on traveler position
    addPulseRing(lat, lng);
}

// ─── Update marker position smoothly ─────────────────────────────────────────
function updateMapLocation(lat, lng, address, updatedAt) {
    if (!map) {
        initMap(lat, lng);
        return;
    }

    const newLatLng = L.latLng(lat, lng);

    // Smooth move via animation
    if (travelerMarker) {
        animateMarker(travelerMarker, newLatLng);
        const timeAgo = updatedAt ? getTimeAgo(new Date(updatedAt)) : 'recently';
        travelerMarker.setPopupContent(`
            <div style="font-family:Inter,sans-serif;min-width:160px;">
                <strong style="color:#111;">✈️ Traveler</strong><br>
                <span style="font-size:0.82rem;color:#6B7280;">${address || 'Location updated'}</span><br>
                <span style="font-size:0.75rem;color:#9CA3AF;">${timeAgo}</span>
            </div>
        `);
    }

    // Pan map to new position if far enough
    const current = map.getCenter();
    if (current.distanceTo(newLatLng) > 500) {
        map.flyTo(newLatLng, map.getZoom(), { duration: 1.5 });
    }

    updateMapStatus(address, updatedAt, true);
}

// ─── Draw route line between pickup and destination ───────────────────────────
function drawRouteLine(pickupCoords, destCoords) {
    if (!map || routeLine) return;

    routeLine = L.polyline([pickupCoords, destCoords], {
        color:     '#D4AF37',
        weight:    3,
        opacity:   0.6,
        dashArray: '8 6',
    }).addTo(map);

    // Endpoint markers (smaller)
    L.circleMarker(pickupCoords, {
        radius:      8,
        fillColor:   '#10B981',
        color:       '#fff',
        weight:      2,
        fillOpacity: 1,
    }).addTo(map).bindPopup('<strong>📦 Pickup</strong>');

    L.circleMarker(destCoords, {
        radius:      8,
        fillColor:   '#3B82F6',
        color:       '#fff',
        weight:      2,
        fillOpacity: 1,
    }).addTo(map).bindPopup('<strong>🏁 Destination</strong>');
}

// ─── Animate marker move ──────────────────────────────────────────────────────
function animateMarker(marker, targetLatLng) {
    const startLatLng = marker.getLatLng();
    const frames      = 30;
    let   frame       = 0;

    const step = () => {
        frame++;
        const t   = frame / frames;
        const lat = startLatLng.lat + (targetLatLng.lat - startLatLng.lat) * easeInOut(t);
        const lng = startLatLng.lng + (targetLatLng.lng - startLatLng.lng) * easeInOut(t);
        marker.setLatLng([lat, lng]);
        if (frame < frames) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ─── Pulsing ring at traveler location ───────────────────────────────────────
function addPulseRing(lat, lng) {
    const ring = L.circleMarker([lat, lng], {
        radius:      20,
        fillColor:   '#D4AF37',
        color:       '#D4AF37',
        weight:      2,
        fillOpacity: 0.15,
        opacity:     0.5,
    }).addTo(map);

    let growing = true;
    let r       = 20;
    setInterval(() => {
        r       += growing ? 0.5 : -0.5;
        growing  = r >= 30 ? false : r <= 20 ? true : growing;
        ring.setRadius(r);
        ring.setLatLng(travelerMarker?.getLatLng() || [lat, lng]);
    }, 50);
}

// ─── Map status bar ───────────────────────────────────────────────────────────
function updateMapStatus(address, updatedAt, isLive) {
    const textEl   = document.getElementById('mapStatusText');
    const dot      = document.getElementById('mapDot');
    const updateEl = document.getElementById('mapLastUpdate');

    if (!textEl) return;

    if (isLive) {
        dot.style.background  = '#10B981';
        dot.style.animation   = 'livePulse 1.5s ease-in-out infinite';
        textEl.innerHTML      = `<span id="mapDot" style="width:8px;height:8px;border-radius:50%;background:#10B981;display:inline-block;animation:livePulse 1.5s ease-in-out infinite;"></span> Live location active`;
    } else {
        dot.style.background  = '#E5E7EB';
        textEl.innerHTML      = `<span id="mapDot" style="width:8px;height:8px;border-radius:50%;background:#E5E7EB;display:inline-block;"></span> Waiting for traveler location...`;
    }

    if (updatedAt && updateEl) {
        updateEl.textContent = 'Updated ' + getTimeAgo(new Date(updatedAt));
    }
}

// ─── Show "no location yet" placeholder on map ────────────────────────────────
function showMapPlaceholder() {
    if (mapInitialized) return;

    // Leaflet may not have finished loading from CDN yet — don't crash the page
    if (typeof L === 'undefined') {
        console.warn('Leaflet not loaded yet — retrying in 1s');
        setTimeout(showMapPlaceholder, 1000);
        return;
    }

    // Show static world map centered on Middle East while waiting
    map = L.map('liveMap', { zoomControl: true }).setView([31.9, 35.9], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
    }).addTo(map);
    mapInitialized = true;

    // Waiting overlay
    const overlay = L.control({ position: 'bottomleft' });
    overlay.onAdd = () => {
        const div = L.DomUtil.create('div');
        div.style.cssText = 'background:rgba(255,255,255,0.9);padding:8px 14px;border-radius:8px;font-size:0.82rem;color:#6B7280;border-left:3px solid #D4AF37;';
        div.innerHTML     = '⏳ Waiting for traveler to share location...';
        return div;
    };
    overlay.addTo(map);
}

// ─── Poll location from API ───────────────────────────────────────────────────
let locationPollTimer = null;

async function fetchLocation() {
    if (!currentOrderId) return;
    const token = localStorage.getItem('auth_token');
    if (!token) { showMapPlaceholder(); return; }

    try {
        const data = await apiCall(`/shipments/${currentOrderId}/location`);
        if (data.success && data.has_location) {
            updateMapLocation(
                parseFloat(data.lat),
                parseFloat(data.lng),
                data.address,
                data.location_updated_at
            );
        } else {
            showMapPlaceholder();
            updateMapStatus(null, null, false);
        }
    } catch (e) {
        if (e.status === 404) {
            clearInterval(locationPollTimer); // stop location polling too
        } else {
            showMapPlaceholder();
            updateMapStatus(null, null, false);
        }
    }
}

// ─── Stop all polling timers ──────────────────────────────────────────────────
function stopAllPolling() {
    clearInterval(pollTimer);
    clearInterval(locationPollTimer);
    pollTimer        = null;
    locationPollTimer = null;
}

// ─── Show order-not-found state ───────────────────────────────────────────────
function showOrderNotFound() {
    // Update header badge
    const badge = document.querySelector('.status-badge-header');
    if (badge) {
        badge.textContent         = 'Not Found';
        badge.style.background    = '#EF4444';
        badge.style.color         = '#fff';
        badge.style.padding       = '0.35rem 1rem';
        badge.style.borderRadius  = '999px';
        badge.style.fontWeight    = '600';
    }

    // Replace timeline with a clear message
    const timeline = document.querySelector('.status-timeline');
    if (timeline) {
        timeline.innerHTML = `
            <div style="
                text-align:center;padding:2.5rem 1rem;
                background:#FEF2F2;border-radius:12px;
                border:1px dashed #FECACA;
            ">
                <div style="font-size:2.5rem;margin-bottom:0.75rem;">📦</div>
                <h3 style="color:#991B1B;margin-bottom:0.5rem;font-size:1.1rem;">Order Not Found</h3>
                <p style="color:#7F1D1D;font-size:0.875rem;margin-bottom:1.25rem;">
                    The order <strong>${currentOrderId}</strong> does not exist.<br>
                    It may have been cancelled or the link is incorrect.
                </p>
                <a href="user-dashboard.html" style="
                    display:inline-block;padding:0.65rem 1.5rem;
                    background:#D4AF37;color:#fff;border-radius:8px;
                    font-weight:600;font-size:0.875rem;text-decoration:none;
                ">Go to Dashboard</a>
            </div>
        `;
    }

    // Hide everything that depends on real shipment data — showing them with
    // placeholder/NaN values is more confusing than just hiding them.
    hide('travelerInfoCard');
    hide('senderInfoCard');
    hide('earningsCard');
    hide('travelerActionPanel');
    document.querySelector('.delivery-details-card')?.style.setProperty('display', 'none');
    document.querySelector('.map-card')?.style.setProperty('display', 'none');

    const quickActions = document.querySelectorAll('.quick-action-btn, .btn-message-traveler');
    quickActions.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.cursor = 'not-allowed';
        btn.onclick = (e) => e.preventDefault();
    });
}

// ─── Hook into existing polling ───────────────────────────────────────────────
// Start location polling alongside status polling
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        fetchLocation(); // first call
        locationPollTimer = setInterval(fetchLocation, POLL_INTERVAL);
    }, 500); // slight delay after status poll init
});

// ─── Utility: time ago ────────────────────────────────────────────────────────
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 10)  return 'just now';
    if (seconds < 60)  return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds/60)}m ago`;
    return `${Math.floor(seconds/3600)}h ago`;
}

console.log('🗺️ Live map module ready — Leaflet + OpenStreetMap');

// ═══════════════════════════════════════════════════════════════════════════════
// TRAVELER VIEW — Status updates, location sharing, sender info
// ═══════════════════════════════════════════════════════════════════════════════

let travelerViewActive    = false;
let locationShareInterval = null;

// Next status the traveler can advance to
const STATUS_FLOW = ['requested','accepted','picked_up','in_transit','out_for_delivery','delivered'];

const STATUS_NEXT_LABEL = {
    accepted:         { label: '📦 Mark as Picked Up',     next: 'picked_up' },
    picked_up:        { label: '🚀 Mark as In Transit',    next: 'in_transit' },
    in_transit:       { label: '🚚 Out for Delivery',      next: 'out_for_delivery' },
    out_for_delivery: { label: '✅ Mark as Delivered',     next: 'delivered' },
};

// ─── Activate traveler-specific UI ───────────────────────────────────────────
// ─── Compute and render real traveler earnings from the shipment's total ──────
// total_amount = base + (base × 15% platform fee), so base = total / 1.15
function renderEarnings(data) {
    const earnEl = document.getElementById('earningAmount');
    if (!earnEl) return;

    // Use the real traveler_amount saved at payment time — never re-derive
    // this from total_amount on the frontend (the fee % can change over time).
    const amount = parseFloat(data.traveler_amount);
    if (!amount || isNaN(amount)) {
        earnEl.textContent = 'Pending';
        earnEl.style.fontSize = '1.1rem';
        earnEl.style.color = '#9CA3AF';
        return;
    }
    earnEl.textContent = '$' + amount.toFixed(2);
    earnEl.style.fontSize = '2rem';
    earnEl.style.color = '#10B981';
}

function activateTravelerView(data) {
    if (!travelerViewActive) {
        travelerViewActive = true;

        // Swap page title
        const title = document.getElementById('pageTitle');
        if (title) title.textContent = 'Your Active Delivery';

        // Show traveler panels, hide sender-only panels
        show('travelerActionPanel');
        show('earningsCard');
        show('senderInfoCard');
        hide('travelerInfoCard');
    }

    // Earnings — traveler earns the BASE price; total_amount includes the
    // 15% platform fee on top, so base = total / 1.15
    renderEarnings(data);

    // Sender info
    if (data.sender) {
        const name    = data.sender.name || '—';
        const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        setText('senderName', name);
        setText('senderAvatar', initials);
        setText('senderItemName', data.item_name || '—');
    }

    // Status action button
    renderTravelerActionButton(data.status);
}

// ─── Render the "advance status" button ──────────────────────────────────────
function renderTravelerActionButton(currentStatus) {
    const container = document.getElementById('statusActionButtons');
    if (!container) return;

    const action = STATUS_NEXT_LABEL[currentStatus];

    if (!action) {
        container.innerHTML = currentStatus === 'delivered'
            ? `<div style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.65rem 1.25rem;background:#ECFDF5;color:#065F46;border-radius:8px;font-weight:600;font-size:0.875rem;">
                   ✅ Delivery Complete — Great job!
               </div>`
            : `<div style="color:#6B7280;font-size:0.9rem;">No actions available for current status.</div>`;
        return;
    }

    // "Picked Up" gets a special photo-upload flow; others advance directly
    const clickHandler = action.next === 'picked_up'
        ? `openPickupModal()`
        : `advanceStatus('${action.next}')`;

    container.innerHTML = `
        <button onclick="${clickHandler}" style="
            display:inline-flex;align-items:center;gap:0.5rem;
            padding:0.7rem 1.5rem;
            background:linear-gradient(135deg,#D4AF37,#F4C542);
            color:#fff;border:none;border-radius:8px;
            font-weight:700;font-size:0.9rem;cursor:pointer;
            transition:all 0.25s;box-shadow:0 4px 12px rgba(212,175,55,0.3);
        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
            ${action.label}
        </button>
    `;
}

// ─── Call API to advance status ───────────────────────────────────────────────
async function advanceStatus(newStatus) {
    if (!currentOrderId) return;

    const btn = document.querySelector('#statusActionButtons button');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }

    // Demo mode — simulate the update locally, no real API call
    if (String(currentOrderId).includes('DEMO')) {
        setTimeout(() => {
            showSuccess('Status updated to: ' + newStatus.replace(/_/g, ' '));
            simulateDemoStatusAdvance(newStatus);
        }, 500);
        return;
    }

    try {
        await apiCall(`/shipments/${currentOrderId}/update-status`, {
            method: 'POST',
            body: JSON.stringify({ status: newStatus }),
        });
        showSuccess('Status updated to: ' + (newStatus.replace(/_/g,' ')));
        // Refresh immediately
        await fetchStatus();
    } catch (err) {
        showError(err.message || 'Could not update status. Please try again.');
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    }
}

// ─── Demo: advance the local timeline without touching the backend ───────────
function simulateDemoStatusAdvance(newStatus) {
    const labels = {
        picked_up:        'Item Picked Up',
        in_transit:       'In Transit',
        out_for_delivery: 'Out for Delivery',
        delivered:        'Delivered',
    };
    const descriptions = {
        picked_up:        'Traveler picked up the item with proof photo',
        in_transit:       'Departed Amman, heading to Riyadh',
        out_for_delivery: 'Arrived in Riyadh, on the way to recipient',
        delivered:        'Package delivered successfully',
    };

    window.__demoTimeline = window.__demoTimeline || [
        { status: 'requested', title: 'Shipment Requested', description: 'Your shipment request has been created', time: '2026-06-21T09:00:00' },
        { status: 'accepted',  title: 'Traveler Accepted',  description: 'Yousef Khalil will carry your item', time: '2026-06-21T11:30:00' },
    ];

    window.__demoTimeline.push({
        status: newStatus,
        title: labels[newStatus] || newStatus,
        description: descriptions[newStatus] || '',
        time: new Date().toISOString(),
    });

    // Persist so the timeline survives page reload / coming back later
    localStorage.setItem(`demoTimeline_${currentOrderId}`, JSON.stringify(window.__demoTimeline));

    // Keep the dashboard's cached shipment card in sync with the new status
    updateDemoShipmentInDashboardCache(currentOrderId, newStatus, labels[newStatus] || newStatus);

    updateStatusBadge(newStatus, labels[newStatus] || newStatus);
    renderTimeline(window.__demoTimeline);
    renderTravelerActionButton(newStatus);

    const btn = document.querySelector('#statusActionButtons button');
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
}

// ─── Keep the dashboard's "Active Deliveries" card in sync with demo progress ─
function updateDemoShipmentInDashboardCache(orderId, status, statusLabel) {
    const colorMap = {
        accepted: '#3B82F6', picked_up: '#8B5CF6', in_transit: '#F59E0B',
        out_for_delivery: '#F97316', delivered: '#10B981',
    };
    try {
        let cached = JSON.parse(localStorage.getItem('cachedShipments_traveler') || '[]');
        cached = cached.map(s => s.order_id === orderId
            ? { ...s, status, status_label: statusLabel, status_color: colorMap[status] || '#6B7280' }
            : s);
        localStorage.setItem('cachedShipments_traveler', JSON.stringify(cached));
    } catch(e) {}
}

// ─── Pickup photo modal ───────────────────────────────────────────────────────
function openPickupModal() {
    // Remove any existing modal
    const existing = document.getElementById('pickupModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'pickupModal';
    modal.style.cssText = `
        position:fixed;inset:0;z-index:99999;
        background:rgba(0,0,0,0.55);backdrop-filter:blur(3px);
        display:flex;align-items:center;justify-content:center;padding:1rem;
    `;
    modal.innerHTML = `
        <div style="
            background:#fff;border-radius:20px;width:100%;max-width:480px;
            box-shadow:0 24px 64px rgba(0,0,0,0.2);overflow:hidden;
            animation:scaleIn 0.25s ease;
        ">
            <style>
                @keyframes scaleIn{from{transform:scale(0.93);opacity:0}to{transform:scale(1);opacity:1}}
                #pickupDropZone.drag-over{border-color:#D4AF37!important;background:#FFFBEB!important;}
            </style>

            <!-- Modal header -->
            <div style="
                padding:1.25rem 1.5rem;
                background:linear-gradient(135deg,#0A1A2F,#1E3A5F);
                display:flex;align-items:center;justify-content:space-between;
            ">
                <div style="display:flex;align-items:center;gap:0.75rem;">
                    <div style="width:38px;height:38px;border-radius:10px;background:rgba(212,175,55,0.2);display:flex;align-items:center;justify-content:center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2">
                            <rect x="4" y="8" width="16" height="12" rx="2"/>
                            <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            <path d="M9 14l2 2 4-4" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div>
                        <div style="color:#fff;font-weight:700;font-size:1rem;">Confirm Item Pickup</div>
                        <div style="color:#94A3B8;font-size:0.78rem;">Upload a photo of the item you collected</div>
                    </div>
                </div>
                <button onclick="closePickupModal()" style="background:none;border:none;cursor:pointer;color:#94A3B8;padding:4px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>

            <!-- Modal body -->
            <div style="padding:1.5rem;">

                <!-- Drop zone -->
                <div id="pickupDropZone" onclick="document.getElementById('pickupPhotoInput').click()" style="
                    border:2px dashed #D1D5DB;border-radius:14px;
                    padding:2rem 1rem;text-align:center;cursor:pointer;
                    background:#F9FAFB;transition:all 0.2s;margin-bottom:1rem;
                ">
                    <div id="pickupDropContent">
                        <div style="font-size:2.5rem;margin-bottom:0.5rem;">📷</div>
                        <div style="font-weight:600;color:#374151;margin-bottom:0.25rem;">Click or drag photo here</div>
                        <div style="font-size:0.8rem;color:#9CA3AF;">JPG, PNG, WEBP — max 8 MB</div>
                    </div>
                    <img id="pickupPreview" src="" alt="Preview" style="
                        display:none;max-width:100%;max-height:220px;
                        border-radius:10px;object-fit:cover;
                        box-shadow:0 4px 16px rgba(0,0,0,0.1);
                    "/>
                </div>
                <input type="file" id="pickupPhotoInput" accept="image/jpeg,image/jpg,image/png,image/webp" style="display:none;">

                <!-- Optional note -->
                <div style="margin-bottom:1.25rem;">
                    <label style="display:block;font-size:0.85rem;font-weight:600;color:#374151;margin-bottom:0.4rem;">
                        Note <span style="color:#9CA3AF;font-weight:400;">(optional)</span>
                    </label>
                    <input id="pickupNote" type="text" placeholder="e.g. Item is well packed, collected from lobby"
                        style="width:100%;padding:0.65rem 0.9rem;border:1.5px solid #E5E7EB;border-radius:8px;font-size:0.9rem;box-sizing:border-box;outline:none;"
                        onfocus="this.style.borderColor='#D4AF37'" onblur="this.style.borderColor='#E5E7EB'">
                </div>

                <!-- Error line -->
                <div id="pickupError" style="display:none;color:#EF4444;font-size:0.85rem;margin-bottom:0.75rem;padding:0.6rem 0.9rem;background:#FEF2F2;border-radius:8px;border-left:3px solid #EF4444;"></div>

                <!-- Actions -->
                <div style="display:flex;gap:0.75rem;">
                    <button onclick="closePickupModal()" style="
                        flex:1;padding:0.75rem;border:1.5px solid #E5E7EB;background:#fff;
                        border-radius:10px;font-weight:600;font-size:0.9rem;cursor:pointer;color:#374151;
                        transition:all 0.2s;
                    " onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background='#fff'">
                        Cancel
                    </button>
                    <button id="pickupSubmitBtn" onclick="submitPickup()" style="
                        flex:2;padding:0.75rem;
                        background:linear-gradient(135deg,#D4AF37,#F4C542);
                        color:#fff;border:none;border-radius:10px;
                        font-weight:700;font-size:0.9rem;cursor:pointer;
                        transition:all 0.2s;box-shadow:0 4px 12px rgba(212,175,55,0.3);
                    ">
                        ✅ Confirm Pickup
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closePickupModal(); });

    // Wire up file input + drag and drop
    const input = document.getElementById('pickupPhotoInput');
    const zone  = document.getElementById('pickupDropZone');

    input.addEventListener('change', () => previewPickupPhoto(input.files[0]));

    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', ()  => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) { input.files = e.dataTransfer.files; previewPickupPhoto(file); }
    });
}

function previewPickupPhoto(file) {
    if (!file) return;
    const preview  = document.getElementById('pickupPreview');
    const content  = document.getElementById('pickupDropContent');
    const reader   = new FileReader();
    reader.onload  = e => {
        preview.src          = e.target.result;
        preview.style.display = 'block';
        content.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// ─── Demo: activate traveler controls so the flow can be tried without a real order ──
function setupTravelerControls(status, opts) {
    if (!opts.isDemo) return; // real orders already use activateTravelerView via fetchStatus

    travelerViewActive = true;
    show('travelerActionPanel');
    show('earningsCard');
    show('senderInfoCard');
    hide('travelerInfoCard');

    // Demo shipment: 0.4kg iPhone ($1000 value) to Saudi Arabia
    // weight_fee=$3.20 + value_fee=$20.00 → base=$23.20 (traveler keeps the full base)
    renderEarnings({ traveler_amount: 23.20 });
    setText('senderName', 'Omar Al-Rashid');
    setText('senderAvatar', 'OA');
    setText('senderItemName', 'iPhone 15 Pro Max');

    renderTravelerActionButton(status);
}

// ─── Quick action buttons: Message, Report Issue, Update Delivery Time, Receipt ──
function setupQuickActions(opts) {
    const { shipmentId, orderId, isDemo } = opts;

    // Message Traveler / Message Sender buttons
    document.querySelectorAll('.btn-message-traveler').forEach(btn => {
        btn.onclick = () => {
            if (isDemo) {
                window.location.href = `chat.html`; // opens demo conversation
            } else {
                window.location.href = `chat.html?shipment=${shipmentId || ''}&order=${orderId}`;
            }
        };
    });

    // Report Issue
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        const label = btn.textContent.trim();

        if (label.includes('Report Issue')) {
            btn.onclick = () => showReportIssueModal(orderId);
        }
        if (label.includes('Update Delivery Time')) {
            btn.onclick = () => showUpdateDeliveryTimeModal(orderId, isDemo);
        }
        if (label.includes('View Receipt')) {
            btn.onclick = () => showReceiptModal(orderId, isDemo);
        }
    });
}

// ─── Report Issue modal ────────────────────────────────────────────────────────
function showReportIssueModal(orderId) {
    const modal = document.createElement('div');
    modal.id = 'reportIssueModal';
    modal.style.cssText = `position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:1rem;`;
    modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:100%;max-width:440px;padding:1.5rem;">
            <h3 style="margin:0 0 0.4rem;color:#0A1A2F;">Report an Issue</h3>
            <p style="color:#6B7280;font-size:0.88rem;margin:0 0 1rem;">Order: <strong>${orderId}</strong></p>
            <select id="issueType" style="width:100%;padding:0.65rem;border:1.5px solid #E5E7EB;border-radius:8px;margin-bottom:0.75rem;font-size:0.9rem;">
                <option value="damaged">Item arrived damaged</option>
                <option value="delayed">Delivery is delayed</option>
                <option value="wrong_item">Wrong item received</option>
                <option value="no_contact">Traveler not responding</option>
                <option value="other">Other</option>
            </select>
            <textarea id="issueDetails" rows="4" placeholder="Describe the issue..." style="width:100%;padding:0.65rem;border:1.5px solid #E5E7EB;border-radius:8px;font-size:0.9rem;box-sizing:border-box;resize:vertical;margin-bottom:1rem;"></textarea>
            <div style="display:flex;gap:0.75rem;">
                <button onclick="document.getElementById('reportIssueModal').remove()" style="flex:1;padding:0.7rem;border:1.5px solid #E5E7EB;background:#fff;border-radius:8px;cursor:pointer;">Cancel</button>
                <button onclick="submitReportIssue('${orderId}')" style="flex:1;padding:0.7rem;background:#EF4444;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;">Submit Report</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function submitReportIssue(orderId) {
    document.getElementById('reportIssueModal')?.remove();
    showSuccess(`Issue reported for ${orderId}. Our support team will review it shortly.`);
}

// ─── Update Delivery Time modal ────────────────────────────────────────────────
function showUpdateDeliveryTimeModal(orderId, isDemo) {
    const modal = document.createElement('div');
    modal.id = 'updateTimeModal';
    modal.style.cssText = `position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:1rem;`;
    modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:100%;max-width:400px;padding:1.5rem;">
            <h3 style="margin:0 0 0.4rem;color:#0A1A2F;">Update Estimated Delivery</h3>
            <p style="color:#6B7280;font-size:0.88rem;margin:0 0 1rem;">Order: <strong>${orderId}</strong></p>
            <label style="display:block;font-size:0.85rem;font-weight:600;color:#374151;margin-bottom:0.4rem;">New estimated date</label>
            <input type="date" id="newDeliveryDate" style="width:100%;padding:0.65rem;border:1.5px solid #E5E7EB;border-radius:8px;font-size:0.9rem;box-sizing:border-box;margin-bottom:1rem;">
            <div style="display:flex;gap:0.75rem;">
                <button onclick="document.getElementById('updateTimeModal').remove()" style="flex:1;padding:0.7rem;border:1.5px solid #E5E7EB;background:#fff;border-radius:8px;cursor:pointer;">Cancel</button>
                <button onclick="submitUpdateDeliveryTime('${orderId}', ${isDemo})" style="flex:1;padding:0.7rem;background:#D4AF37;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;">Update</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function submitUpdateDeliveryTime(orderId, isDemo) {
    const newDate = document.getElementById('newDeliveryDate')?.value;
    if (!newDate) { showError('Please pick a date.'); return; }

    document.getElementById('updateTimeModal')?.remove();

    if (isDemo) {
        const el = document.querySelector('#deliveryDetails [data-field="est_delivery"]') || document.getElementById('estDelivery');
        if (el) el.textContent = newDate;
        showSuccess('Estimated delivery date updated.');
        return;
    }

    try {
        await apiCall(`/shipments/${orderId}/update-status`, {
            method: 'POST',
            body: JSON.stringify({ status: lastStatus || 'in_transit', status_note: `Estimated delivery updated to ${newDate}` }),
        });
        showSuccess('Estimated delivery date updated.');
        fetchStatus();
    } catch(e) {
        showError(e.message || 'Could not update delivery time.');
    }
}

// ─── View Receipt modal ────────────────────────────────────────────────────────
function showReceiptModal(orderId, isDemo) {
    const modal = document.createElement('div');
    modal.id = 'receiptModal';
    modal.style.cssText = `position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:1rem;`;
    modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:100%;max-width:420px;padding:1.5rem;">
            <div style="text-align:center;margin-bottom:1rem;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="1.8" style="margin:0 auto 0.5rem;">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M9 8v13"/>
                </svg>
                <h3 style="margin:0;color:#0A1A2F;">Receipt</h3>
                <p style="color:#9CA3AF;font-size:0.82rem;margin:0.2rem 0 0;">${orderId}</p>
            </div>
            <div style="border-top:1px dashed #E5E7EB;border-bottom:1px dashed #E5E7EB;padding:1rem 0;margin-bottom:1rem;">
                <div style="display:flex;justify-content:space-between;font-size:0.88rem;color:#374151;padding:0.3rem 0;"><span>Item</span><strong>iPhone 15 Pro Max</strong></div>
                <div style="display:flex;justify-content:space-between;font-size:0.88rem;color:#374151;padding:0.3rem 0;"><span>Weight Fee</span><strong>$3.20</strong></div>
                <div style="display:flex;justify-content:space-between;font-size:0.88rem;color:#374151;padding:0.3rem 0;"><span>Value Fee</span><strong>$20.00</strong></div>
                <div style="display:flex;justify-content:space-between;font-size:0.88rem;color:#374151;padding:0.3rem 0;"><span>Platform Fee</span><strong>$3.48</strong></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700;color:#0A1A2F;margin-bottom:1.25rem;">
                <span>Total Paid</span><span style="color:#D4AF37;">$26.68</span>
            </div>
            <button onclick="document.getElementById('receiptModal').remove()" style="width:100%;padding:0.75rem;background:#0A1A2F;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;">Close</button>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// (show/hide/setText helpers are defined once, near the end of this file)

async function submitPickup() {
    const input   = document.getElementById('pickupPhotoInput');
    const note    = document.getElementById('pickupNote')?.value || '';
    const errorEl = document.getElementById('pickupError');
    const btn     = document.getElementById('pickupSubmitBtn');

    // Validate
    if (!input.files || !input.files[0]) {
        errorEl.textContent    = 'Please upload a photo of the item before confirming.';
        errorEl.style.display  = 'block';
        return;
    }
    errorEl.style.display = 'none';

    // Loading state
    btn.disabled  = true;
    btn.textContent = '⏳ Uploading…';

    // Demo mode — skip the real upload, just simulate success
    if (String(currentOrderId).includes('DEMO')) {
        setTimeout(() => {
            closePickupModal();
            showSuccess('Item picked up! Photo saved successfully.');
            simulateDemoStatusAdvance('picked_up');
        }, 800);
        return;
    }

    try {
        const formData = new FormData();
        formData.append('photo', input.files[0]);
        if (note) formData.append('note', note);

        // Must NOT set Content-Type header — browser sets it with boundary for multipart
        const token = localStorage.getItem('auth_token');
        const res   = await fetch(`${window.API_BASE_URL}/shipments/${currentOrderId}/pickup`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');

        closePickupModal();
        showSuccess('Item picked up! Photo saved successfully.');
        await fetchStatus(); // refresh timeline + action button
    } catch (err) {
        btn.disabled    = false;
        btn.textContent = '✅ Confirm Pickup';
        if (errorEl) {
            errorEl.textContent   = err.message || 'Something went wrong. Please try again.';
            errorEl.style.display = 'block';
        }
    }
}

function closePickupModal() {
    document.getElementById('pickupModal')?.remove();
}

// ─── Share traveler's GPS location ───────────────────────────────────────────
function shareMyLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.');
        return;
    }

    const statusEl = document.getElementById('locationStatus');
    if (statusEl) statusEl.textContent = 'Getting location…';

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;

            // Demo mode — show success and update the map locally, skip the real API call
            if (String(currentOrderId).includes('DEMO')) {
                if (statusEl) {
                    statusEl.innerHTML = `<span style="color:#10B981;font-weight:600;">✓ Location shared</span> · ${new Date().toLocaleTimeString()}`;
                }
                updateMapLocation(lat, lng, 'Your location (demo)', new Date().toISOString());
                if (!locationShareInterval) {
                    locationShareInterval = setInterval(shareMyLocation, 60000);
                }
                return;
            }

            try {
                await apiCall(`/shipments/${currentOrderId}/location`, {
                    method: 'POST',
                    body: JSON.stringify({ lat, lng }),
                });
                if (statusEl) {
                    statusEl.innerHTML = `<span style="color:#10B981;font-weight:600;">✓ Location shared</span> · ${new Date().toLocaleTimeString()}`;
                }
                // Update local map too
                updateMapLocation(lat, lng, 'Your location', new Date().toISOString());

                // Auto-share every 60 seconds while page is open
                if (!locationShareInterval) {
                    locationShareInterval = setInterval(shareMyLocation, 60000);
                }
            } catch (e) {
                console.warn('Location share failed:', e);
                if (statusEl) statusEl.textContent = 'Could not share location: ' + (e.message || 'Make sure you are the assigned traveler for this order.');
            }
        },
        (err) => {
            if (statusEl) statusEl.textContent = 'Location access denied.';
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// ─── Show pickup photo card (sender sees proof of pickup) ─────────────────────
function showPickupPhotoCard(photoUrl) {
    if (document.getElementById('pickupPhotoCard')) return; // already shown

    const card = document.createElement('div');
    card.id = 'pickupPhotoCard';
    card.className = 'track-card';
    card.style.cssText = 'border-left:4px solid #10B981;margin-bottom:1.5rem;';
    card.innerHTML = `
        <h2 class="card-title" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                <rect x="4" y="8" width="16" height="12" rx="2"/>
                <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2"/>
                <path d="M9 14l2 2 4-4" stroke-linecap="round"/>
            </svg>
            Item Pickup Proof
        </h2>
        <p style="font-size:0.85rem;color:#6B7280;margin-bottom:0.75rem;">
            Photo taken by the traveler at the time of collection.
        </p>
        <a href="${photoUrl}" target="_blank" id="pickupPhotoLink" style="display:block;">
            <img src="${photoUrl}" alt="Pickup photo"
                style="width:100%;max-height:280px;object-fit:cover;border-radius:12px;
                       box-shadow:0 4px 16px rgba(0,0,0,0.1);cursor:zoom-in;
                       transition:transform 0.2s;"
                onmouseover="this.style.transform='scale(1.01)'"
                onmouseout="this.style.transform=''"
                onerror="this.closest('a').outerHTML='<div style=\'padding:2rem;text-align:center;background:#F9FAFB;border-radius:12px;color:#9CA3AF;font-size:0.85rem;\'>📷 Photo could not be loaded — it may have been moved or deleted from the server.</div>'">
        </a>
        <p style="font-size:0.75rem;color:#9CA3AF;margin-top:0.5rem;text-align:right;">
            Click to view full size
        </p>
    `;

    // Insert into the main track column after the delivery status card
    const mainCol = document.querySelector('.track-main-column');
    const firstCard = mainCol?.querySelector('.track-card');
    if (mainCol && firstCard) {
        mainCol.insertBefore(card, firstCard.nextSibling);
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function show(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
}
function hide(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// Stop location sharing when leaving page
window.addEventListener('beforeunload', () => {
    clearInterval(locationShareInterval);
});

console.log('✅ Traveler view module ready');

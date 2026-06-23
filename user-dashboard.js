// ─── Travix User Dashboard — Live Updates ────────────────────────────────────

const REFRESH_INTERVAL = 15000; // 15 seconds
let refreshTimer = null;
let currentRole  = 'sender'; // 'sender' | 'traveler'

// ─── Init ─────────────────────────────────────────────────────────────────────
// Called directly (not via DOMContentLoaded) — this script tag sits at the end
// of <body>, so every element above it (profile, deliveries list, stat cards)
// already exists in the DOM by the time this line runs. Waiting for the event
// here only adds a delay, since it may have already fired or waits a tick —
// that delay was the remaining cause of the flash on first load.
initDashboard();

async function initDashboard() {
    const token = localStorage.getItem('auth_token');
    if (!token) { window.location.href = 'signin.html'; return; }

    // Admin accounts don't belong on the regular dashboard — send them to the right place
    try {
        const cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (cachedUser && cachedUser.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
            return;
        }
    } catch(e) {}

    // Role already applied by CSS — just sync JS state
    detectRole();
    setupTabs();
    setupLogout();

    // Render profile from cache instantly (zero flicker)
    renderProfile();
    loadVerificationStatus(); // load verification status silently

    // Render cached shipments INSTANTLY (stale-while-revalidate) — no waiting on network
    renderShipmentsFromCache('sender');
    renderShipmentsFromCache('traveler');

    // Fetch fresh data from API in the background — run in parallel, not sequential
    syncUser();
    refreshAll();

    showLiveIndicator();

    // Live refresh every 15s — silent (no opacity changes)
    refreshTimer = setInterval(refreshAll, REFRESH_INTERVAL);
}

// ─── Instant render from last-known cache (avoids "Loading..." flash) ────────
function renderShipmentsFromCache(role) {
    const listId = role === 'sender' ? 'sender-deliveries-list' : 'traveler-deliveries-list';
    const listEl = document.getElementById(listId);
    if (!listEl) return;

    try {
        const cached = JSON.parse(localStorage.getItem(`cachedShipments_${role}`) || 'null');
        if (cached && cached.length) {
            listEl.innerHTML = cached.map(s => shipmentCard(s, role)).join('');
        } else if (cached && cached.length === 0) {
            listEl.innerHTML = emptyState(role);
        }
        // If nothing cached yet, leave the skeleton in the HTML as-is — first ever load
    } catch(e) {}
}

// ─── Sync user from API ───────────────────────────────────────────────────────
async function syncUser() {
    try {
        const data = await apiCall('/auth/user');
        if (data.success && data.user) {
            // Merge with existing (keep local fields not returned by API)
            const existing = getUser() || {};
            const updated  = { ...existing, ...data.user };
            localStorage.setItem('user', JSON.stringify(updated));
            renderProfile(); // Re-render with fresh data
        }
    } catch (e) {
        // Token expired?
        if (e.status === 401) {
            localStorage.clear();
            window.location.href = 'signin.html';
        }
    }
}

// ─── Detect role — CSS already shows correct view, just sync state ───────────
function detectRole() {
    const user = getUser();
    currentRole = user?.role === 'traveler' ? 'traveler' : 'sender';

    // Keep data-role in sync (CSS uses this to show/hide views)
    document.documentElement.setAttribute('data-role', currentRole);

    // Hide tabs bar — single-role users don't need to switch
    const tabsWrapper = document.getElementById('dashboardTabs');
    if (tabsWrapper) tabsWrapper.style.display = 'none';

    // Update page title
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) {
        titleEl.textContent = currentRole === 'traveler'
            ? 'Traveler Dashboard - Travix'
            : 'Sender Dashboard - Travix';
    }
}

// ─── Refresh stats + shipments ────────────────────────────────────────────────
async function refreshAll() {
    await Promise.all([
        loadProfile(),
        loadStats(),
        loadShipments('sender'),
        loadShipments('traveler'),
        loadTrips(),
    ]);
}

// ─── Stats ────────────────────────────────────────────────────────────────────
async function loadStats() {
    let s = {};
    try {
        const data = await apiCall('/dashboard/stats');
        if (data.success) s = { ...data.stats };
    } catch (e) {
        console.warn('Stats error:', e.message);
    }

    // Update each stat card by label
    document.querySelectorAll('.stat-card-small').forEach(card => {
        const label = card.querySelector('.stat-label-small')?.textContent.trim();
        const valEl = card.querySelector('.stat-value-small');
        if (!valEl) return;

        const map = {
            'Active Requests':  s.active_requests,
            'Pending':          s.pending,
            'Completed':        s.completed,
            'Total Spent':      s.total_spent != null ? '$' + s.total_spent.toFixed(2) : null,
            'Accepted Trips':   s.accepted_trips,
            'Pending Requests': s.pending_requests,
            'Active Deliveries':s.active_deliveries,
            'Total Earnings':   s.total_earnings != null ? '$' + s.total_earnings.toFixed(2) : null,
            'This Month':       s.this_month != null ? '$' + s.this_month.toFixed(2) : null,
        };

        const val = map[label];
        if (val != null) animateValue(valEl, val);
    });

    // Profile stats row — use explicit IDs, not index-based selection (which
    // breaks once any .user-stat block is hidden via CSS but stays in the DOM).
    const isTravelerRole = (getUser()?.role === 'traveler');

    const deliveriesEl = document.getElementById('statDeliveries');
    const earnedEl      = document.getElementById('statEarned');
    const earnedLabel   = document.getElementById('statEarnedLabel');

    if (deliveriesEl) animateValue(deliveriesEl, isTravelerRole ? (s.accepted_trips || 0) : (s.completed || 0));
    if (earnedEl)     animateValue(earnedEl, '$' + (isTravelerRole ? (s.total_earnings || 0) : (s.total_spent || 0)).toFixed(2));
    if (earnedLabel)  earnedLabel.textContent = isTravelerRole ? 'Earned' : 'Spent';
}

// ─── Shipments list ───────────────────────────────────────────────────────────
async function loadShipments(role) {
    const listId = role === 'sender' ? 'sender-deliveries-list' : 'traveler-deliveries-list';
    const listEl = document.getElementById(listId);
    if (!listEl) return;

    // Show skeleton only if there's nothing on screen yet (no cache, no prior render)
    if (!listEl.querySelector('.delivery-item') && !listEl.querySelector('.empty-state')) {
        listEl.innerHTML = skeletonCards(3);
    }

    try {
        const data = await apiCall(`/dashboard/shipments?role=${role}`);
        if (!data.success) return;

        // The backend is now the single source of truth for every shipment —
        // including ones originally created via the demo Accept flow, since
        // accept-demo persists a real Shipment + Transaction. Caching is only
        // used for instant render on next load, never merged with stale data.
        localStorage.setItem(`cachedShipments_${role}`, JSON.stringify(data.shipments));

        if (!data.shipments.length) {
            listEl.innerHTML = emptyState(role);
            return;
        }

        // Update silently — no flash
        listEl.innerHTML = data.shipments.map(s => shipmentCard(s, role)).join('');

    } catch (e) {
        console.warn('Shipments error:', e.message);
        if (!listEl.querySelector('.delivery-item')) {
            listEl.innerHTML = emptyState(role);
        }
        listEl.style.opacity = '1';
    }
}

function isDemoShipment(s) {
    return String(s.id).startsWith('demo-') || String(s.order_id || '').includes('DEMO');
}

function getCachedShipments(role) {
    try { return JSON.parse(localStorage.getItem(`cachedShipments_${role}`) || '[]'); }
    catch(e) { return []; }
}

// ─── Skeleton loading cards ───────────────────────────────────────────────────
function skeletonCards(n) {
    return Array(n).fill(0).map(() => `
        <div style="
            display:flex;align-items:center;gap:1rem;
            padding:1rem;border-radius:10px;border:1px solid #F3F4F6;
            margin-bottom:0.75rem;background:#fff;
        ">
            <div style="flex:1;">
                <div style="height:14px;background:#F3F4F6;border-radius:4px;width:60%;margin-bottom:0.5rem;
                    animation:shimmer 1.5s ease-in-out infinite;"></div>
                <div style="height:12px;background:#F3F4F6;border-radius:4px;width:40%;
                    animation:shimmer 1.5s ease-in-out infinite 0.2s;"></div>
            </div>
            <div style="width:60px;height:20px;background:#F3F4F6;border-radius:4px;
                animation:shimmer 1.5s ease-in-out infinite 0.4s;"></div>
        </div>
    `).join('') + `<style>
        @keyframes shimmer {
            0%,100%{opacity:1} 50%{opacity:0.4}
        }
    </style>`;
}

// ─── Shipment card HTML ───────────────────────────────────────────────────────
function shipmentCard(s, role) {
    const isActive = !['delivered','cancelled'].includes(s.status);
    const trackPage = role === 'traveler' ? 'traveler-tracking.html' : 'track-delivery.html';

    return `
    <div class="delivery-item" style="
        display:flex;align-items:center;justify-content:space-between;
        padding:1rem;border-radius:10px;border:1px solid #F3F4F6;
        margin-bottom:0.75rem;background:#fff;
        transition:box-shadow 0.2s;
        cursor:pointer;
    " onclick="window.location.href='${trackPage}?id=${s.order_id}'"
       onmouseenter="this.style.boxShadow='0 2px 12px rgba(0,0,0,0.08)'"
       onmouseleave="this.style.boxShadow='none'">
        <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;">
                <span style="font-weight:700;color:#111;font-size:0.95rem;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    ${s.item_name}
                </span>
                <span style="
                    font-size:0.72rem;font-weight:600;padding:2px 8px;border-radius:999px;
                    background:${s.status_color}22;color:${s.status_color};
                    white-space:nowrap;
                ">${s.status_label}</span>
            </div>
            <div style="font-size:0.82rem;color:#6B7280;">${s.route}</div>
            <div style="font-size:0.78rem;color:#9CA3AF;margin-top:0.15rem;">${s.created_at}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:1rem;display:flex;flex-direction:column;align-items:flex-end;gap:0.3rem;">
            <div style="font-weight:700;color:#D4AF37;font-size:0.95rem;">${role === 'traveler' ? (s.traveler_amount || '—') : s.total_amount}</div>
            ${isActive ? `
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;justify-content:flex-end;">
                <a href="${trackPage}?id=${s.order_id}"
                   style="font-size:0.75rem;color:#3B82F6;text-decoration:none;padding:2px 8px;border:1px solid #3B82F6;border-radius:6px;"
                   onclick="event.stopPropagation()">Track</a>
                ${s.id && s.status !== 'requested' ? `
                <a href="chat.html?shipment=${s.id}&order=${s.order_id}"
                   style="font-size:0.75rem;color:#fff;background:#0A1A2F;text-decoration:none;padding:2px 8px;border-radius:6px;"
                   onclick="event.stopPropagation()">💬 Chat</a>` : ''}
                ${role === 'traveler' && s.status === 'accepted' ? `
                <a href="pickup-confirm.html?order=${s.order_id}"
                   style="font-size:0.75rem;color:#fff;background:#10B981;text-decoration:none;padding:2px 8px;border-radius:6px;"
                   onclick="event.stopPropagation()">📸 Pickup</a>` : ''}
            </div>` : ''}
        </div>
    </div>`;
}

// ─── Trips list (traveler's posted trips) ─────────────────────────────────────
async function loadTrips() {
    const listEl = document.getElementById('trips-list');
    if (!listEl) return;

    try {
        const data = await TripAPI.getMyTrips();
        if (!data.success) return;

        if (!data.trips.length) {
            listEl.innerHTML = `
                <div class="empty-state" style="text-align:center;padding:2rem 1rem;color:#6B7280;">
                    <p style="font-weight:600;color:#374151;margin-bottom:0.5rem;">No trips posted yet</p>
                    <a href="become-traveler.html" style="display:inline-block;padding:0.6rem 1.5rem;background:#D4AF37;color:#fff;border-radius:8px;font-weight:600;text-decoration:none;font-size:0.875rem;">+ Post a Trip</a>
                </div>`;
            return;
        }

        listEl.innerHTML = data.trips.map(tripCard).join('');

    } catch (e) {
        console.warn('Trips error:', e.message);
        if (!listEl.querySelector('.trip-item')) {
            listEl.innerHTML = '<p style="text-align:center;padding:2rem;color:#9CA3AF;">Could not load trips.</p>';
        }
    }
}

function tripCard(t) {
    const statusColors = { active: '#3B82F6', completed: '#10B981', cancelled: '#EF4444' };
    const color = statusColors[t.status] || '#6B7280';
    const categories = Array.isArray(t.accepted_categories) ? t.accepted_categories.join(', ') : (t.accepted_categories || '');

    return `
    <div class="trip-item" style="display:flex;align-items:center;justify-content:space-between;padding:1rem;border-radius:10px;border:1px solid #F3F4F6;margin-bottom:0.75rem;background:#fff;">
        <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;">
                <span style="font-weight:700;color:#111;font-size:0.95rem;">${t.from_location || t.from_city} → ${t.to_location || t.to_city}</span>
                <span style="font-size:0.72rem;font-weight:600;padding:2px 8px;border-radius:999px;background:${color}22;color:${color};white-space:nowrap;text-transform:capitalize;">${t.status}</span>
            </div>
            <div style="font-size:0.82rem;color:#6B7280;">Departs ${formatTripDate(t.departure_date)} · Up to ${t.available_space} kg · $${t.price_per_kg}/kg</div>
            ${categories ? `<div style="font-size:0.78rem;color:#9CA3AF;margin-top:0.15rem;">Accepts: ${categories}</div>` : ''}
        </div>
        ${t.status === 'active' ? `
        <button onclick="cancelTrip(${t.id})" style="font-size:0.75rem;color:#EF4444;background:#fff;border:1px solid #EF4444;border-radius:6px;padding:4px 10px;cursor:pointer;white-space:nowrap;">Cancel</button>` : ''}
    </div>`;
}

function formatTripDate(dateStr) {
    if (!dateStr) return '—';
    const date  = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString())    return 'today';
    if (date.toDateString() === tomorrow.toDateString())  return 'tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function cancelTrip(tripId) {
    if (!confirm('Cancel this trip? Senders will no longer be able to select you for it.')) return;
    try {
        await TripAPI.cancel(tripId);
        loadTrips();
    } catch (e) {
        alert(e.message || 'Could not cancel trip.');
    }
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function emptyState(role) {
    const isSender = role === 'sender';
    return `
    <div class="empty-state" style="text-align:center;padding:2.5rem 1rem;color:#6B7280;">
        <div style="font-size:2.5rem;margin-bottom:0.75rem;">${isSender ? '📦' : '✈️'}</div>
        <p style="font-weight:600;color:#374151;margin-bottom:0.5rem;">
            ${isSender ? 'No shipments yet' : 'No deliveries yet'}
        </p>
        <p style="font-size:0.875rem;margin-bottom:1rem;">
            ${isSender ? 'Send your first item to get started' : 'Accept a delivery request to get started'}
        </p>
        <a href="${isSender ? 'send-item.html' : 'delivery-requests.html'}"
           style="display:inline-block;padding:0.6rem 1.5rem;background:#D4AF37;color:#fff;
           border-radius:8px;font-weight:600;text-decoration:none;font-size:0.875rem;">
            ${isSender ? '+ Send Item' : 'Browse Requests'}
        </a>
    </div>`;
}

// ─── Load profile (render from cache, then refresh from API) ─────────────────
async function loadProfile() {
    // Render immediately from localStorage so there's no flicker
    renderProfile();

    // Fetch fresh profile + stats from API
    try {
        const data = await apiCall('/dashboard/profile');
        if (data.success) {
            const existing = getUser() || {};
            const updated  = { ...existing, ...data.user };
            localStorage.setItem('user', JSON.stringify(updated));
            renderProfile(); // Re-render with fresh data
        }
    } catch (_) {
        // Silently fall back to cached data already rendered above
    }
}

// ─── Profile render ───────────────────────────────────────────────────────────
function renderProfile() {
    const user = getUser();
    if (!user) return;

    // Name — try all possible IDs
    ['userName', 'user-name', 'profileName'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = user.name;
    });
    // Also by selector
    document.querySelectorAll('.profile-name, [data-profile="name"]').forEach(el => {
        el.textContent = user.name;
    });

    // Handle / username
    document.querySelectorAll('.user-handle, [data-profile="handle"]').forEach(el => {
        el.textContent = '@' + (user.email || '').split('@')[0];
    });

    // Avatar initials
    document.querySelectorAll('.user-avatar, .avatar-initials').forEach(el => {
        if (!el.querySelector('img')) {
            const initials = (user.name || 'U')
                .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            el.textContent = initials;
            // Color by role
            el.style.background = user.role === 'traveler'
                ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                : 'linear-gradient(135deg, #D4AF37, #F4C542)';
            el.style.color = '#fff';
        }
    });

    // Location
    document.querySelectorAll('.user-location, [data-profile="location"]').forEach(el => {
        el.textContent = user.phone
            ? `📍 ${user.country || 'Jordan'} · ${user.phone}`
            : `📍 ${user.country || 'Jordan'}`;
    });

    // Role badge — update if exists, otherwise inject
    let roleEl = document.querySelector('.user-role, .role-badge, [data-profile="role"]');
    if (!roleEl) {
        // Inject next to name
        const nameRow = document.querySelector('.user-name-row');
        if (nameRow) {
            roleEl = document.createElement('span');
            roleEl.className = 'role-badge';
            roleEl.style.cssText = `
                font-size:0.75rem;font-weight:600;padding:3px 10px;border-radius:999px;
                background:${user.role === 'traveler' ? '#DBEAFE' : '#FEF3C7'};
                color:${user.role === 'traveler' ? '#1D4ED8' : '#92400E'};
                margin-left:0.5rem;
            `;
            nameRow.appendChild(roleEl);
        }
    }
    if (roleEl) roleEl.textContent = user.role === 'traveler' ? '✈️ Traveler' : '📦 Sender';

    // Email if element exists
    document.querySelectorAll('[data-profile="email"], .user-email').forEach(el => {
        el.textContent = user.email;
    });

    // Keep data-role attribute in sync with user role
    currentRole = user.role === 'traveler' ? 'traveler' : 'sender';
    document.documentElement.setAttribute('data-role', currentRole);
}

// ─── Tab switching ────────────────────────────────────────────────────────────
function setupTabs() {
    const tabs  = document.querySelectorAll('.dashboard-tab');
    const views = document.querySelectorAll('.dashboard-view');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentRole = this.dataset.view;

            views.forEach(v => {
                v.classList.remove('active');
                if (v.id === `${currentRole}-view`) v.classList.add('active');
            });
        });
    });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
function setupLogout() {
    document.querySelectorAll('#logoutBtn, .btn-logout, .btn-logout-nav, [data-logout]').forEach(btn => {
        btn.addEventListener('click', async e => {
            e.preventDefault();
            clearInterval(refreshTimer);
            try { await AuthAPI.logout(); } catch (_) {}
            localStorage.clear();
            window.location.href = 'travix-landing.html';
        });
    });
}

// ─── Live indicator ───────────────────────────────────────────────────────────
function showLiveIndicator() {
    const header = document.querySelector('.dashboard-header, .profile-section, h1');
    if (!header || document.getElementById('dashLive')) return;

    const ind = document.createElement('div');
    ind.id = 'dashLive';
    ind.style.cssText = 'display:inline-flex;align-items:center;gap:0.35rem;font-size:0.78rem;color:#10B981;font-weight:600;margin-left:0.75rem;vertical-align:middle;';
    ind.innerHTML = `
        <span style="width:7px;height:7px;border-radius:50%;background:#10B981;display:inline-block;
            animation:livePulse 1.5s ease-in-out infinite;"></span>Live
    `;
    header.appendChild(ind);

    if (!document.getElementById('dashLiveStyle')) {
        const s = document.createElement('style');
        s.id = 'dashLiveStyle';
        s.textContent = `
            @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
            .list-loading{text-align:center;padding:2rem;color:#9CA3AF;font-size:.875rem;}
        `;
        document.head.appendChild(s);
    }
}

// ─── Animate stat number change ───────────────────────────────────────────────
function animateValue(el, newVal) {
    const current = el.textContent;
    if (current === String(newVal)) return; // no change

    el.style.transition = 'opacity 0.3s, transform 0.3s';
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(-6px)';

    setTimeout(() => {
        el.textContent  = newVal;
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
    }, 300);
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function getUser() {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

// Global
window.refreshDashboard = refreshAll;
window.updateProfile    = renderProfile;
window.updateStats      = loadStats;

// Stop polling on leave
window.addEventListener('beforeunload', () => clearInterval(refreshTimer));
// Pause when hidden, resume when visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(refreshTimer);
    } else {
        refreshAll();
        refreshTimer = setInterval(refreshAll, REFRESH_INTERVAL);
    }
});

console.log('✅ Dashboard live — refreshing every 15s');

// ── ID Verification ───────────────────────────────────────────────────────────
const verifUploaded = { id_front: false, id_back: false, selfie: false, passport: false };

async function loadVerificationStatus() {
    try {
        const data = await apiCall('/verification/status');
        if (!data.success) return;
        applyVerifStatus(data);
    } catch(e) {}
}

function applyVerifStatus(data) {
    const status = data.verification_status || 'unverified';

    // Keep the instant-paint attribute in sync with the real status
    document.documentElement.setAttribute('data-verif', status);

    const badge  = document.getElementById('verifBadge');
    const upload = document.getElementById('verifUploadArea');
    const pending  = document.getElementById('verifPendingArea');
    const approved = document.getElementById('verifApprovedArea');

    // Badge
    if (badge) {
        const labels = { unverified:'Unverified', pending:'Under Review', approved:'Verified ✓', rejected:'Rejected' };
        badge.textContent = labels[status] || status;
        badge.className   = 'verif-badge ' + status;
    }

    // Show correct area
    const profBadge = document.getElementById('profileVerifiedBadge');
    const verifCard = document.getElementById('verifCard');

    if (status === 'approved') {
        if (verifCard) verifCard.style.display = 'none';
        if (profBadge) profBadge.style.display = 'inline-flex';
    } else if (status === 'pending') {
        if (verifCard) verifCard.style.display = '';
        upload?.style.setProperty('display','none');
        pending?.style.setProperty('display','block');
        approved?.style.setProperty('display','none');
        if (profBadge) profBadge.style.display = 'none';
    } else {
        if (verifCard) verifCard.style.display = '';
        upload?.style.setProperty('display','block');
        pending?.style.setProperty('display','none');
        approved?.style.setProperty('display','none');
        if (profBadge) profBadge.style.display = 'none';
        // Mark already-uploaded photos
        if (data.has_id_front) markDone('id_front');
        if (data.has_id_back)  markDone('id_back');
        if (data.has_selfie)   markDone('selfie');
        if (data.has_passport) markDone('passport');
    }
}

function triggerUpload(type) {
    const inputMap = { id_front:'inputIdFront', id_back:'inputIdBack', selfie:'inputSelfie', passport:'inputPassport' };
    document.getElementById(inputMap[type])?.click();
}

async function handleUpload(type, input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    // Show preview + mark done immediately (don't block UI on network)
    const previewMap = { id_front:'previewIdFront', id_back:'previewIdBack', selfie:'previewSelfie', passport:'previewPassport' };
    const previewEl  = document.getElementById(previewMap[type]);
    if (previewEl) {
        const reader = new FileReader();
        reader.onload = e => {
            previewEl.innerHTML = `<img src="${e.target.result}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;">`;
        };
        reader.readAsDataURL(file);
    }
    markDone(type); // enable submit button right away based on local selection

    // Upload to API in background
    try {
        const token    = localStorage.getItem('auth_token');
        const formData = new FormData();
        formData.append('type',  type);
        formData.append('photo', file);

        const res = await fetch(window.API_BASE_URL + '/verification/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            body: formData,
        });
        const data = await res.json();
        if (!data.success) {
            showVerifToast('Upload may not have saved — please check your connection.', 'error');
        }
    } catch(e) {
        console.error('Upload error:', e);
        showVerifToast('Could not reach server. Photo saved locally for now.', 'error');
    }
}

function showVerifToast(msg, type) {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;padding:0.85rem 1.25rem;
        border-radius:10px;font-weight:600;font-size:0.88rem;z-index:9999;max-width:320px;
        background:${type==='error' ? '#EF4444' : '#10B981'};color:#fff;
        box-shadow:0 4px 20px rgba(0,0,0,0.15);`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

function markDone(type) {
    verifUploaded[type] = true;
    const boxMap = { id_front:'boxIdFront', id_back:'boxIdBack', selfie:'boxSelfie', passport:'boxPassport' };
    document.getElementById(boxMap[type])?.classList.add('done');

    // Enable submit if front + back uploaded (min required)
    const btn = document.getElementById('verifSubmitBtn');
    if (btn && verifUploaded.id_front && verifUploaded.id_back) {
        btn.disabled = false;
    }
}

async function submitVerification() {
    const btn = document.getElementById('verifSubmitBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

    let success = false;
    try {
        const data = await apiCall('/verification/submit', { method: 'POST' });
        success = !!data.success;
    } catch(e) {
        console.warn('Verification submit API unreachable — proceeding with local state for demo.', e);
        success = true; // don't block the demo flow if backend is down
    }

    if (success) {
        document.getElementById('verifUploadArea').style.display  = 'none';
        document.getElementById('verifPendingArea').style.display = 'block';
        const badge = document.getElementById('verifBadge');
        if (badge) { badge.textContent = 'Under Review'; badge.className = 'verif-badge pending'; }
        showVerificationSubmittedModal();

        // Demo: simulate the review completing after 4 seconds
        setTimeout(() => {
            autoApproveVerification();
        }, 4000);
    } else {
        if (btn) { btn.disabled = false; btn.textContent = 'Submit for Verification'; }
        showVerifToast('Submission failed. Please try again.', 'error');
    }
}

// ── Demo: instantly mark the account as verified (approved) ───────────────────
async function autoApproveVerification() {
    let serverConfirmed = false;

    try {
        const data = await apiCall('/verification/approve-self', { method: 'POST' });
        serverConfirmed = !!(data && data.success && data.verification_status === 'approved');
    } catch(e) {
        console.warn('Auto-approve API call failed:', e);
    }

    if (!serverConfirmed) {
        // Backend didn't confirm — don't fake "verified" locally, the status would
        // just snap back to unverified next time the page checks the server.
        showVerifToast('Could not reach the server to confirm verification. Please check your connection and try again.', 'error');
        // Re-check the real status from the server in case it actually succeeded
        // but the response was lost, so we don't leave the UI stuck on "pending".
        loadVerificationStatus();
        return;
    }

    applyVerifStatus({ verification_status: 'approved' });

    // Update cached user object so other pages see the verified status too
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.verification_status = 'approved';
        localStorage.setItem('user', JSON.stringify(user));
    } catch(e) {}

    showVerifiedToast();
}

function showVerifiedToast() {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;padding:1rem 1.4rem;
        border-radius:12px;font-weight:600;font-size:0.92rem;z-index:9999;max-width:340px;
        background:#10B981;color:#fff;display:flex;align-items:center;gap:0.6rem;
        box-shadow:0 6px 24px rgba(0,0,0,0.18);animation:slideUp 0.3s ease;`;
    t.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
            <circle cx="12" cy="12" r="9.5" stroke="white" stroke-width="1.8"/>
            <path d="M7.5 12.5l2.8 2.8L16.5 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Your identity has been verified! You can now send and carry items.</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 5000);
}

function showVerificationSubmittedModal() {
    const overlay = document.createElement('div');
    overlay.id = 'verifSubmittedOverlay';
    overlay.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;
                    display:flex;align-items:center;justify-content:center;padding:1rem;">
            <div style="background:#fff;border-radius:18px;padding:2rem;max-width:440px;width:100%;text-align:center;">
                <div style="width:64px;height:64px;border-radius:50%;background:#FEF3C7;
                            display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9.5" stroke="#D4AF37" stroke-width="1.8"/>
                        <path d="M12 7v5l3.5 2" stroke="#D4AF37" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h3 style="color:#0A1A2F;margin:0 0 0.6rem;font-size:1.15rem;">Verification Submitted</h3>
                <p style="color:#6B7280;font-size:0.92rem;line-height:1.6;margin:0 0 1rem;">
                    Your documents are now under review by the Travix verification system.
                    This usually takes up to <strong style="color:#0A1A2F;">24 hours</strong>.
                </p>
                <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;
                            padding:0.9rem 1rem;text-align:left;margin-bottom:1.5rem;">
                    <p style="color:#374151;font-size:0.82rem;margin:0 0 0.4rem;font-weight:700;">
                        For faster approval, make sure:
                    </p>
                    <ul style="margin:0;padding-left:1.1rem;color:#6B7280;font-size:0.82rem;line-height:1.7;">
                        <li>Photos are clear and well-lit (no blur or glare)</li>
                        <li>All four corners of the document are visible</li>
                        <li>Personal information is fully readable</li>
                    </ul>
                </div>
                <button onclick="document.getElementById('verifSubmittedOverlay').remove()"
                    style="width:100%;padding:0.8rem;background:#D4AF37;color:#fff;border:none;
                           border-radius:10px;cursor:pointer;font-weight:700;font-size:0.95rem;">
                    Got it
                </button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
}

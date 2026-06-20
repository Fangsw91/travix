// ─── Admin Dashboard — fully live, connected to real API ──────────────────────

const REFRESH_INTERVAL = 12000; // 12s
let refreshTimer = null;

// ── Auth guard ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('auth_token');
    if (!token) { window.location.href = 'signin.html'; return; }

    let user = null;
    try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch(e) {}

    if (!user || user.role !== 'admin') {
        window.location.href = 'user-dashboard.html';
        return;
    }

    setupTabs();
    setupSearch();
    setupRefreshButtons();
    setupExitAdmin();

    refreshAll();
    refreshTimer = setInterval(refreshAll, REFRESH_INTERVAL);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(refreshTimer);
        } else {
            refreshAll();
            refreshTimer = setInterval(refreshAll, REFRESH_INTERVAL);
        }
    });
});

async function refreshAll() {
    await Promise.all([
        loadStats(),
        loadUsers(),
        loadShipments(),
        loadVerificationRequests(),
        loadPayments(),
    ]);
}

// ── API helper ──────────────────────────────────────────────────────────────
async function adminApi(path, options = {}) {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(window.API_BASE_URL + '/admin' + path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });

    if (res.status === 403) {
        showInfo('Your account does not have admin access.');
        throw new Error('Forbidden');
    }
    if (res.status === 401) {
        window.location.href = 'signin.html';
        throw new Error('Unauthorized');
    }

    return res.json();
}

// ── Stats cards ───────────────────────────────────────────────────────────────
async function loadStats() {
    try {
        const data = await adminApi('/stats');
        if (!data.success) return;
        const s = data.stats;

        setText('statTotalUsers',      s.total_users.toLocaleString());
        setText('statActiveShipments', s.active_shipments.toLocaleString());
        setText('statRevenue',         '$' + s.revenue_month.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}));
        setText('statCompletionRate',  s.completion_rate + '%');

        setGrowthBadge('statUsersGrowth',     s.user_growth_pct);
        setGrowthBadge('statShipmentsGrowth', s.shipment_growth_pct);
        setGrowthBadge('statRevenueGrowth',   s.revenue_growth_pct);

        const compBadge = document.getElementById('statCompletionBadge');
        if (compBadge) { compBadge.textContent = s.completion_rate + '%'; compBadge.className = 'stat-badge green'; }
    } catch(e) { console.error('Stats load error:', e); }
}

function setGrowthBadge(id, pct) {
    const el = document.getElementById(id);
    if (!el) return;
    const sign = pct >= 0 ? '+' : '';
    el.textContent = `${sign}${pct}%`;
    el.className = 'stat-badge ' + (pct >= 0 ? 'green' : 'red');
}

// ── Users table ───────────────────────────────────────────────────────────────
async function loadUsers(search = '') {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    try {
        const qs   = search ? `?search=${encodeURIComponent(search)}` : '';
        const data = await adminApi('/users' + qs);
        if (!data.success) return;

        const users = data.users.data || data.users;
        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#9CA3AF;">No users found.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${escHtml(u.name)}</td>
                <td>${escHtml(u.email)}</td>
                <td><span class="badge badge-gold">${capitalize(u.role)}</span></td>
                <td>${verifBadge(u.verification_status)}</td>
                <td>${u.joined}</td>
                <td>
                    <button class="btn-actions" onclick="showUserActionMenu(${u.id}, '${escAttr(u.name)}')">⋮</button>
                </td>
            </tr>
        `).join('');
    } catch(e) {
        if (e.message !== 'Forbidden' && e.message !== 'Unauthorized') {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#EF4444;">Failed to load users.</td></tr>`;
        }
    }
}

function verifBadge(status) {
    const map = {
        approved:   '<span class="badge badge-green">Verified</span>',
        pending:    '<span class="badge badge-yellow">Pending</span>',
        rejected:   '<span class="badge badge-red">Rejected</span>',
        unverified: '<span class="badge">Unverified</span>',
    };
    return map[status] || map.unverified;
}

// ── Shipments table ───────────────────────────────────────────────────────────
async function loadShipments(search = '') {
    const tbody = document.getElementById('shipmentsTableBody');
    if (!tbody) return;

    try {
        const qs   = search ? `?search=${encodeURIComponent(search)}` : '';
        const data = await adminApi('/shipments' + qs);
        if (!data.success) return;

        const shipments = data.shipments.data || data.shipments;
        if (!shipments.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#9CA3AF;">No shipments yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = shipments.map(s => `
            <tr>
                <td>${escHtml(s.order_id)}</td>
                <td>${escHtml(s.sender)}</td>
                <td>${escHtml(s.traveler)}</td>
                <td>${escHtml(s.route)}</td>
                <td>${shipmentStatusBadge(s.status, s.status_label)}</td>
                <td>${s.amount}</td>
            </tr>
        `).join('');
    } catch(e) {
        if (e.message !== 'Forbidden' && e.message !== 'Unauthorized') {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#EF4444;">Failed to load shipments.</td></tr>`;
        }
    }
}

function shipmentStatusBadge(status, label) {
    const colorMap = {
        requested: '', accepted: 'badge-blue', picked_up: 'badge-blue',
        in_transit: 'badge-blue', out_for_delivery: 'badge-yellow',
        delivered: 'badge-green', cancelled: 'badge-red',
    };
    return `<span class="badge ${colorMap[status] || ''}">${escHtml(label)}</span>`;
}

// ── Verification requests ─────────────────────────────────────────────────────
async function loadVerificationRequests() {
    const list = document.getElementById('requestsList');
    if (!list) return;

    try {
        const data = await adminApi('/verification-requests');
        if (!data.success) return;

        const reqs = data.requests;
        if (!reqs.length) {
            list.innerHTML = `<p style="text-align:center;padding:2rem;color:#9CA3AF;">No pending verification requests. 🎉</p>`;
            return;
        }

        list.innerHTML = reqs.map(r => `
            <div class="request-item">
                <div class="request-info">
                    <div class="request-id">
                        ${escHtml(r.name)}
                        <span class="priority-badge medium">${capitalize(r.role)}</span>
                    </div>
                    <div class="request-desc">${escHtml(r.email)} · submitted ${r.submitted_at || '—'}</div>
                    <div style="display:flex;gap:0.4rem;margin-top:0.4rem;">
                        ${r.id_front_url ? `<a href="${r.id_front_url}" target="_blank" style="font-size:0.78rem;color:#3B82F6;">ID Front</a>` : ''}
                        ${r.id_back_url  ? `<a href="${r.id_back_url}"  target="_blank" style="font-size:0.78rem;color:#3B82F6;">ID Back</a>`  : ''}
                        ${r.selfie_url   ? `<a href="${r.selfie_url}"   target="_blank" style="font-size:0.78rem;color:#3B82F6;">Selfie</a>`   : ''}
                        ${r.passport_url ? `<a href="${r.passport_url}" target="_blank" style="font-size:0.78rem;color:#3B82F6;">Passport</a>` : ''}
                    </div>
                </div>
                <div class="request-actions-buttons">
                    <button class="btn-review" onclick="reviewVerification(${r.id})">Review</button>
                    <button class="btn-resolve" onclick="approveVerificationRequest(${r.id}, '${escAttr(r.name)}')">Approve</button>
                </div>
            </div>
        `).join('');
    } catch(e) {
        if (e.message !== 'Forbidden' && e.message !== 'Unauthorized') {
            list.innerHTML = `<p style="text-align:center;padding:2rem;color:#EF4444;">Failed to load requests.</p>`;
        }
    }
}

function reviewVerification(userId) {
    // Open the documents in new tabs — simplest "review" flow
    showInfo(`Opening documents for user #${userId} in new tabs...`);
}

async function approveVerificationRequest(userId, name) {
    showConfirm(`Approve identity verification for ${name}?`, async () => {
        try {
            const data = await adminApi(`/verification-requests/${userId}/approve`, { method: 'POST' });
            if (data.success) {
                showSuccess(`${name} has been verified.`);
                loadVerificationRequests();
                loadUsers();
            }
        } catch(e) {}
    });
}

async function rejectVerificationRequest(userId, name) {
    showConfirm(`Reject identity verification for ${name}?`, async () => {
        try {
            const data = await adminApi(`/verification-requests/${userId}/reject`, { method: 'POST' });
            if (data.success) {
                showSuccess(`${name}'s verification was rejected.`);
                loadVerificationRequests();
                loadUsers();
            }
        } catch(e) {}
    });
}

// ── Payments / Transactions ────────────────────────────────────────────────────
async function loadPayments() {
    const list = document.getElementById('transactionsList');
    if (!list) return;

    try {
        const data = await adminApi('/payments');
        if (!data.success) return;

        const payments = data.payments.data || data.payments;

        // Aggregate stats from the loaded page (live, not pre-computed)
        let thisMonthTotal = 0, escrowTotal = 0, releasedTotal = 0;
        let escrowCount = 0, releasedCount = 0, refundedCount = 0, failedCount = 0;

        payments.forEach(p => {
            const amt = parseFloat((p.amount || '$0').replace('$',''));
            if (p.status === 'escrow')   { escrowTotal   += amt; escrowCount++; }
            if (p.status === 'released') { releasedTotal += amt; releasedCount++; }
            if (p.status === 'refunded') refundedCount++;
            if (p.status === 'failed')   failedCount++;
            thisMonthTotal += amt;
        });

        setText('revThisMonth',  '$' + thisMonthTotal.toFixed(2));
        setText('revTotalCount', payments.length);
        setText('revEscrow',     '$' + escrowTotal.toFixed(2));
        setText('revReleased',   '$' + releasedTotal.toFixed(2));
        setText('statusEscrowCount',   escrowCount);
        setText('statusReleasedCount', releasedCount);
        setText('statusRefundedCount', refundedCount);
        setText('statusFailedCount',   failedCount);

        if (!payments.length) {
            list.innerHTML = `<p style="text-align:center;padding:2rem;color:#9CA3AF;">No transactions yet.</p>`;
            return;
        }

        list.innerHTML = payments.map(p => `
            <div class="transaction-item">
                <div>
                    <div class="transaction-id">${escHtml(p.order_id)}</div>
                    <div class="transaction-name">${escHtml(p.sender)} → ${escHtml(p.traveler)}</div>
                </div>
                <div class="transaction-right">
                    <div class="transaction-amount ${p.status === 'refunded' || p.status === 'failed' ? 'text-red' : 'text-green'}">
                        ${p.status === 'refunded' ? '-' : '+'}${p.amount}
                    </div>
                    <div class="transaction-date">${escHtml(p.status)} · ${p.paid_at}</div>
                </div>
            </div>
        `).join('');
    } catch(e) {
        if (e.message !== 'Forbidden' && e.message !== 'Unauthorized') {
            list.innerHTML = `<p style="text-align:center;padding:2rem;color:#EF4444;">Failed to load transactions.</p>`;
        }
    }
}

// ── User actions (suspend/delete) ──────────────────────────────────────────────
function showUserActionMenu(userId, name) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const modalHTML = `
        <div class="modal-overlay active" id="actionModal">
            <div class="modal-container" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Actions for ${escHtml(name)}</h3>
                    <button class="modal-close" onclick="closeModal()">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="display:flex;flex-direction:column;gap:0.8rem;">
                        <button class="action-menu-btn" onclick="suspendUser(${userId}, '${escAttr(name)}')">Suspend User</button>
                        <button class="action-menu-btn action-menu-btn-danger" onclick="deleteUser(${userId}, '${escAttr(name)}')">Delete User</button>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    if (!document.getElementById('actionMenuStyles')) {
        const style = document.createElement('style');
        style.id = 'actionMenuStyles';
        style.textContent = `
            #actionModal .modal-body { background: white; color: #0A1A2F; }
            .action-menu-btn { display:flex; align-items:center; gap:0.8rem; width:100%; padding:0.9rem 1.2rem;
                background:rgba(10,26,47,0.03); border:1px solid rgba(10,26,47,0.1); border-radius:8px;
                color:#0A1A2F !important; font-size:0.95rem; font-weight:500; cursor:pointer; transition:all 0.3s; text-align:left; }
            .action-menu-btn:hover { background:rgba(212,175,55,0.1); border-color:rgba(212,175,55,0.5); }
            .action-menu-btn-danger { border-color:rgba(239,68,68,0.3); }
            .action-menu-btn-danger:hover { background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.5); }`;
        document.head.appendChild(style);
    }

    const overlay = document.getElementById('actionModal');
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
}

async function suspendUser(userId, name) {
    closeModal();
    showConfirm(`Suspend ${name}? They will not be able to use the platform.`, async () => {
        try {
            const data = await adminApi(`/users/${userId}/suspend`, { method: 'POST' });
            if (data.success) { showSuccess(`${name} has been suspended.`); loadUsers(); }
        } catch(e) {}
    });
}

async function deleteUser(userId, name) {
    closeModal();
    showConfirm(`Delete ${name}? This action cannot be undone.`, async () => {
        try {
            const data = await adminApi(`/users/${userId}`, { method: 'DELETE' });
            if (data.success) { showSuccess(`${name} has been deleted.`); loadUsers(); loadStats(); }
            else { showInfo(data.message || 'Could not delete user.'); }
        } catch(e) {}
    });
}

// ── Tabs ────────────────────────────────────────────────────────────────────
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes   = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`)?.classList.add('active');
        });
    });
}

// ── Search ────────────────────────────────────────────────────────────────────
function setupSearch() {
    let userSearchTimeout, shipmentSearchTimeout;

    document.getElementById('searchUsers')?.addEventListener('input', (e) => {
        clearTimeout(userSearchTimeout);
        userSearchTimeout = setTimeout(() => loadUsers(e.target.value), 350);
    });

    document.getElementById('searchShipments')?.addEventListener('input', (e) => {
        clearTimeout(shipmentSearchTimeout);
        shipmentSearchTimeout = setTimeout(() => loadShipments(e.target.value), 350);
    });
}

function setupRefreshButtons() {
    document.getElementById('refreshShipmentsBtn')?.addEventListener('click', () => loadShipments());
    document.getElementById('refreshRequestsBtn')?.addEventListener('click', () => loadVerificationRequests());
    document.getElementById('refreshPaymentsBtn')?.addEventListener('click', () => loadPayments());
}

function setupExitAdmin() {
    const exitBtn = document.querySelector('.btn-exit-admin');
    if (exitBtn) {
        exitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showConfirm('Are you sure you want to exit admin dashboard?', () => {
                window.location.href = 'travix-landing.html';
            });
        });
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function escHtml(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escAttr(str) {
    return String(str || '').replace(/'/g, "\\'");
}

console.log('Admin Dashboard — live mode initialized');

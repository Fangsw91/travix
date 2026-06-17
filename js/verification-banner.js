/**
 * Verification Banner
 * Shows a small alert box at the top of the page if the user's
 * identity is not yet verified. Page content stays fully usable;
 * this is just a heads-up before they submit an order.
 */

(function () {
    async function checkAndShowBanner() {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
            const res = await fetch(window.API_BASE_URL + '/verification/status', {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const data = await res.json();

            if (data.verification_status === 'approved') return; // nothing to show
            renderBanner(data.verification_status);
        } catch (e) {
            // Silent fail — don't block the page if API is unreachable
        }
    }

    function renderBanner(status) {
        const isPending = status === 'pending';

        const banner = document.createElement('div');
        banner.id = 'verifBanner';
        banner.innerHTML = `
            <div class="verif-banner-box">
                <div class="verif-banner-icon">${isPending ? '⏳' : '🪪'}</div>
                <div class="verif-banner-text">
                    <strong>${isPending ? 'Verification in progress' : 'Verify your identity'}</strong>
                    <span>${isPending
                        ? 'Your documents are under review. You can still browse, but orders may be limited.'
                        : 'You need to verify your ID before this order can be placed.'}</span>
                </div>
                ${isPending ? '' : `<button class="verif-banner-btn" onclick="goToVerification()">Verify Now</button>`}
                <button class="verif-banner-close" onclick="document.getElementById('verifBanner').remove()">✕</button>
            </div>`;

        const style = document.createElement('style');
        style.textContent = `
            #verifBanner { position: relative; }
            .verif-banner-box {
                display: flex; align-items: center; gap: 0.85rem;
                background: #FFFBEB; border: 1.5px solid #FDE68A;
                border-radius: 12px; padding: 0.85rem 1.1rem;
                margin: 1rem auto; max-width: 900px;
                font-size: 0.88rem; color: #92400E;
            }
            .verif-banner-icon { font-size: 1.6rem; flex-shrink: 0; }
            .verif-banner-text { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; }
            .verif-banner-text strong { color: #0A1A2F; font-size: 0.92rem; }
            .verif-banner-btn {
                background: #D4AF37; color: #fff; border: none;
                padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700;
                font-size: 0.84rem; cursor: pointer; white-space: nowrap; flex-shrink: 0;
            }
            .verif-banner-btn:hover { background: #C09B2A; }
            .verif-banner-close {
                background: none; border: none; color: #92400E;
                cursor: pointer; font-size: 1rem; opacity: 0.5; flex-shrink: 0;
            }
            .verif-banner-close:hover { opacity: 1; }
            @media (max-width: 640px) {
                .verif-banner-box { flex-wrap: wrap; }
                .verif-banner-btn { width: 100%; }
            }
        `;
        document.head.appendChild(style);

        // Insert at top of main content — try common containers first
        const target = document.querySelector('main .container, main, .container, body');
        if (target) target.insertBefore(banner, target.firstChild);
    }

    document.addEventListener('DOMContentLoaded', checkAndShowBanner);
})();

// Confirmation modal before redirecting to verification
function goToVerification() {
    const overlay = document.createElement('div');
    overlay.id = 'verifConfirmOverlay';
    overlay.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;
                    display:flex;align-items:center;justify-content:center;padding:1rem;">
            <div style="background:#fff;border-radius:18px;padding:2rem;max-width:400px;width:100%;text-align:center;">
                <div style="font-size:2.5rem;margin-bottom:0.75rem;">🪪</div>
                <h3 style="color:#0A1A2F;margin:0 0 0.5rem;">Verify Your Identity</h3>
                <p style="color:#6B7280;font-size:0.9rem;margin:0 0 1.5rem;">
                    You'll be taken to your profile to upload your ID. It only takes a minute.
                </p>
                <div style="display:flex;gap:0.75rem;">
                    <button onclick="document.getElementById('verifConfirmOverlay').remove()"
                        style="flex:1;padding:0.75rem;border:1.5px solid #E5E7EB;background:#fff;border-radius:10px;cursor:pointer;">
                        Cancel
                    </button>
                    <button onclick="window.location.href='user-dashboard.html'"
                        style="flex:1;padding:0.75rem;background:#D4AF37;color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;">
                        Continue
                    </button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
}

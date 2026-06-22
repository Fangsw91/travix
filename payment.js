// ─── Payment Page — Stripe Test Mode Integration ─────────────────────────────

// ⚠️  Stripe Publishable Key (Test Mode - safe to expose in frontend)
// Get yours free at: https://dashboard.stripe.com/test/apikeys
const STRIPE_PK = 'pk_test_51TNCwy3pVvd8GLkwouLDCFshqlwnBkQE8iPmfkrqLhnpzpDfsgu1gYZiGIncwAXqffg2SmyoxZ1CAAeFvjBjH26J00eaTYWQ3y';

// ─── Load order data from localStorage ───────────────────────────────────────
function loadOrderData() {
    const sendItemData  = JSON.parse(localStorage.getItem('sendItemData')  || '{}');
    const routeData     = JSON.parse(localStorage.getItem('requestedRoute') || '{}');
    const travelerData  = JSON.parse(localStorage.getItem('selectedTraveler') || '{}');

    // Fill summary
    document.getElementById('summaryItemName').textContent =
        sendItemData.itemName || routeData.itemName || 'Your Item';

    document.getElementById('summaryWeight').textContent =
        sendItemData.weight || routeData.weight || '0';

    document.getElementById('summaryCategory').textContent =
        sendItemData.category || routeData.category || '-';

    const from = sendItemData.pickup || routeData.pickup || '?';
    const to   = sendItemData.destination || routeData.destination || '?';
    document.getElementById('summaryRoute').textContent = `${from} → ${to}`;

    document.getElementById('summaryTraveler').textContent =
        travelerData.name || 'Matched Traveler';

    document.getElementById('summaryRating').textContent =
        travelerData.rating ? `⭐ ${travelerData.rating}` : '⭐ 4.9';

    // Calculate total
    const weight     = parseFloat(sendItemData.weight || routeData.weight || 1);
    const pricePerKg = parseFloat(travelerData.pricePerKg || 15);
    const total      = (weight * pricePerKg).toFixed(2);
    const totalCents = Math.round(weight * pricePerKg * 100); // Stripe uses cents

    document.getElementById('summaryTotal').textContent = `$${total}`;

    // ── Fix: update right-column amount display ──
    const amountDisplay = document.getElementById('payment-amount');
    if (amountDisplay) amountDisplay.textContent = `$${total}`;

    // Update pay button text
    const payBtn = document.querySelector('.btn-pay');
    if (payBtn) {
        payBtn.innerHTML = `Pay $${total} Securely <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 3l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
        payBtn.removeAttribute('disabled'); // ── Fix: button was permanently disabled
    }

    return { total, totalCents, from, to, travelerData, sendItemData };
}

// ─── Stripe Setup ─────────────────────────────────────────────────────────────
let stripe, cardElement, orderInfo;

function initStripe() {
    // Check if Stripe key has been configured
    if (STRIPE_PK.includes('Example')) {
        showTestModeNotice();
        return;
    }

    try {
        stripe      = Stripe(STRIPE_PK);
        const elements = stripe.elements({
            fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap' }]
        });

        cardElement = elements.create('card', {
            style: {
                base: {
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '16px',
                    color: '#111827',
                    '::placeholder': { color: '#9CA3AF' },
                    iconColor: '#D4AF37',
                },
                invalid: { color: '#EF4444', iconColor: '#EF4444' }
            },
            hidePostalCode: true
        });

        cardElement.mount('#card-element');

        // Style focus
        cardElement.on('focus', () => {
            document.getElementById('card-element').style.borderColor = '#D4AF37';
            document.getElementById('card-element').style.boxShadow   = '0 0 0 3px rgba(212,175,55,0.15)';
        });
        cardElement.on('blur', () => {
            document.getElementById('card-element').style.borderColor = '#E5E7EB';
            document.getElementById('card-element').style.boxShadow   = 'none';
        });

        // Live validation errors
        cardElement.on('change', (e) => {
            const errEl = document.getElementById('card-errors');
            errEl.textContent = e.error ? e.error.message : '';
        });

    } catch (e) {
        showTestModeNotice();
    }
}

// Show notice when Stripe key not configured yet
function showTestModeNotice() {
    const section = document.getElementById('stripe-card-section');
    if (!section) return;
    section.innerHTML = `
        <div style="background:#FFF7ED;border:1.5px dashed #FB923C;border-radius:10px;padding:1.2rem;text-align:center;">
            <div style="font-size:1.5rem;margin-bottom:0.5rem;">🔑</div>
            <p style="font-weight:600;color:#9A3412;margin-bottom:0.4rem;">Stripe Key Not Configured</p>
            <p style="font-size:0.85rem;color:#C2410C;">
                1. Go to <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" style="color:#D4AF37;">dashboard.stripe.com/test/apikeys</a><br>
                2. Copy your <strong>Publishable key</strong> (starts with pk_test_...)<br>
                3. Paste it in <code>payment.js</code> → <code>STRIPE_PK</code> variable
            </p>
            <div style="margin-top:1rem;padding:0.75rem;background:#FEF9C3;border-radius:6px;font-size:0.82rem;color:#92400E;">
                💳 Test card: <strong>4242 4242 4242 4242</strong> | Expiry: any future date | CVC: any 3 digits
            </div>
            <button onclick="simulatePayment()" style="margin-top:1rem;padding:0.6rem 1.5rem;background:#D4AF37;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:0.9rem;">
                ▶ Simulate Payment (Demo)
            </button>
        </div>
    `;
}

// ─── Pay Button ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    orderInfo = loadOrderData();
    initStripe();

    const payBtn = document.querySelector('.btn-pay');
    if (!payBtn) return;

    payBtn.addEventListener('click', async () => {
        // If Stripe not initialized → simulate
        if (!stripe || !cardElement) {
            simulatePayment();
            return;
        }

        setPayBtnLoading(true);

        try {
            // In a real app: call your backend to create a PaymentIntent and get clientSecret
            // const { clientSecret } = await apiCall('/payments/create-intent', {
            //     method: 'POST',
            //     body: JSON.stringify({ amount: orderInfo.totalCents, currency: 'usd' })
            // });

            // For demo: use confirmCardPayment with a test client secret structure
            // Since we have no backend, we tokenize the card and show success
            const { paymentMethod, error } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                document.getElementById('card-errors').textContent = error.message;
                setPayBtnLoading(false);
                return;
            }

            // Payment method created successfully — simulate confirmation
            handlePaymentSuccess(paymentMethod.id);

        } catch (err) {
            document.getElementById('card-errors').textContent = 'Something went wrong. Please try again.';
            setPayBtnLoading(false);
        }
    });
});

// ─── Payment Success ──────────────────────────────────────────────────────────
async function handlePaymentSuccess(paymentMethodId) {
    // A payment must always be tied to a real, logged-in account — otherwise
    // the shipment can never be saved to the database, and the tracking page
    // will show "Order Not Found" forever. Block here instead of faking an ID.
    const tokenCheck = localStorage.getItem('auth_token');
    if (!tokenCheck) {
        setPayBtnLoading(false);
        document.getElementById('card-errors').textContent =
            'Please sign in before completing payment — your order needs an account to be tracked.';
        setTimeout(() => {
            localStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'signin.html';
        }, 2000);
        return;
    }

    const sendItemData = JSON.parse(localStorage.getItem('sendItemData')     || '{}');
    const routeData    = JSON.parse(localStorage.getItem('requestedRoute')   || '{}');
    const travelerData = JSON.parse(localStorage.getItem('selectedTraveler') || '{}');

    const total    = document.getElementById('summaryTotal').textContent.replace('$', '');
    const totalNum = parseFloat(total) || 0;

    let finalOrderId = null;

    // ── Create shipment in DB after confirmed payment ──────────────────────────
    const token = localStorage.getItem('auth_token');
    if (token) {
        try {
            const payload = {
                item_name:         sendItemData.itemName     || routeData.itemName     || 'Item',
                category:          sendItemData.category     || routeData.category,
                weight:            parseFloat(sendItemData.weight || routeData.weight  || 1),
                value:             parseFloat(sendItemData.value  || 0),
                description:       sendItemData.description,
                pickup_location:   sendItemData.pickup       || routeData.pickup,
                destination:       sendItemData.destination  || routeData.destination,
                pickup_date:       sendItemData.pickupDate   || routeData.pickupDate,
                delivery_date:     sendItemData.deliveryDate || routeData.deliveryDate,
                receiver_name:     sendItemData.receiverName,
                receiver_phone:    sendItemData.receiverPhone,
                delivery_address:  sendItemData.deliveryAddress,
                total_amount:      totalNum,
                payment_method_id: paymentMethodId,
                traveler_id:       travelerData.id   || null, // set by available-travelers.js
            };

            const res = await apiCall('/shipments', { method: 'POST', body: JSON.stringify(payload) });
            if (res.success && res.shipment?.order_id) {
                finalOrderId = res.shipment.order_id;
                // Note: if traveler_id was sent, backend already sets status='accepted'
                // No second API call needed.
            }
        } catch (e) {
            console.warn('Could not save shipment to API:', e.message);
            // Show the error to the user so they know
            setPayBtnLoading(false);
            document.getElementById('card-errors').textContent =
                'Payment processed but order could not be saved: ' + (e.message || 'Please contact support.');
            return;
        }
    }

    // finalOrderId is always set by the API call above now that we require
    // a logged-in user before reaching this point — no fallback needed.
    if (!finalOrderId) {
        setPayBtnLoading(false);
        document.getElementById('card-errors').textContent =
            'Payment processed but the order could not be confirmed. Please contact support with your payment reference.';
        return;
    }

    // Determine initial status: if a traveler was pre-selected, start as 'accepted'
    const initialStatus      = travelerData.id ? 'accepted'  : 'requested';
    const initialStatusLabel = travelerData.id ? 'Accepted'  : 'Requested';

    // Save to localStorage for tracking page (immediate cache before first API poll)
    const now = new Date().toLocaleString();
    const trackingData = {
        orderId:      finalOrderId,
        order_id:     finalOrderId,
        paymentMethodId,
        itemName:     document.getElementById('summaryItemName').textContent,
        route:        document.getElementById('summaryRoute').textContent,
        traveler:     travelerData.name  || document.getElementById('summaryTraveler').textContent,
        rating:       travelerData.rating ? `⭐ ${travelerData.rating}` : document.getElementById('summaryRating').textContent,
        total:        '$' + total,
        total_amount: totalNum,
        status:       initialStatus,
        status_label: initialStatusLabel,
        paidAt:       new Date().toISOString(),
        timeline: [
            { status: 'requested',        label: 'Requested',        description: 'Request submitted',      time: now,  done: true,  current: initialStatus === 'requested' },
            { status: 'accepted',         label: 'Accepted',         description: 'Traveler confirmed',     time: travelerData.id ? now : null, done: !!travelerData.id, current: initialStatus === 'accepted' },
            { status: 'picked_up',        label: 'Picked Up',        description: 'Item collected',         time: null, done: false, current: false },
            { status: 'in_transit',       label: 'In Transit',       description: 'On the way',             time: null, done: false, current: false },
            { status: 'out_for_delivery', label: 'Out for Delivery', description: 'Almost there!',          time: null, done: false, current: false },
            { status: 'delivered',        label: 'Delivered',        description: 'Successfully delivered', time: null, done: false, current: false },
        ]
    };

    localStorage.setItem('currentOrderId',   finalOrderId);
    localStorage.setItem('trackingData',     JSON.stringify(trackingData));
    localStorage.setItem('paymentConfirmed', 'true');

    setPayBtnLoading(false);
    showPaymentSuccessOverlay(finalOrderId, '$' + total);
}

function simulatePayment() {
    handlePaymentSuccess('pm_demo_' + Math.random().toString(36).substr(2, 9));
}

// ─── Success Overlay ──────────────────────────────────────────────────────────
function showPaymentSuccessOverlay(orderId, total) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(255,255,255,0.97);
        display:flex;align-items:center;justify-content:center;
        z-index:99999;animation:fadeIn 0.4s ease;
    `;
    overlay.innerHTML = `
        <style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes checkDraw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}</style>
        <div style="text-align:center;padding:2rem;max-width:420px;">
            <div style="width:90px;height:90px;background:linear-gradient(135deg,#10B981,#059669);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;animation:scaleIn 0.5s 0.2s both;">
                <svg width="48" height="48" viewBox="0 0 50 50" fill="none">
                    <path d="M12 25l10 10 16-20" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"
                          stroke-dasharray="100" stroke-dashoffset="100" style="animation:checkDraw 0.6s 0.6s ease forwards"/>
                </svg>
            </div>
            <h2 style="font-size:1.75rem;font-weight:700;color:#111827;margin-bottom:0.5rem;">Payment Successful!</h2>
            <p style="color:#6B7280;margin-bottom:1.5rem;">Your delivery has been confirmed</p>
            <div style="background:#F9FAFB;border-radius:10px;padding:1rem;margin-bottom:1.5rem;text-align:left;">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
                    <span style="color:#6B7280;font-size:0.9rem;">Order ID</span>
                    <strong style="color:#111827;font-size:0.9rem;">${orderId}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="color:#6B7280;font-size:0.9rem;">Amount Paid</span>
                    <strong style="color:#10B981;">${total}</strong>
                </div>
            </div>
            <a href="track-delivery.html?id=${orderId}"
               style="display:inline-flex;align-items:center;gap:0.5rem;background:linear-gradient(135deg,#D4AF37,#F4C542);color:#fff;padding:0.875rem 2rem;border-radius:10px;font-weight:600;text-decoration:none;font-size:1rem;">
                Track Your Delivery
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M7 3l7 7-7 7" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>
            </a>
            <p style="font-size:0.8rem;color:#9CA3AF;margin-top:1rem;">Auto-redirecting in 5 seconds...</p>
        </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
        window.location.href = 'track-delivery.html?id=' + orderId;
    }, 5000);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setPayBtnLoading(loading) {
    const btn = document.querySelector('.btn-pay');
    if (!btn) return;
    if (loading) {
        btn.disabled   = true;
        btn.innerHTML  = '<span style="display:inline-flex;align-items:center;gap:8px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></path></svg> Processing...</span>';
    } else {
        btn.disabled  = false;
        btn.innerHTML = `Pay ${document.getElementById('summaryTotal').textContent} Securely <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 3l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
    }
}

console.log('✅ Payment page loaded — Stripe integration ready');

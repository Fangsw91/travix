// Real Stripe Payment Integration

let stripe = null;
let cardElement = null;
let clientSecret = null;
let shipmentId = null;

async function initPayment() {
    shipmentId = localStorage.getItem('shipmentId');

    if (!shipmentId) {
        showError('No shipment found. Please start a new delivery request.');
        setTimeout(() => { window.location.href = 'send-item.html'; }, 3000);
        return;
    }

    // Get Stripe publishable key from backend
    let stripeKey;
    try {
        const config = await PaymentAPI.getConfig();
        stripeKey = config.stripe_key;
    } catch (e) {
        showError('Could not load payment configuration. Please try again.');
        return;
    }

    if (!stripeKey || stripeKey.startsWith('pk_test_your')) {
        document.getElementById('payment-status').textContent =
            'Stripe not configured — set STRIPE_KEY and STRIPE_SECRET in your .env file.';
        document.getElementById('payBtn').disabled = true;
        return;
    }

    // Init Stripe
    stripe = Stripe(stripeKey);
    const elements = stripe.elements();

    cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#0A1A2F',
                fontFamily: 'Inter, sans-serif',
                '::placeholder': { color: '#9CA3AF' },
            },
            invalid: { color: '#EF4444' },
        },
    });
    cardElement.mount('#card-element');

    cardElement.on('change', (event) => {
        document.getElementById('card-errors').textContent = event.error ? event.error.message : '';
    });

    // Create PaymentIntent
    try {
        const tripId = localStorage.getItem('selectedTripId');
        const data = await PaymentAPI.createIntent({
            shipment_id: parseInt(shipmentId),
            trip_id: tripId ? parseInt(tripId) : undefined,
        });

        clientSecret = data.client_secret;
        const shipment = data.shipment;

        // Populate delivery summary
        document.getElementById('summary-item-name').textContent = shipment.item_name || 'Your Item';
        document.getElementById('summary-weight').textContent = `Weight: ${shipment.weight} kg`;
        document.getElementById('summary-destination').textContent = shipment.destination || '—';
        document.getElementById('summary-traveler').textContent =
            shipment.traveler ? shipment.traveler.name : 'Pending assignment';
        document.getElementById('payment-amount').textContent = `$${parseFloat(data.amount).toFixed(2)}`;

        document.getElementById('payBtn').disabled = false;
        document.getElementById('payment-status').textContent = '';
    } catch (err) {
        const msg = err.message || 'Failed to initialize payment.';
        document.getElementById('payment-status').textContent = msg;
    }
}

// Handle payment submission
document.getElementById('payBtn')?.addEventListener('click', async () => {
    if (!stripe || !cardElement || !clientSecret) return;

    const payBtn = document.getElementById('payBtn');
    const statusEl = document.getElementById('payment-status');
    payBtn.disabled = true;
    payBtn.textContent = 'Processing...';
    statusEl.textContent = '';

    try {
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement },
        });

        if (error) {
            document.getElementById('card-errors').textContent = error.message;
            payBtn.disabled = false;
            payBtn.innerHTML = 'Complete Payment <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 3l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
            return;
        }

        if (paymentIntent.status === 'succeeded') {
            statusEl.textContent = 'Confirming payment...';

            await PaymentAPI.confirm({
                payment_intent_id: paymentIntent.id,
                shipment_id: parseInt(shipmentId),
            });

            localStorage.removeItem('shipmentId');
            localStorage.removeItem('selectedTripId');
            localStorage.removeItem('requestedRoute');

            showSuccess('Payment successful! Your delivery is now in transit.');
            setTimeout(() => { window.location.href = 'user-dashboard.html'; }, 2500);
        }
    } catch (err) {
        statusEl.textContent = err.message || 'Payment failed. Please try again.';
        payBtn.disabled = false;
        payBtn.innerHTML = 'Complete Payment <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 3l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    }
});

// Payment option selection (kept for UI)
document.querySelectorAll('.payment-option')?.forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        option.querySelector('input').checked = true;
    });
});

// Init on load
window.addEventListener('DOMContentLoaded', initPayment);

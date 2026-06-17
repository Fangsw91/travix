/**
 * Demo Auto-Fill
 * Automatically fills the Send Item / Become Traveler forms with
 * realistic sample data on page load — for fast live demos
 * (e.g. presenting to a professor). No user interaction needed.
 */

document.addEventListener('DOMContentLoaded', function () {
    // Give the country-dropdown script a moment to finish building selects
    setTimeout(runAutoFill, 350);
});

function runAutoFill() {
    if (document.getElementById('sendItemForm'))  fillSendItemDemo();
    if (document.getElementById('travelerForm'))  fillTravelerDemo();
}

// ── Send an Item ────────────────────────────────────────────────────────────
function fillSendItemDemo() {
    setVal('itemName', 'iPhone 15 Pro Max');
    setChecked('electronics', true);
    setVal('weight', '0.4');
    setVal('value', '1200');
    setVal('description', 'Brand new, sealed in original box. Handle with care — fragile electronics.');

    // Country dropdowns (built by country-dropdown script)
    selectCountryDemo('pickupDropdown', 'pickup', 'jo', 'Jordan');
    selectCountryDemo('destinationDropdown', 'destination', 'sa', 'Saudi Arabia');

    setVal('pickupDate', tomorrow());
    setVal('deliveryDate', inDays(5));

    setVal('receiverName', 'Ahmad Al-Saud');
    setVal('receiverPhone', '+966 50 123 4567');
    setVal('deliveryAddress', 'King Fahd Road, Building 12, Riyadh, Saudi Arabia');

    setChecked('terms', true);

    // Trigger cost calculation if function exists
    if (typeof calculateEstimatedCost === 'function') calculateEstimatedCost();
}

// ── Become a Traveler ──────────────────────────────────────────────────────
function fillTravelerDemo() {
    selectCountryDemo('fromDropdown', 'departureCity', 'jo', 'Jordan');
    selectCountryDemo('toDropdown', 'arrivalCity', 'sa', 'Saudi Arabia');

    setVal('departureDate', tomorrow());
    setVal('arrivalDate', tomorrow());
    setVal('tripDetails', 'Direct flight, no layovers. Arriving at King Khalid International Airport.');

    setChecked('trav-electronics', true);
    setChecked('trav-documents', true);
    setChecked('trav-gifts', true);

    setVal('maxWeight', '8');
    setVal('pricePerKg', '12');
    setVal('additionalNotes', 'Can carry small to medium items. Will message before pickup.');

    setChecked('responsibility', true);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

function setChecked(id, checked) {
    const el = document.getElementById(id);
    if (el) {
        el.checked = checked;
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

// Selects a country in the custom dropdown (built by country-dropdown logic)
// and also sets the underlying hidden input directly as a fallback.
function selectCountryDemo(wrapperId, hiddenId, code, name) {
    try {
        if (window.cdInstances && window.cdInstances[wrapperId]) {
            window.cdInstances[wrapperId].select(code);
            return;
        }
    } catch (e) {}
    // Fallback: set hidden input + visible text directly
    const hidden = document.getElementById(hiddenId);
    if (hidden) hidden.value = name;
    const txt = document.getElementById(wrapperId + '_txt');
    if (txt) txt.innerHTML = `<span style="color:#111">${name}</span>`;
}

function tomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
}

function inDays(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
}

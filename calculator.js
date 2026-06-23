// ─── Country Data ─────────────────────────────────────────────────────────────
const COUNTRIES = [
    // Arab Countries
    { name: 'Saudi Arabia',   code: 'sa', region: 'Arab',     rate: 8  },
    { name: 'UAE',            code: 'ae', region: 'Arab',     rate: 9  },
    { name: 'Egypt',          code: 'eg', region: 'Arab',     rate: 7  },
    { name: 'Kuwait',         code: 'kw', region: 'Arab',     rate: 9  },
    { name: 'Qatar',          code: 'qa', region: 'Arab',     rate: 10 },
    { name: 'Bahrain',        code: 'bh', region: 'Arab',     rate: 9  },
    { name: 'Oman',           code: 'om', region: 'Arab',     rate: 9  },
    { name: 'Lebanon',        code: 'lb', region: 'Arab',     rate: 8  },
    { name: 'Iraq',           code: 'iq', region: 'Arab',     rate: 10 },
    { name: 'Syria',          code: 'sy', region: 'Arab',     rate: 11 },
    { name: 'Tunisia',        code: 'tn', region: 'Arab',     rate: 12 },
    { name: 'Morocco',        code: 'ma', region: 'Arab',     rate: 13 },
    { name: 'Algeria',        code: 'dz', region: 'Arab',     rate: 13 },
    { name: 'Libya',          code: 'ly', region: 'Arab',     rate: 14 },
    { name: 'Yemen',          code: 'ye', region: 'Arab',     rate: 15 },
    { name: 'Sudan',          code: 'sd', region: 'Arab',     rate: 14 },
    // Europe
    { name: 'Turkey',         code: 'tr', region: 'Europe',   rate: 11 },
    { name: 'Germany',        code: 'de', region: 'Europe',   rate: 18 },
    { name: 'France',         code: 'fr', region: 'Europe',   rate: 18 },
    { name: 'United Kingdom', code: 'gb', region: 'Europe',   rate: 20 },
    { name: 'Italy',          code: 'it', region: 'Europe',   rate: 17 },
    { name: 'Spain',          code: 'es', region: 'Europe',   rate: 17 },
    { name: 'Netherlands',    code: 'nl', region: 'Europe',   rate: 19 },
    { name: 'Poland',         code: 'pl', region: 'Europe',   rate: 16 },
    { name: 'Sweden',         code: 'se', region: 'Europe',   rate: 20 },
    { name: 'Norway',         code: 'no', region: 'Europe',   rate: 21 },
    { name: 'Switzerland',    code: 'ch', region: 'Europe',   rate: 22 },
    { name: 'Greece',         code: 'gr', region: 'Europe',   rate: 15 },
    // Americas
    { name: 'United States',  code: 'us', region: 'Americas', rate: 25 },
    { name: 'Canada',         code: 'ca', region: 'Americas', rate: 24 },
    { name: 'Mexico',         code: 'mx', region: 'Americas', rate: 22 },
    { name: 'Brazil',         code: 'br', region: 'Americas', rate: 26 },
];

function flagImg(code, size=20) {
    return `<img src="https://flagcdn.com/w${size}/${code}.png" width="${size}" height="${Math.round(size*0.75)}"
            style="border-radius:2px;object-fit:cover;vertical-align:middle;margin-right:6px;"
            onerror="this.style.display='none'">`;
}

// ─── Value Fee Tiers ───────────────────────────────────────────────────────────
function getValueFeeRate(itemValue) {
    if (itemValue <= 100)  return 0.030;   // 3%
    if (itemValue <= 500)  return 0.025;   // 2.5%
    if (itemValue <= 1000) return 0.020;   // 2%
    return 0.015;                          // 1.5%
}

// ─── Searchable Dropdown ───────────────────────────────────────────────────────
let selectedCountry = null;
let dropdownOpen    = false;

function buildDropdown() {
    const wrapper = document.getElementById('countryDropdown');
    wrapper.innerHTML = `
        <div class="cd-selected" id="cdSelected" onclick="toggleDropdown()">
            <span id="cdSelectedText">Select destination country</span>
            <svg class="cd-arrow" id="cdArrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </div>
        <div class="cd-panel" id="cdPanel">
            <div class="cd-search-wrap">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="#9CA3AF" stroke-width="1.5"/>
                    <path d="M11 11L14 14" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <input class="cd-search" id="cdSearch" placeholder="Search country..."
                       oninput="filterCountries(this.value)" autocomplete="off">
            </div>
            <div class="cd-list" id="cdList"></div>
        </div>`;
    renderList(COUNTRIES);
}

function renderList(list) {
    const el = document.getElementById('cdList');
    if (!el) return;
    if (!list.length) { el.innerHTML = '<div class="cd-empty">No results found</div>'; return; }
    const regions = [...new Set(list.map(c => c.region))];
    el.innerHTML = regions.map(region => `
        <div class="cd-region">${region}</div>
        ${list.filter(c => c.region === region).map(c => `
            <div class="cd-item ${selectedCountry?.name === c.name ? 'selected' : ''}"
                 onclick="selectCountry('${c.name}')">
                ${flagImg(c.code)}
                <span class="cd-name">${c.name}</span>
                <span class="cd-rate">$${c.rate}/kg</span>
            </div>`).join('')}
    `).join('');
}

function filterCountries(val) {
    const q = val.trim().toLowerCase();
    renderList(q ? COUNTRIES.filter(c => c.name.toLowerCase().includes(q)) : [...COUNTRIES]);
}

function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
    document.getElementById('cdPanel').classList.toggle('open', dropdownOpen);
    document.getElementById('cdArrow').style.transform = dropdownOpen ? 'rotate(180deg)' : '';
    if (dropdownOpen) setTimeout(() => document.getElementById('cdSearch')?.focus(), 50);
}

function selectCountry(name) {
    selectedCountry = COUNTRIES.find(c => c.name === name);
    document.getElementById('cdSelectedText').innerHTML =
        `${flagImg(selectedCountry.code, 22)}${selectedCountry.name}
         <span style="color:#D4AF37;font-weight:600;margin-left:8px">$${selectedCountry.rate}/kg</span>`;
    dropdownOpen = false;
    document.getElementById('cdPanel').classList.remove('open');
    document.getElementById('cdArrow').style.transform = '';
    document.getElementById('cdSearch').value = '';
    renderList(COUNTRIES);
    calculate();
}

document.addEventListener('click', e => {
    if (!document.getElementById('countryDropdown')?.contains(e.target)) {
        dropdownOpen = false;
        document.getElementById('cdPanel')?.classList.remove('open');
        if (document.getElementById('cdArrow'))
            document.getElementById('cdArrow').style.transform = '';
    }
});

// ─── Calculation ───────────────────────────────────────────────────────────────
function calculate() {
    const weight    = parseFloat(document.getElementById('weight').value)    || 0;
    const itemValue = parseFloat(document.getElementById('itemValue').value) || 0;
    const rate      = selectedCountry ? selectedCountry.rate : 0;

    // Weight component
    const weightFee = weight * rate;

    // Value component
    const valueFeeRate = getValueFeeRate(itemValue);
    const valueFee     = itemValue * valueFeeRate;

    // Base = weight fee + value fee
    const base        = Math.max(weightFee + valueFee, 5); // minimum $5
    const platformFee = base * 0.15 * 2;              // platform fee doubled (30% of base)
    const total       = base + platformFee;            // sender pays base + doubled platform fee
    const travelerEarnings = base;                     // traveler keeps the full base — Total = Traveler + Platform Fee

    // DHL comparison: $45/kg + 5% of item value
    const dhlCost  = (weight * 45) + (itemValue * 0.05);
    const savings  = dhlCost - total;
    const savingsPct = dhlCost > 0 ? Math.round((savings / dhlCost) * 100) : 0;

    const hasData  = weight > 0 && rate > 0;

    // ── Update results ──
    setEl('senderCost', hasData ? `$${total.toFixed(2)}` : '$0.00');
    setEl('travelerEarnings', hasData ? `$${travelerEarnings.toFixed(2)}` : '$0.00');
    setEl('platformFee', hasData ? `$${platformFee.toFixed(2)}` : '$0.00');

    // Breakdown box
    const breakdown = document.getElementById('calcBreakdown');
    if (breakdown) {
        if (hasData) {
            breakdown.style.display = 'block';
            setEl('bdWeightFee', `$${weightFee.toFixed(2)}`);
            setEl('bdValueFee',  itemValue > 0 ? `$${valueFee.toFixed(2)} (${(valueFeeRate*100)}% of $${itemValue})` : '$0.00');
            setEl('bdBase',      `$${base.toFixed(2)}`);
            setEl('bdPlatform',  `$${platformFee.toFixed(2)}`);
            setEl('bdTotal',     `$${total.toFixed(2)}`);
        } else {
            breakdown.style.display = 'none';
        }
    }

    // Sender info line
    const infoLines = [];
    if (hasData) {
        infoLines.push(`${weight}kg × $${rate}/kg = $${weightFee.toFixed(2)}`);
        if (itemValue > 0) infoLines.push(`Value fee: $${valueFee.toFixed(2)}`);
        infoLines.push(`+ 30% platform fee`);
    }
    setEl('senderInfo', infoLines.length ? infoLines.join(' · ') : 'Enter weight and select country');

    // Comparison
    const label = `${weight > 0 ? weight + ' kg' : '—'} → ${selectedCountry?.name || '—'}`;
    setEl('travixPrice',   hasData ? `$${total.toFixed(2)}`   : '$0.00');
    setEl('expressPrice',  weight > 0 ? `$${dhlCost.toFixed(2)}` : '$0.00');
    setEl('savingsAmount', savings > 0 ? `$${savings.toFixed(2)}` : '$0.00');
    setEl('savingsPercent', savings > 0 ? `${savingsPct}% savings!` : '—');
    document.querySelectorAll('.comparison-weight').forEach(el => el.textContent = label);

    // Rate info box
    const rateBox = document.getElementById('rateInfoBox');
    if (rateBox) {
        rateBox.style.display = selectedCountry ? 'flex' : 'none';
        if (selectedCountry) {
            rateBox.innerHTML = `
                <span>${flagImg(selectedCountry.code, 18)} <strong>${selectedCountry.name}</strong></span>
                <span>Base rate: <strong style="color:#D4AF37">$${selectedCountry.rate}/kg</strong>
                ${itemValue > 0 ? ` &nbsp;|&nbsp; Value fee: <strong style="color:#D4AF37">${(valueFeeRate*100)}%</strong>` : ''}</span>`;
        }
    }
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ─── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    buildDropdown();
    calculate();

    ['weight', 'itemValue'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', calculate);
    });

    document.getElementById('weight')?.addEventListener('change', function() {
        let v = parseFloat(this.value);
        if (v < 0.1) this.value = 0.1;
        if (v > 50)  this.value = 50;
        calculate();
    });

    document.getElementById('itemValue')?.addEventListener('change', function() {
        let v = parseFloat(this.value);
        if (v < 0)      this.value = 0;
        if (v > 100000) this.value = 100000;
        calculate();
    });

    document.querySelector('.btn-cta-primary')?.addEventListener('click', () => {
        window.location.href = localStorage.getItem('userLoggedIn') === 'true' ? 'send-item.html' : 'signup.html';
    });
    document.querySelector('.btn-cta-secondary')?.addEventListener('click', () => {
        window.location.href = localStorage.getItem('userLoggedIn') === 'true' ? 'become-traveler.html' : 'signup.html';
    });

    document.querySelector('.mobile-menu-toggle')?.addEventListener('click', () => {
        document.querySelector('.nav-menu')?.classList.toggle('active');
        document.querySelector('.nav-actions')?.classList.toggle('active');
    });

    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (nav) nav.style.boxShadow = window.scrollY > 50
            ? '0 4px 20px rgba(0,0,0,0.1)' : '0 2px 10px rgba(0,0,0,0.05)';
    });
});

console.log('Calculator loaded — weight + value pricing active');

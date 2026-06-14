/**
 * Travix API Configuration
 * Backend URL: http://localhost:8000/api
 */

// Guard against duplicate loading
if (typeof window.API_BASE_URL === 'undefined') {

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Generic API call function
 */
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');

    // Merge headers correctly — spread operator loses headers when options has its own keys
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw {
                status: response.status,
                message: data.message || 'Request failed',
                errors: data.errors || {}
            };
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Authentication API calls
 */
const AuthAPI = {
    register: (userData) => apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),
    
    login: (credentials) => apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),
    
    logout: () => apiCall('/auth/logout', { method: 'POST' }),
    
    getUser: () => apiCall('/auth/user'),
    
    updateProfile: (profileData) => apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
    }),
    
    changePassword: (passwordData) => apiCall('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData)
    })
};

/**
 * Shipment API calls
 */
const ShipmentAPI = {
    create: (shipmentData) => apiCall('/shipments', {
        method: 'POST',
        body: JSON.stringify(shipmentData)
    }),
    
    getMyShipments: () => apiCall('/shipments'),
    
    getAvailable: (filters = {}) => {
        const params = new URLSearchParams(filters);
        return apiCall(`/shipments/available?${params}`);
    },
    
    getOne: (id) => apiCall(`/shipments/${id}`),
    
    accept: (id) => apiCall(`/shipments/${id}/accept`, { method: 'POST' }),
    
    cancel: (id, reason) => apiCall(`/shipments/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
    }),
    
    markDelivered: (id) => apiCall(`/shipments/${id}/delivered`, {
        method: 'POST'
    })
};

/**
 * Trip API calls
 */
const TripAPI = {
    create: (tripData) => apiCall('/trips', {
        method: 'POST',
        body: JSON.stringify(tripData)
    }),
    
    getMyTrips: () => apiCall('/trips'),
    
    getAvailable: (filters = {}) => {
        const params = new URLSearchParams(filters);
        return apiCall(`/trips/available?${params}`);
    },
    
    getOne: (id) => apiCall(`/trips/${id}`),
    
    update: (id, tripData) => apiCall(`/trips/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tripData)
    }),
    
    cancel: (id) => apiCall(`/trips/${id}/cancel`, { method: 'POST' })
};

/**
 * Dashboard API calls
 */
const DashboardAPI = {
    getStats: () => apiCall('/dashboard/stats')
};

/**
 * Payment API calls
 */
const PaymentAPI = {
    getConfig: () => apiCall('/config'),

    createIntent: (data) => apiCall('/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    confirm: (data) => apiCall('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify(data)
    })
};

// Export to global scope
window.API_BASE_URL = API_BASE_URL;
window.apiCall = apiCall;
window.AuthAPI = AuthAPI;
window.ShipmentAPI = ShipmentAPI;
window.TripAPI = TripAPI;
window.DashboardAPI = DashboardAPI;
window.PaymentAPI = PaymentAPI;

console.log('✅ Travix API Configuration Loaded');
console.log('📡 Backend URL:', API_BASE_URL);
console.log('🔑 AuthAPI available:', typeof AuthAPI !== 'undefined');

} // end guard: typeof window.API_BASE_URL === 'undefined'

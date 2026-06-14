// Reusable Modal System for Travix

// Show modal with custom content
function showModal(options = {}) {
    const {
        title = 'Notification',
        message = '',
        type = 'info', // success, error, warning, info
        confirmText = 'OK',
        cancelText = null,
        onConfirm = null,
        onCancel = null
    } = options;

    // Remove existing modal if any
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    // Icon based on type
    const icons = {
        success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 8V12M12 16V16.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 20H22L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 10V14M12 18V18.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 16V12M12 8V8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    };

    // Create modal HTML
    const modalHTML = `
        <div class="modal-overlay active" id="customModal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>
                        <div class="modal-icon ${type}">
                            ${icons[type]}
                        </div>
                        ${title}
                    </h3>
                    <button class="modal-close" onclick="closeModal()">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    ${cancelText ? `<button class="modal-btn modal-btn-secondary" onclick="closeModal(); ${onCancel ? 'window.modalCancelCallback()' : ''}">${cancelText}</button>` : ''}
                    <button class="modal-btn modal-btn-primary" onclick="closeModal(); ${onConfirm ? 'window.modalConfirmCallback()' : ''}">${confirmText}</button>
                </div>
            </div>
        </div>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Store callbacks
    if (onConfirm) window.modalConfirmCallback = onConfirm;
    if (onCancel) window.modalCancelCallback = onCancel;

    // Close on overlay click
    const overlay = document.getElementById('customModal');
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

// Close modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            // Clean up callbacks
            delete window.modalConfirmCallback;
            delete window.modalCancelCallback;
        }, 300);
    }
}

// Success modal shorthand
function showSuccess(message, onConfirm) {
    showModal({
        title: 'Success',
        message: message,
        type: 'success',
        confirmText: 'OK',
        onConfirm: onConfirm
    });
}

// Error modal shorthand
function showError(message) {
    showModal({
        title: 'Error',
        message: message,
        type: 'error',
        confirmText: 'OK'
    });
}

// Warning modal shorthand
function showWarning(message) {
    showModal({
        title: 'Warning',
        message: message,
        type: 'warning',
        confirmText: 'OK'
    });
}

// Info modal shorthand
function showInfo(message) {
    showModal({
        title: 'Information',
        message: message,
        type: 'info',
        confirmText: 'OK'
    });
}

// Confirm dialog
function showConfirm(message, onConfirm, onCancel) {
    showModal({
        title: 'Confirm',
        message: message,
        type: 'warning',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: onConfirm,
        onCancel: onCancel
    });
}

console.log('Modal system loaded');

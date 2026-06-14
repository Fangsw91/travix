// Modal functions loaded from modal.js

// Tab Switching Functionality
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        
        // Remove active class from all buttons and panes
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Add active class to clicked button and corresponding pane
        button.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        console.log(`Switched to ${tabName} tab`);
    });
});

// Search functionality for Users tab
const searchUsersInput = document.getElementById('searchUsers');
if (searchUsersInput) {
    searchUsersInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const tableRows = document.querySelectorAll('#users-tab .data-table tbody tr');
        
        tableRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// Export button functionality
const exportButtons = document.querySelectorAll('.btn-export');
exportButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        console.log('Export clicked');
        showInfo('Export functionality would download the current view as CSV/Excel');
    });
});

// Action buttons functionality
const actionButtons = document.querySelectorAll('.btn-actions');
actionButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        const name = row?.cells[0]?.textContent || 'this item';
        const userId = row?.cells[1]?.textContent || 'Unknown ID';
        
        console.log('Action clicked for:', name);
        
        // Create custom action modal
        showActionMenu(name, userId, row);
    });
});

// Custom action menu modal
function showActionMenu(name, userId, row) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    const modalHTML = `
        <div class="modal-overlay active" id="actionModal">
            <div class="modal-container" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>
                        <div class="modal-icon info">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 16V12M12 8V8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        Actions for ${name}
                    </h3>
                    <button class="modal-close" onclick="closeModal()">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                        <button class="action-menu-btn" onclick="handleActionView('${name}', '${userId}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5C7 5 2.73 8.11 1 12.5 2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5z" stroke="currentColor" stroke-width="2"/>
                                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            View Details
                        </button>
                        <button class="action-menu-btn" onclick="handleActionEdit('${name}', '${userId}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            Edit
                        </button>
                        <button class="action-menu-btn" onclick="handleActionSuspend('${name}', '${userId}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            Suspend
                        </button>
                        <button class="action-menu-btn action-menu-btn-danger" onclick="handleActionDelete('${name}', '${userId}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add CSS for action buttons if not exists
    if (!document.getElementById('actionMenuStyles')) {
        const style = document.createElement('style');
        style.id = 'actionMenuStyles';
        style.textContent = `
            #actionModal .modal-body {
                background: white;
                color: #0A1A2F;
            }
            .action-menu-btn {
                display: flex;
                align-items: center;
                gap: 0.8rem;
                width: 100%;
                padding: 0.9rem 1.2rem;
                background: rgba(10, 26, 47, 0.03);
                border: 1px solid rgba(10, 26, 47, 0.1);
                border-radius: 8px;
                color: #0A1A2F !important;
                font-size: 0.95rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s;
                text-align: left;
            }
            .action-menu-btn:hover {
                background: rgba(212, 175, 55, 0.1);
                border-color: rgba(212, 175, 55, 0.5);
                transform: translateX(5px);
            }
            .action-menu-btn svg {
                color: #D4AF37;
                flex-shrink: 0;
            }
            .action-menu-btn-danger {
                border-color: rgba(239, 68, 68, 0.3);
            }
            .action-menu-btn-danger:hover {
                background: rgba(239, 68, 68, 0.1);
                border-color: rgba(239, 68, 68, 0.5);
            }
            .action-menu-btn-danger svg {
                color: #ef4444;
            }
        `;
        document.head.appendChild(style);
    }

    // Close on overlay click
    const overlay = document.getElementById('actionModal');
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

// Action handlers
window.handleActionView = function(name, userId) {
    closeModal();
    showInfo(`Viewing details for: ${name}\nUser ID: ${userId}`);
};

window.handleActionEdit = function(name, userId) {
    closeModal();
    showInfo(`Edit functionality for ${name} would open here.`);
};

window.handleActionSuspend = function(name, userId) {
    closeModal();
    showConfirm(
        `Are you sure you want to suspend ${name}?`,
        () => {
            showSuccess(`${name} has been suspended.`);
            console.log('Suspended:', name, userId);
        }
    );
};

window.handleActionDelete = function(name, userId) {
    closeModal();
    showConfirm(
        `Are you sure you want to delete ${name}? This action cannot be undone.`,
        () => {
            showSuccess(`${name} has been deleted.`);
            console.log('Deleted:', name, userId);
        }
    );
};


// Request buttons functionality
const reviewButtons = document.querySelectorAll('.btn-review');
const resolveButtons = document.querySelectorAll('.btn-resolve');

reviewButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const requestItem = e.target.closest('.request-item');
        const requestId = requestItem?.querySelector('.request-id')?.textContent?.trim() || 'Unknown';
        console.log('Review clicked for:', requestId);
        showInfo(`Opening review panel for ${requestId}`);
    });
});

resolveButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const requestItem = e.target.closest('.request-item');
        const requestId = requestItem?.querySelector('.request-id')?.textContent?.trim() || 'Unknown';
        
        showConfirm(
            `Mark ${requestId} as resolved?`,
            () => {
                requestItem.style.opacity = '0.5';
                setTimeout(() => {
                    requestItem.remove();
                    showSuccess('Request marked as resolved');
                }, 300);
                console.log('Resolved:', requestId);
            }
        );
    });
});

// View All button functionality
const viewAllBtn = document.querySelector('.btn-view-all');
if (viewAllBtn) {
    viewAllBtn.addEventListener('click', () => {
        console.log('View All clicked');
        showInfo('Would navigate to full transactions history page');
    });
}

// Exit Admin button confirmation
const exitAdminBtn = document.querySelector('.btn-exit-admin');
if (exitAdminBtn) {
    exitAdminBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showConfirm(
            'Are you sure you want to exit admin dashboard?',
            function() {
                window.location.href = 'travix-landing.html';
            }
        );
    });
}

// Simulate real-time updates (optional)
function simulateRealtimeUpdates() {
    // This could be connected to a WebSocket or polling mechanism
    // For demo purposes, we'll just log
    console.log('Dashboard loaded - real-time updates would appear here');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin Dashboard Loaded Successfully');
    simulateRealtimeUpdates();
    
    // Set initial tab
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        const tabName = activeTab.getAttribute('data-tab');
        console.log(`Initial tab: ${tabName}`);
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Alt + 1-4 to switch tabs
    if (e.altKey && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        const buttons = Array.from(tabButtons);
        if (buttons[index]) {
            buttons[index].click();
        }
    }
    
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        const activeTabPane = document.querySelector('.tab-pane.active');
        const searchInput = activeTabPane?.querySelector('.search-box input');
        if (searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
    }
});

// Add visual feedback for stat cards
const statCards = document.querySelectorAll('.stat-card');
statCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    });
});

// Add transition to stat cards
statCards.forEach(card => {
    card.style.transition = 'all 0.3s ease';
});

console.log('Admin Dashboard Interactive Features Initialized');
console.log('Keyboard shortcuts: Alt+1/2/3/4 to switch tabs, Ctrl/Cmd+F to search');

// Live Chat Functionality

// Get elements
const liveChatBtn = document.getElementById('liveChatBtn');
const liveChatModal = document.getElementById('liveChatModal');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');

// Toggle chat modal
liveChatBtn.addEventListener('click', function() {
    liveChatModal.classList.toggle('active');
    if (liveChatModal.classList.contains('active')) {
        chatInput.focus();
        // Remove badge when chat is opened
        const badge = liveChatBtn.querySelector('.chat-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }
});

// Close chat modal
closeChatBtn.addEventListener('click', function() {
    liveChatModal.classList.remove('active');
});

// Send message on button click
sendBtn.addEventListener('click', sendMessage);

// Send message on Enter key
chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Send message function
function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate bot response after 1.5 seconds
    setTimeout(function() {
        hideTypingIndicator();
        addBotResponse(message);
    }, 1500);
}

// Quick message function
function sendQuickMessage(message) {
    addMessage(message, 'user');
    
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate bot response
    setTimeout(function() {
        hideTypingIndicator();
        addBotResponse(message);
    }, 1500);
}

// Add message to chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const time = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-bubble">${escapeHtml(text)}</div>
                <div class="message-time">${time}</div>
            </div>
            <div class="message-avatar user">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="8" r="4" fill="white"/>
                    <path d="M4 18C4 14 7 11 10 11C13 11 16 14 16 18" stroke="white" stroke-width="2" fill="none"/>
                </svg>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar agent">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="8" r="4" fill="white"/>
                    <path d="M4 18C4 14 7 11 10 11C13 11 16 14 16 18" stroke="white" stroke-width="2" fill="none"/>
                </svg>
            </div>
            <div class="message-content">
                <div class="message-bubble">${escapeHtml(text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar agent">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="8" r="4" fill="white"/>
                <path d="M4 18C4 14 7 11 10 11C13 11 16 14 16 18" stroke="white" stroke-width="2" fill="none"/>
            </svg>
        </div>
        <div class="message-bubble">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Bot responses based on message content
function addBotResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    let response = '';
    
    if (lowerMessage.includes('how does travix work') || lowerMessage.includes('how it works')) {
        response = "Travix connects people who need to send items with travelers who have extra luggage space. It's simple: post your item, match with a verified traveler, and track your delivery in real-time! 📦✈️";
    } else if (lowerMessage.includes('send an item') || lowerMessage.includes('send item')) {
        response = "To send an item, click 'Send an Item' on the homepage, fill in your item details, set your pickup/delivery locations, and offer compensation. We'll match you with verified travelers heading to your destination! 🎯";
    } else if (lowerMessage.includes('traveler') || lowerMessage.includes('become')) {
        response = "Becoming a traveler is easy! Click 'Become a Traveler', enter your trip details, upload your ticket for verification, and choose what items you're willing to carry. Start earning money on your trips! 💰";
    } else if (lowerMessage.includes('pricing') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
        response = "Travix saves you up to 60% compared to traditional shipping! Pricing depends on item weight, dimensions, and destination. Use our calculator on the homepage for an instant estimate. 💵";
    } else if (lowerMessage.includes('safe') || lowerMessage.includes('secure')) {
        response = "Safety is our priority! All travelers are ID-verified, we use escrow payments, provide insurance up to $1000, and offer real-time GPS tracking. Your items are in good hands! 🔒";
    } else if (lowerMessage.includes('track') || lowerMessage.includes('tracking')) {
        response = "Yes! You can track your package in real-time with live GPS updates and notifications at every step of the journey. 📍";
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        response = "Hello! 👋 Welcome to Travix Support. How can I help you today?";
    } else if (lowerMessage.includes('thank')) {
        response = "You're welcome! Feel free to ask if you have any other questions. Happy to help! 😊";
    } else {
        response = "That's a great question! Our team can provide more details. Would you like me to connect you with a live agent, or you can email us at support@travix.com 📧";
    }
    
    addMessage(response, 'agent');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Expand button on hover
liveChatBtn.addEventListener('mouseenter', function() {
    liveChatBtn.classList.add('expanded');
});

liveChatBtn.addEventListener('mouseleave', function() {
    liveChatBtn.classList.remove('expanded');
});

// Close chat when clicking outside
document.addEventListener('click', function(e) {
    if (!liveChatModal.contains(e.target) && !liveChatBtn.contains(e.target)) {
        liveChatModal.classList.remove('active');
    }
});

console.log('Live Chat initialized successfully');

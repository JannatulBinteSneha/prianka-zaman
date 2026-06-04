// ===== CHATBOT CONFIGURATION =====
const GIST_URL = 'https://gist.githubusercontent.com/JannatulBinteSneha/567651735484338d8f74ee7c92661c43/raw';

// ===== STATE MANAGEMENT =====
let actressData = '';
let isWaitingForResponse = false;
let chatInitialized = false;
let conversationHistory = []; // Stores the session history: { role: 'user' | 'model', text: string }

// ===== DOM ELEMENTS =====
let chatbotBubble;
let chatbotPopup;
let closeBtn;
let chatbotMessages;
let chatbotInput;
let sendBtn;

// ===== INITIALIZATION =====
function initChatbot() {
    // Get DOM elements
    chatbotBubble = document.getElementById('chatbotBubble');
    chatbotPopup = document.getElementById('chatbotPopup');
    closeBtn = document.getElementById('closeBtn');
    chatbotMessages = document.getElementById('chatbotMessages');
    chatbotInput = document.getElementById('chatbotInput');
    sendBtn = document.getElementById('sendBtn');

    // Check if all elements exist
    if (!chatbotBubble || !chatbotPopup || !chatbotInput) {
        console.warn('Chatbot elements not found in DOM');
        return;
    }

    // Add event listeners
    chatbotBubble.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', closeChat);
    sendBtn.addEventListener('click', sendMessage);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isWaitingForResponse) {
            sendMessage();
        }
    });

    // Fetch actress data on page load
    fetchActressData();
}

// ===== FUNCTIONS =====
function toggleChat() {
    if (chatbotPopup.classList.contains('active')) {
        closeChat();
    } else {
        openChat();
    }
}

// Close Chat popup
function closeChat() {
    chatbotPopup.classList.remove('active');
}

// Open Chat popup
function openChat() {
    chatbotPopup.classList.add('active');

    // Initialize greeting message on first open
    if (!chatInitialized && chatbotMessages.children.length === 0) {
        initializeChat();
        chatInitialized = true;
    }

    chatbotInput.focus();
}

// Handles user message sending
async function sendMessage() {
    const userMessage = chatbotInput.value.trim();

    if (!userMessage) return;
    if (isWaitingForResponse) return;

    // Display user message in UI
    addMessage(userMessage, 'user');
    chatbotInput.value = '';

    // Append to local history and slice to keep lightweight
    conversationHistory.push({ role: 'user', text: userMessage });
    if (conversationHistory.length > 10) {
        conversationHistory = conversationHistory.slice(-10);
    }

    // Show typing indicator
    isWaitingForResponse = true;
    addTypingIndicator();

    try {
        const responseText = await queryGeminiAPI(userMessage);
        removeTypingIndicator();
        addMessage(responseText, 'bot');

        // Append bot response to local history
        conversationHistory.push({ role: 'model', text: responseText });
        if (conversationHistory.length > 10) {
            conversationHistory = conversationHistory.slice(-10);
        }
    } catch (error) {
        removeTypingIndicator();
        console.error('Error during chatbot response generation:', error);

        // Remove the failed user prompt from conversation history so it doesn't pollute the context
        if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].text === userMessage) {
            conversationHistory.pop();
        }

        addMessage('Sorry, I had trouble processing that. Please try again.', 'bot');
    } finally {
        isWaitingForResponse = false;
    }
}

// Helper to add a message bubble to UI
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;

    messageDiv.appendChild(bubble);
    chatbotMessages.appendChild(messageDiv);

    // Auto scroll to bottom
    setTimeout(() => {
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }, 0);
}

// Helper to add bot typing animation
function addTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.id = 'typing-indicator';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    messageDiv.appendChild(indicator);
    chatbotMessages.appendChild(messageDiv);

    // Auto scroll to bottom
    setTimeout(() => {
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }, 0);
}

// Helper to remove bot typing animation
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Sends user message and history to serverless backend
async function queryGeminiAPI(userMessage) {
    try {
        const response = await fetch('https://gemini-proxy.jannatulbintesneha-p.workers.dev', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                actressData: actressData,
                history: conversationHistory
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.reply) {
            return data.reply;
        } else {
            return 'I could not generate a response. Please try again.';
        }
    } catch (error) {
        console.error('Error in queryGeminiAPI:', error);
        throw error;
    }
}

// Fetches biography and info dataset about Prianka Zaman
async function fetchActressData() {
    try {
        const response = await fetch(GIST_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }
        actressData = await response.text();
        console.log('Actress data loaded successfully');
    } catch (error) {
        console.error('Error fetching actress data:', error);
        actressData = ''; // Fallback to empty, backend handles this gracefully
    }
}

// Injects the greeting message on first startup
function initializeChat() {
    addMessage('Hi! How can I help you today? 😊', 'bot');
}

// ===== AUTO-INITIALIZE ON DOM READY =====
document.addEventListener('DOMContentLoaded', initChatbot);

// Fallback for older browsers
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}

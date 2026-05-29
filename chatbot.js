// ===== CHATBOT CONFIGURATION =====
const GIST_URL = 'https://gist.githubusercontent.com/JannatulBinteSneha/567651735484338d8f74ee7c92661c43/raw';

// ===== STATE MANAGEMENT =====
let actressData = '';
let isWaitingForResponse = false;
let chatInitialized = false;

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

function closeChat() {
    chatbotPopup.classList.remove('active');
}

function openChat() {
    chatbotPopup.classList.add('active');
    
    // Initialize greeting message on first open
    if (!chatInitialized && chatbotMessages.children.length === 0) {
        initializeChat();
        chatInitialized = true;
    }
    
    chatbotInput.focus();
}

async function sendMessage() {
    const userMessage = chatbotInput.value.trim();
    
    if (!userMessage) return;
    if (isWaitingForResponse) return;

    // Add user message to chat
    addMessage(userMessage, 'user');
    chatbotInput.value = '';

    // Show typing indicator
    isWaitingForResponse = true;
    addTypingIndicator();

    try {
        const response = await queryGeminiAPI(userMessage);
        removeTypingIndicator();
        addMessage(response, 'bot');
    } catch (error) {
        removeTypingIndicator();
        console.error('Error:', error);
        addMessage('Sorry, I had trouble processing that. Please try again.', 'bot');
    } finally {
        isWaitingForResponse = false;
    }
}

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

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function queryGeminiAPI(userMessage) {
    try {
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                actressData: actressData
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
        console.error('Error:', error);
        throw error;
    }
}

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
        actressData = 'Unable to load actress data. You can still ask general questions!';
    }
}

function initializeChat() {
    // Add initial greeting message
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

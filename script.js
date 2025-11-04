// গ্লোবাল ভেরিয়েবল
let geminiModel = null;
let chatHistory = [];

// পেজ লোড হলে চেক করবে API key আছে কিনা
document.addEventListener('DOMContentLoaded', function() {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    
    if (savedApiKey) {
        initializeGemini(savedApiKey);
        showChatInterface();
    } else {
        showApiKeyModal();
    }
});

// API key মোডাল দেখানো
function showApiKeyModal() {
    document.getElementById('apiKeyModal').style.display = 'flex';
    document.getElementById('chatContainer').style.display = 'none';
}

// হেল্প মোডাল দেখানো
function showHelp() {
    document.getElementById('helpModal').style.display = 'flex';
}

// হেল্প মোডাল বন্ধ করা
function closeHelp() {
    document.getElementById('helpModal').style.display = 'none';
}

// API key সেভ করা
function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    
    if (!apiKey) {
        alert('Please enter your Gemini API key');
        return;
    }
    
    // API key ভ্যালিডেশন (বেসিক)
    if (apiKey.length < 20) {
        alert('Please enter a valid API key');
        return;
    }
    
    localStorage.setItem('geminiApiKey', apiKey);
    initializeGemini(apiKey);
    showChatInterface();
}

// Gemini API initialize করা
async function initializeGemini(apiKey) {
    try {
        // Gemini AI লাইব্রেরি লোড হয়েছে কিনা চেক করা
        if (typeof google === 'undefined' || !google.generativeai) {
            throw new Error('Gemini AI library not loaded properly');
        }
        
        const genAI = google.generativeai;
        const model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            apiKey: apiKey
        });
        
        // একটি টেস্ট রিকুয়েস্ট পাঠানো
        const testResult = await model.generateContent("Hello");
        await testResult.response;
        
        geminiModel = model;
        updateApiStatus('Connected', true);
        enableChatInterface();
        
    } catch (error) {
        console.error('Error initializing Gemini:', error);
        updateApiStatus('Connection Failed', false);
        
        // API key ভুল হলে রিমুভ করে দেয়া
        localStorage.removeItem('geminiApiKey');
        alert('Failed to connect with the provided API key. Please check your key and try again.');
        showApiKeyModal();
    }
}

// API status আপডেট করা
function updateApiStatus(status, isConnected) {
    const statusElement = document.getElementById('apiStatus');
    statusElement.textContent = status;
    
    if (isConnected) {
        statusElement.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
    } else {
        statusElement.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
    }
}

// চ্যাট ইন্টারফেস দেখানো
function showChatInterface() {
    document.getElementById('apiKeyModal').style.display = 'none';
    document.getElementById('chatContainer').style.display = 'flex';
}

// চ্যাট ইন্টারফেস enable করা
function enableChatInterface() {
    document.getElementById('userInput').disabled = false;
    document.getElementById('sendButton').disabled = false;
    document.getElementById('userInput').focus();
}

// API key পরিবর্তন করা
function changeApiKey() {
    localStorage.removeItem('geminiApiKey');
    geminiModel = null;
    chatHistory = [];
    showApiKeyModal();
    updateApiStatus('Disconnected', false);
}

// মেসেজ পাঠানো
async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    
    if (!message || !geminiModel) return;
    
    // ইউজারের মেসেজ ডিসপ্লে করা
    displayMessage(message, 'user');
    userInput.value = '';
    
    // টাইপিং ইন্ডিকেটর দেখানো
    showTypingIndicator();
    
    try {
        // Gemini-তে রিকুয়েস্ট পাঠানো
        const result = await geminiModel.generateContent(message);
        const response = await result.response;
        const text = response.text();
        
        // টাইপিং ইন্ডিকেটর রিমুভ করা
        removeTypingIndicator();
        
        // বটের রেসপন্স ডিসপ্লে করা
        displayMessage(text, 'bot');
        
        // চ্যাট হিস্ট্রি আপডেট করা
        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'bot', content: text });
        
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        removeTypingIndicator();
        
        let errorMessage = 'Sorry, I encountered an error. ';
        
        if (error.message.includes('API_KEY_INVALID')) {
            errorMessage += 'Your API key appears to be invalid. Please update it.';
            changeApiKey();
        } else if (error.message.includes('QUOTA')) {
            errorMessage += 'You may have exceeded your API quota.';
        } else if (error.message.includes('NETWORK')) {
            errorMessage += 'Network error. Please check your connection.';
        } else {
            errorMessage += 'Please try again.';
        }
        
        displayMessage(errorMessage, 'bot');
    }
}

// টাইপিং ইন্ডিকেটর দেখানো
function showTypingIndicator() {
    const chatbox = document.getElementById('chatbox');
    const typingElement = document.createElement('div');
    typingElement.id = 'typingIndicator';
    typingElement.className = 'bot-message typing-indicator';
    typingElement.innerHTML = `
        <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatbox.appendChild(typingElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// টাইপিং ইন্ডিকেটর রিমুভ করা
function removeTypingIndicator() {
    const typingElement = document.getElementById('typingIndicator');
    if (typingElement) {
        typingElement.remove();
    }
}

// মেসেজ ডিসপ্লে করা
function displayMessage(message, sender) {
    const chatbox = document.getElementById('chatbox');
    const messageElement = document.createElement('div');
    messageElement.classList.add(sender + '-message');
    messageElement.textContent = message;
    chatbox.appendChild(messageElement);
    
    // অটো স্ক্রল
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Enter key-তে মেসেজ পাঠানো
document.getElementById('userInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// API key input-এও Enter key কাজ করবে
document.getElementById('apiKeyInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        saveApiKey();
    }
});

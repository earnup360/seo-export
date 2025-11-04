// গ্লোবাল ভেরিয়েবল
let openAIApiKey = null;
let chatHistory = [];

// পেজ লোড হলে চেক করবে API key আছে কিনা
document.addEventListener('DOMContentLoaded', function() {
    const savedApiKey = localStorage.getItem('openAIApiKey');
    
    if (savedApiKey) {
        openAIApiKey = savedApiKey;
        testOpenAIConnection(savedApiKey);
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
async function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    
    if (!apiKey) {
        alert('Please enter your OpenAI API key');
        return;
    }
    
    // API key ভ্যালিডেশন (বেসিক)
    if (apiKey.length < 20) {
        alert('Please enter a valid API key');
        return;
    }
    
    localStorage.setItem('openAIApiKey', apiKey);
    await testOpenAIConnection(apiKey);
}

// OpenAI API connection টেস্ট করা
async function testOpenAIConnection(apiKey) {
    try {
        showLoadingState();
        
        // একটি টেস্ট রিকুয়েস্ট পাঠানো
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'Say "Hello" only.' }],
                max_tokens: 10
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // যদি সফল হয়
        openAIApiKey = apiKey;
        updateApiStatus('Connected', true);
        showChatInterface();
        enableChatInterface();
        
    } catch (error) {
        console.error('Error connecting to OpenAI:', error);
        handleConnectionError(error);
    }
}

// লোডিং স্টেট দেখানো
function showLoadingState() {
    updateApiStatus('Connecting...', false);
}

// API status আপডেট করা
function updateApiStatus(status, isConnected) {
    const statusElement = document.getElementById('apiStatus');
    if (statusElement) {
        statusElement.textContent = status;
        
        if (isConnected) {
            statusElement.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
            statusElement.style.color = '#2e7d32';
        } else {
            statusElement.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
            statusElement.style.color = '#c62828';
        }
    }
}

// কানেকশন error হ্যান্ডেল করা
function handleConnectionError(error) {
    updateApiStatus('Connection Failed', false);
    
    let errorMessage = 'Failed to connect. ';
    
    if (error.message.includes('401')) {
        errorMessage += 'The API key is invalid. Please check and try again.';
    } else if (error.message.includes('429')) {
        errorMessage += 'Rate limit exceeded. Please try again later.';
    } else if (error.message.includes('500')) {
        errorMessage += 'OpenAI server error. Please try again later.';
    } else if (error.message.includes('NETWORK') || error.message.includes('Fetch')) {
        errorMessage += 'Network error. Please check your connection.';
    } else {
        errorMessage += 'Error: ' + error.message;
    }
    
    alert(errorMessage);
    
    // API key ভুল হলে রিমুভ করে দেয়া
    localStorage.removeItem('openAIApiKey');
    showApiKeyModal();
}

// চ্যাট ইন্টারফেস দেখানো
function showChatInterface() {
    const apiKeyModal = document.getElementById('apiKeyModal');
    const chatContainer = document.getElementById('chatContainer');
    
    if (apiKeyModal) apiKeyModal.style.display = 'none';
    if (chatContainer) chatContainer.style.display = 'flex';
}

// চ্যাট ইন্টারফেস enable করা
function enableChatInterface() {
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    
    if (userInput) userInput.disabled = false;
    if (sendButton) sendButton.disabled = false;
    if (userInput) userInput.focus();
}

// API key পরিবর্তন করা
function changeApiKey() {
    localStorage.removeItem('openAIApiKey');
    openAIApiKey = null;
    chatHistory = [];
    showApiKeyModal();
    updateApiStatus('Disconnected', false);
}

// মেসেজ পাঠানো
async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    
    if (!message || !openAIApiKey) return;
    
    // ইউজারের মেসেজ ডিসপ্লে করা
    displayMessage(message, 'user');
    userInput.value = '';
    userInput.disabled = true;
    
    // টাইপিং ইন্ডিকেটর দেখানো
    showTypingIndicator();
    
    try {
        // চ্যাট হিস্ট্রি আপডেট করা
        chatHistory.push({ role: 'user', content: message });
        
        // OpenAI API কে কল করা
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAIApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: chatHistory,
                max_tokens: 500
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const botResponse = data.choices[0].message.content;
        
        // টাইপিং ইন্ডিকেটর রিমুভ করা
        removeTypingIndicator();
        
        // বটের রেসপন্স ডিসপ্লে করা
        displayMessage(botResponse, 'bot');
        
        // চ্যাট হিস্ট্রি আপডেট করা
        chatHistory.push({ role: 'assistant', content: botResponse });
        
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        removeTypingIndicator();
        
        let errorMessage = 'Sorry, I encountered an error. ';
        
        if (error.message.includes('401')) {
            errorMessage += 'Your API key appears to be invalid. Please update it.';
            changeApiKey();
        } else if (error.message.includes('429')) {
            errorMessage += 'Rate limit exceeded. Please try again later.';
        } else if (error.message.includes('500')) {
            errorMessage += 'OpenAI server error. Please try again later.';
        } else if (error.message.includes('NETWORK')) {
            errorMessage += 'Network error. Please check your connection.';
        } else {
            errorMessage += 'Please try again.';
        }
        
        displayMessage(errorMessage, 'bot');
    } finally {
        userInput.disabled = false;
        userInput.focus();
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

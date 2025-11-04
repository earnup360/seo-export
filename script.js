// বটের উত্তর দেওয়ার জন্য একটি সহজ ফাংশন
function getBotResponse(userInput) {
    userInput = userInput.toLowerCase();

    // কিছু নিয়ম ডিফাইন করা হলো
    if (userInput.includes("hello") || userInput.includes("hi")) {
        return "Hello there!";
    } else if (userInput.includes("how are you")) {
        return "I'm just a bot, but I'm functioning perfectly!";
    } else if (userInput.includes("bye") || userInput.includes("goodbye")) {
        return "Goodbye! Have a great day!";
    } else if (userInput.includes("name")) {
        return "I'm a simple chatbot created by you!";
    } else if (userInput.includes("thank")) {
        return "You're welcome!";
    } else {
        return "I'm still learning. Can you please rephrase that?";
    }
}

// মেসেজ পাঠানোর ফাংশন
function sendMessage() {
    const userInputField = document.getElementById("userInput");
    const userInput = userInputField.value;

    if (userInput.trim() === "") {
        return; // খালি মেসেজ পাঠানো থেকে বিরত থাকো
    }

    // ইউজারের মেসেজ চ্যাটবক্সে দেখাও
    displayMessage(userInput, "user");
    userInputField.value = ""; // ইনপুট ফিল্ড খালি করো

    // বটকে চিন্তা করতে কিছুক্ষণ দেরি করাও (Realistic feel)
    setTimeout(() => {
        const botResponse = getBotResponse(userInput);
        displayMessage(botResponse, "bot");
    }, 500);
}

// মেসেজ চ্যাটবক্সে ডিসপ্লে করার ফাংশন
function displayMessage(message, sender) {
    const chatbox = document.getElementById("chatbox");
    const messageElement = document.createElement("div");
    messageElement.classList.add(sender + "-message");
    messageElement.textContent = message;
    chatbox.appendChild(messageElement);

    // স্ক্রল নিচে নিয়ে যাওয়া
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Enter কী চেপে মেসেজ পাঠানোর সুবিধা
document.getElementById("userInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

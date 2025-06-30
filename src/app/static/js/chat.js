document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatBox = document.getElementById('chat-box');

    function showLoading() {
        // Disabled user input
        document.getElementById('message-input').disabled = true;
        document.getElementById('send-button').disabled = true;

        const loadingDiv = document.createElement('div');
        loadingDiv.id = "loading";
        loadingDiv.className = 'message bot';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.textContent = '🤖';

        const textDiv = document.createElement('div');
        textDiv.className = 'text';
        textDiv.textContent = 'The chatbot is thinking...';

        loadingDiv.appendChild(avatarDiv);
        loadingDiv.appendChild(textDiv);

        chatBox.appendChild(loadingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function hideLoading() {
        document.getElementById('message-input').disabled = false;
        document.getElementById('send-button').disabled = false;

        const loadingDiv = document.getElementById("loading");
        if (loadingDiv) loadingDiv.remove();
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const message = messageInput.value.trim();
        if (!message) return;

        appendMessage(message, 'message user');
        messageInput.value = '';
        showLoading();

        try {
            const response = await fetch('/api/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: `message=${encodeURIComponent(message)}`
            });

            const data = await response.json();

            if (!response.ok || data.status === "error") {
                appendMessage(("Error: " + data.response) || "Unknown error...", 'message error');
                throw new Error(data);
            }

            appendMessage(data.response, 'message bot');
        } catch (Erreur) {
            //
        } finally {
            hideLoading();
        }
    });

    function appendMessage(text, cssClass) {
        const messageDiv = document.createElement('div');
        messageDiv.className = cssClass;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar';
        avatarDiv.textContent = cssClass.includes('user') ? '👤' : '🤖';

        const textDiv = document.createElement('div');
        textDiv.className = 'text';
        textDiv.textContent = text;

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(textDiv);

        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});
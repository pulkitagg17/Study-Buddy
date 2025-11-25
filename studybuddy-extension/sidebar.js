document.addEventListener('DOMContentLoaded', async () => {
    // --- State Management ---
    let authToken = null;
    let currentSessionId = null;
    let currentMode = 'interviewer';

    // --- DOM Elements ---
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authError = document.getElementById('auth-error');
    const chatContainer = document.getElementById('chat-container');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    const hintsContainer = document.getElementById('hints-container');
    const dynamicHintBtn = document.getElementById('dynamic-hint-btn');
    let currentHintLevel = 1;

    // --- Auth Logic ---

    // Check for existing token
    const storage = await chrome.storage.local.get(['authToken']);
    if (storage.authToken) {
        authToken = storage.authToken;
        showApp();
    } else {
        showAuth();
    }

    function showAuth() {
        authScreen.style.display = 'flex';
        mainApp.style.display = 'none';
    }

    function showApp() {
        authScreen.style.display = 'none';
        mainApp.style.display = 'flex';
        startSession(currentMode);
    }

    // Toggle Login/Register
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authError.textContent = '';
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        authError.textContent = '';
    });

    // Login Handler
    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const data = await API.login(email, password);
            authToken = data.token;
            await chrome.storage.local.set({ authToken });
            showApp();
        } catch (err) {
            authError.textContent = err.message;
        }
    });

    // Register Handler
    document.getElementById('register-btn').addEventListener('click', async () => {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            await API.register(email, password, name);
            // Auto login after register
            const data = await API.login(email, password);
            authToken = data.token;
            await chrome.storage.local.set({ authToken });
            showApp();
        } catch (err) {
            authError.textContent = err.message;
        }
    });

    // Logout Handler
    logoutBtn.addEventListener('click', async () => {
        authToken = null;
        currentSessionId = null;
        await chrome.storage.local.remove(['authToken']);
        showAuth();
    });

    // --- Chat Logic ---

    async function startSession(mode) {
        try {
            currentHintLevel = 1;
            if (dynamicHintBtn) {
                dynamicHintBtn.textContent = "💡 Get Hint 1";
                dynamicHintBtn.disabled = false;
            }

            let problemContext = { title: "General Discussion", description: "No specific problem context." };

            if (mode === 'interviewer') {
                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

                    if (tab?.id) {
                        try {
                            // Try to communicate first
                            const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_PROBLEM_CONTEXT" });
                            if (response) {
                                problemContext = {
                                    title: response.title || "Unknown Problem",
                                    description: response.description || "No description available."
                                };
                            }
                        } catch (msgError) {
                            // If communication fails, script might not be injected. Inject it now.
                            console.log("Content script not ready, injecting...", msgError);
                            await chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                files: ['contentScript.js']
                            });

                            // Wait a bit for script to initialize
                            await new Promise(resolve => setTimeout(resolve, 500));

                            // Retry communication
                            const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_PROBLEM_CONTEXT" });
                            if (response) {
                                problemContext = {
                                    title: response.title || "Unknown Problem",
                                    description: response.description || "No description available."
                                };
                            }
                        }
                    }
                } catch (e) {
                    console.log("Could not fetch context after retry:", e);
                }
            }

            const data = await API.startSession(authToken, mode, problemContext.title, problemContext.description);
            currentSessionId = data.sessionId;

            const messages = chatContainer.querySelectorAll('.message');
            messages.forEach(msg => msg.remove());

            addMessage(`Started ${mode} session for: ${problemContext.title}`, 'ai');

            // Show hints for interviewer mode
            if (mode === 'interviewer') {
                hintsContainer.style.display = 'flex';
            } else {
                hintsContainer.style.display = 'none';
            }
        } catch (err) {
            console.error(err);
            if (err.message && err.message.includes('token')) {
                logoutBtn.click();
            } else {
                addMessage("Error starting session. Please try again.", 'ai');
            }
        }
    }

    function parseMarkdown(text) {
        // 1. Escape HTML (basic) to prevent XSS from user input, though we trust AI mostly.
        let html = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // 2. Code Blocks (```code```)
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code>${code.trim()}</code></pre>`;
        });

        // 3. Inline Code (`code`)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // 4. Bold (**text**)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 5. Italic (*text*)
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // 6. Paragraphs (Double newline)
        html = html.split(/\n\n+/).map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('');

        return html;
    }

    function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        contentDiv.innerHTML = parseMarkdown(text);

        messageDiv.appendChild(contentDiv);
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return messageDiv;
    }

    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';

        const loadingMsg = addMessage("Thinking...", 'ai');

        try {
            const data = await API.sendMessage(authToken, currentSessionId, text);
            loadingMsg.remove();

            // Check for session completion
            if (data.reply.includes('[SESSION_COMPLETED]')) {
                const cleanReply = data.reply.replace('[SESSION_COMPLETED]', '').trim();
                addMessage(cleanReply, 'ai');
                addMessage("🎉 Session Completed! Great job!", 'ai');
                // Optional: Disable input or show summary
            } else {
                addMessage(data.reply, 'ai');
            }
        } catch (err) {
            loadingMsg.remove();
            addMessage('Error sending message. Please try again.', 'ai');
            console.error(err);
        }
    }

    // Dynamic Hint Handler
    if (dynamicHintBtn) {
        dynamicHintBtn.addEventListener('click', async () => {
            if (currentHintLevel > 4) return;

            try {
                if (currentHintLevel <= 3) {
                    addMessage("Please give me a hint.", 'user');
                    const loadingMsg = addMessage("Thinking...", 'ai');

                    const data = await API.getHint(authToken, currentSessionId, currentHintLevel);
                    loadingMsg.remove();

                    addMessage(`Hint Level ${currentHintLevel}: ${data.hint}`, 'ai');

                    currentHintLevel++;

                    if (currentHintLevel <= 3) {
                        dynamicHintBtn.textContent = `💡 Get Hint ${currentHintLevel}`;
                    } else {
                        dynamicHintBtn.textContent = `🚀 Reveal Solution`;
                    }
                } else {
                    // Level 4: Reveal Solution
                    addMessage("I give up. Please reveal the solution.", 'user');
                    const loadingMsg = addMessage("Thinking...", 'ai');

                    const data = await API.revealSolution(authToken, currentSessionId);
                    loadingMsg.remove();

                    addMessage(`Solution: ${data.solution}`, 'ai');
                    dynamicHintBtn.textContent = "Session Ended";
                    dynamicHintBtn.disabled = true;
                    currentHintLevel++;
                }
            } catch (err) {
                console.error(err);
                addMessage("Failed to get hint.", 'ai');
            }
        });
    }

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // --- Tab Switching ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');

            currentMode = targetId;
            startSession(currentMode);
        });
    });
});

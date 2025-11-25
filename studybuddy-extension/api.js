const API_BASE_URL = 'http://localhost:4000';

const API = {
    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }
        return response.json();
    },

    async register(email, password, name) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }
        return response.json();
    },

    async startSession(token, mode, problemTitle = "General", problemText = "General Discussion") {
        const response = await fetch(`${API_BASE_URL}/session/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ mode, problemTitle, problemText })
        });
        if (!response.ok) throw new Error('Failed to start session');
        return response.json();
    },

    async sendMessage(token, sessionId, message) {
        const response = await fetch(`${API_BASE_URL}/session/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId, message })
        });
        if (!response.ok) throw new Error('Failed to send message');
        return response.json();
    },

    async getHint(token, sessionId, level) {
        const response = await fetch(`${API_BASE_URL}/session/hint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId, level })
        });
        if (!response.ok) throw new Error('Failed to get hint');
        return response.json();
    },

    async revealSolution(token, sessionId) {
        const response = await fetch(`${API_BASE_URL}/session/reveal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId })
        });
        if (!response.ok) throw new Error('Failed to reveal solution');
        return response.json();
    }
};

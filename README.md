# Study Buddy

AI-powered study assistant with browser extension and backend API for interview practice and learning support.

## Architecture

```
Browser Extension (Chrome)
    ↓
Express API Server (Node.js)
    ↓
MongoDB + Google Gemini AI
```

## Tech Stack

- Frontend: Chrome Extension (Manifest V3)
- Backend: Node.js, Express, TypeScript
- Database: MongoDB with Mongoose
- AI: Google Gemini API
- Auth: JWT, bcrypt

## Key Features

- User authentication and session management
- AI-powered interview and mentoring modes
- Customizable hint levels and motivation settings
- Real-time chat sessions with message history
- Sidebar integration for seamless study workflow

## Run Locally

Backend:
```
cd backend
npm install
npm run dev
```

Extension:
```
Load studybuddy-extension/ in Chrome developer mode
```

## Project Structure

```
backend/
├── src/
│   ├── config/db.ts
│   ├── middleware/auth.ts
│   ├── models/Session.ts, User.ts
│   ├── routes/auth.ts, session.ts, user.ts
│   └── services/gemini.ts, hints.ts, prompt.ts
studybuddy-extension/
├── manifest.json
├── popup.html, sidebar.html
├── background.js, popup.js, sidebar.js
└── contentScript.js
```
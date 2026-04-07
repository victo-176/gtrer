# HACK://TERMINAL

A hacker-style anonymous real-time messaging platform with admin controls.

## Features
- 🖥️ Terminal UI with neon-green aesthetic, glitch animations
- 👤 Random username generation (e.g., ghost_042)
- 💬 Real-time global chat & DMs via WebSockets
- 🎖️ Rank system (Initiate → Hacker → Elite)
- ✅ Task assignment & point rewards
- 🛡️ Admin panel with full user/message/report management
- 🔐 Secure JWT authentication, rate limiting

## Tech Stack
- Backend: Node.js, Express, Socket.io, MongoDB, JWT
- Frontend: Vanilla JS, CSS (terminal theme)

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env   # edit with your MongoDB URI and secrets
npm run dev

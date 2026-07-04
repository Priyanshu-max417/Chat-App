# ChatFlow — Real-Time Chat Application

A full-stack real-time chat app with one-to-one and group messaging, online presence, typing indicators, file sharing, browser notifications, read receipts, AES message encryption, and WebRTC voice/video calls.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, React Router, Socket.IO Client |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB, Mongoose |
| Media | Cloudinary |
| Real-time calls | WebRTC (STUN) |

## Features

- **One-to-one chat** — Search users and start direct conversations
- **Group chat** — Create groups with multiple members
- **Online/offline status** — Live presence via Socket.IO
- **Typing indicator** — See when others are typing
- **Image/file sharing** — Upload to Cloudinary (configure credentials)
- **Notifications** — Browser push when tab is in background
- **Read receipts** — Single/double check marks on sent messages
- **Message encryption** — AES-GCM encryption in the browser (toggle in UI)
- **Voice/video calls** — WebRTC peer calls in direct chats

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) running locally or Atlas URI
- [Cloudinary](https://cloudinary.com/) account (optional, for file uploads)

## Setup

### 1. Server

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Cloudinary keys
npm install
npm run dev
```

Server runs at **http://localhost:5000**

### 2. Client

```bash
cd client
npm install
npm run dev
```

Client runs at **http://localhost:5173**

### Environment variables

**server/.env**

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for auth tokens |
| `CLIENT_URL` | Frontend URL for CORS |
| `CLOUDINARY_*` | Cloudinary credentials for uploads |

**client/.env** (optional)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL (default `/api` via proxy) |
| `VITE_SOCKET_URL` | Socket.IO server (default `http://localhost:5000`) |

## Usage

1. Register two accounts (use two browsers or incognito).
2. Search for the other user in the sidebar and start a chat.
3. Toggle **encryption** to send AES-encrypted text messages.
4. Use **📎** to share images or files (requires Cloudinary).
5. Use **📞** / **📹** for voice or video calls in direct chats.
6. Allow **notifications** when prompted for background alerts.

## Project Structure

```
├── client/          # React frontend
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       └── utils/
└── server/          # Express + Socket.IO API
    ├── config/
    ├── models/
    ├── routes/
    └── socket/
```

## Notes

- **Encryption**: Keys are stored in `localStorage` per browser. Messages are encrypted client-side before sending; the server stores ciphertext only.
- **WebRTC**: Uses public Google STUN servers. For production behind strict NATs, add a TURN server.
- **Cloudinary**: Without credentials, text chat works but file uploads return a configuration error.

## License

ISC

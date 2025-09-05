CONNECT-RIGHT 🎥

A real-time video conferencing platform built with WebRTC, Socket.IO, and React.

🚀 Tech Stack

Frontend: React, Material UI, CSS
Backend: Node.js, Express, Socket.IO, Bcrypt, JWT
Database: MongoDB (SQL planned for production)
Protocol: WebRTC (UDP-based, real-time communication)

⚡ Features

🔐 User Authentication (Sign Up / Login with JWT)

💬 Real-time communication using WebRTC + Socket.IO

🎥 Video & Audio Conferencing with STUN server support

📡 Peer-to-Peer media exchange with fallback to relay (TURN)

🔑 Secure with DTLS + SRTP (end-to-end encryption)

📜 Meeting history and user management stored in database

🛠️ How It Works

Signaling – Clients exchange SDP (media info) + ICE candidates via Socket.IO server.

NAT Traversal – STUN helps peers discover their public IP. TURN server relays if direct P2P fails.

Security – All streams encrypted with DTLS + SRTP.

Media & Data Channels –

RTP/SRTP for audio/video

RTCDataChannel for chat, file sharing, etc.

🏗️ Project Setup
Backend
cd backend
npm install
npm run dev

Frontend
cd frontend
npm install
npm run dev

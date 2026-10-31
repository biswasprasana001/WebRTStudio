# WebRTStudio ⚡

> An ultra-lightweight, zero-cost, MIT-licensed collaborative studio powered by Preact, Vite, and native WebRTC.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![RAM Usage](https://img.shields.io/badge/Server%20RAM-%3C15MB-success.svg)](server.js)
[![Bundle Size](https://img.shields.io/badge/Client%20Bundle-18.5KB%20gzip-blue.svg)](package.json)
[![Zero Cost](https://img.shields.io/badge/Hosting%20Cost-%240.00%2Fmo-brightgreen.svg)](#deployment)

---

## 💡 How It Works (Simple Intuition)

Traditional collaborative platforms route all your video, keystrokes, and whiteboard drawings through heavy databases and cloud servers. That results in high server bills, high memory usage, and slow cold-starts.

**WebRTStudio does it differently:**
1. **The Server is Just a Matchmaker**: When two people join a room, the lightweight server (~12MB RAM) introduces them by exchanging connection signals (WebRTC SDP & ICE candidates).
2. **Direct Browser-to-Browser**: Once introduced, video, audio, live code changes, whiteboard strokes, and chat messages travel **directly between peers** using WebRTC Media and `RTCDataChannel`.
3. **Zero Database, Zero Passwords**: Rooms live only while you use them. There are no passwords to remember, no databases to spin up, and no 50-second delays.

---

## ✨ Features

- 💻 **Multi-Language Collaborative Studio**: Real-time synchronized coding across 16 programming languages (HTML, CSS, JavaScript, TypeScript, Python, C++, C, Rust, Go, Java, Bash, SQL, PHP, Ruby, Markdown, JSON).
- ⚡ **Integrated Terminal & Cloud Sandbox**: Execute code securely via free cloud sandboxing (Wandbox) with instant stdout/stderr display, exit status codes, and execution duration timers.
- 🚀 **Instant Execution Cache & Anti-Abuse**: 0ms memoized execution replay on repeat runs and a 3-second cooldown guardrail to prevent spam.
- ⌨️ **Developer Productivity**: Native Tab key 2-space indentation and `Ctrl + Enter` (or `Cmd + Enter`) instant run shortcut.
- 🔲 **Adaptive 3-Way & 2-Way Split View**: Seamless 33.3% equal distribution (Editor, Live Preview, Whiteboard) with dynamic preview toggling (`Preview: ON/OFF`).
- 🛡️ **Responsive Desktop Safeguard**: Built-in 1024px minimum screen protection ensuring ample workspace for professional pair programming.
- 🎨 **Vector Whiteboard**: Smooth collaborative drawing board syncing vector coordinate strokes directly over data channels (~30 bytes per stroke instead of heavy base64 images).
- 📹 **Audio & Video Call**: High-definition peer-to-peer WebRTC video with microphone mute and camera toggles.
- 🖥️ **Screen Sharing**: One-click screen broadcasting to all peers via `getDisplayMedia`.
- 💬 **Instant P2P Chat**: Direct peer-to-peer text messaging with timestamps, sender badges, and unread counter.
- 🔗 **Frictionless Rooms**: Share a direct link (`?room=your-room-name`) for instant worldwide communication.

---

## 📊 Architecture & Performance

| Metric | Legacy Stack (v1) | WebRTStudio 2.0 (New) | Improvement |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Monaco (~30MB JS) | Preact + Vite (~3KB runtime) | **95% smaller** |
| **Total Client Bundle** | ~30 MB JS/CSS bundle | **18.5 KB gzip total** (15.4KB JS) | **99.9% smaller** |
| **Production Build Time** | 30s - 60s (Webpack/Monaco) | **~235 ms (Vite)** | **100x faster** |
| **Server Runtime** | Express + Mongoose + Mongo Atlas | Native HTTP + `ws` (Zero DB) | **90% less RAM** |
| **Server Memory** | ~120 MB RAM | **~12 MB RAM** | **10x lighter** |
| **Whiteboard Sync** | Base64 PNG snapshots (~500KB) | Vector coordinates (~30 bytes) | **99.9% less bandwidth** |
| **Code Execution Rerun** | Full server compilation (1s–3s) | **0 ms (Memoized Cache)** | **Instant replay** |
| **Language Ecosystem** | Client-only HTML/CSS/JS | **16 full-stack & systems langs** | **Polyglot studio** |
| **Startup Delay** | 50s+ cold starts (Render sleep) | **< 100ms instant start** | **500x faster** |
| **Hosting Cost** | Requires database tier | **$0.00 / month forever** | **100% Free** |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (tested up to Node 24)

### 1. Clone & Install
```bash
git clone https://github.com/biswasprasana001/WebRTStudio.git
cd WebRTStudio
npm install
```

### 2. Development Mode
Run the Vite development server with hot-module reloading and WebSocket proxy:
```bash
# Terminal 1: Start signaling server
npm run dev:server

# Terminal 2: Start Vite client
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build & Run
Build the optimized static assets and run the unified single-port server:
```bash
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Quality Engineering (QE) Verification
Run automated tests covering signaling, protocol contracts, and browser UI layout verification:
```bash
# Run signaling handshake unit test
npm test

# Run core QE regression test suite (isolation, protocol contracts, disconnects)
npm run test:qe

# Run headless browser automated UI verification (split layouts & screen safeguards)
npm run test:qe:ui
```

---

## 🌐 Deployment (100% Free)

Because WebRTStudio requires **no external database** and consumes less than **15MB of RAM**, it can run for free on any platform:

### Option A: Render (Web Service)
1. Fork or push this repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`
5. Free tier: 100% free with instant deployment.

### Option B: Railway / Fly.io / Glitch
- Simply deploy using `npm start`. Set `PORT` environment variable if desired.

### Option C: Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📜 Technical Notes & Known Limits

- **WebRTC Mesh**: Peer-to-peer mesh WebRTC connects each peer directly to other peers in the room. This provides the lowest latency and zero server media bandwidth. It is optimal for 2–4 peers.
- *Scaling Limit*: For large video conferences (>6 simultaneous active video feeds), an SFU (Selective Forwarding Unit) like LiveKit or Mediasoup can be plugged in.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Serve static production files with SPA fallback
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/ws')) return; // Handled by WebSocket server

  const urlPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(DIST_DIR, 'index.html'); // SPA fallback
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px"><h2>WebRTStudio</h2><p>Development server running. In dev mode, run <code>npm run dev</code> or build with <code>npm run build</code>.</p></body></html>');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

// Ephemeral in-memory rooms: roomId -> Map<peerId, WebSocket>
// shortcut: in-memory rooms, upgrade to Redis adapter if scaling across multiple server instances
const rooms = new Map();

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws) => {
  let currentRoom = null;
  let currentPeer = null;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'join') {
        currentRoom = msg.roomId;
        currentPeer = msg.peerId;

        if (!rooms.has(currentRoom)) rooms.set(currentRoom, new Map());
        const roomPeers = rooms.get(currentRoom);

        // Tell existing peers in room about new peer
        for (const [peerId, client] of roomPeers) {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'peer-joined', peerId: currentPeer }));
          }
        }

        // Send list of existing peers to the newly joined peer
        ws.send(JSON.stringify({
          type: 'peers-in-room',
          peers: Array.from(roomPeers.keys())
        }));

        roomPeers.set(currentPeer, ws);
      } else if (msg.type === 'signal') {
        const roomPeers = rooms.get(currentRoom);
        if (roomPeers && roomPeers.has(msg.to)) {
          const targetWs = roomPeers.get(msg.to);
          if (targetWs.readyState === 1) {
            targetWs.send(JSON.stringify({
              type: 'signal',
              from: currentPeer,
              data: msg.data
            }));
          }
        }
      }
    } catch (e) {
      console.error('Signaling error:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoom && currentPeer && rooms.has(currentRoom)) {
      const roomPeers = rooms.get(currentRoom);
      roomPeers.delete(currentPeer);
      for (const [, client] of roomPeers) {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'peer-left', peerId: currentPeer }));
        }
      }
      if (roomPeers.size === 0) rooms.delete(currentRoom);
    }
  });
});

server.listen(PORT, () => {
  console.log(`WebRTStudio server listening on port ${PORT}`);
});

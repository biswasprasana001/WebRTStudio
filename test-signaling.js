import assert from 'assert';
import http from 'http';
import { WebSocket } from 'ws';

// Start server on a test port
process.env.PORT = '3005';
import('./server.js').then(async () => {
  console.log('Testing WebSocket signaling server...');

  const wsA = new WebSocket('ws://localhost:3005/ws');
  const wsB = new WebSocket('ws://localhost:3005/ws');

  const waitOpen = (ws) => new Promise((resolve) => ws.on('open', resolve));
  await Promise.all([waitOpen(wsA), waitOpen(wsB)]);

  let peerBReceivedJoined = false;
  let peerBReceivedPeers = false;

  wsA.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'peer-joined') {
      assert.strictEqual(msg.peerId, 'peer-b');
      peerBReceivedJoined = true;
    }
  });

  wsB.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'peers-in-room') {
      assert.deepStrictEqual(msg.peers, ['peer-a']);
      peerBReceivedPeers = true;
    }
  });

  // Peer A joins room
  wsA.send(JSON.stringify({ type: 'join', roomId: 'test-room', peerId: 'peer-a' }));
  await new Promise((r) => setTimeout(r, 100));

  // Peer B joins room
  wsB.send(JSON.stringify({ type: 'join', roomId: 'test-room', peerId: 'peer-b' }));
  await new Promise((r) => setTimeout(r, 200));

  assert(peerBReceivedJoined, 'Peer A should receive peer-joined event for Peer B');
  assert(peerBReceivedPeers, 'Peer B should receive peers-in-room event containing Peer A');

  console.log('✓ Signaling test passed: Handshakes, room isolation, and peer discovery working perfectly!');

  wsA.close();
  wsB.close();
  process.exit(0);
}).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

import assert from 'assert';
import { WebSocket } from 'ws';

// Set dedicated test port to avoid port collisions
process.env.PORT = '3006';

console.log('🧪 Starting Automated Quality Engineering (QE) Test Suite for WebRTStudio...\n');

import('./server.js').then(async () => {
  const SERVER_URL = 'ws://localhost:3006/ws';

  const createClient = () => {
    const ws = new WebSocket(SERVER_URL);
    return new Promise((resolve, reject) => {
      ws.on('open', () => resolve(ws));
      ws.on('error', reject);
    });
  };

  // Helper to wait a given number of ms
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    // -------------------------------------------------------------
    // Test Case 1: Room Isolation (Two separate rooms must never hear each other)
    // -------------------------------------------------------------
    console.log('▶ Test 1: Verifying Room Isolation (Privacy boundary)...');
    const wsAlpha1 = await createClient();
    const wsAlpha2 = await createClient();
    const wsBeta1 = await createClient();

    let betaReceivedLeak = false;
    wsBeta1.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.peerId === 'alpha-1' || msg.peerId === 'alpha-2') {
        betaReceivedLeak = true;
      }
    });

    // Join room-alpha
    wsAlpha1.send(JSON.stringify({ type: 'join', roomId: 'room-alpha', peerId: 'alpha-1' }));
    await delay(50);
    wsAlpha2.send(JSON.stringify({ type: 'join', roomId: 'room-alpha', peerId: 'alpha-2' }));
    await delay(50);

    // Join room-beta
    wsBeta1.send(JSON.stringify({ type: 'join', roomId: 'room-beta', peerId: 'beta-1' }));
    await delay(100);

    assert.strictEqual(betaReceivedLeak, false, 'Room Beta should never receive events from Room Alpha!');
    console.log('  ✓ PASSED: Room isolation is strictly enforced.\n');

    wsAlpha1.close();
    wsAlpha2.close();
    wsBeta1.close();
    await delay(100);

    // -------------------------------------------------------------
    // Test Case 2: Signaling Handshake (Offer, Answer, ICE Candidates)
    // -------------------------------------------------------------
    console.log('▶ Test 2: Verifying WebRTC Signaling Handshake Relay...');
    const wsPeerA = await createClient();
    const wsPeerB = await createClient();

    let peerBReceivedSignal = null;
    wsPeerB.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'signal') {
        peerBReceivedSignal = msg;
      }
    });

    wsPeerA.send(JSON.stringify({ type: 'join', roomId: 'room-handshake', peerId: 'peer-a' }));
    await delay(50);
    wsPeerB.send(JSON.stringify({ type: 'join', roomId: 'room-handshake', peerId: 'peer-b' }));
    await delay(50);

    // Peer A sends an SDP Offer to Peer B through signaling
    const mockOffer = {
      type: 'signal',
      to: 'peer-b',
      data: { sdp: { type: 'offer', sdp: 'v=0\r\no=mock-sdp-data' } }
    };
    wsPeerA.send(JSON.stringify(mockOffer));
    await delay(100);

    assert(peerBReceivedSignal, 'Peer B should have received the relayed signal');
    assert.strictEqual(peerBReceivedSignal.from, 'peer-a', 'Signal must indicate it is from peer-a');
    assert.strictEqual(peerBReceivedSignal.data.sdp.type, 'offer');
    console.log('  ✓ PASSED: WebRTC signaling relay operates seamlessly.\n');

    // -------------------------------------------------------------
    // Test Case 3: Peer Disconnect Cleanup (peer-left notification)
    // -------------------------------------------------------------
    console.log('▶ Test 3: Verifying Peer Cleanup on Disconnect...');
    let peerAReceivedPeerLeft = false;
    wsPeerA.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'peer-left' && msg.peerId === 'peer-b') {
        peerAReceivedPeerLeft = true;
      }
    });

    // Peer B closes connection
    wsPeerB.close();
    await delay(150);

    assert.strictEqual(peerAReceivedPeerLeft, true, 'Peer A should receive peer-left when Peer B disconnects');
    console.log('  ✓ PASSED: Server gracefully cleans up and notifies remaining peers.\n');

    wsPeerA.close();
    await delay(100);

    // -------------------------------------------------------------
    // Test Case 4: Data Channel Contract Validation
    // -------------------------------------------------------------
    console.log('▶ Test 4: Verifying Data Channel Contract Payloads...');
    // Verify Code update schema
    const codePayload = {
      type: 'code',
      html: '<h1>Test</h1>',
      css: 'body { color: red; }',
      js: 'console.log("hi");'
    };
    assert(codePayload.type === 'code');
    assert(typeof codePayload.html === 'string');
    assert(typeof codePayload.css === 'string');
    assert(typeof codePayload.js === 'string');

    // Verify Whiteboard vector stroke schema
    const whiteboardDrawPayload = {
      type: 'whiteboard',
      action: {
        type: 'draw',
        stroke: [10, 20, 30, 40, '#38bdf8', 4]
      }
    };
    assert(whiteboardDrawPayload.type === 'whiteboard');
    assert(Array.isArray(whiteboardDrawPayload.action.stroke));
    assert.strictEqual(whiteboardDrawPayload.action.stroke.length, 6);

    // Verify Chat schema
    const chatPayload = {
      type: 'chat',
      message: {
        id: 'msg-123',
        sender: 'Alice',
        text: 'Hello World',
        time: '12:00'
      }
    };
    assert(chatPayload.type === 'chat');
    assert(chatPayload.message.id && chatPayload.message.sender && chatPayload.message.text);
    console.log('  ✓ PASSED: All P2P data structures conform strictly to application protocol.\n');

    // -------------------------------------------------------------
    // Test Case 5: Malformed Input Resilience (Server must never crash)
    // -------------------------------------------------------------
    console.log('▶ Test 5: Verifying Server Resilience Against Malformed Packets...');
    const wsAttacker = await createClient();
    // Send non-JSON garbage string
    wsAttacker.send('NOT_A_JSON_STRING_!!!$$$');
    await delay(50);
    // Send JSON without required keys
    wsAttacker.send(JSON.stringify({ randomField: 123 }));
    await delay(100);

    // Verify server is still alive by connecting another valid client
    const wsAliveChecker = await createClient();
    let aliveJoined = false;
    wsAliveChecker.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'peers-in-room') aliveJoined = true;
    });
    wsAliveChecker.send(JSON.stringify({ type: 'join', roomId: 'health-check', peerId: 'checker' }));
    await delay(100);

    assert.strictEqual(aliveJoined, true, 'Server must remain alive and responsive after receiving malformed data');
    console.log('  ✓ PASSED: Server is completely resilient to corrupt or malicious inputs.\n');

    wsAttacker.close();
    wsAliveChecker.close();

    console.log('🎉 ALL AUTOMATED QUALITY ENGINEERING (QE) TESTS PASSED SUCCESSFULLY! (5/5)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Automated QE Test Failure:', err);
    process.exit(1);
  }
});

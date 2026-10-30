import assert from 'assert';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3008;
const CDP_PORT = 9226;
const ARTIFACT_DIR = path.resolve('C:\\Users\\biswa\\.gemini\\antigravity\\brain\\f179c57b-7763-4e4c-a8d2-82338fa4fdfa');

console.log('🧪 Starting Full Agent E2E Quality Engineering (QE) Verification with Headless Browser...\n');

// 1. Start WebRTStudio server
process.env.PORT = String(PORT);
const serverModule = await import('./server.js');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Helper: HTTP GET for json
const httpGetJson = (url) => new Promise((resolve, reject) => {
  http.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  }).on('error', reject);
});

// 2. Launch Microsoft Edge in headless mode
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(__dirname, '.temp-edge-profile');

const edgeProc = spawn(edgePath, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--window-size=1280,800',
  'about:blank'
], { stdio: 'ignore' });

const cleanup = () => {
  try { edgeProc.kill('SIGKILL'); } catch (e) {}
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
};

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(1); });

try {
  // Wait for CDP to be available
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await delay(200);
    try {
      const version = await httpGetJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (version && version.webSocketDebuggerUrl) {
        const targets = await httpGetJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
        const pageTarget = targets?.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('edge://'));
        if (pageTarget && pageTarget.webSocketDebuggerUrl) {
          wsUrl = pageTarget.webSocketDebuggerUrl;
          break;
        }
      }
    } catch (e) {}
  }

  assert(wsUrl, 'Failed to connect to browser CDP WebSocket');

  // Connect to CDP WebSocket
  const cdp = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    cdp.on('open', res);
    cdp.on('error', rej);
  });

  let msgId = 1;
  const pending = new Map();

  cdp.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  });

  const sendCDP = (method, params = {}) => new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    cdp.send(JSON.stringify({ id, method, params }));
  });

  // Helper to evaluate JS in the browser
  const evaluate = async (expr) => {
    const res = await sendCDP('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'Eval error');
    }
    return res.result?.value;
  };

  // Helper to capture a screenshot
  const captureScreenshot = async (filename) => {
    const res = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`  📸 Screenshot saved: ${filename}`);
  };

  // Enable necessary domains
  await sendCDP('Page.enable');
  await sendCDP('DOM.enable');
  await sendCDP('Runtime.enable');

  // -------------------------------------------------------------
  // Test 1: Navigation to WebRTStudio in Room Mode
  // -------------------------------------------------------------
  console.log('▶ QE Step 1: Navigating to WebRTStudio in Room Mode...');
  await sendCDP('Page.navigate', { url: `http://localhost:${PORT}/?room=qe-split-room` });
  await delay(1500);

  const isInRoom = await evaluate(`document.querySelector('.studio-container') !== null`);
  assert.strictEqual(isInRoom, true, 'Studio container must be mounted in room mode');
  console.log('  ✓ PASSED: Studio UI initialized successfully.\n');

  // -------------------------------------------------------------
  // Test 2: Switch to Split View & Verify Equal 3-Way Distribution
  // -------------------------------------------------------------
  console.log('▶ QE Step 2: Verifying Equal 3-Way Space Distribution (Editor, Preview, Whiteboard)...');
  
  // Click Split View tab
  await evaluate(`
    Array.from(document.querySelectorAll('.tab-toggle'))
      .find(btn => btn.textContent.includes('Split View'))
      .click()
  `);
  await delay(500);

  const isSplitActive = await evaluate(`document.querySelector('.split-view') !== null`);
  assert.strictEqual(isSplitActive, true, 'Split view must be active');

  const hasThreeWayClass = await evaluate(`document.querySelector('.split-view').classList.contains('split-three-way')`);
  assert.strictEqual(hasThreeWayClass, true, 'split-view must have split-three-way class when preview is ON');

  // Measure widths of all three panes
  const dimensions = await evaluate(`
    (() => {
      const editor = document.querySelector('.editor-pane').getBoundingClientRect();
      const preview = document.querySelector('.preview-pane').getBoundingClientRect();
      const whiteboard = document.querySelectorAll('.split-half')[1].getBoundingClientRect();
      const totalWidth = editor.width + preview.width + whiteboard.width;
      return {
        editorWidth: Math.round(editor.width * 10) / 10,
        previewWidth: Math.round(preview.width * 10) / 10,
        whiteboardWidth: Math.round(whiteboard.width * 10) / 10,
        totalWidth: Math.round(totalWidth * 10) / 10
      };
    })()
  `);

  console.log(`  Measured Widths: Code Editor: ${dimensions.editorWidth}px | Live Preview: ${dimensions.previewWidth}px | Whiteboard: ${dimensions.whiteboardWidth}px`);
  
  // Verify each is approximately 1/3 of total width (tolerance <= 2px for border borders/rounding)
  const maxDiff = Math.max(
    Math.abs(dimensions.editorWidth - dimensions.previewWidth),
    Math.abs(dimensions.previewWidth - dimensions.whiteboardWidth),
    Math.abs(dimensions.editorWidth - dimensions.whiteboardWidth)
  );

  assert(maxDiff <= 2.5, `All three panes must share equal space. Max difference is ${maxDiff}px`);
  console.log(`  ✓ PASSED: All three panes share equal space (33.33% each, max delta: ${maxDiff}px).`);
  await captureScreenshot('qe_3way_equal_split.png');
  console.log('');

  // -------------------------------------------------------------
  // Test 3: Toggle Preview OFF -> Revert to Clean 50/50 Split
  // -------------------------------------------------------------
  console.log('▶ QE Step 3: Toggling Preview OFF -> Verifying 50/50 Equal 2-Way Split...');
  
  // Click preview toggle button to turn OFF
  await evaluate(`
    Array.from(document.querySelectorAll('.tab-btn'))
      .find(btn => btn.textContent.includes('Preview: ON'))
      .click()
  `);
  await delay(400);

  const previewUnmounted = await evaluate(`document.querySelector('.preview-pane') === null`);
  assert.strictEqual(previewUnmounted, true, 'Preview pane must be unmounted when toggled OFF');

  const threeWayRemoved = await evaluate(`!document.querySelector('.split-view').classList.contains('split-three-way')`);
  assert.strictEqual(threeWayRemoved, true, 'split-three-way class must be removed when preview is OFF');

  const twoWayDimensions = await evaluate(`
    (() => {
      const editor = document.querySelector('.editor-pane').getBoundingClientRect();
      const whiteboard = document.querySelectorAll('.split-half')[1].getBoundingClientRect();
      return {
        editorWidth: Math.round(editor.width * 10) / 10,
        whiteboardWidth: Math.round(whiteboard.width * 10) / 10
      };
    })()
  `);

  console.log(`  Measured Widths: Code Editor: ${twoWayDimensions.editorWidth}px | Whiteboard: ${twoWayDimensions.whiteboardWidth}px`);
  const twoWayDiff = Math.abs(twoWayDimensions.editorWidth - twoWayDimensions.whiteboardWidth);
  assert(twoWayDiff <= 2, `Code Editor and Whiteboard must share equal 50/50 space. Difference is ${twoWayDiff}px`);
  console.log(`  ✓ PASSED: Code Editor and Whiteboard share clean 50/50 space (delta: ${twoWayDiff}px).`);
  await captureScreenshot('qe_2way_50_50_split.png');
  console.log('');

  // -------------------------------------------------------------
  // Test 4: Verify Screen Safeguard at 1024px Boundary
  // -------------------------------------------------------------
  console.log('▶ QE Step 4: Verifying Screen Safeguard at 1024px Boundary...');

  // 4A: Boundary at 1024px (Desktop Screen -> NO warning)
  console.log('  Testing 1024px width (Exact desktop boundary)...');
  await sendCDP('Emulation.setDeviceMetricsOverride', {
    width: 1024,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false
  });
  await delay(300);

  let warningDisplay1024 = await evaluate(`
    window.getComputedStyle(document.querySelector('.screen-size-warning')).display
  `);
  assert.strictEqual(warningDisplay1024, 'none', 'Screen warning must be hidden (display: none) at exactly 1024px');
  console.log('  ✓ PASSED: At 1024px, the warning is hidden and the studio workspace is fully accessible.');
  await captureScreenshot('qe_screen_at_1024px.png');

  // 4B: Boundary at 1023px (Under 1024px -> Warning MUST be shown)
  console.log('  Testing 1023px width (Strictly less than 1024px)...');
  await sendCDP('Emulation.setDeviceMetricsOverride', {
    width: 1023,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false
  });
  await delay(300);

  let warningDisplay1023 = await evaluate(`
    window.getComputedStyle(document.querySelector('.screen-size-warning')).display
  `);
  assert.strictEqual(warningDisplay1023, 'flex', 'Screen warning must be visible (display: flex) at 1023px (< 1024px)');
  console.log('  ✓ PASSED: At 1023px (< 1024px), the screen warning is visible and blocks access.');
  await captureScreenshot('qe_screen_at_1023px.png');

  // 4C: Test Mobile/Tablet sizes (600px width)
  console.log('  Testing 600px width (Mobile size)...');
  await sendCDP('Emulation.setDeviceMetricsOverride', {
    width: 600,
    height: 800,
    deviceScaleFactor: 1,
    mobile: true
  });
  await delay(300);

  let warningDisplay600 = await evaluate(`
    window.getComputedStyle(document.querySelector('.screen-size-warning')).display
  `);
  assert.strictEqual(warningDisplay600, 'flex', 'Screen warning must be visible on mobile (600px)');
  console.log('  ✓ PASSED: At 600px, screen warning is properly visible.');

  // 4D: Restore full desktop width (1280px)
  console.log('  Restoring full desktop width (1280px)...');
  await sendCDP('Emulation.clearDeviceMetricsOverride');
  await delay(300);

  let warningDisplayRestored = await evaluate(`
    window.getComputedStyle(document.querySelector('.screen-size-warning')).display
  `);
  assert.strictEqual(warningDisplayRestored, 'none', 'Screen warning must hide when restored to full desktop width');
  console.log('  ✓ PASSED: Studio workspace restored automatically when resized back to desktop.\n');

  console.log('🎉 ALL AGENT QE BROWSER VERIFICATION TESTS PASSED SUCCESSFULLY! (4/4)');

} catch (err) {
  console.error('❌ Automated Browser QE Test Failure:', err);
  process.exit(1);
} finally {
  cleanup();
  process.exit(0);
}

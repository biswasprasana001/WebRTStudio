# 📋 WebRTStudio — Quality Engineering (QE) Test Handbook

> **Rule & Philosophy**: Explain everything in the simplest words possible. Build clear intuition for what is happening under the hood so any tester or engineer can verify the app with 100% confidence.

---

## 💡 The Big Picture: How WebRTStudio Works in Plain English

Imagine you and a friend want to work together in a room:
1. **The Lobby (Front Desk)**: You pick a name tag and write a room number on a whiteboard.
2. **The Signaling Server (The Matchmaker)**: A tiny lightweight server introduces your browser to your friend's browser by passing your contact cards (called SDP and ICE candidates).
3. **The WebRTC Mesh (The Direct Walkie-Talkie)**: Once introduced, the server steps out of the way! Your voices, video cameras, code edits, drawings, and chat messages fly **directly** between your computers over an invisible private wire. No database is storing your data.
4. **The Code Sandbox (The Safe Glass Box)**: When you write code, the browser waits until you pause typing (debouncing), then runs your code inside an isolated glass box (`<iframe>`). Even if your code has bugs or infinite loops, the main studio stays completely safe.

---

## 🗺️ Test Matrix Overview

| Suite | Feature Area | Analogy / Intuition | Key What-to-Watch |
| :--- | :--- | :--- | :--- |
| **Suite 1** | **Lobby & Room Joining** | Front Desk & Keycard | Instant room creation, copy link, URL sync |
| **Suite 2** | **Audio, Video & Screen Mesh** | Direct Walkie-Talkie & Cam | 0-lag camera feed, mic mute, screen share toggle |
| **Suite 3** | **Collaborative Code & Sandbox** | Shared Safe Scratchpad | 250ms debounced auto-run, live peer sync, JS clicks |
| **Suite 4** | **Vector Whiteboard** | Digital Chalkboard | Smooth lines, color/brush picks, instant P2P draw |
| **Suite 5** | **Text Chat** | Private Side Whispers | Fast delivery, timestamp, unread badge counter |
| **Suite 6** | **Layout Switching & Preview Toggle** | Rearranging Your Desk | 3-Way Equal Split, 50/50 Dual Split, Live Preview Toggle |
| **Suite 7** | **Edge Cases & Screen Safeguards** | Rough Seas & Small Screens | Camera blocked fallback, clean leave, 1024px desktop warning |
| **Suite 8** | **Multi-Language Studio & Terminal** | The Polyglot Workshop | 16 languages, Wandbox runner, 0ms cache replay, cooldown & Tab indent |

---

## 🧪 Detailed Step-by-Step Test Suites

### Suite 1: Getting In the Door (Lobby & Room Joining)

#### Test 1.1: Fresh Visit & Lobby Loading
* **Intuition**: When a user first opens the app without a link, we give them a random friendly username and a fresh room code so they don't have to think.
* **Steps**:
  1. Open your browser and navigate to `http://localhost:5174/`.
  2. Verify the screen shows the **⚡ WebRTStudio** header card.
  3. Look at the two input fields:
     - **Display Name**: Should be pre-filled with something like `Dev_742`.
     - **Room Identifier**: Should be pre-filled with something like `room-3k9a1`.
* **Expected Result**: Everything loads instantly with no errors in the browser console.

#### Test 1.2: Entering the Studio & URL Update
* **Intuition**: Clicking enter locks in your room and updates your browser address bar so you can bookmark or share it.
* **Steps**:
  1. Click the large white button: **🚀 Enter Studio**.
  2. Check the browser address bar.
* **Expected Result**:
  - The URL changes to include `?room=room-3k9a1`.
  - The lobby disappears and the studio workspace opens.
  - The header displays: `Room: room-3k9a1` and `🟢 1 Peer (You)`.

#### Test 1.3: Copying Room Invite Link
* **Intuition**: One-click sharing so you can invite a teammate without copying the URL manually.
* **Steps**:
  1. Click the room badge in the top-left (`📋 Copy Link`).
* **Expected Result**:
  - The button immediately says `✓ Copied!`.
  - After 2 seconds, it resets back to `📋 Copy Link`.
  - Pasting clipboard content gives the exact URL: `http://localhost:5174/?room=<your-room-id>`.

#### Test 1.4: Direct URL Join (Teammate Experience)
* **Intuition**: When a friend clicks your shared link, they bypass room name entry and go straight into the shared session.
* **Steps**:
  1. Open a second browser window (e.g., an Incognito window or different browser profile).
  2. Paste the invite URL and press Enter.
  3. Verify the room name is already filled in from the URL.
  4. Change username to `Bob` and click **🚀 Enter Studio**.
* **Expected Result**:
  - Both windows now show `🟢 2 Peers`.
  - The two browsers find each other and establish a direct connection within 1-2 seconds.

---

### Suite 2: The Direct Walkie-Talkie (Video, Audio & Screen Sharing)

#### Test 2.1: Camera and Audio Feed Verification
* **Intuition**: Each person should see their own video mirror and their friend's video stream right below the workspace.
* **Steps**:
  1. In Window 1 (Alice), verify the video dock at the bottom displays:
     - A card titled **You** showing your own webcam feed.
     - A card titled **Peer (p_...)** showing Bob's webcam feed.
  2. In Window 2 (Bob), verify the reverse.
* **Expected Result**: Video feeds move smoothly in real time without buffering or tearing.

#### Test 2.2: Microphone Mute Toggle
* **Intuition**: When you sneeze or type loudly, you want to mute yourself without cutting off the call.
* **Steps**:
  1. In Window 1, click the **🎤 Mic On** button.
* **Expected Result**:
  - The button turns red and text changes to **🔇 Muted**.
  - Alice's audio track is disabled. Bob can no longer hear Alice.
  - Clicking it again turns it back to **🎤 Mic On** and audio resumes immediately.

#### Test 2.3: Camera Privacy Toggle
* **Intuition**: Turning off your camera should stop sending video frames immediately while keeping your voice active.
* **Steps**:
  1. In Window 1, click the **📷 Cam On** button.
* **Expected Result**:
  - The button turns red and text changes to **🚫 Cam Off**.
  - In Window 2, Alice's video stream goes dark or freezes cleanly.
  - Clicking it again restores live video.

#### Test 2.4: Screen Sharing Switch
* **Intuition**: Seamlessly replacing your camera feed with your desktop window so you can demo slides or terminal output.
* **Steps**:
  1. In Window 1, click **🖥️ Share Screen**.
  2. Choose any application window or full screen in the browser picker and confirm.
* **Expected Result**:
  - Button switches to active blue: **🛑 Stop Share**.
  - Alice's video card title updates to **You (Sharing Screen)**.
  - Window 2 immediately sees Alice's shared screen instead of her camera.
  - Click **🛑 Stop Share**: The feed seamlessly flips back to Alice's webcam with zero re-connection drops.

---

### Suite 3: The Live Code Scratchpad (Editor & Isolated Sandbox)

#### Test 3.1: Live Editing & 250ms Auto-Run
* **Intuition**: As you type, the studio waits 250ms after your last keystroke (debounce) and then updates the preview. This prevents choppy lag while typing.
* **Steps**:
  1. Ensure you are on the **💻 Code Studio** tab.
  2. In the HTML editor, change `<h1>Welcome to WebRTStudio! 🚀</h1>` to `<h1>Testing 1-2-3! 🎯</h1>`.
  3. Wait a quarter of a second without clicking any button.
* **Expected Result**:
  - The **Live Preview** pane on the right refreshes automatically and displays `Testing 1-2-3! 🎯`.

#### Test 3.2: P2P Real-Time Code Sync
* **Intuition**: Changes you make should instantly appear on your teammate's screen through the P2P data channel with zero server delay.
* **Steps**:
  1. Position Window 1 and Window 2 side by side.
  2. In Window 1, switch to the **CSS** tab and change `background: #0f172a;` to `background: #14532d;` (green).
* **Expected Result**:
  - Window 2's editor updates to the CSS tab value automatically.
  - Both Window 1 and Window 2 preview panes update to the new green background.

#### Test 3.3: Interactive JavaScript Execution
* **Intuition**: The preview isn't just a static picture—it runs real JavaScript inside a secure sandbox.
* **Steps**:
  1. In the preview window, click the blue **Click Me** button.
* **Expected Result**:
  - The counter text changes from `0 clicks` to `1 clicks`, then `2 clicks`.
  - The button hover and click states work smoothly.

#### Test 3.4: Manual Run Button
* **Intuition**: If you want to force an immediate re-run (or re-trigger an animation).
* **Steps**:
  1. Click the **▶ Run Code** button in the editor header.
* **Expected Result**: The iframe preview reloads fresh.

---

### Suite 4: The Shared Digital Chalkboard (Whiteboard)

#### Test 4.1: Drawing on the Canvas
* **Intuition**: Freehand sketching for diagrams, wireframes, and architecture flowcharts.
* **Steps**:
  1. Click the **🎨 Whiteboard** button in the top navigation.
  2. Click and drag the mouse on the dark drawing area to draw a circle.
* **Expected Result**:
  - A crisp neon blue line appears smoothly following the cursor.
  - Zero lag, zero stutter.

#### Test 4.2: Color Picker and Brush Sizing
* **Intuition**: You can change your marker color and thickness on the fly.
* **Steps**:
  1. Click the **Color:** picker and pick bright yellow `#facc15`.
  2. Slide the **Size:** slider up to `12px`.
  3. Draw a second line.
* **Expected Result**:
  - The new line is yellow and noticeably thicker.
  - Previous drawings remain untouched.

#### Test 4.3: Real-Time Vector Broadcast
* **Intuition**: WebRTStudio broadcasts vector coordinates (start point, end point, color, width) which are tiny (~30 bytes each).
* **Steps**:
  1. Look at Window 2 while drawing in Window 1.
* **Expected Result**:
  - The strokes appear on Window 2's whiteboard almost instantaneously.

#### Test 4.4: Clear Canvas
* **Intuition**: Erasing the chalkboard clean for everyone in the room.
* **Steps**:
  1. Click the **🧹 Clear Board** button.
* **Expected Result**:
  - The canvas clears to black in Window 1.
  - Window 2's canvas clears at the exact same moment.

---

### Suite 5: The Side Whispers (Real-Time Text Chat)

#### Test 5.1: Sending and Receiving Chat
* **Intuition**: Fast text messages between peers with no database storage.
* **Steps**:
  1. In Window 1, find the chat panel on the right.
  2. Type `Hey Bob, can you review line 4?` and press Enter.
* **Expected Result**:
  - Window 1 shows the message on the right side in a dark blue bubble.
  - Window 2 immediately displays the message on the left side with sender name `Dev_...` and a time stamp (e.g. `12:45`).

#### Test 5.2: Unread Message Counter Badge
* **Intuition**: If you closed the chat sidebar to focus on coding, you should still see when your teammate messages you.
* **Steps**:
  1. In Window 2, click the **💬 Chat** button in the top header to collapse the chat sidebar.
  2. In Window 1, send another message: `Check this out!`.
* **Expected Result**:
  - In Window 2, the header button updates to show an unread count: `💬 Chat (2)`.
  - Clicking **💬 Chat** re-opens the sidebar and scrolls smoothly down to the latest message.

#### Test 5.3: Floating Overlay & Zero-Layout Shift
* **Intuition**: The chat must hover over the existing UI as a lightweight layer, never squeezing the code editor, whiteboard, or preview.
* **Steps**:
  1. Note the width of the code editor or preview pane while chat is open.
  2. Click the **✕** close button inside the chat header.
  3. Verify the chat disappears smoothly.
  4. Notice the workspace underneath: it did not jump, reflow, or reload.
  5. Click the top navbar **💬 Chat** button to reopen the overlay.
* **Expected Result**:
  - The chat overlay opens directly on top of the workspace.
  - The **✕** button closes the overlay immediately.
  - Workspace layout remains 100% stable with zero layout shifts.

---

### Suite 6: Rearranging Your Desk (Layout Modes & Preview Toggle)

#### Test 6.1: Code Studio Mode
* **Intuition**: Maximize screen space for code editing and previewing.
* **Steps**: Click **💻 Code Studio** in the top bar.
* **Expected Result**: The workspace fills with the two-pane code editor and live preview.

#### Test 6.2: Whiteboard Mode
* **Intuition**: Maximize screen space for full-screen drawing.
* **Steps**: Click **🎨 Whiteboard**.
* **Expected Result**: The canvas takes up the entire workspace. The canvas automatically resizes to fill the container without distorting existing drawings.

#### Test 6.3: Split View Mode & 3-Way Equal Distribution
* **Intuition**: For pairing sessions where you want to draw a diagram on the right while writing code on the left! When live preview is active, all three tools share the screen in a balanced 3-way split.
* **Steps**:
  1. Ensure you are editing a web file (HTML/CSS/JS) with preview active.
  2. Click **🔲 Split View** in the top navigation bar.
  3. Inspect the three columns: Code Editor, Live Preview, and Whiteboard.
* **Expected Result**:
  - The split view container adopts `.split-three-way`.
  - The screen divides equally into three columns (each approximately 33.3% of the total workspace width, delta <= 2.5px).
  - You can edit code, view live updates, and draw on the whiteboard simultaneously without clipping.
  - Remote peers receive both code and whiteboard updates in real time.

#### Test 6.4: Dynamic Live Preview Toggle
* **Intuition**: If you want to maximize your code editor and whiteboard space, you can turn off the preview pane with one click.
* **Steps**:
  1. While in **🔲 Split View**, find the **👁️ Preview: ON** button in the editor toolbar.
  2. Click **👁️ Preview: ON**.
  3. Inspect the screen layout.
  4. Click the button again (**👁️ Preview: OFF**).
* **Expected Result**:
  - Clicking turns the button to **👁️ Preview: OFF** and unmounts the preview pane.
  - The `.split-three-way` class is removed, smoothly transitioning the workspace to a clean 50/50 dual split (50% Code Editor, 50% Whiteboard).
  - Clicking again restores the preview pane and reinstates the balanced 3-way split.

---

### Suite 7: Rough Seas & Edge Cases (Failures, Exits & Safeguards)

#### Test 7.1: Clean Exit via Leave Button
* **Intuition**: Politely saying goodbye, closing connections, and heading back to the lobby.
* **Steps**:
  1. In Window 2 (Bob), click the **🚪 Leave** button in the header.
* **Expected Result**:
  - Window 2 smoothly returns to the Lobby screen with the room query parameter removed from the URL.
  - In Window 1 (Alice), Bob's video tile disappears immediately and the peer counter drops back to `🟢 1 Peer (You)`.

#### Test 7.2: Sudden Disconnect (Closing Window/Tab)
* **Intuition**: If a teammate loses power or accidentally closes their tab, the remaining peer shouldn't hang or crash.
* **Steps**:
  1. Have Bob rejoin the room.
  2. Close Bob's browser tab entirely.
* **Expected Result**:
  - The WebSocket server detects the socket closure within milliseconds.
  - Alice's browser receives `peer-left`, removes Bob's remote video card, and cleans up the peer connection with zero console errors.

#### Test 7.3: Camera / Microphone Permission Denied
* **Intuition**: If someone doesn't have a webcam or clicks "Block", the app should still work for coding and chat!
* **Steps**:
  1. In browser site settings, set **Camera** and **Microphone** permissions to **Block**.
  2. Refresh the page and click **🚀 Enter Studio**.
* **Expected Result**:
  - The application catches the permission rejection gracefully.
  - An empty media stream is created.
  - The app stays fully functional in **Data-Only mode**: the user can still edit code, draw, and chat with peers.

#### Test 7.4: Screen Size Safeguard (1024px Boundary)
* **Intuition**: WebRTStudio is built for serious desktop collaboration with multiple panes (editor, whiteboard, video dock). Small or cramped phone screens would break the experience, so we show a clear warning shield when the screen is under 1024px wide.
* **Steps**:
  1. In a desktop browser window, open DevTools and toggle Device Emulation.
  2. Set window width to `1024px`.
  3. Verify the screen is completely usable with no warning shield.
  4. Reduce window width by 1px to `1023px`.
  5. Verify the screen shield appears.
  6. Test mobile sizes (e.g. 600px width).
  7. Resize back to `>= 1024px`.
* **Expected Result**:
  - At `1024px` or wider, `.screen-size-warning` is hidden (`display: none`).
  - At `1023px` or narrower, `.screen-size-warning` appears as a full overlay (`display: flex`) with the message: `💻 PC / Desktop Screen Required`.
  - Restoring width `>= 1024px` instantly dismisses the overlay and restores normal access without reloading.

---

### Suite 8: The Polyglot Workshop (Multi-Language Studio & Terminal Sandbox)

#### Test 8.1: Multi-Language Switching
* **Intuition**: WebRTStudio supports 16 languages across web, compiled, and scripting ecosystems. Switching tabs lets you write in any language with starter templates ready.
* **Steps**:
  1. Ensure you are on the **💻 Code Studio** tab.
  2. Examine the language selector bar above the editor: `HTML`, `CSS`, `JS`, `PY`, `C++`, `C`, `RS`, `GO`, `JAVA`, `SQL`, `SH`, `TS`, `MD`, `JSON`, `PHP`, `RB`.
  3. Click on the `PY` tab.
* **Expected Result**:
  - The editor loads a clean Python starter script with `def greet(name): ...`.
  - For non-web languages, the live HTML preview pane automatically hides to maximize code editing area.
  - Your peer in Window 2 sees your selected language and edits sync in real time.

#### Test 8.2: Sandbox Execution & Terminal Output
* **Intuition**: Running code safely inside an isolated cloud sandbox (Wandbox) and viewing console output in an integrated terminal with zero local installations required.
* **Steps**:
  1. On the `PY` tab, click **▶ Run Code** or press `Ctrl + Enter` (or `Cmd + Enter`).
* **Expected Result**:
  - The run button updates to `⏳ Running...`.
  - The terminal panel opens below the editor.
  - Upon completion, the terminal displays:
    - Status badge: `Status: Exit 0` (green).
    - Runtime timer: `Duration: ~X.Xs`.
    - Console output showing:
      ```
      Hello, WebRTStudio Peer! 🚀
      Calculated squares: [1, 4, 9, 16, 25]
      ```

#### Test 8.3: Memoized Execution Cache (0ms Instant Replay)
* **Intuition**: If the code has not changed, rerunning it shouldn't waste time or hit the network. We instantly replay the cached results in 0 milliseconds!
* **Steps**:
  1. Without editing the code, click **▶ Run Code** again.
* **Expected Result**:
  - The terminal re-renders instantaneously with 0ms delay.
  - The timer badge displays `⚡ Cached (0ms)`.
  - Zero unnecessary cloud compilation requests are made.

#### Test 8.4: Cooldown & Rate Limiting Guardrail
* **Intuition**: Free public sandbox APIs must be protected from spam, infinite double-clicks, and accidental script bombardment.
* **Steps**:
  1. Modify the Python code (e.g. change `range(1, 6)` to `range(1, 8)`).
  2. Click **▶ Run Code**, and immediately click it a second time.
* **Expected Result**:
  - The first run executes smoothly.
  - The second run is stopped by the 3-second cooldown guardrail, displaying a polite cooldown warning in the terminal (`Cooldown active. Please wait X.Xs before running again.`).

#### Test 8.5: Keyboard Productivity & Tab Indentation
* **Intuition**: In code editors, pressing the Tab key should insert 2 spaces instead of unfocusing the editor or jumping to the address bar.
* **Steps**:
  1. Place your cursor inside any line in the code editor.
  2. Press the `Tab` key on your keyboard.
* **Expected Result**:
  - Exactly 2 spaces (`  `) are inserted at the cursor position.
  - Cursor advances past the two spaces.
  - Focus remains firmly inside the editor textarea.

---

## 🤖 Running Automated QE Regression Tests

We also have automated test suites that verify signaling handshakes, room isolation, data contracts, and browser UI layouts in seconds without manual clicking:

```bash
# 1. Run signaling unit test
npm test

# 2. Run core QE regression test suite
npm run test:qe

# 3. Run full headless browser automated UI verification
npm run test:qe:ui
```

### What Automated QE Checks:
1. **Room Isolation**: Peer in `room-alpha` must never receive signals or messages meant for `room-beta`.
2. **Peer Discovery Handshake**: New peers joining trigger `peer-joined` to existing peers and receive `peers-in-room`.
3. **Data Channel Payload Integrity**: Code broadcast, whiteboard vector strokes, and chat message structures match exact schemas.
4. **Instant Cleanup**: When a client disconnects, the server immediately notifies remaining peers with `peer-left`.
5. **Headless Browser Layout Verification**:
   - Launches headless browser via Chrome DevTools Protocol (CDP).
   - Verifies 3-way equal split space distribution (Editor: 33.3%, Preview: 33.3%, Whiteboard: 33.3%, delta <= 2.5px).
   - Verifies dynamic preview toggling cleanly restores 50/50 Editor + Whiteboard split.
   - Verifies 1024px screen safeguard: overlay warning appears at 1023px and mobile viewports, and automatically hides at >= 1024px.

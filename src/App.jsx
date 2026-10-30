import { useState, useEffect, useRef } from 'preact/hooks';
import { StudioWebRTC } from './webrtc';
import { VideoGrid } from './components/VideoGrid';
import { CodeEditor } from './components/CodeEditor';
import { Whiteboard } from './components/Whiteboard';
import { TextChat } from './components/TextChat';

const ScreenWarning = () => (
  <div class="screen-size-warning">
    <div class="warning-card">
      <div class="warning-icon">💻</div>
      <h2>PC / Desktop Screen Required</h2>
      <p>WebRTStudio requires a wider display for code editing, whiteboard sketching, and video streaming.</p>
      <p class="dim-text">Please widen your window or open on a computer.</p>
    </div>
  </div>
);

export function App() {
  const [roomId, setRoomId] = useState(() => {
    return new URLSearchParams(window.location.search).get('room') || '';
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('webrtc_username') || `Dev_${Math.floor(Math.random() * 900 + 100)}`;
  });

  const [inRoom, setInRoom] = useState(Boolean(roomId));
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor', 'whiteboard', 'split'
  const [showChat, setShowChat] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // WebRTC & Data States
  const webrtcRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [messages, setMessages] = useState([]);
  const [lastCodeUpdate, setLastCodeUpdate] = useState(null);
  const [lastWhiteboardAction, setLastWhiteboardAction] = useState(null);

  // Save username to local storage
  useEffect(() => {
    localStorage.setItem('webrtc_username', username);
  }, [username]);

  // Join room flow
  const joinRoom = (targetRoom) => {
    if (!targetRoom.trim()) return;
    const url = new URL(window.location.href);
    url.searchParams.set('room', targetRoom.trim());
    window.history.pushState({}, '', url.toString());
    setRoomId(targetRoom.trim());
    setInRoom(true);
  };

  const leaveRoom = () => {
    if (webrtcRef.current) {
      webrtcRef.current.destroy();
      webrtcRef.current = null;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
    setInRoom(false);
    setRoomId('');
    setRemoteStreams(new Map());
    setMessages([]);
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Initialize WebRTC session when entering room
  useEffect(() => {
    if (!inRoom || !roomId) return;

    const rtc = new StudioWebRTC(
      roomId,
      (peerId, stream) => {
        setRemoteStreams((prev) => new Map(prev).set(peerId, stream));
      },
      (peerId) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
      },
      (msg) => {
        if (msg.type === 'code') {
          setLastCodeUpdate(msg);
        } else if (msg.type === 'whiteboard') {
          setLastWhiteboardAction(msg.action);
        } else if (msg.type === 'chat') {
          setMessages((prev) => [...prev, msg.message]);
        }
      }
    );

    webrtcRef.current = rtc;

    rtc.initLocalMedia().then((stream) => {
      setLocalStream(stream);
      rtc.connectSignaling();
    });

    return () => {
      rtc.destroy();
    };
  }, [inRoom, roomId]);

  // 1. LOBBY VIEW
  if (!inRoom) {
    return (
      <div class="lobby-container">
        <div class="lobby-card">
          <div class="lobby-header">
            <h1 class="logo-title">⚡ WebRTStudio</h1>
            <p class="logo-subtitle">Real-Time Peer-to-Peer Collaborative Workspace</p>
          </div>

          <div class="lobby-form">
            <div class="form-group">
              <label>Your Display Name</label>
              <input
                type="text"
                class="form-input"
                value={username}
                placeholder="e.g. Alice"
                onInput={(e) => setUsername(e.target.value)}
              />
            </div>

            <div class="form-group">
              <label>Room Identifier</label>
              <div class="input-with-button">
                <input
                  type="text"
                  id="roomInput"
                  class="form-input"
                  placeholder="e.g. design-sprint"
                  defaultValue={`room-${Math.random().toString(36).substring(2, 7)}`}
                />
              </div>
            </div>

            <button
              class="btn-primary"
              onClick={() => {
                const el = document.getElementById('roomInput');
                joinRoom(el ? el.value : 'default-room');
              }}
            >
              🚀 Enter Studio
            </button>
          </div>

          <div class="lobby-perks">
            <div class="perk-item">
              <span class="perk-icon">🔒</span>
              <div>
                <strong>Direct P2P</strong>
                <p>Media and data flow directly between browsers. Never saved on servers.</p>
              </div>
            </div>
            <div class="perk-item">
              <span class="perk-icon">⚡</span>
              <div>
                <strong>Zero Latency</strong>
                <p>Collaborative code, vector whiteboard, and instant chat with zero DB overhead.</p>
              </div>
            </div>
          </div>
        </div>
        <ScreenWarning />
      </div>
    );
  }

  // 2. STUDIO VIEW
  return (
    <div class="studio-container">
      {/* Top Navbar */}
      <header class="studio-header">
        <div class="header-left">
          <span class="studio-brand">⚡ WebRTStudio</span>
          <div class="room-badge" onClick={copyRoomLink} title="Click to copy invite link">
            <span>Room: <strong>{roomId}</strong></span>
            <span class="badge-copy">{copied ? '✓ Copied!' : '📋 Copy Link'}</span>
          </div>
          <span class="peer-indicator">
            🟢 {remoteStreams.size + 1} {remoteStreams.size === 0 ? 'Peer (You)' : 'Peers'}
          </span>
        </div>

        <div class="header-center">
          <button
            class={`tab-toggle ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            💻 Code Studio
          </button>
          <button
            class={`tab-toggle ${activeTab === 'whiteboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('whiteboard')}
          >
            🎨 Whiteboard
          </button>
          <button
            class={`tab-toggle ${activeTab === 'split' ? 'active' : ''}`}
            onClick={() => setActiveTab('split')}
          >
            🔲 Split View
          </button>
        </div>

        <div class="header-right">
          <button
            class={`btn-toggle-chat ${showChat ? 'active' : ''}`}
            onClick={() => setShowChat(!showChat)}
            title="Toggle Text Chat"
          >
            💬 Chat {messages.length > 0 && `(${messages.length})`}
          </button>
          <button class="btn-leave" onClick={leaveRoom} title="Leave Room">
            🚪 Leave
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div class="studio-body">
        {/* Workspace Center Area */}
        <main class="studio-workspace">
          {activeTab === 'editor' && (
            <CodeEditor
              webrtc={webrtcRef.current}
              lastCodeUpdate={lastCodeUpdate}
              showPreview={showPreview}
              onTogglePreview={() => setShowPreview((prev) => !prev)}
            />
          )}
          {activeTab === 'whiteboard' && (
            <Whiteboard webrtc={webrtcRef.current} lastWhiteboardAction={lastWhiteboardAction} />
          )}
          {activeTab === 'split' && (
            <div class={`split-view ${showPreview ? 'split-three-way' : ''}`}>
              <div class="split-half">
                <CodeEditor
                  webrtc={webrtcRef.current}
                  lastCodeUpdate={lastCodeUpdate}
                  showPreview={showPreview}
                  onTogglePreview={() => setShowPreview((prev) => !prev)}
                />
              </div>
              <div class="split-half">
                <Whiteboard webrtc={webrtcRef.current} lastWhiteboardAction={lastWhiteboardAction} />
              </div>
            </div>
          )}

          {/* Docked Video Grid */}
          <div class="studio-video-dock">
            <VideoGrid
              webrtc={webrtcRef.current}
              localStream={localStream}
              remoteStreams={remoteStreams}
            />
          </div>
        </main>

        {/* Right Floating Overlay Drawer: Chat */}
        {showChat && (
          <aside class="studio-sidebar">
            <TextChat
              webrtc={webrtcRef.current}
              username={username}
              messages={messages}
              onSendMessage={(msg) => setMessages((prev) => [...prev, msg])}
              onClose={() => setShowChat(false)}
            />
          </aside>
        )}
      </div>

      <ScreenWarning />
    </div>
  );
}

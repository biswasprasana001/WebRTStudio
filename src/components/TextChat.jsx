import { useState, useRef, useEffect } from 'preact/hooks';

export function TextChat({ webrtc, username, messages, onSendMessage }) {
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const newMsg = {
      id: Math.random().toString(36).substring(2, 9),
      sender: username || 'Anonymous',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onSendMessage(newMsg);
    webrtc.broadcastData({
      type: 'chat',
      message: newMsg
    });

    setInput('');
  };

  return (
    <div class="chat-container">
      <div class="chat-header">
        <span>💬 Room Chat</span>
      </div>

      <div class="chat-messages">
        {messages.length === 0 ? (
          <div class="chat-empty">No messages yet. Say hello! 👋</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} class={`chat-bubble ${m.sender === username ? 'own' : 'peer'}`}>
              <div class="bubble-meta">
                <span class="bubble-sender">{m.sender}</span>
                <span class="bubble-time">{m.time}</span>
              </div>
              <div class="bubble-text">{m.text}</div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <form class="chat-input-row" onSubmit={send}>
        <input
          type="text"
          class="chat-input"
          placeholder="Type a message..."
          value={input}
          onInput={(e) => setInput(e.target.value)}
        />
        <button type="submit" class="btn-send">Send</button>
      </form>
    </div>
  );
}

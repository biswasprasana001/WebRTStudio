import { useState, useEffect, useRef } from 'preact/hooks';

const DEFAULT_HTML = `<div class="card">
  <h1>Welcome to WebRTStudio! 🚀</h1>
  <p>Collaborate on real-time code with zero latency.</p>
  <button id="clickBtn">Click Me</button>
  <div id="counter">0 clicks</div>
</div>`;

const DEFAULT_CSS = `body {
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #0f172a;
  color: #f8fafc;
  font-family: system-ui, sans-serif;
}
.card {
  background: #1e293b;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
}
button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
button:hover {
  background: #2563eb;
}
#counter {
  margin-top: 15px;
  font-size: 1.1rem;
  color: #94a3b8;
}`;

const DEFAULT_JS = `let count = 0;
const btn = document.getElementById('clickBtn');
const counter = document.getElementById('counter');

btn.addEventListener('click', () => {
  count++;
  counter.textContent = \`\${count} clicks\`;
});`;

export function CodeEditor({ webrtc, lastCodeUpdate }) {
  const [activeTab, setActiveTab] = useState('html');
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);
  const buildSrcDoc = () => `<!DOCTYPE html>
<html>
  <head>
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>${js}<\/script>
  </body>
</html>`;

  const [srcDoc, setSrcDoc] = useState(buildSrcDoc);

  // Sync incoming code from remote peers
  useEffect(() => {
    if (lastCodeUpdate) {
      if (lastCodeUpdate.html !== undefined) setHtml(lastCodeUpdate.html);
      if (lastCodeUpdate.css !== undefined) setCss(lastCodeUpdate.css);
      if (lastCodeUpdate.js !== undefined) setJs(lastCodeUpdate.js);
    }
  }, [lastCodeUpdate]);

  const runCode = () => {
    setSrcDoc(buildSrcDoc());
  };

  // Auto-run preview with 250ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSrcDoc(buildSrcDoc());
    }, 250);
    return () => clearTimeout(timer);
  }, [html, css, js]);

  const handleCodeChange = (newVal) => {
    let nextHtml = html;
    let nextCss = css;
    let nextJs = js;

    if (activeTab === 'html') {
      setHtml(newVal);
      nextHtml = newVal;
    } else if (activeTab === 'css') {
      setCss(newVal);
      nextCss = newVal;
    } else {
      setJs(newVal);
      nextJs = newVal;
    }

    // P2P direct broadcast to peers with zero server load
    webrtc.broadcastData({
      type: 'code',
      html: nextHtml,
      css: nextCss,
      js: nextJs
    });
  };

  const currentContent = activeTab === 'html' ? html : activeTab === 'css' ? css : js;

  return (
    <div class="code-editor-container">
      <div class="editor-pane">
        <div class="editor-header">
          <div class="tab-group">
            <button class={`tab-btn ${activeTab === 'html' ? 'active' : ''}`} onClick={() => setActiveTab('html')}>HTML</button>
            <button class={`tab-btn ${activeTab === 'css' ? 'active' : ''}`} onClick={() => setActiveTab('css')}>CSS</button>
            <button class={`tab-btn ${activeTab === 'js' ? 'active' : ''}`} onClick={() => setActiveTab('js')}>JS</button>
          </div>
          <button class="btn-run" onClick={runCode}>▶ Run Code</button>
        </div>

        <textarea
          class="code-textarea"
          value={currentContent}
          onInput={(e) => handleCodeChange(e.target.value)}
          spellcheck={false}
          autoCapitalize="off"
          autoComplete="off"
        />
      </div>

      <div class="preview-pane">
        <div class="preview-header">
          <span>Live Preview</span>
        </div>
        <iframe
          class="preview-iframe"
          title="Code Preview"
          sandbox="allow-scripts allow-modals"
          srcdoc={srcDoc}
        />
      </div>
    </div>
  );
}

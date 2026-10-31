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

const DEFAULT_JS = `const greet = (name) => \`Hello from \${name}! 🚀\`;
console.log(greet("WebRTStudio Peer"));

const numbers = [1, 2, 3, 4, 5];
console.log("Calculated squares:", numbers.map((n) => n * n));

// DOM helper for HTML preview mode
const btn = document.getElementById('clickBtn');
const counter = document.getElementById('counter');
if (btn && counter) {
  let count = 0;
  btn.onclick = () => {
    count++;
    counter.textContent = \`\${count} clicks\`;
  };
}
`;

const DEFAULT_PYTHON = `def greet(name):
    return f"Hello, {name}! 🚀"

print(greet("WebRTStudio Peer"))
print("Calculated squares:", [x * x for x in range(1, 6)])
`;

const DEFAULT_CPP = `#include <iostream>
#include <vector>

int main() {
    std::cout << "Hello from C++ in WebRTStudio! ⚡\\n";
    std::vector<int> nums = {1, 2, 3, 4, 5};
    for (int n : nums) {
        std::cout << n * n << " ";
    }
    std::cout << "\\n";
    return 0;
}
`;

const DEFAULT_C = `#include <stdio.h>

int main() {
    printf("Hello from C in WebRTStudio! ⚡\\n");
    for (int i = 1; i <= 5; i++) {
        printf("%d ", i * i);
    }
    printf("\\n");
    return 0;
}
`;

const DEFAULT_RUST = `fn main() {
    println!("Hello from Rust in WebRTStudio! ⚡");
    let nums = vec![1, 2, 3, 4, 5];
    let squares: Vec<i32> = nums.iter().map(|x| x * x).collect();
    println!("Squares: {:?}", squares);
}
`;

const DEFAULT_GO = `package main

import "fmt"

func main() {
    fmt.Println("Hello from Go in WebRTStudio! ⚡")
    for i := 1; i <= 5; i++ {
        fmt.Printf("%d ", i*i)
    }
    fmt.Println()
}
`;

const DEFAULT_JAVA = `// Note: Sandbox compiles file as prog.java
public class prog {
    public static void main(String[] args) {
        System.out.println("Hello from Java in WebRTStudio! ⚡");
    }
}
`;

const DEFAULT_SQL = `CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);
INSERT INTO users VALUES (1, 'Alice', 'Engineer'), (2, 'Bob', 'Designer');
SELECT * FROM users;
`;

const DEFAULT_BASH = `echo "Hello from Bash in WebRTStudio! ⚡"
echo "Date: $(date)"
echo "Kernel: $(uname -s 2>/dev/null || echo 'Linux/Sandbox')"
`;

const DEFAULT_TS = `interface Dev {
  name: string;
  skills: string[];
}

const user: Dev = {
  name: "WebRTStudio Peer",
  skills: ["WebRTC", "TypeScript", "Preact"]
};

console.log(\`Hello from \${user.name}! Skills: \${user.skills.join(', ')}\`);
`;

const DEFAULT_MARKDOWN = `# ⚡ WebRTStudio Multi-Language Workspace
Real-time peer-to-peer collaborative coding!

- **Ultra-lightweight**: < 1 MB memory overhead
- **Zero cost**: No servers, no accounts, 100% free
- **Safe & Sandboxed**: Free public sandbox execution
`;

const DEFAULT_JSON = `{
  "app": "WebRTStudio",
  "version": "2.0.0",
  "realtime": "WebRTC P2P DataChannel",
  "features": [
    "Multi-Language Code Editor",
    "Vector Whiteboard",
    "Audio/Video Grid",
    "Text Chat"
  ],
  "cost": "$0.00"
}`;

const DEFAULT_PHP = `<?php
echo "Hello from PHP in WebRTStudio! ⚡\\n";
$nums = [1, 2, 3, 4, 5];
print_r(array_map(fn($n) => $n * $n, $nums));
`;

const DEFAULT_RUBY = `puts "Hello from Ruby in WebRTStudio! ⚡"
puts "Squares: #{(1..5).map { |n| n ** 2 }}"
`;

export const INITIAL_CODE_FILES = {
  html: DEFAULT_HTML,
  css: DEFAULT_CSS,
  javascript: DEFAULT_JS,
  python: DEFAULT_PYTHON,
  cpp: DEFAULT_CPP,
  c: DEFAULT_C,
  rust: DEFAULT_RUST,
  go: DEFAULT_GO,
  java: DEFAULT_JAVA,
  sql: DEFAULT_SQL,
  bash: DEFAULT_BASH,
  typescript: DEFAULT_TS,
  markdown: DEFAULT_MARKDOWN,
  json: DEFAULT_JSON,
  php: DEFAULT_PHP,
  ruby: DEFAULT_RUBY
};

// Compiler mapping for Wandbox sandbox execution
const COMPILER_MAP = {
  python: 'cpython-3.12.7',
  cpp: 'gcc-13.2.0',
  c: 'gcc-13.2.0-c',
  rust: 'rust-1.82.0',
  go: 'go-1.23.2',
  java: 'openjdk-jdk-22+36',
  sql: 'sqlite-3.46.1',
  bash: 'bash',
  php: 'php-8.3.12',
  ruby: 'ruby-4.0.2',
  typescript: 'typescript-5.6.2'
};

const COOLDOWN_MS = 3000;
const MAX_PAYLOAD_CHARS = 50000; // 50 KB safety limit
const SANDBOX_TIMEOUT_MS = 60000; // 60s timeout for compiled sandboxes

export function CodeEditor({
  webrtc,
  codeFiles = INITIAL_CODE_FILES,
  onChangeCodeFiles,
  activeLang = 'html',
  onChangeActiveLang,
  showPreview = true,
  onTogglePreview
}) {
  const textareaRef = useRef(null);

  // Terminal & execution state
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState({
    stdout: '',
    stderr: '',
    status: 'idle',
    duration: null,
    cached: false
  });

  // Anti-abuse guardrails refs
  const lastRunTimeRef = useRef(0);
  const executionCacheRef = useRef(new Map()); // Key: `${compiler}:${code}`, Value: result
  const broadcastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (broadcastTimerRef.current) clearTimeout(broadcastTimerRef.current);
    };
  }, []);

  const buildSrcDoc = () => `<!DOCTYPE html>
<html>
  <head>
    <style>${codeFiles.css}</style>
  </head>
  <body>
    ${codeFiles.html}
    <script>${codeFiles.javascript}<\/script>
  </body>
</html>`;

  const [srcDoc, setSrcDoc] = useState(buildSrcDoc);

  // Auto-run web preview with 250ms debounce only when on web languages & preview is visible
  useEffect(() => {
    if (!showPreview) return;
    if (activeLang === 'html' || activeLang === 'css' || activeLang === 'javascript') {
      const timer = setTimeout(() => {
        setSrcDoc(buildSrcDoc());
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [codeFiles.html, codeFiles.css, codeFiles.javascript, showPreview, activeLang]);

  const handleCodeChange = (newVal) => {
    const nextFiles = { ...codeFiles, [activeLang]: newVal };
    onChangeCodeFiles?.(nextFiles);

    // 50ms batch throttle for P2P data broadcast to avoid per-keystroke spam
    if (broadcastTimerRef.current) clearTimeout(broadcastTimerRef.current);
    broadcastTimerRef.current = setTimeout(() => {
      webrtc?.broadcastData({
        type: 'code',
        lang: activeLang,
        code: newVal,
        html: nextFiles.html,
        css: nextFiles.css,
        js: nextFiles.javascript
      });
    }, 50);
  };

  const handleLanguageChange = (lang) => {
    onChangeActiveLang?.(lang);
  };

  // Keyboard enhancements: Tab indentation and Ctrl+Enter execution
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      if (e.shiftKey) {
        // Shift+Tab: Un-indent 2 spaces
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        if (val.slice(lineStart, lineStart + 2) === '  ') {
          const nextVal = val.slice(0, lineStart) + val.slice(lineStart + 2);
          textarea.value = nextVal;
          handleCodeChange(nextVal);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, start - 2);
          });
        }
      } else {
        // Tab: Insert 2 spaces
        const nextVal = val.substring(0, start) + '  ' + val.substring(end);
        textarea.value = nextVal;
        handleCodeChange(nextVal);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
  };

  // Safe client-side JavaScript execution with console interception
  const runJavaScriptLocally = (jsCode) => {
    const logs = [];
    const startTime = performance.now();
    try {
      const sandboxConsole = {
        log: (...args) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        error: (...args) => logs.push('[ERROR] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        warn: (...args) => logs.push('[WARN] ' + args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        info: (...args) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '))
      };
      const fn = new Function('console', jsCode);
      fn(sandboxConsole);
      const duration = Math.round(performance.now() - startTime);
      setTerminalOutput({
        stdout: logs.length > 0 ? logs.join('\n') : '> Code executed cleanly with 0 console logs.',
        stderr: '',
        status: 'success',
        duration,
        cached: false
      });
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      setTerminalOutput({
        stdout: logs.length > 0 ? logs.join('\n') : '',
        stderr: `Runtime Error: ${err.message}`,
        status: 'error',
        duration,
        cached: false
      });
    }
  };

  // Main Code Runner with 5 Anti-Abuse Guardrails
  const runCode = async () => {
    const currentCode = codeFiles[activeLang] || '';

    // Web Mode (HTML / CSS): Live visual reload
    if (activeLang === 'html' || activeLang === 'css') {
      setSrcDoc(buildSrcDoc());
      return;
    }

    // Guardrail 1: Empty or blank code check (0 network calls, 0 execution overhead)
    if (!currentCode.trim()) {
      setTerminalOutput({
        stdout: '> [Code is empty - nothing to execute]',
        stderr: '',
        status: 'idle',
        duration: 0,
        cached: false
      });
      return;
    }

    // Markdown Mode: Simple rich render
    if (activeLang === 'markdown') {
      setTerminalOutput({
        stdout: currentCode,
        stderr: '',
        status: 'success',
        duration: 0,
        cached: false
      });
      return;
    }

    // JSON Mode: Format & validate syntax
    if (activeLang === 'json') {
      try {
        const parsed = JSON.parse(currentCode);
        setTerminalOutput({
          stdout: JSON.stringify(parsed, null, 2),
          stderr: '',
          status: 'success',
          duration: 0,
          cached: false
        });
      } catch (e) {
        setTerminalOutput({
          stdout: '',
          stderr: `JSON SyntaxError: ${e.message}`,
          status: 'error',
          duration: 0,
          cached: false
        });
      }
      return;
    }

    // JavaScript Mode: Run locally in browser
    if (activeLang === 'javascript') {
      runJavaScriptLocally(currentCode);
      return;
    }

    // Guardrail 2: In-flight lock (prevents duplicate parallel requests)
    if (isRunning) {
      setTerminalOutput((prev) => ({
        ...prev,
        stderr: '⏳ Execution already in progress. Please wait.',
        status: 'rate-limited'
      }));
      return;
    }

    // Guardrail 3: 3-second rate-limiting cooldown
    const now = Date.now();
    const timeSinceLastRun = now - lastRunTimeRef.current;
    if (lastRunTimeRef.current > 0 && timeSinceLastRun < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - timeSinceLastRun) / 1000);
      setTerminalOutput((prev) => ({
        ...prev,
        stderr: `⏳ Rate limit cooldown active: please wait ${waitSec}s before running again.`,
        status: 'rate-limited'
      }));
      return;
    }

    // Guardrail 4: Payload size limit cap (prevents huge dumps)
    if (currentCode.length > MAX_PAYLOAD_CHARS) {
      setTerminalOutput({
        stdout: '',
        stderr: `⚠️ Code exceeds ${MAX_PAYLOAD_CHARS / 1000} KB safety limit (${currentCode.length} chars).`,
        status: 'limit-exceeded',
        duration: 0,
        cached: false
      });
      return;
    }

    const compiler = COMPILER_MAP[activeLang];
    if (!compiler) {
      setTerminalOutput({
        stdout: `Language [${activeLang}] is a markup/config format.`,
        stderr: '',
        status: 'idle',
        duration: 0,
        cached: false
      });
      return;
    }

    // Guardrail 5: Deduplication Cache (Serve instant output without hitting network)
    const cacheKey = `${compiler}:${currentCode}`;
    if (executionCacheRef.current.has(cacheKey)) {
      const cached = executionCacheRef.current.get(cacheKey);
      setTerminalOutput({
        ...cached,
        cached: true
      });
      return;
    }

    // Wandbox compiles Java file as prog.java; normalize top-level public class to prog
    let codeToSend = currentCode;
    if (activeLang === 'java') {
      codeToSend = codeToSend.replace(/public\s+class\s+([A-Za-z0-9_]+)/, 'public class prog');
    }

    // Execute via Wandbox Public Sandbox API with Guardrail 6 (Timeout)
    setIsRunning(true);
    setTerminalOutput({
      stdout: '',
      stderr: '',
      status: 'running',
      duration: null,
      cached: false
    });
    lastRunTimeRef.current = Date.now();
    const startTime = performance.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SANDBOX_TIMEOUT_MS);

    try {
      const response = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compiler, code: codeToSend }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Sandbox service error (HTTP ${response.status})`);
      }

      const data = await response.json();
      const duration = Math.round(performance.now() - startTime);

      const result = {
        stdout: data.program_output || '',
        stderr: data.compiler_error || data.program_error || '',
        status: data.status === '0' ? 'success' : 'error',
        duration,
        cached: false
      };

      // LRU cache cap: keep maximum 20 entries in memory
      if (executionCacheRef.current.size >= 20) {
        const firstKey = executionCacheRef.current.keys().next().value;
        executionCacheRef.current.delete(firstKey);
      }
      executionCacheRef.current.set(cacheKey, result);

      setTerminalOutput(result);
    } catch (err) {
      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - startTime);
      if (err.name === 'AbortError') {
        setTerminalOutput({
          stdout: '',
          stderr: `⚠️ Execution timed out after ${SANDBOX_TIMEOUT_MS / 1000}s.`,
          status: 'timeout',
          duration,
          cached: false
        });
      } else {
        setTerminalOutput({
          stdout: '',
          stderr: `Network/API Error: ${err.message}`,
          status: 'network-error',
          duration,
          cached: false
        });
      }
    } finally {
      setIsRunning(false);
    }
  };

  const currentContent = codeFiles[activeLang] || '';
  const isWebMode = activeLang === 'html' || activeLang === 'css';

  return (
    <div class="code-editor-container">
      <div class="editor-pane">
        <div class="editor-header">
          <div class="tab-group editor-left-controls">
            {/* Language Dropdown Selector (15+ Languages) */}
            <select
              class="lang-select"
              value={activeLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              title="Select Programming Language"
            >
              <optgroup label="🌐 Web">
                <option value="html">HTML5</option>
                <option value="css">CSS3</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
              </optgroup>
              <optgroup label="⚙️ Backend & Systems">
                <option value="python">Python 3</option>
                <option value="cpp">C++ (GCC)</option>
                <option value="c">C (GCC)</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
                <option value="java">Java</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="bash">Bash / Shell</option>
              </optgroup>
              <optgroup label="📄 Data & Markup">
                <option value="sql">SQL (SQLite)</option>
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
              </optgroup>
            </select>

            {/* Quick Web Tabs when in web mode */}
            {['html', 'css', 'javascript'].includes(activeLang) && (
              <div class="quick-web-tabs">
                <button
                  type="button"
                  class={`tab-btn ${activeLang === 'html' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('html')}
                >
                  HTML
                </button>
                <button
                  type="button"
                  class={`tab-btn ${activeLang === 'css' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('css')}
                >
                  CSS
                </button>
                <button
                  type="button"
                  class={`tab-btn ${activeLang === 'javascript' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('javascript')}
                >
                  JS
                </button>
              </div>
            )}
          </div>

          <div class="tab-group">
            {onTogglePreview && (
              <button
                type="button"
                class={`tab-btn ${showPreview ? 'active' : ''}`}
                onClick={onTogglePreview}
                title="Toggle Output Panel"
              >
                {showPreview ? '👁 Preview: ON' : '👁 Preview: OFF'}
              </button>
            )}
            <button
              type="button"
              class={`btn-run ${isRunning ? 'running' : ''}`}
              onClick={runCode}
              title="Run Code (Ctrl+Enter)"
            >
              {isRunning ? '⏳ Running...' : '▶ Run Code'}
            </button>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          class="code-textarea"
          value={currentContent}
          onInput={(e) => handleCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellcheck={false}
          autoCapitalize="off"
          autoComplete="off"
        />
      </div>

      {showPreview && (
        <div class="preview-pane">
          {isWebMode ? (
            <>
              <div class="preview-header">
                <span>Live Web Preview</span>
                <button
                  type="button"
                  class="btn-term-action"
                  onClick={() => setSrcDoc(buildSrcDoc())}
                  title="Reload Preview"
                >
                  🔄 Reload
                </button>
              </div>
              <iframe
                class="preview-iframe"
                title="Code Preview"
                sandbox="allow-scripts allow-modals"
                srcdoc={srcDoc}
              />
            </>
          ) : (
            <div class="terminal-output-pane">
              <div class="terminal-header">
                <div class="terminal-title">
                  <span class="terminal-dot" />
                  <span>Studio Terminal ({activeLang.toUpperCase()})</span>
                  {terminalOutput.duration !== null && (
                    <span class="term-time">⚡ {terminalOutput.duration}ms</span>
                  )}
                  {terminalOutput.cached && (
                    <span class="term-cached-badge">[cached]</span>
                  )}
                </div>
                <div class="terminal-actions">
                  <button
                    type="button"
                    class="btn-term-action"
                    onClick={() => {
                      const text = [terminalOutput.stdout, terminalOutput.stderr].filter(Boolean).join('\n');
                      navigator.clipboard.writeText(text);
                    }}
                    title="Copy Output"
                  >
                    📋 Copy
                  </button>
                  <button
                    type="button"
                    class="btn-term-action"
                    onClick={() =>
                      setTerminalOutput({
                        stdout: '',
                        stderr: '',
                        status: 'idle',
                        duration: null,
                        cached: false
                      })
                    }
                    title="Clear Terminal"
                  >
                    🗑️ Clear
                  </button>
                </div>
              </div>

              <div class="terminal-body">
                {terminalOutput.status && (
                  <div class={`term-status-line status-${terminalOutput.status}`}>
                    {terminalOutput.status === 'running' && '🔄 Compiling & running in sandbox...'}
                    {terminalOutput.status === 'success' && '🟢 Execution finished (exit code 0)'}
                    {terminalOutput.status === 'error' && '🔴 Execution failed'}
                    {terminalOutput.status === 'timeout' && '⏰ Execution timed out'}
                    {terminalOutput.status === 'limit-exceeded' && '⚠️ Payload size limit exceeded'}
                    {terminalOutput.status === 'rate-limited' && '⏳ Rate limit cooldown active'}
                    {terminalOutput.status === 'network-error' && '⚡ Network/API error'}
                    {terminalOutput.status === 'idle' && '⚪ Ready'}
                  </div>
                )}
                {terminalOutput.stdout && <pre class="term-stdout">{terminalOutput.stdout}</pre>}
                {terminalOutput.stderr && <pre class="term-stderr">{terminalOutput.stderr}</pre>}
                {!terminalOutput.stdout && !terminalOutput.stderr && (
                  <div class="term-placeholder">
                    Click <strong>▶ Run Code</strong> or press <strong>Ctrl+Enter</strong> to execute.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useRef, useEffect, useState } from 'preact/hooks';

// Reference dimension to scale brush thickness proportionally
const BASE_WIDTH = 1000;

export function Whiteboard({
  webrtc,
  lastWhiteboardAction,
  initialStrokes = [],
  onLocalStroke,
  onLocalClear
}) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#38bdf8');
  const [brushSize, setBrushSize] = useState(4);
  const isDrawing = useRef(false);
  const lastPos = useRef({ nx: 0, ny: 0, px: 0, py: 0 });
  const allStrokesRef = useRef(initialStrokes ? [...initialStrokes] : []);

  // Sync allStrokesRef with initialStrokes on mount or when receiving initial data
  useEffect(() => {
    if (initialStrokes && initialStrokes.length > 0 && allStrokesRef.current.length === 0) {
      allStrokesRef.current = [...initialStrokes];
      redrawAll();
    }
  }, [initialStrokes]);

  // Render a single stroke segment onto 2D context
  const renderStroke = (ctx, stroke, w, h) => {
    if (!stroke || stroke.length < 6 || w <= 0 || h <= 0) return;
    const [nx0, ny0, nx1, ny1, strokeColor, strokeWidthVal] = stroke;

    // Handle both normalized (<= 1.0) and legacy absolute coordinates (> 1.0)
    const isNormalized = nx0 <= 1.0 && ny0 <= 1.0 && nx1 <= 1.0 && ny1 <= 1.0;
    const x0 = isNormalized ? nx0 * w : nx0;
    const y0 = isNormalized ? ny0 * h : ny0;
    const x1 = isNormalized ? nx1 * w : nx1;
    const y1 = isNormalized ? ny1 * h : ny1;

    // Responsive stroke width: scale proportionally with canvas width (min 1px)
    const lineWidth = strokeWidthVal <= 0.1
      ? Math.max(1, Math.round(strokeWidthVal * w))
      : Math.max(1, strokeWidthVal);

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const redrawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    if (w <= 0 || h <= 0) return;

    ctx.clearRect(0, 0, w, h);
    const strokes = allStrokesRef.current;
    for (let i = 0; i < strokes.length; i++) {
      renderStroke(ctx, strokes[i], w, h);
    }
  };

  // Handle incoming remote drawings and sync from peers
  useEffect(() => {
    if (!lastWhiteboardAction || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (lastWhiteboardAction.type === 'draw') {
      const stroke = lastWhiteboardAction.stroke;
      allStrokesRef.current.push(stroke);
      if (allStrokesRef.current.length > 2000) {
        allStrokesRef.current = allStrokesRef.current.slice(-2000);
      }
      renderStroke(ctx, stroke, canvas.width, canvas.height);
    } else if (lastWhiteboardAction.type === 'clear') {
      allStrokesRef.current = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (lastWhiteboardAction.type === 'sync' && Array.isArray(lastWhiteboardAction.strokes)) {
      allStrokesRef.current = lastWhiteboardAction.strokes.slice(-2000);
      redrawAll();
    }
  }, [lastWhiteboardAction]);

  // Handle dynamic resizing with ResizeObserver (Window, Split View, Preview Toggle)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    let animFrame = null;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const displayWidth = Math.floor(rect.width);
      const displayHeight = Math.floor(rect.height);

      if (displayWidth > 0 && displayHeight > 0) {
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
          canvas.width = displayWidth;
          canvas.height = displayHeight;
          redrawAll();
        }
      }
    };

    updateSize();

    const ro = new ResizeObserver(() => {
      if (animFrame) cancelAnimationFrame(animFrame);
      animFrame = requestAnimationFrame(updateSize);
    });

    ro.observe(container);

    return () => {
      ro.disconnect();
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, []);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { nx: 0, ny: 0, px: 0, py: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const nx = rect.width > 0 ? Math.round((px / rect.width) * 10000) / 10000 : 0;
    const ny = rect.height > 0 ? Math.round((py / rect.height) * 10000) / 10000 : 0;
    return { nx, ny, px, py };
  };

  const startDrawing = (e) => {
    isDrawing.current = true;
    lastPos.current = getCanvasCoords(e);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const currentPos = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Normalized stroke width ratio relative to BASE_WIDTH
    const brushRatio = Math.round((brushSize / BASE_WIDTH) * 10000) / 10000;

    const stroke = [
      lastPos.current.nx,
      lastPos.current.ny,
      currentPos.nx,
      currentPos.ny,
      color,
      brushRatio
    ];

    allStrokesRef.current.push(stroke);
    if (allStrokesRef.current.length > 2000) {
      allStrokesRef.current = allStrokesRef.current.slice(-2000);
    }

    renderStroke(ctx, stroke, canvas.width, canvas.height);
    onLocalStroke?.(stroke);

    // Vector stroke P2P broadcast (compact ~30 bytes!)
    webrtc?.broadcastData({
      type: 'whiteboard',
      action: { type: 'draw', stroke }
    });

    lastPos.current = currentPos;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    allStrokesRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onLocalClear?.();

    webrtc?.broadcastData({
      type: 'whiteboard',
      action: { type: 'clear' }
    });
  };

  return (
    <div class="whiteboard-container">
      <div class="whiteboard-toolbar">
        <div class="tool-item">
          <label>Color:</label>
          <input type="color" value={color} onInput={(e) => setColor(e.target.value)} />
        </div>
        <div class="tool-item">
          <label>Size: {brushSize}px</label>
          <input
            type="range"
            min="1"
            max="30"
            value={brushSize}
            onInput={(e) => setBrushSize(Number(e.target.value))}
          />
        </div>
        <button class="btn-clear" onClick={clearCanvas}>🧹 Clear Board</button>
      </div>

      <div class="canvas-wrapper">
        <canvas
          ref={canvasRef}
          class="whiteboard-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
}

import { useRef, useEffect, useState } from 'preact/hooks';

export function Whiteboard({ webrtc, lastWhiteboardAction }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#38bdf8');
  const [brushSize, setBrushSize] = useState(4);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Handle incoming remote drawings
  useEffect(() => {
    if (!lastWhiteboardAction || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (lastWhiteboardAction.type === 'draw') {
      const [x0, y0, x1, y1, strokeColor, strokeWidth] = lastWhiteboardAction.stroke;
      drawSegment(ctx, x0, y0, x1, y1, strokeColor, strokeWidth);
    } else if (lastWhiteboardAction.type === 'clear') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [lastWhiteboardAction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set internal resolution matching display size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        // Save content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);

        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(tempCanvas, 0, 0);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const drawSegment = (ctx, x0, y0, x1, y1, strokeColor, strokeWidth) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    isDrawing.current = true;
    lastPos.current = getCanvasCoords(e);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const currentPos = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const stroke = [
      lastPos.current.x,
      lastPos.current.y,
      currentPos.x,
      currentPos.y,
      color,
      brushSize
    ];

    drawSegment(ctx, ...stroke);

    // Vector stroke P2P broadcast (only ~30 bytes!)
    webrtc.broadcastData({
      type: 'whiteboard',
      action: { type: 'draw', stroke }
    });

    lastPos.current = currentPos;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    webrtc.broadcastData({
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

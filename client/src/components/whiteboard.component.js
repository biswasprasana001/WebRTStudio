import React, { useEffect, useRef } from "react";
import { useSocket } from '../context/SocketProvider';
import { useParams } from "react-router-dom";

const Whiteboard = () => {

    const socket = useSocket();
    const { roomId } = useParams();

    const canvasRef = useRef(null);
    let drawing = false;

    const drawOnCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.addEventListener('mousedown', (e) => {
            drawing = true;
            draw(e);
        });

        canvas.addEventListener('mousemove', draw);

        canvas.addEventListener('mouseup', () => {
            drawing = false;
            ctx.beginPath();
        });

        function draw(e) {
            if (!drawing) return;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.strokeStyle = 'black';

            ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
            var timeout;
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(function () {
                var base64ImageData = canvas.toDataURL('image/png');
                socket.emit('drawing', base64ImageData, roomId);
            }, 1000);
        }
    }

    const clearCanvasEmit = () => {
        clearCanvas();
        socket.emit('clear', roomId);
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    useEffect(() => {
        socket.emit('join', roomId);
        drawOnCanvas();
        socket.on('drawing', (base64ImageData) => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = base64ImageData;
        });
        socket.on('clear', () => {
            clearCanvas();
        })
    }, [])

    return (
        <div style={{ width: '100%', height: '100vh', border: '1px solid black' }}>
            <canvas
                ref={canvasRef}
                id="whiteboard"
                width={window.innerWidth}
                height={window.innerHeight}
            />
            <button onClick={clearCanvasEmit}>Clear</button>
        </div>
    )
};

export default Whiteboard;
import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketProvider';
import { useParams } from 'react-router-dom';

const Board = ({ brushColor, brushSize }) => {
    const canvasRef = useRef(null);
    const buttonRef = useRef(null);
    const socket = useSocket();
    const { roomId } = useParams();

    useEffect(() => {
        socket.on('canvasImage', (data) => {
            const image = new Image();
            image.src = data;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            image.onload = () => {
                ctx.drawImage(image, 0, 0);
            }
        })
        socket.on('clear', () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        })
    }, [socket]);

    useEffect(() => {
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        const startDrawing = (e) => {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
        }

        const draw = (e) => {
            if (!isDrawing) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(e.offsetX, e.offsetY);
                ctx.stroke();
            }
            [lastX, lastY] = [e.offsetX, e.offsetY];
        }

        const endDrawing = () => {
            const canvas = canvasRef.current;
            const dataURL = canvas.toDataURL();
            socket.emit('canvasImage', dataURL, roomId);
            isDrawing = false;
        }

        const clearCanvas = () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            socket.emit('clear', roomId);
        }

        const button = buttonRef.current;
        button.addEventListener('click', clearCanvas);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.strokeStyle = brushColor;
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', endDrawing);
        canvas.addEventListener('mouseout', endDrawing);

        return () => {
            canvas.removeEventListener('mousedown', startDrawing);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', endDrawing);
            canvas.removeEventListener('mouseout', endDrawing);
        }
    }, [brushColor, brushSize, socket]);

    const [windowSize, setWindowSize] = useState([
        window.innerWidth,
        window.innerHeight,
    ]);


    useEffect(() => {
        const handleWindowResize = () => {
            setWindowSize([window.innerWidth, window.innerHeight]);
        };


        window.addEventListener('resize', handleWindowResize);


        return () => {
            window.removeEventListener('resize', handleWindowResize);
        };
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                width={windowSize[0] > 600 ? 600 : 300}
                height={windowSize[1] > 400 ? 400 : 200}
                style={{ backgroundColor: 'black' }}
            />
            {/* clear button */}
            <button ref={buttonRef}>Clear</button>
        </>
    )
}

export default Board
import React, { useState, useRef } from 'react';
import Board from './board.component';
import '../css/whiteboard.component.css';

function App({ openWB, setOpenWB }) {

    const [brushColor, setBrushColor] = useState('#FFFFFF');
    const [brushSize, setBrushSize] = useState(10);
    const buttonRef = useRef(null);

    const onClose = () => {
        setOpenWB(false);
    }

    return (
        <div id='whiteboard-component' style={{ display: openWB ? '' : 'none' }}>
            <button id='whiteboard-close-button' onClick={onClose}>Close</button>
            <div id='whiteboard-container'>
                <Board brushColor={brushColor} brushSize={brushSize} buttonRef={buttonRef} />
                <div id='whiteboard-tools' >
                    <div id='whiteboard-color-tool'>
                        <span>Color: </span>
                        <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} />
                    </div>
                    <button ref={buttonRef} id='whiteboard-clear-btn'>Clear</button>
                    <div id='whiteboard-size-tool'>
                        <span>Size: </span>
                        <input type="range" color='#fac176'
                            min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
                        <span>{brushSize}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
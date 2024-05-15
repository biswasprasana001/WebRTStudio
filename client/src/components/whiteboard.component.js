import React, { useState } from 'react';
import Board from './board.component';

function App() {

    const [brushColor, setBrushColor] = useState('#FFFFFF');
    const [brushSize, setBrushSize] = useState(10);

    return (
        <div className="App" >
            <h1>Collaborative Whiteboard</h1>
            <div>
                <Board brushColor={brushColor} brushSize={brushSize} />
                <div className='tools' >
                    <div>
                        <span>Color: </span>
                        <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} />
                    </div>
                    <div>
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
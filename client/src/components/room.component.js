// Display room id from url
import React from 'react';
import { useParams } from 'react-router-dom';
import CodeEditor from './codeEditor.component';
import Whiteboard from './whiteboard.component';
import { SocketProvider } from '../context/SocketProvider';

const Room = () => {
    const { roomId } = useParams();
    return (
        <SocketProvider>
            <div>
                <h1>Room: {roomId}</h1>
                <Whiteboard />
                <CodeEditor />
            </div>
        </SocketProvider>
    );
}

export default Room
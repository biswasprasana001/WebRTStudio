// Display room id from url
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import CodeEditor from './codeEditor.component';
import Whiteboard from './whiteboard.component';
import VideoChat from './videoChat.component';
import TextChat from './textChat.component'
import { SocketProvider } from '../context/SocketProvider';
import LogoutButton from './logout.component';
import Navbar from './navbar.component';

const Room = () => {
    const { roomId } = useParams();
    const [openWB, setOpenWB] = useState(false);
    const [openVC, setOpenVC] = useState(false);
    const [openC, setOpenC] = useState(false);

    const openWhiteBoard = () => {
        setOpenWB(true);
    }

    const openVideoChat = () => {
        setOpenVC(true);
    }

    const openChat = () => {
        setOpenC(true);
    }

    return (
        <SocketProvider>
            <div id='room'>
                <LogoutButton />
                <h1>Room: {roomId}</h1>
                <Navbar openWhiteBoard={openWhiteBoard} openVideoChat={openVideoChat} openChat={openChat} />
                <CodeEditor />
                <Whiteboard openWB={openWB} setOpenWB={setOpenWB}/>
                <VideoChat openVC={openVC} setOpenVC={setOpenVC}/>
                <TextChat />
            </div>
        </SocketProvider>
    );
}

export default Room
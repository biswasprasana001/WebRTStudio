import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketProvider';
import { useParams } from 'react-router-dom';
import Peer from 'peerjs';
import '../css/videoChat.component.css';

const VideoChat = ({ openVC, setOpenVC}) => {
    const [streams, setStreams] = useState([]);
    const [myStream, setMyStream] = useState(null);

    const { roomId } = useParams();
    const socket = useSocket();

    function connectToNewUser(myPeer, peerId, stream) {
        const call = myPeer.call(peerId, stream);
        call.on('stream', userVideoStream => {
            setStreams(prevStreams => [...prevStreams, userVideoStream]);
        })
    }

    useEffect(() => {
        let myPeer;
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(stream => {
            setMyStream(stream);
            myPeer = new Peer()
            myPeer.on('call', call => {
                call.answer(stream);
                call.on('stream', userVideoStream => {
                    setStreams(prevStreams => [...prevStreams, userVideoStream]);
                })
            });

            socket.on('user-connected', peerId => {
                connectToNewUser(myPeer, peerId, stream);
                console.log("user-connected", peerId);
            });

            myPeer.on('open', peerId => {
                socket.emit('user-connected', roomId, peerId, stream.id);
            });
        });

        socket.on('user-disconnected', (peerId, streamID) => {
            console.log("user-disconnected", peerId, streamID);
            setStreams(prevStreams => prevStreams.filter(stream => stream.id !== streamID));
        });

        return () => {
            myPeer.off('open');
            myPeer.off('call');
            socket.off('user-connected');
            socket.off('join-room');
            socket.off('user-disconnected');
            socket.disconnect();
            myPeer.destroy();

        };
    }, []);

    return (
        <div id='video-chat' style={{ display: openVC ? '' : 'none' }}>
            <button onClick={() => setOpenVC(false)} id='video-chat-close-button'>Close</button>
            <div id='video-container'>
                <div id='video'>
                    {myStream && <video autoPlay playsInline muted ref={video => {
                        if (video) video.srcObject = myStream;
                    }} id='video-element' />}
                </div>
                {streams
                    .filter((stream, index) => index === streams.indexOf(stream))
                    .map((stream, index) => (
                        <div id='video' key={index}>
                            <video key={index} autoPlay playsInline ref={video => {
                                if (video) video.srcObject = stream;
                            }} id='video-element' />
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default VideoChat;
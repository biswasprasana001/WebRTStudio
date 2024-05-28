import React, { useState, useEffect, useContext } from 'react';
import { useSocket } from '../context/SocketProvider';
import { useParams } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import '../css/textChat.component.css';

function Chat({ openC, setOpenC }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const socket = useSocket();
  const { username } = useContext(UserContext);
  const { roomId } = useParams();

  useEffect(() => {
    socket.emit('join', roomId);
    socket.on('text-message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off('text-message');
    };
  }, [roomId, socket]);

  const sendMessage = () => {
    const message = {
      username,
      text: input,
    };
    setMessages((prevMessages) => [...prevMessages, message]);
    socket.emit('text-message', message, roomId);
    setInput('');
  };

  return (
    <div id='chatPage' style={{ display: openC ? '' : 'none' }}>
      <button id='closeChat-btn' onClick={() => setOpenC(false)}>Close</button>
      <div id='chatContainer'>
        <div id='chatBox'>
          <ul id='messages'>
            {messages.map((msg, index) => (
              <li key={index}>
                <strong>{msg.username}: </strong>
                {msg.text}
              </li>
            ))}
          </ul>
        </div>
        <div id='message-form'>
          <input
            value={input}
            placeholder='Write a message...'
            onChange={(e) => setInput(e.target.value)}
            id='message-input'
          />
          <button onClick={sendMessage} id='message-send-button'>Send</button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketProvider';
import { useParams } from 'react-router-dom';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const socket = useSocket();
  const { roomId } = useParams();

  useEffect(() => {
    socket.emit('join', roomId);
    socket.on('text-message', (msg) => {
      setMessages([...messages, msg]);
    });
  }, [messages]);

  const sendMessage = () => {
    setMessages([...messages, input]);
    socket.emit('text-message', input, roomId);
    setInput('');
  };

  return (
  
<div className='chatPage'>
       <div className='chatContainer'>
        <div className='header'>
         <h2>CHATBOT</h2>
        </div>
       <div className='chatBox'>
       
        <ul className='messages'>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
      </div>
      <div className='inputBox'>
      <input value={input}  placeholder='Write a message..' onChange={(e) => setInput(e.target.value)} />
      <button id="button" onClick={sendMessage}>Send</button><br></br>
      </div>
    </div>
</div>
  );
}

export default Chat;
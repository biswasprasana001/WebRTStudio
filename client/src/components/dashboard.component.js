// client\src\components\dashboard.component.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import LogoutButton from './logout.component';
import '../css/dashboard.component.css';

const Dashboard = () => {
  const [roomName, setRoomName] = useState('');
  const [rooms, setRooms] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  axios.defaults.baseURL = 'https://webrtstudio-server.onrender.com';

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/rooms', { name: roomName });
      setRoomName('');
      navigate(`/room/${roomName}`);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  return (
    <div id='dashboard'>
      <LogoutButton />
      <form onSubmit={handleSubmit} id='dashboard-form'>
        <input
          type="text"
          placeholder="Enter room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          id='room-name-input'
        />
        <button type="submit" id='submit-button'>Create Room</button>
      </form>
      <div>
        <h2 id='room-title'>Rooms:</h2>
      </div>
      <ul id='room-list'>
        {rooms.map((room) => (
          <li key={room._id}>
            <button onClick={() => navigate(`/room/${room.name}`)}>
              {room.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
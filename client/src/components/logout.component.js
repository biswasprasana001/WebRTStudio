import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <button onClick={handleLogout} id='logout-button'>
      Logout
    </button>
  );
};

export default LogoutButton;
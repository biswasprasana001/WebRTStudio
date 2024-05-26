import React from 'react';
import '../css/navbar.component.css';

const Navbar = ({openWhiteBoard, openVideoChat, openChat}) => {
  return (
    <nav className="navbar">
      <button className="navbar-button" onClick={openWhiteBoard}>Whiteboard</button>
      <button className="navbar-button" onClick={openVideoChat}>Video Call</button>
      <button className="navbar-button" onClick={openChat}>Chat</button>
    </nav>
  );
};

export default Navbar;
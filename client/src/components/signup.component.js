import React from 'react';
import axios from 'axios';
import { useState } from 'react';
import '../css/signup.component.css';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {

  const navigate = useNavigate();
  axios.defaults.baseURL = 'http://localhost:5000';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      await axios.post('/api/register', { username, email, password });
      alert('User registered successfully');
      navigate('/login');
    } catch (error) {
      console.error(error);
      alert('Error registering user');
    }
  };

  return (
    <div id='signup'>
      <form onSubmit={handleRegister} id='signup-form'>
        <h3 id='signup-title'>Sign Up</h3>
        <div>
          <label id='username-label'>User name</label>
          <input
            type="text"
            placeholder="First name"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            id='username-input'
          />
        </div>
        <div>
          <label id='email-label'>Email address</label>
          <input
            type="email"
            placeholder="Enter email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            id='email-input'
          />
        </div>
        <div>
          <label id='password-label'>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            id='password-input'
          />
        </div>
        <div>
          <button type="submit" id='signup-button'>
            Sign Up
          </button>
        </div>
        <p id='signup-already'>
          Already registered <a href="/" id='signup-link' >sign in?</a>
        </p>
      </form>
    </div>
  );
};

export default SignUp;
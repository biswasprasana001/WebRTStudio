import React from 'react';
import axios from 'axios';
import { useState, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import '../css/login.component.css';
import { UserContext } from '../context/UserContext';
import Message from './message.component';

const Login = () => {
  const navigate = useNavigate();
  const { setUsername } = useContext(UserContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  axios.defaults.baseURL = 'https://webrtstudio-server.onrender.com';

  const handleLogin = async () => {

    try {
      const response = await axios.post('/api/login', { email, password });
      const token = response.data.token;
      const username = response.data.username;
      console.log(username);
      if (username) {
        setUsername(username);
      }
      if (token) {
        alert('User logged in successfully!');
        localStorage.setItem('token', token);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
      alert('Invalid email or password');
    }
  };

  return (
    <div id='login'>
      <Message />
      <form id='login-form'>
        <h3 id='login-title'>Sign In</h3>

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
          <button type="button" onClick={handleLogin} id='login-button'>Submit</button>
          <a href='/sign-up' id='signup-link'>
            <button type="button" id='signup-button'>SignUp</button>
          </a>
        </div>
      </form>
    </div>
  )
}

export default Login;
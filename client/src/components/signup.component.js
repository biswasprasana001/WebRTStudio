import React from 'react'
import axios from 'axios'
import { useState } from 'react'

const SignUp = () => {

  axios.defaults.baseURL = 'http://localhost:5000';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');


  const handleRegister = async () => {
    try {
      await axios.post('/api/register', { username, email, password });
      alert('User registered successfully');
    } catch (error) {
      console.error(error);
      alert('Error registering user');
    }
  };

  return (
    <form>
      <h3>Sign Up</h3>
      <div className="mb-3">
        <label>User name</label>
        <input
          type="text"
          className="form-control"
          placeholder="First name"
          onChange={(e) => setUsername(e.target.value)}
          input={username}
        />
      </div>
      <div className="mb-3">
        <label>Email address</label>
        <input
          type="email"
          className="form-control"
          placeholder="Enter email"
          onChange={(e) => setEmail(e.target.value)}
          input={email}
        />
      </div>
      <div className="mb-3">
        <label>Password</label>
        <input
          type="password"
          className="form-control"
          placeholder="Enter password"
          onChange={(e) => setPassword(e.target.value)}
          input={password}
        />
      </div>
      <div className="d-grid">
        <button type="submit" onClick={handleRegister} className="btn btn-primary">
          Sign Up
        </button>
      </div>
      <p className="forgot-password text-right">
        Already registered <a href="/sign-in">sign in?</a>
      </p>
    </form>
  )
}

export default SignUp

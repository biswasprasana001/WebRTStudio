import React from 'react';
import axios from 'axios';
import { useState } from 'react';

const Login = () => {

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  axios.defaults.baseURL = 'http://localhost:5000';

  const handleLogin = async () => {
    try {
      const response = await axios.post('/api/login', { email, password });
      alert('User logged in successfully! Token: ' + response.data.token);
      
    } catch (error) {
      console.error(error);
      alert('Invalid email or password');
    }
  };

  return (
    <form>
      <h3>Sign In</h3>

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

      <div className="mb-3">
        <div className="custom-control custom-checkbox">
          <input
            type="checkbox"
            className="custom-control-input"
            id="customCheck1"
            onClick={() => setIsLogin(!isLogin)}
          />
          <label className="custom-control-label" htmlFor="customCheck1">
            Remember me
          </label>
        </div>
      </div>

      <div className="d-grid gap-2 d-md-flex justify-content-md-center">
        <button class="btn btn-primary me-md-2" type="button" onClick={handleLogin}>Submit</button>
        <a href='/sign-up'>
          <button class="btn btn-primary" type="button">SignUp</button>
        </a>
      </div>
    </form>
  )
}

export default Login

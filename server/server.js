// server\server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const User = require('./Models/User');
const Room = require('./Models/Room');
const Code = require('./Models/Code');
const Message = require('./Models/Message');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

const socketIo = require('socket.io');

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use(express.json());

app.use(cors());

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering user');
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send('Invalid email or password');
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in');
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { name } = req.body;
    const room = new Room({ name });
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

app.post('/api/code/save', async (req, res) => {
  try {
    const { roomId, html, css, js } = req.body;
    const code = await Code.findOneAndUpdate(
      { roomId },
      { html, css, js },
      { new: true, upsert: true }
    );
    res.status(200).json(code);
  } catch (error) {
    console.error('Error saving code:', error);
    res.status(500).json({ error: 'Failed to save code' });
  }

});

app.get('/api/code/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const code = await Code.findOne({ roomId });
    res.json(code);
  } catch (error) {
    console.error('Error fetching code:', error);
    res.status(500).json({ error: 'Failed to fetch code' });
  }
});

app.post('/api/message/save', async (req, res) => {
  try {
    const { username, text, roomId } = req.body;
    const message = new Message({ username, text, roomId });
    await message.save();
    res.status(200).json(message);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
})

app.get('/api/message/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const io = socketIo(server, {
  cors: true
});

io.on('connection', (socket) => {
  socket.on('join', (roomId) => {
    socket.join(roomId);
  })
  // codeEditor
  socket.on('html', (value, roomId) => {
    socket.broadcast.to(roomId).emit('html', value);
  })
  socket.on('css', (value, roomId) => {
    socket.broadcast.to(roomId).emit('css', value);
  })
  socket.on('js', (value, roomId) => {
    socket.broadcast.to(roomId).emit('js', value);
  })
  // whiteboard
  socket.on('canvasImage', (data, roomId) => {
    socket.broadcast.to(roomId).emit('canvasImage', data);
  });
  socket.on('clear', (roomId) => {
    socket.broadcast.to(roomId).emit('clear');
  });
  // videoChat
  socket.on('user-connected', (roomId, peerId, streamID) => {
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', peerId)

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', peerId, streamID)
    })
  })
  // textChat
  socket.on('text-message', (message, roomId) => {
    socket.broadcast.to(roomId).emit('text-message', message)
  })
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
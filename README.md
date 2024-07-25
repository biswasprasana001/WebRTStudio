# WebRTStudio

## Live Demo

You can access the live version of the project [here](https://web-rt-studio-client.vercel.app/). Please note that the backend may take 50 seconds or longer to load, as the server shuts down after 30 minutes of inactivity and requires time to restart upon receiving a new request.

##

WebRTStudio is a web-based collaborative platform designed for real-time communication and code collaboration. The platform supports video and text chat, a code editor, and a whiteboard, enabling users to work together efficiently and effectively.

## Features

- **Real-Time Video Chat**: Communicate with team members through video conferencing.
- **Text Chat**: Engage in text-based conversations for quick communication.
- **Code Editor**: Collaborate on code with syntax highlighting and real-time updates.
- **Whiteboard**: Share ideas visually with a collaborative whiteboard.
- **User Authentication**: Secure user registration and login functionality.
- **Room Management**: Create and join rooms for focused collaboration sessions.

## Technologies Used

### Frontend
- **React**: A JavaScript library for building user interfaces.
- **React Router**: For routing within the React application.
- **Monaco Editor**: Integrated code editor for real-time collaboration.
- **Bootstrap**: For responsive and modern UI components.
- **Socket.io**: For real-time communication between clients and the server.
- **PeerJS**: For WebRTC-based video chat functionality.

### Backend
- **Node.js**: JavaScript runtime for building server-side applications.
- **Express**: Web framework for Node.js.
- **MongoDB**: NoSQL database for storing user, room, and message data.
- **Mongoose**: ODM for MongoDB, providing schema-based data modeling.
- **JWT**: For secure user authentication.
- **Socket.io**: For WebSocket-based real-time communication.


## Getting Started

### Prerequisites
- **Node.js**: Ensure Node.js is installed on your machine.
- **MongoDB**: Set up a MongoDB database or use a cloud-based MongoDB service.
- **Environment Variables**: Create a `.env` file in the root directory with the following variables:
  - `MONGODB_URI`: MongoDB connection string.
  - `JWT_SECRET`: Secret key for JWT.

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/biswasprasana001/WebRTStudio.git
   cd WebRTStudio
   ```

2. Install dependencies for the server:
   ```sh
   cd server
   npm install
   ```

3. Install dependencies for the client:
   ```sh
   cd ../client
   npm install
   ```

### Running the Application

1. Start the server:
   ```sh
   cd server
   npm start
   ```

2. Start the client:
   ```sh
   cd ../client
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`.

### Available Scripts

In the client directory, you can run:

- **`npm start`**: Runs the app in development mode.
- **`npm test`**: Launches the test runner in interactive watch mode.
- **`npm run build`**: Builds the app for production.
- **`npm run eject`**: Ejects the Create React App configuration.

## Project Structure

### Client
- **public/**: Static files and the HTML template.
- **src/**: Main source code for the React application.
  - **components/**: React components for various features.
  - **context/**: Context providers for global state management.
  - **css/**: Stylesheets for the components.
  - **App.js**: Main application component with routing.
  - **index.js**: Entry point of the React application.

### Server
- **Models/**: Mongoose schemas for User, Room, Code, and Message.
- **server.js**: Main server file that sets up Express, MongoDB connection, and Socket.io.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

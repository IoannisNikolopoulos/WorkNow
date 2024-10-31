const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const cronService = require('./services/cronService');
const chalk = require('chalk');
require('dotenv').config();
const userRoutes = require('./routes/userRoutes');

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// SSL certificate for HTTPS
let httpsOptions;
try {
  httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
    ciphers: 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256',
    secureProtocol: 'TLSv1_2_method',
  };
  console.log('SSL certificates loaded successfully');
} catch (err) {
  console.error('Error loading SSL certificates:', err);
  process.exit(1);
}

// Initialize the Express app
const app = express();

// HTTPS server configuration
const server = https.createServer(httpsOptions, app); // Use 'server' for HTTPS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io globally accessible
global.io = io;

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware setup
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: true,
      httpOnly: false,
    },
  })
);

// Routes
app.use('/api/articles', require('./routes/articleRoutes'));
app.use('/api/connections', require('./routes/connectionRoutes'));
app.use('/api/job-listings', require('./routes/jobListingRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/interactions', require('./routes/interactionRoutes'));

// Serve React frontend
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Import Conversation model
const Conversation = require('./models/conversation');

// Real-time communication using Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a room for a specific user
  socket.on('joinUser', (userId) => {
    socket.join(userId);
    console.log(`User ${socket.id} joined room for user ${userId}`);
  });

  // Join a conversation room
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  // Handle sending a message
  socket.on('sendMessage', async ({ conversationId, senderId, receiverId, text }, callback) => {
    try {
      if (!senderId || !receiverId) {
        throw new Error('Sender or receiver ID is missing');
      }

      let conversation = await Conversation.findById(conversationId);

      // If the conversation doesn't exist, create a new one
      if (!conversation) {
        conversation = new Conversation({
          participants: [senderId, receiverId],
          messages: [],
        });
        await conversation.save();
        // Emit newConversation event
        io.to(senderId).emit('newConversation', conversation);
        io.to(receiverId).emit('newConversation', conversation);
      }

      const newMessage = {
        senderId: senderId.toString(),
        receiverId: receiverId.toString(),
        text,
        conversationId: conversation._id, // Make sure to use the correct conversation ID
      };

      conversation.messages.push(newMessage);
      await conversation.save();

      // Emit the message to both the sender and receiver's rooms
      io.to(conversationId).emit('receiveMessage', newMessage);

      if (callback) {
        callback({ status: 'ok' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (callback) {
        callback({ status: 'error', error: error.message });
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Additional routes
app.use('/api', userRoutes);

// Initialize scheduled tasks
cronService.scheduleTasks();

// Function to start the server
function startServer() {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => { // Changed from 'app.listen' to 'server.listen'
    console.log(chalk.blue(`Server is running on port ${PORT}`));
  });
}

// Connect to MongoDB and then start the server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(chalk.green('Connected to MongoDB'));
    startServer(); // Start the server after successful DB connection
  })
  .catch(err => {
    console.error(chalk.red('Failed to connect to MongoDB', err));
    process.exit(1); // Exit the process if DB connection fails
  });

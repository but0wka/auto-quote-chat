const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const User = require('./models/User');
const Chat = require('./models/Chat');

const allowedOrigins = [
  'http://localhost:3000',
  'https://auto-quote-chat-frontend.onrender.com',
];

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Cross-Origin-Opener-Policy'],
  })
);

app.use(express.json());

const createInitialData = async () => {
  try {
    const users = await User.find();

    if (users.length === 0) {
      const testUser = await User.create({
        googleId: 'test123',
        email: 'test@example.com',
        name: 'Test User',
        picture: '',
      });
      users.push(testUser);
    }

    for (const user of users) {
      const userChats = await Chat.find({ userId: user._id });

      if (userChats.length === 0) {
        const initialChats = [
          {
            firstName: 'John',
            lastName: 'Doe',
            messages: [],
            userId: user._id,
          },
          {
            firstName: 'Robert',
            lastName: 'Johnson',
            messages: [],
            userId: user._id,
          },
          {
            firstName: 'abia',
            lastName: 'abiai',
            messages: [],
            userId: user._id,
          },
        ];

        await Chat.insertMany(initialChats);
        console.log(`Initial chats created for user: ${user.name}`);
      }
    }
  } catch (error) {
    console.error('Error creating initial data:', error);
  }
};

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ssl: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
  })
  .then(() => {
    console.log('MongoDB connected successfully');
    createInitialData();
  });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/quotes', require('./routes/quotes'));

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('join', (userId) => {
    console.log('Join event received with userId:', userId);
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('startAutoMode', async (userId) => {
    console.log('Start auto mode event received with userId:', userId);

    if (!userId) {
      console.error('No userId provided for auto mode');
      return;
    }

    console.log(`Auto mode started for user ${userId}`);

    const interval = setInterval(async () => {
      try {
        const userChats = await Chat.find({ userId });
        if (userChats.length === 0) return;

        const randomChat =
          userChats[Math.floor(Math.random() * userChats.length)];

        const [userQuote, botQuote] = await Promise.all([
          fetch('https://api.api-ninjas.com/v1/quotes', {
            headers: { 'X-Api-Key': process.env.API_NINJA_KEY },
          }).then((res) => res.json()),
          fetch('https://api.api-ninjas.com/v1/quotes', {
            headers: { 'X-Api-Key': process.env.API_NINJA_KEY },
          }).then((res) => res.json()),
        ]);

        const userMessage = {
          text: userQuote[0].quote,
          sender: 'user',
          timestamp: new Date(),
        };

        const botMessage = {
          text: botQuote[0].quote,
          sender: 'bot',
          timestamp: new Date(Date.now() + 1000),
        };

        randomChat.messages.push(userMessage, botMessage);
        await randomChat.save();

        io.to(userId).emit('newAutoMessage', {
          chatId: randomChat._id,
          messages: [userMessage, botMessage],
          chatName: `${randomChat.firstName} ${randomChat.lastName}`,
        });
      } catch (error) {
        console.error('Auto message error:', error);
      }
    }, 10000);

    socket.interval = interval;
  });

  socket.on('stopAutoMode', () => {
    if (socket.interval) {
      clearInterval(socket.interval);
      console.log('Auto mode stopped');
    }
  });

  socket.on('disconnect', () => {
    if (socket.interval) {
      clearInterval(socket.interval);
    }
    console.log('Client disconnected');
  });

  socket.on('newMessage', async ({ chatId, message }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      const userMessage = {
        text: message,
        sender: 'user',
        timestamp: new Date(),
      };
      chat.messages.push(userMessage);
      await chat.save();

      const botQuote = await getBotResponse();

      const botMessage = {
        text: botQuote[0].quote,
        sender: 'bot',
        timestamp: new Date(Date.now() + 1000),
      };

      chat.messages.push(botMessage);
      await chat.save();

      io.emit('newAutoMessage', {
        chatId,
        messages: [userMessage, botMessage],
        chatName: `${chat.firstName} ${chat.lastName}`,
      });
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

if (!process.env.API_NINJA_KEY) {
  console.error('API_NINJA_KEY is not set in environment variables');
  process.exit(1);
}

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Chat = require('../models/Chat');
const fetch = require('node-fetch');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getRandomName = async () => {
  try {
    const response = await fetch('https://api.api-ninjas.com/v1/randomuser', {
      headers: {
        'X-Api-Key': process.env.API_NINJA_KEY,
      },
    });
    const data = await response.json();
    return {
      firstName: data.name.split(' ')[0],
      lastName: data.name.split(' ')[1] || '',
    };
  } catch (error) {
    console.error('Error fetching random name:', error);
    const names = [
      { firstName: 'Emma', lastName: 'Wilson' },
      { firstName: 'Oliver', lastName: 'Taylor' },
      { firstName: 'Sophia', lastName: 'Brown' },
      { firstName: 'Lucas', lastName: 'Davies' },
      { firstName: 'Ava', lastName: 'Smith' },
      { firstName: 'William', lastName: 'Jones' },
      { firstName: 'Isabella', lastName: 'Miller' },
      { firstName: 'James', lastName: 'Anderson' },
      { firstName: 'Mia', lastName: 'White' },
      { firstName: 'Benjamin', lastName: 'Martin' },
    ];
    return names[Math.floor(Math.random() * names.length)];
  }
};

const createInitialChats = async (userId) => {
  try {
    const names = [];
    for (let i = 0; i < 3; i++) {
      const name = await getRandomName();
      names.push(name);
    }

    const initialChats = names.map(({ firstName, lastName }) => ({
      firstName,
      lastName,
      messages: [],
      userId: userId,
    }));

    await Chat.insertMany(initialChats);
  } catch (error) {
    console.error('Error creating initial chats:', error);
  }
};

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    let user = await User.findOne({ googleId: payload.sub });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
      isNewUser = true;
    }

    if (isNewUser) {
      await createInitialChats(user._id);
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      token,
      user: {
        ...user.toObject(),
        _id: user._id,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
});

// Додаємо маршрут для перевірки профілю
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;

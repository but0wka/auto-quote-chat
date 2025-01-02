const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const jwt = require('jsonwebtoken');

// Middleware для перевірки авторизації
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Отримання всіх чатів користувача
router.get('/', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId })
      .sort({ lastMessageAt: -1 })
      .exec();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Створення нового чату
router.post('/', authMiddleware, async (req, res) => {
  try {
    const chat = new Chat({
      ...req.body,
      userId: req.userId,
    });
    const newChat = await chat.save();
    res.status(201).json(newChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Оновлення чату
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    Object.assign(chat, req.body);
    const updatedChat = await chat.save();
    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Видалення чату
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await Chat.deleteOne({ _id: req.params.id });
    res.json({ message: 'Chat deleted' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: error.message });
  }
});

// Оновлюємо маршрут для позначення повідомлень як прочитаних
router.put('/:chatId/messages/read', authMiddleware, async (req, res) => {
  try {
    // Знаходимо чат і оновлюємо всі повідомлення від бота як прочитані
    const chat = await Chat.findOneAndUpdate(
      {
        _id: req.params.chatId,
        userId: req.userId,
      },
      {
        $set: {
          'messages.$[elem].isRead': true,
          'messages.$[elem].viewed': true,
        },
      },
      {
        arrayFilters: [{ 'elem.sender': 'bot' }],
        new: true,
      }
    );

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error updating messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

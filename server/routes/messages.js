const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get chat messages
router.get('/:chatId', authMiddleware, async (req, res) => {
  try {
    console.log(
      'Getting messages for chat:',
      req.params.chatId,
      'User:',
      req.userId
    );
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.userId,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.json(chat.messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add message to chat
router.post('/:chatId', authMiddleware, async (req, res) => {
  try {
    console.log(
      'Adding message to chat:',
      req.params.chatId,
      'User:',
      req.userId
    );
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.userId,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const now = new Date();
    const newMessage = {
      text: req.body.text,
      sender: req.body.sender,
      timestamp: now,
    };

    chat.messages.push(newMessage);
    chat.lastMessageAt = now;

    const updatedChat = await chat.save();
    console.log('Message added successfully');
    res.status(201).json(updatedChat);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(400).json({ message: error.message });
  }
});

// Оновлення повідомлення
router.put('/:chatId/:messageId', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.userId,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const message = chat.messages.id(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.text = req.body.text;
    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

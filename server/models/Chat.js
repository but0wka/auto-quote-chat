const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: String,
  sender: String,
  timestamp: Date,
});

const chatSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messages: [messageSchema],
});

module.exports = mongoose.model('Chat', chatSchema);

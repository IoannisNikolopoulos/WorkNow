const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Fetch conversations for a user
router.get('/:userId', messageController.getConversationsByUserId);

// Create a new conversation
router.post('/', messageController.createConversation);

// Send a message in a conversation
router.post('/:userId/messages', messageController.sendMessage);

module.exports = router;

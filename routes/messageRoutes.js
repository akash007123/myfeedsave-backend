const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Send a message
router.post('/send', messageController.sendMessage);

// Get conversation with a specific user
router.get('/conversation/:otherUserId', messageController.getConversation);

// Get all conversations
router.get('/conversations', messageController.getConversations);

module.exports = router; 
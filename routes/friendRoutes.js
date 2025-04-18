const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const friendController = require('../controllers/friendController');

// Apply auth middleware to all friend routes
router.use(authMiddleware);

// Send friend request to a user
router.post('/request/:receiverId', friendController.sendFriendRequest);

// Get pending received friend requests
router.get('/requests', friendController.getReceivedFriendRequests);

// Accept a friend request
router.put('/accept/:senderId', friendController.acceptFriendRequest);

// Reject (or cancel) a friend request
router.delete('/reject/:senderId', friendController.rejectFriendRequest);

// Get list of friends
router.get('/', friendController.getFriends);

// Search for users (optional but useful)
router.get('/search', friendController.searchUsers);

module.exports = router;
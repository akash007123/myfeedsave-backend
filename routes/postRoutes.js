const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    upload,
    createPost,
    getUserPosts,
    updatePost,
    deletePost
} = require('../controllers/postController');

// All routes are protected with authMiddleware
router.use(authMiddleware);

// Create a new post
router.post('/', upload.single('media'), createPost);

// Get user's posts
router.get('/', getUserPosts);

// Update a post
router.put('/:postId', upload.single('media'), updatePost);

// Delete a post
router.delete('/:postId', deletePost);

module.exports = router;
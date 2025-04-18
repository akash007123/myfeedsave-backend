const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { signup, login, getUserProfile, updateUserProfile, deleteUserProfile, upload } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', upload.single('profilePicture'), signup);
router.post('/login', login);
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, upload.single('profilePicture'), updateUserProfile);
router.delete('/profile', authMiddleware, deleteUserProfile);

module.exports = router;

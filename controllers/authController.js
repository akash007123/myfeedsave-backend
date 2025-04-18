const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'upload');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for profile picture upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);  // Use the absolute path
    },
    filename: (req, file, cb) => {
        // Create a unique filename with timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

// Create the multer instance with our configurations
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const signup = async (req, res) => {
    const { name, email, mobile, password } = req.body;

    try {
        console.log('Signup request received:', { name, email, mobile, file: req.file });
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Save just the filename for the profile picture, not the full path
        const profilePicture = req.file ? req.file.filename : null;
        console.log('Profile picture filename:', profilePicture);

        const user = new User({
            name,
            email,
            mobile,
            password: hashedPassword,
            profilePicture // Save just the filename
        });

        await user.save();
        console.log('User saved successfully:', user._id);

        // Don't send the token on signup, require login
        res.status(201).json({ 
            message: 'User created successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('-password');
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const userWithPassword = await User.findOne({ email });
        const isMatch = await bcrypt.compare(password, userWithPassword.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        // Send the complete user object (except password)
        res.status(200).json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error });
  }
};

const updateUserProfile = async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const { name, mobile } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (mobile) updates.mobile = mobile;

  if (req.file) {
    updates.profilePicture = req.file.filename;
  }

  try {
    console.log(`Updating profile for user ${req.userId} with data:`, updates);

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Profile updated successfully for user ${req.userId}`);
    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });

  } catch (error) {
    console.error(`Error updating profile for user ${req.userId}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

const deleteUserProfile = async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    console.log(`Attempting to delete profile for user ${req.userId}`);
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.userId);

    console.log(`Profile deleted successfully for user ${req.userId}`);
    res.status(200).json({ message: 'User account deleted successfully' });

  } catch (error) {
    console.error(`Error deleting profile for user ${req.userId}:`, error);
    res.status(500).json({ message: 'Error deleting user account', error: error.message });
  }
};

module.exports = { signup, login, getUserProfile, updateUserProfile, deleteUserProfile, upload };

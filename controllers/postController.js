const Post = require('../models/Post');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for media uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'posts');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Create a new post
const createPost = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No media file provided' });
        }

        const { description, isPublic } = req.body;
        const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';

        const post = new Post({
            userId: req.userId, // From auth middleware
            description,
            mediaType,
            mediaUrl: req.file.filename,
            isPublic: isPublic === 'true'
        });

        await post.save();
        console.log('Post created:', post._id);

        res.status(201).json({
            message: 'Post created successfully',
            post
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Error creating post', error: error.message });
    }
};

// Get user's posts
const getUserPosts = async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.userId })
            .sort({ createdAt: -1 }); // Latest first

        res.status(200).json({ posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Error fetching posts', error: error.message });
    }
};

// Update a post
const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { description, isPublic } = req.body;

        const post = await Post.findOne({ _id: postId, userId: req.userId });
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found or unauthorized' });
        }

        // Update media if new file is uploaded
        if (req.file) {
            // Delete old media file
            const oldMediaPath = path.join(__dirname, '..', 'uploads', 'posts', post.mediaUrl);
            fs.unlink(oldMediaPath, (err) => {
                if (err) console.error('Error deleting old media:', err);
            });

            post.mediaUrl = req.file.filename;
            post.mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        }

        // Update other fields
        post.description = description || post.description;
        post.isPublic = isPublic === 'true';
        post.updatedAt = Date.now();

        await post.save();

        res.status(200).json({
            message: 'Post updated successfully',
            post
        });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Error updating post', error: error.message });
    }
};

// Delete a post
const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        
        const post = await Post.findOne({ _id: postId, userId: req.userId });
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found or unauthorized' });
        }

        // Delete media file
        const mediaPath = path.join(__dirname, '..', 'uploads', 'posts', post.mediaUrl);
        fs.unlink(mediaPath, (err) => {
            if (err) console.error('Error deleting media file:', err);
        });

        await post.deleteOne();

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Error deleting post', error: error.message });
    }
};

module.exports = {
    upload,
    createPost,
    getUserPosts,
    updatePost,
    deletePost
};
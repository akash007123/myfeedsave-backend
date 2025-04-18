const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const friendRoutes = require('./routes/friendRoutes');

dotenv.config();

const app = express();
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for PROFILE PICTURES from the 'upload' directory
// Accessible via http://localhost:5000/uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, 'upload')));

// Serve static files for POST MEDIA from the 'uploads/posts' directory
// Accessible via http://localhost:5000/uploads/posts/<filename>
app.use('/uploads/posts', express.static(path.join(__dirname, 'uploads', 'posts')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/friends', friendRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log('Server is running on port', process.env.PORT || 5000);
});

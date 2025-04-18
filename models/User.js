const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String },
    password: { type: String, required: true },
    profilePicture: { type: String, default: null },
    // --- Friend System Fields ---
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to other User documents
    }],
    sentFriendRequests: [{ // Users this user has sent requests TO
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    receivedFriendRequests: [{ // Users who have sent requests TO this user
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
    // --- End Friend System Fields ---
}, { timestamps: true }); // Add timestamps for createdAt/updatedAt

const User = mongoose.model('User', userSchema);

module.exports = User;
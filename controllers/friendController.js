const User = require('../models/User');
const mongoose = require('mongoose');

// Send Friend Request
exports.sendFriendRequest = async (req, res) => {
    const senderId = req.userId; // From authMiddleware
    const { receiverId } = req.params;

    if (senderId === receiverId) {
        return res.status(400).json({ message: "Cannot send friend request to yourself." });
    }

    try {
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!receiver) {
            return res.status(404).json({ message: "Receiver user not found." });
        }

        // Check if already friends
        if (sender.friends.includes(receiverId)) {
            return res.status(400).json({ message: "Already friends with this user." });
        }

        // Check if request already sent
        if (sender.sentFriendRequests.includes(receiverId) || receiver.receivedFriendRequests.includes(senderId)) {
            return res.status(400).json({ message: "Friend request already sent." });
        }

        // Check if request already received from the other user
         if (sender.receivedFriendRequests.includes(receiverId)) {
            return res.status(400).json({ message: "You have a pending request from this user. Please respond to it." });
        }

        // Add request
        await User.findByIdAndUpdate(senderId, { $addToSet: { sentFriendRequests: receiverId } });
        await User.findByIdAndUpdate(receiverId, { $addToSet: { receivedFriendRequests: senderId } });

        console.log(`Friend request sent from ${senderId} to ${receiverId}`);
        res.status(200).json({ message: "Friend request sent successfully." });

    } catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ message: "Server error sending friend request." });
    }
};

// Get Received Friend Requests
exports.getReceivedFriendRequests = async (req, res) => {
    const userId = req.userId;

    try {
        const user = await User.findById(userId)
            .populate('receivedFriendRequests', 'name email profilePicture'); // Populate sender details

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ requests: user.receivedFriendRequests });

    } catch (error) {
        console.error("Error fetching received friend requests:", error);
        res.status(500).json({ message: "Server error fetching friend requests." });
    }
};

// Accept Friend Request
exports.acceptFriendRequest = async (req, res) => {
    const receiverId = req.userId;
    const { senderId } = req.params;

     if (!mongoose.Types.ObjectId.isValid(senderId)) {
        return res.status(400).json({ message: 'Invalid sender ID format' });
    }

    try {
        // Check if the request actually exists
        const receiver = await User.findById(receiverId);
        if (!receiver.receivedFriendRequests.includes(senderId)) {
            return res.status(404).json({ message: "Friend request not found." });
        }

        // Add to friends list for both users, remove from requests
        await User.findByIdAndUpdate(receiverId, {
            $addToSet: { friends: senderId },
            $pull: { receivedFriendRequests: senderId }
        });

        await User.findByIdAndUpdate(senderId, {
            $addToSet: { friends: receiverId },
            $pull: { sentFriendRequests: receiverId }
        });

        console.log(`Friend request from ${senderId} accepted by ${receiverId}`);
        res.status(200).json({ message: "Friend request accepted." });

    } catch (error) {
        console.error("Error accepting friend request:", error);
        res.status(500).json({ message: "Server error accepting friend request." });
    }
};

// Reject Friend Request
exports.rejectFriendRequest = async (req, res) => {
    const receiverId = req.userId;
    const { senderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(senderId)) {
        return res.status(400).json({ message: 'Invalid sender ID format' });
    }

    try {
         // Check if the request actually exists before trying to pull
        const receiver = await User.findById(receiverId);
        if (!receiver.receivedFriendRequests.includes(senderId)) {
            // It's okay if the request isn't there, maybe already rejected. Just confirm.
             console.log(`Attempted to reject request from ${senderId} for ${receiverId}, but request not found.`);
            return res.status(200).json({ message: "Friend request removed or already processed." });
        }

        // Remove from requests for both users
        await User.findByIdAndUpdate(receiverId, {
            $pull: { receivedFriendRequests: senderId }
        });
        await User.findByIdAndUpdate(senderId, {
            $pull: { sentFriendRequests: receiverId }
        });

        console.log(`Friend request from ${senderId} rejected by ${receiverId}`);
        res.status(200).json({ message: "Friend request rejected." });

    } catch (error) {
        console.error("Error rejecting friend request:", error);
        res.status(500).json({ message: "Server error rejecting friend request." });
    }
};

// Get Friends List
exports.getFriends = async (req, res) => {
    const userId = req.userId;

    try {
        const user = await User.findById(userId)
            .populate('friends', 'name email profilePicture'); // Populate friend details

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ friends: user.friends });

    } catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({ message: "Server error fetching friends." });
    }
};

// --- Helper for searching users (Optional but useful) ---
exports.searchUsers = async (req, res) => {
    const query = req.query.q || '';
    const currentUserId = req.userId;

    try {
        // Find users matching query (name or email), exclude current user
        const users = await User.find({
            $and: [
                 { _id: { $ne: currentUserId } }, // Exclude self
                 {
                    $or: [
                        { name: { $regex: query, $options: 'i' } }, // Case-insensitive regex search
                        { email: { $regex: query, $options: 'i' } }
                    ]
                 }
            ]
        }).select('name email profilePicture'); // Select only needed fields

        res.status(200).json({ users });

    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ message: "Server error searching users." });
    }
};
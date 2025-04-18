const Message = require('../models/Message');
const User = require('../models/User');

// Send a message
exports.sendMessage = async (req, res) => {
    const senderId = req.userId;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
        return res.status(400).json({ message: "Receiver ID and content are required" });
    }

    try {
        // Check if users are friends
        const sender = await User.findById(senderId);
        if (!sender) {
            return res.status(404).json({ message: "Sender not found" });
        }

        // Convert friend IDs to strings for comparison
        const friendIds = sender.friends.map(id => id.toString());
        if (!friendIds.includes(receiverId)) {
            return res.status(403).json({ message: "You can only message your friends" });
        }

        const message = new Message({
            sender: senderId,
            receiver: receiverId,
            content
        });

        await message.save();
        
        // Populate sender and receiver data before sending response
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name profilePicture')
            .populate('receiver', 'name profilePicture');

        res.status(201).json({ 
            message: "Message sent successfully", 
            data: populatedMessage 
        });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Error sending message" });
    }
};

// Get conversation between two users
exports.getConversation = async (req, res) => {
    const userId = req.userId;
    const { otherUserId } = req.params;

    try {
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        }).sort({ createdAt: 1 })
          .populate('sender', 'name profilePicture')
          .populate('receiver', 'name profilePicture');

        // Mark messages as read
        await Message.updateMany(
            { sender: otherUserId, receiver: userId, read: false },
            { $set: { read: true } }
        );

        res.status(200).json({ messages });
    } catch (error) {
        console.error("Error fetching conversation:", error);
        res.status(500).json({ message: "Error fetching conversation" });
    }
};

// Get all conversations for a user
exports.getConversations = async (req, res) => {
    const userId = req.userId;

    try {
        // Get all messages where user is either sender or receiver
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }]
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'name profilePicture')
        .populate('receiver', 'name profilePicture');

        // Group messages by conversation
        const conversations = {};
        messages.forEach(message => {
            if (!message.sender || !message.receiver) {
                console.warn('Message has missing sender or receiver data:', message._id);
                return;
            }

            const otherUserId = message.sender._id.toString() === userId 
                ? message.receiver._id.toString() 
                : message.sender._id.toString();
            
            if (!conversations[otherUserId]) {
                conversations[otherUserId] = {
                    user: message.sender._id.toString() === userId ? message.receiver : message.sender,
                    lastMessage: message,
                    unreadCount: 0
                };
            }
        });

        // Count unread messages
        const unreadMessages = await Message.find({
            receiver: userId,
            read: false
        }).populate('sender', '_id');

        unreadMessages.forEach(message => {
            if (!message.sender) {
                console.warn('Unread message has missing sender data:', message._id);
                return;
            }
            const senderId = message.sender._id.toString();
            if (conversations[senderId]) {
                conversations[senderId].unreadCount++;
            }
        });

        res.status(200).json({ conversations: Object.values(conversations) });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: "Error fetching conversations" });
    }
}; 
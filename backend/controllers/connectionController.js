import User from '../models/User.js';

export const sendRequest = async (req, res) => {
    try {
        const { targetEduId } = req.body;
        const userId = req.user.userId; // From auth middleware

        const targetUser = await User.findOne({ eduId: targetEduId });
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found with that EduID.' });
        }

        if (targetUser._id.toString() === userId) {
            return res.status(400).json({ message: 'You cannot connect with yourself.' });
        }

        // Check existing connection
        const currentUser = await User.findById(userId);
        const existing = currentUser.connections.find(c => c.userId.toString() === targetUser._id.toString());

        if (existing) {
            if (existing.status === 'accepted') return res.status(400).json({ message: 'Already connected.' });
            if (existing.status === 'pending') return res.status(400).json({ message: 'Request already sent or received.' });
        }

        // Add to both users
        await User.findByIdAndUpdate(userId, {
            $push: { connections: { userId: targetUser._id, status: 'pending', initiator: true } }
        });

        await User.findByIdAndUpdate(targetUser._id, {
            $push: { connections: { userId: currentUser._id, status: 'pending', initiator: false } }
        });

        res.json({ message: 'Connection request sent.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

export const acceptRequest = async (req, res) => {
    try {
        const { requesterId } = req.body;
        const userId = req.user.userId;

        // Update current user
        await User.findOneAndUpdate(
            { _id: userId, "connections.userId": requesterId },
            { $set: { "connections.$.status": "accepted" } }
        );

        // Update requester
        await User.findOneAndUpdate(
            { _id: requesterId, "connections.userId": userId },
            { $set: { "connections.$.status": "accepted" } }
        );

        res.json({ message: 'Connection accepted.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

export const getConnections = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('connections.userId', 'username eduId profile publicKey');

        // Filter out connections requiring action? Or just send all with status
        const formatted = user.connections.map(c => ({
            id: c.userId._id,
            username: c.userId.username,
            eduId: c.userId.eduId,
            avatar: c.userId.profile?.avatar,
            status: c.status,
            status: c.status,
            muted: c.muted,
            messageTimer: c.messageTimer,
            initiator: c.initiator,
            publicKey: c.userId.publicKey
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

export const removeConnection = async (req, res) => {
    try {
        const { targetId } = req.body;
        const userId = req.user.userId;

        // Remove from both users
        await User.findByIdAndUpdate(userId, {
            $pull: { connections: { userId: targetId } }
        });

        await User.findByIdAndUpdate(targetId, {
            $pull: { connections: { userId: userId } }
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

export const toggleMute = async (req, res) => {
    try {
        const { targetId } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        const connection = user.connections.find(c => c.userId.toString() === targetId);

        if (!connection) return res.status(404).json({ message: 'Connection not found.' });

        connection.muted = !connection.muted;
        await user.save();

        res.json({ message: `Chat ${connection.muted ? 'muted' : 'unmuted'}.`, muted: connection.muted });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

export const updateTimer = async (req, res) => {
    try {
        const { targetId, timer } = req.body;
        const userId = req.user.userId;

        // Update self
        await User.findOneAndUpdate(
            { _id: userId, "connections.userId": targetId },
            { $set: { "connections.$.messageTimer": timer } }
        );

        // Update target user (SYNC)
        await User.findOneAndUpdate(
            { _id: targetId, "connections.userId": userId },
            { $set: { "connections.$.messageTimer": timer } }
        );

        res.json({ message: 'Timer updated for both users.', timer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
};

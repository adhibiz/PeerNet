const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authenticateToken = require('../middleware/auth');
const crypto = require('crypto');

// Get messages for a room
router.get('/room/:roomId', authenticateToken, async (req, res) => {
    try {
        const { limit = 50, before } = req.query; // before is a timestamp or doc ID

        // query WITHOUT orderBy/limit to avoid "Index Required" error for MVP
        // In production, create the index and restore the server-side sorting
        let query = db.collection('messages')
            .where('room_id', '==', req.params.roomId);

        if (before) {
            // This is complex with just timestamp string, usually need a doc snapshot
            // For MVP, simplistic handling or skip pagination beyond basic limit
        }

        const snapshot = await query.get();
        const messages = [];

        // Need to enrich with user info efficiently
        // In NoSQL, better to store sender_name/avatar in the message itself
        // Assuming we do that for new messages, but for backward compat we might fetch if missing

        snapshot.forEach(doc => {
            messages.push(doc.data());
        });

        // Sort in memory (Newest first)
        messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Apply limit
        const slicedMessages = messages.slice(0, parseInt(limit));

        res.json({ success: true, data: slicedMessages.reverse() }); // Return in chronological order
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching messages' });
    }
});

// Send a message
router.post('/room/:roomId', authenticateToken, async (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ success: false, message: 'Content is required' });
    }

    try {
        const messageId = crypto.randomUUID();
        const now = new Date().toISOString();

        // Fetch user details to embed
        const userDoc = await db.collection('users').doc(req.user.id).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        const message = {
            id: messageId,
            room_id: req.params.roomId,
            sender_id: req.user.id,
            content,
            created_at: now,
            sender_username: userData.username,
            sender_avatar: userData.profile_picture_url
        };

        await db.collection('messages').doc(messageId).set(message);

        res.status(201).json({ success: true, data: message });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error sending message' });
    }
});

module.exports = router;

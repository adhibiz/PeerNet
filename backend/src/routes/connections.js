const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authenticateToken = require('../middleware/auth');

// Follow a user
router.post('/follow/:userId', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.userId;

        if (followerId === followingId) {
            return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
        }

        const connectionId = `${followerId}_${followingId}`;
        const ref = db.collection('user_connections').doc(connectionId);

        const doc = await ref.get();
        if (doc.exists) {
            return res.status(400).json({ success: false, message: 'Already following' });
        }

        await ref.set({
            follower_id: followerId,
            following_id: followingId,
            created_at: new Date().toISOString()
        });

        res.json({ success: true, message: 'Followed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error following user' });
    }
});

// Unfollow a user
router.delete('/unfollow/:userId', authenticateToken, async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.userId;
        const connectionId = `${followerId}_${followingId}`;

        await db.collection('user_connections').doc(connectionId).delete();

        res.json({ success: true, message: 'Unfollowed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error unfollowing user' });
    }
});

// Get followers
router.get('/followers', authenticateToken, async (req, res) => {
    try {
        const snapshot = await db.collection('user_connections')
            .where('following_id', '==', req.user.id)
            .get();

        // This is slow in NoSQL without denormalization, but fetching IDs is okay
        // Ideally we'd store minimal follower info in the connection doc
        const followers = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            // Fetch user info for each follower (inefficient N+1)
            const userDoc = await db.collection('users').doc(data.follower_id).get();
            if (userDoc.exists) {
                const u = userDoc.data();
                followers.push({
                    id: u.id,
                    username: u.username,
                    full_name: u.full_name,
                    profile_picture_url: u.profile_picture_url
                });
            }
        }

        res.json({ success: true, data: followers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching followers' });
    }
});

// Get following
router.get('/following', authenticateToken, async (req, res) => {
    try {
        const snapshot = await db.collection('user_connections')
            .where('follower_id', '==', req.user.id)
            .get();

        const following = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.following_id).get();
            if (userDoc.exists) {
                const u = userDoc.data();
                following.push({
                    id: u.id,
                    username: u.username,
                    full_name: u.full_name,
                    profile_picture_url: u.profile_picture_url
                });
            }
        }

        res.json({ success: true, data: following });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching following' });
    }
});

module.exports = router;

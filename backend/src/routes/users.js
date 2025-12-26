const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authenticateToken = require('../middleware/auth');

// Get all users (mentors/peers) with search and filtering
router.get('/', async (req, res) => {
    const { search, role } = req.query; // skill filtering in FS requires diff structure or algolia

    try {
        let usersRef = db.collection('users');

        if (role) {
            usersRef = usersRef.where('role', '==', role);
        } else {
            usersRef = usersRef.where('is_active', '==', true);
        }

        const snapshot = await usersRef.get();
        let users = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            delete data.password_hash;
            users.push(data);
        });

        // Search filtering (client-side style)
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(user =>
                user.full_name?.toLowerCase().includes(searchLower) ||
                user.username?.toLowerCase().includes(searchLower) ||
                user.bio?.toLowerCase().includes(searchLower)
            );
        }

        // Skills population (expensive for lists, ideally denormalized on user doc)
        // For now, we'll skip skill validation in list view or do it sparsely

        res.json({
            success: true,
            data: users,
            pagination: { page: 1, limit: users.length }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching users' });
    }
});

// Get specific user profile (public)
router.get('/:id', async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.params.id).get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = userDoc.data();
        delete user.password_hash;

        // Fetch skills
        const skillsSnapshot = await db.collection('user_skills')
            .where('user_id', '==', req.params.id)
            .get();

        const skills = [];
        skillsSnapshot.forEach(doc => {
            const data = doc.data();
            // Need to join with skills definition collection if strictly relational, 
            // but for NoSQL, we assume skill name is denormalized or we fetch it.
            // Let's assume user_skills has the details for now or ignore deep join for MVP speed
            skills.push(data);
        });

        user.skills = skills;

        res.json({ success: true, data: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching user profile' });
    }
});

module.exports = router;

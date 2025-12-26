
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');
const crypto = require('crypto'); // For UUID generation

// Register
router.post('/register', async (req, res) => {
    const { email, username, password, full_name, role } = req.body;

    try {
        const usersRef = db.collection('users');

        // Parallel queries to check existence
        const emailQuery = await usersRef.where('email', '==', email).limit(1).get();
        const usernameQuery = await usersRef.where('username', '==', username).limit(1).get();

        if (!emailQuery.empty || !usernameQuery.empty) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const customId = crypto.randomUUID();

        const now = new Date().toISOString();
        const user = {
            id: customId,
            email,
            username,
            password_hash: hashedPassword,
            full_name,
            role: role || 'student',
            created_at: now,
            updated_at: now,
            is_active: true,
            peer_points: 0
        };

        // Use set() with merge: true to avoid overwriting if somehow ID collision (impossible with UUID)
        // But mainly to create document in collection even if collection is new
        await usersRef.doc(customId).set(user);

        // Return user without password
        delete user.password_hash;

        res.status(201).json({
            success: true,
            data: { user }
        });

    } catch (err) {
        console.error('Registration Error:', err);
        // If error code 5 (NOT_FOUND) typically means project not found or index issue
        // But for .where() queries it should work unless project ID is wrong
        res.status(500).json({ success: false, message: 'Server error during registration: ' + err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user
        const usersSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();

        if (usersSnapshot.empty) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const userDoc = usersSnapshot.docs[0];
        const user = userDoc.data();

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '24h' }
        );

        delete user.password_hash;

        res.json({
            success: true,
            data: {
                token,
                user
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// Update Profile
router.put('/profile', require('../middleware/auth'), async (req, res) => {
    const { full_name, bio, current_company, current_position, github_url, linkedin_url, portfolio_url } = req.body;

    try {
        const userRef = db.collection('users').doc(req.user.id);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const updates = {
            updated_at: new Date().toISOString()
        };
        // Only update defined fields
        if (full_name !== undefined) updates.full_name = full_name;
        if (bio !== undefined) updates.bio = bio;
        if (current_company !== undefined) updates.current_company = current_company;
        if (current_position !== undefined) updates.current_position = current_position;
        if (github_url !== undefined) updates.github_url = github_url;
        if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url;
        if (portfolio_url !== undefined) updates.portfolio_url = portfolio_url;

        await userRef.update(updates);

        // Return updated user
        const updatedDoc = await userRef.get();
        const updatedUser = updatedDoc.data();
        if (updatedUser) delete updatedUser.password_hash;

        res.json({
            success: true,
            data: updatedUser,
            message: 'Profile updated successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error updating profile' });
    }
});

// Get Profile
router.get('/profile', require('../middleware/auth'), async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.id).get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = userDoc.data();
        if (user) delete user.password_hash;

        // Fetch user skills from subcollection or separate collection
        const skillsSnapshot = await db.collection('user_skills')
            .where('user_id', '==', req.user.id)
            .get();

        const skills = [];
        skillsSnapshot.forEach(doc => skills.push(doc.data()));

        user.skills = skills;

        res.json({
            success: true,
            data: user
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching profile' });
    }
});

module.exports = router;

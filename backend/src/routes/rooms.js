const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase'); // using admin for transactions if needed
const authenticateToken = require('../middleware/auth');
const crypto = require('crypto');

// Get all learning rooms with filters
router.get('/', async (req, res) => {
    const { search, topic, level, status } = req.query;

    try {
        let roomsRef = db.collection('learning_rooms');

        if (status) {
            roomsRef = roomsRef.where('status', '==', status);
        } else {
            roomsRef = roomsRef.where('status', '==', 'active');
        }

        if (topic) {
            roomsRef = roomsRef.where('topic', '==', topic);
        }

        if (level) {
            roomsRef = roomsRef.where('skill_level', '==', level);
        }

        const snapshot = await roomsRef.get();
        let rooms = [];

        snapshot.forEach(doc => {
            rooms.push(doc.data());
        });

        // Search filtering (client-side style filtering since Firestore text search is limited without Algolia)
        if (search) {
            const searchLower = search.toLowerCase();
            rooms = rooms.filter(room =>
                room.title?.toLowerCase().includes(searchLower) ||
                room.description?.toLowerCase().includes(searchLower)
            );
        }

        // Must populate host details for each room
        // In a real app, you'd duplicate critical host info in the room doc
        // For now, let's fetch host for each (not efficient but functionally equivalent to the join)
        const enrichedRooms = await Promise.all(rooms.map(async (room) => {
            const hostDoc = await db.collection('users').doc(room.host_id).get();
            const hostData = hostDoc.exists ? hostDoc.data() : {};
            return {
                ...room,
                host_name: hostData.username,
                host_avatar: hostData.profile_picture_url
            };
        }));

        res.json({
            success: true,
            data: enrichedRooms
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching rooms' });
    }
});

// Get current user's sessions (hosted and attended)
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Hosted sessions
        const hostedSnapshot = await db.collection('learning_rooms')
            .where('host_id', '==', userId)
            .get();

        const hosted = [];
        hostedSnapshot.forEach(doc => hosted.push(doc.data()));

        // Attended sessions (query participants)
        const attendedSnapshot = await db.collection('room_participants')
            .where('user_id', '==', userId)
            .get();

        const attendedRoomIds = [];
        attendedSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.role !== 'host') { // Exclude if I'm the host (already in hosted)
                attendedRoomIds.push(data.room_id);
            }
        });

        // Fetch attended room details
        const attending = [];
        if (attendedRoomIds.length > 0) {
            // Firestore 'in' query supports up to 10
            // For MVP loop is fine
            await Promise.all(attendedRoomIds.map(async (roomId) => {
                const roomDoc = await db.collection('learning_rooms').doc(roomId).get();
                if (roomDoc.exists) {
                    attending.push(roomDoc.data());
                }
            }));
        }

        res.json({
            success: true,
            data: {
                hosted,
                attending
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching user sessions' });
    }
});

// Get single room details
router.get('/:id', async (req, res) => {
    try {
        const roomDoc = await db.collection('learning_rooms').doc(req.params.id).get();

        if (!roomDoc.exists) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const room = roomDoc.data();

        // Get Host Info
        const hostDoc = await db.collection('users').doc(room.host_id).get();
        if (hostDoc.exists) {
            const host = hostDoc.data();
            room.host = {
                id: host.id,
                username: host.username,
                full_name: host.full_name,
                profile_picture_url: host.profile_picture_url
            };
        }

        // Get Participants
        // Assuming we store participants in a subcollection or separate collection
        const participantsSnapshot = await db.collection('room_participants')
            .where('room_id', '==', req.params.id)
            .get();

        room.participants = [];
        for (const pDoc of participantsSnapshot.docs) {
            const pData = pDoc.data();
            const userDoc = await db.collection('users').doc(pData.user_id).get();
            if (userDoc.exists) {
                const uData = userDoc.data();
                room.participants.push({
                    user_id: uData.id,
                    username: uData.username,
                    profile_picture_url: uData.profile_picture_url,
                    role: pData.role,
                    is_muted: pData.is_muted || false // Return mute status
                });
            }
        }

        res.json({ success: true, data: room });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching room details' });
    }
});

// Create a new learning room
router.post('/', authenticateToken, async (req, res) => {
    const { title, description, topic, skill_level, max_participants, scheduled_start_time, language, duration_minutes } = req.body;

    try {
        const roomId = crypto.randomUUID();
        const now = new Date().toISOString();

        const roomData = {
            id: roomId,
            host_id: req.user.id,
            title,
            description,
            topic,
            skill_level: skill_level || 'beginner',
            max_participants: max_participants || 5,
            current_participants: 1, // Host starts in
            status: 'active',
            scheduled_start_time: scheduled_start_time || now,
            language: language || 'english',
            duration_minutes: duration_minutes || 60,
            created_at: now
        };

        const participantData = {
            id: crypto.randomUUID(),
            room_id: roomId,
            user_id: req.user.id,
            role: 'host',
            is_muted: false,
            joined_at: now
        };

        await db.runTransaction(async (t) => {
            t.set(db.collection('learning_rooms').doc(roomId), roomData);
            t.set(db.collection('room_participants').doc(participantData.id), participantData);

            // Increment user hosted count (need to read user doc first in transaction or use atomic increment)
            const userRef = db.collection('users').doc(req.user.id);
            t.update(userRef, {
                total_sessions_hosted: admin.firestore.FieldValue.increment(1)
            });
        });

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: roomData
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error creating room' });
    }
});

// Join a room
router.post('/:id/join', authenticateToken, async (req, res) => {
    try {
        const roomId = req.params.id;
        const userId = req.user.id;
        const roomRef = db.collection('learning_rooms').doc(roomId);

        await db.runTransaction(async (t) => {
            const roomDoc = await t.get(roomRef);
            if (!roomDoc.exists) {
                throw new Error('Room not found');
            }

            const room = roomDoc.data();
            if (room.current_participants >= room.max_participants) {
                throw new Error('Room is full');
            }

            // Check if already joined
            const pQuery = await db.collection('room_participants')
                .where('room_id', '==', roomId)
                .where('user_id', '==', userId)
                .get();

            if (!pQuery.empty) {
                throw new Error('User already in room');
            }

            // Add participant
            const pId = crypto.randomUUID();
            t.set(db.collection('room_participants').doc(pId), {
                id: pId,
                room_id: roomId,
                user_id: userId,
                role: 'learner',
                is_muted: false,
                joined_at: new Date().toISOString()
            });

            // Update room count
            t.update(roomRef, {
                current_participants: admin.firestore.FieldValue.increment(1)
            });

            // Update user stats
            t.update(db.collection('users').doc(userId), {
                total_sessions_attended: admin.firestore.FieldValue.increment(1)
            });
        });

        res.json({ success: true, message: 'Joined room successfully' });

    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: err.message || 'Error joining room' });
    }
});

// Leave a room
router.post('/:id/leave', authenticateToken, async (req, res) => {
    try {
        const roomId = req.params.id;
        const userId = req.user.id;

        // Find participant entry to delete
        const snapshot = await db.collection('room_participants')
            .where('room_id', '==', roomId)
            .where('user_id', '==', userId)
            .get();

        if (snapshot.empty) {
            return res.status(400).json({ success: false, message: 'Not a participant' });
        }

        const batch = db.batch();

        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Decrement room count
        const roomRef = db.collection('learning_rooms').doc(roomId);
        batch.update(roomRef, {
            current_participants: admin.firestore.FieldValue.increment(-1)
        });

        await batch.commit();

        res.json({ success: true, message: 'Left room successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error leaving room' });
    }
});

// Delete a room (Host only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const roomId = req.params.id;
        const userId = req.user.id;

        const roomRef = db.collection('learning_rooms').doc(roomId);
        const roomDoc = await roomRef.get();

        if (!roomDoc.exists) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        if (roomDoc.data().host_id !== userId) {
            return res.status(403).json({ success: false, message: 'Only host can delete room' });
        }

        await db.runTransaction(async (t) => {
            // Delete room
            t.delete(roomRef);

            // Cleanup participants (limit to 500 for batch safety, though transaction here is mostly for atomicity of room delete)
            // Note: Firestore transactions require all reads before writes.
            // Complex cleanups are often better done via Cloud Functions, but we'll do a simple batch delete here.
        });

        // Post-transaction cleanup (best effort)
        const participantsSnapshot = await db.collection('room_participants').where('room_id', '==', roomId).get();
        if (!participantsSnapshot.empty) {
            const batch = db.batch();
            participantsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }

        res.json({ success: true, message: 'Room deleted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error deleting room' });
    }
});

// Toggle mute participant (Host only)
router.patch('/:id/participants/:participantId/mute', authenticateToken, async (req, res) => {
    try {
        const { id: roomId, participantId } = req.params;
        const { muted } = req.body; // true or false
        const requesterId = req.user.id;

        // Verify requester is host
        const roomDoc = await db.collection('learning_rooms').doc(roomId).get();
        if (!roomDoc.exists) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        if (roomDoc.data().host_id !== requesterId) {
            return res.status(403).json({ success: false, message: 'Only host can manage participants' });
        }

        // Find participant entry to update
        // We need the participant DOC ID, not just the user_id. 
        // If the frontend sends user_id, we search. If it sends the doc id from room_participants, we use that.
        // Let's assume participantId passed here is the USER ID for ease of frontend use

        const pQuery = await db.collection('room_participants')
            .where('room_id', '==', roomId)
            .where('user_id', '==', participantId)
            .limit(1)
            .get();

        if (pQuery.empty) {
            return res.status(404).json({ success: false, message: 'Participant not found in this room' });
        }

        const pDoc = pQuery.docs[0];

        // Don't let host mute themselves via this route? Or allow it? 
        // Typically host manages OTHERS.

        await pDoc.ref.update({
            is_muted: muted
        });

        res.json({ success: true, message: `Participant ${muted ? 'muted' : 'unmuted'} successfully` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error updating participant' });
    }
});

module.exports = router;


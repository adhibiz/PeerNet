const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authenticateToken = require('../middleware/auth');

// Get all skills (with optional search)
router.get('/', async (req, res) => {
    const { search, category } = req.query;

    try {
        let skillsRef = db.collection('skills');

        if (category) {
            skillsRef = skillsRef.where('category', '==', category);
        }

        const snapshot = await skillsRef.get();
        let skills = [];

        snapshot.forEach(doc => {
            skills.push({ id: doc.id, ...doc.data() }); // Include doc.id for Firestore documents
        });

        if (search) {
            const searchLower = search.toLowerCase();
            skills = skills.filter(s => s.name.toLowerCase().includes(searchLower));
        }

        // Apply sorting and limit if needed, but Firestore queries are more efficient for this
        // For now, client-side sorting/limiting after fetching all matching documents
        // Or, if 'popularity_score' and 'name' are fields, they could be used in orderBy clauses
        // skills.sort((a, b) => {
        //     if (a.popularity_score !== b.popularity_score) {
        //         return (b.popularity_score || 0) - (a.popularity_score || 0);
        //     }
        //     return (a.name || '').localeCompare(b.name || '');
        // });
        // skills = skills.slice(0, 50);


        res.json({ success: true, data: skills });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching skills' });
    }
});

// Add a new skill (protected, maybe admin only ideally)
router.post('/', authenticateToken, async (req, res) => {
    const { name, category, description } = req.body;

    try {
        // Check if skill already exists by name
        const existingSkill = await db.collection('skills').where('name', '==', name).limit(1).get();
        if (!existingSkill.empty) {
            return res.status(400).json({ success: false, message: 'Skill already exists' });
        }

        const newSkillRef = await db.collection('skills').add({
            name,
            category,
            description,
            popularity_score: 0, // Initialize popularity score
            created_at: new Date().toISOString()
        });
        const newSkill = await newSkillRef.get();
        res.status(201).json({ success: true, data: { id: newSkill.id, ...newSkill.data() } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error creating skill' });
    }
});

// Add user skill
router.post('/user', authenticateToken, async (req, res) => {
    const { skill_id, proficiency_level, years_of_experience } = req.body;

    try {
        let skillName = '';
        // If skill_id is a UUID/String
        const skillDoc = await db.collection('skills').doc(skill_id).get();
        if (skillDoc.exists) {
            skillName = skillDoc.data().name;
        }

        const userSkillId = `${req.user.id}_${skill_id}`;

        await db.collection('user_skills').doc(userSkillId).set({
            user_id: req.user.id,
            skill_id,
            skill_name: skillName,
            proficiency_level,
            years_of_experience: years_of_experience || 0,
            added_at: new Date().toISOString()
        });

        res.status(201).json({ success: true, message: 'Skill added to profile' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error adding skill' });
    }
});

// Delete skill from user profile
router.delete('/user/:skillId', authenticateToken, async (req, res) => {
    try {
        await db.collection('user_skills').doc(`${req.user.id}_${req.params.skillId}`).delete();
        res.json({ success: true, message: 'Skill removed from profile' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error removing user skill' });
    }
});

module.exports = router;

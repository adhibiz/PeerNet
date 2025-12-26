const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin
// Expecting serviceAccountKey.json in the backend root or configured via env variables
try {
    const serviceAccount = require('../../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔥 Firebase Admin Initialized from serviceAccountKey.json');
} catch (error) {
    console.warn('⚠️ serviceAccountKey.json not found. Attempting default init (Cloud Environment)...');
    try {
        admin.initializeApp();
        console.log('🔥 Firebase Admin Initialized (Default)');
    } catch (err) {
        console.error('❌ Failed to initialize Firebase Admin:', err.message);
    }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth, admin };

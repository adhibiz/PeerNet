import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential, // Note: Modular SDK
    EmailAuthProvider,
    GoogleAuthProvider,
    signInWithPopup,
    FacebookAuthProvider, // Add if needed
    linkWithPopup,
    unlink
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null); // Corresponds to userProfile
    const [loading, setLoading] = useState(true);

    const signup = async (email, password, name) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create Advanced User Profile
        const profile = {
            id: userCredential.user.uid,
            email,
            name: name || email.split('@')[0],
            username: `user_${Math.random().toString(36).substr(2, 9)}`,
            skills: [],
            learningGoals: [],
            preferences: {
                theme: 'light',
                language: 'en',
                notifications: true,
                emailNotifications: true,
                autoJoin: true,
                maxPeers: 4
            },
            stats: {
                sessionsCompleted: 0,
                sessionsHosted: 0,
                totalLearningTime: 0,
                contributionScore: 0,
                streak: 0,
                lastActive: new Date(),
                achievements: []
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Save to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), profile);
        setUserData(profile);

        // Update Auth Profile
        await updateProfile(userCredential.user, {
            displayName: profile.name
        });

        return userCredential;
    };

    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
    };

    const logout = async () => {
        await signOut(auth);
        setUserData(null);
    };

    // Google Login
    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        // You might want to CREATE the user doc if it doesn't exist here
        const userDocRef = doc(db, 'users', result.user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            const profile = {
                id: result.user.uid,
                email: result.user.email,
                name: result.user.displayName,
                // ... default fields
                stats: {
                    contributionScore: 0
                }
            };
            await setDoc(userDocRef, profile);
        }
    };


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                // Fetch user profile
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnapshot = await getDoc(userDocRef);

                if (userDocSnapshot.exists()) {
                    setUserData(userDocSnapshot.data());

                    // Update last active
                    await updateDoc(userDocRef, {
                        'stats.lastActive': new Date()
                    });
                }
            } else {
                setUserData(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        currentUser, // Firebase User object
        userData,    // Firestore Profile data
        userProfile: userData, // Alias for compatibility with advanced snippet
        loading,
        login,
        signup,
        logout,
        loginWithGoogle
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

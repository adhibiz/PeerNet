import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCAhshcwEMONDRu6iv0wfg7TvkmYUHgLMA",
    authDomain: "peernet-biz.firebaseapp.com",
    projectId: "peernet-biz",
    storageBucket: "peernet-biz.firebasestorage.app",
    messagingSenderId: "29618791378",
    appId: "1:29618791378:web:044ed5306e6ebf83ff5e0b",
    measurementId: "G-D7QRYP2TDZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Helper for calling cloud functions (mock or real)
import { httpsCallable } from "firebase/functions";
export const callCloudFunction = async (functionName, data) => {
    try {
        const functionRef = httpsCallable(functions, functionName);
        return await functionRef(data);
    } catch (error) {
        console.warn(`Cloud function ${functionName} failed or not implemented locally:`, error);
        // Fallback or rethrow depending on needs. 
        // For disconnected demo, we might return mock data here.
        return { data: { success: false, error: error.message } };
    }
};

export { app, analytics, auth, db, storage, functions };

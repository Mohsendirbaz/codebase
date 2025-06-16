// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-key-for-development",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Use mock implementation if environment variables aren't available
const useMockFirebase = !process.env.REACT_APP_FIREBASE_API_KEY ||
    process.env.NODE_ENV === 'development' ||
    process.env.REACT_APP_USE_MOCK_DATA === 'true';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);

// Set a flag to indicate Firebase is initialized
window.firebaseInitialized = true;

export { db, auth, useMockFirebase };
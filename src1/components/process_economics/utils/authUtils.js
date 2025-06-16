/**
 * Authentication and user profile management utilities for Firebase.
 * Provides methods to handle user authentication, retrieve user IDs, 
 * manage user profiles, and update user preferences.
 * 
 * @module authUtils
 * @requires firebase/auth
 * @requires firebase/firestore
 */
// src/modules/processEconomics/utils/authUtils.js
import { 
    getAuth, 
    onAuthStateChanged, 
    signInAnonymously 
  } from 'firebase/auth';
  import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
  
  // Initialize Firebase Auth
  const auth = getAuth();
  const db = getFirestore();
  
  /**
   * Get the current user ID
   * @returns {string} User ID
   */
  export const getCurrentUserId = () => {
    // Check for test environment
    if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      return 'test-user-123';
    }
    
    const user = auth.currentUser;
    return user ? user.uid : 'temp-' + Math.random().toString(36).substring(2, 9);
  };
  
  /**
   * Ensure a user is authenticated
   * Uses anonymous auth if no user is signed in
   * @returns {Promise<string>} User ID
   */
  export const ensureAuthenticated = async () => {
    return new Promise((resolve, reject) => {
      // Check if a user is already signed in
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        
        if (user) {
          // User is signed in
          await ensureUserProfile(user.uid);
          resolve(user.uid);
        } else {
          // No user is signed in, sign in anonymously
          try {
            const result = await signInAnonymously(auth);
            await ensureUserProfile(result.user.uid);
            resolve(result.user.uid);
          } catch (error) {
            console.error('Error signing in anonymously:', error);
            reject(error);
          }
        }
      });
    });
  };
  
  /**
   * Ensure a user profile exists
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  const ensureUserProfile = async (userId) => {
    try {
      const userRef = doc(db, 'user_profiles', userId);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        // Create a new user profile
        await setDoc(userRef, {
          id: userId,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          isAnonymous: auth.currentUser?.isAnonymous || true,
          preferences: {
            defaultLibraryView: 'grid',
            defaultSorting: 'dateAdded',
            showUsageStats: true
          }
        });
        
        // Create library metadata
        const libMetaRef = doc(db, 'personal_library_metadata', userId);
        await setDoc(libMetaRef, {
          shelves: ['favorites'],
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        });
      } else {
        // Update lastActive timestamp
        await setDoc(userRef, {
          lastActive: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };
  
  /**
   * Get user profile data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  export const getUserProfile = async (userId) => {
    try {
      const userRef = doc(db, 'user_profiles', userId);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };
  
  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - Updated preferences
   * @returns {Promise<boolean>} Success status
   */
  export const updateUserPreferences = async (userId, preferences) => {
    try {
      const userRef = doc(db, 'user_profiles', userId);
      
      await setDoc(userRef, {
        preferences: preferences,
        lastActive: serverTimestamp()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  };
  
  export default {
    getCurrentUserId,
    ensureAuthenticated,
    getUserProfile,
    updateUserPreferences
  };
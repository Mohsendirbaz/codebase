// src/modules/processEconomics/services/libraryService.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db, useMockFirebase } from '../../../firebase/config';
import { getMockData } from './mockDataService';

/**
 * Get personal library items for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of library items
 */
export const getPersonalLibrary = async (userId) => {
  try {
    // Use mock data if in development/test mode
    if (useMockFirebase) {
      return getMockData('personalLibrary', { userId });
    }

    // Otherwise use real Firestore
    const q = query(
        collection(db, 'personal_library'),
        where('userId', '==', userId),
        orderBy('dateAdded', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting personal library:', error);
    // Fallback to mock data in case of error
    return getMockData('personalLibrary', { userId });
  }
};

/**
 * Get general/public library items
 * @returns {Promise<Array>} Array of library items
 */
export const getGeneralLibrary = async () => {
  try {
    // Use mock data if in development/test mode
    if (useMockFirebase) {
      return getMockData('generalLibrary');
    }

    // Otherwise use real Firestore
    const q = query(
        collection(db, 'general_library'),
        orderBy('dateAdded', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting general library:', error);
    // Fallback to mock data in case of error
    return getMockData('generalLibrary');
  }
};

/**
 * Update personal library items
 * @param {string} userId - User ID
 * @param {Array} items - Updated array of items
 * @returns {Promise<boolean>} Success status
 */
export const updatePersonalLibrary = async (userId, items) => {
  try {
    // Use mock implementation if in development/test mode
    if (useMockFirebase) {
      console.log('Mock update personal library', { userId, itemCount: items.length });
      return true;
    }

    // Otherwise use real Firestore
    const userLibRef = doc(db, 'personal_library_metadata', userId);

    // Update timestamp
    await updateDoc(userLibRef, {
      lastUpdated: serverTimestamp()
    });

    // Update each item individually
    for (const item of items) {
      const itemRef = doc(db, 'personal_library', item.id);
      await updateDoc(itemRef, {
        ...item,
        userId,
        lastUpdated: serverTimestamp()
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating personal library:', error);
    return false;
  }
};

// Continue with similar patterns for all other functions...

/**
 * Get shelves for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of shelf names
 */
export const getMyLibraryShelves = async (userId) => {
  try {
    // Use mock data if in development/test mode
    if (useMockFirebase) {
      return getMockData('shelves');
    }

    // Otherwise use real Firestore
    const userLibRef = doc(db, 'personal_library_metadata', userId);
    const docSnap = await getDoc(userLibRef);

    if (docSnap.exists()) {
      return docSnap.data().shelves || ['favorites'];
    }

    // Create default metadata if it doesn't exist
    await setDoc(userLibRef, {
      shelves: ['favorites'],
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });

    return ['favorites'];
  } catch (error) {
    console.error('Error getting shelves:', error);
    return ['favorites'];
  }
};

/**
 * Create a new shelf
 * @param {string} userId - User ID
 * @param {string} shelfName - Name of the new shelf
 * @returns {Promise<boolean>} Success status
 */
export const createShelf = async (userId, shelfName) => {
  try {
    const userLibRef = doc(db, 'personal_library_metadata', userId);
    const docSnap = await getDoc(userLibRef);
    
    if (docSnap.exists()) {
      const shelves = docSnap.data().shelves || ['favorites'];
      
      if (shelves.includes(shelfName)) {
        return true; // Shelf already exists
      }
      
      await updateDoc(userLibRef, {
        shelves: [...shelves, shelfName],
        lastUpdated: serverTimestamp()
      });
    } else {
      await setDoc(userLibRef, {
        shelves: ['favorites', shelfName],
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error creating shelf:', error);
    return false;
  }
};

/**
 * Remove a shelf
 * @param {string} userId - User ID
 * @param {string} shelfName - Name of the shelf to remove
 * @returns {Promise<boolean>} Success status
 */
export const removeShelf = async (userId, shelfName) => {
  try {
    // Cannot remove favorites or all
    if (shelfName === 'favorites') {
      return false;
    }
    
    const userLibRef = doc(db, 'personal_library_metadata', userId);
    const docSnap = await getDoc(userLibRef);
    
    if (docSnap.exists()) {
      const shelves = docSnap.data().shelves || ['favorites'];
      
      await updateDoc(userLibRef, {
        shelves: shelves.filter(s => s !== shelfName),
        lastUpdated: serverTimestamp()
      });
      
      // Remove shelf from all items
      const q = query(
        collection(db, 'personal_library'),
        where('userId', '==', userId),
        where('shelf', '==', shelfName)
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        await updateDoc(doc.ref, {
          shelf: null,
          lastUpdated: serverTimestamp()
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error removing shelf:', error);
    return false;
  }
};

/**
 * Rename a shelf
 * @param {string} userId - User ID
 * @param {string} oldName - Old shelf name
 * @param {string} newName - New shelf name
 * @returns {Promise<boolean>} Success status
 */
export const renameShelf = async (userId, oldName, newName) => {
  try {
    // Cannot rename favorites
    if (oldName === 'favorites') {
      return false;
    }
    
    const userLibRef = doc(db, 'personal_library_metadata', userId);
    const docSnap = await getDoc(userLibRef);
    
    if (docSnap.exists()) {
      const shelves = docSnap.data().shelves || ['favorites'];
      
      if (shelves.includes(newName)) {
        return false; // New name already exists
      }
      
      await updateDoc(userLibRef, {
        shelves: shelves.map(s => s === oldName ? newName : s),
        lastUpdated: serverTimestamp()
      });
      
      // Update shelf name in all items
      const q = query(
        collection(db, 'personal_library'),
        where('userId', '==', userId),
        where('shelf', '==', oldName)
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        await updateDoc(doc.ref, {
          shelf: newName,
          lastUpdated: serverTimestamp()
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error renaming shelf:', error);
    return false;
  }
};

/**
 * Update a personal library item
 * @param {string} userId - User ID
 * @param {Object} item - Updated item data
 * @returns {Promise<boolean>} Success status
 */
export const updatePersonalLibraryItem = async (userId, item) => {
  try {
    const itemRef = doc(db, 'personal_library', item.id);
    
    await updateDoc(itemRef, {
      ...item,
      userId,
      dateModified: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating library item:', error);
    return false;
  }
};

/**
 * Delete an item from personal library
 * @param {string} userId - User ID
 * @param {string} itemId - Item ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteFromPersonalLibrary = async (userId, itemId) => {
  try {
    const itemRef = doc(db, 'personal_library', itemId);
    const docSnap = await getDoc(itemRef);
    
    if (docSnap.exists() && docSnap.data().userId === userId) {
      await deleteDoc(itemRef);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting from personal library:', error);
    return false;
  }
};

/**
 * Save an item to personal library
 * @param {string} userId - User ID
 * @param {Object} item - Item to save
 * @param {string|null} shelf - Optional shelf to save to
 * @returns {Promise<string>} ID of the saved item
 */
export const saveToPersonalLibrary = async (userId, item, shelf = null) => {
  try {
    // Check if this item already exists in user's library
    const q = query(
      collection(db, 'personal_library'),
      where('userId', '==', userId),
      where('sourceId', '==', item.id)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Item already exists, update it
      const existingDoc = querySnapshot.docs[0];
      
      await updateDoc(existingDoc.ref, {
        shelf: shelf,
        isFavorite: shelf === 'favorites' ? true : existingDoc.data().isFavorite || false,
        dateModified: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      
      return existingDoc.id;
    }
    
    // Create new item
    const newItemId = uuidv4();
    const itemRef = doc(db, 'personal_library', newItemId);
    
    await setDoc(itemRef, {
      id: newItemId,
      userId,
      sourceId: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      tags: item.tags || [],
      modeler: item.modeler,
      shelf: shelf,
      isFavorite: shelf === 'favorites',
      configuration: item.configuration,
      dateAdded: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
    
    return newItemId;
  } catch (error) {
    console.error('Error saving to personal library:', error);
    throw error;
  }
};

/**
 * Save a configuration to the library
 * @param {string} userId - User ID
 * @param {Object} item - Item data
 * @returns {Promise<string>} ID of the saved item
 */
export const saveConfiguration = async (userId, item) => {
  try {
    const itemRef = doc(db, 'personal_library', item.id);
    
    await setDoc(itemRef, {
      ...item,
      userId,
      dateAdded: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
    
    return item.id;
  } catch (error) {
    console.error('Error saving configuration:', error);
    throw error;
  }
};
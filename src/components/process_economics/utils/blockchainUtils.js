// src/modules/processEconomics/utils/blockchainUtils.js
import { sha256 } from 'js-sha256';

/**
 * Generate a unique ID with blockchain-like hash
 * @returns {string} Unique blockchain-like ID
 */
export const generateUniqueId = () => {
  // Create a timestamp
  const timestamp = new Date().getTime().toString();
  
  // Add some randomness
  const random = Math.random().toString(36).substring(2, 15);
  
  // Combine data for hashing
  const data = `${timestamp}-${random}`;
  
  // Generate SHA-256 hash
  const hash = sha256(data);
  
  // Return first 16 characters of hash
  return hash.substring(0, 16);
};

/**
 * Verify if a configuration hash is valid
 * @param {Object} configuration - Configuration object
 * @param {string} hash - Hash to verify
 * @returns {boolean} True if hash is valid
 */
export const verifyHash = (configuration, hash) => {
  // Extract key data from configuration
  const { currentState, metadata } = configuration;
  
  // Create a string representation of key data
  const dataString = JSON.stringify({
    groups: currentState.scalingGroups.map(g => g.id),
    metadata: {
      exportDate: metadata.exportDate,
      scalingType: metadata.scalingType
    }
  });
  
  // Generate verification hash
  const verificationHash = sha256(dataString);
  
  // Compare first 16 characters
  return verificationHash.substring(0, 16) === hash;
};

/**
 * Generate a hash for a configuration
 * @param {Object} configuration - Configuration object
 * @returns {string} Hash of the configuration
 */
export const hashConfiguration = (configuration) => {
  // Extract key data from configuration
  const { currentState, metadata } = configuration;
  
  // Create a string representation of key data
  const dataString = JSON.stringify({
    groups: currentState.scalingGroups.map(g => g.id),
    metadata: {
      exportDate: metadata.exportDate,
      scalingType: metadata.scalingType
    }
  });
  
  // Generate hash
  const hash = sha256(dataString);
  
  // Return first 16 characters
  return hash.substring(0, 16);
};

/**
 * Create a searchable token for a configuration
 * Makes it easier to find configurations in the library
 * @param {Object} configuration - Configuration object
 * @returns {string} Searchable token
 */
export const createSearchableToken = (configuration) => {
  const { metadata, currentState } = configuration;
  
  // Extract key data
  const type = metadata.scalingType || 'mixed';
  const groupCount = currentState.scalingGroups.length;
  const timestamp = new Date().getTime().toString(36).substring(-4);
  
  // Create token
  return `${type}-${groupCount}-${timestamp}`;
};

export default {
  generateUniqueId,
  verifyHash,
  hashConfiguration,
  createSearchableToken
};
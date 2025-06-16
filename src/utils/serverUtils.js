/**
 * Server Utilities
 * 
 * This module provides utilities for server-side code and helps with
 * proper separation of client and server code to avoid webpack warnings.
 */

/**
 * Safely imports Express only on the server side
 * @returns {Object|null} Express module or null if in browser
 */
export const safeRequireExpress = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    console.warn('Attempted to import Express in browser environment');
    return null;
  }

  // Only import Express on the server
  try {
    // Use a static import path to avoid webpack warnings
    // This will be excluded from browser bundles via the browser field in package.json
    const express = require('express');
    return express;
  } catch (error) {
    console.error('Error importing Express:', error);
    return null;
  }
};

/**
 * Checks if code is running in a server environment
 * @returns {boolean} True if running on server, false if in browser
 */
export const isServer = () => {
  return typeof window === 'undefined';
};

/**
 * Safely executes server-only code
 * @param {Function} serverCode Function containing server-only code
 * @param {Function} fallback Optional fallback function for browser environment
 * @returns {any} Result of serverCode or fallback
 */
export const runServerOnly = (serverCode, fallback = () => null) => {
  if (isServer()) {
    return serverCode();
  }
  return fallback();
};

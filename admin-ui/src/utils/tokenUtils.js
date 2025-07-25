/**
 * Token utility functions for JWT handling
 */

/**
 * Decode JWT token payload without verification
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export function decodeJWTPayload(token) {
  try {
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT payload:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired or invalid
 */
export function isTokenExpired(token) {
  try {
    const payload = decodeJWTPayload(token);
    if (!payload || !payload.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} - Expiration date or null if invalid
 */
export function getTokenExpiration(token) {
  try {
    const payload = decodeJWTPayload(token);
    if (!payload || !payload.exp) return null;
    
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
}

/**
 * Get time until token expires in milliseconds
 * @param {string} token - JWT token
 * @returns {number} - Milliseconds until expiration (0 if expired)
 */
export function getTimeUntilExpiration(token) {
  try {
    const payload = decodeJWTPayload(token);
    if (!payload || !payload.exp) return 0;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = payload.exp - currentTime;
    
    return Math.max(0, timeLeft * 1000);
  } catch (error) {
    console.error('Error calculating time until expiration:', error);
    return 0;
  }
}
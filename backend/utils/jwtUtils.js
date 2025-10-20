import pkg from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ override: true });

// Use this pattern for reliable CommonJS interop in ESM
const {sign, verify} = pkg; 
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generates a JSON Web Token (JWT) for a given user ID.
 * @param {string} userId - The ID of the user.
 * @returns {string} The signed JWT token.
 */

export const generateToken = (userId) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set. Cannot generate token.');
  }
  return sign(
    { userId }, 
    JWT_SECRET, 
    { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: "carpool app"
    }
  );
};

/**
 * Verifies a JSON Web Token.
 * @param {string} token - The JWT token to verify.
 * @returns {object} The decoded token payload.
 */

export const verifyToken = (token) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set. Cannot verify token.');
  }
  return verify(token, JWT_SECRET);
};
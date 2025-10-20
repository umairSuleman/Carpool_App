import crypto from 'crypto';
import { Op } from 'sequelize';
import { generateToken, verifyToken } from '../utils/jwtUtils.js'; 
import { User, UserProfile } from '../models/associations.js';
import { validateRegistrationData, validatePassword } from '../utils/validation.js';


class AuthService {

  // Register new user
  async register(userData) {
    const validation = validateRegistrationData(userData);
    if (!validation.isValid) {
      const error = new Error('Validation failed');
      error.details = validation.errors;
      throw error;
    }

    const { name, email, phone, password } = userData;
    
    // Check if user exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { phone: phone.replace(/[\s\-\(\)]/g, '') }
        ]
      }
    });
    
    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'phone';
      throw new Error(`User with this ${field} already exists`);
    }
    
    // Hash password
    const passwordHash = await User.hashPassword(password);
    
    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Use transaction for creating user and profile
    const transaction = await User.sequelize.transaction();
    
    try {
      // Create user
      const user = await User.create({
        name,
        email,
        phone,
        password_hash: passwordHash,
        email_verification_token: emailVerificationToken,
        email_verification_expires: emailVerificationExpires,
        //is_verified: true  for testing purposes
      }, { transaction });
      
      // Create user profile
      await UserProfile.create({
        user_id: user.id
      }, { transaction });
      
      await transaction.commit();
      
      const token = generateToken(user.id);         //modular fucntion used 
      
      return {
        token,
        user: user.toSafeJSON(),
        emailVerificationToken
      };
    } catch (error) {
      // Only rollback if transaction hasn't been finalized
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    const user = await User.findByCredentials(email, password);
    
    if (!user.is_verified) {
      throw new Error('Please verify your email before logging in');
    }
    
    const token = generateToken(user.id);           //modular func used
    
    return {
      token,
      user: user.toSafeJSON()
    };
  }

  // Verify email
  async verifyEmail(token) {
    const user = await User.findOne({
      where: {
        email_verification_token: token,
        email_verification_expires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    await user.update({
      is_verified: true,
      email_verification_token: null,
      email_verification_expires: null
    });

    return { 
      message: 'Email verified successfully',
      user: user.toSafeJSON()
    };
  }

  // Request password reset
  async requestPasswordReset(email) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    
    const [affectedRows] = await User.update({
      password_reset_token: resetToken,
      password_reset_expires: expires
    }, {
      where: { email: email.toLowerCase() }
    });
    
    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
      resetToken: affectedRows > 0 ? resetToken : null
    };
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.minLength) {
      throw new Error('Password must be at least 8 characters');
    }

    const user = await User.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await User.hashPassword(newPassword);
    
    await user.update({
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires: null,
      login_attempts: 0,
      locked_until: null
    });

    return { 
      message: 'Password reset successfully',
      user: user.toSafeJSON()
    };
  }

  // Find user by ID with profile
  async findUserById(userId) {
    const user = await User.findByPk(userId, {
      include: [{
        model: UserProfile,
        as: 'profile'
      }]
    });
    
    return user ? user.toSafeJSON() : null;
  }
  //re-exposing the modularised funcs as props on the service instance
  generateToken = generateToken;
  verifyToken = verifyToken;        //modular func used
}

export default new AuthService();
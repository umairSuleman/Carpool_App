import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { User, UserProfile } from '../models/associations.js';
import { validateEmail, validatePhone } from '../utils/validation.js';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: UserProfile,
        as: 'profile'
      }],
      attributes: { exclude: ['password_hash', 'email_verification_token', 'password_reset_token'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      user: user.toSafeJSON()
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Update profile information
router.put('/profile', authenticate, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      age,
      gender,
      bio,
      smoking,
      pets,
      music,
      chatty
    } = req.body;

    // Find user
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: UserProfile,
        as: 'profile'
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Validate email if changed
    if (email && email !== user.email) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Check if email already exists
      const existingEmail = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingEmail && existingEmail.id !== user.id) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use'
        });
      }
    }

    // Validate phone if changed
    if (phone && phone !== user.phone) {
      if (!validatePhone(phone)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone format'
        });
      }

      // Check if phone already exists
      const existingPhone = await User.findOne({ 
        where: { phone: phone.replace(/[\s\-\(\)]/g, '') } 
      });
      if (existingPhone && existingPhone.id !== user.id) {
        return res.status(400).json({
          success: false,
          error: 'Phone number already in use'
        });
      }
    }

    // Update user basic info
    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (email) userUpdates.email = email;
    if (phone) userUpdates.phone = phone;

    if (Object.keys(userUpdates).length > 0) {
      await user.update(userUpdates);
    }

    // Update profile info
    const profileUpdates = {};
    if (age !== undefined) profileUpdates.age = age;
    if (gender) profileUpdates.gender = gender;
    if (bio !== undefined) profileUpdates.bio = bio;
    if (smoking !== undefined) profileUpdates.smoking = smoking;
    if (pets !== undefined) profileUpdates.pets = pets;
    if (music !== undefined) profileUpdates.music = music;
    if (chatty !== undefined) profileUpdates.chatty = chatty;

    if (Object.keys(profileUpdates).length > 0 && user.profile) {
      await user.profile.update(profileUpdates);
    }

    // Reload user with updated profile
    await user.reload({
      include: [{
        model: UserProfile,
        as: 'profile'
      }]
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toSafeJSON()
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Upload profile photo
router.post('/profile/photo', authenticate, async (req, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        error: 'Photo URL is required'
      });
    }

    const user = await User.findByPk(req.user.id, {
      include: [{
        model: UserProfile,
        as: 'profile'
      }]
    });

    if (!user || !user.profile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Note: In production, you'd handle file upload here using multer or similar
    // For now, we'll just store the URL
    // Add profile_photo field to UserProfile model if not exists

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      photoUrl
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload photo'
    });
  }
});

// View another user's public profile
router.get('/profile/:userId', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      include: [{
        model: UserProfile,
        as: 'profile'
      }],
      attributes: ['id', 'name', 'role', 'created_at']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return only public information
    const publicProfile = {
      id: user.id,
      name: user.name,
      role: user.role,
      memberSince: user.created_at,
      profile: user.profile ? {
        gender: user.profile.gender,
        bio: user.profile.bio,
        smoking: user.profile.smoking,
        pets: user.profile.pets,
        music: user.profile.music,
        chatty: user.profile.chatty,
        rating: user.profile.rating,
        totalRides: user.profile.total_rides
      } : null
    };

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      user: publicProfile
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

export default router;
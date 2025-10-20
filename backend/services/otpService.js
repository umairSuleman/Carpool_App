import crypto from 'crypto';
import { OtpVerification } from '../models/associations.js';
import { sendSMS } from './smsService.js';
import { sendEmail } from './emailService.js';
import { Op } from 'sequelize';

class OtpService {
  // Generate 6-digit OTP
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Create and send OTP
  async sendOTP(contact, type = 'registration', userId = null) {
    try {
      // Invalidate any existing OTPs for this contact
      await OtpVerification.update(
        { is_verified: true },
        {
          where: {
            contact,
            otp_type: type,
            is_verified: false
          }
        }
      );

      // Generate new OTP
      const otpCode = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create OTP record
      const otpRecord = await OtpVerification.create({
        user_id: userId,
        contact,
        otp_code: otpCode,
        otp_type: type,
        expires_at: expiresAt
      });

      // Determine if contact is email or phone
      const isEmail = contact.includes('@');

      // Send OTP
      if (isEmail) {
        await this.sendOTPEmail(contact, otpCode, type);
      } else {
        await this.sendOTPSMS(contact, otpCode, type);
      }

      return {
        success: true,
        otpId: otpRecord.id,
        expiresIn: 600, // seconds
        message: `OTP sent to ${isEmail ? 'email' : 'phone'}`
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new Error('Failed to send OTP');
    }
  }

  // Verify OTP
  async verifyOTP(otpId, otpCode) {
    try {
      const otpRecord = await OtpVerification.findOne({
        where: {
          id: otpId,
          otp_code: otpCode,
          is_verified: false,
          expires_at: {
            [Op.gt]: new Date()
          }
        }
      });

      if (!otpRecord) {
        return {
          success: false,
          message: 'Invalid or expired OTP'
        };
      }

      // Mark as verified
      await otpRecord.markAsVerified();

      return {
        success: true,
        message: 'OTP verified successfully',
        userId: otpRecord.user_id,
        contact: otpRecord.contact
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw new Error('Failed to verify OTP');
    }
  }

  // Resend OTP
  async resendOTP(contact, type) {
    try {
      // Check if recent OTP exists (rate limiting)
      const recentOTP = await OtpVerification.findOne({
        where: {
          contact,
          otp_type: type,
          created_at: {
            [Op.gt]: new Date(Date.now() - 60 * 1000) // Last 1 minute
          }
        }
      });

      if (recentOTP) {
        return {
          success: false,
          message: 'Please wait before requesting a new OTP',
          retryAfter: 60
        };
      }

      // Send new OTP
      return await this.sendOTP(contact, type);
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw new Error('Failed to resend OTP');
    }
  }

  // Send OTP via SMS
  async sendOTPSMS(phone, otp, type) {
    const message = this.getOTPMessage(otp, type);
    return await sendSMS(phone, message);
  }

  // Send OTP via Email
  async sendOTPEmail(email, otp, type) {
    const subject = this.getOTPEmailSubject(type);
    const html = this.getOTPEmailTemplate(otp, type);
    return await sendEmail(email, subject, html);
  }

  // Get OTP SMS message
  getOTPMessage(otp, type) {
    const messages = {
      registration: `Your Carpool Connect registration OTP is: ${otp}. Valid for 10 minutes.`,
      login: `Your Carpool Connect login OTP is: ${otp}. Valid for 10 minutes.`,
      password_reset: `Your Carpool Connect password reset OTP is: ${otp}. Valid for 10 minutes.`,
      phone_verification: `Your Carpool Connect phone verification OTP is: ${otp}. Valid for 10 minutes.`
    };
    return messages[type] || `Your OTP is: ${otp}`;
  }

  // Get OTP Email subject
  getOTPEmailSubject(type) {
    const subjects = {
      registration: 'Complete Your Carpool Connect Registration',
      login: 'Your Carpool Connect Login OTP',
      password_reset: 'Reset Your Carpool Connect Password',
      phone_verification: 'Verify Your Phone Number'
    };
    return subjects[type] || 'Your OTP Code';
  }

  // Get OTP Email template
  getOTPEmailTemplate(otp, type) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .otp-code { 
            font-size: 32px; 
            font-weight: bold; 
            color: #4CAF50; 
            text-align: center; 
            padding: 20px; 
            background: white; 
            border-radius: 5px;
            letter-spacing: 5px;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Carpool Connect</h1>
          </div>
          <div class="content">
            <h2>Your Verification Code</h2>
            <p>Use the following OTP to complete your ${type.replace('_', ' ')}:</p>
            <div class="otp-code">${otp}</div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Carpool Connect. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Clean up expired OTPs (run as cron job)
  async cleanupExpiredOTPs() {
    try {
      const result = await OtpVerification.destroy({
        where: {
          expires_at: {
            [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
          }
        }
      });
      console.log(`Cleaned up ${result} expired OTP records`);
      return result;
    } catch (error) {
      console.error('Error cleaning up OTPs:', error);
    }
  }
}

export default new OtpService();
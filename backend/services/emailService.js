import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  // Send email
  async sendEmail(to, subject, html, text = '') {
    try {
      const mailOptions = {
        from: `"Carpool Connect" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: text || this.htmlToText(html),
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', info.messageId);
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  // Convert HTML to plain text (basic)
  htmlToText(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Send welcome email
  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to Carpool Connect!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 30px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Carpool Connect! 🚗</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for joining Carpool Connect! We're excited to have you as part of our community.</p>
            <p>With Carpool Connect, you can:</p>
            <ul>
              <li>Find rides going your way</li>
              <li>Offer rides and earn money</li>
              <li>Reduce your carbon footprint</li>
              <li>Meet new people on your commute</li>
            </ul>
            <a href="${process.env.FRONTEND_URL}/rides" class="button">Browse Available Rides</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy carpooling!</p>
            <p><strong>The Carpool Connect Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Carpool Connect. All rights reserved.</p>
            <p>You received this email because you registered for Carpool Connect.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  // Send email verification
  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    const subject = 'Verify Your Email Address';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 30px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with Carpool Connect, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Carpool Connect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  // Send password reset email
  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const subject = 'Reset Your Password';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 30px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 20px 0;
          }
          .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 Carpool Connect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  // Send booking confirmation email
  async sendBookingConfirmation(email, bookingDetails) {
    const subject = 'Ride Booking Confirmed';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 30px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #666; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Your ride has been successfully booked.</p>
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span> ${bookingDetails.bookingId}
              </div>
              <div class="detail-row">
                <span class="detail-label">From:</span> ${bookingDetails.source}
              </div>
              <div class="detail-row">
                <span class="detail-label">To:</span> ${bookingDetails.destination}
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time:</span> ${bookingDetails.departureTime}
              </div>
              <div class="detail-row">
                <span class="detail-label">Seats:</span> ${bookingDetails.seats}
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Amount:</span> ₹${bookingDetails.amount}
              </div>
              <div class="detail-row">
                <span class="detail-label">Driver:</span> ${bookingDetails.driverName}
              </div>
            </div>
            <a href="${process.env.FRONTEND_URL}/bookings/${bookingDetails.bookingId}" class="button">View Booking Details</a>
            <p>Please arrive at the pickup location on time. The driver will contact you shortly.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Carpool Connect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }
}

export const sendEmail = (to, subject, html, text) => {
  const emailService = new EmailService();
  return emailService.sendEmail(to, subject, html, text);
};

export default new EmailService();


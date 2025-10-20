import twilio from 'twilio';

class SMSService {
  constructor() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    } else {
      console.warn('Twilio credentials not configured. SMS functionality will be disabled.');
      this.client = null;
    }
  }

  // Send SMS
  async sendSMS(to, message) {
    try {
      if (!this.client) {
        console.log('SMS (Mock):', { to, message });
        return {
          success: true,
          messageId: 'mock-' + Date.now(),
          mock: true
        };
      }

      // Format phone number (add country code if not present)
      const formattedPhone = to.startsWith('+') ? to : `+91${to}`;

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedPhone
      });

      console.log('SMS sent successfully:', result.sid);
      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw new Error('Failed to send SMS');
    }
  }

  // Send OTP SMS
  async sendOTP(phone, otp) {
    const message = `Your Carpool Connect verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
    return await this.sendSMS(phone, message);
  }

  // Send ride alert SMS
  async sendRideAlert(phone, message) {
    return await this.sendSMS(phone, `Carpool Connect: ${message}`);
  }

  // Send booking confirmation SMS
  async sendBookingConfirmation(phone, bookingDetails) {
    const message = `Your ride is confirmed! From: ${bookingDetails.source} To: ${bookingDetails.destination} on ${bookingDetails.date}. Booking ID: ${bookingDetails.bookingId}`;
    return await this.sendSMS(phone, message);
  }

  // Send ride reminder SMS
  async sendRideReminder(phone, rideDetails) {
    const message = `Reminder: Your ride is scheduled in 1 hour from ${rideDetails.source} to ${rideDetails.destination}. Be ready!`;
    return await this.sendSMS(phone, message);
  }

  // Send cancellation SMS
  async sendCancellationNotification(phone, bookingId) {
    const message = `Your booking ${bookingId} has been cancelled. If you didn't cancel this, please contact support.`;
    return await this.sendSMS(phone, message);
  }

  // Send emergency alert SMS
  async sendEmergencyAlert(phone, location) {
    const message = `EMERGENCY ALERT: A user has triggered an emergency alert at ${location}. Please check immediately.`;
    return await this.sendSMS(phone, message);
  }
}

export const sendSMS = (to, message) => {
  const smsService = new SMSService();
  return smsService.sendSMS(to, message);
};

export default new SMSService();
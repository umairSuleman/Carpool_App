// frontend/CarPoolApp/services/paymentService.ts
import ApiService from './api';
import RazorpayCheckout from 'react-native-razorpay';
import { Alert } from 'react-native';

interface OrderResponse {
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}

class PaymentService {

  /**
   * Pay for a booking using the internal wallet
   */
  async payFromWallet(bookingId: string) {
    try {
      const response = await ApiService.request('/payments/pay-from-wallet', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to pay with wallet');
    }
  }

  /**
   * Create a Razorpay order
   */
  async createOrder(bookingId: string): Promise<OrderResponse> {
    try {
      const response = await ApiService.request('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
      
      if (!response.success || !response.orderId) {
        throw new Error(response.error || 'Failed to create payment order');
      }
      
      return response as OrderResponse;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create payment order');
    }
  }
  
  /**
   * Verify a Razorpay payment
   */
  async verifyPayment(paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    booking_id: string;
  }) {
    try {
      const response = await ApiService.request('/payments/verify', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to verify payment');
    }
  }
  
  /**
   * Handle the complete Razorpay checkout flow
   */
  async openRazorpayCheckout(
    bookingId: string,
    amount: number,
    orderId: string,
    apiKey: string,
    userInfo: { name: string; email: string; phone: string }
  ) {
    
    const options = {
      description: `Payment for Booking ${bookingId}`,
      image: 'https://placehold.co/100x100/007AFF/FFFFFF?text=CC', // Your app logo
      currency: 'INR',
      key: apiKey,
      amount: amount,
      order_id: orderId,
      name: 'CarPoolConnect',
      prefill: {
        email: userInfo.email,
        contact: userInfo.phone,
        name: userInfo.name,
      },
      theme: { color: '#007AFF' },
    };

    return new Promise((resolve, reject) => {
      RazorpayCheckout.open(options)
        .then(async (data) => {
          // Payment successful
          try {
            const verification = await this.verifyPayment({
              razorpay_order_id: orderId,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature,
              booking_id: bookingId,
            });
            
            if (verification.success) {
              Alert.alert('Payment Successful', 'Your payment has been verified.');
              resolve(verification);
            } else {
              throw new Error(verification.error || 'Payment verification failed');
            }
          } catch (error: any) {
            Alert.alert('Verification Failed', error.message);
            reject(error);
          }
        })
        .catch((error) => {
          // Payment failed or was cancelled
          console.error('Razorpay Error:', error);
          Alert.alert('Payment Failed', error.description || 'The payment was cancelled or failed.');
          reject(new Error(error.description || 'Payment failed'));
        });
    });
  }
}

export default new PaymentService();
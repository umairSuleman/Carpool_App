import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  ScrollView // Use ScrollView for flexibility
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PaymentService from '../services/paymentService';
import ApiService from '../services/api';

// Simple Icons for visual separation
const WalletIcon = () => <Text style={styles.icon}>💰</Text>;
const GatewayIcon = () => <Text style={styles.icon}>💳</Text>;

const PaymentScreen = () => {
  const { bookingId, amount } = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', email: '', phone: '' });

  const amountToPay = parseFloat(amount as string);

  useEffect(() => {
    // We still fetch user info for the Razorpay prefill
    const fetchUser = async () => {
      try {
        const profile = await ApiService.getProfile();
        if (profile.success && profile.user) {
          setUserInfo({
            name: profile.user.name,
            email: profile.user.email,
            phone: profile.user.phone,
          });
        }
      } catch (error) {
        console.error('Failed to fetch user info', error);
        // Don't block payment if this fails, prefill will just be empty
      }
    };
    fetchUser();
  }, []);

  const handlePayWithWallet = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      // This service call remains, as it's a payment option
      const response = await PaymentService.payFromWallet(bookingId as string);
      if (response.success) {
        Alert.alert('Payment Successful', 'Paid with your wallet.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/(drawer)/my_bookings') }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithGateway = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      // 1. Create order on backend
      const order = await PaymentService.createOrder(bookingId as string);
      
      // 2. Open Razorpay checkout
      await PaymentService.openRazorpayCheckout(
        bookingId as string,
        order.amount,
        order.orderId,
        order.key,
        userInfo
      );
      
      // 3. On success, navigate
      router.replace('/(tabs)/(drawer)/my_bookings');

    } catch (error: any) {
      // Error alerts are handled inside openRazorpayCheckout
      console.log('Payment flow error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Payment Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{bookingId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount to Pay</Text>
            <Text style={styles.amount}>₹{amountToPay.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        {/* Wallet Payment Option */}
        <TouchableOpacity 
          style={[styles.optionButton, loading && styles.disabledButton]} 
          onPress={handlePayWithWallet}
          disabled={loading}
        >
          <WalletIcon />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Pay with Wallet</Text>
            <Text style={styles.optionSubtitle}>Use your CarPoolConnect balance</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Razorpay Payment Option */}
        <TouchableOpacity 
          style={[styles.optionButton, loading && styles.disabledButton]} 
          onPress={handlePayWithGateway}
          disabled={loading}
        >
          <GatewayIcon />
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Pay with Razorpay</Text>
            <Text style={styles.optionSubtitle}>Credit/Debit Card, UPI, Netbanking</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Loading overlay for processing */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
        
      </ScrollView>

      {/* Pay Later Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Pay Later</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    maxWidth: '60%',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  amount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20, // Increased padding
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  icon: {
    fontSize: 24,
    marginRight: 15,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#c7c7cc',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f5f5f5',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c7c7cc',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    zIndex: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});
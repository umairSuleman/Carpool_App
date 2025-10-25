import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { validateOTP } from '../../utils/validators';
import colors from '../../constants/colors';
import config from '../../constants/config';

// The route will pass phone and email as params after successful registration
const OTPVerificationScreen = ({ navigation, route }) => {
  const { phone, email } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyOTP } = useAuth();
  const otpLength = config.OTP_LENGTH; // Use value from config

  const handleVerify = async () => {
    if (!validateOTP(otp)) {
      Alert.alert('Error', `Please enter a valid ${otpLength}-digit OTP.`);
      return;
    }

    setLoading(true);
    try {
      // API call to verify OTP
      const result = await verifyOTP(otp, phone);
      if (result.success) {
        // Verification successful, useAuth should have updated the global state
        // and RootNavigator will automatically transition to MainNavigator.
      } else {
        Alert.alert('Verification Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  // Placeholder for Resend OTP logic
  const handleResendOTP = () => {
    Alert.alert('Resend OTP', 'Resending OTP to your phone/email...');
    // Add logic here to call a resend OTP API endpoint
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Icon name="cellphone-key" size={60} color={colors.primary} />
          <Text style={styles.title}>Verify Your Account</Text>
          <Text style={styles.subtitle}>
            Enter the {otpLength}-digit code sent to {phone || email}
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            placeholder={`Enter ${otpLength}-digit OTP`}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={otpLength}
            style={styles.input}
            inputStyle={styles.otpInputStyle}
          />

          <Button
            title="Verify Code"
            onPress={handleVerify}
            loading={loading}
            style={styles.verifyButton}
          />

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendOTP}
          >
            <Text style={styles.resendButtonText}>
              Didn't receive the code? <Text style={styles.resendLink}>Resend</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {loading && <LoadingSpinner />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '80%', // Make input stand out as an OTP field
    backgroundColor: colors.background,
  },
  otpInputStyle: {
    textAlign: 'center',
    letterSpacing: 10,
    fontSize: 24,
    fontWeight: 'bold',
  },
  verifyButton: {
    marginTop: 30,
    width: '100%',
  },
  resendButton: {
    marginTop: 20,
  },
  resendButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default OTPVerificationScreen;
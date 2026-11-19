import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenWrapper from '../../components/ScreenWrapper';
import AppText from '../../components/AppText';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';

import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { loginWithPhone } = useAuth();

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = () => {
    if (!/^[0-9]{10}$/.test(mobile)) {
      Alert.alert('Validation', 'Please enter a valid 10-digit mobile number');
      return;
    }

    // Demo OTP flow
    setOtp('');
    setOtpSent(true);

    //Alert.alert('OTP Sent', 'Your demo OTP is 123456');
  };

  const handleVerifyOtp = () => {
    if (!/^[0-9]{6}$/.test(otp)) {
      Alert.alert('Validation', 'Please enter a valid 6-digit OTP');
      return;
    }

    // Demo OTP verification
    if (otp !== '123456') {
      Alert.alert('Invalid OTP', 'Please enter correct OTP');
      return;
    }

    const success = loginWithPhone(mobile);

    if (!success) {
      Alert.alert('Login Failed', 'Unable to login with this mobile number');
      return;
    }

    // AuthContext updates user.
    // RootNavigator automatically opens MainNavigator.
  };

  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtp('');
  };

  const handleResendOtp = () => {
    if (!mobile) {
      return;
    }

    setOtp('');
    //Alert.alert('OTP Sent', 'Your new demo OTP is 123456');
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <AppText color={Colors.white} variant="h1">
                G
              </AppText>
            </View>

            <AppText variant="h2">GMR</AppText>

            <AppText color={Colors.textSecondary}>
              Your game. Your ground. Your time.
            </AppText>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <AppText variant="h1">
              {otpSent ? 'Verify OTP' : 'Welcome Back!'}
            </AppText>

            <AppText color={Colors.textSecondary} style={styles.subtitle}>
              {otpSent
                ? `Enter the 6-digit OTP sent to +91 ${mobile}`
                : 'Login using your mobile number.'}
            </AppText>

            {!otpSent ? (
              <>
                <AppInput
                  label="Mobile Number"
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChangeText={value =>
                    setMobile(value.replace(/[^0-9]/g, '').slice(0, 10))
                  }
                  keyboardType="number-pad"
                />

                <AppButton
                  title="Send OTP"
                  onPress={handleSendOtp}
                  style={styles.loginButton}
                />
              </>
            ) : (
              <>
                <AppInput
                  label="Enter OTP"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={value =>
                    setOtp(value.replace(/[^0-9]/g, '').slice(0, 6))
                  }
                  keyboardType="number-pad"
                />

                <AppButton
                  title="Verify & Login"
                  onPress={handleVerifyOtp}
                  style={styles.loginButton}
                />

                <TouchableOpacity
                  style={styles.changeNumber}
                  onPress={handleChangeNumber}
                >
                  <AppText color={Colors.accentDark} variant="bodyMedium">
                    Change Mobile Number
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resend}
                  onPress={handleResendOtp}
                >
                  <AppText color={Colors.accent} variant="bodyMedium">
                    Resend OTP
                  </AppText>
                </TouchableOpacity>
              </>
            )}

            {/* Signup */}
            <View style={styles.footer}>
              <AppText color={Colors.textSecondary}>
                Don't have an account?{' '}
              </AppText>

              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <AppText color={Colors.accentDark} variant="bodyMedium">
                  Sign Up
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Admin Login */}
            <TouchableOpacity
              style={styles.adminLogin}
              onPress={() => navigation.navigate('Admin')}
              activeOpacity={0.8}
            >
              <AppText color={Colors.accentDark} variant="bodyMedium">
                Login as Complex / Sport Admin
              </AppText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 30,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 45,
    gap: 10,
  },

  logo: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  form: {
    width: '100%',
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 30,
    lineHeight: 22,
  },

  loginButton: {
    marginTop: 20,
  },

  changeNumber: {
    alignSelf: 'center',
    marginTop: 20,
  },

  resend: {
    alignSelf: 'center',
    marginTop: 15,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },

  adminLogin: {
    alignSelf: 'center',
    marginTop: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default LoginScreen;

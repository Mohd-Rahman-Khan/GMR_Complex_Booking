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

const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const { requestOtp, verifyOtp } = useAuth();

  const [mobile, setMobile] = useState(route.params?.phone || '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!/^[0-9]{10}$/.test(mobile)) {
      Alert.alert('Validation', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);

      const devOtp = await requestOtp(mobile);

      setOtp('');
      setOtpSent(true);

      Alert.alert(
        'OTP Sent',
        devOtp
          ? `Development OTP: ${devOtp}`
          : `OTP has been sent to +91 ${mobile}`,
      );
    } catch (error: any) {
      Alert.alert('OTP Failed', error?.message || 'Unable to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^[0-9]{6}$/.test(otp)) {
      Alert.alert('Validation', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);

      await verifyOtp(mobile, otp);

      // RootNavigator automatically navigates according to user role.
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error?.message || 'Invalid OTP. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtp('');
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);

      const devOtp = await requestOtp(mobile);

      setOtp('');

      Alert.alert(
        'OTP Sent',
        devOtp
          ? `Your new development OTP is ${devOtp}`
          : `A new OTP has been sent to +91 ${mobile}`,
      );
    } catch (error: any) {
      Alert.alert('Resend Failed', error?.message || 'Unable to resend OTP');
    } finally {
      setLoading(false);
    }
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

          <View style={styles.form}>
            <AppText variant="h1">
              {otpSent ? 'Verify OTP' : 'Welcome Back!'}
            </AppText>

            <AppText color={Colors.textSecondary} style={styles.subtitle}>
              {otpSent
                ? `Enter the 6-digit OTP sent to +91 ${mobile}`
                : 'Login using your registered mobile number.'}
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
                  title={loading ? 'Sending OTP...' : 'Send OTP'}
                  onPress={handleSendOtp}
                  style={styles.loginButton}
                  disabled={loading}
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
                  title={loading ? 'Verifying...' : 'Verify & Login'}
                  onPress={handleVerifyOtp}
                  style={styles.loginButton}
                  disabled={loading}
                />

                <TouchableOpacity
                  style={styles.changeNumber}
                  onPress={handleChangeNumber}
                  disabled={loading}
                >
                  <AppText color={Colors.accentDark} variant="bodyMedium">
                    Change Mobile Number
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resend}
                  onPress={handleResendOtp}
                  disabled={loading}
                >
                  <AppText color={Colors.accent} variant="bodyMedium">
                    Resend OTP
                  </AppText>
                </TouchableOpacity>
              </>
            )}

            {!otpSent && (
              <>
                <View style={styles.adminSection}>
                  <AppText color={Colors.textSecondary}>
                    Own or manage a sports complex?
                  </AppText>

                  <TouchableOpacity
                    style={styles.adminRegister}
                    onPress={() => navigation.navigate('Signup')}
                  >
                    <AppText color={Colors.accentDark} variant="bodyMedium">
                      Register as Complex Admin
                    </AppText>
                  </TouchableOpacity>
                </View>
              </>
            )}
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

  adminSection: {
    alignItems: 'center',
    marginTop: 28,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  adminRegister: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default LoginScreen;

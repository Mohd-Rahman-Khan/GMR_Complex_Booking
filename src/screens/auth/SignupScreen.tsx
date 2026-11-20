import React, { useState } from 'react';

import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenWrapper from '../../components/ScreenWrapper';
import AppText from '../../components/AppText';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';

import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';

import { Colors } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { registerAdmin } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      Alert.alert(
        'Invalid Mobile',
        'Please enter a valid 10-digit mobile number.',
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);

      await registerAdmin(
        name.trim(),
        phone.trim(),
        email.trim().toLowerCase(),
      );

      Alert.alert(
        'Registration Successful',
        'Your Complex Admin account has been created. Please login using OTP.',
        [
          {
            text: 'Continue to Login',
            onPress: () => {
              navigation.replace('Login', {
                phone: phone.trim(),
              });
            },
          },
        ],
        { cancelable: false },
      );
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error?.message || 'Unable to register. Please try again.',
      );
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <AppText variant="h2">‹</AppText>
          </TouchableOpacity>

          <View style={styles.badge}>
            <AppText style={styles.badgeText}>
              COMPLEX ADMIN REGISTRATION
            </AppText>
          </View>

          <AppText variant="h1">Register Your Complex</AppText>

          <AppText color={Colors.textSecondary} style={styles.subtitle}>
            Create your admin account to manage your sports complex, sports,
            bookings and team.
          </AppText>

          <AppInput
            label="Owner / Admin Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
          />

          <AppInput
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <AppInput
            label="Mobile Number"
            placeholder="Enter 10-digit mobile number"
            value={phone}
            onChangeText={value =>
              setPhone(value.replace(/\D/g, '').slice(0, 10))
            }
            keyboardType="phone-pad"
            maxLength={10}
          />

          <View style={styles.infoBox}>
            <AppText style={styles.infoTitle}>What happens next?</AppText>

            <AppText style={styles.infoText}>
              1. Your Complex Admin account will be created.
            </AppText>

            <AppText style={styles.infoText}>
              2. Login using OTP on your registered mobile number.
            </AppText>

            <AppText style={styles.infoText}>
              3. Create your sports complex and manage everything.
            </AppText>
          </View>

          <AppButton
            title={loading ? 'Creating Account...' : 'Register as Admin'}
            onPress={handleSignup}
            disabled={loading}
            style={styles.button}
          />

          {loading && (
            <ActivityIndicator
              color={Colors.accentDark}
              style={{ marginTop: 12 }}
            />
          )}

          <View style={styles.footer}>
            <AppText color={Colors.textSecondary}>Already registered? </AppText>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <AppText color={Colors.accentDark} variant="bodyMedium">
                Login
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
    paddingVertical: 25,
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5F3E8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 15,
  },

  badgeText: {
    color: '#14532D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  subtitle: {
    marginTop: 10,
    marginBottom: 25,
    lineHeight: 22,
  },

  infoBox: {
    backgroundColor: '#F0F7F1',
    borderRadius: 14,
    padding: 15,
    marginTop: 15,
  },

  infoTitle: {
    color: '#14532D',
    fontWeight: '900',
    marginBottom: 10,
  },

  infoText: {
    color: '#52665A',
    fontSize: 12,
    lineHeight: 21,
  },

  button: {
    marginTop: 22,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
});

export default SignupScreen;

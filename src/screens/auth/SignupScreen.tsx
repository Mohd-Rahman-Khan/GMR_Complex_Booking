import React, { useState } from 'react';

import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import ScreenWrapper from '../../components/ScreenWrapper';
import AppText from '../../components/AppText';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';

import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';

import { Colors, Spacing } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Validation', 'All fields are required');
      return;
    }

    const success = signup(name, email, password);

    if (!success) {
      Alert.alert(
        'Invalid Details',
        'Enter a valid name, email and password (minimum 6 characters).',
      );
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

          <AppText variant="h1">Create Account</AppText>

          <AppText color={Colors.textSecondary} style={styles.subtitle}>
            Join SportsArena and book your favourite ground.
          </AppText>

          <AppInput
            label="Full Name"
            placeholder="Enter your name"
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
            label="Password"
            placeholder="Create password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <AppButton
            title="Create Account"
            onPress={handleSignup}
            style={styles.button}
          />

          <View style={styles.footer}>
            <AppText color={Colors.textSecondary}>
              Already have an account?{' '}
            </AppText>

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
    marginBottom: 30,
  },

  subtitle: {
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 22,
  },

  button: {
    marginTop: 15,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
});

export default SignupScreen;

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminStack';
import { useAdmin } from '../../context/AdminContext';
import { ui, GREEN } from './adminUi';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminLogin'>;

const DEMO_OTP = '123456';

export default function AdminLoginScreen({ navigation }: Props) {
  const { admins, loading, resetDemoData } = useAdmin();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  const normalizePhone = (value: string) => value.replace(/\D/g, '').slice(-10);

  const handleSendOtp = () => {
    if (loading) {
      Alert.alert('Please wait', 'Admin accounts are still loading.');
      return;
    }

    if (phone.length !== 10) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid 10-digit mobile number.',
      );
      return;
    }

    const matchedAdmins = admins.filter(admin => {
      const savedPhone = normalizePhone(admin.phone || '');

      return savedPhone === phone && admin.isActive;
    });

    if (matchedAdmins.length === 0) {
      Alert.alert(
        'Account Not Found',
        'Is mobile number se koi active admin account nahi mila. Please registered mobile number enter karein.',
      );
      return;
    }

    if (matchedAdmins.length > 1) {
      Alert.alert(
        'Multiple Accounts',
        'Is mobile number se multiple admin accounts linked hain. Please unique mobile number use karein.',
      );
      return;
    }

    setOtp('');
    setOtpSent(true);

    //Alert.alert('OTP Sent', `Demo OTP: ${DEMO_OTP}`);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }

    if (otp !== DEMO_OTP) {
      Alert.alert('Invalid OTP', 'Please enter correct OTP.');
      return;
    }

    const user = admins.find(admin => {
      const savedPhone = normalizePhone(admin.phone || '');

      return savedPhone === phone && admin.isActive;
    });

    if (!user) {
      Alert.alert('Login Failed', 'Admin account not found or inactive.');
      return;
    }

    // Navigate according to admin role
    if (user.role === 'sport_admin') {
      navigation.replace('SportAdminDashboard', {
        adminId: user.id,
      });
    } else if (user.role === 'complex_admin') {
      navigation.replace('AdminDashboard', {
        adminId: user.id,
        complexId: user.complexId,
      });
    } else {
      Alert.alert('Invalid Role', 'This admin role is not supported.');
    }
  };

  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtp('');
  };

  const handleResendOtp = () => {
    if (!phone) return;

    setOtp('');
    Alert.alert('OTP Sent', `Your demo OTP is ${DEMO_OTP}`);
  };

  const reloadDemoAccounts = () => {
    Alert.alert(
      'Reload demo accounts?',
      'This will replace locally saved Admin Panel demo data with the sample accounts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reload',
          onPress: async () => {
            try {
              setResetting(true);

              await resetDemoData();

              setPhone('');
              setOtp('');
              setOtpSent(false);

              Alert.alert(
                'Success',
                'Demo admin accounts reloaded successfully.',
              );
            } catch (error) {
              Alert.alert('Error', 'Demo accounts reload nahi ho paye.');
            } finally {
              setResetting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View
      style={[
        ui.screen,
        {
          flex: 1,
          justifyContent: 'center',
          padding: 22,
        },
      ]}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: GREEN,
          padding: 24,
          borderRadius: 22,
          marginBottom: 28,
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 27,
            fontWeight: '900',
            marginTop: 8,
          }}
        >
          Admin Login
        </Text>

        <Text
          style={{
            color: '#D1FAE5',
            fontSize: 13,
            marginTop: 5,
          }}
        >
          Complex Admin & Sport Subadmin
        </Text>
      </View>

      {!otpSent ? (
        <>
          <Text style={ui.label}>Mobile Number</Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                backgroundColor: '#E8F2EB',
                padding: 15,
                borderRadius: 12,
                marginRight: 8,
              }}
            >
              <Text style={{ color: GREEN, fontWeight: '800' }}>+91</Text>
            </View>

            <TextInput
              value={phone}
              onChangeText={value =>
                setPhone(value.replace(/[^0-9]/g, '').slice(0, 10))
              }
              keyboardType="phone-pad"
              maxLength={10}
              style={[ui.input, { flex: 1 }]}
              placeholder="Enter mobile number"
              placeholderTextColor="#9AA69D"
            />
          </View>

          <TouchableOpacity
            style={[
              ui.button,
              {
                marginTop: 22,
                opacity: loading || resetting ? 0.6 : 1,
              },
            ]}
            disabled={loading || resetting}
            onPress={handleSendOtp}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={ui.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={ui.label}>Enter OTP</Text>

          <Text
            style={{
              color: '#64756A',
              fontSize: 13,
              marginBottom: 15,
            }}
          >
            Enter the 6-digit OTP sent to +91 {phone}
          </Text>

          <TextInput
            value={otp}
            onChangeText={value =>
              setOtp(value.replace(/[^0-9]/g, '').slice(0, 6))
            }
            keyboardType="number-pad"
            maxLength={6}
            style={ui.input}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor="#9AA69D"
          />

          <TouchableOpacity
            style={[ui.button, { marginTop: 22 }]}
            onPress={handleVerifyOtp}
          >
            <Text style={ui.buttonText}>Verify & Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleChangeNumber}
            style={{ alignSelf: 'center', padding: 14, marginTop: 12 }}
          >
            <Text style={{ color: GREEN, fontWeight: '700' }}>
              Change Mobile Number
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResendOtp}
            style={{ alignSelf: 'center', padding: 10 }}
          >
            <Text style={{ color: GREEN, fontWeight: '700' }}>Resend OTP</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Demo Information */}
      {/* <View style={[ui.card, { marginTop: 24 }]}>
        <Text style={ui.title}>Demo Login Instructions</Text>
        <Text style={ui.sub}>
          Use the mobile number registered in the admin account.
        </Text>
        <Text style={ui.sub}>Demo OTP: 123456</Text>
        <Text style={ui.sub}>
          Available roles: Complex Admin and Sport Subadmin
        </Text>
      </View> */}

      {/* Reset Demo Accounts */}
      {/* <TouchableOpacity
        onPress={reloadDemoAccounts}
        disabled={loading || resetting}
        style={{
          alignSelf: 'center',
          padding: 14,
          marginTop: 8,
        }}
      >
        <Text
          style={{
            color: GREEN,
            fontSize: 13,
            fontWeight: '800',
          }}
        >
          {resetting
            ? 'Reloading demo accounts...'
            : 'Reload / Reset Demo Accounts'}
        </Text>
      </TouchableOpacity> */}
    </View>
  );
}

import React from 'react';

import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';

import ScreenWrapper from '../../components/ScreenWrapper';
import AppText from '../../components/AppText';
import AppButton from '../../components/AppButton';

import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing } from '../../theme';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <AppText variant="h2" style={styles.title}>
        My Profile
      </AppText>

      <View style={styles.profile}>
        <View style={styles.avatar}>
          <AppText color={Colors.white} variant="h1">
            {user?.name?.charAt(0) || 'P'}
          </AppText>
        </View>

        <AppText variant="h3">{user?.name}</AppText>

        <AppText color={Colors.secondary}>{user?.email}</AppText>
      </View>

      {[
        'Personal Information',
        'Notifications',
        'Help & Support',
        'Settings',
      ].map(item => (
        <TouchableOpacity key={item} style={styles.option}>
          <AppText variant="bodyMedium">{item}</AppText>
          <AppText color={Colors.secondary}>›</AppText>
        </TouchableOpacity>
      ))}

      <AppButton
        title="Logout"
        variant="outline"
        onPress={handleLogout}
        style={styles.logout}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  title: {
    marginTop: 20,
    marginBottom: 25,
  },

  profile: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 30,
  },

  avatar: {
    width: 85,
    height: 85,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  option: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  logout: {
    marginTop: 20,
  },
});

export default ProfileScreen;

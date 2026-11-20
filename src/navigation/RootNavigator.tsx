import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import AdminStack from './AdminStack';

import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';

const RootNavigator = () => {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isAdmin =
    user?.role === 'complex_admin' || user?.role === 'sport_admin';

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : isAdmin ? (
        <AdminStack authenticated={true} user={user} />
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

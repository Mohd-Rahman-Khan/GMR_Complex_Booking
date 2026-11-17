import React from 'react';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { BookingProvider } from './src/context/BookingContext';

import RootNavigator from './src/navigation/RootNavigator';
import { AdminProvider } from './src/context/AdminContext';

const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BookingProvider>
          <AdminProvider>
            <RootNavigator />
          </AdminProvider>
        </BookingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;

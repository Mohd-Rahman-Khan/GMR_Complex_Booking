import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminLoginScreen from '../screens/admin/AdminLoginScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ComplexDetailsScreen from '../screens/admin/ComplexDetailsScreen';
import SportsManagementScreen from '../screens/admin/SportsManagementScreen';
import SportDetailsScreen from '../screens/admin/SportDetailsScreen';
import SubadminManagementScreen from '../screens/admin/SubadminManagementScreen';
import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';

// Existing screens from the original admin flow
import ComplexListScreen from '../screens/admin/ComplexListScreen';
import ComplexFormScreen from '../screens/admin/ComplexFormScreen';
import SportAdminsScreen from '../screens/admin/SportAdminsScreen';
import SportAdminDashboardScreen from '../screens/admin/SportAdminDashboardScreen';

export type AdminStackParamList = {
  AdminLogin: undefined;
  AdminDashboard: { complexId: string; adminId: string };
  ComplexDetails: { complexId: string };
  SportsManagement: { complexId: string };
  SportDetails: { complexId: string; sportId: string };
  SubadminManagement: { complexId: string };
  AdminBookings: { complexId: string };
  ComplexList: undefined;
  ComplexForm: { complexId?: string } | undefined;
  SportAdmins: { complexId: string };
  SportAdminDashboard: { adminId: string };
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminLogin"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F4F7F4' },
      }}
    >
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="ComplexDetails" component={ComplexDetailsScreen} />
      <Stack.Screen
        name="SportsManagement"
        component={SportsManagementScreen}
      />
      <Stack.Screen name="SportDetails" component={SportDetailsScreen} />
      <Stack.Screen
        name="SubadminManagement"
        component={SubadminManagementScreen}
      />
      <Stack.Screen name="AdminBookings" component={AdminBookingsScreen} />

      <Stack.Screen name="ComplexList" component={ComplexListScreen} />
      <Stack.Screen name="ComplexForm" component={ComplexFormScreen} />
      <Stack.Screen name="SportAdmins" component={SportAdminsScreen} />
      <Stack.Screen
        name="SportAdminDashboard"
        component={SportAdminDashboardScreen}
      />
    </Stack.Navigator>
  );
}

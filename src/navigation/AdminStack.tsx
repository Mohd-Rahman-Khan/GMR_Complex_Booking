import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ComplexDetailsScreen from '../screens/admin/ComplexDetailsScreen';
import SportsManagementScreen from '../screens/admin/SportsManagementScreen';
import SportDetailsScreen from '../screens/admin/SportDetailsScreen';
import SubadminManagementScreen from '../screens/admin/SubadminManagementScreen';
import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';
import ComplexListScreen from '../screens/admin/ComplexListScreen';
import ComplexFormScreen from '../screens/admin/ComplexFormScreen';
import SportAdminsScreen from '../screens/admin/SportAdminsScreen';
import SportAdminDashboardScreen from '../screens/admin/SportAdminDashboardScreen';

import { User } from '../context/AuthContext';

export type AdminStackParamList = {
  AdminDashboard: {
    complexId?: string;
    adminId: string;
  };

  ComplexDetails: {
    complexId: string;
  };

  SportsManagement: {
    complexId: string;
  };

  SportDetails: {
    complexId: string;
    sportId: string;
  };

  SubadminManagement: {
    complexId: string;
  };

  AdminBookings: {
    complexId: string;
  };

  ComplexList: undefined;

  ComplexForm:
    | {
        complexId?: string;
      }
    | undefined;

  SportAdmins: {
    complexId: string;
  };

  SportAdminDashboard: {
    adminId: string;
  };
};

type Props = {
  authenticated: boolean;
  user: User | null;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStack({ authenticated, user }: Props) {
  const isSportAdmin = user?.role === 'sport_admin';

  const initialScreen = isSportAdmin ? 'SportAdminDashboard' : 'AdminDashboard';

  if (!authenticated || !user || !user.id) {
    return null;
  }

  return (
    <Stack.Navigator
      key={`${user.role}-${user.id}`}
      initialRouteName={initialScreen}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        initialParams={{
          adminId: user.id,
          complexId: user.complexId || undefined,
        }}
      />

      <Stack.Screen
        name="SportAdminDashboard"
        component={SportAdminDashboardScreen}
        initialParams={{
          adminId: user.id,
        }}
      />

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
    </Stack.Navigator>
  );
}

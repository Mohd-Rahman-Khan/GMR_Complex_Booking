import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabNavigator from './TabNavigator';

import ExploreScreen from '../screens/grounds/ExploreScreen';

import GroundDetailsScreen from '../screens/grounds/GroundDetailsScreen';

import SlotBookingScreen from '../screens/bookings/SlotBookingScreen';

import BookingSummaryScreen from '../screens/bookings/BookingSummaryScreen';

import { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      <Stack.Screen name="GroundListing" component={ExploreScreen} />

      <Stack.Screen name="GroundDetails" component={GroundDetailsScreen} />

      <Stack.Screen name="SlotBooking" component={SlotBookingScreen} />

      <Stack.Screen name="BookingSummary" component={BookingSummaryScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;

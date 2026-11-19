import React from 'react';
import { Text } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/home/HomeScreen';
import ExploreScreen from '../screens/grounds/ExploreScreen';
import MyBookingsScreen from '../screens/bookings/MyBookingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

import { TabParamList } from './types';
import { Colors } from '../theme';

const Tab = createBottomTabNavigator<TabParamList>();

const TabIcon = ({ symbol, color }: { symbol: string; color: string }) => (
  <Text style={{ fontSize: 22, color }}>{symbol}</Text>
);

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: Colors.accentDark,
        tabBarInactiveTintColor: Colors.secondary,

        tabBarStyle: {
          height: 68,
          paddingBottom: 9,
          paddingTop: 8,
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          elevation: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon symbol="⌂" color={color} />,
        }}
      />

      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon symbol="⌕" color={color} />,
        }}
      />

      <Tab.Screen
        name="Bookings"
        component={MyBookingsScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon symbol="▣" color={color} />,
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon symbol="◉" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;

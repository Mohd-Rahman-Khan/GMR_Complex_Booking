import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { AdminStackParamList } from '../../navigation/AdminStack';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminDashboard'>;

type Complex = {
  _id?: string;
  id?: string;
  ownerName?: string;
  name?: string;
  complexName?: string;
  sports?: any[];
  isActive?: boolean;
  address?: string;
};

const C = {
  green: '#14532D',
  bg: '#F4F7F4',
  text: '#17251B',
  muted: '#718078',
  border: '#E4EBE5',
  white: '#FFFFFF',
};

export default function AdminDashboardScreen({ route, navigation }: Props) {
  const { user, token, logout } = useAuth();

  const [complex, setComplex] = useState<Complex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const adminId = route.params?.adminId || user?.id || '';

  const loadComplex = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError('Authentication token not found. Please login again.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response: any = await apiRequest('/complexes/my', {
        method: 'GET',
        token,
      });

      // API response ko handle karna
      const payload = response?.data ?? response;

      let list: Complex[] = [];

      if (Array.isArray(payload)) {
        list = payload;
      } else if (Array.isArray(payload?.complexes)) {
        list = payload.complexes;
      } else if (payload?.complex) {
        list = [payload.complex];
      } else if (payload?._id || payload?.id) {
        list = [payload];
      }

      if (list.length > 0) {
        const selectedComplex = route.params?.complexId
          ? list.find(
              item =>
                String(item._id || item.id) === String(route.params.complexId),
            )
          : list[0];

        setComplex(selectedComplex || list[0]);
      } else {
        setComplex(null);
      }
    } catch (err: any) {
      console.log('Load complex error:', err);
      setError(err?.message || 'Unable to load complex details.');
      setComplex(null);
    } finally {
      setLoading(false);
    }
  }, [token, route.params?.complexId]);

  // Screen par wapas aane par complex refresh hoga
  useFocusEffect(
    useCallback(() => {
      loadComplex();
    }, [loadComplex]),
  );

  const complexId = String(complex?._id || complex?.id || '');

  const sports = complex?.sports || [];

  const ownerName =
    complex?.ownerName ||
    complex?.name ||
    complex?.complexName ||
    user?.name ||
    'Admin';

  const openCreateComplex = () => {
    navigation.navigate('ComplexForm');
  };

  const open = (
    screen:
      | 'ComplexDetails'
      | 'SportsManagement'
      | 'SubadminManagement'
      | 'AdminBookings',
  ) => {
    if (!complexId) {
      Alert.alert('Error', 'Complex details not available.');
      return;
    }

    navigation.navigate(screen, { complexId });
  };

  const openComplexList = () => {
    navigation.navigate('ComplexList');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Unable to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const menu = [
    {
      icon: '🏟️',
      title: 'Sport Complex',
      subtitle: 'Details, contact information and status',
      count: 'Edit',
      action: openComplexList,
    },
    {
      icon: '🏅',
      title: 'Sports',
      subtitle: 'Manage sports and booking prices',
      count: `${sports.length} sports`,
      action: () => open('SportsManagement'),
    },
    {
      icon: '👥',
      title: 'Subadmin Team',
      subtitle: 'Create accounts and assign admins to sports',
      count: 'Manage',
      action: () => open('SubadminManagement'),
    },
    {
      icon: '📅',
      title: 'Bookings',
      subtitle: 'Manage bookings for your complex',
      count: 'View',
      action: () => open('AdminBookings'),
    },
  ];

  if (loading) {
    return (
      <View style={S.center}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <ActivityIndicator size="large" color={C.green} />
        <Text style={S.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Complex create nahi hua hai
  if (!complex) {
    return (
      <View style={S.emptyContainer}>
        <StatusBar barStyle="light-content" backgroundColor={C.green} />

        <View style={S.emptyHero}>
          <Text style={S.eyebrow}>• COMPLEX ADMIN</Text>

          <Text style={S.heroTitle}>SPORTSARENA</Text>

          <Text style={S.heroSub}>Welcome back, {user?.name || 'Admin'}</Text>
          <TouchableOpacity style={S.emptyLogoutButton} onPress={handleLogout}>
            <Text style={S.emptyLogoutText}>↪ Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={S.emptyContent}>
          <View style={S.emptyIcon}>
            <Text style={{ fontSize: 45 }}>🏟️</Text>
          </View>

          <Text style={S.emptyTitle}>Welcome to your Dashboard!</Text>

          <Text style={S.emptyDescription}>
            Your admin account is ready. Create your sports complex to start
            managing sports, bookings and your team.
          </Text>

          {!!error && (
            <View style={S.errorBox}>
              <Text style={S.errorText}>{error}</Text>

              <TouchableOpacity onPress={loadComplex}>
                <Text style={S.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={S.createButton}
            activeOpacity={0.85}
            onPress={openCreateComplex}
          >
            <Text style={S.createButtonText}>+ Create Your First Complex</Text>
          </TouchableOpacity>

          <Text style={S.helperText}>
            You can manage your complex after creating it.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.green} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 35 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={S.hero}>
          <Text style={S.eyebrow}>• COMPLEX ADMIN</Text>

          <View style={S.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={S.heroTitle}>SPORTSARENA</Text>

              <Text style={S.heroSub}>Welcome back, {ownerName}</Text>
            </View>

            <View style={S.avatar}>
              <Text style={S.avatarText}>
                {ownerName?.[0]?.toUpperCase() || 'A'}
              </Text>
            </View>

            <TouchableOpacity
              style={S.logoutButton}
              activeOpacity={0.8}
              onPress={handleLogout}
            >
              <Text style={S.logoutIcon}>↪</Text>
              <Text style={S.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={S.statusRow}>
            <View
              style={[
                S.dot,
                {
                  backgroundColor: complex.isActive ? '#A3E635' : '#FCA5A5',
                },
              ]}
            />

            <Text style={S.statusText}>
              {complex.isActive ? 'Complex active' : 'Complex inactive'}
            </Text>
          </View>
        </View>

        <View style={S.body}>
          <Text style={S.section}>Overview</Text>

          <View style={S.stats}>
            <View style={S.stat}>
              <Text style={S.statValue}>{sports.length}</Text>
              <Text style={S.statLabel}>Sports</Text>
            </View>

            <View style={S.stat}>
              <Text style={S.statValue}>0</Text>
              <Text style={S.statLabel}>Subadmins</Text>
            </View>

            <View style={S.stat}>
              <Text style={S.statValue}>0</Text>
              <Text style={S.statLabel}>Bookings</Text>
            </View>

            <View style={S.stat}>
              <Text style={S.statValue}>₹0</Text>
              <Text style={S.statLabel}>Total Revenue</Text>
            </View>
          </View>

          <Text style={S.section}>Manage your complex</Text>

          {menu.map(item => (
            <TouchableOpacity
              key={item.title}
              style={S.menu}
              activeOpacity={0.8}
              onPress={item.action}
            >
              <View style={S.menuIcon}>
                <Text style={{ fontSize: 23 }}>{item.icon}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={S.menuTitle}>{item.title}</Text>

                <Text style={S.menuSub}>{item.subtitle}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={S.menuCount}>{item.count}</Text>

                <Text style={S.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={S.refreshButton} onPress={loadComplex}>
            <Text style={S.refreshText}>↻ Refresh Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const S: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },

  loadingText: {
    color: C.muted,
    marginTop: 12,
    fontSize: 13,
  },

  hero: {
    backgroundColor: C.green,
    paddingTop: 44,
    paddingHorizontal: 22,
    paddingBottom: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  eyebrow: {
    color: '#BBF7D0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  heroTitle: {
    color: '#FFF',
    fontSize: 27,
    fontWeight: '900',
  },

  heroSub: {
    color: '#D1FAE5',
    fontSize: 13,
    marginTop: 5,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#D9F99D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: C.green,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ffffff25',
    marginTop: 18,
    paddingTop: 13,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  statusText: {
    color: '#E5F5E9',
    fontSize: 12,
    flex: 1,
  },

  body: {
    padding: 18,
  },

  section: {
    fontSize: 18,
    fontWeight: '900',
    color: C.text,
    marginTop: 8,
    marginBottom: 12,
  },

  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  stat: {
    width: '48.5%',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },

  statValue: {
    fontSize: 25,
    fontWeight: '900',
    color: C.text,
  },

  statLabel: {
    fontSize: 11,
    color: C.muted,
    marginTop: 3,
  },

  menu: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF7EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  menuTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: C.text,
  },

  menuSub: {
    fontSize: 10,
    color: C.muted,
    marginTop: 4,
    lineHeight: 15,
  },

  menuCount: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },

  chevron: {
    fontSize: 25,
    color: C.muted,
    marginTop: 1,
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: C.bg,
  },

  emptyHero: {
    backgroundColor: C.green,
    paddingTop: 48,
    paddingHorizontal: 22,
    paddingBottom: 35,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  emptyContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#E4F1E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  emptyTitle: {
    color: C.text,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: C.muted,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 25,
  },

  createButton: {
    width: '100%',
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  helperText: {
    color: C.muted,
    fontSize: 11,
    marginTop: 14,
    textAlign: 'center',
  },

  errorBox: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  errorText: {
    color: '#991B1B',
    fontSize: 12,
  },

  retryText: {
    color: C.green,
    fontWeight: '900',
    marginTop: 8,
  },

  refreshButton: {
    alignItems: 'center',
    padding: 15,
    marginTop: 5,
  },

  refreshText: {
    color: C.green,
    fontSize: 13,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF20',
    borderWidth: 1,
    borderColor: '#FFFFFF50',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  logoutIcon: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  emptyLogoutButton: {
    alignSelf: 'flex-end',
    marginTop: 15,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF20',
  },

  emptyLogoutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

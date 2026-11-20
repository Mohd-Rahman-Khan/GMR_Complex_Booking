import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { AdminStackParamList } from '../../navigation/AdminStack';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { ui } from './adminUi';

type Props = NativeStackScreenProps<AdminStackParamList, 'ComplexList'>;

type Complex = {
  _id?: string;
  id?: string;
  name?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  description?: string;
  sports?: any[];
  isActive?: boolean;
};

const GREEN = '#14532D';

export default function ComplexListScreen({ navigation }: Props) {
  const { token } = useAuth();

  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadComplexes = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false);
        setError('Session expired. Please login again.');
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const response: any = await apiRequest('/complexes', {
          method: 'GET',
          token,
        });

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

        setComplexes(list);
      } catch (err: any) {
        console.log('Complex list error:', err);
        setError(err?.message || 'Unable to load complexes.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      loadComplexes();
    }, [loadComplexes]),
  );

  const getId = (item: Complex) => String(item._id || item.id || '');

  const openEdit = (item: Complex) => {
    const id = getId(item);

    if (!id) {
      Alert.alert('Error', 'Complex ID not found.');
      return;
    }

    navigation.navigate('ComplexForm', {
      complexId: id,
    });
  };

  const openSports = (item: Complex) => {
    const id = getId(item);

    if (!id) {
      Alert.alert('Error', 'Complex ID not found.');
      return;
    }

    navigation.navigate('SportsManagement', {
      complexId: id,
    });
  };

  const openSubadmins = (item: Complex) => {
    const id = getId(item);

    if (!id) return;

    navigation.navigate('SportAdmins', {
      complexId: id,
    });
  };

  const createComplex = () => {
    navigation.navigate('ComplexForm');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={GREEN} />
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={styles.loadingText}>Loading your complexes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Complexes</Text>
        <Text style={styles.headerSub}>
          Create and manage all your sports complexes
        </Text>

        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.85}
          onPress={createComplex}
        >
          <Text style={styles.createButtonText}>+ Create New Complex</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity onPress={() => loadComplexes()}>
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadComplexes(true)}
            colors={[GREEN]}
          />
        }
      >
        {complexes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏟️</Text>

            <Text style={styles.emptyTitle}>No Complex Found</Text>

            <Text style={styles.emptySub}>
              You have not created any sports complex yet. Create your first
              complex to get started.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={createComplex}
            >
              <Text style={styles.emptyButtonText}>
                + Create Your First Complex
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.listHeading}>
              Your Complexes ({complexes.length})
            </Text>

            {complexes.map((item, index) => (
              <View key={getId(item) || String(index)} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardIcon}>
                    <Text style={{ fontSize: 25 }}>🏟️</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.complexName}>
                      {item.name || 'Unnamed Complex'}
                    </Text>

                    <Text style={styles.location}>
                      📍{' '}
                      {[item.address, item.city].filter(Boolean).join(', ') ||
                        'Address not added'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: item.isActive ? '#DCFCE7' : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: item.isActive ? '#166534' : '#991B1B',
                        },
                      ]}
                    >
                      {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>
                </View>

                <View style={styles.details}>
                  <Text style={styles.detailText}>
                    Owner: {item.ownerName || 'Not added'}
                  </Text>

                  <Text style={styles.detailText}>
                    Contact: {item.phone || 'Not added'}
                  </Text>

                  <Text style={styles.detailText}>
                    Sports: {item.sports?.length || 0}
                  </Text>
                </View>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={() => openSports(item)}
                >
                  <Text style={styles.primaryActionText}>🏅 Manage Sports</Text>
                </TouchableOpacity>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() => openEdit(item)}
                  >
                    <Text style={styles.secondaryActionText}>
                      ✏️ Edit Complex
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() => openSubadmins(item)}
                  >
                    <Text style={styles.secondaryActionText}>👥 Subadmins</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles: any = {
  screen: {
    flex: 1,
    backgroundColor: '#F4F7F4',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F7F4',
  },
  loadingText: {
    marginTop: 12,
    color: '#718078',
    fontSize: 13,
  },
  header: {
    backgroundColor: GREEN,
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  headerSub: {
    color: '#D1FAE5',
    fontSize: 12,
    marginTop: 5,
  },
  createButton: {
    backgroundColor: '#D9F99D',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  createButtonText: {
    color: GREEN,
    fontWeight: '900',
    fontSize: 13,
  },
  content: {
    padding: 17,
    paddingBottom: 35,
  },
  listHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#17251B',
    marginBottom: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E4EBE5',
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF7EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  complexName: {
    color: '#17251B',
    fontSize: 15,
    fontWeight: '900',
  },
  location: {
    color: '#718078',
    fontSize: 10,
    marginTop: 5,
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  details: {
    marginTop: 15,
    gap: 7,
  },
  detailText: {
    color: '#526157',
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: '#E4EBE5',
    marginVertical: 13,
  },
  primaryAction: {
    backgroundColor: GREEN,
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 9,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#EFF7EF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: GREEN,
    fontSize: 10,
    fontWeight: '900',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 45,
    marginBottom: 15,
  },
  emptyTitle: {
    color: '#17251B',
    fontSize: 19,
    fontWeight: '900',
  },
  emptySub: {
    color: '#718078',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 9,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: GREEN,
    padding: 14,
    borderRadius: 11,
    width: '100%',
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  errorBox: {
    margin: 16,
    backgroundColor: '#FEE2E2',
    padding: 13,
    borderRadius: 12,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
  },
  retry: {
    color: GREEN,
    fontWeight: '900',
    marginTop: 8,
  },
};

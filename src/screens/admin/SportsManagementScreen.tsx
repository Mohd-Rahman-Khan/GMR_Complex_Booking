import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { AdminStackParamList } from '../../navigation/AdminStack';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

type Props = NativeStackScreenProps<AdminStackParamList, 'SportsManagement'>;

const G = '#14532D';
const BG = '#F4F7F4';

type Draft = {
  weekdayNormalRate: string;
  weekdayPeakRate: string;
  weekendNormalRate: string;
  weekendPeakRate: string;
};

type MasterSport = {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
};

type SportItem = {
  _id: string;
  complexId: any;
  name: string;
  icon?: string;
  description?: string;
  bookingWindowDays?: number;
  primarySubAdminId?: any;
  slots?: any[];
  isActive: boolean;
  pricing?: {
    weekdayPrice?: number;
    weekdayPeakPrice?: number;
    weekendPrice?: number;
    weekendPeakPrice?: number;
    weekendDays?: number[];
    peakHours?: any[];
  };
};

type ComplexItem = {
  _id: string;
  name: string;
};

const toDraft = (pricing?: SportItem['pricing']): Draft => ({
  weekdayNormalRate: String(pricing?.weekdayPrice ?? 0),
  weekdayPeakRate: String(pricing?.weekdayPeakPrice ?? 0),
  weekendNormalRate: String(pricing?.weekendPrice ?? 0),
  weekendPeakRate: String(pricing?.weekendPeakPrice ?? 0),
});

const PRICE_FIELDS: { key: keyof Draft; label: string }[] = [
  { key: 'weekdayNormalRate', label: 'Weekday Normal Price' },
  { key: 'weekdayPeakRate', label: 'Weekday Peak Hours Price' },
  { key: 'weekendNormalRate', label: 'Weekend Normal Price' },
  { key: 'weekendPeakRate', label: 'Weekend Peak Hours Price' },
];

const getResponseData = (response: any) => {
  return response?.data ?? response;
};

export default function SportsManagementScreen({ route, navigation }: Props) {
  const { token } = useAuth();

  const complexId = route.params.complexId;

  const [complex, setComplex] = useState<ComplexItem | null>(null);
  const [sports, setSports] = useState<SportItem[]>([]);
  const [masterSports, setMasterSports] = useState<MasterSport[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const [loading, setLoading] = useState(true);
  const [loadingMasterSports, setLoadingMasterSports] = useState(false);

  const [savingSportId, setSavingSportId] = useState<string | null>(null);
  const [addingSportId, setAddingSportId] = useState<string | null>(null);
  const [statusSportId, setStatusSportId] = useState<string | null>(null);

  // Load complex, existing sports and master sports
  const loadData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      Alert.alert('Session Expired', 'Please login again.');
      return;
    }

    try {
      setLoading(true);
      setLoadingMasterSports(true);

      const [complexResponse, sportsResponse, masterSportsResponse] =
        await Promise.all([
          apiRequest<any>(`/complexes/${complexId}`, {
            method: 'GET',
            token,
          }),

          apiRequest<any>('/sports/my', {
            method: 'GET',
            token,
          }),

          apiRequest<any>('/master-sports', {
            method: 'GET',
            token,
          }),
        ]);

      const complexData = getResponseData(complexResponse);
      const selectedComplex = complexData?.complex ?? complexData;

      const sportsData = getResponseData(sportsResponse);
      const allSports = sportsData?.sports ?? [];

      const selectedSports = allSports.filter((sport: SportItem) => {
        const sportComplexId = sport.complexId?._id ?? sport.complexId;

        return String(sportComplexId) === String(complexId);
      });

      const masterData = getResponseData(masterSportsResponse);
      const availableSports = masterData?.sports ?? [];

      setComplex(selectedComplex);
      setSports(selectedSports);
      setMasterSports(availableSports);

      const nextDrafts: Record<string, Draft> = {};

      selectedSports.forEach((sport: SportItem) => {
        nextDrafts[sport._id] = toDraft(sport.pricing);
      });

      setDrafts(nextDrafts);
    } catch (error: any) {
      Alert.alert('Unable to Load', error.message || 'Unable to fetch sports.');
    } finally {
      setLoading(false);
      setLoadingMasterSports(false);
    }
  }, [complexId, token]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const updateDraft = (sportId: string, key: keyof Draft, value: string) => {
    setDrafts(prev => ({
      ...prev,
      [sportId]: {
        ...(prev[sportId] || toDraft()),
        [key]: value.replace(/[^0-9]/g, ''),
      },
    }));
  };

  // Add selected master sport to this complex
  const addSport = async (item: MasterSport) => {
    if (!token) return;

    const existingSport = sports.find(
      sport => sport.name.toLowerCase() === item.name.toLowerCase(),
    );

    if (existingSport) {
      if (!existingSport.isActive) {
        Alert.alert(
          'Sport Inactive',
          `${item.name} is already added but inactive. Would you like to activate it?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Activate',
              onPress: () => updateSportStatus(existingSport, true),
            },
          ],
        );
      } else {
        Alert.alert(
          'Already Added',
          'This sport is already available in your complex.',
        );
      }

      return;
    }

    try {
      setAddingSportId(item._id);

      await apiRequest('/sports', {
        method: 'POST',
        token,
        body: JSON.stringify({
          complexId,
          name: item.name,
          icon: item.icon || '',
          description: item.description || '',
          bookingWindowDays: 30,
        }),
      });

      Alert.alert('Success', `${item.name} added successfully.`);

      await loadData();
    } catch (error: any) {
      Alert.alert(
        'Unable to Add Sport',
        error.message || 'Something went wrong.',
      );
    } finally {
      setAddingSportId(null);
    }
  };

  const savePricing = async (item: SportItem) => {
    if (!token) return;

    const draft = drafts[item._id];

    if (!draft) return;

    const rates = [
      draft.weekdayNormalRate,
      draft.weekdayPeakRate,
      draft.weekendNormalRate,
      draft.weekendPeakRate,
    ];

    if (
      !rates.every(
        value =>
          value.trim() !== '' &&
          Number.isFinite(Number(value)) &&
          Number(value) >= 0,
      )
    ) {
      Alert.alert(
        'Invalid Pricing',
        'Please enter valid prices in all four fields.',
      );
      return;
    }

    const pricing = {
      weekdayPrice: Number(draft.weekdayNormalRate),
      weekdayPeakPrice: Number(draft.weekdayPeakRate),
      weekendPrice: Number(draft.weekendNormalRate),
      weekendPeakPrice: Number(draft.weekendPeakRate),
      weekendDays: item.pricing?.weekendDays ?? [0, 6],
      peakHours: item.pricing?.peakHours ?? [],
    };

    try {
      setSavingSportId(item._id);

      await apiRequest(`/sports/${item._id}/pricing`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(pricing),
      });

      Alert.alert(
        'Pricing Updated',
        `${item.name} pricing has been saved successfully.`,
      );

      await loadData();
    } catch (error: any) {
      Alert.alert(
        'Update Failed',
        error.message || 'Unable to update pricing.',
      );
    } finally {
      setSavingSportId(null);
    }
  };

  const updateSportStatus = async (item: SportItem, isActive: boolean) => {
    if (!token) return;

    try {
      setStatusSportId(item._id);

      await apiRequest(`/sports/${item._id}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ isActive }),
      });

      Alert.alert(
        'Success',
        `${item.name} ${isActive ? 'activated' : 'deactivated'} successfully.`,
      );

      await loadData();
    } catch (error: any) {
      Alert.alert(
        'Status Update Failed',
        error.message || 'Unable to update sport status.',
      );
    } finally {
      setStatusSportId(null);
    }
  };

  const confirmStatusChange = (item: SportItem) => {
    const nextStatus = !item.isActive;

    Alert.alert(
      nextStatus ? 'Activate Sport?' : 'Deactivate Sport?',
      nextStatus
        ? `Make ${item.name} available again?`
        : `Customers will no longer see ${item.name} as an active sport.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextStatus ? 'Activate' : 'Deactivate',
          style: nextStatus ? 'default' : 'destructive',
          onPress: () => updateSportStatus(item, nextStatus),
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={S.center}>
        <ActivityIndicator size="large" color={G} />
        <Text style={{ color: '#718078', marginTop: 12 }}>
          Loading sports...
        </Text>
      </View>
    );
  }

  if (!complex) {
    return (
      <View style={S.center}>
        <Text style={S.name}>Complex not found</Text>

        <TouchableOpacity style={S.retryButton} onPress={loadData}>
          <Text style={S.saveText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={G} />

      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={S.back}>‹</Text>
        </TouchableOpacity>

        <View>
          <Text style={S.title}>Sports & Pricing</Text>
          <Text style={S.headerSub}>
            {complex.name} • {sports.length} sports
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 17, paddingBottom: 35 }}>
        <Text style={S.section}>Manage sports & dynamic pricing</Text>

        {sports.length === 0 && (
          <View style={S.emptyCard}>
            <Text style={S.emptyTitle}>No sports added yet</Text>
            <Text style={S.emptyText}>
              Add your first sport to start managing bookings and pricing.
            </Text>
          </View>
        )}

        {sports.map(item => {
          const admin = item.primarySubAdminId;
          const draft = drafts[item._id] || toDraft(item.pricing);
          const isSaving = savingSportId === item._id;
          const isChangingStatus = statusSportId === item._id;

          return (
            <View key={item._id} style={S.card}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('SportDetails', {
                    complexId,
                    sportId: item._id,
                  })
                }
              >
                <View style={S.row}>
                  <View style={S.icon}>
                    <Text style={{ fontSize: 25 }}>{item.icon || '🏅'}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={S.name}>{item.name}</Text>
                    <Text style={S.sub}>
                      {admin?.name
                        ? `Primary: ${admin.name}`
                        : 'Primary subadmin not assigned'}
                    </Text>
                  </View>

                  <View
                    style={[
                      S.statusPill,
                      {
                        backgroundColor: item.isActive ? '#DCFCE7' : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: item.isActive ? '#166534' : '#B91C1C',
                        fontSize: 9,
                        fontWeight: '900',
                      }}
                    >
                      {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>

                  <Text style={S.arrow}>›</Text>
                </View>
              </TouchableOpacity>

              <View style={S.pricingHeader}>
                <Text style={S.pricingTitle}>Hourly pricing</Text>
                <Text style={S.perHour}>₹ / hour</Text>
              </View>

              <View style={S.priceGrid}>
                {PRICE_FIELDS.map(field => (
                  <View key={field.key} style={S.priceField}>
                    <Text style={S.fieldLabel}>{field.label}</Text>

                    <View style={S.inputWrap}>
                      <Text style={S.rupee}>₹</Text>

                      <TextInput
                        value={draft[field.key]}
                        onChangeText={value =>
                          updateDraft(item._id, field.key, value)
                        }
                        keyboardType="number-pad"
                        style={S.input}
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                ))}
              </View>

              <View style={S.infoBox}>
                <Text style={S.infoText}>
                  Configure peak time, weekend days and slots from Sport
                  Details.
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('SportDetails', {
                      complexId,
                      sportId: item._id,
                    })
                  }
                >
                  <Text style={S.configureLink}>Configure →</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  S.saveButton,
                  (!item.isActive || isSaving) && { opacity: 0.6 },
                ]}
                disabled={!item.isActive || isSaving}
                onPress={() => savePricing(item)}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={S.saveText}>Save pricing</Text>
                )}
              </TouchableOpacity>

              <View style={S.actions}>
                <Text style={S.slotCount}>
                  {item.slots?.length || 0} configured slots
                </Text>

                <TouchableOpacity
                  disabled={isChangingStatus}
                  onPress={() => confirmStatusChange(item)}
                >
                  {isChangingStatus ? (
                    <ActivityIndicator size="small" color={G} />
                  ) : (
                    <Text
                      style={[
                        S.remove,
                        item.isActive && { color: '#DC2626' },
                        !item.isActive && { color: '#166534' },
                      ]}
                    >
                      {item.isActive ? 'Deactivate sport' : 'Activate sport'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Dynamic Master Sports */}
        <View style={S.addHeader}>
          <View>
            <Text style={S.section}>Add another sport</Text>
            <Text style={S.addSub}>
              Select a sport from the available sports list.
            </Text>
          </View>

          <TouchableOpacity onPress={loadData}>
            <Text style={S.refreshText}>↻ Refresh</Text>
          </TouchableOpacity>
        </View>

        {loadingMasterSports ? (
          <ActivityIndicator
            size="large"
            color={G}
            style={{ marginVertical: 25 }}
          />
        ) : masterSports.length === 0 ? (
          <View style={S.emptyCard}>
            <Text style={S.emptyTitle}>No available sports</Text>
            <Text style={S.emptyText}>
              No active sports found in the master sports list.
            </Text>
          </View>
        ) : (
          <View style={S.grid}>
            {masterSports.map(item => {
              const existing = sports.find(
                sport => sport.name.toLowerCase() === item.name.toLowerCase(),
              );

              const isAdding = addingSportId === item._id;

              return (
                <TouchableOpacity
                  key={item._id}
                  disabled={!!existing || isAdding}
                  onPress={() => addSport(item)}
                  style={[S.option, existing && { opacity: 0.5 }]}
                >
                  {isAdding ? (
                    <ActivityIndicator color={G} />
                  ) : (
                    <Text style={{ fontSize: 25 }}>{item.icon || '🏅'}</Text>
                  )}

                  <Text style={S.optionName}>{item.name}</Text>

                  <Text style={S.link}>
                    {existing
                      ? existing.isActive
                        ? 'Already added'
                        : 'Inactive - Reactivate'
                      : '＋ Add sport'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const S: any = {
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
    padding: 20,
  },
  header: {
    backgroundColor: G,
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  back: { color: '#FFF', fontSize: 34 },
  title: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  headerSub: { color: '#D1FAE5', fontSize: 11, marginTop: 4 },
  section: {
    fontSize: 17,
    fontWeight: '900',
    color: '#17251B',
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4EBE5',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF7EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  name: { fontSize: 15, fontWeight: '900', color: '#17251B' },
  sub: { fontSize: 10, color: '#718078', marginTop: 4 },
  arrow: { fontSize: 26, color: '#718078', marginLeft: 5 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 17,
    marginBottom: 10,
  },
  pricingTitle: {
    color: '#17251B',
    fontSize: 13,
    fontWeight: '900',
  },
  perHour: { fontSize: 10, color: '#718078', fontWeight: '800' },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  priceField: { width: '48%' },
  fieldLabel: {
    color: '#718078',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },
  inputWrap: {
    height: 43,
    borderWidth: 1,
    borderColor: '#DCE5DD',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
  },
  rupee: { color: G, fontWeight: '900', fontSize: 12 },
  input: {
    flex: 1,
    padding: 0,
    marginLeft: 4,
    color: '#17251B',
    fontWeight: '800',
    fontSize: 13,
  },
  infoBox: {
    backgroundColor: '#F0F7F1',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  infoText: { color: '#526157', fontSize: 10, flex: 1 },
  configureLink: { color: G, fontSize: 10, fontWeight: '900' },
  saveButton: {
    backgroundColor: G,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  saveText: { color: '#FFF', fontWeight: '900', fontSize: 11 },
  actions: {
    borderTopWidth: 1,
    borderTopColor: '#E4EBE5',
    marginTop: 12,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotCount: { fontSize: 10, color: '#718078' },
  remove: { color: '#DC2626', fontSize: 10, fontWeight: '900' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  option: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4EBE5',
    marginBottom: 10,
  },
  optionName: {
    fontWeight: '900',
    color: '#17251B',
    marginTop: 7,
    fontSize: 12,
  },
  link: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 6,
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyTitle: {
    color: '#17251B',
    fontWeight: '900',
    fontSize: 15,
  },
  emptyText: {
    color: '#718078',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 7,
  },
  retryButton: {
    backgroundColor: G,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 5,
  },
  addSub: {
    color: '#718078',
    fontSize: 11,
    marginBottom: 10,
  },
  refreshText: {
    color: G,
    fontSize: 12,
    fontWeight: '900',
  },
};

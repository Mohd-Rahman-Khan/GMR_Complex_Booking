import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAdmin } from '../../context/AdminContext';
import { AVAILABLE_SPORTS, DEFAULT_SPORT_PRICING } from '../../data/adminSeed';
import { ComplexSport, SportPricing } from '../../types/admin';
import { AdminStackParamList } from '../../navigation/AdminStack';

type Props = NativeStackScreenProps<AdminStackParamList, 'SportsManagement'>;

const G = '#14532D';
const BG = '#F4F7F4';

type Draft = {
  weekdayNormalRate: string;
  weekdayPeakRate: string;
  weekendNormalRate: string;
  weekendPeakRate: string;
};

const toDraft = (pricing?: SportPricing): Draft => ({
  weekdayNormalRate: String(pricing?.weekdayNormalRate ?? 0),
  weekdayPeakRate: String(pricing?.weekdayPeakRate ?? 0),
  weekendNormalRate: String(pricing?.weekendNormalRate ?? 0),
  weekendPeakRate: String(pricing?.weekendPeakRate ?? 0),
});

const PRICE_FIELDS: { key: keyof Draft; label: string }[] = [
  { key: 'weekdayNormalRate', label: 'Weekday Normal Price' },
  { key: 'weekdayPeakRate', label: 'Weekday Peak Hours Price' },
  { key: 'weekendNormalRate', label: 'Weekend Normal Price' },
  { key: 'weekendPeakRate', label: 'Weekend Peak Hours Price' },
];

export default function SportsManagementScreen({ route, navigation }: Props) {
  const { complexes, addSport, removeSport, admins, updateSport } = useAdmin();

  const complex = complexes.find(x => x.id === route.params.complexId);

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  useEffect(() => {
    if (!complex) return;

    const next: Record<string, Draft> = {};

    complex.sports.forEach(s => {
      next[s.sportId] = toDraft(s.pricing);
    });

    setDrafts(next);
  }, [complex?.id, complex?.sports]);

  if (!complex) {
    return (
      <View style={S.center}>
        <Text>Complex not found</Text>
      </View>
    );
  }

  const add = (item: (typeof AVAILABLE_SPORTS)[number]) => {
    if (complex.sports.some(s => s.sportId === item.id)) {
      Alert.alert('Already added', 'This sport is already in your complex.');
      return;
    }

    const pricing = {
      ...DEFAULT_SPORT_PRICING[item.id],
      peakHours: DEFAULT_SPORT_PRICING[item.id].peakHours.map(x => ({
        ...x,
      })),
      weekendDays: [...DEFAULT_SPORT_PRICING[item.id].weekendDays],
    };

    const sport: ComplexSport = {
      id: `CS${Date.now()}`,
      sportId: item.id,
      sportName: item.name,
      icon: item.icon,
      pricePerHour: pricing.weekdayNormalRate,
      pricing,
      primarySubAdminId: null,
      additionalStaffIds: [],
      isActive: true,
      slots: [],
    };

    addSport(complex.id, sport);
  };

  const remove = (item: ComplexSport) =>
    Alert.alert(
      'Remove sport?',
      `Remove ${item.sportName} from this complex?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeSport(complex.id, item.sportId),
        },
      ],
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

  const savePricing = (item: ComplexSport) => {
    const draft = drafts[item.sportId];

    if (!draft) return;

    const pricing = {
      weekdayNormalRate: Number(draft.weekdayNormalRate),
      weekdayPeakRate: Number(draft.weekdayPeakRate),
      weekendNormalRate: Number(draft.weekendNormalRate),
      weekendPeakRate: Number(draft.weekendPeakRate),
      peakHours: item.pricing.peakHours || [],
      weekendDays: item.pricing.weekendDays || [0, 6],
    };

    const rates = [
      pricing.weekdayNormalRate,
      pricing.weekdayPeakRate,
      pricing.weekendNormalRate,
      pricing.weekendPeakRate,
    ];

    if (!rates.every(n => Number.isFinite(n) && n > 0)) {
      Alert.alert(
        'Invalid pricing',
        'Please enter a valid price greater than zero in all four fields.',
      );
      return;
    }

    updateSport(complex.id, item.sportId, {
      pricing,
      pricePerHour: pricing.weekdayNormalRate,
    });

    Alert.alert(
      'Pricing updated',
      `${item.sportName} dynamic pricing has been saved.`,
    );
  };

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
            {complex.name} • {complex.sports.length} sports
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 17, paddingBottom: 35 }}>
        <Text style={S.section}>Manage sports & dynamic pricing</Text>

        {complex.sports.map(item => {
          const admin = admins.find(x => x.id === item.primarySubAdminId);
          const draft = drafts[item.sportId] || toDraft(item.pricing);

          return (
            <View key={item.id} style={S.card}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('SportDetails', {
                    complexId: complex.id,
                    sportId: item.sportId,
                  })
                }
              >
                <View style={S.row}>
                  <View style={S.icon}>
                    <Text style={{ fontSize: 25 }}>{item.icon}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={S.name}>{item.sportName}</Text>
                    <Text style={S.sub}>
                      {admin
                        ? `Primary: ${admin.name}`
                        : 'Primary subadmin not assigned'}
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
                          updateDraft(item.sportId, field.key, value)
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
                  Configure peak time and weekend days from Sport Details.
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('SportDetails', {
                      complexId: complex.id,
                      sportId: item.sportId,
                    })
                  }
                >
                  <Text style={S.configureLink}>Configure →</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={S.saveButton}
                onPress={() => savePricing(item)}
              >
                <Text style={S.saveText}>Save pricing</Text>
              </TouchableOpacity>

              <View style={S.actions}>
                <Text style={S.slotCount}>
                  {item.slots?.length || 0} configured slots
                </Text>

                <TouchableOpacity onPress={() => remove(item)}>
                  <Text style={S.remove}>Remove sport</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Text style={S.section}>Add another sport</Text>

        <View style={S.grid}>
          {AVAILABLE_SPORTS.map(item => {
            const exists = complex.sports.some(s => s.sportId === item.id);

            return (
              <TouchableOpacity
                key={item.id}
                disabled={exists}
                onPress={() => add(item)}
                style={[S.option, exists && { opacity: 0.4 }]}
              >
                <Text style={{ fontSize: 25 }}>{item.icon}</Text>
                <Text style={S.optionName}>{item.name}</Text>
                <Text style={S.link}>
                  {exists ? 'Already added' : '＋ Add sport'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const S: any = {
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  arrow: { fontSize: 26, color: '#718078' },
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
  link: { color: '#166534', fontSize: 10, fontWeight: '900', marginTop: 6 },
};

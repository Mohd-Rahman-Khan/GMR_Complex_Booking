import React, { useEffect, useMemo, useState } from 'react';
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
import { AdminStackParamList } from '../../navigation/AdminStack';
import { PeakHour } from '../../types/admin';

type Props = NativeStackScreenProps<AdminStackParamList, 'SportDetails'>;

const G = '#14532D';
const BG = '#F4F7F4';

const WEEK_DAYS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const toMinutes = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

const isValidTime = (value: string) => {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return false;
  return true;
};

const fmt = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(
    2,
    '0',
  )}`;

export default function SportDetailsScreen({ route, navigation }: Props) {
  const { complexes, admins, updateSport, assignPrimarySubAdmin } = useAdmin();
  const [bookingWindowDays, setBookingWindowDays] = useState(
    sport?.bookingWindowDays ?? 30,
  );

  const [customBookingDays, setCustomBookingDays] = useState('');

  const c = complexes.find(x => x.id === route.params.complexId);

  const sport = c?.sports.find(s => s.sportId === route.params.sportId);

  const [peakStart, setPeakStart] = useState('17:00');
  const [peakEnd, setPeakEnd] = useState('21:00');

  const [weekendDays, setWeekendDays] = useState<number[]>([0, 6]);

  const [start, setStart] = useState('06:00');
  const [end, setEnd] = useState('22:00');
  const [duration, setDuration] = useState('60');
  const [slotPrice, setSlotPrice] = useState('');
  const [unavailableRanges, setUnavailableRanges] = useState([
    {
      id: '1',
      fromDate: '20 Nov 2026',
      toDate: '22 Nov 2026',
      reason: 'Ground Maintenance',
    },
    {
      id: '2',
      fromDate: '05 Dec 2026',
      toDate: '06 Dec 2026',
      reason: 'Tournament',
    },
  ]);

  const [unavailableFrom, setUnavailableFrom] = useState('25 Nov 2026');
  const [unavailableTo, setUnavailableTo] = useState('27 Nov 2026');
  const [unavailableReason, setUnavailableReason] = useState('');

  useEffect(() => {
    setBookingWindowDays(sport?.bookingWindowDays ?? 30);
  }, [sport?.sportId, sport?.bookingWindowDays]);

  const team = useMemo(
    () =>
      admins.filter(
        a => a.complexId === c?.id && a.role === 'sport_admin' && a.isActive,
      ),
    [admins, c?.id],
  );

  useEffect(() => {
    if (sport?.pricing?.weekendDays) {
      setWeekendDays([...sport.pricing.weekendDays]);
    }
  }, [sport?.sportId, sport?.pricing?.weekendDays]);

  if (!c || !sport) {
    return (
      <View style={S.center}>
        <Text>Sport not found</Text>
      </View>
    );
  }
  const saveBookingWindow = (days: number) => {
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      Alert.alert(
        'Invalid Booking Window',
        'Booking window 1 se 365 days ke beech honi chahiye.',
      );
      return;
    }

    setBookingWindowDays(days);

    updateSport(c.id, sport.sportId, {
      bookingWindowDays: days,
    } as any);

    Alert.alert(
      'Saved',
      `Customers can now book up to ${days} days in advance.`,
    );
  };

  const saveCustomBookingWindow = () => {
    const days = Number(customBookingDays);

    if (!customBookingDays.trim()) {
      Alert.alert('Required', 'Please enter booking days.');
      return;
    }

    saveBookingWindow(days);
    setCustomBookingDays('');
  };

  const pricing = sport.pricing;

  const savePeakHours = (nextPeakHours: PeakHour[]) => {
    updateSport(c.id, sport.sportId, {
      pricing: {
        ...pricing,
        peakHours: nextPeakHours,
      },
    });
  };

  const addPeakHours = () => {
    if (!isValidTime(peakStart) || !isValidTime(peakEnd)) {
      Alert.alert(
        'Invalid time',
        'Time 24-hour format mein enter karein. Example: 17:00',
      );
      return;
    }

    const a = toMinutes(peakStart);
    const b = toMinutes(peakEnd);

    if (a >= b) {
      Alert.alert(
        'Invalid range',
        'Peak end time, start time se baad hona chahiye.',
      );
      return;
    }

    const existing = pricing.peakHours || [];

    const overlap = existing.some(item => {
      const oldStart = toMinutes(item.startTime);
      const oldEnd = toMinutes(item.endTime);

      return a < oldEnd && b > oldStart;
    });

    if (overlap) {
      Alert.alert(
        'Timing overlap',
        'Ye peak timing kisi existing peak timing se overlap kar rahi hai.',
      );
      return;
    }

    const next: PeakHour[] = [
      ...existing,
      {
        id: `PH${Date.now()}`,
        startTime: peakStart,
        endTime: peakEnd,
      },
    ].sort((x, y) => toMinutes(x.startTime) - toMinutes(y.startTime));

    savePeakHours(next);
    Alert.alert('Saved', 'Peak hours successfully added.');
  };

  const removePeakHours = (id: string) => {
    Alert.alert(
      'Remove peak hours?',
      'Is timing ko normal pricing ke according calculate kiya jayega.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            savePeakHours((pricing.peakHours || []).filter(x => x.id !== id)),
        },
      ],
    );
  };

  const toggleWeekendDay = (day: number) => {
    const next = weekendDays.includes(day)
      ? weekendDays.filter(x => x !== day)
      : [...weekendDays, day].sort((a, b) => a - b);

    setWeekendDays(next);

    updateSport(c.id, sport.sportId, {
      pricing: {
        ...pricing,
        weekendDays: next,
      },
    });
  };

  const saveSlot = () => {
    if (!isValidTime(start) || !isValidTime(end)) {
      Alert.alert('Invalid time', 'Start/end time check karein.');
      return;
    }

    const a = toMinutes(start);
    const b = toMinutes(end);
    const d = Number(duration);
    const p = slotPrice.trim() ? Number(slotPrice) : sport.pricePerHour;

    if (
      a >= b ||
      !Number.isFinite(d) ||
      d < 15 ||
      d > 720 ||
      !Number.isFinite(p) ||
      p < 0
    ) {
      Alert.alert(
        'Invalid slot',
        'Start/end time, duration (15-720 min) aur price check karein.',
      );
      return;
    }

    const slots = (sport.slots || []) as any[];
    const generated: any[] = [];

    for (let cursor = a; cursor + d <= b; cursor += d) {
      const slotEnd = cursor + d;

      const overlaps = slots.some(
        x =>
          x.isActive !== false &&
          cursor < Number(x.endMinutes) &&
          slotEnd > Number(x.startMinutes),
      );

      if (overlaps) {
        Alert.alert(
          'Timing overlap',
          `Generated slot ${fmt(cursor)}-${fmt(
            slotEnd,
          )} overlaps an existing slot. No slots were added.`,
        );
        return;
      }

      generated.push({
        id: `SL${Date.now()}_${cursor}`,
        startTime: fmt(cursor),
        endTime: fmt(slotEnd),
        startMinutes: cursor,
        endMinutes: slotEnd,
        duration: d,
        price: p,
        isActive: true,
      });
    }

    if (!generated.length) {
      Alert.alert(
        'Invalid range',
        'Selected window is shorter than one slot duration.',
      );
      return;
    }

    updateSport(c.id, sport.sportId, {
      slots: [...slots, ...generated].sort(
        (x, y) => x.startMinutes - y.startMinutes,
      ),
    });

    setSlotPrice('');

    Alert.alert(
      'Slots added',
      `${generated.length} booking slots created successfully.`,
    );
  };

  const removeSlot = (id: string) =>
    Alert.alert(
      'Remove slot?',
      'This slot will no longer be offered for booking.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            updateSport(c.id, sport.sportId, {
              slots: (sport.slots as any[]).filter(x => x.id !== id),
            }),
        },
      ],
    );

  const toggleSlot = (slot: any) =>
    updateSport(c.id, sport.sportId, {
      slots: (sport.slots as any[]).map(x =>
        x.id === slot.id ? { ...x, isActive: x.isActive === false } : x,
      ),
    });

  const assign = (id: string | null) => {
    const result = assignPrimarySubAdmin(c.id, sport.sportId, id);

    if (!result.success) {
      Alert.alert(
        'Assignment failed',
        result.message || 'Could not assign subadmin.',
      );
    }
  };

  const assigned = admins.find(a => a.id === sport.primarySubAdminId);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={G} />

      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={S.back}>‹</Text>
        </TouchableOpacity>

        <View>
          <Text style={S.title}>
            {sport.icon} {sport.sportName}
          </Text>
          <Text style={S.headerSub}>{c.name} • Sport settings</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 17, paddingBottom: 35 }}>
        {/* DYNAMIC PRICING */}
        <View style={S.card}>
          <Text style={S.section}>Dynamic pricing configuration</Text>

          <Text style={S.hint}>
            Rates Sports & Pricing screen se manage karein. Yahan peak hours aur
            weekend days configure karein.
          </Text>

          <View style={S.rateRow}>
            <Text style={S.rateLabel}>Weekday Normal</Text>
            <Text style={S.rateValue}>₹{pricing.weekdayNormalRate}/hr</Text>
          </View>

          <View style={S.rateRow}>
            <Text style={S.rateLabel}>Weekday Peak</Text>
            <Text style={S.rateValue}>₹{pricing.weekdayPeakRate}/hr</Text>
          </View>

          <View style={S.rateRow}>
            <Text style={S.rateLabel}>Weekend Normal</Text>
            <Text style={S.rateValue}>₹{pricing.weekendNormalRate}/hr</Text>
          </View>

          <View style={S.rateRow}>
            <Text style={S.rateLabel}>Weekend Peak</Text>
            <Text style={S.rateValue}>₹{pricing.weekendPeakRate}/hr</Text>
          </View>
        </View>

        {/* PEAK HOURS */}
        <View style={S.card}>
          <Text style={S.section}>Peak hours</Text>

          {/* <Text style={S.hint}>
            Peak hours ke andar booking par peak rate apply hoga. Multiple
            timings configure kar sakte hain.
          </Text> */}

          <Text style={S.label}>Peak start time (24-hour)</Text>
          <TextInput
            value={peakStart}
            onChangeText={setPeakStart}
            placeholder="17:00"
            style={S.input}
            autoCapitalize="none"
          />

          <Text style={S.label}>Peak end time (24-hour)</Text>
          <TextInput
            value={peakEnd}
            onChangeText={setPeakEnd}
            placeholder="21:00"
            style={S.input}
          />

          <TouchableOpacity onPress={addPeakHours} style={S.button}>
            <Text style={S.buttonText}>＋ Add Peak Hours</Text>
          </TouchableOpacity>

          <Text style={S.subHeading}>Configured peak timings</Text>

          {(pricing.peakHours || []).length === 0 ? (
            <View style={S.empty}>
              <Text style={S.hint}>
                No peak hours configured. All timings will use normal rates.
              </Text>
            </View>
          ) : (
            pricing.peakHours.map(item => (
              <View key={item.id} style={S.peakRow}>
                <View style={{ flex: 1 }}>
                  <Text style={S.peakTime}>
                    {item.startTime} – {item.endTime}
                  </Text>
                  <Text style={S.peakCaption}>Peak pricing active</Text>
                </View>

                <TouchableOpacity onPress={() => removePeakHours(item.id)}>
                  <Text style={S.remove}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* WEEKEND DAYS */}
        <View style={S.card}>
          <Text style={S.section}>Weekend days</Text>

          <Text style={S.hint}>
            Selected days par weekend normal aur weekend peak rates apply honge.
          </Text>

          <View style={S.daysContainer}>
            {WEEK_DAYS.map(day => {
              const selected = weekendDays.includes(day.value);

              return (
                <TouchableOpacity
                  key={day.value}
                  onPress={() => toggleWeekendDay(day.value)}
                  style={[S.dayButton, selected && S.dayButtonActive]}
                >
                  <Text style={[S.dayText, selected && S.dayTextActive]}>
                    {day.label}
                  </Text>

                  <Text style={[S.dayStatus, selected && S.dayTextActive]}>
                    {selected ? 'Weekend ✓' : 'Weekday'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={S.selectionText}>
            {weekendDays.length
              ? `${weekendDays.length} weekend day(s) selected`
              : 'No weekend days selected'}
          </Text>
        </View>

        {/* BOOKING WINDOW */}
        <View style={S.card}>
          <Text style={S.section}>Booking Window</Text>

          <Text style={S.hint}>
            Decide how many days in advance customers can book this sport.
          </Text>

          {/* <View style={S.bookingWindowOptions}>
            {[15, 30, 60, 90].map(days => {
              const selected = bookingWindowDays === days;

              return (
                <TouchableOpacity
                  key={days}
                  activeOpacity={0.8}
                  onPress={() => saveBookingWindow(days)}
                  style={[
                    S.bookingWindowOption,
                    selected && S.bookingWindowOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      S.bookingWindowNumber,
                      selected && S.bookingWindowTextActive,
                    ]}
                  >
                    {days}
                  </Text>

                  <Text
                    style={[
                      S.bookingWindowLabel,
                      selected && S.bookingWindowTextActive,
                    ]}
                  >
                    Days
                  </Text>

                  {selected && (
                    <Text style={S.bookingWindowCheck}>✓ Selected</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View> */}

          <Text style={S.label}>Booking window</Text>

          <View style={S.customBookingRow}>
            <TextInput
              value={customBookingDays}
              onChangeText={value =>
                setCustomBookingDays(value.replace(/[^0-9]/g, ''))
              }
              placeholder="Enter days (e.g. 45)"
              placeholderTextColor="#9AA69D"
              keyboardType="number-pad"
              maxLength={3}
              style={[S.input, S.customBookingInput]}
            />

            <TouchableOpacity
              style={S.customBookingButton}
              onPress={saveCustomBookingWindow}
            >
              <Text style={S.customBookingButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>

          <View style={S.bookingWindowInfo}>
            <Text style={S.bookingWindowInfoText}>
              Customers can book up to {bookingWindowDays} days in advance.
            </Text>
          </View>
        </View>

        {/* GROUND UNAVAILABLE DATES */}
        <View style={S.card}>
          <View style={S.unavailableHeader}>
            <View style={{ flex: 1 }}>
              <Text style={S.section}>Ground Availability</Text>
              <Text style={S.hint}>
                Select dates when this ground will not be available for any
                sport.
              </Text>
            </View>

            <View style={S.unavailableBadge}>
              <Text style={S.unavailableBadgeText}>BLOCK DATES</Text>
            </View>
          </View>

          {/* <View style={S.unavailableInfo}>
            <Text style={S.unavailableInfoIcon}>ⓘ</Text>
            <Text style={S.unavailableInfoText}>
              Blocked dates par Cricket, Football, Badminton aur other sports ki
              bookings available nahi hongi.
            </Text>
          </View> */}

          <Text style={S.label}>Unavailable From</Text>
          <TextInput
            value={unavailableFrom}
            onChangeText={setUnavailableFrom}
            placeholder="DD MMM YYYY"
            style={S.input}
          />

          <Text style={S.label}>Unavailable To</Text>
          <TextInput
            value={unavailableTo}
            onChangeText={setUnavailableTo}
            placeholder="DD MMM YYYY"
            style={S.input}
          />

          <Text style={S.label}>Reason (Optional)</Text>
          <TextInput
            value={unavailableReason}
            onChangeText={setUnavailableReason}
            placeholder="e.g. Maintenance, Tournament"
            style={S.input}
          />

          <TouchableOpacity
            style={S.blockButton}
            onPress={() => {
              if (!unavailableFrom.trim() || !unavailableTo.trim()) {
                Alert.alert('Required', 'Please enter both dates.');
                return;
              }

              setUnavailableRanges(prev => [
                ...prev,
                {
                  id: String(Date.now()),
                  fromDate: unavailableFrom,
                  toDate: unavailableTo,
                  reason: unavailableReason.trim() || 'Not available',
                },
              ]);

              setUnavailableReason('');
              Alert.alert(
                'Preview Updated',
                'Unavailable date added to preview.',
              );
            }}
          >
            <Text style={S.blockButtonText}>＋ Block These Dates</Text>
          </TouchableOpacity>

          <View style={S.unavailableDivider} />

          <View style={S.listHeader}>
            <Text style={S.subHeading}>Blocked Date Ranges</Text>
            <Text style={S.rangeCount}>{unavailableRanges.length} Ranges</Text>
          </View>

          {unavailableRanges.length === 0 ? (
            <View style={S.empty}>
              <Text style={S.hint}>No unavailable dates configured.</Text>
            </View>
          ) : (
            unavailableRanges.map(item => (
              <View key={item.id} style={S.unavailableItem}>
                <View style={S.calendarIcon}>
                  <Text style={S.calendarIconText}>▣</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={S.unavailableDate}>
                    {item.fromDate} – {item.toDate}
                  </Text>

                  <Text style={S.unavailableReason}>{item.reason}</Text>

                  <Text style={S.unavailableStatus}>● Booking unavailable</Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Remove blocked dates?',
                      'This date range will be removed from the preview.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () =>
                            setUnavailableRanges(prev =>
                              prev.filter(x => x.id !== item.id),
                            ),
                        },
                      ],
                    )
                  }
                >
                  <Text style={S.remove}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* PRIMARY SUBADMIN */}
        <View style={S.card}>
          <Text style={S.section}>Primary subadmin</Text>

          <Text style={S.hint}>
            Only one primary subadmin can manage this sport.
          </Text>

          <View style={S.person}>
            <Text style={S.personName}>{assigned?.name || 'Not assigned'}</Text>

            <Text style={S.hint}>
              {assigned?.email || 'Select an active subadmin below'}
            </Text>
          </View>

          {team.map(a => (
            <TouchableOpacity
              key={a.id}
              onPress={() =>
                assign(sport.primarySubAdminId === a.id ? null : a.id)
              }
              style={[S.choice, sport.primarySubAdminId === a.id && S.selected]}
            >
              <Text style={{ color: '#17251B', fontWeight: '700', flex: 1 }}>
                {a.name}
              </Text>

              <Text style={{ color: G, fontWeight: '900' }}>
                {sport.primarySubAdminId === a.id ? '✓ Assigned' : 'Assign'}
              </Text>
            </TouchableOpacity>
          ))}

          {sport.primarySubAdminId && (
            <TouchableOpacity onPress={() => assign(null)}>
              <Text style={S.remove}>Remove assignment</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const S: any = {
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  card: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#E4EBE5',
  },
  section: {
    color: '#17251B',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  hint: {
    color: '#718078',
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 9,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1ED',
  },
  rateLabel: {
    color: '#526157',
    fontSize: 12,
    fontWeight: '700',
  },
  rateValue: {
    color: G,
    fontSize: 12,
    fontWeight: '900',
  },
  label: {
    color: '#526157',
    fontWeight: '800',
    fontSize: 11,
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FBFDFC',
    borderWidth: 1,
    borderColor: '#E4EBE5',
    borderRadius: 11,
    padding: 12,
    color: '#17251B',
    marginBottom: 10,
  },
  button: {
    backgroundColor: G,
    padding: 14,
    borderRadius: 11,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: { color: '#FFF', fontWeight: '900' },
  subHeading: {
    color: '#17251B',
    fontWeight: '900',
    fontSize: 12,
    marginTop: 17,
    marginBottom: 8,
  },
  peakRow: {
    backgroundColor: '#F0F7F1',
    padding: 12,
    borderRadius: 11,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  peakTime: {
    color: '#17251B',
    fontSize: 14,
    fontWeight: '900',
  },
  peakCaption: {
    color: '#718078',
    fontSize: 10,
    marginTop: 3,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayButton: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#E4EBE5',
    backgroundColor: '#FBFDFC',
    padding: 11,
    borderRadius: 10,
  },
  dayButtonActive: {
    backgroundColor: '#E7F7E9',
    borderColor: '#86C99A',
  },
  dayText: {
    color: '#526157',
    fontWeight: '900',
    fontSize: 12,
  },
  dayTextActive: { color: G },
  dayStatus: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '700',
  },
  selectionText: {
    color: G,
    fontWeight: '800',
    fontSize: 11,
    marginTop: 12,
  },
  person: {
    backgroundColor: '#F0F7F1',
    padding: 12,
    borderRadius: 11,
    marginVertical: 10,
  },
  personName: { fontWeight: '900', color: '#17251B' },
  choice: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4EBE5',
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selected: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  remove: {
    color: '#DC2626',
    fontWeight: '900',
    fontSize: 11,
    marginTop: 4,
  },
  empty: {
    backgroundColor: '#FFF',
    padding: 17,
    borderRadius: 12,
  },
  slotCard: {
    backgroundColor: '#FFF',
    padding: 13,
    borderRadius: 13,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E4EBE5',
  },
  slotTime: {
    fontSize: 15,
    fontWeight: '900',
    color: '#17251B',
  },
  pill: {
    backgroundColor: '#E7F7E9',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
  },
  unavailableHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  unavailableBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },

  unavailableBadgeText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '900',
  },

  unavailableInfo: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    padding: 11,
    marginBottom: 12,
    gap: 8,
  },

  unavailableInfoIcon: {
    color: '#EA580C',
    fontSize: 16,
    fontWeight: '900',
  },

  unavailableInfoText: {
    color: '#9A3412',
    fontSize: 10,
    lineHeight: 16,
    flex: 1,
  },

  blockButton: {
    backgroundColor: '#B91C1C',
    padding: 14,
    borderRadius: 11,
    alignItems: 'center',
    marginTop: 5,
  },

  blockButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },

  unavailableDivider: {
    height: 1,
    backgroundColor: '#EDF1ED',
    marginVertical: 17,
  },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  rangeCount: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  unavailableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F8',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginTop: 9,
    gap: 10,
  },

  calendarIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarIconText: {
    color: '#DC2626',
    fontSize: 20,
    fontWeight: '900',
  },

  unavailableDate: {
    color: '#17251B',
    fontSize: 11,
    fontWeight: '900',
  },

  unavailableReason: {
    color: '#718078',
    fontSize: 10,
    marginTop: 4,
  },

  unavailableStatus: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 5,
  },
  bookingWindowOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 12,
    marginBottom: 12,
  },

  bookingWindowOption: {
    width: '48%',
    backgroundColor: '#FBFDFC',
    borderWidth: 1,
    borderColor: '#E4EBE5',
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
  },

  bookingWindowOptionActive: {
    backgroundColor: '#E7F7E9',
    borderColor: '#86C99A',
  },

  bookingWindowNumber: {
    color: '#17251B',
    fontSize: 22,
    fontWeight: '900',
  },

  bookingWindowLabel: {
    color: '#718078',
    fontSize: 11,
    fontWeight: '700',
  },

  bookingWindowTextActive: {
    color: G,
  },

  bookingWindowCheck: {
    color: G,
    fontSize: 9,
    fontWeight: '900',
    marginTop: 5,
  },

  customBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  customBookingInput: {
    flex: 1,
    marginBottom: 0,
  },

  customBookingButton: {
    backgroundColor: G,
    paddingHorizontal: 19,
    paddingVertical: 14,
    borderRadius: 11,
  },

  customBookingButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  bookingWindowInfo: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
  },

  bookingWindowInfoText: {
    color: G,
    fontSize: 11,
    fontWeight: '800',
  },
};

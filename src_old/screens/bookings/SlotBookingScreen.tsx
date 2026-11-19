import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { grounds } from '../../data/grounds';
import { useBookings } from '../../context/BookingContext';
import { GeneratedSlot } from '../../types/booking';
import { generateSlots } from '../../utils/slotGenerator';
import DateSelector from '../../components/DateSelector';

type Props = NativeStackScreenProps<MainStackParamList, 'SlotBooking'>;
const P = {
  bg: '#F6F8F5',
  white: '#FFFFFF',
  dark: '#132B20',
  forest: '#175E3D',
  lime: '#D9F56C',
  muted: '#78877C',
  border: '#E7ECE7',
  lightGreen: '#EAF5ED',
  red: '#C76B6B',
};
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(d.getDate()).padStart(2, '0')}`;
};
const formatDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};
const formatDuration = (start: number, end: number) => {
  const total = Math.max(0, end - start);
  const h = Math.floor(total / 60),
    m = total % 60;
  return (
    [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ') || 'Session'
  );
};

const SlotBookingScreen = ({ route, navigation }: Props) => {
  const { groundId, sportId } = route.params;
  const { bookings, loading } = useBookings();
  const ground = useMemo(
    () => grounds.find(item => item.id === groundId),
    [groundId],
  );
  const selectedSport = useMemo(
    () => ground?.sports.find(item => item.sportId === sportId),
    [ground, sportId],
  );
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const slots = useMemo(
    () =>
      ground ? generateSlots(ground, sportId, selectedDate, bookings) : [],
    [ground, sportId, selectedDate, bookings],
  );
  const selectedSlot =
    slots.find(
      slot => slot.id === selectedSlotId && slot.status === 'available',
    ) ?? null;
  const available = slots.filter(slot => slot.status === 'available').length;
  const booked = slots.filter(slot => slot.status === 'booked').length;
  const unavailable = slots.filter(
    slot => slot.status === 'unavailable',
  ).length;

  const onContinue = () => {
    if (!ground || !selectedSport || !selectedSlot || loading) {
      Alert.alert('Choose a session', 'Please select an available session.');
      return;
    }
    navigation.navigate('BookingSummary', {
      groundId: ground.id,
      sportId: selectedSport.sportId,
      bookingDate: selectedDate,
      slotId: selectedSlot.id,
    });
  };

  if (!ground || !selectedSport) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.missing}>
          <Text style={styles.missingTitle}>Sport or venue not found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.missingButton}
          >
            <Text style={styles.missingButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reserve your game</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.venueCard}>
          <Image
            source={{ uri: selectedSport.image || ground.image }}
            style={styles.venueImage}
          />
          <View style={styles.venueDetails}>
            <View style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>
                {selectedSport.icon} {selectedSport.sportName}
              </Text>
            </View>
            <Text style={styles.venueName}>{ground.name}</Text>
            <Text style={styles.venueLocation}>⌖ {ground.location}</Text>
            <Text style={styles.venueHours}>
              ◷ {ground.openingTime} – {ground.closingTime}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.eyebrow}>STEP 01 · PICK A DAY</Text>
            <Text style={styles.sectionTitle}>When are you playing?</Text>
          </View>
          <Text style={styles.smallTag}>Next 30 days</Text>
        </View>
        <View style={styles.dateCard}>
          <DateSelector
            selectedDate={selectedDate}
            onSelectDate={value => {
              setSelectedDate(value);
              setSelectedSlotId(null);
            }}
          />
          <View style={styles.dateFooter}>
            <Text style={styles.calendarGlyph}>▦</Text>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            <Text style={styles.dateCheck}>✓</Text>
          </View>
        </View>

        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <View>
            <Text style={styles.eyebrow}>STEP 02 · PICK A SESSION</Text>
            <Text style={styles.sectionTitle}>Available sessions</Text>
          </View>
          <View style={styles.availablePill}>
            <View style={styles.greenDot} />
            <Text style={styles.availablePillText}>{available} open</Text>
          </View>
        </View>
        <View style={styles.legend}>
          <Text style={styles.legendText}>● Available {available}</Text>
          <Text style={[styles.legendText, { color: P.red }]}>
            ● Booked {booked}
          </Text>
          <Text style={styles.legendText}>● Past {unavailable}</Text>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={P.forest} size="large" />
            <Text style={styles.emptyDescription}>Checking sessions…</Text>
          </View>
        ) : slots.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No sessions configured</Text>
            <Text style={styles.emptyDescription}>
              Please choose another sport or venue.
            </Text>
          </View>
        ) : (
          <View style={styles.slotList}>
            {slots.map((slot: GeneratedSlot, index: number) => {
              const isAvailable = slot.status === 'available';
              const isSelected = selectedSlot?.id === slot.id;
              const label =
                slot.status === 'booked'
                  ? 'Booked'
                  : slot.status === 'unavailable'
                  ? 'Unavailable'
                  : 'Available';
              return (
                <TouchableOpacity
                  key={slot.id}
                  disabled={!isAvailable}
                  activeOpacity={0.85}
                  onPress={() => setSelectedSlotId(isSelected ? null : slot.id)}
                  style={[
                    styles.slotCard,
                    isSelected && styles.slotSelected,
                    !isAvailable && styles.slotDisabled,
                  ]}
                >
                  <View
                    style={[
                      styles.slotAccent,
                      isSelected && styles.slotAccentSelected,
                    ]}
                  />
                  <View style={styles.slotContent}>
                    <View style={styles.slotTop}>
                      <Text style={styles.slotNumber}>
                        SESSION {String(index + 1).padStart(2, '0')}
                      </Text>
                      <Text
                        style={[
                          styles.statusText,
                          !isAvailable && styles.statusTextDisabled,
                        ]}
                      >
                        {isSelected ? '✓ Selected' : label}
                      </Text>
                    </View>
                    <View style={styles.slotMain}>
                      <View>
                        <Text style={styles.slotTime}>{slot.startTime}</Text>
                        <Text style={styles.slotTo}>to {slot.endTime}</Text>
                      </View>
                      <View style={styles.slotPriceArea}>
                        <Text style={styles.slotPrice}>
                          ₹{slot.price.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.slotPriceUnit}>per session</Text>
                      </View>
                    </View>
                    <View style={styles.slotBottom}>
                      <Text style={styles.durationText}>
                        ◷ {formatDuration(slot.startMinutes, slot.endMinutes)}{' '}
                        play time
                      </Text>
                      <View
                        style={[
                          styles.selectCircle,
                          isSelected && styles.selectCircleActive,
                        ]}
                      >
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.infoNote}>
          <Text style={styles.noteSymbol}>ⓘ</Text>
          <Text style={styles.noteText}>
            Only {selectedSport.sportName} sessions are shown. Booking another
            sport at this venue will not block these sessions.
          </Text>
        </View>
        {selectedSlot && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryEyebrow}>YOUR SELECTION</Text>
            <Text style={styles.summaryTime}>
              {selectedSport.sportName} · {selectedSlot.startTime} –{' '}
              {selectedSlot.endTime}
            </Text>
            <Text style={styles.summaryDate}>{formatDate(selectedDate)}</Text>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryPriceRow}>
              <Text style={styles.summaryPriceLabel}>Session total</Text>
              <Text style={styles.summaryPrice}>
                ₹{selectedSlot.price.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>
            {selectedSlot ? 'SESSION TOTAL' : 'SELECT A SESSION'}
          </Text>
          <Text style={styles.totalAmount}>
            {selectedSlot
              ? `₹${selectedSlot.price.toLocaleString('en-IN')}`
              : '—'}
          </Text>
        </View>
        <TouchableOpacity
          disabled={!selectedSlot || loading}
          onPress={onContinue}
          style={[
            styles.continueButton,
            (!selectedSlot || loading) && styles.continueDisabled,
          ]}
        >
          <Text style={styles.continueText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.bg },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.border,
  },
  backArrow: { fontSize: 32, color: P.dark, lineHeight: 35, marginTop: -4 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: P.dark },
  headerPlaceholder: { width: 42 },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28 },
  venueCard: {
    backgroundColor: P.dark,
    borderRadius: 20,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  venueImage: {
    width: 104,
    height: 112,
    borderRadius: 14,
    backgroundColor: '#35533F',
  },
  venueDetails: { flex: 1, paddingLeft: 13 },
  sportBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    backgroundColor: P.lime,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 7,
  },
  sportBadgeText: { color: P.dark, fontSize: 9, fontWeight: '900' },
  venueName: { color: P.white, fontSize: 16, fontWeight: '900' },
  venueLocation: { color: '#D2E0D5', fontSize: 10, marginTop: 6 },
  venueHours: { color: '#B9D2BF', fontSize: 10, marginTop: 6 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    color: P.forest,
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: P.dark },
  smallTag: { fontSize: 10, color: P.muted, paddingBottom: 3 },
  dateCard: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.border,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  dateFooter: {
    marginHorizontal: 14,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: P.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarGlyph: { color: P.forest, fontSize: 16, marginRight: 8 },
  dateText: { fontSize: 12, color: P.dark, fontWeight: '800', flex: 1 },
  dateCheck: { color: P.forest, fontSize: 15, fontWeight: '900' },
  availablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.lightGreen,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.forest,
    marginRight: 6,
  },
  availablePillText: { color: P.forest, fontSize: 10, fontWeight: '800' },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  legendText: { color: P.forest, fontSize: 9, fontWeight: '700' },
  slotList: { gap: 11 },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.border,
    overflow: 'hidden',
  },
  slotSelected: {
    borderColor: P.forest,
    borderWidth: 2,
    backgroundColor: '#F3FAF4',
  },
  slotDisabled: { opacity: 0.55 },
  slotAccent: { width: 5, backgroundColor: '#DCE8DE' },
  slotAccentSelected: { backgroundColor: P.forest },
  slotContent: { flex: 1, padding: 14 },
  slotTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotNumber: {
    color: P.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statusText: { color: P.forest, fontSize: 10, fontWeight: '800' },
  statusTextDisabled: { color: P.red },
  slotMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  slotTime: { color: P.dark, fontSize: 19, fontWeight: '900' },
  slotTo: { color: P.muted, fontSize: 10, marginTop: 3 },
  slotPriceArea: { alignItems: 'flex-end' },
  slotPrice: { color: P.forest, fontSize: 19, fontWeight: '900' },
  slotPriceUnit: { color: P.muted, fontSize: 9, marginTop: 2 },
  slotBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: P.border,
  },
  durationText: { color: P.muted, fontSize: 10, fontWeight: '700' },
  selectCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#B8C5BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCircleActive: { backgroundColor: P.forest, borderColor: P.forest },
  checkmark: { color: P.white, fontSize: 12, fontWeight: '900' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 35,
    backgroundColor: P.white,
    borderRadius: 16,
  },
  emptyTitle: { color: P.dark, fontSize: 16, fontWeight: '900' },
  emptyDescription: { color: P.muted, fontSize: 11, marginTop: 8 },
  infoNote: {
    flexDirection: 'row',
    backgroundColor: '#EDF4EE',
    padding: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  noteSymbol: { color: P.forest, fontSize: 14, marginRight: 8 },
  noteText: { flex: 1, color: '#53665A', fontSize: 10, lineHeight: 16 },
  summaryCard: {
    backgroundColor: P.dark,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  summaryEyebrow: {
    color: P.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  summaryTime: {
    color: P.white,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 10,
  },
  summaryDate: { color: '#C7D8CC', fontSize: 11, marginTop: 5 },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: 13,
  },
  summaryPriceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryPriceLabel: { color: '#C7D8CC', fontSize: 11 },
  summaryPrice: { color: P.lime, fontSize: 17, fontWeight: '900' },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: P.border,
  },
  totalLabel: {
    color: P.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  totalAmount: { color: P.dark, fontSize: 21, fontWeight: '900', marginTop: 2 },
  continueButton: {
    backgroundColor: P.dark,
    borderRadius: 13,
    paddingHorizontal: 25,
    paddingVertical: 14,
  },
  continueDisabled: { backgroundColor: '#DDE4DE' },
  continueText: { color: P.white, fontSize: 12, fontWeight: '900' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingTitle: {
    color: P.dark,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 15,
  },
  missingButton: {
    backgroundColor: P.dark,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  missingButtonText: { color: P.white, fontWeight: '800' },
});
export default SlotBookingScreen;

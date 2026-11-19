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
import { STATIC_BOOKED_SLOTS } from '../../data/bookedSlots';
import { useBookings } from '../../context/BookingContext';
import { useAdmin } from '../../context/AdminContext';
import DateSelector from '../../components/DateSelector';
import {
  generateAvailableStartTimes,
  timeToMinutes,
} from '../../services/availabilityService';
import { getSportPricing } from '../../utils/adminPricing';

type Props = NativeStackScreenProps<MainStackParamList, 'SlotBooking'>;

type BookingType = 'halfDay' | 'fullDay' | 'custom';

const P = {
  bg: '#F6F8F5',
  white: '#FFFFFF',
  dark: '#132B20',
  forest: '#175E3D',
  lime: '#D9F56C',
  muted: '#78877C',
  border: '#E7ECE7',
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

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const formatHours = (minutes: number) => {
  const hours = minutes / 60;

  return Number.isInteger(hours)
    ? `${hours} Hours`
    : `${hours.toFixed(1)} Hours`;
};

export default function SlotBookingScreen({ route, navigation }: Props) {
  const { groundId, sportId } = route.params;

  const { bookings, loading } = useBookings();
  const { complexes } = useAdmin();

  const ground = useMemo(
    () => grounds.find(item => item.id === groundId),
    [groundId],
  );

  const selectedSport = useMemo(
    () => ground?.sports.find(item => item.sportId === sportId),
    [ground, sportId],
  );

  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [bookingType, setBookingType] = useState<BookingType>('custom');
  const [customHours, setCustomHours] = useState(2);
  const [selectedStart, setSelectedStart] = useState<number | null>(null);

  const opening = ground ? timeToMinutes(ground.openingTime) : 0;
  const closing = ground ? timeToMinutes(ground.closingTime) : 0;

  const availableGroundMinutes = closing - opening;

  // Combine actual bookings and static demo bookings.
  const allBookings = useMemo(() => {
    return [...bookings, ...STATIC_BOOKED_SLOTS];
  }, [bookings]);

  // Admin pricing.
  const pricing =
    ground && selectedSport
      ? getSportPricing(ground, selectedSport, complexes)
      : null;

  const pricingData = pricing as
    | (typeof pricing & {
        pricePerHour?: number;
        hourlyRate?: number;
      })
    | null;

  const hourlyRate = pricingData?.pricePerHour ?? pricingData?.hourlyRate ?? 0;

  // Maximum custom hours allowed by ground timings.
  const maxCustomHours = Math.floor(availableGroundMinutes / 60);

  // Calculate duration according to selected booking type.
  const durationMinutes =
    bookingType === 'halfDay'
      ? 4 * 60
      : bookingType === 'fullDay'
      ? availableGroundMinutes
      : customHours * 60;

  const selectedHours = durationMinutes / 60;

  // Calculate session price.
  const price = hourlyRate * selectedHours;

  const isDurationValid =
    durationMinutes > 0 &&
    durationMinutes <= availableGroundMinutes &&
    (bookingType !== 'halfDay' || availableGroundMinutes >= 240);

  // Already booked slots for selected date, ground and sport.
  const bookedTimes = useMemo(() => {
    return allBookings
      .filter(
        item =>
          item.groundId === groundId &&
          item.sportId === sportId &&
          item.bookingDate === selectedDate &&
          item.status === 'confirmed',
      )
      .sort((a, b) => a.startMinutes - b.startMinutes);
  }, [allBookings, groundId, sportId, selectedDate]);

  // Generate available start times after excluding overlapping bookings.
  const availableTimes = useMemo(() => {
    if (!ground || !isDurationValid) {
      return [];
    }

    return generateAvailableStartTimes({
      openingTime: ground.openingTime,
      closingTime: ground.closingTime,
      durationMinutes,
      bookings: allBookings,
      selectedDate,
      groundId,
      sportId,
    });
  }, [
    ground,
    durationMinutes,
    allBookings,
    selectedDate,
    groundId,
    sportId,
    isDurationValid,
  ]);

  const selectedTime =
    availableTimes.find(item => item.startMinutes === selectedStart) || null;

  // Morning, Afternoon and Evening groups.
  const slotGroups = useMemo(() => {
    const groups = [
      {
        key: 'morning',
        title: 'Morning',
        subtitle: 'Opening – 12 PM',
        icon: '🌅',
        start: opening,
        end: Math.min(12 * 60, closing),
      },
      {
        key: 'afternoon',
        title: 'Afternoon',
        subtitle: '12 PM – 5 PM',
        icon: '☀️',
        start: Math.max(12 * 60, opening),
        end: Math.min(17 * 60, closing),
      },
      {
        key: 'evening',
        title: 'Evening',
        subtitle: '5 PM – Closing',
        icon: '🌆',
        start: Math.max(17 * 60, opening),
        end: closing,
      },
    ];

    return groups
      .map(group => ({
        ...group,
        slots: availableTimes.filter(
          item =>
            item.startMinutes >= group.start && item.startMinutes < group.end,
        ),
      }))
      .filter(group => group.slots.length > 0);
  }, [availableTimes, opening, closing]);

  const changeCustomHours = (value: number) => {
    if (value < 1 || value > maxCustomHours) {
      return;
    }

    setCustomHours(value);
    setSelectedStart(null);
  };

  const changeBookingType = (type: BookingType) => {
    setBookingType(type);
    setSelectedStart(null);
  };

  const onContinue = () => {
    if (!ground || !selectedSport || loading) {
      return;
    }

    if (!isDurationValid) {
      Alert.alert(
        'Invalid duration',
        'Selected duration is not available for this ground.',
      );
      return;
    }

    if (!selectedTime) {
      Alert.alert('Select a time', 'Please select an available start time.');
      return;
    }

    if (hourlyRate <= 0) {
      Alert.alert(
        'Price not configured',
        'Hourly rate is not configured for this sport.',
      );
      return;
    }

    navigation.navigate('BookingSummary', {
      groundId: ground.id,
      sportId: selectedSport.sportId,
      bookingDate: selectedDate,
      startTime: selectedTime.startTime,
      endTime: selectedTime.endTime,
      startMinutes: selectedTime.startMinutes,
      endMinutes: selectedTime.endMinutes,
      durationMinutes,
      price,
    });
  };

  if (!ground || !selectedSport) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Sport or venue not found</Text>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Reserve your game</Text>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Venue Information */}
        <View style={styles.venueCard}>
          <Image
            source={{
              uri: selectedSport.image || ground.image,
            }}
            style={styles.image}
          />

          <View style={{ flex: 1, paddingLeft: 13 }}>
            <Text style={styles.sport}>
              {selectedSport.icon} {selectedSport.sportName}
            </Text>

            <Text style={styles.venueName}>{ground.name}</Text>

            <Text style={styles.venueMuted}>⌖ {ground.location}</Text>

            <Text style={styles.venueMuted}>
              ◷ {ground.openingTime} – {ground.closingTime}
            </Text>
          </View>
        </View>

        {/* Date Selection */}
        <Text style={styles.eyebrow}>STEP 01 · PICK A DAY</Text>

        <Text style={styles.sectionTitle}>When are you playing?</Text>

        <View style={styles.dateCard}>
          <DateSelector
            selectedDate={selectedDate}
            onSelectDate={value => {
              setSelectedDate(value);
              setSelectedStart(null);
            }}
          />

          <Text style={styles.dateLabel}>{formatDate(selectedDate)}</Text>
        </View>

        {/* Booking Type */}
        <Text style={styles.eyebrow}>STEP 02 · BOOKING TYPE</Text>

        <Text style={styles.sectionTitle}>Choose your booking</Text>

        <View style={styles.bookingTypeContainer}>
          {/* Half Day */}
          <TouchableOpacity
            style={[
              styles.bookingTypeCard,
              bookingType === 'halfDay' && styles.bookingTypeActive,
              availableGroundMinutes < 240 && styles.disabledBookingCard,
            ]}
            disabled={availableGroundMinutes < 240}
            onPress={() => changeBookingType('halfDay')}
          >
            <Text style={styles.bookingTypeIcon}>🌤️</Text>

            <Text
              style={[
                styles.bookingTypeTitle,
                bookingType === 'halfDay' && styles.bookingTypeTitleActive,
              ]}
            >
              Half Day
            </Text>

            <Text
              style={[
                styles.bookingTypeSubtitle,
                bookingType === 'halfDay' && styles.bookingTypeSubtitleActive,
              ]}
            >
              4 Hours
            </Text>
          </TouchableOpacity>

          {/* Full Day */}
          <TouchableOpacity
            style={[
              styles.bookingTypeCard,
              bookingType === 'fullDay' && styles.bookingTypeActive,
            ]}
            onPress={() => changeBookingType('fullDay')}
          >
            <Text style={styles.bookingTypeIcon}>☀️</Text>

            <Text
              style={[
                styles.bookingTypeTitle,
                bookingType === 'fullDay' && styles.bookingTypeTitleActive,
              ]}
            >
              Full Day
            </Text>

            <Text
              style={[
                styles.bookingTypeSubtitle,
                bookingType === 'fullDay' && styles.bookingTypeSubtitleActive,
              ]}
            >
              {formatHours(availableGroundMinutes)}
            </Text>
          </TouchableOpacity>

          {/* Custom */}
          <TouchableOpacity
            style={[
              styles.bookingTypeCard,
              bookingType === 'custom' && styles.bookingTypeActive,
            ]}
            onPress={() => changeBookingType('custom')}
          >
            <Text style={styles.bookingTypeIcon}>⚙️</Text>

            <Text
              style={[
                styles.bookingTypeTitle,
                bookingType === 'custom' && styles.bookingTypeTitleActive,
              ]}
            >
              Custom
            </Text>

            <Text
              style={[
                styles.bookingTypeSubtitle,
                bookingType === 'custom' && styles.bookingTypeSubtitleActive,
              ]}
            >
              Your Choice
            </Text>
          </TouchableOpacity>
        </View>

        {/* Custom Duration */}
        {bookingType === 'custom' && (
          <View style={styles.customCard}>
            <Text style={styles.customTitle}>
              How many hours do you want to play?
            </Text>

            <View style={styles.hourSelector}>
              <TouchableOpacity
                onPress={() => changeCustomHours(customHours - 1)}
                disabled={customHours <= 1}
                style={[
                  styles.hourButton,
                  customHours <= 1 && styles.disabledButton,
                ]}
              >
                <Text style={styles.hourButtonText}>−</Text>
              </TouchableOpacity>

              <View style={styles.hourValueContainer}>
                <Text style={styles.hourValue}>{customHours}</Text>

                <Text style={styles.hourLabel}>Hours</Text>
              </View>

              <TouchableOpacity
                onPress={() => changeCustomHours(customHours + 1)}
                disabled={customHours >= maxCustomHours}
                style={[
                  styles.hourButton,
                  customHours >= maxCustomHours && styles.disabledButton,
                ]}
              >
                <Text style={styles.hourButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.customSubtitle}>
              Choose your preferred playing duration.
            </Text>
          </View>
        )}

        {/* Price Details */}
        <View style={styles.customCard}>
          <Text style={styles.customTitle}>Price details</Text>

          <View style={styles.customPriceRow}>
            <Text style={styles.customPriceLabel}>Admin hourly rate</Text>

            <Text style={styles.customPriceValue}>
              {money(hourlyRate)} / hour
            </Text>
          </View>

          <View style={styles.customPriceRow}>
            <Text style={styles.customPriceLabel}>
              {formatHours(durationMinutes)} × {money(hourlyRate)}
            </Text>

            <Text style={styles.customTotal}>{money(price)}</Text>
          </View>
        </View>

        {/* Already Booked Slots */}
        <View style={styles.bookedSection}>
          <View style={styles.bookedHeader}>
            <View style={styles.groupTitleRow}>
              <Text style={styles.groupIcon}>🔒</Text>

              <Text style={styles.groupTitle}>Already Booked</Text>
            </View>

            <Text style={styles.bookedCount}>{bookedTimes.length} Booked</Text>
          </View>

          {bookedTimes.length === 0 ? (
            <View style={styles.noBookedCard}>
              <Text style={styles.noBookedText}>No bookings for this date</Text>
            </View>
          ) : (
            <View style={styles.bookedGrid}>
              {bookedTimes.map(item => (
                <View key={item.id} style={styles.bookedCard}>
                  <View style={styles.bookedTimeRow}>
                    <Text style={styles.bookedTime}>{item.startTime}</Text>

                    <Text style={styles.bookedLock}>🔒</Text>
                  </View>

                  <Text style={styles.bookedEnd}>to {item.endTime}</Text>

                  <Text style={styles.bookedStatus}>BOOKED</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Time Selection */}
        <Text style={styles.eyebrow}>STEP 03 · CHOOSE START TIME</Text>

        <Text style={styles.sectionTitle}>Available start times</Text>

        <Text style={styles.durationHint}>
          {formatHours(durationMinutes)} session · End time will be calculated
          automatically.
        </Text>

        {loading ? (
          <ActivityIndicator color={P.forest} style={{ marginVertical: 25 }} />
        ) : !isDurationValid ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Duration not available</Text>

            <Text style={styles.muted}>
              This ground does not have enough operating hours for this booking
              type.
            </Text>
          </View>
        ) : availableTimes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No available times</Text>

            <Text style={styles.muted}>Try another date or duration.</Text>
          </View>
        ) : (
          slotGroups.map(group => (
            <View key={group.key} style={styles.slotGroup}>
              <View style={styles.groupHeader}>
                <View style={styles.groupTitleRow}>
                  <Text style={styles.groupIcon}>{group.icon}</Text>

                  <Text style={styles.groupTitle}>{group.title}</Text>
                </View>

                <Text style={styles.groupSubtitle}>{group.subtitle}</Text>
              </View>

              <View style={styles.timeGrid}>
                {group.slots.map(item => {
                  const active = selectedStart === item.startMinutes;

                  return (
                    <TouchableOpacity
                      key={item.startMinutes}
                      onPress={() => setSelectedStart(item.startMinutes)}
                      style={[styles.timeCard, active && styles.timeActive]}
                    >
                      <Text
                        style={[
                          styles.timeStart,
                          active && styles.timeStartActive,
                        ]}
                      >
                        {item.startTime}
                      </Text>

                      <Text
                        style={[styles.timeEnd, active && styles.timeEndActive]}
                      >
                        to {item.endTime}
                      </Text>

                      {active && (
                        <Text style={styles.selectedText}>✓ Selected</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}

        {/* Information */}
        <View style={styles.note}>
          <Text style={styles.noteText}>
            • Half Day booking is fixed for 4 hours.
            {'\n'}• Full Day booking covers the complete ground operating
            duration.
            {'\n'}• Custom booking lets you choose your own hours.
            {'\n'}• Price is calculated according to admin hourly rate.
            {'\n'}• Start times are available at 60-minute intervals.
            {'\n'}• Bookings require continuous availability.
            {'\n'}• A booking blocks only the same sport at this ground.
            {'\n'}• Booking cannot extend beyond ground closing time.
          </Text>
        </View>

        {/* Selection Summary */}
        {selectedTime && (
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>YOUR SELECTION</Text>

            <Text style={styles.summaryTitle}>
              {selectedTime.startTime} – {selectedTime.endTime}
            </Text>

            <Text style={styles.summaryDate}>
              {formatDate(selectedDate)} · {formatHours(durationMinutes)}
            </Text>

            <Text style={styles.summaryDate}>
              {bookingType === 'halfDay'
                ? 'Half Day'
                : bookingType === 'fullDay'
                ? 'Full Day'
                : 'Custom Booking'}
            </Text>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryDate}>Session price</Text>

              <Text style={styles.summaryPrice}>{money(price)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottom}>
        <View>
          <Text style={styles.bottomLabel}>SESSION PRICE</Text>

          <Text style={styles.bottomPrice}>{money(price)}</Text>
        </View>

        <TouchableOpacity
          disabled={
            !selectedTime || loading || hourlyRate <= 0 || !isDurationValid
          }
          onPress={onContinue}
          style={[
            styles.continue,
            (!selectedTime ||
              loading ||
              hourlyRate <= 0 ||
              !isDurationValid) && {
              opacity: 0.45,
            },
          ]}
        >
          <Text style={styles.continueText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.bg,
  },

  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 29,
    color: P.dark,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: P.dark,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
  },

  venueCard: {
    backgroundColor: P.dark,
    borderRadius: 18,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  image: {
    width: 98,
    height: 105,
    borderRadius: 13,
    backgroundColor: '#35533F',
  },

  sport: {
    color: P.lime,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 7,
  },

  venueName: {
    color: P.white,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 6,
  },

  venueMuted: {
    color: '#C7D8CC',
    fontSize: 10,
    marginTop: 4,
  },

  muted: {
    color: P.muted,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },

  eyebrow: {
    color: P.forest,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 6,
  },

  sectionTitle: {
    color: P.dark,
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 12,
  },

  dateCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.border,
    paddingVertical: 8,
    marginBottom: 4,
  },

  dateLabel: {
    color: P.dark,
    fontWeight: '800',
    fontSize: 11,
    paddingHorizontal: 14,
    paddingTop: 9,
  },

  bookingTypeContainer: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 12,
  },

  bookingTypeCard: {
    flex: 1,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 13,
    paddingVertical: 15,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bookingTypeActive: {
    backgroundColor: P.forest,
    borderColor: P.forest,
  },

  disabledBookingCard: {
    opacity: 0.4,
  },

  bookingTypeIcon: {
    fontSize: 22,
    marginBottom: 8,
  },

  bookingTypeTitle: {
    color: P.dark,
    fontSize: 12,
    fontWeight: '900',
  },

  bookingTypeTitleActive: {
    color: P.white,
  },

  bookingTypeSubtitle: {
    color: P.muted,
    fontSize: 10,
    marginTop: 5,
    fontWeight: '700',
  },

  bookingTypeSubtitleActive: {
    color: '#E5F5E9',
  },

  customCard: {
    backgroundColor: P.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: P.border,
    padding: 15,
    marginTop: 5,
    marginBottom: 10,
  },

  customTitle: {
    color: P.dark,
    fontSize: 15,
    fontWeight: '900',
  },

  customSubtitle: {
    color: P.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },

  hourSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginVertical: 18,
  },

  hourButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: P.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledButton: {
    backgroundColor: '#B9C7BC',
  },

  hourButtonText: {
    color: P.white,
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 29,
  },

  hourValueContainer: {
    alignItems: 'center',
    minWidth: 65,
  },

  hourValue: {
    color: P.dark,
    fontSize: 29,
    fontWeight: '900',
  },

  hourLabel: {
    color: P.muted,
    fontSize: 11,
    fontWeight: '700',
  },

  customPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: P.border,
    marginTop: 8,
  },

  customPriceLabel: {
    color: P.muted,
    fontSize: 11,
  },

  customPriceValue: {
    color: P.dark,
    fontSize: 12,
    fontWeight: '800',
  },

  customTotal: {
    color: P.forest,
    fontSize: 17,
    fontWeight: '900',
  },

  durationHint: {
    color: P.muted,
    fontSize: 11,
    marginTop: -6,
    marginBottom: 14,
  },

  bookedSection: {
    marginTop: 18,
    marginBottom: 20,
  },

  bookedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  bookedCount: {
    color: '#C24141',
    fontSize: 10,
    fontWeight: '900',
  },

  bookedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  bookedCard: {
    width: '48%',
    backgroundColor: '#FCEEEE',
    borderWidth: 1,
    borderColor: '#F2CCCC',
    borderRadius: 12,
    padding: 13,
  },

  bookedTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  bookedTime: {
    color: '#9F3030',
    fontSize: 15,
    fontWeight: '900',
  },

  bookedLock: {
    fontSize: 12,
  },

  bookedEnd: {
    color: '#B66A6A',
    fontSize: 10,
    marginTop: 4,
  },

  bookedStatus: {
    color: '#C24141',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 8,
  },

  noBookedCard: {
    backgroundColor: P.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: P.border,
  },

  noBookedText: {
    color: P.muted,
    fontSize: 11,
    textAlign: 'center',
  },

  slotGroup: {
    marginBottom: 18,
  },

  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  groupIcon: {
    fontSize: 17,
  },

  groupTitle: {
    color: P.dark,
    fontSize: 15,
    fontWeight: '900',
  },

  groupSubtitle: {
    color: P.muted,
    fontSize: 10,
    fontWeight: '700',
  },

  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  timeCard: {
    width: '48%',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.border,
    borderRadius: 12,
    padding: 13,
  },

  timeActive: {
    backgroundColor: P.forest,
    borderColor: P.forest,
  },

  timeStart: {
    color: P.dark,
    fontSize: 16,
    fontWeight: '900',
  },

  timeStartActive: {
    color: P.white,
  },

  timeEnd: {
    color: P.muted,
    fontSize: 10,
    marginTop: 4,
  },

  timeEndActive: {
    color: '#E5F5E9',
  },

  selectedText: {
    color: P.lime,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 6,
  },

  empty: {
    backgroundColor: P.white,
    padding: 20,
    borderRadius: 13,
    alignItems: 'center',
  },

  emptyTitle: {
    color: P.dark,
    fontWeight: '900',
    marginBottom: 5,
  },

  note: {
    backgroundColor: '#EDF4EE',
    padding: 12,
    borderRadius: 11,
    marginTop: 8,
  },

  noteText: {
    color: '#53665A',
    fontSize: 10,
    lineHeight: 17,
  },

  summary: {
    backgroundColor: P.dark,
    borderRadius: 15,
    padding: 15,
    marginTop: 16,
  },

  summaryLabel: {
    color: P.lime,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  summaryTitle: {
    color: P.white,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 9,
  },

  summaryDate: {
    color: '#C7D8CC',
    fontSize: 10,
    marginTop: 5,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: 12,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  summaryPrice: {
    color: P.lime,
    fontWeight: '900',
    fontSize: 16,
  },

  bottom: {
    backgroundColor: P.white,
    borderTopWidth: 1,
    borderTopColor: P.border,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  bottomLabel: {
    color: P.muted,
    fontSize: 8,
    fontWeight: '900',
  },

  bottomPrice: {
    color: P.dark,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 3,
  },

  continue: {
    backgroundColor: P.dark,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },

  continueText: {
    color: P.white,
    fontWeight: '900',
    fontSize: 12,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    color: P.dark,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
});

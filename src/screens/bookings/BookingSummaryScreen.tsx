import React, { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MainStackParamList } from '../../navigation/types';
import { useBookings } from '../../context/BookingContext';
import { Booking } from '../../types/booking';

type Props = NativeStackScreenProps<MainStackParamList, 'BookingSummary'>;

const GST_RATE = 0.18;

const COUPONS: Record<
  string,
  {
    type: 'flat' | 'percent';
    value: number;
    minAmount: number;
    maxDiscount?: number;
  }
> = {
  PLAY10: {
    type: 'percent',
    value: 10,
    minAmount: 300,
    maxDiscount: 200,
  },
  SPORT20: {
    type: 'percent',
    value: 20,
    minAmount: 500,
    maxDiscount: 300,
  },
  SAVE100: {
    type: 'flat',
    value: 100,
    minAmount: 800,
  },
};

const money = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function BookingSummaryScreen({ route, navigation }: Props) {
  const {
    groundId,
    sportId,
    groundName,
    sportName,
    sportIcon,
    groundLocation,
    bookingDate,
    startTime,
    endTime,
    startMinutes,
    endMinutes,
    durationMinutes,
    price,
  } = route.params;

  const { createBooking } = useBookings();

  const [submitting, setSubmitting] = useState(false);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');

  // Coupon calculation
  const offer = COUPONS[appliedCoupon];

  const discount = offer
    ? round(
        Math.min(
          price,
          offer.maxDiscount ?? Infinity,
          offer.type === 'percent' ? (price * offer.value) / 100 : offer.value,
        ),
      )
    : 0;

  const taxable = round(price - discount);

  const gst = round(taxable * GST_RATE);

  const total = round(taxable + gst);

  // Apply coupon
  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();

    const found = COUPONS[code];

    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    if (!found) {
      setCouponError('Invalid coupon. Try PLAY10, SPORT20 or SAVE100.');
      return;
    }

    if (price < found.minAmount) {
      setCouponError(
        `Minimum booking price ${money(found.minAmount)} required.`,
      );
      return;
    }

    setAppliedCoupon(code);
    setCouponInput(code);
    setCouponError('');
  };

  // Confirm booking
  const confirmBooking = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    const booking: Booking = {
      id: `BOOK-${Date.now()}`,

      bookingNumber: `SA${Date.now().toString().slice(-8)}`,

      groundId,
      groundName,

      sportId,
      sportName,

      bookingDate,

      startTime,
      endTime,

      startMinutes,
      endMinutes,

      duration: durationMinutes,

      amount: total,
      basePrice: price,

      couponCode: appliedCoupon || undefined,
      discountAmount: discount,
      gstAmount: gst,

      status: 'confirmed',

      createdAt: new Date().toISOString(),
    };

    try {
      const success = await createBooking(booking);

      if (!success) {
        Alert.alert(
          'Slot Unavailable',
          'This time was just booked. Please select another time.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );

        return;
      }

      Alert.alert(
        'Booking Confirmed!',
        `Booking ID: ${booking.bookingNumber}\n${sportName} · ${startTime} - ${endTime}`,
        [
          {
            text: 'View My Bookings',
            onPress: () => {
              navigation.navigate('MainTabs', {
                screen: 'Bookings',
              });
            },
          },
        ],
        {
          cancelable: false,
        },
      );
    } catch (error) {
      console.log('Booking confirmation error:', error);

      Alert.alert('Booking Failed', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Invalid booking details
  if (
    !groundId ||
    !sportId ||
    !groundName ||
    !sportName ||
    !bookingDate ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.heading}>Booking details not found</Text>

          <TouchableOpacity
            style={styles.confirm}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Booking Summary</Text>

        <View style={{ width: 35 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.heading}>Review Your Booking</Text>

        <Text style={styles.subtitle}>
          Please verify the details before confirmation.
        </Text>

        {/* Venue details */}
        <View style={styles.venue}>
          <View style={styles.venueIcon}>
            <Text style={styles.venueIconText}>🏟️</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.venueName}>{groundName}</Text>

            <Text style={styles.sport}>
              {sportIcon || '🏆'} {sportName}
            </Text>

            {!!groundLocation && (
              <Text style={styles.muted}>📍 {groundLocation}</Text>
            )}
          </View>
        </View>

        {/* Booking details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          <Row label="Date" value={formatDate(bookingDate)} />

          <Row label="Time" value={`${startTime} – ${endTime}`} />

          <Row
            label="Duration"
            value={`${durationMinutes / 60} ${
              durationMinutes === 60 ? 'Hour' : 'Hours'
            }`}
          />

          <Row label="Sport" value={sportName} />
        </View>

        {/* Coupon */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Apply Coupon</Text>

          <View style={styles.couponRow}>
            <TextInput
              value={couponInput}
              onChangeText={value => {
                setCouponInput(value.toUpperCase());
                setAppliedCoupon('');
                setCouponError('');
              }}
              placeholder="Enter coupon code"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              style={styles.input}
              editable={!submitting}
            />

            <TouchableOpacity
              onPress={applyCoupon}
              style={styles.couponButton}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>Apply</Text>
            </TouchableOpacity>
          </View>

          {!!couponError && <Text style={styles.error}>{couponError}</Text>}

          {!!appliedCoupon && (
            <Text style={styles.success}>
              {appliedCoupon} applied — you save {money(discount)}
            </Text>
          )}

          <Text style={styles.hint}>
            Demo coupons: PLAY10, SPORT20, SAVE100
          </Text>
        </View>

        {/* Price details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Details</Text>

          <Row label="Fixed session price" value={money(price)} />

          <Row
            label={`Coupon discount${
              appliedCoupon ? ` (${appliedCoupon})` : ''
            }`}
            value={`- ${money(discount)}`}
            green
          />

          <Row label="Taxable amount" value={money(taxable)} />

          <Row label="GST (18%)" value={`+ ${money(gst)}`} />

          <View style={styles.divider} />

          <Row label="Total Payable" value={money(total)} strong />
        </View>

        {/* Demo note */}
        <View style={styles.note}>
          <Text style={styles.noteTitle}>Demo Booking</Text>

          <Text style={styles.muted}>
            No real payment will be collected. Your booking will reserve this
            sport and time.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom confirmation */}
      <View style={styles.bottom}>
        <View>
          <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>

          <Text style={styles.total}>{money(total)}</Text>
        </View>

        <TouchableOpacity
          disabled={submitting}
          onPress={confirmBooking}
          style={[styles.confirm, submitting && { opacity: 0.6 }]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Reusable row
function Row({
  label,
  value,
  green,
  strong,
}: {
  label: string;
  value: string;
  green?: boolean;
  strong?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text>

      <Text
        style={[
          styles.rowValue,
          green && { color: '#15803D' },
          strong && styles.strong,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  backButton: {
    width: 35,
    height: 40,
    justifyContent: 'center',
  },

  back: {
    fontSize: 34,
    color: '#0F172A',
    lineHeight: 38,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },

  content: {
    padding: 18,
    paddingBottom: 30,
  },

  heading: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0F172A',
  },

  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 20,
  },

  venue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  venueIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  venueIconText: {
    fontSize: 27,
  },

  venueName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },

  sport: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803D',
    marginTop: 5,
  },

  muted: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 19,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  rowLabel: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    marginRight: 12,
  },

  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },

  strong: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },

  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  input: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 13,
    color: '#0F172A',
    fontSize: 14,
  },

  couponButton: {
    height: 48,
    minWidth: 85,
    borderRadius: 10,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  error: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 9,
  },

  success: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 9,
  },

  hint: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 12,
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },

  note: {
    backgroundColor: '#EFF6FF',
    padding: 15,
    borderRadius: 13,
    marginBottom: 15,
  },

  noteTitle: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },

  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  totalLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },

  total: {
    fontSize: 21,
    fontWeight: '900',
    color: '#15803D',
    marginTop: 3,
  },

  confirm: {
    height: 50,
    minWidth: 165,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

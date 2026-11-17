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
import { grounds } from '../../data/grounds';
import { useBookings } from '../../context/BookingContext';
import { Booking } from '../../types/booking';

type Props = NativeStackScreenProps<MainStackParamList, 'BookingSummary'>;

const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);

  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Demo configuration: verify applicable tax rate before production use.
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
  PLAY10: { type: 'percent', value: 10, minAmount: 300, maxDiscount: 200 },
  SPORT20: { type: 'percent', value: 20, minAmount: 500, maxDiscount: 300 },
  SAVE100: { type: 'flat', value: 100, minAmount: 800 },
};
const roundMoney = (amount: number) =>
  Math.round((amount + Number.EPSILON) * 100) / 100;
const money = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const BookingSummaryScreen = ({ route, navigation }: Props) => {
  const { groundId, sportId, bookingDate, slotId } = route.params;

  const { createBooking } = useBookings();
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');

  const ground = grounds.find(item => item.id === groundId);
  const selectedSport = ground?.sports?.find(item => item.sportId === sportId);
  const slot = selectedSport?.slots.find(item => item.id === slotId);

  if (!ground || !selectedSport || !slot) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Booking Details Not Found</Text>
          <Text style={styles.errorDescription}>
            Please go back and select your sport and slot again.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const duration = (slot.endMinutes - slot.startMinutes) / 60;
  const formattedDate = formatDate(bookingDate);

  const slotPrice = roundMoney(slot.price);
  const coupon = COUPONS[appliedCoupon];
  const discount = coupon
    ? roundMoney(
        Math.min(
          slotPrice,
          coupon.maxDiscount ?? Infinity,
          coupon.type === 'percent'
            ? (slotPrice * coupon.value) / 100
            : coupon.value,
        ),
      )
    : 0;
  const taxableAmount = roundMoney(slotPrice - discount);
  const gstAmount = roundMoney(taxableAmount * GST_RATE);
  const totalAmount = roundMoney(taxableAmount + gstAmount);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const offer = COUPONS[code];
    if (!offer) {
      setCouponError('Invalid coupon code. Try PLAY10, SPORT20 or SAVE100.');
      return;
    }
    if (slotPrice < offer.minAmount) {
      setCouponError(`Minimum slot price ${money(offer.minAmount)} required.`);
      return;
    }
    setAppliedCoupon(code);
    setCouponInput(code);
    setCouponError('');
  };

  const removeCoupon = () => {
    setAppliedCoupon('');
    setCouponInput('');
    setCouponError('');
  };

  const handleConfirmBooking = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    const booking: Booking = {
      id: `BOOK-${Date.now()}`,
      bookingNumber: `SA${Date.now().toString().slice(-8)}`,
      groundId: ground.id,
      groundName: ground.name,
      sportId: selectedSport.sportId,
      sportName: selectedSport.sportName,
      bookingDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      startMinutes: slot.startMinutes,
      endMinutes: slot.endMinutes,
      duration,
      amount: totalAmount,
      // Additional pricing details can be persisted after extending Booking type.

      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    try {
      const success = await createBooking(booking);

      if (!success) {
        Alert.alert(
          'Slot Unavailable',
          'This slot has already been booked for this sport. Please select another slot.',
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
        `Your booking has been successfully confirmed.\n\nBooking ID: ${booking.bookingNumber}`,
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
        { cancelable: false },
      );
    } catch (error) {
      console.log('Booking confirmation error:', error);
      Alert.alert('Booking Failed', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Summary</Text>
        <View style={styles.headerRightSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🏟️</Text>
        </View>

        <Text style={styles.heading}>Review Your Booking</Text>
        <Text style={styles.subtitle}>
          Please verify your booking details before confirmation.
        </Text>

        <View style={styles.groundCard}>
          <Text style={styles.groundName}>{ground.name}</Text>
          <Text style={styles.groundSport}>
            {selectedSport.icon} {selectedSport.sportName}
          </Text>
          <Text style={styles.groundLocation}>📍 {ground.location}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Booking Date</Text>
            <Text style={styles.value}>{formattedDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Time Slot</Text>
            <Text style={styles.value}>
              {slot.startTime} - {slot.endTime}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{duration} Hours</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Sport</Text>
            <Text style={styles.value}>{selectedSport.sportName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Ground</Text>
            <Text style={styles.value}>{ground.name}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Apply Coupon</Text>
          <View style={styles.couponRow}>
            <TextInput
              value={couponInput}
              onChangeText={text => {
                setCouponInput(text.toUpperCase());
                setCouponError('');
                if (appliedCoupon) setAppliedCoupon('');
              }}
              placeholder="Enter coupon code"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              editable={!submitting}
              style={styles.couponInput}
            />
            <TouchableOpacity
              onPress={appliedCoupon ? removeCoupon : applyCoupon}
              disabled={submitting}
              style={styles.couponButton}
            >
              <Text style={styles.couponButtonText}>
                {appliedCoupon ? 'Remove' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
          {!!couponError && (
            <Text style={styles.couponError}>{couponError}</Text>
          )}
          {!!appliedCoupon && (
            <Text style={styles.couponSuccess}>
              ✓ {appliedCoupon} applied! You save {money(discount)}.
            </Text>
          )}
          <Text style={styles.couponHint}>
            Demo coupons: PLAY10, SPORT20, SAVE100
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Slot Price</Text>
            <Text style={styles.value}>{money(slotPrice)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>
              Coupon Discount {appliedCoupon ? `(${appliedCoupon})` : ''}
            </Text>
            <Text style={[styles.value, discount > 0 && styles.discountValue]}>
              - {money(discount)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Taxable Amount</Text>
            <Text style={styles.value}>{money(taxableAmount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>GST ({GST_RATE * 100}%)</Text>
            <Text style={styles.value}>+ {money(gstAmount)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalAmount}>{money(totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Important Note</Text>
          <Text style={styles.noteText}>
            This is a demo booking. No real payment will be collected.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      <View style={styles.bottomContainer}>
        <View style={styles.bottomPriceContainer}>
          <Text style={styles.bottomLabel}>Total Amount</Text>
          <Text style={styles.bottomPrice}>{money(totalAmount)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, submitting && styles.disabledButton]}
          disabled={submitting}
          activeOpacity={0.8}
          onPress={handleConfirmBooking}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 34,
    color: '#166534',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerRightSpace: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  iconContainer: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },
  icon: {
    fontSize: 32,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 22,
  },
  groundCard: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  groundName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
  },
  groundSport: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
    marginTop: 5,
  },
  groundLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  couponButton: {
    backgroundColor: '#166534',
    paddingHorizontal: 18,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
  },
  couponButtonText: { color: '#FFFFFF', fontWeight: '700' },
  couponError: { color: '#DC2626', fontSize: 12, marginTop: 9 },
  couponSuccess: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 9,
  },
  couponHint: { color: '#6B7280', fontSize: 11, marginTop: 10 },
  discountValue: { color: '#15803D' },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  value: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 21,
    fontWeight: '700',
    color: '#166534',
  },
  noteCard: {
    padding: 15,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  noteText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 19,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  bottomPrice: {
    fontSize: 21,
    fontWeight: '700',
    color: '#111827',
    marginTop: 3,
  },
  confirmButton: {
    backgroundColor: '#166534',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    minWidth: 165,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  errorTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#DC2626',
  },
  errorDescription: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#166534',
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default BookingSummaryScreen;

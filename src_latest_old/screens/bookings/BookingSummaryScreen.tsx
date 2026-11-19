import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { grounds } from '../../data/grounds';
import { useBookings } from '../../context/BookingContext';
import { Booking } from '../../types/booking';

type Props = NativeStackScreenProps<MainStackParamList, 'BookingSummary'>;
const GST_RATE = 0.18;
const COUPONS: Record<string, { type: 'flat' | 'percent'; value: number; minAmount: number; maxDiscount?: number }> = {
  PLAY10: { type: 'percent', value: 10, minAmount: 300, maxDiscount: 200 },
  SPORT20: { type: 'percent', value: 20, minAmount: 500, maxDiscount: 300 },
  SAVE100: { type: 'flat', value: 100, minAmount: 800 },
};
const money = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export default function BookingSummaryScreen({ route, navigation }: Props) {
  const {
    groundId, sportId, bookingDate, startTime, endTime,
    startMinutes, endMinutes, durationMinutes, price,
  } = route.params;
  const { createBooking } = useBookings();
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const ground = grounds.find(item => item.id === groundId);
  const sport = ground?.sports.find(item => item.sportId === sportId);

  if (!ground || !sport || !Number.isFinite(price) || price <= 0) {
    return <SafeAreaView style={styles.container}><View style={styles.center}>
      <Text style={styles.heading}>Booking details not found</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}><Text style={styles.buttonText}>Go Back</Text></TouchableOpacity>
    </View></SafeAreaView>;
  }

  const offer = COUPONS[appliedCoupon];
  const discount = offer ? round(Math.min(price, offer.maxDiscount ?? Infinity, offer.type === 'percent' ? price * offer.value / 100 : offer.value)) : 0;
  const taxable = round(price - discount);
  const gst = round(taxable * GST_RATE);
  const total = round(taxable + gst);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const found = COUPONS[code];
    if (!found) { setCouponError('Invalid coupon. Try PLAY10, SPORT20 or SAVE100.'); return; }
    if (price < found.minAmount) { setCouponError(`Minimum booking price ${money(found.minAmount)} required.`); return; }
    setAppliedCoupon(code);
    setCouponInput(code);
    setCouponError('');
  };

  const confirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    const booking: Booking = {
      id: `BOOK-${Date.now()}`,
      bookingNumber: `SA${Date.now().toString().slice(-8)}`,
      groundId: ground.id,
      groundName: ground.name,
      sportId: sport.sportId,
      sportName: sport.sportName,
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
        Alert.alert('Slot Unavailable', 'This time was just booked. Please select another time.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        return;
      }
      Alert.alert('Booking Confirmed!', `Booking ID: ${booking.bookingNumber}\n${sport.sportName} · ${startTime} - ${endTime}`, [
        { text: 'View My Bookings', onPress: () => navigation.navigate('MainTabs', { screen: 'Bookings' }) },
      ], { cancelable: false });
    } catch (e) {
      Alert.alert('Booking Failed', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Summary</Text><View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Review Your Booking</Text>
        <Text style={styles.subtitle}>Please verify the details before confirmation.</Text>
        <View style={styles.venue}>
          <Text style={styles.venueName}>{ground.name}</Text>
          <Text style={styles.sport}>{sport.icon} {sport.sportName}</Text>
          <Text style={styles.muted}>📍 {ground.location}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>
          <Row label="Date" value={formatDate(bookingDate)} />
          <Row label="Time" value={`${startTime} – ${endTime}`} />
          <Row label="Duration" value={durationMinutes === 120 ? '2 Hours' : durationMinutes === 240 ? '4 Hours' : 'Full Day'} />
          <Row label="Sport" value={sport.sportName} />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Apply Coupon</Text>
          <View style={styles.couponRow}>
            <TextInput value={couponInput} onChangeText={value => { setCouponInput(value.toUpperCase()); setAppliedCoupon(''); setCouponError(''); }} placeholder="Enter coupon code" autoCapitalize="characters" style={styles.input} editable={!submitting} />
            <TouchableOpacity onPress={applyCoupon} style={styles.couponButton}><Text style={styles.buttonText}>Apply</Text></TouchableOpacity>
          </View>
          {!!couponError && <Text style={styles.error}>{couponError}</Text>}
          {!!appliedCoupon && <Text style={styles.success}>{appliedCoupon} applied — you save {money(discount)}</Text>}
          <Text style={styles.hint}>Demo coupons: PLAY10, SPORT20, SAVE100</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Details</Text>
          <Row label="Fixed session price" value={money(price)} />
          <Row label={`Coupon discount${appliedCoupon ? ` (${appliedCoupon})` : ''}`} value={`- ${money(discount)}`} green />
          <Row label="Taxable amount" value={money(taxable)} />
          <Row label="GST (18%)" value={`+ ${money(gst)}`} />
          <View style={styles.divider} />
          <Row label="Total Payable" value={money(total)} strong />
        </View>
        <View style={styles.note}><Text style={styles.noteTitle}>Demo booking</Text><Text style={styles.muted}>No real payment will be collected. Your confirmed booking will reserve this sport and time.</Text></View>
      </ScrollView>
      <View style={styles.bottom}>
        <View><Text style={styles.muted}>TOTAL AMOUNT</Text><Text style={styles.total}>{money(total)}</Text></View>
        <TouchableOpacity disabled={submitting} onPress={confirm} style={[styles.confirm, submitting && { opacity: 0.6 }]}>
          {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Confirm Booking</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, green, strong }: { label: string; value: string; green?: boolean; strong?: boolean }) {
  return <View style={styles.row}><Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text><Text style={[styles.rowValue, green && { color: '#15803D' }, strong && styles.strong]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F7' },
  header: { height: 56, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, borderBottomWidth: 1, borderBottomColor: '#E8EEE9' },
  back: { fontSize: 32, color: '#14532D' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#132B20' },
  content: { padding: 17, paddingBottom: 125 },
  heading: { color: '#132B20', fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  subtitle: { color: '#78877C', fontSize: 11, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  venue: { backgroundColor: '#EAF5ED', padding: 16, borderRadius: 14, marginBottom: 13 },
  venueName: { color: '#132B20', fontSize: 17, fontWeight: '900' },
  sport: { color: '#166534', fontSize: 12, fontWeight: '800', marginTop: 6 },
  muted: { color: '#718078', fontSize: 11, marginTop: 6 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E5EBE6', marginBottom: 13 },
  cardTitle: { color: '#132B20', fontSize: 15, fontWeight: '900', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 13 },
  rowLabel: { flex: 1, color: '#718078', fontSize: 12 },
  rowValue: { flex: 1, color: '#132B20', fontSize: 12, fontWeight: '800', textAlign: 'right', marginLeft: 8 },
  strong: { color: '#132B20', fontWeight: '900', fontSize: 15 },
  couponRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, height: 45, borderWidth: 1, borderColor: '#D8E2DA', borderRadius: 9, paddingHorizontal: 11, color: '#132B20' },
  couponButton: { backgroundColor: '#14532D', borderRadius: 9, paddingHorizontal: 17, justifyContent: 'center' },
  buttonText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  error: { color: '#DC2626', fontSize: 11, marginTop: 8 },
  success: { color: '#15803D', fontSize: 11, fontWeight: '800', marginTop: 8 },
  hint: { color: '#8A978D', fontSize: 10, marginTop: 9 },
  divider: { height: 1, backgroundColor: '#E8EEE9', marginBottom: 13 },
  note: { backgroundColor: '#FFF8E7', padding: 14, borderRadius: 12 },
  noteTitle: { color: '#92400E', fontSize: 12, fontWeight: '900' },
  bottom: { backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5EBE6', paddingHorizontal: 17, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  total: { color: '#132B20', fontSize: 19, fontWeight: '900', marginTop: 3 },
  confirm: { backgroundColor: '#14532D', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 11, minWidth: 155, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25 },
  button: { backgroundColor: '#14532D', padding: 13, borderRadius: 10, marginTop: 15 },
});

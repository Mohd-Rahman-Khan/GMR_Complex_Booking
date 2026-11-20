import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useAdmin } from '../../context/AdminContext';
import { apiRequest } from '../../services/api';

type Props = NativeStackScreenProps<AdminStackParamList, 'SportDetails'>;

type PeakHour = {
  startTime: string;
  endTime: string;
  price?: number;
};

type SportItem = {
  _id: string;
  name: string;
  icon?: string;
  description?: string;
  bookingWindowDays?: number;
  primarySubAdminId?: any;
  slots?: any[];
  isActive?: boolean;
  pricing?: {
    weekdayPrice?: number;
    weekdayPeakPrice?: number;
    weekendPrice?: number;
    weekendPeakPrice?: number;
    weekendDays?: number[];
    peakHours?: PeakHour[];
  };
};

type ComplexItem = {
  _id: string;
  name: string;
  sports?: SportItem[];
  unavailableRanges?: any[];
};

type UnavailableRange = {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
};

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

const fmt = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(
    2,
    '0',
  )}`;

const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const getResponseData = (response: any) => response?.data ?? response;

const getId = (value: any) => String(value?._id ?? value?.id ?? value ?? '');

const formatDate = (value: any) => {
  if (!value) return '';

  const dateString = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return dateString;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default function SportDetailsScreen({ route, navigation }: Props) {
  const { token } = useAuth();
  const { admins } = useAdmin();

  const { complexId, sportId } = route.params;

  const [complex, setComplex] = useState<ComplexItem | null>(null);
  const [sport, setSport] = useState<SportItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bookingWindowDays, setBookingWindowDays] = useState(30);
  const [customBookingDays, setCustomBookingDays] = useState('');

  const [peakStart, setPeakStart] = useState('17:00');
  const [peakEnd, setPeakEnd] = useState('21:00');

  const [weekendDays, setWeekendDays] = useState<number[]>([0, 6]);

  const [start, setStart] = useState('06:00');
  const [end, setEnd] = useState('22:00');
  const [duration, setDuration] = useState('120');
  const [slotPrice, setSlotPrice] = useState('');

  const [unavailableRanges, setUnavailableRanges] = useState<
    UnavailableRange[]
  >([]);
  const [unavailableFrom, setUnavailableFrom] = useState('');
  const [unavailableTo, setUnavailableTo] = useState('');
  const [unavailableReason, setUnavailableReason] = useState('');

  const [savingSection, setSavingSection] = useState('');

  const loadData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      Alert.alert('Session Expired', 'Please login again.');
      return;
    }

    try {
      setLoading(true);

      const [complexResponse, sportsResponse] = await Promise.all([
        apiRequest<any>(`/complexes/${complexId}`, {
          method: 'GET',
          token,
        }),
        apiRequest<any>('/sports/my', {
          method: 'GET',
          token,
        }),
      ]);

      const complexData = getResponseData(complexResponse);
      const selectedComplex = complexData?.complex ?? complexData;

      const sportsData = getResponseData(sportsResponse);
      const allSports = sportsData?.sports ?? [];

      // /sports/my may return populated complexId or plain ObjectId.
      const selectedSport =
        allSports.find((item: any) => {
          const itemComplexId = getId(item.complexId);
          return (
            String(item._id) === String(sportId) &&
            itemComplexId === String(complexId)
          );
        }) ??
        (selectedComplex?.sports || []).find(
          (item: any) => String(item._id) === String(sportId),
        );

      if (!selectedComplex?._id || !selectedSport?._id) {
        setComplex(selectedComplex || null);
        setSport(null);
        return;
      }

      setComplex(selectedComplex);
      setSport(selectedSport);

      setBookingWindowDays(Number(selectedSport.bookingWindowDays) || 30);

      setWeekendDays(
        selectedSport.pricing?.weekendDays?.length
          ? selectedSport.pricing.weekendDays
          : [0, 6],
      );

      // Complex unavailable ranges are stored in YYYY-MM-DD format.
      setUnavailableRanges(
        (selectedComplex.unavailableRanges || []).map((item: any) => ({
          id: getId(item._id) || String(Math.random()),
          fromDate: formatDate(item.fromDate),
          toDate: formatDate(item.toDate),
          reason: item.reason || '',
        })),
      );
    } catch (error: any) {
      Alert.alert(
        'Unable to Load',
        error?.message || 'Unable to fetch sport details.',
      );
    } finally {
      setLoading(false);
    }
  }, [token, complexId, sportId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const pricing = sport?.pricing || {};

  const team = useMemo(
    () =>
      admins.filter(
        a =>
          String(a.complexId) === String(complexId) &&
          a.role === 'sport_admin' &&
          a.isActive,
      ),
    [admins, complexId],
  );

  const assignedId = getId(sport?.primarySubAdminId);

  const assigned = useMemo(() => {
    if (!sport?.primarySubAdminId) return null;

    if (typeof sport.primarySubAdminId === 'object') {
      return sport.primarySubAdminId;
    }

    return admins.find(a => String(a.id) === assignedId) || null;
  }, [sport?.primarySubAdminId, admins, assignedId]);

  const saveBookingWindow = async (days: number) => {
    const parsedDays = Number(days);

    if (!Number.isInteger(parsedDays) || parsedDays < 1 || parsedDays > 365) {
      Alert.alert(
        'Invalid Booking Window',
        'Booking window 1 se 365 days ke beech honi chahiye.',
      );
      return;
    }

    if (!token || !sport) return;

    try {
      setSavingSection('booking');

      const payload = {
        days: parsedDays,
      };

      console.log('BOOKING WINDOW PAYLOAD:', payload);

      await apiRequest(`/sports/${sport._id}/booking-window`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(payload),
      });

      setBookingWindowDays(parsedDays);
      setCustomBookingDays('');

      Alert.alert(
        'Success',
        `Booking window ${parsedDays} days update ho gayi.`,
      );

      await loadData();
    } catch (error: any) {
      console.log('BOOKING WINDOW ERROR:', error);

      Alert.alert(
        'Update Failed',
        error?.message || 'Unable to update booking window.',
      );
    } finally {
      setSavingSection('');
    }
  };

  const saveCustomBookingWindow = () => {
    if (!customBookingDays.trim()) {
      Alert.alert('Required', 'Please enter booking days.');
      return;
    }

    const days = Number(customBookingDays);

    saveBookingWindow(days);
    setCustomBookingDays('');
  };

  const savePricing = async (
    nextPeakHours: PeakHour[],
    nextWeekendDays: number[],
  ) => {
    if (!token || !sport) return;

    try {
      setSavingSection('pricing');

      const body = {
        weekdayPrice: Number(pricing.weekdayPrice) || 0,
        weekdayPeakPrice: Number(pricing.weekdayPeakPrice) || 0,
        weekendPrice: Number(pricing.weekendPrice) || 0,
        weekendPeakPrice: Number(pricing.weekendPeakPrice) || 0,

        weekendDays: nextWeekendDays,

        peakHours: nextPeakHours.map(item => ({
          startTime: item.startTime,
          endTime: item.endTime,
          price: Number(item.price) || 0,
        })),
      };

      console.log('PEAK HOURS REQUEST:', JSON.stringify(body, null, 2));

      await apiRequest(`/sports/${sport._id}/pricing`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      });

      Alert.alert('Success', 'Pricing configuration updated successfully.');

      await loadData();
    } catch (error: any) {
      console.log('PRICING ERROR:', error);

      Alert.alert(
        'Pricing Update Failed',
        error?.message || 'Unable to save pricing.',
      );
    } finally {
      setSavingSection('');
    }
  };

  const addPeakHours = () => {
    if (!isValidTime(peakStart) || !isValidTime(peakEnd)) {
      Alert.alert('Invalid Time', '24-hour format use karein. Example: 17:00');
      return;
    }

    const startMinutes = toMinutes(peakStart);
    const endMinutes = toMinutes(peakEnd);

    if (startMinutes >= endMinutes) {
      Alert.alert(
        'Invalid Range',
        'Peak end time, start time ke baad hona chahiye.',
      );
      return;
    }

    const existing: PeakHour[] = pricing.peakHours || [];

    const hasOverlap = existing.some(item => {
      const oldStart = toMinutes(item.startTime);
      const oldEnd = toMinutes(item.endTime);

      return startMinutes < oldEnd && endMinutes > oldStart;
    });

    if (hasOverlap) {
      Alert.alert(
        'Timing Overlap',
        'Ye timing existing peak hours ke saath overlap kar rahi hai.',
      );
      return;
    }

    const nextPeakHours: PeakHour[] = [
      ...existing,
      {
        startTime: peakStart,
        endTime: peakEnd,
        price: 0,
      },
    ].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

    Alert.alert(
      'Confirm Peak Hours',
      `${peakStart} - ${peakEnd} peak hours add karna hai?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => savePricing(nextPeakHours, weekendDays),
        },
      ],
    );
  };

  const removePeakHours = (item: PeakHour) => {
    Alert.alert(
      'Remove peak hours?',
      'Is timing ko normal pricing ke according calculate kiya jayega.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const next = (pricing.peakHours || []).filter(
              x =>
                !(x.startTime === item.startTime && x.endTime === item.endTime),
            );

            savePricing(next, weekendDays);
          },
        },
      ],
    );
  };

  const toggleWeekendDay = (day: number) => {
    const next = weekendDays.includes(day)
      ? weekendDays.filter(x => x !== day)
      : [...weekendDays, day].sort((a, b) => a - b);

    setWeekendDays(next);
    savePricing(pricing.peakHours || [], next);
  };

  const saveSlots = async (nextSlots: any[]) => {
    if (!token || !sport) return;

    try {
      setSavingSection('slots');

      await apiRequest(`/sports/${sport._id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ slots: nextSlots }),
      });

      await loadData();
    } catch (error: any) {
      Alert.alert(
        'Slot Update Failed',
        error?.message || 'Unable to update slots.',
      );
    } finally {
      setSavingSection('');
    }
  };

  const saveSlot = () => {
    if (!isValidTime(start) || !isValidTime(end)) {
      Alert.alert('Invalid time', 'Start/end time check karein.');
      return;
    }

    const a = toMinutes(start);
    const b = toMinutes(end);
    const d = Number(duration);
    const price = slotPrice.trim()
      ? Number(slotPrice)
      : Number(pricing.weekdayPrice) || 0;

    if (
      a >= b ||
      !Number.isFinite(d) ||
      d < 15 ||
      d > 720 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      Alert.alert(
        'Invalid slot',
        'Start/end time, duration (15-720 min) aur price check karein.',
      );
      return;
    }

    const existing = sport?.slots || [];
    const generated: any[] = [];

    for (let cursor = a; cursor + d <= b; cursor += d) {
      const slotEnd = cursor + d;

      const overlaps = existing.some((item: any) => {
        if (item.isActive === false) return false;

        const oldStart = toMinutes(item.startTime);
        const oldEnd = toMinutes(item.endTime);

        return cursor < oldEnd && slotEnd > oldStart;
      });

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
        name: `${fmt(cursor)} - ${fmt(slotEnd)}`,
        startTime: fmt(cursor),
        endTime: fmt(slotEnd),
        duration: d,
        price,
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

    const nextSlots = [...existing, ...generated].sort(
      (x: any, y: any) => toMinutes(x.startTime) - toMinutes(y.startTime),
    );

    Alert.alert(
      'Confirm Slots',
      `${generated.length} slots create honge. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Slots',
          onPress: async () => {
            await saveSlots(nextSlots);
            setSlotPrice('');
          },
        },
      ],
    );
  };

  const removeSlot = (slot: any) => {
    Alert.alert(
      'Remove slot?',
      'This slot will no longer be offered for booking.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const next = (sport?.slots || []).filter(
              (item: any) => getId(item._id) !== getId(slot._id),
            );
            saveSlots(next);
          },
        },
      ],
    );
  };

  const toggleSlot = (slot: any) => {
    const next = (sport?.slots || []).map((item: any) =>
      getId(item._id) === getId(slot._id)
        ? { ...item, isActive: item.isActive === false }
        : item,
    );

    saveSlots(next);
  };

  const assign = async (adminId: string | null) => {
    if (!token || !sport) return;

    try {
      setSavingSection('admin');

      await apiRequest(`/sports/${sport._id}/subadmin`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ adminId }),
      });

      Alert.alert(
        'Success',
        adminId ? 'Primary subadmin assigned.' : 'Assignment removed.',
      );

      await loadData();
    } catch (error: any) {
      Alert.alert(
        'Assignment Failed',
        error?.message || 'Could not assign subadmin.',
      );
    } finally {
      setSavingSection('');
    }
  };

  const addUnavailableRange = async () => {
    if (!unavailableFrom.trim() || !unavailableTo.trim()) {
      Alert.alert('Required', 'Please enter both dates.');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(unavailableFrom) || !dateRegex.test(unavailableTo)) {
      Alert.alert(
        'Invalid Date',
        'Date format YYYY-MM-DD use karein. Example: 2026-11-25',
      );
      return;
    }

    const isValidDate = (value: string) => {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

      if (!match) return false;

      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);

      const date = new Date(year, month - 1, day);

      return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      );
    };

    if (!isValidDate(unavailableFrom) || !isValidDate(unavailableTo)) {
      Alert.alert(
        'Invalid Date',
        'Please enter a valid date in YYYY-MM-DD format. Example: 2026-11-25',
      );
      return;
    }

    if (unavailableTo < unavailableFrom) {
      Alert.alert(
        'Invalid Range',
        'Unavailable To date, From date ke baad honi chahiye.',
      );
      return;
    }

    if (!token || !complexId) {
      Alert.alert('Error', 'Session or complex information missing.');
      return;
    }

    try {
      setSavingSection('unavailable');

      const payload = {
        fromDate: unavailableFrom,
        toDate: unavailableTo,
        reason: unavailableReason.trim() || 'Not available',
      };

      const response = await apiRequest(
        `/complexes/${complexId}/unavailable-dates`,
        {
          method: 'POST',
          token,
          body: JSON.stringify(payload),
        },
      );

      const responseData = getResponseData(response);

      if (Array.isArray(responseData?.unavailableRanges)) {
        setUnavailableRanges(
          responseData.unavailableRanges.map((item: any) => ({
            id: getId(item._id),
            fromDate: formatDate(item.fromDate),
            toDate: formatDate(item.toDate),
            reason: item.reason || '',
          })),
        );
      } else {
        await loadData();
      }

      setUnavailableFrom('');
      setUnavailableTo('');
      setUnavailableReason('');

      Alert.alert('Success', 'Ground dates successfully blocked.');
    } catch (error: any) {
      console.log('ADD UNAVAILABLE DATE ERROR:', error);

      Alert.alert(
        'Unable to Block Dates',
        error?.message || 'Something went wrong.',
      );
    } finally {
      setSavingSection('');
    }
  };

  const removeUnavailableRange = async (rangeId: string) => {
    if (!token || !complexId || !rangeId) return;

    Alert.alert(
      'Remove Blocked Dates?',
      'Are you sure you want to make these dates available again?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setSavingSection('unavailable');

              const response = await apiRequest(
                `/complexes/${complexId}/unavailable-dates/${rangeId}`,
                {
                  method: 'DELETE',
                  token,
                },
              );

              const responseData = getResponseData(response);

              if (Array.isArray(responseData?.unavailableRanges)) {
                setUnavailableRanges(
                  responseData.unavailableRanges.map((item: any) => ({
                    id: getId(item._id),
                    fromDate: formatDate(item.fromDate),
                    toDate: formatDate(item.toDate),
                    reason: item.reason || '',
                  })),
                );
              } else {
                await loadData();
              }

              Alert.alert('Success', 'Blocked dates removed successfully.');
            } catch (error: any) {
              console.log('REMOVE UNAVAILABLE DATE ERROR:', error);

              Alert.alert(
                'Remove Failed',
                error?.message || 'Unable to remove blocked dates.',
              );
            } finally {
              setSavingSection('');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={S.center}>
        <ActivityIndicator size="large" color={G} />
        <Text style={S.loadingText}>Loading sport details...</Text>
      </View>
    );
  }

  if (!complex) {
    return (
      <View style={S.center}>
        <Text style={S.notFound}>Complex not found</Text>
        <TouchableOpacity style={S.retryButton} onPress={loadData}>
          <Text style={S.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!sport) {
    return (
      <View style={S.center}>
        <Text style={S.notFound}>Sport not found</Text>
        <Text style={S.loadingText}>Complex ID: {complexId}</Text>
        <Text style={S.loadingText}>Sport ID: {sportId}</Text>
        <TouchableOpacity style={S.retryButton} onPress={loadData}>
          <Text style={S.buttonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={S.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={S.backButtonText}>Go Back</Text>
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

        <View style={{ flex: 1 }}>
          <Text style={S.title}>
            {sport.icon || '🏅'} {sport.name}
          </Text>
          <Text style={S.headerSub}>{complex.name} • Sport settings</Text>
        </View>

        <TouchableOpacity onPress={loadData}>
          <Text style={S.refresh}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={S.content}>
        {/* PRICING */}
        <View style={S.card}>
          <Text style={S.section}>Dynamic pricing configuration</Text>
          <Text style={S.hint}>
            Rates Sports & Pricing screen se manage karein. Yahan configured
            pricing dekh sakte hain.
          </Text>

          {[
            ['Weekday Normal', pricing.weekdayPrice],
            ['Weekday Peak', pricing.weekdayPeakPrice],
            ['Weekend Normal', pricing.weekendPrice],
            ['Weekend Peak', pricing.weekendPeakPrice],
          ].map(([label, value]: any) => (
            <View style={S.rateRow} key={label}>
              <Text style={S.rateLabel}>{label}</Text>
              <Text style={S.rateValue}>₹{Number(value) || 0}/hr</Text>
            </View>
          ))}

          {savingSection === 'pricing' && (
            <ActivityIndicator color={G} style={{ marginTop: 10 }} />
          )}
        </View>

        {/* PEAK HOURS */}
        <View style={S.card}>
          <Text style={S.section}>Peak hours</Text>
          <Text style={S.hint}>
            Peak timings ke andar peak pricing apply hogi.
          </Text>

          <Text style={S.label}>Peak start time (24-hour)</Text>
          <TextInput
            value={peakStart}
            onChangeText={setPeakStart}
            placeholder="17:00"
            style={S.input}
          />

          <Text style={S.label}>Peak end time (24-hour)</Text>
          <TextInput
            value={peakEnd}
            onChangeText={setPeakEnd}
            placeholder="21:00"
            style={S.input}
          />

          <TouchableOpacity
            onPress={addPeakHours}
            style={S.button}
            disabled={!!savingSection}
          >
            <Text style={S.buttonText}>＋ Add Peak Hours</Text>
          </TouchableOpacity>

          <Text style={S.subHeading}>Configured peak timings</Text>

          {(pricing.peakHours || []).length === 0 ? (
            <View style={S.empty}>
              <Text style={S.hint}>No peak hours configured.</Text>
            </View>
          ) : (
            pricing.peakHours!.map(item => (
              <View key={`${item.startTime}-${item.endTime}`} style={S.peakRow}>
                <View style={{ flex: 1 }}>
                  <Text style={S.peakTime}>
                    {item.startTime} – {item.endTime}
                  </Text>
                  <Text style={S.peakCaption}>Peak pricing active</Text>
                </View>

                <TouchableOpacity
                  onPress={() => removePeakHours(item)}
                  disabled={!!savingSection}
                >
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
                  disabled={!!savingSection}
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

          <Text style={S.label}>Booking window (days)</Text>

          <View style={S.customBookingRow}>
            <TextInput
              value={customBookingDays}
              onChangeText={value =>
                setCustomBookingDays(value.replace(/[^0-9]/g, ''))
              }
              placeholder={`Current: ${bookingWindowDays} days`}
              placeholderTextColor="#9AA69D"
              keyboardType="number-pad"
              maxLength={3}
              style={[S.input, S.customBookingInput]}
            />

            <TouchableOpacity
              style={S.customBookingButton}
              onPress={saveCustomBookingWindow}
              disabled={!!savingSection}
            >
              {savingSection === 'booking' ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={S.customBookingButtonText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={S.bookingWindowInfo}>
            <Text style={S.bookingWindowInfoText}>
              Customers can book up to {bookingWindowDays} days in advance.
            </Text>
          </View>
        </View>

        {/* SLOTS */}
        {/* <View style={S.card}>
          <Text style={S.section}>Manage booking slots</Text>
          <Text style={S.hint}>
            Time range aur duration select karke multiple slots create karein.
          </Text>

          <Text style={S.label}>Start time</Text>
          <TextInput
            value={start}
            onChangeText={setStart}
            placeholder="06:00"
            style={S.input}
          />

          <Text style={S.label}>End time</Text>
          <TextInput
            value={end}
            onChangeText={setEnd}
            placeholder="22:00"
            style={S.input}
          />

          <Text style={S.label}>Slot duration (minutes)</Text>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            placeholder="120"
            style={S.input}
          />

          <Text style={S.label}>Price per slot (₹)</Text>
          <TextInput
            value={slotPrice}
            onChangeText={setSlotPrice}
            keyboardType="number-pad"
            placeholder="Default weekday hourly rate"
            style={S.input}
          />

          <TouchableOpacity
            onPress={saveSlot}
            style={S.button}
            disabled={!!savingSection}
          >
            {savingSection === 'slots' ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={S.buttonText}>＋ Generate Slots</Text>
            )}
          </TouchableOpacity>

          <Text style={S.subHeading}>
            Configured slots ({sport.slots?.length || 0})
          </Text>

          {!sport.slots?.length ? (
            <View style={S.empty}>
              <Text style={S.hint}>No slots configured yet.</Text>
            </View>
          ) : (
            sport.slots.map((slot: any) => (
              <View key={getId(slot._id)} style={S.slotCard}>
                <View style={{ flex: 1 }}>
                  <Text style={S.slotTime}>
                    {slot.startTime} – {slot.endTime}
                  </Text>
                  <Text style={S.hint}>
                    {slot.duration} minutes • ₹{slot.price}
                  </Text>
                  <Text
                    style={[
                      S.slotStatus,
                      {
                        color: slot.isActive === false ? '#DC2626' : '#166534',
                      },
                    ]}
                  >
                    {slot.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => toggleSlot(slot)}
                  disabled={!!savingSection}
                  style={S.smallAction}
                >
                  <Text style={S.smallActionText}>
                    {slot.isActive === false ? 'Activate' : 'Deactivate'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => removeSlot(slot)}
                  disabled={!!savingSection}
                >
                  <Text style={S.remove}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View> */}

        {/* UNAVAILABLE DATES */}
        <View style={S.card}>
          <View style={S.unavailableHeader}>
            <View style={{ flex: 1 }}>
              <Text style={S.section}>Ground Availability</Text>
              <Text style={S.hint}>
                Dates when the ground will not be available for any sport.
              </Text>
            </View>
            <View style={S.unavailableBadge}>
              <Text style={S.unavailableBadgeText}>BLOCK DATES</Text>
            </View>
          </View>

          <Text style={S.label}>Unavailable From</Text>
          <TextInput
            value={unavailableFrom}
            onChangeText={setUnavailableFrom}
            placeholder="YYYY-MM-DD (e.g. 2026-11-25)"
            style={S.input}
          />

          <Text style={S.label}>Unavailable To</Text>
          <TextInput
            value={unavailableTo}
            onChangeText={setUnavailableTo}
            placeholder="YYYY-MM-DD (e.g. 2026-11-27)"
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
            onPress={addUnavailableRange}
            disabled={!!savingSection}
          >
            {savingSection === 'unavailable' ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={S.buttonText}>＋ Block Ground Dates</Text>
            )}
          </TouchableOpacity>

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
                  <Text style={S.unavailableStatus}>● Preview only</Text>
                </View>

                <TouchableOpacity
                  onPress={() => removeUnavailableRange(item.id)}
                  disabled={!!savingSection}
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

          {team.length === 0 ? (
            <View style={S.empty}>
              <Text style={S.hint}>
                No active sport subadmins found in the local admin list. Check
                your backend admin listing and IDs.
              </Text>
            </View>
          ) : (
            team.map(admin => (
              <TouchableOpacity
                key={admin.id}
                onPress={() =>
                  assign(assignedId === String(admin.id) ? null : admin.id)
                }
                disabled={!!savingSection}
                style={[
                  S.choice,
                  assignedId === String(admin.id) && S.selected,
                ]}
              >
                <Text style={S.choiceName}>{admin.name}</Text>
                <Text style={S.assignText}>
                  {assignedId === String(admin.id) ? '✓ Assigned' : 'Assign'}
                </Text>
              </TouchableOpacity>
            ))
          )}

          {sport.primarySubAdminId && (
            <TouchableOpacity
              onPress={() => assign(null)}
              disabled={!!savingSection}
              style={{ marginTop: 12 }}
            >
              <Text style={S.remove}>Remove assignment</Text>
            </TouchableOpacity>
          )}

          {savingSection === 'admin' && (
            <ActivityIndicator color={G} style={{ marginTop: 12 }} />
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
    backgroundColor: BG,
    padding: 20,
  },
  loadingText: {
    color: '#718078',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  notFound: {
    color: '#17251B',
    fontSize: 18,
    fontWeight: '900',
  },
  retryButton: {
    backgroundColor: G,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
  },
  backButton: {
    padding: 12,
    marginTop: 10,
  },
  backButtonText: {
    color: G,
    fontWeight: '800',
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
  back: {
    color: '#FFF',
    fontSize: 34,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  headerSub: {
    color: '#D1FAE5',
    fontSize: 11,
    marginTop: 4,
  },
  refresh: {
    color: '#FFF',
    fontSize: 25,
    fontWeight: '900',
  },
  content: {
    padding: 17,
    paddingBottom: 40,
  },
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
  buttonText: {
    color: '#FFF',
    fontWeight: '900',
  },
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
  dayTextActive: {
    color: G,
  },
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
  personName: {
    fontWeight: '900',
    color: '#17251B',
  },
  choice: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4EBE5',
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  choiceName: {
    color: '#17251B',
    fontWeight: '700',
    flex: 1,
  },
  assignText: {
    color: G,
    fontWeight: '900',
  },
  remove: {
    color: '#DC2626',
    fontWeight: '900',
    fontSize: 11,
  },
  empty: {
    backgroundColor: '#F8FAF8',
    padding: 15,
    borderRadius: 12,
  },
  slotCard: {
    backgroundColor: '#FBFDFC',
    padding: 13,
    borderRadius: 13,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: '#E4EBE5',
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '900',
    color: '#17251B',
  },
  slotStatus: {
    fontSize: 9,
    fontWeight: '900',
    marginTop: 3,
  },
  smallAction: {
    backgroundColor: '#E7F7E9',
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 8,
  },
  smallActionText: {
    color: G,
    fontSize: 10,
    fontWeight: '900',
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
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    padding: 11,
    marginTop: 12,
  },
  unavailableInfoText: {
    color: '#9A3412',
    fontSize: 10,
    lineHeight: 16,
  },
  blockButton: {
    backgroundColor: '#B91C1C',
    padding: 14,
    borderRadius: 11,
    alignItems: 'center',
    marginTop: 5,
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
    minWidth: 75,
    alignItems: 'center',
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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MainStackParamList } from '../../navigation/types';
import { useAdmin } from '../../context/AdminContext';
import DateSelector from '../../components/DateSelector';

import { apiRequest } from '../../services/api';

import {
  generateAvailableStartTimes,
  timeToMinutes,
} from '../../services/availabilityService';

import {
  calculateDynamicPrice,
  getSportPricing,
} from '../../utils/adminPricing';

type Props = NativeStackScreenProps<MainStackParamList, 'SlotBooking'>;

type BookingType = 'halfDay' | 'fullDay' | 'custom';

type ApiSport = {
  _id: string;
  name: string;
  icon?: string;
  image?: string;
  slots?: any[];
  pricing?: any;
  isActive?: boolean;
};

type ApiComplex = {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  image?: string;
  openingTime: string;
  closingTime: string;
  sports?: ApiSport[];
  unavailableRanges?: {
    id?: string;
    fromDate: string;
    toDate: string;
    reason?: string;
  }[];
};

type BookedSlot = {
  id: string;
  groundId: string;
  sportId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  status: string;
};

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

const displayTime = (minutes: number) => {
  const normalized = minutes % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(
    2,
    '0',
  )} ${suffix}`;
};

const timeStringToMinutes = (time: string) => {
  if (!time) {
    return 0;
  }

  // Supports both 24-hour and 12-hour time strings.
  const normalized = time.trim().toUpperCase();

  const twelveHourMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);

  if (twelveHourMatch) {
    let hour = Number(twelveHourMatch[1]);
    const minute = Number(twelveHourMatch[2]);
    const suffix = twelveHourMatch[3];

    if (suffix === 'PM' && hour !== 12) {
      hour += 12;
    }

    if (suffix === 'AM' && hour === 12) {
      hour = 0;
    }

    return hour * 60 + minute;
  }

  return timeToMinutes(time);
};

const SlotBookingScreen = ({ navigation, route }: Props) => {
  const { groundId, sportId } = route.params;

  const { complexes } = useAdmin();

  // -----------------------------------------------
  // STATES
  // -----------------------------------------------

  const [ground, setGround] = useState<ApiComplex | null>(null);
  const [selectedSport, setSelectedSport] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [bookedTimes, setBookedTimes] = useState<BookedSlot[]>([]);

  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [bookingType, setBookingType] = useState<BookingType>('custom');
  const [customHours, setCustomHours] = useState(2);
  const [selectedStart, setSelectedStart] = useState<number | null>(null);

  const [error, setError] = useState('');

  // -----------------------------------------------
  // 1. FETCH COMPLEX AND SPORT DETAILS
  // -----------------------------------------------

  const fetchGroundDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [complexResponse, sportsResponse]: any = await Promise.all([
        apiRequest(`/complexes/${groundId}`),
        apiRequest(`/sports/complex/${groundId}`),
      ]);

      const apiComplex = complexResponse?.data?.complex;

      const apiSports: ApiSport[] = sportsResponse?.data?.sports || [];

      const apiSport = apiSports.find(
        item => item._id === sportId && item.isActive !== false,
      );

      if (!apiComplex) {
        throw new Error('Complex not found');
      }

      if (!apiSport) {
        throw new Error('Selected sport is not available in this complex');
      }

      // Normalize API data for existing pricing helpers.
      const normalizedSport = {
        ...apiSport,
        id: apiSport._id,
        sportId: apiSport._id,
        sportName: apiSport.name,
      };

      const normalizedGround = {
        ...apiComplex,
        id: apiComplex._id,
        location: [apiComplex.address, apiComplex.city]
          .filter(Boolean)
          .join(', '),
        sports: apiSports.map(item => ({
          ...item,
          id: item._id,
          sportId: item._id,
          sportName: item.name,
        })),
      };

      setGround(normalizedGround);
      setSelectedSport(normalizedSport);
    } catch (err: any) {
      console.log('Ground details error:', err);
      setError(err?.message || 'Unable to load complex details');
    } finally {
      setLoading(false);
    }
  }, [groundId, sportId]);

  useEffect(() => {
    fetchGroundDetails();
  }, [fetchGroundDetails]);

  // -----------------------------------------------
  // 2. COMPLEX TIMINGS
  // -----------------------------------------------

  const opening = ground ? timeStringToMinutes(ground.openingTime) : 0;

  const closing = ground ? timeStringToMinutes(ground.closingTime) : 0;

  const availableGroundMinutes = closing - opening;

  const maxCustomHours = Math.floor(availableGroundMinutes / 60);

  // -----------------------------------------------
  // 3. BOOKING DURATION
  // -----------------------------------------------

  const durationMinutes =
    bookingType === 'halfDay'
      ? 4 * 60
      : bookingType === 'fullDay'
      ? availableGroundMinutes
      : customHours * 60;

  const isDurationValid =
    durationMinutes > 0 &&
    durationMinutes <= availableGroundMinutes &&
    (bookingType !== 'halfDay' || availableGroundMinutes >= 240);

  // -----------------------------------------------
  // 4. FETCH ONLY BOOKED SLOTS FROM BACKEND
  // -----------------------------------------------

  const fetchBookedSlots = useCallback(async () => {
    if (!ground || !selectedSport) {
      return;
    }

    try {
      setAvailabilityLoading(true);

      /*
       * This endpoint is used ONLY to fetch booked slots.
       * We do not use backend-generated available slots.
       *
       * Expected response:
       * {
       *   success: true,
       *   data: {
       *     bookedSlots: [
       *       {
       *         _id: "...",
       *         startTime: "08:00",
       *         endTime: "10:00",
       *         status: "confirmed"
       *       }
       *     ]
       *   }
       * }
       */

      const response: any = await apiRequest(
        `/availability/${groundId}/${sportId}?date=${selectedDate}`,
      );

      const apiBookedSlots =
        response?.data?.bookedSlots || response?.data?.bookings || [];

      const normalizedBookings: BookedSlot[] = apiBookedSlots
        .filter((item: any) => {
          const status = String(item.status || '').toLowerCase();

          // Pending and confirmed bookings block availability.
          return ['pending', 'confirmed'].includes(status);
        })
        .map((item: any, index: number) => {
          const startTime =
            item.startTime || displayTime(item.startMinutes || 0);

          const endTime = item.endTime || displayTime(item.endMinutes || 0);

          const startMinutes =
            typeof item.startMinutes === 'number'
              ? item.startMinutes
              : timeStringToMinutes(startTime);

          const endMinutes =
            typeof item.endMinutes === 'number'
              ? item.endMinutes
              : timeStringToMinutes(endTime);

          return {
            id: item._id || item.id || `booked-${index}`,
            groundId,
            sportId,
            bookingDate: item.bookingDate || selectedDate,
            startTime,
            endTime,
            startMinutes,
            endMinutes,
            status: 'confirmed',
          };
        });

      setBookedTimes(normalizedBookings);
    } catch (err: any) {
      console.log('Booked slots API error:', err);

      setBookedTimes([]);

      Alert.alert(
        'Unable to load bookings',
        err?.message || 'Could not fetch booked slots. Please retry.',
      );
    } finally {
      setAvailabilityLoading(false);
    }
  }, [ground, selectedSport, groundId, sportId, selectedDate]);

  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  // -----------------------------------------------
  // 5. LOCAL BOOKING FORMAT
  // -----------------------------------------------

  // This format is used by generateAvailableStartTimes.
  // All API booked slots are converted into the existing
  // booking structure expected by availabilityService.

  const handleContinue = () => {
    if (!ground) {
      Alert.alert('Error', 'Ground details not found.');
      return;
    }

    if (!selectedSport) {
      Alert.alert('Select Sport', 'Please select a sport.');
      return;
    }

    if (selectedStart === null) {
      Alert.alert('Select Time', 'Please select a time slot.');
      return;
    }

    // Calculate duration
    const durationMinutes =
      bookingType === 'halfDay'
        ? 240
        : bookingType === 'fullDay'
        ? 480
        : customHours * 60;

    const endMinutes = selectedStart + durationMinutes;

    // Validate selected time against closing time
    const closingMinutes = timeToMinutes(ground.closingTime);

    if (endMinutes > closingMinutes) {
      Alert.alert(
        'Invalid Time',
        'Selected duration exceeds ground closing time.',
      );
      return;
    }

    // Format time
    const formatTime = (minutes: number) => {
      const normalizedMinutes = minutes % 1440;
      const hours = Math.floor(normalizedMinutes / 60);
      const mins = normalizedMinutes % 60;

      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;

      return `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(
        2,
        '0',
      )} ${period}`;
    };

    const startTime = formatTime(selectedStart);
    const endTime = formatTime(endMinutes);

    // IMPORTANT:
    // API sport pricing ko priority do.
    // AdminContext pricing fallback rahegi.

    const adminPricing = getSportPricing(
      ground as any,
      selectedSport as any,
      complexes,
    );

    const pricing = selectedSport.pricing || adminPricing;

    console.log('Selected Sport:', selectedSport);
    console.log('API Pricing:', selectedSport.pricing);
    console.log('Admin Pricing:', adminPricing);
    console.log('Final Pricing:', pricing);

    // Calculate dynamic price
    const priceResult = calculateDynamicPrice(
      pricing,
      selectedDate,
      selectedStart,
      durationMinutes,
    );

    // Function returns PricingCalculation object
    const sessionPrice = priceResult.total;

    console.log('Price Breakdown:', priceResult.breakdown);
    console.log('Final Session Price:', sessionPrice);

    if (!Number.isFinite(sessionPrice) || sessionPrice <= 0) {
      Alert.alert(
        'Price Not Available',
        'Sport pricing is missing or invalid. Please contact the administrator.',
      );
      return;
    }

    // Navigate to Booking Summary
    navigation.navigate('BookingSummary', {
      groundId: ground._id,
      sportId: selectedSport._id,

      groundName: ground.name,
      sportName: selectedSport.name,
      sportIcon: selectedSport.icon || '',
      groundLocation: ground.address || ground.city || '',

      bookingDate: selectedDate,

      startTime,
      endTime,

      startMinutes: selectedStart,
      endMinutes,

      durationMinutes,
      price: sessionPrice,
    });
  };

  const allBookings = useMemo(() => {
    return bookedTimes.map(item => ({
      id: item.id,
      groundId: item.groundId,
      sportId: item.sportId,
      bookingDate: item.bookingDate,
      startTime: item.startTime,
      endTime: item.endTime,
      startMinutes: item.startMinutes,
      endMinutes: item.endMinutes,
      status: 'confirmed',
    }));
  }, [bookedTimes]);

  // -----------------------------------------------
  // 6. ADMIN PRICING
  // -----------------------------------------------

  const pricing = useMemo(() => {
    if (!ground || !selectedSport) {
      return null;
    }

    return getSportPricing(ground, selectedSport, complexes);
  }, [ground, selectedSport, complexes]);

  // -----------------------------------------------
  // 7. FRONTEND AVAILABLE SLOT GENERATION
  // -----------------------------------------------

  /*
   * IMPORTANT:
   * Slots are generated on the frontend.
   *
   * Example:
   * Opening: 08:00 AM
   * Closing: 11:00 PM
   * Duration: 2 hours
   *
   * Generator checks booked slot overlaps and returns
   * only valid available start times.
   */

  const availableTimes = useMemo(() => {
    if (!ground || !selectedSport || !isDurationValid || availabilityLoading) {
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
    selectedSport,
    durationMinutes,
    allBookings,
    selectedDate,
    groundId,
    sportId,
    isDurationValid,
    availabilityLoading,
  ]);

  // -----------------------------------------------
  // 8. SELECTED TIME
  // -----------------------------------------------

  const selectedTime = useMemo(() => {
    return (
      availableTimes.find(item => item.startMinutes === selectedStart) || null
    );
  }, [availableTimes, selectedStart]);

  const pricingStartMinutes =
    selectedTime?.startMinutes ?? availableTimes[0]?.startMinutes ?? opening;

  // -----------------------------------------------
  // 9. DYNAMIC PRICE CALCULATION
  // -----------------------------------------------

  const pricingCalculation = useMemo(() => {
    if (!pricing || !isDurationValid || !availableTimes.length) {
      return {
        total: 0,
        breakdown: [],
      };
    }

    return calculateDynamicPrice(
      pricing,
      selectedDate,
      pricingStartMinutes,
      durationMinutes,
    );
  }, [
    pricing,
    selectedDate,
    pricingStartMinutes,
    durationMinutes,
    isDurationValid,
    availableTimes.length,
  ]);

  const price = pricingCalculation.total;

  const hourlyPrice = useMemo(() => {
    if (!pricing || !isDurationValid || !availableTimes.length) {
      return 0;
    }

    return calculateDynamicPrice(pricing, selectedDate, pricingStartMinutes, 60)
      .total;
  }, [
    pricing,
    selectedDate,
    pricingStartMinutes,
    isDurationValid,
    availableTimes.length,
  ]);

  // -----------------------------------------------
  // 10. GROUP FRONTEND GENERATED SLOTS
  // -----------------------------------------------

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

  // -----------------------------------------------
  // 11. BOOKING TYPE HANDLERS
  // -----------------------------------------------

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

  // -----------------------------------------------
  // 12. CREATE BOOKING
  // -----------------------------------------------

  // const onContinue = async () => {
  //   if (!ground || !selectedSport || bookingLoading) {
  //     return;
  //   }

  //   if (!isDurationValid) {
  //     Alert.alert(
  //       'Invalid duration',
  //       'Selected duration is not available for this complex.',
  //     );
  //     return;
  //   }

  //   if (!selectedTime) {
  //     Alert.alert('Select a time', 'Please select an available start time.');
  //     return;
  //   }

  //   if (price <= 0) {
  //     Alert.alert(
  //       'Price not configured',
  //       'Please configure pricing for this sport.',
  //     );
  //     return;
  //   }

  //   try {
  //     setBookingLoading(true);

  //     /*
  //      * Backend re-validates the selected slot before creating
  //      * a booking. Frontend availability is only for UI.
  //      */

  //     const response: any = await apiRequest('/bookings', {
  //       method: 'POST',
  //       body: JSON.stringify({
  //         complexId: groundId,
  //         sportId,
  //         bookingDate: selectedDate,
  //         startTime: selectedTime.startTime,
  //         durationMinutes,
  //       }),
  //     });

  //     const booking = response?.data?.booking;

  //     if (!booking) {
  //       throw new Error('Booking could not be created');
  //     }

  //     Alert.alert(
  //       'Booking created',
  //       `Booking number: ${booking.bookingNumber || ''}`,
  //       [
  //         {
  //           text: 'Continue',
  //           onPress: () => {
  //             navigation.navigate('BookingSummary', {
  //               groundId,
  //               sportId,
  //               bookingDate: selectedDate,
  //               startTime: selectedTime.startTime,
  //               endTime: selectedTime.endTime,
  //               startMinutes: selectedTime.startMinutes,
  //               endMinutes: selectedTime.endMinutes,
  //               durationMinutes,
  //               price: booking.price?.totalAmount ?? price,
  //             });
  //           },
  //         },
  //       ],
  //     );
  //   } catch (err: any) {
  //     console.log('Booking creation error:', err);

  //     Alert.alert(
  //       'Booking failed',
  //       err?.message ||
  //         'This slot may have just been booked. Please refresh availability.',
  //       [
  //         {
  //           text: 'Refresh slots',
  //           onPress: fetchBookedSlots,
  //         },
  //         {
  //           text: 'OK',
  //           style: 'cancel',
  //         },
  //       ],
  //     );
  //   } finally {
  //     setBookingLoading(false);
  //   }
  // };

  // -----------------------------------------------
  // LOADING / ERROR
  // -----------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={P.bg} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={P.forest} />
          <Text style={styles.muted}>Loading venue details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !ground || !selectedSport) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

        <View style={styles.center}>
          <Text style={styles.title}>
            {error || 'Sport or venue not found'}
          </Text>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -----------------------------------------------
  // UI
  // -----------------------------------------------

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
          {selectedSport.image || ground.image ? (
            <Image
              source={{
                uri: selectedSport.image || ground.image,
              }}
              style={styles.image}
            />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Text style={{ fontSize: 32 }}>{selectedSport.icon || '🏅'}</Text>
            </View>
          )}

          <View style={{ flex: 1, paddingLeft: 13 }}>
            <Text style={styles.sport}>
              {selectedSport.icon || '🏅'} {selectedSport.sportName}
            </Text>

            <Text style={styles.venueName}>{ground.name}</Text>

            <Text style={styles.venueMuted}>
              ⌖ {ground.location || 'Location unavailable'}
            </Text>

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
            unavailableRanges={ground.unavailableRanges || []}
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

        {/* Dynamic Price Details */}
        <View style={styles.customCard}>
          <Text style={styles.customTitle}>Hourly Price</Text>

          <View style={styles.customPriceRow}>
            <Text style={styles.customPriceLabel}>
              {selectedTime
                ? `Price for ${selectedTime.startTime} start`
                : 'Starting hourly price'}
            </Text>

            <Text style={styles.customTotal}>{money(hourlyPrice)} / hr</Text>
          </View>

          <Text style={styles.customSubtitle}>
            Price may vary depending on weekday, weekend and peak hours.
          </Text>
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

          {availabilityLoading ? (
            <ActivityIndicator
              color={P.forest}
              style={{ marginVertical: 20 }}
            />
          ) : bookedTimes.length === 0 ? (
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
          {formatHours(durationMinutes)} session
        </Text>

        {availabilityLoading ? (
          <ActivityIndicator color={P.forest} style={{ marginVertical: 25 }} />
        ) : !isDurationValid ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Duration not available</Text>

            <Text style={styles.muted}>
              This complex does not have enough operating hours for this booking
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
            !selectedTime ||
            availabilityLoading ||
            bookingLoading ||
            price <= 0 ||
            !isDurationValid
          }
          onPress={handleContinue}
          style={[
            styles.continue,
            (!selectedTime ||
              availabilityLoading ||
              bookingLoading ||
              price <= 0 ||
              !isDurationValid) && { opacity: 0.45 },
          ]}
        >
          {bookingLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueText}>Continue →</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SlotBookingScreen;

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

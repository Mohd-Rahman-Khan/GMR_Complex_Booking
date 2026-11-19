import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminStack';
import { useBookings } from '../../context/BookingContext';
import { Booking } from '../../types/booking';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminBookings'>;

type Filter = 'all' | 'confirmed' | 'cancelled';

const C = {
  bg: '#F4F7F4',
  white: '#FFFFFF',
  green: '#14532D',
  greenLight: '#DCFCE7',
  text: '#17251B',
  muted: '#718078',
  border: '#E4EBE5',
  red: '#DC2626',
  redLight: '#FEE2E2',
  amber: '#B45309',
  amberLight: '#FEF3C7',
};

const money = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const formatDate = (date: string) => {
  if (!date) return '-';

  const [year, month, day] = date.split('-').map(Number);

  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const StatusBadge = ({ status }: { status: string }) => {
  const isCancelled = status === 'cancelled';

  return (
    <View
      style={{
        backgroundColor: isCancelled ? C.redLight : C.greenLight,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '900',
          color: isCancelled ? C.red : C.green,
          textTransform: 'uppercase',
        }}
      >
        {status}
      </Text>
    </View>
  );
};

export default function AdminBookingsScreen({ route }: Props) {
  const { bookings, loading } = useBookings();

  const [filter, setFilter] = useState<Filter>('all');

  const filteredBookings = useMemo(() => {
    const result = bookings.filter((item: Booking) => {
      if (filter === 'confirmed') return item.status === 'confirmed';
      if (filter === 'cancelled') return item.status === 'cancelled';
      return true;
    });

    return [...result].sort((a, b) => {
      const dateCompare = b.bookingDate.localeCompare(a.bookingDate);

      if (dateCompare !== 0) return dateCompare;

      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [bookings, filter]);

  const stats = useMemo(() => {
    const confirmed = bookings.filter(item => item.status === 'confirmed');

    const cancelled = bookings.filter(item => item.status === 'cancelled');

    return {
      total: bookings.length,
      confirmed: confirmed.length,
      cancelled: cancelled.length,
      revenue: confirmed.reduce(
        (total, item) => total + Number(item.amount || 0),
        0,
      ),
    };
  }, [bookings]);

  const renderStat = (
    title: string,
    value: string | number,
    color = C.green,
  ) => (
    <View
      style={{
        flex: 1,
        backgroundColor: C.white,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      <Text style={{ color: C.muted, fontSize: 11, fontWeight: '700' }}>
        {title}
      </Text>
      <Text
        style={{
          color,
          fontSize: 20,
          fontWeight: '900',
          marginTop: 7,
        }}
      >
        {value}
      </Text>
    </View>
  );

  const renderBooking = (item: Booking) => (
    <View
      key={item.id}
      style={{
        backgroundColor: C.white,
        borderRadius: 16,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text
            style={{
              color: C.text,
              fontSize: 14,
              fontWeight: '900',
            }}
          >
            {item.groundName}
          </Text>

          <Text
            style={{
              color: C.muted,
              fontSize: 11,
              marginTop: 4,
            }}
          >
            {item.bookingNumber || item.id}
          </Text>
        </View>

        <StatusBadge status={item.status} />
      </View>

      <View
        style={{
          backgroundColor: '#F7FAF7',
          borderRadius: 11,
          padding: 12,
          marginTop: 14,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: C.muted, fontSize: 11 }}>Sport</Text>
          <Text style={{ color: C.text, fontSize: 12, fontWeight: '800' }}>
            {item.sportName}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 10,
          }}
        >
          <Text style={{ color: C.muted, fontSize: 11 }}>Booking Date</Text>
          <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>
            {formatDate(item.bookingDate)}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 10,
          }}
        >
          <Text style={{ color: C.muted, fontSize: 11 }}>Time</Text>
          <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>
            {item.startTime} - {item.endTime}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 10,
          }}
        >
          <Text style={{ color: C.muted, fontSize: 11 }}>Duration</Text>
          <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>
            {item.duration} {item.duration === 1 ? 'Hour' : 'Hours'}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 14,
        }}
      >
        <Text style={{ color: C.muted, fontSize: 11 }}>Booking Amount</Text>

        <Text
          style={{
            color: C.green,
            fontSize: 18,
            fontWeight: '900',
          }}
        >
          {money(item.amount)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.green} />

      <View
        style={{
          backgroundColor: C.green,
          paddingTop: 45,
          paddingHorizontal: 20,
          paddingBottom: 22,
        }}
      >
        <Text style={{ color: C.white, fontSize: 21, fontWeight: '900' }}>
          Complex Bookings
        </Text>

        <Text style={{ color: '#D1FAE5', fontSize: 11, marginTop: 5 }}>
          Complex ID: {route.params.complexId}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 35 }}
      >
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {renderStat('Total Bookings', stats.total)}
          {renderStat('Confirmed', stats.confirmed, C.green)}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          {renderStat('Cancelled', stats.cancelled, C.red)}
          {renderStat('Confirmed Revenue', money(stats.revenue), C.green)}
        </View>

        <Text
          style={{
            color: C.text,
            fontSize: 16,
            fontWeight: '900',
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          Booking History
        </Text>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: C.white,
            borderRadius: 12,
            padding: 5,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          {(['all', 'confirmed', 'cancelled'] as Filter[]).map(value => {
            const selected = filter === value;

            return (
              <TouchableOpacity
                key={value}
                onPress={() => setFilter(value)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderRadius: 9,
                  backgroundColor: selected ? C.green : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: selected ? C.white : C.muted,
                    fontSize: 11,
                    fontWeight: '800',
                    textTransform: 'capitalize',
                  }}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={C.green}
            style={{ marginTop: 40 }}
          />
        ) : filteredBookings.length === 0 ? (
          <View
            style={{
              backgroundColor: C.white,
              borderRadius: 16,
              padding: 28,
              alignItems: 'center',
              marginTop: 18,
            }}
          >
            <Text style={{ fontSize: 32 }}>📋</Text>
            <Text
              style={{
                color: C.text,
                fontSize: 15,
                fontWeight: '900',
                marginTop: 12,
              }}
            >
              No bookings found
            </Text>
            <Text
              style={{
                color: C.muted,
                fontSize: 12,
                marginTop: 5,
                textAlign: 'center',
              }}
            >
              Bookings will appear here once customers make reservations.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            {filteredBookings.map(renderBooking)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

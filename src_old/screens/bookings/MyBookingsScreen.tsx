import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';

import ScreenWrapper from '../../components/ScreenWrapper';
import AppText from '../../components/AppText';
import AppButton from '../../components/AppButton';
import { useBookings } from '../../context/BookingContext';
import { Booking } from '../../types/booking';
import { Colors } from '../../theme';

type Filter = 'upcoming' | 'past' | 'cancelled';

const UI = {
  background: '#F5F8F5',
  surface: '#FFFFFF',
  text: '#17271D',
  muted: '#7C8A80',
  green: '#176B3A',
  greenLight: '#EAF5ED',
  lime: '#C5F477',
  border: '#E5ECE6',
  orange: '#F4A340',
  red: '#D94848',
};

const getToday = () => {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const formatDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const MyBookingsScreen = () => {
  const { bookings, loading, cancelBooking } = useBookings();
  const [filter, setFilter] = useState<Filter>('upcoming');

  const today = getToday();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isUpcomingBooking = (item: Booking) =>
    item.status === 'confirmed' &&
    (item.bookingDate > today ||
      (item.bookingDate === today && item.endMinutes > currentMinutes));

  const filteredBookings = useMemo(() => {
    const result = bookings.filter(item => {
      if (filter === 'cancelled') return item.status === 'cancelled';
      if (item.status !== 'confirmed') return false;

      const upcoming =
        item.bookingDate > today ||
        (item.bookingDate === today && item.endMinutes > currentMinutes);

      return filter === 'upcoming' ? upcoming : !upcoming;
    });

    return result.sort((a, b) => {
      const dateCompare = a.bookingDate.localeCompare(b.bookingDate);
      if (filter !== 'upcoming') return -dateCompare;
      return dateCompare;
    });
  }, [bookings, filter, today, currentMinutes]);

  const counts = useMemo(
    () => ({
      upcoming: bookings.filter(isUpcomingBooking).length,
      past: bookings.filter(item => {
        if (item.status !== 'confirmed') return false;
        return (
          item.bookingDate < today ||
          (item.bookingDate === today && item.endMinutes <= currentMinutes)
        );
      }).length,
      cancelled: bookings.filter(item => item.status === 'cancelled').length,
    }),
    [bookings, today, currentMinutes],
  );

  const handleCancel = (item: Booking) => {
    Alert.alert(
      'Cancel booking?',
      `Are you sure you want to cancel your booking at ${item.groundName}?`,
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking(item.id);
              Alert.alert(
                'Booking cancelled',
                'Your booking has been cancelled successfully.',
              );
            } catch {
              Alert.alert('Unable to cancel', 'Please try again in a moment.');
            }
          },
        },
      ],
    );
  };

  const tabs: { key: Filter; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const renderBooking = (item: Booking) => {
    const isCancelled = item.status === 'cancelled';
    const canCancel =
      !isCancelled &&
      (item.bookingDate > today ||
        (item.bookingDate === today && item.startMinutes > currentMinutes));

    return (
      <View key={item.id} style={styles.bookingCard}>
        <View style={styles.cardAccent} />

        <View style={styles.cardContent}>
          <View style={styles.cardTopLine}>
            <View style={styles.sportPill}>
              <AppText style={styles.sportPillText}>
                {item.sportName.toUpperCase()}
              </AppText>
            </View>

            <View
              style={[styles.statusPill, isCancelled && styles.cancelledPill]}
            >
              <View
                style={[styles.statusDot, isCancelled && styles.cancelledDot]}
              />
              <AppText
                style={[styles.statusText, isCancelled && styles.cancelledText]}
              >
                {isCancelled ? 'CANCELLED' : 'CONFIRMED'}
              </AppText>
            </View>
          </View>

          <AppText variant="h3" style={styles.groundName} numberOfLines={2}>
            {item.groundName}
          </AppText>

          <View style={styles.detailsPanel}>
            <View style={styles.detailItem}>
              <View style={styles.detailIconBox}>
                <AppText style={styles.detailEmoji}>📅</AppText>
              </View>
              <View style={styles.detailCopy}>
                <AppText style={styles.detailLabel}>DATE</AppText>
                <AppText style={styles.detailValue} numberOfLines={1}>
                  {formatDate(item.bookingDate)}
                </AppText>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailItem}>
              <View style={styles.detailIconBox}>
                <AppText style={styles.detailEmoji}>🕒</AppText>
              </View>
              <View style={styles.detailCopy}>
                <AppText style={styles.detailLabel}>TIME</AppText>
                <AppText style={styles.detailValue} numberOfLines={1}>
                  {item.startTime} - {item.endTime}
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <AppText style={styles.amountLabel}>TOTAL AMOUNT</AppText>
              <View style={styles.amountRow}>
                <AppText style={styles.rupee}>₹</AppText>
                <AppText style={styles.amount}>
                  {item.amount.toLocaleString('en-IN')}
                </AppText>
              </View>
            </View>

            {canCancel ? (
              <AppButton
                title="Cancel booking"
                variant="outline"
                onPress={() => handleCancel(item)}
                style={styles.cancelButton}
              />
            ) : (
              <View style={styles.durationPill}>
                <AppText style={styles.durationText}>
                  ◷ {item.duration} hr
                </AppText>
              </View>
            )}
          </View>

          <View style={styles.bookingIdRow}>
            <AppText style={styles.bookingId} numberOfLines={1}>
              BOOKING ID · {item.bookingNumber}
            </AppText>
            <AppText style={styles.bookingId}>
              #{item.id.slice(-5).toUpperCase()}
            </AppText>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={UI.green} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Compact page header */}
        <View style={styles.hero}>
          <View style={styles.heroDecoration} />
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <AppText style={styles.eyebrow}>YOUR PLAY SCHEDULE</AppText>
              <AppText style={styles.heroTitle}>My Bookings</AppText>
              <AppText style={styles.heroSubtitle}>
                Every game, planned in one place.
              </AppText>
            </View>
            <View style={styles.heroIcon}>
              <AppText style={styles.heroEmoji}>🏆</AppText>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <AppText style={styles.statNumber}>{counts.upcoming}</AppText>
              <AppText style={styles.statLabel}>UPCOMING</AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <AppText style={styles.statNumber}>{counts.past}</AppText>
              <AppText style={styles.statLabel}>COMPLETED</AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <AppText style={styles.statNumber}>{counts.cancelled}</AppText>
              <AppText style={styles.statLabel}>CANCELLED</AppText>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <AppText style={styles.sectionKicker}>BOOKING HISTORY</AppText>
            <AppText variant="h3" style={styles.sectionTitle}>
              Your activity
            </AppText>
            <AppText style={styles.sectionSubtitle}>
              Manage and track your ground reservations
            </AppText>
          </View>
          <View style={styles.totalBadge}>
            <AppText style={styles.totalBadgeText}>
              {bookings.length} TOTAL
            </AppText>
          </View>
        </View>

        {/* Filter tabs */}
        <View style={styles.tabs}>
          {tabs.map(tab => {
            const active = filter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                onPress={() => setFilter(tab.key)}
                style={[styles.tab, active && styles.activeTab]}
              >
                <AppText
                  style={[styles.tabText, active && styles.activeTabText]}
                >
                  {tab.label}
                </AppText>
                <View
                  style={[styles.countBadge, active && styles.activeCountBadge]}
                >
                  <AppText
                    style={[styles.countText, active && styles.activeCountText]}
                  >
                    {counts[tab.key]}
                  </AppText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <AppText style={styles.emptyEmoji}>⏳</AppText>
            </View>
            <AppText variant="h3" style={styles.emptyTitle}>
              Loading your bookings
            </AppText>
            <AppText style={styles.emptyDescription}>
              Just a moment, we’re getting things ready.
            </AppText>
          </View>
        ) : filteredBookings.length > 0 ? (
          <View style={styles.bookingList}>
            {filteredBookings.map(renderBooking)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <AppText style={styles.emptyEmoji}>
                {filter === 'upcoming' ? '🏟️' : filter === 'past' ? '🎾' : '📋'}
              </AppText>
            </View>
            <AppText variant="h3" style={styles.emptyTitle}>
              {filter === 'upcoming'
                ? 'No upcoming games'
                : filter === 'past'
                ? 'No completed games yet'
                : 'No cancelled bookings'}
            </AppText>
            <AppText style={styles.emptyDescription}>
              {filter === 'upcoming'
                ? 'Your next game is waiting. Explore grounds and book your favourite slot.'
                : 'Your booking activity will appear here.'}
            </AppText>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: UI.background,
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: UI.green,
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
    marginBottom: 27,
    overflow: 'hidden',
  },
  heroDecoration: {
    position: 'absolute',
    width: 175,
    height: 175,
    borderRadius: 88,
    right: -62,
    top: -75,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    color: '#C9E6D3',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 7,
  },
  heroTitle: {
    color: UI.surface,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    color: '#E0F0E5',
    fontSize: 12,
    marginTop: 6,
  },
  heroIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  heroEmoji: {
    fontSize: 26,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: UI.surface,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: '#C9E6D3',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 31,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionKicker: {
    color: UI.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  sectionTitle: {
    color: UI.text,
    fontSize: 20,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: UI.muted,
    fontSize: 11,
    marginTop: 4,
  },
  totalBadge: {
    backgroundColor: UI.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },
  totalBadgeText: {
    color: UI.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    backgroundColor: UI.surface,
    borderWidth: 1,
    borderColor: UI.border,
    marginBottom: 17,
    gap: 3,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 3,
  },
  activeTab: {
    backgroundColor: UI.green,
  },
  tabText: {
    color: UI.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  activeTabText: {
    color: UI.surface,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#F0F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countText: {
    color: UI.muted,
    fontSize: 9,
    fontWeight: '900',
  },
  activeCountText: {
    color: UI.surface,
  },
  bookingList: {
    gap: 13,
  },
  bookingCard: {
    backgroundColor: UI.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: UI.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardAccent: {
    width: 4,
    backgroundColor: UI.green,
  },
  cardContent: {
    flex: 1,
    padding: 15,
    gap: 12,
  },
  cardTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sportPill: {
    backgroundColor: UI.greenLight,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },
  sportPillText: {
    color: UI.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF8EF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cancelledPill: {
    backgroundColor: '#FFF0F0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  cancelledDot: {
    backgroundColor: UI.red,
  },
  statusText: {
    color: '#15803D',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  cancelledText: {
    color: UI.red,
  },
  groundName: {
    color: UI.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: -2,
  },
  detailsPanel: {
    flexDirection: 'row',
    backgroundColor: '#F6F9F6',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 9,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  detailIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: UI.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailEmoji: {
    fontSize: 14,
  },
  detailCopy: {
    flex: 1,
  },
  detailLabel: {
    color: UI.muted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 3,
  },
  detailValue: {
    color: UI.text,
    fontSize: 9,
    fontWeight: '800',
  },
  detailDivider: {
    width: 1,
    backgroundColor: UI.border,
    marginHorizontal: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel: {
    color: UI.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  rupee: {
    color: UI.green,
    fontSize: 14,
    fontWeight: '900',
    marginRight: 2,
  },
  amount: {
    color: UI.green,
    fontSize: 22,
    fontWeight: '900',
  },
  cancelButton: {
    width: 138,
    height: 39,
  },
  durationPill: {
    backgroundColor: '#F0F4F0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
  },
  durationText: {
    color: UI.muted,
    fontSize: 9,
    fontWeight: '800',
  },
  bookingIdRow: {
    borderTopWidth: 1,
    borderTopColor: UI.border,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  bookingId: {
    color: UI.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  emptyState: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 35,
    backgroundColor: UI.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: UI.border,
  },
  emptyIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 23,
    backgroundColor: UI.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  emptyEmoji: {
    fontSize: 31,
  },
  emptyTitle: {
    color: UI.text,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyDescription: {
    color: UI.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
});

export default MyBookingsScreen;

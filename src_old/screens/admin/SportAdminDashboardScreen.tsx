import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminStack';
import { useAdmin } from '../../context/AdminContext';

type Props = NativeStackScreenProps<AdminStackParamList, 'SportAdminDashboard'>;

const staticBookings = [
  {
    id: 'BK001',
    bookingNumber: 'SA-2026-001',
    customerName: 'Rahul Sharma',
    sportName: 'Cricket',
    groundName: 'Ground 1',
    bookingDate: '16 Nov 2026',
    startTime: '06:00 PM',
    endTime: '07:00 PM',
    duration: '1 Hour',
    amount: 1200,
    status: 'confirmed',
  },
  {
    id: 'BK002',
    bookingNumber: 'SA-2026-002',
    customerName: 'Amit Verma',
    sportName: 'Football',
    groundName: 'Ground 2',
    bookingDate: '17 Nov 2026',
    startTime: '07:00 AM',
    endTime: '08:00 AM',
    duration: '1 Hour',
    amount: 1500,
    status: 'pending',
  },
  {
    id: 'BK003',
    bookingNumber: 'SA-2026-003',
    customerName: 'Vikas Kumar',
    sportName: 'Cricket',
    groundName: 'Ground 1',
    bookingDate: '18 Nov 2026',
    startTime: '05:00 PM',
    endTime: '07:00 PM',
    duration: '2 Hours',
    amount: 2400,
    status: 'confirmed',
  },
  {
    id: 'BK004',
    bookingNumber: 'SA-2026-004',
    customerName: 'Sahil Khan',
    sportName: 'Badminton',
    groundName: 'Court 1',
    bookingDate: '19 Nov 2026',
    startTime: '08:00 AM',
    endTime: '09:00 AM',
    duration: '1 Hour',
    amount: 500,
    status: 'cancelled',
  },
];

export default function SportAdminDashboardScreen({ route }: Props) {
  const { admins, complexes, loading } = useAdmin();

  const admin = admins.find(a => a.id === route.params.adminId);

  const complex = complexes.find(c => c.id === admin?.complexId);

  const assignedSports =
    complex?.sports.filter(sport => {
      const isPrimaryAdmin = sport.primarySubAdminId === admin?.id;

      const isAdditionalStaff = sport.additionalStaffIds?.includes(
        admin?.id ?? '',
      );

      const isAssignedInAdmin = admin?.assignedSportIds?.includes(
        sport.sportId,
      );

      return isPrimaryAdmin || isAdditionalStaff || isAssignedInAdmin;
    }) || [];

  // Show all static bookings without any filter
  const bookings = staticBookings;

  const confirmedBookings = bookings.filter(
    item => item.status === 'confirmed',
  );

  const pendingBookings = bookings.filter(item => item.status === 'pending');

  const totalRevenue = confirmedBookings.reduce(
    (total, item) => total + item.amount,
    0,
  );

  const formatAmount = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  if (!admin || !complex) {
    return (
      <View style={styles.center}>
        <Text>Admin or complex not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.adminName}>{admin.name}</Text>
          <Text style={styles.complexName}>{complex.name}</Text>
        </View>

        <View style={styles.profileIcon}>
          <Text style={styles.profileText}>
            {admin.name?.charAt(0)?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Assigned Sports */}
      <Text style={styles.sectionTitle}>My Assigned Sports</Text>

      <View style={styles.sportsContainer}>
        {assignedSports.length > 0 ? (
          assignedSports.map(sport => (
            <View key={sport.sportId} style={styles.sportCard}>
              <Text style={styles.sportIcon}>{sport.icon || '🏆'}</Text>
              <Text style={styles.sportName}>{sport.sportName}</Text>
              <Text style={styles.sportPrice}>
                {formatAmount(sport.pricePerHour)}/hr
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No sports assigned yet.</Text>
        )}
      </View>

      {/* Booking Statistics */}
      <Text style={styles.sectionTitle}>Booking Overview</Text>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Bookings"
          value={bookings.length.toString()}
          icon="📅"
        />
        <StatCard
          title="Confirmed"
          value={confirmedBookings.length.toString()}
          icon="✅"
        />
        <StatCard
          title="Pending"
          value={pendingBookings.length.toString()}
          icon="⏳"
        />
        <StatCard
          title="Revenue"
          value={formatAmount(totalRevenue)}
          icon="💰"
        />
      </View>

      {/* Booking List */}
      <View style={styles.bookingHeader}>
        <Text style={styles.sectionTitle}>Recent Bookings</Text>
        <Text style={styles.bookingCount}>{bookings.length} Bookings</Text>
      </View>

      {bookings.length > 0 ? (
        bookings.map(booking => (
          <View key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingTop}>
              <View>
                <Text style={styles.bookingNumber}>
                  {booking.bookingNumber}
                </Text>
                <Text style={styles.customerName}>{booking.customerName}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  booking.status === 'confirmed'
                    ? styles.confirmedBadge
                    : booking.status === 'pending'
                    ? styles.pendingBadge
                    : styles.cancelledBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    booking.status === 'confirmed'
                      ? styles.confirmedText
                      : booking.status === 'pending'
                      ? styles.pendingText
                      : styles.cancelledText,
                  ]}
                >
                  {booking.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.bookingInfoRow}>
              <Text style={styles.infoLabel}>Sport</Text>
              <Text style={styles.infoValue}>{booking.sportName}</Text>
            </View>

            <View style={styles.bookingInfoRow}>
              <Text style={styles.infoLabel}>Ground</Text>
              <Text style={styles.infoValue}>{booking.groundName}</Text>
            </View>

            <View style={styles.bookingInfoRow}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{booking.bookingDate}</Text>
            </View>

            <View style={styles.bookingInfoRow}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>
                {booking.startTime} - {booking.endTime}
              </Text>
            </View>

            <View style={styles.bookingInfoRow}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{booking.duration}</Text>
            </View>

            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Booking Amount</Text>
              <Text style={styles.amount}>{formatAmount(booking.amount)}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No Bookings Found</Text>
          <Text style={styles.emptyText}>
            No bookings are available for your assigned sports.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8F4',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8F4',
  },
  header: {
    backgroundColor: '#176B45',
    padding: 20,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcome: {
    color: '#D5EBDD',
    fontSize: 13,
  },
  adminName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  complexName: {
    color: '#D5EBDD',
    fontSize: 13,
    marginTop: 5,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C7F36B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: '#176B45',
    fontSize: 21,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#183B2B',
    marginBottom: 14,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  sportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5EEE7',
  },
  sportIcon: {
    fontSize: 25,
    marginBottom: 8,
  },
  sportName: {
    color: '#183B2B',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sportPrice: {
    color: '#176B45',
    fontSize: 13,
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5EEE7',
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  statValue: {
    color: '#176B45',
    fontSize: 21,
    fontWeight: 'bold',
  },
  statTitle: {
    color: '#718078',
    fontSize: 12,
    marginTop: 5,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingCount: {
    color: '#718078',
    fontSize: 12,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#E5EEE7',
  },
  bookingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingNumber: {
    color: '#176B45',
    fontSize: 12,
    fontWeight: 'bold',
  },
  customerName: {
    color: '#183B2B',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confirmedBadge: {
    backgroundColor: '#E2F6E9',
  },
  pendingBadge: {
    backgroundColor: '#FFF3D6',
  },
  cancelledBadge: {
    backgroundColor: '#FDE7E7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  confirmedText: {
    color: '#188044',
  },
  pendingText: {
    color: '#A66A00',
  },
  cancelledText: {
    color: '#C03939',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF1ED',
    marginVertical: 13,
  },
  bookingInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  infoLabel: {
    color: '#718078',
    fontSize: 13,
  },
  infoValue: {
    color: '#263D30',
    fontSize: 13,
    fontWeight: '600',
  },
  amountRow: {
    borderTopWidth: 1,
    borderTopColor: '#EDF1ED',
    paddingTop: 12,
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountLabel: {
    color: '#183B2B',
    fontWeight: '600',
    fontSize: 13,
  },
  amount: {
    color: '#176B45',
    fontSize: 17,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 35,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#183B2B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    color: '#718078',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 7,
  },
  footer: {
    color: '#8A968E',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 15,
  },
});

import React from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAdmin } from '../../context/AdminContext';
import { AdminStackParamList } from '../../navigation/AdminStack';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminDashboard'>;
const C = {
  green: '#14532D',
  bg: '#F4F7F4',
  text: '#17251B',
  muted: '#718078',
  border: '#E4EBE5',
};

export default function AdminDashboardScreen({ route, navigation }: Props) {
  const { complexes, admins, loading, toggleComplex } = useAdmin();
  const complex = complexes.find(
    c => c.id === route.params.complexId && c.adminId === route.params.adminId,
  );
  if (loading)
    return (
      <View style={S.center}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  if (!complex)
    return (
      <View style={S.center}>
        <Text style={S.title}>Complex access unavailable</Text>
      </View>
    );

  const team = admins.filter(
    a => a.complexId === complex.id && a.role === 'sport_admin',
  );
  const open = (
    screen: keyof AdminStackParamList,
    params: any = { complexId: complex.id },
  ) => navigation.navigate(screen as any, params);

  const menu = [
    {
      icon: '🏟️',
      title: 'Sport Complex',
      subtitle: 'Details, contact information and status',
      count: 'Edit',
      action: () => open('ComplexDetails'),
    },
    {
      icon: '🏅',
      title: 'Sports',
      subtitle: 'Sports and hourly prices',
      count: `${complex.sports.length} sports`,
      action: () => open('SportsManagement'),
    },
    {
      icon: '👥',
      title: 'Subadmin Team',
      subtitle: 'Create accounts and assign one admin per sport',
      count: `${team.length} members`,
      action: () => open('SubadminManagement'),
    },
    {
      icon: '📅',
      title: 'Bookings',
      subtitle: 'Complex booking management',
      count: 'View',
      action: () => open('AdminBookings'),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.green} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.hero}>
          <Text style={S.eyebrow}> • COMPLEX ADMIN</Text>
          <View style={S.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={S.heroTitle}>SPORTSARENA</Text>
              <Text style={S.heroSub}>Welcome back, {complex.ownerName}</Text>
            </View>
            <View style={S.avatar}>
              <Text style={S.avatarText}>
                {complex.ownerName?.[0]?.toUpperCase() || 'A'}
              </Text>
            </View>
          </View>
          <View style={S.statusRow}>
            <View
              style={[
                S.dot,
                { backgroundColor: complex.isActive ? '#A3E635' : '#FCA5A5' },
              ]}
            />
            <Text style={S.statusText}>
              {complex.isActive ? 'Complex active' : 'Complex inactive'}
            </Text>
            <TouchableOpacity onPress={() => toggleComplex(complex.id)}>
              <Text style={S.statusAction}>
                {complex.isActive ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={S.body}>
          <Text style={S.section}>Overview</Text>
          <View style={S.stats}>
            {[
              [String(complex.sports.length), 'Sports'],
              [String(team.length), 'Subadmins'],
              [String('5'), 'Bookings'],
              [String('₹6,200'), 'Total Revenue'],
            ].map(([v, l]) => (
              <View key={l} style={S.stat}>
                <Text style={S.statValue}>{v}</Text>
                <Text style={S.statLabel}>{l}</Text>
              </View>
            ))}
          </View>
          <Text style={S.section}>Manage your complex</Text>
          {menu.map(item => (
            <TouchableOpacity
              key={item.title}
              style={S.menu}
              activeOpacity={0.8}
              onPress={item.action}
            >
              <View style={S.menuIcon}>
                <Text style={{ fontSize: 23 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.menuTitle}>{item.title}</Text>
                <Text style={S.menuSub}>{item.subtitle}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={S.menuCount}>{item.count}</Text>
                <Text style={S.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
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
    backgroundColor: C.bg,
  },
  hero: {
    backgroundColor: C.green,
    paddingTop: PlatformOS(),
    paddingHorizontal: 22,
    paddingBottom: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  eyebrow: {
    color: '#BBF7D0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  heroTitle: { color: '#FFF', fontSize: 27, fontWeight: '900' },
  heroSub: { color: '#D1FAE5', fontSize: 13, marginTop: 5 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#D9F99D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '900', color: C.green },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ffffff25',
    marginTop: 18,
    paddingTop: 13,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { color: '#E5F5E9', fontSize: 12, flex: 1 },
  statusAction: { color: '#D9F99D', fontSize: 12, fontWeight: '900' },
  body: { padding: 18 },
  section: {
    fontSize: 18,
    fontWeight: '900',
    color: C.text,
    marginTop: 8,
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stat: {
    width: '48.5%',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  statValue: { fontSize: 25, fontWeight: '900', color: C.text },
  statLabel: { fontSize: 11, color: C.muted, marginTop: 3 },
  menu: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF7EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTitle: { fontSize: 14, fontWeight: '900', color: C.text },
  menuSub: { fontSize: 10, color: C.muted, marginTop: 4, lineHeight: 15 },
  menuCount: { fontSize: 10, fontWeight: '800', color: '#166534' },
  chevron: { fontSize: 25, color: C.muted, marginTop: 1 },
  note: {
    backgroundColor: '#EAF4EB',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  noteTitle: { color: C.green, fontSize: 12, fontWeight: '900' },
  noteText: { color: '#5D6D61', fontSize: 11, lineHeight: 17, marginTop: 5 },
};
function PlatformOS() {
  return 44;
}

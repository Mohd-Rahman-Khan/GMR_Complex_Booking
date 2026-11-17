import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminStack';
import { useAdmin } from '../../context/AdminContext';
import { ui } from './adminUi';

type Props = NativeStackScreenProps<AdminStackParamList, 'SportAdmins'>;

export default function SportAdminsScreen({ route }: Props) {
  const { complexes, admins, saveAdmin, assignPrimarySubAdmin, toggleAdmin } = useAdmin();
  const complex = complexes.find(c => c.id === route.params.complexId);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  if (!complex) return <View style={ui.screen}><Text style={ui.sub}>Complex not found.</Text></View>;
  const complexAdmins = admins.filter(a => a.complexId === complex.id && a.role === 'sport_admin');

  const createAdmin = () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Required', 'Enter name, email and phone number.');
      return;
    }
    if (admins.some(a => a.email.toLowerCase() === email.trim().toLowerCase())) {
      Alert.alert('Already exists', 'This email is already registered. Use a unique email for each complex account.');
      return;
    }
    saveAdmin({
      name: name.trim(), email: email.trim(), phone: phone.trim(), password: '123456',
      role: 'sport_admin', complexId: complex.id, assignedSportIds: [], isActive: true,
    });
    setName(''); setEmail(''); setPhone('');
    Alert.alert('Subadmin created', 'Primary subadmin account created. Demo password: 123456');
  };

  const handleAssign = (sportId: string, currentAdminId: string | null, selectedAdminId: string | null) => {
    const result = assignPrimarySubAdmin(complex.id, sportId, selectedAdminId);
    if (!result.success) {
      Alert.alert('Assignment failed', result.message || 'Unable to assign this subadmin.');
      return;
    }
    if (currentAdminId && selectedAdminId && currentAdminId !== selectedAdminId) {
      Alert.alert('Primary subadmin changed', 'The previous primary subadmin has been unassigned from this sport.');
    }
  };

  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
      <Text style={ui.title}>Sport Subadmin Management</Text>
      <Text style={ui.sub}>{complex.name} • {complex.ownerName}</Text>
      <View style={[ui.card, { marginTop: 16 }]}>
        <Text style={ui.title}>Assignment rule</Text>
        <Text style={ui.sub}>Each sport can have exactly one primary subadmin. Assigning a new primary automatically replaces the previous one. Additional staff access can be added in a future update.</Text>
      </View>

      <Text style={ui.sectionTitle}>Create subadmin</Text>
      {[['Name', name, setName], ['Email', email, setEmail], ['Phone', phone, setPhone]].map(([label, value, setter]: any) => (
        <View key={label}><Text style={ui.label}>{label}</Text><TextInput value={value} onChangeText={setter} placeholder={label} placeholderTextColor="#9AA69D" style={ui.input} autoCapitalize={label === 'Email' ? 'none' : 'words'} /></View>
      ))}
      <TouchableOpacity style={[ui.button, { marginTop: 18 }]} onPress={createAdmin}><Text style={ui.buttonText}>Create Subadmin</Text></TouchableOpacity>

      <Text style={ui.sectionTitle}>Primary subadmin by sport</Text>
      {complex.sports.map(sport => {
        const assigned = complexAdmins.find(a => a.id === sport.primarySubAdminId);
        const candidates = complexAdmins.filter(a => a.isActive);
        return (
          <View key={sport.id} style={ui.card}>
            <Text style={ui.title}>{sport.icon} {sport.sportName}</Text>
            <Text style={ui.sub}>Primary: {assigned?.name || 'Not assigned'}</Text>
            {candidates.map(admin => (
              <TouchableOpacity key={admin.id}
                style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#EEF2EF', marginTop: 8 }}
                onPress={() => handleAssign(sport.sportId, sport.primarySubAdminId, sport.primarySubAdminId === admin.id ? null : admin.id)}>
                <Text style={{ color: sport.primarySubAdminId === admin.id ? '#15803D' : '#27352B', fontWeight: '700' }}>
                  {sport.primarySubAdminId === admin.id ? '✓ ' : '○ '}{admin.name} — {admin.email}
                </Text>
              </TouchableOpacity>
            ))}
            {assigned && <TouchableOpacity onPress={() => Alert.alert('Unassign primary?', `Remove ${assigned.name} from ${sport.sportName}?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Unassign', style: 'destructive', onPress: () => handleAssign(sport.sportId, assigned.id, null) },
            ])} style={{ marginTop: 8 }}><Text style={{ color: '#B45309', fontSize: 12, fontWeight: '700' }}>Remove primary assignment</Text></TouchableOpacity>}
          </View>
        );
      })}

      <Text style={ui.sectionTitle}>Subadmin accounts</Text>
      {complexAdmins.map(admin => (
        <View key={admin.id} style={ui.card}>
          <View style={ui.row}><Text style={ui.title}>{admin.name}</Text><View style={ui.pill}><Text style={ui.pillText}>{admin.isActive ? 'ACTIVE' : 'INACTIVE'}</Text></View></View>
          <Text style={ui.sub}>{admin.email}</Text>
          <Text style={ui.sub}>Primary sport: {admin.assignedSportIds.join(', ') || 'Not assigned'}</Text>
          <TouchableOpacity onPress={() => toggleAdmin(admin.id)} style={{ marginTop: 10 }}>
            <Text style={{ color: '#B45309', fontSize: 12, fontWeight: '700' }}>{admin.isActive ? 'Deactivate account' : 'Activate account'}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

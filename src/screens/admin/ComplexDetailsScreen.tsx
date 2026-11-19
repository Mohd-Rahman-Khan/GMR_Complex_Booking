import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAdmin } from '../../context/AdminContext';
import { AdminStackParamList } from '../../navigation/AdminStack';
type Props = NativeStackScreenProps<AdminStackParamList, 'ComplexDetails'>;
const G = '#14532D',
  BG = '#F4F7F4';
export default function ComplexDetailsScreen({ route, navigation }: Props) {
  const { complexes, updateComplex, toggleComplex } = useAdmin();
  const [peakStart, setPeakStart] = useState('17:00');
  const [peakEnd, setPeakEnd] = useState('21:00');
  const c = complexes.find(x => x.id === route.params.complexId);
  const [form, setForm] = useState({
    name: c?.name || '',
    ownerName: c?.ownerName || '',
    phone: c?.phone || '',
    email: c?.email || '',
    address: c?.address || '',
    city: c?.city || '',
    description: c?.description || '',
  });
  if (!c)
    return (
      <View style={S.center}>
        <Text>Complex not found</Text>
      </View>
    );
  const field = (
    label: keyof typeof form,
    keyboardType: any = 'default',
    multi = false,
  ) => (
    <View style={{ marginTop: 14 }}>
      <Text style={S.label}>
        {label === 'ownerName'
          ? 'Owner / Admin Name'
          : label[0].toUpperCase() + label.slice(1)}
      </Text>
      <TextInput
        value={form[label]}
        onChangeText={v => setForm(p => ({ ...p, [label]: v }))}
        keyboardType={keyboardType}
        multiline={multi}
        placeholder={`Enter ${label}`}
        placeholderTextColor="#9AA69D"
        style={[S.input, multi && { height: 85, textAlignVertical: 'top' }]}
      />
    </View>
  );
  const save = () => {
    if (
      !form.name.trim() ||
      !form.ownerName.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim()
    )
      return Alert.alert(
        'Required',
        'Name, owner, phone, address and city are required.',
      );
    updateComplex(c.id, { ...form, adminId: c.adminId });
    Alert.alert('Saved', 'Complex details updated.');
  };
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" backgroundColor={G} />
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={S.back}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={S.title}>Sport Complex</Text>
          <Text style={S.sub}>Update your venue information</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 35 }}>
        {field('name')}
        {field('ownerName')}
        {field('phone', 'phone-pad')}
        {field('email', 'email-address')}
        {field('address')}
        {field('city')}
        {field('description', 'default', true)}
        <Text style={[S.label, { marginTop: 10 }]}>Opening time (24-hour)</Text>
        <TextInput
          value={peakStart}
          onChangeText={setPeakStart}
          placeholder="17:00"
          style={S.input}
          autoCapitalize="none"
        />

        <Text style={[S.label, { marginTop: 10 }]}>Closing time (24-hour)</Text>
        <TextInput
          value={peakEnd}
          onChangeText={setPeakEnd}
          placeholder="21:00"
          style={S.input}
        />
        <TouchableOpacity style={S.button} onPress={save}>
          <Text style={S.buttonText}>Save Complex Details</Text>
        </TouchableOpacity>
        <View style={S.statusCard}>
          <View style={{ flex: 1 }}>
            <Text style={S.cardTitle}>Complex status</Text>
            <Text style={S.sub}>
              {c.isActive ? 'Currently active' : 'Currently inactive'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Change status',
                `Are you sure you want to ${
                  c.isActive ? 'deactivate' : 'activate'
                } this complex?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Confirm', onPress: () => toggleComplex(c.id) },
                ],
              )
            }
          >
            <Text style={{ color: G, fontWeight: '900' }}>
              {c.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
const S: any = {
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: G,
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  back: { color: '#FFF', fontSize: 34 },
  title: { color: '#FFF', fontSize: 21, fontWeight: '900' },
  sub: { color: '#718078', fontSize: 11, marginTop: 4 },
  label: { color: '#526157', fontSize: 11, fontWeight: '800', marginBottom: 6 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E4EBE5',
    borderRadius: 12,
    padding: 13,
    color: '#17251B',
  },
  button: {
    backgroundColor: G,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonText: { color: '#FFF', fontWeight: '900' },
  statusCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 14,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: { color: '#17251B', fontWeight: '900' },
};

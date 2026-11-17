import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminStack';
import { useAdmin } from '../../context/AdminContext';
import { ui } from './adminUi';

type Props = NativeStackScreenProps<AdminStackParamList, 'ComplexForm'>;
const fields = [
  ['name', 'Complex Name'], ['ownerName', 'Owner Name'], ['phone', 'Contact Number'],
  ['email', 'Email'], ['address', 'Address'], ['city', 'City'], ['description', 'Description'],
] as const;

export default function ComplexFormScreen({ route, navigation }: Props) {
  const { complexes, addComplex, updateComplex } = useAdmin();
  const existing = complexes.find(c => c.id === route.params?.complexId);
  const [form, setForm] = useState({ name: '', ownerName: '', phone: '', email: '', address: '', city: '', description: '' });
  useEffect(() => {
    if (existing) setForm({
      name: existing.name, ownerName: existing.ownerName, phone: existing.phone,
      email: existing.email, address: existing.address, city: existing.city, description: existing.description,
    });
  }, [existing?.id]);
  const set = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const save = () => {
    if (!form.name.trim() || !form.ownerName.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      Alert.alert('Missing details', 'Please fill complex name, owner, phone, address and city.');
      return;
    }
    if (existing) updateComplex(existing.id, form);
    else addComplex({ ...form, isActive: true });
    Alert.alert('Saved', 'Complex details saved on this device.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };
  return (
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
      <Text style={ui.title}>{existing ? 'Edit Complex' : 'Add New Complex'}</Text>
      <Text style={ui.sub}>Enter the venue information below.</Text>
      {fields.map(([key, label]) => (
        <View key={key}>
          <Text style={ui.label}>{label}</Text>
          <TextInput value={form[key]} onChangeText={v => set(key, v)} placeholder={label} placeholderTextColor="#9AA69D" style={ui.input} multiline={key === 'description'} />
        </View>
      ))}
      <TouchableOpacity style={[ui.button, { marginTop: 24 }]} onPress={save}><Text style={ui.buttonText}>Save Complex</Text></TouchableOpacity>
    </ScrollView>
  );
}

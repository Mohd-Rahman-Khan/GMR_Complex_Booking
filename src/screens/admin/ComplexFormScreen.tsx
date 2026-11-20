import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminStack';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { ui } from './adminUi';

type Props = NativeStackScreenProps<AdminStackParamList, 'ComplexForm'>;

type FormData = {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  description: string;
};

const initialForm: FormData = {
  name: '',
  ownerName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  description: '',
};

const fields = [
  ['name', 'Complex Name'],
  ['ownerName', 'Owner Name'],
  ['phone', 'Contact Number'],
  ['email', 'Email'],
  ['address', 'Address'],
  ['city', 'City'],
  ['description', 'Description'],
] as const;

export default function ComplexFormScreen({ route, navigation }: Props) {
  const { token, user } = useAuth();

  const complexId = route.params?.complexId;

  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!complexId || !token) return;

    let active = true;

    const loadComplex = async () => {
      try {
        setLoading(true);

        const response: any = await apiRequest(`/complexes/${complexId}`, {
          method: 'GET',
          token,
        });

        const data = response?.data?.complex ?? response?.data ?? response;
        const complex = data?.complex ?? data;

        if (!active || !complex) return;

        setForm({
          name: complex.name || '',
          ownerName: complex.ownerName || '',
          phone: complex.phone || '',
          email: complex.email || '',
          address: complex.address || '',
          city: complex.city || '',
          description: complex.description || '',
        });
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.message || 'Unable to load complex details.',
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadComplex();

    return () => {
      active = false;
    };
  }, [complexId, token]);

  const set = (key: keyof FormData, value: string) => {
    setForm(previous => ({
      ...previous,
      [key]: value,
    }));
  };

  const save = async () => {
    if (
      !form.name.trim() ||
      !form.ownerName.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim()
    ) {
      Alert.alert(
        'Missing Details',
        'Please fill complex name, owner, phone, address and city.',
      );
      return;
    }

    if (!token) {
      Alert.alert('Session Expired', 'Please login again.');
      return;
    }

    try {
      setSaving(true);

      await apiRequest(complexId ? `/complexes/${complexId}` : '/complexes', {
        method: complexId ? 'PUT' : 'POST',
        token,
        body: JSON.stringify(form),
      });

      Alert.alert(
        'Success',
        complexId
          ? 'Complex details updated successfully.'
          : 'Your complex has been created successfully.',
        [
          {
            text: 'Continue',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        'Save Failed',
        error.message || 'Unable to save complex details.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading complex details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={ui.screen}
      contentContainerStyle={ui.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={ui.title}>
        {complexId ? 'Edit Complex' : 'Create Your Complex'}
      </Text>

      <Text style={ui.sub}>Enter your sports complex information below.</Text>

      {fields.map(([key, label]) => (
        <View key={key}>
          <Text style={ui.label}>{label}</Text>

          <TextInput
            value={form[key]}
            onChangeText={value => set(key, value)}
            placeholder={label}
            placeholderTextColor="#9AA69D"
            style={ui.input}
            multiline={key === 'description'}
            keyboardType={key === 'phone' ? 'phone-pad' : 'default'}
            autoCapitalize={key === 'email' ? 'none' : 'sentences'}
          />
        </View>
      ))}

      <TouchableOpacity
        style={[
          ui.button,
          {
            marginTop: 24,
            opacity: saving ? 0.6 : 1,
          },
        ]}
        disabled={saving}
        onPress={save}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={ui.buttonText}>
            {complexId ? 'Update Complex' : 'Create Complex'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

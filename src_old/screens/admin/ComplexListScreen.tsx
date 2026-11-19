import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminStack';
import { useAdmin } from '../../context/AdminContext';
import { ui } from './adminUi';

type Props = NativeStackScreenProps<AdminStackParamList, 'ComplexList'>;

export default function ComplexListScreen({ route, navigation }: Props) {
  const { complexes } = useAdmin();
  const complex = complexes.find(c => c.id === route.params.complexId);
  if (!complex) return <View style={ui.screen}><Text style={ui.sub}>Complex not found or access denied.</Text></View>;
  return (
    <ScrollView style={ui.screen}>
      <View style={ui.header}><Text style={ui.headerTitle}>My Complex</Text><Text style={ui.headerSub}>Only your assigned complex is shown here</Text></View>
      <View style={ui.content}>
        <View style={ui.card}>
          <View style={ui.row}><Text style={ui.title}>{complex.name}</Text><View style={ui.pill}><Text style={ui.pillText}>{complex.isActive ? 'ACTIVE' : 'INACTIVE'}</Text></View></View>
          <Text style={ui.sub}>📍 {complex.address}, {complex.city}</Text>
          <Text style={ui.sub}>Owner: {complex.ownerName}</Text>
          <Text style={ui.sub}>Sports: {complex.sports.length}</Text>
          <TouchableOpacity style={[ui.secondaryButton, { marginTop: 14 }]} onPress={() => navigation.navigate('ComplexForm', { complexId: complex.id })}><Text style={ui.secondaryText}>Edit My Complex Details</Text></TouchableOpacity>
          <TouchableOpacity style={[ui.secondaryButton, { marginTop: 10 }]} onPress={() => navigation.navigate('SportsManagement', { complexId: complex.id })}><Text style={ui.secondaryText}>Manage My Sports</Text></TouchableOpacity>
          <TouchableOpacity style={[ui.secondaryButton, { marginTop: 10 }]} onPress={() => navigation.navigate('SportAdmins', { complexId: complex.id })}><Text style={ui.secondaryText}>Manage My Subadmins</Text></TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

import React from 'react';

import { View, StyleSheet } from 'react-native';

import AppText from './AppText';

const SlotLegend = () => {
  const items = [
    {
      color: '#16C784',
      label: 'Available',
    },
    {
      color: '#101828',
      label: 'Selected',
    },
    {
      color: '#CBD5E1',
      label: 'Booked',
    },
  ];

  return (
    <View style={styles.container}>
      {items.map(item => (
        <View key={item.label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />

          <AppText variant="caption">{item.label}</AppText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 18,
    marginVertical: 15,
    flexWrap: 'wrap',
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  dot: {
    width: 11,
    height: 11,
    borderRadius: 4,
  },
});

export default SlotLegend;
